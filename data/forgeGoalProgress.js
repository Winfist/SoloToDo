// Dynamischer Forge-Zielpfad. Das Modul beobachtet bestaetigte Quest-
// Abschluesse, markiert aber niemals selbst einen Ziel-Meilenstein als fertig.

import {
  QUEST_DNA_ACTION_KINDS,
  QUEST_DNA_OUTCOME_KINDS,
  getEffectiveQuestDNA,
  getQuestRecipeKey,
  parseQuestRecipeKey,
} from "./questDNA.js";

const ACTION_KINDS = new Set(QUEST_DNA_ACTION_KINDS);
const OUTCOME_KINDS = new Set(QUEST_DNA_OUTCOME_KINDS);

export const DEFAULT_FORGE_GOAL_PROGRESS = Object.freeze({
  byGoalId: {},
  updatedAtMs: 0,
});

const finiteTimestamp = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

const cleanId = (value, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function emptyGoalEntry() {
  return {
    currentMilestoneId: null,
    lastCompletedQuestId: null,
    lastCompletedAtMs: 0,
    lastRecipeKey: null,
    lastActionKind: null,
    lastOutcomeKind: null,
    lastAdvancedAtMs: 0,
    updatedAtMs: 0,
  };
}

function normalizeGoalEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyGoalEntry();
  const lastRecipeKey = parseQuestRecipeKey(value.lastRecipeKey) ? value.lastRecipeKey : null;
  const lastActionKind = ACTION_KINDS.has(value.lastActionKind) ? value.lastActionKind : null;
  const lastOutcomeKind = OUTCOME_KINDS.has(value.lastOutcomeKind) ? value.lastOutcomeKind : null;
  const normalized = {
    currentMilestoneId: cleanId(value.currentMilestoneId) || null,
    lastCompletedQuestId: cleanId(value.lastCompletedQuestId) || null,
    lastCompletedAtMs: finiteTimestamp(value.lastCompletedAtMs),
    lastRecipeKey,
    lastActionKind,
    lastOutcomeKind,
    lastAdvancedAtMs: finiteTimestamp(value.lastAdvancedAtMs),
    updatedAtMs: finiteTimestamp(value.updatedAtMs),
  };
  normalized.updatedAtMs = Math.max(
    normalized.updatedAtMs,
    normalized.lastCompletedAtMs,
    normalized.lastAdvancedAtMs,
  );
  return normalized;
}
export function normalizeForgeGoalProgress(value) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const byGoalId = {};
  for (const [rawGoalId, rawEntry] of Object.entries(raw.byGoalId || {})) {
    const goalId = cleanId(rawGoalId);
    if (!goalId) continue;
    byGoalId[goalId] = normalizeGoalEntry(rawEntry);
  }
  return {
    byGoalId,
    updatedAtMs: Math.max(
      finiteTimestamp(raw.updatedAtMs),
      0,
      ...Object.values(byGoalId).map((entry) => entry.updatedAtMs),
    ),
  };
}

export function buildForgeGoalGraph(state = {}) {
  const orderedGoalIds = [];
  const byGoalId = {};
  for (const goal of Array.isArray(state.goals) ? state.goals : []) {
    const goalId = cleanId(goal?.id);
    if (!goalId || byGoalId[goalId]) continue;
    const milestones = (Array.isArray(goal.milestones) ? goal.milestones : [])
      .map((milestone, index) => ({
        id: cleanId(milestone?.id),
        title: String(milestone?.title || "").trim().slice(0, 140),
        index,
        completed: Boolean(milestone?.completed),
        completedAt: milestone?.completedAt || null,
      }))
      .filter((milestone) => milestone.id && milestone.title);
    const current = milestones.find((milestone) => !milestone.completed) || null;
    const nextByMilestoneId = Object.fromEntries(milestones.map((milestone, index) => [
      milestone.id,
      milestones.slice(index + 1).find((candidate) => !candidate.completed)?.id || null,
    ]));
    orderedGoalIds.push(goalId);
    byGoalId[goalId] = {
      goalId,
      title: String(goal.title || "").trim().slice(0, 140),
      category: String(goal.category || "").trim().slice(0, 32),
      milestones,
      currentMilestoneId: current?.id || null,
      nextByMilestoneId,
      completed: milestones.length > 0 && milestones.every((milestone) => milestone.completed),
    };
  }
  return { orderedGoalIds, byGoalId };
}

