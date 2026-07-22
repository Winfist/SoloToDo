import assert from "node:assert/strict";
import {
  DEFAULT_FORGE_LEARNING,
  FORGE_LEARNING_OUTCOME_CAP,
  getForgeLearningDossier,
  mergeForgeLearning,
  normalizeForgeLearning,
  reconcileForgeLearning,
  resetForgeLearning,
  setForgeRecipePreference,
} from "../data/forgeLearning.js";

const DAY = 86400000;
const NOW = Date.UTC(2026, 6, 21, 12);
const DNA = {
  version: 1,
  actionKind: "produce",
  contextKind: "computer",
  focusMode: "continuous",
  outcomeKind: "artifact",
  requirements: ["computer"],
};
const RECIPE = "r1|produce|computer|standard";
const MEDIUM_RECIPE = "r1|practice|any|quick";

const forgeQuest = (id, overrides = {}) => ({
  id,
  title: `Quest ${id}`,
  category: "int",
  difficulty: "normal",
  type: "daily",
  origin: "forge",
  forgeAcceptedAtMs: NOW,
  estimatedMinutes: 25,
  questDNA: DNA,
  subQuests: [{ id: "s1", title: "Schritt", completed: false }],
  createdAt: "2026-07-21",
  dueDate: "2026-07-21",
  ...overrides,
});

const baseState = {
  forgeLearning: { ...DEFAULT_FORGE_LEARNING },
  quests: [],
  completedQuests: [],
  questArchive: [],
};

const acceptedQuest = forgeQuest("forge-1");
let state = reconcileForgeLearning(baseState, {
  ...baseState,
  quests: [acceptedQuest],
}, { nowMs: NOW, today: "2026-07-21" });
let learned = state.forgeLearning.outcomesByQuestId[acceptedQuest.id];
assert.equal(learned.recipeKey, RECIPE);
assert.equal(learned.dnaSource, "declared");
assert.equal(learned.dnaConfidence, "high");
assert.equal(learned.assignedAtMs, NOW);

const startedQuest = forgeQuest("forge-1", {
  subQuests: [{ id: "s1", title: "Schritt", completed: true, completedAtMs: NOW + 100 }],
});
state = reconcileForgeLearning(state, { ...state, quests: [startedQuest] }, {
  nowMs: NOW + 100,
  today: "2026-07-21",
});
assert.equal(state.forgeLearning.outcomesByQuestId[acceptedQuest.id].startedAtMs, NOW + 100);

const editedQuest = { ...startedQuest, title: "Strukturell geaenderte Quest" };
state = reconcileForgeLearning(state, { ...state, quests: [editedQuest] }, {
  nowMs: NOW + 200,
  today: "2026-07-21",
});
assert.equal(state.forgeLearning.outcomesByQuestId[acceptedQuest.id].editedAtMs, NOW + 200);

const completedQuest = { ...editedQuest, completed: true, completedAtMs: NOW + 300 };
state = reconcileForgeLearning(state, {
  ...state,
  quests: [],
  completedQuests: [completedQuest],
}, { nowMs: NOW + 300, today: "2026-07-21" });
learned = state.forgeLearning.outcomesByQuestId[acceptedQuest.id];
assert.equal(learned.completedAtMs, NOW + 300);
const editedDossier = getForgeLearningDossier(state, { nowMs: NOW + 300 });
assert.equal(editedDossier.recipes[0].completed, 0, "Edit bestaetigt Originalrezept nicht");
assert.equal(editedDossier.recipes[0].eligibleAssigned, 0);

const outcome = (recipeKey, index, {
  confidence = "high",
  completed = true,
  rating = null,
  updatedAtMs = NOW - index * 1000,
  edited = false,
} = {}) => ({
  recipeKey,
  dnaSource: confidence === "high" ? "declared" : "inferred",
  dnaConfidence: confidence,
  origin: "forge",
  assignedAtMs: updatedAtMs - 100,
  startedAtMs: completed ? updatedAtMs - 50 : 0,
  completedAtMs: completed ? updatedAtMs : 0,
  expiredAtMs: 0,
  swappedAtMs: 0,
  deletedAtMs: 0,
  editedAtMs: edited ? updatedAtMs - 25 : 0,
  rating,
  ratingUpdatedAtMs: rating ? updatedAtMs : 0,
  updatedAtMs,
});

const reliableOutcomes = {};
for (let index = 0; index < 6; index += 1) {
  reliableOutcomes[`high-${index}`] = outcome(RECIPE, index, { completed: index < 5 });
}
let dossier = getForgeLearningDossier({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: reliableOutcomes,
  updatedAtMs: NOW,
}, { nowMs: NOW });
assert(dossier.reliableRecipeKeys.includes(RECIPE), ">=5 explizite Abschluesse und >75% sind zuverlässig");

