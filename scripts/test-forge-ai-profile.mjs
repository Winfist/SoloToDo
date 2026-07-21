import assert from "node:assert/strict";
import {
  buildForgeAIProfile,
  createForgeRequestId,
  getWeakestStat,
  serializeForgeAIProfile,
} from "../data/forgeAIProfile.js";

const nowMs = Date.parse("2026-07-21T12:00:00Z");
const state = {
  stats: { str: 5, int: 5, vit: 7, agi: 8, cha: 9 },
  goals: [{ id: "raw-goal-id", title: "Launch portfolio", category: "int", milestones: [{ id: "raw-milestone-id", title: "Publish landing page", completed: false }] }],
  forgeGoalProgress: { byGoalId: { "raw-goal-id": { currentMilestoneId: "raw-milestone-id", lastCompletedQuestId: "secret-quest-id", lastRecipeKey: "r1|produce|computer|standard", lastActionKind: "produce", lastOutcomeKind: "artifact" } } },
  habits: Array.from({ length: 5 }, (_, index) => ({ id: `habit-${index}`, title: `Habit ${index}`, category: "vit", active: true, frequency: "daily" })),
  quests: [{ id: "private-id", title: "Private open quest", completed: false, priority: "high", dueDate: "2026-07-20" }],
  completedQuests: [{ id: "history-id", title: "Never transmit this historical title" }],
  questSignals: { recentDisliked: [{ title: "Rejected secret", note: "private note" }] },
  forgeLearning: {
    resetAtMs: 0,
    preferencesByRecipe: { "r1|produce|computer|standard": { value: "prefer", updatedAtMs: nowMs } },
    outcomesByQuestId: Object.fromEntries(Array.from({ length: 5 }, (_, index) => [`secret-${index}`, {
      recipeKey: "r1|produce|computer|standard", dnaConfidence: "high", assignedAtMs: nowMs - index * 1000,
      completedAtMs: nowMs - index * 500, updatedAtMs: nowMs,
    }])),
  },
};

const profile = buildForgeAIProfile(state, { nowMs, today: "2026-07-21" });
const json = serializeForgeAIProfile(profile);
assert.ok(json.length <= 4000);
assert.equal(profile.activeHabits.length, 2);
assert.equal(profile.activeGoals.length, 1);
assert.equal(profile.learning.patterns[0].reliable, true);
assert.equal(profile.loadBand, "normal");
for (const secret of ["raw-goal-id", "raw-milestone-id", "secret-quest-id", "Private open quest", "historical title", "Rejected secret", "private note"]) {
  assert.equal(json.includes(secret), false, secret);
}
assert.equal(getWeakestStat(state.stats), null);
assert.equal(getWeakestStat({ str: 1, int: 2, vit: 2, agi: 2, cha: 2 }), "str");
assert.match(createForgeRequestId(nowMs), /^forge_/);

console.log("Forge AI profile privacy tests passed.");
