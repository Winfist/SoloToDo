import { migrateLegacyShadowIdentity, LEGACY_NAMED_SHADOW_IDS, LEGACY_TITLE_MAP } from "../data/shadowMigration.js";
import { checkNamedShadowUnlocks } from "../data/helpers.js";
import { NAMED_SHADOWS } from "../data/gameData.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

const legacyShadow = (namedId, extra = {}) => ({
  id: `gen-${namedId}`,
  namedId,
  isNamed: true,
  name: namedId,
  title: "Legacy Title",
  icon: "🩸",
  iconSrc: `/icons/shadow_${namedId}.webp`,
  lore: "Legacy lore",
  glowColor: "#000000",
  class: "knight",
  tier: 4,
  level: 12,
  xp: 340,
  xpToNext: 500,
  stats: { power: 60, speed: 50, loyalty: 70, presence: 40 },
  abilities: [{ name: "Crimson Blade" }],
  isDeployed: false,
  deploymentSlot: null,
  evolutionStage: 2,
  summonsCount: 1,
  dungeonsCleared: 4,
  totalXpGenerated: 900,
  ...extra,
});

const regularShadow = () => ({
  id: "gen-soldier-1",
  isNamed: false,
  name: "Morgenroutine",
  class: "soldier",
  tier: 1,
  level: 3,
  xp: 10,
});

// State where all named-shadow unlock conditions are (still) met.
const oldSaveBase = () => ({
  level: 90,
  stats: { vit: 40 },
  dungeonHistory: [
    { dungeonId: "d1", won: true, dungeonRank: "A" },
    { dungeonId: "d2", won: true, dungeonRank: "S" },
  ],
  selectedTitle: "Shadow Monarch",
  shadowArmy: {
    shadows: [
      legacyShadow("igris", { isDeployed: true, deploymentSlot: "vanguard" }),
      legacyShadow("beru", { class: "assassin" }),
      legacyShadow("bellion", { class: "commander", tier: 5 }),
      regularShadow(),
    ],
  },
});

// ── Legacy ID map ──
assert(LEGACY_NAMED_SHADOW_IDS.igris === "vaelin", "map igris → vaelin");
assert(LEGACY_NAMED_SHADOW_IDS.beru === "xerath", "map beru → xerath");
assert(LEGACY_NAMED_SHADOW_IDS.bellion === "kaelen", "map bellion → kaelen");

// ── Remap: namedId + definition fields refreshed, progression preserved ──
{
  const migrated = migrateLegacyShadowIdentity(oldSaveBase());
  const shadows = migrated.shadowArmy.shadows;
  assert(shadows.length === 4, "no shadows lost during remap");

  const vaelin = shadows.find(s => s.namedId === "vaelin");
  assert(!!vaelin, "igris remapped to namedId vaelin");
  assert(vaelin?.name === NAMED_SHADOWS.vaelin.name, "name refreshed from new definition");
  assert(vaelin?.title === NAMED_SHADOWS.vaelin.title, "title refreshed from new definition");
  assert(vaelin?.iconSrc === NAMED_SHADOWS.vaelin.iconSrc, "iconSrc points to existing phantom_* asset");
  assert(vaelin?.lore === NAMED_SHADOWS.vaelin.lore, "lore refreshed from new definition");
  assert(vaelin?.glowColor === NAMED_SHADOWS.vaelin.glowColor, "glowColor refreshed");
  assert(vaelin?.level === 12, "level preserved");
  assert(vaelin?.xp === 340, "xp preserved");
  assert(vaelin?.evolutionStage === 2, "evolutionStage preserved");
  assert(vaelin?.isDeployed === true && vaelin?.deploymentSlot === "vanguard", "deployment preserved");

  assert(shadows.some(s => s.namedId === "xerath"), "beru remapped to xerath");
  assert(shadows.some(s => s.namedId === "kaelen"), "bellion remapped to kaelen");
  assert(!shadows.some(s => ["igris", "beru", "bellion"].includes(s.namedId)), "no legacy namedIds remain");
  assert(shadows.some(s => s.id === "gen-soldier-1"), "regular shadow untouched");

  // No re-unlock after migration even though conditions are met
  const reunlocks = checkNamedShadowUnlocks(migrated);
  assert(!reunlocks.some(ns => ["vaelin", "xerath", "kaelen"].includes(ns.id)),
    "migrated save does not re-unlock renamed shadows");
  // Positive control: tank (Bastion) still unlockable when VIT condition is met
  const withVit = { ...migrated, stats: { vit: 120 } };
  assert(checkNamedShadowUnlocks(withVit).some(ns => ns.id === "tank"),
    "tank/Bastion unlock still works (positive control)");
}

