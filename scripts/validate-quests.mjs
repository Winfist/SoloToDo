import { QUEST_POOL } from "../data/questPool.js";
import { localizeQuestTemplate } from "../data/localizedQuestPool.js";
import { de } from "../data/locales/de.js";
import { en } from "../data/locales/en.js";

const CATS = ["str", "int", "vit", "agi", "cha"];
const DIFFS = ["easy", "normal", "hard", "boss"];
// Target minimums after expansion (start: red, after content: green)
const MIN_PER_CAT = { str: 26, int: 26, vit: 26, agi: 26, cha: 26 };

const errors = [];
const ids = new Set();

for (const q of QUEST_POOL) {
  if (!/^qp_/.test(q.id || "")) errors.push(`Bad id: ${q.id}`);
  if (ids.has(q.id)) errors.push(`Duplicate id: ${q.id}`);
  ids.add(q.id);
  if (!CATS.includes(q.category)) errors.push(`${q.id}: bad category ${q.category}`);
  if (!DIFFS.includes(q.difficulty)) errors.push(`${q.id}: bad difficulty ${q.difficulty}`);
  if (typeof q.minLevel !== "number" || q.minLevel < 1) errors.push(`${q.id}: bad minLevel`);
  if (!String(q.desc || "").trim()) errors.push(`${q.id}: empty desc`);
  if (!Array.isArray(q.subQuests) || q.subQuests.length === 0) errors.push(`${q.id}: no subQuests`);
  else q.subQuests.forEach((s, i) => { if (!String(s.title || "").trim()) errors.push(`${q.id}: subQuest ${i} empty`); });

  // EN-Override check: localize must return non-fallback desc + same subQuest count
  const enT = localizeQuestTemplate(q, "en");
  if (!enT.desc || enT.desc.startsWith("Complete this")) errors.push(`${q.id}: missing EN override desc`);
  if ((enT.subQuests || []).length !== q.subQuests.length) errors.push(`${q.id}: EN subQuest count mismatch`);
}

const counts = Object.fromEntries(CATS.map(c => [c, QUEST_POOL.filter(q => q.category === c).length]));
for (const c of CATS) if (counts[c] < MIN_PER_CAT[c]) errors.push(`Category ${c}: ${counts[c]} < ${MIN_PER_CAT[c]}`);

// Locale parity for quest sub-namespaces
function leafPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...leafPaths(v, p));
    else out.push(p);
  }
  return out;
}
for (const ns of ["emergency", "hidden", "redemption", "seasonal", "operations"]) {
  const deNs = de.quests?.[ns] || {};
  const enNs = en.quests?.[ns] || {};
  const deP = new Set(leafPaths(deNs));
  const enP = new Set(leafPaths(enNs));
  for (const p of deP) if (!enP.has(p)) errors.push(`quests.${ns}.${p} missing in EN`);
  for (const p of enP) if (!deP.has(p)) errors.push(`quests.${ns}.${p} missing in DE`);
}

// Operations validation (if OPERATIONS export exists)
try {
  const { OPERATIONS } = await import("../data/questPool.js");
  if (OPERATIONS && Array.isArray(OPERATIONS)) {
    const opIds = new Set();
    for (const op of OPERATIONS) {
      if (!/^op_/.test(op.id || "")) errors.push(`Operation bad id: ${op.id}`);
      if (opIds.has(op.id)) errors.push(`Duplicate operation id: ${op.id}`);
      opIds.add(op.id);
      if (!CATS.includes(op.category)) errors.push(`Operation ${op.id}: bad category ${op.category}`);
      if (!Array.isArray(op.steps) || op.steps.length < 2) errors.push(`Operation ${op.id}: needs >=2 steps`);
    }
  }
} catch { /* OPERATIONS not exported yet — ok for now */ }

console.log("Pool counts:", counts);
console.log("Total quests:", QUEST_POOL.length);
if (errors.length) {
  console.error("\nERRORS:\n" + errors.map(e => " - " + e).join("\n"));
  process.exit(1);
}
console.log("\n✓ Quest validation passed");
