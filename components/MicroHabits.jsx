import React, { useState, useCallback } from "react";
import { calculateLevelUp } from "../data/constants";

/**
 * MicroHabits – Quick tap-counter widget for tiny daily habits.
 * Lives on the dashboard as a compact widget.
 */

const DEFAULT_MICRO_HABITS = [
    { id: "water", icon: "💧", label: "Wasser", dailyTarget: 8, color: "#3b82f6" },
    { id: "posture", icon: "🧘", label: "Haltung", dailyTarget: 5, color: "#22c55e" },
    { id: "stretch", icon: "🤸", label: "Stretch", dailyTarget: 4, color: "#f59e0b" },
    { id: "gratitude", icon: "🙏", label: "Dankbar", dailyTarget: 3, color: "#a855f7" },
    { id: "breathe", icon: "🌬️", label: "Atmen", dailyTarget: 3, color: "#06b6d4" },
];

function getToday() { return new Date().toISOString().slice(0, 10); }

export default function MicroHabits({ state, persist, notify, theme }) {
    const today = getToday();
    const microHabits = state?.microHabits?.habits || DEFAULT_MICRO_HABITS;
    const todayData = state?.microHabits?.daily?.[today] || {};

    const totalTarget = microHabits.reduce((s, h) => s + h.dailyTarget, 0);
    const totalDone = microHabits.reduce((s, h) => s + Math.min(todayData[h.id] || 0, h.dailyTarget), 0);
    const allComplete = totalDone >= totalTarget * 0.8;

    const increment = useCallback((habitId) => {
        const habit = microHabits.find(h => h.id === habitId);
        const current = todayData[habitId] || 0;
        if (current >= habit.dailyTarget) return;

        const newDaily = { ...todayData, [habitId]: current + 1 };
        const newMicro = {
            ...state.microHabits,
            habits: microHabits,
            daily: { ...(state.microHabits?.daily || {}), [today]: newDaily },
        };

        // Check if daily bonus threshold reached
        const newTotal = microHabits.reduce((s, h) => s + Math.min(newDaily[h.id] || 0, h.dailyTarget), 0);
        const wasComplete = totalDone >= totalTarget * 0.8;
        const nowComplete = newTotal >= totalTarget * 0.8;

        let xpBonus = 2; // 2 XP per tap
        if (nowComplete && !wasComplete) {
            xpBonus += 25; // daily bonus
            notify("🎯 Micro-Habit Tagesziel erreicht! +25 Bonus-XP", "success");
        }

        persist(calculateLevelUp({
            ...state,
            microHabits: newMicro,
        }, xpBonus));
    }, [state, persist, notify, todayData, microHabits, today, totalDone, totalTarget]);

    return (
        <div style={{
            background: theme?.card || "rgba(10,10,22,0.88)",
            border: `1px solid ${allComplete ? "#22c55e22" : theme?.primary + "12" || "#22d3ee12"}`,
            borderRadius: 16, padding: "14px 16px", marginBottom: 14,
            backdropFilter: "blur(8px)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
                    MICRO-HABITS
                </div>
                <div style={{ fontSize: 9, color: allComplete ? "#22c55e" : "#334155", fontFamily: "'JetBrains Mono',monospace" }}>
                    {allComplete ? "✓ ZIEL" : `${totalDone}/${totalTarget}`}
                </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
                {microHabits.map(habit => {
                    const count = todayData[habit.id] || 0;
                    const done = count >= habit.dailyTarget;
                    const pct = Math.min((count / habit.dailyTarget) * 100, 100);
                    return (
                        <button
                            key={habit.id}
                            onClick={() => increment(habit.id)}
                            disabled={done}
                            style={{
                                flex: 1, padding: "8px 2px", borderRadius: 12,
                                background: done ? habit.color + "15" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${done ? habit.color + "44" : "#1e294033"}`,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                cursor: done ? "default" : "pointer",
                                opacity: done ? 0.7 : 1,
                                transition: "all 0.2s",
                            }}
                        >
                            <span style={{ fontSize: 18 }}>{habit.icon}</span>
                            <span style={{
                                fontSize: 7, color: done ? habit.color : "#475569",
                                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
                            }}>{habit.label}</span>
                            {/* Mini progress */}
                            <div style={{
                                width: "80%", height: 3, background: "#0f0f1e", borderRadius: 2, overflow: "hidden",
                            }}>
                                <div style={{
                                    width: `${pct}%`, height: "100%", borderRadius: 2,
                                    background: done ? habit.color : habit.color + "88",
                                    transition: "width 0.3s",
                                }} />
                            </div>
                            <span style={{
                                fontSize: 8, fontWeight: 700,
                                color: done ? habit.color : "#475569",
                                fontFamily: "'JetBrains Mono',monospace",
                            }}>
                                {count}/{habit.dailyTarget}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
