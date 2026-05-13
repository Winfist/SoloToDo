// Storage, migration, and cloud/local conflict handling.

import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEFAULT_STATE } from "./defaultState.js";
import { calcShadowXpToNext, genId, getToday, getXpForLevel, recalculateLevelFromTotalXp } from "./helpers.js";
import { syncWidgetData } from "../services/widgetDataService.js";

const ACTIVE_STATE_KEY = "sl-todo-v5";
const LEGACY_STATE_KEY = "sl-todo-v4";
const PENDING_CLOUD_SYNC_KEY = "sl-todo-v5-pending-cloud-sync";
const CLOCK_SKEW_TOLERANCE_MS = 5000;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function deriveTotalXpFromLevel(level, xp) {
  const safeLevel = Math.max(1, Math.min(100, Math.floor(toFiniteNumber(level, 1))));
  let total = Math.max(0, Math.floor(toFiniteNumber(xp, 0)));
  for (let lv = 1; lv < safeLevel; lv += 1) {
    total += getXpForLevel(lv);
  }
  return total;
}

export function getStateProgressScore(state) {
  if (!state) return 0;
  const statsTotal = Object.values(state.stats || {}).reduce((sum, value) => sum + toFiniteNumber(value), 0);
  const jobLevelTotal = Object.values(state.jobs?.levels || {}).reduce((sum, value) => sum + toFiniteNumber(value), 0);
  const dungeonWins = count(state.dungeonHistory?.filter?.(entry => entry?.won));
  const completedQuests = Math.max(toFiniteNumber(state.totalQuestsCompleted), count(state.completedQuests));

  return (
    Math.max(0, toFiniteNumber(state.level, 1) - 1) * 4
    + Math.floor(toFiniteNumber(state.totalXpEarned) / 50)
    + completedQuests * 6
    + statsTotal * 2
    + count(state.shadowArmy?.shadows) * 10
    + dungeonWins * 8
    + count(state.achievements?.unlocked) * 3
    + jobLevelTotal * 3
    + count(state.goals) * 2
    + count(state.habits) * 2
    + count(state.lifeDomains)
    + count(state.gemPurchases)
    + count(state.shopPurchases)
    + count(state.customQuestPool?.templates)
  );
}

export function getStateTimestamp(state) {
  return Math.max(
    toFiniteNumber(state?.lastModifiedAtMs),
    toFiniteNumber(state?.lastInteractionTimeMs),
    toFiniteNumber(state?.updatedAtMs),
    toFiniteNumber(state?.savedAtMs)
  );
}

function hasMeaningfulProfile(state) {
  return Boolean(String(state?.hunterName || "").trim()) || getStateProgressScore(state) > 0;
}

function mergeLocalOnlyCaches(primary, fallback) {
  if (!primary || !fallback) return primary;
  return {
    ...primary,
    healthDailyHistory: {
      ...(fallback.healthDailyHistory || {}),
      ...(primary.healthDailyHistory || {}),
    },
    screenTimeDailyHistory: {
      ...(fallback.screenTimeDailyHistory || {}),
      ...(primary.screenTimeDailyHistory || {}),
    },
    screenTimeRewardsClaimed: {
      ...(fallback.screenTimeRewardsClaimed || {}),
      ...(primary.screenTimeRewardsClaimed || {}),
    },
  };
}

