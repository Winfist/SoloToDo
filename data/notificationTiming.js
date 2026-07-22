// notificationTiming.js — Adaptive Wunschzeiten fuer die daily_activity-Leiter
// (Spec 2026-07-23 Teil A). Liefert NUR Wunschstunden; Quiet-Hours und
// Tages-Caps setzt weiterhin ausschliesslich canFireNotification durch.

import { getBestTimeBucket } from "./hunterDossier.js";

// Heutiges Verhalten als Fallback, solange das Zeitmuster-Gate
// (10 Abschluesse) noch nicht offen ist.
export const DEFAULT_ACTIVITY_REMINDER_HOURS = [11, 14, 17];

// Anker = Beginn des Fensters, in dem dieser User erfahrungsgemaess handelt.
// Nie vor 8 (Quiet-Hours dezent/standard enden um 8), Leiter nie nach 21
// (quietStart standard = 22).
const BUCKET_ANCHOR_HOURS = { morgen: 8, mittag: 11, abend: 15, nacht: 19 };
const LADDER_STEP_HOURS = 3;
const LATEST_REMINDER_HOUR = 21;

export function getActivityReminderHours(state) {
  try {
    const best = getBestTimeBucket(state);
    const anchor = best ? BUCKET_ANCHOR_HOURS[best.bucket] : null;
    if (!Number.isInteger(anchor)) return [...DEFAULT_ACTIVITY_REMINDER_HOURS];
    const ladder = [anchor, anchor + LADDER_STEP_HOURS, anchor + 2 * LADDER_STEP_HOURS]
      .map((hour) => Math.min(hour, LATEST_REMINDER_HOUR));
    return [...new Set(ladder)];
  } catch {
    return [...DEFAULT_ACTIVITY_REMINDER_HOURS];
  }
}

// Vordergrund-Check: ab wann darf die "heute noch nichts"-Erinnerung greifen?
export function getActivityWindowStartHour(state) {
  return getActivityReminderHours(state)[0];
}
