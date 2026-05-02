import React, { useState, useEffect, useCallback } from "react";
import { NAV_ICONS } from "../data/icons.js";
import { getToday, getLocalDateKey, formatLocalDateTime } from "../data/dateUtils.js";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const IS_CAPACITOR = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

/**
 * NotificationManager – Push Notifications & Smart Reminders
 *
 * Features:
 *  1. Streak Protection Alert (abends wenn keine Quest, ab 18 Uhr)
 *  2. Emergency Quest Warning (2h vor Ablauf + Morgen-Reminder)
 *  3. Habit Time Nudge (ab 20 Uhr)
 *  4. Weekly Progress Summary (Sonntags 10 Uhr)
 *  5. Dungeon Reset Reminder (8 Uhr)
 *  6. DueDate Upcoming (Tag vor Fälligkeit, 14-20 Uhr) [NEU]
 *  7. DueDate Overdue (Tag der Fälligkeit) [verbessert]
 *  8. Weekly Quest Expiry (Sonntag ab 14 Uhr) [NEU]
 *  9. Emergency Quest Morning Reminder (9-10 Uhr) [NEU]
 *  10. Custom Reminders
 *
 * Uses the Web Notification API + periodic checks via setInterval.
 * On Capacitor/iOS: schedules local notifications for background delivery.
 */

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
        const result = await Notification.requestPermission();
        return result;
    }
}

// ── Send Notification ────────────────────────────────────────
function sendNotification(title, body, icon = "⚔️", tag = "solo-todo") {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
        new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag,
            silent: false,
            requireInteraction: false,
        });
    } catch (e) {
        // Fallback for mobile where Notification constructor might not work
        console.log("Notification fallback:", title, body);
    }
}

// ── Deduplication Guard (localStorage for persistence across restarts) ──
function wasAlertSentToday(tag) {
    if (typeof window === "undefined" || !tag) return false;
    try {
        const key = `sl_alert_${tag}`;
        const today = getToday();
        if (localStorage.getItem(key) === today) return true;
        localStorage.setItem(key, today);
    } catch { }
    return false;
}

// ── Reminder Checks ──────────────────────────────────────────

function checkStreakProtection(state) {
    const streak = state?.streak || 0;
    if (streak < 3) return null; // Consistent with SystemCoach (≥ 3)
    const hour = new Date().getHours();
    if (hour < 18 || hour > 23) return null; // Wider window: 18-23 Uhr
    const today = getToday();
    const questsToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
    const habitsToday = (state.habits || []).filter(h => h.history?.[today]?.completed).length;
    if (questsToday > 0 || habitsToday > 0) return null;
    const hoursLeft = 24 - hour;
    return {
        title: `${streak}-Tage Streak in Gefahr!`,
        body: `Dein Streak endet in ${hoursLeft}h. Eine Quest oder ein Habit rettet ihn!`,
        tag: "streak-protection",
    };
}

function checkEmergencyQuest(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const expires = new Date(state.emergencyQuest.timeLimit);
    const hoursLeft = (expires.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft > 2 || hoursLeft < 0) return null;
    return {
        title: "NOTFALL-QUEST läuft ab!",
        body: `"${state.emergencyQuest.title}" endet in ${Math.round(hoursLeft * 60)} Minuten. Penalty droht!`,
        tag: "emergency-quest",
    };
}

// NEW: Morning reminder for active emergency quest
function checkEmergencyMorning(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const hour = new Date().getHours();
    if (hour < 9 || hour > 10) return null; // Only 9-10 AM
    return {
        title: "NOTFALL-MISSION aktiv!",
        body: `"${state.emergencyQuest.title}" wartet. Erledige sie, bevor es zu spät ist!`,
        tag: "emergency-morning",
    };
}

function checkHabitNudge(state) {
    const habits = state?.habits || [];
    if (habits.length === 0) return null;
    const hour = new Date().getHours();
    if (hour < 20) return null;
    const today = getToday();
    const unfinished = habits.filter(h => h.active && !h.history?.[today]?.completed).length;
    if (unfinished === 0) return null;
    return {
        title: "Habits noch offen",
        body: `${unfinished} Habit${unfinished > 1 ? "s" : ""} warten noch auf dich heute.`,
        tag: "habit-nudge",
    };
}

function checkDungeonReset(state) {
    const hour = new Date().getHours();
    if (hour !== 8) return null; // Only at 8 AM
    const today = getToday();
    if (state?.lastDungeonRefresh !== today) {
        return {
            title: "Neue Gates verfügbar!",
            body: `${(state.dungeons || []).length} Dungeon Gates warten auf dich.`,
            tag: "dungeon-reset",
        };
    }
    return null;
}

