// forgeCompiler.js - pure client-side compiler for Forge candidate sets.
// It turns already generated candidates into a small, deterministic and
// explainable proposal set. No persistence, browser API or network access.

import { getDossierSummary } from "./hunterDossier.js";
import { getForgeLearningDossier } from "./forgeLearning.js";
import { getForgeGoalResumeContext } from "./forgeGoalProgress.js";
import { getDailySystemQuestCount } from "./questIntensity.js";
import { getQuestPlanningSnapshot, QUEST_LOADOUT_CAP } from "./questPlanning.js";
import { getManualForgeTargets } from "./questSwap.js";
import {
  buildQuestExclusionCorpus,
  compareQuestSimilarity,
  createQuestFingerprint,
  matchQuestAgainstCorpus,
  normalizeQuestText,
  stableQuestHash,
} from "./questSimilarity.js";

export const FORGE_COMPILER_VERSION = "3.0";

const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const CATEGORY_SET = new Set(CATEGORY_IDS);
const DIFFICULTY_SET = new Set(["easy", "normal", "hard"]);
const MAX_VISIBLE_PROPOSALS = 3;

const SET_MINUTE_BUDGETS = Object.freeze({
  normal: Object.freeze({ 0: 0, 1: 35, 2: 55, 3: 75 }),
  elevated: Object.freeze({ 0: 0, 1: 25, 2: 40, 3: 55 }),
  high: Object.freeze({ 0: 0, 1: 15, 2: 25, 3: 35 }),
});

