import { getToday } from "./dateUtils.js";

export const QUEST_LOADOUT_CAP = 3;
export const MAX_PINNED_QUESTS = 3;

// ── Systemzeichen: once per day the System marks ONE forgotten own quest
// (bonus XP, top of loadout) instead of rolling another pool quest. ──
export const SYSTEM_MARK_COOLDOWN_DAYS = 3;
export const SYSTEM_MARK_XP_MULT = 1.5;
// After this many fruitless marks the System stops re-marking a quest —
// endless re-marking of an ignored quest is nagging, not curating.
export const SYSTEM_MARK_MAX_MARKS = 2;

export const QUEST_OVERLOAD_PRESETS = {
  focused: {
    key: "focused",
    label: "Fokussiert",
    warningCount: 5,
    overloadCount: 7,
    staleCount: 2,
    staleDays: 3,
  },
  balanced: {
    key: "balanced",
    label: "Ausgeglichen",
    warningCount: 7,
    overloadCount: 10,
    staleCount: 3,
    staleDays: 7,
  },
  relaxed: {
    key: "relaxed",
    label: "Entspannt",
    warningCount: 10,
    overloadCount: 15,
    staleCount: 4,
    staleDays: 14,
  },
};

export const DEFAULT_QUEST_PLANNING = {
  overloadPreset: "balanced",
  pinnedQuestIds: [],
  deferredUntilById: {},
  lifecycleById: {},
};

function dateMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function priorityRank(quest) {
  return { high: 0, medium: 1, low: 2 }[quest?.priority] ?? 1;
}

function difficultyRank(quest) {
  return { boss: 0, hard: 1, normal: 2, easy: 3 }[quest?.difficulty] ?? 2;
}

function createdAtMs(quest) {
  return dateMs(quest?.createdAtMs) || dateMs(quest?.createdAt);
}

export function getQuestPlanningState(state) {
  const planning = state?.questPlanning || {};
  return {
    ...DEFAULT_QUEST_PLANNING,
    ...planning,
    pinnedQuestIds: Array.isArray(planning.pinnedQuestIds) ? planning.pinnedQuestIds.slice(0, MAX_PINNED_QUESTS) : [],
    deferredUntilById: planning.deferredUntilById || {},
    lifecycleById: planning.lifecycleById || {},
  };
}

export function getQuestOverloadPreset(stateOrKey) {
  const key = typeof stateOrKey === "string"
    ? stateOrKey
    : getQuestPlanningState(stateOrKey).overloadPreset;
  return QUEST_OVERLOAD_PRESETS[key] || QUEST_OVERLOAD_PRESETS.balanced;
}

export function isTrackedQuest(quest) {
  return Boolean(quest?.isStepGoal || quest?.isScreenTime);
}

export function isMandatoryQuest(quest) {
  return Boolean(quest?.isRedemption || quest?.type === "redemption");
}

export function isArchivedQuest(state, questId) {
  return getQuestPlanningState(state).lifecycleById?.[questId]?.status === "archived";
}

export function isQuestDeferred(state, questId, nowMs = Date.now()) {
  return Number(getQuestPlanningState(state).deferredUntilById?.[questId] || 0) > nowMs;
}

function isFutureQuest(quest, today) {
  return Boolean(quest?.dueDate && String(quest.dueDate).slice(0, 10) > today);
}

// The System's daily pick: the oldest own quest that has gone stale under the
// user's overload preset and was not marked within the cooldown window.
export function pickSystemMarkCandidate(state, nowMs = Date.now()) {
  const today = getToday();
  const planning = getQuestPlanningState(state);
  const preset = getQuestOverloadPreset(planning.overloadPreset);
  const staleBeforeMs = nowMs - preset.staleDays * 86400000;
  const cooldownAfterMs = nowMs - SYSTEM_MARK_COOLDOWN_DAYS * 86400000;
  return (state?.quests || [])
    .filter(quest => quest && !quest.completed && !quest.isSystem
      && quest.type !== "hidden" && !quest.isSeasonal
      && !isMandatoryQuest(quest) && !isTrackedQuest(quest)
      && !isArchivedQuest(state, quest.id)
      && !isQuestDeferred(state, quest.id, nowMs)
      && !isFutureQuest(quest, today)
      && !planning.pinnedQuestIds.includes(quest.id)
      && createdAtMs(quest) > 0 && createdAtMs(quest) <= staleBeforeMs
      && Number(planning.lifecycleById?.[quest.id]?.markCount || 0) < SYSTEM_MARK_MAX_MARKS
      && Number(planning.lifecycleById?.[quest.id]?.lastMarkedAtMs || 0) <= cooldownAfterMs)
    .sort((a, b) => createdAtMs(a) - createdAtMs(b))[0] || null;
}

