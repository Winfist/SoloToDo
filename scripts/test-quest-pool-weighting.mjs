import { computeCategoryWeights, orderPoolByWeight } from "../data/questPoolWeighting.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const state = {
  lifeDomains: ["fitness"], // getFocusStats -> ["str","vit","agi"] (alle drei +2)
  stats: { str: 10, int: 1, vit: 5, agi: 5, cha: 5 }, // int = schwaechster (+1)
  goals: [{ category: "learning", milestones: [{ completed: false }] }], // -> int
  completedQuests: [
    { category: "cha", categoryFeedback: "less" },
    { category: "vit", categoryFeedback: "more" },
  ],
};

const w = computeCategoryWeights(state);
check(w.str > 1, "Lebensbereich fitness boostet str");
check(w.int > w.agi, "aktives Lern-Ziel + schwaechster Stat boosten int");
check(w.cha < 1, "'weniger davon'-Feedback senkt cha unter Basis");
check(w.vit > w.agi, "'mehr davon'-Feedback hebt vit");

// Abgeschlossenes Ziel boostet nicht
const done = computeCategoryWeights({ ...state, goals: [{ category: "learning", milestones: [{ completed: true }] }] });
check(done.int < w.int, "abgeschlossenes Ziel boostet nicht mehr");

// Deterministische Ordnung mit fixem rng: hohe Gewichte zuerst
const pool = [
  { id: "a", category: "cha" }, { id: "b", category: "str" },
  { id: "c", category: "int" }, { id: "d", category: "agi" },
];
const ordered = orderPoolByWeight(pool, w, () => 0.5);
check(ordered[0].category !== "cha", "cha (abgewertet) steht nicht vorn");
check(["str", "int"].includes(ordered[0].category), "geboostete Kategorie steht vorn");
check(orderPoolByWeight([], w).length === 0, "leerer Pool bleibt leer");

// ── Dossier-Integration: avoided halbiert, liked +1 ──
const sigWeights = computeCategoryWeights({
  questSignals: { byCategory: {
    vit: { assigned: 10, completed: 1, expired: 9, liked: 0, disliked: 0 }, // 10% -> gemieden
    cha: { assigned: 0, completed: 0, expired: 0, liked: 2, disliked: 0 },  // netLikes 2 -> liked
  } },
});
check(sigWeights.vit === Math.max(0.25, 1 * 0.5), "gemiedene Kategorie halbiert (Floor 0.25)");
check(sigWeights.cha === 2, "liked Kategorie +1");

// ── Template-Cooldown filtert den Pool ──
import { generateDailySystemQuests } from "../data/helpers.js";
const poolProbe = generateDailySystemQuests(3, { level: 1, stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 } });
check(poolProbe.length > 0 && poolProbe[0].templateId, "Basisvergabe liefert templateIds");
const blockedId = poolProbe[0].templateId;
const blockedState = {
  level: 1, stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 },
  questSignals: { byTemplate: { [blockedId]: {
    assigned: 3, completed: 0, expired: 3, swapped: 0, liked: 0, disliked: 0,
    lastAssignedAt: new Date().toISOString().slice(0, 10), lastDislikedAt: null,
  } } },
};
for (let i = 0; i < 15; i++) {
  const roll = generateDailySystemQuests(4, blockedState);
  check(!roll.some(q => q.templateId === blockedId), `Cooldown-Template nie vergeben (Lauf ${i})`);
}

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-quest-pool-weighting: alles gruen");
