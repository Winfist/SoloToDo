import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { getUnlocksAtLevel } from "../../data/featureUnlocks.js";
import { STAT_ICONS, GATE_ICONS, QUEST_ICONS, HEALTH_ICONS, NAV_ICONS } from "../../data/icons.js";
import { QuestCard, EmergencyQuestCard } from "../../data/constants";
import HabitTracker from "../HabitTracker.jsx";
import MicroHabits from "../MicroHabits.jsx";
import GemBoosterBanner from "../GemBoosterBanner.jsx";
import { DEFAULT_DASHBOARD_LAYOUT, DEFAULT_HIDDEN_WIDGETS, mergeConfig, getWidgetDef, getDashboardWidgets } from "./DashboardWidgetRegistry.js";
import { StreakDisplayWidget, DailyProgressWidget, QuickAccessWidget, TodayCommandCenter, ArtifactShowcaseWidget } from "./DashboardWidgets.jsx";
import { getToday } from "../../data/dateUtils.js";
import { HealthSummaryWidget } from "./HealthSummaryWidget.jsx";
import NativeStatsDashboard from "../NativeStatsDashboard.jsx";
import { ScreenTimeSummaryWidget } from "./ScreenTimeSummaryWidget.jsx";
import ScreenTimeDashboard from "../ScreenTimeDashboard.jsx";
import { ScreenTimeVerifyModal } from "../ScreenTimeVerifyModal.jsx";
import SystemUpdatePreviewModal from "./SystemUpdatePreviewModal.jsx";
import { isPremiumDashboardWidget } from "../../data/premium.js";
import {
  getQuestDescription,
  getQuestReplacementStatus,
  groupQuestStacks,
  isQuestReplaceable,
} from "../../data/questUtils.js";
import { getQuestPlanningSnapshot, getQuestPlanningState } from "../../data/questPlanning.js";
import { getDailySystemQuestCount } from "../../data/questIntensity.js";
import { getQuestPresentation } from "../../data/questPresentation.js";
import { useI18n } from "../i18n/I18nProvider.jsx";
import QuestIntensityControl from "../QuestIntensityControl.jsx";
import { SCREEN_TIME_ENABLED } from "../../data/featureFlags.js";
import QuestForgeCard from "../QuestForgeCard.jsx";

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
  gap: 18px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 2px 0 8px;
}
.dash-carousel::-webkit-scrollbar { display: none; }
.dash-carousel-card {
  scroll-snap-align: start;
  flex: 0 0 88%;
  max-width: 420px;
  min-width: 0;
}
@media (min-width: 520px) {
  .dash-carousel-card {
    flex: 0 0 calc(50% - 9px);
    max-width: none;
  }
}
@keyframes premiumModuleBreath {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
`;

const PREMIUM_WIDGET_LOCK_COPY = {
  health_summary: {
    iconSrc: HEALTH_ICONS.steps,
    feature: "advanced_widgets",
  },
  screen_time_summary: {
    iconSrc: NAV_ICONS.timer,
    feature: "advanced_widgets",
  },
  vision_board: {
    iconSrc: STAT_ICONS.int,
    feature: "advanced_widgets",
  },
};

function PremiumDashboardLockCard({ widgetKey, def, theme, onOpenPremium, compact = false }) {
  const { t } = useI18n();
  const staticCopy = PREMIUM_WIDGET_LOCK_COPY[widgetKey] || {};
  const localText = (key, params) => {
    const value = t(key, params);
    return value && value !== key ? value : null;
  };
  const copy = {
    eyebrow: localText(`dashboard.premiumLock.${widgetKey}.eyebrow`) || t("dashboard.premiumLock.fallbackEyebrow"),
    title: localText(`dashboard.premiumLock.${widgetKey}.title`) || t("dashboard.premiumLock.fallbackTitle", { label: def?.label || "Module" }),
    desc: localText(`dashboard.premiumLock.${widgetKey}.desc`) || t("dashboard.premiumLock.fallbackDesc"),
    iconSrc: null,
    feature: "advanced_widgets",
  };
  copy.iconSrc = staticCopy.iconSrc || copy.iconSrc;
  copy.feature = staticCopy.feature || copy.feature;
  const accent = def?.color || theme?.primary || "#a855f7";
  const open = () => onOpenPremium?.(copy.feature || "advanced_widgets");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      style={{
        width: "100%",
        minHeight: compact ? 120 : 140,
        padding: compact ? "14px" : "18px 16px",
        borderRadius: 20,
        textAlign: "left",
        background: "rgba(10,12,22,0.55)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        border: "1px solid rgba(251,191,36,0.10)",
        color: "#e2e8f0",
        cursor: "pointer",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 20px rgba(0,0,0,0.12)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: compact ? 10 : 14,
        outline: "none",
        transition: "border-color 0.25s ease",
      }}
    >
      {/* Content */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 13, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fbbf24", fontSize: 9, fontWeight: 700, letterSpacing: 1.8, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
            {copy.eyebrow}
          </div>
          <div style={{ color: "#fff", fontSize: compact ? 15 : 17, fontWeight: 800, fontFamily: "'Outfit',sans-serif", marginBottom: 5, lineHeight: 1.15 }}>
            {copy.title}
          </div>
          <div style={{ color: "#7b8494", fontSize: compact ? 11 : 12, lineHeight: 1.45, fontFamily: "'Outfit',sans-serif" }}>
            {copy.desc}
          </div>
        </div>
        <div style={{
          width: compact ? 40 : 44,
          height: compact ? 40 : 44,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(251,191,36,0.06)",
          border: "1px solid rgba(251,191,36,0.12)",
          flexShrink: 0,
          animation: "premiumModuleBreath 3s ease-in-out infinite",
        }}>
          {copy.iconSrc ? (
            <img src={copy.iconSrc} alt="" style={{ width: compact ? 20 : 22, height: compact ? 20 : 22, objectFit: "contain", opacity: 0.7 }} />
          ) : (
            <span style={{ color: "#fbbf24", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>PRO</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 30,
          padding: "0 14px",
          borderRadius: 999,
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.18)",
          color: "#fbbf24",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: 0.8,
        }}>
          {t("dashboard.premiumLock.cta")}
        </span>
      </div>
    </div>
  );
}

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
  xpPercent, xpNeeded,
  filteredQuests, hiddenQuestCount,
  questFilter, setQuestFilter,
  completeQuest, completeGoalMilestone, completeSubQuest, startEditingQuest, deleteQuest,
  getReplacementCandidates, replaceSystemQuest,
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
  requireAIGeneration,
  aiGenerationStatus,
  openPremiumModal,
  requireQuestSlot,
  setDailyFocusQuest,
  togglePinnedQuest,
  habitDraft,
  onHabitDraftHandled,
  forgeStatus,
  forgePhase,
  forgeTargets,
  forgePendingCount,
  onForge,
  crystallization,
  onCrystallizeAccept,
  onCrystallizeDecline
}) {
  const { t, locale } = useI18n();
  const getUnlocks = _getUnlocksAtLevel || getUnlocksAtLevel;

  // --- Screen Time OCR Modal State ---
  const [showScreenTimeScanner, setShowScreenTimeScanner] = useState(false);
  const [activeScreenTimeQuest, setActiveScreenTimeQuest] = useState(null);
  const [showSystemUpdatePreview, setShowSystemUpdatePreview] = useState(false);

  const handleInterceptComplete = useCallback((questId, rect) => {
    const allQuests = [...(filteredQuests || []), ...(state?.quests || [])];
    const q = allQuests.find(qu => qu.id === questId);
    if (SCREEN_TIME_ENABLED && q && q.isScreenTime) {
      setActiveScreenTimeQuest(q);
      setShowScreenTimeScanner(true);
      return;
    }
    // Step-goal quests are verified by Health data, not a manual tap.
    if (q && q.isStepGoal) {
      const steps = Math.max(0, Math.floor(Number(state?.dailySteps) || 0));
      const target = q.stepTarget || 10000;
      if (steps >= target) {
        completeQuest(questId, rect);
      } else {
        const fmt = n => n.toLocaleString(locale === "de" ? "de-DE" : "en-US");
        notify?.(t('quests.stepGoalProgress', { current: fmt(steps), target: fmt(target) }), "info");
      }
      return;
    }
    completeQuest(questId, rect);
  }, [filteredQuests, state?.quests, state?.dailySteps, completeQuest, notify, t, locale]);

  // ── Quest sub-state (unchanged from original) ──
  const [originFilter, setOriginFilter] = useState("all");
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [freqOpen, setFreqOpen] = useState(false);
  const [replacementQuest, setReplacementQuest] = useState(null);
  const [replacementOptions, setReplacementOptions] = useState([]);

  // ── Dashboard Configuration ──
  const dashConfig = useMemo(() => mergeConfig(state.dashboardConfig, can), [state.dashboardConfig, state.level]);
  const [editMode, setEditMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showScreenTimeModal, setShowScreenTimeModal] = useState(false);
  const [showEditHeader, setShowEditHeader] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let startY = 0;
    let startedAtTop = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      startedAtTop = window.scrollY <= 0;
    };

    const handleTouchMove = (e) => {
      if (!startedAtTop) return;
      
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      
      if (window.scrollY <= 0) {
        if (diffY > 40) {
          setShowEditHeader(true);
        } else if (diffY < -10) {
          setShowEditHeader(false);
        }
      }
    };

    const handleWheel = (e) => {
      if (window.scrollY <= 0) {
        if (e.deltaY < -30) {
          setShowEditHeader(true);
        } else if (e.deltaY > 10) {
          setShowEditHeader(false);
        }
      }
    };

    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Any normal scroll down hides the header. 
      // We intentionally do NOT check for currentY < 0 here anymore, 
      // so a fast kinetic scroll bounce hitting the top won't accidentally reveal the header.
      if (currentY > 5) {
        setShowEditHeader(false);
      }
      
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);


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
  const hasVisibleHabitTracker = can('habit_tracker') && localLayout.includes("habits") && !localCollapsed.habits;

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
    const def = getWidgetDef(key, locale);
    if (!def?.removable) return;
    const newLayout = localLayout.filter(k => k !== key);
    const newHidden = [...localHidden, key];
    setLocalLayout(newLayout);
    setLocalHidden(newHidden);
    commitConfig(newLayout, newHidden, localCollapsed);
  }, [localLayout, localHidden, localCollapsed, commitConfig, locale]);

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
      .map(key => getWidgetDef(key, locale))
      .filter(w => {
        if (!w) return false;
        const premiumLocked = isPremiumDashboardWidget(w.key) && !premiumStatus?.active;
        if (w.requires && !can(w.requires) && !premiumLocked) return false;
        return true;
      });
    if (editMode) return { carouselWidgets: [], regularWidgets: all };
    return {
      carouselWidgets: all.filter(w => w.carousel),
      regularWidgets: all.filter(w => !w.carousel),
    };
  }, [localLayout, can, editMode, premiumStatus?.active, locale]);

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
    return getDashboardWidgets(locale).filter(w => {
      if (localLayout.includes(w.key)) return false;
      return true;
    });
  }, [localLayout, locale]);
  const planningSnapshot = useMemo(() => getQuestPlanningSnapshot(state), [state]);
  const planningState = getQuestPlanningState(state);

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
  const sortedVisibleQuestGroups = groupQuestStacks(sortedVisibleQuests);
  const questTypeFilterOptions = [
    { key: "all", label: t("dashboard.board.typeAll"), color: theme.accent || theme.primary },
    { key: "daily", label: t("dashboard.board.typeDaily"), color: "#22d3ee" },
    { key: "side", label: t("dashboard.board.typeSide"), color: "#a78bfa" },
    ...(can('weekly_quests') ? [{ key: "weekly", label: t("dashboard.board.typeWeekly"), color: "#8b5cf6" }] : []),
    ...(can('chained_quests') ? [{ key: "chained", label: t("dashboard.board.typeChained"), color: "#f59e0b" }] : []),
    ...(can('hidden_quests') && hiddenQuestCount > 0 ? [{ key: "hidden", label: `Hidden ${hiddenQuestCount}`, color: "#6366f1", icon: QUEST_ICONS.hidden }] : []),
  ];
  const questOriginFilterOptions = [
    { key: "all", label: t("dashboard.board.originAll") },
    { key: "system", label: t("dashboard.board.originSystem") },
    { key: "custom", label: t("dashboard.board.originCustom") },
  ];
  const activeQuestFilterCount = (questFilter !== "all" ? 1 : 0) + (originFilter !== "all" ? 1 : 0);
  const hasActiveQuestFilters = activeQuestFilterCount > 0;
  const questTypeLabel = questTypeFilterOptions.find(f => f.key === questFilter)?.label || t("dashboard.board.typeAll");
  const questOriginLabel = questOriginFilterOptions.find(f => f.key === originFilter)?.label || t("dashboard.board.originAll");
  const questFilterSummary = hasActiveQuestFilters
    ? [questFilter !== "all" ? questTypeLabel : null, originFilter !== "all" ? questOriginLabel : null].filter(Boolean).join(" / ")
    : t("dashboard.board.summaryAll");
  const filteredQuestIds = new Set(filteredQuests.map(q => q.id));
  const dashboardLoadout = planningSnapshot.loadout.filter(q =>
    filteredQuestIds.has(q.id)
    && (originFilter === "all" || (originFilter === "system" ? q.isSystem : !q.isSystem))
  );
  const forgeLoadout = dashboardLoadout.filter(q => q.origin === "forge");
  const questBoardSections = [
    { key: "forge", title: locale === "en" ? "⚒ FROM THE FORGE" : "⚒ AUS DER SCHMIEDE", color: "#818cf8", quests: groupQuestStacks(forgeLoadout) },
    { key: "loadout", title: locale === "en" ? "YOUR LOADOUT" : "DEIN LOADOUT", color: theme.primary, quests: groupQuestStacks(dashboardLoadout.filter(q => q.origin !== "forge")) },
  ].filter(section => section.quests.length > 0);
  const replacementStatus = getQuestReplacementStatus(state);

  const openReplacementPicker = useCallback((quest) => {
    if (!quest || !replaceSystemQuest || !getReplacementCandidates) return;
    const status = getQuestReplacementStatus(state);
    if (!status.canReplace) {
      notify?.(`Ersatzlimit erreicht (${status.used}/${status.limit})`, "warning");
      return;
    }
    const candidates = getReplacementCandidates(quest.id);
    if (!candidates.length) {
      notify?.("Keine passenden Ersatz-Quests verfuegbar.", "warning");
      return;
    }
    setReplacementQuest(quest);
    setReplacementOptions(candidates);
  }, [state, replaceSystemQuest, getReplacementCandidates, notify]);

  const confirmReplacement = useCallback((template) => {
    if (!replacementQuest || !template) return;
    const replaced = replaceSystemQuest?.(replacementQuest.id, template);
    if (replaced !== false) {
      setReplacementQuest(null);
      setReplacementOptions([]);
    }
  }, [replacementQuest, replaceSystemQuest]);

  // ── Render individual widget content by key ──
  // Returns { content, isEmpty } where isEmpty=true means the widget has no visible content
  const renderWidget = (widgetKey) => {
    const isCollapsed = localCollapsed[widgetKey];
    const premiumLocked = isPremiumDashboardWidget(widgetKey) && !premiumStatus?.active;
    if (premiumLocked) {
      const def = getWidgetDef(widgetKey, locale);
      return {
        content: (
          <PremiumDashboardLockCard
            widgetKey={widgetKey}
            def={def}
            theme={theme}
            onOpenPremium={openPremiumModal}
            compact={def?.carousel}
          />
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

      case "artifact_showcase": {
        const artifacts = state.artifacts || {};
        if (Object.keys(artifacts).length === 0) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return { content: <ArtifactShowcaseWidget state={state} theme={theme} />, isEmpty: false };
      }

      case "hunter_status":
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <>
              <div
                data-tutorial="hunter-status"
                style={{
                  width: "100%",
                  background: "rgba(10,12,22,0.55)",
                  backdropFilter: "blur(20px) saturate(1.3)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.3)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  padding: "16px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                {/* Level badge — round */}
                <div style={{
                  width: 46, height: 46, borderRadius: 999, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: `${theme.primary}0a`,
                  border: `1.5px solid ${theme.primary}20`,
                }}>
                  <div style={{ fontSize: 7, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, lineHeight: 1 }}>LVL</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{state.level}</div>
                </div>

                {/* XP bar + info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{t("dashboard.widgets.hunter_status.label")}</span>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                      {Math.round(xpPercent || 0)}%
                    </span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, xpPercent || 0))}%`, height: "100%", borderRadius: 999,
                      background: `linear-gradient(90deg,${theme.primary},${theme.accent})`,
                      transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 7, color: "#64748b", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>
                    <span>Nächstes Level</span>
                    <span style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
                      {(state.xp || 0).toLocaleString()} / {(xpNeeded || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
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
            <div data-tutorial="quest-board" style={{
              background: "rgba(10,12,22,0.55)",
              backdropFilter: "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 22,
              padding: "18px 16px",
              boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.15)",
            }}>
              {/* ── EMERGENCY QUEST ── */}
              {can('emergency_quests') && state.emergencyQuest && (
                <div data-tutorial="emergency-quest">
                  <EmergencyQuestCard quest={state.emergencyQuest} done={state.emergencyDone} failed={state.emergencyFailed} onComplete={completeEmergencyQuest} theme={theme} />
                </div>
              )}
              {planningSnapshot.mandatory.length > 0 && (
                <div style={{ marginBottom: 14, padding: 11, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <div style={{ color: "#f87171", fontSize: 9, fontWeight: 900, letterSpacing: 1.5, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>SYSTEM-ALARM</div>
                  {planningSnapshot.mandatory.map((quest, index) => (
                    <QuestCard key={quest.id} quest={quest} index={index} theme={theme} onComplete={handleInterceptComplete} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} onOpenDetail={onOpenDetail} />
                  ))}
                </div>
              )}

              {/* ── Quest Board Header ── */}
              <div style={{ margin: "0 0 14px" }}>
                <div style={{ fontSize: 28, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", fontWeight: 800, lineHeight: 1.05 }}>{t("dashboard.board.title")}</div>
                <div style={{ marginTop: 5, color: "#7b8494", fontSize: 13, lineHeight: 1.4, fontFamily: "'Outfit',sans-serif" }}>
                  {t("dashboard.board.desc")}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                {planningSnapshot.overloadStatus.level !== "calm" && (
                  <button onClick={() => navigateTo?.("quest_log")} style={{ width: "100%", marginBottom: 10, padding: "10px 11px", borderRadius: 12, textAlign: "left", cursor: "pointer", background: planningSnapshot.overloadStatus.overloaded ? "rgba(239,68,68,0.09)" : "rgba(245,158,11,0.08)", border: `1px solid ${planningSnapshot.overloadStatus.overloaded ? "rgba(239,68,68,0.24)" : "rgba(245,158,11,0.2)"}`, color: planningSnapshot.overloadStatus.overloaded ? "#f87171" : "#fbbf24", fontSize: 11, fontWeight: 800 }}>
                    {planningSnapshot.overloadStatus.overloaded ? "SYSTEMRUFE PAUSIERT" : "QUEST-LOG PRÜFEN"} · {planningSnapshot.overloadStatus.actionableCount} offen
                  </button>
                )}
                {/* Filter summary + toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ flex: 1, minWidth: 0, color: "#64748b", fontSize: 12, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{questFilterSummary}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {can('quest_filters') && (
                      <button
                        onClick={() => setFiltersOpen(open => !open)}
                        aria-expanded={filtersOpen || hasActiveQuestFilters}
                        aria-pressed={filtersOpen}
                        style={{
                          minHeight: 30,
                          padding: "0 10px",
                          borderRadius: 999,
                          background: filtersOpen
                            ? `linear-gradient(135deg, ${theme.primary}28, ${theme.primary}10)`
                            : hasActiveQuestFilters ? `${theme.primary}10` : "rgba(255,255,255,0.03)",
                          color: filtersOpen || hasActiveQuestFilters ? (theme.accent || theme.primary) : "#64748b",
                          border: `1px solid ${filtersOpen ? theme.primary + "88" : hasActiveQuestFilters ? theme.primary + "38" : "transparent"}`,
                          boxShadow: filtersOpen ? `0 0 16px ${theme.primary}33, inset 0 1px 0 rgba(255,255,255,0.12)` : "none",
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono',monospace",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {t("dashboard.board.filter")}{hasActiveQuestFilters ? ` ${activeQuestFilterCount}` : ""}
                      </button>
                    )}
                    <button
                      onClick={() => setFreqOpen(open => !open)}
                      aria-expanded={freqOpen}
                      aria-pressed={freqOpen}
                      style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, background: freqOpen ? `linear-gradient(135deg, ${theme.primary}28, ${theme.primary}10)` : `${theme.primary}10`, color: theme.accent || theme.primary, border: `1px solid ${freqOpen ? theme.primary + "88" : theme.primary + "28"}`, boxShadow: freqOpen ? `0 0 16px ${theme.primary}33, inset 0 1px 0 rgba(255,255,255,0.12)` : "none", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease" }}
                    >
                      ⚡ {t("dashboard.board.frequency")} · {getDailySystemQuestCount(state)}/{t("dashboard.board.perDayShort")}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 6 }}>
                  <button data-tutorial="create-quest-btn" onClick={() => setShowCreate(true)} style={{ minHeight: 36, borderRadius: 12, background: `${theme.primary}0c`, color: theme.accent || theme.primary, border: "none", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "background 0.2s" }}>{t("dashboard.board.create")}</button>
                  {createQuest && (
                    <button onClick={() => quickAddMode ? setQuickAddMode(false) : (requireQuestSlot ? requireQuestSlot(() => setQuickAddMode(true)) : setQuickAddMode(true))} style={{ minHeight: 36, borderRadius: 12, background: quickAddMode ? `${theme.primary}10` : "rgba(255,255,255,0.025)", color: quickAddMode ? theme.primary : "#64748b", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>QUICK +</button>
                  )}
                  {can('ai_task_scan') && setShowTaskScan && (
                    <button onClick={() => requireAIGeneration?.("ai_task_scan", () => setShowTaskScan(true))} style={{ minHeight: 36, borderRadius: 12, background: premiumStatus?.active ? "rgba(34,211,238,0.06)" : "rgba(168,85,247,0.08)", color: premiumStatus?.active ? theme.primary : "#c084fc", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{aiGenerationStatus?.allowed ? "SCAN" : "PRO SCAN"}</button>
                  )}
                </div>

                {can('quest_filters') && (filtersOpen || hasActiveQuestFilters) && (
                  <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.1)", display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ color: "#64748b", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>{t("dashboard.board.narrow")}</div>
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
                          {t("dashboard.board.reset")}
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

                {freqOpen && (
                  <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                    <QuestIntensityControl
                      state={state}
                      persist={persist}
                      theme={theme}
                      compact
                      premiumStatus={premiumStatus}
                      onOpenPremium={openPremiumModal}
                      lockMode={premiumStatus?.active ? "full" : "partial"}
                    />
                  </div>
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
                        if (requireQuestSlot && !requireQuestSlot()) return;
                        createQuest({ title: quickAddTitle.trim(), difficulty: "normal", category: "str", type: "side", priority: "medium", energy: "quick" });
                        setQuickAddTitle(""); setQuickAddMode(false);
                      }
                      if (e.key === "Escape") { setQuickAddTitle(""); setQuickAddMode(false); }
                    }}
                    placeholder={t("dashboard.board.quickPlaceholder")}
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

              {forgeStatus && (
                <QuestForgeCard
                  theme={theme}
                  status={forgeStatus}
                  phase={forgePhase}
                  targets={forgeTargets}
                  pendingCount={forgePendingCount}
                  onForge={onForge}
                />
              )}

              {crystallization && (
                <section style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 16, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: "#34d399", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{t("quests.goalRitual.crystallize.title")}</div>
                  <div style={{ fontSize: 11.5, color: "#cbd5e1", marginTop: 4, lineHeight: 1.5 }}>
                    {t("quests.goalRitual.crystallize.body", { count: crystallization.count, category: t(`quests.goalRitual.crystallize.categories.${crystallization.category}`) })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="press-feedback" onClick={() => onCrystallizeAccept(crystallization.category)} style={{ fontSize: 10, fontWeight: 800, padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid #34d39944", fontFamily: "'JetBrains Mono',monospace" }}>{t("quests.goalRitual.crystallize.cta")}</button>
                    <button onClick={() => onCrystallizeDecline(crystallization.category)} style={{ fontSize: 10, padding: "7px 12px", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#64748b", border: "none", fontFamily: "'Outfit',sans-serif" }}>{t("quests.goalRitual.crystallize.dismiss")}</button>
                  </div>
                </section>
              )}

              {/* ── QUEST LIST ── */}
              {dashboardLoadout.length === 0 ? (
                planningSnapshot.completedToday > 0 ? (
                  <div style={{ textAlign: "center", padding: "42px 20px 36px", background: theme.card, borderRadius: 16, border: "1px solid rgba(148,163,184,0.12)", backdropFilter: "blur(8px)", marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `${theme.primary}08`, border: `1px solid ${theme.primary}22` }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", marginBottom: 5 }}>{t("dashboard.board.allDoneTitle")}</div>
                    <div style={{ fontSize: 12, color: "#7b8494", lineHeight: 1.5, fontFamily: "'Outfit',sans-serif", marginBottom: 14 }}>{t("dashboard.board.allDoneDesc")}</div>
                    <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: 999, background: `${theme.primary}10`, border: `1px solid ${theme.primary}24`, color: theme.accent || theme.primary, fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.6 }}>
                      {t("dashboard.board.allDoneCount", { count: planningSnapshot.completedToday })}
                    </span>
                    {planningSnapshot.questLog.length > 0 && (
                      <div>
                        <button onClick={() => navigateTo?.("quest_log")} style={{ marginTop: 14, padding: "8px 11px", borderRadius: 9, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(148,163,184,0.06)", color: "#94a3b8", cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>
                          QUEST-LOG ÖFFNEN ({planningSnapshot.questLog.length})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)", marginBottom: 24 }}>
                  <div style={{ marginBottom: 10, animation: "float 3s ease-in-out infinite", display: "flex", justifyContent: "center" }}>
                    <img src="/icons/skill_attack.webp" alt="no quests" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4, filter: "drop-shadow(0 0 10px rgba(100,116,139,0.4))" }} />
                  </div>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>{t("dashboard.board.emptyTitle")}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>{t("dashboard.board.emptyDesc")}</div>
                  {planningSnapshot.questLog.length > 0 && (
                    <button onClick={() => navigateTo?.("quest_log")} style={{ marginTop: 12, padding: "8px 11px", borderRadius: 9, border: `1px solid ${theme.primary}33`, background: `${theme.primary}10`, color: theme.primary, cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>
                      QUEST-LOG ÖFFNEN ({planningSnapshot.questLog.length})
                    </button>
                  )}
                </div>
                )
              ) : (
                <div style={{ marginBottom: 24, display: "grid", gap: 12 }}>
                  {questBoardSections.map(section => (
                    <section
                      key={section.key}
                      style={section.key === "forge" ? { border: "1px solid rgba(129,140,248,0.25)", borderRadius: 14, padding: 10 } : undefined}
                    >
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
                            index={sortedVisibleQuestGroups.findIndex(item => item.id === q.id)}
                            theme={theme}
                            onComplete={handleInterceptComplete}
                            onMilestoneDone={completeGoalMilestone}
                            onGoalSetupOpen={() => navigateTo?.("goals")}
                            onEdit={startEditingQuest}
                            onDelete={deleteQuest}
                            onCompleteSubQuest={completeSubQuest}
                            onOpenDetail={onOpenDetail}
                            onSetFocus={setDailyFocusQuest}
                            isDailyFocus={state.dailyFocusQuestId === q.id}
                            isSystemMark={planningSnapshot.systemMarkQuestId === q.id}
                            hasAmulet={state.artifacts?.focusAmulet}
                            onTogglePin={togglePinnedQuest}
                            isPinned={planningState.pinnedQuestIds.includes(q.id)}
                            canReplace={isQuestReplaceable(q) && replacementStatus.remaining > 0}
                            onReplace={openReplacementPicker}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  {planningSnapshot.questLog.length > 0 && (
                    <button onClick={() => navigateTo?.("quest_log")} style={{ width: "100%", minWidth: 0, maxWidth: "100%", contain: "inline-size", padding: "11px 12px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.13)", background: "rgba(100,116,139,0.08)", color: "#cbd5e1", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#94a3b8", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                        <span>WEITERE QUESTS: {planningSnapshot.questLog.length}</span>
                        <span>QUEST-LOG ÖFFNEN</span>
                      </div>
                      {planningSnapshot.questLog.slice(0, 2).map(quest => (
                        <div key={quest.id} style={{ marginTop: 7, color: "#64748b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {getQuestPresentation(quest, locale).title}
                        </div>
                      ))}
                    </button>
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
            <div style={{ padding: "18px 16px", borderRadius: 20, background: "rgba(10,12,22,0.55)", backdropFilter: "blur(20px) saturate(1.3)", WebkitBackdropFilter: "blur(20px) saturate(1.3)", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden", boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 20px rgba(0,0,0,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <img src={STAT_ICONS.int} alt="Vision Board" style={{ width: 22, height: 22, objectFit: "contain", opacity: 0.8 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.6 }}>{t("dashboard.widgets.vision_board.label").toUpperCase()}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Outfit',sans-serif" }}>{t("dashboard.vision.subtitle")}</div>
                </div>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#e2e8f0", fontSize: 13, lineHeight: 1.8, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>
                {["0", "1", "2", "3", "4"].map((_, index) => (
                  <li key={index} style={{ paddingBottom: index < 4 ? 4 : 0 }}>{t(`dashboard.vision.lines.${index}`)}</li>
                ))}
              </ul>
            </div>
          )
        };

      case "habits":
        if (!can('habit_tracker')) return { content: null, isEmpty: true };
        if (isCollapsed) return { content: null, isEmpty: false };
        return {
          isEmpty: false,
          content: (
            <div data-tutorial="habit-tracker">
              <HabitTracker state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} habitDraft={habitDraft} onHabitDraftHandled={onHabitDraftHandled} />
            </div>
          )
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
        const unlockButtonStyle = {
          width: "100%",
          padding: "14px 18px",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
        };
        if (state.level >= 36) {
          return {
            isEmpty: false,
            content: (
              <button type="button" onClick={() => setShowSystemUpdatePreview(true)} style={{ ...unlockButtonStyle, background: "linear-gradient(135deg, rgba(34,211,153,0.06), rgba(34,211,153,0.02))", border: "1px solid rgba(34,211,153,0.2)", color: "inherit" }}>
                <div><img src={GATE_ICONS.normal} alt="all unlocked" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #34d39988) hue-rotate(90deg)" }} /></div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: "#34d399", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{t("dashboard.unlock.allOnline")}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t("dashboard.unlock.allUnlocked")}</div>
                </div>
              </button>
            )
          };
        }
        if (!nextLevel) return { content: null, isEmpty: true };
        return {
          isEmpty: false,
          content: (
            <button type="button" onClick={() => setShowSystemUpdatePreview(true)} style={{ ...unlockButtonStyle, background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))", border: "1px solid rgba(99,102,241,0.2)", color: "inherit" }}>
              <div style={{ animation: "pulse 2s infinite" }}><img src={GATE_ICONS.normal} alt="locked" style={{ width: 28, height: 28, objectFit: "contain", filter: "grayscale(80%) brightness(0.5)" }} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{t("dashboard.unlock.nextUpdate")}</div>
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
            </button>
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
    <div style={{ animation: "pageEmerge 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
      <style>{CAROUSEL_CSS}</style>
      {editMode && <style>{EDIT_MODE_CSS}</style>}

      {/* ── EDIT MODE HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: editMode ? "rgba(8,12,24,0.88)" : "transparent",
        border: editMode ? `1px solid ${theme.primary}24` : "none",
        borderRadius: 14,
        maxHeight: (editMode || showEditHeader) ? 100 : 0,
        opacity: (editMode || showEditHeader) ? 1 : 0,
        overflow: "hidden",
        marginBottom: (editMode || showEditHeader) ? (editMode ? 16 : 8) : 0,
        padding: editMode ? "12px 16px" : "0 2px",
        pointerEvents: (editMode || showEditHeader) ? "auto" : "none",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: (editMode || showEditHeader) ? "translateY(0)" : "translateY(-15px)",
      }}>
        {editMode ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif" }}>{t("dashboard.edit.title")}</div>
                <div style={{ fontSize: 9, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{t("dashboard.edit.subtitle")}</div>
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
            >{t("dashboard.edit.done")}</button>
          </>
        ) : (
          <div style={{ display: "flex", width: "100%", justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditMode(true)}
              aria-label={t("dashboard.edit.layout")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "6px 12px", borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.color = theme.accent || "#e2e8f0"; 
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.color = "#64748b"; 
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>{t("dashboard.edit.layout")}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── WIDGET LIST ── */}
      {habitDraft && can('habit_tracker') && !hasVisibleHabitTracker && (
        <div style={{ display: "none" }} aria-hidden="true">
          <HabitTracker state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} habitDraft={habitDraft} onHabitDraftHandled={onHabitDraftHandled} />
        </div>
      )}

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
                marginBottom: editMode ? 10 : 16,
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
                    }}>{t("dashboard.edit.inactive")}</span>
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
                      title={t("dashboard.edit.configureWidget")}
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
                    }} title={t("dashboard.edit.lockedWidget")}>🔒</div>
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
              <span style={{ fontSize: 18 }}>+</span> {t("dashboard.edit.addWidget")}
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
              }}>{t("dashboard.edit.availableWidgets")}</div>
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
                          {premiumLocked ? t("dashboard.edit.freeLocked") : locked ? t("dashboard.edit.featureLocked") : widget.desc}
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
          >↻ {t("dashboard.edit.restoreDefault")}</button>
        </>
      )}

      {/* ── Health & Steps Details Modal ── */}
      {showSystemUpdatePreview && (
        <SystemUpdatePreviewModal
          state={state}
          theme={theme}
          nextLevel={nextLevel}
          unlocks={nextLevel ? getUnlocks(nextLevel) : []}
          onClose={() => setShowSystemUpdatePreview(false)}
        />
      )}

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

      {SCREEN_TIME_ENABLED && showScreenTimeModal && typeof document !== "undefined" && createPortal(
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
      {replacementQuest && typeof document !== "undefined" && createPortal(
        <div
          onClick={() => { setReplacementQuest(null); setReplacementOptions([]); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(0,0,0,0.84)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(520px, 96vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(4,6,14,0.98))",
              border: `1px solid ${theme.primary}38`,
              boxShadow: `0 24px 70px rgba(0,0,0,0.55), 0 0 32px ${theme.primary}16`,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ color: theme.primary, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.6 }}>SYSTEM:// QUEST_REPLACE</div>
                <div style={{ color: "#f8fafc", fontSize: 20, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>Quest ersetzen</div>
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.4, marginTop: 5 }}>
                  Waehle eine Alternative fuer <span style={{ color: "#e2e8f0", fontWeight: 800 }}>{replacementQuest.title}</span>.
                  <br />Heute genutzt: {replacementStatus.used}/{replacementStatus.limit}
                </div>
              </div>
              <button
                onClick={() => { setReplacementQuest(null); setReplacementOptions([]); }}
                style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", cursor: "pointer" }}
              >X</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {replacementOptions.map((option) => {
                const desc = getQuestDescription(option);
                return (
                  <button
                    key={option.questKey || option.templateId || option.id}
                    onClick={() => confirmReplacement(option)}
                    style={{
                      textAlign: "left",
                      padding: 13,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(148,163,184,0.13)",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>{option.title}</div>
                      <div style={{ color: theme.primary, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{String(option.category || "agi").toUpperCase()} / {String(option.difficulty || "normal").toUpperCase()}</div>
                    </div>
                    {desc && <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 12, lineHeight: 1.45 }}>{desc}</div>}
                    {option.subQuests?.length > 0 && (
                      <div style={{ marginTop: 8, color: "#64748b", fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                        {option.subQuests.length} ETAPPEN
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
      {SCREEN_TIME_ENABLED && showScreenTimeScanner && activeScreenTimeQuest && (
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