export function resolveStateConflict(localState, cloudState) {
  if (!localState && !cloudState) return { data: null, source: "none", reason: "empty" };
  if (!localState) return { data: cloudState, source: "cloud", reason: "cloud-only" };
  if (!cloudState) return { data: localState, source: "local", reason: "local-only" };

  const localScore = getStateProgressScore(localState);
  const cloudScore = getStateProgressScore(cloudState);
  const localTime = getStateTimestamp(localState);
  const cloudTime = getStateTimestamp(cloudState);
  const localHasProfile = hasMeaningfulProfile(localState);
  const cloudHasProfile = hasMeaningfulProfile(cloudState);

  if (localHasProfile && !cloudHasProfile) {
    return { data: localState, source: "local", reason: "cloud-empty-protected" };
  }

  if (cloudHasProfile && !localHasProfile) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "local-empty" };
  }

  if (localScore >= 12 && cloudScore <= Math.max(4, localScore * 0.35)) {
    return { data: localState, source: "local", reason: "cloud-reset-protected" };
  }

  if (cloudScore >= 12 && localScore <= Math.max(4, cloudScore * 0.35)) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "local-reset-protected" };
  }

  if (localScore >= 6 && cloudScore <= 4 && localScore > cloudScore) {
    return { data: localState, source: "local", reason: "cloud-low-progress-protected" };
  }

  if (cloudScore >= 6 && localScore <= 4 && cloudScore > localScore) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "local-low-progress-protected" };
  }

  if (cloudTime > localTime + CLOCK_SKEW_TOLERANCE_MS) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "cloud-newer" };
  }

  if (localTime > cloudTime + CLOCK_SKEW_TOLERANCE_MS) {
    return { data: localState, source: "local", reason: "local-newer" };
  }

  if (cloudScore > localScore) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "cloud-richer" };
  }

  return { data: localState, source: "local", reason: "local-richer-or-equal" };
}

async function readLocalState() {
  const keys = [ACTIVE_STATE_KEY, LEGACY_STATE_KEY];
  for (const key of keys) {
    try {
      const record = await window.storage.get(key);
      if (!record?.value) continue;
      return { data: migrateState(JSON.parse(record.value)), source: "local", key };
    } catch (e) {
      console.warn(`System: Lokaler Speicher konnte nicht gelesen werden (${key}).`, e);
    }
  }
  return { data: null, source: "none", key: null };
}

