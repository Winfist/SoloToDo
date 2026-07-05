import { generateGoalQuests, generateGoalSetupQuest, withMilestoneCompleted, GOAL_CATEGORY_TO_STAT } from "../data/goalQuests.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const goalA = { id: "gA", title: "Marathon laufen", category: "fitness", milestones: [
  { id: "mA1", title: "5 km am Stück laufen", completed: true },
  { id: "mA2", title: "10 km am Stück laufen", completed: false },
] };
const goalB = { id: "gB", title: "Spanisch lernen", category: "learning", milestones: [
  { id: "mB1", title: "Erste 100 Vokabeln", completed: false },
] };
const goalDone = { id: "gC", title: "Fertig", category: "social", milestones: [{ id: "mC1", title: "x", completed: true }] };
const base = { settings: { language: "de" }, level: 10, goals: [goalA, goalB, goalDone], quests: [], goalQuestPlanning: {} };

// Ableitung: nächster OFFENER Meilenstein, Kategorie-Mapping, Inhalt vorhanden
const r1 = generateGoalQuests(base, { limit: 1 });
check(r1.quests.length === 1, "limit 1 -> genau 1 Quest");
const q1 = r1.quests[0];
check(q1.type === "goal" && q1.isSystem === true, "Typ goal + isSystem");
check(q1.linkedGoalId && q1.linkedMilestoneId, "Verknuepfung gesetzt");
check(q1.linkedMilestoneId !== "mA1" && q1.linkedMilestoneId !== "mC1", "abgeschlossene Meilensteine nie waehlen");
check(q1.title.includes("10 km") || q1.title.includes("100 Vokabeln"), "Titel traegt Meilenstein");
check(Boolean(q1.desc && q1.desc.trim()), "desc vorhanden");
check(q1.difficulty === "normal", "Schwierigkeit normal");
check(["str", "int"].includes(q1.category), "Kategorie aus Mapping");
check(GOAL_CATEGORY_TO_STAT.fitness === "str" && GOAL_CATEGORY_TO_STAT.learning === "int", "Mapping deckungsgleich mit GoalFramework");

// Rotation: zuletzt bedientes Ziel kommt nicht sofort wieder dran
const served = { goalQuestPlanning: { lastServedByGoalId: { [q1.linkedGoalId]: "2026-07-04" } } };
const r2 = generateGoalQuests({ ...base, ...served }, { limit: 1 });
check(r2.quests[0].linkedGoalId !== q1.linkedGoalId, "Rotation bedient das andere Ziel");

// Pro-Limit 2: zwei verschiedene Ziele; bei nur 1 aktiven Ziel nur 1 Quest
const r3 = generateGoalQuests(base, { limit: 2 });
check(r3.quests.length === 2, "Pro-Limit 2 -> 2 Quests");
check(r3.quests[0].linkedGoalId !== r3.quests[1].linkedGoalId, "2 Quests aus 2 verschiedenen Zielen");
const r4 = generateGoalQuests({ ...base, goals: [goalB] }, { limit: 2 });
check(r4.quests.length === 1, "nur 1 aktives Ziel -> nur 1 Quest trotz Pro");

// Planning-State wird fortgeschrieben
check(r1.planning.lastServedByGoalId[q1.linkedGoalId], "lastServed wird gestempelt");

// Keine aktiven Ziele -> Meta-Quest
const setup = generateGoalSetupQuest({ settings: { language: "de" } });
check(setup.isGoalSetup === true && setup.type === "goal" && setup.isSystem === true, "Meta-Quest Flags");
check(Boolean(setup.desc && setup.desc.trim()) && Boolean(setup.title), "Meta-Quest hat Titel + desc");
const rEmpty = generateGoalQuests({ ...base, goals: [goalDone] }, { limit: 1 });
check(rEmpty.quests.length === 0, "keine offenen Meilensteine -> keine Ziel-Quest (Meta-Quest macht der Caller)");

// Meilenstein-Abschluss: pur, +50 XP Bonus, idempotent
const ms = withMilestoneCompleted(base, "gA", "mA2");
check(ms.completed === true && ms.xpBonus === 50, "Meilenstein abgeschlossen mit 50 XP Bonus");
const msGoal = ms.state.goals.find(g => g.id === "gA");
check(msGoal.milestones.find(m => m.id === "mA2").completed === true, "Meilenstein im State abgeschlossen");
check(ms.state.totalXpEarned === (base.totalXpEarned || 0) + 50, "XP wurden gutgeschrieben");
const msAgain = withMilestoneCompleted(ms.state, "gA", "mA2");
check(msAgain.completed === false, "idempotent: bereits abgeschlossen -> completed false, kein Doppel-Bonus");
const msMissing = withMilestoneCompleted(base, "gX", "mX");
check(msMissing.completed === false, "unbekanntes Ziel -> no-op");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ Goal-Quests: Ableitung, Rotation, Limits, Meilenstein-Abschluss korrekt");
