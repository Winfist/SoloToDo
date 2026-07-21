import assert from "node:assert/strict";
import {
  DEFAULT_FORGE_GOAL_PROGRESS,
  buildForgeGoalGraph,
  getForgeGoalResumeContext,
  mergeForgeGoalProgress,
  normalizeForgeGoalProgress,
  reconcileForgeGoalProgress,
  resolveForgeGoalLink,
} from "../data/forgeGoalProgress.js";

const NOW = Date.UTC(2026, 6, 21, 12);
const DNA = {
  version: 1,
  actionKind: "produce",
  contextKind: "computer",
  focusMode: "continuous",
  outcomeKind: "artifact",
  requirements: ["computer"],
};
const goals = [{
  id: "goal-app",
  title: "Meine App veroeffentlichen",
  category: "productivity",
  milestones: [
    { id: "m1", title: "Konzept abschliessen", completed: true },
    { id: "m2", title: "Login bauen", completed: false },
    { id: "m3", title: "Release erstellen", completed: false },
  ],
}];

const base = {
  goals,
  quests: [],
  completedQuests: [],
  forgeGoalProgress: { ...DEFAULT_FORGE_GOAL_PROGRESS },
};

const graph = buildForgeGoalGraph(base);
assert.deepEqual(graph.orderedGoalIds, ["goal-app"]);
assert.equal(graph.byGoalId["goal-app"].currentMilestoneId, "m2");
assert.equal(graph.byGoalId["goal-app"].nextByMilestoneId.m2, "m3");

assert.deepEqual(resolveForgeGoalLink(base, {
  goalRef: "MEINE APP VEROEFFENTLICHEN",
}), {
  goalId: "goal-app",
  goalTitle: "Meine App veroeffentlichen",
  milestoneId: "m2",
  milestoneTitle: "Login bauen",
});
assert.equal(resolveForgeGoalLink({
  ...base,
  goals: [...goals, { ...goals[0], id: "duplicate" }],
}, { goalRef: "Meine App veroeffentlichen" }), null, "doppelte Titel sind ohne ID mehrdeutig");
assert.equal(resolveForgeGoalLink(base, { linkedGoalId: "goal-app", linkedMilestoneId: "m3" }).milestoneId, "m3");

const emptyResume = getForgeGoalResumeContext(base, "goal-app");
assert.equal(emptyResume.currentMilestoneId, "m2");
assert.equal(emptyResume.lastCompletedQuestId, null);

const completedQuest = {
  id: "forge-goal-1",
  title: "Baue den Login-Fehlerzustand",
  goalRef: "Meine App veroeffentlichen",
  origin: "forge",
  forgeAcceptedAtMs: NOW - 1000,
  completedAtMs: NOW,
  estimatedMinutes: 25,
  questDNA: DNA,
};
const goalsBefore = structuredClone(goals);
let reconciled = reconcileForgeGoalProgress(base, {
  ...base,
  completedQuests: [completedQuest],
}, { nowMs: NOW });
assert.deepEqual(reconciled.goals, goalsBefore, "Forge-Abschluss veraendert keine Meilensteine");
assert.equal(reconciled.goals[0].milestones[1].completed, false);

let resume = getForgeGoalResumeContext(reconciled, "goal-app");
assert.equal(resume.currentMilestoneId, "m2");
assert.equal(resume.lastCompletedQuestId, "forge-goal-1");
assert.equal(resume.lastCompletedAtMs, NOW);
assert.equal(resume.lastRecipeKey, "r1|produce|computer|standard");
assert.equal(resume.lastActionKind, "produce");
assert.equal(resume.lastOutcomeKind, "artifact");
assert.equal(resume.lastAdvancedAtMs, NOW);

