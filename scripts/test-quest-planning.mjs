import {
  QUEST_OVERLOAD_PRESETS,
  getQuestPlanningSnapshot,
  shouldShowDayRecap,
  withArchivedQuest,
  withDeferredQuest,
  withRestoredQuest,
} from "../data/questPlanning.js";
import { getToday } from "../data/dateUtils.js";
import {
  getDailySystemQuestCount,
  getQuestIntensityActiveCap,
  getQuestIntensityIntervalMs,
  getSystemCallSummary,
} from "../data/questIntensity.js";

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

const expiredPremiumIntensity = {
  settings: { questIntensity: "monarch_call" },
  premium: { tier: "hunter_pro", activeUntil: "2020-01-01T00:00:00.000Z" },
};
assert(getDailySystemQuestCount(expiredPremiumIntensity) === 1, "free users must fall back to one daily system Quest");
assert(getQuestIntensityActiveCap(expiredPremiumIntensity) === 1, "free users must fall back to the Baby Gate active cap");
assert(getQuestIntensityIntervalMs(expiredPremiumIntensity) === 24 * 60 * 60 * 1000, "free users must fall back to the Baby Gate interval");

const activePremiumIntensity = {
  settings: { questIntensity: "monarch_call" },
  premium: { tier: "hunter_pro", activeUntil: new Date(Date.now() + 86400000).toISOString() },
};
assert(getDailySystemQuestCount(activePremiumIntensity) === 4, "premium users must keep their selected daily intensity");
assert(getQuestIntensityActiveCap(activePremiumIntensity) === 8, "premium users must keep their selected active cap");
assert(getQuestIntensityIntervalMs(activePremiumIntensity) === 2 * 60 * 60 * 1000, "premium users must keep their selected interval");

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

// ── Day target must count remaining work, not shrink to what's done:
// with 2 quests total, finishing the 1st must NOT show 1/1 = 100% ──
{
  const doneToday = { id: "done", title: "done", completedAt: today };
  const twoOpen = state([quest("a"), quest("b")]);
  assert(getQuestPlanningSnapshot(twoOpen).todayTarget === 2, "2 open quests → target 2");
  const oneDoneOneOpen = state([quest("b")], { completedQuests: [doneToday] });
  const snap = getQuestPlanningSnapshot(oneDoneOneOpen);
  assert(snap.todayTarget === 2, `1 done + 1 open → target stays 2 (got ${snap.todayTarget})`);
  assert(snap.completedToday === 1, "completedToday counts today's completion");
  const manyOpen = state([quest("a"), quest("b"), quest("c"), quest("d"), quest("e")]);
  assert(getQuestPlanningSnapshot(manyOpen).todayTarget === 3, "target caps at loadout size 3");
}

// ── Day recap fires exactly when the day goal is crossed, once per day ──
{
  const doneQ = (id) => ({ id, title: id, completedAt: today });
  const before = state([quest("b")], { completedQuests: [doneQ("a")] });        // 1/2
  const after = state([], { completedQuests: [doneQ("a"), doneQ("b")] });       // 2/2
  assert(shouldShowDayRecap(before, after) === true, "crossing the day goal shows the recap");
  assert(shouldShowDayRecap(before, { ...after, lastDayRecapDate: today }) === false,
    "recap shows only once per day (lastDayRecapDate)");
  const midway = state([quest("b"), quest("c")], { completedQuests: [doneQ("a")] }); // 1/3
  assert(shouldShowDayRecap(state([quest("a"), quest("b"), quest("c")]), midway) === false,
    "no recap while the goal is not reached");
}

// ── System-call summary: the Settings banner must show EFFECTIVE values ──
{
  const freeMonarch = {
    settings: { questIntensity: "monarch_call" },
    premium: { tier: "free" },
    questPlanning: { overloadPreset: "balanced" },
  };
  const s1 = getSystemCallSummary(freeMonarch);
  assert(s1.effectiveKey === "baby_gate" && s1.callsPerDay === 1, "free user summary shows effective baby_gate (1 call/day)");
  assert(s1.limitedByFree === true, "free user with higher selection is flagged as limited");
  assert(s1.pauseAtOpenQuests === 10 && s1.staleDays === 7, "balanced preset: pause at 10, stale after 7 days");

  const proMonarch = {
    settings: { questIntensity: "monarch_call" },
    premium: { tier: "hunter_pro", activeUntil: new Date(Date.now() + 86400000).toISOString() },
    questPlanning: { overloadPreset: "focused" },
  };
  const s2 = getSystemCallSummary(proMonarch);
  assert(s2.effectiveKey === "monarch_call" && s2.callsPerDay === 4, "pro user summary shows selected intensity (4 calls/day)");
  assert(s2.limitedByFree === false, "pro user is not limited");
  assert(s2.pauseAtOpenQuests === 7 && s2.staleDays === 3, "focused preset: pause at 7, stale after 3 days");
}

console.log("✓ Quest planning: loadout, overload, deferral and archive behavior verified");