export function resolveForgeGoalLink(state, quest) {
  if (!quest || typeof quest !== "object") return null;
  const graph = buildForgeGoalGraph(state);
  let goal = null;
  const linkedGoalId = cleanId(quest.linkedGoalId);
  if (linkedGoalId) goal = graph.byGoalId[linkedGoalId] || null;

  if (!goal) {
    const requestedTitle = normalizeTitle(quest.goalRef);
    if (!requestedTitle) return null;
    const matches = Object.values(graph.byGoalId)
      .filter((candidate) => normalizeTitle(candidate.title) === requestedTitle);
    if (matches.length !== 1) return null;
    [goal] = matches;
  }

  const linkedMilestoneId = cleanId(quest.linkedMilestoneId);
  const milestone = (linkedMilestoneId
    ? goal.milestones.find((candidate) => candidate.id === linkedMilestoneId)
    : goal.milestones.find((candidate) => candidate.id === goal.currentMilestoneId)) || null;
  return {
    goalId: goal.goalId,
    goalTitle: goal.title,
    milestoneId: milestone?.id || null,
    milestoneTitle: milestone?.title || null,
  };
}

export function getForgeGoalResumeContext(state, goalId) {
  const cleanGoalId = cleanId(goalId);
  if (!cleanGoalId) return null;
  const graph = buildForgeGoalGraph(state);
  const goal = graph.byGoalId[cleanGoalId];
  if (!goal) return null;
  const progress = normalizeForgeGoalProgress(state?.forgeGoalProgress).byGoalId[cleanGoalId]
    || emptyGoalEntry();
  const currentMilestone = goal.milestones.find((item) => item.id === goal.currentMilestoneId) || null;
  return {
    goalId: cleanGoalId,
    goalTitle: goal.title,
    currentMilestoneId: currentMilestone?.id || null,
    currentMilestoneTitle: currentMilestone?.title || null,
    completed: goal.completed,
    lastCompletedQuestId: progress.lastCompletedQuestId,
    lastCompletedAtMs: progress.lastCompletedAtMs,
    lastRecipeKey: progress.lastRecipeKey,
    lastActionKind: progress.lastActionKind,
    lastOutcomeKind: progress.lastOutcomeKind,
    lastAdvancedAtMs: progress.lastAdvancedAtMs,
  };
}

function completedQuestMap(state) {
  const map = new Map();
  for (const quest of Array.isArray(state?.completedQuests) ? state.completedQuests : []) {
    const questId = cleanId(quest?.id);
    if (questId) map.set(questId, quest);
  }
  for (const quest of Array.isArray(state?.quests) ? state.quests : []) {
    const questId = cleanId(quest?.id);
    if (questId && (quest?.completed || finiteTimestamp(quest?.completedAtMs))) map.set(questId, quest);
  }
  return map;
}

function completionTimestamp(quest, fallback) {
  const direct = finiteTimestamp(quest?.completedAtMs);
  if (direct) return direct;
  const parsed = Date.parse(quest?.completedAt || "");
  return Number.isFinite(parsed) ? parsed : finiteTimestamp(fallback);
}

