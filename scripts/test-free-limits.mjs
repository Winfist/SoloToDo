import { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT, computeQuestCreationStatus, canPurchaseExtraSlot, getQuotaStatus, QUOTA_CONFIG, canEquipRarity, RARITY_ORDER } from "../data/freeLimits.js";

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

// ── computeQuestCreationStatus: free baseline ──
let s = computeQuestCreationStatus({ premiumActive: false, createdCount: 0, extraDailySlots: 0 });
assert(s.limit === 10, "free limit with no extras should be 10");
assert(s.remaining === 10, "free remaining at 0 created should be 10");
assert(s.canCreate === true, "free can create at 0/10");

// ── free at cap ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 10, extraDailySlots: 0 });
assert(s.remaining === 0, "free remaining at 10 created should be 0");
assert(s.canCreate === false, "free cannot create at 10/10");

// ── extra slots add to the limit ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 10, extraDailySlots: 3 });
assert(s.limit === 13, "3 bought slots should raise limit to 13");
assert(s.canCreate === true, "can create again after buying slots");

// ── extra slots are clamped to purchasableSlotsPerDay (defensive) ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 0, extraDailySlots: 99 });
assert(s.paidExtraSlots === 5, "extra slots clamp to 5 in status");
assert(s.limit === 15, "limit clamps to 10 + 5 = 15");

// ── premium = unlimited ──
s = computeQuestCreationStatus({ premiumActive: true, createdCount: 999, extraDailySlots: 0 });
assert(s.limit === Infinity, "premium limit is Infinity");
assert(s.canCreate === true, "premium can always create");

// ── canPurchaseExtraSlot ──
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 0 }).ok === true, "free can buy first slot");
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 5 }).ok === false, "free blocked at 5 bought");
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 4 }).remaining === 1, "1 slot remaining at 4 bought");
assert(canPurchaseExtraSlot({ premiumActive: true, extraDailySlots: 99 }).ok === true, "premium never blocked");

// ── getQuotaStatus ──
assert(QUOTA_CONFIG.dungeons.limitKey === "dungeonsPerDay", "dungeons maps to dungeonsPerDay");

// untracked feature → always allowed, infinite
let q = getQuotaStatus("not_a_feature", { premiumActive: false, state: {} });
assert(q.tracked === false && q.allowed === true && q.remaining === Infinity, "unknown feature is unlimited");

// free dungeons, none used
q = getQuotaStatus("dungeons", { premiumActive: false, state: {} });
assert(q.limit === 3 && q.remaining === 3 && q.allowed === true, "free dungeons start at 3/3");

// free dungeons, at cap
q = getQuotaStatus("dungeons", { premiumActive: false, state: { dailyDungeonsRun: 3 } });
assert(q.remaining === 0 && q.allowed === false, "free dungeons blocked at 3 run");

// premium dungeons unlimited
q = getQuotaStatus("dungeons", { premiumActive: true, state: { dailyDungeonsRun: 99 } });
assert(q.limit === Infinity && q.allowed === true, "premium dungeons unlimited");

// ── canEquipRarity ──
assert(RARITY_ORDER.indexOf("common") < RARITY_ORDER.indexOf("legendary"), "rarity order ascends");
assert(canEquipRarity({ premiumActive: false, rarity: "common" }).ok === true, "free can equip common");
assert(canEquipRarity({ premiumActive: false, rarity: "rare" }).ok === true, "free can equip rare");
assert(canEquipRarity({ premiumActive: false, rarity: "epic" }).ok === false, "free cannot equip epic");
assert(canEquipRarity({ premiumActive: false, rarity: "legendary" }).ok === false, "free cannot equip legendary");
assert(canEquipRarity({ premiumActive: true, rarity: "legendary" }).ok === true, "premium can equip legendary");
assert(canEquipRarity({ premiumActive: false, rarity: "weird" }).ok === true, "unknown rarity allowed (safety)");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("test-free-limits: all assertions passed.");
