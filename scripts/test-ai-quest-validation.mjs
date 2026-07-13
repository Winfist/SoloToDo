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

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-ai-quest-validation: alles gruen");
