# Personalisierte KI-Quests: Schmiede, Feedback-Loop & Ziel-Findung

**Datum:** 2026-07-13
**Status:** Entwurf (wartet auf User-Review)
**Ansatz:** C — „Sichtbare Quest-Schmiede" (vom User gewählt)

## 1. Ausgangslage: Audit-Befunde

Die KI-Quest-Pipeline ist technisch verbunden, aber die Personalisierung kommt beim
User praktisch nie an:

| # | Befund | Ort |
|---|--------|-----|
| 1 | **3s-Timeout-Race**: KI gewinnt nur, wenn sie in 3 s antwortet — Cloud Function (Cold Start + Gratis-Modell + 15s-429-Retry) verliert fast immer → statische Quests. Tages-Guard wird VOR dem Versuch gesetzt → kein zweiter Versuch am selben Tag. | `data/helpers.js:329`, `solo-leveling-v5.jsx:844` |
| 2 | **Falscher Settings-Schalter**: Quest-Generierung prüft `dynamicMessagesEnabled` statt `dynamicQuestsEnabled`. Der Toggle „Dynamische Quests" ist wirkungslos. | `solo-leveling-v5.jsx:846` |
| 3 | **Feedback-Felder tot**: `feltDifficulty`, `durationFeedback`, `categoryFeedback`, `rating`, `notes` werden bei Abschluss auf `null` gesetzt, kein UI erfasst sie je. Pipeline bis in den Prompt ist verkabelt, transportiert aber immer Leere. | `hooks/questActions.js:356` |
| 4 | **Prompt verbietet gute Beschreibungen**: verlangt „Quest-Beschreibung im Nexus-Stil (1 Satz)" — Gegenteil von „so erklärt, dass keine Fragen bleiben". | `functions/geminiPrompts.js:218` |
| 5 | **Modell-Roulette**: `openrouter/free` routet zu irgendeinem Gratis-Modell; keine Kontrolle über Deutsch-Qualität („Weekly Warrior"-Effekt) oder JSON-Treue. | `functions/geminiService.js:5` |
| 6 | **Ziel-Bezug dünn**: weiche Prompt-Anweisung („mindestens 2 Quests müssen zu … passen"), kein Post-Check, ob Quests wirklich auf Ziele einzahlen. | `functions/geminiPrompts.js` |

Positiv: Sanitisierung beidseitig, Prompt-Injection-Härtung, Rate-Limiting und
Fallback-Ketten sind sauber. Das Fundament bleibt.

## 2. Entscheidungen (mit User geklärt)

1. **Modell:** Gratis bleiben (`openrouter/free`-Familie), Robustheit über
   Prompt-Härtung, Validierung, Retry und eine Prioritätenliste konkreter
   Gratis-Modelle.
2. **Free vs. Pro:** Regelbasierte Personalisierung für alle ab Tag 1; KI voll
   für Pro; Free bekommt einen täglichen „Geschmack" (1 Schmiede/Tag).
3. **Ziel-Findung:** Lv5-Ritual bekommt „Ich weiß noch nicht"-Fragebogen-Pfad;
   dazu laufende, regelbasierte Ziel-Kristallisation aus dem Verhalten.
4. **Unlock:** KI-Quests (Pro-Autoflow) sinken von Level 15 (Tier 5) auf
   **Level 5** — ab da existieren Ziele als Material. (Vom User in Block 2
   mit abgenickt.)

## 3. Zustellung reparieren (Pro-Autoflow)

- **3s-Race entfernen** (`generateDailySystemQuestsAsync`): Statische Quests
  erscheinen sofort; die KI-Generierung läuft parallel ohne künstliches
  Mini-Timeout (Client wartet bis ~45 s; Function-Timeout bleibt 120 s).
- **Late-Swap mit Inszenierung:** Kommt das Ergebnis, System-Meldung
  „Das System hat deine Quests neu kalibriert" + kurzes Aufleuchten der neuen
  Quests (kein stiller Tausch).
- **Guard erst nach Erfolg:** `sl_ai_quest_gen_date` wird erst gesetzt, wenn
  KI-Quests angekommen sind. Fehlschlag → nächster App-Start versucht erneut;
  Deckel: max. 3 Versuche/Tag (Zähler `sl_ai_quest_gen_attempts:<date>` in
  localStorage).
- **Sicherer Auto-Swap (konservativ):** Nur tauschen, wenn KEINE der heutigen
  System-Dailies abgeschlossen oder angefasst ist (kein Sub-Quest-Haken).
  Sonst Skip für heute. Ziel-Quests (`type === "goal"`) bleiben wie bisher
  unberührt.
- **Toggle-Fix:** Effect prüft `state.ai?.dynamicQuestsEnabled` (statt
  `dynamicMessagesEnabled`); `state.ai?.enabled` bleibt als Master-Schalter.

## 4. Die sichtbare Schmiede (Free-Geschmack + Pro on-demand)

Neue **„System-Analyse"-Karte** auf dem Quest-Board:

- **Free** (Earn-it wie gehabt: ab Level 3 + 5 erledigte Quests):
  **1 Schmiede-Vorgang pro Tag, ohne Lebenszeit-Deckel.** Neuer eigener
  Tages-Credit im State (`state.ai.lastForgeDate`), getrennt vom bestehenden
  interaktiven 3-Credits-Gesamtdeckel (der weiter für Ziel-Vorschläge /
  Beschreibungen gilt). Vor Level 3: gesperrter Zustand mit Fortschrittshinweis
  („Noch X Level bis zur System-Analyse").
- **Pro:** Autoflow (Abschnitt 3) + Karte jederzeit manuell („Neu schmieden"),
  serverseitig durchs bestehende Rate-Limit gedeckelt. Dasselbe Earn-it-Gate
  wie Free (Lv 3 + 5 Quests) — vorher fehlt der KI schlicht das Material.
- **Sichtbare Sequenz:** „Profil lesen → Muster erkennen → Quests schmieden" —
  dauert ehrlich so lange wie der API-Call (kein Fake-Timer, kein Abbruch-Rennen).
- **Manueller Swap (User-Absicht):** ersetzt nur **offene, unangetastete**
  System-Dailies; erledigte bleiben stehen. Keine offene System-Daily mehr →
  Karte zeigt „Heute alles erledigt — Schmiede morgen wieder verfügbar".
  (Bewusst anders als der konservative Auto-Swap: manuell = gewollt.)
- **Fehlerzustände:** idle / loading / failed mit Retry (Muster
  `GoalRitualModal`). **Credit wird nur bei Erfolg verbraucht.**
- Quest-Anzahl bleibt konstant (Ersatz, nie Zusatz) → keine XP-Inflation.

## 5. Prompt-Umbau: Klarheit schlägt Drama

Neues Ausgabeformat pro Quest (in `GENERATE_QUESTS_PROMPT`):

| Feld | Inhalt |
|------|--------|
| `title` | Sprache der Locale, konkret, Verb + Zahl wo möglich („Geh 30 Minuten laufen im Freien" statt „Weekly Warrior") |
| `desc` | 2–4 Sätze: **was** genau zu tun ist und **warum** — mit explizitem Bezug („Das zahlt auf dein Ziel ‚Halbmarathon' ein") |
| `doneWhen` | 1 Satz „Fertig, wenn …" — messbares Abschluss-Kriterium |
| `subQuests` | 2–4 konkrete Einzelschritte |
| `estimatedMinutes` | grobe Zeitschätzung (Tagesplanung) |
| `goalRef` | optional: Titel des aktiven Ziels, auf das die Quest einzahlt |

Regeln im Prompt:

- Nexus-Persona bleibt als *Ton* (knapp, direkt), aber explizit:
  **Verständlichkeit hat Vorrang; kein Fantasy-Vokabular in den Anweisungen.**
- Härterer Ziel-Bezug: Existieren aktive Ziele, muss **mindestens 1 Quest direkt
  auf den nächsten Meilenstein eines Ziels** einzahlen.
- Feedback-Reaktion: häufig „zu leicht" → Schwierigkeit anheben; „zu schwer" →
  absenken; „weniger davon" → Kategorie meiden.
- Profil-JSON im Prompt auf 4000 Zeichen gedeckelt (wie `SUGGEST_GOALS_PROMPT`).

**Serverseitige Qualitätssicherung** (nötig wegen Gratis-Modell):

- Nach Parse: Pflichtfelder vorhanden; `desc` ≥ 2 Sätze; **Ausgabe-Sprache =
  angeforderte Locale** (bei `de`: Heuristik über deutsche Funktionswörter /
  bekannte Englisch-Muster; bei `en` entfällt der Deutsch-Check).
- `goalRef` nur übernehmen, wenn er normalisiert (case-insensitiv, getrimmt)
  einem Titel aus `profile.activeGoals` entspricht — sonst Feld verwerfen.
- Validierung schlägt fehl → **1 Retry** mit verschärfter Anweisung → danach
  sauberer Fallback (Client nutzt regelbasierten Pool).
- **Modell-Prioritätenliste** statt Blind-Routing: OpenRouter-`models`-Array
  mit konkreten, deutsch-tauglichen Gratis-Modellen (Auswahl bei Implementierung
  anhand des aktuellen Katalogs); `openrouter/free` nur als letzte Stufe.

**Durchleitung der neuen Felder:** `sanitizeGeneratedAIQuests` (Function),
`normalizeQuestForStorage` (Client), Anzeige in `QuestDetailModal`
(„Fertig, wenn …", Zeitschätzung, „Zahlt ein auf: X"-Badge), i18n-Keys de/en.

## 6. Regelbasierte Personalisierung für alle (ohne KI, ab Tag 1)

`generateDailySystemQuests` zieht den statischen Pool nicht mehr zufällig,
sondern **gewichtet**:

- Lebensbereiche erhöhen das Gewicht ihrer Stats (bestehendes
  `getFocusStats`-Mapping).
- Kategorien aktiver Ziele erhöhen das Gewicht.
- Kategorien mit „Weniger davon"-Feedback senken es.
- Der schwächste Stat rotiert regelmäßig rein.

Deterministisch, offline-fähig, gilt für Free **und** als Fallback, wenn die
KI scheitert. Kein leeres Board, nie.

## 7. Feedback-Loop (die toten Felder zum Leben erwecken)

- **Ein-Tipp-Feedback im XP-Reward-Moment** nach Abschluss einer System-/KI-Quest:
  Chips **[Zu leicht] [Passt] [Zu schwer]** + optional **[Mehr davon]
  [Weniger davon]**. Ein Tipp, kein Zwang, wegwischbar; kein Popup-Zwang.
  Bewusst nur diese eine Oberfläche (YAGNI — keine Zweitchance auf der
  Quest-Karte in v1).
- Antworten landen in den **bestehenden** Feldern `feltDifficulty` /
  `categoryFeedback` der `completedQuests`-Einträge → fließen automatisch über
  das bestehende Profil in jeden Prompt (Pipeline existiert schon).
- Dieselben Signale speisen die Pool-Gewichtung (Abschnitt 6) — Feedback wirkt
  für Free-User genauso.
- Nur bei System-/KI-Quests, nicht bei eigenen Aufgaben.

## 8. Ziel-Findung

### 8a. Lv5-Ritual: „Ich weiß noch nicht"-Pfad

Dritter Einstieg im bestehenden Ritual (neben „Ziele eintragen" und
„KI-Vorschläge"): 4 geführte Fragen (Multiple Choice + 1 optionales Freitextfeld):

1. Welcher deiner 3 Lebensbereiche brennt gerade am meisten?
2. Was soll in 3 Monaten anders sein? (typische Antworten pro Bereich + Freitext)
3. Wie viel Zeit pro Tag ist realistisch? (10 / 30 / 60+ min)
4. Was hat dich bisher aufgehalten?

Antworten gehen als eigenes Feld (`questionnaire`) ins Profil an `suggestGoals`;
`SUGGEST_GOALS_PROMPT` wird erweitert, sodass Vorschläge direkt auf die
Antworten eingehen (inkl. Zeitbudget in den Meilensteinen). Ergebnis: 2–3
konkrete Ziele mit Meilensteinen im bestehenden Übernehmen-Flow. Free nutzt den
bestehenden interaktiven Gratis-Credit; Pro unbegrenzt.

### 8b. Laufende Ziel-Kristallisation (regelbasiert, für alle)

Wöchentliche lokale Prüfung (angedockt an den Weekly-Recap-Rhythmus): Gibt es
≥ 5 erledigte eigene Quests/Habits in einer Kategorie ohne aktives Ziel, erscheint
einmalig eine Vorschlagskarte („Du hast 8 Fitness-Aufgaben abgeschlossen — willst
du ein Ziel daraus machen?") → öffnet den Ziel-Dialog mit vorbefüllter Kategorie.
Kein KI-Call. Max. 1 Vorschlag/Woche; abgelehnte Kategorie pausiert 4 Wochen
(State: `goalCrystallization.lastCheck`, `declinedCategories`).

## 9. Gating-Übersicht (Zielzustand)

| Feature | Free | Pro |
|---------|------|-----|
| Regelbasiert personalisierter Quest-Pool | ab Tag 1 | als Fallback |
| Schmiede (sichtbare KI-Generierung) | 1×/Tag ab Lv 3 + 5 Quests | unbegrenzt on-demand (Server-Rate-Limit) |
| Auto-Kalibrierung beim Tagesstart | — | ab **Level 5** (vorher 15/Tier 5) |
| Ziel-Fragebogen im Lv5-Ritual | ja (interaktiver Credit) | ja |
| Ziel-Kristallisation (wöchentlich) | ja | ja |
| Feedback-Chips | ja | ja |

Unlock-Änderung berührt `data/featureUnlocks.js` (`ai_dynamic_quests`) und muss
gegen Tutorial-/System-Update-Referenzen geprüft werden (Tier-Erzählung).

## 10. Fehlerbehandlung

- Jeder KI-Fehler endet im regelbasiert personalisierten Pool — nie leeres Board.
- Schmiede-UI: idle / loading / failed mit Retry; Credit nur bei Erfolg.
- Rate-Limits: bestehender Server-Limiter unverändert; Client-Lockout-Logik
  (`useGeminiAI`) unverändert.
- Auto-Flow-Fehlversuche: max. 3/Tag, danach still bis zum nächsten Tag.

## 11. Tests & Verifikation

Node-Skripte nach Muster `scripts/test-*.mjs`:

- Prompt-Builder: Feedback/Ziele/Fragebogen landen im Prompt; 4000-Zeichen-Cap.
- Antwort-Validierung: Sprach-Heuristik (de/en), Pflichtfelder, `goalRef`-Match,
  Retry-Pfad.
- Pool-Gewichtung: deterministisch, Lebensbereiche/Ziele/Feedback wirken.
- Sanitizer: neue Felder `doneWhen`, `estimatedMinutes`, `goalRef`.
- Credit-Logik: Erfolg verbraucht, Fehlschlag nicht; Tageswechsel; Earn-it-Gate.
- Emulator-Smoke-Test für `generateDynamicQuests`.

Live-Verifikation als skeptischer User (Test-Account): Free-Pfad (Schmiede
zünden), Pro-Pfad (Auto-Kalibrierung inkl. Late-Swap), Fragebogen-Pfad,
Feedback-Tipp → nächste Generierung reagiert darauf.

## 12. Außerhalb des Scopes

- Kein Server-seitiger nächtlicher Planer (Ansatz B, bewusst verworfen).
- Kein Bezahlmodell (User-Entscheidung: Gratis-Modelle).
- Keine Feedback-Chips auf eigenen (Custom-)Quests.
- Keine Firestore-Speicherung des Profils (bleibt client-first).
