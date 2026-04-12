import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { JOBS } from "./data/jobs";
import { JOB_QUESTS } from "./data/jobQuests";
import { QUEST_POOL } from "./data/questPool";
import StoryView, { STORY_ARCS } from "./StoryView.jsx";
import { db, auth } from "./firebase";
import MultiplayerMode from "./MultiplayerMode.jsx";
import DoubleDungeonTutorial from "./components/DoubleDungeonTutorial.jsx";
import HabitTracker from "./components/HabitTracker.jsx";
import MicroHabits from "./components/MicroHabits.jsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import { runCoachChecks } from "./components/SystemCoach.jsx";
import { NotificationBanner } from "./components/NotificationManager.jsx";
import GoalFramework from "./components/GoalFramework.jsx";
import CalendarSchedule from "./components/CalendarSchedule.jsx";
import FocusMode from "./components/FocusMode.jsx";
import ChallengesSystem from "./components/ChallengesSystem.jsx";
import SettingsView from "./components/SettingsView.jsx";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import DungeonGatesPage from "./pages/DungeonGatesPage.jsx";
import LifeDomainsOnboarding from "./components/LifeDomainsOnboarding.jsx";
import InnerSanctum from "./components/InnerSanctum.jsx";
import { HUNTER_CODEX } from "./data/hunterCodex.js";
import ShadowRegressionCinematic from "./components/ShadowRegressionCinematic.jsx";
import SoulLinkView from "./components/SoulLinkView.jsx";
import SeasonView from "./components/SeasonView.jsx";
import DawnDuskProtocol from "./components/DawnDuskProtocol.jsx";
import CharismaDungeonsView from "./components/CharismaDungeonsView.jsx";
import { SEASONS, WORLD_EVENTS } from "./data/seasons.js";
import PageTransition from "./components/PageTransition.jsx";
import { NAV_ICONS, STAT_ICONS, GATE_ICONS, QUEST_ICONS, SEASON_ICONS, SHADOW_ICONS, STORY_ICONS, HABIT_ICONS, SKILL_ICONS, ITEM_ICONS, CHA_ICONS, SYSTEM_ICONS, SHOP_ICONS, BOSS_ICONS, GEM_ICONS } from "./data/icons.js";
import GameIcon from "./components/GameIcon.jsx";
import GemShopView from "./components/GemShopView.jsx";
import RewardedAdModal from "./components/RewardedAdModal.jsx";
import GemBoosterBanner from "./components/GemBoosterBanner.jsx";
import DashboardView from "./components/views/DashboardView.jsx";
import { StatsView, ShadowArmyView } from "./components/views/StatsAndShadowViews.jsx";
import QuestCompletionCinematic from "./components/QuestCompletionCinematic.jsx";

