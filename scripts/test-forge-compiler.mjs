import assert from "node:assert/strict";
import {
  buildForgeExclusionCorpus,
  buildQuestExclusionCorpus,
  compareQuestSimilarity,
  createQuestFingerprint,
  getQuestFingerprint,
  matchQuestAgainstCorpus,
  normalizeQuestText,
} from "../data/questSimilarity.js";
import {
  buildForgeContext,
  compileForgeCandidates,
  compileForgeSet,
  composeForgeSet,
  deriveForgeRecipeKnowledge,
} from "../data/forgeCompiler.js";
import {
  acceptProposals,
  clearPendingSet,
  createPendingSet,
  mergeForgeState,
  normalizeForgeState,
} from "../data/forge.js";
import { setForgeRecipePreference } from "../data/forgeLearning.js";
import { getToday } from "../data/dateUtils.js";

const TODAY = getToday();
const NOW = new Date(`${TODAY}T12:00:00`).getTime();

const poolDaily = (id, estimatedMinutes = 25) => ({
  id,
  templateId: `template_${id}`,
  title: `Systemslot ${id}`,
  category: "agi",
  difficulty: "normal",
  estimatedMinutes,
  type: "daily",
  isSystem: true,
  dueDate: TODAY,
});

const candidate = (id, title, overrides = {}) => ({
  id,
  title,
  category: "int",
  difficulty: "normal",
  estimatedMinutes: 20,
  doneWhen: `Fertig, wenn ${title.toLocaleLowerCase("de-DE")} abgeschlossen ist.`,
  subQuests: [{ title: "Material vorbereiten" }, { title: "Ergebnis festhalten" }],
  type: "daily",
  isSystem: true,
  aiGenerated: true,
  ...overrides,
});

const baseState = (overrides = {}) => ({
  level: 12,
  stats: { str: 5, int: 5, vit: 5, agi: 5, cha: 5 },
  settings: { questIntensity: "e_rank_patrol" },
  premium: { tier: "hunter_pro", status: "active", activeUntil: "2099-01-01T00:00:00.000Z" },
  questPlanning: { overloadPreset: "balanced", pinnedQuestIds: [], deferredUntilById: {}, lifecycleById: {} },
  quests: [poolDaily("slot_a"), poolDaily("slot_b")],
  completedQuests: [],
  goals: [],
  habits: [],
  questSignals: { byCategory: {}, recentDisliked: [], recentExpired: [] },
  sessionSignals: { days: {} },
  ...overrides,
});

const forgeOutcome = (recipeKey, index, { completed = true, confidence = "high" } = {}) => {
  const completedAtMs = NOW - index * 1000;
  return {
    recipeKey,
    dnaSource: confidence === "high" ? "declared" : "inferred",
    dnaConfidence: confidence,
    origin: "forge",
    assignedAtMs: completedAtMs - 100,
    startedAtMs: completed ? completedAtMs - 50 : 0,
    completedAtMs: completed ? completedAtMs : 0,
    expiredAtMs: 0,
    swappedAtMs: 0,
    deletedAtMs: 0,
    editedAtMs: 0,
    rating: null,
    ratingUpdatedAtMs: 0,
    updatedAtMs: completedAtMs,
  };
};

const forgeLearningFor = (recipeKey, count, {
  completedCount = count,
  confidence = "high",
  preferencesByRecipe = {},
} = {}) => ({
  version: 1,
  resetAtMs: 0,
  updatedAtMs: NOW,
  outcomesByQuestId: Object.fromEntries(Array.from({ length: count }, (_, index) => [
    `learned_${index}`,
    forgeOutcome(recipeKey, index, { completed: index < completedCount, confidence }),
  ])),
  preferencesByRecipe,
});

