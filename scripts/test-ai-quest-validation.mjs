import validation from "../functions/aiQuestValidation.js";
const { validateGeneratedQuests, resolveGoalRef, matchesLanguage } = validation;

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const gute = [{
  title: "Geh 30 Minuten laufen im Freien",
  category: "str", difficulty: "normal",
  desc: "Du laeufst heute 30 Minuten in lockerem Tempo. Das zahlt direkt auf dein Ziel 'Halbmarathon' ein und staerkt deine Grundlagenausdauer.",
  doneWhen: "Fertig, wenn du 30 Minuten am Stueck gelaufen bist.",
  estimatedMinutes: 30, goalRef: "Halbmarathon",
  subQuests: [{ title: "Laufschuhe anziehen und rausgehen" }, { title: "30 Minuten laufen ohne Pause" }],
}];

// Gültige deutsche Quest passiert
const ok = validateGeneratedQuests(gute, { language: "de", activeGoalTitles: ["Halbmarathon"] });
check(ok.ok === true, "gueltige deutsche Quest passiert");

// Englischer Titel/desc fällt durch (Weekly-Warrior-Fall)
const englisch = [{ ...gute[0], title: "Weekly Warrior Challenge", desc: "Complete your weekly workout routine today. You will feel great and earn the badge for your effort." }];
const en = validateGeneratedQuests(englisch, { language: "de", activeGoalTitles: [] });
check(en.ok === false && en.reasons.includes("wrong-language"), "englische Ausgabe bei de faellt durch");

// Bei language en kein Deutsch-Check
check(matchesLanguage("Complete your weekly workout routine today.", "en") === true, "en: kein Sprach-Check");

// desc mit nur 1 Satz fällt durch
const kurz = [{ ...gute[0], desc: "Lauf einfach los." }];
check(validateGeneratedQuests(kurz, { language: "de" }).reasons.includes("desc-too-short"), "1-Satz-desc faellt durch");

// Fehlendes doneWhen fällt durch
const ohneDone = [{ ...gute[0], doneWhen: "" }];
check(validateGeneratedQuests(ohneDone, { language: "de" }).reasons.includes("missing-doneWhen"), "fehlendes doneWhen faellt durch");

// estimatedMinutes muss als ganze Zahl im produktiven Prompt-Bereich liegen
for (const estimatedMinutes of [undefined, 4, 121, 10.5, "30"]) {
  const verdict = validateGeneratedQuests([{ ...gute[0], estimatedMinutes }], { language: "de" });
  check(verdict.reasons.includes("invalid-estimated-minutes"), `ungueltige Zeit ${String(estimatedMinutes)} faellt durch`);
}
check(!validateGeneratedQuests([{ ...gute[0], estimatedMinutes: 5 }], { language: "de" }).reasons.includes("invalid-estimated-minutes"), "Zeit-Untergrenze 5 passiert");
check(!validateGeneratedQuests([{ ...gute[0], estimatedMinutes: 120 }], { language: "de" }).reasons.includes("invalid-estimated-minutes"), "Zeit-Obergrenze 120 passiert");
check(validateGeneratedQuests([{ ...gute[0], category: "fitness" }], { language: "de" }).reasons.includes("invalid-category"), "unbekannte Kategorie fällt durch");
check(validateGeneratedQuests([{ ...gute[0], difficulty: "extreme" }], { language: "de" }).reasons.includes("invalid-difficulty"), "unbekannte Schwierigkeit fällt durch");

// Doppelte Batch-Titel werden nach Case/Whitespace/Interpunktion erkannt
const duplicateTitles = [
  { ...gute[0], title: "Geh 30 Minuten laufen im Freien!" },
  { ...gute[0], title: "  GEH 30 minuten laufen im freien  " },
];
check(validateGeneratedQuests(duplicateTitles, { language: "de" }).reasons.includes("duplicate-titles"), "normalisierte Doppeltitel fallen durch");

