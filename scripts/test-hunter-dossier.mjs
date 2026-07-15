import {
  getBestTimeBucket, getAvoidedCategories, getReliableCategories, getLikedCategories,
  getCategoryCompletionRates, getGhostStats, getWeakestWeekday, getTemplateCooldowns,
  getCoachPosture, getDossierSummary,
} from "../data/hunterDossier.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const cat = (assigned, completed, extra = {}) => ({ assigned, completed, expired: 0, liked: 0, disliked: 0, ...extra });

// ── Gates: leerer State liefert null/leer, wirft nie ──
check(getBestTimeBucket({}) === null, "bestTime Gate");
check(getAvoidedCategories({}).length === 0, "avoided leer");
check(getGhostStats({}) === null, "ghost Gate");
check(getCoachPosture({}) === "neutral", "posture default neutral");

// ── bestTime: 9 Abschluesse -> null, 10 -> Bucket ──
const nine = { questSignals: { completionHours: { morgen: 6, mittag: 1, abend: 1, nacht: 1 } } };
check(getBestTimeBucket(nine) === null, "unter 10 Abschluessen null");
const ten = { questSignals: { completionHours: { morgen: 7, mittag: 1, abend: 1, nacht: 1 } } };
const best = getBestTimeBucket(ten);
check(best.bucket === "morgen" && best.percent === 70, "bester Bucket + Prozent");

// ── Kategorien ──
const catState = { questSignals: { byCategory: {
  vit: cat(11, 2),                       // 18% -> gemieden
  int: cat(9, 8),                        // 89% -> zuverlaessig
  str: cat(4, 0),                        // unter Gate -> weder noch
  cha: cat(0, 0, { liked: 3, disliked: 1 }), // netLikes 2 -> liked
  agi: cat(0, 0, { disliked: 2 }),       // netDislikes 2 -> gemieden ohne assigned-Gate
} } };
check(getAvoidedCategories(catState).includes("vit") && getAvoidedCategories(catState).includes("agi"), "avoided: Quote + netDislikes");
check(!getAvoidedCategories(catState).includes("str"), "unter Gate nicht gemieden");
check(getReliableCategories(catState).includes("int"), "reliable");
check(getLikedCategories(catState).includes("cha"), "liked");
const rates = getCategoryCompletionRates(catState);
check(Math.abs(rates.vit - 0.18) < 0.01 && rates.str === undefined, "Quoten nur ab 5 assigned");

// ── Ghost ──
const days = {};
for (let i = 10; i <= 17; i++) days[`2026-07-${i}`] = { opens: 1, actions: i % 2 === 0 ? 0 : 1 };
const ghost = getGhostStats({ sessionSignals: { days } });
check(ghost.daysWithData === 8 && ghost.ghostDays === 4, "Ghost-Tage gezaehlt");
check(getGhostStats({ sessionSignals: { days: { "2026-07-15": { opens: 1, actions: 0 } } } }) === null, "unter 7 Tagen null");

// ── Wochentag ──
const wk = { questSignals: { completionWeekdays: [0, 3, 2, 1, 2, 1, 1] } };
check(getWeakestWeekday(wk) === 0, "schwaechster Wochentag");
check(getWeakestWeekday({ questSignals: { completionWeekdays: [0, 1, 1, 1, 1, 1, 1] } }) === null, "unter 10 Abschluessen null");

// ── Cooldowns ──
const cools = getTemplateCooldowns({ questSignals: { byTemplate: {
  t_ignored: { assigned: 3, completed: 0, expired: 3, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null },
  t_old:     { assigned: 5, completed: 0, expired: 5, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-06-01", lastDislikedAt: null },
  t_dislike: { assigned: 1, completed: 1, expired: 0, swapped: 0, liked: 0, disliked: 1, lastAssignedAt: "2026-07-14", lastDislikedAt: "2026-07-14" },
  t_fine:    { assigned: 3, completed: 1, expired: 2, swapped: 0, liked: 0, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null },
} } }, "2026-07-15");
check(cools.has("t_ignored") && cools.has("t_dislike"), "ignoriert + disliked gesperrt");
check(!cools.has("t_old") && !cools.has("t_fine"), "alt/erledigt nicht gesperrt");

// ── Posture ──
const struggling = { questSignals: { byCategory: { str: cat(10, 2) } }, sessionSignals: { days } };
check(getCoachPosture(struggling) === "struggling", "struggling bei niedriger Quote");
const cruisingDays = {};
for (let i = 10; i <= 17; i++) cruisingDays[`2026-07-${i}`] = { opens: 1, actions: 2 };
const cruising = { streak: 8, questSignals: { byCategory: { str: cat(10, 8) } }, sessionSignals: { days: cruisingDays } };
check(getCoachPosture(cruising) === "cruising", "cruising bei Streak+Quote");
check(getCoachPosture({ streak: 8, questSignals: { byCategory: { str: cat(4, 4) } } }) === "neutral", "unter Daten-Gate neutral");

// ── Summary ──
const summary = getDossierSummary(cruising);
check(summary.posture === "cruising" && Array.isArray(summary.reliableCategories), "Summary buendelt Selektoren");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-hunter-dossier: alles gruen");
