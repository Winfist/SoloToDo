import React, { useState, useCallback } from "react";
import { genId, calculateLevelUp } from '../data/constants';

// ═══════════════════════════════════════════════════════════════
// GOAL FRAMEWORK – Overarching Goals with Milestones
// ═══════════════════════════════════════════════════════════════

const GOAL_CATEGORIES = [
    { key: "fitness", icon: "💪", label: "Fitness", color: "#ef4444" },
    { key: "learning", icon: "📖", label: "Lernen", color: "#3b82f6" },
    { key: "health", icon: "🧘", label: "Gesundheit", color: "#22c55e" },
    { key: "productivity", icon: "⚡", label: "Produktiv", color: "#f59e0b" },
    { key: "social", icon: "👥", label: "Sozial", color: "#a855f7" },
];

function getToday() { return new Date().toISOString().slice(0, 10); }

// ── Goal Card ────────────────────────────────────────────────
function GoalCard({ goal, onUpdateMilestone, onEdit, onDelete, theme }) {
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
                background: isGoalCompleted
                    ? "rgba(34,197,94,0.06)"
                    : `radial-gradient(ellipse at 10% 40%, ${cat.color}09 0%, ${theme?.card || "rgba(10,10,22,0.92)"} 60%)`,
                border: `1px solid ${isGoalCompleted ? "#22c55e33" : cat.color + "22"}`,
                borderLeft: `3px solid ${isGoalCompleted ? "#22c55e" : cat.color}`,
                borderRadius: 16, padding: "16px", marginBottom: 12,
                backdropFilter: "blur(12px)",
                transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                transform: "perspective(800px) rotateX(0deg) translateZ(0)",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(-1.5deg) translateZ(6px) translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.55), 0 0 20px ${isGoalCompleted ? "#22c55e" : cat.color}22, inset 0 1px 0 rgba(255,255,255,0.07)`;
                e.currentTarget.style.borderColor = isGoalCompleted ? "#22c55e55" : cat.color + "55";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateZ(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = isGoalCompleted ? "#22c55e33" : cat.color + "22";
            }}
            onTouchEnd={e => {
                e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) translateZ(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)";
            }}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Scan-line overlay */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 16, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)", zIndex: 0 }} />
            {/* Top shine edge */}
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${isGoalCompleted ? "#22c55e" : cat.color}66, transparent)`, pointerEvents: "none", zIndex: 2 }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isGoalCompleted ? "#22c55e15" : cat.color + "18",
                        border: `1px solid ${isGoalCompleted ? "#22c55e55" : cat.color + "55"}`,
                        fontSize: 24,
                        boxShadow: `0 0 12px ${isGoalCompleted ? "#22c55e" : cat.color}22`,
                        flexShrink: 0,
                    }}>
                        {isGoalCompleted ? "👑" : cat.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: isGoalCompleted ? "#22c55e" : "#fff", fontFamily: "'Cinzel',serif", textShadow: isGoalCompleted ? "0 0 16px #22c55e44" : "0 2px 4px rgba(0,0,0,0.5)", lineHeight: 1.3 }}>
                                {goal.title}
                            </div>
                            {daysLeft !== null && !isGoalCompleted && (
                                <div style={{ fontSize: 9, fontWeight: 700, color: daysLeft < 7 ? "#ef4444" : "#fbbf24", fontFamily: "'JetBrains Mono',monospace", padding: "3px 6px", background: daysLeft < 7 ? "#ef444422" : "#fbbf2422", borderRadius: 6, border: `1px solid ${daysLeft < 7 ? "#ef444455" : "#fbbf2455"}`, flexShrink: 0 }}>
                                    {daysLeft}d
                                </div>
                            )}
                            {isGoalCompleted && (
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "3px 6px", background: "#22c55e22", borderRadius: 6, border: "1px solid #22c55e55", flexShrink: 0 }}>
                                    ✓ DONE
                                </div>
                            )}
                        </div>

                        {goal.description && (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>{goal.description}</div>
                        )}

                        {/* Progress Bar */}
                        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.4)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: isGoalCompleted ? "#22c55e" : `linear-gradient(90deg, ${cat.color}88, ${cat.color})`, transition: "width 0.5s ease", boxShadow: `0 0 6px ${isGoalCompleted ? "#22c55e" : cat.color}66` }} />
                            </div>
                            <div style={{ fontSize: 9, color: isGoalCompleted ? "#22c55e" : cat.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, flexShrink: 0 }}>
                                {completedMilestones}/{totalMilestones}
                            </div>
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cat.color}18` }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontSize: 9, letterSpacing: 3, color: cat.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>— MEILENSTEINE —</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {goal.milestones.map((m, i) => (
                                <div key={m.id}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: m.completed ? "#22c55e0a" : "rgba(255,255,255,0.025)", borderRadius: 10, border: `1px solid ${m.completed ? "#22c55e22" : cat.color + "12"}`, transition: "transform 0.2s ease, background 0.2s", transform: "translateX(0)", position: "relative", overflow: "hidden" }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.background = m.completed ? "#22c55e10" : `${cat.color}08`; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.background = m.completed ? "#22c55e0a" : "rgba(255,255,255,0.025)"; }}
                                >
                                    {/* Glowing number badge */}
                                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.completed ? "#22c55e22" : `${cat.color}18`, border: `1.5px solid ${m.completed ? "#22c55e88" : cat.color + "55"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: m.completed ? "#22c55e" : cat.color, boxShadow: m.completed ? "0 0 8px #22c55e44" : `0 0 6px ${cat.color}33`, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                                        {m.completed ? "✓" : i + 1}
                                    </div>
                                    <button
                                        onClick={() => onUpdateMilestone(goal.id, m.id, !m.completed)}
                                        style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: m.completed ? "#22c55e" : "transparent", border: `1.5px solid ${m.completed ? "#22c55e" : "#475569"}`, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                                    >
                                        {m.completed && <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>}
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: m.completed ? 400 : 600, color: m.completed ? "#64748b" : "#e2e8f0", textDecoration: m.completed ? "line-through" : "none" }}>
                                            {m.title}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                                            <span style={{ fontSize: 9, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace" }}>+{Math.min(m.xpBonus || 50, 50)} XP</span>
                                            {m.titleReward && <span style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace" }}>🏆 {m.titleReward}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 8 }}>
                            <button
                                onClick={() => onEdit(goal)}
                                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 9, background: `${theme?.primary || "#22d3ee"}12`, color: theme?.primary || "#22d3ee", border: `1px solid ${theme?.primary || "#22d3ee"}33`, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}
                            >
                                BEARBEITEN
                            </button>
                            <button
                                onClick={() => onDelete(goal.id)}
                                style={{ padding: "7px 12px", borderRadius: 8, fontSize: 9, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef444433", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}
                            >
                                LÖSCHEN
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Create Goal Modal ────────────────────────────────────────
function CreateGoalModal({ onClose, onSave, initialGoal, theme }) {
    const isEdit = !!initialGoal;
    const [title, setTitle] = useState(initialGoal?.title || "");
    const [description, setDescription] = useState(initialGoal?.description || "");
    const [category, setCategory] = useState(initialGoal?.category || "fitness");
    const [deadline, setDeadline] = useState(initialGoal?.deadline || "");
    const [milestones, setMilestones] = useState(initialGoal?.milestones || [
        { id: genId(), title: "", xpBonus: 50, completed: false }
    ]);

    const addMilestone = () => {
        if (milestones.length >= 5) return;
        setMilestones([...milestones, { id: genId(), title: "", xpBonus: 50, completed: false }]);
    };

    const updateMilestone = (id, field, value) => {
        setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeMilestone = (id) => {
        setMilestones(milestones.filter(m => m.id !== id));
    };

    const handleSave = () => {
        if (!title.trim() || milestones.some(m => !m.title.trim())) return;

        const finalMilestones = [...milestones];
        if (finalMilestones.length > 0 && !finalMilestones[finalMilestones.length - 1].titleReward && finalMilestones[finalMilestones.length - 1].completedAt == null) {
            finalMilestones[finalMilestones.length - 1].titleReward = `${title.split(" ")[0]} Master`;
        }

        onSave({
            id: initialGoal ? initialGoal.id : "goal_" + genId(),
            title: title.trim(),
            description: description.trim(),
            category,
            deadline,
            createdAt: initialGoal ? initialGoal.createdAt : getToday(),
            milestones: finalMilestones,
            autoGeneratedQuests: true
        });
        onClose();
    };

    const canCreate = title.trim() && milestones.length > 0 && milestones.every(m => m.title.trim());
    const selectedCat = GOAL_CATEGORIES.find(c => c.key === category) || GOAL_CATEGORIES[0];

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(2,2,10,0.95)", backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "fadeIn 0.25s ease",
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "100%", maxWidth: 500, maxHeight: "100dvh", overflowY: "auto",
                background: `linear-gradient(180deg,${theme?.card || "rgba(10,10,22,0.98)"},rgba(4,4,14,0.99))`,
                border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                borderTop: `2px solid ${theme?.primary || "#22d3ee"}`,
                borderRadius: 24, padding: 24,
                position: "relative", overflow: "hidden",
                boxShadow: `0 0 80px ${theme?.glow || "rgba(34,211,238,0.15)"}, 0 24px 60px rgba(0,0,0,0.8)`,
            }}>
                {/* Grid overlay */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", backgroundImage: `linear-gradient(${theme?.primary || "#22d3ee"}07 1px, transparent 1px), linear-gradient(90deg, ${theme?.primary || "#22d3ee"}07 1px, transparent 1px)`, backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse at 50% 0%, black 35%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 35%, transparent 75%)", zIndex: 0 }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Header with diamond decoration */}
                    <div style={{ position: "relative", marginBottom: 20, paddingTop: 4 }}>
                        <div style={{ position: "absolute", top: -6, right: 0, width: 50, height: 50, background: `linear-gradient(135deg, ${theme?.primary || "#22d3ee"}18, transparent)`, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", animation: "breathe 3s ease-in-out infinite", pointerEvents: "none" }} />
                        <div style={{ fontSize: 9, letterSpacing: 4, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>[ SYSTEM: MAIN QUEST ]</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 1, textShadow: `0 0 24px ${theme?.primary || "#22d3ee"}44` }}>
                            {isEdit ? "Ziel anpassen" : "Neues Ziel setzen"}
                        </div>
                        <div style={{ height: 1, marginTop: 12, background: `linear-gradient(90deg, ${theme?.primary || "#22d3ee"}66, transparent)` }} />
                    </div>

                    {/* Title */}
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel des Ziels (z.B. Marathon Laufen)"
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, marginBottom: 12, background: "rgba(4,4,12,0.9)", border: `1px solid ${theme?.primary || "#22d3ee"}33`, color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
                        onFocus={e => { e.target.style.borderColor = theme?.primary || "#22d3ee"; e.target.style.boxShadow = `0 0 16px ${theme?.glow || "rgba(34,211,238,0.2)"}`; }}
                        onBlur={e => { e.target.style.borderColor = `${theme?.primary || "#22d3ee"}33`; e.target.style.boxShadow = "none"; }}
                    />

                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Warum ist dir das wichtig?" rows={2}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 16, background: "rgba(4,4,12,0.9)", border: "1px solid #1e2940", color: "#cbd5e1", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box", resize: "none" }} />

                    {/* Category grid */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>KATEGORIE</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
                        {GOAL_CATEGORIES.map(c => (
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
                                <span style={{ fontSize: 16 }}>{c.icon}</span>
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Deadline */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 }}>DEADLINE (Optional)</label>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: "100%", padding: "10px 16px", borderRadius: 10, background: "rgba(4,4,12,0.9)", border: "1px solid #1e2940", color: "#fff", outline: "none", fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box", marginBottom: 20 }} />

                    {/* Milestones */}
                    <label style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>MEILENSTEINE</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                        {milestones.map((m, idx) => (
                            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.025)", padding: "10px", borderRadius: 12, border: `1px solid ${selectedCat.color}18`, position: "relative", overflow: "hidden" }}>
                                {/* Left accent line */}
                                <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 2, borderRadius: 2, background: `linear-gradient(180deg, transparent, ${selectedCat.color}88, transparent)` }} />
                                {/* Glowing number */}
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${selectedCat.color}18`, border: `1.5px solid ${selectedCat.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: selectedCat.color, boxShadow: `0 0 8px ${selectedCat.color}33`, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                                    {idx + 1}
                                </div>
                                <input value={m.title} onChange={e => updateMilestone(m.id, "title", e.target.value)} placeholder={`Meilenstein ${idx + 1}...`} style={{ flex: 1, padding: "8px", background: "transparent", border: "none", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'Outfit',sans-serif" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${selectedCat.color}12`, padding: "4px 8px", borderRadius: 8 }}>
                                    <span style={{ fontSize: 9, color: selectedCat.color, fontFamily: "'JetBrains Mono',monospace" }}>+50 XP</span>
                                </div>
                                <button onClick={() => removeMilestone(m.id)} style={{ width: 26, height: 26, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕</button>
                            </div>
                        ))}
                        {milestones.length < 5 && (
                            <button onClick={addMilestone} style={{ padding: "10px", borderRadius: 12, background: "transparent", border: `1px dashed ${selectedCat.color}33`, color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = selectedCat.color + "66"; e.currentTarget.style.color = selectedCat.color; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = selectedCat.color + "33"; e.currentTarget.style.color = "#64748b"; }}
                            >
                                + MEILENSTEIN HINZUFÜGEN
                            </button>
                        )}
                    </div>

                    <button onClick={handleSave} disabled={!canCreate} style={{
                        width: "100%", padding: 14, borderRadius: 14, fontSize: 12, fontWeight: 900,
                        background: canCreate ? `linear-gradient(135deg,${theme?.primary || "#22d3ee"},${theme?.secondary || "#a855f7"})` : "rgba(15,15,30,0.6)",
                        color: canCreate ? "#fff" : "#334155", letterSpacing: 3, fontFamily: "'Cinzel',serif",
                        cursor: canCreate ? "pointer" : "not-allowed", border: "none",
                        boxShadow: canCreate ? `0 4px 20px ${theme?.glow || "rgba(34,211,238,0.3)"}` : "none",
                        transition: "all 0.2s",
                    }}
                        onMouseEnter={e => { if (canCreate) e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { if (canCreate) e.currentTarget.style.transform = "none"; }}
                    >
                        ✦ {isEdit ? "SPEICHERN" : "ZIEL BESCHWÖREN"} ✦
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══ MAIN COMPONENT ══════════════════════════════════════════
export default function GoalFramework({ state, persist, notify, theme, onModalOpen, onModalClose, onOpenQuestCreate }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const goals = state?.goals || [];

    const openCreate = () => { setShowCreate(true); onModalOpen?.(); };
    const closeCreate = () => { setShowCreate(false); onModalClose?.(); };
    const openEdit = (goal) => { setEditingGoal(goal); onModalOpen?.(); };
    const closeEdit = () => { setEditingGoal(null); onModalClose?.(); };

    const handleCreate = useCallback((newGoal) => {
        persist({ ...state, goals: [...goals, newGoal] });
        notify(`System: Neues Main-Goal "${newGoal.title}" registriert.`, "info");
    }, [state, goals, persist, notify]);

    const handleEdit = useCallback((updatedGoal) => {
        persist({ ...state, goals: goals.map(g => g.id === updatedGoal.id ? updatedGoal : g) });
        notify(`Ziel "${updatedGoal.title}" aktualisiert.`, "info");
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
            const newMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed, completedAt: completed ? (msOld.completedAt || getToday()) : msOld.completedAt } : m);
            return { ...g, milestones: newMilestones };
        });

        const goal = updatedGoals.find(g => g.id === goalId);
        const msOld = goals.find(g => g.id === goalId).milestones.find(m => m.id === milestoneId);
        const ms = goal.milestones.find(m => m.id === milestoneId);

        let xpGain = 0;
        if (completed && !msOld.completedAt) {
            xpGain = Math.min(msOld.xpBonus || 50, 50);
            notify(`Meilenstein erreicht! +${xpGain} XP ✨`, "success");
            if (ms.titleReward) {
                notify(`Titel freigeschaltet: ${ms.titleReward} 🏆`, "info");
            }
            const allDone = goal.milestones.every(m => m.completed);
            if (allDone) {
                setTimeout(() => notify(`ZIEL ERREICHT: ${goal.title} 🌟`, "success"), 1500);
            }
        }

        persist(calculateLevelUp({
            ...state,
            goals: updatedGoals
        }, xpGain));
    }, [state, goals, persist, notify]);

    const activeGoals = goals.filter(g => !g.milestones.every(m => m.completed));
    const completedGoals = goals.filter(g => g.milestones.every(m => m.completed));

    return (
        <div style={{ animation: "fadeIn 0.35s ease" }}>
            {showCreate && <CreateGoalModal onClose={closeCreate} onSave={handleCreate} theme={theme} />}
            {editingGoal && <CreateGoalModal onClose={closeEdit} onSave={handleEdit} initialGoal={editingGoal} theme={theme} />}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${theme?.primary || "#22d3ee"}33` }}>Main Quests</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ZIELE · MEILENSTEINE</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {onOpenQuestCreate && (
                        <button onClick={onOpenQuestCreate} style={{
                            padding: "9px 13px", borderRadius: 11, fontSize: 10, fontWeight: 700,
                            background: "rgba(239,68,68,0.1)", color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.28)",
                            fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(239,68,68,0.2)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.28)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            ⚔️ QUEST
                        </button>
                    )}
                    <button onClick={openCreate} style={{
                        padding: "9px 14px", borderRadius: 11, fontSize: 10, fontWeight: 700,
                        background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
                        transition: "all 0.2s", whiteSpace: "nowrap",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${theme?.primary || "#22d3ee"}33,${theme?.primary || "#22d3ee"}08)`; e.currentTarget.style.boxShadow = `0 0 14px ${theme?.glow || "rgba(34,211,238,0.2)"}`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`; e.currentTarget.style.boxShadow = "none"; }}
                    >
                        + ZIEL
                    </button>
                </div>
            </div>

            {activeGoals.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    {activeGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onUpdateMilestone={handleUpdateMilestone} onEdit={openEdit} onDelete={handleDelete} theme={theme} />
                    ))}
                </div>
            )}

            {activeGoals.length === 0 && completedGoals.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "48px 24px",
                    background: `radial-gradient(ellipse at 50% 0%, ${theme?.primary || "#22d3ee"}08, ${theme?.card || "rgba(10,10,22,0.88)"} 70%)`,
                    borderRadius: 16, border: `1px dashed ${theme?.primary || "#22d3ee"}22`,
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: 44, marginBottom: 12, animation: "float 3s ease-in-out infinite", filter: `drop-shadow(0 0 12px ${theme?.primary || "#22d3ee"}44)` }}>🎯</div>
                        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "'Cinzel',serif", marginBottom: 8, letterSpacing: 1 }}>Keine Ziele definiert</div>
                        <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>
                            Ein guter Hunter kämpft für ein höheres Ziel.
                        </div>
                        <button onClick={openCreate} style={{
                            padding: "10px 24px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                            background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                            color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                            fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 2,
                        }}>
                            ✦ SET MAIN QUEST ✦
                        </button>
                    </div>
                </div>
            )}

            {completedGoals.length > 0 && (
                <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, marginTop: 32, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,#22c55e33)" }} />
                        ERFOLGREICH BEENDET
                        <div style={{ height: 1, flex: 1, background: "linear-gradient(270deg,transparent,#22c55e33)" }} />
                    </div>
                    {completedGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onUpdateMilestone={handleUpdateMilestone} onEdit={openEdit} onDelete={handleDelete} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
}
