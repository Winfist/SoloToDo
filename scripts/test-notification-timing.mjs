import {
  DEFAULT_ACTIVITY_REMINDER_HOURS,
  getActivityReminderHours,
  getActivityWindowStartHour,
} from "../data/notificationTiming.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// completionHours-State mit dominantem Bucket bauen (Gate: 10 Abschluesse gesamt)
const bucketState = (bucket) => ({
  questSignals: { completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0, [bucket]: 12 } },
});

// ── Fallback ohne Daten: heutiges Verhalten unveraendert ──
check(eq(getActivityReminderHours({}), [11, 14, 17]), "ohne Daten -> Default 11/14/17");
check(eq(getActivityReminderHours(null), [11, 14, 17]), "null-State -> Default, wirft nicht");
check(eq(DEFAULT_ACTIVITY_REMINDER_HOURS, [11, 14, 17]), "Default-Konstante dokumentiert Ist-Verhalten");
// unter dem 10-Abschluss-Gate bleibt der Default
const underGate = { questSignals: { completionHours: { morgen: 9, mittag: 0, abend: 0, nacht: 0 } } };
check(eq(getActivityReminderHours(underGate), [11, 14, 17]), "unter Zeitmuster-Gate -> Default");

// ── Mapping-Tabelle (Spec 2026-07-23 Teil A) ──
check(eq(getActivityReminderHours(bucketState("morgen")), [8, 11, 14]), "morgen -> 8/11/14");
check(eq(getActivityReminderHours(bucketState("mittag")), [11, 14, 17]), "mittag -> 11/14/17");
check(eq(getActivityReminderHours(bucketState("abend")), [15, 18, 21]), "abend -> 15/18/21");
check(eq(getActivityReminderHours(bucketState("nacht")), [19, 21]), "nacht -> 19/21 (Deckel + dedupe)");

// ── Grenzen: nie vor 8, nie nach 21 ──
for (const bucket of ["morgen", "mittag", "abend", "nacht"]) {
  const hours = getActivityReminderHours(bucketState(bucket));
  check(hours.every((h) => h >= 8 && h <= 21), `${bucket}: alle Slots in 8-21`);
  check(hours.every((h, i) => i === 0 || h > hours[i - 1]), `${bucket}: aufsteigend eindeutig`);
}

// ── Fenster-Start fuer den Vordergrund-Check ──
check(getActivityWindowStartHour({}) === 11, "Fenster-Start Default 11");
check(getActivityWindowStartHour(bucketState("morgen")) === 8, "Fenster-Start morgen 8");
check(getActivityWindowStartHour(bucketState("nacht")) === 19, "Fenster-Start nacht 19");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-notification-timing: alles gruen");
