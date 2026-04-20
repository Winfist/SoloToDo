import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CATEGORIES, ACHIEVEMENTS } from "../../data/gameData.js";
import { getUnlocksAtLevel } from "../../data/featureUnlocks.js";
import { STAT_ICONS, GATE_ICONS, QUEST_ICONS, SHADOW_ICONS, NAV_ICONS } from "../../data/icons.js";
import { StatRadar, QuestCard, EmergencyQuestCard } from "../../data/constants";
import HabitTracker from "../HabitTracker.jsx";
import MicroHabits from "../MicroHabits.jsx";
import GemBoosterBanner from "../GemBoosterBanner.jsx";
import { DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_LAYOUT, DEFAULT_HIDDEN_WIDGETS, mergeConfig, getWidgetDef } from "./DashboardWidgetRegistry.js";
import { StreakDisplayWidget, DailyProgressWidget, QuickAccessWidget } from "./DashboardWidgets.jsx";
import ScrollReveal from "../ui/ScrollReveal.jsx";
import TiltCard from "../ui/TiltCard.jsx";
import { AnimatedNumber } from "../../hooks/useAnimatedCounter.jsx";
import GlitchText from "../ui/GlitchText.jsx";

// ─── CSS KEYFRAMES for edit mode ──────────────────────────────
const EDIT_MODE_CSS = `
@keyframes widgetJelly {
  0%, 100% { transform: rotate(-0.4deg); }
  50% { transform: rotate(0.4deg); }
}
@keyframes addWidgetPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
`;

// ─── ITEM HEIGHT for drag calculations ────────────────────────
const getItemRects = (containerRef) => {
  if (!containerRef?.current) return [];
  const items = containerRef.current.querySelectorAll("[data-widget-item]");
  return Array.from(items).map(el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, height: rect.height, mid: rect.top + rect.height / 2 };
  });
};

/**
 * DashboardView – rendered when view === "dashboard".
 * All required state, handlers and derived values are passed as props.
 */
