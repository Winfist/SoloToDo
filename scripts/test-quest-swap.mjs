import { canAutoSwapSystemQuests, swapSystemQuests, countManualForgeTargets, getSwappedQuests } from "../data/questSwap.js";

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

// Sonder-Quests (Saison, Redemption, ScreenTime, Schritte, Comeback, Starter) sind tabu
const seasonal = { id: "w1", isSystem: true, type: "weekly", isSeasonal: true, completed: false };
const redemption = { id: "r1", isSystem: true, type: "redemption", completed: false };
const screenTime = { id: "st1", isSystem: true, type: "daily", isScreenTime: true, completed: false };
const stepGoal = { id: "sg1", isSystem: true, type: "daily", isStepGoal: true, completed: false };
const comeback = { id: "cb1", isSystem: true, type: "daily", isComebackQuest: true, completed: false };
const starter = { id: "sta1", isSystem: true, type: "daily", isStarter: true, completed: false };
const specials = [seasonal, redemption, screenTime, stepGoal, comeback, starter];
const autoSpecial = swapSystemQuests([...specials, poolDaily("s1")], ai, { mode: "auto" });
for (const sq of specials) check(autoSpecial.some(q => q.id === sq.id), `auto: Sonder-Quest ${sq.id} bleibt`);
check(countManualForgeTargets([...specials, poolDaily("s1")]) === 1, "targets: Sonder-Quests zaehlen nicht");
check(canAutoSwapSystemQuests([{ ...seasonal, completed: true }, poolDaily("s1")]) === true, "auto: erledigte Saison-Quest sperrt nicht");

// ─── getSwappedQuests: muss exakt widerspiegeln, was swapSystemQuests entfernt ───

// (a) Auto: liefert genau alle Pool-Dailies, schliesst ScreenTime + Starter (und
// alle anderen Sonder-Quests) aus.
const autoSwappedList = [...specials, poolDaily("s1")];
const autoSwapped = getSwappedQuests(autoSwappedList, ai, { mode: "auto" });
check(autoSwapped.length === 1 && autoSwapped[0].id === "s1", "getSwappedQuests auto: nur Pool-Daily s1");
check(!autoSwapped.some(q => q.id === "st1"), "getSwappedQuests auto: ScreenTime-Quest ausgeschlossen");
check(!autoSwapped.some(q => q.id === "sta1"), "getSwappedQuests auto: Starter-Quest ausgeschlossen");

// (b) Manuell: angefasste Dailies (completed / completed Sub-Quest) ausgeschlossen,
// Ergebnis auf aiQuests.length gekappt.
const manualTouchedList = [
  poolDaily("m1", { completed: true }),
  poolDaily("m2", { subQuests: [{ id: "a", completed: true }] }),
  poolDaily("m3"),
  poolDaily("m4"),
  poolDaily("m5"),
  goalQuest,
];
const manualTwoSlots = ai.slice(0, 2); // 2 KI-Quests -> max 2 Slots
const manualSwapped = getSwappedQuests(manualTouchedList, manualTwoSlots, { mode: "manual" });
check(!manualSwapped.some(q => q.id === "m1"), "getSwappedQuests manual: erledigte Daily ausgeschlossen");
check(!manualSwapped.some(q => q.id === "m2"), "getSwappedQuests manual: Sub-Quest-Haken ausgeschlossen");
check(manualSwapped.length === 2, "getSwappedQuests manual: auf aiQuests.length gekappt");
check(manualSwapped.every(q => q.id === "m3" || q.id === "m4"), "getSwappedQuests manual: erste offene Slots gewaehlt (m5 gekappt)");

// (c) Deckungsgleich mit swapSystemQuests: jede von getSwappedQuests gelieferte Id
// fehlt im swapSystemQuests-Ergebnis; jede NICHT gelieferte Pool-Daily bleibt drin.
function checkCoversSwap(label, quests, aiQuests, opts) {
  const swappedIds = getSwappedQuests(quests, aiQuests, opts).map(q => q.id);
  const resultIds = new Set(swapSystemQuests(quests, aiQuests, opts).map(q => q.id));
  for (const id of swappedIds) {
    check(!resultIds.has(id), `${label}: getSwappedQuests-Id ${id} fehlt im swapSystemQuests-Ergebnis`);
  }
  for (const quest of quests.filter(isPoolDailyForTest)) {
    if (!swappedIds.includes(quest.id)) {
      check(resultIds.has(quest.id), `${label}: nicht getauschte Pool-Daily ${quest.id} bleibt erhalten`);
    }
  }
}
// Lokale Kopie des Pool-Daily-Praedikats fuer den Vergleichstest (kein Export noetig,
// die Definition muss exakt die aus questSwap.js widerspiegeln fuer diesen Check).
function isPoolDailyForTest(quest) {
  return Boolean(
    quest
    && quest.isSystem
    && quest.type === "daily"
    && !quest.isScreenTime
    && !quest.isStepGoal
    && !quest.isComebackQuest
    && !quest.isStarter
  );
}
checkCoversSwap("auto", autoSwappedList, ai, { mode: "auto" });
checkCoversSwap("manual", manualTouchedList, manualTwoSlots, { mode: "manual" });

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-quest-swap: alles gruen");
