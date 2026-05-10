// ─── STORAGE ──────────────────────────────────────────────────
// Extracted from data/constants.jsx
// Firebase + LocalStorage persistence and state migration.

import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEFAULT_STATE } from "./defaultState.js";
import { calcShadowXpToNext, genId, getToday, recalculateLevelFromTotalXp } from "./helpers.js";
import { syncWidgetData } from "../services/widgetDataService.js";

// ─── DATA MIGRATION ───────────────────────────────────────────
export function migrateState(oldState) {
  if (!oldState) return null;

  const s = { ...DEFAULT_STATE, ...oldState };
  s.level = Math.max(1, s.level || 1);
  s.xp = s.xp || 0;

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
  // Gem system migration
  s.gems = s.gems || 0;
  s.totalGemsEarned = s.totalGemsEarned || 0;
  s.gemStreak = { ...DEFAULT_STATE.gemStreak, ...(oldState.gemStreak || {}) };
  s.activeGemBoosters = oldState.activeGemBoosters || [];
  s.gemPurchases = oldState.gemPurchases || [];
  s.adsWatchedToday = oldState.adsWatchedToday || 0;
  s.lastAdWatchDate = oldState.lastAdWatchDate || null;

  // V4 → V5 Legacy: convert shadows to shadowArmy
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

  // Recalculate level from totalXpEarned (fixes inflated levels)
  const evaluated = recalculateLevelFromTotalXp(s);
  s.level = evaluated.level;
  s.xp = evaluated.xp;
  s.totalXpEarned = evaluated.totalXpEarned;

  return s;
}

// ─── LOAD / SAVE ──────────────────────────────────────────────
export async function loadState() {
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("System: Cloud-Daten geladen.");
        return { data: migrateState(docSnap.data()), source: "cloud" };
      }
    }
    let r = await window.storage.get("sl-todo-v5");
    if (!r) r = await window.storage.get("sl-todo-v4");
    if (r) {
      const s = migrateState(JSON.parse(r.value));
      return { data: s, source: "local" };
    }
    return { data: null, source: "none" };
  } catch (e) {
    console.error("System: Ladefehler:", e);
    return { data: null, source: "error" };
  }
}

export async function saveState(s) {
  try {
    await window.storage.set("sl-todo-v5", JSON.stringify(s));
    const user = auth.currentUser;
    if (user && s) {
      const docRef = doc(db, "users", user.uid);
      const { _abilityActivated, _jobLevelUp, ...persistenceState } = s;
      const cleanState = JSON.parse(JSON.stringify(persistenceState));
      if (user.email) cleanState.email = user.email;
      if (user.displayName || cleanState.hunterName) {
        cleanState.displayName = user.displayName || cleanState.hunterName;
      }
      await setDoc(docRef, cleanState, { merge: true });
    }
    // Sync widget data (non-blocking, fails silently on non-iOS)
    syncWidgetData(s).catch(() => {});
  } catch (e) {
    console.error("System: Speicherfehler:", e);
  }
}