// Exact normalization and deterministic semantic fingerprints.
assert.equal(normalizeQuestText("  FÜNF-Minuten!  "), "5 minuten");
const walkA = { title: "Gehe 10 Minuten im Stadtpark spazieren", category: "vit", estimatedMinutes: 10 };
const walkB = { title: "Mach einen zehnminütigen Spaziergang im Stadtpark", category: "vit", estimatedMinutes: 10 };
const walkFingerprint = createQuestFingerprint(walkA);
const publicFingerprint = getQuestFingerprint(walkA, "de");
assert.equal(publicFingerprint.normalizedTitle, walkFingerprint.exactText);
assert.equal(publicFingerprint.actionKind, "move");
assert.deepEqual(buildForgeExclusionCorpus({}, { nowMs: NOW }), []);
assert.match(walkFingerprint.exactKey, /^qex_/);
assert.match(walkFingerprint.semanticKey, /^qsem_/);
assert.equal(walkFingerprint.actionFamily, "walk");
assert.equal(compareQuestSimilarity(walkA, walkB).level, "soft", "action/object overlap below 0.70 is only soft");
assert.equal(compareQuestSimilarity(
  { title: "Lies zehn Seiten im Roman", category: "int" },
  { title: "Lies einen Fachartikel", category: "int" },
).level, "soft", "same action family but different object is soft");
assert.equal(compareQuestSimilarity(walkA, { title: "Rufe deine Schwester an", category: "cha" }).level, "none");

const actionObjectHard = compareQuestSimilarity(
  { title: "Sortiere Rechnungen Dokumente", category: "agi" },
  { title: "Ordne Rechnungen Dokumente Dateien", category: "agi" },
);
assert.equal(actionObjectHard.level, "hard");
assert.equal(actionObjectHard.reason, "same_action_object");
assert.ok(actionObjectHard.similarity >= 0.70);
assert.equal(compareQuestSimilarity(
  { title: "Sortiere Rechnungen Dokumente", category: "agi" },
  { title: "Ordne Rechnungen Dokumente Dateien Archive", category: "agi" },
).level, "soft", "action/object overlap below 0.70 is not a hard duplicate");

const longNearTitle = "projektunterlageninventardokumentationen";
const longTitle = "projektunterlageninventardokumentation";
assert.equal(compareQuestSimilarity(
  { title: longTitle, category: "int" },
  { title: longNearTitle, category: "int" },
).reason, "near_title", "trigram >=0.86 is hard within the category");
assert.notEqual(compareQuestSimilarity(
  { title: longTitle, category: "int" },
  { title: longNearTitle, category: "agi" },
).level, "hard", "trigram similarity alone never crosses categories");

const canonicalFingerprint = createQuestFingerprint(candidate("dna", "Schreibe den Projektentwurf", {
  category: "int",
  estimatedMinutes: 25,
  questDNA: {
    actionKind: "produce",
    contextKind: "computer",
    focusMode: "continuous",
    outcomeKind: "artifact",
    requirements: ["computer"],
  },
}));
assert.equal(canonicalFingerprint.recipeKey, "r1|produce|computer|standard");
assert.equal(canonicalFingerprint.questDNA.actionKind, "produce");

const corpusState = baseState({
  quests: [walkA],
  completedQuests: [{ title: "Lies zehn Seiten im Roman", category: "int", completedAt: new Date(NOW).toISOString() }],
  questSignals: { byCategory: {}, recentDisliked: [{ title: "Rufe deine Schwester an", category: "cha", date: TODAY }], recentExpired: [] },
});
const corpus = buildQuestExclusionCorpus(corpusState, { nowMs: NOW });
assert.equal(matchQuestAgainstCorpus(walkB, corpus).source, "open");
assert.equal(matchQuestAgainstCorpus(walkB, corpus).level, "soft");
assert.equal(matchQuestAgainstCorpus({ title: "Ruf deine Schwester an", category: "cha" }, corpus).source, "recent_disliked");
const completedSimilarityCorpus = buildQuestExclusionCorpus(baseState({
  completedQuests: [{
    title: "Sortiere Rechnungen Dokumente",
    category: "agi",
    completedAt: new Date(NOW - 86400000).toISOString(),
  }],
}), { nowMs: NOW });
assert.equal(matchQuestAgainstCorpus({
  title: "Ordne Rechnungen Dokumente Dateien",
  category: "agi",
}, completedSimilarityCorpus).level, "soft", "completed work is normally only downranked");
assert.equal(matchQuestAgainstCorpus({
  title: "Sortiere Rechnungen Dokumente",
  category: "agi",
}, completedSimilarityCorpus).level, "hard", "nearly identical completed work stays hard");

