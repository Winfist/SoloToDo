import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { calculateLevelUp } from "../data/constants";
import { HABIT_ICONS, QUEST_ICONS, NAV_ICONS, STAT_ICONS, BACKGROUNDS } from "../data/icons.js";
import { getToday, getLocalDateKey, getYesterdayKey } from "../data/dateUtils.js";
import { getPremiumStatus } from "../data/premium.js";

// ═══════════════════════════════════════════════════════════════
// HABIT TRACKER – Recurring Habits with per-Habit Streaks & Timer
// ═══════════════════════════════════════════════════════════════

const HABIT_CATEGORIES = [
    { key: "fitness", icon: "💪", iconSrc: HABIT_ICONS.fitness, label: "Fitness", color: "#ef4444" },
    { key: "learning", icon: "📖", iconSrc: STAT_ICONS.int, label: "Lernen", color: "#3b82f6" },
    { key: "health", icon: "🧘", iconSrc: HABIT_ICONS.health, label: "Gesundheit", color: "#22c55e" },
    { key: "productivity", icon: "⚡", iconSrc: STAT_ICONS.agi, label: "Produktiv", color: "#f59e0b" },
    { key: "social", icon: "👥", iconSrc: STAT_ICONS.cha, label: "Sozial", color: "#a855f7" },
    { key: "mindfulness", icon: "🧠", iconSrc: HABIT_ICONS.mindfulness, label: "Achtsamkeit", color: "#06b6d4" },
];

const FREQUENCY_OPTIONS = [
    { key: "daily", label: "Täglich", icon: "📅", iconSrc: QUEST_ICONS.daily },
    { key: "weekday", label: "Mo-Fr", icon: "🏢", iconSrc: HABIT_ICONS.weekday },
    { key: "weekend", label: "Sa-So", icon: "☀️", iconSrc: HABIT_ICONS.weekend },
    { key: "weekly", label: "Wöchentlich", icon: "📆", iconSrc: QUEST_ICONS.weekly },
    { key: "custom", label: "Benutzerdefiniert", icon: "⚙️", iconSrc: NAV_ICONS.settings },
];

const VERIFICATION_TYPES = [
    { key: "manual", label: "Manuell", icon: "✅", iconSrc: HABIT_ICONS.manual, desc: "Selbst bestätigen" },
    { key: "timer", label: "Timer", icon: "⏱️", iconSrc: HABIT_ICONS.timer, desc: "Zeitbasiert" },
    { key: "counter", label: "Zähler", icon: "🔢", iconSrc: HABIT_ICONS.counter, desc: "Wiederholungen" },
];

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ── Timer Component ──────────────────────────────────────────
function HabitTimer({ targetMinutes, onComplete, theme }) {
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);
    const targetSeconds = targetMinutes * 60;
    const progress = Math.min((elapsed / targetSeconds) * 100, 100);
    const done = elapsed >= targetSeconds;
    const remaining = Math.max(0, targetSeconds - elapsed);
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");

    useEffect(() => {
        if (running && !done) {
            intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, done]);

    useEffect(() => {
        if (done && running) {
            setRunning(false);
            clearInterval(intervalRef.current);
        }
    }, [done, running]);

    return (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="6" />
                    <circle cx="60" cy="60" r="54" fill="none"
                        stroke={done ? "#22c55e" : (theme?.primary || "#22d3ee")}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 6px ${done ? "#22c55e" : (theme?.primary || "#22d3ee")})` }}
                    />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: done ? "#22c55e" : "#fff", fontFamily: "'JetBrains Mono',monospace" }}>
                        {done ? "✓" : `${mm}:${ss}`}
                    </div>
                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                        {done ? "FERTIG" : `/ ${targetMinutes} MIN`}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {!done && (
                    <button onClick={() => setRunning(!running)} style={{
                        padding: "10px 28px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: running ? "rgba(239,68,68,0.15)" : `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: running ? "#ef4444" : (theme?.accent || "#67e8f9"),
                        border: `1px solid ${running ? "#ef444444" : (theme?.primary || "#22d3ee") + "44"}`,
                        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                    }}>
                        {running ? "⏸ PAUSE" : "▶ START"}
                    </button>
                )}
                {done && (
                    <button onClick={onComplete} style={{
                        padding: "10px 28px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: "linear-gradient(135deg,#22c55e22,#22c55e08)",
                        color: "#22c55e", border: "1px solid #22c55e44",
                        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                        animation: "pulse 2s infinite",
                    }}>
                        ✓ ABSCHLIESSEN
                    </button>
                )}
                {!done && elapsed > 0 && (
                    <button onClick={() => { setElapsed(0); setRunning(false); }} style={{
                        padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: "transparent", color: "#475569", border: "1px solid #1e2940",
                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                    }}>↺</button>
                )}
            </div>
        </div>
    );
}

