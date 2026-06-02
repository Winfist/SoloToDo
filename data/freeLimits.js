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

// featureKey → which daily counter field + which FREE_LIMITS key caps it.
export const QUOTA_CONFIG = {
  dungeons:          { counter: "dailyDungeonsRun", limitKey: "dungeonsPerDay" },
  charisma_dungeons: { counter: "dailyCharismaRun", limitKey: "charismaDungeonsPerDay" },
};

// Ascending rarity tiers. Free users may equip up to FREE_LIMITS.equipmentMaxRarity.
export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

// Can a (free) user equip an item of this rarity? Premium = any. Unknown rarity = allowed (safety).
export function canEquipRarity({ premiumActive = false, rarity = "common" } = {}) {
  if (premiumActive) return { ok: true, maxRarity: null };
  const idx = RARITY_ORDER.indexOf(String(rarity));
  const maxIdx = RARITY_ORDER.indexOf(FREE_LIMITS.equipmentMaxRarity);
  const ok = idx === -1 ? true : idx <= maxIdx;
  return { ok, maxRarity: FREE_LIMITS.equipmentMaxRarity };
}

// Can a (free) user awaken another shadow? Premium = unlimited.
export function canAddShadow({ premiumActive = false, shadowCount = 0 } = {}) {
  if (premiumActive) return { ok: true, remaining: Infinity };
  const count = Math.max(0, Number(shadowCount) || 0);
  const remaining = Math.max(0, FREE_LIMITS.shadowsMax - count);
  return { ok: remaining > 0, remaining };
}

// Can a (free) user switch class? Free may switch freely until the current class earns XP
// (level > 0); after that they are committed. Premium = always (multi-class + respec).
export function canSwitchJob({ premiumActive = false, targetJob = null, currentJob = null, currentJobLevel = 0 } = {}) {
  if (premiumActive) return { ok: true };
  if (!currentJob || targetJob === currentJob) return { ok: true };
  if ((Number(currentJobLevel) || 0) > 0) return { ok: false };
  return { ok: true };
}

// Pure per-feature quota status. `state` supplies the daily counter; `premiumActive` from caller.
export function getQuotaStatus(featureKey, { premiumActive = false, state = {} } = {}) {
  const cfg = QUOTA_CONFIG[featureKey];
  if (!cfg) return { tracked: false, premiumActive, used: 0, limit: Infinity, remaining: Infinity, allowed: true };
  const used = Math.max(0, Number(state?.[cfg.counter]) || 0);
  const limit = premiumActive ? Infinity : Number(FREE_LIMITS[cfg.limitKey]) || 0;
  const remaining = premiumActive ? Infinity : Math.max(0, limit - used);
  return { tracked: true, premiumActive, used, limit, remaining, allowed: premiumActive || used < limit };
}
