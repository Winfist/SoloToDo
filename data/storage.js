// Storage, migration, and cloud/local conflict handling.

import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEFAULT_STATE } from "./defaultState.js";
import { calcShadowXpToNext, genId, getToday, getXpForLevel, recalculateLevelFromTotalXp } from "./helpers.js";
import { normalizeQuestForStorage } from "./questUtils.js";
import { syncWidgetData } from "../services/widgetDataService.js";

const ACTIVE_STATE_KEY = "sl-todo-v5";
const LEGACY_STATE_KEY = "sl-todo-v4";
const PENDING_CLOUD_SYNC_KEY = "sl-todo-v5-pending-cloud-sync";
const CLOCK_SKEW_TOLERANCE_MS = 5000;
const MAX_SYNC_EVENTS = 500;

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

function getScopedKey(baseKey, user = auth.currentUser) {
  return user?.uid ? `${baseKey}:${user.uid}` : baseKey;
}

function stateBelongsToUser(state, user) {
  if (!state || !user) return true;
  const ownerUid = state.ownerUid || state.uid || state.userId || state.authUid;
  if (ownerUid) return ownerUid === user.uid;
  if (state.email && user.email) {
    return String(state.email).toLowerCase() === String(user.email).toLowerCase();
  }
  const createdAtMs = Date.parse(user.metadata?.creationTime || "");
  const userWasJustCreated = Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 10 * 60 * 1000;
  if (userWasJustCreated) return false;
  if (state.hunterName && user.displayName) {
    return String(state.hunterName).trim().toLowerCase() === String(user.displayName).trim().toLowerCase();
  }
  return false;
}

function stampStateForUser(state, user = auth.currentUser) {
  if (!state || !user) return state;
  return {
    ...state,
    ownerUid: user.uid,
    email: user.email || state.email || null,
    displayName: state.hunterName || user.displayName || state.displayName || "",
  };
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

function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}

