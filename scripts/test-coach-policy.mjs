import { pickCoachMessage } from "../data/coachPolicy.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const msg = (checkId, type, priority = 1) => ({ checkId, type, priority, title: checkId, lines: [checkId] });
const TODAY = "2026-07-15";

// ── Budget: 1 coaching + 1 warning pro Tag; Re-Fire am selben Tag blockiert ──
const fresh = {};
check(pickCoachMessage(fresh, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "erste Coaching-Meldung erlaubt");
const afterCoaching = { coachSignals: { byType: {}, daily: { date: TODAY, coachingShown: 1, warningShown: 0 }, pendingOutcome: [] } };
check(pickCoachMessage(afterCoaching, [msg("habitReminder", "coaching")], TODAY) === null, "zweites Coaching am selben Tag blockiert (Re-Fire-Fix)");
check(pickCoachMessage(afterCoaching, [msg("streakDanger", "warning", 3)], TODAY)?.checkId === "streakDanger", "Warnung hat eigenes Budget");
const afterBoth = { coachSignals: { byType: {}, daily: { date: TODAY, coachingShown: 1, warningShown: 1 }, pendingOutcome: [] } };
check(pickCoachMessage(afterBoth, [msg("streakDanger", "warning", 3)], TODAY) === null, "Warnbudget verbraucht");
check(pickCoachMessage(afterBoth, [msg("firstQuest", "celebration", 2)], TODAY)?.type === "celebration", "Celebrations nie gedeckelt");
// Budget von gestern zaehlt heute nicht
const yesterday = { coachSignals: { byType: {}, daily: { date: "2026-07-14", coachingShown: 1, warningShown: 1 }, pendingOutcome: [] } };
check(pickCoachMessage(yesterday, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "Budget reset am neuen Tag");

// ── Mute ──
const muted = { coachSignals: { byType: { habitReminder: { shown: 3, actedSameDay: 0, consecutiveIgnored: 3, mutedUntil: "2026-07-20" } }, daily: { date: null, coachingShown: 0, warningShown: 0 }, pendingOutcome: [] } };
check(pickCoachMessage(muted, [msg("habitReminder", "coaching")], TODAY) === null, "gemuteter Typ blockiert");
check(pickCoachMessage(muted, [msg("habitReminder", "coaching")], "2026-07-21")?.checkId === "habitReminder", "Mute laeuft ab");
check(pickCoachMessage(muted, [msg("habitReminder", "coaching"), msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "naechste erlaubte Meldung rueckt nach");

// ── Posture ──
const ghostDays = {};
for (let i = 10; i <= 17; i++) ghostDays[`2026-07-${i}`] = { opens: 1, actions: 0 };
const struggling = { sessionSignals: { days: ghostDays }, questSignals: { byCategory: {} } };
check(pickCoachMessage(struggling, [msg("imbalance", "coaching", 2)], TODAY) === null, "struggling: Imbalance entfaellt");
check(pickCoachMessage(struggling, [msg("inactivity", "coaching")], TODAY)?.checkId === "inactivity", "struggling: sanftes Coaching bleibt");
const actionDays = {};
for (let i = 10; i <= 17; i++) actionDays[`2026-07-${i}`] = { opens: 1, actions: 2 };
const cruising = { streak: 10, sessionSignals: { days: actionDays }, questSignals: { byCategory: { str: { assigned: 10, completed: 9, expired: 1, liked: 0, disliked: 0 } } } };
check(pickCoachMessage(cruising, [msg("habitReminder", "coaching")], TODAY) === null, "cruising: proaktives Coaching entfaellt");
check(pickCoachMessage(cruising, [msg("weeklyPathReport", "coaching", 2)], TODAY)?.checkId === "weeklyPathReport", "cruising: Weekly Report bleibt");
check(pickCoachMessage(cruising, [msg("streakDanger", "warning", 3)], TODAY)?.checkId === "streakDanger", "cruising: streakDanger bleibt");

// ── Defensiv ──
check(pickCoachMessage(null, null, TODAY) === null, "null-Inputs werfen nicht");
check(pickCoachMessage({}, [{ type: "coaching", lines: ["ohne checkId"] }], TODAY)?.lines[0] === "ohne checkId", "Meldung ohne checkId faellt auf Budget-only zurueck");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-coach-policy: alles gruen");