export async function cacheStateLocally(state) {
  if (!state) return;
  try {
    await window.storage.set(ACTIVE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("System: Lokaler Speicherfehler:", e);
  }
}

async function markCloudSyncPending(value) {
  try {
    if (value) {
      await window.storage.set(PENDING_CLOUD_SYNC_KEY, String(Date.now()));
    } else {
      await window.storage.delete(PENDING_CLOUD_SYNC_KEY);
    }
  } catch (_) { }
}

function shouldProtectCloudWrite(candidate) {
  if (!candidate) return true;
  const score = getStateProgressScore(candidate);
  return score < 12 || !String(candidate.hunterName || "").trim();
}

function shouldSkipCloudWrite(candidate, cloudState) {
  if (!candidate || !cloudState) return false;
  const candidateScore = getStateProgressScore(candidate);
  const cloudScore = getStateProgressScore(cloudState);
  const candidateHasProfile = hasMeaningfulProfile(candidate);
  const cloudHasProfile = hasMeaningfulProfile(cloudState);

  if (cloudHasProfile && !candidateHasProfile) return true;
  if (cloudScore >= 6 && candidateScore <= 4 && cloudScore > candidateScore) return true;
  return cloudScore >= 12 && candidateScore <= Math.max(4, cloudScore * 0.35);
}

export function migrateState(oldState) {
  if (!oldState) return null;

  const s = { ...DEFAULT_STATE, ...oldState };
  s.level = Math.max(1, s.level || 1);
  s.xp = s.xp || 0;
  s.premium = { ...DEFAULT_STATE.premium, ...(oldState.premium || {}) };
  s.premium.betaCodesRedeemed = oldState.premium?.betaCodesRedeemed || [];

  s.stats = { ...DEFAULT_STATE.stats, ...(oldState.stats || {}) };
  s.shadowArmy = { ...DEFAULT_STATE.shadowArmy, ...(oldState.shadowArmy || {}) };
  s.jobs = { ...DEFAULT_STATE.jobs, ...(oldState.jobs || {}) };
  if (oldState.jobs) {
    s.jobs.levels = { ...DEFAULT_STATE.jobs.levels, ...(oldState.jobs.levels || {}) };
    s.jobs.xp = { ...DEFAULT_STATE.jobs.xp, ...(oldState.jobs.xp || {}) };
    s.jobs.activeAbilityCooldowns = { ...DEFAULT_STATE.jobs.activeAbilityCooldowns, ...(oldState.jobs.activeAbilityCooldowns || {}) };
  }
  s.equipment = { ...DEFAULT_STATE.equipment, ...(oldState.equipment || {}) };
  if (oldState.equipment) {
    s.equipment.slots = { ...DEFAULT_STATE.equipment.slots, ...(oldState.equipment.slots || {}) };
  }
  s.achievements = { ...DEFAULT_STATE.achievements, ...(oldState.achievements || {}) };
  s.hiddenQuests = { ...DEFAULT_STATE.hiddenQuests, ...(oldState.hiddenQuests || {}) };
  s.healthPreferences = { ...DEFAULT_STATE.healthPreferences, ...(oldState.healthPreferences || {}) };
  s.healthPreferences.manualSleepLog = {
    ...DEFAULT_STATE.healthPreferences.manualSleepLog,
    ...(oldState.healthPreferences?.manualSleepLog || {})
  };
  s.healthDailyHistory = {
    ...DEFAULT_STATE.healthDailyHistory,
    ...(oldState.healthDailyHistory || {})
  };
  s.screenTimePreferences = {
    ...DEFAULT_STATE.screenTimePreferences,
    ...(oldState.screenTimePreferences || {})
  };
  s.screenTimeDailyHistory = {
    ...DEFAULT_STATE.screenTimeDailyHistory,
    ...(oldState.screenTimeDailyHistory || {})
  };
  s.screenTimeRewardsClaimed = {
    ...DEFAULT_STATE.screenTimeRewardsClaimed,
    ...(oldState.screenTimeRewardsClaimed || {})
  };
  s.screenTimeSyncDate = oldState.screenTimeSyncDate || DEFAULT_STATE.screenTimeSyncDate;
  s.story = { ...DEFAULT_STATE.story, ...(oldState.story || {}) };
  const focusModes = DEFAULT_STATE.focus.modes;
  const oldFocus = oldState.focus || {};
  s.focus = {
    ...DEFAULT_STATE.focus,
    ...oldFocus,
    totalSessions: oldFocus.totalSessions || oldState.stats?.focusSessions || 0,
    totalMinutes: oldFocus.totalMinutes || oldState.stats?.focusMinutes || 0,
    daily: { ...(oldFocus.daily || {}) },
    modes: Object.fromEntries(
      Object.keys(focusModes).map(key => [
        key,
        { ...focusModes[key], ...(oldFocus.modes?.[key] || {}) }
      ])
    ),
    recentSessions: Array.isArray(oldFocus.recentSessions) ? oldFocus.recentSessions.slice(0, 12) : [],
  };
  s.shadowRegression = { ...DEFAULT_STATE.shadowRegression, ...(oldState.shadowRegression || {}) };
  s.soulLink = { ...DEFAULT_STATE.soulLink, ...(oldState.soulLink || {}) };
  s.seasons = { ...DEFAULT_STATE.seasons, ...(oldState.seasons || {}) };
  s.dawnDusk = { ...DEFAULT_STATE.dawnDusk, ...(oldState.dawnDusk || {}) };
  s.charismaDungeons = {
    ...DEFAULT_STATE.charismaDungeons,
    ...(oldState.charismaDungeons || {}),
    unlockedChains: oldState.charismaDungeons?.unlockedChains ?? ["social_exposure"],
    activeChains: oldState.charismaDungeons?.activeChains ?? {},
    completedChains: oldState.charismaDungeons?.completedChains ?? [],
    stepHistory: oldState.charismaDungeons?.stepHistory ?? [],
  };
  s.gems = s.gems || 0;
  s.totalGemsEarned = s.totalGemsEarned || 0;
  s.gemStreak = { ...DEFAULT_STATE.gemStreak, ...(oldState.gemStreak || {}) };
  s.activeGemBoosters = oldState.activeGemBoosters || [];
  s.gemPurchases = oldState.gemPurchases || [];
  s.adsWatchedToday = oldState.adsWatchedToday || 0;
  s.lastAdWatchDate = oldState.lastAdWatchDate || null;
  s.selectedPageTransition = oldState.selectedPageTransition || DEFAULT_STATE.selectedPageTransition;
  s.settings = { ...DEFAULT_STATE.settings, ...(oldState.settings || {}) };

  if (!oldState.shadowArmy && oldState.shadows) {
    const newShadows = (oldState.shadows || []).map(sh => ({
      id: sh.id || genId(),
      name: sh.name,
      originalSource: sh.name,
      sourceDate: sh.date || getToday(),
      class: "soldier", tier: 1, isNamed: false,
      level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
      stats: { power: 10, speed: 10, loyalty: 10, presence: 5 },
      abilities: [], isDeployed: false, deploymentSlot: null,
      evolutionStage: 1, glowColor: "#64748b",
      summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
    }));
    s.shadowArmy = { shadows: newShadows, capacity: 20, formations: { vanguard: [], core: [], rearguard: [] }, totalShadowXp: 0 };
  }

  const hadStoredTotalXp = oldState.totalXpEarned !== undefined && oldState.totalXpEarned !== null;
  const storedTotalXp = toFiniteNumber(oldState.totalXpEarned);
  const shouldTrustStoredTotalXp = hadStoredTotalXp && (storedTotalXp > 0 || toFiniteNumber(oldState.level, 1) <= 1);
  if (shouldTrustStoredTotalXp) {
    const evaluated = recalculateLevelFromTotalXp(s);
    s.level = evaluated.level;
    s.xp = evaluated.xp;
    s.totalXpEarned = evaluated.totalXpEarned;
  } else {
    s.level = Math.max(1, s.level || 1);
    s.xp = Math.max(0, s.xp || 0);
    s.totalXpEarned = deriveTotalXpFromLevel(s.level, s.xp);
  }

  return s;
}

export async function loadState() {
  const local = await readLocalState();
  const user = auth.currentUser;
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  let cloud = { data: null, source: "none" };
  if (user && !isOffline) {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        cloud = { data: migrateState(docSnap.data()), source: "cloud" };
      }
    } catch (e) {
      console.warn("System: Cloud-Daten nicht erreichbar, lokaler Stand wird verwendet.", e);
    }
  }

  const resolved = resolveStateConflict(local.data, cloud.data);
  if (resolved.data) await cacheStateLocally(resolved.data);

  console.log("System: State geladen.", {
    source: resolved.source,
    reason: resolved.reason,
    localScore: getStateProgressScore(local.data),
    cloudScore: getStateProgressScore(cloud.data),
  });

  return resolved;
}