export function reconcileForgeGoalProgress(previousState, nextState, { nowMs = Date.now(), locale = "de" } = {}) {
  const now = finiteTimestamp(nowMs) || Date.now();
  const previousCompleted = completedQuestMap(previousState);
  const nextCompleted = completedQuestMap(nextState);
  const graph = buildForgeGoalGraph(nextState);
  const current = normalizeForgeGoalProgress(
    nextState?.forgeGoalProgress || previousState?.forgeGoalProgress,
  );
  const byGoalId = { ...current.byGoalId };
  let changed = false;

  for (const goalId of graph.orderedGoalIds) {
    const graphGoal = graph.byGoalId[goalId];
    const previousEntry = byGoalId[goalId] || emptyGoalEntry();
    if (previousEntry.currentMilestoneId !== graphGoal.currentMilestoneId) {
      byGoalId[goalId] = {
        ...previousEntry,
        currentMilestoneId: graphGoal.currentMilestoneId,
        updatedAtMs: now,
      };
      changed = true;
    }
  }

  const newlyCompleted = [...nextCompleted.entries()]
    .filter(([questId, quest]) => !previousCompleted.has(questId)
      && (quest?.origin === "forge" || finiteTimestamp(quest?.forgeAcceptedAtMs) > 0))
    .sort(([, left], [, right]) => completionTimestamp(left, now) - completionTimestamp(right, now));

  for (const [questId, quest] of newlyCompleted) {
    const link = resolveForgeGoalLink(nextState, quest);
    if (!link) continue;
    const effective = getEffectiveQuestDNA(quest, { locale });
    const completedAtMs = completionTimestamp(quest, now);
    const previousEntry = byGoalId[link.goalId] || emptyGoalEntry();
    byGoalId[link.goalId] = {
      ...previousEntry,
      currentMilestoneId: graph.byGoalId[link.goalId]?.currentMilestoneId || null,
      lastCompletedQuestId: questId,
      lastCompletedAtMs: completedAtMs,
      lastRecipeKey: getQuestRecipeKey(quest, { locale }),
      lastActionKind: effective?.dna?.actionKind || null,
      lastOutcomeKind: effective?.dna?.outcomeKind || null,
      lastAdvancedAtMs: completedAtMs,
      updatedAtMs: Math.max(now, completedAtMs),
    };
    changed = true;
  }

  const forgeGoalProgress = normalizeForgeGoalProgress({
    byGoalId,
    updatedAtMs: changed ? Math.max(current.updatedAtMs, now) : current.updatedAtMs,
  });
  return { ...(nextState || {}), forgeGoalProgress };
}

function chooseNewestEntry(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (left.updatedAtMs !== right.updatedAtMs) return left.updatedAtMs > right.updatedAtMs ? left : right;
  return stableValue(left) >= stableValue(right) ? left : right;
}

function chooseCompletionAnchor(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (left.lastCompletedAtMs !== right.lastCompletedAtMs) {
    return left.lastCompletedAtMs > right.lastCompletedAtMs ? left : right;
  }
  const leftAnchor = {
    lastCompletedQuestId: left.lastCompletedQuestId,
    lastRecipeKey: left.lastRecipeKey,
    lastActionKind: left.lastActionKind,
    lastOutcomeKind: left.lastOutcomeKind,
  };
  const rightAnchor = {
    lastCompletedQuestId: right.lastCompletedQuestId,
    lastRecipeKey: right.lastRecipeKey,
    lastActionKind: right.lastActionKind,
    lastOutcomeKind: right.lastOutcomeKind,
  };
  return stableValue(leftAnchor) >= stableValue(rightAnchor) ? left : right;
}

function mergeGoalEntry(left, right) {
  if (!left) return right;
  if (!right) return left;
  const newest = chooseNewestEntry(left, right);
  const anchor = chooseCompletionAnchor(left, right);
  return normalizeGoalEntry({
    currentMilestoneId: newest.currentMilestoneId,
    lastCompletedQuestId: anchor.lastCompletedQuestId,
    lastCompletedAtMs: anchor.lastCompletedAtMs,
    lastRecipeKey: anchor.lastRecipeKey,
    lastActionKind: anchor.lastActionKind,
    lastOutcomeKind: anchor.lastOutcomeKind,
    lastAdvancedAtMs: Math.max(left.lastAdvancedAtMs, right.lastAdvancedAtMs),
    updatedAtMs: Math.max(left.updatedAtMs, right.updatedAtMs),
  });
}

export function mergeForgeGoalProgress(primaryValue, fallbackValue) {
  const primary = normalizeForgeGoalProgress(primaryValue);
  const fallback = normalizeForgeGoalProgress(fallbackValue);
  const byGoalId = {};
  for (const goalId of new Set([...Object.keys(primary.byGoalId), ...Object.keys(fallback.byGoalId)])) {
    byGoalId[goalId] = mergeGoalEntry(primary.byGoalId[goalId], fallback.byGoalId[goalId]);
  }
  return normalizeForgeGoalProgress({
    byGoalId,
    updatedAtMs: Math.max(primary.updatedAtMs, fallback.updatedAtMs),
  });
}
