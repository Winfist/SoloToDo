
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
  saveState, loadState, migrateState, calculateLevelUp, awardJobXp,
  generateRedemptionQuests, isDawnWindow, isDuskWindow, calculateProtocolXp, generateSeasonalQuests
} from '../data/constants';
import { CHARISMA_CHAINS } from '../data/charismaDungeons.js';
import { SEASONS, WORLD_EVENTS, detectCurrentSeason, getNextWorldEvent, getNextMonday } from '../data/seasons.js';
import { isFeatureUnlocked, getNewlyUnlockedFeatures, getNewlyUnlockedTier, TIER_UNLOCK_MESSAGES } from '../data/featureUnlocks.js';

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
  const [showShadowRegression, setShowShadowRegression] = useState(false);
  const [showDawnDusk, setShowDawnDusk] = useState(false);

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

  // Real-time Cloud Sync
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    console.log("System: Cloud-Synchronisierung aktiviert für", user.uid);
    const docRef = doc(db, "users", user.uid);

    // Listen for remote changes — only apply cloud data when local state is absent
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
    setSystemMessage({ title, lines, onComplete });
  }, []);

  useEffect(() => {
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

          // Local state belongs to this user — preserve it as-is.

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
            const newSysQuests = generateDailySystemQuests(3);
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
                setTimeout(() => notify(`🌍 Neues World-Event: ${nextEvent.icon} ${nextEvent.name} – ${nextEvent.desc}`, "named"), 3000);
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
                  setTimeout(() => notify(`🌸 Neue Saison: ${SEASONS[detectedSeason].icon} ${SEASONS[detectedSeason].name}! Saison-Quests wurden hinzugefügt.`, "named"), 2000);
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
    // BUG FIX: Apply Soul Link bonus BEFORE calculateLevelUp (was applied after, having no effect)
    const soulLinkActive = state.soulLink?.bothActive;
    let xpGain = computeXpGain(quest, streakBonusPct, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses);
    if (soulLinkActive) {
      xpGain = Math.round(xpGain * 1.25);
    }

    if (state.restBuff?.active) {
      xpGain = Math.round(xpGain * 1.1);
    }
    // BUG FIX: track original xpGain for stats before any further modifications below

    let finalSysIntegrity = state.integrityScore !== undefined ? state.integrityScore : 100;

    if (!quest.isSystem) {
      if ((state.dailyUserXP || 0) > 200 + state.level * 5) {
        xpGain = Math.round(xpGain * 0.5);
      } else if ((state.dailyUserXP || 0) + xpGain > 200 + state.level * 5) {
        notify("Tägliches XP Soft-Cap erreicht. Künftige eigene Quests geben -50%.", "warning");
      }

      const actualElapsedHours = (Date.now() - (quest.createdAtMs || Date.now())) / 3600000;
      if (actualElapsedHours < 0.1) finalSysIntegrity = Math.max(0, finalSysIntegrity - 5);

      if (finalSysIntegrity < 50) {
        xpGain = Math.round(xpGain * (finalSysIntegrity / 100));
        if (Math.random() < 0.3) notify("System-Integrität niedrig. XP für eigene Quests verringert.", "warning");
      }
    }

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
    // BUG FIX: newLevel is needed for shadow creation on boss quests
    const newLevel = next.level;
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
    // Soul Link notification (bonus already applied above before calculateLevelUp)
    let newSoulLink = { ...(state.soulLink || {}) };
    if (soulLinkActive) {
      notify("🔗 Soul Link aktiv! +25% XP Bonus", "success");
    }

    // Penalty update
    let newPenalty = { ...state.penaltyZone };
    if (newPenalty.active) {
      newPenalty.questsCompletedInPenalty = (newPenalty.questsCompletedInPenalty || 0) + 1;
      const needed = newPenalty.redemptionLeft || 3;
      if (newPenalty.questsCompletedInPenalty >= needed) { newPenalty.active = false; notify("Strafe abgebüßt. Willkommen zurück, Hunter.", "success"); }
    }

    // Shadow Regression: track redemption quest completions
    let newShadowRegression = { ...(state.shadowRegression || {}) };
    if (newShadowRegression.active && quest.isRedemption) {
      newShadowRegression.questsCompleted = (newShadowRegression.questsCompleted || 0) + 1;
      if (newShadowRegression.questsCompleted >= 3) {
        const restoredStreak = Math.floor((newShadowRegression.previousStreak || 0) * 0.5);
        newShadowRegression = {
          ...newShadowRegression,
          active: false,
          completedAt: today,
          regressionHistory: [
            ...(newShadowRegression.regressionHistory || []),
            { date: today, previousStreak: newShadowRegression.previousStreak, restoredStreak }
          ]
        };
        newPenalty = { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 };
        setTimeout(() => triggerSystemMessage("SCHATTENRÜCKKEHR VOLLSTÄNDIG", [
          "Du hast die Dunkelheit überwunden.",
          `Streak wiederhergestellt: ${restoredStreak} Tage`,
          "Der Schatten wird zu deiner Stärke.",
          "WILLKOMMEN ZURÜCK, HUNTER."
        ]), 600);
        // streak will be set below in next = {...}
        xpGain = Math.round(xpGain * 2); // double XP for completing regression
        notify(`⚡ SHADOW REGRESSION ABGESCHLOSSEN! Streak auf ${restoredStreak} Tage wiederhergestellt!`, "named");
      } else {
        const remaining = 3 - newShadowRegression.questsCompleted;
        notify(`Schattenrückforderung ${newShadowRegression.questsCompleted}/3 – Noch ${remaining} verbleibend.`, "info");
      }
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

    // Charisma Dungeon progression
    let newCharismaDungeons = { ...(state.charismaDungeons || {}) };
    if (quest.isCharismaQuest && quest.charismaChainId) {
      const chain = CHARISMA_CHAINS.find(c => c.id === quest.charismaChainId);
      if (chain) {
        const nextStepIdx = quest.charismaStep; // 0-indexed next step
        const stepHistory = [...(newCharismaDungeons.stepHistory || []), {
          chainId: quest.charismaChainId, step: quest.charismaStep, completedAt: today, xpGained: xpGain
        }];
        if (nextStepIdx < chain.steps.length) {
          const nextStepData = chain.steps[nextStepIdx];
          const nextQ = {
            id: genId(),
            title: `[${chain.name}] Etage ${nextStepIdx + 1}: ${nextStepData.title}`,
            category: "cha",
            difficulty: nextStepData.difficulty,
            type: "side",
            isSystem: true,
            isCharismaQuest: true,
            charismaChainId: chain.id,
            charismaStep: nextStepIdx + 1,
            xpMult: nextStepData.xpMult,
            createdAt: today,
            createdAtMs: Date.now(),
          };
          extraQuests = [...extraQuests, nextQ];
          newCharismaDungeons = { ...newCharismaDungeons, stepHistory };
          notify(`🎭 ${chain.name}: Etage ${quest.charismaStep} bezwungen! Weiter zu Etage ${nextStepIdx + 1}.`, "info");
        } else {
          // Chain complete!
          const chaBonus = chain.reward.chaBonus || 3;
          newCharismaDungeons = {
            ...newCharismaDungeons,
            stepHistory,
            completedChains: [...(newCharismaDungeons.completedChains || []), chain.id],
            activeChains: Object.fromEntries(
              Object.entries(newCharismaDungeons.activeChains || {}).filter(([k]) => k !== chain.id)
            )
          };
          // stat bonus applied below in next = {...}
          setTimeout(() => triggerSystemMessage("CHARISMA-DUNGEON BEZWUNGEN", [
            `${chain.icon} ${chain.name} vollständig abgeschlossen.`,
            `+${chaBonus} CHA dauerhaft erlangt.`,
            `Titel freigeschaltet: "${chain.reward.title}"`,
            "Das System erkennt dein soziales Erwachen an."
          ]), 700);
          notify(`👑 CHARISMA DUNGEON ABGESCHLOSSEN: ${chain.name}! +${chaBonus} CHA permanent.`, "named");
          // Store bonus to apply below
          next._charismaChaBonus = (next._charismaChaBonus || 0) + chaBonus;
          next._charismaTitle = chain.reward.title;
        }
      }
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

    // Codex Quest handling
    let newCodexMastered = state.codexMastered || [];
    let codexStatBonus = 0;
    if (quest.isCodexQuest && quest.codexId) {
      if (!newCodexMastered.includes(quest.codexId)) {
        newCodexMastered = [...newCodexMastered, quest.codexId];
        codexStatBonus = 1; // +1 permanenter stat bonus
        notify(`📜 CODEX GEMEISTERT! Permanente Weisheit erlangt. +1 ${quest.rewardStat?.toUpperCase() || quest.category.toUpperCase()}`, "success");
      }
    }

    // Determine final streak (Shadow Regression may restore it)
    const finalStreak = (newShadowRegression.active === false && newShadowRegression.completedAt === today && !state.shadowRegression?.completedAt)
      ? Math.floor((newShadowRegression.previousStreak || 0) * 0.5)
      : newStreak;
    // CHA bonus from completed charisma chain
    const charismaChaBonus = next._charismaChaBonus || 0;
    const charismaTitle = next._charismaTitle || null;
    delete next._charismaChaBonus;
    delete next._charismaTitle;

    next = {
      ...next,
      stats: {
        ...state.stats,
        [quest.category]: (state.stats[quest.category] || 0) + Math.ceil(xpGain / 40) + codexStatBonus,
        cha: (state.stats.cha || 0) + charismaChaBonus + (quest.category === "cha" ? Math.ceil(xpGain / 40) + codexStatBonus : 0)
      },
      quests: updatedQuests, completedQuests: [...(state.completedQuests || []), { ...quest, completedAt: today }],
      habits: newHabits,
      streak: finalStreak, lastActiveDate: today, shadowArmy: newShadowArmy,
      totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1,
      penaltyZone: newPenalty, hiddenQuests: newHiddenQuests,
      dailyUserXP: (state.dailyUserXP || 0) + (!quest.isSystem ? xpGain : 0),
      integrityScore: finalSysIntegrity,
      codexMastered: newCodexMastered,
      shadowRegression: newShadowRegression,
      soulLink: newSoulLink,
      charismaDungeons: newCharismaDungeons,
      ...(charismaTitle ? { selectedTitle: charismaTitle } : {}),
      seasons: {
        ...(state.seasons || {}),
        seasonalCompletions: quest.isSeasonal
          ? [...(state.seasons?.seasonalCompletions || []), quest.id]
          : (state.seasons?.seasonalCompletions || [])
      }
    };
    // Check hidden quest triggers after state update (only if feature unlocked)
    const newlyDiscoveredHQ = isFeatureUnlocked('hidden_quests', next.level) ? checkHiddenQuestTriggers(next) : [];
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
    // Check Charisma Dungeon unlocks based on new CHA stat
    const newCha = next.stats?.cha || 0;
    const currentUnlocked = next.charismaDungeons?.unlockedChains || ["social_exposure"];
    const newlyUnlockedChains = CHARISMA_CHAINS.filter(c => newCha >= c.chaThreshold && !currentUnlocked.includes(c.id));
    if (newlyUnlockedChains.length > 0) {
      next.charismaDungeons = {
        ...next.charismaDungeons,
        unlockedChains: [...currentUnlocked, ...newlyUnlockedChains.map(c => c.id)]
      };
      newlyUnlockedChains.forEach(c => {
        setTimeout(() => notify(`🎭 Charisma-Dungeon freigeschaltet: ${c.icon} ${c.name}!`, "success"), 800);
      });
    }
    persist(next);
    if (didLevelUp) {
      setPrevRank(oldRank);
      // Check for newly unlocked features
      const newFeatures = getNewlyUnlockedFeatures(state.level, newLevel);
      const newTier = getNewlyUnlockedTier(state.level, newLevel);
      setLevelUp({ level: newLevel, earnedPoints, unlockedFeatures: newFeatures });
      triggerSystemMessage("LEVEL UP BESTÄTIGT", [
        `Glückwunsch, Hunter ${state.hunterName}.`,
        `Sie haben Level ${newLevel} erreicht.`,
        "Ihre physischen und mentalen Kapazitäten wurden erweitert.",
        `${earnedPoints} Stat-Punkte wurden Ihrem Konto gutgeschrieben.`,
        "Verteilen Sie diese weise im Statistik-Menü."
      ]);
      // Show feature unlock message after a delay for newly unlocked tiers
      if (newTier !== null && TIER_UNLOCK_MESSAGES[newTier]) {
        const msg = TIER_UNLOCK_MESSAGES[newTier];
        setTimeout(() => {
          triggerSystemMessage(msg.title, msg.lines);
        }, 4000);
        newFeatures.forEach(f => {
          setTimeout(() => notify(`🔓 Freigeschaltet: ${f.label} — ${f.desc}`, "named"), 5000);
        });
      }
    }
    else if (!ariseData && quest.type !== "hidden" && quest.type !== "chained") notify(`+${xpGain} XP · +${goldGain} Gold`, "success");
    if (ariseData && !newNameds.length) setTimeout(() => setAriseTarget(ariseData), 500);

    // ── Haptic Feedback (Web Vibration API) ──────────────────────
    try {
      if (navigator.vibrate) {
        const diff = quest.difficulty;
        if (diff === "boss") {
          navigator.vibrate([100, 50, 200, 50, 300]); // epic boss rumble
        } else if (diff === "hard") {
          navigator.vibrate([100, 50, 200]);           // strong double-buzz
        } else {
          navigator.vibrate(60);                        // quick tap
        }
      }
    } catch (e) { /* Graceful fallback */ }
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
    let finalDiff = qDiff;
    const tLower = qTitle.trim().toLowerCase();
    const isSimple = tLower.includes("liegestütz") || tLower.includes("situp") || tLower.includes("kniebeuge") || tLower.includes("wasser");
    const numMatch = tLower.match(/\d+/);
    if (isSimple && numMatch && parseInt(numMatch[0], 10) <= 20) {
      finalDiff = "easy";
    }

    const quest = { id: genId(), title: qTitle.trim(), difficulty: finalDiff, category: qCat, type: qType, createdAt: getToday(), createdAtMs: Date.now(), ...(timeLimit ? { timeLimit } : {}), ...(habitId ? { linkedHabitId: habitId } : {}) };

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
    const oldRank = getRank(state.level); // BUG FIX: was missing, caused crash on level-up
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
      // BUG FIX: calculateLevelUp already adds earnedPoints to statPoints - don't add again!
      // statPoints already correct in `next` from calculateLevelUp
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

  // ─── DAWN/DUSK PROTOCOL ───────────────────────────────────────
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
      if (isPerfect) {
        notify(`⭐ PERFECT RUN! Alle Etagen rechtzeitig bezwungen. +${xpGain} XP Bonus!`, "named");
        setTimeout(() => triggerSystemMessage("PERFECT RUN BESTÄTIGT", [
          run.type === "dawn" ? "Morgendämmerung vollständig bezwungen." : "Dunkelheit vollständig bezwungen.",
          `${newCompleted}/${run.totalFloors} Etagen abgeschlossen.`,
          `Zeit: ${Math.floor(elapsed / 60)} Minuten.`,
          `+${xpGain} XP Bonus erhalten. Tadellos, Hunter.`
        ]), 500);
      } else {
        notify(`✅ Protokoll abgeschlossen! +${xpGain} XP`, "success");
      }
    } else {
      nextState.dawnDusk = {
        ...state.dawnDusk,
        currentRun: { ...run, floors: newFloors, floorsCompleted: newCompleted, isPerfectPossible: !timedOut }
      };
    }
    persist(nextState);
  }, [state, persist, notify, triggerSystemMessage]);

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

  // ─── CHARISMA DUNGEONS ────────────────────────────────────────
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
    notify(`🎭 ${chain.name} gestartet! Etage 1 von ${chain.steps.length}: ${step.title}`, "info");
  }, [state, persist, notify]);

  // ─── SOUL LINK (Firestore-backed) ─────────────────────────────
  const createSoulLinkCode = useCallback(async () => {
    if (!state) return;
    try {
      const { createSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      const { linkCode } = await createSoulLink(state, auth.currentUser);
      persist({ ...state, soulLink: { ...(state.soulLink || {}), linkCode, linkedAt: getToday() } });
      notify(`🔗 Soul Link erstellt! Dein Code: ${linkCode}`, "success");
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
      notify(`🔗 Soul Link verbunden mit ${result.partnerName}!`, "success");
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
      notify(`💓 Streak-Revive an ${state.soulLink.partnerName} gesendet!`, "success");
    } catch (_) { notify("Revive fehlgeschlagen.", "warning"); }
  }, [state, persist, notify]);

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
    showShadowRegression,
    setShowShadowRegression,
    showDawnDusk,
    setShowDawnDusk,
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
  };
}