// ── Counter Component ────────────────────────────────────────
function HabitCounter({ target, current, onUpdate, theme }) {
    const pct = Math.min((current / target) * 100, 100);
    const done = current >= target;

    return (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: done ? "#22c55e" : "#fff", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>
                {current}<span style={{ fontSize: 16, color: "#475569" }}>/{target}</span>
            </div>
            <div style={{ height: 6, background: "#0f0f1e", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    background: done ? "linear-gradient(90deg,#22c55e88,#22c55e)" : `linear-gradient(90deg,${theme?.primary || "#22d3ee"}88,${theme?.primary || "#22d3ee"})`,
                    transition: "width 0.4s ease",
                }} />
            </div>
            {!done && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => onUpdate(Math.max(0, current - 1))}
                        style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid #ef444433", color: "#ef4444", fontSize: 18, cursor: "pointer" }}>−</button>
                    <button onClick={() => onUpdate(current + 1)}
                        style={{ width: 40, height: 40, borderRadius: 10, background: `${theme?.primary || "#22d3ee"}15`, border: `1px solid ${theme?.primary || "#22d3ee"}44`, color: theme?.accent || "#67e8f9", fontSize: 18, cursor: "pointer" }}>+</button>
                </div>
            )}
            {done && <div style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>✓ ZIEL ERREICHT</div>}
        </div>
    );
}

