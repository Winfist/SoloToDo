import React, { useState, useEffect } from "react";
import { NAV_ICONS } from "../data/icons.js";
import { getToday, getLocalDateKey, formatLocalDateTime } from "../data/dateUtils.js";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getStateLocale, translate } from "../data/i18n.js";
import { canFireNotification, getNotificationPreset, isEssentialCategory, computeInactivityComebackAt } from "../data/notificationPresets.js";

import { Capacitor } from '@capacitor/core';

const IS_CAPACITOR = Capacitor.isNativePlatform();

function nt(state, key, params = {}) {
    return translate(getStateLocale(state), key, params);
}

// ── Request Permission ───────────────────────────────────────
export async function requestNotificationPermission() {
    if (IS_CAPACITOR) {
        try {
            const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
            const result = await FirebaseMessaging.requestPermissions();
            return result.receive === 'granted' ? 'granted' : 'denied';
        } catch (e) {
            console.error('[SoloToDo] Failed to request native push permissions', e);
            return 'unsupported';
        }
    } else {
        if (!("Notification" in window)) return "unsupported";
        if (Notification.permission === "granted") return "granted";
        if (Notification.permission === "denied") return "denied";
        return await Notification.requestPermission();
    }
}

// ── Send Notification (cross-platform) ───────────────────────
async function sendNotification(title, body, tag = "solo-todo") {
    console.log(`[SoloToDo:Notif] Sending: "${title}" — ${body} (tag: ${tag})`);

    // Try Capacitor Local Notifications first (works on iOS/Android even in background)
    if (IS_CAPACITOR) {
        try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const { display } = await LocalNotifications.checkPermissions();
            if (display === 'granted') {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: Math.floor(Math.random() * 100000),
                        title,
                        body,
                        schedule: { at: new Date(Date.now() + 1000) }, // 1s from now = immediate
                        sound: "default",
                        smallIcon: "ic_notification",
                    }]
                });
                console.log('[SoloToDo:Notif] Sent via Capacitor Local Notifications');
                return;
            }
        } catch (e) {
            console.warn('[SoloToDo:Notif] Capacitor LocalNotif failed:', e);
        }
    }

    // Fallback: Web Notification API (desktop browsers)
    if ("Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, { body, icon: "/favicon.ico", tag, silent: false });
            console.log('[SoloToDo:Notif] Sent via Web Notification API');
        } catch (e) {
            console.warn('[SoloToDo:Notif] Web Notification failed:', e);
        }
    }
}

// ── Deduplication Guard (localStorage) ──
function wasAlertSentToday(tag) {
    try {
        const key = `sl_alert_${tag}`;
        const today = getToday();
        if (localStorage.getItem(key) === today) return true;
        localStorage.setItem(key, today);
    } catch { }
    return false;
}

const NOTIFICATION_COUNT_KEY = "sl_notif_nonessential_count";