export default function DashboardView({
  state, theme, can,
  showDashboardStats, setShowDashboardStats,
  streakBonus, formationBonus, equipBonuses, xpPercent, xpNeeded,
  filteredQuests, hiddenQuestCount,
  questFilter, setQuestFilter,
  completeQuest, completeSubQuest, startEditingQuest, deleteQuest,
  completeEmergencyQuest, createQuest,
  setShowCreate, setShowTaskScan,
  nextLevel, getUnlocksAtLevel: _getUnlocksAtLevel,
  notify, persist,
  setIsCreatingEntry,
  getActiveGemBoosters,
  // New props for dashboard customization
  navigateTo,
  setShowFocusMode,
  setShowDawnDusk,
  setShowSoulLink,
}) {
  const getUnlocks = _getUnlocksAtLevel || getUnlocksAtLevel;

  // ── Quest sub-state (unchanged from original) ──
  const [originFilter, setOriginFilter] = useState("all");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const toggleSection = (key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Dashboard Configuration ──
  const dashConfig = useMemo(() => mergeConfig(state.dashboardConfig, can), [state.dashboardConfig, state.level]);
  const [editMode, setEditMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // local layout for drag reordering
  const [localLayout, setLocalLayout] = useState(dashConfig.layout);
  const [localHidden, setLocalHidden] = useState(dashConfig.hidden);
  const [localCollapsed, setLocalCollapsed] = useState(dashConfig.collapsed);

  // Sync when dashConfig changes from outside (e.g., reset)
  useEffect(() => {
    setLocalLayout(dashConfig.layout);
    setLocalHidden(dashConfig.hidden);
    setLocalCollapsed(dashConfig.collapsed);
  }, [dashConfig.layout?.join(","), dashConfig.hidden?.join(",")]);

  // Persist helper
  const commitConfig = useCallback((layout, hidden, collapsed) => {
    const cfg = { layout, hidden, collapsed };
    persist({ ...state, dashboardConfig: cfg });
  }, [state, persist]);

  // ── Drag & Drop System ──
  const [dragInfo, setDragInfo] = useState(null);
  const dragInfoRef = useRef(null);
  const containerRef = useRef(null);
  const listenerCleanupRef = useRef(null);

  const handleDragStart = useCallback((e, index) => {
    e.preventDefault();
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const rects = getItemRects(containerRef);
    const info = { index, startY, offsetY: 0, rects, itemHeight: rects[index]?.height || 80 };
    dragInfoRef.current = info;
    setDragInfo(info);

    const handleMove = (me) => {
      me.preventDefault();
      const clientY = me.clientY ?? me.touches?.[0]?.clientY ?? 0;
      const newInfo = { ...dragInfoRef.current, offsetY: clientY - dragInfoRef.current.startY };
      dragInfoRef.current = newInfo;
      setDragInfo({ ...newInfo });
    };

    const handleEnd = () => {
      const finalInfo = dragInfoRef.current;
      if (finalInfo) {
        const { index: dragIdx, offsetY, rects } = finalInfo;
        const draggedMid = rects[dragIdx]?.mid + offsetY;
        let targetIdx = dragIdx;
        if (offsetY > 0) {
          for (let i = dragIdx + 1; i < rects.length; i++) {
            if (draggedMid > rects[i].mid) targetIdx = i;
          }
        } else {
          for (let i = dragIdx - 1; i >= 0; i--) {
            if (draggedMid < rects[i].mid) targetIdx = i;
          }
        }
        if (targetIdx !== dragIdx) {
          const newLayout = [...localLayout];
          const [item] = newLayout.splice(dragIdx, 1);
          newLayout.splice(targetIdx, 0, item);
          setLocalLayout(newLayout);
          commitConfig(newLayout, localHidden, localCollapsed);
        }
      }
      dragInfoRef.current = null;
      setDragInfo(null);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleEnd);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleEnd);
    listenerCleanupRef.current = handleEnd;
  }, [localLayout, localHidden, localCollapsed, commitConfig]);

  useEffect(() => () => { if (listenerCleanupRef.current) listenerCleanupRef.current(); }, []);

  // Item style during drag
  const getDragStyle = useCallback((i) => {
    const info = dragInfoRef.current;
    if (!info) return {};
    const dragIdx = info.index;

    if (i === dragIdx) {
      return {
        transform: `translateY(${info.offsetY}px) scale(1.02)`,
        zIndex: 50, position: "relative",
        boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 24px ${theme.primary}22`,
        transition: "box-shadow 0.2s, scale 0.2s",
        opacity: 0.95,
      };
    }

    const rects = info.rects;
    const draggedMid = rects[dragIdx]?.mid + info.offsetY;
    let targetIdx = dragIdx;
    if (info.offsetY > 0) {
      for (let j = dragIdx + 1; j < rects.length; j++) {
        if (draggedMid > rects[j].mid) targetIdx = j;
      }
    } else {
      for (let j = dragIdx - 1; j >= 0; j--) {
        if (draggedMid < rects[j].mid) targetIdx = j;
      }
    }

    let shiftY = 0;
    if (targetIdx > dragIdx && i > dragIdx && i <= targetIdx) {
      shiftY = -(rects[dragIdx]?.height || 80);
    } else if (targetIdx < dragIdx && i >= targetIdx && i < dragIdx) {
      shiftY = (rects[dragIdx]?.height || 80);
    }

    return {
      transform: shiftY ? `translateY(${shiftY}px)` : "none",
      transition: "transform 0.25s cubic-bezier(0.2,0,0,1)",
      zIndex: 1,
    };
  }, [theme.primary]);

  // ── Widget Actions ──
  const removeWidget = useCallback((key) => {
    const def = getWidgetDef(key);
    if (!def?.removable) return;
    const newLayout = localLayout.filter(k => k !== key);
    const newHidden = [...localHidden, key];
    setLocalLayout(newLayout);
    setLocalHidden(newHidden);
    commitConfig(newLayout, newHidden, localCollapsed);
  }, [localLayout, localHidden, localCollapsed, commitConfig]);

  const addWidget = useCallback((key) => {
    const newLayout = [...localLayout, key];
    const newHidden = localHidden.filter(k => k !== key);
    setLocalLayout(newLayout);
    setLocalHidden(newHidden);
    commitConfig(newLayout, newHidden, localCollapsed);
    setShowAddPanel(false);
  }, [localLayout, localHidden, localCollapsed, commitConfig]);

  const toggleWidgetCollapse = useCallback((key) => {
    const newCollapsed = { ...localCollapsed, [key]: !localCollapsed[key] };
    setLocalCollapsed(newCollapsed);
    commitConfig(localLayout, localHidden, newCollapsed);
  }, [localLayout, localHidden, localCollapsed, commitConfig]);

  const resetToDefault = useCallback(() => {
    const layout = [...DEFAULT_DASHBOARD_LAYOUT];
    const hidden = [...DEFAULT_HIDDEN_WIDGETS];
    setLocalLayout(layout);
    setLocalHidden(hidden);
    setLocalCollapsed({});
    commitConfig(layout, hidden, {});
  }, [commitConfig]);

  // ── Compute visible widgets ──
  // In normal mode, filter out widgets that are gated by features not yet unlocked
  // In edit mode, show all widgets in the layout (gated ones won't render content)
  const visibleWidgets = useMemo(() => {
    return localLayout
      .map(key => getWidgetDef(key))
      .filter(w => {
        if (!w) return false;
        if (w.requires && !can(w.requires)) return false;
        return true;
      });
  }, [localLayout, can]);

  // Available widgets to add (hidden + feature-unlocked)
  const availableWidgets = useMemo(() => {
    return DASHBOARD_WIDGETS.filter(w => {
      if (localLayout.includes(w.key)) return false;
      return true;
    });
  }, [localLayout]);

  // ── Quest rendering helpers (unchanged) ──
  const visibleQuests = originFilter === "system"
    ? filteredQuests.filter(q => q.isSystem)
    : originFilter === "custom"
      ? filteredQuests.filter(q => !q.isSystem)
      : filteredQuests;

  const diffOrder = { boss: 0, hard: 1, normal: 2, easy: 3 };
  const sortByDiff = (a, b) => (diffOrder[a.difficulty] ?? 2) - (diffOrder[b.difficulty] ?? 2);
  const systemQuests = visibleQuests.filter(q => q.isSystem).sort(sortByDiff);
  const userQuests = visibleQuests.filter(q => !q.isSystem).sort(sortByDiff);
  const showGrouped = originFilter === "all" && (systemQuests.length > 0 && userQuests.length > 0);

  const SectionHeader = ({ title, icon, color, count, sectionKey }) => (
    <div onClick={() => toggleSection(sectionKey)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 12px", marginBottom: 6, cursor: "pointer",
      background: `linear-gradient(90deg, ${color}0c, transparent)`,
      borderLeft: `2px solid ${color}55`, borderRadius: 8,
      transition: "background 0.2s", userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color, fontFamily: "'JetBrains Mono',monospace" }}>{title}</span>
        <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>[{count}]</span>
      </div>
      <span style={{ fontSize: 9, color, transition: "transform 0.25s", transform: collapsedSections[sectionKey] ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
    </div>
  );

  // ── Render individual widget content by key ──
  // Returns { content, isEmpty } where isEmpty=true means the widget has no visible content
  const renderWidget = (widgetKey) => {
    const isCollapsed = localCollapsed[widgetKey];

    switch (widgetKey) {
      case "gem_booster": {
        if (!can('gem_shop')) return { content: null, isEmpty: true };
        const boosters = getActiveGemBoosters ? getActiveGemBoosters() : [];
        if (boosters.length === 0) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return { content: <GemBoosterBanner activeBoosters={boosters} theme={theme} />, isEmpty: false };
      }

      case "hunter_status":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <>
              {/* ── PLAYER STATS (LEVEL & RADAR) ── */}
              {!editMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
                  <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>HUNTER STATUS</div>
                  <button
                    onClick={() => setShowDashboardStats(!showDashboardStats)}
                    style={{ background: showDashboardStats ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg,${theme.primary}22,${theme.primary}0a)`, border: `1px solid ${theme.primary}55`, borderRadius: 12, padding: "4px 10px", fontSize: 9, color: showDashboardStats ? "#94a3b8" : theme.primary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}
                  >
                    {showDashboardStats ? "VERBERGEN ▲" : "ANZEIGEN ▼"}
                  </button>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
                </div>
              )}

              {(showDashboardStats || editMode) && (
                <>
                <ScrollReveal animation="scaleIn" duration={0.5}>
                <TiltCard tiltIntensity={6} glareIntensity={0.1} holographic borderGlow={theme.primary}>
                  <div style={{ background: theme.card, border: `1px solid ${theme.primary}15`, borderRadius: 22, padding: "24px 22px 20px", marginBottom: 16, position: "relative", overflow: "hidden", backdropFilter: "blur(16px)", boxShadow: `0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.03)` }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: `radial-gradient(circle at 100% 30%,${theme.primary}0a,transparent 70%)`, pointerEvents: "none" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
                      <div>
                        <GlitchText variant="scan" duration={1200} color="#22d3ee">
                          {`> SYSTEM ONLINE. WILLKOMMEN, ${state.hunterName.toUpperCase()}.`}
                        </GlitchText>
                        <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, marginTop: 10 }}>HUNTER LEVEL</div>
                        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: `0 0 40px ${theme.primary}33` }}><AnimatedNumber value={state.level} duration={600} format="number" /></div>
                        {streakBonus > 0 && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 6, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}><img src={STAT_ICONS.str} alt="Streak" style={{ width: 12, height: 12, objectFit: "contain", filter: "drop-shadow(0 0 4px #f59e0b88)" }} /> +{streakBonus}% XP</div>}
                        {formationBonus.dungeonBonus > 0 && <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 3, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}><img src={SHADOW_ICONS.soldier} alt="Shadow" style={{ width: 12, height: 12, objectFit: "contain", filter: "drop-shadow(0 0 4px #a78bfa88) brightness(0.6) invert(1)" }} /> +{formationBonus.dungeonBonus}% Dungeon</div>}
                      </div>
                      <StatRadar stats={state.stats} theme={theme} size={110} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                      <span style={{ letterSpacing: 2 }}>EXP</span><span><AnimatedNumber value={state.xp} duration={800} format="locale" /> / {xpNeeded.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 10, background: "rgba(15,15,30,0.9)", borderRadius: 5, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: `${xpPercent}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg,${theme.primary},${theme.accent})`, boxShadow: `0 0 16px ${theme.glow},0 2px 8px ${theme.primary}44`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)", animation: "shimmer 2.5s ease-in-out infinite" }} />
                      </div>
                    </div>
                  </div>
                </TiltCard>
                </ScrollReveal>
                <ScrollReveal animation="slideUp" stagger={0.06}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 24 }}>
                    {CATEGORIES.map((cat, i) => (
                      <div key={cat.key} style={{ background: theme.card, border: `1px solid ${cat.color}20`, borderRadius: 16, padding: "12px 4px 10px", textAlign: "center", backdropFilter: "blur(8px)", transition: "border-color 0.3s,transform 0.2s,box-shadow 0.3s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}18`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = cat.color + "20"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                        <div style={{ width: 44, height: 44, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}18 0%, ${cat.color}08 70%, transparent 100%)`, border: `1.5px solid ${cat.color}30`, overflow: "hidden", boxShadow: `0 0 20px ${cat.color}20, inset 0 0 12px ${cat.color}10` }}>
                          {cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: "110%", height: "110%", objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15) drop-shadow(0 0 6px ${cat.color}66)`, transform: "scale(1.15)" }} /> : <span style={{ fontSize: 20 }}>{cat.icon}</span>}
                        </div>
                        <div style={{ fontSize: 9, color: cat.color, marginTop: 5, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1.5, textShadow: `0 0 8px ${cat.color}44` }}>{cat.stat}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", marginTop: 2, textShadow: "0 0 12px rgba(255,255,255,0.1)" }}><AnimatedNumber value={(state.stats[cat.key] || 0) + (equipBonuses[cat.key + "Bonus"] || 0)} duration={700} delay={i * 80} format="number" /></div>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
                </>
              )}
            </>
          )
        };

      case "streak_display":
        if (isCollapsed) return { content: null, isEmpty: false };
        return { content: <StreakDisplayWidget state={state} theme={theme} />, isEmpty: false };

      case "daily_progress":
        if (isCollapsed) return { content: null, isEmpty: false };
        return { content: <DailyProgressWidget state={state} theme={theme} />, isEmpty: false };

      case "quests":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <>
              {/* ── HUNTER QUESTS ── */}
              {!editMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 16px" }}>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
                  <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>HUNTER QUESTS</div>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
                </div>
              )}

              {/* ── EMERGENCY QUEST ── */}
              {can('emergency_quests') && state.emergencyQuest && (
                <EmergencyQuestCard quest={state.emergencyQuest} done={state.emergencyDone} failed={state.emergencyFailed} onComplete={completeEmergencyQuest} theme={theme} />
              )}

              {/* ── QUEST FILTERS + ADD ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 6, flexWrap: "wrap" }}>
                {can('quest_filters') && <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, flex: 1 }}>
                  {[
                    { key: "all", label: "Alle", color: theme.accent },
                    { key: "daily", label: "Daily", color: "#22d3ee" },
                    { key: "side", label: "Side", color: "#a78bfa" },
                    ...(can('weekly_quests') ? [{ key: "weekly", label: "Weekly", color: "#8b5cf6" }] : []),
                    ...(can('chained_quests') ? [{ key: "chained", label: "Kette", color: "#f59e0b" }] : []),
                    ...(can('hidden_quests') && hiddenQuestCount > 0 ? [{ key: "hidden", label: hiddenQuestCount, color: "#6366f1", icon: QUEST_ICONS.hidden }] : []),
                  ].map(f => (
                    <button key={f.key} onClick={() => setQuestFilter(f.key)} style={{
                      padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, flexShrink: 0,
                      background: questFilter === f.key ? f.color + "22" : "transparent",
                      color: questFilter === f.key ? f.color : "#475569",
                      border: `1px solid ${questFilter === f.key ? f.color + "44" : "transparent"}`,
                      transition: "all 0.25s", fontFamily: "'JetBrains Mono',monospace"
                    }}>
                      {f.icon ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><img src={f.icon} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />{f.label}</span> : f.label}
                    </button>
                  ))}
                </div>}
                {can('ai_task_scan') && setShowTaskScan && (
                  <button onClick={() => setShowTaskScan(true)} style={{ padding: "8px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "rgba(0,200,255,0.1)", color: "#0af", border: "1px solid rgba(0,200,255,0.3)", fontFamily: "'Courier New',monospace", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>📷 SCAN</button>
                )}
                <button onClick={() => setShowCreate(true)} style={{ padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 900, background: `linear-gradient(135deg,${theme.primary},${theme.secondary})`, color: "#fff", border: "none", boxShadow: `0 4px 16px ${theme.glow}`, textShadow: "0 1px 4px rgba(0,0,0,0.4)", fontFamily: "'Cinzel',serif", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, transition: "all 0.3s", transform: "translateY(-1px)", animation: "float 3s ease-in-out infinite" }}>+ QUEST</button>
              </div>

              {/* ── ORIGIN FILTER + QUICK ADD ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                {[
                  { key: "all", label: "◈ ALLE", color: "#64748b" },
                  { key: "system", label: "⚙ SYSTEM", color: "#06b6d4" },
                  { key: "custom", label: "✦ EIGENE", color: "#f59e0b" },
                ].map(f => (
                  <button key={f.key} onClick={() => setOriginFilter(f.key)} style={{
                    padding: "4px 10px", borderRadius: 7, fontSize: 9, fontWeight: 700,
                    background: originFilter === f.key ? f.color + "1a" : "transparent",
                    color: originFilter === f.key ? f.color : "#334155",
                    border: `1px solid ${originFilter === f.key ? f.color + "44" : "rgba(255,255,255,0.05)"}`,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                    transition: "all 0.2s", cursor: "pointer",
                  }}>{f.label}</button>
                ))}
                <div style={{ flex: 1 }} />
                {createQuest && (
                  <button onClick={() => { setQuickAddMode(v => !v); setQuickAddTitle(""); }} style={{
                    padding: "4px 10px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                    background: quickAddMode ? theme.primary + "1a" : "transparent",
                    color: quickAddMode ? theme.primary : "#475569",
                    border: `1px solid ${quickAddMode ? theme.primary + "44" : "rgba(255,255,255,0.06)"}`,
                    fontFamily: "'JetBrains Mono',monospace", lineHeight: 1,
                    transition: "all 0.2s", cursor: "pointer",
                  }}>+</button>
                )}
              </div>

              {/* ── QUICK ADD INPUT ── */}
              {quickAddMode && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10, animation: "slideDown 0.2s ease" }}>
                  <input
                    autoFocus
                    value={quickAddTitle}
                    onChange={e => setQuickAddTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && quickAddTitle.trim()) {
                        createQuest({ title: quickAddTitle.trim(), difficulty: "normal", category: "str", type: "side" });
                        setQuickAddTitle(""); setQuickAddMode(false);
                      }
                      if (e.key === "Escape") { setQuickAddTitle(""); setQuickAddMode(false); }
                    }}
                    placeholder="Quest-Titel... [Enter] ✓  [Esc] ✗"
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${theme.primary}44`,
                      color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11, outline: "none",
                    }}
                  />
                </div>
              )}

              {/* ── QUEST LIST ── */}
              {visibleQuests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)", marginBottom: 24 }}>
                  <div style={{ marginBottom: 10, animation: "float 3s ease-in-out infinite", display: "flex", justifyContent: "center" }}>
                    <img src="/icons/skill_attack.png" alt="no quests" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4, filter: "drop-shadow(0 0 10px rgba(100,116,139,0.4))" }} />
                  </div>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>Erstelle eine Quest um XP zu verdienen</div>
                </div>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  {showGrouped ? (
                    <>
                      {systemQuests.length > 0 && (
                        <>
                          <SectionHeader title="SYSTEM-AUFTRÄGE" icon="⚙" color="#06b6d4" count={systemQuests.length} sectionKey="system" />
                          {!collapsedSections.system && systemQuests.map((q, i) => (
                            <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} />
                          ))}
                        </>
                      )}
                      {userQuests.length > 0 && (
                        <>
                          <SectionHeader title="DEINE QUESTS" icon="✦" color="#f59e0b" count={userQuests.length} sectionKey="user" />
                          {!collapsedSections.user && userQuests.map((q, i) => (
                            <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} />
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    visibleQuests.map((q, i) => (
                      <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} />
                    ))
                  )}
                </div>
              )}
            </>
          )
        };

      case "quick_access":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <QuickAccessWidget
              navigateTo={navigateTo}
              can={can}
              theme={theme}
              setShowFocusMode={setShowFocusMode}
              setShowDawnDusk={setShowDawnDusk}
              setShowSoulLink={setShowSoulLink}
            />
          )
        };

      case "vision_board":
        if (!can('vision_board')) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <div style={{ padding: "18px", borderRadius: 16, background: "linear-gradient(135deg,rgba(168,85,247,0.05),rgba(124,58,237,0.08))", border: "1px solid #7c3aed33", position: "relative", overflow: "hidden", backdropFilter: "blur(4px)" }}>
              <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05, pointerEvents: "none", animation: "float 4s ease-in-out infinite" }}><img src={STAT_ICONS.int} alt="vision" style={{ width: 80, height: 80, objectFit: "contain" }} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <img src={STAT_ICONS.int} alt="Vision Board" style={{ width: 24, height: 24, objectFit: "contain", filter: "drop-shadow(0 0 6px #a855f788)" }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#a855f7", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>VISION BOARD</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>MANIFESTIERE DEIN SCHICKSAL</div>
                </div>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#e2e8f0", fontSize: 13, lineHeight: 1.8, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>
                <li style={{ paddingBottom: 4 }}>Ich levele jeden Tag auf – körperlich, geistig und finanziell.</li>
                <li style={{ paddingBottom: 4 }}>Mein Disziplin-Stat wächst mit jeder abgeschlossenen Quest.</li>
                <li style={{ paddingBottom: 4 }}>Ich ziehe Erfolg und Fülle wie magische Drops an.</li>
                <li style={{ paddingBottom: 4 }}>Meine Shadow Army bekämpft meine Ausreden in meinem Rücken.</li>
                <li>Ich bin der Architekt meines eigenen Systems.</li>
              </ul>
            </div>
          )
        };

      case "habits":
        if (!can('habit_tracker')) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: <HabitTracker state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} />
        };

      case "micro_habits":
        if (!can('micro_habits')) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: <MicroHabits state={state} persist={persist} notify={notify} theme={theme} />
        };

      case "next_unlock": {
        if (isCollapsed) return { content: null, isEmpty: false };
        if (state.level >= 36) {
          return {
            isEmpty: false,
            content: (
              <div style={{ padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg, rgba(34,211,153,0.06), rgba(34,211,153,0.02))", border: "1px solid rgba(34,211,153,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <div><img src={GATE_ICONS.normal} alt="all unlocked" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #34d39988) hue-rotate(90deg)" }} /></div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: "#34d399", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>ALL SYSTEMS ONLINE</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Alle Features freigeschaltet. Volle Kontrolle, Hunter.</div>
                </div>
              </div>
            )
          };
        }
        if (!nextLevel) return { content: null, isEmpty: true };
        return {
          isEmpty: false,
          content: (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ animation: "pulse 2s infinite" }}><img src={GATE_ICONS.normal} alt="locked" style={{ width: 28, height: 28, objectFit: "contain", filter: "grayscale(80%) brightness(0.5)" }} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>NÄCHSTES SYSTEM-UPDATE</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>
                  {getUnlocks(nextLevel).map(f => f.label).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace" }}>LVL {nextLevel}</div>
                <div style={{ width: 48, height: 3, borderRadius: 2, background: "rgba(99,102,241,0.15)", marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: "#6366f1", width: `${Math.min(100, (state.level / nextLevel) * 100)}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
          )
        };
      }

      default:
        return { content: null, isEmpty: true };
    }
  };

  return (
    <div style={{ animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
      {editMode && <style>{EDIT_MODE_CSS}</style>}

      {/* ── EDIT MODE HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: editMode ? 16 : 4, padding: editMode ? "12px 16px" : 0,
        background: editMode ? `linear-gradient(135deg, ${theme.primary}12, ${theme.primary}06)` : "transparent",
        border: editMode ? `1px solid ${theme.primary}30` : "none",
        borderRadius: 16,
        transition: "all 0.3s ease",
      }}>
        {editMode ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>✏️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>DASHBOARD ANPASSEN</div>
                <div style={{ fontSize: 9, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>DRAG · HIDE · REORDER</div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(false)}
              style={{
                padding: "8px 16px", borderRadius: 10,
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary || theme.primary})`,
                color: "#fff", border: "none", fontSize: 11, fontWeight: 800,
                fontFamily: "'Cinzel',serif", letterSpacing: 2, cursor: "pointer",
                boxShadow: `0 4px 16px ${theme.glow}`,
                transition: "all 0.2s",
              }}
            >FERTIG</button>
          </>
        ) : (
          <div style={{ display: "flex", width: "100%", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditMode(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b", fontSize: 10, fontWeight: 600,
                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary + "44"; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
            >
              ✏️ ANPASSEN
            </button>
          </div>
        )}
      </div>

      {/* ── WIDGET LIST ── */}
      <div ref={containerRef}>
        {visibleWidgets.map((widget, i) => {
          const def = widget;
          const { content, isEmpty } = renderWidget(def.key);
          const isCollapsed = localCollapsed[def.key];

          // In normal mode: skip widgets that have no content (like gem_booster with no active boosters)
          if (!editMode && isEmpty) return null;
          // In normal mode: if collapsed but not empty, skip (content is null but the widget exists)
          if (!editMode && !content && !isEmpty) return null;

          const dynamicStyle = dragInfo ? getDragStyle(i) : {};
          const isDragged = dragInfo?.index === i;

          return (
            <div
              key={def.key}
              data-widget-item
              style={{
                marginBottom: editMode ? 10 : 24,
                position: "relative",
                ...(editMode ? {
                  border: `1.5px dashed ${isDragged ? theme.primary + "88" : theme.primary + "30"}`,
                  borderRadius: 20,
                  padding: "8px",
                  background: isDragged ? `${theme.primary}0a` : "rgba(255,255,255,0.01)",
                  animation: isDragged ? "none" : "widgetJelly 0.4s ease-in-out infinite",
                  animationDelay: `${i * 0.07}s`,
                } : {}),
                ...dynamicStyle,
                userSelect: editMode ? "none" : "auto",
                WebkitUserSelect: editMode ? "none" : "auto",
              }}
            >
              {/* Edit-mode controls bar */}
              {editMode && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", marginBottom: isEmpty ? 0 : 6,
                  borderRadius: 12,
                  background: `${def.color}0c`,
                }}>
                  {/* Drag handle */}
                  <div
                    onPointerDown={(e) => handleDragStart(e, i)}
                    style={{
                      touchAction: "none", cursor: "grab", padding: "4px 6px",
                      color: theme.accent, fontSize: 18, lineHeight: 1,
                      display: "flex", alignItems: "center",
                      borderRadius: 6, background: "rgba(255,255,255,0.04)",
                    }}
                  >⠿</div>

                  {/* Widget icon + label */}
                  <span style={{ fontSize: 14 }}>{def.icon}</span>
                  <span style={{
                    flex: 1, fontSize: 11, fontWeight: 700, color: "#e2e8f0",
                    fontFamily: "'Outfit',sans-serif",
                  }}>{def.label}</span>

                  {/* Status indicator for empty widgets */}
                  {isEmpty && (
                    <span style={{
                      fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace",
                      padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>INAKTIV</span>
                  )}

                  {/* Collapse toggle */}
                  {!isEmpty && (
                    <button
                      onClick={() => toggleWidgetCollapse(def.key)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "none",
                        background: isCollapsed ? `${def.color}18` : "rgba(255,255,255,0.04)",
                        color: isCollapsed ? def.color : "#64748b",
                        cursor: "pointer", fontSize: 10, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      }}
                    >▼</button>
                  )}

                  {/* Remove button */}
                  {def.removable ? (
                    <button
                      onClick={() => removeWidget(def.key)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "none",
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444", cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    >✕</button>
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#334155",
                    }} title="Dieses Widget kann nicht entfernt werden">🔒</div>
                  )}
                </div>
              )}

              {/* Actual widget content */}
              {content}
            </div>
          );
        })}
      </div>

      {/* ── ADD WIDGET PANEL (Edit Mode) ── */}
      {editMode && (
        <>
          {availableWidgets.length > 0 && (
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              style={{
                width: "100%", padding: "14px", borderRadius: 16, marginBottom: 10,
                background: showAddPanel ? `${theme.primary}15` : "rgba(255,255,255,0.02)",
                border: `2px dashed ${showAddPanel ? theme.primary + "66" : "rgba(255,255,255,0.1)"}`,
                color: showAddPanel ? theme.accent : "#64748b",
                fontSize: 12, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Cinzel',serif", letterSpacing: 2,
                transition: "all 0.3s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                animation: showAddPanel ? "none" : "addWidgetPulse 3s ease-in-out infinite",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary + "88"; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={e => { if (!showAddPanel) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#64748b"; } }}
            >
              <span style={{ fontSize: 18 }}>+</span> WIDGET HINZUFÜGEN
            </button>
          )}

          {showAddPanel && availableWidgets.length > 0 && (
            <div style={{
              background: theme.card,
              border: `1px solid ${theme.primary}22`,
              borderRadius: 18, padding: "16px",
              marginBottom: 14,
              animation: "slideDown 0.3s ease",
            }}>
              <div style={{
                fontSize: 9, letterSpacing: 3, color: theme.accent,
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                marginBottom: 12,
              }}>VERFÜGBARE WIDGETS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {availableWidgets.map(widget => {
                  const locked = widget.requires && !can(widget.requires);
                  return (
                    <button
                      key={widget.key}
                      onClick={locked ? undefined : () => addWidget(widget.key)}
                      style={{
                        padding: "12px", borderRadius: 14,
                        border: `1px solid ${locked ? "rgba(255,255,255,0.04)" : widget.color + "30"}`,
                        background: locked ? "rgba(10,10,22,0.4)" : `${widget.color}08`,
                        display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                        cursor: locked ? "default" : "pointer",
                        opacity: locked ? 0.4 : 1,
                        transition: "all 0.25s",
                      }}
                      onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = widget.color + "66"; e.currentTarget.style.background = `${widget.color}14`; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                      onMouseLeave={e => { if (!locked) { e.currentTarget.style.borderColor = widget.color + "30"; e.currentTarget.style.background = `${widget.color}08`; e.currentTarget.style.transform = "none"; } }}
                    >
                      {locked ? (
                        <span style={{ fontSize: 16 }}>🔒</span>
                      ) : (
                        <span style={{ fontSize: 18 }}>{widget.icon}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: locked ? "#475569" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{widget.label}</div>
                        <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                          {locked ? "Feature gesperrt" : widget.desc}
                        </div>
                      </div>
                      {!locked && (
                        <span style={{ fontSize: 16, color: widget.color, fontWeight: 700 }}>+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={resetToDefault}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, marginBottom: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", fontSize: 11, fontWeight: 600,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
          >↻ Standard wiederherstellen</button>
        </>
      )}
    </div>
  );
}
