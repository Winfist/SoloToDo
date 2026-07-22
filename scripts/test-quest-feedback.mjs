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

// ── Loesch-Klassifikation (Spec 2026-07-22 §5.1) ──
import { classifyQuestDeletion, MAX_CONTENT_DELETES_PER_DAY } from "../data/questFeedback.js";
const TODAY = "2026-07-22";
const sysQ = (id, title, extra = {}) => ({
  id, title, category: "int", difficulty: "normal", type: "daily",
  isSystem: true, estimatedMinutes: 20, ...extra,
});

// eigene Quest -> none (kein Signal-Kandidat)
check(classifyQuestDeletion({ quests: [] }, { id: "o1", title: "Eigenes Projekt", isSystem: false }, { today: TODAY }) === "none", "eigene Quest -> none");

// gezielte Einzel-Loeschung -> content
const loneState = { quests: [sysQ("a", "Meditiere zehn Minuten")], questSignals: { recentDeleted: [] } };
check(classifyQuestDeletion(loneState, loneState.quests[0], { today: TODAY }) === "content", "Einzel-Loeschung -> content");

// inhaltlich Gleiches bleibt offen -> duplicate (kein Negativ-Signal)
const dupState = { quests: [sysQ("a", "Lies zehn Seiten im Fachbuch"), sysQ("b", "Lies zehn Seiten im Fachbuch")] };
check(classifyQuestDeletion(dupState, dupState.quests[0], { today: TODAY }) === "duplicate", "aehnliche offene Quest -> duplicate");

// ab der dritten Content-Loeschung des Tages -> prune
const todayDeletes = [
  { questId: "x", title: "Alte Quest A", date: TODAY },
  { questId: "y", title: "Alte Quest B", date: TODAY },
];
const pruneState = { quests: [sysQ("a", "Meditiere zehn Minuten")], questSignals: { recentDeleted: todayDeletes } };
check(MAX_CONTENT_DELETES_PER_DAY === 2 && classifyQuestDeletion(pruneState, pruneState.quests[0], { today: TODAY }) === "prune", "dritte Loeschung des Tages -> prune");

// gestrige Loeschungen zaehlen nicht gegen das Tageslimit
const staleDeletes = todayDeletes.map((entry) => ({ ...entry, date: "2026-07-21" }));
const staleState = { quests: [sysQ("a", "Meditiere zehn Minuten")], questSignals: { recentDeleted: staleDeletes } };
check(classifyQuestDeletion(staleState, staleState.quests[0], { today: TODAY }) === "content", "gestrige Loeschungen zaehlen nicht");

// duplicate schlaegt prune (Pruef-Reihenfolge)
const dupPruneState = { quests: dupState.quests, questSignals: { recentDeleted: todayDeletes } };
check(classifyQuestDeletion(dupPruneState, dupPruneState.quests[0], { today: TODAY }) === "duplicate", "duplicate vor prune");

// defensiv: kaputter State wirft nicht
check(typeof classifyQuestDeletion(null, sysQ("z", "Irgendwas"), { today: TODAY }) === "string", "null-State wirft nicht");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-quest-feedback: alles gruen");
