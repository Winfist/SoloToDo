import React, { useState, useCallback, useEffect, useRef } from "react";
import { calculateLevelUp } from "../data/constants";

// ═══════════════════════════════════════════════════════════════
// HABIT TRACKER – Recurring Habits with per-Habit Streaks & Timer
// ═══════════════════════════════════════════════════════════════

const HABIT_CATEGORIES = [
    { key: "fitness", icon: "💪", label: "Fitness", color: "#ef4444" },
    { key: "learning", icon: "📖", label: "Lernen", color: "#3b82f6" },
    { key: "health", icon: "🧘", label: "Gesundheit", color: "#22c55e" },
    { key: "productivity", icon: "⚡", label: "Produktivität", color: "#f59e0b" },
    { key: "social", icon: "👥", label: "Soziales", color: "#a855f7" },
    { key: "mindfulness", icon: "🧠", label: "Achtsamkeit", color: "#06b6d4" },
];

const FREQUENCY_OPTIONS = [
    { key: "daily", label: "Täglich", icon: "📅" },
    { key: "weekday", label: "Mo-Fr", icon: "🏢" },
    { key: "weekend", label: "Sa-So", icon: "☀️" },
    { key: "weekly", label: "Wöchentlich", icon: "📆" },
    { key: "custom", label: "Benutzerdefiniert", icon: "⚙️" },
];

const VERIFICATION_TYPES = [
    { key: "manual", label: "Manuell", icon: "✅", desc: "Selbst bestätigen" },
    { key: "timer", label: "Timer", icon: "⏱️", desc: "Zeitbasiert" },
    { key: "counter", label: "Zähler", icon: "🔢", desc: "Wiederholungen" },
];

