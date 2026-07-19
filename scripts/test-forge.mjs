import {
  DEFAULT_FORGE, createPendingSet, isPendingSetValid, clearPendingSet,
  getSelectableCount, acceptProposals,
} from "../data/forge.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const TODAY = "2026-07-18";
const proposal = (id, title) => ({
  id: `sys_ai_${id}`, title, category: "str", difficulty: "normal", type: "daily",
  isSystem: true, aiGenerated: true, subQuests: [], createdAt: TODAY, dueDate: TODAY,
});
const poolDaily = (id) => ({ id, templateId: `t_${id}`, title: `Pool ${id}`, category: "int", type: "daily", isSystem: true });

// ── createPendingSet ──
const set = createPendingSet([proposal("a", "A"), proposal("b", "B"), proposal("c", "C"), proposal("d", "D")], { source: "manual", today: TODAY, nowMs: 111 });
check(set.proposals.length === 3, "max 3 Vorschlaege");
check(set.proposals.every(p => p.origin === "forge"), "origin forge gestempelt");
check(set.date === TODAY && set.generatedAtMs === 111 && set.source === "manual", "Metadaten gesetzt");

// ── isPendingSetValid / clearPendingSet ──
const withPending = { forge: { pending: set } };
check(isPendingSetValid(withPending, TODAY) === true, "gueltig am selben Tag");
check(isPendingSetValid(withPending, "2026-07-19") === false, "ungueltig am Folgetag");
check(isPendingSetValid({}, TODAY) === false, "kein pending -> ungueltig");
check(isPendingSetValid({ forge: { pending: { ...set, proposals: [] } } }, TODAY) === false, "leere proposals -> ungueltig");
const cleared = clearPendingSet(withPending);
check(cleared.forge.pending === null, "clear leert pending");
check(clearPendingSet({}).forge.pending === null, "clear defensiv ohne forge-Feld");

// ── getSelectableCount: min(Slots, freie Dailies) ──
const baseState = {
  settings: { questIntensity: "baby_gate" }, premium: { tier: "free", status: "inactive" },
  quests: [poolDaily("p1"), poolDaily("p2")],
};
check(getSelectableCount(baseState) === 1, "Free: 1 Slot trotz 2 freier Dailies");
check(getSelectableCount({ ...baseState, quests: [] }) === 0, "keine freien Dailies -> 0");
check(getSelectableCount({ ...baseState, quests: [{ ...poolDaily("p1"), completed: true }] }) === 0, "angefasste Daily zaehlt nicht");

// ── acceptProposals ──
const acceptState = {
  ...baseState,
  quests: [poolDaily("p1"), poolDaily("p2"), { id: "own", title: "Eigene", type: "daily", isSystem: false }],
  forge: { pending: createPendingSet([proposal("a", "A"), proposal("b", "B"), proposal("c", "C")], { source: "manual", today: TODAY, nowMs: 1 }) },
};
const result = acceptProposals(acceptState, ["sys_ai_a"], { today: TODAY });
check(result.acceptedCount === 1, "genau 1 angenommen");
check(result.state.quests.some(q => q.id === "sys_ai_a" && q.origin === "forge"), "Vorschlag im Quest-Log mit origin forge");
check(result.state.quests.length === acceptState.quests.length, "Questanzahl konstant (Ersatz, nie Zusatz)");
check(result.state.quests.some(q => q.id === "own"), "eigene Quest unberuehrt");
check(result.state.forge.pending === null, "pending nach Annahme geleert");
check((result.state.questSignals?.byCategory?.str?.assigned || 0) === 1, "recordQuestsAssigned gestempelt");
check((result.state.sessionSignals?.days?.[TODAY]?.actions || 0) === 1, "recordUserAction gestempelt");
check(result.state.ai === acceptState.ai, "ai-Feld (Credits) unangetastet");

// Kappung: 2 IDs gewaehlt, aber Free-Slot = 1
const twoResult = acceptProposals(acceptState, ["sys_ai_a", "sys_ai_b"], { today: TODAY });
check(twoResult.acceptedCount === 1, "Auswahl auf getSelectableCount gekappt");

// Unbekannte IDs / leere Auswahl -> state unveraendert
const nullResult = acceptProposals(acceptState, ["nope"], { today: TODAY });
check(nullResult.acceptedCount === 0 && nullResult.state === acceptState, "unbekannte IDs -> no-op");
check(acceptProposals(acceptState, [], { today: TODAY }).state === acceptState, "leere Auswahl -> no-op");
check(acceptProposals({}, ["x"], { today: TODAY }).acceptedCount === 0, "kaputter State wirft nicht");

// ── defaultState enthaelt forge ──
import { DEFAULT_STATE } from "../data/defaultState.js";
check(JSON.stringify(DEFAULT_STATE.forge) === JSON.stringify(DEFAULT_FORGE), "DEFAULT_STATE.forge = DEFAULT_FORGE-Shape");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-forge: alles gruen");