function checkCustomReminders(state) {
    const reminders = state?.reminders || [];
    const now = Date.now();
    for (const r of reminders) {
        if (r.fired) continue;
        if (now >= new Date(r.reminderAt).getTime()) {
            const quest = r.questId ? (state?.quests || []).find(q => q.id === r.questId) : null;
            return {
                title: r.title,
                body: quest ? `Quest-Erinnerung: ${quest.title}` : (r.body || "Erinnerung"),
                tag: `reminder-${r.id}`,
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
        title: overdue.length ? "Überfällige Quest" : "Quest heute fällig",
        body: overdue.length
            ? `${overdue.length} Quest${overdue.length > 1 ? "s" : ""} sind überfällig. Starte mit: ${target.title}`
            : `${dueToday.length} Quest${dueToday.length > 1 ? "s" : ""} sind heute fällig. Nächste: ${target.title}`,
        tag: `due-date-${today}`,
    };
}

// NEW: Warn the day BEFORE a quest is due (14-20 Uhr)
function checkDueDateUpcoming(state) {
    const quests = (state?.quests || []).filter(q => !q.completed && q.dueDate);
    if (!quests.length) return null;
    const hour = new Date().getHours();
    if (hour < 14 || hour > 20) return null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = getLocalDateKey(tomorrow);
    const dueTomorrow = quests.filter(q => q.dueDate === tomorrowKey);
    if (!dueTomorrow.length) return null;
    return {
        title: "Quest morgen fällig!",
        body: `${dueTomorrow.length} Quest${dueTomorrow.length > 1 ? "s" : ""} ${dueTomorrow.length > 1 ? "sind" : "ist"} morgen fällig: ${dueTomorrow[0].title}`,
        tag: `due-upcoming-${tomorrowKey}`,
    };
}

// NEW: Warn about expiring weekly quests on Sunday afternoon
function checkWeeklyQuestExpiry(state) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day !== 0 || hour < 14) return null; // Sunday from 14:00

    const weeklyQuests = (state?.quests || []).filter(q =>
        !q.completed && q.type === "weekly" && q.timeLimit
    );
    if (!weeklyQuests.length) return null;

    // Check which weekly quests expire today/tonight
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);
    const expiringSoon = weeklyQuests.filter(q => {
        const expires = new Date(q.timeLimit);
        return expires <= tonight;
    });

    if (!expiringSoon.length) return null;
    return {
        title: "Weekly Quests laufen ab!",
        body: `${expiringSoon.length} Weekly-Quest${expiringSoon.length > 1 ? "s" : ""} ${expiringSoon.length > 1 ? "laufen" : "läuft"} heute Nacht ab!`,
        tag: `weekly-expiry-${getToday()}`,
    };
}

function checkWeeklySummary(state) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day !== 0 || hour !== 10) return null; // Sunday 10 AM

    // Calculate weekly stats
    const completed = state?.completedQuests || [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = getLocalDateKey(weekAgo);
    const weekQuests = completed.filter(q => q.completedAt >= weekAgoStr).length;

    return {
        title: "Deine Woche",
        body: `${weekQuests} Quests · ${state?.streak || 0}d Streak · Level ${state?.level || 1}`,
        tag: "weekly-summary",
    };
}

// ── Capacitor Local Notification Scheduler ───────────────────
// Schedules native local notifications that fire even when app is closed.

let _localNotifAvailable = null;

async function isLocalNotifAvailable() {
    if (_localNotifAvailable !== null) return _localNotifAvailable;
    if (!IS_CAPACITOR) { _localNotifAvailable = false; return false; }
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            _localNotifAvailable = req.display === 'granted';
        } else {
            _localNotifAvailable = true;
        }
    } catch {
        _localNotifAvailable = false;
    }
    return _localNotifAvailable;
}

/**
 * Schedule background local notifications based on current state.
 * Called once after state loads and whenever key state changes.
 * Cancels all previous scheduled notifications and re-schedules.
 */