const mediumOutcomes = {};
for (let index = 0; index < 7; index += 1) {
  mediumOutcomes[`medium-${index}`] = outcome(MEDIUM_RECIPE, index, { confidence: "medium" });
}
dossier = getForgeLearningDossier({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: mediumOutcomes,
  updatedAtMs: NOW,
}, { nowMs: NOW });
assert(!dossier.reliableRecipeKeys.includes(MEDIUM_RECIPE), "7 mittlere Inferenzen reichen nicht");
mediumOutcomes["medium-7"] = outcome(MEDIUM_RECIPE, 7, { confidence: "medium" });
dossier = getForgeLearningDossier({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: mediumOutcomes,
  updatedAtMs: NOW,
}, { nowMs: NOW });
assert(dossier.reliableRecipeKeys.includes(MEDIUM_RECIPE), "mittlere Inferenz benoetigt 8 Abschluesse");

const windowed = normalizeForgeLearning({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: {
    fresh: outcome(RECIPE, 0, { updatedAtMs: NOW - 27 * DAY }),
    oldButRetained: outcome(RECIPE, 0, { updatedAtMs: NOW - 29 * DAY }),
    pruned: outcome(RECIPE, 0, { updatedAtMs: NOW - 36 * DAY }),
  },
}, { nowMs: NOW });
assert(windowed.outcomesByQuestId.fresh);
assert(windowed.outcomesByQuestId.oldButRetained, "29 Tage bleiben fuer Merge/Prune erhalten");
assert(!windowed.outcomesByQuestId.pruned, ">35 Tage werden entfernt");
assert.equal(getForgeLearningDossier(windowed, { nowMs: NOW }).selectedOutcomeCount, 1, "Auswahlfenster ist 28 Tage");

const disliked = {
  a: outcome(RECIPE, 0, { rating: "disliked" }),
  b: outcome(RECIPE, 1, { rating: "disliked" }),
  c: outcome(RECIPE, 2, { completed: false }),
};
dossier = getForgeLearningDossier({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: disliked,
}, { nowMs: NOW });
assert(dossier.avoidedRecipeKeys.includes(RECIPE), "zwei Netto-Dislikes vermeiden ein Rezept");
const noExplicitNegative = getForgeLearningDossier({
  ...DEFAULT_FORGE_LEARNING,
  outcomesByQuestId: { onlyMiss: outcome(RECIPE, 0, { completed: false }) },
}, { nowMs: NOW });
assert(!noExplicitNegative.avoidedRecipeKeys.includes(RECIPE), "Nichterledigung allein ist keine Abneigung");

let preferenceState = setForgeRecipePreference(DEFAULT_FORGE_LEARNING, RECIPE, "avoid", { nowMs: NOW });
assert(getForgeLearningDossier(preferenceState, { nowMs: NOW }).avoidedRecipeKeys.includes(RECIPE));
preferenceState = setForgeRecipePreference(preferenceState, RECIPE, "prefer", { nowMs: NOW + 1 });
const preferredDossier = getForgeLearningDossier(preferenceState, { nowMs: NOW + 1 });
assert(preferredDossier.preferredRecipeKeys.includes(RECIPE));
assert(!preferredDossier.avoidedRecipeKeys.includes(RECIPE));

const beforeReset = {
  ...DEFAULT_FORGE_LEARNING,
  updatedAtMs: NOW - 1,
  outcomesByQuestId: { old: outcome(RECIPE, 0, { updatedAtMs: NOW - 1 }) },
  preferencesByRecipe: { [RECIPE]: { value: "prefer", updatedAtMs: NOW - 1 } },
};
const reset = resetForgeLearning(beforeReset, { nowMs: NOW });
const resetMerged = mergeForgeLearning(reset, beforeReset, { nowMs: NOW + 1 });
assert.equal(Object.keys(resetMerged.outcomesByQuestId).length, 0, "Reset-Tombstone verhindert Wiederbelebung");
assert.equal(Object.keys(resetMerged.preferencesByRecipe).length, 0);
const postReset = {
  ...DEFAULT_FORGE_LEARNING,
  resetAtMs: NOW,
  updatedAtMs: NOW + 2,
  outcomesByQuestId: { fresh: { ...outcome(RECIPE, 0, { updatedAtMs: NOW + 2 }), assignedAtMs: NOW + 1 } },
};
assert(mergeForgeLearning(reset, postReset, { nowMs: NOW + 3 }).outcomesByQuestId.fresh);

const tooMany = {};
for (let index = 0; index < FORGE_LEARNING_OUTCOME_CAP + 5; index += 1) {
  tooMany[`q-${index}`] = outcome(RECIPE, index, { updatedAtMs: NOW - index });
}
assert.equal(
  Object.keys(normalizeForgeLearning({ outcomesByQuestId: tooMany }, { nowMs: NOW })).length,
  5,
  "sanity: root shape remains stable",
);
assert.equal(
  Object.keys(normalizeForgeLearning({ outcomesByQuestId: tooMany }, { nowMs: NOW }).outcomesByQuestId).length,
  FORGE_LEARNING_OUTCOME_CAP,
  "Outcome-Historie ist auf 200 begrenzt",
);

const assignedForRemoval = reconcileForgeLearning(baseState, {
  ...baseState,
  quests: [forgeQuest("remove-me")],
}, { nowMs: NOW, today: "2026-07-21" });
const deleted = reconcileForgeLearning(assignedForRemoval, {
  ...assignedForRemoval,
  quests: [],
}, { nowMs: NOW + 10, today: "2026-07-21" });
assert.equal(deleted.forgeLearning.outcomesByQuestId["remove-me"].deletedAtMs, NOW + 10);

