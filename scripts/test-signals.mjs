import {
  DEFAULT_QUEST_SIGNALS, DEFAULT_SESSION_SIGNALS, DEFAULT_COACH_SIGNALS,
  recordQuestsAssigned, recordQuestsExpired, recordQuestCompleted, recordQuestsSwapped,
  applyQuestRating, applyDislikeNote, recordAppOpen, recordUserAction,
  recordInterventionShown, resolveInterventionOutcomes, getHourBucket,
} from "../data/signals.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

// ── Buckets ──
check(getHourBucket(6) === "morgen" && getHourBucket(11) === "mittag"
  && getHourBucket(15) === "abend" && getHourBucket(22) === "nacht" && getHourBucket(2) === "nacht", "Stunden-Buckets");

// ── Assigned / Expired ──
const q1 = { id: "a", templateId: "t_run", category: "str", title: "Lauf 30 Minuten", isSystem: true, type: "daily" };
const q2 = { id: "b", category: "int", title: "KI-Quest ohne Template", isSystem: true, type: "daily", aiGenerated: true };
let s = recordQuestsAssigned({}, [q1, q2], "2026-07-15");
check(s.questSignals.byTemplate.t_run.assigned === 1, "assigned je Template");
check(s.questSignals.byTemplate.t_run.lastAssignedAt === "2026-07-15", "lastAssignedAt gestempelt");
check(s.questSignals.byCategory.str.assigned === 1 && s.questSignals.byCategory.int.assigned === 1, "assigned je Kategorie (auch ohne templateId)");
check(!s.questSignals.byTemplate.undefined, "kein Muell-Key fuer fehlende templateId");

s = recordQuestsExpired(s, [q1, q2], "2026-07-16");
check(s.questSignals.byTemplate.t_run.expired === 1 && s.questSignals.byCategory.int.expired === 1, "expired gezaehlt");
check(s.questSignals.recentExpired.length === 2 && s.questSignals.recentExpired[0].title === "Lauf 30 Minuten", "recentExpired gefuellt, neueste zuerst");

// recentExpired-Deckel 10
let sCap = s;
for (let i = 0; i < 12; i++) sCap = recordQuestsExpired(sCap, [{ id: `x${i}`, category: "str", title: `Q${i}`, isSystem: true }], "2026-07-17");
check(sCap.questSignals.recentExpired.length === 10, "recentExpired Deckel 10");

// ── Completed: Zaehler + Zeit-Buckets + Wochentag ──
const mondayMorning = new Date("2026-07-13T07:30:00").getTime(); // Montag, 7:30
s = recordQuestCompleted(s, q1, mondayMorning);
check(s.questSignals.byTemplate.t_run.completed === 1 && s.questSignals.byCategory.str.completed === 1, "completed gezaehlt");
check(s.questSignals.completionHours.morgen === 1, "Zeit-Bucket morgen");
check(s.questSignals.completionWeekdays[1] === 1, "Wochentag Montag");
// eigene Quest: nur Buckets, keine byCategory.assigned-Verzerrung
const own = { id: "o", category: "cha", title: "Eigene Aufgabe", isSystem: false };
const sOwn = recordQuestCompleted(s, own, mondayMorning);
check(sOwn.questSignals.completionHours.morgen === 2, "eigene Quest zaehlt in Buckets");
check((sOwn.questSignals.byCategory.cha?.assigned || 0) === 0, "eigene Quest erhoeht assigned nicht");

// ── Swap: Schmiede vs. manuelle Ersetzung ──
s = recordQuestsSwapped(s, [q1], "2026-07-16");
check(s.questSignals.byTemplate.t_run.swapped === 1 && (s.questSignals.byTemplate.t_run.disliked || 0) === 0, "Schmiede-Swap ohne Dislike");
s = recordQuestsSwapped(s, [q1], "2026-07-16", { implicitDislike: true });
check(s.questSignals.byTemplate.t_run.disliked === 1 && s.questSignals.byTemplate.t_run.lastDislikedAt === "2026-07-16", "Ersetzung = implizites Dislike");
check(s.questSignals.recentDisliked[0].title === "Lauf 30 Minuten", "recentDisliked gefuellt");