// Silently deleted quests demote (soft) but never hard-block (Spec 2026-07-22 §6.4).
const deletedCorpus = buildQuestExclusionCorpus(baseState({
  questSignals: {
    byCategory: {},
    recentDisliked: [],
    recentExpired: [],
    recentDeleted: [{ title: "Plane deine Woche im Kalender", category: "int", date: TODAY }],
  },
}), { nowMs: NOW });
const deletedEntry = deletedCorpus.find((entry) => entry.source === "recent_deleted");
assert.equal(deletedEntry?.severity, "soft", "recent_deleted enters the corpus as soft");
const deletedMatch = matchQuestAgainstCorpus({ title: "Plane deine Woche im Kalender", category: "int" }, deletedCorpus);
assert.equal(deletedMatch.source, "recent_deleted");
assert.equal(deletedMatch.level, "soft", "exact title against deleted history caps at soft");

// Context facts: equal stats produce no fake weakest stat; target order and
// exact replacement-minute budget are stable and testable.
const coldContext = buildForgeContext(baseState(), { today: TODAY, nowMs: NOW, exploration: false });
assert.deepEqual(coldContext.weakestStats, []);
assert.equal(coldContext.selectableCount, 2);
assert.equal(coldContext.dayLoad.replacementKnownMinutes, 50);
assert.equal(coldContext.dayLoad.maxRecommendedMinutes, 50);
assert.match(coldContext.signature, /^fc_/);

// Hard corpus duplicate is rejected; related completed work is only soft.
const duplicateState = baseState({
  quests: [poolDaily("slot_a"), poolDaily("slot_b"), { ...walkA, id: "open_walk", type: "side", isSystem: false }],
});
const duplicateContext = buildForgeContext(duplicateState, { today: TODAY, nowMs: NOW, exploration: false });
const duplicateCompilation = compileForgeCandidates(duplicateContext, [
  candidate("walk", walkA.title, { category: "vit", estimatedMinutes: 10 }),
  candidate("write", "Schreibe drei Stichpunkte für morgen", { category: "agi", estimatedMinutes: 10 }),
]);
assert.deepEqual(duplicateCompilation.eligible.map((entry) => entry.quest.id), ["write"]);
assert.deepEqual(duplicateCompilation.rejected[0].codes, ["open_duplicate"]);

// Active habits may repeat across days without a novelty penalty, but never
// twice on the same day.
const habitTitle = "Meditiere zehn Minuten in Ruhe";
const habitState = baseState({
  habits: [{ title: habitTitle, category: "vit", active: true }],
  completedQuests: [{ title: habitTitle, category: "vit", estimatedMinutes: 10, completedAt: new Date(NOW - 86400000).toISOString() }],
});
const habitContext = buildForgeContext(habitState, { today: TODAY, nowMs: NOW, exploration: false });
const habitCompilation = compileForgeCandidates(habitContext, [candidate("habit", habitTitle, { category: "vit", estimatedMinutes: 10 })]);
assert.equal(habitCompilation.eligible.length, 1);
assert.ok(habitCompilation.eligible[0].facts.includes("active_habit"));
assert.ok(!habitCompilation.eligible[0].facts.includes("soft_duplicate"));
const sameDayHabit = compileForgeCandidates(buildForgeContext(baseState({
  habits: [{ title: habitTitle, category: "vit", active: true }],
  completedQuests: [
    { title: habitTitle, category: "vit", estimatedMinutes: 10, completedAt: new Date(NOW - 86400000).toISOString() },
    { title: habitTitle, category: "vit", estimatedMinutes: 10, completedAt: new Date(NOW).toISOString() },
  ],
}), { today: TODAY, nowMs: NOW, exploration: false }), [candidate("habit_today", habitTitle, { category: "vit", estimatedMinutes: 10 })]);
assert.deepEqual(sameDayHabit.rejected[0].codes, ["recent_repeat"]);

