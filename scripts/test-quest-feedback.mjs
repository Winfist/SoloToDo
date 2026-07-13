import { applyQuestFeedback, FELT_DIFFICULTY, CATEGORY_FEEDBACK } from "../data/questFeedback.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const state = { completedQuests: [
  { id: "q1", title: "A", feltDifficulty: null, categoryFeedback: null },
  { id: "q2", title: "B", feltDifficulty: null, categoryFeedback: null },
] };

const after = applyQuestFeedback(state, "q1", { feltDifficulty: "too_easy" });
check(after.completedQuests[0].feltDifficulty === "too_easy", "feltDifficulty gesetzt");
check(after.completedQuests[1].feltDifficulty === null, "andere Eintraege unberuehrt");
check(after !== state, "neues State-Objekt");

const both = applyQuestFeedback(after, "q1", { categoryFeedback: "less" });
check(both.completedQuests[0].categoryFeedback === "less" && both.completedQuests[0].feltDifficulty === "too_easy", "zweites Feld ergaenzt, erstes bleibt");

check(applyQuestFeedback(state, "q1", { feltDifficulty: "nonsense" }) === state, "ungueltiger Wert -> unveraendert");
check(applyQuestFeedback(state, "missing", { feltDifficulty: "ok" }) === state, "unbekannte id -> unveraendert");
check(applyQuestFeedback(state, "q1", {}) === state, "leerer Patch -> unveraendert");
check(FELT_DIFFICULTY.includes("too_hard") && CATEGORY_FEEDBACK.includes("more"), "Token-Listen exportiert");

// Kompatibilität: Profil-Builder nimmt die Werte auf
import { buildAIQuestProfile } from "../data/aiQuestProfile.js";
const profState = { completedQuests: [{ id: "q1", title: "Lauf 5 km", category: "str", isSystem: true, feltDifficulty: "too_easy", categoryFeedback: "more" }] };
const profile = buildAIQuestProfile(profState);
check(profile.recentCompletedQuests[0].feedback.feltDifficulty === "too_easy", "Feedback fliesst ins KI-Profil");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-quest-feedback: alles gruen");