function compareLoadoutQuests(a, b, planning, today, dailyFocusQuestId, systemMarkQuestId) {
  const pinIds = planning.pinnedQuestIds;
  const focusA = a.id === dailyFocusQuestId ? 0 : 1;
  const focusB = b.id === dailyFocusQuestId ? 0 : 1;
  const markA = a.id === systemMarkQuestId ? 0 : 1;
  const markB = b.id === systemMarkQuestId ? 0 : 1;
  const pinA = pinIds.includes(a.id) ? pinIds.indexOf(a.id) : Number.POSITIVE_INFINITY;
  const pinB = pinIds.includes(b.id) ? pinIds.indexOf(b.id) : Number.POSITIVE_INFINITY;
  const overdueA = a.dueDate && a.dueDate < today ? 0 : 1;
  const overdueB = b.dueDate && b.dueDate < today ? 0 : 1;
  const chainA = a.type === "chained" ? 0 : 1;
  const chainB = b.type === "chained" ? 0 : 1;
  const ownA = a.isSystem ? 1 : 0;
  const ownB = b.isSystem ? 1 : 0;
  const dueA = a.dueDate ? dateMs(a.dueDate) : Number.POSITIVE_INFINITY;
  const dueB = b.dueDate ? dateMs(b.dueDate) : Number.POSITIVE_INFINITY;
  return focusA - focusB
    || markA - markB
    || pinA - pinB
    || overdueA - overdueB
    || chainA - chainB
    || ownA - ownB
    || dueA - dueB
    || priorityRank(a) - priorityRank(b)
    || difficultyRank(a) - difficultyRank(b)
    || createdAtMs(a) - createdAtMs(b)
    || String(a.id || "").localeCompare(String(b.id || ""));
}

export function getQuestPlanningSnapshot(state, now = Date.now()) {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const today = getToday();
  const planning = getQuestPlanningState(state);
  const preset = getQuestOverloadPreset(planning.overloadPreset);
  const quests = (state?.quests || []).filter(quest =>
    quest && !quest.completed && !isArchivedQuest(state, quest.id)
  );
  const mandatory = quests.filter(isMandatoryQuest);
  const tracked = quests.filter(isTrackedQuest);
  const normal = quests.filter(quest => !isMandatoryQuest(quest) && !isTrackedQuest(quest));
  const deferred = normal.filter(quest => isQuestDeferred(state, quest.id, nowMs) || isFutureQuest(quest, today));
  const actionable = normal.filter(quest => !isQuestDeferred(state, quest.id, nowMs) && !isFutureQuest(quest, today));
  const mark = state?.systemMark;
  const systemMarkQuestId = mark?.date === today && actionable.some(quest => quest.id === mark.questId)
    ? mark.questId
    : null;
  const loadoutCandidates = actionable
    .filter(quest => quest.type !== "hidden" && !quest.isSeasonal)
    .sort((a, b) => compareLoadoutQuests(a, b, planning, today, state?.dailyFocusQuestId, systemMarkQuestId));
  const loadout = loadoutCandidates.slice(0, QUEST_LOADOUT_CAP);
  const loadoutIds = new Set(loadout.map(quest => quest.id));
  const questLog = actionable
    .filter(quest => !loadoutIds.has(quest.id))
    .sort((a, b) => compareLoadoutQuests(a, b, planning, today, state?.dailyFocusQuestId, systemMarkQuestId));
  const staleBeforeMs = nowMs - preset.staleDays * 86400000;
  const staleOwnCount = actionable.filter(quest => !quest.isSystem && createdAtMs(quest) > 0 && createdAtMs(quest) <= staleBeforeMs).length;
  const overloaded = actionable.length >= preset.overloadCount || staleOwnCount >= preset.staleCount;
  const warned = overloaded || actionable.length >= preset.warningCount || staleOwnCount > 0;
  const level = overloaded ? "overload" : warned ? "warning" : "calm";
  const completedToday = (state?.completedQuests || []).filter(quest => String(quest.completedAt || "").slice(0, 10) === today).length;
  const archived = (state?.questArchive || [])
    .filter(quest => quest && planning.lifecycleById?.[quest.id]?.status === "archived")
    .sort((a, b) => Number(b.archivedAtMs || 0) - Number(a.archivedAtMs || 0));

  return {
    loadout,
    questLog,
    open: [...loadout, ...questLog],
    deferred,
    archived,
    mandatory,
    tracked,
    actionable,
    todayTarget: Math.min(QUEST_LOADOUT_CAP, Math.max(completedToday, loadout.length)),
    completedToday,
    systemMarkQuestId,
    overloadStatus: {
      level,
      warned,
      overloaded,
      actionableCount: actionable.length,
      staleOwnCount,
      preset,
    },
  };
}