// Batch duplicates keep the more grounded goal variant, independent of input order.
const goalState = baseState({
  goals: [{ title: "Halbmarathon", milestones: [{ title: "Trainingswoche planen", completed: false }] }],
  completedQuests: [{
    id: "old_forge_goal",
    title: "Lege deine Lauftage fest",
    category: "str",
    origin: "forge",
    goalRef: "Halbmarathon",
    completedAt: new Date(NOW - 10 * 86400000).toISOString(),
  }],
});
const goalContext = buildForgeContext(goalState, { today: TODAY, nowMs: NOW, exploration: false });
const goalCompilation = compileForgeCandidates(goalContext, [
  candidate("plain_plan", "Plane drei Lauftage für diese Woche", { category: "str", estimatedMinutes: 20 }),
  candidate("goal_plan", "Plane drei Lauftage für diese Woche", { category: "str", estimatedMinutes: 20, goalRef: "Halbmarathon" }),
  candidate("quick", "Lege deine Sportkleidung bereit", { category: "agi", estimatedMinutes: 10 }),
]);
assert.ok(goalCompilation.eligible.some((entry) => entry.quest.id === "goal_plan"));
assert.ok(!goalCompilation.eligible.some((entry) => entry.quest.id === "plain_plan"));
const goalComposition = composeForgeSet(goalContext, goalCompilation);
assert.equal(goalComposition.recommendedIds[0], "goal_plan", "goal continuity leads neutral set");
assert.equal(goalComposition.reasonsById.goal_plan.key, "goal_continuity");

// The durable goal-progress anchor keeps continuity even when completed Quest
// history has already been pruned locally.
const anchoredGoalState = baseState({
  goals: [{
    id: "goal_anchor",
    title: "Portfolio starten",
    milestones: [{ id: "milestone_anchor", title: "Landingpage bauen", completed: false }],
  }],
  forgeGoalProgress: {
    updatedAtMs: NOW - 1000,
    byGoalId: {
      goal_anchor: {
        currentMilestoneId: "milestone_anchor",
        lastCompletedAtMs: NOW - 1000,
        lastActionKind: "prepare",
        updatedAtMs: NOW - 1000,
      },
    },
  },
});
const anchoredContext = buildForgeContext(anchoredGoalState, { today: TODAY, nowMs: NOW, exploration: false });
const anchoredResult = compileForgeCandidates(anchoredContext, [candidate("anchored", "Baue den Kopfbereich deiner Landingpage", { goalRef: "Portfolio starten" })]);

// Recipe knowledge comes exclusively from the shared learning dossier. Five
// high-confidence completions at >75% make a recipe reliable.
const learnedRecipeQuest = candidate("recipe", "Lies zwanzig Seiten in einer Biografie", {
  category: "int",
  estimatedMinutes: 25,
  questDNA: {
    actionKind: "practice",
    contextKind: "any",
    focusMode: "continuous",
    outcomeKind: "practice_block",
    requirements: [],
  },
});
const learnedRecipeKey = createQuestFingerprint(learnedRecipeQuest).recipeKey;
const recipeState = baseState({ forgeLearning: forgeLearningFor(learnedRecipeKey, 6, { completedCount: 5 }) });
const recipes = deriveForgeRecipeKnowledge(recipeState, { nowMs: NOW });
assert.equal(recipes[learnedRecipeKey].reliable, true);
assert.equal(recipes[learnedRecipeKey].completed, 5);
const sevenMedium = deriveForgeRecipeKnowledge(baseState({
  forgeLearning: forgeLearningFor(learnedRecipeKey, 7, { confidence: "medium" }),
}), { nowMs: NOW });
const eightMedium = deriveForgeRecipeKnowledge(baseState({
  forgeLearning: forgeLearningFor(learnedRecipeKey, 8, { confidence: "medium" }),
}), { nowMs: NOW });
assert.equal(sevenMedium[learnedRecipeKey].reliable, false);
assert.equal(eightMedium[learnedRecipeKey].reliable, true);
const recipeContext = buildForgeContext(recipeState, { today: TODAY, nowMs: NOW, exploration: false });
const recipeCompilation = compileForgeCandidates(recipeContext, [
  candidate("plain", "Sortiere den Download-Ordner", { category: "agi", estimatedMinutes: 20 }),
  learnedRecipeQuest,
]);
assert.ok(recipeCompilation.eligible.find((entry) => entry.quest.id === "recipe").facts.includes("reliable_recipe"));
assert.ok(recipeCompilation.eligible.find((entry) => entry.quest.id === "recipe").facts.includes("proven_recipe"));
assert.equal(composeForgeSet(recipeContext, recipeCompilation).recommendedIds[0], "recipe");

