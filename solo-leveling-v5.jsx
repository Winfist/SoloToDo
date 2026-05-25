import UnifiedShopView from "./components/UnifiedShopView.jsx";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { JOBS } from "./data/jobs";
import { JOB_QUESTS } from "./data/jobQuests";
import { QUEST_POOL } from "./data/questPool";
import { STORY_ARCS } from "./StoryView.jsx";
import { db, auth } from "./firebase";
import HabitTracker from "./components/HabitTracker.jsx";
import MicroHabits from "./components/MicroHabits.jsx";
// Lazy-loaded views and heavy components (Phase 6 — code splitting)
const StoryView = React.lazy(() => import("./StoryView.jsx"));
const MultiplayerMode = React.lazy(() => import("./MultiplayerMode.jsx"));
import TutorialProvider, { useTutorial } from "./components/tutorial/TutorialProvider.jsx";
const AnalyticsDashboard = React.lazy(() => import("./components/AnalyticsDashboard.jsx"));
import { runCoachChecks, enrichCoachMessagesAsync } from "./components/SystemCoach.jsx";
import { NotificationBanner } from "./components/NotificationManager.jsx";
import GoalFramework from "./components/GoalFramework.jsx";
import CalendarSchedule from "./components/CalendarSchedule.jsx";
import FocusMode from "./components/FocusMode.jsx";
import ChallengesSystem from "./components/ChallengesSystem.jsx";
import SettingsView, { ALL_NAV_TABS, DEFAULT_NAV_KEYS } from "./components/SettingsView.jsx";
import BottomNav from "./components/layout/BottomNav.jsx";
import TopBar from "./components/layout/TopBar.jsx";
import AuroraBackground from "./components/AuroraBackground.jsx";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import DungeonGatesPage from "./pages/DungeonGatesPage.jsx";
import LifeDomainsOnboarding from "./components/LifeDomainsOnboarding.jsx";
import { HUNTER_CODEX } from "./data/hunterCodex.js";
import { getDailySystemQuestCount } from "./data/questIntensity.js";
const InnerSanctum = React.lazy(() => import("./components/InnerSanctum.jsx"));
const ShadowRegressionCinematic = React.lazy(() => import("./components/ShadowRegressionCinematic.jsx"));
const SoulLinkView = React.lazy(() => import("./components/SoulLinkView.jsx"));
const SeasonView = React.lazy(() => import("./components/SeasonView.jsx"));
const DawnDuskProtocol = React.lazy(() => import("./components/DawnDuskProtocol.jsx"));
const CharismaDungeonsView = React.lazy(() => import("./components/CharismaDungeonsView.jsx"));
import { SEASONS, WORLD_EVENTS } from "./data/seasons.js";
const PageTransition = React.lazy(() => import("./components/PageTransition.jsx"));
import { NAV_ICONS, STAT_ICONS, GATE_ICONS, QUEST_ICONS, SEASON_ICONS, SHADOW_ICONS, STORY_ICONS, HABIT_ICONS, SKILL_ICONS, ITEM_ICONS, CHA_ICONS, SYSTEM_ICONS, SHOP_ICONS, BOSS_ICONS, GEM_ICONS } from "./data/icons.js";
import GameIcon from "./components/GameIcon.jsx";
const RewardedAdModal = React.lazy(() => import("./components/RewardedAdModal.jsx"));
import GemBoosterBanner from "./components/GemBoosterBanner.jsx";
import DashboardView from "./components/views/DashboardView.jsx";
import HunterIslandHub from "./components/views/HunterIslandHub.jsx";
import { StatsView, ShadowArmyView } from "./components/views/StatsAndShadowViews.jsx";
const QuestCompletionCinematic = React.lazy(() => import("./components/QuestCompletionCinematic.jsx"));
import UnifiedResultModal from "./components/UnifiedResultModal.jsx";

import { buildStoryChapterRewardFlow, buildStoryBossRewardFlow } from "./hooks/rewardFlowBuilders.js";
import CompletionFX from "./components/ui/CompletionFX.jsx";
import LetterboxOverlay, { triggerLetterbox } from "./components/ui/LetterboxOverlay.jsx";
import XPParticleTrail from "./components/ui/XPParticleTrail.jsx";
import NeuralBootSequence from "./components/ui/NeuralBootSequence.jsx";
import MagneticCursor from "./components/ui/MagneticCursor.jsx";
import ScreenShake from "./components/ui/ScreenShake.jsx";
import MotionBlurTransition from "./components/ui/MotionBlurTransition.jsx";
import HUDOverlay from "./components/ui/HUDOverlay.jsx";
import SystemLoadingScreen from "./components/ui/SystemLoadingScreen.jsx";
import SystemUnlockSequence from "./components/ui/SystemUnlockSequence.jsx";
import { useStickyHeader } from "./hooks/useStickyHeader.js";
import { useTimeOfDay } from "./hooks/useTimeOfDay.js";
import { useI18n } from "./components/i18n/I18nProvider.jsx";
import { getLocalizedCatalog } from "./data/localizedGameData.js";

// ─ RANKS ─
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, GEM_SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, getJobBonuses, calculateLevelUp,
  CSS, ParticleField, MusicPlayer, SystemNotification, AchievementToast, XpFloat, LevelUpCinematic, AriseCinematic,
  ShadowCard, ShadowDetailModal, FormationEditor, StatRadar, QuestTimer, QuestTypeBadge,
  EmergencyQuestCard, ChainedQuestProgress, QuestCard, DungeonGate, FloorProgressBar, BossPhaseUI, DungeonBattle,
  JobCard, JobsView, JobLevelUpCinematic, AbilityActivationCinematic, SystemCLI, DUNGEON_ENTRY_FEES
} from './data/constants';
import { useGameState } from './hooks/useGameState.jsx';
import { useFeatureUnlocks } from './hooks/useFeatureUnlocks.js';
import { getNextUnlockLevel, getUnlocksAtLevel, getLevelCrossingUnlock } from './data/featureUnlocks.js';
import { useGeminiAI } from './hooks/useGeminiAI.js';
import { QuestVerifyModal } from './components/QuestVerifyModal.jsx';
import { TaskScanModal } from './components/TaskScanModal.jsx';
import { AIChatWidget } from './components/AIChatWidget.jsx';
import QuestDetailModal from './components/QuestDetailModal.jsx';
import PremiumAccessModal from './components/PremiumAccessModal.jsx';
import { getDailyQuestCreationStatus, getPremiumFeatureForRoute } from './data/premium.js';
const ONBOARDING_QUEST_FORGE_STEP_IDS = new Set([
  "click_create_quest",
  "quest_title_input",
  "quest_difficulty",
  "quest_category",
  "submit_quest",
]);
const ONBOARDING_QUEST_FORM_STEP_IDS = new Set([
  "quest_title_input",
  "quest_difficulty",
  "quest_category",
  "submit_quest",
]);

function hoursUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 3600000);
}

export default function AppWrapper(props) {
  return (
    <ErrorBoundary>
      <App {...props} />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: "red", color: "white" }}>
          <h1>App Crashed!</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.error && this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function DeferredSystemMessage({ message, onClose }) {
  const tutorial = useTutorial();
  if (tutorial?.isActive || !message) return null;
  return <SystemCLI key={message.id || message.title} message={message} onClose={onClose} />;
}

