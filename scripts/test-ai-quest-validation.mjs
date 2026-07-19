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

// minCount: Unterlieferung faellt durch, Default bleibt tolerant
check(validateGeneratedQuests(gute, { language: "de", minCount: 3 }).reasons.includes("too-few-quests"), "1 Quest bei minCount 3 faellt durch");
check(validateGeneratedQuests(gute, { language: "de" }).ok === true, "Default minCount 1: 1 gueltige Quest passiert");

// ── Platzhalter-Subquests (Spec 2026-07-18 §2) ──
const basePlaceholderQuest = {
  title: "Geh 30 Minuten spazieren im Park",
  desc: "Du gehst eine halbe Stunde im Park spazieren. Das macht den Kopf frei und bewegt deinen Koerper.",
  doneWhen: "Fertig, wenn du 30 Minuten gegangen bist.",
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