// Explicit recipe preferences are honored, while an active goal remains a
// stronger signal than either preference or exploration.
const preferredQuest = candidate("preferred", "Rufe deinen Projektpartner an", {
  category: "cha", estimatedMinutes: 20,
  questDNA: { actionKind: "communicate", contextKind: "social", focusMode: "interruptible", outcomeKind: "message_sent", requirements: ["other_person"] },
});
const avoidedQuest = candidate("avoided", "Sortiere die Projektdateien", {
  category: "agi", estimatedMinutes: 20,
  questDNA: { actionKind: "organize", contextKind: "computer", focusMode: "interruptible", outcomeKind: "environment_changed", requirements: ["computer"] },
});
const preferredKey = createQuestFingerprint(preferredQuest).recipeKey;
const avoidedKey = createQuestFingerprint(avoidedQuest).recipeKey;
const preferenceState = baseState({ forgeLearning: forgeLearningFor(learnedRecipeKey, 0, {
  preferencesByRecipe: {
    [preferredKey]: { value: "prefer", updatedAtMs: NOW },
    [avoidedKey]: { value: "avoid", updatedAtMs: NOW },
  },
}) });
const preferenceCompilation = compileForgeSet(preferenceState, [
  avoidedQuest,
  candidate("neutral", "Gehe zwanzig Minuten im Park", { category: "vit", estimatedMinutes: 20 }),
  preferredQuest,
], { today: TODAY, nowMs: NOW, exploration: false });
assert.equal(preferenceCompilation.composition.recommendedIds[0], "preferred");
assert.ok(preferenceCompilation.compilation.eligible.find((entry) => entry.quest.id === "avoided").facts.includes("avoided_recipe"));
const goalOverPreference = compileForgeSet(baseState({
  ...preferenceState,
  goals: [{ title: "Projektablage", milestones: [{ title: "Dateien sortieren", completed: false }] }],
}), [
  { ...avoidedQuest, id: "avoided_goal", goalRef: "Projektablage" },
  preferredQuest,
], { today: TODAY, nowMs: NOW, exploration: true });
assert.equal(goalOverPreference.composition.recommendedIds[0], "avoided_goal", "active goal outranks recipe preference");

// Set budget produces an honest partial result instead of truncation or padding.
const oneForOneResult = compileForgeSet(baseState({
  quests: [poolDaily("single_slot")],
}), [
  candidate("single_valid", "Schreibe drei Priorit\u00e4ten f\u00fcr morgen", { category: "agi", estimatedMinutes: 15 }),
], { today: TODAY, nowMs: NOW, exploration: false });
assert.equal(oneForOneResult.compilation.diagnostics.eligibleCount, 1);
assert.equal(oneForOneResult.composition.status, "ready", "N=1 is fully served by one quality candidate");
assert.deepEqual(oneForOneResult.composition.recommendedIds, ["single_valid"]);

const twoForTwoResult = compileForgeSet(baseState(), [
  candidate("first_valid", "Schreibe drei Priorit\u00e4ten f\u00fcr morgen", { category: "agi", estimatedMinutes: 15 }),
  candidate("second_valid", "Gehe zehn Minuten im Park spazieren", { category: "vit", estimatedMinutes: 10 }),
], { today: TODAY, nowMs: NOW, exploration: false });
assert.equal(twoForTwoResult.compilation.diagnostics.eligibleCount, 2);
assert.equal(twoForTwoResult.composition.status, "ready", "N=2 is fully served by two quality candidates");
assert.equal(twoForTwoResult.composition.recommendedIds.length, 2);

const partialCandidates = [
  candidate("long_a", "Erstelle eine Übersicht deiner Ausgaben", { category: "agi", estimatedMinutes: 30 }),
  candidate("long_b", "Schreibe eine Zusammenfassung des Kapitels", { category: "int", estimatedMinutes: 30 }),
  candidate("long_c", "Bereite drei Mahlzeiten vor", { category: "vit", estimatedMinutes: 30 }),
];
const partialResult = compileForgeSet(baseState(), partialCandidates, { today: TODAY, nowMs: NOW, exploration: false });
assert.equal(partialResult.composition.status, "partial");
assert.equal(partialResult.composition.recommendedIds.length, 1);
assert.equal(partialResult.composition.setSummary.estimatedMinutes, 30);
assert.equal(partialResult.composition.proposals.length, 3, "valid alternatives remain visible");