export async function saveState(s) {
  if (!s) return;

  await cacheStateLocally(s);
  syncWidgetData(s).catch(() => {});

  const user = auth.currentUser;
  try {
    if (user) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        await markCloudSyncPending(true);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const { _abilityActivated, _jobLevelUp, ...persistenceState } = s;
      const cleanState = JSON.parse(JSON.stringify(persistenceState));
      if (user.email) cleanState.email = user.email;
      if (user.displayName || cleanState.hunterName) {
        cleanState.displayName = user.displayName || cleanState.hunterName;
      }

      if (shouldProtectCloudWrite(cleanState)) {
        try {
          const docSnap = await getDoc(docRef);
          const cloudState = docSnap.exists() ? migrateState(docSnap.data()) : null;
          if (shouldSkipCloudWrite(cleanState, cloudState)) {
            console.warn("System: Cloud-Speicherung blockiert, um vorhandene Fortschritte vor einem Reset zu schuetzen.");
            return;
          }
        } catch (e) {
          console.warn("System: Cloud-Check nicht erreichbar, lokaler Stand bleibt pending.", e);
          await markCloudSyncPending(true);
          return;
        }
      }

      await setDoc(docRef, cleanState, { merge: true });
      await markCloudSyncPending(false);
    }
  } catch (e) {
    console.error("System: Speicherfehler:", e);
    await markCloudSyncPending(true);
  }
}