function App({ initialHunterName, onLogout }) {
  const gameState = useGameState(initialHunterName, onLogout);
  const {
    state,
    setState,
    loading,
    setLoading,
    view,
    setView,
    showCreate,
    setShowCreate,
    levelUp,
    setLevelUp,
    systemMessage,
    setSystemMessage,
    showSetup,
    setShowSetup,
    questFilter,
    setQuestFilter,
    notifications,
    setNotifications,
    xpFloats,
    setXpFloats,
    prevRank,
    setPrevRank,
    activeDungeon,
    setActiveDungeon,
    achQueue,
    setAchQueue,
    ariseTarget,
    setAriseTarget,
    selectedShadow,
    setSelectedShadow,
    shadowSubView,
    setShadowSubView,
    qTitle,
    setQTitle,
    qDiff,
    setQDiff,
    qCat,
    setQCat,
    qType,
    setQType,
    qSyncHabit,
    setQSyncHabit,
    qDescription,
    setQDescription,
    qSubQuests,
    setQSubQuests,
    qSaveToPool,
    setQSaveToPool,
    qFromTemplate,
    setQFromTemplate,
    qTags,
    setQTags,
    qDueDate,
    setQDueDate,
    qPriority,
    setQPriority,
    qEnergy,
    setQEnergy,
    qContext,
    setQContext,
    qReminderPreset,
    setQReminderPreset,
    qReminderAt,
    setQReminderAt,
    showDetails,
    setShowDetails,
    editingQuestId,
    setEditingQuestId,
    startEditingQuest,
    showHiddenQuestModal,
    setShowHiddenQuestModal,
    showTemplates,
    setShowTemplates,
    templateFilter,
    setTemplateFilter,
    randomizing,
    setRandomizing,
    isMusicPlaying,
    setIsMusicPlaying,
    isMultiplayerMode,
    setIsMultiplayerMode,
    portalTransitioning,
    setPortalTransitioning,
    showShadowRegression,
    setShowShadowRegression,
    showDawnDusk,
    setShowDawnDusk,
    questCinematic,
    setQuestCinematic,
    rewardFlowActive,
    rewardFlowQueue,
    showingModal,
    setShowingModal,
    enqueueRewardFlow,
    dismissRewardFlow,
    notify,
    persist,
    triggerSystemMessage,
    removeNotif,
    processAchievements,
    computeXpGain,
    completeQuest,
    completeSubQuest,
    deleteQuest,
    getReplacementCandidates,
    replaceSystemQuest,
    createQuest,
    createQuestsFromInputs,
    snoozeReminder,
    completeEmergencyQuest,
    addChainedQuest,
    createQuestFromTemplate,
    removeFromPool,
    toggleFavoriteTemplate,
    finishDungeon,
    deployShadow,
    undeployShadow,
    evolveShadow,
    buyItem,
    equipItem,
    unequipItem,
    switchJob,
    activateJobAbility,
    increaseStat,
    startDawnDuskRun,
    completeProtocolFloor,
    configureProtocolTasks,
    abandonProtocolRun,
    startCharismaChain,
    createSoulLinkCode,
    joinSoulLinkCode,
    breakSoulLinkCode,
    sendReviveToPartner,
    // Health gamification
    updateHealthData,
    claimHealthReward,
    // Screen Time gamification
    updateScreenTimeData,
    claimScreenTimeReward,
    // Gem system
    watchRewardedAd,
    buyGemItem,
    claimDailyGemBonus,
    activatePremiumCode,
    premiumStatus,
    questCreationStatus,
    getActiveGemBoosters,
    getGemBoosterMultipliers,
    handleNotificationClick,
    updateGoalProgress,
    setGoalStepCompleted,
    failHabitOrGoalDay,
    updateChallenges,
    activateSystemChallenge,
    updateSystemChallengeProgress,
    abandonSystemChallenge,
    setDailyFocusQuest
  } = gameState;
  const { t: tr, locale, setBootstrapLanguage } = useI18n();
  const localizedCatalog = useMemo(() => getLocalizedCatalog(locale), [locale]);
  const catalogCategories = localizedCatalog.categories;
  const catalogDifficulties = localizedCatalog.difficulties;
  const catalogAchievements = localizedCatalog.achievements;
  useEffect(() => {
    if (state?.settings?.language) setBootstrapLanguage(state.settings.language);
  }, [state?.settings?.language, setBootstrapLanguage]);
  const [forgeTab, setForgeTab] = useState("create");
  // ── v3.0 Neural Boot Sequence state (must be before any early returns) ──
  const [bootComplete, setBootComplete] = React.useState(false);
  // ── v3.0 Sticky Header (must be before any early returns) ──
  const headerState = useStickyHeader({ compactThreshold: 60 });
  const headerRef = useRef(null);
  const [headerMetrics, setHeaderMetrics] = useState({ expanded: 72, compact: 56 });
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => {
      const measuredHeight = Math.ceil(el.getBoundingClientRect().height);
      setHeaderMetrics(prev => {
        const next = headerState.isCompact
          ? { ...prev, compact: measuredHeight }
          : { ...prev, expanded: Math.max(prev.expanded, measuredHeight) };
        return next.expanded === prev.expanded && next.compact === prev.compact ? prev : next;
      });
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [headerState.isCompact, state?.hunterName, state?.level, state?.gold, state?.gems]);
  const headerOffset = Math.max(headerMetrics.expanded + 14, 64);
  // ── Animation Controller (Phase 5) ───────────────────────────────────────────
  const animationControllerRef = useRef({ queue: [], index: 0, flow: null, active: false });
  const [systemUnlock, setSystemUnlock] = useState(null);
  const pendingTierTutorialRef = useRef(null);

  // Phase 6 — release deferred UI after all animations finish
  const releaseDeferredUi = useCallback((flow) => {
    if (!flow?.deferredUi) return;
    const d = flow.deferredUi;
    if (d.xpFloat) {
      setXpFloats(prev => [...prev, { id: genId(), ...d.xpFloat }]);
      setTimeout(() => setXpFloats(prev => prev.slice(1)), 1400);
    }
    // Show achievements NOT already in modal highlights
    const shown = flow.suppressDuplicates?.achievementsShownInModal || [];
    const unshown = (d.achievementPayloads || []).filter(a => !shown.includes(a.id));
    if (unshown.length) setAchQueue(prev => [...prev, ...unshown]);

    (d.passiveToasts || []).forEach((t, i) => setTimeout(() => notify(t.msg, t.type), t.delayMs + i * 50));

    const maxDelay = (d.passiveToasts || []).reduce((m, t) => Math.max(m, t.delayMs), 0);
    (d.systemMessages || []).forEach((sm, i) => {
      setTimeout(() => triggerSystemMessage(sm.title, sm.lines), maxDelay + sm.delayMs + i * 400);
    });
    if (d.hiddenQuestModal) {
      const delay = maxDelay + (d.systemMessages?.length || 0) * 400 + 1200;
      setTimeout(() => setShowHiddenQuestModal(d.hiddenQuestModal), delay);
    }
  }, [notify, triggerSystemMessage, setXpFloats, setAchQueue, setShowHiddenQuestModal]);

  const addUnlockSequencesToQueue = useCallback((queue = []) => {
    const expandedQueue = [];
    (queue || []).forEach(item => {
      expandedQueue.push(item);
      if (item?.type !== "levelup") return;

      const oldLevel = Number(item.payload?.oldLevel ?? 0);
      const newLevel = Number(item.payload?.level ?? 0);
      const unlock = getLevelCrossingUnlock(oldLevel, newLevel);
      if (unlock) {
        expandedQueue.push({ type: "system_unlock", payload: unlock, skippable: false });
      }
    });
    return expandedQueue;
  }, []);

  const advanceAnimationQueue = useCallback(() => {
    const ctrl = animationControllerRef.current;
    if (!ctrl.active) return;
    if (ctrl.index >= ctrl.queue.length) {
      // All animations done — release deferred UI then dismiss flow
      releaseDeferredUi(ctrl.flow);
      dismissRewardFlow();
      ctrl.active = false;
      return;
    }
    const item = ctrl.queue[ctrl.index++];
    switch (item.type) {
      case 'levelup':
        setPrevRank(getRank(item.payload.oldLevel));
        setLevelUp({ level: item.payload.level, earnedPoints: item.payload.earnedPoints });
        break;
      case 'arise':
        setAriseTarget(item.payload);
        break;
      case 'system_unlock':
        pendingTierTutorialRef.current = item.payload?.tier || null;
        setSystemUnlock(item.payload || null);
        break;
      case 'system_message':
        triggerSystemMessage(item.payload.title, item.payload.lines, advanceAnimationQueue);
        // triggerSystemMessage doesn't auto-advance — SystemCLI onClose will call setSystemMessage(null)
        // We need a fallback to advance after a maximum wait
        setTimeout(() => {
          if (animationControllerRef.current.active) advanceAnimationQueue();
        }, 8000);
        break;
      default:
        advanceAnimationQueue();
    }
  }, [dismissRewardFlow, releaseDeferredUi, triggerSystemMessage, setPrevRank, setLevelUp, setAriseTarget]);

  const startAnimationController = useCallback((flow) => {
    const queue = addUnlockSequencesToQueue(flow.animationQueue || []);
    animationControllerRef.current = { queue, index: 0, flow, active: true };
    if (queue.length === 0) {
      // No animations — release deferred UI immediately and dismiss
      releaseDeferredUi(flow);
      dismissRewardFlow();
    } else {
      advanceAnimationQueue();
    }
  }, [addUnlockSequencesToQueue, advanceAnimationQueue, dismissRewardFlow, releaseDeferredUi]);

  const [showSoulLink, setShowSoulLink] = React.useState(false);
  const [showSeasonView, setShowSeasonView] = React.useState(false);
  const [showCharismaView, setShowCharismaView] = React.useState(false);
  const [showAdModal, setShowAdModal] = React.useState(false);
  const [showPremiumModal, setShowPremiumModal] = React.useState(false);
  const [premiumModalFeature, setPremiumModalFeature] = React.useState("premium_store");
  const [tutorialRuntimeState, setTutorialRuntimeState] = useState({
    isActive: false,
    activeTutorialId: null,
    currentStepIndex: 0,
    stepId: null,
  });
  const handleTutorialStateChange = useCallback((nextState) => {
    setTutorialRuntimeState((prev) => (
      prev.isActive === nextState.isActive &&
      prev.activeTutorialId === nextState.activeTutorialId &&
      prev.currentStepIndex === nextState.currentStepIndex &&
      prev.stepId === nextState.stepId
        ? prev
        : nextState
    ));
  }, []);
  const tutorialBypassesQuestLimit = tutorialRuntimeState.isActive &&
    tutorialRuntimeState.activeTutorialId === "onboarding" &&
    ONBOARDING_QUEST_FORGE_STEP_IDS.has(tutorialRuntimeState.stepId);
  const tutorialNeedsQuestForge = tutorialRuntimeState.isActive &&
    tutorialRuntimeState.activeTutorialId === "onboarding" &&
    ONBOARDING_QUEST_FORM_STEP_IDS.has(tutorialRuntimeState.stepId);

  useEffect(() => {
    if (!tutorialNeedsQuestForge) return;
    if (showPremiumModal && premiumModalFeature === "unlimited_quests") setShowPremiumModal(false);
    setForgeTab("create");
    setShowCreate(true);
  }, [premiumModalFeature, setShowCreate, showPremiumModal, tutorialNeedsQuestForge]);

  const [detailQuest, setDetailQuest] = React.useState(null);
  const liveDetailQuest = useMemo(() => {
    if (!detailQuest) return null;
    return (state?.quests || []).find(q => q.id === detailQuest.id) || detailQuest;
  }, [detailQuest, state?.quests]);
  const addQuestAttachment = useCallback((questId, attachment) => {
    if (!state || !attachment) return;
    const updated = {
      ...state,
      quests: (state.quests || []).map(q =>
        q.id === questId
          ? { ...q, attachments: [...(q.attachments || []), attachment] }
          : q
      ),
    };
    setState(updated);
    persist(updated);
  }, [state, setState, persist]);
  const removeQuestAttachment = useCallback((questId, attachmentId) => {
    if (!state || !attachmentId) return;
    const updated = {
      ...state,
      quests: (state.quests || []).map(q =>
        q.id === questId
          ? { ...q, attachments: (q.attachments || []).filter(item => item.id !== attachmentId) }
          : q
      ),
    };
    setState(updated);
    persist(updated);
  }, [state, setState, persist]);
  const modifier = useMemo(() => getDailyModifier(), []);
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = React.useState(false);
  const [preview3DDungeon, setPreview3DDungeon] = React.useState(null);
  const [battlePendingStart, setBattlePendingStart] = React.useState(false);
  const [showDashboardStats, setShowDashboardStats] = React.useState(() => {
    try {
      const saved = localStorage.getItem("sl_dashboard_stats_hidden");
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  // ─ Page Transition State ─
  const [isPageTransitioning, setIsPageTransitioning] = React.useState(false);
  const [transitionTargetView, setTransitionTargetView] = React.useState(null);
  const [transitionPreview, setTransitionPreview] = React.useState(null);
  const VIEW_LABELS = useMemo(() => ({
    dashboard: tr("nav.viewLabels.dashboard"), stats: tr("nav.viewLabels.stats"), shadows: tr("nav.viewLabels.shadows"),
    dungeon: tr("nav.viewLabels.dungeon"), story: tr("nav.viewLabels.story"), equipment: tr("nav.viewLabels.equipment"),
    shop: tr("nav.viewLabels.shop"), jobs: tr("nav.viewLabels.jobs"), achievements: tr("nav.viewLabels.achievements"),
    analytics: tr("nav.viewLabels.analytics"), training: tr("nav.viewLabels.training"), system: tr("nav.viewLabels.system"),
    goals: tr("nav.viewLabels.goals"), calendar: tr("nav.viewLabels.calendar"), challenges: tr("nav.viewLabels.challenges"),
    settings: tr("nav.viewLabels.settings"), sanctum: tr("nav.viewLabels.sanctum"),
  }), [tr]);
  const navigateTo = useCallback((newView) => {
    if (newView === view || isPageTransitioning || transitionPreview) return;
    setTransitionTargetView(newView);
    setIsPageTransitioning(true);
  }, [view, isPageTransitioning, transitionPreview]);
  const onTransitionMid = useCallback(() => {
    if (transitionTargetView) setView(transitionTargetView);
  }, [transitionTargetView]);
  const onTransitionEnd = useCallback(() => {
    setIsPageTransitioning(false);
    setTransitionTargetView(null);
  }, []);
  const previewPageTransition = useCallback((variant, label = "EQUIPPED") => {
    if (isPageTransitioning) return;
    setTransitionPreview({
      id: Date.now(),
      variant: variant || "domain_shift",
      label: (label || "EQUIPPED").toUpperCase(),
    });
  }, [isPageTransitioning]);

  const openPremiumModal = useCallback((feature = "premium_store") => {
    setPremiumModalFeature(feature);
    setShowPremiumModal(true);
  }, []);

  const requirePremium = useCallback((feature, onAllowed) => {
    if (premiumStatus?.active) {
      onAllowed?.();
      return true;
    }
    openPremiumModal(feature);
    return false;
  }, [openPremiumModal, premiumStatus?.active]);

  const currentQuestCreationStatus = useMemo(
    () => questCreationStatus || getDailyQuestCreationStatus(state),
    [questCreationStatus, state?.premium, state?.dailyUserQuestsCreated]
  );

  const requireQuestSlot = useCallback((onAllowed, options = {}) => {
    if (options.bypassDailyLimit || currentQuestCreationStatus.canCreate) {
      onAllowed?.();
      return true;
    }
    openPremiumModal("unlimited_quests");
    return false;
  }, [currentQuestCreationStatus.canCreate, openPremiumModal]);

  const openQuestCreate = useCallback(() => {
    requireQuestSlot(() => {
      setForgeTab("create");
      setShowCreate(true);
    }, { bypassDailyLimit: tutorialBypassesQuestLimit });
  }, [requireQuestSlot, setShowCreate, tutorialBypassesQuestLimit]);

  const requestShowCreate = useCallback((next = true) => {
    if (next) openQuestCreate();
    else setShowCreate(false);
  }, [openQuestCreate, setShowCreate]);

  const navigateToWithAccess = useCallback((key) => {
    const premiumFeature = getPremiumFeatureForRoute(key);
    if (premiumFeature && !requirePremium(premiumFeature)) return;
    navigateTo(key);
  }, [navigateTo, requirePremium]);

  // ─ Progressive Feature Unlock System ─
  const { can, nextLevel } = useFeatureUnlocks(state?.level || 1);

  // ─ Gemini AI ─
  const geminiAI = useGeminiAI(state);
  const [verifyingQuest, setVerifyingQuest] = useState(null);
  const [showTaskScan, setShowTaskScan] = useState(false);

  // Intercept completeQuest to offer photo verification if unlocked
  const handleCompleteQuest = useCallback((questId) => {
    if (premiumStatus?.active && can('ai_verification') && state?.ai?.verificationEnabled && state?.ai?.enabled) {
      const quest = state.quests?.find(q => q.id === questId);
      if (quest) { setVerifyingQuest(quest); return; }
    }
    completeQuest(questId);
  }, [can, state, completeQuest, premiumStatus?.active]);

  // ─ AI: Replace static system quests with AI-generated ones after daily reset ─
  // Uses localStorage so the guard survives page reloads — prevents one call per reload
  const lastActiveDateRef = useRef(null);
  useEffect(() => {
    if (!state || loading) return;
    const today = state.lastActiveDate;
    const aiQuestScope = encodeURIComponent(String(state.ownerUid || state.email || state.displayName || state.hunterName || "local"));
    const storageKey = `sl_ai_quest_gen_date:${aiQuestScope}`;
    const alreadyGenToday = localStorage.getItem(storageKey) === today;
    if (lastActiveDateRef.current === today || alreadyGenToday) return;
    lastActiveDateRef.current = today;
    localStorage.setItem(storageKey, today);
    if (!premiumStatus?.active || !can('ai_dynamic_quests') || !state.ai?.enabled || !state.ai?.dynamicMessagesEnabled || geminiAI.isRateLimited()) return;

    // Small delay so static quests render first, then swap silently
    const timer = setTimeout(async () => {
      const { generateDailySystemQuestsAsync } = await import('./data/helpers.js');
      const aiQuests = await generateDailySystemQuestsAsync(getDailySystemQuestCount(state), state, geminiAI.generateQuests);
      if (!aiQuests?.length) return;
      const isAI = aiQuests.some(q => q.aiGenerated);
      if (!isAI) return; // No AI result — keep static quests
      // Use setState callback to avoid stale state overwrites
      setState(currentState => {
        const withoutOldSystem = (currentState.quests || []).filter(q => !q.isSystem);
        const updated = { ...currentState, quests: [...withoutOldSystem, ...aiQuests] };
        persist(updated);
        return updated;
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [state?.lastActiveDate, loading, premiumStatus?.active]);

  // ─ View Guard: Reset to dashboard if current view is locked ─
  React.useEffect(() => {
    const viewToFeature = {
      training: 'training_tab', goals: 'goals', calendar: 'calendar',
      dungeon: 'dungeons', story: 'story', shadows: 'shadow_army',
      equipment: 'equipment', jobs: 'jobs', shop: 'shop',
      gem_shop: 'gem_shop', analytics: 'analytics', achievements: 'achievements',
      challenges: 'challenges', sanctum: 'sanctum', settings: null, stats: 'stats_view',
    };
    const feature = viewToFeature[view];
    if (feature && !can(feature)) {
      setView('dashboard');
    }
  }, [view, can]);

  React.useEffect(() => {
    const premiumFeature = getPremiumFeatureForRoute(view);
    if (premiumFeature && !premiumStatus?.active) {
      openPremiumModal(premiumFeature);
      setView("dashboard");
    }
  }, [view, premiumStatus?.active, openPremiumModal, setView]);

  React.useEffect(() => {
    localStorage.setItem("sl_dashboard_stats_hidden", JSON.stringify(showDashboardStats));
  }, [showDashboardStats]);



  // ─ Adaptive System Coach: periodic intervention checks ─
  const prevStateRef = useRef(null);
  useEffect(() => {
    if (!state || loading) return;
    const checkCoach = async () => {
      let messages = runCoachChecks(state, prevStateRef.current);
      if (messages.length > 0 && premiumStatus?.active && can('ai_coach') && state?.ai?.dynamicMessagesEnabled && state?.ai?.enabled && !geminiAI.isRateLimited()) {
        messages = await enrichCoachMessagesAsync(messages, state, geminiAI.generateSystemMsg);
      }
      if (messages.length > 0) {
        const top = messages[0];
        notify(`${top.icon} ${top.lines[0]}`, top.type === "warning" ? "warning" : "info");
      }
      prevStateRef.current = { ...state };
    };
    // Run after 2 min delay on load, then every 30 min
    const initial = setTimeout(checkCoach, 120000);
    const interval = setInterval(checkCoach, 1800000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [state?.streak, state?.lastActiveDate, (state?.habits || []).length, loading, premiumStatus?.active]);

  // ─── TUTORIAL SYSTEM ─────────────────────────────────────────
  const tutorialRef = useRef(null);
  const prevLevelRef = useRef(null);
  const levelTrackerReadyRef = useRef(false);
  const lifeDomainsReady = Boolean(state?.hunterName && (state.lifeDomains || []).length >= 3);
  const bootReady = state?.settings?.bootSequence === false || bootComplete;

  // Detect tier-level crossings and gate tutorials behind the unlock sequence.
  useEffect(() => {
    if (!state || loading) return;
    const newLevel = state.level;

    if (!levelTrackerReadyRef.current) {
      prevLevelRef.current = newLevel;
      levelTrackerReadyRef.current = true;
      return;
    }

    const prevLevel = prevLevelRef.current ?? newLevel;
    prevLevelRef.current = newLevel;

    if (newLevel > prevLevel) {
      const unlock = getLevelCrossingUnlock(prevLevel, newLevel);
      if (unlock) {
        pendingTierTutorialRef.current = unlock.tier;
        if (!rewardFlowActive && !rewardFlowQueue?.length && !animationControllerRef.current.active) {
          setSystemUnlock(unlock);
        }
      }
    }
  }, [state?.level, loading, rewardFlowActive, rewardFlowQueue]);

  // Trigger onboarding for new users (replaces DoubleDungeonTutorial)
  useEffect(() => {
    if (!state || loading || showSetup || !lifeDomainsReady || !bootReady) return;
    if (!state.tutorialCompleted && !(state.completedTutorials || []).includes('onboarding')) {
      // Small delay to let UI mount
      const timer = setTimeout(() => {
        tutorialRef.current?.triggerOnboarding();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, showSetup, lifeDomainsReady, bootReady, state?.tutorialCompleted, state?.completedTutorials]);

  // Tutorial completion handlers
  const handleTutorialComplete = useCallback((tutorialId) => {
    if (!state) return;
    const completed = [...(state.completedTutorials || [])];
    if (!completed.includes(tutorialId)) completed.push(tutorialId);
    persist({
      ...state,
      completedTutorials: completed,
      // Also mark legacy tutorialCompleted on onboarding finish
      ...(tutorialId === 'onboarding' ? { tutorialCompleted: true } : {}),
    });
  }, [state, persist]);

  const handleTutorialSkip = useCallback((tutorialId) => {
    if (!state) return;
    const completed = [...(state.completedTutorials || [])];
    if (!completed.includes(tutorialId)) completed.push(tutorialId);
    persist({
      ...state,
      completedTutorials: completed,
      ...(tutorialId === 'onboarding' ? { tutorialCompleted: true } : {}),
    });
  }, [state, persist]);

  const handleSystemUnlockComplete = useCallback(() => {
    const tier = systemUnlock?.tier || pendingTierTutorialRef.current;
    setSystemUnlock(null);
    if (tier) tutorialRef.current?.triggerTierTutorial(tier);
    pendingTierTutorialRef.current = null;
    if (animationControllerRef.current.active) advanceAnimationQueue();
  }, [advanceAnimationQueue, systemUnlock]);

  // Reset tutorial (from Settings)
  const handleResetTutorial = useCallback(() => {
    if (!state) return;
    persist({
      ...state,
      completedTutorials: [],
      tutorialCompleted: false,
    });
    setShowSeasonView(false);
    setShowSoulLink(false);
    setShowCharismaView(false);
    setShowDawnDusk(false);
    setView("dashboard");
    setTimeout(() => {
      tutorialRef.current?.resetAndStartOnboarding();
    }, 650);
  }, [state, persist, setView, setShowDawnDusk]);

  if (loading) {
    return (
      <SystemLoadingScreen
        variant="data"
        title={tr("loading.appTitle")}
        label={tr("loading.appLabel")}
        detail={tr("loading.dataDetail")}
      />
    );
  }
  if (showSetup) return <SetupScreen onFinish={gameState.finishSetup} theme={THEMES[state?.selectedTheme] || THEMES["default"]} />;

  const theme = (state?.selectedTheme === "custom" && state?.customThemeData)
    ? state.customThemeData
    : (THEMES[state?.selectedTheme] || THEMES["default"]);

  if (state?.hunterName && (!state.lifeDomains || state.lifeDomains.length < 3)) {
    console.log("System: Entering LifeDomainsOnboarding");
    return (
      <>
        <style>{CSS(theme)}</style>
        <LifeDomainsOnboarding theme={theme} onComplete={(domains) => {
          console.log("System: Life Domains confirmed:", domains);
          persist({ ...state, lifeDomains: domains });
        }} />
      </>
    );
  }

  // Portal transition handler
  const enterPortal = () => {
    setPortalTransitioning(true);
    setTimeout(() => {
      setIsMultiplayerMode(true);
      setPortalTransitioning(false);
    }, 1800);
  };
  const exitPortal = () => {
    setPortalTransitioning(true);
    setTimeout(() => {
      setIsMultiplayerMode(false);
      setPortalTransitioning(false);
    }, 1200);
  };

  // Portal Transition Overlay
  if (portalTransitioning) {
    const text = isMultiplayerMode ? "RETURNING TO SOLO" : "ENTERING ASSOCIATION";
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#030208", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <style>{`
          @keyframes portalGate{0%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1.3) rotate(180deg);opacity:1}100%{transform:scale(1) rotate(360deg);opacity:0.8}}
          @keyframes portalRipple{0%{transform:scale(0.5);opacity:0.6;border-color:#f59e0b88}100%{transform:scale(5);opacity:0;border-color:#f59e0b00}}
          @keyframes portalText{0%{opacity:0;letter-spacing:2px;filter:blur(10px)}50%{opacity:1;letter-spacing:8px;filter:blur(0)}100%{opacity:1;letter-spacing:6px}}
          @keyframes portalDim{0%{opacity:0}30%{opacity:1}70%{opacity:1}100%{opacity:0}}
        `}</style>
        {/* Ripples */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: "2px solid #f59e0b66", animation: `portalRipple 2s ease-out ${i * 0.3}s infinite` }} />
        ))}
        {/* Central Portal */}
        <div style={{ marginBottom: 32, animation: "portalGate 1.5s cubic-bezier(0.4,0,0.2,1) forwards" }}><GameIcon src={NAV_ICONS.guild} fallback="📋" size={72} glow glowColor="rgba(245,158,11,0.8)" /></div>
        {/* Text */}
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, animation: "portalText 1.5s ease-out 0.3s both" }}>{text}</div>
        {/* Ambient glow */}
        <div style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.12), transparent 60%)", animation: "portalDim 2s ease forwards" }} />
      </div>
    );
  }

  if (isMultiplayerMode && state) {
    return (
      <React.Suspense fallback={null}>
        <MultiplayerMode
          playerState={state}
          onExitMP={exitPortal}
          onStateUpdate={gameState.persist}
        />
      </React.Suspense>
    );
  }

  const rank = getRank(state?.level || 1);
  const xpNeeded = getXpForLevel(state?.level || 1);
  const xpPercent = Math.min(((state?.xp || 0) / xpNeeded) * 100, 100);
  const streakBonus = Math.min(state?.streak || 0, 5) * 10;
  const shopUnlocked = getRankIndex(rank.name) >= getRankIndex("D");
  const activeDungeons = (state?.dungeons || []).filter(d => !d.cleared && new Date(d.expiresAt) > new Date());
  const filteredQuests = (state?.quests || []).filter(q => {
    if (q.completed) return false;
    if (questFilter === "daily") return q.type === "daily";
    if (questFilter === "side") return q.type === "side";
    if (questFilter === "weekly") return q.type === "weekly";
    if (questFilter === "chained") return q.type === "chained";
    if (questFilter === "hidden") return q.type === "hidden";
    return true; // "all"
  });
  const hiddenQuestCount = (state?.quests || []).filter(q => q.type === "hidden" && !q.completed).length;
  const equipBonuses = getEquipBonuses(state?.equipment);
  const unlockedSkills = checkSkillUnlocks(state?.stats || {});
  const powerLevel = calcPowerLevel(state?.stats || {}, state?.level || 1);
  const achUnlocked = state?.achievements?.unlocked || [];
  const penaltyActive = state?.penaltyZone?.active;
  const shadowArmy = state?.shadowArmy || { shadows: [], capacity: 20 };
  const jobBonuses = getJobBonuses(state);
  const formationBonus = calcFormationBonus(shadowArmy, jobBonuses.allShadowsActive);
  const namedShadows = shadowArmy.shadows.filter(s => s.isNamed);
  const totalShadows = shadowArmy.shadows.length;

  // Theme already defined above


  return (
    <TutorialProvider
      ref={tutorialRef}
      completedTutorials={state?.completedTutorials || []}
      onComplete={handleTutorialComplete}
      onSkip={handleTutorialSkip}
      onStateChange={handleTutorialStateChange}
    >
      <ScreenShake disabled={!premiumStatus?.active || state.settings?.screenShake === false}>
        <div className={[
          state.settings?.rarityBorders === false ? 'vfx-no-borders' : '',
          state.settings?.scrollReveal === false ? 'vfx-no-reveal' : '',
          state.settings?.tiltCards === false ? 'vfx-no-tilt' : '',
          state.settings?.glitchText === false ? 'vfx-no-glitch' : '',
          state.settings?.animatedNumbers === false ? 'vfx-no-counter' : '',
        ].filter(Boolean).join(' ')} style={{ minHeight: "100vh", background: penaltyActive ? `linear-gradient(180deg,${theme.bg},rgba(20,4,4,0.95))` : theme.bg, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", position: "relative", overflowX: "hidden" }}>
          <style>{CSS(theme)}</style>
          {/* ── v3.0 Neural Boot Sequence ── */}
          {!bootComplete && state.settings?.bootSequence !== false && (
            <NeuralBootSequence
              hunterName={state.hunterName}
              rankName={rank.name}
              level={state.level}
              onComplete={() => setBootComplete(true)}
              disabled={state.settings?.bootSequence === false}
            />
          )}
          <AuroraBackground theme={theme} penaltyActive={penaltyActive} streak={state?.streak || 0} xpPercent={xpPercent} shadowCount={totalShadows} disableWisps={state.settings?.atmosphericWisps === false} disableTimeOfDay={state.settings?.timeOfDay === false} />
          {(state.settings?.particles !== false) && <ParticleField theme={theme} />}
          <CompletionFX disabled={state.settings?.completionFx === false} />
          <LetterboxOverlay disabled={state.settings?.letterboxMode === false} />
          <XPParticleTrail disabled={state.settings?.xpParticleTrail === false} />
          <MagneticCursor disabled={!premiumStatus?.active || state.settings?.magneticCursor === false} color={theme.primary} />
          <HUDOverlay rank={rank.name} level={state.level} streak={state.streak || 0} xpPercent={xpPercent} theme={theme} disabled={!premiumStatus?.active || state.settings?.hudOverlay === false} />
          <MusicPlayer play={isMusicPlaying} />
          {penaltyActive && <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", border: "2px solid #ef444422", animation: "penaltyPulse 2s infinite" }} />}
          {/* ── Independent reward UI — silenced while a RewardFlow is active ── */}
          {!rewardFlowActive && notifications.map((n, index) => <SystemNotification key={n.id} message={n.msg} type={n.type} slot={index} onDone={() => removeNotif(n.id)} />)}
          {!rewardFlowActive && achQueue.slice(0, 1).map(a => <AchievementToast key={a.id} achievement={a} onDone={() => setAchQueue(prev => prev.slice(1))} />)}
          {!rewardFlowActive && xpFloats.map(f => <XpFloat key={f.id} x={f.x} y={f.y} xp={f.xp} gold={f.gold} />)}

          {/* ── Hero moment: UnifiedResultModal shown first, before any animation ── */}
          {rewardFlowActive && showingModal && rewardFlowQueue[0] && (
            <UnifiedResultModal
              flow={rewardFlowQueue[0]}
              onContinue={() => {
                setShowingModal(false);
                startAnimationController(rewardFlowQueue[0]);
              }}
            />
          )}

          {/* ── Serial animation chain — only runs after modal closes ── */}
          {rewardFlowActive && !showingModal && levelUp && (
            <LevelUpCinematic
              levelData={levelUp}
              rank={getRank(levelUp.level || levelUp)}
              oldRank={prevRank}
              onClose={() => {
                setLevelUp(null);
                triggerLetterbox("LEVEL UP", 2500, getRank(levelUp.level || levelUp).color || "#22d3ee");
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
            />
          )}
          {rewardFlowActive && !showingModal && !levelUp && ariseTarget && (
            <AriseCinematic
              shadow={ariseTarget}
              onClose={() => {
                setAriseTarget(null);
                triggerLetterbox("ARISE", 2200, "#a78bfa");
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
            />
          )}
          {rewardFlowActive && !showingModal && !levelUp && !ariseTarget && systemUnlock && (
            <SystemUnlockSequence
              tier={systemUnlock.tier}
              features={systemUnlock.features}
              message={systemUnlock.message}
              onComplete={handleSystemUnlockComplete}
            />
          )}
          {rewardFlowActive && !showingModal && !levelUp && !ariseTarget && !systemUnlock && state._jobLevelUp && (
            <JobLevelUpCinematic
              job={JOBS[state._jobLevelUp.job]}
              newLevel={state._jobLevelUp.newLevel}
              onClose={() => {
                const next = { ...state }; delete next._jobLevelUp; persist(next);
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
            />
          )}
          {rewardFlowActive && !showingModal && !levelUp && !ariseTarget && !systemUnlock && !state._jobLevelUp && state._abilityActivated && (
            <AbilityActivationCinematic
              ability={state._abilityActivated.ability}
              job={state._abilityActivated.job}
              onClose={() => {
                const next = { ...state }; delete next._abilityActivated; persist(next);
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
            />
          )}
          {rewardFlowActive && !showingModal && !levelUp && !ariseTarget && !systemUnlock && !state._jobLevelUp && !state._abilityActivated && systemMessage && (
            <DeferredSystemMessage key={systemMessage.id || systemMessage.title} message={systemMessage} onClose={() => setSystemMessage(null)} />
          )}

          {/* ── Non-flow cinematics (standalone arise from evolveShadow etc.) ── */}
          {!rewardFlowActive && levelUp && <LevelUpCinematic levelData={levelUp} rank={getRank(levelUp.level || levelUp)} oldRank={prevRank} onClose={() => setLevelUp(null)} />}
          {!rewardFlowActive && !levelUp && ariseTarget && <AriseCinematic shadow={ariseTarget} onClose={() => setAriseTarget(null)} />}
          {!rewardFlowActive && !levelUp && !ariseTarget && systemUnlock && <SystemUnlockSequence tier={systemUnlock.tier} features={systemUnlock.features} message={systemUnlock.message} onComplete={handleSystemUnlockComplete} />}
          {!rewardFlowActive && !levelUp && !ariseTarget && !systemUnlock && state._jobLevelUp && <JobLevelUpCinematic job={JOBS[state._jobLevelUp.job]} newLevel={state._jobLevelUp.newLevel} onClose={() => { const next = { ...state }; delete next._jobLevelUp; persist(next); }} />}
          {!rewardFlowActive && !levelUp && !ariseTarget && !systemUnlock && !state._jobLevelUp && state._abilityActivated && <AbilityActivationCinematic ability={state._abilityActivated.ability} job={state._abilityActivated.job} onClose={() => { const next = { ...state }; delete next._abilityActivated; persist(next); }} />}
          {!rewardFlowActive && !levelUp && !ariseTarget && !systemUnlock && !state._jobLevelUp && !state._abilityActivated && systemMessage && <DeferredSystemMessage key={systemMessage.id || systemMessage.title} message={systemMessage} onClose={() => setSystemMessage(null)} />}

          {activeDungeon && (
            <div style={{ display: preview3DDungeon ? "none" : "block" }}>
              <DungeonBattle dungeon={activeDungeon} playerStats={state.stats} theme={theme} onResult={r => finishDungeon(activeDungeon, r)} onClose={() => setActiveDungeon(null)} skillBonuses={getSkillBonuses(null, state.stats)} modifier={modifier} formationBonus={formationBonus} state={state} persist={persist} notify={notify} onTrigger3D={() => setPreview3DDungeon(activeDungeon)} startAutomatically={battlePendingStart} onClearStartAuto={() => setBattlePendingStart(false)} />
            </div>
          )}
          {preview3DDungeon && (
            <DungeonGatesPage
              dungeon={preview3DDungeon}
              onEnterGate={(dungeon) => { setPreview3DDungeon(null); const fee = DUNGEON_ENTRY_FEES[dungeon.rank] || 0; if (fee > 0) persist({ ...state, gold: state.gold - fee }); setActiveDungeon(dungeon); setBattlePendingStart(true); }}
              onClose={() => setPreview3DDungeon(null)}
            />
          )}
          {selectedShadow && <ShadowDetailModal shadow={selectedShadow} theme={theme} gold={state.gold} onClose={() => setSelectedShadow(null)} onDeploy={deployShadow} onUndeploy={undeployShadow} onEvolve={evolveShadow} />}

          {/* SHADOW MONARCH'S GATE — PAGE TRANSITION */}
          <React.Suspense fallback={null}>
            <PageTransition
              isActive={isPageTransitioning}
              targetLabel={VIEW_LABELS[transitionTargetView] || (transitionTargetView || "").toUpperCase()}
              theme={theme}
              variant={state.selectedPageTransition || "domain_shift"}
              speed={state.settings?.pageTransitionSpeed || 1}
              onMidpoint={onTransitionMid}
              onComplete={onTransitionEnd}
            />
            {transitionPreview && (
              <PageTransition
                key={`transition-preview-${transitionPreview.id}`}
                isActive={!!transitionPreview}
                targetLabel={transitionPreview.label}
                theme={theme}
                variant={transitionPreview.variant}
                speed={state.settings?.pageTransitionSpeed || 1}
                onMidpoint={() => { }}
                onComplete={() => setTransitionPreview(null)}
              />
            )}
          </React.Suspense>

          {/* FOCUS MODE */}
          {showFocusMode && <FocusMode state={state} persist={persist} notify={notify} onExit={() => setShowFocusMode(false)} theme={theme} processAchievements={processAchievements} />}

          {/* AI: QUEST PHOTO VERIFICATION */}
          {verifyingQuest && (
            <QuestVerifyModal
              quest={verifyingQuest}
              geminiAI={geminiAI}
              onComplete={(verified) => {
                const questId = verifyingQuest.id;
                setVerifyingQuest(null);
                completeQuest(questId, null, verified);
              }}
              onSkip={() => {
                const questId = verifyingQuest.id;
                setVerifyingQuest(null);
                completeQuest(questId, null, false);
              }}
            />
          )}

          {/* AI: TASK SCAN MODAL */}
          {showTaskScan && (
            <TaskScanModal
              geminiAI={geminiAI}
              onConfirm={(tasks) => {
                createQuestsFromInputs(tasks.map(t => ({
                  title: t.title,
                  category: t.category,
                  difficulty: t.difficulty,
                  type: "side",
                  priority: t.priority || "medium",
                  energy: t.energy || "medium",
                })), { source: "scan" });
                setShowTaskScan(false);
              }}
              onClose={() => setShowTaskScan(false)}
            />
          )}

          <React.Suspense fallback={null}>
            {/* SHADOW REGRESSION CINEMATIC */}
            {showShadowRegression && state?.shadowRegression?.active && (
              <ShadowRegressionCinematic state={state} theme={theme} onClose={() => setShowShadowRegression(false)} />
            )}

            {/* DAWN/DUSK PROTOCOL */}
            {premiumStatus?.active && (showDawnDusk || state?.dawnDusk?.currentRun) && (
              <DawnDuskProtocol
                state={state} theme={theme}
                startDawnDuskRun={startDawnDuskRun}
                completeProtocolFloor={completeProtocolFloor}
                configureProtocolTasks={configureProtocolTasks}
                abandonProtocolRun={abandonProtocolRun}
                onClose={() => setShowDawnDusk(false)}
              />
            )}

            {/* QUEST DETAIL MODAL */}
            {liveDetailQuest && (
              <QuestDetailModal
                quest={liveDetailQuest}
                theme={theme}
                gameState={state}
                onClose={() => setDetailQuest(null)}
                onComplete={handleCompleteQuest}
                onEdit={(quest) => { setDetailQuest(null); startEditingQuest(quest); }}
                onDelete={deleteQuest}
                onCompleteSubQuest={completeSubQuest}
                onAddAttachment={addQuestAttachment}
                onDeleteAttachment={removeQuestAttachment}
                onSaveNotes={(id, notes) => {
                  const updated = {
                    ...state,
                    quests: state.quests.map(q => q.id === id ? { ...q, notes } : q)
                  };
                  setState(updated);
                  persist(updated);
                }}
                completedQuests={state.completedQuests || []}
              />
            )}

            {/* SOUL LINK VIEW */}
            {premiumStatus?.active && showSoulLink && (
              <SoulLinkView
                state={state} theme={theme}
                createSoulLinkCode={createSoulLinkCode}
                joinSoulLinkCode={joinSoulLinkCode}
                breakSoulLinkCode={breakSoulLinkCode}
                sendReviveToPartner={sendReviveToPartner}
                onClose={() => setShowSoulLink(false)}
              />
            )}

            {/* SEASON VIEW */}
            {premiumStatus?.active && showSeasonView && (
              <SeasonView state={state} theme={theme} onClose={() => setShowSeasonView(false)} />
            )}

            {/* CHARISMA DUNGEONS VIEW */}
            {premiumStatus?.active && showCharismaView && (
              <CharismaDungeonsView
                state={state} theme={theme}
                startCharismaChain={startCharismaChain}
                onClose={() => setShowCharismaView(false)}
              />
            )}
          </React.Suspense>

          {/* HIDDEN QUEST DISCOVERY MODAL */}
          {showHiddenQuestModal && (
            <div onClick={() => setShowHiddenQuestModal(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(1,0,6,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.4s", cursor: "pointer" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}><GameIcon src={QUEST_ICONS.hidden} fallback="🔮" size={56} glow glowColor="#6366f1" animate="float" /></div>
                  <div style={{ fontSize: 9, letterSpacing: 5, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>VERBORGENE QUEST ENTHÜLLT</div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 6, textShadow: "0 0 30px #6366f188" }}>{showHiddenQuestModal.title}</h2>
                  <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{showHiddenQuestModal.discoveryMsg}</p>
                </div>
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid #6366f133", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>BELOHNUNG</div>
                  <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>XP MULT</div><div style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa", fontFamily: "'Cinzel',serif" }}>x{showHiddenQuestModal.reward?.xpMult || 3}</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>GOLD MULT</div><div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>x{showHiddenQuestModal.reward?.goldMult || 2}</div></div>
                  </div>
                </div>
                <button onClick={() => setShowHiddenQuestModal(null)} className="press-feedback" style={{ width: "100%", padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#6366f122,#6366f110)", color: "#a5b4fc", border: "1px solid #6366f144", fontFamily: "'Cinzel',serif", letterSpacing: 2, transition: "all 0.3s" }}>QUEST ANNEHMEN</button>
              </div>
            </div>
          )}

          {/* ── SCREEN VIGNETTE (Design 2.0) ── */}
          <div className="vignette" aria-hidden="true" />

          {/* TOP BAR — minimal/luxe header with bundled action menu */}
          <TopBar
            innerRef={headerRef}
            rank={rank}
            theme={theme}
            isCompact={headerState.isCompact}
            isCreatingEntry={isCreatingEntry}
            penaltyActive={penaltyActive}
            hunterName={state.hunterName}
            title={state.selectedTitle || rank.label}
            level={state.level}
            gold={state.gold}
            gems={state.gems}
            streak={state.streak}
            powerLevel={powerLevel}
            isMusicPlaying={isMusicPlaying}
            icons={{
              coin: "/icon/coin.png",
              gem: GEM_ICONS.gem,
              settings: NAV_ICONS.settings,
              timer: NAV_ICONS.timer,
              sanctum: "/icons/habit_mindfulness.webp",
              focus: NAV_ICONS.timer,
              protocol: NAV_ICONS.events,
              hunterIsland: NAV_ICONS.settings,
              arsenal: ITEM_ICONS.blade,
              guild: NAV_ICONS.guild,
              streak: STAT_ICONS.str,
              soulLink: SHADOW_ICONS.knight,
              season: SEASONS[state.seasons?.currentSeason]?.iconSrc,
            }}
            available={{
              gems: can("gem_shop"),
              sanctum: can("sanctum"),
              focus: can("focus_mode"),
              protocol: can("dawn_dusk"),
              hunterIsland: true,
              arsenal: can("equipment"),
              guild: can("multiplayer"),
              soulLink: can("soul_link") && !!state.soulLink?.linkCode,
              season: can("seasons") && !!state.seasons?.currentSeason,
              music: can("music"),
            }}
            status={{
              protocolActive: !!state?.dawnDusk?.currentRun,
              soulLinkPartner: state.soulLink?.partnerName ? state.soulLink.partnerName.slice(0, 12) : "",
              seasonName: SEASONS[state.seasons?.currentSeason]?.name || "",
            }}
            onAction={(key) => {
              switch (key) {
                case "gold": window.__SHOP_START_TAB = "gold"; navigateTo("shop"); break;
                case "gems": window.__SHOP_START_TAB = "gems"; navigateTo("shop"); break;
                case "sanctum": navigateTo("sanctum"); break;
                case "focus": setShowFocusMode(true); break;
                case "protocol": requirePremium("dawn_dusk", () => setShowDawnDusk(true)); break;
                case "hunterIsland": navigateTo("system"); break;
                case "arsenal": navigateToWithAccess("equipment"); break;
                case "guild": enterPortal(); break;
                case "soulLink": requirePremium("soul_link", () => setShowSoulLink(true)); break;
                case "season": requirePremium("seasons", () => setShowSeasonView(true)); break;
                case "music": setIsMusicPlaying((prev) => { const next = !prev; localStorage.setItem("soloMusicPlaying", next ? "true" : "false"); return next; }); break;
                case "settings": navigateTo("settings"); break;
                case "logout": onLogout(); break;
                default: break;
              }
            }}
          />

          {/* Safe area filler removed */}

          {/* MAIN */}
          <main style={{ position: "relative", zIndex: 1, padding: "16px", paddingTop: headerOffset, maxWidth: 480, margin: "0 auto", paddingBottom: 92 }}>

            {/* SHADOW REGRESSION BANNER (replaces plain penalty banner) */}
            {penaltyActive && state.shadowRegression?.active && (state.shadowRegression.previousStreak || 0) > 0 ? (
              <div
                onClick={() => setShowShadowRegression(true)}
                style={{
                  background: "linear-gradient(135deg, rgba(30,0,10,0.95), rgba(10,0,5,0.9))",
                  border: "1px solid rgba(220,38,38,0.5)", borderLeft: "3px solid #dc2626",
                  borderRadius: 16, padding: "16px 18px", marginBottom: 14,
                  backdropFilter: "blur(8px)", cursor: "pointer",
                  boxShadow: "0 0 30px rgba(220,38,38,0.08), inset 0 1px 0 rgba(220,38,38,0.1)",
                  position: "relative", overflow: "hidden"
                }}
              >
                {/* Animated scan line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", pointerEvents: "none", background: "linear-gradient(180deg, transparent, rgba(220,38,38,0.04), transparent)", animation: "rankShine 3s ease-in-out infinite" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, position: "relative" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", animation: "pulse 2s infinite" }}>
                    <img src="/icons/skill_attack.webp" alt="combat" style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 0 4px #ef444488)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                      SHADOW REGRESSION AKTIV
                    </div>
                    <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600, marginTop: 1 }}>
                      Streak-Comeback: {state.shadowRegression.questsCompleted || 0}/3
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, background: "rgba(220,38,38,0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 8, border: "1px solid rgba(220,38,38,0.15)", position: "relative" }}>
                  <div style={{ width: `${((state.shadowRegression.questsCompleted || 0) / 3) * 100}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #991b1b, #dc2626, #ef4444)", transition: "width 0.6s ease", boxShadow: "0 0 8px rgba(220,38,38,0.4)" }} />
                </div>
                <div style={{ fontSize: 10, color: "#a855f7", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
                  <span style={{ color: "#475569" }}>Abschluss →</span> <img src={STAT_ICONS.str} alt="fire" style={{ width: 12, height: 12, objectFit: "contain", verticalAlign: "middle" }} />{Math.floor((state.shadowRegression.previousStreak || 0) * 0.5)} Tage Streak wiederhergestellt
                </div>
              </div>
            ) : penaltyActive ? (
              <div style={{ background: "rgba(20,4,4,0.9)", border: "1px solid #ef444433", borderLeft: "3px solid #ef4444", borderRadius: 14, padding: "14px 16px", marginBottom: 14, backdropFilter: "blur(8px)", animation: "glitch 4s ease-in-out infinite" }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>PENALTY ZONE AKTIV</div>
                <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 500 }}>Das System bestraft Inaktivität. Schließe {Math.max(0, (state.penaltyZone?.redemptionLeft || 3) - (state.penaltyZone?.questsCompletedInPenalty || 0))} weitere Quests ab.</div>
                <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>-20% XP aus allen Quests</div>
              </div>
            ) : null}

            {/* SEASON / WORLD EVENT BANNER */}
            {can('seasons') && state.seasons?.currentSeason && (() => {
              const season = SEASONS[state.seasons.currentSeason];
              const worldEvent = WORLD_EVENTS.find(e => e.key === state.seasons.currentWorldEvent);
              if (!season) return null;
              return (
                <div
                  onClick={() => requirePremium("seasons", () => setShowSeasonView(true))}
                  style={{
                    background: `linear-gradient(135deg, ${season.colors.bg || "#06060e"} 0%, rgba(6,6,14,0.9) 100%)`,
                    border: `1px solid ${season.colors.primary}30`,
                    borderLeft: `3px solid ${season.colors.primary}`,
                    borderRadius: 12, padding: "10px 14px", marginBottom: 12,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10
                  }}
                >
                  {season.iconSrc ? (
                    <img src={season.iconSrc} alt={season.name} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 8px ${season.colors.primary}88) brightness(1.1)` }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>{season.icon}</span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: season.colors.primary, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                      {season.name.toUpperCase()}
                    </div>
                    {worldEvent && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        {worldEvent.iconSrc ? <img src={worldEvent.iconSrc} alt={worldEvent.name} style={{ width: 12, height: 12, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} /> : worldEvent.icon} {worldEvent.name}: {worldEvent.desc.split(" ").slice(0, 5).join(" ")}—
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                    DETAILS ›
                  </div>
                </div>
              );
            })()}

            {/* MODIFIER BANNER */}
            {can('dungeons') && modifier && modifier.id !== "none" && (
              <div style={{ background: `linear-gradient(135deg,${modifier.color}10,transparent)`, border: `1px solid ${modifier.color}25`, borderLeft: `3px solid ${modifier.color}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                {modifier.iconSrc ? (
                  <img src={modifier.iconSrc} alt={modifier.name} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 8px ${modifier.color}88)` }} />
                ) : (
                  <span style={{ fontSize: 20 }}>{modifier.icon}</span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: modifier.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{modifier.name.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{modifier.desc}</div>
                </div>
                <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>RESET IN {hoursUntilMidnight()}h</div>
              </div>
            )}

            <NotificationBanner state={state} theme={theme} onReminderFired={(result) => {
              if (result?.body) notify(result.body, result.reminderId ? "warning" : "info");
            }} onUpdateReminder={(id) => {
              const updated = (state.reminders || []).map(r => r.id === id ? { ...r, fired: true, firedAt: Date.now() } : r);
              persist({ ...state, reminders: updated });
            }} />

            {/* ── v3.0 Phase 4: Motion Blur Transition wrapper ── */}
            <MotionBlurTransition viewKey={view} disabled={state.settings?.motionBlur === false}>

              {/* ◆ ◆ ◆  DASHBOARD ◆ ◆ ◆  */}
              {view === "dashboard" && (
                <DashboardView
                  state={state} theme={theme} can={can}
                  showDashboardStats={showDashboardStats} setShowDashboardStats={setShowDashboardStats}
                  streakBonus={streakBonus} formationBonus={formationBonus} equipBonuses={equipBonuses}
                  xpPercent={xpPercent} xpNeeded={xpNeeded}
                  filteredQuests={filteredQuests} hiddenQuestCount={hiddenQuestCount}
                  questFilter={questFilter} setQuestFilter={setQuestFilter}
                  completeQuest={handleCompleteQuest} completeSubQuest={completeSubQuest} startEditingQuest={startEditingQuest} deleteQuest={deleteQuest}
                  getReplacementCandidates={getReplacementCandidates}
                  replaceSystemQuest={replaceSystemQuest}
                  completeEmergencyQuest={completeEmergencyQuest} createQuest={createQuest} setDailyFocusQuest={setDailyFocusQuest}
                  setShowCreate={requestShowCreate}
                  setShowTaskScan={setShowTaskScan}
                  setShowFocusMode={setShowFocusMode}
                  snoozeReminder={snoozeReminder}
                  onOpenDetail={setDetailQuest}
                  navigateTo={navigateToWithAccess}
                  nextLevel={nextLevel} getUnlocksAtLevel={getUnlocksAtLevel}
                  notify={notify} persist={persist}
                  setIsCreatingEntry={setIsCreatingEntry}
                  getActiveGemBoosters={getActiveGemBoosters}
                  updateHealthData={updateHealthData}
                  claimHealthReward={claimHealthReward}
                  updateScreenTimeData={updateScreenTimeData}
                  claimScreenTimeReward={claimScreenTimeReward}
                  geminiAI={geminiAI}
                  premiumStatus={premiumStatus}
                  requirePremium={requirePremium}
                  openPremiumModal={openPremiumModal}
                  requireQuestSlot={requireQuestSlot}
                />
              )}

              {/* ◆◆◆ DUNGEONS ◆◆◆ */}
              {
                view === "dungeon" && (
                  <div style={{ animation: "fadeIn 0.35s ease" }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>DUNGEON GATES</div>
                      <div style={{ fontSize: 12, color: "#334155", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 5 }}>
                        Reset in {hoursUntilMidnight()}h · {modifier?.id !== "none" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{modifier?.iconSrc ? <img src={modifier.iconSrc} alt={modifier.name} style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle" }} /> : modifier?.icon} {modifier?.name}</span> : "Stable Gates"}
                      </div>
                    </div>
                    {activeDungeons.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}><div style={{ marginBottom: 10 }}><GameIcon src={GATE_ICONS.normal} fallback="🚪" size={48} glow glowColor={theme.primary} animate="float" /></div><div style={{ fontSize: 14, color: "#475569" }}>{tr("systemHub.noActiveGates")}</div><div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>{tr("systemHub.gatesReturnTomorrow")}</div></div>}
                    {activeDungeons.map((d, i) => <div key={d.instanceId} style={{ marginBottom: 10, animation: `slideUp 0.35s ease ${i * 0.1}s both` }}><DungeonGate dungeon={d} playerStats={{ ...state.stats, ...Object.fromEntries(CATEGORIES.map(c => [c.key, (state.stats[c.key] || 0) + (equipBonuses[c.key + "Bonus"] || 0)])) }} theme={theme} onEnter={(dungeon) => { const fee = DUNGEON_ENTRY_FEES[dungeon.rank] || 0; if (fee > 0) persist({ ...state, gold: state.gold - fee }); setActiveDungeon(dungeon); }} modifier={modifier} playerGold={state.gold} /></div>)}
                    {(state.dungeons || []).filter(d => d.cleared).length > 0 && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HEUTE ABSOLVIERT</div>
                        {(state.dungeons || []).filter(d => d.cleared).map((d, i) => <div key={d.instanceId} style={{ marginBottom: 8, opacity: 0.4 }}><DungeonGate dungeon={d} playerStats={state.stats} theme={theme} onEnter={() => { }} modifier={modifier} playerGold={state.gold} /></div>)}
                      </div>
                    )}
                  </div>
                )
              }

              {/* ◆◆◆ STATS ◆◆◆ */}
              {
                view === "stats" && (
                  <StatsView
                    state={state} theme={theme}
                    equipBonuses={equipBonuses} powerLevel={powerLevel}
                    increaseStat={increaseStat}
                  />
                )}

              {/* ◆◆◆ SHADOW ARMY ◆◆◆ */}
              {
                view === "shadows" && (
                  <ShadowArmyView
                    state={state} theme={theme}
                    shadowArmy={shadowArmy} formationBonus={formationBonus}
                    namedShadows={namedShadows} totalShadows={totalShadows}
                    shadowSubView={shadowSubView} setShadowSubView={setShadowSubView}
                    setSelectedShadow={setSelectedShadow}
                    deployShadow={deployShadow} undeployShadow={undeployShadow}
                  />
                )}
              {/* ◆◆◆ STORY ◆◆◆ */}
              {
                view === "story" && state && (
                  <React.Suspense fallback={null}>
                    <StoryView
                      gameState={state}
                      theme={theme}
                      onChapterComplete={(chapter) => {
                        const prev = state;
                        const completedChapters = [...(prev.story?.completedChapters || [])];

                        // Abuse Protection: Only give XP and Gold if chapter isn't already completed
                        if (!completedChapters.includes(chapter.id)) {
                          completedChapters.push(chapter.id);

                          const xpGain = chapter.rewards?.xp || 0;
                          const goldGain = chapter.rewards?.gold || 0;
                          let next = calculateLevelUp(prev, xpGain);
                          const didLevelUp = next._didLevelUp;
                          const earnedPoints = next._levelsGained;
                          const newLevel = next.level;

                          if (chapter.rewards?.title) next.selectedTitle = chapter.rewards.title;

                          persist({
                            ...next,
                            gold: (prev.gold || 0) + goldGain,
                            totalGoldEarned: (prev.totalGoldEarned || 0) + goldGain,
                            story: {
                              ...prev.story,
                              completedChapters,
                              totalStoryXp: (prev.story?.totalStoryXp || 0) + xpGain,
                            },
                          });
                          enqueueRewardFlow(buildStoryChapterRewardFlow(chapter, xpGain, goldGain, didLevelUp, newLevel, earnedPoints, locale));
                        } else {
                          notify(tr("notifications.storyChapterAlreadyCompleted"), "info");
                        }
                      }}
                      onBossComplete={(boss, arcId) => {
                        const prev = state;
                        const defeatedBosses = [...(prev.story?.defeatedBosses || [])];
                        if (defeatedBosses.includes(arcId)) {
                          notify(tr("notifications.storyBossAlreadyDefeated"), "info");
                          return;
                        }
                        defeatedBosses.push(arcId);
                        const xpGain = boss.rewards?.xp || 0;
                        const goldGain = boss.rewards?.gold || 0;
                        let next = calculateLevelUp(prev, xpGain);
                        const didLevelUp = next._didLevelUp;
                        const earnedPoints = next._levelsGained;
                        const newLevel = next.level;
                        const titleGranted = boss.rewards?.title || null;
                        if (titleGranted) next.selectedTitle = titleGranted;
                        persist({
                          ...next,
                          gold: (prev.gold || 0) + goldGain,
                          totalGoldEarned: (prev.totalGoldEarned || 0) + goldGain,
                          story: {
                            ...prev.story,
                            defeatedBosses,
                            totalStoryXp: (prev.story?.totalStoryXp || 0) + xpGain,
                          },
                        });
                        enqueueRewardFlow(buildStoryBossRewardFlow(boss, xpGain, goldGain, didLevelUp, newLevel, earnedPoints, titleGranted, locale));
                      }}
                    />
                  </React.Suspense>
                )
              }

              {/* ◆◆◆ JOBS ◆◆◆ */}
              {
                view === "jobs" && state && (
                  <JobsView
                    state={state}
                    onSwitch={switchJob}
                    onActivate={activateJobAbility}
                    theme={theme}
                  />
                )
              }

              {/* ◆◆◆ EQUIPMENT ◆◆◆ */}
              {
                view === "equipment" && (
                  <div style={{ animation: "fadeIn 0.35s ease" }}>
                    <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "18px", marginBottom: 16, backdropFilter: "blur(12px)" }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>AUSGERÜSTET</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[{ slot: "weapon", label: "WAFFE", icon: "📋", iconSrc: ITEM_ICONS.blade }, { slot: "armor", label: "RÜSTUNG", icon: "📋", iconSrc: ITEM_ICONS.armor }, { slot: "ring1", label: "RING 1", icon: "📋", iconSrc: ITEM_ICONS.ring }, { slot: "ring2", label: "RING 2", icon: "📋", iconSrc: ITEM_ICONS.ring }].map(({ slot, label, icon, iconSrc }) => {
                          const equipped = state.equipment?.slots?.[slot];
                          return (
                            <div key={slot} style={{ background: equipped ? `linear-gradient(135deg,${RARITY_COLORS[equipped.rarity]}10,transparent)` : theme.surface, border: `1px solid ${equipped ? RARITY_COLORS[equipped.rarity] + "33" : theme.primary + "12"}`, borderRadius: 12, padding: "12px", minHeight: 90 }}>
                              <div style={{ fontSize: 8, letterSpacing: 2, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{label}</div>
                              {equipped ? (
                                <div>
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                                    {equipped.iconSrc ? (
                                      <img src={equipped.iconSrc} alt={equipped.name} style={{ width: 36, height: 36, objectFit: "contain", filter: `drop-shadow(0 0 8px ${RARITY_COLORS[equipped.rarity]}88) brightness(1.15)`, flexShrink: 0 }} />
                                    ) : (
                                      <span style={{ fontSize: 22 }}>{equipped.icon}</span>
                                    )}
                                    <div><div style={{ fontSize: 12, fontWeight: 700, color: RARITY_COLORS[equipped.rarity], fontFamily: "'Cinzel',serif" }}>{equipped.name}</div><div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{equipped.desc}</div></div>
                                  </div>
                                  <button onClick={() => unequipItem(slot)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace" }}>ABLEGEN</button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, opacity: 0.2 }}>
                                  {iconSrc ? <img src={iconSrc} alt={label} style={{ width: 32, height: 32, objectFit: "contain", filter: "grayscale(100%)" }} /> : <span style={{ fontSize: 28 }}>{icon}</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {Object.values(state.equipment?.slots || {}).some(v => v) && (
                        <div style={{ marginTop: 14, padding: "10px 12px", background: theme.surface, borderRadius: 10, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#64748b" }}>
                          <div style={{ marginBottom: 4, color: theme.accent, fontWeight: 700 }}>AKTIVE BONI</div>
                          {equipBonuses.xpBonus > 0 && <div>+{Math.round(equipBonuses.xpBonus * 100)}% XP</div>}
                          {equipBonuses.goldBonus > 0 && <div>+{Math.round(equipBonuses.goldBonus * 100)}% Gold</div>}
                          {equipBonuses.dungeonBonus > 0 && <div>+{equipBonuses.dungeonBonus}% Dungeon Erfolg</div>}
                          {equipBonuses.streakShield > 0 && <div>+{equipBonuses.streakShield} Streak-Schutz-Tage</div>}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>INVENTAR ({(state.equipment?.inventory || []).length})</div>
                    {(state.equipment?.inventory || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}>
                        <div style={{ marginBottom: 8, animation: "float 3s ease-in-out infinite" }}><img src={ITEM_ICONS.blade} alt="No Equipment" style={{ width: 40, height: 40, objectFit: "contain", opacity: 0.3, filter: "drop-shadow(0 0 10px #64748b)" }} /></div>
                        <div style={{ fontSize: 13, color: "#475569" }}>Kein Equipment</div>
                        <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Bezwinge Dungeons für Item-Drops (40% Chance)</div>
                      </div>
                    ) : (state.equipment?.inventory || []).map((item, i) => {
                      const rc = RARITY_COLORS[item.rarity];
                      const isEquipped = Object.values(state.equipment?.slots || {}).some(e => e?.instanceId === item.instanceId);
                      return (
                        <div key={item.instanceId} style={{ background: theme.card, border: `1px solid ${rc}22`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${i * 0.05}s both` }}>
                          {item.iconSrc ? (
                            <img src={item.iconSrc} alt={item.name} style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0, filter: `drop-shadow(0 0 10px ${RARITY_COLORS[item.rarity]}77) brightness(1.1)` }} />
                          ) : (
                            <span style={{ fontSize: 26 }}>{item.icon}</span>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: rc, fontFamily: "'Cinzel',serif" }}>{item.name}</div>
                              <div style={{ fontSize: 8, padding: "1px 6px", borderRadius: 3, background: rc + "18", color: rc, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, border: `1px solid ${rc}33` }}>{RARITY_LABELS[item.rarity].toUpperCase()}</div>
                            </div>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{item.desc}</div>
                          </div>
                          {isEquipped ? <div style={{ fontSize: 10, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "4px 10px", borderRadius: 6, background: "#22c55e12", border: "1px solid #22c55e33" }}>EQUIPPED</div>
                            : <button onClick={() => equipItem(item, item.slot === "ring" ? (state.equipment?.slots?.ring1 ? "ring2" : "ring1") : item.slot)} style={{ fontSize: 10, padding: "6px 14px", borderRadius: 8, background: `linear-gradient(135deg,${rc}18,transparent)`, color: rc, border: `1px solid ${rc}33`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>EQUIP</button>}
                        </div>
                      );
                    })}
                  </div>
                )
              }

              {/* ◆◆◆ ACHIEVEMENTS ◆◆◆ */}
              {
                view === "achievements" && (
                  <div style={{ animation: "fadeIn 0.35s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>ACHIEVEMENTS</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{achUnlocked.length}/{catalogAchievements.length} {tr("stats.unlockedWord")}</div>
                      </div>
                      <div style={{ padding: "8px 14px", borderRadius: 10, background: "#f59e0b12", border: "1px solid #f59e0b22", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#92400e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{tr("stats.points")}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", fontFamily: "'Cinzel',serif" }}>{achUnlocked.reduce((sum, id) => { const a = catalogAchievements.find(ac => ac.id === id); return sum + (a?.reward?.xp || 0); }, 0)}</div>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
                      <div style={{ width: `${(achUnlocked.length / catalogAchievements.length) * 100}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#f59e0b88,#f59e0b)", transition: "width 0.8s ease" }} />
                    </div>
                    {["quests", "dungeons", "story", "streaks", "stats", "shadows", "misc", "habits"].map(cat => {
                      const catAchs = catalogAchievements.filter(a => a.cat === cat);
                      if (catAchs.length === 0) return null;
                      const catMeta = {
                        quests: { label: tr("stats.achievementCategories.quests"), icon: QUEST_ICONS.daily },
                        dungeons: { label: tr("stats.achievementCategories.dungeons"), icon: GATE_ICONS.normal },
                        story: { label: tr("stats.achievementCategories.story"), icon: STORY_ICONS.scroll },
                        streaks: { label: tr("stats.achievementCategories.streaks"), icon: NAV_ICONS.timer },
                        stats: { label: tr("stats.achievementCategories.stats"), icon: NAV_ICONS.analytics },
                        shadows: { label: tr("stats.achievementCategories.shadows"), icon: SHADOW_ICONS.soldier },
                        misc: { label: tr("stats.achievementCategories.misc"), icon: NAV_ICONS.achievements },
                        habits: { label: tr("stats.achievementCategories.habits"), icon: HABIT_ICONS.fitness },
                      };
                      const cm = catMeta[cat] || { label: cat, icon: null };
                      return (
                        <div key={cat} style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            {cm.icon && <img src={cm.icon} alt={cm.label} style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.7 }} />}
                            {cm.label.toUpperCase()}
                          </div>
                          {catAchs.map((ach, i) => {
                            const unlocked = achUnlocked.includes(ach.id);
                            return (
                              <div key={ach.id} style={{ background: theme.card, border: `1px solid ${unlocked ? "#f59e0b22" : theme.primary + "12"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, opacity: unlocked ? 1 : 0.45, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${i * 0.06}s both` }}>
                                <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", filter: unlocked ? "none" : "grayscale(100%) brightness(0.4)" }}>
                                  {ach.iconSrc
                                    ? <img src={ach.iconSrc} alt={ach.name} style={{ width: 32, height: 32, objectFit: "contain", filter: unlocked ? `drop-shadow(0 0 6px #f59e0b55)` : "none" }} />
                                    : <span style={{ fontSize: 24 }}>{ach.icon}</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#fde68a" : "#475569", fontFamily: "'Cinzel',serif" }}>{ach.name}</div>
                                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{ach.desc}</div>
                                  {unlocked && ach.reward.title && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 3, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 3 }}><img src={STORY_ICONS.arise} alt="title" style={{ width: 9, height: 9, objectFit: "contain" }} /> "{ach.reward.title}" freigeschaltet</div>}
                                </div>
                                {unlocked ? <div style={{ fontSize: 12, color: "#f59e0b" }}>✓</div> : <div style={{ textAlign: "right", fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}><div>+{ach.reward.xp} XP</div><div>{ach.reward.gold > 0 ? `+${ach.reward.gold}G` : ""}</div></div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )
              }

              {/* UNIFIED DESIGN SHOP */}
              {
                view === "shop" && (
                  <UnifiedShopView
                    state={state} theme={theme}
                    SHOP_ITEMS={SHOP_ITEMS} HUNTER_CODEX={HUNTER_CODEX}
                    GEM_SHOP_ITEMS={GEM_SHOP_ITEMS}
                    shopUnlocked={shopUnlocked} rank={rank}
                    getRankIndex={getRankIndex}
                    buyItem={buyItem} buyGemItem={buyGemItem}
                    persist={persist} notify={notify} can={can}
                    genId={genId} getToday={getToday}
                    watchRewardedAd={watchRewardedAd}
                    claimDailyGemBonus={claimDailyGemBonus}
                    getActiveGemBoosters={getActiveGemBoosters}
                    onWatchAd={() => setShowAdModal(true)}
                    onPreviewPageTransition={previewPageTransition}
                  />
                )
              }

              {/* ◆ ◆ ◆  ANALYTICS ◆ ◆ ◆  */}
              {
                view === "analytics" && (
                  <React.Suspense fallback={null}>
                    <AnalyticsDashboard state={state} theme={theme} />
                  </React.Suspense>
                )
              }

              {/* ◆ ◆ ◆  GOALS ◆ ◆ ◆  */}
              {
                view === "goals" && (
                  <GoalFramework state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} onOpenQuestCreate={openQuestCreate} />
                )
              }

              {/* ◆ ◆ ◆  CALENDAR ◆ ◆ ◆  */}
              {
                view === "calendar" && (
                  <CalendarSchedule state={state} persist={persist} notify={notify} theme={theme} />
                )
              }

              {/* ◆ ◆ ◆  CHALLENGES ◆ ◆ ◆  */}
              {
                view === "challenges" && (
                  <ChallengesSystem state={state} persist={persist} notify={notify} theme={theme} />
                )
              }

              {/* ◆ ◆ ◆  SETTINGS ◆ ◆ ◆  */}
              {
                view === "settings" && (
                  <SettingsView
                    state={state}
                    persist={persist}
                    theme={theme}
                    can={can}
                    onLogout={onLogout}
                    onOpenShop={(tab = "gems", gemCategory = null) => {
                      window.__SHOP_START_TAB = tab;
                      if (gemCategory) window.__GEM_SHOP_START_CATEGORY = gemCategory;
                      navigateTo("shop");
                    }}
                    onOpenPremium={openPremiumModal}
                    premiumStatus={premiumStatus}
                    onPreviewPageTransition={previewPageTransition}
                    updateHealthData={updateHealthData}
                    claimHealthReward={claimHealthReward}
                    updateScreenTimeData={updateScreenTimeData}
                    claimScreenTimeReward={claimScreenTimeReward}
                    geminiAI={geminiAI}
                    activatePremiumCode={activatePremiumCode}
                    notify={notify}
                    onResetTutorial={handleResetTutorial}
                  />
                )
              }
            </MotionBlurTransition>
          </main >

          {/* BOTTOM NAV — v2.0 component */}
          <BottomNav
            view={view}
            navConfig={state.navbarConfig}
            allTabs={ALL_NAV_TABS}
            defaultKeys={DEFAULT_NAV_KEYS}
            can={can}
            onNavigate={(key) => {
              setShowSeasonView(false); setShowSoulLink(false); setShowCharismaView(false); setShowDawnDusk(false);
              navigateToWithAccess(key);
            }}
            activeDungeons={activeDungeons}
            statPoints={state.statPoints}
            penaltyActive={penaltyActive}
            theme={theme}
            hidden={isCreatingEntry}
            premiumStatus={premiumStatus}
          />

          {/* TRAINING HUB — unified view for habits/goals/calendar */}
          {
            view === "training" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: "16px", paddingTop: headerOffset, paddingBottom: 110, overflowY: "auto" }}>
                <div style={{ maxWidth: 480, margin: "0 auto" }}>
                  {/* Training header */}
                  <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "18px 20px", marginBottom: 16, backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: `radial-gradient(circle at 100% 30%, ${theme.primary}0c, transparent 70%)`, pointerEvents: "none" }} />
                    <div style={{ fontSize: 9, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>PATH OF THE HUNTER</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1.2 }}>Ziele & Fortschritt</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Langzeit-Ziele und Quest-Kalender</div>
                      </div>
                      {can('sanctum') && (
                        <button onClick={() => navigateTo("sanctum")} style={{ padding: "8px 14px", borderRadius: 12, background: "linear-gradient(135deg, #a855f722, #7c3aed11)", color: "#a855f7", border: "1px solid #a855f744", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px #a855f722", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px #a855f744"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 12px #a855f722"; }}>
                          <img src={NAV_ICONS.timer} alt="Sanctum" style={{ width: 12, height: 12, objectFit: "contain", filter: "drop-shadow(0 0 3px #a855f788)" }} /> SANCTUM
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Training modules combined */}
                  <div style={{ marginBottom: 32 }}>
                    <GoalFramework state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} onOpenQuestCreate={openQuestCreate} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
                    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
                    <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>TÄGLICHES TRAINING</div>
                    <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <HabitTracker state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
                    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
                    <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>HUNTER QUESTS</div>
                    <button onClick={openQuestCreate} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.28)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(239,68,68,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    ><img src={SKILL_ICONS.attack} alt="Quest" style={{ width: 11, height: 11, objectFit: "contain", filter: "brightness(1.5)", verticalAlign: "middle", marginRight: 4 }} />QUEST</button>
                    <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
                  </div>

                  {filteredQuests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}>
                      <div style={{ marginBottom: 10, animation: "float 3s ease-in-out infinite", display: "flex", justifyContent: "center" }}>
                        <img src="/icons/skill_attack.webp" alt="no quests" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4, filter: "drop-shadow(0 0 10px rgba(100,116,139,0.4))" }} />
                      </div>
                      <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                      <div style={{ fontSize: 11, color: "#334155" }}>Erstelle Quests auf dem Heute-Tab.</div>
                    </div>
                  ) : filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={handleCompleteQuest} onEdit={startEditingQuest} onDelete={deleteQuest} />)}
                </div>
              </div>
            )
          }

          {/* SYSTEM — app launcher of module pages */}
          {view === "system" && (
            <div data-tutorial="system-menu" style={{ position: "fixed", inset: 0, zIndex: 45, height: "100dvh", background: "#04030a", animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: 0, overflow: "hidden" }}>
              <HunterIslandHub
                state={state}
                can={can}
                tr={tr}
                theme={theme}
                rank={rank}
                activeDungeons={activeDungeons}
                filteredQuests={filteredQuests}
                namedShadows={namedShadows}
                catalogAchievements={catalogAchievements}
                achUnlocked={achUnlocked}
                premiumStatus={premiumStatus}
                navigateToWithAccess={navigateToWithAccess}
                openPremiumModal={openPremiumModal}
                onOpenCharisma={() => setShowCharismaView(true)}
                shellTopOffset={headerOffset}
                shellBottomOffset="60px"
                tutorialStepId={tutorialRuntimeState.activeTutorialId === "onboarding" ? tutorialRuntimeState.stepId : null}
              />
            </div>
          )}

          {/* INNER SANCTUM VIEW */}
          {view === "sanctum" && (
            <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: "16px", paddingTop: headerOffset, paddingBottom: 110, overflowY: "auto" }}>
              <div style={{ maxWidth: 480, margin: "0 auto" }}>
                <React.Suspense fallback={null}>
                  <InnerSanctum theme={theme} state={state} persist={persist} notify={notify} />
                </React.Suspense>
              </div>
            </div>
          )}


          {/* QUEST FORGE MODAL */}
          {
            showCreate && (
              <div onClick={() => { setShowCreate(false); setShowTemplates(false); }} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(2,2,10,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)", padding: "16px 12px" }}>
                <div data-tutorial="quest-form" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", background: `linear-gradient(180deg,${theme.card},rgba(6,6,16,0.99))`, border: `1px solid ${theme.primary}44`, borderTop: `2px solid ${theme.primary}`, borderRadius: 24, display: "flex", flexDirection: "column", animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", boxShadow: `0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px ${theme.glow}` }}>
                  {/* Header */}
                  <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, textShadow: `0 0 12px ${theme.glow}` }}>{tr("quests.forge.kicker")}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>{editingQuestId ? tr("quests.forge.titleEdit") : tr("quests.forge.titleCreate")}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* RANDOMIZER BUTTON */}
                        <button
                          title={tr("quests.forge.randomIdea")}
                          onClick={() => {
                            const pool = QUEST_POOL;
                            const pick = pool[Math.floor(Math.random() * pool.length)];
                            setRandomizing(true);
                            setQTitle(pick.title); setQCat(pick.category); setQDiff(pick.difficulty); setQType("side");
                            setQDescription(pick.desc || ""); setQSubQuests(pick.subQuests ? [...pick.subQuests] : []); setQTags(pick.tags ? pick.tags.join(", ") : "");
                            setShowTemplates(false);
                            setTimeout(() => setRandomizing(false), 600);
                          }}
                          style={{ width: 38, height: 38, borderRadius: 12, background: randomizing ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.1)", border: `1px solid ${randomizing ? "#f59e0b88" : "#f59e0b33"}`, color: "#f59e0b", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", cursor: "pointer", animation: randomizing ? "spin 0.5s ease" : "none" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.2)"; e.currentTarget.style.borderColor = "#f59e0b66"; }}
                          onMouseLeave={e => { if (!randomizing) { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; e.currentTarget.style.borderColor = "#f59e0b33"; } }}
                        >🎲</button>
                        <button onClick={() => { setShowCreate(false); setShowTemplates(false); setQDescription(""); setQSubQuests([]); setQSaveToPool(false); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444444"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>&#x2715;</button>
                      </div>
                    </div>
                    {/* 3 Mode tabs: Erstellen / Mein Pool / Bibliothek */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      {[
                        { key: "create", label: tr("quests.forge.tabs.create") },
                        { key: "pool", label: tr("quests.forge.tabs.pool") },
                        { key: "library", label: tr("quests.forge.tabs.library") },
                      ].map(tab => (
                        <button key={tab.key} onClick={() => setForgeTab(tab.key)} style={{
                          flex: 1, padding: "10px 6px", fontSize: 11, fontWeight: 900,
                          background: forgeTab === tab.key ? `linear-gradient(135deg, ${theme.primary}25 0%, ${theme.primary}05 100%)` : "rgba(255,255,255,0.015)",
                          color: forgeTab === tab.key ? theme.primary : "#475569",
                          border: `1px solid ${forgeTab === tab.key ? theme.primary + "aa" : "rgba(255,255,255,0.05)"}`,
                          borderRadius: forgeTab === tab.key ? "14px 3px 14px 3px" : "8px",
                          boxShadow: forgeTab === tab.key ? `0 8px 24px ${theme.primary}33, inset 0 0 16px ${theme.primary}28` : "none",
                          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)", cursor: "pointer", fontFamily: "'Cinzel',serif", letterSpacing: 1, textTransform: "uppercase",
                          position: "relative", zIndex: forgeTab === tab.key ? 10 : 1, transform: forgeTab === tab.key ? "scale(1.02) translateY(-1px)" : "scale(1)",
                          textShadow: forgeTab === tab.key ? `0 0 10px ${theme.primary}aa` : "none"
                        }}
                          onMouseEnter={e => { if (forgeTab !== tab.key) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                          onMouseLeave={e => { if (forgeTab !== tab.key) { e.currentTarget.style.background = "rgba(255,255,255,0.015)"; e.currentTarget.style.transform = "none"; } }}
                        >{tab.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div style={{ flex: 1, overflow: "auto", padding: "0 24px 6px", scrollbarWidth: "thin", scrollbarColor: `${theme.primary}44 transparent` }}>
                    {forgeTab === "library" ? (
                      /* ─── BIBLIOTHEK TAB ─── */
                      <>
                        <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
                          {[{ key: "all", label: tr("quests.forge.all") }, { key: "favorites", label: tr("quests.forge.favorites"), color: "#fbbf24" }, ...catalogCategories.map(c => ({ key: c.key, label: c.stat, color: c.color }))].map(f => (
                            <button key={f.key} onClick={() => setTemplateFilter(f.key)} style={{
                              padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, flexShrink: 0,
                              background: templateFilter === f.key ? (f.color || theme.primary) + "22" : "transparent",
                              color: templateFilter === f.key ? (f.color || theme.primary) : "#475569",
                              border: `1px solid ${templateFilter === f.key ? (f.color || theme.primary) + "44" : "transparent"}`,
                              transition: "all 0.25s", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer"
                            }}>{f.label}</button>
                          ))}
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          {QUEST_POOL.filter(t => templateFilter === "all" || t.category === templateFilter || (templateFilter === "favorites" && state.customQuestPool?.favorites?.includes(t.title))).map((t, i) => {
                            const cat = catalogCategories.find(c => c.key === t.category);
                            const diff = catalogDifficulties.find(d => d.key === t.difficulty);
                            return (
                              <button key={i} onClick={() => {
                                setQTitle(t.title);
                                setQCat(t.category);
                                setQDiff(t.difficulty);
                                setQType("side");
                                setQDescription(t.desc || "");
                                setQSubQuests(t.subQuests ? [...t.subQuests] : []);
                                setQTags(t.tags ? t.tags.join(", ") : "");
                                setForgeTab("create");
                              }}
                                style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = (cat?.color || theme.primary) + "44"; e.currentTarget.style.background = (cat?.color || theme.primary) + "08"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                                <span style={{ fontSize: 9, color: cat?.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 6px", borderRadius: 6, background: (cat?.color || "#888") + "15" }}>{cat?.stat}</span>
                                <span style={{ color: "#e2e8f0", fontSize: 13, fontFamily: "'Outfit',sans-serif", flex: 1 }}>{t.title}</span>
                                {t.tags?.length > 0 && <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t.tags.length} Tags</span>}
                                <span style={{ fontSize: 9, color: diff?.color, fontFamily: "'JetBrains Mono',monospace" }}>{diff?.label}</span>
                                <button onClick={(e) => { e.stopPropagation(); toggleFavoriteTemplate(t.title); }} style={{ background: "transparent", border: "none", color: state.customQuestPool?.favorites?.includes(t.title) ? "#fbbf24" : "#475569", fontSize: 14, cursor: "pointer", opacity: state.customQuestPool?.favorites?.includes(t.title) ? 1 : 0.4 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = state.customQuestPool?.favorites?.includes(t.title) ? 1 : 0.4}>{state.customQuestPool?.favorites?.includes(t.title) ? "⭐" : "☆"}</button>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : forgeTab === "pool" ? (
                      /* ─── MEIN POOL TAB ─── */
                      <>
                        {state.customQuestPool?.recentlyUsed?.length > 0 && (
                          <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{tr("quests.forge.recentlyUsed")}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {state.customQuestPool.recentlyUsed.map((title, i) => (
                                <button key={i} onClick={() => { setQTitle(title); setForgeTab("create"); }} style={{ padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                                  {title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.yourTemplates")}</div>
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          {state.customQuestPool?.templates?.length > 0 ? (
                            state.customQuestPool.templates.map((t) => {
                              const cat = catalogCategories.find(c => c.key === t.category);
                              const diff = catalogDifficulties.find(d => d.key === t.difficulty);
                              return (
                                <button key={t.id} onClick={() => { if (requireQuestSlot()) createQuestFromTemplate(t); }}
                                  style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s", position: "relative" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = (cat?.color || theme.primary) + "44"; e.currentTarget.style.background = (cat?.color || theme.primary) + "08"; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                                  <span style={{ fontSize: 9, color: cat?.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 6px", borderRadius: 6, background: (cat?.color || "#888") + "15" }}>{cat?.stat}</span>
                                  <span style={{ color: "#e2e8f0", fontSize: 13, fontFamily: "'Outfit',sans-serif", flex: 1 }}>{t.title}</span>
                                  {t.tags?.length > 0 && <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t.tags.length} Tags</span>}
                                  <button onClick={(e) => { e.stopPropagation(); toggleFavoriteTemplate(t.id); }} style={{ background: "transparent", border: "none", color: state.customQuestPool?.favorites?.includes(t.id) ? "#fbbf24" : "#475569", fontSize: 14, cursor: "pointer", opacity: state.customQuestPool?.favorites?.includes(t.id) ? 1 : 0.4 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = state.customQuestPool?.favorites?.includes(t.id) ? 1 : 0.4}>{state.customQuestPool?.favorites?.includes(t.id) ? "⭐" : "☆"}</button>
                                  <button onClick={(e) => { e.stopPropagation(); removeFromPool(t.id); }} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 14, cursor: "pointer", padding: 2, opacity: 0.6 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>✕</button>
                                </button>
                              );
                            })
                          ) : (
                            <div style={{ textAlign: "center", padding: "30px 20px", color: "#64748b", fontSize: 12, fontFamily: "'Outfit',sans-serif", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
                              {tr("quests.forge.poolEmpty")}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* ─── ERSTELLEN TAB ─── */
                      <>
                        {/* QUEST TITLE */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.titleLabel")}</div>
                          <input
                            data-tutorial="quest-title-input"
                            value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder={tr("quests.forge.titlePlaceholder")}
                            style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 14, background: "rgba(10,10,24,0.8)", border: `1px solid ${qTitle.trim() ? theme.primary + "66" : "rgba(255,255,255,0.08)"}`, color: "#fff", fontSize: 16, fontFamily: "'Outfit',sans-serif", transition: "all 0.3s", outline: "none", boxShadow: qTitle.trim() ? `0 0 16px ${theme.primary}22` : "inset 0 2px 4px rgba(0,0,0,0.5)" }}
                            onFocus={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 20px ${theme.primary}44`; e.currentTarget.style.background = "rgba(15,15,30,0.95)"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = qTitle.trim() ? theme.primary + "66" : "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = qTitle.trim() ? `0 0 16px ${theme.primary}22` : "inset 0 2px 4px rgba(0,0,0,0.5)"; e.currentTarget.style.background = "rgba(10,10,24,0.8)"; }}
                          />
                        </div>

                        {/* TYPE */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.typeLabel")}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[
                              { key: "side", label: tr("quests.forge.typeSide"), color: "#94a3b8" },
                              { key: "daily", label: tr("quests.forge.typeDaily"), color: "#22d3ee" },
                              ...(can('weekly_quests') ? [{ key: "weekly", label: tr("quests.forge.typeWeekly"), color: "#8b5cf6" }] : []),
                              ...(can('chained_quests') ? [{ key: "chained", label: tr("quests.forge.chain"), color: "#f59e0b" }] : []),
                            ].map(t => {
                              const conf = QUEST_TYPES_CONFIG[t.key] || QUEST_TYPES_CONFIG.side;
                              return (
                                <button key={t.key} onClick={() => setQType(t.key)} style={{
                                  flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 900,
                                  background: qType === t.key ? `linear-gradient(145deg, ${t.color}25 0%, ${t.color}05 100%)` : "rgba(255,255,255,0.02)",
                                  color: qType === t.key ? t.color : "#475569",
                                  border: `1px solid ${qType === t.key ? t.color + "aa" : "rgba(255,255,255,0.04)"}`,
                                  borderRadius: qType === t.key ? "12px 2px 12px 2px" : "6px",
                                  boxShadow: qType === t.key ? `0 8px 24px ${t.color}33, inset 0 0 16px ${t.color}28` : "none",
                                  transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)", cursor: "pointer", fontFamily: "'Cinzel',serif", letterSpacing: 1, textTransform: "uppercase",
                                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                  transform: qType === t.key ? "scale(1.04)" : "scale(1)",
                                  zIndex: qType === t.key ? 10 : 1, position: "relative"
                                }}
                                  onMouseEnter={e => { if (qType !== t.key) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                  onMouseLeave={e => { if (qType !== t.key) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "none"; } }}
                                >
                                  <img src={conf.iconSrc} alt={t.label} style={{ width: 28, height: 28, objectFit: "contain", filter: qType === t.key ? `drop-shadow(0 0 8px ${t.color}) brightness(1.3)` : "grayscale(90%) opacity(40%)", transition: "all 0.3s" }} />
                                  <span>{t.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* DIFFICULTY */}
                        <div data-tutorial="quest-difficulty" style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.difficultyLabel")}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {catalogDifficulties.map(d => (
                              <button key={d.key} onClick={() => setQDiff(d.key)} style={{
                                flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 900,
                                background: qDiff === d.key ? `linear-gradient(145deg, ${d.color}25 0%, ${d.color}05 100%)` : "rgba(255,255,255,0.02)",
                                color: qDiff === d.key ? d.color : "#475569",
                                border: `1px solid ${qDiff === d.key ? d.color + "aa" : "rgba(255,255,255,0.04)"}`,
                                borderRadius: qDiff === d.key ? "12px 2px 12px 2px" : "6px",
                                boxShadow: qDiff === d.key ? `0 8px 24px ${d.color}33, inset 0 0 16px ${d.color}28` : "none",
                                transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)", cursor: "pointer", fontFamily: "'Cinzel',serif", letterSpacing: 1, textTransform: "uppercase",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                transform: qDiff === d.key ? "scale(1.06)" : "scale(1)",
                                zIndex: qDiff === d.key ? 10 : 1, position: "relative"
                              }}
                                onMouseEnter={e => { if (qDiff !== d.key) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                onMouseLeave={e => { if (qDiff !== d.key) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "none"; } }}
                              >
                                <img src={d.iconSrc} alt={d.label} style={{ width: 34, height: 34, objectFit: "contain", filter: qDiff === d.key ? `drop-shadow(0 0 8px ${d.color}) brightness(1.3)` : "grayscale(90%) opacity(40%)", transition: "all 0.3s" }} />
                                <span>{d.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* CATEGORY */}
                        <div data-tutorial="quest-category" style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.categoryLabel")}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {catalogCategories.map(c => (
                              <button key={c.key} onClick={() => setQCat(c.key)} style={{
                                flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 900,
                                background: qCat === c.key ? `linear-gradient(145deg, ${c.color}25 0%, ${c.color}05 100%)` : "rgba(255,255,255,0.02)",
                                color: qCat === c.key ? c.color : "#475569",
                                border: `1px solid ${qCat === c.key ? c.color + "aa" : "rgba(255,255,255,0.04)"}`,
                                borderRadius: qCat === c.key ? "12px 2px 12px 2px" : "6px",
                                boxShadow: qCat === c.key ? `0 8px 24px ${c.color}33, inset 0 0 16px ${c.color}28` : "none",
                                transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)", cursor: "pointer", fontFamily: "'Cinzel',serif", letterSpacing: 1, textTransform: "uppercase",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                transform: qCat === c.key ? "scale(1.05)" : "scale(1)",
                                zIndex: qCat === c.key ? 10 : 1, position: "relative"
                              }}
                                onMouseEnter={e => { if (qCat !== c.key) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                                onMouseLeave={e => { if (qCat !== c.key) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "none"; } }}
                              >
                                <img src={c.iconSrc} alt={c.stat} style={{ width: 28, height: 28, objectFit: "contain", mixBlendMode: "screen", filter: qCat === c.key ? `brightness(1.5) drop-shadow(0 0 8px ${c.color})` : "grayscale(90%) opacity(40%)", transition: "all 0.3s" }} />
                                <span>{c.stat}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── DETAILS TOGGLE ── */}
                        <button onClick={() => setShowDetails(!showDetails)} style={{
                          width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: showDetails ? `linear-gradient(90deg, ${theme.primary}11, transparent)` : "rgba(255,255,255,0.02)",
                          color: showDetails ? theme.primary : "#64748b",
                          border: `1px solid ${showDetails ? theme.primary + "44" : "rgba(255,255,255,0.06)"}`,
                          boxShadow: showDetails ? `inset 0 0 10px ${theme.primary}11` : "none",
                          cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14,
                          transition: "all 0.3s"
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = showDetails ? `linear-gradient(90deg, ${theme.primary}22, transparent)` : "rgba(255,255,255,0.04)"; e.currentTarget.style.color = showDetails ? theme.primary : "#94a3b8"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = showDetails ? `linear-gradient(90deg, ${theme.primary}11, transparent)` : "rgba(255,255,255,0.02)"; e.currentTarget.style.color = showDetails ? theme.primary : "#64748b"; }}
                        >
                          <span style={{ transform: showDetails ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                          {tr("quests.forge.detailsToggle")}
                          <span style={{ fontSize: 9, color: showDetails ? theme.primary : "#475569" }}>{(qDescription.trim() || qSubQuests.length > 0) ? "●" : ""}</span>
                        </button>

                        {/* ── DETAILS PANEL ── */}
                        {showDetails && (
                          <div style={{ animation: "slideDown 0.3s ease", marginBottom: 14, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.015)", border: `1px solid ${theme.primary}15` }}>
                            {/* PHOTO IMPORT PLACEHOLDER */}
                            {can('ai_task_scan') && (
                              <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
                                <div onClick={() => { if (can('ai_task_scan')) requirePremium("ai_task_scan", () => { setShowTaskScan(true); setShowCreate(false); }); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${premiumStatus?.active ? theme.primary + "55" : "rgba(168,85,247,0.55)"}`, background: premiumStatus?.active ? `linear-gradient(90deg, ${theme.primary}11, transparent)` : "linear-gradient(90deg, rgba(168,85,247,0.18), rgba(34,211,238,0.05))", opacity: can('ai_task_scan') ? 1 : 0.45, cursor: can('ai_task_scan') ? "pointer" : "not-allowed", boxShadow: `inset 0 0 10px ${theme.primary}11` }}>
                                  <span style={{ fontSize: 14 }}>📸</span>
                                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: premiumStatus?.active ? theme.primary : "#c084fc", fontWeight: 700, letterSpacing: 1 }}>{premiumStatus?.active ? "FOTO-SCAN" : "PRO SCAN"}</span>
                                </div>
                              </div>

                            )}

                            {/* DESCRIPTION */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 9, letterSpacing: 2, color: theme.primary, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>{tr("quests.forge.descriptionLabel")}</span>
                                {can('ai_quest_desc') && state?.ai?.enabled && qTitle.trim() && (
                                  <button
                                    disabled={geminiAI.isLoading}
                                    onClick={async () => {
                                      requirePremium("ai_quest_desc", async () => {
                                        const result = await geminiAI.generateQuestDesc(qTitle, qCat);
                                        if (!result) return;
                                        if (result.description) setQDescription(result.description.slice(0, 300));
                                        if (result.subQuests?.length > 0) setQSubQuests(result.subQuests.slice(0, 5).map(s => ({ title: s })));
                                      });
                                    }}
                                    style={{ background: geminiAI.isLoading ? "rgba(0,200,255,0.04)" : `rgba(0,200,255,0.1)`, border: `1px solid ${geminiAI.isLoading ? "rgba(0,200,255,0.12)" : "rgba(0,200,255,0.4)"}`, borderRadius: 3, color: geminiAI.isLoading ? "#2a4455" : "#00c8ff", padding: "3px 9px", fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 8, letterSpacing: 2, cursor: geminiAI.isLoading ? "default" : "pointer", textTransform: "uppercase", boxShadow: geminiAI.isLoading ? "none" : "0 0 8px rgba(0,200,255,0.2)", transition: "all 0.2s" }}
                                  >
                                    {geminiAI.isLoading ? "· · ·" : premiumStatus?.active ? "> KI.GEN" : "> PRO"}
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={qDescription}
                                onChange={e => { if (e.target.value.length <= 300) setQDescription(e.target.value); }}
                                placeholder={tr("quests.forge.descriptionPlaceholder")}
                                rows={3}
                                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, background: "rgba(10,10,24,0.8)", border: `1px solid rgba(255,255,255,0.08)`, color: "#e2e8f0", fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", minHeight: 60, maxHeight: 120, outline: "none", transition: "all 0.3s" }}
                                onFocus={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 16px ${theme.primary}33`; }}
                                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                              />
                              <div style={{ fontSize: 9, color: qDescription.length >= 280 ? "#ef4444" : "#334155", textAlign: "right", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{qDescription.length}/300</div>
                            </div>

                            {/* SUB-QUESTS / ETAPPEN */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 9, letterSpacing: 2, color: theme.primary, marginBottom: 8, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>{tr("quests.forge.stagesLabel")}</span>
                                <span style={{ color: "#475569", fontWeight: 400 }}>{qSubQuests.length}/5</span>
                              </div>
                              {qSubQuests.map((sq, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${theme.primary}15`, border: `1px solid ${theme.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{i + 1}</div>
                                  <input
                                    value={sq.title}
                                    onChange={e => { const next = [...qSubQuests]; next[i] = { ...next[i], title: e.target.value }; setQSubQuests(next); }}
                                    placeholder={tr("quests.forge.stagePlaceholder", { number: i + 1 })}
                                    style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: "rgba(10,10,24,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", transition: "all 0.2s" }}
                                    onFocus={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 12px ${theme.primary}33`; e.currentTarget.style.background = "rgba(15,15,30,0.95)"; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(10,10,24,0.8)"; }}
                                  />
                                  <button onClick={() => setQSubQuests(qSubQuests.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: "1px solid #ef444433", color: "#ef4444", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#ef444418"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                  >✕</button>
                                </div>
                              ))}
                              {qSubQuests.length < 5 && (
                                <button onClick={() => setQSubQuests([...qSubQuests, { title: "" }])} style={{
                                  width: "100%", padding: "8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                  background: "transparent", border: `1px dashed ${theme.primary}33`,
                                  color: theme.primary, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
                                  transition: "all 0.2s", letterSpacing: 1,
                                }}
                                  onMouseEnter={e => { e.currentTarget.style.background = `${theme.primary}0a`; e.currentTarget.style.borderColor = `${theme.primary}66`; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${theme.primary}33`; }}
                                >{tr("quests.forge.addStage")}</button>
                              )}
                            </div>

                            {/* SAVE TO POOL CHECKBOX */}
                            {!editingQuestId && (
                              <>
                                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: qSaveToPool ? `${theme.primary}0a` : "transparent", border: `1px solid ${qSaveToPool ? theme.primary + "33" : "rgba(255,255,255,0.04)"}`, cursor: "pointer", transition: "all 0.2s" }}>
                                  <div onClick={() => setQSaveToPool(!qSaveToPool)} style={{
                                    width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                    background: qSaveToPool ? theme.primary + "22" : "transparent",
                                    border: `2px solid ${qSaveToPool ? theme.primary : "#334155"}`,
                                    color: theme.primary, fontSize: 12, transition: "all 0.2s"
                                  }}>{qSaveToPool ? "✓" : ""}</div>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: qSaveToPool ? theme.primary : "#e2e8f0" }}>{tr("quests.forge.saveToPool")}</div>
                                    <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{tr("quests.forge.saveToPoolDesc")}</div>
                                  </div>
                                </label>
                                {qSaveToPool && (
                                  <div style={{ marginTop: 8, padding: "0 4px", animation: "slideDown 0.3s ease" }}>
                                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tr("quests.forge.tagsLabel")}</div>
                                    <input
                                      value={qTags} onChange={e => setQTags(e.target.value)} placeholder={tr("quests.forge.tagsPlaceholder")}
                                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, background: "rgba(10,10,24,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", transition: "all 0.2s" }}
                                      onFocus={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 12px ${theme.primary}33`; }}
                                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* PRODUCTIVITY SIGNALS */}
                        <div style={{ marginBottom: 14, display: "grid", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{tr("quests.forge.priorityLabel")}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                              {[{ key: "low", label: tr("quests.forge.priorityLow") }, { key: "medium", label: tr("quests.forge.priorityMedium") }, { key: "high", label: tr("quests.forge.priorityHigh") }].map(p => (
                                <button key={p.key} type="button" onClick={() => setQPriority(p.key)} style={{ padding: "8px 6px", borderRadius: 8, fontSize: 9, fontWeight: 800, background: qPriority === p.key ? `${theme.primary}18` : "rgba(255,255,255,0.025)", border: `1px solid ${qPriority === p.key ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: qPriority === p.key ? theme.primary : "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}>{p.label}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{tr("quests.forge.energyLabel")}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                              {[{ key: "quick", label: tr("quests.forge.energyQuick") }, { key: "medium", label: tr("quests.forge.energyMedium") }, { key: "deep", label: tr("quests.forge.energyDeep") }].map(e => (
                                <button key={e.key} type="button" onClick={() => setQEnergy(e.key)} style={{ padding: "8px 6px", borderRadius: 8, fontSize: 9, fontWeight: 800, background: qEnergy === e.key ? `${theme.secondary}18` : "rgba(255,255,255,0.025)", border: `1px solid ${qEnergy === e.key ? theme.secondary + "66" : "rgba(255,255,255,0.06)"}`, color: qEnergy === e.key ? theme.secondary : "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}>{e.label}</button>
                              ))}
                            </div>
                          </div>
                          <input value={qContext} onChange={e => setQContext(e.target.value)} placeholder={tr("quests.forge.contextPlaceholder")} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                        </div>

                        {/* DUE DATE */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{tr("quests.forge.dueDateLabel")}</div>
                          <input
                            type="date"
                            value={qDueDate}
                            onChange={e => setQDueDate(e.target.value)}
                            style={{
                              width: "100%", padding: "8px 12px", borderRadius: 8,
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid ${qDueDate ? theme.primary + "44" : "rgba(255,255,255,0.08)"}`,
                              color: qDueDate ? "#e2e8f0" : "#475569",
                              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                              colorScheme: "dark", outline: "none", boxSizing: "border-box",
                              transition: "border-color 0.2s",
                            }}
                          />
                        </div>

                        {/* REMINDER */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{tr("quests.forge.reminderLabel")}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: qReminderPreset === "custom" ? 8 : 0 }}>
                            {[{ key: "none", label: tr("quests.forge.reminderOff") }, { key: "in30", label: "30 MIN" }, { key: "evening", label: "18:00" }, { key: "tomorrow_morning", label: tr("quests.forge.reminderTomorrow") }, { key: "before_due", label: tr("quests.forge.reminderBeforeDue") }, { key: "custom", label: tr("quests.forge.reminderCustom") }].map(r => (
                              <button key={r.key} type="button" onClick={() => setQReminderPreset(r.key)} style={{ padding: "8px 5px", borderRadius: 8, fontSize: 8, fontWeight: 800, background: qReminderPreset === r.key ? `${theme.primary}18` : "rgba(255,255,255,0.025)", border: `1px solid ${qReminderPreset === r.key ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: qReminderPreset === r.key ? theme.primary : "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}>{r.label}</button>
                            ))}
                          </div>
                          {qReminderPreset === "custom" && (
                            <input type="datetime-local" value={qReminderAt} onChange={e => setQReminderAt(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.primary}44`, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, colorScheme: "dark", outline: "none", boxSizing: "border-box" }} />
                          )}
                        </div>

                        {/* HABIT SYNC */}
                        {(qType === "daily" || qType === "weekly") && can('habit_tracker') && (
                          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, background: qSyncHabit ? `${theme.primary}0c` : "rgba(255,255,255,0.02)", border: `1px solid ${qSyncHabit ? theme.primary + "33" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.2s", marginBottom: 14 }}>
                            <div onClick={() => setQSyncHabit(!qSyncHabit)} style={{
                              width: 22, height: 22, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                              background: qSyncHabit ? theme.primary + "22" : "transparent",
                              border: `2px solid ${qSyncHabit ? theme.primary : "#334155"}`,
                              color: theme.primary, fontSize: 13, transition: "all 0.2s"
                            }}>{qSyncHabit ? "✓" : ""}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: qSyncHabit ? theme.primary : "#e2e8f0" }}>{tr("quests.forge.habitLink")}</div>
                              <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{tr("quests.forge.habitLinkDesc")}</div>
                            </div>
                          </label>
                        )}

                        {/* XP PREVIEW */}
                        {qTitle.trim() && (() => {
                          const previewDiff = catalogDifficulties.find(d => d.key === qDiff);
                          const previewType = QUEST_TYPES_CONFIG[qType] || QUEST_TYPES_CONFIG.side;
                          const previewXp = Math.round((previewDiff?.xp || 5) * (previewType.xpMult || 1));
                          const previewGold = Math.round((previewDiff?.gold || 5) * (previewType.goldMult || 1));
                          const subs = qSubQuests.filter(sq => sq.title.trim()).length;
                          return (
                            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.primary}15`, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{tr("quests.forge.reward")}</div>
                              <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                                <span style={{ color: "#a78bfa" }}>+{subs > 0 ? Math.round(previewXp * 1.2) : previewXp} XP</span>
                                <span style={{ color: "#fbbf24" }}>+{previewGold} G</span>
                                {subs > 0 && <span style={{ color: theme.primary, fontSize: 9 }}>{tr("quests.forge.stagesShort", { count: subs })}</span>}
                              </div>
                            </div>
                          );
                        })()}

                      </>
                    )}
                  </div>

                  {!showTemplates && (
                    <div style={{ padding: "14px 24px 20px", flexShrink: 0, borderTop: `1px solid ${theme.primary}1a` }}>
                      <button data-tutorial="quest-submit-btn" onClick={() => {
                        if (!editingQuestId && !requireQuestSlot(null, { bypassDailyLimit: tutorialBypassesQuestLimit })) return;
                        if (qType === "chained") addChainedQuest(qTitle, qCat, qDiff, { bypassDailyLimit: tutorialBypassesQuestLimit });
                        else createQuest(null, { bypassDailyLimit: tutorialBypassesQuestLimit });
                        setForgeTab("create");
                      }} disabled={!qTitle.trim()} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 14, fontWeight: 900, background: qTitle.trim() ? `linear-gradient(135deg,${theme.primary},${theme.secondary})` : 'rgba(10,10,24,0.6)', color: qTitle.trim() ? "#fff" : "#334155", letterSpacing: 3, fontFamily: "'Cinzel',serif", boxShadow: qTitle.trim() ? `0 6px 30px ${theme.glow}, inset 0 2px 0 rgba(255,255,255,0.3)` : "inset 0 2px 4px rgba(0,0,0,0.5)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: qTitle.trim() ? "pointer" : "not-allowed", border: qTitle.trim() ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => { if (qTitle.trim()) { e.currentTarget.style.transform = "translateY(-3px) scale(1.01)"; e.currentTarget.style.boxShadow = `0 12px 40px ${theme.glow}, inset 0 2px 0 rgba(255,255,255,0.4)`; } }}
                        onMouseLeave={e => { if (qTitle.trim()) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 6px 30px ${theme.glow}, inset 0 2px 0 rgba(255,255,255,0.3)`; } }}
                      >{qTitle.trim() ? (editingQuestId ? `✦ ${tr("quests.forge.submitSave")} ✦` : `✦ ${tr("quests.forge.submitAccept")} ✦`) : tr("quests.forge.submitNeedTitle")}</button>
                    </div>
                  )}

                </div>
              </div>
            )
          }


          {/* REWARDED AD MODAL */}
          {showAdModal && (
            <React.Suspense fallback={null}>
              <RewardedAdModal
                theme={theme}
                onComplete={() => {
                  const result = watchRewardedAd();
                  return result;
                }}
                onClose={() => setShowAdModal(false)}
              />
            </React.Suspense>
          )}

          <PremiumAccessModal
            open={showPremiumModal}
            onClose={() => setShowPremiumModal(false)}
            state={state}
            theme={theme}
            activatePremiumCode={activatePremiumCode}
            notify={notify}
            contextFeature={premiumModalFeature}
          />

          {/* DAWN / DUSK PROTOCOL — rendered above as overlay (line ~451), this duplicate is intentionally removed */}

          {/* AI COACH WIDGET — floating bottom-right, unlocked at Level 8
        {can('ai_coach') && state?.ai?.enabled && state?.ai?.coachEnabled && (
          <AIChatWidget geminiAI={geminiAI} state={state} theme={theme} />
        )}
        */}
        </div >
      </ScreenShake>
    </TutorialProvider>
  );
}

// ─ SETUP ─
function SetupScreen({ onFinish, theme }) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState(0);
  useEffect(() => { const t1 = setTimeout(() => setPhase(1), 600); const t2 = setTimeout(() => setPhase(2), 1400); const t3 = setTimeout(() => setPhase(3), 2200); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#060610", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes glow{0%,100%{text-shadow:0 0 20px #7c3aed88}50%{text-shadow:0 0 40px #7c3aed,0 0 80px #a78bfa}}@keyframes bGlow{0%,100%{border-color:#4f6ef744}50%{border-color:#4f6ef788}}@keyframes bossGlow{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}@keyframes successPulse{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}button{cursor:pointer;border:none;font-family:inherit}input{font-family:inherit}`}</style>
      <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
        <div style={{ marginBottom: 20, animation: "float 3s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(124,58,237,0.6))" }}>
          <img src={SYSTEM_ICONS.logo} alt="Arise Logo" style={{ width: 140, height: 140, objectFit: "contain", mixBlendMode: "screen" }} />
        </div>
        {phase >= 1 && <div style={{ animation: "fadeIn 0.8s ease", fontSize: 9, letterSpacing: 6, color: "#7c3aed", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>SYSTEM ACTIVATED</div>}
        {phase >= 2 && <div style={{ animation: "slideUp 0.6s ease" }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 6, marginBottom: 8, lineHeight: 1, animation: "glow 3s ease-in-out infinite" }}>ARISE</h1>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, fontFamily: "'Outfit',sans-serif" }}>Ein neuer Hunter wurde erkannt.<br />Identifiziere dich.</p>
        </div>}
        {phase >= 3 && <div style={{ animation: "slideUp 0.6s ease", marginTop: 32 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Hunter Name..." autoFocus
            style={{ width: "100%", padding: "16px 20px", borderRadius: 14, fontSize: 16, textAlign: "center", background: "rgba(15,15,30,0.8)", border: "1.5px solid #4f6ef733", color: "#e2e8f0", outline: "none", fontFamily: "'Cinzel',serif", letterSpacing: 3, animation: "bGlow 3s infinite" }}
            onFocus={e => e.target.style.borderColor = "#4f6ef7"} onBlur={e => e.target.style.borderColor = "#4f6ef733"} onKeyDown={e => e.key === "Enter" && name.trim() && onFinish(name.trim())} />
          <button onClick={() => onFinish(name.trim() || "Hunter")} style={{ width: "100%", padding: 16, borderRadius: 14, fontSize: 14, fontWeight: 900, marginTop: 14, background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: "#fff", letterSpacing: 4, fontFamily: "'Cinzel',serif", boxShadow: "0 4px 32px rgba(79,110,247,0.4),0 0 60px rgba(124,58,237,0.2)" }}>BEGIN HUNT</button>
        </div>}
      </div>
    </div>
  );
}