// ── Legacy id stored in `id` field (very old saves) ──
{
  const state = oldSaveBase();
  state.shadowArmy.shadows = [legacyShadow("igris", { id: "igris", namedId: undefined })];
  const migrated = migrateLegacyShadowIdentity(state);
  const vaelin = migrated.shadowArmy.shadows.find(s => s.namedId === "vaelin");
  assert(!!vaelin, "shadow with legacy id (no namedId) remapped");
  assert(vaelin?.id !== "igris", "legacy id replaced");
}

// ── Dedupe: bug already fired → old igris + fresh vaelin in same save ──
{
  const state = oldSaveBase();
  state.shadowArmy.shadows = [
    legacyShadow("igris", { isDeployed: true, deploymentSlot: "vanguard", level: 12 }),
    { ...legacyShadow("vaelin"), namedId: "vaelin", name: "Vaelin", level: 1, xp: 0, isDeployed: false },
  ];
  const migrated = migrateLegacyShadowIdentity(state);
  const vaelins = migrated.shadowArmy.shadows.filter(s => s.namedId === "vaelin");
  assert(vaelins.length === 1, "duplicate named shadow collapsed to one");
  assert(vaelins[0]?.level === 12, "keeper is the more progressed copy");
  assert(vaelins[0]?.isDeployed === true && vaelins[0]?.deploymentSlot === "vanguard", "deployment survives dedupe");
}

// ── Dedupe keeps higher-level copy regardless of order ──
{
  const state = oldSaveBase();
  state.shadowArmy.shadows = [
    legacyShadow("igris", { level: 1, xp: 0 }),
    { ...legacyShadow("vaelin"), namedId: "vaelin", level: 8, xp: 100 },
  ];
  const migrated = migrateLegacyShadowIdentity(state);
  const vaelins = migrated.shadowArmy.shadows.filter(s => s.namedId === "vaelin");
  assert(vaelins.length === 1, "duplicate collapsed (reverse order)");
  assert(vaelins[0]?.level === 8, "higher-level copy kept (reverse order)");
}

// ── Title remap ──
assert(LEGACY_TITLE_MAP["Shadow Monarch"] === "Schattenfürst", "title map: Shadow Monarch → Schattenfürst");
assert(LEGACY_TITLE_MAP["Shadow Sovereign"] === "Soulbinder", "title map: Shadow Sovereign → Soulbinder");
{
  const migrated = migrateLegacyShadowIdentity(oldSaveBase());
  assert(migrated.selectedTitle === "Schattenfürst", "selectedTitle remapped from Shadow Monarch");
}
{
  const state = { ...oldSaveBase(), selectedTitle: "Soulbinder" };
  const migrated = migrateLegacyShadowIdentity(state);
  assert(migrated.selectedTitle === "Soulbinder", "non-legacy selectedTitle untouched");
}

// ── No-op on modern saves: returns same reference ──
{
  const modern = {
    level: 50,
    selectedTitle: "S-Rank Hunter",
    shadowArmy: { shadows: [legacyShadow("vaelin", { namedId: "vaelin", name: "Vaelin" }), regularShadow()] },
  };
  const migrated = migrateLegacyShadowIdentity(modern);
  assert(migrated === modern, "modern save passes through unchanged (same reference)");
}

// ── Defense-in-depth: unlock check itself refuses re-unlock on UNMIGRATED state ──
{
  const reunlocks = checkNamedShadowUnlocks(oldSaveBase());
  assert(!reunlocks.some(ns => ["vaelin", "xerath", "kaelen"].includes(ns.id)),
    "checkNamedShadowUnlocks treats legacy namedIds as already owned");
}

// ── Robustness: empty / missing army ──
{
  assert(migrateLegacyShadowIdentity(null) === null, "null state passes through");
  const noArmy = { level: 1 };
  assert(migrateLegacyShadowIdentity(noArmy) === noArmy, "state without shadowArmy passes through");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All shadow-migration tests passed.");
