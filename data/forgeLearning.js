// Lokales, erklaerbares Forge-Lernen. Rohereignisse bleiben pro Quest
// nachvollziehbar; Rezept-Hypothesen werden immer frisch daraus abgeleitet.

import {
  getEffectiveQuestDNA,
  getQuestRecipeKey,
  parseQuestRecipeKey,
} from "./questDNA.js";

export const FORGE_LEARNING_VERSION = 1;
export const FORGE_LEARNING_SELECT_DAYS = 28;
export const FORGE_LEARNING_PRUNE_DAYS = 35;
export const FORGE_LEARNING_OUTCOME_CAP = 200;

export const DEFAULT_FORGE_LEARNING = Object.freeze({
  version: FORGE_LEARNING_VERSION,
  resetAtMs: 0,
  updatedAtMs: 0,
  outcomesByQuestId: {},
  preferencesByRecipe: {},
});

const DAY_MS = 86400000;
const RATINGS = new Set(["liked", "disliked"]);
const PREFERENCES = new Set(["prefer", "avoid", "neutral"]);
const DNA_SOURCES = new Set(["declared", "inferred"]);
const DNA_CONFIDENCES = new Set(["high", "medium"]);

const finiteTimestamp = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

const cleanId = (value, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function latestOutcomeTimestamp(outcome) {
  return Math.max(
    finiteTimestamp(outcome?.assignedAtMs),
    finiteTimestamp(outcome?.startedAtMs),
    finiteTimestamp(outcome?.completedAtMs),
    finiteTimestamp(outcome?.expiredAtMs),
    finiteTimestamp(outcome?.swappedAtMs),
    finiteTimestamp(outcome?.deletedAtMs),
    finiteTimestamp(outcome?.editedAtMs),
    finiteTimestamp(outcome?.ratingUpdatedAtMs),
    finiteTimestamp(outcome?.updatedAtMs),
  );
}

function normalizeOutcome(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const recipeKey = parseQuestRecipeKey(value.recipeKey) ? value.recipeKey : null;
  if (!recipeKey) return null;
  const migratedSource = value.dnaSource === "explicit" ? "declared" : value.dnaSource;
  const dnaSource = DNA_SOURCES.has(migratedSource) ? migratedSource : "inferred";
  const dnaConfidence = DNA_CONFIDENCES.has(value.dnaConfidence)
    ? value.dnaConfidence
    : (dnaSource === "declared" ? "high" : "medium");
  const origin = cleanId(value.origin, 40) || "forge";
  const normalized = {
    recipeKey,
    dnaSource,
    dnaConfidence,
    origin,
    assignedAtMs: finiteTimestamp(value.assignedAtMs),
    startedAtMs: finiteTimestamp(value.startedAtMs),
    completedAtMs: finiteTimestamp(value.completedAtMs),
    expiredAtMs: finiteTimestamp(value.expiredAtMs),
    swappedAtMs: finiteTimestamp(value.swappedAtMs),
    deletedAtMs: finiteTimestamp(value.deletedAtMs),
    editedAtMs: finiteTimestamp(value.editedAtMs),
    rating: RATINGS.has(value.rating) ? value.rating : null,
    ratingUpdatedAtMs: finiteTimestamp(value.ratingUpdatedAtMs),
    updatedAtMs: finiteTimestamp(value.updatedAtMs),
  };
  normalized.updatedAtMs = Math.max(normalized.updatedAtMs, latestOutcomeTimestamp(normalized));
  if (!normalized.assignedAtMs) normalized.assignedAtMs = normalized.updatedAtMs;
  return normalized;
}

function normalizePreference(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!PREFERENCES.has(value.value)) return null;
  return { value: value.value, updatedAtMs: finiteTimestamp(value.updatedAtMs) };
}

function capRecentEntries(entries, cap, timestampOf) {
  return Object.fromEntries(Object.entries(entries)
    .sort(([leftKey, left], [rightKey, right]) => (
      timestampOf(right) - timestampOf(left) || leftKey.localeCompare(rightKey)
    ))
    .slice(0, cap));
}

