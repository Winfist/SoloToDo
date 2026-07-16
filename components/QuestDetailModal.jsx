import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { DIFFICULTIES, CATEGORIES, QUEST_TYPES_CONFIG } from "../data/gameData.js";
import { getToday as getLocalToday, formatLocalDateTime } from "../data/dateUtils.js";
import GlitchText from "./ui/GlitchText.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { getQuestDescription } from "../data/questUtils.js";
import { getQuestVideoPath } from "../data/questVideos.js";
import {
  MAX_QUEST_ATTACHMENTS,
  deleteQuestAttachmentBlobs,
  getQuestAttachmentBlob,
  saveQuestAttachmentFile
} from "../services/questAttachmentStore.js";

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

function formatAttachmentSize(size) {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuestDetailModal({
  quest,
  theme,
  onClose,
  onComplete,
  onEdit,
  onDelete,
  onCompleteSubQuest,
  onAddAttachment,
  onDeleteAttachment,
  onSaveNotes,
  onCreateHabitFromQuest,
  onRateQuest,
  onDislikeNote,
  onReplaceFromDislike,
  completedQuests = [], // Pass from parent for history
  gameState, // NEW: for tactical hints
  readOnly = false
}) {
  const { t } = useI18n();
  const [notes, setNotes] = useState(quest.notes || "");
  const [activeTab, setActiveTab] = useState("details"); // details, history
  const [attachmentPreviews, setAttachmentPreviews] = useState({});
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const attachmentInputRef = useRef(null);

  // Video player states & refs
  const [videoCollapsed, setVideoCollapsed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const videoPath = getQuestVideoPath(quest);

  useEffect(() => {
    setVideoError(false);
  }, [quest?.id]);
  const questAttachments = useMemo(
    () => Array.isArray(quest?.attachments) ? quest.attachments : [],
    [quest?.attachments]
  );
  const attachmentSignature = useMemo(
    () => questAttachments.map(item => `${item.id}:${item.thumbnailKey || item.localKey}`).join("|"),
    [questAttachments]
  );

  useEffect(() => {
    setNotes(quest.notes || "");
  }, [quest]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function loadAttachmentPreviews() {
      if (questAttachments.length === 0) {
        setAttachmentPreviews({});
        return;
      }

      const entries = await Promise.all(questAttachments.map(async attachment => {
        try {
          const blob = await getQuestAttachmentBlob(attachment.thumbnailKey || attachment.localKey);
          if (!blob) return [attachment.id, { missing: true, url: null }];
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          return [attachment.id, { missing: false, url }];
        } catch (error) {
          console.warn("[SoloToDo] Quest attachment preview failed.", error);
          return [attachment.id, { missing: true, url: null }];
        }
      }));

      if (cancelled) {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        return;
      }

      setAttachmentPreviews(Object.fromEntries(entries));
    }

    loadAttachmentPreviews();
    return () => {
      cancelled = true;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [attachmentSignature, questAttachments]);

  if (!quest) return null;

  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty) || DIFFICULTIES[0];
  const cat = CATEGORIES.find(c => c.key === quest.category) || CATEGORIES[0];
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;

  const xpGain = Math.round((diff?.xp || 50) * (quest.chainMultiplier || 1) * (typeCfg.xpMult || 1));
  const goldGain = Math.round((diff?.gold || 25) * (quest.chainMultiplier || 1) * (typeCfg.goldMult || 1));

  const isBoss = quest.difficulty === 'boss';
  const isSystemQuest = quest.isSystem === true;
  const showRating = Boolean(quest.isSystem && !quest.completed && !readOnly && onRateQuest);
  const rating = quest.userRating || null;

  const subQuests = quest.subQuests || [];
  const completedSubs = subQuests.filter(sq => sq.completed).length;
  const allSubsDone = subQuests.length > 0 && completedSubs === subQuests.length;

  const todayKey = getLocalToday();
  const isOverdue = quest.dueDate && quest.dueDate < todayKey && !quest.completed;
  const isDueToday = quest.dueDate === todayKey;

  // --- TACTICAL HINTS GENERATION ---
  const hints = [];
  if (gameState && activeTab === "details" && !readOnly) {
    const questsToday = (gameState.completedQuests || []).filter(q => q.completedAt === todayKey).length;
    const habitsToday = (gameState.habits || []).filter(h => h.history?.[todayKey]?.completed).length;

    // 1. Streak Warning
    if (gameState.streak >= 3 && questsToday === 0 && habitsToday === 0 && !quest.completed) {
      hints.push({
        type: "warning",
        color: "#f59e0b",
        title: t("modals.questDetail.streakWarningTitle"),
        text: t("modals.questDetail.streakWarningText", { streak: gameState.streak }),
        icon: "⚠️"
      });
    }

    // 2. Late Night Warning
    const hour = new Date().getHours();
    if (hour >= 21 && quest.energy === "deep" && !quest.completed) {
      hints.push({
        type: "danger",
        color: "#ef4444",
        title: t("modals.questDetail.timeEnergyWarningTitle"),
        text: t("modals.questDetail.timeEnergyWarningText"),
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
        title: t("modals.questDetail.systemAnalysisTitle"),
        text: t("modals.questDetail.systemAnalysisText", { stat: cat.stat, level: catStat }),
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

  const handleAttachmentSelect = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => String(file.type || "").startsWith("image/"));
    event.target.value = "";
    if (readOnly || !onAddAttachment || files.length === 0) return;

    const remainingSlots = MAX_QUEST_ATTACHMENTS - questAttachments.length;
    if (remainingSlots <= 0) {
      setAttachmentError(t("modals.questDetail.imagesMax", { count: MAX_QUEST_ATTACHMENTS }));
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    setAttachmentBusy(true);
    setAttachmentError(files.length > remainingSlots ? t("modals.questDetail.imagesMax", { count: MAX_QUEST_ATTACHMENTS }) : "");

    try {
      for (const file of selectedFiles) {
        const attachment = await saveQuestAttachmentFile(quest.id, file);
        onAddAttachment(quest.id, attachment);
      }
    } catch (error) {
      console.warn("[SoloToDo] Quest attachment upload failed.", error);
      setAttachmentError(t("modals.questDetail.imageUploadFailed"));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const blob = await getQuestAttachmentBlob(attachment.localKey);
      if (!blob) {
        setAttachmentPreviews(prev => ({
          ...prev,
          [attachment.id]: { ...(prev[attachment.id] || {}), missing: true, url: null },
        }));
        setAttachmentError(t("modals.questDetail.imageMissing"));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name || "quest-image.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAttachmentError("");
    } catch (error) {
      console.warn("[SoloToDo] Quest attachment download failed.", error);
      setAttachmentError(t("modals.questDetail.imageMissing"));
    }
  };

  const handleDeleteAttachment = async (attachment) => {
    if (readOnly || !onDeleteAttachment) return;
    setAttachmentBusy(true);
    setAttachmentError("");
    try {
      await deleteQuestAttachmentBlobs(attachment);
      onDeleteAttachment(quest.id, attachment.id);
    } catch (error) {
      console.warn("[SoloToDo] Quest attachment delete failed.", error);
      setAttachmentError(t("modals.questDetail.imageDeleteFailed"));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const primary = diff.color || theme.primary;

  return ReactDOM.createPortal(
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
              {t("modals.questDetail.header")}
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
              {(quest.stackCount > 1 || quest.stackItems?.length > 1) && (
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.28)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 900 }}>x{quest.stackCount || quest.stackItems?.length}</span>
              )}
              {quest.linkedHabitId && (
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  🔄 HABIT AKTIV
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
          <button onClick={() => setActiveTab("details")} style={{ padding: "8px 0", background: "transparent", border: "none", color: activeTab === "details" ? primary : "#64748b", borderBottom: `2px solid ${activeTab === "details" ? primary : "transparent"}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t("modals.questDetail.details")}</button>
          <button onClick={() => setActiveTab("history")} style={{ padding: "8px 0", background: "transparent", border: "none", color: activeTab === "history" ? primary : "#64748b", borderBottom: `2px solid ${activeTab === "history" ? primary : "transparent"}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t("modals.questDetail.history")}</button>
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

              {/* System Guidance Video */}
              {videoPath && !videoError && (
                <div style={{
                  background: "rgba(0,0,0,0.38)",
                  borderRadius: 12,
                  border: `1px solid ${primary}28`,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: `0 0 20px ${primary}0c, inset 0 0 12px ${primary}04`,
                  animation: "fadeIn 0.5s ease"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: primary, boxShadow: `0 0 8px ${primary}`, animation: "pulse 1.5s infinite" }} />
                      {t("modals.questDetail.systemBriefing")}
                    </div>
                    <button 
                      onClick={() => setVideoCollapsed(!videoCollapsed)} 
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#64748b",
                        fontSize: 8,
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 900,
                        cursor: "pointer",
                        padding: "3px 8px",
                        borderRadius: 6,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = primary; e.currentTarget.style.borderColor = primary + "44"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      {videoCollapsed ? t("modals.questDetail.showGuidance") : t("modals.questDetail.hideGuidance")}
                    </button>
                  </div>

                  {!videoCollapsed && (
                    <div style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: `1px solid ${primary}44`,
                      background: "#020205",
                      aspectRatio: "16 / 9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 8px 24px rgba(0,0,0,0.6)`
                    }}>
                      {/* Subtle cinematic vignette (premium — replaces the CRT/RGB-split glitch) */}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(ellipse at 50% 42%, transparent 56%, rgba(2,2,8,0.42) 100%)",
                        zIndex: 2,
                        pointerEvents: "none",
                      }} />
                      
                      <video
                        ref={videoRef}
                        src={videoPath}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => {
                          console.warn(`[SoloToDo] Video path failed to load: ${videoPath}. Hiding player.`);
                          setVideoError(true);
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Rewards */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{t("modals.questDetail.rewards")}</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ fontSize: 16, color: "#a78bfa", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textShadow: "0 0 10px #a78bfa44" }}>+{xpGain} XP</div>
                  <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textShadow: "0 0 10px #fbbf2444" }}>+{goldGain} G</div>
                  {quest.ai_verified && <div style={{ fontSize: 10, color: "#0af", background: "rgba(0,170,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>+20% VERIFIED</div>}
                </div>
              </div>

              {/* BUG FIX #4: Penalty / Consequences section */}
              {(isSystemQuest || gameState?.penaltyZone?.active) && (
                <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06), transparent)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{t("modals.questDetail.consequences")}</div>
                  {gameState?.penaltyZone?.active && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isSystemQuest ? 8 : 0, padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace" }}>{t("modals.questDetail.penaltyActive")}</div>
                        <div style={{ fontSize: 10, color: "#f87171" }}>{t("modals.questDetail.penaltyMalus")}</div>
                      </div>
                    </div>
                  )}
                  {isSystemQuest && !quest.completed && (
                    <div style={{ fontSize: 11, color: "#f87171", lineHeight: 1.4, fontFamily: "'Outfit',sans-serif" }}>
                      {t("modals.questDetail.systemPenalty")}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {getQuestDescription(quest) && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{t("modals.questDetail.description")}</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
                    {getQuestDescription(quest)}
                  </div>
                </div>
              )}

              {/* Quest Rating */}
              {showRating && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, flex: 1 }}>{t("questRating.prompt")}</span>
                    <button className="press-feedback" onClick={() => onRateQuest(quest.id, rating === "liked" ? null : "liked")}
                      style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: rating === "liked" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.04)", color: rating === "liked" ? "#4ade80" : "#94a3b8", border: `1px solid ${rating === "liked" ? "#22c55e55" : "rgba(148,163,184,0.2)"}` }}>
                      ▲ {t("questRating.like")}
                    </button>
                    <button className="press-feedback" onClick={() => { onRateQuest(quest.id, rating === "disliked" ? null : "disliked"); setShowNoteField(false); }}
                      style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: rating === "disliked" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.04)", color: rating === "disliked" ? "#f87171" : "#94a3b8", border: `1px solid ${rating === "disliked" ? "#ef444455" : "rgba(148,163,184,0.2)"}` }}>
                      ▼ {t("questRating.dislike")}
                    </button>
                  </div>
                  {rating === "disliked" && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {onReplaceFromDislike && (
                          <button className="press-feedback" onClick={() => onReplaceFromDislike(quest)}
                            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
                            {t("questRating.replaceCta")}
                          </button>
                        )}
                        <button className="press-feedback" onClick={() => setShowNoteField(v => !v)}
                          style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" }}>
                          {t("questRating.noteCta")}
                        </button>
                      </div>
                      {showNoteField && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={noteDraft} maxLength={140} onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder={t("questRating.notePlaceholder")}
                            style={{ flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12, background: "rgba(10,12,24,0.6)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)" }} />
                          <button className="press-feedback" disabled={!noteDraft.trim()}
                            onClick={() => { onDislikeNote?.(quest.id, noteDraft); setNoteDraft(""); setShowNoteField(false); }}
                            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
                            {t("questRating.noteSave")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quest Images */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span>{t("modals.questDetail.images")}</span>
                  <span style={{ color: questAttachments.length >= MAX_QUEST_ATTACHMENTS ? "#f59e0b" : "#64748b" }}>{questAttachments.length}/{MAX_QUEST_ATTACHMENTS}</span>
                </div>

                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleAttachmentSelect}
                />

                {!readOnly && onAddAttachment && (
                  <button
                    type="button"
                    onClick={() => {
                      if (questAttachments.length >= MAX_QUEST_ATTACHMENTS) {
                        setAttachmentError(t("modals.questDetail.imagesMax", { count: MAX_QUEST_ATTACHMENTS }));
                        return;
                      }
                      setAttachmentError("");
                      attachmentInputRef.current?.click();
                    }}
                    disabled={attachmentBusy}
                    style={{
                      width: "100%",
                      marginBottom: questAttachments.length > 0 || attachmentError ? 10 : 0,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: attachmentBusy ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${primary}18, rgba(255,255,255,0.02))`,
                      border: `1px dashed ${primary}55`,
                      color: attachmentBusy ? "#64748b" : primary,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      fontFamily: "'JetBrains Mono',monospace",
                      cursor: attachmentBusy ? "default" : "pointer",
                    }}
                  >
                    {attachmentBusy ? t("modals.questDetail.imageSaving") : t("modals.questDetail.imageUpload")}
                  </button>
                )}

                {attachmentError && (
                  <div style={{ marginBottom: 10, color: "#f59e0b", fontSize: 11, lineHeight: 1.4, fontFamily: "'Outfit',sans-serif" }}>
                    {attachmentError}
                  </div>
                )}

                {questAttachments.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4, fontFamily: "'Outfit',sans-serif", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {readOnly ? t("modals.questDetail.imagesEmptyReadonly") : t("modals.questDetail.imagesEmpty")}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))", gap: 10 }}>
                    {questAttachments.map((attachment) => {
                      const preview = attachmentPreviews[attachment.id] || {};
                      const sizeLabel = formatAttachmentSize(attachment.size);
                      return (
                        <div key={attachment.id} style={{ minWidth: 0, overflow: "hidden", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${preview.missing ? "#f59e0b44" : "rgba(255,255,255,0.08)"}` }}>
                          <div style={{ height: 88, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {preview.url ? (
                              <img src={preview.url} alt={attachment.name || t("modals.questDetail.imageAlt")} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ padding: 10, textAlign: "center", color: preview.missing ? "#f59e0b" : "#64748b", fontSize: 10, lineHeight: 1.35, fontFamily: "'JetBrains Mono',monospace" }}>
                                {preview.missing ? t("modals.questDetail.imageMissingShort") : t("modals.questDetail.imageLoading")}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "8px 9px" }}>
                            <div title={attachment.name} style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Outfit',sans-serif" }}>
                              {attachment.name || t("modals.questDetail.imageFallbackName")}
                            </div>
                            {sizeLabel && <div style={{ color: "#64748b", fontSize: 9, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{sizeLabel}</div>}
                            <div style={{ display: "grid", gridTemplateColumns: readOnly || !onDeleteAttachment ? "1fr" : "1fr 32px", gap: 6, marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(attachment)}
                                style={{ padding: "7px 8px", borderRadius: 6, background: `${primary}14`, border: `1px solid ${primary}44`, color: primary, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
                              >
                                {t("modals.questDetail.imageDownload")}
                              </button>
                              {!readOnly && onDeleteAttachment && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(attachment)}
                                  disabled={attachmentBusy}
                                  title={t("modals.questDetail.imageDelete")}
                                  style={{ padding: "7px 0", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: attachmentBusy ? "default" : "pointer" }}
                                >
                                  X
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stack Info */}
              {(quest.stackCount > 1 || quest.stackItems?.length > 1) && (
                <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), transparent)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, fontWeight: 800 }}>{t("modals.questDetail.stackedInstances")}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>
                    {t("modals.questDetail.stackedCount", { count: quest.stackCount || quest.stackItems?.length })}
                  </div>
                  {quest.stackItems && quest.stackItems.length > 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {quest.stackItems.map((item, idx) => (
                        <div key={item.id || idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: idx === 0 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${idx === 0 ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: idx === 0 ? "#fbbf24" : "#64748b", flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: idx === 0 ? "#fbbf24" : "#94a3b8", fontFamily: "'JetBrains Mono',monospace", fontWeight: idx === 0 ? 800 : 500 }}>
                            {item.dueDate ? (item.dueDate < getLocalToday() ? `${t("modals.questDetail.overdueLabel")} (${item.dueDate})` : item.dueDate === getLocalToday() ? t("modals.questDetail.dueTodayLabel") : item.dueDate) : item.createdAt || t("modals.questDetail.openLabel")}
                          </span>
                          {idx === 0 && <span style={{ fontSize: 8, color: "#fbbf24", fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", marginLeft: "auto" }}>{t("modals.questDetail.activeLabel")}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* KI-Klarheitsfelder: Fertig-Kriterium + Meta-Badges */}
              {quest.doneWhen && (
                <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06), transparent)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, fontWeight: 800 }}>{t("modals.questDetail.doneWhen")}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>{quest.doneWhen}</div>
                </div>
              )}
              {(Number(quest.estimatedMinutes) > 0 || quest.goalRef) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Number(quest.estimatedMinutes) > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#94a3b8", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(148,163,184,0.25)" }}>
                      {t("modals.questDetail.estimatedMinutes", { minutes: quest.estimatedMinutes })}
                    </span>
                  )}
                  {quest.goalRef && (
                    <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#a5b4fc", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)" }}>
                      {t("modals.questDetail.goalRef", { goal: quest.goalRef })}
                    </span>
                  )}
                </div>
              )}

              {/* Sub-Quests */}
              {subQuests.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>{t("modals.questDetail.stages")}</span>
                    <span>{completedSubs}/{subQuests.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {subQuests.map((sq, si) => (
                      <div key={sq.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: sq.completed ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${sq.completed ? "#22c55e33" : "rgba(255,255,255,0.05)"}` }}>
                        <button
                          onClick={() => { if (!sq.completed && onCompleteSubQuest && !readOnly) onCompleteSubQuest(quest.id, sq.id); }}
                          disabled={sq.completed || readOnly}
                          style={{ width: 20, height: 20, borderRadius: 4, background: sq.completed ? "#22c55e" : "transparent", border: `1px solid ${sq.completed ? "#22c55e" : "#64748b"}`, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: sq.completed || readOnly ? "default" : "pointer" }}
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
                  <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{t("modals.questDetail.deadline")}</div>
                  <div style={{ fontSize: 12, color: isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>
                    {quest.dueDate ? (isOverdue ? t("modals.questDetail.overdue") : isDueToday ? t("modals.questDetail.today") : quest.dueDate) : t("modals.questDetail.none")}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{t("modals.questDetail.reminder")}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>
                    {quest.reminderAt ? formatLocalDateTime(quest.reminderAt) : t("modals.questDetail.none")}
                  </div>
                </div>
              </div>

              {/* Hunter Notes */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>{t("modals.questDetail.notes")}</span>
                  <span style={{ color: notes.length > 450 ? "#ef4444" : "#64748b" }}>{notes.length}/500</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => { if (!readOnly) setNotes(e.target.value.slice(0, 500)); }}
                  onBlur={handleSaveNotes}
                  readOnly={readOnly}
                  placeholder={readOnly ? t("modals.questDetail.none") : t("modals.questDetail.notesPlaceholder")}
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
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t("modals.questDetail.completions")}</div>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#fbbf24", fontWeight: 900 }}>{avgRating > 0 ? `${avgRating}★` : "-"}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t("modals.questDetail.avgRating")}</div>
                </div>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: 12 }}>{t("modals.questDetail.noHistory")}</div>
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
        {!readOnly && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => { onClose(); if (onEdit) onEdit(quest); }}
              style={{ padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
            >
              {t("modals.questDetail.edit")}
            </button>
            <button
              onClick={handleComplete}
              disabled={subQuests.length > 0 && !allSubsDone}
              style={{ padding: "12px", borderRadius: 8, background: (subQuests.length > 0 && !allSubsDone) ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${primary}33, ${primary}11)`, border: `1px solid ${(subQuests.length > 0 && !allSubsDone) ? "transparent" : primary}`, color: (subQuests.length > 0 && !allSubsDone) ? "#64748b" : primary, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: (subQuests.length > 0 && !allSubsDone) ? "not-allowed" : "pointer", boxShadow: (subQuests.length > 0 && !allSubsDone) ? "none" : `0 0 16px ${primary}33` }}
            >
              {t("modals.questDetail.complete")}
            </button>
            {!quest.linkedHabitId && onCreateHabitFromQuest && (
              <button
                onClick={() => { onClose(); onCreateHabitFromQuest(quest); }}
                style={{ gridColumn: "1 / -1", padding: "10px", borderRadius: 8, background: `linear-gradient(135deg, ${primary}1e, rgba(255,255,255,0.02))`, border: `1px solid ${primary}66`, color: primary, fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${primary}33, ${primary}11)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${primary}1e, rgba(255,255,255,0.02))`; }}
              >
                🔄 ALS HABIT TRACKEN
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { onClose(); onDelete(quest.id); }}
                style={{ gridColumn: "1 / -1", padding: "8px", borderRadius: 8, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
              >
                {t("modals.questDetail.delete")}
              </button>
            )}
          </div>
        )}

        {readOnly && onCreateHabitFromQuest && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: primary, fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>
                {t("modals.questDetail.habitPromptTitle")}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
                {t("modals.questDetail.habitPromptText")}
              </div>
            </div>
            <button
              onClick={() => { onClose(); onCreateHabitFromQuest(quest); }}
              style={{ width: "100%", padding: "12px", borderRadius: 8, background: `linear-gradient(135deg, ${primary}33, ${primary}11)`, border: `1px solid ${primary}`, color: primary, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", boxShadow: `0 0 16px ${primary}22` }}
            >
              {t("modals.questDetail.createHabit")}
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
