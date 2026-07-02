import { buildCompleteQuestState, computeXpGain } from "../hooks/questActions.js";
import { DEFAULT_STATE } from "../data/defaultState.js";
import { getToday } from "../data/helpers.js";
import { getYesterdayKey } from "../data/dateUtils.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

const passAchievements = (s) => ({ nextState: s, newAchievements: [] });
const today = getToday();
const yesterday = getYesterdayKey();

function makeState(overrides = {}) {
  const quest = {
    id: "q1", title: "Eigene Quest", category: "str", difficulty: "easy",
    type: "side", createdAt: today, createdAtMs: Date.now() - 3600000,
  };
  return { ...structuredClone(DEFAULT_STATE), quests: [quest], ...overrides };
}

// ── Core bug: boot stamps lastActiveDate=today BEFORE any completion, so the
// streak must key off its own field, not off lastActiveDate ──
{
  const state = makeState({ streak: 3, lastActiveDate: today, lastCompletionDate: yesterday });
  const result = buildCompleteQuestState("q1", state, passAchievements);
  assert(result.nextState.streak === 4,
    `first completion of the day increments streak despite boot stamp (got ${result.nextState.streak})`);
  assert(result.nextState.lastCompletionDate === today,
    "completion records lastCompletionDate = today");
}

// ── Same day, second completion: no double increment ──
{
  const state = makeState({ streak: 4, lastActiveDate: today, lastCompletionDate: today });
  const result = buildCompleteQuestState("q1", state, passAchievements);
  assert(result.nextState.streak === 4,
    `second completion on the same day keeps streak (got ${result.nextState.streak})`);
}

// ── Legacy save without lastCompletionDate: first completion counts ──
{
  const state = makeState({ streak: 0, lastActiveDate: today });
  delete state.lastCompletionDate;
  const result = buildCompleteQuestState("q1", state, passAchievements);
  assert(result.nextState.streak === 1,
    `legacy save: first completion starts streak at 1 (got ${result.nextState.streak})`);
}

// ── Eigeninitiative: own quests earn 10% more XP than identical system quests ──
{
  const base = { category: "str", difficulty: "easy", type: "side" };
  const own = computeXpGain({ ...base }, 0, {}, {}, false, null, {});
  const sys = computeXpGain({ ...base, isSystem: true }, 0, {}, {}, false, null, {});
  assert(own === Math.round(sys * 1.1),
    `own quest XP (${own}) should be 10% above system quest XP (${sys})`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All streak tests passed.");
