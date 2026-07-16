// Regression test for the "zombie system quest" bug: the cross-device state
// merge (resolveStateConflict → mergeStateProgress → mergeQuests) used to
// UNION the open-quest lists, so ephemeral system quests wiped by the daily
// reset were resurrected from the stale side on every load/save cycle —
// observed live as a pile of month-old system dailies (with duplicates).
import { register } from "node:module";
register("./state-merge-loader.mjs", import.meta.url);

const { resolveStateConflict, mergeStateProgress } = await import("../data/storage.js");

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

const NOW = Date.now();
const DAY = 86400000;
const base = {
  stateVersion: 5,
  hunterName: "John", ownerUid: "u1", email: "test@test.test",
  level: 3, totalQuestsCompleted: 5, totalXpEarned: 500,
  stats: { str: 2, int: 1, vit: 0, agi: 0, cha: 0 },
  completedQuests: [{ id: "done-1", title: "Erledigt", completedAt: "2026-06-20" }],
};

// Newer state: fresh after a daily reset — old system quests wiped, one new daily.
const local = {
  ...base,
  lastInteractionTimeMs: NOW,
  quests: [
    { id: "own-shared", title: "Eigene Quest A", type: "side" },
    { id: "sys-today", title: "Frische System-Daily", type: "daily", isSystem: true, createdAt: "2026-07-04" },
  ],
};

// Older state (e.g. stale cloud copy): still carries last month's system
// dailies plus an own quest the newer device never saw.
const cloud = {
  ...base,
  lastInteractionTimeMs: NOW - 3 * DAY,
  quests: [
    { id: "own-shared", title: "Eigene Quest A", type: "side" },
    { id: "own-cloud-only", title: "Eigene Quest B (nur Cloud)", type: "side" },
    { id: "sys-june-1", title: "Solar Calibration", type: "daily", isSystem: true, createdAt: "2026-06-11" },
    { id: "sys-june-2", title: "Solar Calibration", type: "daily", isSystem: true, createdAt: "2026-06-12" },
    { id: "red-stale", title: "Alte Redemption", type: "redemption", isSystem: true, isRedemption: true },
  ],
};

const resolved = resolveStateConflict(local, cloud);
assert(resolved.source === "merged", `states with diverging progress merge (got source=${resolved.source})`);

const ids = (resolved.data?.quests || []).map(q => q.id);
assert(ids.includes("own-shared"), "shared own quest survives the merge");
assert(ids.includes("own-cloud-only"), "own quest known only to the older state survives (cross-device protection)");
assert(ids.includes("sys-today"), "the newer state's fresh system daily survives");
assert(!ids.includes("sys-june-1") && !ids.includes("sys-june-2"),
  `stale system dailies must NOT be resurrected from the older state (got: ${ids.join(", ")})`);
assert(!ids.includes("red-stale"), "stale redemption quest must NOT be resurrected");

// Reversed roles: when the CLOUD is newer, the local side's stale system
// quests must be dropped instead — the rule follows recency, not location.
const resolvedReversed = resolveStateConflict(
  { ...cloud, lastInteractionTimeMs: NOW - 5 * DAY },
  { ...local, lastInteractionTimeMs: NOW },
);
const reversedIds = (resolvedReversed.data?.quests || []).map(q => q.id);
assert(reversedIds.includes("sys-today") && !reversedIds.includes("sys-june-1"),
  "recency decides which side's system quests survive, regardless of local/cloud role");

// ── Signal-Felder: punktweises Math.max, Union, Deckel ──
// mergeStateProgress is the internal merge function resolveStateConflict
// delegates to; it is exercised directly here for tighter control over the
// signal-field fixtures than going through the full conflict-resolution gate.
const sigA = {
  questSignals: {
    byTemplate: { t1: { assigned: 3, completed: 1, expired: 2, swapped: 0, liked: 1, disliked: 0, lastAssignedAt: "2026-07-10", lastDislikedAt: null } },
    byCategory: { str: { assigned: 3, completed: 1, expired: 2, liked: 1, disliked: 0 } },
    completionHours: { morgen: 2, mittag: 0, abend: 1, nacht: 0 },
    completionWeekdays: [1, 0, 0, 0, 0, 0, 0],
    recentExpired: [{ title: "A", category: "str", date: "2026-07-10" }],
    recentDisliked: [],
  },
  sessionSignals: { days: { "2026-07-10": { opens: 2, actions: 1 } } },
  coachSignals: { byType: { inactivity: { shown: 2, actedSameDay: 1, consecutiveIgnored: 1, mutedUntil: null } }, daily: { date: "2026-07-10", coachingShown: 1, warningShown: 0 }, pendingOutcome: [{ type: "inactivity", date: "2026-07-10" }] },
};
const sigB = {
  questSignals: {
    byTemplate: { t1: { assigned: 5, completed: 1, expired: 4, swapped: 1, liked: 1, disliked: 1, lastAssignedAt: "2026-07-12", lastDislikedAt: "2026-07-12" } },
    byCategory: { str: { assigned: 5, completed: 1, expired: 4, liked: 1, disliked: 1 } },
    completionHours: { morgen: 1, mittag: 3, abend: 1, nacht: 0 },
    completionWeekdays: [0, 2, 0, 0, 0, 0, 0],
    recentExpired: [{ title: "B", category: "int", date: "2026-07-12" }],
    recentDisliked: [{ questId: "x", title: "C", category: "vit", note: "zu lang", date: "2026-07-12" }],
  },
  sessionSignals: { days: { "2026-07-10": { opens: 1, actions: 2 }, "2026-07-12": { opens: 1, actions: 0 } } },
  coachSignals: { byType: { inactivity: { shown: 3, actedSameDay: 1, consecutiveIgnored: 2, mutedUntil: "2026-07-19" } }, daily: { date: "2026-07-12", coachingShown: 1, warningShown: 1 }, pendingOutcome: [{ type: "inactivity", date: "2026-07-12" }] },
};
const mergedSig = mergeStateProgress(sigA, sigB);
assert(mergedSig.questSignals.byTemplate.t1.assigned === 5 && mergedSig.questSignals.byTemplate.t1.liked === 1, "byTemplate punktweise Max");
assert(mergedSig.questSignals.byTemplate.t1.lastAssignedAt === "2026-07-12" && mergedSig.questSignals.byTemplate.t1.lastDislikedAt === "2026-07-12", "Datums-Max");
assert(mergedSig.questSignals.completionHours.morgen === 2 && mergedSig.questSignals.completionHours.mittag === 3, "Buckets Max");
assert(mergedSig.questSignals.completionWeekdays[0] === 1 && mergedSig.questSignals.completionWeekdays[1] === 2, "Wochentage Max");
assert(mergedSig.questSignals.recentExpired.length === 2, "recentExpired Union");
assert(mergedSig.sessionSignals.days["2026-07-10"].opens === 2 && mergedSig.sessionSignals.days["2026-07-10"].actions === 2, "Session-Tage punktweise Max");
assert(mergedSig.coachSignals.byType.inactivity.mutedUntil === "2026-07-19", "mutedUntil Max");
assert(mergedSig.coachSignals.pendingOutcome.length === 2, "pendingOutcome Union");
assert(mergeStateProgress({}, sigB).questSignals.byTemplate.t1.assigned === 5, "einseitig fehlend -> uebernommen");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All state-merge tests passed.");
