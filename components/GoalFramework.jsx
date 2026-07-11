import React, { useState, useCallback, useRef, useEffect } from "react";
import { genId, calculateLevelUp } from '../data/constants';
import { HABIT_ICONS, NAV_ICONS, STAT_ICONS, STORY_ICONS } from '../data/icons.js';
import { getToday } from '../data/dateUtils.js';
import { useI18n } from './i18n/I18nProvider.jsx';

// ═══════════════════════════════════════════════════════════════
// GOAL FRAMEWORK – Overarching Goals with Milestones
// ═══════════════════════════════════════════════════════════════

const GOAL_CATEGORIES = [
    { key: "fitness", icon: "💪", iconSrc: HABIT_ICONS.fitness, label: "Fitness", color: "#ef4444" },
    { key: "learning", icon: "📖", iconSrc: STAT_ICONS.int, label: "Lernen", color: "#3b82f6" },
    { key: "health", icon: "🧘", iconSrc: HABIT_ICONS.health, label: "Gesundheit", color: "#22c55e" },
    { key: "productivity", icon: "⚡", iconSrc: STAT_ICONS.agi, label: "Produktiv", color: "#f59e0b" },
    { key: "social", icon: "👥", iconSrc: STAT_ICONS.cha, label: "Sozial", color: "#a855f7" },
];

