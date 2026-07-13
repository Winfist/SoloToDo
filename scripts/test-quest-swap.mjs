import { canAutoSwapSystemQuests, swapSystemQuests, countManualForgeTargets } from "../data/questSwap.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const poolDaily = (id, extra = {}) => ({ id, isSystem: true, type: "daily", completed: false, ...extra });
const goalQuest = { id: "g1", isSystem: true, type: "goal", completed: false };
const customQuest = { id: "c1", isSystem: false, type: "daily", completed: false };
const ai = [{ id: "ai1", aiGenerated: true }, { id: "ai2", aiGenerated: true }, { id: "ai3", aiGenerated: true }];

// Auto: unberührtes Board -> Swap erlaubt
check(canAutoSwapSystemQuests([poolDaily("s1"), poolDaily("s2"), goalQuest, customQuest]) === true, "auto: unberuehrt -> erlaubt");
// Auto: eine Daily erledigt -> gesperrt
check(canAutoSwapSystemQuests([poolDaily("s1", { completed: true }), poolDaily("s2")]) === false, "auto: erledigte Daily sperrt");
// Auto: angehakter Sub-Quest sperrt
check(canAutoSwapSystemQuests([poolDaily("s1", { subQuests: [{ id: "a", completed: true }] })]) === false, "auto: Sub-Quest-Haken sperrt");
// Auto: erledigte Ziel-Quest sperrt NICHT
check(canAutoSwapSystemQuests([{ ...goalQuest, completed: true }, poolDaily("s1")]) === true, "auto: Ziel-Quest zaehlt nicht");

// Auto-Swap ersetzt alle Pool-Dailies, lässt Ziel + Custom stehen
const auto = swapSystemQuests([poolDaily("s1"), poolDaily("s2"), goalQuest, customQuest], ai, { mode: "auto" });
check(!auto.some(q => q.id === "s1" || q.id === "s2"), "auto: Pool-Dailies ersetzt");
check(auto.some(q => q.id === "g1") && auto.some(q => q.id === "c1"), "auto: Ziel + Custom bleiben");
check(auto.filter(q => q.aiGenerated).length === 3, "auto: alle KI-Quests drin");

// Manuell: erledigte bleiben, nur offene werden ersetzt, KI wird auf Slots gekappt
const manual = swapSystemQuests([poolDaily("s1", { completed: true }), poolDaily("s2"), goalQuest], ai, { mode: "manual" });
check(manual.some(q => q.id === "s1"), "manual: erledigte Daily bleibt");
check(!manual.some(q => q.id === "s2"), "manual: offene Daily ersetzt");
check(manual.filter(q => q.aiGenerated).length === 1, "manual: KI auf Anzahl offener Slots gekappt");
check(manual.some(q => q.id === "g1"), "manual: Ziel-Quest bleibt");

// Zähler für die Schmiede-Karte
check(countManualForgeTargets([poolDaily("s1", { completed: true }), poolDaily("s2"), goalQuest, customQuest]) === 1, "targets: nur offene Pool-Dailies");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-quest-swap: alles gruen");
