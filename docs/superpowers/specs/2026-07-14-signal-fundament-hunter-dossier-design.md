# Signal-Fundament & Hunter-Dossier: Verhaltenssignale für Vergabe, KI und Coaching

**Datum:** 2026-07-14 (v2 nach User-Review Runde 1)
**Status:** Entwurf (wartet auf User-Review)
**Ansatz:** Direkt-Aggregation im User-State (vom User gewählt), Dossier minimal sichtbar, alle Features für Free UND Pro, plus Anti-Nerv-Schicht (v2)

## 1. Ausgangslage: Audit-Befunde

Die KI-Quest-Pipeline (Schmiede, Feedback-Chips, Fragebogen, Kristallisation) ist
sauber gebaut, aber die Personalisierung lernt nur aus einem Bruchteil des
Verhaltens:

| # | Befund | Ort |
|---|--------|-----|
| 1 | **Survivorship Bias:** Die KI sieht ausschließlich abgeschlossene Quests. Ignorierte System-Dailies werden beim Tagesreset kommentarlos gelöscht — kein Signal „3x vergeben, nie angefasst". Auch weggetauschte Schmiede-Quests hinterlassen keine Spur. | `hooks/useGameState.jsx:618`, `data/questSwap.js` |
| 2 | **Ghost-Sessions unerfasst:** App geöffnet, nichts getan — das wertvollste Frühwarnsignal — existiert nirgends. Nur `lastActiveDate` + `lastInteractionTimeMs`. | `hooks/useGameState.jsx:571` |
| 3 | **Zeitmuster doppelt tot:** `detectBestTime()` existiert fertig, wird aber nirgends aufgerufen — und seine Datenquelle `completedAtTime` wird nirgends geschrieben, nur gelesen. Wochentagsmuster werden nie ausgewertet. Die neuen Recorder stempeln die Abschlusszeit deshalb selbst (kein Feld-Nachrüsten nötig). | `components/SystemCoach.jsx:206` |
| 4 | **Kein Langzeitgedächtnis:** `buildAIQuestProfile` sieht nur die letzten 8 Abschlüsse. Kein akkumuliertes Bild („bricht Meditation ab, liebt kurze Morgen-Quests"). | `data/aiQuestProfile.js:68` |
| 5 | **Manuelle Ersetzungen laufen am Lernen vorbei:** `replaceSystemQuest` (Free 1x, Pro 4x/Tag) ist der explizite „will ich nicht"-Moment — wird aber nirgends als Präferenz erfasst. | `hooks/useGameState.jsx:1294` |
| 6 | **Kein direktes Gefallen-Feedback:** Chips gibt es nur beim Abschluss. Für Quests, die man NICHT macht (der wichtigste Fall), existiert kein Feedback-Kanal. | `data/questFeedback.js` |
| 7 | **Kein Nerv-Schutz:** Coach-Interventionen haben weder gemeinsames Tagesbudget noch Wirkungsmessung noch Backoff. Wer sie ignoriert, bekommt sie trotzdem weiter. | `components/SystemCoach.jsx` |
| 8 | **Coach-Pfad nervt schon heute strukturell (verifiziert im Review):** Der Anzeige-Effekt läuft alle 30 Min ohne jedes Tages-Dedup — dieselbe Top-Meldung feuert mehrfach täglich (habitReminder ab 20 Uhr bis zu 8x, streakDanger ab 18 Uhr im 30-Min-Takt). Zudem wird das `_setLastWeeklyPathReport`-Flag vom Aufrufer nie persistiert → `state.lastWeeklyPathReport` bleibt für immer leer und der Weekly Report feuert montags alle 30 Minuten. | `solo-leveling-v5.jsx:1010`, `components/SystemCoach.jsx:294` |

## 2. Entscheidungen (mit User geklärt, 14.07.)

1. **Richtung:** Signal-Fundament + Dossier zuerst; proaktive Mikro-Fragen
   (Block C) und Zeitbudget-Vergabe (Block D) sind bewusst Folge-Pakete.
2. **Sichtbarkeit:** Minimal — „Systemanalyse"-Block im bestehenden
   AnalyticsDashboard, kein neuer Screen.
3. **Free vs. Pro:** Alles für alle. Pro bleibt wie heute über KI-Frequenz
   (Schmiede on-demand, Auto-Kalibrierung) differenziert.
4. **Architektur:** Direkt-Aggregation (Zähler/Quoten im State, Dossier als
   reine Ableitungsfunktionen). Kein Roh-Event-Log, kein Server-Tracking,
   kein wöchentlicher KI-Call.
5. **v2-Erweiterung (Review Runde 1, alle 6 Punkte übernommen):**
   Like/Dislike mit optionaler Notiz; Ersetzungen als Signal; Interventions-
   Budget mit Wirkungsmessung und Backoff; abgeleitete Coach-Haltung statt
   neuem Setting; Ton-Regel für die Systemanalyse; Reset-Option. Leitprinzip:
   **Optional statt Pflicht, anpassen statt drängeln** — der User, der nur
   Gamification will, wird automatisch in Ruhe gelassen.

## 3. Neue State-Felder (Direkt-Aggregation)

Alle Felder leben im normalen User-State (localStorage + Firestore-Spiegel des
Users) — datenschutzfreundlich, null Serverkosten, funktioniert offline.

### 3.1 `questSignals` — Lebenslauf der Questvergabe

```js
questSignals: {
  // Nur Einträge mit templateId (Pool-Quests). Deckel: 200 Einträge,
  // bei Überlauf fliegt der älteste lastAssignedAt raus.
  byTemplate: {
    [templateId]: { assigned: 0, completed: 0, expired: 0, swapped: 0,
                    liked: 0, disliked: 0, lastAssignedAt: "YYYY-MM-DD" },
  },
  byCategory: {
    str: { assigned: 0, completed: 0, expired: 0, liked: 0, disliked: 0 },
    // int/vit/agi/cha analog
  },
  // 4 Tageszeit-Buckets, identisch zu detectBestTime: morgen 5-10,
  // mittag 10-14, abend 14-20, nacht 20-5
  completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0 },
  completionWeekdays: [0, 0, 0, 0, 0, 0, 0], // So..Sa wie Date.getDay()
  // Qualitative Mini-Listen für den Prompt (erfassen auch KI-Quests ohne templateId):
  recentExpired:  [{ title, category, date }],           // Deckel 10, neueste zuerst
  recentDisliked: [{ title, category, note, date }],     // Deckel 10; note optional, max 140 Zeichen, bereinigt
}
```

**Zählregeln:** `assigned` bei jeder Vergabe (Reset-Rollover, Schmiede-Swap
eingehend, Ersetzungs-Kandidat eingehend); `completed` bei Abschluss;
`expired` beim Tagesreset für jede offene System-Daily, die wegfällt;
`swapped` für jede durch Schmiede ODER manuelle Ersetzung entfernte Daily.
**Eine manuelle Ersetzung zählt zusätzlich als implizites `disliked`** (der
User hat aktiv „weg damit" gewählt) inkl. `recentDisliked`-Eintrag ohne Notiz;
der konservative Auto-Swap der Schmiede zählt NICHT als Dislike (nicht vom
User gewählt). Eigene User-Quests zählen nicht in `byTemplate`/
`byCategory.assigned`, wohl aber in `completionHours`/`completionWeekdays`.

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

### 3.3 `coachSignals` — Wirkung, Budget, Backoff (Anti-Nerv-Schicht)

```js
coachSignals: {
  byType: {
    // type = Interventionstyp (inactivity, streakDanger, openedButIdle, ...)
    [type]: { shown: 0, actedSameDay: 0, consecutiveIgnored: 0, mutedUntil: null },
  },
  daily: { date: "YYYY-MM-DD", coachingShown: 0, warningShown: 0 },
  pendingOutcome: [{ type, date }], // gezeigte Interventionen, Auswertung beim nächsten Rollover
}
```

- **Wirkungsmessung (Tagesgranularität, robust):** Beim Zeigen einer
  Intervention wird `{ type, date }` in `pendingOutcome` gelegt. Beim nächsten
  Tagesreset wird aufgelöst: hatte der Zeig-Tag laut `sessionSignals`
  `actions > 0` → `actedSameDay++`, `consecutiveIgnored = 0`; sonst
  `consecutiveIgnored++`.
- **Backoff:** `consecutiveIgnored >= 3` → `mutedUntil = heute + 7 Tage` für
  diesen Typ. Wer Interventionen ignoriert, bekommt sie seltener — automatisch.
- **Tagesbudget:** max. **1 Coaching-Meldung + 1 Warnung pro Tag** (Feiern/
  Celebrations sind ausgenommen — positive Momente werden nie gedeckelt).

### 3.4 Neues Modul `data/signals.js` (pure, ohne Imports außer dateUtils)

Alle Updates als reine `state → state`-Funktionen im Stil von
`questFeedback.js` / `freeLimits.js`:

- `recordQuestsAssigned(state, quests, today)`
- `recordQuestsExpired(state, quests, today)` — füllt auch `recentExpired`
- `recordQuestCompleted(state, quest, now)` — Buckets + Wochentag + Zähler
- `recordQuestsSwapped(state, replacedQuests, today, { implicitDislike })` —
  Schmiede: `implicitDislike: false`, manuelle Ersetzung: `true`
- `recordQuestLiked(state, quest)` / `recordQuestDisliked(state, quest, note)`
- `recordAppOpen(state, today)` / `recordUserAction(state, today)`
- `recordInterventionShown(state, type, kind, today)` — pflegt Budget + pending
- `resolveInterventionOutcomes(state, today)` — läuft im Tagesreset

Alle Funktionen defensiv (fehlende Felder = Default, nie werfen — sie laufen
im Boot-Pfad).

## 4. Erfassungspunkte (alles bestehende Code-Stellen, keine neuen Pfade)

| Signal | Ort | Detail |
|--------|-----|--------|
| Verfallen | `hooks/useGameState.jsx` Tagesreset, VOR dem `shouldRetainQuestAtReset`-Filter (Z. ~618) | Alle offenen System-Dailies des Vortags → `recordQuestsExpired`; danach `resolveInterventionOutcomes` |
| Vergeben | direkt nach `generateDailySystemQuests`/Goal-Quests im Reset; Schmiede-Swap; Ersetzungs-Flow | `recordQuestsAssigned` |
| Abschluss | `hooks/questActions.js` Abschlusspfad (dort, wo `dailyQuestCompletionCount` hochzählt) | `recordQuestCompleted` + `recordUserAction` |
| Schmiede-Swap | Aufrufer von `swapSystemQuests` (auto + manuell) | `recordQuestsSwapped` (kein Dislike) |
| Manuelle Ersetzung | `replaceSystemQuest` (`hooks/useGameState.jsx:1294`) | `recordQuestsSwapped` mit `implicitDislike: true` |
| Like/Dislike | neues UI im `QuestDetailModal` (Abschnitt 6) | `recordQuestLiked` / `recordQuestDisliked` |
| App-Start | Boot-Effekt `useGameState` (Z. ~571, wo `lastInteractionTimeMs` gestempelt wird) | `recordAppOpen` |
| Aktionen | Quest-Erstellung, Sub-Quest-Toggle, Habit-Toggle, Dungeon-Start | `recordUserAction` (simples +1 pro Handlung) |
| Intervention gezeigt | `SystemCoach`-Anzeigepfad | `recordInterventionShown` |

## 5. Dossier: `data/hunterDossier.js` (reine Selektoren)

Kein gespeichertes Dokument — Ableitungen über die Aggregate, jede mit
Mindestdaten-Gate (liefert sonst `null`):

| Selektor | Logik | Gate |
|----------|-------|------|
| `getBestTimeBucket(state)` | größter `completionHours`-Bucket (ersetzt das ungenutzte `detectBestTime`) | ≥ 10 Abschlüsse |
| `getAvoidedCategories(state)` | `completed/assigned < 0.25` ODER `netDislikes ≥ 2` | ≥ 5 assigned je Kategorie (Dislike-Pfad: ohne Gate) |
| `getReliableCategories(state)` | `completed/assigned > 0.75` | ≥ 5 assigned je Kategorie |
| `getLikedCategories(state)` | `netLikes ≥ 2` (likes − dislikes) | — |
| `getGhostStats(state)` | Ghost-Tage / Tage mit Daten in den letzten 14 | ≥ 7 Tage Daten |
| `getWeakestWeekday(state)` | kleinster `completionWeekdays`-Eintrag | ≥ 10 Abschlüsse |
| `getTemplateCooldowns(state, now)` | Templates mit (`assigned ≥ 3 && completed === 0`) ODER `disliked ≥ 1`, jeweils < 14 Tage her → gesperrt | — |
| `getCoachPosture(state)` | `"struggling"` (Ghost-Rate ≥ 40 % ODER System-Quest-Quote < 30 %), `"cruising"` (Streak ≥ 7 UND Quote > 70 %), sonst `"neutral"` | struggling/cruising erst ab ≥ 7 Tagen Daten bzw. ≥ 10 assigned |
| `getDossierSummary(state)` | kompaktes Objekt aus allem Obigen für Prompt + UI | — |

Die Haltung (`posture`) ist **rein intern** — sie wird dem User niemals als
Label gezeigt, sie moduliert nur Ton und Menge (Abschnitt 9).

## 6. Like/Dislike mit optionaler Notiz (User-Wunsch)

**Platzierung:** `components/QuestDetailModal.jsx`, nur für offene System-/
KI-Quests (eigene Quests bewerten sich nicht selbst). Zwei dezente
Ghost-Buttons (Daumen hoch/runter) im NEXUS-Stil — kein Modal, keine Pflicht.

- **Like:** 1 Tap → kurzer Toast („Das System merkt sich das."), Zähler hoch,
  fertig. Erneuter Tap nimmt es zurück.
- **Dislike:** 1 Tap → Zähler hoch + darunter erscheint eine **optionale**
  Inline-Zeile mit zwei Angeboten: **[Ersetzen]** (nur wenn das bestehende
  Ersetzungs-Limit noch Luft hat — nutzt den vorhandenen
  `getReplacementCandidates`/`replaceSystemQuest`-Flow, kein KI-Call) und
  **[Notiz]** (Freitext, max. 140 Zeichen, bereinigt via `cleanText`). Modal
  einfach schließen ist jederzeit okay — nichts blockiert, nichts ist Pflicht.
- **Konsequenzen eines Dislikes:** Template sofort 14 Tage Cooldown,
  Kategorie-Zähler hoch, `recentDisliked`-Eintrag (mit Notiz, falls vorhanden).

**Bewusst NICHT:** Like/Dislike auf abgeschlossenen Quests (dort gibt es
bereits die Feedback-Chips — kein Doppel-UI) und keine Pflicht-Abfragen.

## 7. KI-Anbindung

1. **Client:** `buildAIQuestProfile` (`data/aiQuestProfile.js`) bekommt ein
   neues Feld `behaviorSignals`:
   ```js
   behaviorSignals: {
     bestTime: "morgen" | null,
     categoryCompletionRates: { str: 0.4, ... }, // nur Kategorien mit ≥5 assigned
     avoidCategories: ["vit"],
     reliableCategories: ["int"],
     likedCategories: ["cha"],
     ghostDaysLast14: 3,
     recentExpiredTitles: ["…"],   // max 5
     recentDislikedTitles: ["…"],  // max 5
     userNotes: ["…"],             // max 3, neueste zuerst, je ≤140 Zeichen
   }
   ```
2. **Server:** `sanitizeAIQuestProfile` (`functions/aiQuestProfile.js`)
   spiegelt das Feld (Whitelist-Werte, Clamps, Text-Limits wie gehabt —
   `userNotes` läuft durch dieselbe Untrusted-Data-Härtung wie alles andere).
3. **Prompt:** `GENERATE_QUESTS_PROMPT` (`functions/geminiPrompts.js`) bekommt
   vier neue Regeln (de + en):
   - Quests aus `recentDislikedTitles`/`recentExpiredTitles` oder mit Kategorie
     in `avoidCategories` nicht in gleicher Form wiederholen; stattdessen
     leichtere/kürzere Varianten anbieten.
   - `userNotes` sind nach dem Fragebogen die **stärkste Präferenzquelle** —
     konkrete Wünsche darin haben Vorrang vor abgeleiteten Mustern.
   - Wenn `bestTime` gesetzt ist, mindestens 1 Quest so formulieren, dass sie
     in dieses Zeitfenster passt.
   - `ghostDaysLast14 ≥ 3` → mindestens 1 Quest mit Einstiegshürde ≤ 10 Minuten.

## 8. Regelbasierte Vergabe (Free profitiert sofort)

In `data/questPoolWeighting.js` + `data/helpers.js`:

1. **Dämpfung gemiedener Kategorien:** `computeCategoryWeights` halbiert das
   Gewicht von `avoidCategories` (Floor 0.25 wie bei „less"-Feedback);
   `likedCategories` bekommen +1 (wie „more"-Feedback).
2. **Defizit-Quest bleibt unangetastet:** Der schwächste Stat bekommt weiter
   seine 1.5x-XP-Quest — sonst optimiert sich das System in die Komfortzone.
   Ist die Defizit-Kategorie zugleich gemieden, wird im Defizit-Pool
   `difficulty === "easy"` bevorzugt (Schwierigkeits-Stepdown statt Verzicht).
3. **Template-Cooldown:** `generateDailySystemQuests` filtert Templates aus
   `getTemplateCooldowns` aus dem `validPool` (3x vergeben + 0x erledigt ODER
   1x disliked → 14 Tage Pause).
4. **Ersetzungs-Kandidaten lernen mit:** `getReplacementCandidates`
   (`hooks/useGameState.jsx:1245`) schließt Cooldown-Templates aus und
   bevorzugt beim Auffüllen `likedCategories` — sonst bietet ausgerechnet der
   Dislike-Ersetzen-Flow gesperrte oder ungeliebte Kandidaten an.

## 9. Coach-Policy: anpassen statt drängeln

Neues pures Modul `data/coachPolicy.js`, angewendet im bestehenden
Anzeige-Effekt (`solo-leveling-v5.jsx:1010–1027`, `checkCoach`). Der Effekt
persistiert künftig `coachSignals` nach jedem gezeigten Push — heute
persistiert er gar nichts, weshalb auch der Weekly-Report-Bug aus Befund 8
existiert; die Policy behebt ihn nebenbei. Da die Anzeige nur `lines[0]` als
Toast zeigt, müssen sanfte Textvarianten immer die ERSTE Zeile betreffen.

1. **Budget:** pro Tag max. 1 Meldung vom Typ „coaching" + 1 vom Typ
   „warning". Celebrations sind immer erlaubt. `streakDanger` zählt als
   Warnung (der wertvollste Push bleibt also erhalten). Weil das Budget über
   `coachSignals.daily` persistiert ist, ist damit auch das
   30-Minuten-Re-Fire (Befund 8) behoben: Was gezeigt wurde, ist für den Tag
   verbraucht.
2. **Mute/Backoff:** Interventionstypen mit aktivem `mutedUntil` werden
   gefiltert (Abschnitt 3.3). Celebrations sind nie mutebar.
3. **Haltungs-Modulation** (`getCoachPosture`):
   - `struggling`: „coaching"-Meldungen nutzen sanfte Textvarianten (i18n-
     Alternativkeys, z.B. `systemCoach.imbalanceTitleSoft`), Imbalance-Warnung
     entfällt ganz (wer kämpft, braucht keine Anklagen obendrauf), jede
     Meldung endet mit einem Mini-Einstieg („Eine Quest. Fünf Minuten.").
   - `cruising`: proaktives Coaching entfällt komplett — nur Celebrations,
     Weekly Path Report und streakDanger. Das System hält die Klappe, wenn es
     läuft.
   - `neutral`: Verhalten wie heute, nur mit Budget + Backoff.
4. **Neuer Check `openedButIdle`:** heute `opens ≥ 3 && actions === 0` →
   kühler Mikro-Push („Das System registriert Beobachtung ohne Handlung.
   Eine Quest. Fünf Minuten."), Typ „coaching", max. 1x/Tag, unterliegt
   Budget + Backoff wie alles andere.

## 10. Systemanalyse-Block (UI, minimal)

Im bestehenden `components/AnalyticsDashboard.jsx`, ein Block „SYSTEMANALYSE"
im NEXUS-Ton, 3–4 Zeilen, nur Zeilen mit erfülltem Daten-Gate.

**Ton-Regel (verbindlich):** Jede Beobachtung wird IMMER mit der Anpassung des
Systems gepaart — nie nackte Kritik. Die Ghost-Zeile steht nie an erster
Stelle und ist neutral formuliert:

- „Beste Aktivzeit: morgens — 62 % deiner Abschlüsse."
- „Zuverlässig: INT (89 % erledigt)."
- „VIT-Quests bleiben oft liegen (2 von 11). **Das System vergibt hier jetzt
  kürzere Einstiege.**"
- „Beobachtung ohne Handlung: 4 von 14 Tagen. **Das System reduziert seine
  Rufe.**" (nur bei ≥ 3 Ghost-Tagen)

Unterhalb des Gates: einzelne Zeile „Das System sammelt noch Daten." i18n in
`de.js`/`en.js` — de.js mit echten Umlauten (Sweep-Konvention seit 10.06.).
Kein neuer Screen, kein KI-Call für die Texte (reine Templates).

## 11. Kontrolle: Reset-Option

In `components/SettingsView.jsx` ein Eintrag „Systemanalyse zurücksetzen"
(mit Bestätigungs-Dialog): setzt `questSignals`, `sessionSignals` und
`coachSignals` auf Defaults zurück. Gibt dem User Souveränität über sein
Verhaltensprofil und nimmt dem Sammeln den Creepy-Faktor. Feedback-Chips und
`completedQuests` bleiben unberührt (das ist Spielfortschritt, kein Profil).

## 12. Storage, Merge, Migration

- `data/defaultState.js`: alle drei Felder mit leeren Defaults.
- `data/storage.js` (Merge-Pfad ~Z. 497/876, nutzt die vorhandenen Helfer
  `mergeNumericMaps`/`unionValues`/`mergeArrayByKey`): Zähler sind monoton →
  punktweise `Math.max` je Feld; `days`-Ringpuffer als Key-Union mit
  punktweisem `Math.max`, danach auf 14 Tage schneiden; `recentExpired`/
  `recentDisliked` vereinigt nach `title+date`, neueste zuerst, Deckel 10;
  `mutedUntil`/`lastAssignedAt` per Max; `pendingOutcome` vereinigt nach
  `type+date`.
- Ältere States ohne die Felder: Defaults greifen, kein Migrationslauf nötig.

## 13. Tests (Muster `scripts/test-*.mjs`)

- `test-signals.mjs`: alle Recorder (Zähler, Ringpuffer-Schnitt, Deckel,
  Dedupe, implizites Dislike bei Ersetzung, Notiz-Bereinigung, defensives
  Verhalten bei kaputtem State).
- `test-hunter-dossier.mjs`: Selektoren inkl. aller Gates, Posture-Grenzwerte.
- `test-coach-policy.mjs`: Budget, Mute/Backoff (3x ignoriert → 7 Tage),
  Posture-Modulation, Celebrations-Ausnahme, Outcome-Auflösung im Rollover,
  Re-Fire-Szenario (zweiter Check-Lauf am selben Tag zeigt nichts mehr).
- `test-quest-pool-weighting.mjs` erweitern: Dämpfung, Like-Boost, Stepdown,
  Cooldown (inkl. Dislike-Pfad).
- `test-state-merge.mjs` erweitern: Max-Merge aller drei Felder.
- `test-ai-quest-profile.mjs` + `test-gemini-prompts.mjs` erweitern:
  `behaviorSignals` client- und serverseitig, `userNotes`-Härtung,
  neue Prompt-Regeln enthalten.

## 14. Bewusst NICHT im Scope (YAGNI)

- Proaktive Mikro-FRAGEN (Block C: „Was blockiert dich?" mit 1-Tap-Antworten)
  — Like/Dislike ist passiv-optional, Block C ist aktiv-fragend und kommt
  erst, wenn dieses Fundament Daten liefert.
- Zeitbudget-bewusste Pool-Vergabe (Block D) — Pool-Templates haben kein
  Minutenfeld; lohnt erst mit eigenem Paket.
- Wöchentlicher KI-Verdichtungs-Call / NEXUS-Prosa-Dossier.
- Serverseitiges Tracking, Kohorten-Analysen.
- Like/Dislike auf eigenen oder abgeschlossenen Quests (Chips decken den
  Abschluss-Moment bereits ab).
- Intraday-Sessiongenauigkeit (visibilitychange/Resume) — Tagesgranularität
  reicht für alle geplanten Muster; iOS-WebView-Events sind unzuverlässig.

## 15. Risiken & offene Punkte

- **Privacy-Label:** Öffnungszähler bleiben im eigenen User-Dokument; Firebase
  Analytics erfasst App-Starts ohnehin. Beim Label-Finalisieren (Launch-Doc
  `docs/app-store-privacy-label.md`) einmal gegenprüfen, dass „Nutzungsdaten,
  mit Account verknüpft" bereits deklariert ist.
- **PROD-Functions veraltet:** Die Prompt-Erweiterung (Abschnitt 7) wird erst
  live wirksam, wenn das ausstehende Functions-Deploy passiert ist. Client-
  und Vergabe-Teile (Abschnitte 3–6, 8–11) wirken sofort nach Web-Deploy.
- **State-Größe:** Deckel (200 Templates, 14 Tage, 2x10 Titel, wenige
  Interventionstypen) halten den Zuwachs bei wenigen KB.
- **Doppel-Signal-Gefahr:** Ersetzung erzeugt Dislike + Swap + Assign (neuer
  Kandidat). Die Recorder müssen idempotent pro Aufruf sein und der
  Ersetzungs-Flow ruft jeden Recorder genau einmal — Testfall in
  `test-signals.mjs`.