// Exakte Wiederholung explizit abgelehnter/verfallener Titel; Varianten bleiben erlaubt
const repeatedRejected = [{ ...gute[0], title: "Meditiere zehn Minuten" }];
check(validateGeneratedQuests(repeatedRejected, {
  language: "de",
  recentDislikedTitles: ["  MEDITIERE zehn Minuten!  "],
}).reasons.includes("repeated-rejected-title"), "exakter Dislike-Titel faellt durch");
check(validateGeneratedQuests(repeatedRejected, {
  language: "de",
  recentExpiredTitles: ["Meditiere zehn Minuten."],
}).reasons.includes("repeated-rejected-title"), "exakter Expired-Titel faellt durch");
check(!validateGeneratedQuests([{ ...gute[0], title: "Meditiere fuenf Minuten" }], {
  language: "de",
  recentDislikedTitles: ["Meditiere zehn Minuten"],
}).reasons.includes("repeated-rejected-title"), "inhaltliche Variante ist keine exakte Wiederholung");

// Klar subjektive Abschlusskriterien sind nicht verifizierbar
check(validateGeneratedQuests([{ ...gute[0], doneWhen: "Fertig, wenn du dich besser fuehlst." }], {
  language: "de",
}).reasons.includes("subjective-done-when"), "subjektives doneWhen de faellt durch");
check(validateGeneratedQuests([{ ...gute[0], doneWhen: "Fertig, wenn du damit zufrieden bist." }], {
  language: "de",
}).reasons.includes("subjective-done-when"), "subjektives Zufriedenheitskriterium faellt durch");
check(validateGeneratedQuests([{
  ...gute[0],
  title: "Take a short walk",
  desc: "Walk outside at an easy pace for ten minutes. This gives you a concrete break from your desk.",
  doneWhen: "Done when you feel refreshed.",
}], { language: "en" }).reasons.includes("subjective-done-when"), "subjektives doneWhen en faellt durch");
check(!validateGeneratedQuests([{
  ...gute[0],
  title: "Measure your resting pulse",
  desc: "Sit quietly for one minute. Then measure and record your pulse for thirty seconds.",
  doneWhen: "Done when you feel your pulse for 30 seconds and record the number.",
}], { language: "en" }).reasons.includes("subjective-done-when"), "objektives englisches Feel-Kriterium bleibt erlaubt");
check(!validateGeneratedQuests(gute, { language: "de" }).reasons.includes("subjective-done-when"), "messbares doneWhen bleibt gueltig");

// Weniger als 2 subQuests fällt durch
const ohneSubs = [{ ...gute[0], subQuests: [{ title: "nur einer" }] }];
check(validateGeneratedQuests(ohneSubs, { language: "de" }).reasons.includes("missing-subQuests"), "unter 2 subQuests faellt durch");

// Leere Liste fällt durch
check(validateGeneratedQuests([], { language: "de" }).ok === false, "leere Liste faellt durch");

// goalRef-Auflösung: exakt, partiell, kein Treffer
check(resolveGoalRef("halbmarathon", ["Halbmarathon", "Spanisch lernen"]) === "Halbmarathon", "goalRef exakt (case-insensitiv)");
check(resolveGoalRef("Ziel: Halbmarathon", ["Halbmarathon"]) === "Halbmarathon", "goalRef partiell");
check(resolveGoalRef("Bitcoin Million", ["Halbmarathon"]) === null, "goalRef ohne Treffer -> null");
check(resolveGoalRef("", ["Halbmarathon"]) === null, "leerer goalRef -> null");
check(resolveGoalRef("Spanisch", ["Spanisch lernen", "Spanisch"]) === "Spanisch", "globaler Exakt-Treffer schlägt frühere Teiltreffer");
check(resolveGoalRef("Spanisch", ["Spanisch lernen", "Spanisch sprechen"]) === null, "mehrdeutige Abkürzung erzeugt keinen Zielbezug");

// minCount: Unterlieferung faellt durch, Default bleibt tolerant
check(validateGeneratedQuests(gute, { language: "de", minCount: 3 }).reasons.includes("too-few-quests"), "1 Quest bei minCount 3 faellt durch");
check(validateGeneratedQuests(gute, { language: "de" }).ok === true, "Default minCount 1: 1 gueltige Quest passiert");

