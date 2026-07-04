import {
  pickSystemMarkCandidate,
  SYSTEM_MARK_COOLDOWN_DAYS,
  SYSTEM_MARK_XP_MULT,
  getQuestPlanningSnapshot,
} from "../data/questPlanning.js";
import { buildCompleteQuestState } from "../hooks/questActions.js";
import { DEFAULT_STATE } from "../data/defaultState.js";
import { getToday } from "../data/helpers.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

const passAchievements = (s) => ({ nextState: s, newAchievements: [] });
const today = getToday();
const now = Date.now();
const DAY = 86400000;

function ownQuest(id, ageDays, extra = {}) {
  return {
    id, title: `Quest ${id}`, category: "str", difficulty: "easy", type: "side",
    createdAt: today, createdAtMs: now - ageDays * DAY, ...extra,
  };
}

function makeState(quests, overrides = {}) {
  return { ...structuredClone(DEFAULT_STATE), quests, ...overrides };
}

// ── Picks the OLDEST stale own quest (balanced preset: stale after 7 days) ──
{
  const state = makeState([ownQuest("fresh", 1), ownQuest("old", 10), ownQuest("oldest", 20)]);
  const picked = pickSystemMarkCandidate(state, now);
  assert(picked?.id === "oldest", `picks oldest stale own quest (got ${picked?.id})`);
}

// ── No stale quests → null ──
{
  const state = makeState([ownQuest("fresh", 1), ownQuest("fresh2", 2)]);
  assert(pickSystemMarkCandidate(state, now) === null, "returns null when nothing is stale");
}

// ── Never marks system/seasonal/hidden/redemption/tracked/pinned/deferred quests ──
{
  const state = makeState([
    ownQuest("sys", 20, { isSystem: true }),
    ownQuest("seasonal", 20, { isSystem: true, isSeasonal: true }),
    ownQuest("hidden", 20, { type: "hidden" }),
    ownQuest("redemption", 20, { isRedemption: true }),
    ownQuest("tracked", 20, { isStepGoal: true }),
    ownQuest("pinned", 20),
    ownQuest("deferred", 20),
    ownQuest("future", 20, { dueDate: "2099-01-01" }),
  ], {
    questPlanning: {
      overloadPreset: "balanced",
      pinnedQuestIds: ["pinned"],
      deferredUntilById: { deferred: now + DAY },
      lifecycleById: {},
    },
  });
  assert(pickSystemMarkCandidate(state, now) === null,
    "system/seasonal/hidden/redemption/tracked/pinned/deferred/future quests are never marked");
}

// ── Cooldown: a quest marked within the last 3 days is skipped ──
{
  const state = makeState([ownQuest("recent-mark", 20), ownQuest("older-unmarked", 15)], {
    questPlanning: {
      overloadPreset: "balanced",
      pinnedQuestIds: [],
      deferredUntilById: {},
      lifecycleById: { "recent-mark": { lastMarkedAtMs: now - 1 * DAY } },
    },
  });
  const picked = pickSystemMarkCandidate(state, now);
  assert(picked?.id === "older-unmarked", `cooldown skips recently marked quest (got ${picked?.id})`);
  assert(SYSTEM_MARK_COOLDOWN_DAYS === 3, "cooldown is 3 days");
}

// ── Stale threshold follows the user's overload preset (focused = 3 days) ──
{
  const quests = [ownQuest("fiveDays", 5)];
  const balanced = makeState(quests);
  const focused = makeState(quests, {
    questPlanning: { overloadPreset: "focused", pinnedQuestIds: [], deferredUntilById: {}, lifecycleById: {} },
  });
  assert(pickSystemMarkCandidate(balanced, now) === null, "5-day quest not stale under balanced (7d)");
  assert(pickSystemMarkCandidate(focused, now)?.id === "fiveDays", "5-day quest stale under focused (3d)");
}

// ── Loadout: the marked quest ranks first and the snapshot exposes it ──
{
  const state = makeState(
    [ownQuest("a", 1, { priority: "high" }), ownQuest("b", 10), ownQuest("c", 2)],
    { systemMark: { questId: "b", date: today, xpMult: SYSTEM_MARK_XP_MULT } }
  );
  const snapshot = getQuestPlanningSnapshot(state, now);
  assert(snapshot.systemMarkQuestId === "b", "snapshot exposes systemMarkQuestId");
  assert(snapshot.loadout[0]?.id === "b", `marked quest ranks first in loadout (got ${snapshot.loadout[0]?.id})`);
}

// ── Stale or foreign marks are not exposed ──
{
  const stale = makeState([ownQuest("a", 1)], { systemMark: { questId: "a", date: "2020-01-01", xpMult: 1.5 } });
  assert(getQuestPlanningSnapshot(stale, now).systemMarkQuestId === null, "yesterday's mark is not exposed");
  const gone = makeState([ownQuest("a", 1)], { systemMark: { questId: "missing", date: today, xpMult: 1.5 } });
  assert(getQuestPlanningSnapshot(gone, now).systemMarkQuestId === null, "mark pointing at missing quest is not exposed");
}

// ── Completion: marked quest pays +50% XP and clears the mark ──
{
  const plain = makeState([ownQuest("q1", 10)]);
  const marked = makeState([ownQuest("q1", 10)], {
    systemMark: { questId: "q1", date: today, xpMult: SYSTEM_MARK_XP_MULT },
  });
  const plainResult = buildCompleteQuestState("q1", plain, passAchievements);
  const markedResult = buildCompleteQuestState("q1", marked, passAchievements);
  assert(markedResult.xpGain === Math.round(plainResult.xpGain * SYSTEM_MARK_XP_MULT),
    `marked completion pays 1.5x XP (${markedResult.xpGain} vs ${plainResult.xpGain})`);
  assert(markedResult.nextState.systemMark === null, "mark is cleared after completion");
  assert(markedResult.systemMarkCompleted === true, "result flags the mark completion (analytics hook)");
  assert(plainResult.systemMarkCompleted === false, "unmarked completion is not flagged");
}

// ── Completion of a DIFFERENT quest leaves the mark untouched, no bonus ──
{
  const state = makeState([ownQuest("q1", 10), ownQuest("q2", 10)], {
    systemMark: { questId: "q2", date: today, xpMult: SYSTEM_MARK_XP_MULT },
  });
  const result = buildCompleteQuestState("q1", state, passAchievements);
  assert(result.nextState.systemMark?.questId === "q2", "completing another quest keeps the mark");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All system-mark tests passed.");
