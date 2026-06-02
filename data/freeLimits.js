// ─── FREE-TIER LIMITS ─────────────────────────────────────────
// Single source of truth for every free-tier cap. Pro resolves to Infinity
// at the call sites. This module has ZERO imports so it stays trivially
// unit-testable (no i18n/DOM coupling).

export const FREE_LIMITS = {
  questsPerDay: 10,           // manual quest creation/day (was 1)
  purchasableSlotsPerDay: 5,  // guardrail: max extra slots a free user can buy/day
  dungeonsPerDay: 3,
  charismaDungeonsPerDay: 1,
  equipmentSlots: 3,
  equipmentMaxRarity: "rare", // common | uncommon | rare
  shadowsMax: 5,
  jobsMax: 1,
  aiFreeCreditsTotal: 3,
  aiFreeCreditsPerDay: 1,
};

// Back-compat: existing imports use this name.
export const FREE_DAILY_QUEST_LIMIT = FREE_LIMITS.questsPerDay;