export async function scheduleBackgroundNotifications(state) {
    if (!IS_CAPACITOR) return;
    const available = await isLocalNotifAvailable();
    if (!available) return;

    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        // Cancel all previous scheduled notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const notifications = [];
        let nextId = 1000; // Avoid conflict with other IDs

        const today = getToday();
        const now = new Date();

        // 1. Streak protection: Schedule at 19:00 today if streak ≥ 3 and no quest done
        const streak = state?.streak || 0;
        if (streak >= 3) {
            const questsToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
            const habitsToday = (state.habits || []).filter(h => h.history?.[today]?.completed).length;
            if (questsToday === 0 && habitsToday === 0) {
                const schedAt = new Date();
                schedAt.setHours(19, 0, 0, 0);
                if (schedAt > now) {
                    notifications.push({
                        id: nextId++,
                        title: `${streak}-Tage Streak in Gefahr!`,
                        body: "Erledige eine Quest oder ein Habit, bevor der Tag endet!",
                        schedule: { at: schedAt, allowWhileIdle: true },
                        smallIcon: "ic_notification",
                        sound: "default",
                    });
                }
            }
        }

        // 2. Habit reminder: Schedule at 20:00
        const habits = state?.habits || [];
        const unfinishedHabits = habits.filter(h => h.active && !h.history?.[today]?.completed).length;
        if (unfinishedHabits > 0) {
            const schedAt = new Date();
            schedAt.setHours(20, 0, 0, 0);
            if (schedAt > now) {
                notifications.push({
                    id: nextId++,
                    title: "Habits noch offen",
                    body: `${unfinishedHabits} Habit${unfinishedHabits > 1 ? "s" : ""} warten noch auf dich.`,
                    schedule: { at: schedAt, allowWhileIdle: true },
                    smallIcon: "ic_notification",
                    sound: "default",
                });
            }
        }

        // 3. Emergency quest: 2h before expiry
        if (state?.emergencyQuest && !state.emergencyDone && !state.emergencyFailed) {
            const expires = new Date(state.emergencyQuest.timeLimit);
            const warnAt = new Date(expires.getTime() - 2 * 60 * 60 * 1000);
            if (warnAt > now) {
                notifications.push({
                    id: nextId++,
                    title: "NOTFALL-QUEST läuft ab!",
                    body: `"${state.emergencyQuest.title}" endet bald. Penalty droht!`,
                    schedule: { at: warnAt, allowWhileIdle: true },
                    smallIcon: "ic_notification",
                    sound: "default",
                });
            }
        }

        // 4. DueDate reminders: 9 AM on day of due
        const dueDateQuests = (state?.quests || []).filter(q => !q.completed && q.dueDate);
        for (const q of dueDateQuests) {
            const dueDate = new Date(q.dueDate + "T09:00:00");
            if (dueDate > now) {
                notifications.push({
                    id: nextId++,
                    title: "Quest heute fällig!",
                    body: `"${q.title}" ist heute fällig.`,
                    schedule: { at: dueDate, allowWhileIdle: true },
                    smallIcon: "ic_notification",
                    sound: "default",
                });
            }
        }

        // 5. Morning dungeon reset at 8 AM tomorrow
        const tomorrowMorning = new Date();
        tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
        tomorrowMorning.setHours(8, 0, 0, 0);
        notifications.push({
            id: nextId++,
            title: "Neue Gates verfügbar!",
            body: "Dungeon Gates wurden zurückgesetzt. Betritt dein Gate!",
            schedule: { at: tomorrowMorning, allowWhileIdle: true },
            smallIcon: "ic_notification",
            sound: "default",
        });

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
            console.log(`[SoloToDo] Scheduled ${notifications.length} local notifications`);
        }
    } catch (e) {
        console.error('[SoloToDo] Failed to schedule local notifications:', e);
    }
}

// ── Main Check Runner ────────────────────────────────────────

export function runReminderChecks(state) {
    const checks = [
        checkCustomReminders,
        checkDueDateWarning,
        checkDueDateUpcoming,     // NEW
        checkWeeklyQuestExpiry,    // NEW
        checkStreakProtection,
        checkEmergencyQuest,
        checkEmergencyMorning,     // NEW
        checkHabitNudge,
        checkDungeonReset,
        checkWeeklySummary,
    ];

    for (const check of checks) {
        const result = check(state);
        if (result) {
            // Custom reminders bypass dedup (they have their own fired flag)
            if (!result.reminderId && wasAlertSentToday(result.tag)) continue;
            sendNotification(result.title, result.body, undefined, result.tag);
            return result; // Only send one per check cycle
        }
    }
    return null;
}

// ── Permission Banner Component ─────────────────────────────