function getNonEssentialNotificationCountToday(today = getToday()) {
    try {
        if (typeof localStorage === "undefined") return 0;
        const raw = localStorage.getItem(NOTIFICATION_COUNT_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        return parsed?.date === today && Number.isInteger(parsed.count) ? parsed.count : 0;
    } catch {
        return 0;
    }
}

function incrementNonEssentialNotificationCountToday(category, today = getToday()) {
    if (isEssentialCategory(category)) return;
    try {
        if (typeof localStorage === "undefined") return;
        const count = getNonEssentialNotificationCountToday(today) + 1;
        localStorage.setItem(NOTIFICATION_COUNT_KEY, JSON.stringify({ date: today, count }));
    } catch { }
}

// ── CHECK FUNCTIONS ──────────────────────────────────────────

// NEW: General daily activity reminder — fires at 11, 14, or 17 Uhr if nothing done today
function checkDailyActivity(state) {
    const hour = new Date().getHours();
    if (hour < 11 || hour > 21) return null;

    const today = getToday();
    const questsToday = (state?.completedQuests || []).filter(q => q.completedAt === today).length;
    const habitsToday = (state?.habits || []).filter(h => h.history?.[today]?.completed).length;

    if (questsToday > 0 || habitsToday > 0) return null;

    // Different messages based on time of day
    let msg;
    if (hour < 13) {
        msg = nt(state, "notifications.dailyMorning");
    } else if (hour < 17) {
        msg = nt(state, "notifications.dailyAfternoon");
    } else {
        msg = nt(state, "notifications.dailyEvening");
    }

    // Use hour-bucket tag so it can fire at 11, 14, and 17
    const bucket = hour < 13 ? "morning" : hour < 17 ? "afternoon" : "evening";
    return {
        title: nt(state, "notifications.dailyActivityTitle"),
        body: msg,
        tag: `daily-activity-${bucket}`,
        category: "daily_activity",
    };
}

function checkStreakProtection(state) {
    const streak = state?.streak || 0;
    if (streak < 3) return null;
    const hour = new Date().getHours();
    if (hour < 15 || hour > 23) return null; // Expanded: start at 15 Uhr
    const today = getToday();
    const questsToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
    const habitsToday = (state.habits || []).filter(h => h.history?.[today]?.completed).length;
    if (questsToday > 0 || habitsToday > 0) return null;
    const hoursLeft = 24 - hour;
    return {
        title: nt(state, "notifications.streakDangerTitle"),
        body: nt(state, "notifications.streakDangerBody", { streak, hours: hoursLeft }),
        tag: `streak-protection-${hour < 18 ? "early" : "late"}`,
        category: "streak_protection",
    };
}

function checkLateNightEnergy(state) {
    const hour = new Date().getHours();
    if (hour < 21 || hour > 23) return null;
    const quests = (state?.quests || []).filter(q => !q.completed && q.energy === "deep");
    if (quests.length === 0) return null;
    return {
        title: nt(state, "notifications.lateNightTitle"),
        body: nt(state, "notifications.lateNightBody", { title: quests[0].title }),
        tag: "late-night-energy",
        category: "late_night",
    };
}

function checkEmergencyQuest(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const expires = new Date(state.emergencyQuest.timeLimit);
    const hoursLeft = (expires.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft > 4 || hoursLeft < 0) return null; // Expanded: warn 4h before (was 2h)
    return {
        title: nt(state, "notifications.emergencyExpiringTitle"),
        body: nt(state, "notifications.emergencyExpiringBody", { title: state.emergencyQuest.title, minutes: Math.round(hoursLeft * 60) }),
        tag: "emergency-quest",
        category: "emergency_expiry",
    };
}

function checkEmergencyMorning(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const hour = new Date().getHours();
    if (hour < 8 || hour > 12) return null; // Expanded: 8-12 Uhr (was 9-10)
    return {
        title: nt(state, "notifications.emergencyMorningTitle"),
        body: nt(state, "notifications.emergencyMorningBody", { title: state.emergencyQuest.title }),
        tag: "emergency-morning",
        category: "emergency_morning",
    };
}

function checkHabitNudge(state) {
    const habits = state?.habits || [];
    if (habits.length === 0) return null;
    const hour = new Date().getHours();
    if (hour < 18) return null; // Expanded: 18 Uhr (was 20)
    const today = getToday();
    const unfinished = habits.filter(h => h.active && !h.history?.[today]?.completed).length;
    if (unfinished === 0) return null;
    return {
        title: nt(state, "notifications.habitOpenTitle"),
        body: nt(state, "notifications.habitOpenBody", { count: unfinished, plural: unfinished > 1 ? "s" : "" }),
        tag: "habit-nudge",
        category: "habit_nudge",
    };
}

function checkDungeonReset(state) {
    const hour = new Date().getHours();
    if (hour < 7 || hour > 9) return null; // Window: 7-9 (was exactly 8)
    const today = getToday();
    if (state?.lastDungeonRefresh === today) return null;
    return {
        title: nt(state, "notifications.gatesTitle"),
        body: nt(state, "notifications.gatesBody"),
        tag: "dungeon-reset",
        category: "gate_reset",
    };
}

function checkCustomReminders(state) {
    const reminders = state?.reminders || [];
    const now = Date.now();
    for (const r of reminders) {
        if (r.fired) continue;
        if (now >= new Date(r.reminderAt).getTime()) {
            const quest = r.questId ? (state?.quests || []).find(q => q.id === r.questId) : null;
            return {
                title: r.title || nt(state, "notifications.reminderTitle"),
                body: quest ? nt(state, "notifications.reminderQuestBody", { title: quest.title }) : (r.body || nt(state, "notifications.reminderTitle")),
                tag: `reminder-${r.id}`,
                category: "custom_reminder",
                reminderId: r.id,
                questId: r.questId,
            };
        }
    }
    return null;
}

function checkDueDateWarning(state) {
    const quests = (state?.quests || []).filter(q => !q.completed && q.dueDate);
    if (!quests.length) return null;
    const today = getToday();
    const overdue = quests.filter(q => q.dueDate < today);
    const dueToday = quests.filter(q => q.dueDate === today);
    const target = overdue[0] || dueToday[0];
    if (!target) return null;
    return {
        title: overdue.length ? nt(state, "notifications.overdueTitle") : nt(state, "notifications.dueTodayPlainTitle"),
        body: overdue.length
            ? nt(state, "notifications.overdueBody", { count: overdue.length, plural: overdue.length > 1 ? "s" : "", title: target.title })
            : nt(state, "notifications.dueTodayBody", { count: dueToday.length, plural: dueToday.length > 1 ? "s" : "", title: target.title }),
        tag: `due-date-${today}`,
        category: "due_warning",
    };
}

function checkDueDateUpcoming(state) {
    const quests = (state?.quests || []).filter(q => !q.completed && q.dueDate);
    if (!quests.length) return null;
    const hour = new Date().getHours();
    if (hour < 10 || hour > 20) return null; // Expanded: 10-20 (was 14-20)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = getLocalDateKey(tomorrow);
    const dueTomorrow = quests.filter(q => q.dueDate === tomorrowKey);
    if (!dueTomorrow.length) return null;
    return {
        title: nt(state, "notifications.dueTomorrowTitle"),
        body: nt(state, "notifications.dueTomorrowBody", { title: dueTomorrow[0].title }),
        tag: `due-upcoming-${tomorrowKey}`,
        category: "due_upcoming",
    };
}

// Kalender-Rune: warns 3 days ahead when artifact is equipped
function checkKalenderRuneDeadlines(state) {
    if (!state?.artifacts?.discovered?.includes('time_rune') && !state?.artifacts?.discovered?.includes('kalender_rune')) return null;
    const quests = (state?.quests || []).filter(q => !q.completed && q.dueDate);
    if (!quests.length) return null;
    const hour = new Date().getHours();
    if (hour < 8 || hour > 20) return null;
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in3Key = getLocalDateKey(in3Days);
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    const in2Key = getLocalDateKey(in2Days);
    const soon = quests.filter(q => q.dueDate === in3Key || q.dueDate === in2Key);
    if (!soon.length) return null;
    return {
        title: nt(state, "notifications.runeDeadlineTitle"),
        body: nt(state, "notifications.runeDeadlineBody", { title: soon[0].title, days: soon[0].dueDate === in2Key ? 2 : 3 }),
        tag: `rune-deadline-${in3Key}`,
        category: "rune_deadline",
    };
}

function checkWeeklyQuestExpiry(state) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day !== 0 || hour < 12) return null; // Sunday from 12:00 (was 14)
    const weeklyQuests = (state?.quests || []).filter(q =>
        !q.completed && q.type === "weekly" && q.timeLimit
    );
    if (!weeklyQuests.length) return null;
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);
    const expiring = weeklyQuests.filter(q => new Date(q.timeLimit) <= tonight);
    if (!expiring.length) return null;
    return {
        title: nt(state, "notifications.weeklyExpiringTitle"),
        body: nt(state, "notifications.weeklyExpiringBody", {
            count: expiring.length,
            plural: expiring.length > 1 ? "s" : "",
            verb: expiring.length > 1 ? (getStateLocale(state) === "de" ? "laufen" : "expire") : (getStateLocale(state) === "de" ? "laeuft" : "expires"),
        }),
        tag: `weekly-expiry-${getToday()}`,
        category: "weekly_expiry",
    };
}

