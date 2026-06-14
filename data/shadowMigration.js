// Migration of legacy named-shadow identities (IP rebrand: igris/beru/bellion
// → vaelin/xerath/kaelen) and legacy title strings in persisted saves.
// Without this, old saves fail the unlock check in checkNamedShadowUnlocks and
// all previously earned named shadows get re-added under their new names.

import { NAMED_SHADOWS } from "./gameData.js";
import { genId } from "./helpers.js";

export const LEGACY_NAMED_SHADOW_IDS = {
  igris: "vaelin",
  beru: "xerath",
  bellion: "kaelen",
};

// Old reward/shop title strings that may persist in state.selectedTitle.
// "Shadow Monarch" had several sources (shop item, achievements, job mastery);
// it maps to the shop item's new name so the shop "active" check matches again.
export const LEGACY_TITLE_MAP = {
  "Shadow Monarch": "Schattenfürst",
  "Shadow Sovereign": "Soulbinder",
};

// Heals saves where the old trigger activated Shadow Regression without a
// streak to lose (previousStreak 0): deactivates it, clears the penalty zone,
// and removes the injected redemption quests.
export function clearBogusShadowRegression(state) {
  if (!state?.shadowRegression?.active) return state;
  if ((state.shadowRegression.previousStreak || 0) > 0) return state;
  return {
    ...state,
    shadowRegression: {
      ...state.shadowRegression,
      active: false,
      redemptionQuests: [],
      questsCompleted: 0,
      completedAt: null,
    },
    penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 },
    quests: (state.quests || []).filter(q => !q?.isRedemption),
  };
}

function legacyKeyOf(shadow) {
  if (!shadow) return null;
  if (LEGACY_NAMED_SHADOW_IDS[shadow.namedId]) return shadow.namedId;
  if (!shadow.namedId && LEGACY_NAMED_SHADOW_IDS[shadow.id]) return shadow.id;
  return null;
}

function refreshFromDefinition(shadow, def) {
  return {
    ...shadow,
    id: LEGACY_NAMED_SHADOW_IDS[shadow.id] ? genId() : shadow.id,
    namedId: def.id,
    isNamed: true,
    name: def.name,
    title: def.title,
    icon: def.icon,
    iconSrc: def.iconSrc,
    lore: def.lore,
    glowColor: def.glowColor,
    class: def.class,
    tier: def.tier,
  };
}

function moreProgressed(a, b) {
  if ((a.level || 0) !== (b.level || 0)) return (a.level || 0) > (b.level || 0) ? a : b;
  return (a.xp || 0) >= (b.xp || 0) ? a : b;
}

export function migrateLegacyShadowIdentity(state) {
  if (!state) return state;
  let changed = false;

  let shadows = state.shadowArmy?.shadows;
  if (Array.isArray(shadows) && shadows.length > 0) {
    // 1) Remap legacy identities and refresh definition-derived fields.
    shadows = shadows.map(shadow => {
      const legacyKey = legacyKeyOf(shadow);
      if (!legacyKey) return shadow;
      changed = true;
      return refreshFromDefinition(shadow, NAMED_SHADOWS[LEGACY_NAMED_SHADOW_IDS[legacyKey]]);
    });

    // 2) Collapse duplicates created while the unlock check missed legacy IDs:
    //    keep the most progressed copy, preserve deployment from the dropped one.
    const keeperByNamedId = new Map();
    shadows.forEach(shadow => {
      if (!shadow?.namedId || !NAMED_SHADOWS[shadow.namedId]) return;
      const existing = keeperByNamedId.get(shadow.namedId);
      keeperByNamedId.set(shadow.namedId, existing ? moreProgressed(existing, shadow) : shadow);
    });
    const deduped = [];
    const seen = new Set();
    shadows.forEach(shadow => {
      const namedId = shadow?.namedId;
      if (!namedId || !NAMED_SHADOWS[namedId]) { deduped.push(shadow); return; }
      const keeper = keeperByNamedId.get(namedId);
      if (seen.has(namedId)) { changed = true; return; }
      seen.add(namedId);
      if (shadow !== keeper) changed = true;
      const merged = { ...keeper };
      if (!merged.isDeployed) {
        const deployed = shadows.find(s => s?.namedId === namedId && s.isDeployed);
        if (deployed) { merged.isDeployed = true; merged.deploymentSlot = deployed.deploymentSlot; }
      }
      deduped.push(merged);
    });
    shadows = deduped;
  }

  const remappedTitle = LEGACY_TITLE_MAP[state.selectedTitle];
  if (!changed && !remappedTitle) return state;

  const next = { ...state };
  if (Array.isArray(shadows)) next.shadowArmy = { ...state.shadowArmy, shadows };
  if (remappedTitle) next.selectedTitle = remappedTitle;
  return next;
}