export function normalizeForgeLearning(value, { nowMs = Date.now(), prune = true } = {}) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const resetAtMs = finiteTimestamp(raw.resetAtMs);
  const cutoffMs = finiteTimestamp(nowMs) - FORGE_LEARNING_PRUNE_DAYS * DAY_MS;
  const outcomes = {};
  for (const [rawQuestId, rawOutcome] of Object.entries(raw.outcomesByQuestId || {})) {
    const questId = cleanId(rawQuestId);
    const outcome = normalizeOutcome(rawOutcome);
    if (!questId || !outcome || outcome.assignedAtMs <= resetAtMs) continue;
    if (prune && outcome.updatedAtMs < cutoffMs) continue;
    outcomes[questId] = outcome;
  }

  const preferences = {};
  for (const [recipeKey, rawPreference] of Object.entries(raw.preferencesByRecipe || {})) {
    if (!parseQuestRecipeKey(recipeKey)) continue;
    const preference = normalizePreference(rawPreference);
    if (!preference || preference.updatedAtMs <= resetAtMs) continue;
    preferences[recipeKey] = preference;
  }

  const outcomesByQuestId = capRecentEntries(
    outcomes,
    FORGE_LEARNING_OUTCOME_CAP,
    latestOutcomeTimestamp,
  );
  // There are fewer than 200 valid v1 recipe combinations in normal use, but
  // the cap also makes hostile imported states bounded.
  const preferencesByRecipe = capRecentEntries(
    preferences,
    FORGE_LEARNING_OUTCOME_CAP,
    (entry) => finiteTimestamp(entry.updatedAtMs),
  );
  const childUpdatedAtMs = Math.max(
    0,
    ...Object.values(outcomesByQuestId).map(latestOutcomeTimestamp),
    ...Object.values(preferencesByRecipe).map((entry) => finiteTimestamp(entry.updatedAtMs)),
  );
  return {
    version: FORGE_LEARNING_VERSION,
    resetAtMs,
    updatedAtMs: Math.max(resetAtMs, finiteTimestamp(raw.updatedAtMs), childUpdatedAtMs),
    outcomesByQuestId,
    preferencesByRecipe,
  };
}

function questMap(state) {
  const map = new Map();
  for (const quest of [
    ...(Array.isArray(state?.quests) ? state.quests : []),
    ...(Array.isArray(state?.questArchive) ? state.questArchive : []),
    ...(Array.isArray(state?.completedQuests) ? state.completedQuests : []),
  ]) {
    const id = cleanId(quest?.id);
    if (id) map.set(id, quest);
  }
  return map;
}

function isForgeQuest(quest) {
  return quest?.origin === "forge" || finiteTimestamp(quest?.forgeAcceptedAtMs) > 0;
}

