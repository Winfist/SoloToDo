# Signal-Fundament & Hunter-Dossier: Verhaltenssignale für Vergabe, KI und Coaching

**Datum:** 2026-07-14
**Status:** Entwurf (wartet auf User-Review)
**Ansatz:** Direkt-Aggregation im User-State (vom User gewählt), Dossier minimal sichtbar, alle Features für Free UND Pro

## 1. Ausgangslage: Audit-Befunde

Die KI-Quest-Pipeline (Schmiede, Feedback-Chips, Fragebogen, Kristallisation) ist
sauber gebaut, aber die Personalisierung lernt nur aus einem Bruchteil des
Verhaltens:

| # | Befund | Ort |
|---|--------|-----|
| 1 | **Survivorship Bias:** Die KI sieht ausschließlich abgeschlossene Quests. Ignorierte System-Dailies werden beim Tagesreset kommentarlos gelöscht — kein Signal „3x vergeben, nie angefasst". Auch weggetauschte Schmiede-Quests hinterlassen keine Spur. | `hooks/useGameState.jsx:618`, `data/questSwap.js` |
| 2 | **Ghost-Sessions unerfasst:** App geöffnet, nichts getan — das wertvollste Frühwarnsignal — existiert nirgends. Nur `lastActiveDate` + `lastInteractionTimeMs`. | `hooks/useGameState.jsx:571` |
| 3 | **Vorhandene Daten ungenutzt:** `completedAtTime` wird gespeichert, `detectBestTime()` existiert fertig — wird aber nirgends aufgerufen. Wochentagsmuster werden nie ausgewertet. | `components/SystemCoach.jsx:206` |
| 4 | **Kein Langzeitgedächtnis:** `buildAIQuestProfile` sieht nur die letzten 8 Abschlüsse. Kein akkumuliertes Bild („bricht Meditation ab, liebt kurze Morgen-Quests"). | `data/aiQuestProfile.js:68` |

## 2. Entscheidungen (mit User geklärt, 14.07.)

1. **Richtung:** Signal-Fundament + Dossier zuerst; Mikro-Fragen (Block C) und
   Zeitbudget-Vergabe (Block D) sind bewusst Folge-Pakete.
2. **Sichtbarkeit:** Minimal — „Systemanalyse"-Block im bestehenden
   AnalyticsDashboard, kein neuer Screen.
3. **Free vs. Pro:** Alles für alle. Signale, Dossier, Analyse-Block und die
   bessere regelbasierte Vergabe gelten für Free und Pro; Pro bleibt wie heute
   über KI-Frequenz (Schmiede on-demand, Auto-Kalibrierung) differenziert.
4. **Architektur:** Direkt-Aggregation (Zähler/Quoten im State, Dossier als
   reine Ableitungsfunktionen). Kein Roh-Event-Log, kein Server-Tracking,
   kein wöchentlicher Verdichtungs-Job.

## 3. Neue State-Felder (Direkt-Aggregation)

Beide Felder leben im normalen User-State (localStorage + Firestore-Spiegel des
Users) — datenschutzfreundlich, null Serverkosten, funktioniert offline.

### 3.1 `questSignals` — Lebenslauf der Questvergabe

```js
questSignals: {
  // Nur Einträge mit templateId (Pool-Quests). Deckel: 200 Einträge,
  // bei Überlauf fliegt der älteste lastAssignedAt raus.
  byTemplate: {
    [templateId]: { assigned: 0, completed: 0, expired: 0, swapped: 0, lastAssignedAt: "YYYY-MM-DD" },
  },
  byCategory: {
    str: { assigned: 0, completed: 0, expired: 0 }, // int/vit/agi/cha analog
  },
  // 4 Tageszeit-Buckets, identisch zu detectBestTime: morgen 5-10,
  // mittag 10-14, abend 14-20, nacht 20-5
  completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0 },
  completionWeekdays: [0, 0, 0, 0, 0, 0, 0], // So..Sa wie Date.getDay()
  // Einzige qualitative Liste: letzte verfallene Quest-Titel für den Prompt.
  // Deckel 10, neueste zuerst. Erfasst auch KI-Quests (die kein templateId haben).
  recentExpired: [{ title, category, date }],
}
```

**Zählregeln:** `assigned` bei jeder Vergabe (Reset-Rollover, Schmiede-Swap
eingehend); `completed` bei Abschluss; `expired` beim Tagesreset für jede
offene System-Daily, die wegfällt; `swapped` für jede durch die Schmiede
ersetzte, unangetastete Daily. Eigene User-Quests zählen NICHT in
`byTemplate`/`byCategory.assigned` (sie werden nicht „vergeben"), wohl aber in
`completionHours`/`completionWeekdays` bei Abschluss.

### 3.2 `sessionSignals` — geöffnet, aber nichts gemacht

```js
sessionSignals: {
  // Ringpuffer: exakt die letzten 14 Kalendertage, ältere Keys werden entfernt.
  days: { "YYYY-MM-DD": { opens: 0, actions: 0 } },
}
```

- `opens`: +1 im bestehenden Boot-Effekt (`useGameState` Init).
- `actions`: +1 bei jeder „echten" Handlung: Quest abgeschlossen, Quest
  erstellt, Sub-Quest getickt, Habit getickt, Dungeon betreten.
- **Ghost-Tag** := `opens > 0 && actions === 0`.

### 3.3 Neues Modul `data/signals.js` (pure, ohne Imports außer dateUtils)

Alle Updates als reine `state → state`-Funktionen im Stil von
`questFeedback.js` / `freeLimits.js`:

- `recordQuestsAssigned(state, quests, today)`
- `recordQuestsExpired(state, quests, today)` — füllt auch `recentExpired`
- `recordQuestCompleted(state, quest, now)` — Buckets + Wochentag + Zähler
- `recordQuestsSwapped(state, replacedQuests, today)`
- `recordAppOpen(state, today)` / `recordUserAction(state, today)` — pflegen
  den 14-Tage-Ringpuffer und schneiden alte Keys ab

Alle Funktionen defensiv (fehlende Felder = Default, nie werfen — sie laufen
im Boot-Pfad).

## 4. Erfassungspunkte (alles bestehende Code-Stellen, keine neuen Pfade)

| Signal | Ort | Detail |
|--------|-----|--------|
| Verfallen | `hooks/useGameState.jsx` Tagesreset, VOR dem `shouldRetainQuestAtReset`-Filter (Z. ~618) | Alle offenen System-Dailies des Vortags → `recordQuestsExpired` |
| Vergeben | direkt nach `generateDailySystemQuests`/Goal-Quests im Reset; Schmiede-Swap-Aufrufer | `recordQuestsAssigned` |
| Abschluss | `hooks/questActions.js` Abschlusspfad (dort, wo `dailyQuestCompletionCount` hochzählt) | `recordQuestCompleted` + `recordUserAction` |
| Swap | Aufrufer von `swapSystemQuests` (auto + manuell) | `recordQuestsSwapped` für die ersetzten Dailies |
| App-Start | Boot-Effekt `useGameState` (Z. ~571, wo `lastInteractionTimeMs` gestempelt wird) | `recordAppOpen` |
| Aktionen | Quest-Erstellung, Sub-Quest-Toggle, Habit-Toggle, Dungeon-Start | `recordUserAction` (simples +1 pro Handlung) |

## 5. Dossier: `data/hunterDossier.js` (reine Selektoren)

Kein gespeichertes Dokument — Ableitungen über die Aggregate, jede mit
Mindestdaten-Gate (liefert sonst `null`):

| Selektor | Logik | Gate |
|----------|-------|------|
| `getBestTimeBucket(state)` | größter `completionHours`-Bucket (ersetzt das ungenutzte `detectBestTime`) | ≥ 10 Abschlüsse |
| `getAvoidedCategories(state)` | `completed/assigned < 0.25` | ≥ 5 assigned je Kategorie |
| `getReliableCategories(state)` | `completed/assigned > 0.75` | ≥ 5 assigned je Kategorie |
| `getGhostStats(state)` | Ghost-Tage / Tage mit Daten in den letzten 14 | ≥ 7 Tage Daten |
| `getWeakestWeekday(state)` | kleinster `completionWeekdays`-Eintrag | ≥ 10 Abschlüsse |
| `getTemplateCooldowns(state, now)` | Templates mit `assigned ≥ 3 && completed === 0` und `lastAssignedAt` < 14 Tage her → gesperrt | — |
| `getDossierSummary(state)` | kompaktes Objekt aus allem Obigen für Prompt + UI | — |

## 6. KI-Anbindung

1. **Client:** `buildAIQuestProfile` (`data/aiQuestProfile.js`) bekommt ein
   neues Feld `behaviorSignals`:
   ```js
   behaviorSignals: {
     bestTime: "morgen" | null,
     categoryCompletionRates: { str: 0.4, ... }, // nur Kategorien mit ≥5 assigned
     avoidCategories: ["vit"],
     reliableCategories: ["int"],
     ghostDaysLast14: 3,
     recentExpiredTitles: ["…"], // max 5
   }
   ```
2. **Server:** `sanitizeAIQuestProfile` (`functions/aiQuestProfile.js`)
   spiegelt das Feld (Whitelist-Werte, Clamps, Text-Limits wie gehabt).
3. **Prompt:** `GENERATE_QUESTS_PROMPT` (`functions/geminiPrompts.js`) bekommt
   drei neue Regeln (de + en):
   - Quests, deren Titel in `recentExpiredTitles` auftauchen oder deren
     Kategorie in `avoidCategories` liegt, nicht in gleicher Form wiederholen;
     stattdessen leichtere/kürzere Varianten anbieten.
   - Wenn `bestTime` gesetzt ist, mindestens 1 Quest so formulieren, dass sie
     in dieses Zeitfenster passt.
   - `ghostDaysLast14 ≥ 3` → mindestens 1 Quest mit Einstiegshürde ≤ 10 Minuten.

## 7. Regelbasierte Vergabe (Free profitiert sofort)

In `data/questPoolWeighting.js` + `data/helpers.js`:

1. **Dämpfung gemiedener Kategorien:** `computeCategoryWeights` halbiert das
   Gewicht von `avoidCategories` (Floor 0.25 wie bei „less"-Feedback).
2. **Defizit-Quest bleibt unangetastet:** Der schwächste Stat bekommt weiter
   seine 1.5x-XP-Quest — sonst optimiert sich das System in die Komfortzone.
   Ist die Defizit-Kategorie zugleich gemieden, wird im Defizit-Pool
   `difficulty === "easy"` bevorzugt (Schwierigkeits-Stepdown statt Verzicht).
3. **Template-Cooldown:** `generateDailySystemQuests` filtert Templates aus
   `getTemplateCooldowns` aus dem `validPool` (3x vergeben + 0x erledigt →
   14 Tage Pause).

## 8. Systemanalyse-Block (UI, minimal)

Im bestehenden `components/AnalyticsDashboard.jsx`, ein Block „SYSTEMANALYSE"
im NEXUS-Ton, 3–4 Zeilen, nur Zeilen mit erfülltem Daten-Gate:

- „Beste Aktivzeit: morgens — 62 % deiner Abschlüsse."
- „Zuverlässig: INT (89 % erledigt)."
- „Gemieden: VIT (2 von 11 erledigt). Das System passt die Vergabe an."
- „Beobachtung ohne Handlung: 4 von 14 Tagen." (nur bei ≥ 3 Ghost-Tagen)

Unterhalb des Gates: einzelne Zeile „Das System sammelt noch Daten." i18n in
`de.js`/`en.js` — de.js mit echten Umlauten (Sweep-Konvention seit 10.06.).
Kein neuer Screen, kein KI-Call für die Texte (reine Templates).

## 9. SystemCoach-Bonus: `openedButIdle`

Neuer Check in `components/SystemCoach.jsx`: heute `opens ≥ 3 && actions === 0`
→ kühler Mikro-Push, Priorität 2, max. 1x/Tag (Session-Key wie Status-Check):

> „Das System registriert Beobachtung ohne Handlung. Eine Quest. Fünf Minuten."

Noch keine Rückfrage-UI (Mikro-Fragen = Block C, Folge-Paket).

## 10. Storage, Merge, Migration

- `data/defaultState.js`: beide Felder mit leeren Defaults.
- `data/storage.js` (Merge-Pfad ~Z. 497/876): Zähler sind monoton →
  punktweise `Math.max` je Feld; `days`-Ringpuffer als Key-Union mit
  punktweisem `Math.max`, danach auf 14 Tage schneiden; `recentExpired`
  vereinigt nach `title+date`, neueste zuerst, Deckel 10.
- Ältere States ohne die Felder: Defaults greifen, kein Migrationslauf nötig.

## 11. Tests (Muster `scripts/test-*.mjs`)

- `test-signals.mjs`: alle Recorder (Zähler, Ringpuffer-Schnitt, Deckel,
  recentExpired-Dedupe, defensives Verhalten bei kaputtem State).
- `test-hunter-dossier.mjs`: Selektoren inkl. aller Gates und Grenzwerte.
- `test-quest-pool-weighting.mjs` erweitern: Dämpfung, Stepdown, Cooldown.
- `test-state-merge.mjs` erweitern: Max-Merge beider Felder.
- `test-ai-quest-profile.mjs` + `test-gemini-prompts.mjs` erweitern:
  `behaviorSignals` client- und serverseitig, neue Prompt-Regeln enthalten.

## 12. Bewusst NICHT im Scope (YAGNI)

- Mikro-Fragen / 1-Tap-Gründe (Block C) — braucht dieses Fundament zuerst.
- Zeitbudget-bewusste Pool-Vergabe (Block D) — Pool-Templates haben kein
  Minutenfeld; lohnt erst mit eigenem Paket.
- Wöchentlicher KI-Verdichtungs-Call / NEXUS-Prosa-Dossier.
- Serverseitiges Tracking, Kohorten-Analysen.
- Intraday-Sessiongenauigkeit (visibilitychange/Resume) — Tagesgranularität
  reicht für alle geplanten Muster; iOS-WebView-Events sind unzuverlässig.

## 13. Risiken & offene Punkte

- **Privacy-Label:** Öffnungszähler bleiben im eigenen User-Dokument; Firebase
  Analytics erfasst App-Starts ohnehin. Beim Label-Finalisieren (Launch-Doc
  `docs/app-store-privacy-label.md`) einmal gegenprüfen, dass „Nutzungsdaten,
  mit Account verknüpft" bereits deklariert ist.
- **PROD-Functions veraltet:** Die Prompt-Erweiterung (Abschnitt 6) wird erst
  live wirksam, wenn das ausstehende Functions-Deploy passiert ist. Client-
  und Vergabe-Teile (Abschnitte 3–5, 7–9) wirken sofort nach Web-Deploy.
- **State-Größe:** Deckel (200 Templates, 14 Tage, 10 Titel) halten den
  Zuwachs bei wenigen KB; `byTemplate` ist der einzige wachsende Teil und
  hart gedeckelt.