function getToday() { return new Date().toISOString().slice(0, 10); }
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
            {/* Circular progress */}
            <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="6" />
                    <circle cx="60" cy="60" r="54" fill="none"
                        stroke={done ? "#22c55e" : (theme?.primary || "#22d3ee")}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                </svg>
                <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        fontSize: 28, fontWeight: 900, color: done ? "#22c55e" : "#fff",
                        fontFamily: "'JetBrains Mono',monospace",
                    }}>
                        {done ? "✓" : `${mm}:${ss}`}
                    </div>
                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                        {done ? "FERTIG" : `/ ${targetMinutes} MIN`}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {!done && (
                    <button
                        onClick={() => setRunning(!running)}
                        style={{
                            padding: "10px 28px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: running ? "rgba(239,68,68,0.15)" : `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                            color: running ? "#ef4444" : (theme?.accent || "#67e8f9"),
                            border: `1px solid ${running ? "#ef444444" : (theme?.primary || "#22d3ee") + "44"}`,
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                        }}
                    >
                        {running ? "⏸ PAUSE" : "▶ START"}
                    </button>
                )}
                {done && (
                    <button
                        onClick={onComplete}
                        style={{
                            padding: "10px 28px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "linear-gradient(135deg,#22c55e22,#22c55e08)",
                            color: "#22c55e",
                            border: "1px solid #22c55e44",
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                            animation: "pulse 2s infinite",
                        }}
                    >
                        ✓ ABSCHLIESSEN
                    </button>
                )}
                {!done && elapsed > 0 && (
                    <button
                        onClick={() => { setElapsed(0); setRunning(false); }}
                        style={{
                            padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "transparent", color: "#475569",
                            border: "1px solid #1e2940",
                            fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                        }}
                    >
                        ↺
                    </button>
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
            <div style={{
                fontSize: 36, fontWeight: 900, color: done ? "#22c55e" : "#fff",
                fontFamily: "'Cinzel',serif", marginBottom: 8,
            }}>
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
function HabitCard({ habit, todayLog, onComplete, onCounterUpdate, theme }) {
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
                background: completed ? "rgba(34,197,94,0.06)" : (theme?.card || "rgba(10,10,22,0.88)"),
                border: `1px solid ${completed ? "#22c55e33" : cat.color + "22"}`,
                borderLeft: `3px solid ${completed ? "#22c55e" : cat.color}`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 10,
                backdropFilter: "blur(8px)",
                transition: "all 0.3s ease",
                cursor: "pointer",
            }}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: completed ? "#22c55e15" : cat.color + "12",
                    border: `1px solid ${completed ? "#22c55e33" : cat.color + "33"}`,
                    fontSize: 22,
                }}>
                    {completed ? "✓" : habit.icon || cat.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: completed ? "#22c55e" : "#e2e8f0",
                        fontFamily: "'Cinzel',serif",
                        textDecoration: completed ? "line-through" : "none",
                        opacity: completed ? 0.7 : 1,
                    }}>
                        {habit.title}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: 8, color: cat.color, padding: "1px 5px", borderRadius: 4,
                            background: cat.color + "15", fontFamily: "'JetBrains Mono',monospace",
                        }}>{cat.icon} {cat.label}</span>
                        {streak > 0 && (
                            <span style={{
                                fontSize: 8, color: "#f59e0b", padding: "1px 5px", borderRadius: 4,
                                background: "#f59e0b15", fontFamily: "'JetBrains Mono',monospace",
                            }}>🔥 {streak}d</span>
                        )}
                        {habit.verification === "timer" && (
                            <span style={{
                                fontSize: 8, color: "#06b6d4", padding: "1px 5px", borderRadius: 4,
                                background: "#06b6d415", fontFamily: "'JetBrains Mono',monospace",
                            }}>⏱️ {habit.targetMinutes}min</span>
                        )}
                        {habit.verification === "counter" && (
                            <span style={{
                                fontSize: 8, color: "#a855f7", padding: "1px 5px", borderRadius: 4,
                                background: "#a855f715", fontFamily: "'JetBrains Mono',monospace",
                            }}>🔢 {todayLog?.counterValue || 0}/{habit.targetCount}</span>
                        )}
                    </div>
                </div>
                {!completed && habit.verification === "manual" && (
                    <button
                        onClick={e => { e.stopPropagation(); onComplete(habit.id); }}
                        style={{
                            padding: "8px 14px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                            background: `linear-gradient(135deg,${cat.color}22,transparent)`,
                            color: cat.color, border: `1px solid ${cat.color}44`,
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                        }}
                    >
                        DONE
                    </button>
                )}
            </div>

            {/* Expanded view */}
            {expanded && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {/* Stats row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                        {[
                            { label: "Streak", value: `${streak}d`, color: "#f59e0b" },
                            { label: "Best", value: `${bestStreak}d`, color: "#a855f7" },
                            { label: "Total", value: totalCompletions, color: "#22d3ee" },
                            { label: "Rate", value: `${completionRate}%`, color: completionRate >= 80 ? "#22c55e" : completionRate >= 50 ? "#f59e0b" : "#ef4444" },
                        ].map(s => (
                            <div key={s.label} style={{
                                textAlign: "center", padding: "6px 4px",
                                background: "rgba(255,255,255,0.02)", borderRadius: 8,
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.value}</div>
                                <div style={{ fontSize: 7, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Timer / Counter view */}
                    {!completed && habit.verification === "timer" && (
                        <HabitTimer
                            targetMinutes={habit.targetMinutes}
                            onComplete={() => onComplete(habit.id)}
                            theme={theme}
                        />
                    )}
                    {!completed && habit.verification === "counter" && (
                        <HabitCounter
                            target={habit.targetCount}
                            current={todayLog?.counterValue || 0}
                            onUpdate={(val) => onCounterUpdate(habit.id, val)}
                            theme={theme}
                        />
                    )}

                    {/* 7-day mini heatmap */}
                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>LETZTE 7 TAGE</div>
                        <div style={{ display: "flex", gap: 4 }}>
                            {Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (6 - i));
                                const dateKey = d.toISOString().slice(0, 10);
                                const log = habit.history?.[dateKey];
                                const dayName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
                                return (
                                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 8, color: "#334155", marginBottom: 3, fontFamily: "'JetBrains Mono',monospace" }}>{dayName}</div>
                                        <div style={{
                                            width: "100%", height: 20, borderRadius: 4,
                                            background: log?.completed ? "#22c55e33" : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${log?.completed ? "#22c55e44" : "#1e294022"}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 10, color: log?.completed ? "#22c55e" : "#1e2940",
                                        }}>
                                            {log?.completed ? "✓" : "·"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Create Habit Modal ───────────────────────────────────────
function CreateHabitModal({ onClose, onCreate, theme }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("fitness");
    const [frequency, setFrequency] = useState("daily");
    const [verification, setVerification] = useState("manual");
    const [targetMinutes, setTargetMinutes] = useState(30);
    const [targetCount, setTargetCount] = useState(10);
    const [icon, setIcon] = useState("");

    const cat = HABIT_CATEGORIES.find(c => c.key === category);

    const handleCreate = () => {
        if (!title.trim()) return;
        onCreate({
            id: genId(),
            title: title.trim(),
            category,
            frequency,
            verification,
            targetMinutes: verification === "timer" ? targetMinutes : undefined,
            targetCount: verification === "counter" ? targetCount : undefined,
            icon: icon || cat?.icon || "📋",
            createdAt: getToday(),
            currentStreak: 0,
            bestStreak: 0,
            totalCompletions: 0,
            scheduledDays: 0,
            history: {},
            active: true,
        });
        onClose();
    };

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(2,2,10,0.92)", backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeIn 0.25s ease",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto",
                background: `linear-gradient(180deg,${theme?.card || "rgba(10,10,22,0.95)"},rgba(6,6,16,0.99))`,
                border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                borderTop: `2px solid ${theme?.primary || "#22d3ee"}`,
                borderRadius: 24, padding: 24,
                animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
                <div style={{ fontSize: 10, letterSpacing: 4, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>SYSTEM: NEUER HABIT</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 2, marginBottom: 20 }}>Gewohnheit erstellen</div>

                {/* Title */}
                <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 }}>TITEL</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. 30 Minuten Lesen"
                    style={{
                        width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, marginBottom: 16,
                        background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                        color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box",
                    }} />

                {/* Category */}
                <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>KATEGORIE</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
                    {HABIT_CATEGORIES.map(c => (
                        <button key={c.key} onClick={() => setCategory(c.key)} style={{
                            padding: "8px 4px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                            background: category === c.key ? c.color + "22" : "transparent",
                            color: category === c.key ? c.color : "#475569",
                            border: `1px solid ${category === c.key ? c.color + "55" : "#1e2940"}`,
                            fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                        }}>
                            <span style={{ fontSize: 16 }}>{c.icon}</span>
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
                        }}>
                            {f.icon} {f.label}
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
                        }}>
                            <span style={{ fontSize: 16 }}>{v.icon}</span>
                            <span>{v.label}</span>
                            <span style={{ fontSize: 7, opacity: 0.6 }}>{v.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Timer target */}
                {verification === "timer" && (
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>ZIELZEIT (MINUTEN)</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            {[5, 10, 15, 20, 30, 45, 60, 90].map(m => (
                                <button key={m} onClick={() => setTargetMinutes(m)} style={{
                                    flex: 1, padding: "8px 2px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                                    background: targetMinutes === m ? "#06b6d422" : "transparent",
                                    color: targetMinutes === m ? "#22d3ee" : "#475569",
                                    border: `1px solid ${targetMinutes === m ? "#06b6d455" : "#1e2940"}`,
                                    fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
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
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                                background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                                color: "#fff", outline: "none", fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box",
                            }} />
                    </div>
                )}

                {/* Create button */}
                <button onClick={handleCreate} disabled={!title.trim()} style={{
                    width: "100%", padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 900,
                    background: title.trim() ? `linear-gradient(135deg,${theme?.primary || "#22d3ee"},${theme?.secondary || "#a855f7"})` : "rgba(15,15,30,0.6)",
                    color: title.trim() ? "#fff" : "#334155",
                    letterSpacing: 3, fontFamily: "'Cinzel',serif",
                    boxShadow: title.trim() ? `0 8px 32px ${theme?.glow || "rgba(34,211,238,0.35)"}` : "none",
                    cursor: title.trim() ? "pointer" : "not-allowed", border: "none",
                }}>
                    ✦ HABIT ERSTELLEN ✦
                </button>
            </div>
        </div>
    );
}

// ═══ MAIN COMPONENT ══════════════════════════════════════════
export default function HabitTracker({ state, persist, notify, theme }) {
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState("all");
    const habits = state?.habits || [];
    const today = getToday();

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
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return h.history?.[yesterday.toISOString().slice(0, 10)]?.completed;
            })();
            const newStreak = wasCompletedYesterday ? (h.currentStreak || 0) + 1 : 1;
            return {
                ...h,
                currentStreak: newStreak,
                bestStreak: Math.max(h.bestStreak || 0, newStreak),
                totalCompletions: (h.totalCompletions || 0) + 1,
                scheduledDays: (h.scheduledDays || 0) + (h.history?.[today]?.scheduled ? 0 : 1),
                history: {
                    ...h.history,
                    [today]: { completed: true, completedAt: new Date().toISOString() },
                },
            };
        });

        // XP reward for habit completion
        const habit = habits.find(h => h.id === habitId);
        const baseXp = habit?.verification === "timer" ? 15 : habit?.verification === "counter" ? 12 : 8;
        const streakBonus = Math.min((habit?.currentStreak || 0), 10);
        const xpGain = baseXp + streakBonus;

        persist(calculateLevelUp({
            ...state,
            habits: updated
        }, xpGain));
        notify(`Habit erledigt! +${xpGain} XP 🔥 Streak: ${(updated.find(h => h.id === habitId)?.currentStreak || 1)}`, "success");
    }, [habits, state, persist, notify, today]);

    const updateCounter = useCallback((habitId, value) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const updated = habits.map(h => {
            if (h.id !== habitId) return h;
            const reachedTarget = value >= h.targetCount;
            if (reachedTarget && !h.history?.[today]?.completed) {
                // Auto-complete when target reached
                const wasCompletedYesterday = (() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return h.history?.[yesterday.toISOString().slice(0, 10)]?.completed;
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
            return {
                ...h,
                history: { ...h.history, [today]: { ...(h.history?.[today] || {}), counterValue: value } },
            };
        });
        const habitObj = habits.find(h => h.id === habitId);
        const xpToGain = (value >= habitObj.targetCount && !habitObj.history?.[today]?.completed) ? 12 : 0;
        
        persist(calculateLevelUp({
            ...state,
            habits: updated
        }, xpToGain));
        if (value >= habit.targetCount && !habit.history?.[today]?.completed) {
            notify(`Ziel erreicht! 🎯 +12 XP`, "success");
        }
    }, [habits, state, persist, notify, today]);

    const createHabit = useCallback((newHabit) => {
        persist({ ...state, habits: [...(state.habits || []), newHabit] });
        notify(`Neuer Habit: "${newHabit.title}" erstellt!`, "info");
    }, [state, persist, notify]);

    const deleteHabit = useCallback((habitId) => {
        persist({ ...state, habits: habits.filter(h => h.id !== habitId) });
    }, [habits, state, persist]);

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {showCreate && <CreateHabitModal onClose={() => setShowCreate(false)} onCreate={createHabit} theme={theme} />}

            {/* Header with progress */}
            <div style={{
                background: theme?.card || "rgba(10,10,22,0.88)",
                border: `1px solid ${theme?.primary || "#22d3ee"}15`,
                borderRadius: 18, padding: "18px 20px", marginBottom: 14,
                backdropFilter: "blur(12px)",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>HABIT TRACKER</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{completedToday}/{totalToday} heute erledigt</div>
                    </div>
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: completionPct === 100 ? "#22c55e18" : `${theme?.primary || "#22d3ee"}12`,
                        border: `2px solid ${completionPct === 100 ? "#22c55e55" : theme?.primary + "33" || "#22d3ee33"}`,
                    }}>
                        <span style={{
                            fontSize: 16, fontWeight: 900,
                            color: completionPct === 100 ? "#22c55e" : (theme?.accent || "#67e8f9"),
                            fontFamily: "'Cinzel',serif",
                        }}>
                            {completionPct}%
                        </span>
                    </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, background: "#0a0a14", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                        width: `${completionPct}%`, height: "100%", borderRadius: 3,
                        background: completionPct === 100
                            ? "linear-gradient(90deg,#22c55e88,#22c55e)"
                            : `linear-gradient(90deg,${theme?.primary || "#22d3ee"}88,${theme?.primary || "#22d3ee"})`,
                        transition: "width 0.6s ease",
                    }} />
                </div>
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[
                    { key: "all", label: "Alle", color: theme?.accent || "#67e8f9" },
                    ...HABIT_CATEGORIES,
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, flexShrink: 0,
                        background: filter === f.key ? f.color + "22" : "transparent",
                        color: filter === f.key ? f.color : "#475569",
                        border: `1px solid ${filter === f.key ? f.color + "55" : "#1e2940"}`,
                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                    }}>
                        {f.icon || "📋"} {f.label}
                    </button>
                ))}
            </div>

            {/* Habit list */}
            {todayHabits.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "48px 24px",
                    background: theme?.card || "rgba(10,10,22,0.88)",
                    borderRadius: 16, border: `1px dashed ${theme?.primary || "#22d3ee"}22`,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3, animation: "float 3s ease-in-out infinite" }}>🔄</div>
                    <div style={{ fontSize: 14, color: "#475569", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>Keine Habits vorhanden</div>
                    <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>
                        Erstelle deine erste Gewohnheit und tracke deinen Fortschritt
                    </div>
                    <button onClick={() => setShowCreate(true)} style={{
                        padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: theme?.accent || "#67e8f9",
                        border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                    }}>
                        + HABIT ERSTELLEN
                    </button>
                </div>
            ) : (
                <>
                    {todayHabits.map((habit, i) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            todayLog={habit.history?.[today]}
                            onComplete={completeHabit}
                            onCounterUpdate={updateCounter}
                            theme={theme}
                        />
                    ))}
                </>
            )}

            {/* Add button (fixed) */}
            {todayHabits.length > 0 && (
                <button onClick={() => setShowCreate(true)} style={{
                    width: "100%", padding: 14, borderRadius: 14, fontSize: 12, fontWeight: 700,
                    background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}12,transparent)`,
                    color: theme?.accent || "#67e8f9",
                    border: `1px dashed ${theme?.primary || "#22d3ee"}33`,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2,
                    cursor: "pointer", marginTop: 8,
                }}>
                    + NEUER HABIT
                </button>
            )}
        </div>
    );
}