export function withPinnedQuest(state, questId) {
  const planning = getQuestPlanningState(state);
  const exists = planning.pinnedQuestIds.includes(questId);
  const pinnedQuestIds = exists
    ? planning.pinnedQuestIds.filter(id => id !== questId)
    : [...planning.pinnedQuestIds.filter(id => id !== questId), questId].slice(-MAX_PINNED_QUESTS);
  return { ...state, questPlanning: { ...planning, pinnedQuestIds } };
}

export function withDeferredQuest(state, questId, untilMs) {
  const planning = getQuestPlanningState(state);
  const deferredUntilById = { ...planning.deferredUntilById };
  if (untilMs && untilMs > Date.now()) deferredUntilById[questId] = untilMs;
  else delete deferredUntilById[questId];
  return { ...state, questPlanning: { ...planning, deferredUntilById } };
}

export function withArchivedQuest(state, questId, nowMs = Date.now()) {
  const planning = getQuestPlanningState(state);
  const quest = (state?.quests || []).find(item => item.id === questId);
  if (!quest) return { state, archivedQuest: null };
  const archivedQuest = { ...quest, archivedAtMs: nowMs };
  const questArchive = [
    archivedQuest,
    ...(state.questArchive || []).filter(item => item.id !== questId),
  ].slice(0, 100);
  return {
    archivedQuest,
    state: {
      ...state,
      quests: (state.quests || []).filter(item => item.id !== questId),
      reminders: (state.reminders || []).filter(item => item.questId !== questId),
      questArchive,
      questPlanning: {
        ...planning,
        pinnedQuestIds: planning.pinnedQuestIds.filter(id => id !== questId),
        deferredUntilById: Object.fromEntries(Object.entries(planning.deferredUntilById).filter(([id]) => id !== questId)),
        lifecycleById: {
          ...planning.lifecycleById,
          [questId]: { status: "archived", updatedAtMs: nowMs },
        },
      },
    },
  };
}

export function withRestoredQuest(state, questId, nowMs = Date.now()) {
  const planning = getQuestPlanningState(state);
  const archivedQuest = (state?.questArchive || []).find(item => item.id === questId);
  if (!archivedQuest) return { state, restoredQuest: null };
  const { archivedAtMs, ...restoredQuest } = archivedQuest;
  return {
    restoredQuest,
    state: {
      ...state,
      quests: [...(state.quests || []).filter(item => item.id !== questId), restoredQuest],
      questArchive: (state.questArchive || []).filter(item => item.id !== questId),
      questPlanning: {
        ...planning,
        lifecycleById: {
          ...planning.lifecycleById,
          [questId]: { status: "active", updatedAtMs: nowMs },
        },
      },
    },
  };
}
