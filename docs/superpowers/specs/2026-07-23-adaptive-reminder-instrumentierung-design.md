# Adaptive Erinnerungszeit + Lösch-Instrumentierung — Design

**Datum:** 2026-07-23
**Kontext:** Folge-Paket der Schwächen-Analyse vom 22.07. Zwei Befunde: (1) Die
Tages-Erinnerungen feuern für jeden User zur selben harten Uhrzeit (11/14/17),
obwohl `questSignals.completionHours` längst weiß, wann *dieser* User handelt.
(2) Der neue Lösch-Interzept ist komplett unvermessen — Klassifikation und
Chip-Antworten erzeugen kein einziges Analytics-Event.

## Teil A: Adaptive Tages-Erinnerungen

**Prinzip:** Das System ruft, wenn der User erfahrungsgemäß handelt — nicht zur
Standard-Uhrzeit. Datenquelle ist `getBestTimeBucket(state)` (hunterDossier;
liefert `morgen|mittag|abend|nacht` erst ab 10 Abschlüssen, sonst `null`).

**Scope: nur die `daily_activity`-Leiter** („heute noch nichts gemacht", 3
Stufen). Streak-Schutz, Habit-Nudge etc. bleiben unverändert — deren Semantik
ist tageszeitgebunden, nicht nutzergebunden. V2-Kandidaten, kein Teil dieses Pakets.

**Mapping** (neues Modul `data/notificationTiming.js`, pur, testbar):

| bestTime-Bucket | Anker | Leiter (+3h/+6h, Deckel 21, dedupe) |
|---|---|---|
| ohne Daten (`null`) | — | 11 / 14 / 17 (heutiges Verhalten, unverändert) |
| morgen (5–10) | 8 | 8 / 11 / 14 |
| mittag (10–14) | 11 | 11 / 14 / 17 |
| abend (14–20) | 15 | 15 / 18 / 21 |
| nacht (20–5) | 19 | 19 / 21 |

- Anker nie vor 8 (Rücksicht + Quiet-Hours dezent/standard enden um 8),
  Leiter nie nach 21 (quietStart standard = 22).
- Quiet-Hours/Caps werden weiterhin ausschließlich von `canFireNotification`
  durchgesetzt — dieses Modul liefert nur Wunschzeiten.

**Verdrahtung (`NotificationManager.jsx`):**
- `checkDailyActivity` (Vordergrund): Fenster beginnt bei `hours[0]` statt fix 11.
- `scheduleBackgroundNotifications` (Capacitor): die drei `daily_activity`-Slots
  nutzen die adaptiven Stunden. Text wird **per Stunde** gewählt (vor 13 Uhr
  „noch nichts", vor 17 Uhr „keine Quest", ab 17 „Tag endet") — nicht per
  Leiter-Index, sonst bekäme ein Morgen-User um 14 Uhr den „Tag endet"-Text.

## Teil B: Lösch-Instrumentierung

Zwei neue Events in der Analytics-Allowlist (`analyticsPolicy.js`) — bewusst
ohne Titel/IDs, nur Enums/Zahlen wie alle bestehenden Schemas:

- `quest_delete_classified`: `delete_signal` (content|duplicate|prune),
  `category`, `difficulty`, `origin` — gefeuert in `deleteQuest` bei jeder
  klassifizierten System-/KI-Löschung.
- `delete_feedback_chip`: `chip_action` (not_interested|already_done),
  `delete_signal` — gefeuert in `resolveDeleteFeedback` beim Chip-Tipp.

Damit sind die Spec-Erfolgskriterien vom 22.07. messbar: Verhältnis
content/duplicate/prune zeigt, ob User aus Desinteresse oder Überlast löschen;
Chip-Rate zeigt, ob der Toast angenommen wird.

## Tests

- Neu `scripts/test-notification-timing.mjs`: Mapping-Tabelle, Fallback ohne
  Daten, Deckel/Dedupe (nacht → 2 Slots), Anker-Grenzen 8–21, Defensivität.
- `test-analytics-privacy.mjs` erweitert: beide neuen Events lassen Sentinel-
  Felder (Titel, IDs) fallen und akzeptieren nur Enum-Werte.

## Nicht-Ziele

- Kein Umbau von Streak-/Habit-/Deadline-Timing (V2).
- Keine serverseitige Push-Logik (FCM) — nur lokale Scheduling-Pfade.
- Kein neues Setting: adaptive Zeit ist Verhalten des gewählten Presets,
  abschaltbar über die bestehenden Preset-Stufen.