const noFitResult = compileForgeSet(
  baseState({ settings: { questIntensity: "baby_gate" }, quests: [poolDaily("only", 15)] }),
  [candidate("too_long", "Erstelle eine ausführliche Wochenanalyse", { category: "agi", estimatedMinutes: 60 })],
  { today: TODAY, nowMs: NOW, exploration: false },
);
assert.equal(noFitResult.composition.status, "no_fit");
assert.deepEqual(noFitResult.composition.recommendedIds, []);
assert.deepEqual(noFitResult.composition.previewIds, ["too_long"]);

// Variation avoids repeating both action and category after core requirements.
const varied = compileForgeSet(baseState({ settings: { questIntensity: "hunter_patrol" }, quests: [poolDaily("a", 25), poolDaily("b", 25), poolDaily("c", 25)] }), [
  candidate("run_a", "Laufe zehn Minuten im Park", { category: "str", estimatedMinutes: 10 }),
  candidate("run_b", "Laufe fünfzehn Minuten am Fluss", { category: "str", estimatedMinutes: 15 }),
  candidate("read", "Lies zehn Seiten in einem Sachbuch", { category: "int", estimatedMinutes: 15 }),
  candidate("meditate", "Meditiere zehn Minuten am Fenster", { category: "vit", estimatedMinutes: 10 }),
], { today: TODAY, nowMs: NOW, exploration: false });
assert.equal(new Set(varied.composition.proposals.filter((quest) => varied.composition.recommendedIds.includes(quest.id)).map((quest) => quest.category)).size, 3);

// Exploration unlocks only after ten outcomes, is limited to one slot and
// never replaces the goal/safety core.
const underExplorationState = baseState({ forgeLearning: forgeLearningFor(learnedRecipeKey, 9) });
const underExplorationResult = compileForgeSet(underExplorationState, [
  { ...learnedRecipeQuest, id: "known_under" },
  candidate("novel_under", "Rufe einen alten Kontakt an", { category: "cha", estimatedMinutes: 20 }),
], { today: TODAY, nowMs: NOW, exploration: true });
assert.equal(underExplorationResult.context.exploration.active, false);
assert.equal(underExplorationResult.composition.setSummary.exploredCount, 0);

const explorationState = baseState({ forgeLearning: forgeLearningFor(learnedRecipeKey, 10) });
const explorationResult = compileForgeSet(explorationState, [
  { ...learnedRecipeQuest, id: "known" },
  candidate("novel", "Rufe einen alten Kontakt an", { category: "cha", estimatedMinutes: 20 }),
  candidate("novel_two", "Sortiere deinen Werkzeugkasten", { category: "agi", estimatedMinutes: 20 }),
], { today: TODAY, nowMs: NOW, exploration: true });
assert.equal(explorationResult.context.exploration.active, true);
assert.equal(explorationResult.composition.setSummary.exploredCount, 1);
assert.ok(explorationResult.composition.recommendedIds.includes("novel"));
assert.ok(explorationResult.composition.setSummary.exploredCount <= 1);

const explorationGoalState = { ...explorationState, goals: [{ title: "Kontakte pflegen", milestones: [{ title: "Kontakt aufnehmen", completed: false }] }] };
const explorationGoalResult = compileForgeSet(explorationGoalState, [
  { ...preferredQuest, id: "goal_first", goalRef: "Kontakte pflegen" },
  { ...learnedRecipeQuest, id: "known_after_goal" },
  candidate("novel_after_goal", "Sortiere deinen Werkzeugkasten", { category: "agi", estimatedMinutes: 20 }),
], { today: TODAY, nowMs: NOW, exploration: true });
assert.equal(explorationGoalResult.composition.recommendedIds[0], "goal_first");
assert.ok(explorationGoalResult.composition.setSummary.exploredCount <= 1);