const forgeBatch = [
  { ...gute[0], title: "Plane deinen Halbmarathon-Lauf", category: "str", estimatedMinutes: 30, goalRef: "Halbmarathon" },
  { ...gute[0], title: "Raeume zehn Minuten deinen Schreibtisch auf", category: "int", estimatedMinutes: 10, goalRef: null },
  { ...gute[0], title: "Bereite deine Vitalkraft-Mahlzeit vor", category: "vit", estimatedMinutes: 25, goalRef: null },
];
const forgeOptions = { language: "de", minCount: 3, activeGoalTitles: ["Halbmarathon"], requiredWeakestStat: "vit" };
check(validateGeneratedQuests(forgeBatch, forgeOptions).ok === true, "vollständiger Forge-Batch erfüllt Quick-Win, Ziel und schwächsten Stat");
check(validateGeneratedQuests(forgeBatch.map((quest) => ({ ...quest, estimatedMinutes: Math.max(20, quest.estimatedMinutes) })), forgeOptions).reasons.includes("missing-quick-win"), "Forge-Batch ohne 5-15-Minuten-Quest fällt durch");
check(validateGeneratedQuests(forgeBatch.map((quest) => ({ ...quest, goalRef: null })), forgeOptions).reasons.includes("missing-active-goal"), "Forge-Batch ohne echten Zielschritt fällt durch");
check(validateGeneratedQuests(forgeBatch.map((quest) => ({ ...quest, category: quest.category === "vit" ? "agi" : quest.category })), forgeOptions).reasons.includes("missing-weakest-stat"), "Forge-Batch ohne schwächsten Stat fällt durch");

// ── Platzhalter-Subquests (Spec 2026-07-18 §2) ──
const basePlaceholderQuest = {
  title: "Geh 30 Minuten spazieren im Park",
  desc: "Du gehst eine halbe Stunde im Park spazieren. Das macht den Kopf frei und bewegt deinen Koerper.",
  doneWhen: "Fertig, wenn du 30 Minuten gegangen bist.",
  estimatedMinutes: 30,
  category: "vit",
  difficulty: "normal",
};
const placeholderDe = { ...basePlaceholderQuest, subQuests: [{ title: "Schritt 1" }, { title: "Schritt 2" }] };
const placeholderEn = { ...basePlaceholderQuest, subQuests: [{ title: "Step 1" }, { title: "step 3." }] };
const placeholderMixed = { ...basePlaceholderQuest, subQuests: [{ title: "Jacke anziehen und losgehen" }, { title: "Schritt 2" }] };
const placeholderIdentical = { ...basePlaceholderQuest, subQuests: [{ title: "Mach es" }, { title: "  mach   ES " }] };
const realQuest = { ...basePlaceholderQuest, subQuests: [{ title: "Jacke anziehen und losgehen" }, { title: "30 Minuten im Park gehen" }] };

check(validateGeneratedQuests([placeholderDe], { language: "de" }).reasons.includes("placeholder-subquests"), "Schritt 1/2 -> placeholder-subquests");
check(validateGeneratedQuests([placeholderEn], { language: "en" }).reasons.includes("placeholder-subquests"), "Step N (case/Punkt) -> placeholder-subquests");
check(validateGeneratedQuests([placeholderMixed], { language: "de" }).reasons.includes("placeholder-subquests"), "ein Platzhalter reicht fuer Reject");
check(validateGeneratedQuests([placeholderIdentical], { language: "de" }).reasons.includes("placeholder-subquests"), "alle Titel identisch (normalisiert) -> Reject");
check(!validateGeneratedQuests([realQuest], { language: "de" }).reasons.includes("placeholder-subquests"), "echte Subquests passieren");
check(validateGeneratedQuests([realQuest], { language: "de", minCount: 1 }).ok === true, "echte Quest insgesamt ok");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-ai-quest-validation: alles gruen");