const REJECTION_CODES = new Set([
  "invalid_id", "duplicate_id", "missing_title", "invalid_category",
  "invalid_difficulty", "invalid_minutes", "missing_done_when",
  "missing_steps", "open_duplicate", "negative_duplicate", "recent_repeat",
  "batch_duplicate",
]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function timeMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function getWeakestStats(state) {
  const values = CATEGORY_IDS.map((category) => Number(state?.stats?.[category]));
  if (values.some((value) => !Number.isFinite(value))) return [];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return [];
  return CATEGORY_IDS.filter((_, index) => values[index] === minimum);
}

function getActiveGoals(state) {
  return (Array.isArray(state?.goals) ? state.goals : [])
    .map((goal) => {
      const milestones = Array.isArray(goal?.milestones) ? goal.milestones : [];
      const resume = goal?.id ? getForgeGoalResumeContext(state, goal.id) : null;
      const next = resume?.currentMilestoneTitle
        ? { id: resume.currentMilestoneId, title: resume.currentMilestoneTitle }
        : milestones.find((milestone) => milestone && !milestone.completed);
      const title = String(goal?.title || "").trim();
      return title && next ? {
        goalId: String(goal.id || ""),
        title,
        key: normalizeQuestText(title),
        nextMilestone: String(next?.title || "").trim(),
        resume,
      } : null;
    })
    .filter(Boolean);
}

function getActiveHabits(state) {
  return (Array.isArray(state?.habits) ? state.habits : [])
    .filter((habit) => habit && habit.active !== false && habit.title)
    .map((habit) => ({
      title: String(habit.title),
      fingerprint: createQuestFingerprint({ title: habit.title, category: habit.category }),
    }));
}

function completedAtMs(quest) {
  return timeMs(quest?.completedAtMs) || timeMs(quest?.completedAt) || timeMs(quest?.date);
}

function recipeKnowledgeFromDossier(dossier) {
  return Object.fromEntries((dossier?.recipes || []).map((recipe) => [recipe.recipeKey, {
    recipeKey: recipe.recipeKey,
    recipe: recipe.recipe,
    assigned: recipe.assigned,
    completed: recipe.completed,
    eligibleAssigned: recipe.eligibleAssigned,
    highConfidenceCompleted: recipe.highConfidenceCompleted,
    completionRate: recipe.completionRate,
    explicitPreference: recipe.explicitPreference,
    reliable: Boolean(recipe.reliable),
    preferred: Boolean(recipe.preferred),
    avoided: Boolean(recipe.avoided),
  }]));
}

export function deriveForgeRecipeKnowledge(state = {}, { nowMs = Date.now() } = {}) {
  return recipeKnowledgeFromDossier(getForgeLearningDossier(state, { nowMs }));
}

function getGoalContinuityKeys(state, activeGoals) {
  const activeKeys = new Set(activeGoals.map((goal) => goal.key));
  const anchored = activeGoals
    .filter((goal) => goal.resume?.lastCompletedAtMs > 0
      || goal.resume?.lastRecipeKey
      || goal.resume?.lastActionKind
      || goal.resume?.lastOutcomeKind)
    .map((goal) => goal.key);
  const historical = (Array.isArray(state?.completedQuests) ? state.completedQuests : [])
    .filter((quest) => quest?.origin === "forge" && quest.goalRef)
    .sort((left, right) => completedAtMs(right) - completedAtMs(left))
    .map((quest) => normalizeQuestText(quest.goalRef))
    .filter((key) => activeKeys.has(key));
  return uniqueStrings([...anchored, ...historical])
    .slice(0, 3);
}

function knownMinutes(quests) {
  let total = 0;
  let unknown = 0;
  for (const quest of quests) {
    const minutes = Number(quest?.estimatedMinutes);
    if (Number.isInteger(minutes) && minutes > 0) total += minutes;
    else unknown += 1;
  }
  return { total, unknown };
}

function getSelectableCountPure(state, targets) {
  try {
    return Math.max(0, Math.min(
      QUEST_LOADOUT_CAP,
      getDailySystemQuestCount(state || {}),
      targets.length,
    ));
  } catch {
    return 0;
  }
}

export function getForgeDayLoad(state = {}, { today = "", nowMs = Date.now() } = {}) {
  const snapshot = getQuestPlanningSnapshot(state, nowMs);
  const targets = getManualForgeTargets(state?.quests || []);
  const selectableCount = getSelectableCountPure(state, targets);
  const selectedTargets = targets.slice(0, selectableCount);
  const openMinutes = knownMinutes(snapshot.open || []);
  const replacementMinutes = knownMinutes(selectedTargets);
  const overdueCount = (snapshot.actionable || []).filter((quest) => (
    quest?.dueDate && String(quest.dueDate).slice(0, 10) < String(today || "")
  )).length;
  const band = snapshot.overloadStatus?.overloaded || (snapshot.mandatory || []).length > 0
    ? "high"
    : snapshot.overloadStatus?.warned || (snapshot.questLog || []).length > 0 || overdueCount > 0
      ? "elevated"
      : "normal";
  const policyMinutes = SET_MINUTE_BUDGETS[band][selectableCount] ?? 0;
  const hasExactReplacementBudget = selectedTargets.length === selectableCount
    && selectableCount > 0
    && replacementMinutes.unknown === 0;
  const maxRecommendedMinutes = hasExactReplacementBudget
    ? Math.min(policyMinutes, replacementMinutes.total)
    : policyMinutes;
  const targetSignature = `ft_${stableQuestHash(stableValue(selectedTargets.map((quest) => ({
    id: quest?.id || "",
    completed: Boolean(quest?.completed),
    touched: Boolean((quest?.subQuests || []).some((step) => step?.completed)),
    estimatedMinutes: Number.isInteger(quest?.estimatedMinutes) ? quest.estimatedMinutes : null,
  }))))}`;
  return {
    band,
    selectableCount,
    actionableCount: snapshot.actionable?.length || 0,
    loadoutCount: snapshot.loadout?.length || 0,
    questLogCount: snapshot.questLog?.length || 0,
    mandatoryCount: snapshot.mandatory?.length || 0,
    overdueCount,
    knownOpenMinutes: openMinutes.total,
    unknownOpenMinutesCount: openMinutes.unknown,
    replacementTargets: selectedTargets,
    replacementKnownMinutes: replacementMinutes.total,
    replacementUnknownCount: replacementMinutes.unknown,
    hasExactReplacementBudget,
    maxRecommendedMinutes,
    targetSignature,
  };
}

function computeExploration(state, today, selectableCount, selectedOutcomeCount, override) {
  const outcomeCount = Math.max(0, Number(selectedOutcomeCount) || 0);
  const eligible = selectableCount > 1 && outcomeCount >= 10;
  if (!eligible || override === false) {
    return { active: false, eligible, maxCount: 0, outcomeCount };
  }
  if (override === true) return { active: true, eligible: true, maxCount: 1, outcomeCount };
  const categories = state?.questSignals?.byCategory || {};
  const seed = stableQuestHash(stableValue({
    today,
    level: finiteNumber(state?.level),
    stats: CATEGORY_IDS.map((category) => finiteNumber(state?.stats?.[category])),
    completions: CATEGORY_IDS.map((category) => finiteNumber(categories?.[category]?.completed)),
    outcomeCount,
  }));
  const numeric = parseInt(seed, 36) || 0;
  const active = numeric % 5 === 0;
  return { active, eligible: true, maxCount: active ? 1 : 0, outcomeCount };
}

export function createForgeContextSignature(context = {}) {
  // Learning and ranking inputs may change while the result is open. Only
  // context that can make accepting the already compiled set unsafe belongs here.
  const safe = {
    today: context.today || "",
    selectableCount: context.selectableCount || 0,
    goals: (context.activeGoals || []).map((goal) => [goal.key, normalizeQuestText(goal.nextMilestone)]),
    load: context.dayLoad ? {
      band: context.dayLoad.band,
      targetSignature: context.dayLoad.targetSignature,
      maxRecommendedMinutes: context.dayLoad.maxRecommendedMinutes,
      actionableCount: context.dayLoad.actionableCount,
      mandatoryCount: context.dayLoad.mandatoryCount,
      overdueCount: context.dayLoad.overdueCount,
    } : null,
  };
  return `fc_${stableQuestHash(stableValue(safe))}`;
}

export function buildForgeContext(state = {}, {
  today = "",
  nowMs = Date.now(),
  exploration = undefined,
} = {}) {
  const dossier = getDossierSummary(state || {});
  const activeGoals = getActiveGoals(state);
  const dayLoad = getForgeDayLoad(state, { today, nowMs });
  const learningDossier = getForgeLearningDossier(state, { nowMs });
  const recipeKnowledge = recipeKnowledgeFromDossier(learningDossier);
  const context = {
    compilerVersion: FORGE_COMPILER_VERSION,
    today: String(today || ""),
    nowMs: finiteNumber(nowMs),
    selectableCount: dayLoad.selectableCount,
    weakestStats: getWeakestStats(state),
    posture: dossier.posture || "neutral",
    avoidedCategories: uniqueStrings(dossier.avoidCategories),
    reliableCategories: uniqueStrings(dossier.reliableCategories),
    likedCategories: uniqueStrings(dossier.likedCategories),
    activeGoals,
    activeHabits: getActiveHabits(state),
    goalContinuityKeys: getGoalContinuityKeys(state, activeGoals),
    recipeKnowledge,
    learningOutcomeCount: learningDossier.selectedOutcomeCount,
    exclusionCorpus: buildQuestExclusionCorpus(state, { nowMs }),
    dayLoad,
    exploration: computeExploration(state, today, dayLoad.selectableCount, learningDossier.selectedOutcomeCount, exploration),
  };
  return { ...context, signature: createForgeContextSignature(context) };
}

function goalForCandidate(context, fingerprint) {
  return (context.activeGoals || []).find((goal) => goal.key === fingerprint.goalKey) || null;
}

function habitForCandidate(context, fingerprint) {
  return (context.activeHabits || []).find((habit) => {
    const similarity = compareQuestSimilarity(fingerprint, habit.fingerprint);
    return similarity.level !== "none";
  }) || null;
}

function validateCandidateShape(quest, { contentSource = "ai", strict = true } = {}) {
  const codes = [];
  if (typeof quest?.id !== "string" || !quest.id.trim()) codes.push("invalid_id");
  if (!String(quest?.title || "").trim()) codes.push("missing_title");
  if (!CATEGORY_SET.has(quest?.category)) codes.push("invalid_category");
  if (!DIFFICULTY_SET.has(quest?.difficulty)) codes.push("invalid_difficulty");
  if (!Number.isInteger(quest?.estimatedMinutes) || quest.estimatedMinutes < 5 || quest.estimatedMinutes > 120) codes.push("invalid_minutes");
  if (strict && !String(quest?.doneWhen || "").trim()) codes.push("missing_done_when");
  if (strict && contentSource === "ai" && (!Array.isArray(quest?.subQuests) || quest.subQuests.length < 2)) codes.push("missing_steps");
  return codes;
}

function factsForCandidate(context, quest, fingerprint, corpusMatch) {
  const goal = goalForCandidate(context, fingerprint);
  const habit = habitForCandidate(context, fingerprint);
  const recipe = context.recipeKnowledge?.[fingerprint.recipeKey];
  const facts = [];
  if (quest.estimatedMinutes >= 5 && quest.estimatedMinutes <= 15) facts.push("quick_win");
  if (goal) facts.push("active_goal");
  if (goal && context.goalContinuityKeys.includes(goal.key)) facts.push("goal_continuity");
  if (habit) facts.push("active_habit");
  if (context.reliableCategories.includes(quest.category)) facts.push("reliable_category");
  if (context.likedCategories.includes(quest.category)) facts.push("liked_category");
  if (context.weakestStats.includes(quest.category)) facts.push("weakest_stat");
  if (recipe?.reliable) facts.push("reliable_recipe", "proven_recipe");
  if (recipe?.preferred) facts.push("preferred_recipe");
  if (recipe?.avoided) facts.push("avoided_recipe");
  if (!recipe) facts.push("novel_recipe");
  if (corpusMatch.level === "soft") facts.push("soft_duplicate");
  if (context.avoidedCategories.includes(quest.category)) facts.push("avoided_category");
  return { facts: uniqueStrings(facts), goal, habit, recipe };
}

function fact(entry, key) {
  return entry.facts.includes(key);
}

function compareBoolean(left, right, key, preferTrue = true) {
  const a = fact(left, key);
  const b = fact(right, key);
  if (a === b) return 0;
  return preferTrue ? (a ? -1 : 1) : (a ? 1 : -1);
}

function compareIntrinsic(left, right, context) {
  const struggling = context.posture === "struggling" || context.dayLoad?.band === "high";
  const checks = [
    ...(struggling ? [compareBoolean(left, right, "quick_win")] : []),
    compareBoolean(left, right, "goal_continuity"),
    compareBoolean(left, right, "active_goal"),
    ...(!struggling ? [compareBoolean(left, right, "quick_win")] : []),
    compareBoolean(left, right, "soft_duplicate", false),
    compareBoolean(left, right, "avoided_recipe", false),
    compareBoolean(left, right, "avoided_category", false),
    compareBoolean(left, right, "preferred_recipe"),
    compareBoolean(left, right, "reliable_recipe"),
    compareBoolean(left, right, "liked_category"),
    compareBoolean(left, right, "reliable_category"),
    compareBoolean(left, right, "weakest_stat"),
  ];
  for (const result of checks) if (result) return result;
  return left.quest.estimatedMinutes - right.quest.estimatedMinutes
    || left.originalIndex - right.originalIndex
    || left.quest.id.localeCompare(right.quest.id);
}

export function compileForgeCandidates(context, candidates, {
  contentSource = "ai",
  strict = true,
} = {}) {
  const rejected = [];
  const ids = new Set();
  const shaped = [];
  for (const [originalIndex, quest] of (Array.isArray(candidates) ? candidates : []).entries()) {
    const codes = validateCandidateShape(quest, { contentSource, strict });
    if (typeof quest?.id === "string" && ids.has(quest.id)) codes.push("duplicate_id");
    if (typeof quest?.id === "string") ids.add(quest.id);
    if (codes.length > 0) {
      rejected.push({ candidateId: typeof quest?.id === "string" ? quest.id : null, codes: uniqueStrings(codes).filter((code) => REJECTION_CODES.has(code)) });
      continue;
    }
    const fingerprint = createQuestFingerprint(quest);
    let corpusMatch = matchQuestAgainstCorpus(fingerprint, context?.exclusionCorpus || []);
    const habit = habitForCandidate(context || {}, fingerprint);
    // Active habits are intentionally repeatable across days. A same-day
    // completion remains a hard duplicate; open and negative matches are
    // never relaxed.
    if (habit && corpusMatch.source === "recent_completed") {
      const contextDay = String(context?.today || "")
        || (context?.nowMs ? new Date(context.nowMs).toISOString().slice(0, 10) : "");
      const completedToday = Boolean(contextDay && corpusMatch.entry?.dayKey === contextDay);
      if (!completedToday) {
        corpusMatch = { ...corpusMatch, level: "none", reason: "habit_history_allowed" };
      } else {
        const rawSimilarity = compareQuestSimilarity(fingerprint, corpusMatch.entry?.fingerprint);
        if (rawSimilarity.level === "hard") {
          corpusMatch = { ...corpusMatch, ...rawSimilarity, source: "recent_completed", reason: "habit_completed_today" };
        }
      }
    }
    if (corpusMatch.level === "hard") {
      const code = corpusMatch.source === "open"
        ? "open_duplicate"
        : corpusMatch.source === "recent_completed"
          ? "recent_repeat"
          : "negative_duplicate";
      rejected.push({ candidateId: quest.id, codes: [code] });
      continue;
    }
    const evidence = factsForCandidate(context || {}, quest, fingerprint, corpusMatch);
    const forgeMeta = {
      compilerVersion: FORGE_COMPILER_VERSION,
      exactKey: fingerprint.exactKey,
      semanticKey: fingerprint.semanticKey,
      recipeKey: fingerprint.recipeKey,
      variationKey: fingerprint.variationKey,
      facts: evidence.facts,
      contentSource: contentSource === "fallback" ? "fallback" : "ai",
    };
    shaped.push({
      quest: { ...quest, forgeMeta },
      fingerprint,
      originalIndex,
      corpusMatch,
      ...evidence,
    });
  }

  // Resolve duplicate candidates after quality facts are known. This keeps the
  // strongest grounded variant instead of blindly trusting response order.
  const eligible = [];
  for (const candidate of shaped.sort((left, right) => compareIntrinsic(left, right, context || {}))) {
    const duplicate = eligible.find((kept) => compareQuestSimilarity(candidate.fingerprint, kept.fingerprint).level === "hard");
    if (duplicate) {
      rejected.push({ candidateId: candidate.quest.id, codes: ["batch_duplicate"] });
      continue;
    }
    eligible.push(candidate);
  }
  eligible.sort((left, right) => left.originalIndex - right.originalIndex || left.quest.id.localeCompare(right.quest.id));

  const rejectionCounts = {};
  for (const item of rejected) for (const code of item.codes) rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
  return {
    compilerVersion: FORGE_COMPILER_VERSION,
    contentSource: contentSource === "fallback" ? "fallback" : "ai",
    status: eligible.length > 0 ? "ready" : "no_fit",
    eligible,
    rejected,
    diagnostics: {
      inputCount: Array.isArray(candidates) ? candidates.length : 0,
      eligibleCount: eligible.length,
      rejectedCount: rejected.length,
      rejectionCounts,
    },
  };
}

function compareForSet(left, right, context, selected, { explorationSlot = false } = {}) {
  const struggling = context.posture === "struggling" || context.dayLoad?.band === "high";
  const selectedCategories = new Set(selected.map((entry) => entry.quest.category));
  const selectedActions = new Set(selected.map((entry) => entry.fingerprint.actionFamily));
  const checks = [
    ...(struggling ? [compareBoolean(left, right, "quick_win")] : []),
    compareBoolean(left, right, "goal_continuity"),
    compareBoolean(left, right, "active_goal"),
    ...(!struggling ? [compareBoolean(left, right, "quick_win")] : []),
    compareBoolean(left, right, "soft_duplicate", false),
    compareBoolean(left, right, "avoided_recipe", false),
    compareBoolean(left, right, "avoided_category", false),
    ...(explorationSlot ? [compareBoolean(left, right, "novel_recipe")] : []),
    compareBoolean(left, right, "preferred_recipe"),
    compareBoolean(left, right, "reliable_recipe"),
    compareBoolean(left, right, "liked_category"),
    compareBoolean(left, right, "reliable_category"),
  ];
  for (const result of checks) if (result) return result;
  const actionRepeatLeft = selectedActions.has(left.fingerprint.actionFamily);
  const actionRepeatRight = selectedActions.has(right.fingerprint.actionFamily);
  if (actionRepeatLeft !== actionRepeatRight) return actionRepeatLeft ? 1 : -1;
  const categoryRepeatLeft = selectedCategories.has(left.quest.category);
  const categoryRepeatRight = selectedCategories.has(right.quest.category);
  if (categoryRepeatLeft !== categoryRepeatRight) return categoryRepeatLeft ? 1 : -1;
  const weak = compareBoolean(left, right, "weakest_stat");
  if (weak) return weak;
  return left.quest.estimatedMinutes - right.quest.estimatedMinutes
    || left.originalIndex - right.originalIndex
    || left.quest.id.localeCompare(right.quest.id);
}

function reasonFor(entry, context, explored) {
  if (fact(entry, "avoided_recipe") || fact(entry, "avoided_category") || fact(entry, "soft_duplicate")) return null;
  const goalTitle = entry.goal?.title;
  const order = context.posture === "struggling" || context.dayLoad?.band === "high"
    ? ["quick_win", "goal_continuity", "active_goal", "proven_recipe", "reliable_category", "weakest_stat"]
    : ["goal_continuity", "active_goal", "quick_win", "proven_recipe", "reliable_category", "weakest_stat"];
  for (const key of order) {
    if (!fact(entry, key)) continue;
    if (key === "goal_continuity") return { key, params: { goalTitle } };
    if (key === "active_goal") return { key, params: { goalTitle } };
    if (key === "reliable_category" || key === "weakest_stat") return { key, params: { category: entry.quest.category } };
    return { key, params: {} };
  }
  return explored ? { key: "exploration", params: {} } : null;
}

function asEntry(candidate, index) {
  if (candidate?.quest && candidate?.fingerprint && Array.isArray(candidate?.facts)) return candidate;
  const quest = candidate?.quest || candidate;
  const fingerprint = createQuestFingerprint(quest || {});
  const facts = uniqueStrings(quest?.forgeMeta?.facts || []);
  return { quest, fingerprint, facts, originalIndex: Number.isInteger(candidate?.originalIndex) ? candidate.originalIndex : index, goal: null };
}

export function composeForgeSet(context, candidatesOrCompilation, { proposalLimit = MAX_VISIBLE_PROPOSALS } = {}) {
  const source = Array.isArray(candidatesOrCompilation)
    ? candidatesOrCompilation
    : candidatesOrCompilation?.eligible || [];
  const eligible = source.map(asEntry).filter((entry) => entry.quest?.id);
  const capacity = Math.max(0, Math.min(MAX_VISIBLE_PROPOSALS, Number(context?.selectableCount) || 0));
  const budget = Math.max(0, Number(context?.dayLoad?.maxRecommendedMinutes) || 0);
  const recommended = [];
  const exploredIds = new Set();
  const remaining = [...eligible];
  const hasGoalCandidate = remaining.some((entry) => fact(entry, "active_goal"));
  const needsQuick = context?.posture === "struggling" || context?.dayLoad?.band === "high";
  const hasQuickCandidate = remaining.some((entry) => fact(entry, "quick_win"));

  while (recommended.length < capacity && remaining.length > 0) {
    const usedMinutes = recommended.reduce((sum, entry) => sum + entry.quest.estimatedMinutes, 0);
    const fitting = remaining.filter((entry) => usedMinutes + entry.quest.estimatedMinutes <= budget);
    if (fitting.length === 0) break;
    const lastSlot = recommended.length === capacity - 1;
    const goalCovered = recommended.some((entry) => fact(entry, "active_goal"));
    const quickCovered = recommended.some((entry) => fact(entry, "quick_win"));
    const explorationSlot = Boolean(context?.exploration?.active && lastSlot
      && exploredIds.size < Math.min(1, Number(context?.exploration?.maxCount) || 0)
      && (!hasGoalCandidate || goalCovered)
      && (!needsQuick || !hasQuickCandidate || quickCovered));
    fitting.sort((left, right) => compareForSet(left, right, context || {}, recommended, { explorationSlot }));
    const chosen = fitting[0];
    recommended.push(chosen);
    if (explorationSlot && fact(chosen, "novel_recipe")) exploredIds.add(chosen.quest.id);
    remaining.splice(remaining.indexOf(chosen), 1);
  }

  remaining.sort((left, right) => compareForSet(left, right, context || {}, [], {}));
  const proposalEntries = [...recommended, ...remaining].slice(0, Math.max(1, Math.min(MAX_VISIBLE_PROPOSALS, proposalLimit)));
  const recommendedIds = recommended.map((entry) => entry.quest.id);
  const orderedIds = proposalEntries.map((entry) => entry.quest.id);
  const reasonsById = {};
  for (const entry of proposalEntries) {
    const reason = reasonFor(entry, context || {}, exploredIds.has(entry.quest.id));
    if (reason) reasonsById[entry.quest.id] = reason;
  }
  const status = eligible.length === 0 || (capacity > 0 && recommended.length === 0)
    ? "no_fit"
    : capacity > 0 && recommended.length < capacity
      ? "partial"
      : "ready";
  return {
    compilerVersion: FORGE_COMPILER_VERSION,
    status,
    proposals: proposalEntries.map((entry) => entry.quest),
    orderedIds,
    recommendedIds,
    previewIds: recommendedIds.length > 0 ? recommendedIds : orderedIds,
    reasonsById,
    contextSignature: context?.signature || createForgeContextSignature(context || {}),
    targetSignature: context?.dayLoad?.targetSignature || "",
    setSummary: {
      capacity,
      recommendedCount: recommended.length,
      estimatedMinutes: recommended.reduce((sum, entry) => sum + entry.quest.estimatedMinutes, 0),
      goalCount: recommended.filter((entry) => fact(entry, "active_goal")).length,
      quickCount: recommended.filter((entry) => fact(entry, "quick_win")).length,
      exploredCount: recommended.filter((entry) => exploredIds.has(entry.quest.id)).length,
      loadBand: context?.dayLoad?.band || "normal",
      minuteBudget: budget,
    },
  };
}

export function compileForgeSet(state, candidates, {
  today = "",
  nowMs = Date.now(),
  exploration = undefined,
  contentSource = "ai",
  strict = true,
  proposalLimit = MAX_VISIBLE_PROPOSALS,
} = {}) {
  const context = buildForgeContext(state, { today, nowMs, exploration });
  const compilation = compileForgeCandidates(context, candidates, { contentSource, strict });
  const composition = composeForgeSet(context, compilation, { proposalLimit });
  return { context, compilation, composition };
}

export const FORGE_COMPILER_POLICY = Object.freeze({
  version: FORGE_COMPILER_VERSION,
  maxVisibleProposals: MAX_VISIBLE_PROPOSALS,
  setMinuteBudgets: SET_MINUTE_BUDGETS,
  explorationCadence: 5,
  explorationMinimumOutcomes: 10,
  reliableHighConfidenceCompletions: 5,
  reliableMediumConfidenceCompletions: 8,
  reliableCompletionRateExclusive: 0.75,
});
