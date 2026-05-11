import React, { useState, useEffect } from "react";
import { DIFFICULTIES, CATEGORIES, QUEST_TYPES_CONFIG } from "../data/gameData.js";
import { getToday as getLocalToday, formatLocalDateTime } from "../data/dateUtils.js";
import GlitchText from "./ui/GlitchText.jsx";

const CornerBracket = ({ pos }) => {
  const styles = {
    tl: { top: -1, left: -1, borderTop: "2px solid", borderLeft: "2px solid", borderRadius: "4px 0 0 0" },
    tr: { top: -1, right: -1, borderTop: "2px solid", borderRight: "2px solid", borderRadius: "0 4px 0 0" },
    bl: { bottom: -1, left: -1, borderBottom: "2px solid", borderLeft: "2px solid", borderRadius: "0 0 0 4px" },
    br: { bottom: -1, right: -1, borderBottom: "2px solid", borderRight: "2px solid", borderRadius: "0 0 4px 0" },
  };
  return (
    <div style={{ position: "absolute", width: 12, height: 12, borderColor: "inherit", ...styles[pos] }} />
  );
};

export default function QuestDetailModal({
  quest,
  theme,
  onClose,
  onComplete,
  onEdit,
  onDelete,
  onCompleteSubQuest,
  onSaveNotes,
  completedQuests = [], // Pass from parent for history
  gameState // NEW: for tactical hints
}) {
  const [notes, setNotes] = useState(quest.notes || "");
  const [activeTab, setActiveTab] = useState("details"); // details, history

  useEffect(() => {
    setNotes(quest.notes || "");
  }, [quest]);

  if (!quest) return null;

  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty) || DIFFICULTIES[0];
  const cat = CATEGORIES.find(c => c.key === quest.category) || CATEGORIES[0];
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;

  const xpGain = Math.round((diff?.xp || 50) * (quest.chainMultiplier || 1) * (typeCfg.xpMult || 1));
  const goldGain = Math.round((diff?.gold || 25) * (quest.chainMultiplier || 1) * (typeCfg.goldMult || 1));

  const isBoss = quest.difficulty === 'boss';
  const isSystemQuest = quest.isSystem === true;

  const subQuests = quest.subQuests || [];
  const completedSubs = subQuests.filter(sq => sq.completed).length;
  const allSubsDone = subQuests.length > 0 && completedSubs === subQuests.length;

  const todayKey = getLocalToday();
  const isOverdue = quest.dueDate && quest.dueDate < todayKey && !quest.completed;
  const isDueToday = quest.dueDate === todayKey;

  // --- TACTICAL HINTS GENERATION ---
  const hints = [];
  if (gameState && activeTab === "details") {
    const questsToday = (gameState.completedQuests || []).filter(q => q.completedAt === todayKey).length;
    const habitsToday = (gameState.habits || []).filter(h => h.history?.[todayKey]?.completed).length;

    // 1. Streak Warning
    if (gameState.streak >= 3 && questsToday === 0 && habitsToday === 0 && !quest.completed) {
      hints.push({
        type: "warning",
        color: "#f59e0b",
        title: "STREAK IN GEFAHR",
        text: `Du hast heute noch nichts erreicht. Dein ${gameState.streak}-Tage Streak endet, wenn du diese Quest ignorierst!`,
        icon: "⚠️"
      });
    }

    // 2. Late Night Warning
    const hour = new Date().getHours();
    if (hour >= 21 && quest.energy === "deep" && !quest.completed) {
      hints.push({
        type: "danger",
        color: "#ef4444",
        title: "ZEIT/ENERGIE WARNUNG",
        text: "Es ist nach 21 Uhr. Bist du sicher, dass du noch die nötige Ausdauer für eine so tiefgreifende Aufgabe hast?",
        icon: "🌙"
      });
    }

    // 3. Stat Advantage
    const catStat = gameState.stats?.[quest.category] || 0;
    // Only show stat advantage if there is no urgent warning
    if (hints.length === 0 && catStat >= 10 && !isBoss && !quest.completed) {
      hints.push({
        type: "success",
        color: "#22c55e",
        title: "SYSTEM ANALYSE",
        text: `Deine ${cat.stat} (Level ${catStat}) ist überlegen. Diese Aufgabe sollte ein Leichtes für dich sein.`,
        icon: "📊"
      });
    }
  }

  // History calculation
  const history = completedQuests.filter(cq => cq.id.startsWith(quest.id.split('_')[0]) || cq.title === quest.title).slice(0, 5);
  const avgRating = history.length > 0
    ? (history.reduce((acc, cq) => acc + (cq.rating || 0), 0) / history.filter(cq => cq.rating).length || 0).toFixed(1)
    : 0;

  const handleSaveNotes = () => {
    if (onSaveNotes) onSaveNotes(quest.id, notes);
  };

  const handleComplete = () => {
    if (subQuests.length > 0 && !allSubsDone) return;
    onComplete(quest.id, null);
    onClose();
  };

  const primary = diff.color || theme.primary;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)",
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, rgba(12,12,20,0.95), rgba(22,18,10,0.92))`,
        border: `1px solid ${primary}44`,
        borderRadius: 16,
        padding: "24px",
        width: "min(480px, 94vw)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: `0 0 40px ${primary}18, 0 0 80px rgba(0,0,0,0.6), inset 0 0 60px ${primary}05`,
        borderColor: primary + "44",
        animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, marginBottom: 8 }}>
              [ QUEST INTEL FILE ]
            </div>
            {isBoss ? (
              <GlitchText variant="scan" duration={1200} color={primary} style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1.2 }}>
                {quest.title}
              </GlitchText>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1.2 }}>
                {quest.title}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: typeCfg.color + "15", color: typeCfg.color, border: `1px solid ${typeCfg.color}44`, fontFamily: "'JetBrains Mono',monospace" }}>{typeCfg.label.toUpperCase()}</span>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: diff.color + "15", color: diff.color, border: `1px solid ${diff.color}44`, fontFamily: "'JetBrains Mono',monospace" }}>{diff.label.toUpperCase()}</span>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: cat.color + "15", color: cat.color, border: `1px solid ${cat.color}44`, fontFamily: "'JetBrains Mono',monospace" }}>{cat.stat}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
          <button onClick={() => setActiveTab("details")} style={{ padding: "8px 0", background: "transparent", border: "none", color: activeTab === "details" ? primary : "#64748b", borderBottom: `2px solid ${activeTab === "details" ? primary : "transparent"}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>DETAILS</button>
          <button onClick={() => setActiveTab("history")} style={{ padding: "8px 0", background: "transparent", border: "none", color: activeTab === "history" ? primary : "#64748b", borderBottom: `2px solid ${activeTab === "history" ? primary : "transparent"}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>HISTORIE</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Tactical Hints */}
              {hints.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hints.map((hint, i) => (
                    <div key={i} style={{
                      background: `linear-gradient(135deg, ${hint.color}15, transparent)`,
                      border: `1px solid ${hint.color}33`,
                      borderLeft: `3px solid ${hint.color}`,
                      borderRadius: 10, padding: "12px 14px",
                      display: "flex", gap: 12, alignItems: "center",
                      animation: `fadeIn 0.4s ease ${i * 0.1}s both`
                    }}>
                      <div style={{ fontSize: 24, filter: `drop-shadow(0 0 6px ${hint.color}88)` }}>{hint.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 1, color: hint.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 2 }}>{hint.title}</div>
                        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>{hint.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rewards */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>BELOHNUNGEN</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ fontSize: 16, color: "#a78bfa", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textShadow: "0 0 10px #a78bfa44" }}>+{xpGain} XP</div>
                  <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textShadow: "0 0 10px #fbbf2444" }}>+{goldGain} G</div>
                  {quest.ai_verified && <div style={{ fontSize: 10, color: "#0af", background: "rgba(0,170,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>+20% VERIFIED</div>}
                </div>
              </div>

              {/* BUG FIX #4: Penalty / Consequences section */}
              {(isSystemQuest || gameState?.penaltyZone?.active) && (
                <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06), transparent)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>KONSEQUENZEN</div>
                  {gameState?.penaltyZone?.active && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isSystemQuest ? 8 : 0, padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace" }}>PENALTY ZONE AKTIV</div>
                        <div style={{ fontSize: 10, color: "#f87171" }}>XP-Malus: -20% auf alle Quests</div>
                      </div>
                    </div>
                  )}
                  {isSystemQuest && !quest.completed && (
                    <div style={{ fontSize: 11, color: "#f87171", lineHeight: 1.4, fontFamily: "'Outfit',sans-serif" }}>
                      Nichterfüllung von System-Quests kann die Penalty Zone aktivieren (−20% XP auf alle Quests).
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {(quest.description || quest.desc) && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>BESCHREIBUNG</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
                    {quest.description || quest.desc}
                  </div>
                </div>
              )}

              {/* Sub-Quests */}
              {subQuests.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>ETAPPEN</span>
                    <span>{completedSubs}/{subQuests.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {subQuests.map((sq, si) => (
                      <div key={sq.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: sq.completed ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${sq.completed ? "#22c55e33" : "rgba(255,255,255,0.05)"}` }}>
                        <button
                          onClick={() => { if (!sq.completed && onCompleteSubQuest) onCompleteSubQuest(quest.id, sq.id); }}
                          disabled={sq.completed}
                          style={{ width: 20, height: 20, borderRadius: 4, background: sq.completed ? "#22c55e" : "transparent", border: `1px solid ${sq.completed ? "#22c55e" : "#64748b"}`, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: sq.completed ? "default" : "pointer" }}
                        >
                          {sq.completed ? "✓" : ""}
                        </button>
                        <span style={{ fontSize: 13, color: sq.completed ? "#94a3b8" : "#fff", textDecoration: sq.completed ? "line-through" : "none", fontFamily: "'Outfit',sans-serif", flex: 1 }}>{sq.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>DEADLINE</div>
                  <div style={{ fontSize: 12, color: isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>
                    {quest.dueDate ? (isOverdue ? "ÜBERFÄLLIG" : isDueToday ? "HEUTE" : quest.dueDate) : "Keine"}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>REMINDER</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>
                    {quest.reminderAt ? formatLocalDateTime(quest.reminderAt) : "Keiner"}
                  </div>
                </div>
              </div>

              {/* Hunter Notes */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>HUNTER-NOTIZEN</span>
                  <span style={{ color: notes.length > 450 ? "#ef4444" : "#64748b" }}>{notes.length}/500</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  onBlur={handleSaveNotes}
                  placeholder="Eigene Notizen, Taktiken oder Erfahrungen..."
                  style={{
                    width: "100%", height: 80, padding: "10px 12px", borderRadius: 8,
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", fontSize: 13,
                    resize: "none", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

            </div>
          )}

          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#fbbf24", fontWeight: 900 }}>{history.length}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>ABSCHLÜSSE</div>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#fbbf24", fontWeight: 900 }}>{avgRating > 0 ? `${avgRating}★` : "-"}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>Ø RATING</div>
                </div>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: 12 }}>Keine Historie gefunden.</div>
              ) : (
                history.map((cq, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{cq.completedAt}</span>
                      <span style={{ fontSize: 11, color: "#fbbf24" }}>{"★".repeat(cq.rating || 0)}{"☆".repeat(5 - (cq.rating || 0))}</span>
                    </div>
                    {cq.notes && <div style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>"{cq.notes}"</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => { onClose(); if (onEdit) onEdit(quest); }}
            style={{ padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
          >
            ✏️ BEARBEITEN
          </button>
          <button
            onClick={handleComplete}
            disabled={subQuests.length > 0 && !allSubsDone}
            style={{ padding: "12px", borderRadius: 8, background: (subQuests.length > 0 && !allSubsDone) ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${primary}33, ${primary}11)`, border: `1px solid ${(subQuests.length > 0 && !allSubsDone) ? "transparent" : primary}`, color: (subQuests.length > 0 && !allSubsDone) ? "#64748b" : primary, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: (subQuests.length > 0 && !allSubsDone) ? "not-allowed" : "pointer", boxShadow: (subQuests.length > 0 && !allSubsDone) ? "none" : `0 0 16px ${primary}33` }}
          >
            ✓ ABSCHLIESSEN
          </button>
          {onDelete && (
            <button
              onClick={() => { onClose(); onDelete(quest.id); }}
              style={{ gridColumn: "1 / -1", padding: "8px", borderRadius: 8, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
            >
              🗑️ QUEST LÖSCHEN
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
