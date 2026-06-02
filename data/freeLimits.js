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

// Pure quest-creation status. `premiumActive` is resolved by the caller.
export function computeQuestCreationStatus({ premiumActive = false, createdCount = 0, extraDailySlots = 0 } = {}) {
  const created = Math.max(0, Number(createdCount) || 0);
  const rawSlots = Math.max(0, Number(extraDailySlots) || 0);
  const paidExtraSlots = premiumActive ? rawSlots : Math.min(rawSlots, FREE_LIMITS.purchasableSlotsPerDay);
  const limit = premiumActive ? Infinity : FREE_LIMITS.questsPerDay + paidExtraSlots;
  const remaining = premiumActive ? Infinity : Math.max(0, limit - created);
  return {
    premiumActive,
    createdCount: created,
    freeLimit: FREE_LIMITS.questsPerDay,
    paidExtraSlots,
    purchasableSlotsPerDay: FREE_LIMITS.purchasableSlotsPerDay,
    purchasableSlotsRemaining: premiumActive ? Infinity : Math.max(0, FREE_LIMITS.purchasableSlotsPerDay - rawSlots),
    limit,
    remaining,
    canCreate: premiumActive || created < limit,
  };
}

// Guardrail #1: can a (free) user buy another daily extra slot?
export function canPurchaseExtraSlot({ premiumActive = false, extraDailySlots = 0 } = {}) {
  if (premiumActive) return { ok: true, remaining: Infinity };
  const purchased = Math.max(0, Number(extraDailySlots) || 0);
  const remaining = Math.max(0, FREE_LIMITS.purchasableSlotsPerDay - purchased);
  return { ok: remaining > 0, remaining };
}