// ── Rating: like/dislike/undo auf offener Quest ──
let sr = { quests: [{ ...q1 }], questSignals: undefined };
sr = applyQuestRating(sr, "a", "liked", "2026-07-15");
check(sr.quests[0].userRating === "liked" && sr.questSignals.byCategory.str.liked === 1, "Like setzt Rating + Zaehler");
sr = applyQuestRating(sr, "a", null, "2026-07-15");
check(sr.quests[0].userRating === null && sr.questSignals.byCategory.str.liked === 0, "Undo dekrementiert (Floor 0)");
sr = applyQuestRating(sr, "a", "disliked", "2026-07-15");
check(sr.questSignals.byTemplate.t_run.disliked === 1 && sr.questSignals.recentDisliked[0].questId === "a", "Dislike erzeugt recentDisliked-Eintrag");
sr = applyDislikeNote(sr, "a", "  zu   lang und " + "x".repeat(300));
check(sr.questSignals.recentDisliked[0].note.length <= 140, "Notiz bereinigt + 140-Deckel");
sr = applyQuestRating(sr, "a", null, "2026-07-15");
check(sr.questSignals.recentDisliked.length === 0, "Dislike-Undo entfernt Eintrag");

// ── Sessions ──
let ss = recordAppOpen({}, "2026-07-15");
ss = recordAppOpen(ss, "2026-07-15");
ss = recordUserAction(ss, "2026-07-15");
check(ss.sessionSignals.days["2026-07-15"].opens === 2 && ss.sessionSignals.days["2026-07-15"].actions === 1, "opens/actions gezaehlt");
// Ringpuffer: 20 Tage einspeisen -> nur 14 bleiben
let sw = {};
for (let i = 1; i <= 20; i++) sw = recordAppOpen(sw, `2026-07-${String(i).padStart(2, "0")}`);
check(Object.keys(sw.sessionSignals.days).length === 14 && !sw.sessionSignals.days["2026-07-01"], "Ringpuffer exakt 14 Tage");

// Rueckdatierter Aufruf (Geraetezeit rueckwaerts) darf neuere Tage nicht loeschen
let sBack = recordAppOpen({}, "2026-07-15");
sBack = recordAppOpen(sBack, "2026-07-10");
check(sBack.sessionSignals.days["2026-07-15"]?.opens === 1 && sBack.sessionSignals.days["2026-07-10"]?.opens === 1, "rueckdatierter Aufruf loescht neuere Tage nicht");

// ── Coach: shown/Budget-Zaehler + Outcome-Aufloesung + Backoff ──
let sc = recordInterventionShown({}, "habitReminder", "coaching", "2026-07-15");
check(sc.coachSignals.byType.habitReminder.shown === 1, "shown gezaehlt");
check(sc.coachSignals.daily.date === "2026-07-15" && sc.coachSignals.daily.coachingShown === 1, "Tagesbudget-Zaehler");
check(sc.coachSignals.pendingOutcome.length === 1, "pendingOutcome angelegt");
// Tag hatte KEINE Aktion -> ignoriert
sc = resolveInterventionOutcomes(sc, "2026-07-16");
check(sc.coachSignals.byType.habitReminder.consecutiveIgnored === 1 && sc.coachSignals.pendingOutcome.length === 0, "ignoriert aufgeloest");
// 2x weiter ignorieren -> Mute 7 Tage
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-16");
sc = resolveInterventionOutcomes(sc, "2026-07-17");
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-17");
sc = resolveInterventionOutcomes(sc, "2026-07-18");
check(sc.coachSignals.byType.habitReminder.consecutiveIgnored === 3 && sc.coachSignals.byType.habitReminder.mutedUntil === "2026-07-25", "3x ignoriert -> mutedUntil +7 Tage");
// Tag MIT Aktion -> acted, Reset
sc = recordUserAction(sc, "2026-07-26");
sc = recordInterventionShown(sc, "habitReminder", "coaching", "2026-07-26");
sc = resolveInterventionOutcomes(sc, "2026-07-27");
check(sc.coachSignals.byType.habitReminder.actedSameDay === 1 && sc.coachSignals.byType.habitReminder.consecutiveIgnored === 0, "acted setzt Ignoranz zurueck");

// ── Defensiv ──
check(recordQuestsAssigned(null, null, null), "null-State wirft nicht");
check(recordQuestCompleted({}, null, NaN), "kaputte Inputs werfen nicht");
check(applyQuestRating({}, "missing", "liked", "2026-07-15"), "unbekannte Quest wirft nicht");

// ── defaultState enthaelt die Felder ──
import { DEFAULT_STATE } from "../data/defaultState.js";
check(DEFAULT_STATE.questSignals && DEFAULT_STATE.sessionSignals && DEFAULT_STATE.coachSignals, "DEFAULT_STATE hat alle drei Felder");
check(JSON.stringify(DEFAULT_STATE.questSignals) === JSON.stringify(DEFAULT_QUEST_SIGNALS), "DEFAULT_STATE nutzt DEFAULT_QUEST_SIGNALS-Shape");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-signals: alles gruen");
