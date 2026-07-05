// Audit: Jede vom System erzeugte Quest muss Beschreibung ODER Teilaufgaben haben.
// Verhindert die Rueckkehr von "Titel ohne alles"-Quests (Paket A, Spec 2026-07-05).
import { QUEST_POOL, OPERATIONS } from "../data/questPool.js";
import { getSystemQuestPoolForLocale } from "../data/localizedQuestPool.js";
import { generateEmergencyQuest, generateChainedQuest, generateOperationStep, HIDDEN_QUESTS } from "../data/helpers.js";
import { CHARISMA_CHAINS } from "../data/charismaDungeons.js";
import { translate } from "../data/i18n.js";

let failures = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failures += 1; };
const hasContent = (q) =>
  Boolean((q.desc && String(q.desc).trim()) || (q.description && String(q.description).trim()) || (Array.isArray(q.subQuests) && q.subQuests.length > 0));

// 1. Statischer Pool (beide Locales)
for (const locale of ["de", "en"]) {
  for (const tpl of getSystemQuestPoolForLocale(locale)) {
    if (!hasContent(tpl)) fail(`Pool[${locale}] ${tpl.id || tpl.title}: kein desc/subQuests`);
  }
}
for (const tpl of QUEST_POOL) {
  if (!hasContent(tpl)) fail(`QUEST_POOL ${tpl.id}: kein desc/subQuests`);
}

// 2. Emergency (Zufallsauswahl -> 100 Ziehungen je Locale decken alle Templates ab)
for (const locale of ["de", "en"]) {
  for (let i = 0; i < 100; i += 1) {
    const q = generateEmergencyQuest(10, locale);
    if (!hasContent(q)) fail(`Emergency[${locale}] ${q.templateId}: kein desc`);
    if (!q.title || !String(q.title).trim()) fail(`Emergency[${locale}] ${q.templateId}: kein title`);
  }
}

// 3. Chained: desc-Parameter kommt an
const chained = generateChainedQuest("Basis", "str", "normal", 2, 3, "Beschreibung der Kette");
if (chained.desc !== "Beschreibung der Kette") fail("generateChainedQuest reicht desc nicht durch");

// 4. Operations: jeder Step hat desc
for (const op of OPERATIONS) {
  for (let step = 1; step <= op.steps.length; step += 1) {
    const q = generateOperationStep(op, step, "de");
    if (!q || !hasContent(q)) fail(`Operation ${op.id} Step ${step}: kein desc`);
  }
}

// 5. Charisma: jeder Step hat desc in den Daten
for (const chain of CHARISMA_CHAINS) {
  for (const step of chain.steps) {
    if (!step.desc || !String(step.desc).trim()) fail(`Charisma ${chain.id} Step ${step.step}: kein desc`);
  }
}

// 6. Hidden Achievements: Locale-Texte vollstaendig (de + en)
for (const locale of ["de", "en"]) {
  for (const hq of HIDDEN_QUESTS) {
    if (!translate(locale, `quests.hidden.${hq.id}.title`)) fail(`Hidden[${locale}] ${hq.id}: title fehlt`);
    if (!translate(locale, `quests.hidden.${hq.id}.desc`)) fail(`Hidden[${locale}] ${hq.id}: desc fehlt`);
    if (!translate(locale, `quests.hidden.${hq.id}.discoveryMsg`)) fail(`Hidden[${locale}] ${hq.id}: discoveryMsg fehlt`);
  }
}

if (failures > 0) { console.error(`${failures} Quest-Content-Verstoesse`); process.exit(1); }
console.log("✓ Quest-Content: alle Erzeuger liefern Beschreibung oder Teilaufgaben");
