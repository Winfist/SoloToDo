import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { CATEGORIES, ACHIEVEMENTS } from "../../data/gameData.js";
import { getUnlocksAtLevel } from "../../data/featureUnlocks.js";
import { STAT_ICONS, GATE_ICONS, QUEST_ICONS } from "../../data/icons.js";
import { StatRadar, QuestCard, EmergencyQuestCard } from "../../data/constants";
import HabitTracker from "../HabitTracker.jsx";
import MicroHabits from "../MicroHabits.jsx";
import GemBoosterBanner from "../GemBoosterBanner.jsx";
import { DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_LAYOUT, DEFAULT_HIDDEN_WIDGETS, mergeConfig, getWidgetDef } from "./DashboardWidgetRegistry.js";
import { StreakDisplayWidget, DailyProgressWidget, QuickAccessWidget, TodayCommandCenter } from "./DashboardWidgets.jsx";
import ScrollReveal from "../ui/ScrollReveal.jsx";
import TiltCard from "../ui/TiltCard.jsx";
import { AnimatedNumber } from "../../hooks/useAnimatedCounter.jsx";
import { getToday } from "../../data/dateUtils.js";
import { HealthSummaryWidget } from "./HealthSummaryWidget.jsx";
import NativeStatsDashboard from "../NativeStatsDashboard.jsx";
import { ScreenTimeSummaryWidget } from "./ScreenTimeSummaryWidget.jsx";
import ScreenTimeDashboard from "../ScreenTimeDashboard.jsx";
import { ScreenTimeVerifyModal } from "../ScreenTimeVerifyModal.jsx";
import QuestIntensityControl from "../QuestIntensityControl.jsx";
import { isPremiumDashboardWidget } from "../../data/premium.js";

// ─── CSS KEYFRAMES for edit mode + carousel ──────────────────
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