function completedTimestamp(quest) {
  const direct = finiteTimestamp(quest?.completedAtMs);
  if (direct) return direct;
  const parsed = Date.parse(quest?.completedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function startedTimestamp(quest, fallbackMs = 0) {
  const explicit = finiteTimestamp(quest?.startedAtMs);
  if (explicit) return explicit;
  const completedSubQuest = (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
    .filter((item) => item?.completed)
    .map((item) => finiteTimestamp(item?.completedAtMs) || Date.parse(item?.completedAt || ""))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)[0];
  return finiteTimestamp(completedSubQuest) || (quest?.started === true ? finiteTimestamp(fallbackMs) : 0);
}

function structuralQuestSignature(quest) {
  if (!quest) return "";
  const dna = getEffectiveQuestDNA(quest)?.dna || null;
  return stableValue({
    title: String(quest.title || "").trim(),
    description: String(quest.description ?? quest.desc ?? "").trim(),
    doneWhen: String(quest.doneWhen || "").trim(),
    estimatedMinutes: Number.isFinite(Number(quest.estimatedMinutes)) ? Number(quest.estimatedMinutes) : null,
    category: quest.category || null,
    difficulty: quest.difficulty || null,
    energy: quest.energy || null,
    context: String(quest.context || "").trim(),
    subQuests: (Array.isArray(quest.subQuests) ? quest.subQuests : [])
      .map((item) => String(typeof item === "string" ? item : item?.title || "").trim()),
    questDNA: dna,
  });
}

function isExpiredRemoval(quest, today) {
  if (!quest || !today) return false;
  const due = String(quest.dueDate || quest.createdAt || "");
  return quest.type === "daily" && Boolean(due) && due < String(today);
}

function hasChanged(left, right) {
  return stableValue(left) !== stableValue(right);
}

function stampOutcome(outcome, patch, nowMs) {
  const next = { ...outcome, ...patch };
  if (!hasChanged(outcome, next)) return outcome;
  return { ...next, updatedAtMs: Math.max(finiteTimestamp(nowMs), latestOutcomeTimestamp(next)) };
}

export function reconcileForgeLearning(previousState, nextState, {
  nowMs = Date.now(),
  today = "",
  locale = "de",
} = {}) {
  const now = finiteTimestamp(nowMs) || Date.now();
  const previousQuests = questMap(previousState);
  const nextQuests = questMap(nextState);
  const nextActiveQuests = Array.isArray(nextState?.quests) ? nextState.quests : [];
  const nextActiveQuestIds = new Set(nextActiveQuests.map((quest) => cleanId(quest?.id)).filter(Boolean));
  const replacementsByOldId = new Set(nextActiveQuests.map((quest) => cleanId(quest?.replacedQuestId)).filter(Boolean));
  let learning = normalizeForgeLearning(
    nextState?.forgeLearning || previousState?.forgeLearning,
    { nowMs: now, prune: true },
  );
  const outcomes = { ...learning.outcomesByQuestId };
  const outcomeSignatureBefore = stableValue(outcomes);

  for (const [questId, quest] of nextQuests) {
    let outcome = outcomes[questId];
    if (!outcome) {
      const effective = getEffectiveQuestDNA(quest, { locale });
      const recipeKey = getQuestRecipeKey(quest, { locale });
      if (!effective || !recipeKey) continue;
      const assignedAtMs = finiteTimestamp(quest.forgeAcceptedAtMs)
        || finiteTimestamp(quest.createdAtMs)
        || completedTimestamp(quest)
        || finiteTimestamp(Date.parse(quest.createdAt || quest.date || ""))
        || (nextActiveQuestIds.has(questId) ? now : 0);
      if (!assignedAtMs) continue;
      outcome = normalizeOutcome({
        recipeKey,
        dnaSource: effective.source,
        dnaConfidence: effective.confidence,
        origin: quest.origin || (quest.isSystem ? "system" : "manual"),
        assignedAtMs,
        startedAtMs: 0,
        completedAtMs: 0,
        expiredAtMs: 0,
        swappedAtMs: 0,
        deletedAtMs: 0,
        editedAtMs: 0,
        rating: null,
        ratingUpdatedAtMs: 0,
        updatedAtMs: assignedAtMs,
      });
    }

    const previousQuest = previousQuests.get(questId);
    if (previousQuest && structuralQuestSignature(previousQuest) !== structuralQuestSignature(quest)) {
      outcome = stampOutcome(outcome, { editedAtMs: now }, now);
    }

    const startedAtMs = startedTimestamp(quest, now);
    if (!outcome.startedAtMs && startedAtMs) {
      outcome = stampOutcome(outcome, { startedAtMs }, now);
    }

    const completedAtMs = completedTimestamp(quest);
    if (!outcome.completedAtMs && completedAtMs) {
      outcome = stampOutcome(outcome, {
        completedAtMs,
      }, now);
    }

    const rating = RATINGS.has(quest.userRating) ? quest.userRating : null;
    const previousRating = RATINGS.has(previousQuest?.userRating) ? previousQuest.userRating : null;
    if (rating !== previousRating || outcome.rating !== rating) {
      outcome = stampOutcome(outcome, { rating, ratingUpdatedAtMs: now }, now);
    }
    outcomes[questId] = outcome;
  }

  for (const [questId, outcome] of Object.entries(outcomes)) {
    if (nextQuests.has(questId) || outcome.completedAtMs || outcome.expiredAtMs
      || outcome.swappedAtMs || outcome.deletedAtMs) continue;
    const previousQuest = previousQuests.get(questId);
    if (!previousQuest) continue;
    const terminalPatch = replacementsByOldId.has(questId)
      ? { swappedAtMs: now }
      : isExpiredRemoval(previousQuest, today)
        ? { expiredAtMs: now }
        : { deletedAtMs: now };
    outcomes[questId] = stampOutcome(outcome, terminalPatch, now);
  }

  const outcomesChanged = outcomeSignatureBefore !== stableValue(outcomes);
  learning = normalizeForgeLearning({
    ...learning,
    outcomesByQuestId: outcomes,
    updatedAtMs: outcomesChanged ? Math.max(learning.updatedAtMs, now) : learning.updatedAtMs,
  }, { nowMs: now, prune: true });
  return { ...(nextState || {}), forgeLearning: learning };
}

function learningInput(value) {
  return value?.forgeLearning && typeof value.forgeLearning === "object"
    ? { wrapper: value, learning: value.forgeLearning }
    : { wrapper: null, learning: value };
}

function wrapLearning(input, learning) {
  return input.wrapper ? { ...input.wrapper, forgeLearning: learning } : learning;
}

export function setForgeRecipePreference(stateOrLearning, recipeOrOptions, legacyValue, legacyOptions = {}) {
  const structured = recipeOrOptions && typeof recipeOrOptions === "object";
  const recipeKey = structured ? recipeOrOptions.recipeKey : recipeOrOptions;
  const value = structured ? recipeOrOptions.value : legacyValue;
  const requestedNow = structured ? recipeOrOptions.nowMs : legacyOptions.nowMs;
  const input = learningInput(stateOrLearning);
  if (!parseQuestRecipeKey(recipeKey) || !PREFERENCES.has(value)) return stateOrLearning;
  const now = finiteTimestamp(requestedNow) || Date.now();
  const learning = normalizeForgeLearning(input.learning, { nowMs: now, prune: true });
  const next = normalizeForgeLearning({
    ...learning,
    updatedAtMs: Math.max(learning.updatedAtMs, now),
    preferencesByRecipe: {
      ...learning.preferencesByRecipe,
      [recipeKey]: { value, updatedAtMs: now },
    },
  }, { nowMs: now, prune: true });
  return wrapLearning(input, next);
}

export function resetForgeLearning(stateOrLearning, { nowMs = Date.now() } = {}) {
  const input = learningInput(stateOrLearning);
  const current = normalizeForgeLearning(input.learning, { nowMs, prune: true });
  const now = Math.max(finiteTimestamp(nowMs) || Date.now(), current.resetAtMs);
  return wrapLearning(input, {
    version: FORGE_LEARNING_VERSION,
    resetAtMs: now,
    updatedAtMs: Math.max(current.updatedAtMs, now),
    outcomesByQuestId: {},
    preferencesByRecipe: {},
  });
}

function mergeOutcomeEntries(left, right) {
  if (!left) return right;
  if (!right) return left;
  const metadata = chooseEntry(left, right, latestOutcomeTimestamp);
  const leftRatingAt = finiteTimestamp(left.ratingUpdatedAtMs);
  const rightRatingAt = finiteTimestamp(right.ratingUpdatedAtMs);
  const ratingSource = leftRatingAt === rightRatingAt
    ? (stableValue({ rating: left.rating }) >= stableValue({ rating: right.rating }) ? left : right)
    : (leftRatingAt > rightRatingAt ? left : right);
  return normalizeOutcome({
    ...metadata,
    assignedAtMs: Math.max(finiteTimestamp(left.assignedAtMs), finiteTimestamp(right.assignedAtMs)),
    startedAtMs: Math.max(finiteTimestamp(left.startedAtMs), finiteTimestamp(right.startedAtMs)),
    completedAtMs: Math.max(finiteTimestamp(left.completedAtMs), finiteTimestamp(right.completedAtMs)),
    expiredAtMs: Math.max(finiteTimestamp(left.expiredAtMs), finiteTimestamp(right.expiredAtMs)),
    swappedAtMs: Math.max(finiteTimestamp(left.swappedAtMs), finiteTimestamp(right.swappedAtMs)),
    deletedAtMs: Math.max(finiteTimestamp(left.deletedAtMs), finiteTimestamp(right.deletedAtMs)),
    editedAtMs: Math.max(finiteTimestamp(left.editedAtMs), finiteTimestamp(right.editedAtMs)),
    rating: ratingSource.rating,
    ratingUpdatedAtMs: Math.max(leftRatingAt, rightRatingAt),
    updatedAtMs: Math.max(latestOutcomeTimestamp(left), latestOutcomeTimestamp(right)),
  });
}
function chooseEntry(left, right, timestampOf) {
  if (!left) return right;
  if (!right) return left;
  const leftTime = timestampOf(left);
  const rightTime = timestampOf(right);
  if (leftTime !== rightTime) return leftTime > rightTime ? left : right;
  return stableValue(left) >= stableValue(right) ? left : right;
}

export function mergeForgeLearning(primaryValue, fallbackValue, { nowMs = Date.now() } = {}) {
  const primary = normalizeForgeLearning(primaryValue, { nowMs, prune: true });
  const fallback = normalizeForgeLearning(fallbackValue, { nowMs, prune: true });
  const resetAtMs = Math.max(primary.resetAtMs, fallback.resetAtMs);
  const outcomesByQuestId = {};
  for (const questId of new Set([
    ...Object.keys(primary.outcomesByQuestId),
    ...Object.keys(fallback.outcomesByQuestId),
  ])) {
    const selected = mergeOutcomeEntries(
      primary.outcomesByQuestId[questId],
      fallback.outcomesByQuestId[questId],
    );
    if (selected && selected.assignedAtMs > resetAtMs) outcomesByQuestId[questId] = selected;
  }
  const preferencesByRecipe = {};
  for (const recipeKey of new Set([
    ...Object.keys(primary.preferencesByRecipe),
    ...Object.keys(fallback.preferencesByRecipe),
  ])) {
    const selected = chooseEntry(
      primary.preferencesByRecipe[recipeKey],
      fallback.preferencesByRecipe[recipeKey],
      (entry) => finiteTimestamp(entry?.updatedAtMs),
    );
    if (selected && finiteTimestamp(selected.updatedAtMs) > resetAtMs) preferencesByRecipe[recipeKey] = selected;
  }
  return normalizeForgeLearning({
    version: FORGE_LEARNING_VERSION,
    resetAtMs,
    updatedAtMs: Math.max(primary.updatedAtMs, fallback.updatedAtMs, resetAtMs),
    outcomesByQuestId,
    preferencesByRecipe,
  }, { nowMs, prune: true });
}

export function getForgeLearningDossier(stateOrLearning, { nowMs = Date.now() } = {}) {
  const input = learningInput(stateOrLearning);
  const now = finiteTimestamp(nowMs) || Date.now();
  const learning = normalizeForgeLearning(input.learning, { nowMs: now, prune: true });
  const cutoffMs = now - FORGE_LEARNING_SELECT_DAYS * DAY_MS;
  const groups = new Map();
  const selectedOutcomes = Object.values(learning.outcomesByQuestId)
    .filter((outcome) => outcome.assignedAtMs >= cutoffMs);

  for (const outcome of selectedOutcomes) {
    const group = groups.get(outcome.recipeKey) || {
      recipeKey: outcome.recipeKey,
      recipe: parseQuestRecipeKey(outcome.recipeKey),
      assigned: 0,
      started: 0,
      completed: 0,
      expired: 0,
      swapped: 0,
      deleted: 0,
      edited: 0,
      liked: 0,
      disliked: 0,
      eligibleAssigned: 0,
      highConfidenceAssigned: 0,
      highConfidenceCompleted: 0,
    };
    group.assigned += Number(outcome.assignedAtMs > 0);
    group.started += Number(outcome.startedAtMs > 0);
    group.expired += Number(outcome.expiredAtMs > 0);
    group.swapped += Number(outcome.swappedAtMs > 0);
    group.deleted += Number(outcome.deletedAtMs > 0);
    group.edited += Number(outcome.editedAtMs > 0);
    group.liked += Number(outcome.rating === "liked");
    group.disliked += Number(outcome.rating === "disliked");

    // A structural edit neither confirms nor disproves the originally
    // assigned recipe. It is excluded from both numerator and denominator.
    if (!outcome.editedAtMs) {
      group.eligibleAssigned += Number(outcome.assignedAtMs > 0);
      group.completed += Number(outcome.completedAtMs > 0);
      if (outcome.dnaConfidence === "high") {
        group.highConfidenceAssigned += Number(outcome.assignedAtMs > 0);
        group.highConfidenceCompleted += Number(outcome.completedAtMs > 0);
      }
    }
    groups.set(outcome.recipeKey, group);
  }

  for (const recipeKey of Object.keys(learning.preferencesByRecipe)) {
    if (groups.has(recipeKey)) continue;
    groups.set(recipeKey, {
      recipeKey,
      recipe: parseQuestRecipeKey(recipeKey),
      assigned: 0,
      started: 0,
      completed: 0,
      expired: 0,
      swapped: 0,
      deleted: 0,
      edited: 0,
      liked: 0,
      disliked: 0,
      eligibleAssigned: 0,
      highConfidenceAssigned: 0,
      highConfidenceCompleted: 0,
    });
  }

  const recipes = [...groups.values()].map((group) => {
    const completionRate = group.eligibleAssigned > 0 ? group.completed / group.eligibleAssigned : null;
    const highCompletionRate = group.highConfidenceAssigned > 0
      ? group.highConfidenceCompleted / group.highConfidenceAssigned
      : null;
    const reliableFromHighConfidence = group.highConfidenceCompleted >= 5
      && highCompletionRate > 0.75;
    const reliableFromMediumInference = group.completed >= 8 && completionRate > 0.75;
    const explicitPreference = learning.preferencesByRecipe[group.recipeKey]?.value || "neutral";
    const netLikes = group.liked - group.disliked;
    const netDislikes = group.disliked - group.liked;
    // Wiederholt geloescht + nie abgeschlossen wirkt wie Netto-Dislike;
    // ein einziger Abschluss hebt die Loesch-Meidung wieder auf.
    const avoided = explicitPreference === "avoid"
      || (explicitPreference !== "prefer"
        && (netDislikes >= 2 || (group.deleted >= 2 && group.completed === 0)));
    const preferred = explicitPreference === "prefer"
      || (explicitPreference !== "avoid" && netLikes >= 2);
    return {
      ...group,
      completionRate,
      explicitPreference,
      netLikes,
      reliable: !avoided && (reliableFromHighConfidence || reliableFromMediumInference),
      preferred,
      avoided,
    };
  }).sort((left, right) => right.assigned - left.assigned || left.recipeKey.localeCompare(right.recipeKey));

  return {
    windowDays: FORGE_LEARNING_SELECT_DAYS,
    selectedOutcomeCount: selectedOutcomes.length,
    recipes,
    reliableRecipeKeys: recipes.filter((item) => item.reliable).map((item) => item.recipeKey),
    preferredRecipeKeys: recipes.filter((item) => item.preferred).map((item) => item.recipeKey),
    avoidedRecipeKeys: recipes.filter((item) => item.avoided).map((item) => item.recipeKey),
  };
}
