import { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT } from "../data/freeLimits.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

// ── FREE_LIMITS config ──
assert(FREE_LIMITS.questsPerDay === 10, "questsPerDay should be 10");
assert(FREE_LIMITS.purchasableSlotsPerDay === 5, "purchasableSlotsPerDay should be 5");
assert(FREE_LIMITS.dungeonsPerDay === 3, "dungeonsPerDay should be 3");
assert(FREE_LIMITS.charismaDungeonsPerDay === 1, "charismaDungeonsPerDay should be 1");
assert(FREE_LIMITS.equipmentSlots === 3, "equipmentSlots should be 3");
assert(FREE_LIMITS.equipmentMaxRarity === "rare", "equipmentMaxRarity should be 'rare'");
assert(FREE_LIMITS.shadowsMax === 5, "shadowsMax should be 5");
assert(FREE_LIMITS.jobsMax === 1, "jobsMax should be 1");
assert(FREE_LIMITS.aiFreeCreditsTotal === 3, "aiFreeCreditsTotal should be 3");
assert(FREE_LIMITS.aiFreeCreditsPerDay === 1, "aiFreeCreditsPerDay should be 1");
assert(FREE_DAILY_QUEST_LIMIT === 10, "FREE_DAILY_QUEST_LIMIT back-compat alias should equal 10");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("test-free-limits: all assertions passed.");