export function NotificationBanner({ state, theme, onUpdateReminder, onReminderFired }) {
    const [permission, setPermission] = useState(() => {
        if (IS_CAPACITOR) return "prompt"; // Will be checked async below
        if (typeof window !== "undefined" && "Notification" in window) return Notification.permission;
        return "unsupported";
    });
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem("sl_notif_banner_dismissed") === "true"; }
        catch { return false; }
    });

    // On native (Capacitor), auto-request push permissions after login
    useEffect(() => {
        if (!IS_CAPACITOR) return;
        const autoRequest = async () => {
            try {
                const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
                const { receive } = await FirebaseMessaging.checkPermissions();
                if (receive === 'granted') {
                    setPermission('granted');
                    return;
                }
                // Auto-request — this triggers the iOS system dialog
                const result = await FirebaseMessaging.requestPermissions();
                setPermission(result.receive === 'granted' ? 'granted' : 'denied');
            } catch (e) {
                console.error('[SoloToDo] Auto push permission request failed', e);
                setPermission('unsupported');
            }
        };
        autoRequest();
    }, []);

    const nextReminder = (state?.reminders || [])
        .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];

    // Setup Capacitor Push Notifications if permission is granted
    useEffect(() => {
        if (!IS_CAPACITOR || permission !== 'granted' || !auth.currentUser) return;
        
        let isMounted = true;
        
        const initPush = async () => {
            try {
                const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
                
                // Set up token listener
                FirebaseMessaging.addListener('tokenReceived', async (event) => {
                    console.log('[SoloToDo] FCM Token received:', event.token);
                    if (auth.currentUser && isMounted) {
                        try {
                            const userRef = doc(db, 'users', auth.currentUser.uid);
                            await updateDoc(userRef, {
                                fcmToken: event.token,
                                lastTokenUpdate: new Date().toISOString()
                            });
                            console.log('[SoloToDo] FCM Token saved to Firestore.');
                        } catch (err) {
                            console.error('[SoloToDo] Error saving FCM token:', err);
                        }
                    }
                });
                
                // Get token on startup
                const { token } = await FirebaseMessaging.getToken();
                if (token && auth.currentUser) {
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, { fcmToken: token });
                }
            } catch (err) {
                console.error('[SoloToDo] Push Init Error:', err);
            }
        };
        
        initPush();
        
        return () => { isMounted = false; };
    }, [permission, auth.currentUser]);

    // Start periodic reminder checks (every 5 minutes instead of 15).
    // Browser notifications fire when granted;
    // in-app notifications still fire without OS permission.
    useEffect(() => {
        if (!state) return;
        const handleCheck = () => {
            const result = runReminderChecks(state);
            if (result && onReminderFired) onReminderFired(result);
            if (result?.reminderId && onUpdateReminder) onUpdateReminder(result.reminderId);
        };
        // Check every 5 minutes (was 15)
        const interval = setInterval(handleCheck, 5 * 60 * 1000);
        // Initial check after 10 seconds (was 30) so newly-added reminders are responsive
        const initial = setTimeout(handleCheck, 10 * 1000);
        return () => { clearInterval(interval); clearTimeout(initial); };
    }, [
        permission,
        state?.streak,
        state?.emergencyQuest,
        (state?.habits || []).length,
        (state?.quests || []).filter(q => !q.completed && (q.dueDate || q.timeLimit)).length,
        (state?.reminders || []).map(r => `${r.id}:${r.reminderAt}:${r.fired}`).join("|"),
    ]);

    // Schedule background local notifications on Capacitor whenever key state changes
    useEffect(() => {
        if (!IS_CAPACITOR || !state) return;
        scheduleBackgroundNotifications(state);
    }, [
        state?.streak,
        state?.emergencyQuest?.id,
        (state?.habits || []).filter(h => h.active).length,
        (state?.quests || []).filter(q => !q.completed && q.dueDate).length,
        state?.emergencyDone,
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
                        ? `Naechster Reminder: ${formatLocalDateTime(nextReminder.reminderAt)}`
                        : "Erhalte Streak-Warnungen & Erinnerungen"}
                </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button
                    onClick={async () => {
                        const result = await requestNotificationPermission();
                        setPermission(result);
                        try { localStorage.setItem("sl_notif_banner_dismissed", "true"); } catch { }
                    }}
                    style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: theme?.accent || "#67e8f9",
                        border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                    }}
                >
                    AKTIVIEREN
                </button>
                <button
                    onClick={() => { setDismissed(true); try { localStorage.setItem("sl_notif_banner_dismissed", "true"); } catch { } }}
                    style={{
                        padding: "6px 10px", borderRadius: 8, fontSize: 10,
                        background: "transparent", color: "#475569",
                        border: "1px solid #1e2940", cursor: "pointer",
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