// ── Goal Path Card (Etappen-Pfad, Redesign 07/2026) ─────────
// Jedes Ziel als sichtbare Reise: erledigte Meilensteine gefüllt, der nächste
// pulsiert und trägt das HEUTE-Badge, wenn die tägliche Ziel-Quest auf ihn zeigt.
// Abschluss der nächsten Etappe per 2-Tap (Inline-Confirm-Chip, 3s-Fenster).
function GoalPathCard({ goal, todayQuestMilestoneId, onCompleteMilestone, onEdit, onDelete, onGenerateQuest, theme }) {
    const { t } = useI18n();
    const [confirmingId, setConfirmingId] = useState(null);
    const confirmTimer = useRef(null);
    useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);

    const cat = GOAL_CATEGORIES.find(c => c.key === goal.category) || GOAL_CATEGORIES[0];
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    const totalMilestones = goal.milestones.length;
    const isGoalCompleted = totalMilestones > 0 && completedMilestones === totalMilestones;
    const nextIndex = goal.milestones.findIndex(m => !m.completed);
    const accent = isGoalCompleted ? "#22c55e" : cat.color;

    const daysLeft = goal.deadline
        ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 3600 * 24))
        : null;

    const tapNextMilestone = (m) => {
        if (confirmingId === m.id) {
            if (confirmTimer.current) clearTimeout(confirmTimer.current);
            setConfirmingId(null);
            onCompleteMilestone(goal.id, m.id, true);
        } else {
            setConfirmingId(m.id);
            if (confirmTimer.current) clearTimeout(confirmTimer.current);
            confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000);
        }
    };

    return (
        <div
            style={{
                background: isGoalCompleted
                    ? "rgba(34,197,94,0.05)"
                    : `radial-gradient(ellipse at 10% 0%, ${cat.color}0b 0%, ${theme?.card || "rgba(10,12,24,0.92)"} 60%)`,
                border: `1px solid ${accent}26`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 18, padding: "18px 18px 14px", marginBottom: 12,
                backdropFilter: "blur(12px)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
        >
            {/* Top shine edge */}
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`, pointerEvents: "none" }} />

            {/* Header: Icon · Titel · Zähler/Deadline */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: goal.description ? 6 : 14 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${accent}15`, border: `1px solid ${accent}44`, flexShrink: 0, overflow: "hidden",
                }}>
                    {isGoalCompleted ? <img src={STORY_ICONS.arise} alt="" style={{ width: 24, height: 24, objectFit: "contain", filter: "drop-shadow(0 0 6px #22c55e88)" }} /> : cat.iconSrc ? (
                        <img src={cat.iconSrc} alt={cat.label} style={{ width: 26, height: 26, objectFit: "contain", filter: `brightness(1.1) drop-shadow(0 0 5px ${cat.color}55)` }} />
                    ) : <span style={{ fontSize: 20 }}>{cat.icon}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isGoalCompleted ? "#86efac" : "#fff", fontFamily: "'Outfit',sans-serif", lineHeight: 1.25 }}>
                        {goal.title}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: accent, fontFamily: "'JetBrains Mono',monospace" }}>{completedMilestones}/{totalMilestones}</span>
                    {isGoalCompleted && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "2px 6px", background: "#22c55e15", borderRadius: 6, border: "1px solid #22c55e44" }}>
                            {t("quests.goalPage.doneBadge")}
                        </span>
                    )}
                    {daysLeft !== null && !isGoalCompleted && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: daysLeft < 7 ? "#ef4444" : "#fbbf24", fontFamily: "'JetBrains Mono',monospace", padding: "2px 6px", background: daysLeft < 7 ? "#ef444418" : "#fbbf2415", borderRadius: 6, border: `1px solid ${daysLeft < 7 ? "#ef444444" : "#fbbf2444"}` }}>
                            {daysLeft}d
                        </span>
                    )}
                </div>
            </div>
            {goal.description && (
                <div style={{ fontSize: 11, color: "#7b8494", lineHeight: 1.4, margin: "0 0 14px 52px" }}>{goal.description}</div>
            )}

            {/* Etappen-Pfad */}
            <div style={{ paddingLeft: 6 }}>
                {goal.milestones.map((m, i) => {
                    const isNext = i === nextIndex;
                    const isConfirming = isNext && confirmingId === m.id;
                    const isToday = isNext && todayQuestMilestoneId === m.id;
                    const isLast = i === goal.milestones.length - 1;
                    return (
                        <div key={m.id} style={{ display: "flex", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                                <div style={{
                                    width: isNext ? 14 : 10, height: isNext ? 14 : 10, borderRadius: 999, flexShrink: 0, marginTop: 4,
                                    background: m.completed ? accent : isNext ? `${accent}22` : "rgba(148,163,184,0.12)",
                                    border: `2px solid ${m.completed || isNext ? accent : "rgba(148,163,184,0.25)"}`,
                                    boxShadow: isNext ? `0 0 10px ${accent}88` : "none",
                                    animation: isNext ? "pulse 2s ease-in-out infinite" : "none",
                                }} />
                                {!isLast && <div style={{ width: 2, flex: 1, minHeight: 16, background: m.completed ? `${accent}55` : "rgba(148,163,184,0.12)" }} />}
                            </div>
                            <div
                                onClick={isNext ? () => tapNextMilestone(m) : undefined}
                                className={isNext ? "press-feedback" : undefined}
                                style={{ paddingBottom: isLast ? 0 : 14, minWidth: 0, flex: 1, cursor: isNext ? "pointer" : "default" }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12.5, fontFamily: "'Outfit',sans-serif", color: m.completed ? "#64748b" : isNext ? "#f1f5f9" : "#7b8494", fontWeight: isNext ? 700 : 500, textDecoration: m.completed ? "line-through" : "none", textDecorationColor: `${accent}55` }}>
                                        {m.title}
                                    </span>
                                    {m.titleReward && !m.completed && (
                                        <span style={{ fontSize: 8, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                            <img src={NAV_ICONS.achievements} alt="" style={{ width: 9, height: 9, objectFit: "contain" }} /> {m.titleReward}
                                        </span>
                                    )}
                                </div>
                                {isNext && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                                        {isConfirming ? (
                                            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#0b0f1a", fontFamily: "'JetBrains Mono',monospace", background: "#34d399", padding: "4px 10px", borderRadius: 8 }}>
                                                {t("quests.goalPage.confirmMilestone")}
                                            </span>
                                        ) : isToday ? (
                                            <span style={{ fontSize: 9, color: "#34d399", fontFamily: "'JetBrains Mono',monospace" }}>◈ {t("quests.goalPage.todayActive")}</span>
                                        ) : (
                                            <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t("quests.goalPage.nextStage")} · +{Math.min(m.xpBonus || 50, 50)} XP</span>
                                        )}
                                        {!isConfirming && !isToday && onGenerateQuest && (
                                            <button onClick={(e) => { e.stopPropagation(); onGenerateQuest(goal, m); }} style={{ fontSize: 8, color: theme?.accent || "#67e8f9", background: "transparent", border: `1px dashed ${theme?.accent || "#67e8f9"}44`, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>
                                                Quest erstellen
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Karten-Aktionen */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                <button
                    onClick={() => onEdit(goal)}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 9, background: "transparent", color: "#64748b", border: "1px solid rgba(148,163,184,0.18)", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}
                >
                    {t("quests.goalPage.edit")}
                </button>
                <button
                    onClick={() => onDelete(goal.id)}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 9, background: "transparent", color: "#7f5b5b", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 1 }}
                >
                    {t("quests.goalPage.delete")}
                </button>
            </div>
        </div>
    );
}

// ── Create Goal Modal ────────────────────────────────────────
function CreateGoalModal({ onClose, onSave, initialGoal, theme, onAISuggest }) {
    const isEdit = !!initialGoal;
    const [title, setTitle] = useState(initialGoal?.title || "");
    const [description, setDescription] = useState(initialGoal?.description || "");
    const [category, setCategory] = useState(initialGoal?.category || "fitness");
    const [deadline, setDeadline] = useState(initialGoal?.deadline || "");
    const [milestones, setMilestones] = useState(initialGoal?.milestones || [
        { id: genId(), title: "", xpBonus: 50, completed: false }
    ]);
    // KI-Zielvorschläge (Paket C): earn-it/Pro-Gating passiert im Handler.
    const [aiState, setAiState] = useState("idle"); // idle | loading | failed
    const [suggestions, setSuggestions] = useState([]);

    const requestSuggestions = async () => {
        if (!onAISuggest || aiState === "loading") return;
        setAiState("loading");
        const result = await onAISuggest();
        if (result && result.length > 0) {
            setSuggestions(result);
            setAiState("idle");
        } else {
            setAiState("failed");
        }
    };

    const adoptSuggestion = (s) => {
        setTitle(s.title);
        setCategory(s.category);
        setMilestones(s.milestones.map(t => ({ id: genId(), title: t, xpBonus: 50, completed: false })));
    };

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
                width: "100%", maxWidth: 500, maxHeight: "92vh",
                background: `linear-gradient(180deg,${theme?.card || "rgba(10,10,22,0.98)"},rgba(4,4,14,0.99))`,
                border: `1px solid ${theme?.primary || "#22d3ee"}33`,
                borderTop: `2px solid ${theme?.primary || "#22d3ee"}`,
                borderRadius: 24, padding: 0,
                position: "relative", overflow: "hidden",
                boxShadow: `0 0 80px ${theme?.glow || "rgba(34,211,238,0.15)"}, 0 24px 60px rgba(0,0,0,0.8)`,
                display: "flex", flexDirection: "column"
            }}>
                {/* Grid overlay */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", backgroundImage: `linear-gradient(${theme?.primary || "#22d3ee"}07 1px, transparent 1px), linear-gradient(90deg, ${theme?.primary || "#22d3ee"}07 1px, transparent 1px)`, backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse at 50% 0%, black 35%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 35%, transparent 75%)", zIndex: 0 }} />

                <div style={{ position: "relative", zIndex: 1, padding: "24px 24px 10px", flexShrink: 0 }}>
                    {/* Header with diamond decoration */}
                    <div style={{ position: "relative", marginBottom: 10, paddingTop: 4 }}>
                        <div style={{ position: "absolute", top: -6, right: 0, width: 50, height: 50, background: `linear-gradient(135deg, ${theme?.primary || "#22d3ee"}18, transparent)`, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", animation: "breathe 3s ease-in-out infinite", pointerEvents: "none" }} />
                        <div style={{ fontSize: 9, letterSpacing: 4, color: theme?.primary || "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>[ SYSTEM: MAIN QUEST ]</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 1, textShadow: `0 0 24px ${theme?.primary || "#22d3ee"}44` }}>
                            {isEdit ? "Ziel anpassen" : "Neues Ziel setzen"}
                        </div>
                        <div style={{ height: 1, marginTop: 12, background: `linear-gradient(90deg, ${theme?.primary || "#22d3ee"}66, transparent)` }} />
                    </div>
                </div>

                {/* Scrollable Form Content Sub-Component */}
                <div style={{ padding: "0 24px 24px", overflowY: "auto", flex: 1, position: "relative", zIndex: 1 }}>

                    {/* KI-Zielvorschläge */}
                    {!isEdit && onAISuggest && (
                        <div style={{ marginBottom: 14 }}>
                            <button onClick={requestSuggestions} disabled={aiState === "loading"} style={{
                                width: "100%", padding: "10px 0", borderRadius: 12, fontSize: 10, fontWeight: 800, letterSpacing: 2,
                                background: "rgba(99,102,241,0.08)", color: "#a5b4fc", border: "1px solid #6366f133",
                                fontFamily: "'JetBrains Mono',monospace", cursor: aiState === "loading" ? "default" : "pointer",
                            }}>
                                {aiState === "loading" ? "DAS SYSTEM ANALYSIERT..." : "✦ SYSTEM-VORSCHLÄGE ✦"}
                            </button>
                            {aiState === "failed" && (
                                <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, textAlign: "center" }}>Keine Vorschläge verfügbar — definiere dein Ziel manuell.</div>
                            )}
                            {suggestions.length > 0 && (
                                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                                    {suggestions.map((s, i) => {
                                        const cat = GOAL_CATEGORIES.find(c => c.key === s.category) || GOAL_CATEGORIES[0];
                                        return (
                                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: `1px solid ${cat.color}22` }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                                                    <div style={{ fontSize: 9, color: cat.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{cat.label} · {s.milestones.length} Meilensteine</div>
                                                </div>
                                                <button onClick={() => adoptSuggestion(s)} style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: "6px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid #34d39944", fontFamily: "'JetBrains Mono',monospace" }}>ÜBERNEHMEN</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

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
                                {c.iconSrc ? (
                                    <img src={c.iconSrc} alt={c.label} style={{ width: 20, height: 20, objectFit: "contain", filter: category === c.key ? `drop-shadow(0 0 6px ${c.color}88)` : "brightness(0.7)" }} />
                                ) : (
                                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                                )}
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
export default function GoalFramework({ state, persist, notify, theme, onModalOpen, onModalClose, onAISuggest, onStartRitual }) {
    const { t } = useI18n();
    const [showCreate, setShowCreate] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const goals = state?.goals || [];

    // Heutige Ziel-Quest → Meilenstein-Badge im Pfad
    const todayMilestoneByGoal = {};
    (state?.quests || []).forEach(q => {
        if (q.type === "goal" && !q.completed && q.linkedGoalId && q.linkedMilestoneId) {
            todayMilestoneByGoal[q.linkedGoalId] = q.linkedMilestoneId;
        }
    });

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
            notify(`Meilenstein erreicht! +${xpGain} XP`, "success");
            if (ms.titleReward) {
                notify(`Titel freigeschaltet: ${ms.titleReward}`, "info");
            }
            const allDone = goal.milestones.every(m => m.completed);
            if (allDone) {
                setTimeout(() => notify(`ZIEL ERREICHT: ${goal.title}`, "success"), 1500);
            }
        }

        persist(calculateLevelUp({
            ...state,
            goals: updatedGoals
        }, xpGain));
    }, [state, goals, persist, notify]);

    const activeGoals = goals.filter(g => !g.milestones.every(m => m.completed));
    const completedGoals = goals.filter(g => g.milestones.every(m => m.completed));

    const handleGenerateQuest = useCallback((goal, milestone) => {
        // Find out if already generated
        const existingQuest = state?.quests?.find(q => q.linkedMilestoneId === milestone.id);
        if (existingQuest) {
            notify("Quest für diesen Meilenstein existiert bereits!", "warning");
            return;
        }

        const newQuest = {
            id: genId(), title: `[${goal.title}] ${milestone.title}`, difficulty: "normal",
            category: goal.category === "fitness" ? "str" : goal.category === "health" ? "vit" : goal.category === "learning" ? "int" : goal.category === "productivity" ? "agi" : "cha",
            type: "side", createdAt: getToday(),
            linkedGoalId: goal.id, linkedMilestoneId: milestone.id, isSystem: true,
            xpMult: 2, goldMult: 1.5 // Goals give bonus xp
        };
        persist({ ...state, quests: [...(state.quests || []), newQuest] });
        notify(`Quest generiert: ${newQuest.title}`, "success");
    }, [state, persist, notify]);

    return (
        <div data-tutorial="goals-view" style={{ animation: "fadeIn 0.35s ease" }}>
            {showCreate && <CreateGoalModal onClose={closeCreate} onSave={handleCreate} theme={theme} onAISuggest={onAISuggest} />}
            {editingGoal && <CreateGoalModal onClose={closeEdit} onSave={handleEdit} initialGoal={editingGoal} theme={theme} />}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 9, letterSpacing: 4, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{t("quests.goalPage.eyebrow")}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${theme?.primary || "#22d3ee"}33` }}>{t("quests.goalPage.title")}</div>
                </div>
                <button
                    onClick={openCreate}
                    data-tutorial="goal-create"
                    aria-label="Neues Ziel erstellen"
                    style={{
                        width: 38, height: 38, borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                        color: theme?.accent || "#67e8f9",
                        border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                        fontSize: 22, lineHeight: 1, cursor: "pointer",
                        boxShadow: `0 0 18px ${theme?.primary || "#22d3ee"}12`,
                    }}
                >
                    +
                </button>
            </div>

            {activeGoals.length > 0 && (
                <>
                    {/* Statuszeile */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                        {[
                            [t("quests.goalPage.statGoals"), activeGoals.length, theme?.primary || "#22d3ee"],
                            [t("quests.goalPage.statMilestones"), `${activeGoals.reduce((s, g) => s + g.milestones.filter(m => m.completed).length, 0)}/${activeGoals.reduce((s, g) => s + g.milestones.length, 0)}`, "#a78bfa"],
                            [t("quests.goalPage.statDone"), completedGoals.length, "#22c55e"],
                        ].map(([label, value, color]) => (
                            <div key={label} style={{ textAlign: "center", padding: "11px 4px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: `1px solid ${color}22` }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: "'Cinzel',serif" }}>{value}</div>
                                <div style={{ fontSize: 7.5, letterSpacing: 1.5, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        {activeGoals.map(goal => (
                            <GoalPathCard key={goal.id} goal={goal} todayQuestMilestoneId={todayMilestoneByGoal[goal.id]} onCompleteMilestone={handleUpdateMilestone} onEdit={openEdit} onDelete={handleDelete} onGenerateQuest={handleGenerateQuest} theme={theme} />
                        ))}
                    </div>

                    {onStartRitual && (
                        <button onClick={onStartRitual} style={{
                            width: "100%", padding: "11px 0", marginBottom: 20, borderRadius: 12, fontSize: 10, fontWeight: 800, letterSpacing: 2,
                            background: "rgba(99,102,241,0.06)", color: "#818cf8", border: "1px solid #6366f126",
                            fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                        }}>
                            ✦ {t("quests.goalPage.ritualShort")}
                        </button>
                    )}
                </>
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
                        <div style={{ marginBottom: 12, animation: "float 3s ease-in-out infinite" }}><img src={NAV_ICONS.goals} alt="Goals" style={{ width: 48, height: 48, objectFit: "contain", filter: `drop-shadow(0 0 12px ${theme?.primary || "#22d3ee"}44) brightness(1.1)` }} /></div>
                        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "'Cinzel',serif", marginBottom: 8, letterSpacing: 1 }}>{t("quests.goalPage.emptyTitle")}</div>
                        <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 16 }}>
                            {t("quests.goalPage.emptyHint")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                            {onStartRitual && (
                                <button onClick={onStartRitual} style={{
                                    padding: "12px 28px", borderRadius: 12, fontSize: 12, fontWeight: 800,
                                    background: "linear-gradient(135deg,#6366f126,#6366f112)",
                                    color: "#a5b4fc", border: "1px solid #6366f144",
                                    fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 2,
                                }}>
                                    ✦ {t("quests.goalPage.ritualStart")} ✦
                                </button>
                            )}
                            <button onClick={openCreate} data-tutorial="goal-create" style={{
                                padding: "10px 24px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                                background: `linear-gradient(135deg,${theme?.primary || "#22d3ee"}22,transparent)`,
                                color: theme?.accent || "#67e8f9", border: `1px solid ${theme?.primary || "#22d3ee"}44`,
                                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", letterSpacing: 2,
                            }}>
                                ✦ {t("quests.goalPage.createDirect")} ✦
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {completedGoals.length > 0 && (
                <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,#22c55e33)" }} />
                        {t("quests.goalPage.completedSection")}
                        <div style={{ height: 1, flex: 1, background: "linear-gradient(270deg,transparent,#22c55e33)" }} />
                    </div>
                    {completedGoals.map(goal => (
                        <GoalPathCard key={goal.id} goal={goal} onCompleteMilestone={handleUpdateMilestone} onEdit={openEdit} onDelete={handleDelete} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
}