// Pending 3.0 keeps legacy ids, validates context and quarantines corruption.
const pendingBase = baseState();
const pendingCompiled = compileForgeSet(pendingBase, [
  candidate("accept_a", "Schreibe drei Prioritäten für morgen", { category: "agi", estimatedMinutes: 15 }),
  candidate("accept_b", "Lies zehn Seiten im Fachbuch", { category: "int", estimatedMinutes: 15 }),
], { today: TODAY, nowMs: NOW, exploration: false });
const pending = createPendingSet(pendingCompiled.composition.proposals, {
  today: TODAY,
  nowMs: NOW,
  status: pendingCompiled.composition.status,
  composition: pendingCompiled.composition,
  context: pendingCompiled.context,
  diagnostics: pendingCompiled.compilation.diagnostics,
});
assert.equal(pending.schemaVersion, 3);
assert.equal(pending.composition.compilerVersion, "3.0");
assert.equal(pending.composition.contextSignature, pendingCompiled.context.signature);

const legacy = normalizeForgeState({ pending: {
  id: "legacy-id-must-survive",
  proposals: [candidate("legacy", "Sortiere drei Dokumente", { category: "agi", estimatedMinutes: 10 })],
  date: TODAY,
  generatedAtMs: 10,
  source: "manual",
} });
assert.equal(legacy.pending.id, "legacy-id-must-survive");
assert.equal(legacy.pending.legacy, true);

const pendingState = { ...pendingBase, forge: { pending, updatedAtMs: NOW } };
const contextChanged = acceptProposals({
  ...pendingState,
  quests: [...pendingState.quests, { id: "new-own", title: "Rufe den Zahnarzt an", type: "side", isSystem: false }],
}, { pendingId: pending.id, proposalIds: [pending.composition.recommendedIds[0]] }, { today: TODAY, nowMs: NOW + 1 });
assert.equal(contextChanged.reason, "context_changed");
assert.equal(contextChanged.stateChanged, false);

const stateWithMemory = {
  ...pendingState,
  forgeLearning: forgeLearningFor(learnedRecipeKey, 0),
};
const memoryPreferenceChanged = setForgeRecipePreference(stateWithMemory, {
  recipeKey: preferredKey,
  value: "prefer",
  nowMs: NOW + 1,
});
assert.equal(memoryPreferenceChanged.forgeLearning.preferencesByRecipe[preferredKey].value, "prefer");
const acceptedAfterMemoryChange = acceptProposals(memoryPreferenceChanged, {
  pendingId: pending.id,
  proposalIds: [pending.composition.recommendedIds[0]],
}, { today: TODAY, nowMs: NOW + 2 });
assert.equal(acceptedAfterMemoryChange.reason, null, "recipe preference changes do not stale an already compiled set");
assert.equal(acceptedAfterMemoryChange.acceptedCount, 1);
assert.equal(acceptedAfterMemoryChange.state.forge.pending, null);

const accepted = acceptProposals(pendingState, {
  pendingId: pending.id,
  proposalIds: [pending.composition.recommendedIds[0]],
}, { today: TODAY, nowMs: NOW + 1 });
assert.equal(accepted.reason, null);
assert.equal(accepted.stateChanged, true);
assert.equal(accepted.state.forge.pending, null);
assert.equal(accepted.state.forge.tombstone.pendingId, pending.id);
assert.equal(accepted.state.forge.tombstone.reason, "accepted");

const corruptPending = {
  ...pending,
  composition: { ...pending.composition, orderedIds: [...pending.composition.orderedIds, "ghost"] },
};
const invalid = acceptProposals({ ...pendingBase, forge: { pending: corruptPending, updatedAtMs: NOW } }, {
  pendingId: pending.id,
  proposalIds: [pending.proposals[0].id],
}, { today: TODAY, nowMs: NOW + 2 });
assert.equal(invalid.reason, "invalid_set");
assert.equal(invalid.stateChanged, true);
assert.equal(invalid.state.forge.pending, null);
assert.equal(invalid.state.forge.quarantine.reason, "invalid_set");
assert.equal(invalid.state.forge.tombstone.pendingId, pending.id);

const live = { pending, updatedAtMs: NOW };
const tombstoneState = clearPendingSet({ forge: live }, { nowMs: NOW, reason: "discarded" }).forge;
const merged = mergeForgeState(live, tombstoneState);
assert.equal(merged.pending, null, "tombstone wins equal timestamp");
assert.equal(merged.tombstone.pendingId, pending.id);

console.log("✓ test-forge-compiler: alles gruen");