function checkWeeklySummary(state) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day !== 0 || hour < 10 || hour > 11) return null;
    const completed = state?.completedQuests || [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekQuests = completed.filter(q => q.completedAt >= getLocalDateKey(weekAgo)).length;
    return {
        title: nt(state, "notifications.weeklySummaryTitle"),
        body: nt(state, "notifications.weeklySummaryBody", { quests: weekQuests, streak: state?.streak || 0, level: state?.level || 1 }),
        tag: "weekly-summary",
        category: "weekly_summary",
    };
}

// ── Capacitor Background Notification Scheduler ──────────────

export async function scheduleBackgroundNotifications(state) {
    if (!IS_CAPACITOR) return;
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== 'granted') return;
        }

        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const notifications = [];
        let nextId = 1000;
        const today = getToday();
        const now = new Date();
        const preset = getNotificationPreset(state);
        const scheduledNonEssentialByDate = new Map();

        // Helper to add a notification only if schedule is in the future
        const addNotif = (title, body, at, category) => {
            if (at <= now) return;

            const dateKey = getLocalDateKey(at);
            const alreadyFired = dateKey === today ? getNonEssentialNotificationCountToday(today) : 0;
            const alreadyScheduled = scheduledNonEssentialByDate.get(dateKey) || 0;
            if (!canFireNotification({
                presetOrKey: preset,
                category,
                firedToday: alreadyFired + alreadyScheduled,
                hour: at.getHours(),
            })) {
                console.log(`[SoloToDo] Skipped scheduled notification by preset: ${category}`);
                return;
            }

            notifications.push({
                id: nextId++, title, body,
                schedule: { at, allowWhileIdle: true },
                smallIcon: "ic_notification", sound: "default",
                extra: { category },
            });
            if (!isEssentialCategory(category)) {
                scheduledNonEssentialByDate.set(dateKey, alreadyScheduled + 1);
            }
        };

        const questsToday = (state?.completedQuests || []).filter(q => q.completedAt === today).length;
        const habitsToday = (state?.habits || []).filter(h => h.history?.[today]?.completed).length;
        const hasActivity = questsToday > 0 || habitsToday > 0;

        // Daily activity reminders at 11, 14, 17 if no activity yet
        if (!hasActivity) {
            const d11 = new Date(); d11.setHours(11, 0, 0, 0);
            const d14 = new Date(); d14.setHours(14, 0, 0, 0);
            const d17 = new Date(); d17.setHours(17, 0, 0, 0);
            addNotif(nt(state, "notifications.noActivityTitle"), nt(state, "notifications.noActivityBody"), d11, "daily_activity");
            addNotif(nt(state, "notifications.noQuestTitle"), nt(state, "notifications.noQuestBody"), d14, "daily_activity");
            addNotif(nt(state, "notifications.dayEndingTitle"), nt(state, "notifications.dayEndingBody"), d17, "daily_activity");
        }

        // Streak protection at 19:00
        if ((state?.streak || 0) >= 3 && !hasActivity) {
            const d19 = new Date(); d19.setHours(19, 0, 0, 0);
            addNotif(nt(state, "notifications.streakDangerTitle"), nt(state, "notifications.streakDangerBody", { streak: state.streak, hours: 5 }), d19, "streak_protection");
        }

        // Late Night Energy Warning at 21:00
        const deepQuests = (state?.quests || []).filter(q => !q.completed && q.energy === "deep");
        if (deepQuests.length > 0) {
            const d21 = new Date(); d21.setHours(21, 0, 0, 0);
            addNotif(nt(state, "notifications.lateNightTitle"), nt(state, "notifications.lateNightBody", { title: deepQuests[0].title }), d21, "late_night");
        }

        // Habit reminder at 20:00
        const unfinished = (state?.habits || []).filter(h => h.active && !h.history?.[today]?.completed).length;
        if (unfinished > 0) {
            const d20 = new Date(); d20.setHours(20, 0, 0, 0);
            addNotif(nt(state, "notifications.habitOpenTitle"), nt(state, "notifications.habitOpenBody", { count: unfinished, plural: unfinished > 1 ? "s" : "" }), d20, "habit_nudge");
        }

        // Emergency quest: 2h before expiry
        if (state?.emergencyQuest && !state.emergencyDone && !state.emergencyFailed) {
            const expires = new Date(state.emergencyQuest.timeLimit);
            const warnAt = new Date(expires.getTime() - 2 * 60 * 60 * 1000);
            addNotif(nt(state, "notifications.emergencyExpiringTitle"), nt(state, "notifications.emergencyExpiringBody", { title: state.emergencyQuest.title, minutes: 120 }), warnAt, "emergency_expiry");
        }

        // DueDate reminders at 9 AM on due day
        for (const q of (state?.quests || []).filter(q => !q.completed && q.dueDate)) {
            const dueAt = new Date(q.dueDate + "T09:00:00");
            addNotif(nt(state, "notifications.dueTodayTitle"), nt(state, "notifications.dueTodayBody", { count: 1, plural: "", title: q.title }), dueAt, "due_warning");
        }

        // Tomorrow morning dungeon reset at 8 AM
        const tomorrow8 = new Date();
        tomorrow8.setDate(tomorrow8.getDate() + 1);
        tomorrow8.setHours(8, 0, 0, 0);
        addNotif(nt(state, "notifications.gatesTitle"), nt(state, "notifications.gatesBody"), tomorrow8, "gate_reset");

        // Inactivity comeback: fires ONLY if the user does not return for 2
        // days — every app open cancels pending notifications and reschedules,
        // so this is structurally capped at one per absence phase.
        addNotif(
            nt(state, "notifications.comebackTitle"),
            nt(state, "notifications.comebackBody"),
            computeInactivityComebackAt(),
            "inactivity_comeback"
        );

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
            console.log(`[SoloToDo] Scheduled ${notifications.length} background notifications`);
        }
    } catch (e) {
        console.error('[SoloToDo] Background notification scheduling failed:', e);
    }
}

