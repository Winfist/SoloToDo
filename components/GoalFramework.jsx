import React, { useState, useCallback } from "react";
import { genId } from '../data/constants';

// ═══════════════════════════════════════════════════════════════
// GOAL FRAMEWORK – Overarching Goals with Milestones
// ═══════════════════════════════════════════════════════════════

const GOAL_CATEGORIES = [
    { key: "fitness", icon: "💪", label: "Fitness", color: "#ef4444" },
    { key: "learning", icon: "📖", label: "Lernen", color: "#3b82f6" },
    { key: "health", icon: "🧘", label: "Gesundheit", color: "#22c55e" },
    { key: "productivity", icon: "⚡", label: "Produktivität", color: "#f59e0b" },
    { key: "social", icon: "👥", label: "Soziales", color: "#a855f7" },
];

function getToday() { return new Date().toISOString().slice(0, 10); }

// ── Goal Card ────────────────────────────────────────────────
function GoalCard({ goal, onUpdateMilestone, onDelete, theme }) {
    const [expanded, setExpanded] = useState(false);
    const cat = GOAL_CATEGORIES.find(c => c.key === goal.category) || GOAL_CATEGORIES[0];

    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    const totalMilestones = goal.milestones.length;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    const isGoalCompleted = progress === 100;

    const daysLeft = goal.deadline
        ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 3600 * 24))
        : null;

    return (
        <div
            style={{
                background: isGoalCompleted ? "rgba(34,197,94,0.06)" : (theme?.card || "rgba(10,10,22,0.88)"),
                border: `1px solid ${isGoalCompleted ? "#22c55e33" : cat.color + "22"}`,
                borderLeft: `3px solid ${isGoalCompleted ? "#22c55e" : cat.color}`,
                borderRadius: 16, padding: "16px", marginBottom: 12,
                backdropFilter: "blur(8px)", transition: "all 0.3s ease",
                cursor: "pointer",
            }}
            onClick={() => setExpanded(!expanded)}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    background: isGoalCompleted ? "#22c55e15" : cat.color + "15",
                    border: `1px solid ${isGoalCompleted ? "#22c55e44" : cat.color + "44"}`,
                    fontSize: 24, textShadow: `0 0 10px ${cat.color}88`
                }}>
                    {isGoalCompleted ? "👑" : cat.icon}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: isGoalCompleted ? "#22c55e" : "#fff", fontFamily: "'Cinzel',serif", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                            {goal.title}
                        </div>
                        {daysLeft !== null && !isGoalCompleted && (
                            <div style={{ fontSize: 10, fontWeight: 700, color: daysLeft < 7 ? "#ef4444" : "#fbbf24", fontFamily: "'JetBrains Mono',monospace", padding: "3px 6px", background: daysLeft < 7 ? "#ef444422" : "#fbbf2422", borderRadius: 6, border: `1px solid ${daysLeft < 7 ? "#ef444455" : "#fbbf2455"}` }}>
                                {daysLeft}d left
                            </div>
                        )}
                        {isGoalCompleted && (
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "3px 6px", background: "#22c55e22", borderRadius: 6, border: "1px solid #22c55e55" }}>
                                ABGESCHLOSSEN
                            </div>
                        )}
                    </div>

                    {goal.description && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>{goal.description}</div>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: "#0f0f1e", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: isGoalCompleted ? "#22c55e" : `linear-gradient(90deg, ${cat.color}88, ${cat.color})`, transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ fontSize: 10, color: isGoalCompleted ? "#22c55e" : "#64748b", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                            {completedMilestones}/{totalMilestones}
                        </div>
                    </div>
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>MEILENSTEINE</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {goal.milestones.map((m, i) => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: m.completed ? "#22c55e0a" : "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${m.completed ? "#22c55e22" : "transparent"}` }}>
                                <button
                                    onClick={() => onUpdateMilestone(goal.id, m.id, !m.completed)}
                                    style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: m.completed ? "#22c55e" : "transparent", border: `2px solid ${m.completed ? "#22c55e" : "#475569"}`, cursor: "pointer", transition: "all 0.2s" }}
                                >
                                    {m.completed && <span style={{ color: "#000", fontSize: 14, fontWeight: 900 }}>✓</span>}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: m.completed ? 400 : 600, color: m.completed ? "#64748b" : "#e2e8f0", textDecoration: m.completed ? "line-through" : "none" }}>
                                        {m.title}
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        <span style={{ fontSize: 9, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace" }}>+{m.xpBonus} XP</span>
                                        {m.titleReward && <span style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace" }}>🏆 Titel: {m.titleReward}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                        <button
                            onClick={() => onDelete(goal.id)}
                            style={{ padding: "8px 12px", borderRadius: 8, fontSize: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef444433", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
                        >
                            ZIEL LÖSCHEN
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Create Goal Modal ────────────────────────────────────────
function CreateGoalModal({ onClose, onCreate, theme }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("fitness");
    const [deadline, setDeadline] = useState("");
    const [milestones, setMilestones] = useState([
        { id: genId(), title: "", xpBonus: 200, completed: false }
    ]);

    const addMilestone = () => {
        setMilestones([...milestones, { id: genId(), title: "", xpBonus: 200 * (milestones.length + 1), completed: false }]);
    };

    const updateMilestone = (id, field, value) => {
        setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeMilestone = (id) => {
        setMilestones(milestones.filter(m => m.id !== id));
    };

    const handleCreate = () => {
        if (!title.trim() || milestones.some(m => !m.title.trim())) return;

        // Auto-generate title reward for final milestone if not set
        const finalMilestones = [...milestones];
        if (finalMilestones.length > 0 && !finalMilestones[finalMilestones.length - 1].titleReward) {
            finalMilestones[finalMilestones.length - 1].titleReward = `${title.split(" ")[0]} Master`;
        }

        onCreate({
            id: "goal_" + genId(),
            title: title.trim(),
            description: description.trim(),
            category,
            deadline,
            createdAt: getToday(),
            milestones: finalMilestones,
            autoGeneratedQuests: true
        });
        onClose();
    };

    const canCreate = title.trim() && milestones.length > 0 && milestones.every(m => m.title.trim());

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(2,2,10,0.92)", backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeIn 0.25s ease",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
                background: `linear-gradient(180deg,${theme?.card || "rgba(10,10,22,0.95)"},rgba(6,6,16,0.99))`,
                border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                borderTop: `2px solid ${theme?.primary || "#22d3ee"}`,
                borderRadius: 24, padding: 24,
            }}>
                <div style={{ fontSize: 10, letterSpacing: 4, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>MAIN QUEST</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 1, marginBottom: 20 }}>Neues Ziel setzen</div>

                {/* Name & Desc */}
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel des Ziels (z.B. Marathon Laufen)"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, marginBottom: 12, background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`, color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />

                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Warum ist dir das wichtig?" rows={2}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 16, background: "rgba(4,4,12,0.9)", border: "1px solid #1e2940", color: "#cbd5e1", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box", resize: "none" }} />

                {/* Category & Deadline in row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 }}>KATEGORIE</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(4,4,12,0.9)", border: "1px solid #1e2940", color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif" }}>
                            {GOAL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 }}>DEADLINE (Optional)</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(4,4,12,0.9)", border: "1px solid #1e2940", color: "#fff", outline: "none", fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box" }} />
                    </div>
                </div>

                {/* Milestones */}
                <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>MEILENSTEINE</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {milestones.map((m, idx) => (
                        <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: 12, border: "1px solid #1e2940" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1e2940", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#94a3b8" }}>
                                {idx + 1}
                            </div>
                            <input value={m.title} onChange={e => updateMilestone(m.id, "title", e.target.value)} placeholder={`Meilenstein ${idx + 1}...`} style={{ flex: 1, padding: "8px", background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(34,211,238,0.1)", padding: "4px 8px", borderRadius: 8 }}>
                                <span style={{ fontSize: 10, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace" }}>XP</span>
                                <input type="number" value={m.xpBonus} onChange={e => updateMilestone(m.id, "xpBonus", parseInt(e.target.value) || 0)} style={{ width: 40, background: "transparent", border: "none", color: "#22d3ee", fontSize: 12, outline: "none", fontFamily: "'JetBrains Mono',monospace" }} />
                            </div>
                            <button onClick={() => removeMilestone(m.id)} style={{ width: 28, height: 28, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer" }}>✕</button>
                        </div>
                    ))}
                    <button onClick={addMilestone} style={{ padding: "10px", borderRadius: 12, background: "transparent", border: "1px dashed #475569", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                        + MEILENSTEIN HINZUFÜGEN
                    </button>
                </div>

                <button onClick={handleCreate} disabled={!canCreate} style={{
                    width: "100%", padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 900,
                    background: canCreate ? `linear-gradient(135deg,${theme?.primary || "#22d3ee"},${theme?.secondary || "#a855f7"})` : "rgba(15,15,30,0.6)",
                    color: canCreate ? "#fff" : "#334155", letterSpacing: 3, fontFamily: "'Cinzel',serif",
                    cursor: canCreate ? "pointer" : "not-allowed", border: "none",
                }}>
                    ✦ ZIEL BESCHWÖREN ✦
                </button>
            </div>
        </div>
    );
}

// ═══ MAIN COMPONENT ══════════════════════════════════════════
export default function GoalFramework({ state, persist, notify, theme }) {
    const [showCreate, setShowCreate] = useState(false);
    const goals = state?.goals || [];

    const handleCreate = useCallback((newGoal) => {
        persist({ ...state, goals: [...goals, newGoal] });
        notify(`System: Neues Main-Goal "${newGoal.title}" registriert.`, "info");
    }, [state, goals, persist, notify]);

    const handleDelete = useCallback((goalId) => {
        if (window.confirm("Dieses Ziel wirklich aufgeben?")) {
            persist({ ...state, goals: goals.filter(g => g.id !== goalId) });
            notify("Ziel wurde aufgegeben.", "warning");
        }
    }, [state, goals, persist, notify]);

    const handleUpdateMilestone = useCallback((goalId, milestoneId, completed) => {
        const updatedGoals = goals.map(g => {
            if (g.id !== goalId) return g;
            const msOld = g.milestones.find(m => m.id === milestoneId);
            const isNewlyCompleted = completed && !msOld.completed;

            const newMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed } : m);
            return { ...g, milestones: newMilestones };
        });

        const goal = updatedGoals.find(g => g.id === goalId);
        const ms = goal.milestones.find(m => m.id === milestoneId);

        let xpGain = 0;
        if (completed) {
            xpGain = ms.xpBonus;
            notify(`Meilenstein erreicht! +${xpGain} XP ✨`, "success");
            if (ms.titleReward) {
                notify(`Titel freigeschaltet: ${ms.titleReward} 🏆`, "info");
                // We'd add titles here ideally
            }

            const allDone = goal.milestones.every(m => m.completed);
            if (allDone) {
                setTimeout(() => notify(`ZIEL ERREICHT: ${goal.title} 🌟`, "success"), 1500);
            }
        }

        persist({
            ...state,
            goals: updatedGoals,
            xp: state.xp + xpGain,
            totalXpEarned: (state.totalXpEarned || 0) + xpGain,
        });
    }, [state, goals, persist, notify]);

    const activeGoals = goals.filter(g => !g.milestones.every(m => m.completed));
    const completedGoals = goals.filter(g => g.milestones.every(m => m.completed));

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} onCreate={handleCreate} theme={theme} />}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>Main Quests</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Ziele mit Meilensteinen</div>
                </div>
                <button onClick={() => setShowCreate(true)} style={{
                    padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                    color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                }}>
                    + ZIEL SETZEN
                </button>
            </div>

            {activeGoals.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    {activeGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onUpdateMilestone={handleUpdateMilestone} onDelete={handleDelete} theme={theme} />
                    ))}
                </div>
            )}

            {activeGoals.length === 0 && completedGoals.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "48px 24px",
                    background: theme?.card || "rgba(10,10,22,0.88)",
                    borderRadius: 16, border: `1px dashed ${theme?.primary || "#22d3ee"}22`,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🎯</div>
                    <div style={{ fontSize: 14, color: "#475569", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>Keine Ziele definiert</div>
                    <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>
                        Ein guter Hunter kämpft für ein höheres Ziel. Setze dir langfristige Meilensteine.
                    </div>
                    <button onClick={() => setShowCreate(true)} style={{
                        padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                        fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                    }}>
                        SET MAIN QUEST
                    </button>
                </div>
            )}

            {completedGoals.length > 0 && (
                <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, marginTop: 32 }}>ERFOLGREICH BEENDET</div>
                    {completedGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onUpdateMilestone={handleUpdateMilestone} onDelete={handleDelete} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
}
