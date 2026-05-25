
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db, auth, analytics } from "../firebase";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { onAuthStateChanged } from "firebase/auth";
import { QUEST_POOL } from "../data/questPool.js";
import {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, GEM_SHOP_ITEMS, THEMES, DEFAULT_STATE, QUEST_TYPES_CONFIG,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests, generateStarterQuests, getJobBonuses, checkAllJobsLevel5,
  saveState, loadState, migrateState, cacheStateLocally, resolveStateConflict, calculateLevelUp, awardJobXp,
  generateRedemptionQuests, isDawnWindow, isDuskWindow, calculateProtocolXp, generateSeasonalQuests
} from '../data/constants';
import { JOBS } from '../data/jobs.js';
import { CHARISMA_CHAINS } from '../data/charismaDungeons.js';
import { buildCompleteQuestState, buildCompleteEmergencyQuestState } from './questActions.js';
import { buildQuestRewardFlow, buildEmergencyRewardFlow, buildDungeonRewardFlow, buildProtocolRewardFlow } from './rewardFlowBuilders.js';
import { SEASONS, WORLD_EVENTS, detectCurrentSeason, getNextWorldEvent, getNextMonday } from '../data/seasons.js';
import { isFeatureUnlocked, getNewlyUnlockedFeatures, getNewlyUnlockedTier, TIER_UNLOCK_MESSAGES } from '../data/featureUnlocks.js';
import { buildReminderDate, getDateTimeLocalValue, getYesterdayKey } from '../data/dateUtils.js';
import { getDailySystemQuestCount, getQuestIntensityActiveCap, getQuestIntensityIntervalMs, getQuestIntensityPreset } from '../data/questIntensity.js';
import { getDailyQuestCreationStatus, getPremiumStatus, redeemBetaPremiumCode } from '../data/premium.js';
import { getStateLocale, translate } from '../data/i18n.js';
import { getCategoryLabel } from '../data/localizedGameData.js';
import {
  getQuestKey,
  getQuestReplacementStatus,
  isQuestReplaceable,
  normalizeQuestForStorage
} from '../data/questUtils.js';
import { getSystemQuestPoolForLocale } from '../data/localizedQuestPool.js';
import {
  cleanupQuestAttachmentBlobsForState,
  getQuestAttachmentReferenceSignature
} from '../services/questAttachmentStore.js';

function ltState(state, key, params = {}) {
  return translate(getStateLocale(state), key, params);
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

// ── Analytics helper (fails silently if analytics is null) ──
function trackEvent(eventName, params = {}) {
  try {
    if (analytics) logEvent(analytics, eventName, params);
  } catch (_) { /* Analytics may not be available */ }
}

function normalizeHunterName(name) {
  const value = String(name || "").trim();
  return value || "Hunter";
}

function createFreshHunterState(name) {
  const today = getToday();
  const startState = cloneDefaultState();
  return {
    ...startState,
    hunterName: normalizeHunterName(name),
    premium: cloneDefaultState().premium,
    tutorialCompleted: false,
    completedTutorials: [],
    lifeDomains: [],
    lastActiveDate: today,
    quests: generateStarterQuests(startState.settings?.language || "de"),
    completedQuests: [],
    dailyUserQuestsCreated: 0,
    extraDailySlots: 0,
    dailyUserXP: 0,
    dungeons: [],
    lastDungeonRefresh: null,
    todayModifier: getDailyModifier(),
    emergencyQuest: null,
    emergencyDone: false,
    emergencyFailed: false,
    achievements: { unlocked: [], notified: [] },
    skills: { unlocked: [] },
    equipment: { slots: { weapon: null, armor: null, ring1: null, ring2: null }, inventory: [] },
    penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 },
    hiddenQuests: { discovered: [], completed: [] },
    questReplacements: { date: today, used: 0, replacedKeys: [] },
  };
}

function stampRuntimeState(state) {
  const user = auth.currentUser;
  if (!state || !user) return state;
  return {
    ...state,
    ownerUid: user.uid,
    email: user.email || state.email || null,
    displayName: state.hunterName || user.displayName || state.displayName || "",
  };
}

function getSessionScope(state) {
  const value = state?.ownerUid || state?.email || state?.displayName || state?.hunterName || "local";
  return encodeURIComponent(String(value));
}

function toProgressNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function createProgressSyncEvent(previous, next, now) {
  if (!previous || !next) return null;
  const xpDelta = Math.max(0, toProgressNumber(next.totalXpEarned) - toProgressNumber(previous.totalXpEarned));
  const goldDelta = Math.max(0, toProgressNumber(next.totalGoldEarned) - toProgressNumber(previous.totalGoldEarned));
  const gemDelta = Math.max(0, toProgressNumber(next.totalGemsEarned) - toProgressNumber(previous.totalGemsEarned));
  const questDelta = Math.max(0, toProgressNumber(next.totalQuestsCompleted) - toProgressNumber(previous.totalQuestsCompleted));
  if (!xpDelta && !goldDelta && !gemDelta && !questDelta) return null;
  return {
    id: `${now}_${genId()}`,
    type: "progress_delta",
    date: getToday(),
    createdAtMs: now,
    xpDelta,
    goldDelta,
    gemDelta,
    questDelta,
  };
}

