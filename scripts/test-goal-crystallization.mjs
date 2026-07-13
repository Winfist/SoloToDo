import { getCrystallizationSuggestion, markCrystallizationChecked, declineCrystallization } from "../data/goalCrystallization.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const NOW = Date.parse("2026-07-13T12:00:00Z");
const strQuests = Array.from({ length: 6 }, (_, i) => ({ id: `q${i}`, category: "str", isSystem: false }));
const base = { completedQuests: strQuests, goals: [], goalCrystallization: {}, level: 5 };

// 6 eigene str-Quests ohne Fitness-Ziel -> Vorschlag fitness
const s1 = getCrystallizationSuggestion(base, { now: NOW });
check(s1 && s1.category === "fitness" && s1.count === 6, "6 eigene str-Quests -> Vorschlag fitness");

// Unter Level 5 nie ein Vorschlag (Goals sind noch gesperrt)
check(getCrystallizationSuggestion({ ...base, level: 4 }, { now: NOW }) === null, "unter Lv5 kein Vorschlag");

// System-Quests zaehlen nicht (nur EIGENE Aufgaben zeigen echtes Interesse)
const sysOnly = { ...base, completedQuests: strQuests.map(q => ({ ...q, isSystem: true })) };
check(getCrystallizationSuggestion(sysOnly, { now: NOW }) === null, "System-Quests zaehlen nicht");

// Aktives Fitness-Ziel -> kein Vorschlag
const withGoal = { ...base, goals: [{ category: "fitness", milestones: [{ completed: false }] }] };
check(getCrystallizationSuggestion(withGoal, { now: NOW }) === null, "aktives Ziel unterdrueckt Vorschlag");

// Unter 5 Abschluessen -> kein Vorschlag
const few = { ...base, completedQuests: strQuests.slice(0, 4) };
check(getCrystallizationSuggestion(few, { now: NOW }) === null, "unter 5 -> kein Vorschlag");

// Wochen-Drossel: frisch geprueft -> null
const checked = markCrystallizationChecked(base, { now: NOW });
check(getCrystallizationSuggestion(checked, { now: NOW + 1000 }) === null, "frisch geprueft -> gedrosselt");
check(getCrystallizationSuggestion(checked, { now: NOW + 8 * 24 * 3600 * 1000 }) !== null, "nach 8 Tagen wieder faellig");

// Ablehnung pausiert Kategorie 4 Wochen
const declined = declineCrystallization(base, "fitness", { now: NOW });
check(getCrystallizationSuggestion(declined, { now: NOW + 7 * 24 * 3600 * 1000 }) === null, "abgelehnt -> 4 Wochen Pause");
check(getCrystallizationSuggestion(declined, { now: NOW + 29 * 24 * 3600 * 1000 }) !== null, "nach 4 Wochen wieder moeglich");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-goal-crystallization: alles gruen");
