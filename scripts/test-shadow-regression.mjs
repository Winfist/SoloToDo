import {
  REDEMPTION_QUESTS_REQUIRED,
  calcRestoredStreak,
  shouldTriggerShadowRegression,
  generateRedemptionQuests,
  shouldRetainQuestAtReset,
} from "../data/protocolHelpers.js";
import { clearBogusShadowRegression } from "../data/shadowMigration.js";
import { buildCompleteQuestState } from "../hooks/questActions.js";
import { DEFAULT_STATE } from "../data/defaultState.js";
import { getToday } from "../data/helpers.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

// ── Threshold matches the 3-act cinematic and stays coverable by the pool ──
assert(REDEMPTION_QUESTS_REQUIRED === 3, "required redemption quests should be 3 (cinematic shows 3 acts)");
assert(generateRedemptionQuests(1).length >= REDEMPTION_QUESTS_REQUIRED,
  "generator must offer at least as many quests as required");

// ── Streak restore: ceil, so a lost 1-day streak restores 1, not 0 ──
assert(calcRestoredStreak(0) === 0, "restore 0 → 0");
assert(calcRestoredStreak(1) === 1, "restore 1 → 1 (not 0)");
assert(calcRestoredStreak(5) === 3, "restore 5 → 3");
assert(calcRestoredStreak(12) === 6, "restore 12 → 6");
assert(calcRestoredStreak(undefined) === 0, "restore undefined → 0");

// ── Trigger guard: never punish a player who had no streak ──
const base = { daysMissed: 3, previousStreak: 4, hadOpenDailies: true, penaltyZoneActive: false, regressionActive: false };
assert(shouldTriggerShadowRegression(base) === true, "triggers for lost streak with open dailies");
assert(shouldTriggerShadowRegression({ ...base, previousStreak: 0 }) === false,
  "MUST NOT trigger when previousStreak is 0 (core bug)");
assert(shouldTriggerShadowRegression({ ...base, hadOpenDailies: false }) === false, "no trigger without open dailies");
assert(shouldTriggerShadowRegression({ ...base, daysMissed: 1 }) === false, "no trigger after a single missed day");
assert(shouldTriggerShadowRegression({ ...base, regressionActive: true }) === false, "no re-trigger while active");
assert(shouldTriggerShadowRegression({ ...base, penaltyZoneActive: true }) === false, "no trigger inside penalty zone");

// ── Migration healing: deactivate bogus regressions already written to saves ──
{
  const bogus = {
    streak: 0,
    shadowRegression: { active: true, previousStreak: 0, redemptionQuests: ["a", "b"], questsCompleted: 0, completedAt: null, regressionHistory: [{ date: "2026-01-01" }] },
    penaltyZone: { active: true, redemptionLeft: 5, questsCompletedInPenalty: 0 },
    quests: [
      { id: "r1", isRedemption: true, completed: false },
      { id: "q1", type: "daily", completed: false },
    ],
  };
  const healed = clearBogusShadowRegression(bogus);
  assert(healed.shadowRegression.active === false, "bogus regression deactivated");
  assert(healed.penaltyZone.active === false, "bogus penalty zone deactivated");
  assert(!healed.quests.some(q => q.isRedemption), "leftover redemption quests removed");
  assert(healed.quests.some(q => q.id === "q1"), "normal quests preserved");
  assert(healed.shadowRegression.regressionHistory.length === 1, "history preserved");
}
{
  const legit = {
    shadowRegression: { active: true, previousStreak: 6, redemptionQuests: ["a"], questsCompleted: 1, completedAt: null, regressionHistory: [] },
    quests: [{ id: "r1", isRedemption: true, completed: false }],
  };
  assert(clearBogusShadowRegression(legit) === legit, "legit regression (streak > 0) untouched (same reference)");
}
{
  const inactive = { shadowRegression: { active: false, previousStreak: 0 }, quests: [] };
  assert(clearBogusShadowRegression(inactive) === inactive, "inactive regression untouched (same reference)");
  assert(clearBogusShadowRegression(null) === null, "null state passes through");
}

// ── Daily reset retention: redemption quests must survive while the
// regression runs, everything else keeps its previous reset semantics ──
assert(shouldRetainQuestAtReset({ id: "u1" }, { regressionActive: false }) === true,
  "user quest survives the daily reset");
assert(shouldRetainQuestAtReset({ isSystem: true }, { regressionActive: true }) === false,
  "pool system quest is cleared at reset");
assert(shouldRetainQuestAtReset({ isSystem: true, isSeasonal: true }, { regressionActive: true }) === false,
  "seasonal quest is cleared (season detection re-adds it)");
assert(shouldRetainQuestAtReset({ isSystem: true, isRedemption: true }, { regressionActive: true }) === true,
  "redemption quest survives while regression is active (core bug)");
assert(shouldRetainQuestAtReset({ isSystem: true, isRedemption: true }, { regressionActive: false }) === false,
  "stale redemption quest is cleared once regression is over");

// ── Regression completion flow: finishing the 3rd redemption quest ends the
// arc, restores half the streak, clears penalty, and flags the result so the
// effect layer can log analytics without re-deriving the transition ──
{
  const passAchievements = (s) => ({ nextState: s, newAchievements: [] });
  const makeRegressionState = (questsCompleted) => ({
    ...structuredClone(DEFAULT_STATE),
    streak: 0,
    penaltyZone: { active: true, redemptionLeft: REDEMPTION_QUESTS_REQUIRED, questsCompletedInPenalty: 0 },
    shadowRegression: {
      active: true, previousStreak: 8, redemptionQuests: ["r1"],
      questsCompleted, completedAt: null, regressionHistory: [],
    },
    quests: [{
      id: "r1", title: "Schattenrückforderung", category: "str", difficulty: "hard",
      type: "redemption", isSystem: true, isRedemption: true,
      createdAt: getToday(), createdAtMs: Date.now() - 3600000,
    }],
  });

  const finished = buildCompleteQuestState("r1", makeRegressionState(REDEMPTION_QUESTS_REQUIRED - 1), passAchievements);
  assert(finished.regressionCompleted === true, "3rd redemption completion flags regressionCompleted");
  assert(finished.nextState.shadowRegression.active === false, "regression deactivates on completion");
  assert(finished.nextState.streak === calcRestoredStreak(8), `streak restored to half (got ${finished.nextState.streak})`);
  assert(finished.nextState.penaltyZone.active === false, "penalty zone clears with the regression");

  const midway = buildCompleteQuestState("r1", makeRegressionState(0), passAchievements);
  assert(midway.regressionCompleted === false, "1st redemption completion does not flag the arc as done");
  assert(midway.nextState.shadowRegression.active === true, "regression stays active midway");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All shadow-regression tests passed.");
