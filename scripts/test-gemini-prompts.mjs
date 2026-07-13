import prompts from "../functions/geminiPrompts.js";
import profileMod from "../functions/aiQuestProfile.js";
const { GENERATE_QUESTS_PROMPT } = prompts;
const { sanitizeGeneratedAIQuests } = profileMod;

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const stats = { str: 10, int: 5, vit: 8, agi: 3, cha: 6 };
const profile = {
  activeGoals: [{ title: "Halbmarathon", category: "fitness", nextMilestone: "10 km am Stueck" }],
  recentCompletedQuests: [{ title: "Lauf 5 km", category: "str", feedback: { feltDifficulty: "too_easy" } }],
};

const p = GENERATE_QUESTS_PROMPT(stats, 7, "agi", ["Lauf 5 km"], profile, "de");
check(p.includes("doneWhen"), "Prompt verlangt doneWhen");
check(p.includes("estimatedMinutes"), "Prompt verlangt estimatedMinutes");
check(p.includes("goalRef"), "Prompt verlangt goalRef");
check(p.includes("2-4 Saetze") || p.includes("2-4 Sätze"), "desc-Laenge 2-4 Saetze gefordert");
check(p.includes("too_easy"), "Feedback-Regeln nennen die Tokens");
check(p.includes("Halbmarathon"), "aktives Ziel steht im Prompt");
check(!p.includes("(1 Satz)"), "alte 1-Satz-Regel ist raus");

// strict-Retry verschaerft
const pStrict = GENERATE_QUESTS_PROMPT(stats, 7, "agi", [], profile, "de", { strict: true });
check(pStrict.includes("UNGUELTIG"), "strict-Variante enthaelt Verschaerfung");

// Profil-Cap: Monster-Profil wird abgeschnitten
const fat = { activeGoals: [{ title: "x".repeat(10000) }] };
const pFat = GENERATE_QUESTS_PROMPT(stats, 7, null, [], fat, "de");
check(pFat.length < 8000, "Profil-JSON ist gedeckelt (4000 Zeichen)");

// en-Variante existiert und ist englisch
const pEn = GENERATE_QUESTS_PROMPT(stats, 7, "agi", [], profile, "en");
check(pEn.includes("doneWhen") && pEn.includes("English"), "en-Prompt vorhanden");

// Sanitizer: neue Felder überleben, Fallback-Titel ist raus
const raw = [{
  title: "Geh 30 Minuten laufen", category: "str", difficulty: "normal",
  desc: "Satz eins. Satz zwei.", doneWhen: "Fertig, wenn 30 Minuten gelaufen.",
  estimatedMinutes: "30", goalRef: "Halbmarathon",
  subQuests: [{ title: "Schuhe an" }, { title: "Loslaufen" }],
}, { title: "", desc: "kaputt" }];
const clean = sanitizeGeneratedAIQuests(raw);
check(clean.length === 1, "Quest ohne Titel wird verworfen (kein 'System-Quest'-Fallback mehr)");
check(clean[0].doneWhen === "Fertig, wenn 30 Minuten gelaufen.", "doneWhen ueberlebt Sanitizer");
check(clean[0].estimatedMinutes === 30, "estimatedMinutes wird Zahl");
check(clean[0].goalRef === "Halbmarathon", "goalRef ueberlebt Sanitizer");

const { SUGGEST_GOALS_PROMPT } = prompts;
const { sanitizeQuestionnaire } = profileMod;

const questionnaire = { burningDomain: "fitness", threeMonthWish: "Endlich wieder fit sein", timeBudget: "30", blocker: "Abends keine Energie" };
const pq = SUGGEST_GOALS_PROMPT({ lifeDomains: ["fitness"] }, "de", questionnaire);
check(pq.includes("Endlich wieder fit sein"), "Fragebogen-Wunsch steht im Ziel-Prompt");
check(pq.includes("30"), "Zeitbudget steht im Ziel-Prompt");
check(pq.includes("Abends keine Energie"), "Blocker steht im Ziel-Prompt");
const pOhne = SUGGEST_GOALS_PROMPT({ lifeDomains: ["fitness"] }, "de");
check(!pOhne.includes("FRAGEBOGEN"), "ohne Fragebogen kein Fragebogen-Block");

check(sanitizeQuestionnaire({ burningDomain: "fitness", timeBudget: "30" }).timeBudget === "30", "sanitize: gueltiges Zeitbudget");
check(sanitizeQuestionnaire({ timeBudget: "999", burningDomain: "" }) === null, "sanitize: nur Muell -> null");
check(sanitizeQuestionnaire({ threeMonthWish: "x".repeat(1000) }).threeMonthWish.length <= 240, "sanitize: Freitext gedeckelt");
check(sanitizeQuestionnaire(null) === null, "sanitize: null -> null");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-gemini-prompts: alles gruen");
