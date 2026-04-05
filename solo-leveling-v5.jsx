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
import HealthIntegration from "./components/HealthIntegration.jsx";
import SettingsView from "./components/SettingsView.jsx";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// ─── RANKS ────────────────────────────────────────────────────
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, getJobBonuses, calculateLevelUp,
  CSS, ParticleField, MusicPlayer, SystemNotification, AchievementToast, XpFloat, LevelUpCinematic, AriseCinematic,
  ShadowCard, ShadowDetailModal, FormationEditor, StatRadar, QuestTimer, QuestTypeBadge,
  EmergencyQuestCard, ChainedQuestProgress, QuestCard, DungeonGate, FloorProgressBar, BossPhaseUI, DungeonBattle,
  JobCard, JobsView, JobLevelUpCinematic, AbilityActivationCinematic, SystemCLI
} from './data/constants';
import { useGameState } from './hooks/useGameState.jsx';
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
    increaseStat
  } = gameState;
  const modifier = useMemo(() => getDailyModifier(), []);
  const [showFocusMode, setShowFocusMode] = React.useState(false);



  // ── Adaptive System Coach: periodic intervention checks ──
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
  if (!loading && state && !state.tutorialCompleted && !showSetup) {
    return (
      <DoubleDungeonTutorial
        hunterName={state.hunterName}
        onComplete={() => {
          persist({ ...state, tutorialCompleted: true });
        }}
      />
    );
  }

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 40, animation: "float 2s ease-in-out infinite" }}>⚔️</div><div style={{ marginTop: 12, fontSize: 12, letterSpacing: 4, color: "#4f6ef7", fontFamily: "'JetBrains Mono',monospace" }}>LOADING</div></div></div>;
  if (showSetup) return <SetupScreen onFinish={gameState.finishSetup} theme={gameState.theme || "default"} />;

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
        <div style={{ fontSize: 64, animation: "portalGate 1.5s cubic-bezier(0.4,0,0.2,1) forwards", filter: "drop-shadow(0 0 40px rgba(245,158,11,0.8))", marginBottom: 32 }}>🌐</div>
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

  const theme = (state?.selectedTheme === "custom" && state?.customThemeData)
    ? state.customThemeData
    : (THEMES[state?.selectedTheme] || THEMES["default"]);


  return (
    <div style={{ minHeight: "100vh", background: penaltyActive ? `linear-gradient(180deg,${theme.bg},rgba(20,4,4,0.95))` : theme.bg, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
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
      {levelUp && <LevelUpCinematic levelData={levelUp} rank={getRank(levelUp.level || levelUp)} oldRank={prevRank} onClose={() => setLevelUp(null)} />}
      {ariseTarget && <AriseCinematic shadow={ariseTarget} onClose={() => setAriseTarget(null)} />}
      {state._jobLevelUp && <JobLevelUpCinematic job={JOBS[state._jobLevelUp.job]} newLevel={state._jobLevelUp.newLevel} onClose={() => { const next = { ...state }; delete next._jobLevelUp; persist(next); }} />}
      {state._abilityActivated && <AbilityActivationCinematic ability={state._abilityActivated.ability} job={state._abilityActivated.job} onClose={() => { const next = { ...state }; delete next._abilityActivated; persist(next); }} />}
      {activeDungeon && <DungeonBattle dungeon={activeDungeon} playerStats={state.stats} theme={theme} onResult={r => finishDungeon(activeDungeon, r)} onClose={() => setActiveDungeon(null)} skillBonuses={getSkillBonuses(null, state.stats)} modifier={modifier} formationBonus={formationBonus} state={state} persist={persist} notify={notify} />}
      {selectedShadow && <ShadowDetailModal shadow={selectedShadow} theme={theme} gold={state.gold} onClose={() => setSelectedShadow(null)} onDeploy={deployShadow} onUndeploy={undeployShadow} onEvolve={evolveShadow} />}
      {systemMessage && <SystemCLI message={systemMessage} onClose={() => setSystemMessage(null)} />}

      {/* FOCUS MODE */}
      {showFocusMode && <FocusMode state={state} persist={persist} notify={notify} onExit={() => setShowFocusMode(false)} theme={theme} />}

      {/* HIDDEN QUEST DISCOVERY MODAL */}
      {showHiddenQuestModal && (
        <div onClick={() => setShowHiddenQuestModal(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(1,0,6,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.4s", cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 12, animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 0 20px #6366f1)" }}>❓</div>
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
      <header style={{ position: "sticky", top: 0, zIndex: 100, padding: "12px 16px", background: `linear-gradient(180deg,${theme.bg}f5,${theme.bg}e8)`, borderBottom: `1px solid ${penaltyActive ? "#ef444422" : theme.primary + "12"}`, backdropFilter: "blur(24px)" }}>
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
                  <span>💰</span>{state.gold.toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: state.streak >= 3 ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${state.streak >= 3 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.06)"}`, color: state.streak >= 5 ? "#f97316" : state.streak >= 3 ? "#fb923c" : "#94a3b8", minWidth: 40 }}>
                <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 2 }}>
                  <span style={{ animation: state.streak >= 3 ? "pulse 1.5s infinite" : "none" }}>🔥</span>{state.streak}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setShowFocusMode(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px",
                  height: 34, borderRadius: 10, background: "rgba(168,85,247,0.15)",
                  border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc",
                  cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.3s", letterSpacing: 1
                }}
                title="Focus Mode starten"
              >
                FOCUS
              </button>
              <button
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
                {isMusicPlaying ? "🔊" : "🔈"}
              </button>

              <button
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
                🏛️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ position: "relative", zIndex: 1, padding: "16px", maxWidth: 480, margin: "0 auto", paddingBottom: 92 }}>

        {/* PENALTY BANNER */}
        {penaltyActive && (
          <div style={{ background: "rgba(20,4,4,0.9)", border: "1px solid #ef444433", borderLeft: "3px solid #ef4444", borderRadius: 14, padding: "14px 16px", marginBottom: 14, backdropFilter: "blur(8px)", animation: "glitch 4s ease-in-out infinite" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>⚠ PENALTY ZONE AKTIV</div>
            <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 500 }}>Das System bestraft Inaktivität. Schließe {Math.max(0, (state.penaltyZone?.redemptionLeft || 3) - (state.penaltyZone?.questsCompletedInPenalty || 0))} weitere Quests ab.</div>
            <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>-20% XP aus allen Quests</div>
          </div>
        )}
        {/* MODIFIER BANNER */}
        {modifier && modifier.id !== "none" && (
          <div style={{ background: `linear-gradient(135deg,${modifier.color}10,transparent)`, border: `1px solid ${modifier.color}25`, borderLeft: `3px solid ${modifier.color}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{modifier.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: modifier.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{modifier.name.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{modifier.desc}</div>
            </div>
            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>RESET IN {hoursUntilMidnight()}h</div>
          </div>
        )}

        <NotificationBanner state={state} theme={theme} />

        {/* ═══ MICRO-HABITS WIDGET (on dashboard) ═══ */}
        {view === "dashboard" && (
          <MicroHabits state={state} persist={persist} notify={notify} theme={theme} />
        )}

        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}15`, borderRadius: 22, padding: "24px 22px 20px", marginBottom: 16, position: "relative", overflow: "hidden", backdropFilter: "blur(16px)", boxShadow: `0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.03)` }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: `radial-gradient(circle at 100% 30%,${theme.primary}0a,transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10, letterSpacing: 1, animation: "pulse 2s infinite" }}>&gt; SYSTEM ONLINE. WILLKOMMEN, {state.hunterName.toUpperCase()}.</div>
                  <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>HUNTER LEVEL</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1, textShadow: `0 0 40px ${theme.primary}33` }}>{state.level}</div>
                  {streakBonus > 0 && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 6, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>🔥 +{streakBonus}% XP</div>}
                  {formationBonus.dungeonBonus > 0 && <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>🌑 +{formationBonus.dungeonBonus}% Dungeon</div>}
                </div>
                <StatRadar stats={state.stats} theme={theme} size={110} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                <span style={{ letterSpacing: 2 }}>EXP</span><span>{state.xp.toLocaleString()} / {xpNeeded.toLocaleString()}</span>
              </div>
              <div style={{ height: 10, background: "rgba(15,15,30,0.9)", borderRadius: 5, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: `${xpPercent}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg,${theme.primary},${theme.accent})`, boxShadow: `0 0 16px ${theme.glow},0 2px 8px ${theme.primary}44`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)", animation: "shimmer 2.5s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 16 }}>
              {CATEGORIES.map((cat, i) => (
                <div key={cat.key} style={{ background: theme.card, border: `1px solid ${cat.color}15`, borderRadius: 12, padding: "10px 4px", textAlign: "center", backdropFilter: "blur(8px)", animation: `slideUp 0.3s ease ${i * 0.05}s both`, transition: "border-color 0.3s,transform 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "44"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = cat.color + "15"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ fontSize: 16 }}>{cat.icon}</div>
                  <div style={{ fontSize: 9, color: cat.color, marginTop: 3, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, letterSpacing: 1 }}>{cat.stat}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif", marginTop: 1 }}>{(state.stats[cat.key] || 0) + (equipBonuses[cat.key + "Bonus"] || 0)}</div>
                </div>
              ))}
            </div>

            {/* ── HABITS & DAILY ROUTINE ── */}
            <div style={{ marginBottom: 24 }}>
              <HabitTracker state={state} persist={persist} notify={notify} theme={theme} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
              <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>HUNTER QUESTS</div>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
            </div>

            {/* ── EMERGENCY QUEST ── */}
            {state.emergencyQuest && (
              <EmergencyQuestCard
                quest={state.emergencyQuest}
                done={state.emergencyDone}
                failed={state.emergencyFailed}
                onComplete={completeEmergencyQuest}
                theme={theme}
              />
            )}

            {/* ── QUEST FILTERS + ADD ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, flex: 1 }}>
                {[
                  { key: "all", label: "Alle", color: theme.accent },
                  { key: "daily", label: "Daily", color: "#22d3ee" },
                  { key: "side", label: "Side", color: "#a78bfa" },
                  { key: "weekly", label: "Weekly", color: "#8b5cf6" },
                  { key: "chained", label: "Kette", color: "#f59e0b" },
                  ...(hiddenQuestCount > 0 ? [{ key: "hidden", label: `❓ ${hiddenQuestCount}`, color: "#6366f1" }] : []),
                ].map(f => (
                  <button key={f.key} onClick={() => setQuestFilter(f.key)} style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, flexShrink: 0,
                    background: questFilter === f.key ? f.color + "22" : "transparent",
                    color: questFilter === f.key ? f.color : "#475569",
                    border: `1px solid ${questFilter === f.key ? f.color + "44" : "transparent"}`,
                    transition: "all 0.25s", fontFamily: "'JetBrains Mono',monospace"
                  }}>{f.label}</button>
                ))}
              </div>
              <button onClick={() => setShowCreate(true)} style={{ padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 900, background: `linear-gradient(135deg,${theme.primary},${theme.secondary})`, color: "#fff", border: "none", boxShadow: `0 4px 16px ${theme.glow}`, textShadow: "0 1px 4px rgba(0,0,0,0.4)", fontFamily: "'Cinzel',serif", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, transition: "all 0.3s", transform: "translateY(-1px)", animation: "float 3s ease-in-out infinite" }}>+ QUEST</button>
            </div>

            {filteredQuests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 36, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>⚔️</div>
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                <div style={{ fontSize: 11, color: "#334155" }}>Erstelle eine Quest um XP zu verdienen</div>
              </div>
            ) : filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} />)}
          </div>
        )}

        {/* ═══ DUNGEONS ═══ */}
        {view === "dungeon" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>DUNGEON GATES</div>
              <div style={{ fontSize: 12, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>Reset in {hoursUntilMidnight()}h · {modifier?.id !== "none" ? `${modifier?.icon} ${modifier?.name}` : "Stable Gates"}</div>
            </div>
            {activeDungeons.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🌀</div><div style={{ fontSize: 14, color: "#475569" }}>Keine aktiven Gates</div><div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Kommen morgen wieder zurück</div></div>}
            {activeDungeons.map((d, i) => <div key={d.instanceId} style={{ marginBottom: 10, animation: `slideUp 0.35s ease ${i * 0.1}s both` }}><DungeonGate dungeon={d} playerStats={{ ...state.stats, ...Object.fromEntries(CATEGORIES.map(c => [c.key, (state.stats[c.key] || 0) + (equipBonuses[c.key + "Bonus"] || 0)])) }} theme={theme} onEnter={setActiveDungeon} modifier={modifier} /></div>)}
            {(state.dungeons || []).filter(d => d.cleared).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HEUTE ABSOLVIERT</div>
                {(state.dungeons || []).filter(d => d.cleared).map((d, i) => <div key={d.instanceId} style={{ marginBottom: 8, opacity: 0.4 }}><DungeonGate dungeon={d} playerStats={state.stats} theme={theme} onEnter={() => { }} modifier={modifier} /></div>)}
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS ═══ */}
        {view === "stats" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "20px", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", backdropFilter: "blur(12px)", position: "relative" }}>
              {state.statPoints > 0 && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "#f59e0b22", border: "1px solid #f59e0b44", padding: "4px 10px", borderRadius: 20, fontSize: 10, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, animation: "pulse 1.5s infinite" }}>
                  {state.statPoints} PUNKTE VERFÜGBAR
                </div>
              )}
              <StatRadar stats={state.stats} theme={theme} size={200} />
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap", justifyContent: "center", marginTop: 4, width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: 12, overflow: "hidden" }}>
                {[{ label: "TOTAL XP", value: (state.totalXpEarned || 0).toLocaleString(), color: theme.accent }, { label: "QUESTS", value: state.totalQuestsCompleted || 0, color: theme.accent }, { label: "STREAK", value: `${state.streak}d`, color: "#f59e0b" }, { label: "PWR LVL", value: powerLevel, color: "#e879f9" }, { label: "CLEARED", value: (state.dungeonHistory || []).filter(d => d.won).length, color: "#22d3ee" }].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "8px 10px", flex: "1 0 33%" }}>
                    <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3, letterSpacing: 1 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {CATEGORIES.map((cat, i) => {
              const val = (state.stats[cat.key] || 0) + (equipBonuses[cat.key + "Bonus"] || 0); const base = state.stats[cat.key] || 0; const maxD = Math.max(val, 50); return (
                <div key={cat.key} style={{ background: theme.card, border: `1px solid ${cat.color}12`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${i * 0.06}s both`, transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = cat.color + "33"} onMouseLeave={e => e.currentTarget.style.borderColor = cat.color + "12"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{cat.label}</div>
                        <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{cat.full}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {state.statPoints > 0 && (
                        <button onClick={() => increaseStat(cat.key)} style={{ width: 26, height: 26, borderRadius: 6, background: cat.color + "22", border: `1px solid ${cat.color}44`, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, cursor: "pointer", transition: "all 0.2s" }}>+</button>
                      )}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: cat.color, fontFamily: "'Cinzel',serif" }}>{val}</div>
                        {equipBonuses[cat.key + "Bonus"] > 0 && <div style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace" }}>({base}+{equipBonuses[cat.key + "Bonus"]})</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 5, background: "#0f0f1e", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((val / maxD) * 100, 100)}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cat.color}aa,${cat.color})`, boxShadow: `0 0 8px ${cat.color}44`, animation: "statBarFill 1s ease-out" }} />
                  </div>
                </div>
              );
            })}
            {unlockedSkills.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>UNLOCKED SKILLS ({unlockedSkills.length})</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {unlockedSkills.map((sk, i) => {
                    const cat = CATEGORIES.find(c => c.key === sk.stat); return (
                      <div key={sk.id} style={{ background: theme.card, border: `1px solid ${cat.color}22`, borderRadius: 12, padding: "12px", animation: `scaleIn 0.4s ease ${i * 0.07}s both` }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 20 }}>{sk.icon}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, fontFamily: "'Cinzel',serif" }}>{sk.name}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>{sk.desc}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SHADOW ARMY ═══ */}
        {view === "shadows" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            {/* Header card */}
            <div style={{ background: `linear-gradient(135deg,rgba(8,6,20,0.95),rgba(12,8,28,0.9))`, border: `1px solid #7c3aed33`, borderRadius: 18, padding: "18px 20px", marginBottom: 16, backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle at 100% 0%,#7c3aed15,transparent)", borderRadius: "0 18px 0 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 4, color: "#7c3aed", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>SHADOW ARMY</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{totalShadows}<span style={{ fontSize: 14, color: "#475569", fontWeight: 400, marginLeft: 4 }}>/{shadowArmy.capacity}</span></div>
                  {namedShadows.length > 0 && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>★ {namedShadows.length} Named Shadow{namedShadows.length > 1 ? "s" : ""}</div>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[{ label: "Deployed", value: shadowArmy.shadows.filter(s => s.isDeployed).length, color: "#22c55e" }, { label: "Dungeon", value: `+${formationBonus.dungeonBonus}%`, color: "#ef4444" }, { label: "XP Bonus", value: `+${Math.round(formationBonus.xpBonus * 100)}%`, color: "#a78bfa" }].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'Cinzel',serif" }}>{value}</div>
                      <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Capacity bar */}
              <div style={{ height: 4, background: "#0a0a14", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(totalShadows / shadowArmy.capacity) * 100}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#7c3aed88,#a78bfa)", transition: "width 0.6s ease" }} />
              </div>
              {/* Sub nav */}
              <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                {[{ key: "army", label: "Armee", icon: "🌑" }, { key: "formation", label: "Formation", icon: "⚔️" }, { key: "named", label: "Named", icon: "★" }].map(sv => (
                  <button key={sv.key} onClick={() => setShadowSubView(sv.key)} style={{ flex: 1, padding: "7px 4px", borderRadius: 9, fontSize: 10, fontWeight: 700, background: shadowSubView === sv.key ? "#7c3aed22" : "transparent", color: shadowSubView === sv.key ? "#a78bfa" : "#475569", border: `1px solid ${shadowSubView === sv.key ? "#7c3aed44" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s" }}>
                    <span>{sv.icon}</span><span>{sv.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ARMY sub-view */}
            {shadowSubView === "army" && (
              totalShadows === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", background: theme.card, borderRadius: 16, border: "1px dashed #7c3aed22", backdropFilter: "blur(8px)" }}>
                  <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.3, animation: "float 3s ease-in-out infinite" }}>🌑</div>
                  <div style={{ fontSize: 15, color: "#475569", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>Keine Schatten erweckt</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>Schließe <span style={{ color: "#ef4444" }}>Boss-Quests</span> ab um Schatten zu beschwören</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {shadowArmy.shadows.map((s, i) => <ShadowCard key={s.id} shadow={s} theme={theme} index={i} onClick={() => setSelectedShadow(s)} />)}
                </div>
              )
            )}

            {/* FORMATION sub-view */}
            {shadowSubView === "formation" && (
              <FormationEditor shadowArmy={shadowArmy} theme={theme} onDeploy={deployShadow} onUndeploy={undeployShadow} formationBonus={formationBonus} />
            )}

            {/* NAMED sub-view */}
            {shadowSubView === "named" && (
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 14 }}>NAMED SHADOWS – FREISCHALTBAR</div>
                {Object.values(NAMED_SHADOWS).map((ns, i) => {
                  const isOwned = shadowArmy.shadows.some(s => s.namedId === ns.id || s.id === ns.id);
                  const cls = SHADOW_CLASSES[ns.class] || SHADOW_CLASSES.soldier;
                  const tierData = SHADOW_TIERS[ns.tier] || SHADOW_TIERS[4];
                  return (
                    <div key={ns.id} style={{ background: isOwned ? "rgba(8,8,20,0.9)" : theme.card, border: `1px solid ${isOwned ? ns.glowColor + "44" : "#1e2940"}`, borderRadius: 16, padding: "16px", marginBottom: 10, opacity: isOwned ? 1 : 0.65, animation: `cardEnter 0.4s ease ${i * 0.08}s both`, boxShadow: isOwned ? `0 0 16px ${ns.glowColor}18` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: isOwned ? ns.glowColor + "18" : "rgba(255,255,255,0.03)", border: `2px solid ${isOwned ? ns.glowColor + "66" : "#1e2940"}`, fontSize: 28 }}>
                          {isOwned ? ns.icon : <span style={{ opacity: 0.2 }}>?</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: isOwned ? ns.glowColor : "#475569", fontFamily: "'Cinzel',serif" }}>{isOwned ? ns.name : "???"}</div>
                          <div style={{ fontSize: 10, color: isOwned ? ns.glowColor + "99" : "#334155", fontFamily: "'Cinzel',serif", letterSpacing: 1, marginTop: 2 }}>{isOwned ? ns.title : "Unbekannt"}</div>
                          <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: cls.color + "15" }}>{cls.icon} {ns.class.toUpperCase()}</span>
                            <span style={{ fontSize: 9, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: tierData.color + "15" }}>TIER {ns.tier}</span>
                          </div>
                        </div>
                        {isOwned && <div style={{ fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", padding: "3px 8px", borderRadius: 6, background: "#22c55e12", border: "1px solid #22c55e33" }}>OWNED</div>}
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>FREISCHALTBEDINGUNG</div>
                        <div style={{ fontSize: 11, color: isOwned ? "#22c55e" : "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                          {isOwned ? <span>✓</span> : <span style={{ opacity: 0.5 }}>○</span>}
                          {ns.unlockCondition.desc}
                        </div>
                      </div>
                      {isOwned && ns.uniqueAbility && (
                        <div style={{ background: `${ns.glowColor}0a`, border: `1px solid ${ns.glowColor}22`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>UNIQUE ABILITY</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 18 }}>{ns.uniqueAbility.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: ns.glowColor, fontFamily: "'Cinzel',serif" }}>{ns.uniqueAbility.name}</div>
                              <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{ns.uniqueAbility.effect}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {isOwned && <div style={{ fontStyle: "italic", fontSize: 11, color: "#475569", lineHeight: 1.6, borderLeft: `2px solid ${ns.glowColor}33`, paddingLeft: 10 }}>"{ns.lore}"</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ STORY ═══ */}
        {view === "story" && state && (
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

                notify(`📖 Kapitel "${chapter.title}" abgeschlossen! +${xpGain} XP`, "levelup");

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
          />
        )}

        {/* ═══ JOBS ═══ */}
        {view === "jobs" && state && (
          <JobsView
            state={state}
            onSwitch={switchJob}
            onActivate={activateJobAbility}
            theme={theme}
          />
        )}

        {/* ═══ EQUIPMENT ═══ */}
        {view === "equipment" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "18px", marginBottom: 16, backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>AUSGERÜSTET</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ slot: "weapon", label: "WAFFE", icon: "🗡️" }, { slot: "armor", label: "RÜSTUNG", icon: "🛡️" }, { slot: "ring1", label: "RING 1", icon: "💍" }, { slot: "ring2", label: "RING 2", icon: "💍" }].map(({ slot, label, icon }) => {
                  const equipped = state.equipment?.slots?.[slot];
                  return (
                    <div key={slot} style={{ background: equipped ? `linear-gradient(135deg,${RARITY_COLORS[equipped.rarity]}10,transparent)` : theme.surface, border: `1px solid ${equipped ? RARITY_COLORS[equipped.rarity] + "33" : theme.primary + "12"}`, borderRadius: 12, padding: "12px", minHeight: 90 }}>
                      <div style={{ fontSize: 8, letterSpacing: 2, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{label}</div>
                      {equipped ? (
                        <div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 22 }}>{equipped.icon}</span><div><div style={{ fontSize: 12, fontWeight: 700, color: RARITY_COLORS[equipped.rarity], fontFamily: "'Cinzel',serif" }}>{equipped.name}</div><div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{equipped.desc}</div></div></div>
                          <button onClick={() => unequipItem(slot)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace" }}>ABLEGEN</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, opacity: 0.2 }}>
                          <span style={{ fontSize: 28 }}>{icon}</span>
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
                <div style={{ fontSize: 32, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>🗡️</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Kein Equipment</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Bezwinge Dungeons für Item-Drops (40% Chance)</div>
              </div>
            ) : (state.equipment?.inventory || []).map((item, i) => {
              const rc = RARITY_COLORS[item.rarity];
              const isEquipped = Object.values(state.equipment?.slots || {}).some(e => e?.instanceId === item.instanceId);
              return (
                <div key={item.instanceId} style={{ background: theme.card, border: `1px solid ${rc}22`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${i * 0.05}s both` }}>
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
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
        )}

        {/* ═══ ACHIEVEMENTS ═══ */}
        {view === "achievements" && (
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
            {["quests", "dungeons", "story", "streaks", "stats", "shadows", "misc"].map(cat => {
              const catAchs = ACHIEVEMENTS.filter(a => a.cat === cat);
              const catLabels = { quests: "⚔️ Quests", dungeons: "🌀 Dungeons", story: "📖 Story", streaks: "🔥 Streaks", stats: "📊 Stats", shadows: "🌑 Army", misc: "🎲 Sonstiges" };
              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>{catLabels[cat]}</div>
                  {catAchs.map((ach, i) => {
                    const unlocked = achUnlocked.includes(ach.id);
                    return (
                      <div key={ach.id} style={{ background: theme.card, border: `1px solid ${unlocked ? "#f59e0b22" : theme.primary + "12"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, opacity: unlocked ? 1 : 0.45, backdropFilter: "blur(8px)", animation: `cardEnter 0.4s ease ${i * 0.06}s both` }}>
                        <span style={{ fontSize: 24, filter: unlocked ? "none" : "grayscale(100%)" }}>{ach.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#fde68a" : "#475569", fontFamily: "'Cinzel',serif" }}>{ach.name}</div>
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{ach.desc}</div>
                          {unlocked && ach.reward.title && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>🏷 "{ach.reward.title}" freigeschaltet</div>}
                        </div>
                        {unlocked ? <div style={{ fontSize: 12, color: "#f59e0b" }}>✓</div> : <div style={{ textAlign: "right", fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}><div>+{ach.reward.xp} XP</div><div>{ach.reward.gold > 0 ? `+${ach.reward.gold}G` : ""}</div></div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ SHOP ═══ */}
        {view === "shop" && (
          <div style={{ animation: "fadeIn 0.35s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>SYSTEM SHOP</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Kaufe Titel und Themes</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "#fbbf2412", border: "1px solid #fbbf2422" }}>
                <span style={{ fontSize: 16 }}>💰</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>{state.gold.toLocaleString()}</span>
              </div>
            </div>
            {!shopUnlocked && <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid #ef444422", borderRadius: 14, padding: "16px", marginBottom: 16, textAlign: "center", fontSize: 12, color: "#ef4444" }}>⚠ Shop ab D-Rang verfügbar</div>}
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
          </div>
        )}

        {/* ═══ ANALYTICS ═══ */}
        {view === "analytics" && (
          <AnalyticsDashboard state={state} theme={theme} />
        )}

        {/* ═══ GOALS ═══ */}
        {view === "goals" && (
          <GoalFramework state={state} persist={persist} notify={notify} theme={theme} />
        )}

        {/* ═══ CALENDAR ═══ */}
        {view === "calendar" && (
          <CalendarSchedule state={state} persist={persist} notify={notify} theme={theme} />
        )}

        {/* ═══ CHALLENGES ═══ */}
        {view === "challenges" && (
          <ChallengesSystem state={state} persist={persist} notify={notify} theme={theme} />
        )}

        {/* ═══ HEALTH SYNC ═══ */}
        {view === "health" && (
          <HealthIntegration state={state} persist={persist} notify={notify} theme={theme} />
        )}

        {/* ═══ SETTINGS ═══ */}
        {view === "settings" && (
          <SettingsView state={state} persist={persist} theme={theme} />
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: `linear-gradient(to top, rgba(6,6,16,0.98), rgba(10,10,26,0.85))`, borderTop: `1px solid ${penaltyActive ? "#ef444455" : theme.primary + "44"}`, backdropFilter: "blur(24px)", boxShadow: `0 -4px 32px ${theme.glow}` }}>
        <div style={{ display: "flex", justifyContent: "center", maxWidth: 540, margin: "0 auto", padding: "0 4px" }}>
          {[{ key: "dashboard", icon: "📋", label: "Heute" }, { key: "training", icon: "🎯", label: "Ziele" }, { key: "dungeon", icon: "🌀", label: "Gates", badge: activeDungeons.length }, { key: "shadows", icon: "🌑", label: "Army", badge: namedShadows.length > 0 ? namedShadows.length : 0 }, { key: "system", icon: "⚙️", label: "System" }].map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)} style={{ flex: 1, padding: "12px 0 10px", background: "transparent", color: view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "story", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "health", "settings", "more"].includes(view)) ? theme.accent : "#475569", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", transition: "all 0.3s" }}>
              {(view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "story", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "health", "settings", "more"].includes(view))) && <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 3, background: `linear-gradient(90deg,transparent,${theme.accent},transparent)`, borderRadius: "0 0 4px 4px", boxShadow: `0 2px 12px ${theme.accent}, 0 0 20px ${theme.glow}` }} />}
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 18, transition: "all 0.3s", transform: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "story", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "health", "settings", "more"].includes(view))) ? "scale(1.2) translateY(-2px)" : "scale(1)", display: "block", filter: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "story", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "health", "settings", "more"].includes(view))) ? `drop-shadow(0 0 8px ${theme.glow})` : "grayscale(0.6)" }}>{tab.icon}</span>
                {tab.badge > 0 && <div style={{ position: "absolute", top: -6, right: -8, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#fff", fontFamily: "'JetBrains Mono',monospace", border: "2px solid #000", animation: "pulse 2s infinite" }}>{tab.badge}</div>}
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, fontFamily: "'Outfit',sans-serif", opacity: (view === tab.key || (tab.key === "training" && ["goals", "calendar"].includes(view)) || (tab.key === "system" && ["stats", "story", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "health", "settings", "more"].includes(view))) ? 1 : 0.6 }}>{tab.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* TRAINING HUB — unified view for habits/goals/calendar */}
      {view === "training" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "fadeIn 0.25s ease", padding: "16px", paddingTop: 140, paddingBottom: 110, overflowY: "auto" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* Training header */}
            <div style={{ background: theme.card, border: `1px solid ${theme.primary}18`, borderRadius: 18, padding: "18px 20px", marginBottom: 16, backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: `radial-gradient(circle at 100% 30%, ${theme.primary}0c, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 9, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>PATH OF THE HUNTER</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1.2 }}>Ziele & Fortschritt</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Langzeit-Ziele und Quest-Kalender</div>
            </div>

            {/* Training modules combined */}
            <div style={{ marginBottom: 32 }}>
              <GoalFramework state={state} persist={persist} notify={notify} theme={theme} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
              <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>TÄGLICHES TRAINING</div>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <HabitTracker state={state} persist={persist} notify={notify} theme={theme} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55)` }} />
              <div style={{ fontSize: 10, letterSpacing: 4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>HUNTER QUESTS</div>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,transparent,${theme.primary}55)` }} />
            </div>

            {filteredQuests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: theme.card, borderRadius: 14, border: `1px dashed ${theme.primary}15`, backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 36, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>⚔️</div>
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>Keine aktiven Quests</div>
                <div style={{ fontSize: 11, color: "#334155" }}>Erstelle Quests auf dem Heute-Tab.</div>
              </div>
            ) : filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onEdit={startEditingQuest} onDelete={deleteQuest} />)}
          </div>
        </div>
      )}

      {/* SYSTEM MENU — themed module hub */}
      {view === "system" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 45, background: theme.bg, animation: "fadeIn 0.25s ease", padding: "16px", paddingTop: 140, paddingBottom: 110, overflowY: "auto" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            {/* System header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 5, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, animation: "pulse 3s infinite" }}>&gt; SYSTEM INTERFACE ACTIVE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>System</div>
              <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`, margin: "10px auto 0" }} />
            </div>

            {/* HUNTER PROFILE SECTION */}
            {[{
              title: "HUNTER INTEL", icon: "📊", color: theme.accent,
              items: [
                { key: "stats", icon: "📊", label: "Hunter Stats", desc: "Stats & Skills", badge: state.statPoints > 0 ? state.statPoints : 0 },
                { key: "analytics", icon: "📈", label: "Analytics", desc: "Fortschritt & Trends" },
                { key: "achievements", icon: "🏆", label: "Achievements", desc: `${achUnlocked.length}/${ACHIEVEMENTS.length} freigeschaltet`, badge: ACHIEVEMENTS.filter(a => !achUnlocked.includes(a.id) && a.check(state)).length },
                { key: "challenges", icon: "🎖️", label: "Events", desc: "Challenges & Missionen" },
              ]
            }, {
              title: "ARSENAL", icon: "🗡️", color: "#f59e0b",
              items: [
                { key: "equipment", icon: "🗡️", label: "Equipment", desc: "Waffen & Rüstung", badge: (state.equipment?.inventory || []).length > 0 && !Object.values(state.equipment?.slots || {}).every(Boolean) ? 1 : 0 },
                { key: "jobs", icon: "🎭", label: "Jobs", desc: "Hunter-Klassen" },
                { key: "shop", icon: "🛒", label: "Shop", desc: `${state.gold.toLocaleString()} Gold` },
              ]
            }, {
              title: "LORE", icon: "📖", color: "#a855f7",
              items: [
                { key: "story", icon: "📖", label: "Story", desc: "Die Geschichte des Hunters" },
              ]
            }, {
              title: "SYSTEM", icon: "⚙️", color: "#64748b",
              items: [
                { key: "health", icon: "❤️", label: "Health Sync", desc: "Gesundheitstracker" },
                { key: "settings", icon: "⚙️", label: "Einstellungen", desc: "Theme, Export & mehr" },
              ]
            }].map((section, si) => (
              <div key={section.title} style={{ marginBottom: 20, animation: `slideUp 0.3s ease ${si * 0.08}s both` }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: section.color, boxShadow: `0 0 8px ${section.color}44` }} />
                  <span style={{ fontSize: 10, letterSpacing: 3, color: section.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{section.icon} {section.title}</span>
                </div>
                {/* Section items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {section.items.map((item, ii) => (
                    <button key={item.key} onClick={() => setView(item.key)} style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14,
                      background: theme.card, border: `1px solid ${section.color}15`,
                      display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                      transition: "all 0.2s", cursor: "pointer", backdropFilter: "blur(8px)",
                      animation: `cardEnter 0.3s ease ${(si * 0.08) + (ii * 0.04)}s both`
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = section.color + "44"; e.currentTarget.style.transform = "translateX(4px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = section.color + "15"; e.currentTarget.style.transform = "none"; }}
                    >
                      <div style={{ fontSize: 20, position: "relative", flexShrink: 0 }}>
                        {item.icon}
                        {item.badge > 0 && <div style={{ position: "absolute", top: -4, right: -6, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #000" }}>{item.badge}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{item.label}</div>
                        <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#334155", opacity: 0.5 }}>›</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Multiplayer Portal */}
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
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b44", fontSize: 22, flexShrink: 0 }}>🌐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fcd34d", fontFamily: "'Cinzel',serif" }}>Hunter Association</div>
                  <div style={{ fontSize: 9, color: "#92400e", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>Multiplayer Portal betreten</div>
                </div>
                <div style={{ fontSize: 14, color: "#f59e0b", animation: "pulse 2s infinite" }}>⟶</div>
              </button>
            </div>

            {/* Version footer */}
            <div style={{ textAlign: "center", padding: "12px 0", fontSize: 9, color: "#1e293b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>
              ARISE SYSTEM v1.3.7
            </div>
          </div>
        </div>
      )}

      {/* QUEST CREATE MODAL */}
      {showCreate && (
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
                  >🎲</button>
                  <button onClick={() => { setShowCreate(false); setShowTemplates(false); }} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444444"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>&#x2715;</button>
                </div>
              </div>
              {/* Mode tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {[{ key: false, label: "✏️ Erstellen" }, { key: true, label: "💡 Ideen-Bibliothek" }].map(tab => (
                  <button key={String(tab.key)} onClick={() => setShowTemplates(tab.key)} style={{ flex: 1, padding: "8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: showTemplates === tab.key ? theme.primary + "22" : "transparent", color: showTemplates === tab.key ? theme.accent : "#475569", border: `1px solid ${showTemplates === tab.key ? theme.primary + "55" : "#1e2940"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, transition: "all 0.25s", cursor: "pointer" }}>{tab.label}</button>
                ))}
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${theme.primary}55,transparent)` }} />
            </div>

            {/* Scrollable Content */}
            <div style={{ overflowY: "auto", padding: "0 24px", flex: 1 }}>

              {/* ══ IDEEN-BIBLIOTHEK ══ */}
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
                    {[{ key: "all", label: "Alle", color: theme.accent }, ...CATEGORIES.map(c => ({ key: c.key, label: `${c.icon} ${c.stat}`, color: c.color }))].map(f => (
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
                            <span style={{ fontSize: 8, color: cat.color, padding: "1px 5px", borderRadius: 4, background: cat.color + "15", fontFamily: "'JetBrains Mono',monospace" }}>{cat.icon}{cat.stat}</span>
                            <span style={{ fontSize: 8, color: diff.color, padding: "1px 5px", borderRadius: 4, background: diff.color + "15", fontFamily: "'JetBrains Mono',monospace" }}>{diff.icon}{diff.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ ERSTELLEN-MODUS ══ */}
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
                      { key: "side", icon: "📋", label: "Side Quest", color: "#a78bfa", desc: "Kein Zeitlimit" },
                      { key: "daily", icon: "📅", label: "Daily Quest", color: "#22d3ee", desc: "Täglich zurückgesetzt" },
                      { key: "weekly", icon: "📆", label: "Weekly Quest", color: "#8b5cf6", desc: "2× XP & Gold" },
                      { key: "chained", icon: "⛓️", label: "Chained Quest", color: "#f59e0b", desc: "3 Schritte · +25% je" },
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
                          <span style={{ fontSize: 13 }}>{t.icon} {t.label}</span>
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
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{d.icon}</span>
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
                    {CATEGORIES.map(c => { const active = qCat === c.key; return (<button key={c.key} onClick={() => setQCat(c.key)} style={{ padding: "11px 6px", borderRadius: 14, fontSize: 12, background: active ? `linear-gradient(135deg,${c.color}22,${c.color}0d)` : "rgba(12,12,26,0.6)", color: active ? c.color : "#475569", border: `1px solid ${active ? c.color + "55" : "#1e2940"}`, transition: "all 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: active ? `0 4px 12px ${c.color}33, inset 0 1px 0 rgba(255,255,255,0.05)` : "none", cursor: "pointer" }} onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = c.color + "44"; e.currentTarget.style.color = c.color + "cc"; } }} onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#1e2940"; e.currentTarget.style.color = "#475569"; } }}>  <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span><span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>{c.stat}</span><span style={{ fontSize: 9, opacity: active ? 0.8 : 0.4, fontFamily: "'Outfit',sans-serif", textAlign: "center", lineHeight: 1.2 }}>{c.label}</span></button>); })}
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
                          <div style={{ fontSize: 12, color: diff.color, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{diff.icon} {diff.label}</div>
                        </div>
                        <div style={{ width: 1, height: 28, background: "#1e2940", margin: "0 8px" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>BELOHNUNG</div>
                          <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", display: "flex", gap: 6, justifyContent: "center" }}>
                            <span style={{ color: "#67e8f9" }}>+{baseXp} XP</span>
                            <span style={{ color: "#fbbf24" }}>+{baseGold}G</span>
                          </div>
                        </div>
                        <div style={{ width: 1, height: 28, background: "#1e2940", margin: "0 8px" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>KATEGORIE</div>
                          <div style={{ fontSize: 12, color: cat.color, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{cat.icon} {cat.stat}</div>
                        </div>
                      </div>
                      {qDiff === "boss" && <div style={{ marginTop: 10, padding: "5px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid #ef444433", fontSize: 10, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", textAlign: "center", animation: "pulse 2s infinite" }}>⚠ 🌑 SCHATTEN BESCHWÖRUNGSCHANCE</div>}
                      {qType === "chained" && <div style={{ marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.06)", borderRadius: 8, border: "1px solid #f59e0b22", fontSize: 10, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>⛓️ 3-Schritte Kette · +25% XP pro Schritt</div>}
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
    </div >
  );
}

// ─── SETUP ────────────────────────────────────────────────────
function SetupScreen({ onFinish, theme }) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState(0);
  useEffect(() => { const t1 = setTimeout(() => setPhase(1), 600); const t2 = setTimeout(() => setPhase(2), 1400); const t3 = setTimeout(() => setPhase(3), 2200); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#060610", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes glow{0%,100%{text-shadow:0 0 20px #7c3aed88}50%{text-shadow:0 0 40px #7c3aed,0 0 80px #a78bfa}}@keyframes bGlow{0%,100%{border-color:#4f6ef744}50%{border-color:#4f6ef788}}button{cursor:pointer;border:none;font-family:inherit}input{font-family:inherit}`}</style>
      <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: "float 3s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(124,58,237,0.6))" }}>⚔️</div>
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

