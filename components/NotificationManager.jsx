import React, { useState, useEffect, useCallback } from "react";

/**
 * NotificationManager – Push Notifications & Smart Reminders
 *
 * Features:
 *  1. Streak Protection Alert (abends wenn keine Quest)
 *  2. Emergency Quest Warning (2h vor Ablauf)  
 *  3. Habit Time Nudge
 *  4. Weekly Progress Summary (Sonntags)
 *  5. Dungeon Reset Reminder
 *
 * Uses the Web Notification API + periodic checks via setInterval.
 */

function getToday() { return new Date().toISOString().slice(0, 10); }

// ── Request Permission ───────────────────────────────────────
export async function requestNotificationPermission() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    const result = await Notification.requestPermission();
    return result;
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

// ── Reminder Checks ──────────────────────────────────────────

function checkStreakProtection(state) {
    const streak = state?.streak || 0;
    if (streak < 2) return null;
    const hour = new Date().getHours();
    if (hour < 19 || hour > 22) return null;
    const today = getToday();
    const questsToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
    const habitsToday = (state.habits || []).filter(h => h.history?.[today]?.completed).length;
    if (questsToday > 0 || habitsToday > 0) return null;
    const hoursLeft = 24 - hour;
    return {
        title: `⚠ ${streak}-Tage Streak in Gefahr!`,
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
        title: "🚨 NOTFALL-QUEST läuft ab!",
        body: `"${state.emergencyQuest.title}" endet in ${Math.round(hoursLeft * 60)} Minuten. Penalty droht!`,
        tag: "emergency-quest",
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
        title: "🔄 Habits noch offen",
        body: `${unfinished} Habit${unfinished > 1 ? "s" : ""} warten noch auf dich heute.`,
        tag: "habit-nudge",
    };
}

function checkDungeonReset(state) {
    const hour = new Date().getHours();
    if (hour !== 8) return null; // Only at 8 AM
    const today = getToday();
    if (state?.lastDungeonRefresh === today) {
        return {
            title: "🌀 Neue Gates verfügbar!",
            body: `${(state.dungeons || []).length} Dungeon Gates warten auf dich.`,
            tag: "dungeon-reset",
        };
    }
    return null;
}

function checkWeeklySummary(state) {
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (day !== 0 || hour !== 10) return null; // Sunday 10 AM

    // Calculate weekly stats
    const completed = state?.completedQuests || [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    const weekQuests = completed.filter(q => q.completedAt >= weekAgoStr).length;

    return {
        title: "📊 Deine Woche",
        body: `${weekQuests} Quests · ${state?.streak || 0}d Streak · Level ${state?.level || 1}`,
        tag: "weekly-summary",
    };
}

// ── Main Check Runner ────────────────────────────────────────

export function runReminderChecks(state) {
    const checks = [
        checkStreakProtection,
        checkEmergencyQuest,
        checkHabitNudge,
        checkDungeonReset,
        checkWeeklySummary,
    ];

    for (const check of checks) {
        const result = check(state);
        if (result) {
            sendNotification(result.title, result.body, undefined, result.tag);
            return result; // Only send one per check cycle
        }
    }
    return null;
}

// ── Permission Banner Component ─────────────────────────────

export function NotificationBanner({ state, theme }) {
    const [permission, setPermission] = useState(
        typeof window !== "undefined" && "Notification" in window
            ? Notification.permission
            : "unsupported"
    );
    const [dismissed, setDismissed] = useState(false);

    // Start periodic reminder checks when granted
    useEffect(() => {
        if (permission !== "granted" || !state) return;
        // Check every 15 minutes
        const interval = setInterval(() => runReminderChecks(state), 15 * 60 * 1000);
        // Initial check after 5 minutes
        const initial = setTimeout(() => runReminderChecks(state), 5 * 60 * 1000);
        return () => { clearInterval(interval); clearTimeout(initial); };
    }, [permission, state?.streak, state?.emergencyQuest, (state?.habits || []).length]);

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
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme?.accent || "#67e8f9", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                    BENACHRICHTIGUNGEN
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Erhalte Streak-Warnungen & Erinnerungen
                </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button
                    onClick={async () => {
                        const result = await requestNotificationPermission();
                        setPermission(result);
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
                    onClick={() => setDismissed(true)}
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
