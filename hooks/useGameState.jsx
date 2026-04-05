
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { QUEST_POOL } from "../data/questPool.js";
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, getJobBonuses,
  saveState, loadState, migrateState, calculateLevelUp, awardJobXp
} from '../data/constants';

export function useGameState(initialHunterName, onLogout) {
  const [state, setState] = useState(null);
  const stateRef = useRef(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [showCreate, setShowCreate] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [systemMessage, setSystemMessage] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [questFilter, setQuestFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [xpFloats, setXpFloats] = useState([]);
  const [prevRank, setPrevRank] = useState(null);
  const [activeDungeon, setActiveDungeon] = useState(null);
  const [achQueue, setAchQueue] = useState([]);
  const [ariseTarget, setAriseTarget] = useState(null);  // Now a shadow object
  const [selectedShadow, setSelectedShadow] = useState(null);
  const [shadowSubView, setShadowSubView] = useState("army"); // army | formation | named
  const [qTitle, setQTitle] = useState("");
  const [qDiff, setQDiff] = useState("normal");
  const [qCat, setQCat] = useState("agi");
  const [qType, setQType] = useState("side");
  const [qSyncHabit, setQSyncHabit] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [showHiddenQuestModal, setShowHiddenQuestModal] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [randomizing, setRandomizing] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem("soloMusicPlaying") !== "false");
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [portalTransitioning, setPortalTransitioning] = useState(false);

  const notify = useCallback((msg, type = "info") => setNotifications(prev => [...prev, { id: genId(), msg, type }]), []);
  const persist = useCallback(s => {
    setState(s);
    saveState(s);
  }, []);

  // Real-time Cloud Sync
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    console.log("System: Cloud-Synchronisierung aktiviert für", user.uid);
    const docRef = doc(db, "users", user.uid);

    // Listen for remote changes (e.g., from other devices)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = migrateState(docSnap.data());

        // Only update local state if cloud data has more XP or different level
        setState(prev => {
          if (!prev) return cloudData;

          const isNewer = (cloudData.totalXpEarned || 0) > (prev.totalXpEarned || 0) ||
            (cloudData.level || 0) > (prev.level || 0);

          if (isNewer) {
            console.log("System: Cloud-Daten synchronisiert.");
            notify("Online-Daten synchronisiert!", "success");
            return cloudData;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [notify]);
  const triggerSystemMessage = useCallback((title, lines, onComplete) => {
    setSystemMessage({ title, lines, onComplete });
  }, []);

  useEffect(() => {
    console.log("System Initialisierung gestartet...");
    loadState().then(({ data: s, source }) => {
      try {
        const user = auth.currentUser;
        if (s) {
          const today = getToday();

          // If we loaded from LocalStorage but there's a logged-in user,
          // check if we should reset the tutorial for a "Fresh Cloud Start"
          if (source === "local" && user) {
            if (s.tutorialCompleted) {
              console.log("System: Local tutorial detected. Resetting for new Cloud Hunter.");
              s.tutorialCompleted = false;
            }
          }

          if (s.lastActiveDate && s.lastActiveDate !== today) {
            const diff = Math.floor((new Date(today) - new Date(s.lastActiveDate)) / 86400000);
            if (diff > 1) {
              s.streak = 0;
              const hadDailies = s.quests?.some(q => q.type === "daily" && !q.completed);
              if (diff >= 2 && hadDailies && !s.penaltyZone?.active) {
                s.penaltyZone = { active: true, redemptionLeft: 3, questsCompletedInPenalty: 0 };
              }
            }
            s.quests = s.quests?.map(q => q.type === "daily" && !q.isSystem ? { ...q, completed: false } : q) || [];
            s.quests = (s.quests || []).filter(q => !q.isSystem);
            const newSysQuests = generateDailySystemQuests(3);
            s.quests = [...s.quests, ...newSysQuests];
            s.emergencyQuest = null;
            s.emergencyDone = false;
            s.emergencyFailed = false;
            const dayOfWeek = new Date().getDay();
            if (dayOfWeek === 1) {
              s.quests = (s.quests || []).filter(q => q.type !== "weekly");
              s.weeklyQuestReset = today;
            }
            s.dailyUserQuestsCreated = 0;
            s.extraDailySlots = 0;
          }
          s.lastActiveDate = today;
          if (!s.emergencyQuest || !s.emergencyQuest.id.endsWith(today)) {
            s.emergencyQuest = generateEmergencyQuest(s.level || 1);
            s.emergencyDone = false;
            s.emergencyFailed = false;
            setTimeout(() => {
              triggerSystemMessage("NOTFALL-MISSION ENTDECKT", [
                "ACHTUNG: Eine temporale Anomalie wurde registriert.",
                `Mission: ${s.emergencyQuest.title}`,
                "Die Belohnungen für diese Aufgabe wurden verdoppelt.",
                "Versagen wird nicht toleriert."
              ]);
            }, 2500);
          }
          if (!s.hiddenQuests) s.hiddenQuests = { discovered: [], completed: [] };
          if (!s.lastDungeonRefresh || s.lastDungeonRefresh !== today) {
            s.dungeons = generateDungeons(getRank(s.level || 1).name);
            s.lastDungeonRefresh = today;
            s.todayModifier = getDailyModifier();
          }
          if (s.lastWelcomeDate !== today) {
            setTimeout(() => {
              const activeDailies = (s.quests || []).filter(q => q.type === "daily" && !q.completed);
              const urgentMsg = (s.emergencyQuest && !s.emergencyDone && !s.emergencyFailed) ? "⚠️ NOTFALL-MISSION AKTIV" : "Ihre Aufgaben warten.";
              triggerSystemMessage("STATUS-CHECK", [
                `Willkommen zurück, Hunter ${stateRef.current?.hunterName || s.hunterName || "Unbekannt"}.`,
                `Aktive Tages-Quests: ${activeDailies.length}`,
                urgentMsg
              ]);
              persist({ ...s, lastWelcomeDate: today });
            }, 1500);
          }
          if (s.statPoints === undefined) s.statPoints = 0;
          if (!s.hunterName && initialHunterName) {
            s.hunterName = initialHunterName;
          }
          setState(s);
          if (!s.hunterName) setShowSetup(true);

          // If we loaded from local, save to cloud now that we have a user
          if (source === "local" && user) {
            saveState(s);
          }
        } else {
          const startState = { ...DEFAULT_STATE };
          if (initialHunterName) {
            startState.hunterName = initialHunterName;
            setShowSetup(false);
          } else {
            setShowSetup(true);
          }
          setState(startState);
          setTimeout(() => saveState(startState), 500);
        }
      } catch (err) {
        console.error("Fehler bei der System-Initialisierung:", err);
      } finally {
        setLoading(false);
      }
    });
  }, [initialHunterName, triggerSystemMessage]);

  const assignRandomTask = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState || loading) return;
    const TASK_INTERVAL = 3 * 3600 * 1000; // 3 hours
    const now = Date.now();
    const lastTime = currentState.lastSystemTaskTime || 0;

    if (now - lastTime >= TASK_INTERVAL) {
      // Find tasks in QUEST_POOL not currently in state.quests and not in completedQuests
      const availablePool = QUEST_POOL.filter(q =>
        !currentState.quests.some(sq => sq.title === q.title) &&
        !(currentState.completedQuests || []).some(cq => cq.title === q.title)
      );

      if (availablePool.length > 0) {
        const randTask = availablePool[Math.floor(Math.random() * availablePool.length)];
        const newQuest = {
          id: genId(), title: randTask.title, difficulty: randTask.difficulty || "normal",
          category: randTask.category || "str", desc: randTask.desc || "",
          type: "side", createdAt: getToday(),
          xpMult: 1, goldMult: 1, isSystem: true
        };

        triggerSystemMessage("NEUE AUFGABE", [
          "Das System hat Ihnen eine neue Zufalls-Aufgabe zugewiesen:",
          `"${randTask.title}"`,
          "Schließen Sie diese zeitnah ab, Hunter."
        ]);

        persist({
          ...currentState,
          lastSystemTaskTime: now,
          quests: [...currentState.quests, newQuest]
        });
        notify("Neue Aufgabe aus dem Pool erhalten!", "info");
      } else {
        // If pool exhausted, just update time or do nothing
        persist({ ...currentState, lastSystemTaskTime: now });
      }
    }
  }, [persist, triggerSystemMessage, notify, loading]);

  // --- 3 HOURS TASK ASSIGNMENT ---
  useEffect(() => {
    if (loading) return;
    // Initial check on load
    assignRandomTask();
    // Then every hour check if it's time for a new task
    const intervalId = setInterval(assignRandomTask, 3600000);
    return () => clearInterval(intervalId);
  }, [loading, assignRandomTask]);

  const removeNotif = useCallback(id => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  const processAchievements = useCallback(nextState => {
    const newAchs = checkAchievements(nextState);
    if (!newAchs.length) return nextState;
    const unlocked = [...(nextState.achievements?.unlocked || []), ...newAchs.map(a => a.id)];
    let xpBonus = 0, goldBonus = 0;
    newAchs.forEach(a => { xpBonus += a.reward.xp || 0; goldBonus += a.reward.gold || 0; });
    setAchQueue(prev => [...prev, ...newAchs]);
    return calculateLevelUp({
      ...nextState,
      gold: nextState.gold + goldBonus,
      totalGoldEarned: (nextState.totalGoldEarned || 0) + goldBonus,
      achievements: { ...nextState.achievements, unlocked }
    }, xpBonus);
  }, []);

  const computeXpGain = useCallback((quest, streakBonus, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses = {}) => {
    const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
    let xp = diff.xp;
    xp *= (1 + streakBonus / 100);
    xp *= (1 + (equipBonuses.xpBonus || 0));
    xp *= (1 + (skillBonuses.xpCatBonus?.[quest.category] || 0));
    xp *= (1 + (jobBonuses.xpCatBonus?.[quest.category] || 0));
    if (quest.difficulty === "hard" || quest.difficulty === "boss") xp *= (1 + (skillBonuses.xpHardBonus || 0));
    xp *= (1 + (skillBonuses.xpGlobal || 0));
    xp *= (1 + (jobBonuses.xpGlobal || 0));
    xp *= (1 + (formBonus?.xpBonus || 0));
    if (penaltyActive) xp *= 0.8;
    // Job multi
    xp *= (jobBonuses.xpGlobalMultiplier || 1.0);
    // Sprint 2: type multiplier + chain multiplier
    const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
    xp *= (typeCfg.xpMult || 1);
    xp *= (quest.chainMultiplier || 1);
    return Math.round(xp);
  }, []);

  const completeQuest = useCallback((questId, rect) => {
    if (!state) return;
    const quest = state.quests.find(q => q.id === questId); if (!quest) return;

    // Check wait time for manual quests
    if (!quest.isSystem && quest.createdAtMs) {
      const waitHours = DIFFICULTIES.find(d => d.key === quest.difficulty)?.waitHours || 1;
      const elapsedMs = Date.now() - quest.createdAtMs;
      const requiredMs = waitHours * 3600 * 1000;
      if (elapsedMs < requiredMs) {
        const remainingHours = ((requiredMs - elapsedMs) / 3600000).toFixed(1);
        notify(`Diese Quest muss noch reifen! Warte noch ${remainingHours}h.`, "warning");
        return;
      }
    }

    const today = getToday();
    const oldStreak = state.streak;
    const newStreak = state.lastActiveDate === today ? oldStreak : (oldStreak + 1);
    const streakBonusPct = Math.min(newStreak, 5) * 10;
    const equipBonuses = getEquipBonuses(state.equipment);
    const skillBonuses = getSkillBonuses(null, state.stats);
    const jobBonuses = getJobBonuses(state);
    const formBonus = calcFormationBonus(state.shadowArmy, jobBonuses.allShadowsActive);
    const penaltyActive = state.penaltyZone?.active;
    const xpGain = computeXpGain(quest, streakBonusPct, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses);
    const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
    const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
    let goldMult = (1 + (equipBonuses.goldBonus || 0) + (skillBonuses.goldBonus || 0) + (formBonus?.goldBonus || 0)) * (typeCfg.goldMult || 1) * (quest.chainMultiplier || 1);
    const goldGain = Math.round(diff.gold * goldMult);
    if (rect) setXpFloats(prev => [...prev, { id: genId(), x: rect.x - 20, y: rect.y, xp: xpGain, gold: goldGain }]);
    setTimeout(() => setXpFloats(prev => prev.slice(1)), 1400);
    const oldRank = getRank(state.level);
    let next = calculateLevelUp(state, xpGain);
    const didLevelUp = next._didLevelUp;
    const earnedPoints = next._levelsGained;
    // Job XP calculation
    next = awardJobXp({ ...next, gold: state.gold + goldGain, totalGoldEarned: (state.totalGoldEarned || 0) + goldGain }, "quest_complete", {
      category: quest.category,
      difficulty: quest.difficulty
    });

    if (next._jobLevelUp) {
      notify(`JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} ist nun Level ${next._jobLevelUp.newLevel}!`, "levelup");
      delete next._jobLevelUp;
    }

    // Shadow ARISE for boss quests
    let newShadowArmy = { ...next.shadowArmy };
    let ariseData = null;
    if (quest.difficulty === "boss") {
      const newShadow = createShadowFromQuest(quest, newLevel);
      newShadowArmy = { ...newShadowArmy, shadows: [...(newShadowArmy.shadows || []), newShadow] };
      ariseData = newShadow;
      notify(`${quest.title} wurde zu einem ${SHADOW_CLASSES[newShadow.class].name}!`, "shadow");
    }
    // Penalty update
    let newPenalty = { ...state.penaltyZone };
    if (newPenalty.active) {
      newPenalty.questsCompletedInPenalty = (newPenalty.questsCompletedInPenalty || 0) + 1;
      const needed = newPenalty.redemptionLeft || 3;
      if (newPenalty.questsCompletedInPenalty >= needed) { newPenalty.active = false; notify("Strafe abgebüßt. Willkommen zurück, Hunter.", "success"); }
    }
    // Handle chained quest: on complete, spawn next step or finish chain
    let extraQuests = [];
    if (quest.type === "chained" && quest.chainStep < quest.chainTotal) {
      const nextStep = generateChainedQuest(quest.title, quest.category, quest.difficulty, quest.chainStep + 1, quest.chainTotal);
      extraQuests = [nextStep];
      notify(`⛓️ Kette ${quest.chainStep}/${quest.chainTotal} erfüllt! Multiplikator: x${nextStep.chainMultiplier.toFixed(2)}`, "info");
    } else if (quest.type === "chained" && quest.chainStep >= quest.chainTotal) {
      notify("⛓️ QUEST-KETTE ABGESCHLOSSEN! Maximaler Multiplikator erreicht!", "gold");
    }
    // Handle hidden quest completion
    let newHiddenQuests = { ...state.hiddenQuests };
    if (quest.type === "hidden") {
      newHiddenQuests = {
        discovered: (newHiddenQuests.discovered || []).filter(id => id !== quest.hiddenId),
        completed: [...(newHiddenQuests.completed || []), quest.hiddenId || quest.id]
      };
      notify("🌟 Verborgene Quest erfüllt! Legendäre Belohnung erhalten!", "named");
    }
    const updatedQuests = [
      ...(quest.type === "daily" ? state.quests.map(q => q.id === questId ? { ...q, completed: true } : q) : state.quests.filter(q => q.id !== questId)),
      ...extraQuests
    ];

    let newHabits = state.habits;
    if (quest.linkedHabitId && state.habits) {
      newHabits = state.habits.map(h => {
        if (h.id === quest.linkedHabitId && !h.history?.[today]?.completed) {
          const hNewStreak = state.lastActiveDate === today ? h.streak : (h.streak + 1);
          return {
            ...h,
            streak: hNewStreak,
            bestStreak: Math.max(h.bestStreak || 0, hNewStreak),
            totalCompletions: (h.totalCompletions || 0) + 1,
            history: { ...h.history, [today]: { completed: true, xp: 0, gold: 0 } }
          };
        }
        return h;
      });
    }

    next = {
      ...next,
      stats: { ...state.stats, [quest.category]: (state.stats[quest.category] || 0) + Math.ceil(xpGain / 40) },
      quests: updatedQuests, completedQuests: [...(state.completedQuests || []), { ...quest, completedAt: today }],
      habits: newHabits,
      streak: newStreak, lastActiveDate: today, shadowArmy: newShadowArmy,
      totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1,
      penaltyZone: newPenalty, hiddenQuests: newHiddenQuests
    };
    // Check hidden quest triggers after state update
    const newlyDiscoveredHQ = checkHiddenQuestTriggers(next);
    if (newlyDiscoveredHQ.length > 0) {
      const newDiscovered = [...(next.hiddenQuests.discovered || []), ...newlyDiscoveredHQ.map(hq => hq.id)];
      next.hiddenQuests = { ...next.hiddenQuests, discovered: newDiscovered };
      // Add discovered hidden quests as actual quests
      const hqAsQuests = newlyDiscoveredHQ.map(hq => ({
        id: genId(), hiddenId: hq.id,
        title: hq.title, category: hq.category, difficulty: hq.difficulty,
        type: "hidden", createdAt: today,
        xpMult: hq.reward.xpMult, goldMult: hq.reward.goldMult,
      }));
      next.quests = [...next.quests, ...hqAsQuests];
      newlyDiscoveredHQ.forEach(hq => {
        setTimeout(() => notify(`❓ ${hq.discoveryMsg}`, "named"), 600);
        setTimeout(() => setShowHiddenQuestModal(hq), 1200);
      });
    }
    // Check named shadow unlocks
    const newNameds = checkNamedShadowUnlocks(next);
    if (newNameds.length > 0) {
      newNameds.forEach(ns => {
        const namedShadow = {
          ...ns, id: genId(), namedId: ns.id,
          level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
          stats: { power: 40, speed: 35, loyalty: 50, presence: 30 },
          abilities: [ns.uniqueAbility || {}],
          isDeployed: false, deploymentSlot: null, evolutionStage: 1,
          summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
        };
        next.shadowArmy.shadows = [...next.shadowArmy.shadows, namedShadow];
        notify(`${ns.name} – ${ns.title} – ist erwacht!`, "named");
        setTimeout(() => setAriseTarget(namedShadow), 1000);
      });
    }
    next = processAchievements(next);
    persist(next);
    if (didLevelUp) {
      setPrevRank(oldRank);
      setLevelUp({ level: newLevel, earnedPoints });
      triggerSystemMessage("LEVEL UP BESTÄTIGT", [
        `Glückwunsch, Hunter ${state.hunterName}.`,
        `Sie haben Level ${newLevel} erreicht.`,
        "Ihre physischen und mentalen Kapazitäten wurden erweitert.",
        `${earnedPoints} Stat-Punkte wurden Ihrem Konto gutgeschrieben.`,
        "Verteilen Sie diese weise im Statistik-Menü."
      ]);
    }
    else if (!ariseData && quest.type !== "hidden" && quest.type !== "chained") notify(`+${xpGain} XP · +${goldGain} Gold`, "success");
    if (ariseData && !newNameds.length) setTimeout(() => setAriseTarget(ariseData), 500);
  }, [state, persist, processAchievements, computeXpGain, notify]);

  const deleteQuest = id => persist({ ...state, quests: state.quests.filter(q => q.id !== id) });

  const startEditingQuest = useCallback((quest) => {
    setEditingQuestId(quest.id);
    setQTitle(quest.title);
    setQDiff(quest.difficulty);
    setQCat(quest.category);
    setQType(quest.type);
    setQSyncHabit(!!quest.linkedHabitId);
    setShowCreate(true);
  }, []);

  const createQuest = () => {
    if (!qTitle.trim()) return;

    if (editingQuestId) {
      const updatedQuests = state.quests.map(q =>
        q.id === editingQuestId
          ? { ...q, title: qTitle.trim(), difficulty: qDiff, category: qCat, type: qType }
          : q
      );
      persist({ ...state, quests: updatedQuests });
      setQTitle("");
      setEditingQuestId(null);
      setShowCreate(false);
      return;
    }

    const createdCount = state.dailyUserQuestsCreated || 0;
    const extraSlots = state.extraDailySlots || 0;
    const maxAllowed = 4 + extraSlots;
    if (createdCount >= maxAllowed) {
      notify("Tägliches Quest-Limit erreicht! Kaufe weitere Slots im Shop.", "warning");
      return;
    }

    // Weekly quest gets a timeLimit of next Monday midnight
    let timeLimit = undefined;
    if (qType === "weekly") {
      const d = new Date();
      const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilMonday); d.setHours(23, 59, 59, 999);
      timeLimit = d.toISOString();
    }
    const habitId = ((qType === "daily" || qType === "weekly") && qSyncHabit) ? genId() : null;
    const quest = { id: genId(), title: qTitle.trim(), difficulty: qDiff, category: qCat, type: qType, createdAt: getToday(), createdAtMs: Date.now(), ...(timeLimit ? { timeLimit } : {}), ...(habitId ? { linkedHabitId: habitId } : {}) };

    let nextState = { ...state, quests: [...state.quests, quest], dailyUserQuestsCreated: createdCount + 1 };

    if (habitId) {
      const linkedHabit = {
        id: habitId,
        title: qTitle.trim(),
        category: qCat,
        frequency: qType,
        history: {},
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        createdAt: getToday(),
        active: true,
        linkedQuestId: quest.id
      };
      nextState.habits = [...(state.habits || []), linkedHabit];
    }

    persist(nextState);
    setQTitle(""); setShowCreate(false);
  };

  const completeEmergencyQuest = useCallback((eq) => {
    if (!state || state.emergencyDone) return;
    const diff = DIFFICULTIES.find(d => d.key === eq.difficulty) || DIFFICULTIES[1];
    const xpGain = Math.round(diff.xp * 2.5);
    const goldGain = Math.round(diff.gold * 2.5);
    let next = calculateLevelUp(state, xpGain);
    const didLevelUp = next._didLevelUp;
    const earnedPoints = next._levelsGained;
    const newLevel = next.level;

    next = {
      ...next,
      gold: state.gold + goldGain,
      totalGoldEarned: (state.totalGoldEarned || 0) + goldGain,
      stats: { ...state.stats, [eq.category]: (state.stats[eq.category] || 0) + 2 },
      emergencyDone: true,
      totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1
    };
    next = processAchievements(next);
    persist(next);
    notify(`🚨 NOTFALL-QUEST ERFÜLLT! +${xpGain} XP · +${goldGain} Gold`, "named");
    if (didLevelUp) {
      setPrevRank(oldRank);
      setLevelUp({ level: newLevel, earnedPoints });
      triggerSystemMessage("LEVEL UP BESTÄTIGT", [
        "Notfallmission erfolgreich abgeschlossen.",
        `Sie haben Level ${newLevel} erreicht.`,
        `${earnedPoints} Stat-Punkte wurden Ihrem Konto gutgeschrieben.`
      ]);
    }
  }, [state, persist, processAchievements, notify]);

  const addChainedQuest = useCallback((title, category, difficulty) => {
    if (!title.trim()) return;
    const totalSteps = 3;
    const firstQuest = generateChainedQuest(title, category, difficulty, 1, totalSteps);
    persist({ ...state, quests: [...state.quests, firstQuest] });
    notify(`⛓️ Quest-Kette gestartet! ${totalSteps} Schritte · Multiplikator steigt mit jedem Erfolg.`, "info");
  }, [state, persist, notify]);

  const finishDungeon = useCallback((dungeon, result) => {
    let next = calculateLevelUp(state, result.xp);
    const didLevelUp = next._didLevelUp;
    const earnedPoints = next._levelsGained;
    const newLevel = next.level;
    const oldRank = getRank(state.level);

    let newInventory = [...(next.equipment?.inventory || [])];
    if (result.drop) newInventory.push(result.drop);

    let updatedShadows = (state.shadowArmy?.shadows || []).map(s => {
      if (!s.isDeployed) return s;
      let newSXp = s.xp + Math.floor(result.xp * 0.1);
      let newSLevel = s.level;
      while (newSXp >= s.xpToNext && newSLevel < (SHADOW_TIERS[s.tier]?.maxLevel || 20)) { newSXp -= calcShadowXpToNext(newSLevel); newSLevel++; }
      return { ...s, xp: newSXp, level: newSLevel, xpToNext: calcShadowXpToNext(newSLevel), dungeonsCleared: (s.dungeonsCleared || 0) + 1 };
    });
    const newShadowArmy = { ...state.shadowArmy, shadows: updatedShadows };
    const totalGold = result.gold + (result.goldBonus ? Math.round(result.goldBonus * (state.todayModifier?.goldMult || 1)) : 0);

    // Job XP calculation for dungeons
    next = awardJobXp({ ...next, gold: state.gold + totalGold, totalGoldEarned: (state.totalGoldEarned || 0) + totalGold }, "dungeon_complete", {
      strategy: result.strategy,
      dungeonRank: dungeon.rank
    });

    if (next._jobLevelUp) {
      notify(`JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} Lv.${next._jobLevelUp.newLevel}!`, "levelup");
      delete next._jobLevelUp;
    }

    // Guardian-Passiv: Rewards bei Niederlage
    if (!result.won && getJobBonuses(state).dungeonFailureRewards > 0) {
      const partialXp = Math.floor(result.xp * getJobBonuses(state).dungeonFailureRewards);
      const partialGold = Math.floor(result.gold * getJobBonuses(state).dungeonFailureRewards);
      next.xp += partialXp;
      next.gold += partialGold;
      notify(`Guardian-Passiv: +${partialXp} XP, +${partialGold} Gold trotz Niederlage`, "success");
    }

    next = {
      ...next,
      statPoints: (state.statPoints || 0) + earnedPoints,
      dungeons: state.dungeons.map(d => d.instanceId === dungeon.instanceId ? { ...d, cleared: true } : d),
      dungeonHistory: [...(state.dungeonHistory || []), { dungeonId: dungeon.id, dungeonName: dungeon.name, dungeonRank: dungeon.rank, won: result.won, xp: result.xp, gold: totalGold, floorsCleared: result.floorsCleared || dungeon.floors, date: getToday() }],
      totalXpEarned: (state.totalXpEarned || 0) + result.xp,
      equipment: { ...state.equipment, inventory: newInventory },
      shadowArmy: newShadowArmy
    };

    // Check named shadow unlocks after dungeon
    const newNameds = checkNamedShadowUnlocks(next);
    if (newNameds.length > 0) {
      newNameds.forEach(ns => {
        const namedShadow = {
          ...ns, id: genId(), namedId: ns.id,
          level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
          stats: { power: 40, speed: 35, loyalty: 50, presence: 30 },
          abilities: [ns.uniqueAbility || {}],
          isDeployed: false, deploymentSlot: null, evolutionStage: 1,
          summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
        };
        next.shadowArmy.shadows = [...next.shadowArmy.shadows, namedShadow];
        notify(`${ns.name} – ${ns.title} – ist erwacht!`, "named");
        setTimeout(() => setAriseTarget(namedShadow), 800);
      });
    }
    next = processAchievements(next);
    persist(next); setActiveDungeon(null);
    if (didLevelUp) {
      setPrevRank(oldRank);
      setLevelUp({ level: newLevel, earnedPoints });
      triggerSystemMessage("LEVEL UP BESTÄTIGT", [
        `Dungeon erfolgreich abgeschlossen.`,
        `Sie haben Level ${newLevel} reached.`,
        `${earnedPoints} Stat-Punkte wurden Ihrem Konto gutgeschrieben.`,
        "Verteilen Sie diese im Statistik-Menü."
      ]);
    }
    else if (result.won) notify(`${dungeon.name} bezwungen! +${result.xp} XP · ${result.floorsCleared || "?"}/${dungeon.floors} Floors`, "dungeon");
    else notify(`Niederlage in ${dungeon.name}.`, "defeat");
  }, [state, persist, processAchievements, notify]);

  const deployShadow = useCallback((shadowId, slot) => {
    const slotData = FORMATION_SLOTS[slot];
    const currentInSlot = (state.shadowArmy?.shadows || []).filter(s => s.isDeployed && s.deploymentSlot === slot).length;
    if (currentInSlot >= slotData.maxSlots) { notify(`${slotData.name} ist voll! (Max ${slotData.maxSlots})`, "info"); return; }
    const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: true, deploymentSlot: slot } : s);
    persist({ ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } });
    notify(`Shadow in ${slotData.name} positioniert!`, "shadow");
  }, [state, persist, notify]);

  const undeployShadow = useCallback((shadowId) => {
    const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: false, deploymentSlot: null } : s);
    persist({ ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } });
    notify("Shadow zurückgerufen.", "info");
  }, [state, persist, notify]);

  const evolveShadow = useCallback((shadowId) => {
    const shadow = (state.shadowArmy?.shadows || []).find(s => s.id === shadowId);
    if (!shadow) return;
    const nextTier = SHADOW_TIERS[shadow.tier + 1];
    if (!nextTier || state.gold < nextTier.evolutionCost) return;
    const newStats = {
      power: Math.round(shadow.stats.power * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
      speed: Math.round(shadow.stats.speed * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
      loyalty: Math.round(shadow.stats.loyalty * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
      presence: Math.round(shadow.stats.presence * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
    };
    const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, tier: s.tier + 1, stats: newStats, glowColor: nextTier.color } : s);
    let next = { ...state, gold: state.gold - nextTier.evolutionCost, shadowArmy: { ...state.shadowArmy, shadows: newShadows } };
    next = processAchievements(next);
    persist(next);
    notify(`${shadow.name} zu Tier ${shadow.tier + 1} (${nextTier.name}) entwickelt!`, "shadow");
    setSelectedShadow(null);
  }, [state, persist, processAchievements, notify]);

  const buyItem = item => {
    const jobBonuses = getJobBonuses(state);
    const discount = jobBonuses.shopDiscount || 0;
    const finalCost = Math.max(1, Math.floor(item.cost * (1 - discount / 100)));

    if (state.gold < finalCost) return;
    if (item.type !== "consumable" && state.shopPurchases.includes(item.id)) return;
    if (getRankIndex(getRank(state.level).name) < getRankIndex(item.minRank)) return;
    let next = {
      ...state, gold: state.gold - finalCost,
      ...(item.type !== "consumable" ? { shopPurchases: [...state.shopPurchases, item.id] } : {}),
      ...(item.type === "consumable" && item.id === "extra_slot" ? { extraDailySlots: (state.extraDailySlots || 0) + 1 } : {}),
      ...(item.type === "theme" ? { selectedTheme: item.themeKey } : {}),
      ...(item.type === "title" ? { selectedTitle: item.name } : {})
    };
    next = processAchievements(next);
    persist(next); notify(`${item.name} erworben!`, "gold");
  };

  const equipItem = (item, slot) => { const newSlots = { ...state.equipment.slots, [slot]: item }; let next = { ...state, equipment: { ...state.equipment, slots: newSlots } }; next = processAchievements(next); persist(next); notify(`${item.name} ausgerüstet!`, "info"); };
  const unequipItem = slot => persist({ ...state, equipment: { ...state.equipment, slots: { ...state.equipment.slots, [slot]: null } } });

  const switchJob = useCallback((jobKey) => {
    const jobDef = JOBS[jobKey];
    if (!jobDef) return;

    const req = jobDef.unlockRequirement;
    if (state.level < req.level) {
      notify(`Mindestlevel ${req.level} erforderlich für ${jobDef.name}.`, "info");
      return;
    }

    if (req.allJobsLevel5 && !checkAllJobsLevel5(state)) {
      notify("Alle anderen Jobs müssen Level 5 sein.", "info");
      return;
    }

    if (req.minShadows && (state.shadowArmy?.shadows?.length || 0) < req.minShadows) {
      notify(`Mindestens ${req.minShadows} Shadows erforderlich.`, "info");
      return;
    }

    persist({ ...state, jobs: { ...state.jobs, current: jobKey } });
    notify(`Job gewechselt zu: ${jobDef.name}`, "success");
  }, [state, persist, notify]);

  const activateJobAbility = useCallback((jobKey) => {
    const jobDef = JOBS[jobKey];
    if (!jobDef || state.jobs?.current !== jobKey) return;

    const ability = jobDef.activeAbility;
    const level = state.jobs.levels[jobKey] || 0;

    if (level < ability.unlockLevel) {
      notify(`${jobDef.name} Level ${ability.unlockLevel} benötigt.`, "info");
      return;
    }

    const now = Date.now();
    const cooldowns = { ...state.jobs.activeAbilityCooldowns };
    const lastUsed = cooldowns[ability.key] || 0;

    if (now < lastUsed + (ability.cooldown * 1000)) {
      const remaining = Math.ceil((lastUsed + (ability.cooldown * 1000) - now) / 1000);
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      notify(`Cooldown: ${h}h ${m}m`, "info");
      return;
    }

    if (ability.key === "shadow_step") {
      const today = getToday();
      const usesToday = cooldowns.shadow_step_uses?.[today] || 0;
      if (usesToday >= (ability.maxUsesPerDay || 3)) {
        notify("Shadow Step heute bereits 3x benutzt.", "info");
        return;
      }
      cooldowns.shadow_step_uses = { ...cooldowns.shadow_step_uses, [today]: usesToday + 1 };
    }

    cooldowns[ability.key] = now;
    persist({
      ...state,
      jobs: { ...state.jobs, activeAbilityCooldowns: cooldowns },
      _abilityActivated: { ability, job: jobDef }
    });

    notify(`${ability.name} AKTIVIERT!`, "levelup");
  }, [state, persist, notify]);

  const increaseStat = useCallback((statKey) => {
    if (!state || state.statPoints <= 0) return;
    const next = {
      ...state,
      statPoints: state.statPoints - 1,
      stats: {
        ...state.stats,
        [statKey]: (state.stats[statKey] || 0) + 1
      }
    };
    persist(next);
    notify(`${CATEGORIES.find(c => c.key === statKey)?.label} erhöht!`, "success");
  }, [state, persist, notify]);



  const finishSetup = name => {
    const s = {
      ...DEFAULT_STATE,
      hunterName: name || "Hunter",
      lastActiveDate: getToday(),
      quests: generateDailySystemQuests(3),
      dungeons: generateDungeons("E"),
      lastDungeonRefresh: getToday(),
      achievements: { unlocked: [], notified: [] },
      skills: { unlocked: [] },
      equipment: { slots: { weapon: null, armor: null, ring1: null, ring2: null }, inventory: [] },
      penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 },
      todayModifier: getDailyModifier(),
      emergencyQuest: generateEmergencyQuest(1),
      emergencyDone: false,
      emergencyFailed: false,
      hiddenQuests: { discovered: [], completed: [] },
      jobs: {
        current: null,
        levels: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
        xp: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
        activeAbilityCooldowns: {}
      }
    };
    persist(s); setShowSetup(false);
  };

  const theme = useMemo(() => THEMES[state?.selectedTheme || "default"], [state?.selectedTheme]);
  const modifier = state?.todayModifier || getDailyModifier();


  return {
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
    assignRandomTask,
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
    finishSetup
  };
}