// ── Habit Card ───────────────────────────────────────────────
function HabitCard({ habit, todayLog, onComplete, onCounterUpdate, onEdit, onDelete, theme }) {
    const [expanded, setExpanded] = useState(false);
    const cat = HABIT_CATEGORIES.find(c => c.key === habit.category) || HABIT_CATEGORIES[0];
    const completed = todayLog?.completed;
    const streak = habit.currentStreak || 0;
    const bestStreak = habit.bestStreak || 0;
    const totalCompletions = habit.totalCompletions || 0;
    const completionRate = habit.scheduledDays > 0 ? Math.round((totalCompletions / habit.scheduledDays) * 100) : 0;

    return (
        <div
            style={{
                background: completed
                    ? "rgba(34,197,94,0.06)"
                    : `radial-gradient(ellipse at 5% 50%, ${cat.color}08 0%, ${theme?.card || "rgba(10,10,22,0.92)"} 55%)`,
                border: `1px solid ${completed ? "#22c55e33" : cat.color + "1a"}`,
                borderLeft: `3px solid ${completed ? "#22c55e" : cat.color}`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 10,
                backdropFilter: "blur(12px)",
                transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
                cursor: "pointer",
                position: "relative", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
                transform: "perspective(800px) rotateX(0deg) translateZ(0)",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(-1deg) translateZ(4px) translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 10px 36px rgba(0,0,0,0.5), 0 0 16px ${completed ? "#22c55e" : cat.color}1a, inset 0 1px 0 rgba(255,255,255,0.06)`;
                e.currentTarget.style.borderLeftWidth = "4px";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateZ(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)";
                e.currentTarget.style.borderLeftWidth = "3px";
            }}
            onTouchEnd={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateZ(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)";
                e.currentTarget.style.borderLeftWidth = "3px";
            }}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Scan-line overlay */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 16, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.009) 3px, rgba(255,255,255,0.009) 4px)", zIndex: 0 }} />
            {/* Top shine edge */}
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${completed ? "#22c55e" : cat.color}55, transparent)`, pointerEvents: "none", zIndex: 2 }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: completed ? "#22c55e18" : cat.color + "18",
                        border: `1px solid ${completed ? "#22c55e55" : cat.color + "55"}`,
                        fontSize: 22,
                        boxShadow: `0 0 10px ${completed ? "#22c55e" : cat.color}22`,
                    }}>
                        {completed ? (
                            <span style={{ fontSize: 22, color: "#22c55e" }}>✓</span>
                        ) : cat.iconSrc ? (
                            <img src={cat.iconSrc} alt={cat.label} style={{ width: 28, height: 28, objectFit: "contain", filter: `brightness(${completed ? 0.6 : 1.05}) drop-shadow(0 0 5px ${cat.color}55)` }} />
                        ) : (
                            habit.icon || cat.icon
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700,
                            color: completed ? "#22c55e" : "#e2e8f0",
                            fontFamily: "'Cinzel',serif",
                            textDecoration: completed ? "line-through" : "none",
                            opacity: completed ? 0.7 : 1,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                            {habit.title}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 8, color: cat.color, padding: "1px 5px", borderRadius: 4, background: cat.color + "18", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                {cat.iconSrc ? <img src={cat.iconSrc} alt={cat.label} style={{ width: 10, height: 10, objectFit: "contain" }} /> : cat.icon}
                                {cat.label}
                            </span>
                            {streak > 0 && (
                                <span style={{ fontSize: 8, color: streak >= 5 ? "#f97316" : "#f59e0b", padding: "1px 5px", borderRadius: 4, background: "#f59e0b15", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <img src={STAT_ICONS.str} alt="" style={{ width: 10, height: 10, objectFit: "contain", filter: "brightness(1.2)", animation: streak >= 3 ? "fireGlow 1.5s ease-in-out infinite" : "none" }} /> {streak}d
                                </span>
                            )}
                            {habit.verification === "timer" && (
                                <span style={{ fontSize: 8, color: "#06b6d4", padding: "1px 5px", borderRadius: 4, background: "#06b6d415", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}><img src={HABIT_ICONS.timer} alt="" style={{ width: 10, height: 10, objectFit: "contain", filter: "brightness(1.2) drop-shadow(0 0 2px #06b6d488)" }} /> {habit.targetMinutes}min</span>
                            )}
                            {habit.verification === "counter" && (
                                <span style={{ fontSize: 8, color: "#a855f7", padding: "1px 5px", borderRadius: 4, background: "#a855f715", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}><img src={HABIT_ICONS.counter} alt="" style={{ width: 10, height: 10, objectFit: "contain", filter: "brightness(1.2) drop-shadow(0 0 2px #a855f788)" }} /> {todayLog?.counterValue || 0}/{habit.targetCount}</span>
                            )}
                        </div>
                    </div>
                    {!completed && habit.verification === "manual" && (
                        <button
                            onClick={e => { e.stopPropagation(); onComplete(habit.id); }}
                            style={{
                                padding: "7px 12px", borderRadius: 9, fontSize: 9, fontWeight: 700,
                                background: `linear-gradient(135deg,${cat.color}22,transparent)`,
                                color: cat.color, border: `1px solid ${cat.color}44`,
                                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                                flexShrink: 0, transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${cat.color}35,${cat.color}10)`; e.currentTarget.style.boxShadow = `0 0 12px ${cat.color}33`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${cat.color}22,transparent)`; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            DONE
                        </button>
                    )}
                </div>

                {/* Expanded view */}
                {expanded && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${cat.color}18` }}>
                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                            {[
                                { label: "Streak", value: streak > 0 ? `${streak}d` : "0", color: streak >= 5 ? "#f97316" : "#f59e0b", fire: streak >= 3 },
                                { label: "Best", value: `${bestStreak}d`, color: "#a855f7", fire: false },
                                { label: "Total", value: totalCompletions, color: theme?.primary || "#22d3ee", fire: false },
                                { label: "Rate", value: `${completionRate}%`, color: completionRate >= 80 ? "#22c55e" : completionRate >= 50 ? "#f59e0b" : "#ef4444", fire: false },
                            ].map(s => (
                                <div key={s.label} style={{
                                    textAlign: "center", padding: "7px 4px",
                                    background: "rgba(255,255,255,0.025)", borderRadius: 8,
                                    border: "1px solid rgba(255,255,255,0.04)",
                                }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: "'Cinzel',serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                        {s.fire && <img src={STAT_ICONS.str} alt="" style={{ width: 14, height: 14, objectFit: "contain", animation: "fireGlow 1.5s ease-in-out infinite", filter: "drop-shadow(0 0 4px #ef4444)" }} />}
                                        {s.value}
                                    </div>
                                    <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Timer / Counter view */}
                        {!completed && habit.verification === "timer" && (
                            <HabitTimer targetMinutes={habit.targetMinutes} onComplete={() => onComplete(habit.id)} theme={theme} />
                        )}
                        {!completed && habit.verification === "counter" && (
                            <HabitCounter target={habit.targetCount} current={todayLog?.counterValue || 0} onUpdate={(val) => onCounterUpdate(habit.id, val)} theme={theme} />
                        )}

                        {/* 7-day mini heatmap */}
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>LETZTE 7 TAGE</div>
                            <div style={{ display: "flex", gap: 4 }}>
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - i));
                                    const dateKey = getLocalDateKey(d);
                                    const log = habit.history?.[dateKey];
                                    const dayName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
                                    return (
                                        <div key={i} style={{ flex: 1, textAlign: "center" }}>
                                            <div style={{ fontSize: 7, color: "#334155", marginBottom: 3, fontFamily: "'JetBrains Mono',monospace" }}>{dayName}</div>
                                            <div style={{
                                                width: "100%", height: 20, borderRadius: 4,
                                                background: log?.completed ? cat.color + "25" : "rgba(255,255,255,0.03)",
                                                border: `1px solid ${log?.completed ? cat.color + "44" : "#1e294022"}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 9, color: log?.completed ? cat.color : "#1e2940",
                                                boxShadow: log?.completed ? `0 0 6px ${cat.color}22` : "none",
                                            }}>
                                                {log?.completed ? "✓" : "·"}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 9, background: `${theme?.primary || "#22d3ee"}12`, color: theme?.primary || "#22d3ee", border: `1px solid ${theme?.primary || "#22d3ee"}33`, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}>
                                BEARBEITEN
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
                                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 9, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef444433", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}>
                                LÖSCHEN
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Create/Edit Habit Modal ───────────────────────────────────────
function CreateHabitModal({ onClose, onSave, initialHabit, initialValues, theme }) {
    const isEdit = !!initialHabit;
    const formContentRef = useRef(null);
    const preset = initialHabit || initialValues;
    const [title, setTitle] = useState(preset?.title || "");
    const [category, setCategory] = useState(preset?.category || "fitness");
    const [frequency, setFrequency] = useState(preset?.frequency || "daily");
    const [verification, setVerification] = useState(preset?.verification || "manual");
    const [targetMinutes, setTargetMinutes] = useState(preset?.targetMinutes || 30);
    const [targetCount, setTargetCount] = useState(preset?.targetCount || 10);
    const [icon, setIcon] = useState(preset?.icon || "");

    const cat = HABIT_CATEGORIES.find(c => c.key === category) || HABIT_CATEGORIES[0];

    useEffect(() => {
        formContentRef.current?.scrollTo({ top: 0 });
    }, []);

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({
            id: initialHabit ? initialHabit.id : genId(),
            title: title.trim(),
            category,
            frequency,
            verification,
            targetMinutes: verification === "timer" ? targetMinutes : undefined,
            targetCount: verification === "counter" ? targetCount : undefined,
            icon: icon || cat?.icon || "📋",
            iconSrc: cat?.iconSrc || null,
            createdAt: initialHabit ? initialHabit.createdAt : getToday(),
            currentStreak: initialHabit ? initialHabit.currentStreak : 0,
            bestStreak: initialHabit ? initialHabit.bestStreak : 0,
            totalCompletions: initialHabit ? initialHabit.totalCompletions : 0,
            scheduledDays: initialHabit ? initialHabit.scheduledDays : 0,
            history: initialHabit ? initialHabit.history : {},
            active: initialHabit ? initialHabit.active : true,
            sourceQuestId: initialHabit?.sourceQuestId || initialValues?.sourceQuestId,
        });
        onClose();
    };

    return createPortal(
        <div role="dialog" aria-modal="true" onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(2,2,10,0.95)", backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeIn 0.25s ease",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "100%", maxWidth: 440, maxHeight: "92vh",
                background: `linear-gradient(180deg,${theme?.card || "rgba(10,10,22,0.98)"},rgba(4,4,14,0.99))`,
                border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                borderTop: `2px solid ${theme?.primary || "#22d3ee"}`,
                borderRadius: 24, padding: 0,
                position: "relative", overflow: "hidden",
                boxShadow: `0 0 80px ${theme?.glow || "rgba(34,211,238,0.15)"}, 0 24px 60px rgba(0,0,0,0.8)`,
                display: "flex", flexDirection: "column"
            }}>
                {/* Grid overlay */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", backgroundImage: `linear-gradient(${theme?.primary || "#22d3ee"}07 1px, transparent 1px), linear-gradient(90deg, ${theme?.primary || "#22d3ee"}07 1px, transparent 1px)`, backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 72%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 72%)", zIndex: 0 }} />

                {/* Header Sub-Component */}
                <div style={{ position: "relative", padding: "24px 24px 10px", flexShrink: 0, zIndex: 1 }}>
                    {/* Header with diamond decoration */}
                    <div style={{ position: "relative", marginBottom: 10, paddingTop: 4 }}>
                        <div style={{ position: "absolute", top: -8, right: 0, width: 48, height: 48, background: `linear-gradient(135deg, ${theme?.primary || "#22d3ee"}14, transparent)`, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", animation: "breathe 3s ease-in-out infinite", pointerEvents: "none" }} />
                        <div style={{ fontSize: 9, letterSpacing: 4, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>[ SYSTEM: {isEdit ? "HABIT ÄNDERN" : "NEUER HABIT"} ]</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 1, textShadow: `0 0 20px ${theme?.primary || "#22d3ee"}33` }}>
                            {isEdit ? "Gewohnheit anpassen" : "Gewohnheit erstellen"}
                        </div>
                        <div style={{ height: 1, marginTop: 10, background: `linear-gradient(90deg, ${theme?.primary || "#22d3ee"}55, transparent)` }} />
                    </div>
                </div>

                {/* Scrollable Form Content Sub-Component */}
                <div ref={formContentRef} style={{ padding: "0 24px 24px", overflowY: "auto", overscrollBehavior: "contain", flex: 1, position: "relative", zIndex: 1 }}>


                    {/* Title */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 }}>TITEL</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. 30 Minuten Lesen"
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, marginBottom: 16, background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`, color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
                        onFocus={e => { e.target.style.borderColor = theme?.primary || "#22d3ee"; e.target.style.boxShadow = `0 0 16px ${theme?.glow || "rgba(34,211,238,0.2)"}`; }}
                        onBlur={e => { e.target.style.borderColor = `${theme?.primary || "#22d3ee"}33`; e.target.style.boxShadow = "none"; }}
                    />

                    {/* Category */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>KATEGORIE</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
                        {HABIT_CATEGORIES.map(c => (
                            <button key={c.key} onClick={() => setCategory(c.key)} style={{
                                padding: "8px 4px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                                background: category === c.key ? c.color + "25" : "rgba(4,4,12,0.8)",
                                color: category === c.key ? c.color : "#475569",
                                border: `1px solid ${category === c.key ? c.color + "66" : "#1e2940"}`,
                                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                transition: "all 0.15s cubic-bezier(0.23,1,0.32,1)",
                                transform: category === c.key ? "scale(0.93) translateY(1px)" : "scale(1)",
                                boxShadow: category === c.key ? `0 0 14px ${c.color}33, inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)` : "none",
                            }}
                                onMouseEnter={e => { if (category !== c.key) { e.currentTarget.style.borderColor = c.color + "44"; e.currentTarget.style.color = c.color + "aa"; } }}
                                onMouseLeave={e => { if (category !== c.key) { e.currentTarget.style.borderColor = "#1e2940"; e.currentTarget.style.color = "#475569"; } }}
                            >
                                {c.iconSrc ? (
                                    <img src={c.iconSrc} alt={c.label} style={{ width: 20, height: 20, objectFit: "contain", filter: category === c.key ? `drop-shadow(0 0 6px ${c.color}88)` : "brightness(0.7)" }} />
                                ) : (
                                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                                )}
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Frequency */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>FREQUENZ</label>
                    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                        {FREQUENCY_OPTIONS.slice(0, 4).map(f => (
                            <button key={f.key} onClick={() => setFrequency(f.key)} style={{
                                flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                                background: frequency === f.key ? `${theme?.primary || "#22d3ee"}22` : "transparent",
                                color: frequency === f.key ? (theme?.accent || "#67e8f9") : "#475569",
                                border: `1px solid ${frequency === f.key ? (theme?.primary || "#22d3ee") + "55" : "#1e2940"}`,
                                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                                transition: "all 0.15s",
                                transform: frequency === f.key ? "scale(0.96) translateY(1px)" : "scale(1)",
                                boxShadow: frequency === f.key ? `inset 0 -2px 4px rgba(0,0,0,0.3)` : "none",
                            }}>
                                {f.iconSrc ? <img src={f.iconSrc} alt={f.label} style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} /> : f.icon} {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Verification */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>VERIFIZIERUNG</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
                        {VERIFICATION_TYPES.map(v => (
                            <button key={v.key} onClick={() => setVerification(v.key)} style={{
                                padding: "10px 6px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                                background: verification === v.key ? `${theme?.primary || "#22d3ee"}22` : "transparent",
                                color: verification === v.key ? (theme?.accent || "#67e8f9") : "#475569",
                                border: `1px solid ${verification === v.key ? (theme?.primary || "#22d3ee") + "55" : "#1e2940"}`,
                                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                                transition: "all 0.15s",
                                transform: verification === v.key ? "scale(0.95) translateY(1px)" : "scale(1)",
                                boxShadow: verification === v.key ? `0 0 12px ${theme?.primary || "#22d3ee"}22, inset 0 -2px 4px rgba(0,0,0,0.3)` : "none",
                            }}>
                                {v.iconSrc ? (
                                    <img src={v.iconSrc} alt={v.label} style={{ width: 20, height: 20, objectFit: "contain", filter: verification === v.key ? "brightness(1.2)" : "brightness(0.7)" }} />
                                ) : (
                                    <span style={{ fontSize: 16 }}>{v.icon}</span>
                                )}
                                <span>{v.label}</span>
                                <span style={{ fontSize: 7, opacity: 0.6 }}>{v.desc}</span>
                            </button>
                        ))}
                    </div>

                    {/* Timer target */}
                    {verification === "timer" && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>ZIELZEIT (MINUTEN)</label>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {[5, 10, 15, 20, 30, 45, 60, 90].map(m => (
                                    <button key={m} onClick={() => setTargetMinutes(m)} style={{
                                        flex: 1, minWidth: 36, padding: "8px 2px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                                        background: targetMinutes === m ? "#06b6d422" : "transparent",
                                        color: targetMinutes === m ? "#22d3ee" : "#475569",
                                        border: `1px solid ${targetMinutes === m ? "#06b6d455" : "#1e2940"}`,
                                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                                        transition: "all 0.15s",
                                        transform: targetMinutes === m ? "scale(0.93)" : "scale(1)",
                                        boxShadow: targetMinutes === m ? "inset 0 -2px 4px rgba(0,0,0,0.3)" : "none",
                                    }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Counter target */}
                    {verification === "counter" && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>ZIEL-ANZAHL</label>
                            <input type="number" value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value) || 1)}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`, color: "#fff", outline: "none", fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box" }} />
                        </div>
                    )}

                    {/* Create button */}
                    <button onClick={handleSave} disabled={!title.trim()} style={{
                        width: "100%", padding: 14, borderRadius: 14, fontSize: 12, fontWeight: 900,
                        background: title.trim() ? `linear-gradient(135deg,${theme?.primary || "#22d3ee"},${theme?.secondary || "#a855f7"})` : "rgba(15,15,30,0.6)",
                        color: title.trim() ? "#fff" : "#334155",
                        letterSpacing: 3, fontFamily: "'Cinzel',serif",
                        boxShadow: title.trim() ? `0 4px 20px ${theme?.glow || "rgba(34,211,238,0.3)"}` : "none",
                        cursor: title.trim() ? "pointer" : "not-allowed", border: "none",
                        transition: "all 0.2s",
                    }}
                        onMouseEnter={e => { if (title.trim()) e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { if (title.trim()) e.currentTarget.style.transform = "none"; }}
                    >
                        ✦ {isEdit ? "SPEICHERN" : "HABIT ERSTELLEN"} ✦
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Completion Celebration ───────────────────────────────────
// Premium, minimal popup shown when a habit is completed — replaces the
// flat success toast. Auto-dismisses; tap anywhere to close early.
function HabitCompleteCelebration({ data, onClose }) {
    const cat = HABIT_CATEGORIES.find(c => c.key === data.habit?.category) || HABIT_CATEGORIES[0];
    const ac = cat.color;
    useEffect(() => {
        const t = setTimeout(onClose, 2200);
        return () => clearTimeout(t);
    }, [onClose]);
    return createPortal(
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 4000, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 24,
            background: "rgba(2,4,10,0.66)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            animation: "fadeIn 0.25s ease",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "min(330px, calc(100vw - 48px))",
                background: "linear-gradient(180deg, rgba(14,14,26,0.98), rgba(8,8,18,0.99))",
                border: `1px solid ${ac}33`, borderTop: `2px solid ${ac}`, borderRadius: 18,
                padding: "26px 24px 22px", textAlign: "center", position: "relative", overflow: "hidden",
                boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 40px ${ac}14, inset 0 1px 0 rgba(255,255,255,0.05)`,
                animation: "habitWinPop 520ms cubic-bezier(0.16,1,0.3,1) both",
            }}>
                <div style={{
                    width: 72, height: 72, margin: "0 auto 16px", borderRadius: "50%",
                    display: "grid", placeItems: "center",
                    background: `radial-gradient(circle at 50% 40%, ${ac}28, ${ac}0c 60%, transparent)`,
                    border: `1px solid ${ac}44`,
                }}>
                    {cat.iconSrc
                        ? <img src={cat.iconSrc} alt="" style={{ width: 40, height: 40, objectFit: "contain", filter: `drop-shadow(0 0 8px ${ac}66)` }} />
                        : <span style={{ fontSize: 34 }}>{cat.icon}</span>}
                </div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: ac, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>HABIT ERLEDIGT</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Cinzel',serif", marginBottom: 16, lineHeight: 1.3 }}>{data.habit?.title}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <div style={{ flex: 1, padding: "10px 8px", borderRadius: 12, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#a78bfa", fontFamily: "'Cinzel',serif" }}>+{data.xpGain}</div>
                        <div style={{ fontSize: 8, letterSpacing: 2, color: "#7c6fb0", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>XP</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 8px", borderRadius: 12, background: `${ac}10`, border: `1px solid ${ac}33` }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: ac, fontFamily: "'Cinzel',serif" }}>{data.streak}</div>
                        <div style={{ fontSize: 8, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>STREAK</div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ═══ MAIN COMPONENT ══════════════════════════════════════════
export default function HabitTracker({ state, persist, notify, theme, onModalOpen, onModalClose, habitDraft, onHabitDraftHandled }) {
    const [celebration, setCelebration] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createSeed, setCreateSeed] = useState(null);
    const [editingHabit, setEditingHabit] = useState(null);
    const [filter, setFilter] = useState("all");
    const handledDraftRef = useRef(null);
    const habits = state?.habits || [];
    const today = getToday();

    // Routine-Stein artifact: +1 habit slot (base 5, premium 10)
    const isPremium = getPremiumStatus(state?.premium).active;
    const hasRoutineStone = state?.artifacts?.discovered?.includes('routine_stein');
    const BASE_HABIT_SLOTS = isPremium ? 10 : 5;
    const MAX_HABITS = BASE_HABIT_SLOTS + (hasRoutineStone ? 1 : 0);
    const atHabitCap = habits.filter(h => h.active !== false).length >= MAX_HABITS;

    const openCreate = () => {
        if (atHabitCap) { notify(`Max. ${MAX_HABITS} Habits erreicht.${hasRoutineStone ? " (inkl. Routine-Stein +1)" : ""}`, "warning"); return; }
        setCreateSeed(null);
        setShowCreate(true); onModalOpen?.();
    };
    const closeCreate = () => { setShowCreate(false); setCreateSeed(null); onHabitDraftHandled?.(); onModalClose?.(); };
    const openEdit = (habit) => { setEditingHabit(habit); onModalOpen?.(); };
    const closeEdit = () => { setEditingHabit(null); onModalClose?.(); };

    useEffect(() => {
        if (!habitDraft) {
            handledDraftRef.current = null;
            return;
        }
        const draftKey = habitDraft.sourceQuestId || habitDraft.title;
        if (handledDraftRef.current === draftKey) return;
        handledDraftRef.current = draftKey;

        if (atHabitCap) {
            notify(`Max. ${MAX_HABITS} Habits erreicht.${hasRoutineStone ? " (inkl. Routine-Stein +1)" : ""}`, "warning");
            onHabitDraftHandled?.();
            return;
        }

        setCreateSeed(habitDraft);
        setShowCreate(true);
        onModalOpen?.();
    }, [habitDraft, atHabitCap, MAX_HABITS, hasRoutineStone, notify, onModalOpen, onHabitDraftHandled]);

    const todayHabits = habits.filter(h => {
        if (!h.active) return false;
        if (filter !== "all" && h.category !== filter) return false;
        const day = new Date().getDay();
        if (h.frequency === "weekday" && (day === 0 || day === 6)) return false;
        if (h.frequency === "weekend" && day > 0 && day < 6) return false;
        return true;
    });

    const completedToday = todayHabits.filter(h => h.history?.[today]?.completed).length;
    const totalToday = todayHabits.length;
    const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    const completeHabit = useCallback((habitId) => {
        const updated = habits.map(h => {
            if (h.id !== habitId) return h;
            const wasCompletedYesterday = (() => {
                return h.history?.[getYesterdayKey()]?.completed;
            })();
            const newStreak = wasCompletedYesterday ? (h.currentStreak || 0) + 1 : 1;
            return {
                ...h,
                currentStreak: newStreak,
                bestStreak: Math.max(h.bestStreak || 0, newStreak),
                totalCompletions: (h.totalCompletions || 0) + 1,
                scheduledDays: (h.scheduledDays || 0) + (h.history?.[today]?.scheduled ? 0 : 1),
                history: { ...h.history, [today]: { completed: true, completedAt: new Date().toISOString() } },
            };
        });

        const habit = habits.find(h => h.id === habitId);
        const updatedHabit = updated.find(h => h.id === habitId);
        const baseXp = habit?.verification === "timer" ? 15 : habit?.verification === "counter" ? 12 : 8;
        const streakBonus = Math.min((updatedHabit?.currentStreak || 0), 10);
        const xpGain = baseXp + streakBonus;

        const linkedQuestId = habit?.linkedQuestId;
        const updatedQuests = state.quests ? state.quests.map(q => {
            if (q.id === linkedQuestId && !q.completed) return { ...q, completed: true, completedAt: today };
            return q;
        }) : state.quests;

        persist(calculateLevelUp({ ...state, habits: updated, quests: updatedQuests }, xpGain));
        setCelebration({ habit: updatedHabit, xpGain, streak: updatedHabit?.currentStreak || 1 });
    }, [habits, state, persist, today]);

    const updateCounter = useCallback((habitId, value) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const updated = habits.map(h => {
            if (h.id !== habitId) return h;
            const reachedTarget = value >= h.targetCount;
            if (reachedTarget && !h.history?.[today]?.completed) {
                const wasCompletedYesterday = (() => {
                    return h.history?.[getYesterdayKey()]?.completed;
                })();
                const newStreak = wasCompletedYesterday ? (h.currentStreak || 0) + 1 : 1;
                return {
                    ...h,
                    currentStreak: newStreak,
                    bestStreak: Math.max(h.bestStreak || 0, newStreak),
                    totalCompletions: (h.totalCompletions || 0) + 1,
                    history: { ...h.history, [today]: { completed: true, counterValue: value, completedAt: new Date().toISOString() } },
                };
            }
            return { ...h, history: { ...h.history, [today]: { ...(h.history?.[today] || {}), counterValue: value } } };
        });
        const habitObj = habits.find(h => h.id === habitId);
        const xpToGain = (value >= habitObj.targetCount && !habitObj.history?.[today]?.completed) ? 12 : 0;

        const linkedQuestId = habitObj?.linkedQuestId;
        const updatedQuests = (value >= habitObj.targetCount && state.quests) ? state.quests.map(q => {
            if (q.id === linkedQuestId && !q.completed) return { ...q, completed: true, completedAt: today };
            return q;
        }) : state.quests;

        persist(calculateLevelUp({ ...state, habits: updated, quests: updatedQuests }, xpToGain));
        if (value >= habit.targetCount && !habit.history?.[today]?.completed) {
            const done = updated.find(h => h.id === habitId);
            setCelebration({ habit: done, xpGain: xpToGain, streak: done?.currentStreak || 1 });
        }
    }, [habits, state, persist, today]);

    const HABIT_TO_QUEST_CATEGORY = { fitness: "str", learning: "int", health: "vit", productivity: "agi", social: "cha", mindfulness: "vit" };

    const createHabit = useCallback((newHabit) => {
        let quest = null;
        let updatedQuests = state.quests || [];
        if (newHabit.linkToExistingQuestId) {
            newHabit.linkedQuestId = newHabit.linkToExistingQuestId;
            updatedQuests = updatedQuests.map(q => {
                if (q.id === newHabit.linkToExistingQuestId) {
                    return { ...q, linkedHabitId: newHabit.id };
                }
                return q;
            });
            delete newHabit.linkToExistingQuestId;
        } else if (newHabit.frequency === "daily" || newHabit.frequency === "weekly") {
            const questId = genId();
            newHabit.linkedQuestId = questId;
            let timeLimit = undefined;
            if (newHabit.frequency === "weekly") {
                const d = new Date();
                const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
                d.setDate(d.getDate() + daysUntilMonday); d.setHours(23, 59, 59, 999);
                timeLimit = d.toISOString();
            }
            quest = {
                id: questId, title: newHabit.title, category: HABIT_TO_QUEST_CATEGORY[newHabit.category] || "str", difficulty: "normal",
                type: newHabit.frequency, createdAt: getToday(), createdAtMs: Date.now(),
                linkedHabitId: newHabit.id,
                ...(timeLimit ? { timeLimit } : {})
            };
            updatedQuests = [...updatedQuests, quest];
        }
        persist({ ...state, habits: [...habits, newHabit], quests: updatedQuests });
        notify(`Neuer Habit: "${newHabit.title}" erstellt!`, "info");
    }, [state, persist, notify, habits]);

    const editHabit = useCallback((updatedHabit) => {
        persist({ ...state, habits: habits.map(h => h.id === updatedHabit.id ? updatedHabit : h) });
        notify(`Habit "${updatedHabit.title}" aktualisiert!`, "info");
    }, [habits, state, persist, notify]);

    const deleteHabit = useCallback((habitId) => {
        if (window.confirm("Habit wirklich löschen? Historie geht verloren.")) {
            persist({ ...state, habits: habits.filter(h => h.id !== habitId) });
            notify("Habit gelöscht.", "warning");
        }
    }, [habits, state, persist, notify]);

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {celebration && <HabitCompleteCelebration data={celebration} onClose={() => setCelebration(null)} />}
            {showCreate && <CreateHabitModal onClose={closeCreate} onSave={createHabit} initialValues={createSeed} theme={theme} />}
            {editingHabit && <CreateHabitModal onClose={closeEdit} onSave={editHabit} initialHabit={editingHabit} theme={theme} />}

            {/* Header with progress */}
            <div style={{
                background: `linear-gradient(135deg, rgba(10,10,22,0.9) 0%, rgba(10,10,22,0.4) 100%), url(${BACKGROUNDS.habitBanner})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: "overlay",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 18, padding: "18px 20px", marginBottom: 14,
                backdropFilter: "blur(16px)",
                position: "relative", overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
                {/* Grid pattern at top */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%", backgroundImage: `linear-gradient(${theme?.primary || "#22d3ee"}06 1px, transparent 1px), linear-gradient(90deg, ${theme?.primary || "#22d3ee"}06 1px, transparent 1px)`, backgroundSize: "20px 20px", pointerEvents: "none", maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 9, letterSpacing: 3, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>HABIT TRACKER</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif" }}>{completedToday}/{totalToday} heute erledigt</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 9, color: atHabitCap ? "#f59e0b" : "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
                                    {habits.filter(h => h.active !== false).length}/{MAX_HABITS} Slots
                                </span>
                                {hasRoutineStone && (
                                    <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 5, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>
                                        R +1
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{
                            width: 54, height: 54, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: completionPct === 100 ? "#22c55e18" : `${theme?.primary || "#22d3ee"}12`,
                            border: `2px solid ${completionPct === 100 ? "#22c55e55" : (theme?.primary || "#22d3ee") + "33"}`,
                            boxShadow: completionPct === 100 ? "0 0 16px #22c55e33" : `0 0 12px ${theme?.glow || "rgba(34,211,238,0.15)"}`,
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: completionPct === 100 ? "#22c55e" : (theme?.accent || "#67e8f9"), fontFamily: "'Cinzel',serif" }}>
                                {completionPct}%
                            </span>
                        </div>
                    </div>
                    <div style={{ height: 5, background: "rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                            width: `${completionPct}%`, height: "100%", borderRadius: 3,
                            background: completionPct === 100
                                ? "linear-gradient(90deg,#22c55e88,#22c55e)"
                                : `linear-gradient(90deg,${theme?.primary || "#22d3ee"}88,${theme?.primary || "#22d3ee"})`,
                            transition: "width 0.6s ease",
                            boxShadow: `0 0 6px ${completionPct === 100 ? "#22c55e" : theme?.primary || "#22d3ee"}66`,
                        }} />
                    </div>
                </div>
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[{ key: "all", label: "Alle", icon: "📋", iconSrc: NAV_ICONS.dashboard, color: theme?.accent || "#67e8f9" }, ...HABIT_CATEGORIES].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, flexShrink: 0,
                        background: filter === f.key ? f.color + "22" : "transparent",
                        color: filter === f.key ? f.color : "#475569",
                        border: `1px solid ${filter === f.key ? f.color + "55" : "#1e2940"}`,
                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: filter === f.key ? `0 0 8px ${f.color}22` : "none",
                    }}>
                        {f.iconSrc ? <img src={f.iconSrc} alt={f.label} style={{ width: 10, height: 10, objectFit: "contain", verticalAlign: "middle", marginRight: 2, filter: filter === f.key ? `drop-shadow(0 0 3px ${f.color}88)` : "brightness(0.7)" }} /> : f.icon} {f.label}
                    </button>
                ))}
            </div>

            {/* Habit list */}
            {todayHabits.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "48px 24px",
                    background: `radial-gradient(ellipse at 50% 0%, ${theme?.primary || "#22d3ee"}08, ${theme?.card || "rgba(10,10,22,0.88)"} 70%)`,
                    borderRadius: 16, border: `1px dashed ${theme?.primary || "#22d3ee"}22`,
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ marginBottom: 12, animation: "float 3s ease-in-out infinite" }}><img src={HABIT_ICONS.manual} alt="Habits" style={{ width: 52, height: 52, objectFit: "contain", opacity: 0.3, filter: `drop-shadow(0 0 12px ${theme?.primary || "#22d3ee"}44)` }} /></div>
                        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>Keine Habits vorhanden</div>
                        <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>Erstelle deine erste Gewohnheit</div>
                        <button onClick={openCreate} style={{
                            padding: "10px 24px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                            background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                            color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, cursor: "pointer",
                        }}>✦ HABIT ERSTELLEN ✦</button>
                    </div>
                </div>
            ) : (
                <>
                    {todayHabits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            todayLog={habit.history?.[today]}
                            onComplete={completeHabit}
                            onCounterUpdate={updateCounter}
                            onEdit={openEdit}
                            onDelete={deleteHabit}
                            theme={theme}
                        />
                    ))}
                </>
            )}

            {/* Add button */}
            {todayHabits.length > 0 && (
                <button onClick={openCreate} style={{
                    width: "100%", padding: 13, borderRadius: 14, fontSize: 11, fontWeight: 700,
                    background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}10,transparent)`,
                    color: theme?.accent || "#67e8f9",
                    border: `1px dashed ${theme?.primary || "#22d3ee"}30`,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2,
                    cursor: "pointer", marginTop: 8, transition: "all 0.2s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${theme?.primary || "#22d3ee"}18,transparent)`; e.currentTarget.style.borderColor = `${theme?.primary || "#22d3ee"}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${theme?.primary || "#22d3ee"}10,transparent)`; e.currentTarget.style.borderColor = `${theme?.primary || "#22d3ee"}30`; }}
                >
                    + NEUER HABIT
                </button>
            )}
        </div>
    );
}