export function useGameState(initialHunterName, onLogout) {
  const [state, setState] = useState(null);
  const stateRef = useRef(null);
  const initDoneRef = useRef(false);
  const bootTimestampRef = useRef(Date.now());
  const lastAttachmentCleanupSignatureRef = useRef(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const signature = getQuestAttachmentReferenceSignature(state);
    if (signature === lastAttachmentCleanupSignatureRef.current) return;
    lastAttachmentCleanupSignatureRef.current = signature;
    cleanupQuestAttachmentBlobsForState(state).catch(error => {
      console.warn("[SoloToDo] Quest attachment cleanup failed.", error);
    });
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
  const [qPriority, setQPriority] = useState("medium");
  const [qEnergy, setQEnergy] = useState("medium");
  const [qContext, setQContext] = useState("");
  const [qReminderPreset, setQReminderPreset] = useState("none");
  const [qReminderAt, setQReminderAt] = useState("");
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

  const notify = useCallback((msg, type = "info") => {
    const text = String(msg || "");
    setNotifications(prev => {
      if (prev.some(n => n.msg === text && n.type === type)) return prev;
      return [{ id: genId(), msg: text, type }, ...prev].slice(0, 4);
    });
  }, []);
  const persist = useCallback(s => {
    const now = Date.now();
    const previous = stateRef.current;
    let next = stampRuntimeState({ ...s, lastInteractionTimeMs: now, lastModifiedAtMs: now });
    const progressEvent = createProgressSyncEvent(previous, next, now);
    if (progressEvent) {
      const events = Array.isArray(next.syncEvents) ? next.syncEvents : [];
      next = {
        ...next,
        syncEvents: [...events, progressEvent].slice(-500),
      };
    }
    setState(next);
    stateRef.current = next;
    // Track level-ups from any source
    if (previous && next.level > (previous.level || 1)) {
      trackEvent('level_up', { level: next.level, previousLevel: previous.level || 1 });
    }
    saveState(next);
    // Widget Sync: push state snapshot to iOS WidgetKit via shared App Group
    import('../services/widgetDataService.js').then(({ syncWidgetData }) => {
      syncWidgetData(next);
    }).catch(() => { });
    // Soul Link: push live status to Firestore on every save
    if (next.soulLink?.linkCode && auth.currentUser) {
      import('../multiplayer/soulLinkFirebase.js').then(({ updateSoulLinkStatus }) => {
        updateSoulLinkStatus(next.soulLink.linkCode, auth.currentUser.uid, {
          streak: next.streak || 0,
          questsCompletedToday: next.dailyQuestCompletionCount || 0,
          lastActiveDate: next.lastActiveDate || null,
          hunterName: next.hunterName || "Hunter",
          level: next.level || 1
        });
      }).catch(() => { });
    }
  }, []);

  // Real-time Cloud Sync — BUG FIX #1: Timestamp-based conflict resolution
  // Instead of ignoring cloud data entirely when local state exists, we compare
  // lastInteractionTimeMs to determine which state is newer. This fixes the
  // "reset on device switch" bug where switching between mobile and laptop
  // could discard the most recent state.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    console.log("System: Cloud-Synchronisierung aktiviert für", user.uid);
    const docRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const cloudData = stampRuntimeState(migrateState(docSnap.data()));
      const current = stateRef.current;
      const resolved = resolveStateConflict(current, cloudData);
      if (!resolved.data || resolved.data === current) return;

      if (resolved.source === "cloud" || resolved.source === "merged") {
        const next = stampRuntimeState(resolved.data);
        console.log("[SoloToDo] Cloud state accepted.", { reason: resolved.reason });
        setState(next);
        stateRef.current = next;
        cacheStateLocally(next);
        if (resolved.source === "merged") saveState(next);
        return;
      }

      if (current && ["cloud-reset-protected", "cloud-low-progress-protected", "cloud-empty-protected", "local-newer"].includes(resolved.reason)) {
        console.warn("[SoloToDo] Local state protected against cloud reset.", { reason: resolved.reason });
        saveState(current);
      }
    }, (error) => {
      console.warn("System: Cloud-Synchronisierung momentan nicht erreichbar.", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reconcileAfterReconnect = async () => {
      const current = stateRef.current;
      if (!current || !auth.currentUser) return;
      try {
        const loaded = await loadState();
        const resolved = resolveStateConflict(current, loaded.data);
        const next = stampRuntimeState(resolved.data || current);
        setState(next);
        stateRef.current = next;
        await cacheStateLocally(next);
        if (resolved.source === "local" || resolved.source === "merged" || loaded.source !== "cloud") {
          await saveState(next);
        }
      } catch (e) {
        console.warn("System: Reconnect-Sync fehlgeschlagen.", e);
      }
    };

    window.addEventListener("online", reconcileAfterReconnect);
    return () => window.removeEventListener("online", reconcileAfterReconnect);
  }, []);

  // Soul Link real-time partner subscription
  useEffect(() => {
    const linkCode = stateRef.current?.soulLink?.linkCode;
    if (!linkCode) return;
    let unsub = () => { };
    let unsubAuth = () => { };
    let started = false;

    const startSubscription = (user) => {
      if (!user || started) return;
      started = true;
      import('../multiplayer/soulLinkFirebase.js').then(({ subscribeSoulLink }) => {
        unsub = subscribeSoulLink(linkCode, user.uid, (partnerData) => {
          setState(prev => {
            if (!prev) return prev;
            const today = getToday();
            const bothActive = partnerData.partnerLastActive === today && prev.lastActiveDate === today;
            const updatedSoulLink = { ...(prev.soulLink || {}), ...partnerData, bothActive };
            // Persist partner data so it survives reload
            const next = { ...prev, soulLink: updatedSoulLink };
            cacheStateLocally(next);
            return next;
          });
        });
      }).catch(() => { });
    };

    // If auth is already ready, start immediately
    if (auth.currentUser) {
      startSubscription(auth.currentUser);
    }
    // Also listen for auth changes (handles case where auth loads after mount)
    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) startSubscription(user);
    });

    return () => { unsub(); unsubAuth(); };
  }, [state?.soulLink?.linkCode]);

  // BUG FIX #10: Check entire queue for duplicates, not just the last item
  const triggerSystemMessage = useCallback((title, lines, onComplete) => {
    setSystemMessageQueue(prev => {
      // Prevent duplicate messages anywhere in the queue
      if (prev.some(msg => msg.title === title)) {
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
            setTimeout(() => notify(ltState(s, "systemCoach.restBuff"), "success"), 2500);
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
            const newSysQuests = generateDailySystemQuests(getDailySystemQuestCount(s), s);
            s.quests = [...s.quests, ...newSysQuests];
            if (s.settings?.autoSystemTasks === true) {
              s.lastSystemTaskTime = Date.now();
            }
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
            s.questReplacements = { date: today, used: 0, replacedKeys: [] };
            s.integrityScore = Math.min(100, (s.integrityScore !== undefined ? s.integrityScore : 100) + 20);
          }
          s.lastActiveDate = today;
          // Emergency quests only generate if feature is unlocked (level >= 3)
          let isNewEmergency = false;
          if (isFeatureUnlocked('emergency_quests', s.level || 1)) {
            if (!s.emergencyQuest || !s.emergencyQuest.id.endsWith(today)) {
              s.emergencyQuest = generateEmergencyQuest(s.level || 1);
              s.emergencyDone = false;
              s.emergencyFailed = false;
              isNewEmergency = true;
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
          if (s.statPoints === undefined) s.statPoints = 0;
          const userCreatedAtMs = Date.parse(user?.metadata?.creationTime || "");
          const userWasJustCreated = Number.isFinite(userCreatedAtMs) && Date.now() - userCreatedAtMs < 10 * 60 * 1000;
          if (initialHunterName && (!s.hunterName || userWasJustCreated)) {
            s.hunterName = initialHunterName;
          }
          const readyState = stampRuntimeState(s);
          stateRef.current = readyState;
          // UNIFIED BOOT BRIEFING: Bundle ALL startup info into a single system
          // message instead of multiple separate modals. Shown quickly (300ms).
          setTimeout(() => {
            const statusCheckKey = `sl_status_check_${today}_${getSessionScope(readyState)}`;
            try {
              if (sessionStorage.getItem(statusCheckKey) === 'shown') return;
              sessionStorage.setItem(statusCheckKey, 'shown');
            } catch { /* sessionStorage may not be available */ }

            // Gather ALL relevant status lines into one bundled briefing
            const bootName = stateRef.current?.hunterName || s.hunterName || ltState(readyState, "common.unknown");
            const statusLines = [
              ltState(readyState, "systemCoach.bootWelcome", { name: bootName })
            ];
            const activeDailies = (readyState.quests || []).filter(q => q.type === "daily" && !q.completed);
            if (activeDailies.length > 0) statusLines.push(ltState(readyState, "systemCoach.activeDailyQuests", { count: activeDailies.length }));
            // Emergency quest info (replaces the former separate modal)
            if (readyState.emergencyQuest && !readyState.emergencyDone && !readyState.emergencyFailed) {
              if (isNewEmergency) {
                statusLines.push(ltState(readyState, "systemCoach.emergencyMission", { title: readyState.emergencyQuest.title }));
                statusLines.push(ltState(readyState, "systemCoach.emergencyDoubleReward"));
              } else {
                statusLines.push(ltState(readyState, "systemCoach.emergencyActive"));
              }
            }
            if (readyState.penaltyZone?.active) statusLines.push(ltState(readyState, "systemCoach.penaltyActive"));
            if (readyState.shadowRegression?.active) statusLines.push(ltState(readyState, "systemCoach.shadowRegressionActive"));
            if (readyState.streak >= 5) statusLines.push(ltState(readyState, "systemCoach.streakLine", { streak: readyState.streak }));

            triggerSystemMessage(ltState(readyState, "systemCoach.statusCheckTitle"), statusLines);
          }, 300);
          setState(readyState);
          if (!readyState.hunterName) setShowSetup(true);

          // Initial widget sync on app boot
          import('../services/widgetDataService.js').then(({ syncWidgetData }) => {
            syncWidgetData(readyState);
          }).catch(() => { });

          // If local won over cloud (or cloud was unavailable), repair cloud when possible.
          if (source !== "cloud" && user) {
            saveState(readyState);
          }
        } else {
          const startState = stampRuntimeState(createFreshHunterState(initialHunterName));
          setShowSetup(!initialHunterName);
          setState(startState);
          stateRef.current = startState;
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
    if (currentState.settings?.autoSystemTasks !== true) return;
    const TASK_INTERVAL = getQuestIntensityIntervalMs(currentState);
    const intensity = getQuestIntensityPreset(currentState);
    const now = Date.now();
    const lastTime = currentState.lastSystemTaskTime || 0;

    if (now - lastTime >= TASK_INTERVAL) {
      const activeAutoTasks = (currentState.quests || []).filter(q =>
        !q.completed
        && (q.autoAssigned || (q.isSystem && q.type === "side" && !q.isCharismaQuest))
      ).length;
      if (activeAutoTasks >= getQuestIntensityActiveCap(currentState)) return;

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
        const newQuest = normalizeQuestForStorage({
          id: genId(), title: randTask.title, difficulty: randTask.difficulty || "normal",
          category: randTask.category || "str", desc: randTask.desc || "",
          description: randTask.desc || "",
          type: "side", createdAt: getToday(),
          createdAtMs: now,
          xpMult: 1, goldMult: 1, isSystem: true, autoAssigned: true,
          intensityKey: intensity.key,
          templateId: randTask.id || randTask.templateId || undefined,
          subQuests: randTask.subQuests || undefined,
        });

        // Only show full modal after boot phase (first 10s) to avoid modal spam on startup
        if (Date.now() - bootTimestampRef.current > 10000) {
          triggerSystemMessage(ltState(currentState, "systemCoach.autoTaskTitle"), [
            ltState(currentState, "systemCoach.autoTaskAssigned", { intensity: intensity.label }),
            `"${randTask.title}"`,
            ltState(currentState, "systemCoach.autoTaskFrequency", { frequency: intensity.intervalHours >= 24 ? ltState(currentState, "systemCoach.oncePerDay") : ltState(currentState, "systemCoach.everyHours", { hours: intensity.intervalHours }) }),
            ltState(currentState, "systemCoach.autoTaskClose")
          ]);
        }

        persist({
          ...currentState,
          lastSystemTaskTime: now,
          quests: [...currentState.quests, newQuest]
        });
        notify(ltState(currentState, "systemCoach.autoTaskNotify", { intensity: intensity.label }), "info");
      } else {
        // If pool exhausted, just update time or do nothing
        persist({ ...currentState, lastSystemTaskTime: now });
      }
    }
  }, [persist, triggerSystemMessage, notify, loading]);

  // --- QUEST INTENSITY TASK ASSIGNMENT ---
  useEffect(() => {
    if (loading) return;
    // Delay initial check to avoid firing during boot sequence
    const initialDelay = setTimeout(assignRandomTask, 5000);
    // Then check regularly if the selected intensity is ready for a new task.
    const intervalId = setInterval(assignRandomTask, 15 * 60 * 1000);
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
        notify(ltState(state, "quests.waitMaturing", { hours: remainingHours }), "warning");
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
    trackEvent('quest_completed', { category: quest.category, difficulty: quest.difficulty, isSystem: !!quest.isSystem });

    // ── Hybrid Storage: archive completed quest to subcollection ──
    if (auth.currentUser && result.newlyCompletedQuests) {
      result.newlyCompletedQuests.forEach(cq => {
        const histRef = doc(collection(db, 'users', auth.currentUser.uid, 'questHistory'), cq.id);
        setDoc(histRef, { ...cq, archivedAt: new Date().toISOString() }).catch(err =>
          console.warn('questHistory write failed:', err)
        );
      });
    }

    const flow = buildQuestRewardFlow(result, state.level, rect, getStateLocale(state));
    enqueueRewardFlow(flow);
  }, [state, persist, processAchievementsPure, enqueueRewardFlow, notify, getGemBoosterMultipliers]);


  const deleteQuest = id => persist({
    ...state,
    quests: state.quests.filter(q => q.id !== id),
    reminders: (state.reminders || []).filter(r => r.questId !== id),
  });

  const getReplacementCandidates = useCallback((questId) => {
    const current = stateRef.current || state;
    if (!current) return [];
    const quest = (current.quests || []).find(q => q.id === questId);
    if (!isQuestReplaceable(quest)) return [];

    const status = getQuestReplacementStatus(current);
    if (!status.canReplace) return [];

    const locale = getStateLocale(current);
    const today = getToday();
    const currentKey = getQuestKey(quest);
    const activeKeys = new Set((current.quests || []).filter(q => !q.completed && q.id !== questId).map(getQuestKey));
    const blockedKeys = new Set([currentKey, ...(status.replacedKeys || [])]);
    const level = current.level || 1;

    const pool = getSystemQuestPoolForLocale(locale)
      .filter(template => level >= (template.minLevel || 1))
      .map(template => normalizeQuestForStorage({
        ...template,
        templateId: template.templateId || template.id,
        type: quest.type || "daily",
        isSystem: true,
        createdAt: today,
        dueDate: quest.dueDate || (quest.type === "daily" ? today : undefined),
      }))
      .filter(template => {
        const key = getQuestKey(template);
        return key !== currentKey && !activeKeys.has(key) && !blockedKeys.has(key);
      });

    const addUnique = (target, source) => {
      source
        .sort(() => Math.random() - 0.5)
        .forEach(template => {
          if (target.length >= 3) return;
          if (!target.some(existing => getQuestKey(existing) === getQuestKey(template))) {
            target.push(template);
          }
        });
    };

    const candidates = [];
    addUnique(candidates, pool.filter(t => t.category === quest.category && t.difficulty === quest.difficulty));
    addUnique(candidates, pool.filter(t => t.category === quest.category));
    addUnique(candidates, pool);
    return candidates.slice(0, 3);
  }, [state]);

  const replaceSystemQuest = useCallback((questId, selectedTemplate) => {
    const current = stateRef.current || state;
    if (!current || !selectedTemplate) return false;
    const quest = (current.quests || []).find(q => q.id === questId);
    if (!isQuestReplaceable(quest)) {
      notify("Diese Quest kann nicht ersetzt werden.", "warning");
      return false;
    }

    const status = getQuestReplacementStatus(current);
    if (!status.canReplace) {
      notify(`Ersatzlimit erreicht (${status.used}/${status.limit})`, "warning");
      return false;
    }

    const today = getToday();
    const sourceKey = getQuestKey(quest);
    const replacement = normalizeQuestForStorage({
      ...selectedTemplate,
      id: `sys_${genId()}`,
      templateId: selectedTemplate.templateId || selectedTemplate.id,
      type: quest.type || "daily",
      isSystem: true,
      autoAssigned: quest.autoAssigned,
      createdAt: quest.createdAt || today,
      createdAtMs: Date.now(),
      dueDate: quest.dueDate || (quest.type === "daily" ? today : undefined),
      priority: quest.priority || selectedTemplate.priority || "medium",
      energy: selectedTemplate.energy || quest.energy || "medium",
      origin: "replacement",
      replacedQuestId: quest.id,
      replacedQuestKey: sourceKey,
    });
    const replacementKey = getQuestKey(replacement);

    persist({
      ...current,
      quests: (current.quests || []).map(q => q.id === questId ? replacement : q),
      reminders: (current.reminders || []).filter(r => r.questId !== questId),
      questReplacements: {
        date: today,
        used: status.used + 1,
        replacedKeys: [...new Set([...(status.replacedKeys || []), sourceKey, replacementKey])],
      },
    });
    notify(`Quest ersetzt: ${replacement.title}`, "success");
    return true;
  }, [state, persist, notify]);

  const resetQuestForm = useCallback(() => {
    setQTitle("");
    setQDescription("");
    setQSubQuests([]);
    setQSaveToPool(false);
    setQFromTemplate(null);
    setQTags("");
    setQDueDate("");
    setQSyncHabit(false);
    setQPriority("medium");
    setQEnergy("medium");
    setQContext("");
    setQReminderPreset("none");
    setQReminderAt("");
  }, []);

  const updateHealthData = useCallback((steps, sleepHours, options = {}) => {
    const current = stateRef.current;
    if (!current) return;
    const dateKey = options.dateKey || getToday();
    const syncedAt = new Date().toLocaleString(getStateLocale(current) === "de" ? "de-DE" : "en-US");
    const nextHistory = { ...(current.healthDailyHistory || {}) };
    const upsertDay = (key, patch) => {
      if (!key) return;
      nextHistory[key] = {
        ...(nextHistory[key] || {}),
        date: key,
        ...patch,
        syncedAt
      };
    };
    const numericSteps = Math.max(0, Math.floor(Number(steps) || 0));
    const numericSleep = Math.max(0, Number(sleepHours) || 0);

    (options.stepsHistory || []).forEach(row => {
      const value = Math.max(0, Math.floor(Number(row.value) || 0));
      if (row.date && value > 0) upsertDay(row.date, { steps: value });
    });
    (options.sleepHistory || []).forEach(row => {
      const value = Math.max(0, Number(row.hours ?? row.value) || 0);
      if (row.date && value > 0) upsertDay(row.date, { sleepHours: value });
    });
    if (numericSteps > 0 || numericSleep > 0) {
      upsertDay(dateKey, {
        ...(numericSteps > 0 ? { steps: numericSteps } : {}),
        ...(numericSleep > 0 ? { sleepHours: numericSleep } : {})
      });
    }

    persist({
      ...current,
      dailySteps: numericSteps || current.dailySteps || 0,
      dailySleepHours: numericSleep || current.dailySleepHours || 0,
      healthDailyHistory: nextHistory,
      healthSyncDate: current.healthSyncDate || syncedAt,
      lastNativeSync: syncedAt
    });
  }, [persist]);

  const claimHealthReward = useCallback((milestoneKey, xp, gold, title, subtitle) => {
    if (!state) return;
    if (state.healthRewardsClaimed?.[milestoneKey]) return;

    const nextClaimed = { ...(state.healthRewardsClaimed || {}), [milestoneKey]: true };
    const leveledState = calculateLevelUp({
      ...state,
      healthRewardsClaimed: nextClaimed,
      gold: (state.gold || 0) + gold,
      totalGoldEarned: (state.totalGoldEarned || 0) + gold
    }, xp);

    persist(leveledState);

    let animationQueue = [];
    animationQueue.push({
      type: 'system_message',
      payload: { title: ltState(state, "rewards.successPrefix", { title }), lines: [ltState(state, "rewards.earned", { xp, gold }), subtitle] }
    });

    if (leveledState.level > state.level) {
      animationQueue.push({ type: 'levelup', payload: { oldLevel: state.level, level: leveledState.level, earnedPoints: (leveledState.level - state.level) * 3 } });
    }

    enqueueRewardFlow({
      title: ltState(state, "rewards.healthTitle"),
      subtitle: title,
      xpReceived: xp,
      goldReceived: gold,
      animationQueue,
      deferredUi: {
        passiveToasts: [{ msg: ltState(state, "rewards.claimed", { title }), type: 'success', delayMs: 400 }]
      }
    });
  }, [state, persist, enqueueRewardFlow]);

  const updateScreenTimeData = useCallback((totalMinutes, options = {}) => {
    const current = stateRef.current;
    if (!current) return;

    const syncedAt = new Date().toLocaleString('de-DE');
    const nextHistory = { ...(current.screenTimeDailyHistory || {}) };
    const prefs = {
      ...(current.screenTimePreferences || {}),
      ...(options.preferences || {}),
    };
    const defaultLimit = Math.max(1, Math.floor(Number(prefs.dailyLimitMinutes) || 180));

    if (options.capabilities) {
      prefs.lastCapability = {
        ...options.capabilities,
        checkedAt: syncedAt,
      };
    }

    const normalizeBreakdown = (items) => Array.isArray(items)
      ? items
        .map(item => ({
          name: String(item.name || item.bundleIdentifier || item.category || '').trim(),
          minutes: Math.max(0, Math.floor(Number(item.minutes ?? item.totalMinutes ?? item.durationMinutes) || 0)),
        }))
        .filter(item => item.name && item.minutes >= 0)
        .slice(0, 20)
      : undefined;

    const upsertDay = (date, row = {}) => {
      if (!date) return;
      const minutes = Math.max(0, Math.floor(Number(row.totalMinutes ?? row.minutes ?? row.value ?? 0)));
      const limitMinutes = Math.max(1, Math.floor(Number(row.limitMinutes ?? defaultLimit) || defaultLimit));
      nextHistory[date] = {
        ...(nextHistory[date] || {}),
        date,
        totalMinutes: minutes,
        limitMinutes,
        underLimit: minutes <= limitMinutes,
        source: row.source || options.source || 'native-screen-time',
        syncedAt: row.syncedAt || syncedAt,
        ...(row.confidence !== undefined ? { confidence: Math.max(0, Math.min(100, Math.floor(Number(row.confidence) || 0))) } : {}),
        ...(normalizeBreakdown(row.apps) ? { apps: normalizeBreakdown(row.apps) } : {}),
        ...(normalizeBreakdown(row.categories) ? { categories: normalizeBreakdown(row.categories) } : {}),
      };
    };

    (options.history || options.days || []).forEach(row => {
      if (!row?.date) return;
      upsertDay(row.date, row);
    });

    const dateKey = options.dateKey || options.date || getToday();
    const hasTotal = totalMinutes !== undefined && totalMinutes !== null && totalMinutes !== '';
    if (hasTotal) {
      upsertDay(dateKey, {
        totalMinutes,
        limitMinutes: options.limitMinutes,
        source: options.source,
        confidence: options.confidence,
        apps: options.apps,
        categories: options.categories,
      });
    }

    const today = nextHistory[getToday()];
    persist({
      ...current,
      screenTimePreferences: prefs,
      screenTimeDailyHistory: nextHistory,
      dailyScreenTimeMinutes: today?.totalMinutes ?? current.dailyScreenTimeMinutes ?? 0,
      screenTimeSyncDate: syncedAt,
      lastScreenTimeSync: syncedAt,
    });
  }, [persist]);

  const claimScreenTimeReward = useCallback((dateKey, xp = 20, gold = 60, title = null, subtitle = null) => {
    const current = stateRef.current;
    if (!current || !dateKey) return;
    const rewardTitle = title || ltState(current, "screenTime.rewardTitle");
    const rewardSubtitle = subtitle || ltState(current, "screenTime.rewardSubtitle");
    const rewardKey = `screen_time_${dateKey}`;
    if (current.screenTimeRewardsClaimed?.[rewardKey]) return;
    const day = current.screenTimeDailyHistory?.[dateKey];
    if (!day || day.underLimit !== true) return;

    const nextClaimed = { ...(current.screenTimeRewardsClaimed || {}), [rewardKey]: true };
    const leveledState = calculateLevelUp({
      ...current,
      screenTimeRewardsClaimed: nextClaimed,
      gold: (current.gold || 0) + gold,
      totalGoldEarned: (current.totalGoldEarned || 0) + gold
    }, xp);

    persist(leveledState);

    const animationQueue = [{
      type: 'system_message',
      payload: { title: ltState(current, "rewards.successPrefix", { title: rewardTitle }), lines: [ltState(current, "rewards.earned", { xp, gold }), rewardSubtitle] }
    }];

    if (leveledState.level > current.level) {
      animationQueue.push({ type: 'levelup', payload: { oldLevel: current.level, level: leveledState.level, earnedPoints: (leveledState.level - current.level) * 3 } });
    }

    enqueueRewardFlow({
      title: ltState(current, "rewards.focusTitle"),
      subtitle: rewardTitle,
      xpReceived: xp,
      goldReceived: gold,
      animationQueue,
      deferredUi: {
        passiveToasts: [{ msg: ltState(current, "rewards.claimed", { title: rewardTitle }), type: 'success', delayMs: 400 }]
      }
    });
  }, [persist, enqueueRewardFlow]);

  const normalizeSubQuestInput = useCallback((items = []) => {
    return (items || [])
      .map((sq) => typeof sq === "string" ? { title: sq } : sq)
      .filter(sq => sq?.title?.trim())
      .slice(0, 5)
      .map((sq, i) => ({
        id: sq.id || genId(),
        title: sq.title.trim(),
        completed: !!sq.completed,
        completedAt: sq.completedAt || null,
        order: i + 1,
      }));
  }, []);

  const normalizeTags = useCallback((raw) => {
    if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
    if (!raw) return [];
    return String(raw).split(",").map(t => t.trim()).filter(Boolean);
  }, []);

  const attachQuestReminder = useCallback((quest, preset, customValue, existingReminderId = null) => {
    const reminderDate = buildReminderDate(preset, { dueDate: quest.dueDate, customValue });
    if (!reminderDate) return { quest, reminder: null };
    const reminderId = existingReminderId || quest.reminderId || genId();
    const reminderAt = reminderDate.toISOString();
    return {
      quest: { ...quest, reminderId, reminderAt, reminderPreset: preset },
      reminder: {
        id: reminderId,
        questId: quest.id,
        title: `Reminder: ${quest.title}`,
        body: quest.title,
        reminderAt,
        fired: false,
        preset,
        createdAt: getToday(),
      }
    };
  }, []);

  const getQuestInputData = useCallback((input = null) => {
    const source = input && !Array.isArray(input) ? input : {};
    const useForm = !input;
    const title = (source.title ?? qTitle).trim();
    const description = (source.description ?? source.desc ?? qDescription).trim();
    const rawSubQuests = source.subQuests ?? source.subQuestTitles ?? qSubQuests;
    const tags = normalizeTags(source.tags ?? (useForm ? qTags : ""));
    const type = source.type || qType || "side";
    const dueDate = source.dueDate ?? (useForm ? qDueDate : "");
    const priority = source.priority || (useForm ? qPriority : "medium");
    const energy = source.energy || (useForm ? qEnergy : "medium");
    const context = (source.context ?? (useForm ? qContext : "")).trim();
    const reminderPreset = source.reminderPreset ?? (useForm ? qReminderPreset : "none");
    const reminderAt = source.reminderAt ?? (useForm ? qReminderAt : "");
    const syncHabit = source.syncHabit ?? (useForm ? qSyncHabit : false);
    return {
      title,
      description,
      subQuests: normalizeSubQuestInput(rawSubQuests),
      tags,
      type,
      dueDate,
      priority,
      energy,
      context,
      reminderPreset,
      reminderAt,
      syncHabit,
      category: source.category || qCat || "agi",
      difficulty: source.difficulty || qDiff || "normal",
      fromTemplate: source.fromTemplate || qFromTemplate || undefined,
    };
  }, [qTitle, qDescription, qSubQuests, qTags, qType, qDueDate, qPriority, qEnergy, qContext, qReminderPreset, qReminderAt, qSyncHabit, qCat, qDiff, qFromTemplate, normalizeTags, normalizeSubQuestInput]);

  const createQuestsFromInputs = useCallback((inputs = [], options = {}) => {
    if (!state || !Array.isArray(inputs) || inputs.length === 0) return [];
    const questLimit = getDailyQuestCreationStatus(state);
    const createdCount = questLimit.createdCount;
    const slotsLeft = questLimit.premiumActive ? inputs.length : questLimit.remaining;
    if (slotsLeft <= 0) {
      notify(ltState(state, "quests.freeLimit"), "warning");
      return [];
    }

    const acceptedInputs = inputs.slice(0, slotsLeft);
    const reminders = [];
    const quests = acceptedInputs
      .map((input) => getQuestInputData(input))
      .filter(data => data.title)
      .map((data) => {
        let timeLimit = undefined;
        if (data.type === "weekly") {
          const d = new Date();
          const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
          d.setDate(d.getDate() + daysUntilMonday); d.setHours(23, 59, 59, 999);
          timeLimit = d.toISOString();
        }
        const quest = normalizeQuestForStorage({
          id: genId(),
          title: data.title,
          description: data.description || undefined,
          subQuests: data.subQuests.length > 0 ? data.subQuests : undefined,
          tags: data.tags.length > 0 ? data.tags : undefined,
          fromTemplate: data.fromTemplate,
          difficulty: data.difficulty,
          category: data.category,
          type: data.type,
          priority: data.priority,
          energy: data.energy,
          context: data.context || undefined,
          createdAt: getToday(),
          createdAtMs: Date.now(),
          ...(timeLimit ? { timeLimit } : {}),
          ...(data.dueDate ? { dueDate: data.dueDate } : {}),
        });
        const withReminder = attachQuestReminder(quest, data.reminderPreset, data.reminderAt);
        if (withReminder.reminder) reminders.push(withReminder.reminder);
        return withReminder.quest;
      });

    if (quests.length === 0) return [];
    const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
    const recent = [...quests.map(q => q.title), ...(pool.recentlyUsed || []).filter(t => !quests.some(q => q.title === t))].slice(0, 10);
    const nextState = {
      ...state,
      quests: [...(state.quests || []), ...quests],
      reminders: [...(state.reminders || []), ...reminders],
      dailyUserQuestsCreated: createdCount + quests.length,
      customQuestPool: { ...pool, recentlyUsed: recent },
      ...(options.source === "scan" ? { ai: { ...(state.ai || {}), scannedTasks: ((state.ai?.scannedTasks || 0) + 1) } } : {}),
    };
    persist(nextState);
    if (inputs.length > quests.length) notify(ltState(state, "quests.importedLimit", { created: quests.length, total: inputs.length }), "warning");
    else notify(ltState(state, "quests.createdCount", { count: quests.length, plural: quests.length > 1 ? "s" : "" }), "success");
    return quests;
  }, [state, persist, notify, getQuestInputData, attachQuestReminder]);

  const startEditingQuest = useCallback((quest) => {
    setEditingQuestId(quest.id);
    setQTitle(quest.title);
    setQDescription(quest.description || quest.desc || "");
    setQSubQuests((quest.subQuests || []).map(sq => ({ ...sq })));
    setQTags((quest.tags || []).join(", "));
    setQDiff(quest.difficulty);
    setQCat(quest.category);
    setQType(quest.type);
    setQDueDate(quest.dueDate || "");
    setQPriority(quest.priority || "medium");
    setQEnergy(quest.energy || "medium");
    setQContext(quest.context || "");
    setQReminderPreset(quest.reminderAt ? "custom" : "none");
    setQReminderAt(quest.reminderAt ? getDateTimeLocalValue(quest.reminderAt) : "");
    setQSyncHabit(!!quest.linkedHabitId);
    setShowCreate(true);
  }, []);

  const createQuest = (input = null, options = {}) => {
    if (Array.isArray(input)) return createQuestsFromInputs(input);

    const data = getQuestInputData(input);
    if (!data.title) return;
    const bypassDailyLimit = options.bypassDailyLimit === true;

    if (editingQuestId && !input) {
      const updatedQuests = state.quests.map(q =>
        q.id === editingQuestId
          ? (() => {
            const previousReminderId = q.reminderId || (state.reminders || []).find(r => r.questId === q.id)?.id;
            const baseQuest = normalizeQuestForStorage({
              ...q,
              title: data.title,
              description: data.description || undefined,
              subQuests: data.subQuests.length > 0 ? data.subQuests : undefined,
              tags: data.tags.length > 0 ? data.tags : undefined,
              difficulty: data.difficulty,
              category: data.category,
              type: data.type,
              priority: data.priority,
              energy: data.energy,
              context: data.context || undefined,
              dueDate: data.dueDate || undefined,
              reminderAt: undefined,
              reminderId: undefined,
              reminderPreset: undefined,
            });
            return attachQuestReminder(baseQuest, data.reminderPreset, data.reminderAt, previousReminderId).quest;
          })()
          : q
      );
      const editedQuest = updatedQuests.find(q => q.id === editingQuestId);
      const withReminder = editedQuest ? attachQuestReminder(editedQuest, data.reminderPreset, data.reminderAt, editedQuest.reminderId) : { reminder: null };
      const reminders = (state.reminders || []).filter(r => r.questId !== editingQuestId);
      persist({ ...state, quests: updatedQuests, reminders: withReminder.reminder ? [...reminders, withReminder.reminder] : reminders });
      resetQuestForm();
      setEditingQuestId(null);
      setShowCreate(false);
      return;
    }

    const questLimit = getDailyQuestCreationStatus(state);
    const createdCount = questLimit.createdCount;
    if (!questLimit.canCreate && !bypassDailyLimit) {
      notify(ltState(state, "quests.freeLimit"), "warning");
      return;
    }

    // Weekly quest gets a timeLimit of next Monday midnight
    let timeLimit = undefined;
    if (data.type === "weekly") {
      const d = new Date();
      const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilMonday); d.setHours(23, 59, 59, 999);
      timeLimit = d.toISOString();
    }
    const habitId = ((data.type === "daily" || data.type === "weekly") && data.syncHabit) ? genId() : null;
    let finalDiff = data.difficulty;
    const tLower = data.title.toLowerCase();
    const isSimple = tLower.includes("liegest\u00FCtz") || tLower.includes("situp") || tLower.includes("kniebeuge") || tLower.includes("wasser");
    const numMatch = tLower.match(/\d+/);
    if (state.settings?.autoDifficulty !== false && isSimple && numMatch && parseInt(numMatch[0], 10) <= 20) {
      finalDiff = "easy";
    }

    const quest = normalizeQuestForStorage({
      id: genId(), title: data.title,
      description: data.description || undefined,
      subQuests: data.subQuests.length > 0 ? data.subQuests : undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
      fromTemplate: data.fromTemplate,
      difficulty: finalDiff, category: data.category, type: data.type,
      priority: data.priority,
      energy: data.energy,
      context: data.context || undefined,
      createdAt: getToday(), createdAtMs: Date.now(),
      ...(timeLimit ? { timeLimit } : {}),
      ...(habitId ? { linkedHabitId: habitId } : {}),
      ...(data.dueDate ? { dueDate: data.dueDate } : {}),
    });
    const { quest: questWithReminder, reminder } = attachQuestReminder(quest, data.reminderPreset, data.reminderAt);

    let nextState = {
      ...state,
      quests: [...state.quests, questWithReminder],
      reminders: reminder ? [...(state.reminders || []), reminder] : (state.reminders || []),
      dailyUserQuestsCreated: bypassDailyLimit ? createdCount : createdCount + 1
    };

    // Save to custom pool if requested
    if (!input && qSaveToPool) {
      const pool = state.customQuestPool || { templates: [], favorites: [], recentlyUsed: [], collections: [] };
      if (pool.templates.length < 50) {
        const template = {
          id: genId(),
          title: questWithReminder.title,
          description: questWithReminder.description || "",
          category: questWithReminder.category,
          difficulty: questWithReminder.difficulty,
          type: questWithReminder.type,
          subQuestTitles: data.subQuests.map(sq => sq.title),
          tags: data.tags,
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
    const recent = [questWithReminder.title, ...(pool.recentlyUsed || []).filter(t => t !== questWithReminder.title)].slice(0, 10);
    nextState.customQuestPool = { ...pool, ...(nextState.customQuestPool || {}), recentlyUsed: recent };

    if (habitId) {
      const linkedHabit = {
        id: habitId,
        title: data.title,
        category: data.category,
        frequency: data.type,
        history: {},
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        createdAt: getToday(),
        active: true,
        linkedQuestId: questWithReminder.id
      };
      nextState.habits = [...(state.habits || []), linkedHabit];
    }

    persist(nextState);
    if (!input) {
      resetQuestForm();
      setShowCreate(false);
    }
    return questWithReminder;
  };

  const snoozeReminder = useCallback((reminderId, minutes = 30) => {
    if (!state || !reminderId) return;
    const reminderAt = new Date(Date.now() + minutes * 60000).toISOString();
    persist({
      ...state,
      reminders: (state.reminders || []).map(r =>
        r.id === reminderId
          ? { ...r, reminderAt, fired: false, snoozedAt: Date.now(), snoozeMinutes: minutes }
          : r
      ),
      quests: (state.quests || []).map(q =>
        q.reminderId === reminderId
          ? { ...q, reminderAt, reminderPreset: "snoozed" }
          : q
      ),
    });
    notify(ltState(state, "quests.reminderSnoozed", { minutes }), "info");
  }, [state, persist, notify]);

  const completeEmergencyQuest = useCallback((eq) => {
    if (!state || state.emergencyDone) return;
    const result = buildCompleteEmergencyQuestState(eq, state, processAchievementsPure);
    persist(result.nextState);
    const flow = buildEmergencyRewardFlow(result, getStateLocale(state));
    enqueueRewardFlow(flow);
    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    } catch (e) { /* Graceful fallback */ }
  }, [state, persist, processAchievementsPure, enqueueRewardFlow]);

  const addChainedQuest = useCallback((title, category, difficulty, options = {}) => {
    if (!title.trim()) return;
    const questLimit = getDailyQuestCreationStatus(state);
    const bypassDailyLimit = options.bypassDailyLimit === true;
    if (!questLimit.canCreate && !bypassDailyLimit) {
      notify(ltState(state, "quests.freeLimit"), "warning");
      return;
    }
    const totalSteps = 3;
    const firstQuest = normalizeQuestForStorage(generateChainedQuest(title, category, difficulty, 1, totalSteps));
    persist({ ...state, quests: [...state.quests, firstQuest], dailyUserQuestsCreated: bypassDailyLimit ? questLimit.createdCount : questLimit.createdCount + 1 });
    notify(ltState(state, "quests.chainStarted", { steps: totalSteps }), "info");
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
    notify(ltState(state, "quests.subQuestCompleted", { title: subQuest.title, xp: subQuestXp }), "success");
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { }
  }, [state, persist, notify]);

  // ─── QUEST POOL MANAGEMENT ────────────────────────────────────
  const createQuestFromTemplate = useCallback((template) => {
    if (!state) return;
    const questLimit = getDailyQuestCreationStatus(state);
    const createdCount = questLimit.createdCount;
    if (!questLimit.canCreate) {
      notify(ltState(state, "quests.freeLimit"), "warning");
      return;
    }

    const subQuestList = (template.subQuestTitles || []).map((title, i) => ({
      id: genId(), title, completed: false, completedAt: null, order: i + 1,
    }));

    const quest = normalizeQuestForStorage({
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
    });

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
    notify(ltState(state, "quests.templateCreated", { title: template.title }), "success");
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
    notify(ltState(state, "quests.templateRemoved"), "info");
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

  // ── Fokus-Amulett: Set daily focus quest ──
  const setDailyFocusQuest = useCallback((questId) => {
    if (!state) return;
    try {
      const { hasFocusQuestAbility } = require('../data/artifactHelpers.js');
      if (!hasFocusQuestAbility(state)) {
        notify(ltState(state, "quests.focusAmuletRequired"), "info");
        return;
      }
    } catch (e) { return; }
    // Toggle: if already focused, unfocus
    const newFocus = state.dailyFocusQuestId === questId ? null : questId;
    persist({ ...state, dailyFocusQuestId: newFocus });
    if (newFocus) {
      notify(ltState(state, "quests.dailyFocusSet"), "success");
    } else {
      notify(ltState(state, "quests.dailyFocusRemoved"), "info");
    }
  }, [state, persist, notify]);

  const finishDungeon = useCallback(async (dungeon, result) => {
    const oldLevel = state.level;
    let next = calculateLevelUp(state, result.xp);
    const didLevelUp = next._didLevelUp;
    const earnedPoints = next._levelsGained;
    const newLevel = next.level;
    trackEvent('dungeon_entered', { rank: dungeon.rank, floors: dungeon.floors, won: result.won });

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

    // ── Gate Artifact Drop (only on victory) ──
    let artifactDrop = null;
    if (result.won) {
      try {
        const { rollArtifactDrop } = await import('../data/artifactHelpers.js');
        const discoveredIds = next.artifacts?.discovered || [];
        artifactDrop = rollArtifactDrop(dungeon.rank, discoveredIds);
        if (artifactDrop) {
          next.artifacts = {
            ...next.artifacts,
            discovered: [...discoveredIds, artifactDrop.id],
            totalFound: (next.artifacts?.totalFound || 0) + 1,
          };
        }
      } catch (e) { /* graceful fallback */ }
    }

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
    if (artifactDrop) passiveToasts.push({ msg: ltState(state, "notifications.artifactDiscovered", { icon: artifactDrop.icon, name: artifactDrop.name }), type: 'named', delayMs: 300 });

    const flow = buildDungeonRewardFlow(
      dungeon, result, didLevelUp, earnedPoints, newLevel, oldLevel,
      result.xp, totalGold, newNameds, newAchievements, artifactDrop, getStateLocale(state)
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
    if (currentInSlot >= slotData.maxSlots) { notify(ltState(state, "notifications.shadowSlotFull", { slot: slotData.name, max: slotData.maxSlots }), "info"); return; }
    const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: true, deploymentSlot: slot } : s);
    persist({ ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } });
    notify(ltState(state, "notifications.shadowDeployed", { slot: slotData.name }), "shadow");
  }, [state, persist, notify]);

  const undeployShadow = useCallback((shadowId) => {
    const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: false, deploymentSlot: null } : s);
    persist({ ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } });
    notify(ltState(state, "notifications.shadowRecalled"), "info");
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
    notify(ltState(state, "notifications.shadowEvolved", { name: shadow.name, tier: shadow.tier + 1, tierName: nextTier.name }), "shadow");
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
        setTimeout(() => triggerSystemMessage(ltState(state, "shop.notifications.recoveryTitle"), [
          ltState(state, "shop.notifications.recoveryConsumed"),
          ltState(state, "shop.notifications.recoveryRestored"),
          ltState(state, "shop.notifications.recoveryStreak", { streak: recoverStreak }),
          ltState(state, "shop.notifications.recoveryCleared")
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
    trackEvent('shop_purchase', { itemId: item.id, cost: finalCost, currency: 'gold' });
    notify(ltState(state, "shop.notifications.purchased", { name: item.name }), item.id === "potion_heal" ? "success" : "gold");
  };

  const equipItem = (item, slot) => { const newSlots = { ...state.equipment.slots, [slot]: item }; let next = { ...state, equipment: { ...state.equipment, slots: newSlots } }; next = processAchievements(next); persist(next); notify(ltState(state, "shop.notifications.equipped", { name: item.name }), "info"); };
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
    notify(ltState(state, "stats.increased", { stat: getCategoryLabel(statKey, getStateLocale(state)) || statKey }), "success");
  }, [state, persist, notify]);



  const finishSetup = name => {
    const s = createFreshHunterState(name);
    persist(s);
    setShowSetup(false);
  };

  // ─ DAWN/DUSK PROTOCOL ─
  const startDawnDuskRun = useCallback((type) => {
    if (!state) return;
    const tasks = type === "dawn" ? (state.dawnDusk?.morningTasks || []) : (state.dawnDusk?.eveningTasks || []);
    if (!tasks.length) { notify(ltState(state, "quests.noRoutineTasks"), "warning"); return; }
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
    triggerSystemMessage(
      ltState(state, type === "dawn" ? "systemCoach.protocolDawnTitle" : "systemCoach.protocolDuskTitle"),
      [
      ltState(state, type === "dawn" ? "systemCoach.protocolDawnStart" : "systemCoach.protocolDuskStart"),
      ltState(state, "systemCoach.protocolFloors", { count: tasks.length }),
      ltState(state, "systemCoach.protocolTimer", { minutes: type === "dawn" ? "90" : "60" }),
      ltState(state, "systemCoach.protocolPerfect")
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
        enqueueRewardFlow(buildProtocolRewardFlow(run, xpGain, true, elapsed, getStateLocale(state)));
      } else {
        notify(ltState(state, "quests.protocolCompleted", { xp: xpGain }), "success");
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
    notify(ltState(state, "quests.routineConfigured", {
      period: ltState(state, type === "dawn" ? "quests.routineMorning" : "quests.routineEvening"),
      count: tasks.length,
    }), "success");
  }, [state, persist, notify]);

  const abandonProtocolRun = useCallback(() => {
    if (!state?.dawnDusk?.currentRun) return;
    persist({ ...state, dawnDusk: { ...state.dawnDusk, currentRun: null } });
    notify(ltState(state, "quests.protocolAbandoned"), "warning");
  }, [state, persist, notify]);

  // ─ CHARISMA DUNGEONS ─
  const startCharismaChain = useCallback((chainId) => {
    if (!state) return;
    const chain = CHARISMA_CHAINS.find(c => c.id === chainId);
    if (!chain) return;
    const unlocked = state.charismaDungeons?.unlockedChains || ["social_exposure"];
    if (!unlocked.includes(chainId)) { notify(ltState(state, "questActions.charismaNotUnlocked"), "warning"); return; }
    if (state.charismaDungeons?.activeChains?.[chainId]) { notify(ltState(state, "questActions.charismaAlreadyActive"), "info"); return; }
    if (state.charismaDungeons?.completedChains?.includes(chainId)) { notify(ltState(state, "questActions.charismaAlreadyCompleted"), "info"); return; }
    const step = chain.steps[0];
    const quest = {
      id: genId(),
      title: ltState(state, "questActions.charismaQuestTitle", { name: chain.name, floor: 1, title: step.title }),
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
    notify(ltState(state, "questActions.charismaStarted", { name: chain.name, total: chain.steps.length, title: step.title }), "info");
  }, [state, persist, notify]);

  // ─ SOUL LINK (Firestore-backed) ─
  const createSoulLinkCode = useCallback(async () => {
    if (!state) return;
    try {
      const { createSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      const { linkCode } = await createSoulLink(state, auth.currentUser);
      persist({ ...state, soulLink: { ...(state.soulLink || {}), linkCode, linkedAt: getToday() } });
      notify(ltState(state, "questActions.soulLinkCreated", { code: linkCode }), "success");
      return linkCode;
    } catch (e) { notify(ltState(state, "questActions.soulLinkCreateFailed"), "warning"); }
  }, [state, persist, notify]);

  const joinSoulLinkCode = useCallback(async (code) => {
    if (!state) return;
    try {
      const { joinSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      const result = await joinSoulLink(code.toUpperCase(), state, auth.currentUser);
      if (!result) { notify(ltState(state, "questActions.soulLinkCodeUnavailable"), "warning"); return; }
      persist({ ...state, soulLink: { ...(state.soulLink || {}), ...result, linkCode: code.toUpperCase(), linkedAt: getToday() } });
      notify(ltState(state, "questActions.soulLinkConnected", { name: result.partnerName }), "success");
    } catch (e) { notify(ltState(state, "questActions.soulLinkConnectFailed"), "warning"); }
  }, [state, persist, notify]);

  const breakSoulLinkCode = useCallback(async () => {
    if (!state?.soulLink?.linkCode) return;
    try {
      const { breakSoulLink } = await import('../multiplayer/soulLinkFirebase.js');
      await breakSoulLink(state.soulLink.linkCode, auth.currentUser?.uid);
    } catch (_) { }
    persist({ ...state, soulLink: { ...DEFAULT_STATE.soulLink } });
    notify(ltState(state, "questActions.soulLinkBroken"), "info");
  }, [state, persist, notify]);

  const sendReviveToPartner = useCallback(async () => {
    if (!state?.soulLink?.linkCode || !auth.currentUser) return;
    try {
      const { sendRevive } = await import('../multiplayer/soulLinkFirebase.js');
      await sendRevive(state.soulLink.linkCode, auth.currentUser.uid, state.soulLink.partnerUid);
      persist({ ...state, soulLink: { ...state.soulLink, revivesLeft: Math.max(0, (state.soulLink.revivesLeft || 0) - 1) } });
      notify(ltState(state, "questActions.soulLinkReviveSent", { name: state.soulLink.partnerName }), "success");
    } catch (_) { notify(ltState(state, "questActions.soulLinkReviveFailed"), "warning"); }
  }, [state, persist, notify]);

  const theme = useMemo(() => THEMES[state?.selectedTheme || "default"], [state?.selectedTheme]);

  // Sync theme to CSS data-attribute so CSS custom properties (tokens.css) stay in sync
  useEffect(() => {
    document.documentElement.dataset.theme = state?.selectedTheme || "default";
  }, [state?.selectedTheme]);
  const modifier = state?.todayModifier || getDailyModifier();

  // ─ GEM SYSTEM FUNCTIONS ─ (declarations moved above completeQuest to avoid TDZ)

  // Watch a rewarded ad (simulated)
  const watchRewardedAd = useCallback(() => {
    if (!state) return false;
    const today = getToday();
    const adsToday = state.lastAdWatchDate === today ? (state.adsWatchedToday || 0) : 0;
    if (adsToday >= 5) {
      notify(ltState(state, "shop.notifications.adLimit"), "warning");
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
    notify(ltState(state, "shop.notifications.gemsReceived", { count: gemReward }), "named");
    return gemReward;
  }, [state, persist, notify]);

  // Claim daily gem bonus
  const claimDailyGemBonus = useCallback(() => {
    if (!state) return false;
    const today = getToday();
    if (state.gemStreak?.lastClaimDate === today) {
      notify(ltState(state, "shop.notifications.dailyAlreadyClaimed"), "info");
      return false;
    }
    // Check if streak continues (yesterday or first time)
    const yesterdayStr = getYesterdayKey();
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
      notify(ltState(state, "shop.notifications.day7Bonus", { gems: gemReward, streak: newStreak }), "named");
    } else {
      notify(ltState(state, "shop.notifications.dailyGemBonus", { gems: gemReward, streak: newStreak }), "success");
    }
    return gemReward;
  }, [state, persist, notify]);

  const activatePremiumCode = useCallback((code) => {
    if (!state) return { ok: false, message: ltState(state, "premium.messages.appNotReady") };

    const result = redeemBetaPremiumCode(state.premium, code);
    if (!result.ok) {
      notify(result.message, "warning");
      return result;
    }

    const next = { ...state, premium: result.premium };
    persist(next);
    notify(result.message, "success");
    triggerSystemMessage(ltState(state, "premium.messages.activatedTitle"), [
      ltState(state, "premium.messages.statusConfirmed"),
      ltState(state, "premium.messages.codeUnlocked", { label: result.code.label }),
      ltState(state, "premium.messages.activeUntil", { date: result.activeUntilLabel }),
      ltState(state, "premium.messages.billingDisabled")
    ]);
    return result;
  }, [state, persist, notify, triggerSystemMessage]);

  const premiumStatus = useMemo(() => getPremiumStatus(state?.premium), [state?.premium]);
  const questCreationStatus = useMemo(() => getDailyQuestCreationStatus(state), [state?.premium, state?.dailyUserQuestsCreated]);

  // Buy a gem shop item
  const buyGemItem = useCallback((item) => {
    if (!state) return;
    if ((state.gems || 0) < item.cost) {
      notify(ltState(state, "shop.notifications.notEnoughGems"), "warning");
      return;
    }
    // Non-repeatable check
    if (!item.repeatable && (state.gemPurchases || []).includes(item.id)) {
      notify(ltState(state, "shop.notifications.alreadyBought"), "info");
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
      triggerSystemMessage(ltState(state, "shop.notifications.boosterTitle"), [
        ltState(state, "shop.notifications.boosterUsed", { name: item.name }),
        `${item.desc}`,
        ltState(state, "shop.notifications.durationHours", { hours: Math.round(item.duration / 3600000) }),
        ltState(state, "shop.notifications.boosterBlessing")
      ]);
    } else if (item.type === "theme") {
      effects.selectedTheme = item.themeKey;
    } else if (item.type === "title") {
      effects.selectedTitle = item.name;
    } else if (item.type === "transition") {
      effects.selectedPageTransition = item.transitionKey || "domain_shift";
      triggerSystemMessage(ltState(state, "shop.notifications.transitionTitle"), [
        ltState(state, "shop.notifications.transitionLoaded", { name: item.name }),
        item.desc || ltState(state, "shop.notifications.transitionFallback"),
        ltState(state, "shop.notifications.transitionUpdated")
      ]);
    } else if (item.type === "consumable") {
      // Handle specific consumables
      if (item.id === "gem_extra_slot") {
        effects.extraDailySlots = (state.extraDailySlots || 0) + 1;
      } else if (item.id === "gem_dungeon_refresh") {
        effects.dungeons = generateDungeons(getRank(state.level || 1).name);
        effects.lastDungeonRefresh = getToday();
      notify(ltState(state, "shop.notifications.dungeonsRefreshed"), "success");
      } else if (item.id === "gem_stat_reset") {
        const totalStatPoints = Object.values(state.stats || {}).reduce((a, b) => a + b, 0);
        effects.stats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
        effects.statPoints = (state.statPoints || 0) + totalStatPoints;
        triggerSystemMessage(ltState(state, "shop.notifications.statResetTitle"), [
          ltState(state, "shop.notifications.statResetDone"),
          ltState(state, "shop.notifications.statResetAvailable", { points: totalStatPoints + (state.statPoints || 0) }),
          ltState(state, "shop.notifications.statResetHint")
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
    trackEvent('shop_purchase', { itemId: item.id, cost: item.cost, currency: 'gems' });
    if (item.type !== "consumable" || !item.id.startsWith("gem_stat_reset")) {
      notify(ltState(state, "shop.notifications.purchased", { name: item.name }), item.type === "booster" ? "success" : "named");
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
    setDailyFocusQuest,
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
    activatePremiumCode,
    premiumStatus,
    questCreationStatus,
    getActiveGemBoosters,
    getGemBoosterMultipliers,
    // Screen Time gamification
    updateScreenTimeData,
    claimScreenTimeReward,
    GEM_SHOP_ITEMS,
  };
}