// ── Main Check Runner ────────────────────────────────────────

export function runReminderChecks(state) {
    console.log('[SoloToDo:Notif] Running reminder checks...');
    const preset = getNotificationPreset(state);

    const checks = [
        checkCustomReminders,
        checkEmergencyQuest,
        checkKalenderRuneDeadlines,   // Artifact: 3-day deadline warning
        checkDueDateWarning,
        checkDueDateUpcoming,
        checkEmergencyMorning,
        checkHabitNudge,
        checkDungeonReset,
        checkWeeklyQuestExpiry,
        checkWeeklySummary,
        checkStreakProtection,
        checkDailyActivity,       // NEW: fires throughout the day
        checkLateNightEnergy,
    ];

    for (const check of checks) {
        const result = check(state);
        if (result) {
            const firedToday = getNonEssentialNotificationCountToday();
            const hour = new Date().getHours();
            if (!canFireNotification({ presetOrKey: preset, category: result.category, firedToday, hour })) {
                console.log(`[SoloToDo:Notif] Skipped by notification preset: ${result.category || result.tag}`);
                continue;
            }
            if (!result.reminderId && wasAlertSentToday(result.tag)) {
                console.log(`[SoloToDo:Notif] Skipped (already sent): ${result.tag}`);
                continue;
            }
            console.log(`[SoloToDo:Notif] Triggered: ${result.tag} → "${result.title}"`);
            sendNotification(result.title, result.body, result.tag);
            incrementNonEssentialNotificationCountToday(result.category);
            return result;
        }
    }
    console.log('[SoloToDo:Notif] No checks triggered this cycle.');
    return null;
}

