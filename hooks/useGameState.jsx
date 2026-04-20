
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { QUEST_POOL } from "../data/questPool.js";
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, GEM_SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, getJobBonuses, checkAllJobsLevel5,
  saveState, loadState, migrateState, calculateLevelUp, awardJobXp,
  generateRedemptionQuests, isDawnWindow, isDuskWindow, calculateProtocolXp, generateSeasonalQuests
} from '../data/constants';
import { JOBS } from '../data/jobs.js';
import { CHARISMA_CHAINS } from '../data/charismaDungeons.js';
import { buildCompleteQuestState, buildCompleteEmergencyQuestState } from './questActions.js';
import { buildQuestRewardFlow, buildEmergencyRewardFlow, buildDungeonRewardFlow, buildProtocolRewardFlow } from './rewardFlowBuilders.js';
import { SEASONS, WORLD_EVENTS, detectCurrentSeason, getNextWorldEvent, getNextMonday } from '../data/seasons.js';
import { isFeatureUnlocked, getNewlyUnlockedFeatures, getNewlyUnlockedTier, TIER_UNLOCK_MESSAGES } from '../data/featureUnlocks.js';

export function useGameState(initialHunterName, onLogout) {
  const [state, setState] = useState(null);
  const stateRef = useRef(null);
  const initDoneRef = useRef(false);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [showCreate, setShowCreate] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [systemMessageQueue, setSystemMessageQueue] = useState([]);
  const systemMessage = systemMessageQueue[0] || null;
  const setSystemMessage = useCallback((action) => {
    if (action === null) {
      setSystemMessageQueue(prev => prev.slice(1));
    } else {
      setSystemMessageQueue(prev => typeof action === 'function' ? action(prev) : [...prev, action]);
    }
  }, []);
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
  const [qDescription, setQDescription] = useState("");
  const [qSubQuests, setQSubQuests] = useState([]);
  const [qSaveToPool, setQSaveToPool] = useState(false);
  const [qFromTemplate, setQFromTemplate] = useState(null);
  const [qTags, setQTags] = useState("");
  const [qDueDate, setQDueDate] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [showHiddenQuestModal, setShowHiddenQuestModal] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [randomizing, setRandomizing] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem("soloMusicPlaying") !== "false");
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [portalTransitioning, setPortalTransitioning] = useState(false);
  const [showShadowRegression, setShowShadowRegression] = useState(false);
  const [showDawnDusk, setShowDawnDusk] = useState(false);
  const [questCinematic, setQuestCinematic] = useState(null);
  const [rewardFlowActive, setRewardFlowActive] = useState(false);
  const [rewardFlowQueue, setRewardFlowQueue] = useState([]);
  const [showingModal, setShowingModal] = useState(false);
  const [pendingRatingQuest, setPendingRatingQuest] = useState(null);

  const enqueueRewardFlow = useCallback((flow) => {
    setRewardFlowQueue(prev => [...prev, flow]);
    setRewardFlowActive(true);
    setShowingModal(true);
  }, []);

  const dismissRewardFlow = useCallback(() => {
    setRewardFlowQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setRewardFlowActive(false);
        setShowingModal(false);
      }
      return next;
    });
  }, []);

  const notify = useCallback((msg, type = "info") => setNotifications(prev => [...prev, { id: genId(), msg, type }]), []);
  const persist = useCallback(s => {
    const next = { ...s, lastInteractionTimeMs: Date.now() };
    setState(next);
    stateRef.current = next;
    saveState(next);
    // Soul Link: push live status to Firestore on every save
    if (next.soulLink?.linkCode && auth.currentUser) {
      import('../multiplayer/soulLinkFirebase.js').then(({ updateSoulLinkStatus }) => {
        updateSoulLinkStatus(next.soulLink.linkCode, auth.currentUser.uid, {
          streak: next.streak || 0,
          questsCompletedToday: next.dailyUserQuestsCreated || 0,
          lastActiveDate: next.lastActiveDate || null,
          hunterName: next.hunterName || "Hunter",
          level: next.level || 1
        });
      }).catch(() => { });
    }
  }, []);

  const rateCompletedQuest = useCallback((questId, ratingData) => {
    if (!state) return;
    const updatedCompleted = (state.completedQuests || []).map(q =>
      q.id === questId ? { ...q, ...ratingData } : q
    );
    persist({ ...state, completedQuests: updatedCompleted });
    setPendingRatingQuest(null);
  }, [state, persist]);

  // Real-time Cloud Sync
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    console.log("System: Cloud-Synchronisierung aktiviert für", user.uid);
    const docRef = doc(db, "users", user.uid);

    // Listen for remote changes ─ only apply cloud data when local state is absent
    // (e.g. first load on a new device). Never overwrite an active session to
    // prevent cloud overwrites from wiping locally-created quests/habits/goals.
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = migrateState(docSnap.data());
        setState(prev => {
          if (!prev) return cloudData;
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [notify]);

  // Soul Link real-time partner subscription
  useEffect(() => {
    const linkCode = stateRef.current?.soulLink?.linkCode;
    const user = auth.currentUser;
    if (!linkCode || !user) return;
    let unsub = () => { };
    import('../multiplayer/soulLinkFirebase.js').then(({ subscribeSoulLink }) => {
      unsub = subscribeSoulLink(linkCode, user.uid, (partnerData) => {
        setState(prev => {
          if (!prev) return prev;
          const today = new Date().toISOString().slice(0, 10);
          const bothActive = partnerData.partnerLastActive === today && prev.lastActiveDate === today;
          return { ...prev, soulLink: { ...(prev.soulLink || {}), ...partnerData, bothActive } };
        });
      });
    }).catch(() => { });
    return () => unsub();
  }, [state?.soulLink?.linkCode]);

  const triggerSystemMessage = useCallback((title, lines, onComplete) => {
    setSystemMessageQueue(prev => {
      if (prev.length > 0 && prev[prev.length - 1].title === title) {
        return prev;
      }
      return [...prev, { id: genId(), title, lines, onComplete }];
    });
  }, []);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    console.log("System Initialisierung gestartet...");
    loadState().then(({ data: s, source }) => {
      try {
        const user = auth.currentUser;
        if (s) {
          const today = getToday();

          // Rest-State Mechanics
          if (s.lastInteractionTimeMs && (Date.now() - s.lastInteractionTimeMs >= 8 * 3600 * 1000)) {
            s.restBuff = { active: true, date: today };
            setTimeout(() => notify("Inner Sanctum Buff: +10% XP für heute (8h offline)", "success"), 2500);
          }
          if (s.restBuff?.active && s.restBuff.date !== today) {
            s.restBuff = { active: false, date: null };
          }
          s.lastInteractionTimeMs = Date.now();

          // Local state belongs to this user ─ preserve it as-is.

          if (s.lastActiveDate && s.lastActiveDate !== today) {
            const diff = Math.floor((new Date(today) - new Date(s.lastActiveDate)) / 86400000);
            if (diff > 1) {
              // BUG FIX: Store previousStreak BEFORE resetting to 0
              const previousStreak = s.streak || 0;
              s.streak = 0;
              const hadDailies = s.quests?.some(q => q.type === "daily" && !q.completed);
              if (diff >= 2 && hadDailies && !s.penaltyZone?.active) {
                s.penaltyZone = { active: true, redemptionLeft: 3, questsCompletedInPenalty: 0 };
                // Shadow Regression: heroic comeback instead of shameful penalty
                if (!s.shadowRegression?.active) {
                  const redemptionQs = generateRedemptionQuests(s.level || 1);
                  s.shadowRegression = {
                    active: true,
                    previousStreak,
                    redemptionQuests: redemptionQs.map(q => q.id),
                    questsCompleted: 0,
                    completedAt: null,
                    regressionHistory: s.shadowRegression?.regressionHistory || []
                  };
                  s.quests = [...(s.quests || []), ...redemptionQs];
                  setTimeout(() => setShowShadowRegression(true), 800);
                }
              }
            }
            s.quests = s.quests?.map(q => q.type === "daily" && !q.isSystem ? { ...q, completed: false } : q) || [];
            // BUG FIX: Keep redemption quests alive if shadow regression is still active
            const regressionActive = s.shadowRegression?.active;
            s.quests = (s.quests || []).filter(q => !q.isSystem && !q.isSeasonal && !(q.isRedemption && !regressionActive));
            const newSysQuests = generateDailySystemQuests(3, s);
            s.quests = [...s.quests, ...newSysQuests];
            s.emergencyQuest = null;
            s.emergencyDone = false;
            s.emergencyFailed = false;
            const dayOfWeek = new Date().getDay();
            if (dayOfWeek === 1) {
              s.quests = (s.quests || []).filter(q => q.type !== "weekly");
              s.weeklyQuestReset = today;
              // World Event rotation on Monday (only if seasons unlocked)
              if (isFeatureUnlocked('seasons', s.level || 1)) {
                const nextEvent = getNextWorldEvent(s.seasons?.currentWorldEvent || null);
                s.seasons = { ...(s.seasons || {}), currentWorldEvent: nextEvent.key, worldEventExpires: getNextMonday() };
                setTimeout(() => notify(`⚡ Neues World-Event: ${nextEvent.icon} ${nextEvent.name} — ${nextEvent.desc}`, "named"), 3000);
              }
            }
            // Season detection (only if seasons feature unlocked)
            if (isFeatureUnlocked('seasons', s.level || 1)) {
              const detectedSeason = detectCurrentSeason();
              if (!s.seasons?.currentSeason || s.seasons.currentSeason !== detectedSeason) {
                const oldSeason = s.seasons?.currentSeason;
                s.seasons = {
                  ...(s.seasons || {}),
                  currentSeason: detectedSeason,
                  seasonStartDate: today,
                  seasonalCompletions: [],
                };
                const seasonalQs = generateSeasonalQuests(detectedSeason);
                s.quests = [...s.quests, ...seasonalQs];
                if (oldSeason) {
                  setTimeout(() => notify(`⚡ Neue Saison: ${SEASONS[detectedSeason].icon} ${SEASONS[detectedSeason].name}! Saison-Quests wurden hinzugefügt.`, "named"), 2000);
                }
              } else {
                // Ensure seasonal quests still exist
                const hasSeasonal = s.quests.some(q => q.isSeasonal);
                if (!hasSeasonal) {
                  s.quests = [...s.quests, ...generateSeasonalQuests(detectedSeason)];
                }
              }
            }
            s.dailyUserQuestsCreated = 0;
            s.extraDailySlots = 0;
            s.dailyUserXP = 0;
            s.integrityScore = Math.min(100, (s.integrityScore !== undefined ? s.integrityScore : 100) + 20);
          }
          s.lastActiveDate = today;
          // Emergency quests only generate if feature is unlocked (level >= 3)
          if (isFeatureUnlocked('emergency_quests', s.level || 1)) {
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
          }
          if (!s.hiddenQuests) s.hiddenQuests = { discovered: [], completed: [] };
          // Dungeons only generate if feature is unlocked (level >= 11)
          if (isFeatureUnlocked('dungeons', s.level || 1)) {
            if (!s.lastDungeonRefresh || s.lastDungeonRefresh !== today) {
              s.dungeons = generateDungeons(getRank(s.level || 1).name);
              s.lastDungeonRefresh = today;
              s.todayModifier = getDailyModifier();
            }
          }
          setTimeout(() => {
            const activeDailies = (s.quests || []).filter(q => q.type === "daily" && !q.completed);
            const urgentMsg = (s.emergencyQuest && !s.emergencyDone && !s.emergencyFailed) ? "⚠️ NOTFALL-MISSION AKTIV" : "Ihre Aufgaben warten.";
            triggerSystemMessage("STATUS-CHECK", [
              `Willkommen zurück, Hunter ${stateRef.current?.hunterName || s.hunterName || "Unbekannt"}.`,
              `Aktive Tages-Quests: ${activeDailies.length}`,
              urgentMsg
            ]);
          }, 1500);
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
        let poolToUse = availablePool;

        // FOCUS-WEIGHTED LOGIC
        if (currentState.lifeDomains && currentState.lifeDomains.length > 0) {
          const DOMAIN_TO_STATS = {
            fitness: ["str", "vit", "agi"], knowledge: ["int"], health: ["vit"], career: ["int", "cha"],
            social: ["cha"], dating: ["cha", "int"], finance: ["int"], mindset: ["vit", "int"]
          };

          let focusStats = [];
          currentState.lifeDomains.forEach(d => {
            if (DOMAIN_TO_STATS[d]) focusStats.push(...DOMAIN_TO_STATS[d]);
          });

          const roll = Math.random();
          if (roll < 0.6) {
            const focusPool = availablePool.filter(q => focusStats.includes(q.category));
            if (focusPool.length > 0) poolToUse = focusPool;
          } else if (roll < 0.9) {
            const compPool = availablePool.filter(q => !focusStats.includes(q.category));
            if (compPool.length > 0) poolToUse = compPool;
          }
        }

        const randTask = poolToUse[Math.floor(Math.random() * poolToUse.length)];
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
    // Delay initial check to avoid firing during boot sequence
    const initialDelay = setTimeout(assignRandomTask, 5000);
    // Then every hour check if it's time for a new task
    const intervalId = setInterval(assignRandomTask, 3600000);
    return () => { clearTimeout(initialDelay); clearInterval(intervalId); };
  }, [loading, assignRandomTask]);

  const removeNotif = useCallback(id => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  // Pure version — returns { nextState, newAchievements }, never calls setAchQueue
  const processAchievementsPure = useCallback(nextState => {
    const newAchs = checkAchievements(nextState);
    if (!newAchs.length) return { nextState, newAchievements: [] };
    const unlocked = [...(nextState.achievements?.unlocked || []), ...newAchs.map(a => a.id)];
    let xpBonus = 0, goldBonus = 0, gemBonus = 0;
    newAchs.forEach(a => { xpBonus += a.reward.xp || 0; goldBonus += a.reward.gold || 0; gemBonus += a.reward.gems || 0; });
    return {
      nextState: calculateLevelUp({
        ...nextState,
        gold: nextState.gold + goldBonus,
        totalGoldEarned: (nextState.totalGoldEarned || 0) + goldBonus,
        gems: (nextState.gems || 0) + gemBonus,
        totalGemsEarned: (nextState.totalGemsEarned || 0) + gemBonus,
        achievements: { ...nextState.achievements, unlocked }
      }, xpBonus),
      newAchievements: newAchs
    };
  }, []);

  // Legacy impure version — for minor callers (evolveShadow, buyItem, equipItem, buyGemItem)
  // that immediately persist and don't need RewardFlow sequencing
  const processAchievements = useCallback(nextState => {
    const { nextState: resolved, newAchievements } = processAchievementsPure(nextState);
    if (newAchievements.length) setAchQueue(prev => [...prev, ...newAchievements]);
    return resolved;
  }, [processAchievementsPure]);

  const computeXpGain = useCallback((quest, streakBonus, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses = {}, gemBoosterMult = 1) => {
    const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
    let xp = diff.xp;
    xp *= (1 + streakBonus / 100);
    xp *= (1 + (equipBonuses.xpBonus || 0));
    xp *= (1 + (skillBonuses.xpCatBonus?.[quest.category] || 0));
    xp *= (1 + (jobBonuses.xpCatBonus?.[quest.category] || 0));
    if (quest.difficulty === "hard" || quest.difficulty === "boss") xp *= (1 + (skillBonuses.xpHardBonus || 0) + (jobBonuses.hardBossXpBonus || 0));
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
    // Quest-specific xpMult (redemption, seasonal, charisma)
    xp *= (quest.xpMult || 1);
    // Gem Booster multiplier (BUG FIX: was calculated but never applied)
    xp *= gemBoosterMult;
    return Math.round(xp);
  }, []);

  const completeQuest = useCallback((questId, rect, verificationBonus = false) => {
    if (!state) return;
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return;

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

    // Haptic feedback
    try {
      if (navigator.vibrate) {
        const d = quest.difficulty;
        if (d === "boss") navigator.vibrate([100, 50, 200, 50, 300]);
        else if (d === "hard") navigator.vibrate([100, 50, 200]);
        else navigator.vibrate(60);
      }
    } catch (e) { /* Graceful fallback */ }

    const { xpMult: gemBoosterMult } = getGemBoosterMultipliers();
    const result = buildCompleteQuestState(questId, state, processAchievementsPure, gemBoosterMult, verificationBonus);
    if (!result) return;

    persist(result.nextState);
    const flow = buildQuestRewardFlow(result, state.level, rect);
    enqueueRewardFlow(flow);
    setPendingRatingQuest(quest);
  }, [state, persist, processAchievementsPure, enqueueRewardFlow, notify, getGemBoosterMultipliers]);


  const deleteQuest = id => persist({ ...state, quests: state.quests.filter(q => q.id !== id) });

  const startEditingQuest = useCallback((quest) => {
    setEditingQuestId(quest.id);
    setQTitle(quest.title);
    setQDescription(quest.description || "");
    setQSubQuests((quest.subQuests || []).map(sq => ({ title: sq.title })));
    setQTags("");
    setQDiff(quest.difficulty);
    setQCat(quest.category);
    setQType(quest.type);
    setQSyncHabit(!!quest.linkedHabitId);
    setShowCreate(true);
  }, []);

  const createQuest = () => {
    if (!qTitle.trim()) return;

    if (editingQuestId) {
      const editSubQuests = qSubQuests
        .filter(sq => sq.title.trim())
        .map((sq, i) => ({
          id: genId(),
          title: sq.title.trim(),
          completed: false,
          completedAt: null,
          order: i + 1,
        }));
      const updatedQuests = state.quests.map(q =>
        q.id === editingQuestId
          ? { ...q, title: qTitle.trim(), description: qDescription.trim(), subQuests: editSubQuests.length > 0 ? editSubQuests : (q.subQuests || []), difficulty: qDiff, category: qCat, type: qType }
          : q
      );
      persist({ ...state, quests: updatedQuests });
      setQTitle(""); setQDescription(""); setQSubQuests([]); setQSaveToPool(false); setQFromTemplate(null);
      setEditingQuestId(null);
      setShowCreate(false);
      return;
    }

    const createdCount = state.dailyUserQuestsCreated || 0;
    const extraSlots = state.extraDailySlots || 0;
    const maxAllowed = 4 + extraSlots;
    if (createdCount >= maxAllowed) {
      notify("Quest-Limit erreicht! Kaufe weitere Slots im Shop.", "warning");
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
    let finalDiff = qDiff;
    const tLower = qTitle.trim().toLowerCase();
    const isSimple = tLower.includes("liegest\u00FCtz") || tLower.includes("situp") || tLower.includes("kniebeuge") || tLower.includes("wasser");
    const numMatch = tLower.match(/\d+/);
    if (isSimple && numMatch && parseInt(numMatch[0], 10) <= 20) {
      finalDiff = "easy";
    }

    // Build sub-quests
    const subQuestList = qSubQuests
      .filter(sq => sq.title.trim())
      .map((sq, i) => ({
        id: genId(),
        title: sq.title.trim(),
        completed: false,
        completedAt: null,
        order: i + 1,
      }));

    const quest = {
      id: genId(), title: qTitle.trim(),
      description: qDescription.trim() || undefined,
      subQuests: subQuestList.length > 0 ? subQuestList : undefined,
      fromTemplate: qFromTemplate || undefined,
      difficulty: finalDiff, category: qCat, type: qType,
      createdAt: getToday(), createdAtMs: Date.now(),
      ...(timeLimit ? { timeLimit } : {}),
      ...(habitId ? { linkedHabitId: habitId } : {}),
      ...(qDueDate ? { dueDate: qDueDate } : {}),
    };

    let nextState = { ...state, quests: [...state.quests, quest], dailyUserQuestsCreated: createdCount + 1 };

    // Save to custom pool if requested
    if (qSaveToPool) {
      const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
      if (pool.templates.length < 50) {
        const template = {
          id: genId(),
          title: quest.title,
          description: quest.description || "",
          category: quest.category,
          difficulty: quest.difficulty,
          type: quest.type,
          subQuestTitles: subQuestList.map(sq => sq.title),
          tags: qTags ? qTags.split(',').map(t => t.trim()).filter(Boolean) : [],
          createdAt: getToday(),
          usageCount: 1,
          collectionId: null,
        };
        nextState.customQuestPool = {
          ...pool,
          templates: [...pool.templates, template],
        };
      }
    }

    // Update recently used
    const pool = nextState.customQuestPool || state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
    const recent = [quest.title, ...(pool.recentlyUsed || []).filter(t => t !== quest.title)].slice(0, 10);
    nextState.customQuestPool = { ...pool, ...(nextState.customQuestPool || {}), recentlyUsed: recent };

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
    setQTitle(""); setQDescription(""); setQSubQuests([]); setQSaveToPool(false); setQFromTemplate(null); setQDueDate("");
    setShowCreate(false);
  };

  const completeEmergencyQuest = useCallback((eq) => {
    if (!state || state.emergencyDone) return;
    const result = buildCompleteEmergencyQuestState(eq, state, processAchievementsPure);
    persist(result.nextState);
    const flow = buildEmergencyRewardFlow(result);
    enqueueRewardFlow(flow);
    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    } catch (e) { /* Graceful fallback */ }
  }, [state, persist, processAchievementsPure, enqueueRewardFlow]);

  const addChainedQuest = useCallback((title, category, difficulty) => {
    if (!title.trim()) return;
    const totalSteps = 3;
    const firstQuest = generateChainedQuest(title, category, difficulty, 1, totalSteps);
    persist({ ...state, quests: [...state.quests, firstQuest] });
    notify(`─ Quest-Kette gestartet! ${totalSteps} Schritte · Multiplikator steigt mit jedem Erfolg.`, "info");
  }, [state, persist, notify]);

  // ─── SUB-QUEST COMPLETION ─────────────────────────────────────
  const completeSubQuest = useCallback((questId, subQuestId) => {
    if (!state) return;
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || !quest.subQuests?.length) return;
    const subQuest = quest.subQuests.find(sq => sq.id === subQuestId);
    if (!subQuest || subQuest.completed) return;

    const updatedSubQuests = quest.subQuests.map(sq =>
      sq.id === subQuestId ? { ...sq, completed: true, completedAt: Date.now() } : sq
    );

    // XP: proportional share of base quest XP
    const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
    const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
    const totalBaseXp = Math.round((diff?.xp || 5) * (typeCfg.xpMult || 1));
    const subQuestXp = Math.max(1, Math.round(totalBaseXp / quest.subQuests.length));

    let nextState = calculateLevelUp({ ...state }, subQuestXp);
    nextState.quests = nextState.quests.map(q =>
      q.id === questId ? { ...q, subQuests: updatedSubQuests } : q
    );
    // totalXpEarned already accumulated by calculateLevelUp above

    setXpFloats(prev => [...prev, { id: genId(), amount: subQuestXp, ts: Date.now() }]);
    persist(nextState);
    notify(`Etappe abgeschlossen: ${subQuest.title} (+${subQuestXp} XP)`, "success");
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { }
  }, [state, persist, notify]);

  // ─── QUEST POOL MANAGEMENT ────────────────────────────────────
  const createQuestFromTemplate = useCallback((template) => {
    if (!state) return;
    const createdCount = state.dailyUserQuestsCreated || 0;
    const extraSlots = state.extraDailySlots || 0;
    const maxAllowed = 4 + extraSlots;
    if (createdCount >= maxAllowed) {
      notify("Quest-Limit erreicht!", "warning");
      return;
    }

    const subQuestList = (template.subQuestTitles || []).map((title, i) => ({
      id: genId(), title, completed: false, completedAt: null, order: i + 1,
    }));

    const quest = {
      id: genId(),
      title: template.title,
      description: template.description || "",
      subQuests: subQuestList.length > 0 ? subQuestList : undefined,
      fromTemplate: template.id,
      difficulty: template.difficulty,
      category: template.category,
      type: template.type,
      createdAt: getToday(),
      createdAtMs: Date.now(),
    };

    const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
    const updatedTemplates = pool.templates.map(t =>
      t.id === template.id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
    );

    persist({
      ...state,
      quests: [...state.quests, quest],
      dailyUserQuestsCreated: createdCount + 1,
      customQuestPool: {
        ...pool,
        templates: updatedTemplates,
        recentlyUsed: [template.title, ...(pool.recentlyUsed || []).filter(t => t !== template.title)].slice(0, 10),
      },
    });
    notify(`Quest aus Pool erstellt: ${template.title}`, "success");
  }, [state, persist, notify]);

  const removeFromPool = useCallback((templateId) => {
    if (!state) return;
    const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
    persist({
      ...state,
      customQuestPool: {
        ...pool,
        templates: pool.templates.filter(t => t.id !== templateId),
      },
    });
    notify("Template entfernt.", "info");
  }, [state, persist, notify]);

  const toggleFavoriteTemplate = useCallback((templateId) => {
    if (!state) return;
    const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
    let newFavs = pool.favorites || [];
    if (newFavs.includes(templateId)) {
      newFavs = newFavs.filter(id => id !== templateId);
    } else {
      newFavs = [...newFavs, templateId];
    }
    persist({
      ...state,
      customQuestPool: {
        ...pool,
        favorites: newFavs,
      },
    });
  }, [state, persist]);

  const finishDungeon = useCallback((dungeon, result) => {
    const oldLevel = state.level;
    let next = calculateLevelUp(state, result.xp);
    const didLevelUp = next._didLevelUp;
    const earnedPoints = next._levelsGained;
    const newLevel = next.level;

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

    next = awardJobXp({ ...next, gold: state.gold + totalGold, totalGoldEarned: (state.totalGoldEarned || 0) + totalGold }, "dungeon_complete", {
      strategy: result.strategy,
      dungeonRank: dungeon.rank
    });

    let jobLevelUpNotif = null;
    if (next._jobLevelUp) {
      jobLevelUpNotif = `JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} Lv.${next._jobLevelUp.newLevel}!`;
      // NOTE: Do NOT delete _jobLevelUp here — the cinematic in App reads it from state.
      // It will be cleaned up by the JobLevelUpCinematic onClose handler.
    }

    // Guardian-Passiv: Rewards bei Niederlage
    if (!result.won && getJobBonuses(state).dungeonFailureRewards > 0) {
      const partialXp = Math.floor(result.xp * getJobBonuses(state).dungeonFailureRewards);
      const partialGold = Math.floor(result.gold * getJobBonuses(state).dungeonFailureRewards);
      next.xp += partialXp;
      next.gold += partialGold;
    }

    next = {
      ...next,
      dungeons: state.dungeons.map(d => d.instanceId === dungeon.instanceId ? { ...d, cleared: true } : d),
      dungeonHistory: [...(state.dungeonHistory || []), { dungeonId: dungeon.id, dungeonName: dungeon.name, dungeonRank: dungeon.rank, won: result.won, xp: result.xp, gold: totalGold, floorsCleared: result.floorsCleared || dungeon.floors, date: getToday() }],
      // totalXpEarned already accumulated by calculateLevelUp above
      equipment: { ...state.equipment, inventory: newInventory },
      shadowArmy: newShadowArmy
    };

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
      });
    }

    const { nextState: afterAch, newAchievements } = processAchievementsPure(next);
    next = afterAch;

    persist(next);
    setActiveDungeon(null);

    const passiveToasts = [];
    if (jobLevelUpNotif) passiveToasts.push({ msg: jobLevelUpNotif, type: 'levelup', delayMs: 0 });

    const flow = buildDungeonRewardFlow(
      dungeon, result, didLevelUp, earnedPoints, newLevel, oldLevel,
      result.xp, totalGold, newNameds, newAchievements
    );
    // Inject jobLevelUp as a passive toast since it's not in builder
    if (passiveToasts.length) {
      flow.deferredUi.passiveToasts = [...passiveToasts, ...flow.deferredUi.passiveToasts];
    }
    enqueueRewardFlow(flow);
  }, [state, persist, processAchievementsPure, enqueueRewardFlow]);

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

    let consumableEffects = {};
    if (item.type === "consumable") {
      if (item.id === "extra_slot") {
        consumableEffects = { extraDailySlots: (state.extraDailySlots || 0) + 1 };
      }
      if (item.id === "potion_heal") {
        const recoverStreak = state.shadowRegression?.active ? (state.shadowRegression.previousStreak || 0) : (state.streak + 2);
        consumableEffects = {
          streak: recoverStreak,
          shadowRegression: null,
          penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 }
        };
        setTimeout(() => triggerSystemMessage("SYSTEM RECOVERY", [
          "Elixir of Recovery konsumiert.",
          "Verlorene Vitalität vollständig wiederhergestellt.",
          `Streak auf ${recoverStreak} gesetzt.`,
          "Strafzonen-Status aufgehoben."
        ]), 600);
      }
    }

    let next = {
      ...state, gold: state.gold - finalCost,
      ...(item.type !== "consumable" ? { shopPurchases: [...state.shopPurchases, item.id] } : {}),
      ...consumableEffects,
      ...(item.type === "theme" ? { selectedTheme: item.themeKey } : {}),
      ...(item.type === "title" ? { selectedTitle: item.name } : {})
    };
    next = processAchievements(next);
    persist(next);
    notify(`${item.name} erworben!`, item.id === "potion_heal" ? "success" : "gold");
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
      quests: generateDailySystemQuests(3, DEFAULT_STATE),
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

  // ─ DAWN/DUSK PROTOCOL ─
  const startDawnDuskRun = useCallback((type) => {
    if (!state) return;
    const tasks = type === "dawn" ? (state.dawnDusk?.morningTasks || []) : (state.dawnDusk?.eveningTasks || []);
    if (!tasks.length) { notify("Konfiguriere zuerst deine Routine-Aufgaben.", "warning"); return; }
    const timerSeconds = type === "dawn" ? 5400 : 3600;
    const run = {
      type,
      startedAt: Date.now(),
      timerSeconds,
      floors: tasks.map((t, i) => ({ ...t, id: t.id || genId(), completed: false, completedAt: null, order: i + 1 })),
      totalFloors: tasks.length,
      floorsCompleted: 0,
      isPerfectPossible: true
    };
    persist({ ...state, dawnDusk: { ...state.dawnDusk, currentRun: run } });
    triggerSystemMessage(type === "dawn" ? "DAWN PROTOCOL AKTIVIERT" : "DUSK PROTOCOL AKTIVIERT", [
      type === "dawn" ? "Die Morgendämmerung beginnt." : "Das Dunkel fällt herab.",
      `${tasks.length} Etagen stehen vor dir.`,
      `Timer: ${type === "dawn" ? "90" : "60"} Minuten.`,
      "Vollständiger Abschluss = PERFECT RUN Belohnung."
    ]);
  }, [state, persist, notify, triggerSystemMessage]);

  const completeProtocolFloor = useCallback((floorId) => {
    if (!state?.dawnDusk?.currentRun) return;
    const run = state.dawnDusk.currentRun;
    const elapsed = (Date.now() - run.startedAt) / 1000;
    const timedOut = elapsed > run.timerSeconds;
    const newFloors = run.floors.map(f => f.id === floorId ? { ...f, completed: true, completedAt: Date.now() } : f);
    const newCompleted = newFloors.filter(f => f.completed).length;
    const allDone = newCompleted >= run.totalFloors;
    const isPerfect = allDone && !timedOut;

    let nextState = { ...state };
    if (allDone) {
      const xpGain = calculateProtocolXp({ ...run, floorsCompleted: newCompleted, isPerfect }, state.level || 1);
      nextState = calculateLevelUp(nextState, xpGain);
      const historyEntry = {
        type: run.type, date: getToday(),
        floorsCompleted: newCompleted, totalFloors: run.totalFloors,
        isPerfect, duration: Math.round(elapsed)
      };
      nextState.dawnDusk = {
        ...state.dawnDusk,
        currentRun: null,
        [run.type === "dawn" ? "lastMorningRun" : "lastEveningRun"]: getToday(),
        perfectRuns: isPerfect ? (state.dawnDusk.perfectRuns || 0) + 1 : (state.dawnDusk.perfectRuns || 0),
        runHistory: [...(state.dawnDusk.runHistory || []), historyEntry]
      };
      persist(nextState);
      if (isPerfect) {
        enqueueRewardFlow(buildProtocolRewardFlow(run, xpGain, true, elapsed));
      } else {
        notify(`✅ Protokoll abgeschlossen! +${xpGain} XP`, "success");
      }
    } else {
      nextState.dawnDusk = {
        ...state.dawnDusk,
        currentRun: { ...run, floors: newFloors, floorsCompleted: newCompleted, isPerfectPossible: !timedOut }
      };
      persist(nextState);
    }
  }, [state, persist, notify, enqueueRewardFlow]);

  const configureProtocolTasks = useCallback((type, tasks) => {
    if (!state) return;
    const key = type === "dawn" ? "morningTasks" : "eveningTasks";
    persist({ ...state, dawnDusk: { ...state.dawnDusk, [key]: tasks } });
    notify(`${type === "dawn" ? "Morgen" : "Abend"}-Routine konfiguriert: ${tasks.length} Etagen.`, "success");
  }, [state, persist, notify]);

  const abandonProtocolRun = useCallback(() => {
    if (!state?.dawnDusk?.currentRun) return;
    persist({ ...state, dawnDusk: { ...state.dawnDusk, currentRun: null } });
    notify("Protokoll abgebrochen.", "warning");
  }, [state, persist, notify]);

  // ─ CHARISMA DUNGEONS ─
  const startCharismaChain = useCallback((chainId) => {
    if (!state) return;
    const chain = CHARISMA_CHAINS.find(c => c.id === chainId);
    if (!chain) return;
    const unlocked = state.charismaDungeons?.unlockedChains || ["social_exposure"];
    if (!unlocked.includes(chainId)) { notify("Charisma-Dungeon noch nicht freigeschaltet.", "warning"); return; }
    if (state.charismaDungeons?.activeChains?.[chainId]) { notify("Diese Kette ist bereits aktiv.", "info"); return; }
    if (state.charismaDungeons?.completedChains?.includes(chainId)) { notify("Diese Kette wurde bereits abgeschlossen.", "info"); return; }
    const step = chain.steps[0];
    const quest = {
      id: genId(),
      title: `[${chain.name}] Etage 1: ${step.title}`,
      category: "cha",
      difficulty: step.difficulty,
      type: "side",
      isSystem: true,
      isCharismaQuest: true,
      charismaChainId: chainId,
      charismaStep: 1,
      xpMult: step.xpMult,
      createdAt: getToday(),
      createdAtMs: Date.now(),
    };
    persist({
      ...state,
      quests: [...state.quests, quest],
      charismaDungeons: {
        ...state.charismaDungeons,
        activeChains: { ...(state.charismaDungeons?.activeChains || {}), [chainId]: { currentStep: 1, startedAt: getToday() } }
      }
    });
    notify(`⚡ ${chain.name} gestartet! Etage 1 von ${chain.steps.length}: ${step.title}`, "info");
  }, [state, persist, notify]);

  // ─ SOUL LINK (Firestore-backed) ─
  const createSoulLinkCode = useCallback(async () => {
    if (!state) return;
    try {
      const { createSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      const { linkCode } = await createSoulLink(state, auth.currentUser);
      persist({ ...state, soulLink: { ...(state.soulLink || {}), linkCode, linkedAt: getToday() } });
      notify(`⚡ Soul Link erstellt! Dein Code: ${linkCode}`, "success");
      return linkCode;
    } catch (e) { notify("Soul Link konnte nicht erstellt werden.", "warning"); }
  }, [state, persist, notify]);

  const joinSoulLinkCode = useCallback(async (code) => {
    if (!state) return;
    try {
      const { joinSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      const result = await joinSoulLink(code.toUpperCase(), state, auth.currentUser);
      if (!result) { notify("Code nicht gefunden oder bereits voll.", "warning"); return; }
      persist({ ...state, soulLink: { ...(state.soulLink || {}), ...result, linkCode: code.toUpperCase(), linkedAt: getToday() } });
      notify(`⚡ Soul Link verbunden mit ${result.partnerName}!`, "success");
    } catch (e) { notify("Verbindung fehlgeschlagen.", "warning"); }
  }, [state, persist, notify]);

  const breakSoulLinkCode = useCallback(async () => {
    if (!state?.soulLink?.linkCode) return;
    try {
      const { breakSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      await breakSoulLink(state.soulLink.linkCode, auth.currentUser?.uid);
    } catch (_) { }
    persist({ ...state, soulLink: { ...DEFAULT_STATE.soulLink } });
    notify("Soul Link getrennt.", "info");
  }, [state, persist, notify]);

  const sendReviveToPartner = useCallback(async () => {
    if (!state?.soulLink?.linkCode || !auth.currentUser) return;
    try {
      const { sendRevive } = await import('../multiplayer/soulLinkFirebase.js');
      await sendRevive(state.soulLink.linkCode, auth.currentUser.uid, state.soulLink.partnerUid);
      persist({ ...state, soulLink: { ...state.soulLink, revivesLeft: Math.max(0, (state.soulLink.revivesLeft || 0) - 1) } });
      notify(`⚡ Streak-Revive an ${state.soulLink.partnerName} gesendet!`, "success");
    } catch (_) { notify("Revive fehlgeschlagen.", "warning"); }
  }, [state, persist, notify]);

  const theme = useMemo(() => THEMES[state?.selectedTheme || "default"], [state?.selectedTheme]);

  // Sync theme to CSS data-attribute so CSS custom properties (tokens.css) stay in sync
  useEffect(() => {
    document.documentElement.dataset.theme = state?.selectedTheme || "default";
  }, [state?.selectedTheme]);
  const modifier = state?.todayModifier || getDailyModifier();

  // ─ GEM SYSTEM FUNCTIONS ─

  // Get active (non-expired) gem boosters
  const getActiveGemBoosters = useCallback(() => {
    const now = Date.now();
    return (state?.activeGemBoosters || []).filter(b => b.expiresAt > now);
  }, [state?.activeGemBoosters]);

  // Get combined gem booster multipliers
  const getGemBoosterMultipliers = useCallback(() => {
    const active = getActiveGemBoosters();
    let xpMult = 1, goldMult = 1;
    active.forEach(b => {
      if (b.effect?.xpMult) xpMult = Math.max(xpMult, b.effect.xpMult);
      if (b.effect?.goldMult) goldMult = Math.max(goldMult, b.effect.goldMult);
    });
    return { xpMult, goldMult };
  }, [getActiveGemBoosters]);

  // Watch a rewarded ad (simulated)
  const watchRewardedAd = useCallback(() => {
    if (!state) return false;
    const today = getToday();
    const adsToday = state.lastAdWatchDate === today ? (state.adsWatchedToday || 0) : 0;
    if (adsToday >= 5) {
      notify("Tägliches Werbe-Limit erreicht (5/5). Morgen wieder verfügbar!", "warning");
      return false;
    }
    const gemReward = 3 + Math.floor(Math.random() * 3); // 3-5 gems
    persist({
      ...state,
      gems: (state.gems || 0) + gemReward,
      totalGemsEarned: (state.totalGemsEarned || 0) + gemReward,
      adsWatchedToday: adsToday + 1,
      lastAdWatchDate: today,
    });
    notify(`+${gemReward} ⚡ Gems erhalten!`, "named");
    return gemReward;
  }, [state, persist, notify]);

  // Claim daily gem bonus
  const claimDailyGemBonus = useCallback(() => {
    if (!state) return false;
    const today = getToday();
    if (state.gemStreak?.lastClaimDate === today) {
      notify("Daily Gem Bonus bereits beansprucht!", "info");
      return false;
    }
    // Check if streak continues (yesterday or first time)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const prevStreak = state.gemStreak?.current || 0;
    const continues = state.gemStreak?.lastClaimDate === yesterdayStr;
    const newStreak = continues ? prevStreak + 1 : 1;
    // Day 7 bonus: +2 extra
    const isDay7 = newStreak % 7 === 0;
    const gemReward = isDay7 ? 3 : 1;
    persist({
      ...state,
      gems: (state.gems || 0) + gemReward,
      totalGemsEarned: (state.totalGemsEarned || 0) + gemReward,
      gemStreak: { current: newStreak, lastClaimDate: today },
    });
    if (isDay7) {
      notify(`⚡ Tag-7-Bonus! +${gemReward} Gems (Streak: ${newStreak} Tage)`, "named");
    } else {
      notify(`+${gemReward} ⚡ Daily Gem Bonus (Streak: ${newStreak})`, "success");
    }
    return gemReward;
  }, [state, persist, notify]);

  // Buy a gem shop item
  const buyGemItem = useCallback((item) => {
    if (!state) return;
    if ((state.gems || 0) < item.cost) {
      notify("Nicht genug Gems!", "warning");
      return;
    }
    // Non-repeatable check
    if (!item.repeatable && (state.gemPurchases || []).includes(item.id)) {
      notify("Bereits gekauft!", "info");
      return;
    }

    let effects = {};
    if (item.type === "booster") {
      const newBooster = {
        id: item.id,
        name: item.name,
        effect: item.effect,
        activatedAt: Date.now(),
        expiresAt: Date.now() + item.duration,
      };
      effects.activeGemBoosters = [...(state.activeGemBoosters || []).filter(b => b.expiresAt > Date.now()), newBooster];
      triggerSystemMessage("BOOSTER AKTIVIERT", [
        `${item.name} wurde eingesetzt!`,
        `${item.desc}`,
        `Dauer: ${Math.round(item.duration / 3600000)} Stunden.`,
        "Möge die Macht mit dir sein, Hunter."
      ]);
    } else if (item.type === "theme") {
      effects.selectedTheme = item.themeKey;
    } else if (item.type === "title") {
      effects.selectedTitle = item.name;
    } else if (item.type === "consumable") {
      // Handle specific consumables
      if (item.id === "gem_extra_slot") {
        effects.extraDailySlots = (state.extraDailySlots || 0) + 1;
      } else if (item.id === "gem_dungeon_refresh") {
        effects.dungeons = generateDungeons(getRank(state.level || 1).name);
        effects.lastDungeonRefresh = getToday();
        notify("Neue Dungeons generiert!", "success");
      } else if (item.id === "gem_stat_reset") {
        const totalStatPoints = Object.values(state.stats || {}).reduce((a, b) => a + b, 0);
        effects.stats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
        effects.statPoints = (state.statPoints || 0) + totalStatPoints;
        triggerSystemMessage("STAT RESET", [
          "Alle Stat-Punkte wurden zurückgesetzt.",
          `${totalStatPoints + (state.statPoints || 0)} Punkte stehen zur Verfügung.`,
          "Verteile sie weise, Hunter."
        ]);
      }
    } else if (item.type === "cosmetic") {
      // Shadow cosmetics stored in gemPurchases ─ applied via lookup
    }

    const newPurchases = item.repeatable ? (state.gemPurchases || []) : [...(state.gemPurchases || []), item.id];

    let next = {
      ...state,
      gems: (state.gems || 0) - item.cost,
      gemPurchases: newPurchases,
      ...effects,
    };
    next = processAchievements(next);
    persist(next);
    if (item.type !== "consumable" || !item.id.startsWith("gem_stat_reset")) {
      notify(`${item.name} erworben! ⚡`, item.type === "booster" ? "success" : "named");
    }
  }, [state, persist, processAchievements, notify, triggerSystemMessage]);


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
    processAchievementsPure,
    notify,
    persist,
    triggerSystemMessage,
    assignRandomTask,
    removeNotif,
    processAchievements,
    computeXpGain,
    completeQuest,
    completeSubQuest,
    deleteQuest,
    createQuest,
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
    finishSetup,
    startDawnDuskRun,
    completeProtocolFloor,
    configureProtocolTasks,
    abandonProtocolRun,
    startCharismaChain,
    createSoulLinkCode,
    joinSoulLinkCode,
    breakSoulLinkCode,
    sendReviveToPartner,
    isDawnWindow,
    isDuskWindow,
    SEASONS,
    WORLD_EVENTS,
    CHARISMA_CHAINS,
    // Gem system
    watchRewardedAd,
    buyGemItem,
    claimDailyGemBonus,
    getActiveGemBoosters,
    getGemBoosterMultipliers,
    GEM_SHOP_ITEMS,
    // Rating system
    rateCompletedQuest,
    pendingRatingQuest,
    setPendingRatingQuest,
  };
}