const CAROUSEL_CSS = `
.dash-carousel {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 2px 0 8px;
}
.dash-carousel::-webkit-scrollbar { display: none; }
.dash-carousel-card {
  scroll-snap-align: start;
  flex: 0 0 84%;
  max-width: 360px;
  min-width: 0;
}
@media (min-width: 520px) {
  .dash-carousel-card {
    flex: 0 0 calc(50% - 4px);
    max-width: none;
  }
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
  completeEmergencyQuest, createQuest, onOpenDetail,
  setShowCreate, setShowTaskScan,
  snoozeReminder,
  nextLevel, getUnlocksAtLevel: _getUnlocksAtLevel,
  notify, persist,
  setIsCreatingEntry,
  getActiveGemBoosters,
  // New props for dashboard customization
  navigateTo,
  setShowFocusMode,
  setShowDawnDusk,
  setShowSoulLink,
  updateHealthData,
  claimHealthReward,
  updateScreenTimeData,
  claimScreenTimeReward,
  geminiAI,
  premiumStatus,
  requirePremium,
  openPremiumModal,
  requireQuestSlot
}) {
  const getUnlocks = _getUnlocksAtLevel || getUnlocksAtLevel;

  // --- Screen Time OCR Modal State ---
  const [showScreenTimeScanner, setShowScreenTimeScanner] = useState(false);
  const [activeScreenTimeQuest, setActiveScreenTimeQuest] = useState(null);

  const handleInterceptComplete = useCallback((questId, rect) => {
    const allQuests = [...(filteredQuests || []), ...(state?.quests || [])];
    const q = allQuests.find(qu => qu.id === questId);
    if (q && q.isScreenTime) {
      setActiveScreenTimeQuest(q);
      setShowScreenTimeScanner(true);
      return;
    }
    completeQuest(questId, rect);
  }, [filteredQuests, state?.quests, completeQuest]);

  // ── Quest sub-state (unchanged from original) ──
  const [originFilter, setOriginFilter] = useState("all");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleSection = (key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Dashboard Configuration ──
  const dashConfig = useMemo(() => mergeConfig(state.dashboardConfig, can), [state.dashboardConfig, state.level]);
  const [editMode, setEditMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showScreenTimeModal, setShowScreenTimeModal] = useState(false);

  // Lock body scroll when detail modals are open
  useEffect(() => {
    if (showHealthModal || showScreenTimeModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showHealthModal, showScreenTimeModal]);

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
  // Split into carousel (horizontal strip) and regular (vertical stack)
  const { carouselWidgets, regularWidgets } = useMemo(() => {
    const all = localLayout
      .map(key => getWidgetDef(key))
      .filter(w => {
        if (!w) return false;
        if (w.requires && !can(w.requires)) return false;
        return true;
      });
    if (editMode) return { carouselWidgets: [], regularWidgets: all };
    return {
      carouselWidgets: all.filter(w => w.carousel),
      regularWidgets: all.filter(w => !w.carousel),
    };
  }, [localLayout, can, editMode]);

  // For edit mode & drag: all widgets flat
  const visibleWidgets = useMemo(() => {
    if (editMode) return regularWidgets;
    return regularWidgets;
  }, [editMode, regularWidgets]);

  // Carousel scroll state for dot indicators
  const carouselRef = useRef(null);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || !el.children.length) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.children[0].offsetWidth + 8;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveCarouselIdx(Math.max(0, Math.min(idx, carouselWidgets.length - 1)));
  }, [carouselWidgets.length]);

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

  const todayKey = getToday();
  const diffOrder = { boss: 0, hard: 1, normal: 2, easy: 3 };
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const typeOrder = { daily: 0, weekly: 1, side: 2, chained: 3, hidden: 4 };
  const dueBucket = (quest) => {
    if (!quest.dueDate) return 3;
    if (quest.dueDate < todayKey) return 0;
    if (quest.dueDate === todayKey) return 1;
    return 2;
  };
  const sortByFocus = (a, b) =>
    dueBucket(a) - dueBucket(b)
    || (a.type === "daily" ? 0 : 1) - (b.type === "daily" ? 0 : 1)
    || (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    || (a.isSystem ? 1 : 0) - (b.isSystem ? 1 : 0)
    || (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5)
    || (diffOrder[a.difficulty] ?? 2) - (diffOrder[b.difficulty] ?? 2);
  const sortedVisibleQuests = [...visibleQuests].sort(sortByFocus);
  const systemQuests = visibleQuests.filter(q => q.isSystem).sort(sortByFocus);
  const userQuests = visibleQuests.filter(q => !q.isSystem).sort(sortByFocus);
  const completedTodayCount = (state.completedQuests || []).filter(q => q.completedAt === todayKey).length;
  const overdueVisibleCount = visibleQuests.filter(q => q.dueDate && q.dueDate < todayKey).length;
  const dueTodayVisibleCount = visibleQuests.filter(q => q.type === "daily" || q.dueDate === todayKey).length;
  const quickVisibleCount = visibleQuests.filter(q => q.energy === "quick").length;
  const questTypeFilterOptions = [
    { key: "all", label: "Alle", color: theme.accent || theme.primary },
    { key: "daily", label: "Daily", color: "#22d3ee" },
    { key: "side", label: "Side", color: "#a78bfa" },
    ...(can('weekly_quests') ? [{ key: "weekly", label: "Woche", color: "#8b5cf6" }] : []),
    ...(can('chained_quests') ? [{ key: "chained", label: "Kette", color: "#f59e0b" }] : []),
    ...(can('hidden_quests') && hiddenQuestCount > 0 ? [{ key: "hidden", label: `Hidden ${hiddenQuestCount}`, color: "#6366f1", icon: QUEST_ICONS.hidden }] : []),
  ];
  const questOriginFilterOptions = [
    { key: "all", label: "Alle Quellen" },
    { key: "system", label: "System" },
    { key: "custom", label: "Eigene" },
  ];
  const activeQuestFilterCount = (questFilter !== "all" ? 1 : 0) + (originFilter !== "all" ? 1 : 0);
  const hasActiveQuestFilters = activeQuestFilterCount > 0;
  const questTypeLabel = questTypeFilterOptions.find(f => f.key === questFilter)?.label || "Alle";
  const questOriginLabel = questOriginFilterOptions.find(f => f.key === originFilter)?.label || "Alle Quellen";
  const questFilterSummary = hasActiveQuestFilters
    ? [questFilter !== "all" ? questTypeLabel : null, originFilter !== "all" ? questOriginLabel : null].filter(Boolean).join(" / ")
    : "Alle offenen Quests";
  const overdueQuestList = sortedVisibleQuests.filter(q => q.dueDate && q.dueDate < todayKey);
  const todayQuestList = sortedVisibleQuests.filter(q => !(q.dueDate && q.dueDate < todayKey) && (q.type === "daily" || q.dueDate === todayKey));
  const laterQuestList = sortedVisibleQuests.filter(q => !(q.dueDate && q.dueDate < todayKey) && !(q.type === "daily" || q.dueDate === todayKey));
  const questBoardSections = [
    { key: "overdue", title: "Ueberfaellig", color: "#ef4444", quests: overdueQuestList },
    { key: "today", title: "Heute", color: theme.primary, quests: todayQuestList },
    { key: "later", title: "Spaeter", color: "#64748b", quests: laterQuestList },
  ].filter(section => section.quests.length > 0);
  const showGrouped = false && originFilter === "all" && (systemQuests.length > 0 && userQuests.length > 0);

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
    const premiumLocked = isPremiumDashboardWidget(widgetKey) && !premiumStatus?.active;
    if (premiumLocked) {
      const def = getWidgetDef(widgetKey);
      return {
        content: (
          <button
            onClick={() => openPremiumModal?.("advanced_widgets")}
            style={{
              width: "100%",
              minHeight: 118,
              padding: 16,
              borderRadius: 16,
              textAlign: "left",
              background: `linear-gradient(135deg, rgba(255,255,255,0.05), ${theme.primary}12, rgba(251,191,36,0.06))`,
              border: "1px solid rgba(251,191,36,0.18)",
              color: "#e2e8f0",
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 28px ${theme.primary}12`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, transparent, rgba(255,255,255,0.08), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#fde68a", fontSize: 9, fontWeight: 900, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 7 }}>
                  PRO MODUL
                </div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, fontFamily: "'Cinzel',serif", marginBottom: 5 }}>
                  {def?.label || "Premium Widget"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.45 }}>
                  Dieses Dashboard-Modul ist in Hunter Pro enthalten.
                </div>
              </div>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(251,191,36,0.10)",
                border: "1px solid rgba(251,191,36,0.22)",
                color: "#fde68a",
                fontSize: 11,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono',monospace",
                flexShrink: 0,
              }}>
                PRO
              </div>
            </div>
          </button>
        ),
        isEmpty: false
      };
    }

    switch (widgetKey) {
      case "today_command":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          content: (
            <TodayCommandCenter
              state={state}
              theme={theme}
              can={can}
              setShowFocusMode={setShowFocusMode}
              snoozeReminder={snoozeReminder}
              setShowTaskScan={setShowTaskScan}
              setShowCreate={setShowCreate}
            />
          ),
          isEmpty: false
        };

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
              {/* ── COMPACT HUNTER STATUS ── */}
              <button
                onClick={() => setShowDashboardStats(!showDashboardStats)}
                style={{
                  width: "100%", background: "rgba(8,12,24,0.82)", border: "1px solid rgba(148,163,184,0.12)",
                  borderRadius: 12, padding: "12px 13px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  marginBottom: showDashboardStats ? 12 : 0,
                  transition: "all 0.25s ease",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
                }}
              >
                {/* Level badge */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: `${theme.primary}12`,
                  border: `1px solid ${theme.primary}30`,
                }}>
                  <div style={{ fontSize: 8, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, lineHeight: 1 }}>LVL</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{state.level}</div>
                </div>

                {/* XP bar + info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif" }}>{state.hunterName}</span>
                    <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
                      {state.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(15,15,30,0.9)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{
                      width: `${xpPercent}%`, height: "100%", borderRadius: 3,
                      background: `linear-gradient(90deg,${theme.primary},${theme.accent})`,
                      transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                      position: "relative", overflow: "hidden",
                    }}>
                    </div>
                  </div>
                  {(streakBonus > 0 || formationBonus.dungeonBonus > 0) && (
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      {streakBonus > 0 && <span style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace" }}>Serie +{streakBonus}%</span>}
                      {formationBonus.dungeonBonus > 0 && <span style={{ fontSize: 9, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace" }}>Formation +{formationBonus.dungeonBonus}%</span>}
                    </div>
                  )}
                </div>

                {/* Expand chevron */}
                <div style={{
                  fontSize: 11, color: theme.primary, transition: "transform 0.3s",
                  transform: showDashboardStats ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}>v</div>
              </button>

              {/* Expanded stats (radar + attributes) */}
              {showDashboardStats && (
                <>
                  <ScrollReveal animation="scaleIn" duration={0.5}>
                    <TiltCard tiltIntensity={6} glareIntensity={0.1} holographic borderGlow={theme.primary}>
                      <div style={{ background: theme.card, border: `1px solid ${theme.primary}15`, borderRadius: 22, padding: "20px 18px 16px", marginBottom: 12, position: "relative", overflow: "hidden", backdropFilter: "blur(16px)", boxShadow: `0 4px 24px rgba(0,0,0,0.3)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>POWER LEVEL</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: `0 0 30px ${theme.primary}33` }}><AnimatedNumber value={state.level} duration={600} format="number" /></div>
                          </div>
                          <StatRadar stats={state.stats} theme={theme} size={100} />
                        </div>
                      </div>
                    </TiltCard>
                  </ScrollReveal>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 16 }}>
                    {CATEGORIES.map((cat, i) => (
                      <div key={cat.key} style={{ background: theme.card, border: `1px solid ${cat.color}20`, borderRadius: 12, padding: "8px 2px 6px", textAlign: "center", backdropFilter: "blur(8px)", transition: "border-color 0.3s" }}>
                        <div style={{ width: 32, height: 32, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}18 0%, transparent 100%)`, border: `1px solid ${cat.color}25`, overflow: "hidden" }}>
                          {cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: "110%", height: "110%", objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15) drop-shadow(0 0 4px ${cat.color}66)`, transform: "scale(1.1)" }} /> : <span style={{ fontSize: 16 }}>{cat.icon}</span>}
                        </div>
                        <div style={{ fontSize: 8, color: cat.color, marginTop: 3, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>{cat.stat}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", marginTop: 1 }}><AnimatedNumber value={(state.stats[cat.key] || 0) + (equipBonuses[cat.key + "Bonus"] || 0)} duration={700} delay={i * 80} format="number" /></div>
                      </div>
                    ))}
                  </div>
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

      case "health_summary":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          content: <HealthSummaryWidget state={state} theme={theme} openDetails={() => setShowHealthModal(true)} updateHealthData={updateHealthData} />,
          isEmpty: false
        };

      case "screen_time_summary":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          content: <ScreenTimeSummaryWidget state={state} theme={theme} openDetails={() => setShowScreenTimeModal(true)} updateScreenTimeData={updateScreenTimeData} />,
          isEmpty: false
        };

      case "quests":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <div style={{
              background: "linear-gradient(180deg, rgba(8,12,24,0.94), rgba(4,6,14,0.98))",
              border: "1px solid rgba(148,163,184,0.13)",
              borderTop: `1px solid ${theme.primary}38`,
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 14px 32px rgba(0,0,0,0.26)",
            }}>
              {/* ── EMERGENCY QUEST ── */}
              {can('emergency_quests') && state.emergencyQuest && (
                <EmergencyQuestCard quest={state.emergencyQuest} done={state.emergencyDone} failed={state.emergencyFailed} onComplete={completeEmergencyQuest} theme={theme} />
              )}

              {/* ── COMPACT QUEST BAR: Filters + Actions in one row ── */}
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
                margin: "2px 0 12px",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.4 }}>AUFTRAEGE</div>
                  <div style={{ fontSize: 24, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", fontWeight: 900, lineHeight: 1.05 }}>Quest Board</div>
                  <div style={{ marginTop: 5, color: "#94a3b8", fontSize: 12, lineHeight: 1.35 }}>
                    Alle offenen Quests an einem Ort. Erledigen, filtern, neu anlegen.
                  </div>
                </div>
                <div style={{ minWidth: 66, textAlign: "center", padding: "8px 10px", borderRadius: 12, background: `${theme.primary}10`, border: `1px solid ${theme.primary}28`, color: theme.accent || theme.primary, fontFamily: "'JetBrains Mono',monospace" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{visibleQuests.length}</div>
                  <div style={{ fontSize: 8, fontWeight: 900, marginTop: 3 }}>OFFEN</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7, marginBottom: 12 }}>
                {[
                  { label: "Heute", value: dueTodayVisibleCount, color: theme.primary },
                  { label: "Erledigt", value: completedTodayCount, color: "#22c55e" },
                  { label: "Quick", value: quickVisibleCount, color: "#f59e0b" },
                  { label: "Ueber", value: overdueVisibleCount, color: overdueVisibleCount > 0 ? "#ef4444" : "#64748b" },
                ].map(item => (
                  <div key={item.label} style={{
                    minWidth: 0,
                    padding: "8px 7px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.024)",
                    border: `1px solid ${item.color}22`,
                  }}>
                    <div style={{ color: item.color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                    <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginTop: 3 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12, padding: 11, borderRadius: 14, background: "rgba(2,6,23,0.52)", border: "1px solid rgba(148,163,184,0.12)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, alignItems: "center", marginBottom: can('quest_filters') ? 10 : 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#64748b", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>BOARD-STEUERUNG</div>
                    <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{questFilterSummary}</div>
                  </div>
                  {can('quest_filters') && (
                    <button
                      onClick={() => setFiltersOpen(open => !open)}
                      aria-expanded={filtersOpen || hasActiveQuestFilters}
                      style={{
                        minHeight: 32,
                        padding: "0 10px",
                        borderRadius: 999,
                        background: hasActiveQuestFilters ? `${theme.primary}16` : "rgba(255,255,255,0.035)",
                        color: hasActiveQuestFilters ? (theme.accent || theme.primary) : "#94a3b8",
                        border: `1px solid ${hasActiveQuestFilters ? theme.primary + "36" : "rgba(255,255,255,0.08)"}`,
                        fontSize: 9,
                        fontWeight: 900,
                        fontFamily: "'JetBrains Mono',monospace",
                        cursor: "pointer",
                      }}
                    >
                      FILTER{hasActiveQuestFilters ? ` ${activeQuestFilterCount}` : ""}
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 6 }}>
                  <button onClick={() => setShowCreate(true)} style={{ minHeight: 36, borderRadius: 10, background: `linear-gradient(135deg, ${theme.primary}24, ${theme.primary}10)`, color: theme.accent || theme.primary, border: `1px solid ${theme.primary}36`, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>NEUE QUEST</button>
                  {createQuest && (
                    <button onClick={() => quickAddMode ? setQuickAddMode(false) : (requireQuestSlot ? requireQuestSlot(() => setQuickAddMode(true)) : setQuickAddMode(true))} style={{ minHeight: 36, borderRadius: 10, background: quickAddMode ? `${theme.primary}18` : "rgba(255,255,255,0.032)", color: quickAddMode ? theme.primary : "#94a3b8", border: `1px solid ${quickAddMode ? theme.primary + "40" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>QUICK +</button>
                  )}
                  {can('ai_task_scan') && setShowTaskScan && (
                    <button onClick={() => requirePremium?.("ai_task_scan", () => setShowTaskScan(true))} style={{ minHeight: 36, borderRadius: 10, background: premiumStatus?.active ? "rgba(34,211,238,0.07)" : "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(34,211,238,0.06))", color: premiumStatus?.active ? theme.primary : "#c084fc", border: `1px solid ${premiumStatus?.active ? theme.primary + "28" : "rgba(168,85,247,0.38)"}`, cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{premiumStatus?.active ? "SCAN" : "PRO SCAN"}</button>
                  )}
                </div>

                {can('quest_filters') && (filtersOpen || hasActiveQuestFilters) && (
                  <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.1)", display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ color: "#64748b", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>ANZEIGE EINGRENZEN</div>
                      {hasActiveQuestFilters && (
                        <button
                          onClick={() => { setQuestFilter("all"); setOriginFilter("all"); }}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "#94a3b8",
                            fontSize: 8,
                            fontWeight: 900,
                            fontFamily: "'JetBrains Mono',monospace",
                            cursor: "pointer",
                          }}
                        >
                          ZURUECK
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 6 }}>
                      {questTypeFilterOptions.map(f => (
                        <button key={f.key} onClick={() => setQuestFilter(f.key)} style={{
                          minHeight: 32,
                          padding: "0 8px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 900,
                          background: questFilter === f.key ? f.color + "18" : "rgba(255,255,255,0.02)",
                          color: questFilter === f.key ? f.color : "#64748b",
                          border: `1px solid ${questFilter === f.key ? f.color + "50" : "rgba(255,255,255,0.06)"}`,
                          transition: "all 0.2s",
                          fontFamily: "'JetBrains Mono',monospace",
                          cursor: "pointer",
                        }}>
                          {f.icon ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><img src={f.icon} alt="" style={{ width: 10, height: 10, objectFit: "contain" }} />{f.label}</span> : f.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {questOriginFilterOptions.map(f => (
                        <button
                          key={f.key}
                          onClick={() => setOriginFilter(f.key)}
                          style={{
                            minHeight: 31,
                            padding: "0 6px",
                            borderRadius: 999,
                            background: originFilter === f.key ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.018)",
                            border: `1px solid ${originFilter === f.key ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.06)"}`,
                            color: originFilter === f.key ? "#cbd5e1" : "#64748b",
                            fontSize: 9,
                            fontWeight: 900,
                            fontFamily: "'JetBrains Mono',monospace",
                            cursor: "pointer",
                          }}
                        >{f.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 12, padding: 11, borderRadius: 14, background: "rgba(15,23,42,0.34)", border: "1px dashed rgba(148,163,184,0.18)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#94a3b8", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>SYSTEM-EINSTELLUNG</div>
                    <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>Regelt automatische Systemrufe.</div>
                  </div>
                  <span style={{ padding: "5px 8px", borderRadius: 999, background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.13)", color: "#94a3b8", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>KEINE QUEST</span>
                </div>
                <QuestIntensityControl state={state} persist={persist} theme={theme} compact surface="embedded" />
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
                        if (requireQuestSlot && !requireQuestSlot()) return;
                        createQuest({ title: quickAddTitle.trim(), difficulty: "normal", category: "str", type: "side", priority: "medium", energy: "quick" });
                        setQuickAddTitle(""); setQuickAddMode(false);
                      }
                      if (e.key === "Escape") { setQuickAddTitle(""); setQuickAddMode(false); }
                    }}
                    placeholder="Neue Quest... Enter speichert, Esc bricht ab"
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
                    <img src="/icons/skill_attack.webp" alt="no quests" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4, filter: "drop-shadow(0 0 10px rgba(100,116,139,0.4))" }} />
                  </div>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>Erstelle eine Quest um XP zu verdienen</div>
                </div>
              ) : (
                <div style={{ marginBottom: 24, display: "grid", gap: 12 }}>
                  {questBoardSections.map(section => (
                    <section key={section.key}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: section.color, boxShadow: `0 0 12px ${section.color}55`, flexShrink: 0 }} />
                          <span style={{ color: section.color, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>{section.title}</span>
                        </div>
                        <span style={{ color: "#64748b", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{section.quests.length}</span>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {section.quests.map((q) => (
                          <QuestCard
                            key={q.id}
                            quest={q}
                            index={sortedVisibleQuests.findIndex(item => item.id === q.id)}
                            theme={theme}
                            onComplete={handleInterceptComplete}
                            onEdit={startEditingQuest}
                            onDelete={deleteQuest}
                            onCompleteSubQuest={completeSubQuest}
                            onOpenDetail={onOpenDetail}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  {showGrouped ? (
                    <>
                      {systemQuests.length > 0 && (
                        <>
                          <SectionHeader title="SYSTEM-AUFTRÄGE" icon="⚙" color="#06b6d4" count={systemQuests.length} sectionKey="system" />
                          {!collapsedSections.system && systemQuests.map((q, i) => (
                            <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={handleInterceptComplete} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} onOpenDetail={onOpenDetail} />
                          ))}
                        </>
                      )}
                      {userQuests.length > 0 && (
                        <>
                          <SectionHeader title="DEINE QUESTS" icon="✦" color="#f59e0b" count={userQuests.length} sectionKey="user" />
                          {!collapsedSections.user && userQuests.map((q, i) => (
                            <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={handleInterceptComplete} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} onOpenDetail={onOpenDetail} />
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    null && sortedVisibleQuests.map((q, i) => (
                      <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={handleInterceptComplete} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} onOpenDetail={onOpenDetail} />
                    ))
                  )}
                </div>
              )}
            </div>
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

  const renderSummaryCarousel = () => {
    if (editMode || carouselWidgets.length === 0) return null;
    const cards = carouselWidgets.map(widget => {
      const { content, isEmpty } = renderWidget(widget.key);
      if (isEmpty || !content) return null;
      return (
        <div key={widget.key} className="dash-carousel-card">
          {content}
        </div>
      );
    }).filter(Boolean);

    if (cards.length === 0) return null;

    return (
      <div style={{ marginTop: 14 }}>
        <div
          ref={carouselRef}
          className="dash-carousel"
          onScroll={handleCarouselScroll}
        >
          {cards}
        </div>
        {cards.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 2 }}>
            {carouselWidgets.map((w, i) => (
              <div key={w.key} style={{
                width: activeCarouselIdx === i ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: activeCarouselIdx === i ? theme.accent : "rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
              }} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
      <style>{CAROUSEL_CSS}</style>
      {editMode && <style>{EDIT_MODE_CSS}</style>}

      {/* ── EDIT MODE HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: editMode ? 16 : 8, padding: editMode ? "12px 16px" : "0 2px",
        background: editMode ? "rgba(8,12,24,0.88)" : "transparent",
        border: editMode ? `1px solid ${theme.primary}24` : "none",
        borderRadius: 14,
        transition: "all 0.3s ease",
      }}>
        {editMode ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif" }}>Dashboard anpassen</div>
                <div style={{ fontSize: 9, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>DRAG / HIDE / REORDER</div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(false)}
              style={{
                padding: "8px 16px", borderRadius: 10,
                background: `${theme.primary}18`,
                color: theme.accent || theme.primary, border: `1px solid ${theme.primary}32`, fontSize: 11, fontWeight: 800,
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer",
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
                padding: "5px 10px", borderRadius: 9,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#64748b", fontSize: 10, fontWeight: 600,
                fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary + "44"; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
            >
              Layout
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

                  {/* BUG FIX #6: Configure button for carousel widgets (health, screen time) */}
                  {(def.key === "health_summary" || def.key === "screen_time_summary") && (
                    <button
                      onClick={() => {
                        if (def.key === "health_summary") setShowHealthModal(true);
                        if (def.key === "screen_time_summary") setShowScreenTimeModal(true);
                      }}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "none",
                        background: `${def.color}14`,
                        color: def.color, cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      title="Widget konfigurieren"
                    >⚙</button>
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
              {!editMode && def.key === "quests" && renderSummaryCarousel()}
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
                  const premiumLocked = isPremiumDashboardWidget(widget.key) && !premiumStatus?.active;
                  const featureLocked = widget.requires && !can(widget.requires);
                  const locked = premiumLocked || featureLocked;
                  return (
                    <button
                      key={widget.key}
                      onClick={premiumLocked ? () => openPremiumModal?.("advanced_widgets") : locked ? undefined : () => addWidget(widget.key)}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        padding: "12px", borderRadius: 14,
                        border: `1px solid ${premiumLocked ? "rgba(251,191,36,0.24)" : locked ? "rgba(255,255,255,0.04)" : widget.color + "30"}`,
                        background: premiumLocked ? "linear-gradient(135deg, rgba(251,191,36,0.09), rgba(168,85,247,0.08), rgba(255,255,255,0.025))" : locked ? "rgba(10,10,22,0.4)" : `${widget.color}08`,
                        display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                        cursor: premiumLocked ? "pointer" : locked ? "default" : "pointer",
                        opacity: featureLocked ? 0.4 : 1,
                        transition: "all 0.25s",
                        boxShadow: premiumLocked ? `inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 20px ${theme.primary}10` : "none",
                      }}
                      onMouseEnter={e => { if (premiumLocked) { e.currentTarget.style.borderColor = "rgba(251,191,36,0.42)"; e.currentTarget.style.transform = "translateY(-2px)"; } else if (!locked) { e.currentTarget.style.borderColor = widget.color + "66"; e.currentTarget.style.background = `${widget.color}14`; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                      onMouseLeave={e => { if (premiumLocked) { e.currentTarget.style.borderColor = "rgba(251,191,36,0.24)"; e.currentTarget.style.transform = "none"; } else if (!locked) { e.currentTarget.style.borderColor = widget.color + "30"; e.currentTarget.style.background = `${widget.color}08`; e.currentTarget.style.transform = "none"; } }}
                    >
                      {premiumLocked && (
                        <span style={{ position: "absolute", top: 6, right: 7, padding: "2px 6px", borderRadius: 999, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "#fde68a", fontSize: 7, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                          PRO
                        </span>
                      )}
                      {premiumLocked ? (
                        <span style={{ fontSize: 9, color: "#fde68a", fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>PRO</span>
                      ) : locked ? (
                        <span style={{ fontSize: 16 }}>🔒</span>
                      ) : (
                        <span style={{ fontSize: 18 }}>{widget.icon}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: premiumLocked ? "#fde68a" : locked ? "#475569" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{widget.label}</div>
                        <div style={{ fontSize: 8, color: premiumLocked ? "#a78bfa" : "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                          {premiumLocked ? "Noch nicht verfuegbar im Free-Modus" : locked ? "Feature gesperrt" : widget.desc}
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

      {/* ── Health & Steps Details Modal ── */}
      {showHealthModal && typeof document !== "undefined" && createPortal(
        <div
          onTouchMove={e => e.stopPropagation()}
          onWheel={e => e.stopPropagation()}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
            zIndex: 9999, display: "flex", flexDirection: "column",
            animation: "fadeIn 0.25s ease",
            touchAction: "none", overscrollBehavior: "contain"
          }}>
          {/* Safe Area Header */}
          <div style={{ padding: "max(env(safe-area-inset-top, 0px), 24px) 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#38bdf8", letterSpacing: 2 }}>
              SYSTEM:// HEALTH_SYNC
            </div>
            <button
              onClick={() => setShowHealthModal(false)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                width: 36, height: 36, borderRadius: 18,
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >✕</button>
          </div>

          {/* Modal Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            <div style={{
              background: "rgba(15,23,42,0.6)", borderRadius: 24, padding: "20px",
              border: "1px solid rgba(56,189,248,0.2)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(56,189,248,0.05)",
              maxWidth: 480, margin: "0 auto"
            }}>
              <NativeStatsDashboard
                state={state}
                persist={persist}
                updateHealthData={updateHealthData}
                claimHealthReward={claimHealthReward}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {showScreenTimeModal && typeof document !== "undefined" && createPortal(
        <div
          onTouchMove={e => e.stopPropagation()}
          onWheel={e => e.stopPropagation()}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
            zIndex: 9999, display: "flex", flexDirection: "column",
            animation: "fadeIn 0.25s ease",
            touchAction: "none", overscrollBehavior: "contain"
          }}>
          <div style={{ padding: "max(env(safe-area-inset-top, 0px), 24px) 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#f59e0b", letterSpacing: 2 }}>
              SYSTEM:// SCREEN_TIME
            </div>
            <button
              onClick={() => setShowScreenTimeModal(false)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                width: 36, height: 36, borderRadius: 18,
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            <div style={{
              background: "rgba(15,23,42,0.6)", borderRadius: 24, padding: "20px",
              border: "1px solid rgba(245,158,11,0.2)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(245,158,11,0.05)",
              maxWidth: 480, margin: "0 auto"
            }}>
              <ScreenTimeDashboard
                state={state}
                persist={persist}
                updateScreenTimeData={updateScreenTimeData}
                claimScreenTimeReward={claimScreenTimeReward}
                geminiAI={geminiAI}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      {showScreenTimeScanner && activeScreenTimeQuest && (
        <ScreenTimeVerifyModal
          quest={activeScreenTimeQuest}
          geminiAI={geminiAI}
          dailyLimitMinutes={state?.screenTimePreferences?.dailyLimitMinutes || 120}
          theme={theme}
          onComplete={(verified) => {
            setShowScreenTimeScanner(false);
            if (verified) {
              completeQuest(activeScreenTimeQuest.id, null);
            }
            setActiveScreenTimeQuest(null);
          }}
          onSkip={() => {
            setShowScreenTimeScanner(false);
            setActiveScreenTimeQuest(null);
          }}
        />
      )}
    </div>
  );
}