// ── Permission Banner Component ─────────────────────────────

export function NotificationBanner({ state, theme, onUpdateReminder, onReminderFired }) {
    const [permission, setPermission] = useState(() => {
        if (IS_CAPACITOR) return "prompt";
        if (typeof window !== "undefined" && "Notification" in window) return Notification.permission;
        return "unsupported";
    });
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem("sl_notif_banner_dismissed") === "true"; }
        catch { return false; }
    });

    // On native: auto-request push + local notification permissions
    useEffect(() => {
        if (!IS_CAPACITOR) return;
        (async () => {
            try {
                const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
                const { receive } = await FirebaseMessaging.checkPermissions();
                if (receive === 'granted') { setPermission('granted'); return; }
                const result = await FirebaseMessaging.requestPermissions();
                setPermission(result.receive === 'granted' ? 'granted' : 'denied');
            } catch (e) {
                console.error('[SoloToDo] Push permission request failed', e);
                setPermission('unsupported');
            }
            // Also request local notification permissions
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.requestPermissions();
            } catch { }
        })();
    }, []);

    const nextReminder = (state?.reminders || [])
        .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];

    // Setup FCM token on Capacitor
    useEffect(() => {
        if (!IS_CAPACITOR || permission !== 'granted' || !auth.currentUser) return;
        let mounted = true;
        (async () => {
            try {
                const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
                FirebaseMessaging.addListener('tokenReceived', async (event) => {
                    if (auth.currentUser && mounted) {
                        try {
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                fcmToken: event.token, lastTokenUpdate: new Date().toISOString()
                            });
                        } catch { }
                    }
                });
                const { token } = await FirebaseMessaging.getToken();
                if (token && auth.currentUser) {
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), { fcmToken: token });
                }
            } catch (err) {
                console.error('[SoloToDo] Push Init Error:', err);
            }
        })();
        return () => { mounted = false; };
    }, [permission]);

    // Periodic reminder checks every 5 minutes
    useEffect(() => {
        if (!state) return;
        const handleCheck = () => {
            const result = runReminderChecks(state);
            if (result && onReminderFired) onReminderFired(result);
            if (result?.reminderId && onUpdateReminder) onUpdateReminder(result.reminderId);
        };
        const interval = setInterval(handleCheck, 5 * 60 * 1000);
        const initial = setTimeout(handleCheck, 8 * 1000);
        return () => { clearInterval(interval); clearTimeout(initial); };
    }, [
        state?.streak,
        state?.emergencyQuest,
        state?.settings?.notificationLevel,
        (state?.habits || []).length,
        (state?.quests || []).filter(q => !q.completed).length,
        (state?.reminders || []).map(r => `${r.id}:${r.fired}`).join("|"),
        (state?.completedQuests || []).length,
    ]);

    // Schedule background notifications on Capacitor
    useEffect(() => {
        if (!IS_CAPACITOR || !state) return;
        scheduleBackgroundNotifications(state);
    }, [
        state?.streak,
        state?.emergencyQuest?.id,
        state?.settings?.notificationLevel,
        (state?.completedQuests || []).length,
        (state?.habits || []).filter(h => h.active).length,
        (state?.quests || []).filter(q => !q.completed && q.dueDate).length,
    ]);

    if (permission === "granted" || permission === "denied" || permission === "unsupported" || dismissed) {
        return null;
    }

    return (
        <div style={{
            background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}10,transparent)`,
            border: `1px solid ${theme?.primary || "#22d3ee"}25`,
            borderLeft: `3px solid ${theme?.primary || "#22d3ee"}`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 10,
            animation: "fadeIn 0.4s ease",
        }}>
            <img src={NAV_ICONS.settings} alt="" style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 6px ${theme?.primary || "#22d3ee"}88) brightness(1.2)` }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme?.accent || "#67e8f9", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                    BENACHRICHTIGUNGEN
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {nextReminder
                        ? `Nächster Reminder: ${formatLocalDateTime(nextReminder.reminderAt)}`
                        : "Erhalte Streak-Warnungen & Erinnerungen"}
                </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button onClick={async () => {
                    const result = await requestNotificationPermission();
                    setPermission(result);
                    try { localStorage.setItem("sl_notif_banner_dismissed", "true"); } catch { }
                }} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                    color: theme?.accent || "#67e8f9",
                    border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                    fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                }}>AKTIVIEREN</button>
                <button onClick={() => { setDismissed(true); try { localStorage.setItem("sl_notif_banner_dismissed", "true"); } catch { } }}
                    style={{ padding: "6px 10px", borderRadius: 8, fontSize: 10, background: "transparent", color: "#475569", border: "1px solid #1e2940", cursor: "pointer" }}>✕</button>
            </div>
        </div>
    );
}