// Wird der Meilenstein an seinem bestehenden, expliziten Zielpfad bestaetigt,
// folgt der Resume-Pointer, ohne dass dieses Modul den Abschluss ausloest.
const externallyAdvancedGoals = structuredClone(goals);
externallyAdvancedGoals[0].milestones[1].completed = true;
reconciled = reconcileForgeGoalProgress(reconciled, {
  ...reconciled,
  goals: externallyAdvancedGoals,
}, { nowMs: NOW + 100 });
resume = getForgeGoalResumeContext(reconciled, "goal-app");
assert.equal(resume.currentMilestoneId, "m3");
assert.equal(resume.lastAdvancedAtMs, NOW, "externer Pfadwechsel erfindet keinen Forge-Abschluss");

const sanitized = normalizeForgeGoalProgress({
  updatedAtMs: 1,
  byGoalId: {
    goal: {
      currentMilestoneId: "m",
      lastCompletedQuestId: "q",
      lastCompletedAtMs: 5,
      lastRecipeKey: "invalid",
      lastActionKind: "invented",
      lastOutcomeKind: "invented",
      lastAdvancedAtMs: 4,
      updatedAtMs: 2,
    },
  },
});
assert.equal(sanitized.byGoalId.goal.lastRecipeKey, null);
assert.equal(sanitized.byGoalId.goal.lastActionKind, null);
assert.equal(sanitized.byGoalId.goal.lastOutcomeKind, null);
assert.equal(sanitized.byGoalId.goal.updatedAtMs, 5);

const older = {
  updatedAtMs: NOW,
  byGoalId: {
    "goal-app": {
      currentMilestoneId: "m2",
      lastCompletedQuestId: "old",
      lastCompletedAtMs: NOW - 10,
      lastRecipeKey: "r1|practice|any|quick",
      lastActionKind: "practice",
      lastOutcomeKind: "practice_block",
      lastAdvancedAtMs: NOW - 10,
      updatedAtMs: NOW,
    },
  },
};
const newer = {
  updatedAtMs: NOW + 1,
  byGoalId: {
    "goal-app": {
      currentMilestoneId: "m3",
      lastCompletedQuestId: "new",
      lastCompletedAtMs: NOW + 1,
      lastRecipeKey: "r1|produce|computer|standard",
      lastActionKind: "produce",
      lastOutcomeKind: "artifact",
      lastAdvancedAtMs: NOW + 1,
      updatedAtMs: NOW + 1,
    },
  },
};
const merged = mergeForgeGoalProgress(older, newer);
assert.equal(merged.byGoalId["goal-app"].lastCompletedQuestId, "new");
assert.equal(merged.byGoalId["goal-app"].currentMilestoneId, "m3");

const staleNewerMilestone = {
  updatedAtMs: NOW + 20,
  byGoalId: {
    "goal-app": {
      currentMilestoneId: "m3",
      lastCompletedQuestId: null,
      lastCompletedAtMs: 0,
      lastRecipeKey: null,
      lastActionKind: null,
      lastOutcomeKind: null,
      lastAdvancedAtMs: 0,
      updatedAtMs: NOW + 20,
    },
  },
};
const fieldMerged = mergeForgeGoalProgress(older, staleNewerMilestone);
assert.equal(fieldMerged.byGoalId["goal-app"].currentMilestoneId, "m3", "newer milestone pointer wins");
assert.equal(fieldMerged.byGoalId["goal-app"].lastCompletedQuestId, "old", "newer stale device must not erase completion anchor");
assert.equal(fieldMerged.byGoalId["goal-app"].lastCompletedAtMs, NOW - 10);
assert.equal(fieldMerged.byGoalId["goal-app"].lastRecipeKey, "r1|practice|any|quick");
assert.equal(fieldMerged.byGoalId["goal-app"].lastActionKind, "practice");
assert.equal(fieldMerged.byGoalId["goal-app"].lastOutcomeKind, "practice_block");
assert.equal(fieldMerged.byGoalId["goal-app"].lastAdvancedAtMs, NOW - 10);

console.log("test-forge-goal-progress: all assertions passed.");