function parseTime(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function getItemTimestamp(item) {
  return Math.max(
    toFiniteNumber(item?.lastModifiedAtMs),
    toFiniteNumber(item?.updatedAtMs),
    toFiniteNumber(item?.completedAtMs),
    toFiniteNumber(item?.createdAtMs),
    parseTime(item?.completedAt),
    parseTime(item?.date),
    parseTime(item?.createdAt)
  );
}

function normalizeKeyPart(value) {
  return String(value || "").trim().toLowerCase();
}

function mergeArrayByKey(primary = [], fallback = [], keyFn = item => item?.id || item?.key || JSON.stringify(item)) {
  const map = new Map();
  for (const item of [...arrayOf(fallback), ...arrayOf(primary)]) {
    if (!item) continue;
    const key = keyFn(item);
    if (!key) continue;
    const previous = map.get(key);
    if (!previous) {
      map.set(key, item);
      continue;
    }
    const preferNext = getItemTimestamp(item) >= getItemTimestamp(previous);
    map.set(key, {
      ...(preferNext ? previous : item),
      ...(preferNext ? item : previous),
      completed: Boolean(previous.completed || item.completed),
    });
  }
  return Array.from(map.values());
}

function unionValues(...arrays) {
  return [...new Set(arrays.flatMap(arrayOf).filter(value => value !== undefined && value !== null))];
}

function mergeDateMaps(primary = {}, fallback = {}) {
  const merged = { ...(fallback || {}) };
  for (const [key, value] of Object.entries(primary || {})) {
    const previous = merged[key];
    if (previous && typeof previous === "object" && typeof value === "object") {
      merged[key] = { ...previous, ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function mergeMicroHabits(primary = {}, fallback = {}) {
  const primaryDaily = primary?.daily || {};
  const fallbackDaily = fallback?.daily || {};
  const daily = {};
  const dates = new Set([...Object.keys(fallbackDaily), ...Object.keys(primaryDaily)]);

  for (const date of dates) {
    const left = primaryDaily[date] || {};
    const right = fallbackDaily[date] || {};
    const habitIds = new Set([...Object.keys(right), ...Object.keys(left)]);
    daily[date] = {};
    for (const habitId of habitIds) {
      daily[date][habitId] = Math.max(toFiniteNumber(left[habitId]), toFiniteNumber(right[habitId]));
    }
  }

  const habits = arrayOf(primary?.habits).length ? primary.habits : fallback?.habits;
  const dailyTapTotal = Object.values(daily).reduce(
    (sum, day) => sum + Object.values(day || {}).reduce((daySum, value) => daySum + toFiniteNumber(value), 0),
    0
  );

  return {
    ...(fallback || {}),
    ...(primary || {}),
    habits,
    daily,
    totalTaps: Math.max(toFiniteNumber(primary?.totalTaps), toFiniteNumber(fallback?.totalTaps), dailyTapTotal),
  };
}

function mergeClaimMaps(primary = {}, fallback = {}) {
  const keys = new Set([...Object.keys(primary || {}), ...Object.keys(fallback || {})]);
  const merged = {};
  for (const key of keys) {
    merged[key] = Boolean(primary?.[key] || fallback?.[key]);
  }
  return merged;
}

function mergeNumericMaps(primary = {}, fallback = {}, mode = "max") {
  const keys = new Set([...Object.keys(primary || {}), ...Object.keys(fallback || {})]);
  const merged = {};
  for (const key of keys) {
    const a = toFiniteNumber(primary?.[key]);
    const b = toFiniteNumber(fallback?.[key]);
    merged[key] = mode === "sum" ? a + b : Math.max(a, b);
  }
  return merged;
}

function completedQuestKey(quest) {
  return quest?.id
    ? `${quest.id}:${quest.completedAt || quest.completedAtMs || ""}`
    : `${normalizeKeyPart(quest?.title)}:${quest?.completedAt || quest?.completedAtMs || ""}`;
}

function questKey(quest) {
  return quest?.id || `${normalizeKeyPart(quest?.title)}:${quest?.type || ""}:${quest?.createdAt || quest?.dueDate || ""}`;
}

function dungeonHistoryKey(entry) {
  return [
    entry?.dungeonId || normalizeKeyPart(entry?.dungeonName),
    entry?.date || "",
    entry?.won ? "won" : "lost",
    entry?.floorsCleared || "",
  ].join(":");
}

function inventoryKey(item) {
  return item?.id || item?.instanceId || `${normalizeKeyPart(item?.name)}:${item?.rarity || ""}:${item?.acquiredAt || ""}`;
}

function shadowKey(shadow) {
  return shadow?.namedId
    ? `named:${shadow.namedId}`
    : shadow?.id || `${normalizeKeyPart(shadow?.originalSource || shadow?.name)}:${shadow?.sourceDate || ""}`;
}

function syncEventKey(event) {
  return event?.id || [
    event?.createdAtMs || event?.createdAt || event?.date || "",
    event?.type || "progress_delta",
    toFiniteNumber(event?.xpDelta),
    toFiniteNumber(event?.goldDelta),
    toFiniteNumber(event?.gemDelta),
    toFiniteNumber(event?.questDelta),
  ].join(":");
}

function choosePremium(primaryPremium = {}, fallbackPremium = {}) {
  // ── Admin revoke check ──
  // If either copy was explicitly revoked, prefer the revoked version so that
  // a stale local cache cannot re-activate premium that an admin took away.
  const primaryRevoked = primaryPremium.status === 'revoked';
  const fallbackRevoked = fallbackPremium.status === 'revoked';
  if (primaryRevoked || fallbackRevoked) {
    // If both are revoked, pick the one with the later revokedAt timestamp
    if (primaryRevoked && fallbackRevoked) {
      return parseTime(primaryPremium.revokedAt) >= parseTime(fallbackPremium.revokedAt)
        ? primaryPremium : fallbackPremium;
    }
    // Only one is revoked – check timestamps to prevent an old cached revoke
    // from overriding a newer admin grant.
    const revokedCopy = primaryRevoked ? primaryPremium : fallbackPremium;
    const otherCopy = primaryRevoked ? fallbackPremium : primaryPremium;
    const revokedAtMs = parseTime(revokedCopy.revokedAt);
    const otherActivatedAtMs = parseTime(otherCopy.lastActivatedAt);
    // Revoke wins unless the other copy was activated *after* the revoke
    if (!otherActivatedAtMs || revokedAtMs >= otherActivatedAtMs) {
      return revokedCopy;
    }
  }

  const primaryUntil = parseTime(primaryPremium.activeUntil);
  const fallbackUntil = parseTime(fallbackPremium.activeUntil);
  const primaryActive = primaryPremium.tier === "hunter_pro" && primaryUntil > Date.now();
  const fallbackActive = fallbackPremium.tier === "hunter_pro" && fallbackUntil > Date.now();
  if (primaryActive && fallbackActive) return primaryUntil >= fallbackUntil ? primaryPremium : fallbackPremium;
  if (primaryActive) return primaryPremium;
  if (fallbackActive) return fallbackPremium;
  return primaryPremium?.tier ? primaryPremium : fallbackPremium;
}

function mergeQuests(primary = [], fallback = [], completedQuests = []) {
  const completedIds = new Set(arrayOf(completedQuests).map(q => q?.id).filter(Boolean));
  const merged = mergeArrayByKey(primary, fallback, questKey);
  return merged
    .map(quest => completedIds.has(quest.id) ? { ...quest, completed: true } : quest)
    .filter(quest => !completedIds.has(quest.id) || quest.type === "daily");
}

function isStarterQuest(quest) {
  return Boolean(quest?.isStarter || String(quest?.id || "").startsWith("starter_") || quest?.origin === "starter");
}

function hasNonStarterProgress(state, completedQuests = []) {
  return Boolean(
    arrayOf(completedQuests).some(q => !isStarterQuest(q))
    || arrayOf(state?.quests).some(q => !q?.isSystem && !isStarterQuest(q))
    || count(state?.dungeonHistory) > 0
    || count(state?.equipment?.inventory) > 0
    || count(state?.shadowArmy?.shadows) > 0
    || count(state?.goals) > 0
    || count(state?.habits) > 0
    || count(state?.customQuestPool?.templates) > 0
    || Object.keys(state?.healthDailyHistory || {}).length > 0
    || Object.keys(state?.screenTimeDailyHistory || {}).length > 0
    || Object.keys(state?.focus?.daily || {}).length > 0
    || Object.keys(state?.microHabits?.daily || {}).length > 0
  );
}

function mergeStateProgress(primary, fallback) {
  if (!primary || !fallback) return primary || fallback;

  let completedQuests = mergeArrayByKey(primary.completedQuests, fallback.completedQuests, completedQuestKey);
  const dungeonHistory = mergeArrayByKey(primary.dungeonHistory, fallback.dungeonHistory, dungeonHistoryKey);
  const achievementsUnlocked = unionValues(primary.achievements?.unlocked, fallback.achievements?.unlocked);
  const achievementsNotified = unionValues(primary.achievements?.notified, fallback.achievements?.notified);
  let quests = mergeQuests(primary.quests, fallback.quests, completedQuests);
  const inventory = mergeArrayByKey(primary.equipment?.inventory, fallback.equipment?.inventory, inventoryKey);
  const shadows = mergeArrayByKey(primary.shadowArmy?.shadows, fallback.shadowArmy?.shadows, shadowKey);
  const today = getToday();
  const primaryHasEstablishedProgress = hasNonStarterProgress(primary, primary.completedQuests);
  const fallbackHasEstablishedProgress = hasNonStarterProgress(fallback, fallback.completedQuests);
  const hasEstablishedProgress = primaryHasEstablishedProgress || fallbackHasEstablishedProgress;
  if (hasEstablishedProgress) {
    completedQuests = completedQuests.filter(q => !isStarterQuest(q));
    quests = quests.filter(q => !isStarterQuest(q));
  }
  const completedQuestXp = completedQuests.reduce((sum, quest) => sum + toFiniteNumber(quest?.xpEarned), 0);
  const completedQuestGold = completedQuests.reduce((sum, quest) => sum + toFiniteNumber(quest?.goldEarned), 0);
  const dungeonXp = dungeonHistory.reduce((sum, entry) => sum + toFiniteNumber(entry?.xp), 0);
  const dungeonGold = dungeonHistory.reduce((sum, entry) => sum + toFiniteNumber(entry?.gold), 0);
  const trustPrimaryTotals = !hasEstablishedProgress || primaryHasEstablishedProgress;
  const trustFallbackTotals = !hasEstablishedProgress || fallbackHasEstablishedProgress;
  const preferenceSource = trustPrimaryTotals ? primary : fallback;
  const mergedLifeDomains = trustPrimaryTotals && trustFallbackTotals
    ? unionValues(primary.lifeDomains, fallback.lifeDomains)
    : arrayOf(preferenceSource.lifeDomains);
  const mergedSettings = trustPrimaryTotals && trustFallbackTotals
    ? { ...(fallback.settings || {}), ...(primary.settings || {}) }
    : { ...(preferenceSource.settings || {}) };
  const syncEvents = mergeArrayByKey(
    trustPrimaryTotals ? primary.syncEvents : [],
    trustFallbackTotals ? fallback.syncEvents : [],
    syncEventKey
  ).slice(-MAX_SYNC_EVENTS);
  const syncEventXp = syncEvents.reduce((sum, event) => sum + toFiniteNumber(event?.xpDelta), 0);
  const syncEventGold = syncEvents.reduce((sum, event) => sum + toFiniteNumber(event?.goldDelta), 0);
  const syncEventGems = syncEvents.reduce((sum, event) => sum + toFiniteNumber(event?.gemDelta), 0);
  const totalXpEarned = Math.max(
    trustPrimaryTotals ? toFiniteNumber(primary.totalXpEarned) : 0,
    trustFallbackTotals ? toFiniteNumber(fallback.totalXpEarned) : 0,
    completedQuestXp + dungeonXp,
    syncEventXp
  );
  const totalGoldEarned = Math.max(
    trustPrimaryTotals ? toFiniteNumber(primary.totalGoldEarned) : 0,
    trustFallbackTotals ? toFiniteNumber(fallback.totalGoldEarned) : 0,
    completedQuestGold + dungeonGold,
    syncEventGold
  );
  const userQuestsToday = quests.filter(q => !q.isSystem && q.createdAt === today).length;

  const maxExistingLevel = Math.max(toFiniteNumber(primary.level, 1), toFiniteNumber(fallback.level, 1));
  const maxExistingStatPoints = Math.max(toFiniteNumber(primary.statPoints), toFiniteNumber(fallback.statPoints));

  let merged = {
    ...fallback,
    ...primary,
    hunterName: preferenceSource.hunterName || primary.hunterName || fallback.hunterName,
    displayName: preferenceSource.displayName || preferenceSource.hunterName || primary.displayName || fallback.displayName || "",
    lifeDomains: mergedLifeDomains,
    selectedTheme: preferenceSource.selectedTheme || primary.selectedTheme || fallback.selectedTheme,
    selectedTitle: preferenceSource.selectedTitle || primary.selectedTitle || fallback.selectedTitle || "",
    selectedPageTransition: preferenceSource.selectedPageTransition || primary.selectedPageTransition || fallback.selectedPageTransition,
    customThemeData: preferenceSource.customThemeData || primary.customThemeData || fallback.customThemeData,
    settings: mergedSettings,
    premium: choosePremium(primary.premium, fallback.premium),
    completedTutorials: unionValues(primary.completedTutorials, fallback.completedTutorials),
    tutorialCompleted: Boolean(primary.tutorialCompleted || fallback.tutorialCompleted),
    stats: mergeNumericMaps(primary.stats, fallback.stats),
    achievements: { ...(fallback.achievements || {}), ...(primary.achievements || {}), unlocked: achievementsUnlocked, notified: achievementsNotified },
    skills: { ...(fallback.skills || {}), ...(primary.skills || {}), unlocked: unionValues(primary.skills?.unlocked, fallback.skills?.unlocked) },
    hiddenQuests: {
      ...(fallback.hiddenQuests || {}),
      ...(primary.hiddenQuests || {}),
      discovered: unionValues(primary.hiddenQuests?.discovered, fallback.hiddenQuests?.discovered),
      completed: unionValues(primary.hiddenQuests?.completed, fallback.hiddenQuests?.completed),
    },
    quests,
    completedQuests,
    reminders: mergeArrayByKey(primary.reminders, fallback.reminders, item => item?.id || item?.questId),
    totalQuestsCompleted: Math.max(toFiniteNumber(primary.totalQuestsCompleted), toFiniteNumber(fallback.totalQuestsCompleted), completedQuests.length),
    syncEvents,
    totalXpEarned,
    totalGoldEarned,
    gold: Math.max(toFiniteNumber(primary.gold), toFiniteNumber(fallback.gold)),
    gems: Math.max(toFiniteNumber(primary.gems), toFiniteNumber(fallback.gems)),
    totalGemsEarned: Math.max(toFiniteNumber(primary.totalGemsEarned), toFiniteNumber(fallback.totalGemsEarned), syncEventGems),
    streak: Math.max(toFiniteNumber(primary.streak), toFiniteNumber(fallback.streak)),
    lastActiveDate: String(primary.lastActiveDate || "") >= String(fallback.lastActiveDate || "") ? primary.lastActiveDate : fallback.lastActiveDate,
    dailyUserQuestsCreated: Math.max(toFiniteNumber(primary.dailyUserQuestsCreated), toFiniteNumber(fallback.dailyUserQuestsCreated), userQuestsToday),
    dailyUserXP: Math.max(toFiniteNumber(primary.dailyUserXP), toFiniteNumber(fallback.dailyUserXP)),
    extraDailySlots: Math.max(toFiniteNumber(primary.extraDailySlots), toFiniteNumber(fallback.extraDailySlots)),
    dungeons: mergeArrayByKey(primary.dungeons, fallback.dungeons, item => item?.instanceId || item?.id),
    dungeonHistory,
    equipment: {
      ...(fallback.equipment || {}),
      ...(primary.equipment || {}),
      slots: { ...(fallback.equipment?.slots || {}), ...(primary.equipment?.slots || {}) },
      inventory,
    },
    shadowArmy: {
      ...(fallback.shadowArmy || {}),
      ...(primary.shadowArmy || {}),
      shadows,
      totalShadowXp: Math.max(toFiniteNumber(primary.shadowArmy?.totalShadowXp), toFiniteNumber(fallback.shadowArmy?.totalShadowXp)),
    },
    jobs: {
      ...(fallback.jobs || {}),
      ...(primary.jobs || {}),
      levels: mergeNumericMaps(primary.jobs?.levels, fallback.jobs?.levels),
      xp: mergeNumericMaps(primary.jobs?.xp, fallback.jobs?.xp),
      activeAbilityCooldowns: { ...(fallback.jobs?.activeAbilityCooldowns || {}), ...(primary.jobs?.activeAbilityCooldowns || {}) },
    },
    goals: mergeArrayByKey(primary.goals, fallback.goals, item => item?.id || normalizeKeyPart(item?.title)),
    habits: mergeArrayByKey(primary.habits, fallback.habits, item => item?.id || normalizeKeyPart(item?.title)).map(habit => {
      const left = arrayOf(primary.habits).find(item => (item?.id || item?.title) === (habit?.id || habit?.title));
      const right = arrayOf(fallback.habits).find(item => (item?.id || item?.title) === (habit?.id || habit?.title));
      if (!left || !right) return habit;
      return {
        ...right,
        ...left,
        history: mergeDateMaps(left.history, right.history),
        streak: Math.max(toFiniteNumber(left.streak), toFiniteNumber(right.streak)),
        bestStreak: Math.max(toFiniteNumber(left.bestStreak), toFiniteNumber(right.bestStreak)),
        totalCompletions: Math.max(toFiniteNumber(left.totalCompletions), toFiniteNumber(right.totalCompletions)),
      };
    }),
    healthDailyHistory: mergeDateMaps(primary.healthDailyHistory, fallback.healthDailyHistory),
    healthRewardsClaimed: mergeClaimMaps(primary.healthRewardsClaimed, fallback.healthRewardsClaimed),
    screenTimeDailyHistory: mergeDateMaps(primary.screenTimeDailyHistory, fallback.screenTimeDailyHistory),
    screenTimeRewardsClaimed: mergeClaimMaps(primary.screenTimeRewardsClaimed, fallback.screenTimeRewardsClaimed),
    microHabits: mergeMicroHabits(trustPrimaryTotals ? primary.microHabits : {}, trustFallbackTotals ? fallback.microHabits : {}),
    focus: {
      ...(fallback.focus || {}),
      ...(primary.focus || {}),
      daily: mergeDateMaps(primary.focus?.daily, fallback.focus?.daily),
      modes: { ...(fallback.focus?.modes || {}), ...(primary.focus?.modes || {}) },
      recentSessions: mergeArrayByKey(primary.focus?.recentSessions, fallback.focus?.recentSessions, item => item?.id || `${item?.startedAt || ""}:${item?.mode || ""}`),
      totalSessions: Math.max(toFiniteNumber(primary.focus?.totalSessions), toFiniteNumber(fallback.focus?.totalSessions)),
      totalMinutes: Math.max(toFiniteNumber(primary.focus?.totalMinutes), toFiniteNumber(fallback.focus?.totalMinutes)),
    },
    customQuestPool: {
      ...(fallback.customQuestPool || {}),
      ...(primary.customQuestPool || {}),
      templates: mergeArrayByKey(primary.customQuestPool?.templates, fallback.customQuestPool?.templates, item => item?.id || normalizeKeyPart(item?.title)),
      favorites: unionValues(primary.customQuestPool?.favorites, fallback.customQuestPool?.favorites),
      recentlyUsed: unionValues(primary.customQuestPool?.recentlyUsed, fallback.customQuestPool?.recentlyUsed).slice(0, 10),
      collections: mergeArrayByKey(primary.customQuestPool?.collections, fallback.customQuestPool?.collections, item => item?.id || normalizeKeyPart(item?.name)),
    },
    shopPurchases: unionValues(primary.shopPurchases, fallback.shopPurchases),
    gemPurchases: mergeArrayByKey(primary.gemPurchases, fallback.gemPurchases, item => item?.id || `${item?.itemId || ""}:${item?.date || item?.createdAt || ""}`),
    activeGemBoosters: mergeArrayByKey(primary.activeGemBoosters, fallback.activeGemBoosters, item => item?.id || item?.key || item?.type),
    lastInteractionTimeMs: Math.max(getStateTimestamp(primary), getStateTimestamp(fallback)),
    lastModifiedAtMs: Date.now(),
    lastMergedAtMs: Date.now(),
  };

  merged = recalculateLevelFromTotalXp(merged);
  merged.statPoints = maxExistingStatPoints + Math.max(0, toFiniteNumber(merged.level, 1) - maxExistingLevel);
  return merged;
}

function canMergeStates(localState, cloudState) {
  if (!localState || !cloudState) return false;
  if (localState.ownerUid && cloudState.ownerUid && localState.ownerUid !== cloudState.ownerUid) return false;
  if (localState.email && cloudState.email && String(localState.email).toLowerCase() !== String(cloudState.email).toLowerCase()) return false;
  return true;
}

function hasSyncableProgress(state) {
  if (!state) return false;
  const statsTotal = Object.values(state.stats || {}).reduce((sum, value) => sum + toFiniteNumber(value), 0);
  const jobXpTotal = Object.values(state.jobs?.xp || {}).reduce((sum, value) => sum + toFiniteNumber(value), 0);
  const jobLevelTotal = Object.values(state.jobs?.levels || {}).reduce((sum, value) => sum + toFiniteNumber(value), 0);
  const hasUserQuest = arrayOf(state.quests).some(q => !q?.isSystem && !q?.isStarter);
  return Boolean(
    toFiniteNumber(state.totalXpEarned) > 0
    || toFiniteNumber(state.totalGoldEarned) > 0
    || toFiniteNumber(state.totalGemsEarned) > 0
    || toFiniteNumber(state.totalQuestsCompleted) > 0
    || count(state.syncEvents) > 0
    || statsTotal > 0
    || jobXpTotal > 0
    || jobLevelTotal > 0
    || hasUserQuest
    || count(state.completedQuests) > 0
    || count(state.dungeonHistory) > 0
    || count(state.equipment?.inventory) > 0
    || count(state.shadowArmy?.shadows) > 0
    || count(state.goals) > 0
    || count(state.habits) > 0
    || count(state.customQuestPool?.templates) > 0
    || Object.keys(state.healthDailyHistory || {}).length > 0
    || Object.keys(state.healthRewardsClaimed || {}).length > 0
    || Object.keys(state.screenTimeDailyHistory || {}).length > 0
    || Object.keys(state.screenTimeRewardsClaimed || {}).length > 0
    || Object.keys(state.focus?.daily || {}).length > 0
    || Object.keys(state.microHabits?.daily || {}).length > 0
  );
}

function keyList(items, keyFn) {
  return arrayOf(items).map(keyFn).filter(Boolean).sort();
}

function getProgressSignature(state) {
  return JSON.stringify({
    completedQuests: keyList(state?.completedQuests, completedQuestKey),
    quests: keyList(state?.quests, item => `${questKey(item)}:${item?.completed ? "1" : "0"}`),
    dungeonHistory: keyList(state?.dungeonHistory, dungeonHistoryKey),
    inventory: keyList(state?.equipment?.inventory, inventoryKey),
    shadows: keyList(state?.shadowArmy?.shadows, shadowKey),
    achievements: keyList(state?.achievements?.unlocked, item => item),
    skills: keyList(state?.skills?.unlocked, item => item),
    hiddenCompleted: keyList(state?.hiddenQuests?.completed, item => item),
    goals: keyList(state?.goals, item => item?.id || normalizeKeyPart(item?.title)),
    habits: keyList(state?.habits, item => item?.id || normalizeKeyPart(item?.title)),
    healthDays: Object.keys(state?.healthDailyHistory || {}).sort(),
    healthRewards: Object.keys(state?.healthRewardsClaimed || {}).filter(key => state?.healthRewardsClaimed?.[key]).sort(),
    screenTimeDays: Object.keys(state?.screenTimeDailyHistory || {}).sort(),
    screenTimeRewards: Object.keys(state?.screenTimeRewardsClaimed || {}).filter(key => state?.screenTimeRewardsClaimed?.[key]).sort(),
    focusDays: Object.keys(state?.focus?.daily || {}).sort(),
    microHabitDays: Object.keys(state?.microHabits?.daily || {}).sort(),
    syncEvents: keyList(state?.syncEvents, syncEventKey),
    totalQuestsCompleted: toFiniteNumber(state?.totalQuestsCompleted),
    totalXpEarned: toFiniteNumber(state?.totalXpEarned),
    totalGoldEarned: toFiniteNumber(state?.totalGoldEarned),
    totalGemsEarned: toFiniteNumber(state?.totalGemsEarned),
    stats: state?.stats || {},
    jobs: { levels: state?.jobs?.levels || {}, xp: state?.jobs?.xp || {} },
  });
}

function tryMergeStates(localState, cloudState, localTime, cloudTime) {
  if (!canMergeStates(localState, cloudState)) return null;
  if (!hasSyncableProgress(localState) || !hasSyncableProgress(cloudState)) return null;
  if (getProgressSignature(localState) === getProgressSignature(cloudState)) return null;
  const primary = localTime >= cloudTime ? localState : cloudState;
  const fallback = primary === localState ? cloudState : localState;
  return { data: mergeStateProgress(primary, fallback), source: "merged", reason: "merged-progress" };
}

export function resolveStateConflict(localState, cloudState) {
  if (!localState && !cloudState) return { data: null, source: "none", reason: "empty" };
  if (!localState) return { data: cloudState, source: "cloud", reason: "cloud-only" };
  if (!cloudState) return { data: localState, source: "local", reason: "local-only" };

  // ── Admin reset override ──
  // If an admin has reset the user via the dashboard, the cloud state will
  // carry an `_adminResetAt` timestamp.  When that timestamp is newer than
  // the local state's last save, we MUST honour the admin reset – otherwise
  // the stale local cache would win through the normal progress-protection
  // checks and undo the admin's work.
  const adminResetAtMs = parseTime(cloudState._adminResetAt);
  if (adminResetAtMs > 0) {
    const localTime = getStateTimestamp(localState);
    if (adminResetAtMs >= localTime) {
      console.log("System: Admin-Reset erkannt – Cloud-State wird erzwungen.", {
        adminResetAt: cloudState._adminResetAt,
        resetType: cloudState._adminResetType,
      });
      return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "admin-reset" };
    }
  }

  const localScore = getStateProgressScore(localState);
  const cloudScore = getStateProgressScore(cloudState);
  const localTime = getStateTimestamp(localState);
  const cloudTime = getStateTimestamp(cloudState);
  const localHasProfile = hasMeaningfulProfile(localState);
  const cloudHasProfile = hasMeaningfulProfile(cloudState);
  const canMerge = canMergeStates(localState, cloudState);
  const localHasSyncableProgress = hasSyncableProgress(localState);
  const cloudHasSyncableProgress = hasSyncableProgress(cloudState);

  if (localHasProfile && !cloudHasProfile) {
    return { data: localState, source: "local", reason: "cloud-empty-protected" };
  }

  if (cloudHasProfile && !localHasProfile) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "local-empty" };
  }

  if (canMerge && localHasSyncableProgress && !cloudHasSyncableProgress) {
    return { data: mergeLocalOnlyCaches(localState, cloudState), source: "local", reason: "local-progress-only" };
  }

  if (canMerge && cloudHasSyncableProgress && !localHasSyncableProgress) {
    return { data: mergeLocalOnlyCaches(cloudState, localState), source: "cloud", reason: "cloud-progress-only" };
  }

  const mergedProgress = tryMergeStates(localState, cloudState, localTime, cloudTime);
  if (mergedProgress) return mergedProgress;

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

async function readLocalState(user = auth.currentUser) {
  const keys = user?.uid
    ? [getScopedKey(ACTIVE_STATE_KEY, user), getScopedKey(LEGACY_STATE_KEY, user), ACTIVE_STATE_KEY, LEGACY_STATE_KEY]
    : [ACTIVE_STATE_KEY, LEGACY_STATE_KEY];
  for (const key of keys) {
    try {
      const record = await window.storage.get(key);
      if (!record?.value) continue;
      const data = migrateState(JSON.parse(record.value));
      if (user?.uid && !key.includes(`:${user.uid}`) && !stateBelongsToUser(data, user)) {
        console.warn("System: Ignoriere lokalen Spielstand eines anderen Hunters.", { key });
        continue;
      }
      return { data: stampStateForUser(data, user), source: "local", key };
    } catch (e) {
      console.warn(`System: Lokaler Speicher konnte nicht gelesen werden (${key}).`, e);
    }
  }
  return { data: null, source: "none", key: null };
}

export async function cacheStateLocally(state, user = auth.currentUser) {
  if (!state) return;
  try {
    const scopedState = stampStateForUser(state, user);
    await window.storage.set(getScopedKey(ACTIVE_STATE_KEY, user), JSON.stringify(scopedState));
  } catch (e) {
    console.error("System: Lokaler Speicherfehler:", e);
  }
}

async function markCloudSyncPending(value, user = auth.currentUser) {
  try {
    if (value) {
      await window.storage.set(getScopedKey(PENDING_CLOUD_SYNC_KEY, user), String(Date.now()));
    } else {
      await window.storage.delete(getScopedKey(PENDING_CLOUD_SYNC_KEY, user));
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
  s.questReplacements = { ...DEFAULT_STATE.questReplacements, ...(oldState.questReplacements || {}) };
  s.healthPreferences = { ...DEFAULT_STATE.healthPreferences, ...(oldState.healthPreferences || {}) };
  s.healthPreferences.manualSleepLog = {
    ...DEFAULT_STATE.healthPreferences.manualSleepLog,
    ...(oldState.healthPreferences?.manualSleepLog || {})
  };
  s.healthDailyHistory = {
    ...DEFAULT_STATE.healthDailyHistory,
    ...(oldState.healthDailyHistory || {})
  };
  s.healthRewardsClaimed = {
    ...DEFAULT_STATE.healthRewardsClaimed,
    ...(oldState.healthRewardsClaimed || {})
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
  s.microHabits = mergeMicroHabits(
    { ...DEFAULT_STATE.microHabits, ...(oldState.microHabits || {}) },
    DEFAULT_STATE.microHabits
  );
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
  s.artifacts = { ...DEFAULT_STATE.artifacts, ...(oldState.artifacts || {}) };
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
  s.syncEvents = Array.isArray(oldState.syncEvents) ? oldState.syncEvents.slice(-MAX_SYNC_EVENTS) : [];
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

  s.quests = Array.isArray(s.quests) ? s.quests.map(normalizeQuestForStorage) : [];
  s.completedQuests = Array.isArray(s.completedQuests) ? s.completedQuests.map(normalizeQuestForStorage) : [];

  return s;
}

export async function loadState() {
  const user = auth.currentUser;
  const local = await readLocalState(user);
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  let cloud = { data: null, source: "none" };
  if (user && !isOffline) {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        cloud = { data: stampStateForUser(migrateState(docSnap.data()), user), source: "cloud" };
      }
    } catch (e) {
      console.warn("System: Cloud-Daten nicht erreichbar, lokaler Stand wird verwendet.", e);
    }
  }

  const resolved = resolveStateConflict(local.data, cloud.data);
  if (resolved.data) {
    resolved.data = stampStateForUser(resolved.data, user);
    await cacheStateLocally(resolved.data, user);
  }

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

  const user = auth.currentUser;
  const stateToSave = stampStateForUser(s, user);

  await cacheStateLocally(stateToSave, user);
  syncWidgetData(stateToSave).catch(() => {});

  try {
    if (user) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        await markCloudSyncPending(true, user);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const { _abilityActivated, _jobLevelUp, ...persistenceState } = stateToSave;
      let cleanState = JSON.parse(JSON.stringify(persistenceState));
      cleanState.ownerUid = user.uid;
      if (user.email) cleanState.email = user.email;
      if (cleanState.hunterName || user.displayName) {
        cleanState.displayName = cleanState.hunterName || user.displayName;
      }

      let cloudState = null;
      try {
        const docSnap = await getDoc(docRef);
        cloudState = docSnap.exists() ? stampStateForUser(migrateState(docSnap.data()), user) : null;
      } catch (e) {
        console.warn("System: Cloud-Check nicht erreichbar, lokaler Stand bleibt pending.", e);
        await markCloudSyncPending(true, user);
        return;
      }

      if (cloudState) {
        const resolved = resolveStateConflict(cleanState, cloudState);
        if (resolved.source === "cloud") {
          console.warn("System: Cloud-Speicherung blockiert, um neueren Cloud-Fortschritt zu schuetzen.", { reason: resolved.reason });
          await cacheStateLocally(resolved.data, user);
          return;
        }
        if (resolved.source === "merged") {
          cleanState = JSON.parse(JSON.stringify(stampStateForUser(resolved.data, user)));
          cleanState.ownerUid = user.uid;
          if (user.email) cleanState.email = user.email;
          if (cleanState.hunterName || user.displayName) {
            cleanState.displayName = cleanState.hunterName || user.displayName;
          }
        } else if (resolved.reason !== 'admin-reset' && shouldProtectCloudWrite(cleanState) && shouldSkipCloudWrite(cleanState, cloudState)) {
          console.warn("System: Cloud-Speicherung blockiert, um vorhandene Fortschritte vor einem Reset zu schuetzen.");
          return;
        }
      }

      await setDoc(docRef, cleanState, { merge: true });
      await markCloudSyncPending(false, user);
    }
  } catch (e) {
    console.error("System: Speicherfehler:", e);
    await markCloudSyncPending(true, user);
  }
}
