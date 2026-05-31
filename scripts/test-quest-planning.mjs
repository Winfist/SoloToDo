import {
  QUEST_OVERLOAD_PRESETS,
  getQuestPlanningSnapshot,
  withArchivedQuest,
  withDeferredQuest,
  withRestoredQuest,
} from "../data/questPlanning.js";
import { getToday } from "../data/dateUtils.js";

const today = getToday();
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const quest = (id, patch = {}) => ({
  id,
  title: id,
  type: "side",
  category: "agi",
  difficulty: "normal",
  createdAt: today,
  createdAtMs: Date.now(),
  ...patch,
});
const state = (quests, patch = {}) => ({
  quests,
  completedQuests: [],
  questArchive: [],
  questPlanning: {
    overloadPreset: "balanced",
    pinnedQuestIds: [],
    deferredUntilById: {},
    lifecycleById: {},
  },
  ...patch,
});
const assert = (condition, message) => {
  if (!condition) {
    console.error(`Quest planning failed: ${message}`);
    process.exit(1);
  }
};

const priorityState = state([
  quest("system", { isSystem: true }),
  quest("own"),
  quest("chain", { type: "chained" }),
  quest("overdue", { dueDate: yesterday }),
  quest("pinned", { isSystem: true }),
  quest("hidden", { type: "hidden" }),
  quest("tracked", { isStepGoal: true }),
  quest("mandatory", { isRedemption: true, type: "redemption" }),
], {
  questPlanning: {
    overloadPreset: "balanced",
    pinnedQuestIds: ["pinned"],
    deferredUntilById: {},
    lifecycleById: {},
  },
});
const snapshot = getQuestPlanningSnapshot(priorityState);
assert(snapshot.loadout.length === 3, "loadout must cap at three");
assert(snapshot.loadout.map(q => q.id).join(",") === "pinned,overdue,chain", "priority order must be pin, overdue, chain");
assert(snapshot.questLog.some(q => q.id === "hidden"), "hidden Quest must land in Quest Log");
assert(snapshot.tracked.map(q => q.id).includes("tracked"), "tracked Quest must be separate");
assert(snapshot.mandatory.map(q => q.id).includes("mandatory"), "mandatory Quest must be separate");

for (const preset of Object.values(QUEST_OVERLOAD_PRESETS)) {
  const quests = Array.from({ length: preset.overloadCount }, (_, index) => quest(`${preset.key}_${index}`));
  const threshold = getQuestPlanningSnapshot(state(quests, {
    questPlanning: { overloadPreset: preset.key, pinnedQuestIds: [], deferredUntilById: {}, lifecycleById: {} },
  }));
  assert(threshold.overloadStatus.overloaded, `${preset.key} must pause at overload threshold`);
  const below = getQuestPlanningSnapshot(state(quests.slice(0, -1), {
    questPlanning: { overloadPreset: preset.key, pinnedQuestIds: [], deferredUntilById: {}, lifecycleById: {} },
  }));
  assert(!below.overloadStatus.overloaded, `${preset.key} must not pause below overload threshold`);
}

const deferred = withDeferredQuest(state([quest("later")]), "later", Date.now() + 86400000);
assert(getQuestPlanningSnapshot(deferred).deferred.length === 1, "deferred Quest must move to Later");
assert(getQuestPlanningSnapshot(deferred).actionable.length === 0, "deferred Quest must not count as actionable");

const archived = withArchivedQuest(state([quest("archive")]), "archive", Date.now());
assert(archived.archivedQuest?.id === "archive", "archive must retain Quest content");
assert(getQuestPlanningSnapshot(archived.state).archived.length === 1, "archive tab must expose archived Quest");
assert(getQuestPlanningSnapshot(archived.state).actionable.length === 0, "archived Quest must leave actionable list");
const restored = withRestoredQuest(archived.state, "archive", Date.now() + 1);
assert(restored.restoredQuest?.id === "archive", "restore must recover Quest content");
assert(getQuestPlanningSnapshot(restored.state).actionable.length === 1, "restored Quest must become actionable again");

console.log("✓ Quest planning: loadout, overload, deferral and archive behavior verified");