const swapped = reconcileForgeLearning(assignedForRemoval, {
  ...assignedForRemoval,
  quests: [{ id: "replacement", replacedQuestId: "remove-me", origin: "replacement" }],
}, { nowMs: NOW + 20, today: "2026-07-21" });
assert.equal(swapped.forgeLearning.outcomesByQuestId["remove-me"].swappedAtMs, NOW + 20);

const expired = reconcileForgeLearning(assignedForRemoval, {
  ...assignedForRemoval,
  quests: [],
}, { nowMs: NOW + DAY, today: "2026-07-22" });
assert.equal(expired.forgeLearning.outcomesByQuestId["remove-me"].expiredAtMs, NOW + DAY);

const concurrentCompletion = {
  ...DEFAULT_FORGE_LEARNING,
  updatedAtMs: NOW + 50,
  outcomesByQuestId: {
    concurrent: {
      ...outcome(RECIPE, 0, { updatedAtMs: NOW + 50 }),
      rating: null,
      ratingUpdatedAtMs: 0,
    },
  },
};
const concurrentRating = {
  ...DEFAULT_FORGE_LEARNING,
  updatedAtMs: NOW + 60,
  outcomesByQuestId: {
    concurrent: {
      ...outcome(RECIPE, 0, { completed: false, rating: "liked", updatedAtMs: NOW + 60 }),
      assignedAtMs: NOW - 100,
    },
  },
};
const concurrentMerged = mergeForgeLearning(concurrentCompletion, concurrentRating, { nowMs: NOW + 70 });
assert(concurrentMerged.outcomesByQuestId.concurrent.completedAtMs > 0, "Completion geht bei spaeterem Rating nicht verloren");
assert.equal(concurrentMerged.outcomesByQuestId.concurrent.rating, "liked");

const staleMutationAfterReset = {
  ...DEFAULT_FORGE_LEARNING,
  updatedAtMs: NOW + 100,
  outcomesByQuestId: {
    stale: {
      ...outcome(RECIPE, 0, { rating: "liked", updatedAtMs: NOW + 100 }),
      assignedAtMs: NOW - 100,
    },
  },
};
assert.equal(
  Object.keys(mergeForgeLearning(reset, staleMutationAfterReset, { nowMs: NOW + 110 }).outcomesByQuestId).length,
  0,
  "Spaetere Mutation einer vor dem Reset zugewiesenen Quest umgeht den Tombstone nicht",
);

// ── deleted fliesst in die avoided-Entscheidung (Spec 2026-07-22 §6.5) ──
const DELETED_RECIPE = "r1|communicate|social|quick";
const deletedOutcome = (id, extra = {}) => ({
  recipeKey: DELETED_RECIPE,
  dnaSource: "declared",
  dnaConfidence: "high",
  origin: "forge",
  assignedAtMs: NOW - DAY,
  deletedAtMs: NOW - DAY + 1000,
  updatedAtMs: NOW - DAY + 1000,
  ...extra,
});
const deletedLearning = {
  version: 1,
  resetAtMs: 0,
  updatedAtMs: NOW,
  outcomesByQuestId: {
    del1: deletedOutcome("del1"),
    del2: deletedOutcome("del2"),
  },
  preferencesByRecipe: {},
};
const deletedDossier = getForgeLearningDossier(deletedLearning, { nowMs: NOW });
const deletedRecipeRow = deletedDossier.recipes.find((row) => row.recipeKey === DELETED_RECIPE);
assert.equal(deletedRecipeRow.deleted, 2, "beide Loeschungen gezaehlt");
assert.equal(deletedRecipeRow.avoided, true, "2x geloescht + 0 Abschluesse -> avoided");

// Ein Abschluss im selben Rezept hebt die Loesch-Meidung auf
const mixedLearning = {
  ...deletedLearning,
  outcomesByQuestId: {
    ...deletedLearning.outcomesByQuestId,
    done1: deletedOutcome("done1", { deletedAtMs: 0, completedAtMs: NOW - DAY + 2000, updatedAtMs: NOW - DAY + 2000 }),
  },
};
const mixedRow = getForgeLearningDossier(mixedLearning, { nowMs: NOW }).recipes
  .find((row) => row.recipeKey === DELETED_RECIPE);
assert.equal(mixedRow.avoided, false, "ein Abschluss hebt Loesch-Meidung auf");

// Explizites prefer schlaegt die Loesch-Heuristik
const preferredLearning = setForgeRecipePreference(deletedLearning, {
  recipeKey: DELETED_RECIPE,
  value: "prefer",
  nowMs: NOW,
});
const preferredRow = getForgeLearningDossier(preferredLearning, { nowMs: NOW }).recipes
  .find((row) => row.recipeKey === DELETED_RECIPE);
assert.equal(preferredRow.avoided, false, "prefer ueberstimmt deleted-Heuristik");

console.log("test-forge-learning: all assertions passed.");