// â”€â”€â”€ RANKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, GEM_SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, getJobBonuses, calculateLevelUp,
  CSS, ParticleField, MusicPlayer, SystemNotification, AchievementToast, XpFloat, LevelUpCinematic, AriseCinematic,
  ShadowCard, ShadowDetailModal, FormationEditor, StatRadar, QuestTimer, QuestTypeBadge,
  EmergencyQuestCard, ChainedQuestProgress, QuestCard, DungeonGate, FloorProgressBar, BossPhaseUI, DungeonBattle,
  JobCard, JobsView, JobLevelUpCinematic, AbilityActivationCinematic, SystemCLI
} from './data/constants';
import { useGameState } from './hooks/useGameState.jsx';
import { useFeatureUnlocks } from './hooks/useFeatureUnlocks.js';
import { getNextUnlockLevel, getUnlocksAtLevel } from './data/featureUnlocks.js';
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
    notify,
    persist,
    triggerSystemMessage,
    removeNotif,
    processAchievements,
    computeXpGain,
    completeQuest,
    deleteQuest,
    createQuest,
    completeEmergencyQuest,
    addChainedQuest,
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
    // Gem system
    watchRewardedAd,
    buyGemItem,
    claimDailyGemBonus,
    getActiveGemBoosters,
    getGemBoosterMultipliers,
  } = gameState;
  const [showSoulLink, setShowSoulLink] = React.useState(false);
  const [showSeasonView, setShowSeasonView] = React.useState(false);
  const [showCharismaView, setShowCharismaView] = React.useState(false);
  const [showAdModal, setShowAdModal] = React.useState(false);
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

  // â”€â”€ Page Transition State â”€â”€
  const [isPageTransitioning, setIsPageTransitioning] = React.useState(false);
  const [transitionTargetView, setTransitionTargetView] = React.useState(null);
  const VIEW_LABELS = useMemo(() => ({
    dashboard: "HEUTE", stats: "HUNTER STATS", shadows: "SHADOW ARMY",
    dungeon: "DUNGEON GATES", story: "STORY", equipment: "ARSENAL",
    shop: "HUNTER SHOP", jobs: "HUNTER JOBS", achievements: "ACHIEVEMENTS",
    analytics: "ANALYTICS", training: "TRAINING", system: "SYSTEM",
    goals: "ZIELE", calendar: "KALENDER", challenges: "EVENTS",
    settings: "EINSTELLUNGEN", sanctum: "INNER SANCTUM",
  }), []);
  const navigateTo = useCallback((newView) => {
    if (newView === view || isPageTransitioning) return;
    setTransitionTargetView(newView);
    setIsPageTransitioning(true);
  }, [view, isPageTransitioning]);
  const onTransitionMid = useCallback(() => {
    if (transitionTargetView) setView(transitionTargetView);
  }, [transitionTargetView]);
  const onTransitionEnd = useCallback(() => {
    setIsPageTransitioning(false);
    setTransitionTargetView(null);
  }, []);

  // â”€â”€ Progressive Feature Unlock System â”€â”€
  const { can, nextLevel } = useFeatureUnlocks(state?.level || 1);

  // â”€â”€ View Guard: Reset to dashboard if current view is locked â”€â”€
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
    localStorage.setItem("sl_dashboard_stats_hidden", JSON.stringify(showDashboardStats));
  }, [showDashboardStats]);



  // â”€â”€ Adaptive System Coach: periodic intervention checks â”€â”€
  const prevStateRef = useRef(null);
  useEffect(() => {
    if (!state || loading) return;
    const checkCoach = () => {
      const messages = runCoachChecks(state, prevStateRef.current);
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
  }, [state?.streak, state?.lastActiveDate, (state?.habits || []).length, loading]);

  // Tutorial gate: show tutorial for new users who haven't completed it
  if (!loading && state) {
    console.log("System: Tutorial-Check:", {
      completed: !!state.tutorialCompleted,
      showSetup,
      hunter: state.hunterName
    });
  }
  if (!loading && state && !state.tutorialCompleted && !showSetup) {
    return (
      <DoubleDungeonTutorial
        hunterName={state.hunterName}
        onComplete={() => {
          console.log("System: Persisting tutorial completion...");
          persist({ ...state, tutorialCompleted: true });
        }}
      />
    );
  }

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810" }}><div style={{ textAlign: "center" }}><GameIcon src={NAV_ICONS.dashboard} fallback="âš”️" size={56} glow glowColor="rgba(79,110,247,0.5)" animate="float" /><div style={{ marginTop: 12, fontSize: 12, letterSpacing: 4, color: "#4f6ef7", fontFamily: "'JetBrains Mono',monospace" }}>LOADING</div></div></div>;
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
      <MultiplayerMode
        playerState={state}
        onExitMP={exitPortal}
        onStateUpdate={gameState.persist}
      />
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
    <div style={{ minHeight: "100vh", background: penaltyActive ? `linear-gradient(180deg,${theme.bg},rgba(20,4,4,0.95))` : theme.bg, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden", animation: questCinematic && questCinematic.difficulty !== 'easy' ? `qcShake 400ms ease-out` : "none" }}>
      <style>{CSS(theme)}</style>
      {/* Cosmic ambient glow */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "120%", height: "50%", background: `radial-gradient(ellipse at 50% 0%,${theme.primary}12,transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "120%", height: "40%", background: `radial-gradient(ellipse at 50% 100%,${theme.secondary}0a,transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <ParticleField theme={theme} />
      <MusicPlayer play={isMusicPlaying} />
      {penaltyActive && <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", border: "2px solid #ef444422", animation: "penaltyPulse 2s infinite" }} />}
      {notifications.map(n => <SystemNotification key={n.id} message={n.msg} type={n.type} onDone={() => removeNotif(n.id)} />)}
      {achQueue.slice(0, 1).map(a => <AchievementToast key={a.id} achievement={a} onDone={() => setAchQueue(prev => prev.slice(1))} />)}
      {xpFloats.map(f => <XpFloat key={f.id} x={f.x} y={f.y} xp={f.xp} gold={f.gold} />)}
      {questCinematic && (
        <QuestCompletionCinematic
          data={questCinematic}
          onDone={() => setQuestCinematic(null)}
        />
      )}
      {levelUp && <LevelUpCinematic levelData={levelUp} rank={getRank(levelUp.level || levelUp)} oldRank={prevRank} onClose={() => setLevelUp(null)} />}
      {ariseTarget && <AriseCinematic shadow={ariseTarget} onClose={() => setAriseTarget(null)} />}
      {state._jobLevelUp && <JobLevelUpCinematic job={JOBS[state._jobLevelUp.job]} newLevel={state._jobLevelUp.newLevel} onClose={() => { const next = { ...state }; delete next._jobLevelUp; persist(next); }} />}
      {state._abilityActivated && <AbilityActivationCinematic ability={state._abilityActivated.ability} job={state._abilityActivated.job} onClose={() => { const next = { ...state }; delete next._abilityActivated; persist(next); }} />}
      {activeDungeon && (
        <div style={{ display: preview3DDungeon ? "none" : "block" }}>
          <DungeonBattle dungeon={activeDungeon} playerStats={state.stats} theme={theme} onResult={r => finishDungeon(activeDungeon, r)} onClose={() => setActiveDungeon(null)} skillBonuses={getSkillBonuses(null, state.stats)} modifier={modifier} formationBonus={formationBonus} state={state} persist={persist} notify={notify} onTrigger3D={() => setPreview3DDungeon(activeDungeon)} startAutomatically={battlePendingStart} onClearStartAuto={() => setBattlePendingStart(false)} />
        </div>
      )}
      {preview3DDungeon && (
        <DungeonGatesPage
          dungeon={preview3DDungeon}
          onEnterGate={(dungeon) => { setPreview3DDungeon(null); setActiveDungeon(dungeon); setBattlePendingStart(true); }}
          onClose={() => setPreview3DDungeon(null)}
        />
      )}
      {selectedShadow && <ShadowDetailModal shadow={selectedShadow} theme={theme} gold={state.gold} onClose={() => setSelectedShadow(null)} onDeploy={deployShadow} onUndeploy={undeployShadow} onEvolve={evolveShadow} />}
      {systemMessage && <SystemCLI message={systemMessage} onClose={() => setSystemMessage(null)} />}

      {/* SHADOW MONARCH'S GATE – PAGE TRANSITION */}
      <PageTransition
        isActive={isPageTransitioning}
        targetLabel={VIEW_LABELS[transitionTargetView] || (transitionTargetView || "").toUpperCase()}
        theme={theme}
        onMidpoint={onTransitionMid}
        onComplete={onTransitionEnd}
      />

      {/* FOCUS MODE */}
      {showFocusMode && <FocusMode state={state} persist={persist} notify={notify} onExit={() => setShowFocusMode(false)} theme={theme} />}

      {/* SHADOW REGRESSION CINEMATIC */}
      {showShadowRegression && state?.shadowRegression?.active && (
        <ShadowRegressionCinematic state={state} theme={theme} onClose={() => setShowShadowRegression(false)} />
      )}

      {/* DAWN/DUSK PROTOCOL */}
      {(showDawnDusk || state?.dawnDusk?.currentRun) && (
        <DawnDuskProtocol
          state={state} theme={theme}
          startDawnDuskRun={startDawnDuskRun}
          completeProtocolFloor={completeProtocolFloor}
          configureProtocolTasks={configureProtocolTasks}
          abandonProtocolRun={abandonProtocolRun}
          onClose={() => setShowDawnDusk(false)}
        />
      )}

      {/* SOUL LINK VIEW */}
      {showSoulLink && (
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
      {showSeasonView && (
        <SeasonView state={state} theme={theme} onClose={() => setShowSeasonView(false)} />
      )}

      {/* CHARISMA DUNGEONS VIEW */}
      {showCharismaView && (
        <CharismaDungeonsView
          state={state} theme={theme}
          startCharismaChain={startCharismaChain}
          onClose={() => setShowCharismaView(false)}
        />
      )}

      {/* HIDDEN QUEST DISCOVERY MODAL */}
      {showHiddenQuestModal && (
        <div onClick={() => setShowHiddenQuestModal(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(1,0,6,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.4s", cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}><GameIcon src={QUEST_ICONS.hidden} fallback="�“" size={56} glow glowColor="#6366f1" animate="float" /></div>
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
            <button onClick={() => setShowHiddenQuestModal(null)} style={{ width: "100%", padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#6366f122,#6366f110)", color: "#a5b4fc", border: "1px solid #6366f144", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>QUEST ANNEHMEN</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, padding: "12px 16px", background: `linear-gradient(180deg,${theme.bg}f5,${theme.bg}e8)`, borderBottom: `1px solid ${penaltyActive ? "#ef444422" : theme.primary + "12"}`, backdropFilter: "blur(24px)", opacity: isCreatingEntry ? 0 : 1, pointerEvents: isCreatingEntry ? "none" : "auto", transition: "opacity 0.2s ease" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>
          {/* TOP ROW: Rank + Name + Exit */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${rank.color}28,${rank.color}0a)`, border: `2px solid ${rank.color}66`, position: "relative", overflow: "hidden", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", animation: "hexPulse 3s infinite", flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: rank.color, fontFamily: "'Cinzel',serif", position: "relative", zIndex: 1, textShadow: `0 0 12px ${rank.color}88` }}>{rank.name}</span>
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: penaltyActive ? "#ef4444" : "#fff", fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.hunterName}</div>
                <div style={{ fontSize: 10, color: rank.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 1, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.selectedTitle || rank.label}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", padding: "6px 12px", fontWeight: 800, letterSpacing: 1, transition: "all 0.2s" }} title="System beenden" onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}>
              EXIT
            </button>
          </div>

          {/* BOTTOM ROW: Stats + Icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: theme.accent, fontFamily: "'JetBrains Mono',monospace" }}>{powerLevel.toLocaleString()}</div>
                <div style={{ fontSize: 7, color: "#475569", letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>PWR</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.1)", color: "#fbbf24", minWidth: 60 }}>
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 3 }}>
                  <img src="/icon/coin.png" style={{ width: 14, height: 14 }} alt="G" />{state.gold.toLocaleString()}
                </div>
              </div>
              {can('gem_shop') && (
                <button onClick={() => navigateTo("gem_shop")} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", color: "#c084fc", minWidth: 50, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f755"; e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.15)"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}>
                  <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 3 }}>
                    <img src={GEM_ICONS.gem} style={{ width: 14, height: 14, objectFit: "contain", filter: "drop-shadow(0 0 3px #a855f788)" }} alt="💎" />{(state.gems || 0).toLocaleString()}
                  </div>
                </button>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: state.streak >= 3 ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${state.streak >= 3 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.06)"}`, color: state.streak >= 5 ? "#f97316" : state.streak >= 3 ? "#fb923c" : "#94a3b8", minWidth: 40 }}>
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 2 }}>
                  <span style={{ animation: state.streak >= 3 ? "pulse 1.5s infinite" : "none", display: "inline-flex", alignItems: "center" }}><img src={STAT_ICONS.str} alt="Streak" style={{ width: 14, height: 14, objectFit: "contain", filter: "drop-shadow(0 0 4px #f9731688)" }} /></span>{state.streak}
                </div>
              </div>
              {/* Soul Link Pill */}
              {can('soul_link') && state.soulLink?.linkCode && (
                <button onClick={() => setShowSoulLink(true)} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
                  borderRadius: 8, background: state.soulLink.bothActive ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${state.soulLink.bothActive ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: state.soulLink.bothActive ? "#22d3ee" : "#6b7280",
                  cursor: "pointer", fontSize: 10, fontWeight: 700,
                  animation: state.soulLink.bothActive ? "pulse 2s infinite" : "none"
                }}>
                  <img src={SHADOW_ICONS.knight} alt="Link" style={{ width: 12, height: 12, objectFit: "contain", filter: "brightness(1.3)" }} /> {state.soulLink.partnerName ? state.soulLink.partnerName.slice(0, 6) : "–"}
                  {state.soulLink.partnerStreak > 0 && <span><img src={STAT_ICONS.str} alt="fire" style={{ width: 10, height: 10, objectFit: "contain" }} />{state.soulLink.partnerStreak}</span>}
                </button>
              )}
              {/* Season Indicator */}
              {can('seasons') && state.seasons?.currentSeason && (
                <button onClick={() => setShowSeasonView(true)} style={{
                  display: "flex", alignItems: "center", gap: 3, padding: "4px 8px",
                  borderRadius: 8, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#9ca3af", cursor: "pointer", fontSize: 12
                }} title={SEASONS[state.seasons.currentSeason]?.name}>
                  {SEASONS[state.seasons.currentSeason]?.iconSrc
                    ? <img src={SEASONS[state.seasons.currentSeason].iconSrc} alt={SEASONS[state.seasons.currentSeason].name} style={{ width: 18, height: 18, objectFit: "contain" }} />
                    : (SEASONS[state.seasons.currentSeason]?.icon || "📋")}
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {can('sanctum') && <button
                onClick={() => navigateTo("sanctum")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 8px",
                  height: 32, borderRadius: 10, background: "linear-gradient(135deg, rgba(34,211,153,0.1), rgba(34,211,153,0.02))",
                  border: "1px solid rgba(34,211,153,0.3)", color: "#34d399",
                  cursor: "pointer", fontSize: 10, fontWeight: 800, fontFamily: "'Cinzel',serif",
                  transition: "all 0.3s", letterSpacing: 1, boxShadow: "0 0 10px rgba(34,211,153,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(34,211,153,0.2)"; e.currentTarget.style.borderColor = "rgba(34,211,153,0.7)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,211,153,0.2), rgba(34,211,153,0.05))"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 10px rgba(34,211,153,0.05)"; e.currentTarget.style.borderColor = "rgba(34,211,153,0.3)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,211,153,0.1), rgba(34,211,153,0.02))"; }}
                title="Inner Sanctum Base"
              >
                <GameIcon src={NAV_ICONS.timer} fallback="⏰" size={16} glow glowColor="rgba(34,211,153,0.5)" /> <span className="hide-on-mobile">SANCTUM</span>
              </button>}
              {can('focus_mode') && <button
                onClick={() => setShowFocusMode(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 8px",
                  height: 32, borderRadius: 10, background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))",
                  border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc",
                  cursor: "pointer", fontSize: 10, fontWeight: 800, fontFamily: "'Cinzel',serif",
                  transition: "all 0.3s", letterSpacing: 1, boxShadow: "0 0 10px rgba(168,85,247,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(168,85,247,0.2)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.7)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 10px rgba(168,85,247,0.05)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))"; }}
                title="Focus Mode starten"
              >
                <GameIcon src={NAV_ICONS.timer} fallback="âš¡" size={16} glow glowColor="rgba(168,85,247,0.5)" /> <span className="hide-on-mobile">FOCUS</span>
              </button>}
              {can('dawn_dusk') && <button
                onClick={() => setShowDawnDusk(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 8px",
                  height: 32, borderRadius: 10,
                  background: state?.dawnDusk?.currentRun
                    ? "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.05))"
                    : "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))",
                  border: `1px solid ${state?.dawnDusk?.currentRun ? "rgba(251,191,36,0.7)" : "rgba(251,191,36,0.25)"}`,
                  color: state?.dawnDusk?.currentRun ? "#fbbf24" : "#78716c",
                  cursor: "pointer", fontSize: 10, fontWeight: 800, fontFamily: "'Cinzel',serif",
                  transition: "all 0.3s", letterSpacing: 1,
                  animation: state?.dawnDusk?.currentRun ? "pulse 2s infinite" : "none"
                }}
                title="Dawn/Dusk Protocol"
              >
                <span style={{ fontSize: 13 }}>
                  <img src={NAV_ICONS.timer} alt="Protocol" style={{ width: 14, height: 14, objectFit: "contain", filter: new Date().getHours() >= 5 && new Date().getHours() < 11 ? "drop-shadow(0 0 4px #fbbf2488) brightness(1.3)" : "drop-shadow(0 0 4px #6366f188)" }} />
                </span>
                <span className="hide-on-mobile">PROTOCOL</span>
              </button>}
              {can('music') && <button
                onClick={() => setIsMusicPlaying(prev => {
                  const next = !prev;
                  localStorage.setItem("soloMusicPlaying", next ? "true" : "false");
                  return next;
                })}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 10,
                  background: isMusicPlaying ? `${theme.primary}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isMusicPlaying ? theme.primary + "44" : "rgba(255,255,255,0.06)"}`,
                  color: isMusicPlaying ? theme.accent : "#475569",
                  cursor: "pointer", fontSize: 18, transition: "all 0.3s"
                }}
              >
                {isMusicPlaying ? "\u266B" : "\u266A"}
              </button>}

              {can('multiplayer') && <button
                onClick={enterPortal}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 10,
                  background: `linear-gradient(135deg, #f59e0b15, #f59e0b25)`,
                  border: `1px solid #f59e0b55`,
                  color: '#fcd34d', fontSize: 18, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: `0 0 10px rgba(245,158,11,0.1)`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#f59e0b55'; }}
                title="Hunter Association"
              >
                <GameIcon src={NAV_ICONS.guild} fallback="🚪" size={20} glow glowColor="rgba(245,158,11,0.5)" />
              </button>}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ position: "relative", zIndex: 1, padding: "16px", maxWidth: 480, margin: "0 auto", paddingBottom: 92 }}>

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
                <img src="/icons/skill_attack.png" alt="combat" style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 0 4px #ef444488)" }} />
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
              <span style={{ color: "#475569" }}>Abschluss â†’</span> <img src={STAT_ICONS.str} alt="fire" style={{ width: 12, height: 12, objectFit: "contain", verticalAlign: "middle" }} />{Math.floor((state.shadowRegression.previousStreak || 0) * 0.5)} Tage Streak wiederhergestellt
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
              onClick={() => setShowSeasonView(true)}
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
                    {worldEvent.iconSrc ? <img src={worldEvent.iconSrc} alt={worldEvent.name} style={{ width: 12, height: 12, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} /> : worldEvent.icon} {worldEvent.name}: {worldEvent.desc.split(" ").slice(0, 5).join(" ")}–
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

        <NotificationBanner state={state} theme={theme} />

        {/* â•â•â• DASHBOARD â•â•â• */}
        {view === "dashboard" && (
          <DashboardView
            state={state} theme={theme} can={can}
            showDashboardStats={showDashboardStats} setShowDashboardStats={setShowDashboardStats}
            streakBonus={streakBonus} formationBonus={formationBonus} equipBonuses={equipBonuses}
            xpPercent={xpPercent} xpNeeded={xpNeeded}
            filteredQuests={filteredQuests} hiddenQuestCount={hiddenQuestCount}
            questFilter={questFilter} setQuestFilter={setQuestFilter}
            completeQuest={completeQuest} startEditingQuest={startEditingQuest} deleteQuest={deleteQuest}
            completeEmergencyQuest={completeEmergencyQuest}
            setShowCreate={setShowCreate}
            nextLevel={nextLevel} getUnlocksAtLevel={getUnlocksAtLevel}
            notify={notify} persist={persist}
            setIsCreatingEntry={setIsCreatingEntry}
            getActiveGemBoosters={getActiveGemBoosters}
          />
        )}

        {/* â•â•â• DUNGEONS â•â•â• */}
        {
          view === "dungeon" && (
            <div style={{ animation: "fadeIn 0.35s ease" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>DUNGEON GATES</div>
                <div style={{ fontSize: 12, color: "#334155", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 5 }}>
                  Reset in {hoursUntilMidnight()}h · {modifier?.id !== "none" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{modifier?.iconSrc ? <img src={modifier.iconSrc} alt={modifier.name} style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle" }} /> : modifier?.icon} {modifier?.name}</span> : "Stable Gates"}
                </div>
              </div>
              {activeDungeons.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}><div style={{ marginBottom: 10 }}><GameIcon src={GATE_ICONS.normal} fallback="🚪" size={48} glow glowColor={theme.primary} animate="float" /></div><div style={{ fontSize: 14, color: "#475569" }}>Keine aktiven Gates</div><div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Kommen morgen wieder zurück</div></div>}
              {activeDungeons.map((d, i) => <div key={d.instanceId} style={{ marginBottom: 10, animation: `slideUp 0.35s ease ${i * 0.1}s both` }}><DungeonGate dungeon={d} playerStats={{ ...state.stats, ...Object.fromEntries(CATEGORIES.map(c => [c.key, (state.stats[c.key] || 0) + (equipBonuses[c.key + "Bonus"] || 0)])) }} theme={theme} onEnter={setActiveDungeon} modifier={modifier} /></div>)}
              {(state.dungeons || []).filter(d => d.cleared).length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HEUTE ABSOLVIERT</div>
                  {(state.dungeons || []).filter(d => d.cleared).map((d, i) => <div key={d.instanceId} style={{ marginBottom: 8, opacity: 0.4 }}><DungeonGate dungeon={d} playerStats={state.stats} theme={theme} onEnter={() => { }} modifier={modifier} /></div>)}
                </div>
              )}
            </div>
          )
        }

        {/* â•â•â• STATS â•â•â• */}
        {
          view === "stats" && (
            <StatsView
              state={state} theme={theme}
              equipBonuses={equipBonuses} powerLevel={powerLevel}
              increaseStat={increaseStat}
            />
        )}

        {/* â•â•â• SHADOW ARMY â•â•â• */}
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
        {/* â•â•â• STORY â•â•â• */}
        {
          view === "story" && state && (
            <StoryView
              gameState={state}
              theme={theme}
              onChapterComplete={(chapter) => {
                const prev = state;
                const completedChapters = [...(prev.story?.completedChapters || [])];

                // Abuse Protection: Only give XP and Gold if chapter isn't already completed
                if (!completedChapters.includes(chapter.id)) {
                  completedChapters.push(chapter.id);

                  // XP und Gold vergeben
                  const xpGain = chapter.rewards?.xp || 0;
                  const goldGain = chapter.rewards?.gold || 0;
                  let next = calculateLevelUp(prev, xpGain);

                  // Titel vergeben falls vorhanden
                  let newTitle = next.selectedTitle;
                  if (chapter.rewards?.title) {
                    newTitle = chapter.rewards.title;
                  }

                  notify(`Kapitel "${chapter.title}" abgeschlossen! +${xpGain} XP`, "levelup");

                  persist({
                    ...next,
                    gold: (prev.gold || 0) + goldGain,
                    totalGoldEarned: (prev.totalGoldEarned || 0) + goldGain,
                    selectedTitle: newTitle,
                    story: {
                      ...prev.story,
                      completedChapters,
                      totalStoryXp: (prev.story?.totalStoryXp || 0) + xpGain,
                    },
                  });
                } else {
                  notify(`Du hast dieses Kapitel bereits abgeschlossen.`, "info");
                }
              }}
              onBossComplete={(boss, arcId) => {
                const prev = state;
                const defeatedBosses = [...(prev.story?.defeatedBosses || [])];
                if (defeatedBosses.includes(arcId)) {
                  notify("Dieser Boss wurde bereits besiegt.", "info");
                  return;
                }
                defeatedBosses.push(arcId);
                const xpGain = boss.rewards?.xp || 0;
                const goldGain = boss.rewards?.gold || 0;
                let next = calculateLevelUp(prev, xpGain);
                if (boss.rewards?.title) next.selectedTitle = boss.rewards.title;
                notify(`Boss "${boss.name}" besiegt! +${xpGain} XP +${goldGain} Gold`, "levelup");
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
              }}
            />
          )
        }

        {/* â•â•â• JOBS â•â•â• */}
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

        {/* â•â•â• EQUIPMENT â•â•â• */}
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
                      : <button onClick={() => equipItem(item, item.slot === "ring" ? "ring1" : item.slot)} style={{ fontSize: 10, padding: "6px 14px", borderRadius: 8, background: `linear-gradient(135deg,${rc}18,transparent)`, color: rc, border: `1px solid ${rc}33`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>EQUIP</button>}
                  </div>
                );
              })}
            </div>
          )
        }

        {/* â•â•â• ACHIEVEMENTS â•â•â• */}
        {
          view === "achievements" && (
            <div style={{ animation: "fadeIn 0.35s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>ACHIEVEMENTS</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{achUnlocked.length}/{ACHIEVEMENTS.length} freigeschaltet</div>
                </div>
                <div style={{ padding: "8px 14px", borderRadius: 10, background: "#f59e0b12", border: "1px solid #f59e0b22", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#92400e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>PUNKTE</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", fontFamily: "'Cinzel',serif" }}>{achUnlocked.reduce((sum, id) => { const a = ACHIEVEMENTS.find(ac => ac.id === id); return sum + (a?.reward?.xp || 0); }, 0)}</div>
                </div>
              </div>
              <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ width: `${(achUnlocked.length / ACHIEVEMENTS.length) * 100}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#f59e0b88,#f59e0b)", transition: "width 0.8s ease" }} />
              </div>
              {["quests", "dungeons", "story", "streaks", "stats", "shadows", "misc", "habits"].map(cat => {
                const catAchs = ACHIEVEMENTS.filter(a => a.cat === cat);
                if (catAchs.length === 0) return null;
                const catMeta = {
                  quests:   { label: "Quests",    icon: QUEST_ICONS.daily },
                  dungeons: { label: "Dungeons",  icon: GATE_ICONS.normal },
                  story:    { label: "Story",     icon: STORY_ICONS.scroll },
                  streaks:  { label: "Streaks",   icon: NAV_ICONS.timer },
                  stats:    { label: "Stats",     icon: NAV_ICONS.analytics },
                  shadows:  { label: "Army",      icon: SHADOW_ICONS.soldier },
                  misc:     { label: "Sonstiges", icon: NAV_ICONS.achievements },
                  habits:   { label: "Habits",    icon: HABIT_ICONS.fitness },
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
                          {unlocked ? <div style={{ fontSize: 12, color: "#f59e0b" }}>✏“</div> : <div style={{ textAlign: "right", fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}><div>+{ach.reward.xp} XP</div><div>{ach.reward.gold > 0 ? `+${ach.reward.gold}G` : ""}</div></div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )
        }

        {/* â•â•â• SHOP â•â•â• */}
        {
          view === "shop" && (
            <div style={{ animation: "fadeIn 0.35s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>SYSTEM SHOP</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>Kaufe Titel und Themes</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "#fbbf2412", border: "1px solid #fbbf2422" }}>
                  <img src="/icon/coin.png" style={{ width: 18, height: 18 }} alt="G" />
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>{state.gold.toLocaleString()}</span>
                </div>
              </div>
              {!shopUnlocked && <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid #ef444422", borderRadius: 14, padding: "16px", marginBottom: 16, textAlign: "center", fontSize: 12, color: "#ef4444" }}>Shop ab D-Rang verfügbar</div>}
              {["consumable", "title", "theme"].map(type => (
                <div key={type} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>{type === "title" ? "TITEL" : type === "theme" ? "THEMES" : "VERBRAUCHSGÜTER"}</div>
                  {SHOP_ITEMS.filter(i => i.type === type).map((item, idx) => {
                    const owned = state.shopPurchases.includes(item.id);
                    const canAfford = state.gold >= item.cost;
                    const rankOk = getRankIndex(rank.name) >= getRankIndex(item.minRank);
                    const isActive = (item.type === "theme" && state.selectedTheme === item.themeKey) || (item.type === "title" && state.selectedTitle === item.name);
                    return (
                      <div key={item.id} style={{ background: isActive ? `linear-gradient(135deg,${theme.primary}15,transparent)` : theme.card, border: `1px solid ${isActive ? theme.primary + "44" : theme.primary + "12"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${idx * 0.07}s both` }}>
                        {item.iconSrc && <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: isActive ? theme.primary + "18" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? theme.primary + "33" : "rgba(255,255,255,0.06)"}` }}><img src={item.iconSrc} alt={item.name} style={{ width: 22, height: 22, objectFit: "contain", filter: `drop-shadow(0 0 4px ${isActive ? theme.primary + "88" : "#33415588"})` }} /></div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? theme.accent : "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{item.name}</div>
                            {isActive && <div style={{ fontSize: 8, color: theme.accent, padding: "1px 5px", borderRadius: 3, background: theme.primary + "22", fontFamily: "'JetBrains Mono',monospace" }}>AKTIV</div>}
                          </div>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{item.desc}</div>
                          <div style={{ fontSize: 9, color: "#334155", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>Ab {item.minRank}-Rang</div>
                        </div>
                        {owned ? (
                          <button onClick={() => { if (item.type === "theme") persist({ ...state, selectedTheme: item.themeKey }); else persist({ ...state, selectedTitle: item.name }); }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: isActive ? theme.primary + "22" : "transparent", color: isActive ? theme.accent : "#475569", border: `1px solid ${isActive ? theme.primary + "44" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{isActive ? "AKTIV" : "NUTZEN"}</button>
                        ) : (
                          <button onClick={() => buyItem(item)} disabled={!canAfford || !rankOk || !shopUnlocked} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: canAfford && rankOk && shopUnlocked ? `linear-gradient(135deg,#fbbf2422,#fbbf2408)` : "transparent", color: canAfford && rankOk && shopUnlocked ? "#fbbf24" : "#334155", border: `1px solid ${canAfford && rankOk && shopUnlocked ? "#fbbf2444" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, cursor: canAfford && rankOk && shopUnlocked ? "pointer" : "not-allowed" }}>
                            {item.cost}G
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* HUNTER'S CODEX */}
              {shopUnlocked && can('codex') && (
                <div style={{ marginTop: 32, padding: "20px", borderRadius: 16, background: "linear-gradient(135deg,rgba(168,85,247,0.05),rgba(124,58,237,0.1))", border: "1px solid #7c3aed44" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#a855f7", fontFamily: "'Cinzel',serif" }}>HUNTER'S CODEX</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>VERLORENE WEISHEITEN</div>
                    </div>
                    <div style={{ animation: "float 3s ease-in-out infinite" }}><img src={STORY_ICONS.scroll} alt="Codex" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #a855f788)" }} /></div>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 20, lineHeight: 1.5 }}>
                    Entschlüssele Fragmente antiker Einsicht. Verleiht permanente Weisheit und einen massiven Gold-/XP-Schub.
                  </div>

                  {/* Available to Buy */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 24 }}>
                    {HUNTER_CODEX.filter(c => !(state.codex || []).includes(c.id)).slice(0, 4).map((item) => {
                      const canAfford = state.gold >= item.cost;
                      const rqLv = item.tier === 1 ? 5 : item.tier === 2 ? 15 : 30;
                      const myStat = (state.stats[item.stat] || 0);
                      const rankOk = myStat >= rqLv;

                      return (
                        <div key={item.id} style={{ background: theme.card, border: "1px solid #7c3aed44", borderRadius: 12, padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#c084fc", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Unbekanntes Fragment {item.id.replace(/codex_|_gen_/g, "")}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>
                              <span style={{ color: "#94a3b8" }}>{item.stat.toUpperCase()}-Pfad</span>
                              <span style={{ color: rankOk ? "#22c55e" : "#ef4444" }}>Braucht {rqLv} {item.stat.toUpperCase()}</span>
                            </div>
                          </div>
                          <button onClick={() => {
                            const newQuest = {
                              id: genId(), title: `Codex meistern: ${item.rule}`,
                              category: item.stat, difficulty: item.tier === 1 ? "easy" : item.tier === 2 ? "normal" : "hard",
                              type: "side", isCodexQuest: true, codexId: item.id, rewardStat: item.stat, createdAt: getToday(), createdAtMs: Date.now()
                            };
                            const nextState = {
                              ...state,
                              gold: state.gold - item.cost,
                              codex: [...(state.codex || []), item.id],
                              quests: [...state.quests, newQuest]
                            };
                            persist(nextState);
                            notify(`Codex gekauft! Schlie\u00dfe die neue Quest ab, um die Weisheit zu meistern.`, "success");
                          }}
                            disabled={!canAfford || !rankOk}
                            style={{ padding: "8px 14px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: (canAfford && rankOk) ? "linear-gradient(135deg,#a855f722,#a855f70a)" : "transparent", color: (canAfford && rankOk) ? "#a855f7" : "#475569", border: `1px solid ${(canAfford && rankOk) ? "#a855f766" : "#1e2940"}`, cursor: (canAfford && rankOk) ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                            {item.cost}G
                          </button>
                        </div>
                      );
                    })}
                    {HUNTER_CODEX.filter(c => !(state.codex || []).includes(c.id)).length === 0 && (
                      <div style={{ fontSize: 11, color: "#a855f7", textAlign: "center", padding: "12px", border: "1px dashed #a855f744", borderRadius: 10 }}>Alle verfügbaren Fragmente des Codex entschlüsselt.</div>
                    )}
                  </div>

                  {/* Unlocked */}
                  {state.codex && state.codex.length > 0 && (
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: "#7c3aed", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, paddingTop: 16, borderTop: "1px solid #7c3aed33" }}>DEIN CODEX ({state.codex.length}/{HUNTER_CODEX.length})</div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {state.codex.map(id => {
                          const item = HUNTER_CODEX.find(c => c.id === id);
                          if (!item) return null;
                          const isMastered = (state.codexMastered || []).includes(item.id);
                          return (
                            <div key={id} style={{ padding: "12px", borderRadius: 10, background: isMastered ? "rgba(34,197,94,0.06)" : "rgba(124,58,237,0.06)", borderLeft: `3px solid ${isMastered ? "#22c55e" : "#7c3aed"}` }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isMastered ? "#86efac" : "#e2e8f0", marginBottom: 4, fontFamily: "'Cinzel',serif" }}>{item.rule}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{item.desc}</div>
                              {isMastered ? (
                                <div style={{ fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><img src={STAT_ICONS[item.stat]} alt={item.stat} style={{ width: 10, height: 10, objectFit: "contain" }} /> GEMEISTERT (+1 {item.stat.toUpperCase()})</div>
                              ) : (
                                <div style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><img src={QUEST_ICONS.daily} alt="active" style={{ width: 10, height: 10, objectFit: "contain" }} /> Quest aktiv...</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }

        {/* â•â•â• GEM SHOP â•â•â• */}
        {
          view === "gem_shop" && (
            <div style={{ animation: "fadeIn 0.35s ease" }}>
              <GemShopView
                state={state}
                theme={theme}
                buyGemItem={buyGemItem}
                watchRewardedAd={watchRewardedAd}
                claimDailyGemBonus={claimDailyGemBonus}
                getActiveGemBoosters={getActiveGemBoosters}
                GEM_SHOP_ITEMS={GEM_SHOP_ITEMS}
                onWatchAd={() => setShowAdModal(true)}
                notify={notify}
              />
            </div>
          )
        }

        {/* â•â•â• ANALYTICS â•â•â• */}
        {
          view === "analytics" && (
            <AnalyticsDashboard state={state} theme={theme} />
          )
        }

        {/* â•â•â• GOALS â•â•â• */}
        {
          view === "goals" && (
            <GoalFramework state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} onOpenQuestCreate={() => setShowCreate(true)} />
          )
        }

        {/* â•â•â• CALENDAR â•â•â• */}
        {
          view === "calendar" && (
            <CalendarSchedule state={state} persist={persist} notify={notify} theme={theme} />
          )
        }

        {/* â•â•â• CHALLENGES â•â•â• */}
        {
          view === "challenges" && (
            <ChallengesSystem state={state} persist={persist} notify={notify} theme={theme} />
          )
        }

        {/* â•â•â• SETTINGS â•â•â• */}
        {
          view === "settings" && (
            <SettingsView state={state} persist={persist} theme={theme} />
          )
        }
      </main >

      {/* BOTTOM NAV */}
      < nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: `linear-gradient(to top, rgba(6,6,16,0.98), rgba(10,10,26,0.85))`, borderTop: `1px solid ${penaltyActive ? "#ef444455" : theme.primary + "44"}`, backdropFilter: "blur(24px)", boxShadow: `0 -4px 32px ${theme.glow}`, opacity: isCreatingEntry ? 0 : 1, pointerEvents: isCreatingEntry ? "none" : "auto", transition: "opacity 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", maxWidth: 540, margin: "0 auto", padding: "0 4px" }}>
          {[
            { key: "dashboard", iconSrc: NAV_ICONS.dashboard, icon: "📋", label: "Heute" },
            ...(can('training_tab') ? [{ key: "training", iconSrc: NAV_ICONS.goals, icon: "📋", label: "Ziele" }] : []),
            ...(can('dungeons') ? [{ key: "dungeon", icon: <img src="/icons/gate_normal.png" alt="Gate" style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 0 8px #a78bfa88) brightness(1.3)" }} />, label: "Gates", badge: activeDungeons.length }] : []),
            ...(can('story') ? [{ key: "story", iconSrc: STORY_ICONS.scroll, icon: "📋", label: "Story" }] : []),
            { key: "system", iconSrc: NAV_ICONS.settings, icon: "âš™️", label: "System" }
          ].map(tab => (
            <button key={tab.key} onClick={() => {
              setShowSeasonView(false); setShowSoulLink(false); setShowCharismaView(false); setShowDawnDusk(false);
              tab.isOverlay ? tab.action?.() : navigateTo(tab.key);
            }} style={{ flex: 1, padding: "12px 0 10px", background: "transparent", color: tab.isOverlay ? "#9ca3af" : view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view)) ? theme.accent : "#475569", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", transition: "all 0.3s" }}>
              {(view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view))) && <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 3, background: `linear-gradient(90deg,transparent,${theme.accent},transparent)`, borderRadius: "0 0 4px 4px", boxShadow: `0 2px 12px ${theme.accent}, 0 0 20px ${theme.glow}` }} />}
              <div style={{ position: "relative" }}>
                {tab.iconSrc ? (
                  <img src={tab.iconSrc} alt={tab.label} style={{
                    width: 26, height: 26,
                    objectFit: "contain",
                    display: "block",
                    transition: "all 0.3s",
                    transform: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view))) ? "scale(1.18) translateY(-2px)" : "scale(1)",
                    filter: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view)))
                      ? `brightness(1.35) drop-shadow(0 0 8px ${theme.glow}) saturate(1.3)`
                      : "brightness(0.55) saturate(0.4)",
                  }} />
                ) : (
                  <span style={{ fontSize: 18, transition: "all 0.3s", transform: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view))) ? "scale(1.2) translateY(-2px)" : "scale(1)", display: "block", filter: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view))) ? `drop-shadow(0 0 8px ${theme.glow})` : "grayscale(0.6)" }}>{tab.icon}</span>
                )}
                {tab.badge > 0 && <div style={{ position: "absolute", top: -6, right: -8, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#fff", fontFamily: "'JetBrains Mono',monospace", border: "2px solid #000", animation: "pulse 2s infinite" }}>{tab.badge}</div>}
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, fontFamily: "'Outfit',sans-serif", opacity: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "gem_shop", "analytics", "challenges", "settings", "more"].includes(view))) ? 1 : 0.6 }}>{tab.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </nav >

      {/* TRAINING HUB – unified view for habits/goals/calendar */}
      {
        view === "training" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: "16px", paddingTop: 140, paddingBottom: 110, overflowY: "auto" }}>
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
                <GoalFramework state={state} persist={persist} notify={notify} theme={theme} onModalOpen={() => setIsCreatingEntry(true)} onModalClose={() => setIsCreatingEntry(false)} onOpenQuestCreate={() => setShowCreate(true)} />
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
                <button onClick={() => setShowCreate(true)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.28)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(239,68,68,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                ><img src={SKILL_ICONS.attack} alt="Quest" style={{ width: 11, height: 11, objectFit: "contain", filter: "brightness(1.5)", verticalAlign: "middle", marginRight: 4 }} />QUEST</button>
                <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
              </div>

              {filteredQuests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}>
                  <div style={{ marginBottom: 10, animation: "float 3s ease-in-out infinite", display: "flex", justifyContent: "center" }}>
                    <img src="/icons/skill_attack.png" alt="no quests" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4, filter: "drop-shadow(0 0 10px rgba(100,116,139,0.4))" }} />
                  </div>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>Erstelle Quests auf dem Heute-Tab.</div>
                </div>
              ) : filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} />)}
            </div>
          </div>
        )
      }

      {/* SYSTEM MENU – themed module hub */}
      {
        view === "system" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: "16px", paddingTop: 140, paddingBottom: 110, overflowY: "auto" }}>
            <div style={{ maxWidth: 480, margin: "0 auto" }}>
              {/* System header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: 5, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, animation: "pulse 3s infinite" }}>&gt; SYSTEM INTERFACE ACTIVE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>System</div>
                <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`, margin: "10px auto 0" }} />
              </div>

              {/* HUNTER PROFILE SECTION */}
              {[{
                title: "HUNTER INTEL", iconSrc: NAV_ICONS.analytics, icon: "📋", color: theme.accent,
                items: [
                  { key: "stats", iconSrc: STAT_ICONS.str, icon: "📋", label: "Hunter Stats", desc: "Stats & Skills", badge: state.statPoints > 0 ? state.statPoints : 0 },
                  ...(can('analytics') ? [{ key: "analytics", iconSrc: NAV_ICONS.analytics, icon: "📋", label: "Analytics", desc: "Fortschritt & Trends" }] : [{ key: "analytics_locked", icon: "📋", label: "Analytics", locked: true, unlockLevel: 8 }]),
                  ...(can('achievements') ? [{ key: "achievements", iconSrc: NAV_ICONS.achievements, icon: "📋†", label: "Achievements", desc: `${achUnlocked.length}/${ACHIEVEMENTS.length} freigeschaltet`, badge: ACHIEVEMENTS.filter(a => !achUnlocked.includes(a.id) && a.check(state)).length }] : [{ key: "achievements_locked", iconSrc: NAV_ICONS.achievements, icon: "📋†", label: "Achievements", locked: true, unlockLevel: 8 }]),
                  ...(can('challenges') ? [{ key: "challenges", iconSrc: NAV_ICONS.events, icon: "📋–️", label: "Events", desc: "Challenges & Missionen" }] : [{ key: "challenges_locked", icon: "📋–️", label: "Events", locked: true, unlockLevel: 21 }]),
                ]
              }, {
                title: "ARSENAL", iconSrc: NAV_ICONS.shop, icon: "📋", color: "#f59e0b",
                items: [
                  ...(can('shadow_army') ? [{ key: "shadows", iconSrc: SHADOW_ICONS.soldier, icon: "📋‘", label: "Shadow Army", desc: "Erweckte Schatten", badge: namedShadows.length > 0 ? namedShadows.length : 0 }] : [{ key: "shadows_locked", iconSrc: SHADOW_ICONS.soldier, icon: "📋‘", label: "Shadow Army", locked: true, unlockLevel: 15 }]),
                  ...(can('equipment') ? [{ key: "equipment", iconSrc: ITEM_ICONS.blade, icon: "📋", label: "Equipment", desc: "Waffen & Rüstung", badge: (state.equipment?.inventory || []).length > 0 && !Object.values(state.equipment?.slots || {}).every(Boolean) ? 1 : 0 }] : [{ key: "equipment_locked", iconSrc: ITEM_ICONS.blade, icon: "📋", label: "Equipment", locked: true, unlockLevel: 11 }]),
                  ...(can('jobs') ? [{ key: "jobs", iconSrc: NAV_ICONS.jobs, icon: "📋", label: "Jobs", desc: "Hunter-Klassen" }] : [{ key: "jobs_locked", iconSrc: NAV_ICONS.jobs, icon: "📋", label: "Jobs", locked: true, unlockLevel: 21 }]),
                  ...(can('shop') ? [{ key: "shop", iconSrc: NAV_ICONS.shop, icon: "📋", label: "Shop", desc: `${state.gold.toLocaleString()} Gold` }] : [{ key: "shop_locked", icon: "📋", label: "Shop", locked: true, unlockLevel: 11 }]),
                  ...(can('gem_shop') ? [{ key: "gem_shop", iconSrc: GEM_ICONS.gem, icon: "📋", label: "Gem Shop", desc: `${(state.gems || 0).toLocaleString()} Gems` }] : [{ key: "gem_shop_locked", icon: "📋", label: "Gem Shop", locked: true, unlockLevel: 11 }]),
                ]
              }, {
                title: "SOCIAL & SPECIAL", iconSrc: NAV_ICONS.guild, icon: "📋", color: "#a855f7",
                items: [
                  ...(can('sanctum') ? [{ key: "sanctum", icon: "📋›️", label: "Inner Sanctum", desc: "Meditation & Willenskraft", isOverlay: false }] : [{ key: "sanctum_locked", icon: "📋›️", label: "Inner Sanctum", locked: true, unlockLevel: 11 }]),
                  ...(can('dawn_dusk') ? [{ key: "protocol_overlay", iconSrc: NAV_ICONS.timer, icon: "⏰", label: "Dawn / Dusk Protocol", desc: "Morgen- & Abendroutinen", isOverlay: true, action: () => setShowDawnDusk(true) }] : [{ key: "protocol_locked", icon: "⏰", label: "Dawn / Dusk Protocol", locked: true, unlockLevel: 8 }]),
                  ...(can('soul_link') ? [{ key: "soullink_overlay", icon: "📋", label: "Soul Link", desc: state.soulLink?.linkCode ? `Verbunden mit ${state.soulLink.partnerName || "Partner"}` : "Mit Partner verbinden", isOverlay: true, action: () => setShowSoulLink(true) }] : [{ key: "soullink_locked", icon: "📋", label: "Soul Link", locked: true, unlockLevel: 30 }]),
                  ...(can('charisma_dungeons') ? [{ key: "charisma_overlay", iconSrc: CHA_ICONS.conversation, icon: "📋", label: "Charisma Dungeons", desc: `${(state.charismaDungeons?.completedChains || []).length}/${5} Ketten · CHA ${state.stats?.cha || 0}`, isOverlay: true, action: () => setShowCharismaView(true) }] : [{ key: "charisma_locked", iconSrc: CHA_ICONS.conversation, icon: "📋", label: "Charisma Dungeons", locked: true, unlockLevel: 30 }]),
                ]
              }, {
                title: "SYSTEM", iconSrc: NAV_ICONS.settings, icon: "âš™️", color: "#64748b",
                items: [
                  { key: "settings", iconSrc: NAV_ICONS.settings, icon: "âš™️", label: "Einstellungen", desc: "Theme, Export & mehr" },
                ]
              }].map((section, si) => (
                <div key={section.title} style={{ marginBottom: 20, animation: `slideUp 0.3s ease ${si * 0.08}s both` }}>
                  {/* Section header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: section.color, boxShadow: `0 0 8px ${section.color}44` }} />
                    {section.iconSrc ? <img src={section.iconSrc} alt="" style={{ width: 14, height: 14, objectFit: "contain", filter: `brightness(1.1) drop-shadow(0 0 4px ${section.color}55)` }} /> : null}
                    <span style={{ fontSize: 10, letterSpacing: 3, color: section.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{!section.iconSrc ? section.icon + " " : ""}{section.title}</span>
                  </div>
                  {/* Section items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {section.items.map((item, ii) => (
                      <button key={item.key} onClick={() => {
                        if (item.locked) return;
                        item.isOverlay ? item.action?.() : navigateTo(item.key);
                      }} style={{
                        width: "100%", padding: "14px 16px", borderRadius: 14,
                        background: item.locked ? "rgba(10,10,22,0.4)" : theme.card,
                        border: `1px solid ${item.locked ? "rgba(100,116,139,0.08)" : section.color + "15"}`,
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        transition: "all 0.2s", cursor: item.locked ? "default" : "pointer",
                        backdropFilter: "blur(8px)",
                        opacity: item.locked ? 0.45 : 1,
                        filter: item.locked ? "grayscale(0.7)" : "none",
                        animation: `cardEnter 0.3s ease ${(si * 0.08) + (ii * 0.04)}s both`
                      }}
                        onMouseEnter={e => { if (!item.locked) { e.currentTarget.style.borderColor = section.color + "44"; e.currentTarget.style.transform = "translateX(4px)"; } }}
                        onMouseLeave={e => { if (!item.locked) { e.currentTarget.style.borderColor = section.color + "15"; e.currentTarget.style.transform = "none"; } }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: item.locked ? "rgba(30,34,48,0.4)" : `${section.color}12`, border: `1px solid ${item.locked ? "rgba(100,116,139,0.1)" : section.color + "22"}`, position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                          {item.locked ? (
                            <span style={{ fontSize: 16 }}>🔒</span>
                          ) : item.iconSrc ? (
                            <img src={item.iconSrc} alt={item.label} style={{ width: 24, height: 24, objectFit: "contain", filter: `brightness(1.1) drop-shadow(0 0 6px ${section.color}55)` }} />
                          ) : (
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                          )}
                          {!item.locked && item.badge > 0 && <div style={{ position: "absolute", top: -4, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #000" }}>{item.badge}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: item.locked ? "#475569" : "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{item.label}</div>
                          <div style={{ fontSize: 9, color: item.locked ? "#334155" : "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                            {item.locked ? `🔒 AB LEVEL ${item.unlockLevel}` : item.desc}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#334155", opacity: 0.5 }}>{item.locked ? "" : "›"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Multiplayer Portal */}
              {can('multiplayer') && (
              <div style={{ marginBottom: 20, animation: `slideUp 0.3s ease 0.4s both` }}>
                <button onClick={enterPortal} style={{
                  width: "100%", padding: "16px 20px", borderRadius: 16,
                  background: `linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))`,
                  border: `1px solid #f59e0b33`, borderLeft: `3px solid #f59e0b66`,
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                  transition: "all 0.3s", cursor: "pointer"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b88"; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,158,11,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#f59e0b33"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b44", flexShrink: 0 }}><GameIcon src={NAV_ICONS.guild} fallback="📋" size={28} glow glowColor="rgba(245,158,11,0.5)" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fcd34d", fontFamily: "'Cinzel',serif" }}>Hunter Association</div>
                    <div style={{ fontSize: 9, color: "#92400e", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>Multiplayer Portal betreten</div>
                  </div>
                  <div style={{ fontSize: 14, color: "#f59e0b", animation: "pulse 2s infinite" }}>âŸ¶</div>
                </button>
              </div>
              )}

              {/* Version footer */}
              <div style={{ textAlign: "center", padding: "12px 0", fontSize: 9, color: "#1e293b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>
                ARISE SYSTEM v1.3.7
              </div>
            </div>
          </div>
        )
      }

      {/* INNER SANCTUM VIEW */}
      {view === "sanctum" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "pageEmerge 0.5s cubic-bezier(0.22,1,0.36,1) both", padding: "16px", paddingTop: 140, paddingBottom: 110, overflowY: "auto" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <InnerSanctum theme={theme} state={state} persist={persist} notify={notify} />
          </div>
        </div>
      )}

      {/* QUEST CREATE MODAL */}
      {
        showCreate && (
          <div onClick={() => { setShowCreate(false); setShowTemplates(false); }} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(2,2,10,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)", padding: "16px 12px" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", background: `linear-gradient(180deg,${theme.card},rgba(6,6,16,0.99))`, border: `1px solid ${theme.primary}44`, borderTop: `2px solid ${theme.primary}`, borderRadius: 24, display: "flex", flexDirection: "column", animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", boxShadow: `0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px ${theme.glow}` }}>
              {/* Header */}
              <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4, textShadow: `0 0 12px ${theme.glow}` }}>SYSTEM: {editingQuestId ? "QUEST ÄNDERN" : "NEUE QUEST"}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>{editingQuestId ? "Quest anpassen" : "Quest erstellen"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* RANDOMIZER BUTTON */}
                    <button
                      title="Zufällige Quest-Idee"
                      onClick={() => {
                        const pool = QUEST_TEMPLATES;
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        setRandomizing(true);
                        setQTitle(pick.t); setQCat(pick.c); setQDiff(pick.d); setQType(pick.tp);
                        setShowTemplates(false);
                        setTimeout(() => setRandomizing(false), 600);
                      }}
                      style={{ width: 38, height: 38, borderRadius: 12, background: randomizing ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.1)", border: `1px solid ${randomizing ? "#f59e0b88" : "#f59e0b33"}`, color: "#f59e0b", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", cursor: "pointer", animation: randomizing ? "spin 0.5s ease" : "none" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.2)"; e.currentTarget.style.borderColor = "#f59e0b66"; }}
                      onMouseLeave={e => { if (!randomizing) { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; e.currentTarget.style.borderColor = "#f59e0b33"; } }}
                    >📋</button>
                    <button onClick={() => { setShowCreate(false); setShowTemplates(false); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444444"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>&#x2715;</button>
                  </div>
                </div>
                {/* Mode tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {[{ key: false, label: "\u270E\uFE0F Erstellen" }, { key: true, label: "💡 Ideen-Bibliothek" }].map(tab => (
                    <button key={String(tab.key)} onClick={() => setShowTemplates(tab.key)} style={{ flex: 1, padding: "8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: showTemplates === tab.key ? theme.primary + "22" : "transparent", color: showTemplates === tab.key ? theme.accent : "#475569", border: `1px solid ${showTemplates === tab.key ? theme.primary + "55" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, transition: "all 0.25s", cursor: "pointer" }}>{tab.label}</button>
                  ))}
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55,transparent)` }} />
              </div>

              {/* Scrollable Content */}
              <div style={{ overflowY: "auto", padding: "0 24px", flex: 1 }}>

                {/* â•â• IDEEN-BIBLIOTHEK â•â• */}
                {showTemplates && (
                  <div style={{ paddingTop: 16, paddingBottom: 8 }}>
                    {/* Randomizer big button */}
                    <button
                      onClick={() => {
                        const pool = QUEST_TEMPLATES;
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        setRandomizing(true);
                        setQTitle(pick.t); setQCat(pick.c); setQDiff(pick.d); setQType(pick.tp);
                        setShowTemplates(false);
                        setTimeout(() => setRandomizing(false), 600);
                      }}
                      style={{ width: "100%", padding: "14px", borderRadius: 16, fontSize: 13, fontWeight: 900, background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))", color: "#f59e0b", border: "1px solid #f59e0b44", fontFamily: "'Cinzel',serif", letterSpacing: 2, marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.3s", boxShadow: "0 4px 20px rgba(245,158,11,0.15)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.12))"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.08))"; e.currentTarget.style.transform = "none"; }}
                    ><span style={{ fontSize: 22 }}>🎲</span> ZUFÄLLIGE QUEST WÜRFELN</button>

                    {/* Category filter */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                      {[{ key: "all", label: "Alle", color: theme.accent }, ...CATEGORIES.map(c => ({ key: c.key, label: <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{c.iconSrc ? <img src={c.iconSrc} alt={c.stat} style={{ width: 12, height: 12, mixBlendMode: "screen" }} /> : c.icon} {c.stat}</span>, color: c.color }))].map(f => (
                        <button key={f.key} onClick={() => setTemplateFilter(f.key)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, flexShrink: 0, background: templateFilter === f.key ? f.color + "22" : "transparent", color: templateFilter === f.key ? f.color : "#475569", border: `1px solid ${templateFilter === f.key ? f.color + "55" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s", cursor: "pointer" }}>{f.label}</button>
                      ))}
                    </div>

                    {/* Template grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingBottom: 16 }}>
                      {QUEST_TEMPLATES.filter(tmpl => templateFilter === "all" || tmpl.c === templateFilter).map((tmpl, i) => {
                        const cat = CATEGORIES.find(c => c.key === tmpl.c) || CATEGORIES[0];
                        const diff = DIFFICULTIES.find(d => d.key === tmpl.d) || DIFFICULTIES[1];
                        return (
                          <button key={i} onClick={() => { setQTitle(tmpl.t); setQCat(tmpl.c); setQDiff(tmpl.d); setQType(tmpl.tp); setShowTemplates(false); }} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(10,10,24,0.8)", border: `1px solid ${cat.color}22`, textAlign: "left", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 5 }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.background = cat.color + "0d"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = cat.color + "22"; e.currentTarget.style.background = "rgba(10,10,24,0.8)"; e.currentTarget.style.transform = "none"; }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>{tmpl.t}</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 8, color: cat.color, padding: "1px 5px", borderRadius: 4, background: cat.color + "15", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>{cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 10, height: 10, mixBlendMode: "screen" }} /> : cat.icon}<span>{cat.stat}</span></span>
                              <span style={{ fontSize: 8, color: diff.color, padding: "1px 5px", borderRadius: 4, background: diff.color + "15", fontFamily: "'JetBrains Mono',monospace", display: "inline-flex", alignItems: "center", gap: 2 }}>{diff.iconSrc ? <img src={diff.iconSrc} alt={diff.label} style={{ width: 9, height: 9, objectFit: "contain" }} /> : diff.icon}{diff.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* â•â• ERSTELLEN-MODUS â•â• */}
                {!showTemplates && <>

                  {/* Quest Title */}
                  <div style={{ marginTop: 16, marginBottom: 18 }}>
                    <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 8 }}>QUEST TITEL</label>
                    <input value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="Quest-Titel eingeben..." autoFocus
                      style={{ width: "100%", padding: "14px 18px", borderRadius: 14, fontSize: 15, background: "rgba(4,4,12,0.9)", border: `1px solid ${randomizing ? "#f59e0b88" : theme.primary + "44"}`, color: "#fff", outline: "none", fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5, transition: "all 0.3s", boxShadow: randomizing ? `0 0 20px rgba(245,158,11,0.25)` : `inset 0 2px 10px rgba(0,0,0,0.5)`, boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.5), 0 0 20px ${theme.glow}, 0 0 0 1px ${theme.primary}`; e.target.style.outline = "none"; }}
                      onBlur={e => { e.target.style.borderColor = `${theme.primary}44`; e.target.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.5)`; e.target.style.outline = "none"; }}
                      onKeyDown={e => e.key === "Enter" && qTitle.trim() && createQuest()} />
                  </div>

                  {/* Quest Type */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 10 }}>QUEST TYP</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { key: "side", label: "Side Quest", color: "#a78bfa", desc: "Kein Zeitlimit" },
                        { key: "daily", label: "Daily Quest", color: "#22d3ee", desc: "Täglich zurückgesetzt" },
                        ...(can('weekly_quests') ? [{ key: "weekly", label: "Weekly Quest", color: "#8b5cf6", desc: "2Ã— XP & Gold" }] : []),
                        ...(can('chained_quests') ? [{ key: "chained", label: "Chained Quest", color: "#f59e0b", desc: "3 Schritte · +25% je" }] : []),
                      ].map(t => {
                        const active = qType === t.key;
                        return (
                          <button key={t.key} onClick={() => setQType(t.key)} style={{
                            padding: "11px 12px", borderRadius: 14, fontSize: 12, fontWeight: 700,
                            background: active ? `linear-gradient(135deg,${t.color}22,${t.color}0d)` : "rgba(12,12,26,0.6)",
                            color: active ? t.color : "#475569",
                            border: `1px solid ${active ? t.color + "55" : "#1e2940"}`,
                            transition: "all 0.25s", fontFamily: "'Outfit',sans-serif",
                            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
                            boxShadow: active ? `0 4px 16px ${t.color}22, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
                            cursor: "pointer", textAlign: "left"
                          }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = t.color + "33"; e.currentTarget.style.color = t.color + "cc"; } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#1e2940"; e.currentTarget.style.color = "#475569"; } }}
                          >
                            <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? t.color : "#475569", boxShadow: active ? `0 0 6px ${t.color}` : "none" }} />
                              {t.label}
                            </span>
                            <span style={{ fontSize: 9, opacity: active ? 0.8 : 0.45, fontWeight: 400, fontFamily: "'JetBrains Mono',monospace" }}>{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 10 }}>SCHWIERIGKEIT</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                      {DIFFICULTIES.map(d => {
                        const active = qDiff === d.key;
                        const typeCfg = QUEST_TYPES_CONFIG[qType] || QUEST_TYPES_CONFIG.side;
                        const xpVal = Math.round(d.xp * (typeCfg.xpMult || 1));
                        return (
                          <button key={d.key} onClick={() => setQDiff(d.key)} style={{
                            padding: "12px 4px", borderRadius: 14, fontSize: 13,
                            background: active ? `linear-gradient(135deg,${d.color}22,${d.color}0d)` : "rgba(12,12,26,0.6)",
                            color: active ? d.color : "#475569",
                            border: `1px solid ${active ? d.color + "55" : "#1e2940"}`,
                            transition: "all 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            boxShadow: active ? `0 4px 12px ${d.color}33, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
                            cursor: "pointer"
                          }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = d.color + "44"; e.currentTarget.style.color = d.color + "cc"; } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#1e2940"; e.currentTarget.style.color = "#475569"; } }}
                          >
                            {d.iconSrc ? (
                              <img src={d.iconSrc} alt={d.label} style={{ width: 22, height: 22, objectFit: "contain", filter: active ? `drop-shadow(0 0 6px ${d.color}88) brightness(1.15)` : "brightness(0.6) saturate(0.5)" }} />
                            ) : (
                              <span style={{ fontSize: 18, lineHeight: 1 }}>{d.icon}</span>
                            )}
                            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>{d.label.toUpperCase()}</span>
                            <span style={{ fontSize: 9, opacity: 0.75, fontFamily: "'JetBrains Mono',monospace" }}>+{xpVal} XP</span>
                            <span style={{ fontSize: 8, opacity: 0.5, fontFamily: "'JetBrains Mono',monospace" }}>{d.waitHours}h Timer</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 3, fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 10 }}>STATS KATEGORIE</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {CATEGORIES.map(c => { const active = qCat === c.key; return (<button key={c.key} onClick={() => setQCat(c.key)} style={{ padding: "11px 6px", borderRadius: 14, fontSize: 12, background: active ? `linear-gradient(135deg,${c.color}22,${c.color}0d)` : "rgba(12,12,26,0.6)", color: active ? c.color : "#475569", border: `1px solid ${active ? c.color + "55" : "#1e2940"}`, transition: "all 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: active ? `0 4px 12px ${c.color}33, inset 0 1px 0 rgba(255,255,255,0.05)` : "none", cursor: "pointer" }} onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = c.color + "44"; e.currentTarget.style.color = c.color + "cc"; } }} onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#1e2940"; e.currentTarget.style.color = "#475569"; } }}>  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${c.color}33` }}>{c.iconSrc ? <img src={c.iconSrc} alt={c.stat} style={{ width: 20, height: 20, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15) drop-shadow(0 0 4px ${c.color}55)`, transform: "scale(1.1)" }} /> : <span style={{ fontSize: 16 }}>{c.icon}</span>}</div><span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>{c.stat}</span><span style={{ fontSize: 9, opacity: active ? 0.8 : 0.4, fontFamily: "'Outfit',sans-serif", textAlign: "center", lineHeight: 1.2 }}>{c.label}</span></button>); })}
                    </div>
                  </div>

                  {/* Reward Preview */}
                  {(() => {
                    const typeCfg = QUEST_TYPES_CONFIG[qType] || QUEST_TYPES_CONFIG.side;
                    const diff = DIFFICULTIES.find(d => d.key === qDiff);
                    const cat = CATEGORIES.find(c => c.key === qCat);
                    const baseXp = Math.round(diff.xp * (typeCfg.xpMult || 1));
                    const baseGold = Math.round(diff.gold * (typeCfg.goldMult || 1));
                    return (
                      <div style={{ background: "rgba(8,8,20,0.95)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, border: `1px solid ${theme.primary}1a`, borderLeft: `3px solid ${diff.color}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)` }}>
                        <div style={{ fontSize: 9, letterSpacing: 3, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>VORSCHAU BELOHNUNG</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 0, alignItems: "center" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>SCHWIERIG</div>
                            <div style={{ fontSize: 12, color: diff.color, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>{diff.iconSrc ? <img src={diff.iconSrc} alt={diff.label} style={{ width: 12, height: 12, objectFit: "contain" }} /> : diff.icon} {diff.label}</div>
                          </div>
                          <div style={{ width: 1, height: 28, background: "#1e2940", margin: "0 8px" }} />
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>BELOHNUNG</div>
                            <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", gap: 6, justifyContent: "center" }}>
                              <span style={{ color: "#67e8f9" }}>+{baseXp} XP</span>
                              {baseGold > 0 && <span style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: 3 }}>+{baseGold} <img src="/icon/coin.png" style={{ width: 12, height: 12, opacity: 0.8 }} alt="G" /></span>}
                            </div>
                          </div>
                          <div style={{ width: 1, height: 28, background: "#1e2940", margin: "0 8px" }} />
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>KATEGORIE</div>
                            <div style={{ fontSize: 12, color: cat.color, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{cat.iconSrc ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 16, height: 16, objectFit: "contain", mixBlendMode: "screen", filter: `brightness(1.15)` }} /> : cat.icon} <span>{cat.stat}</span></span>
                            </div>
                          </div>
                        </div>
                        {qDiff === "boss" && <div style={{ marginTop: 10, padding: "5px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid #ef444433", fontSize: 10, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", textAlign: "center", animation: "pulse 2s infinite", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>âš  <img src={SHADOW_ICONS.soldier} alt="Shadow" style={{ width: 12, height: 12, objectFit: "contain", filter: "brightness(0.6) invert(1) drop-shadow(0 0 4px #ef444488)" }} /> SCHATTEN BESCHWÖRUNGSCHANCE</div>}
                        {qType === "chained" && <div style={{ marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.06)", borderRadius: 8, border: "1px solid #f59e0b22", fontSize: 10, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>â›“️ 3-Schritte Kette · +25% XP pro Schritt</div>}
                      </div>
                    );
                  })()}

                  {/* Habit Sync Toggle */}
                  {(qType === "daily" || qType === "weekly") && (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "rgba(10,10,24,0.6)", padding: "12px 14px", borderRadius: 12, border: `1px solid ${qSyncHabit ? theme.primary + "55" : "#1e2940"}`, transition: "all 0.2s", marginBottom: 16 }}>
                      <input type="checkbox" checked={qSyncHabit} onChange={e => setQSyncHabit(e.target.checked)} style={{ accentColor: theme.primary, width: 16, height: 16, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: qSyncHabit ? theme.primary : "#e2e8f0" }}>Mit Habit-Tracker verknüpfen</div>
                        <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>Erstellt automatisch eine Routine zum Tracken des Streaks.</div>
                      </div>
                    </label>
                  )}

                </>}
              </div>

              {!showTemplates && (
                <div style={{ padding: "14px 24px 20px", flexShrink: 0, borderTop: `1px solid ${theme.primary}1a` }}>
                  <button onClick={() => {
                    if (qType === "chained") addChainedQuest(qTitle, qCat, qDiff);
                    else createQuest();
                    setQTitle(""); setShowCreate(false); setShowTemplates(false);
                  }} disabled={!qTitle.trim()} style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 14, fontWeight: 900, background: qTitle.trim() ? `linear-gradient(135deg,${theme.primary},${theme.secondary})` : 'rgba(15,15,30,0.6)', color: qTitle.trim() ? "#fff" : "#334155", letterSpacing: 3, fontFamily: "'Cinzel',serif", boxShadow: qTitle.trim() ? `0 8px 32px ${theme.glow}, inset 0 2px 0 rgba(255,255,255,0.2)` : "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: qTitle.trim() ? "pointer" : "not-allowed", border: qTitle.trim() ? "none" : "1px solid #1e2940" }}
                    onMouseEnter={e => { if (qTitle.trim()) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.1)"; } }}
                    onMouseLeave={e => { if (qTitle.trim()) { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; } }}
                  >{qTitle.trim() ? (editingQuestId ? "✦ SPEICHERN ✦" : "✦ QUEST ANNEHMEN ✦") : "Quest-Titel eingeben..."}</button>
                </div>
              )}

            </div>
          </div>
        )
      }

      {/* REWARDED AD MODAL */}
      {showAdModal && (
        <RewardedAdModal
          theme={theme}
          onComplete={() => {
            const result = watchRewardedAd();
            return result;
          }}
          onClose={() => setShowAdModal(false)}
        />
      )}

      {/* DAWN / DUSK PROTOCOL — rendered above as overlay (line ~451), this duplicate is intentionally removed */}
    </div >
  );
}

// â”€â”€â”€ SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


