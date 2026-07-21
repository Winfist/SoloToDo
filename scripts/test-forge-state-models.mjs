import assert from "node:assert/strict";
import { register } from "node:module";
import { DEFAULT_STATE } from "../data/defaultState.js";

register("./state-merge-loader.mjs", import.meta.url);
const { mergeStateProgress, migrateState, resolveStateConflict } = await import("../data/storage.js");

const NOW = Date.now();
const RECIPE = "r1|produce|computer|standard";
const learningOutcome = (updatedAtMs) => ({
  recipeKey: RECIPE,
  dnaSource: "declared",
  dnaConfidence: "high",
  origin: "forge",
  assignedAtMs: updatedAtMs - 100,
  startedAtMs: 0,
  completedAtMs: updatedAtMs,
  expiredAtMs: 0,
  swappedAtMs: 0,
  deletedAtMs: 0,
  editedAtMs: 0,
  rating: null,
  ratingUpdatedAtMs: 0,
  updatedAtMs,
});

assert.equal(DEFAULT_STATE.stateVersion, 6);
assert.deepEqual(DEFAULT_STATE.forgeLearning, {
  version: 1,
  resetAtMs: 0,
  updatedAtMs: 0,
  outcomesByQuestId: {},
  preferencesByRecipe: {},
});
assert.deepEqual(DEFAULT_STATE.forgeGoalProgress, { byGoalId: {}, updatedAtMs: 0 });

const migrated = migrateState({
  stateVersion: 5,
  quests: [],
  completedQuests: [],
});
assert.equal(migrated.stateVersion, 6);
assert.deepEqual(migrated.forgeLearning, DEFAULT_STATE.forgeLearning);
assert.deepEqual(migrated.forgeGoalProgress, DEFAULT_STATE.forgeGoalProgress);

const fullState = (overrides = {}) => ({
  ...structuredClone(DEFAULT_STATE),
  ownerUid: "user",
  hunterName: "Hunter",
  email: "hunter@example.test",
  level: 3,
  totalQuestsCompleted: 1,
  totalXpEarned: 100,
  completedQuests: [{ id: "done", title: "Done", completedAtMs: NOW - 1000 }],
  lastInteractionTimeMs: NOW,
  ...overrides,
});

const withOldLearning = fullState({
  forgeLearning: {
    version: 1,
    resetAtMs: 0,
    updatedAtMs: NOW - 10,
    outcomesByQuestId: { old: learningOutcome(NOW - 10) },
    preferencesByRecipe: {},
  },
  forgeGoalProgress: {
    updatedAtMs: NOW - 10,
    byGoalId: {
      goal: {
        currentMilestoneId: "m1",
        lastCompletedQuestId: "old",
        lastCompletedAtMs: NOW - 10,
        lastRecipeKey: RECIPE,
        lastActionKind: "produce",
        lastOutcomeKind: "artifact",
        lastAdvancedAtMs: NOW - 10,
        updatedAtMs: NOW - 10,
      },
    },
  },
});
const withResetAndNewGoal = fullState({
  forgeLearning: {
    version: 1,
    resetAtMs: NOW,
    updatedAtMs: NOW,
    outcomesByQuestId: {},
    preferencesByRecipe: {},
  },
  forgeGoalProgress: {
    updatedAtMs: NOW,
    byGoalId: {
      goal: {
        currentMilestoneId: "m2",
        lastCompletedQuestId: "new",
        lastCompletedAtMs: NOW,
        lastRecipeKey: RECIPE,
        lastActionKind: "produce",
        lastOutcomeKind: "artifact",
        lastAdvancedAtMs: NOW,
        updatedAtMs: NOW,
      },
    },
  },
});
const merged = mergeStateProgress(withOldLearning, withResetAndNewGoal);
assert.equal(Object.keys(merged.forgeLearning.outcomesByQuestId).length, 0, "Reset-Tombstone gewinnt im Progress-Merge");
assert.equal(merged.forgeLearning.resetAtMs, NOW);
assert.equal(merged.forgeGoalProgress.byGoalId.goal.currentMilestoneId, "m2");

// Auch wenn die Progress-Signaturen gleich sind und kein grosser Merge laeuft,
// muessen die lokalen Personalization-Caches beider Seiten zusammenfinden.
const equalLeft = fullState({
  lastInteractionTimeMs: NOW + 10000,
  forgeLearning: {
    version: 1,
    resetAtMs: 0,
    updatedAtMs: NOW + 1,
    outcomesByQuestId: { left: learningOutcome(NOW + 1) },
    preferencesByRecipe: {},
  },
});
const equalRight = fullState({
  lastInteractionTimeMs: NOW,
  forgeLearning: {
    version: 1,
    resetAtMs: 0,
    updatedAtMs: NOW + 2,
    outcomesByQuestId: { right: learningOutcome(NOW + 2) },
    preferencesByRecipe: {},
  },
});
const equalResolved = resolveStateConflict(equalLeft, equalRight).data;
assert(equalResolved.forgeLearning.outcomesByQuestId.left);
assert(equalResolved.forgeLearning.outcomesByQuestId.right);

const adminCloud = fullState({
  _adminResetAt: "2026-07-21T12:00:00.000Z",
  forgeLearning: structuredClone(DEFAULT_STATE.forgeLearning),
  forgeGoalProgress: structuredClone(DEFAULT_STATE.forgeGoalProgress),
});
const adminResolved = resolveStateConflict(withOldLearning, adminCloud);
assert.equal(adminResolved.reason, "admin-reset");
assert.deepEqual(adminResolved.data.forgeLearning, DEFAULT_STATE.forgeLearning, "Admin-Reset belebt Lernstand nicht wieder");
assert.deepEqual(adminResolved.data.forgeGoalProgress, DEFAULT_STATE.forgeGoalProgress);

console.log("test-forge-state-models: all assertions passed.");
