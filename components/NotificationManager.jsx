import React, { useState, useEffect } from "react";
import { NAV_ICONS } from "../data/icons.js";
import { getToday, getLocalDateKey, formatLocalDateTime } from "../data/dateUtils.js";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const IS_CAPACITOR = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

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
        msg = "Der Tag hat gerade erst begonnen. Starte mit einer Easy-Quest!";
    } else if (hour < 17) {
        msg = "Noch keine Quest heute erledigt. Dein Streak wartet!";
    } else {
        msg = "Der Tag neigt sich dem Ende — erledige mindestens eine Quest!";
    }

    // Use hour-bucket tag so it can fire at 11, 14, and 17
    const bucket = hour < 13 ? "morning" : hour < 17 ? "afternoon" : "evening";
    return {
        title: "SYSTEM: Keine Aktivität heute",
        body: msg,
        tag: `daily-activity-${bucket}`,
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
        title: `${streak}-Tage Streak in Gefahr!`,
        body: `Dein Streak endet in ${hoursLeft}h. Eine Quest oder ein Habit rettet ihn!`,
        tag: `streak-protection-${hour < 18 ? "early" : "late"}`,
    };
}

function checkEmergencyQuest(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const expires = new Date(state.emergencyQuest.timeLimit);
    const hoursLeft = (expires.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft > 4 || hoursLeft < 0) return null; // Expanded: warn 4h before (was 2h)
    return {
        title: "NOTFALL-QUEST läuft ab!",
        body: `"${state.emergencyQuest.title}" endet in ${Math.round(hoursLeft * 60)} Min!`,
        tag: "emergency-quest",
    };
}

function checkEmergencyMorning(state) {
    if (!state?.emergencyQuest || state.emergencyDone || state.emergencyFailed) return null;
    const hour = new Date().getHours();
    if (hour < 8 || hour > 12) return null; // Expanded: 8-12 Uhr (was 9-10)
    return {
        title: "NOTFALL-MISSION aktiv!",
        body: `"${state.emergencyQuest.title}" wartet auf dich!`,
        tag: "emergency-morning",
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
        title: "Habits noch offen",
        body: `${unfinished} Habit${unfinished > 1 ? "s" : ""} warten noch auf dich.`,
        tag: "habit-nudge",
    };
}

function checkDungeonReset(state) {
    const hour = new Date().getHours();
    if (hour < 7 || hour > 9) return null; // Window: 7-9 (was exactly 8)
    const today = getToday();
    if (state?.lastDungeonRefresh === today) return null;
    return {
        title: "Neue Gates verfügbar!",
        body: `Dungeon Gates warten auf dich.`,
        tag: "dungeon-reset",
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
                title: r.title || "Erinnerung",
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
            ? `${overdue.length} Quest${overdue.length > 1 ? "s" : ""} überfällig: ${target.title}`
            : `${dueToday.length} Quest${dueToday.length > 1 ? "s" : ""} heute fällig: ${target.title}`,
        tag: `due-date-${today}`,
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
        title: "Quest morgen fällig!",
        body: `${dueTomorrow[0].title} ist morgen fällig.`,
        tag: `due-upcoming-${tomorrowKey}`,
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
        title: "Weekly Quests laufen ab!",
        body: `${expiring.length} Weekly-Quest${expiring.length > 1 ? "s laufen" : " läuft"} heute Nacht ab!`,
        tag: `weekly-expiry-${getToday()}`,
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
        title: "Deine Woche",
        body: `${weekQuests} Quests · ${state?.streak || 0}d Streak · Level ${state?.level || 1}`,
        tag: "weekly-summary",
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

        // Helper to add a notification only if schedule is in the future
        const addNotif = (title, body, at) => {
            if (at > now) {
                notifications.push({
                    id: nextId++, title, body,
                    schedule: { at, allowWhileIdle: true },
                    smallIcon: "ic_notification", sound: "default",
                });
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
            addNotif("Noch keine Aktivität heute", "Starte mit einer Quest!", d11);
            addNotif("Keine Quest heute erledigt", "Dein Streak wartet auf dich!", d14);
            addNotif("Tag fast vorbei!", "Erledige mindestens eine Quest heute.", d17);
        }

        // Streak protection at 19:00
        if ((state?.streak || 0) >= 3 && !hasActivity) {
            const d19 = new Date(); d19.setHours(19, 0, 0, 0);
            addNotif(`${state.streak}-Tage Streak in Gefahr!`, "Erledige eine Quest bevor der Tag endet!", d19);
        }

        // Habit reminder at 20:00
        const unfinished = (state?.habits || []).filter(h => h.active && !h.history?.[today]?.completed).length;
        if (unfinished > 0) {
            const d20 = new Date(); d20.setHours(20, 0, 0, 0);
            addNotif("Habits noch offen", `${unfinished} Habit${unfinished > 1 ? "s" : ""} warten noch.`, d20);
        }

        // Emergency quest: 2h before expiry
        if (state?.emergencyQuest && !state.emergencyDone && !state.emergencyFailed) {
            const expires = new Date(state.emergencyQuest.timeLimit);
            const warnAt = new Date(expires.getTime() - 2 * 60 * 60 * 1000);
            addNotif("NOTFALL-QUEST läuft ab!", `"${state.emergencyQuest.title}" endet bald!`, warnAt);
        }

        // DueDate reminders at 9 AM on due day
        for (const q of (state?.quests || []).filter(q => !q.completed && q.dueDate)) {
            const dueAt = new Date(q.dueDate + "T09:00:00");
            addNotif("Quest heute fällig!", `"${q.title}" ist heute fällig.`, dueAt);
        }

        // Tomorrow morning dungeon reset at 8 AM
        const tomorrow8 = new Date();
        tomorrow8.setDate(tomorrow8.getDate() + 1);
        tomorrow8.setHours(8, 0, 0, 0);
        addNotif("Neue Gates verfügbar!", "Dungeon Gates wurden zurückgesetzt.", tomorrow8);

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

    const checks = [
        checkCustomReminders,
        checkDueDateWarning,
        checkDueDateUpcoming,
        checkWeeklyQuestExpiry,
        checkDailyActivity,       // NEW: fires throughout the day
        checkStreakProtection,
        checkEmergencyQuest,
        checkEmergencyMorning,
        checkHabitNudge,
        checkDungeonReset,
        checkWeeklySummary,
    ];

    for (const check of checks) {
        const result = check(state);
        if (result) {
            if (!result.reminderId && wasAlertSentToday(result.tag)) {
                console.log(`[SoloToDo:Notif] Skipped (already sent): ${result.tag}`);
                continue;
            }
            console.log(`[SoloToDo:Notif] Triggered: ${result.tag} → "${result.title}"`);
            sendNotification(result.title, result.body, result.tag);
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
