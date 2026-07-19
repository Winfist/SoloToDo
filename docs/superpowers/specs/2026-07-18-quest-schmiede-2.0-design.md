# Quest-Schmiede 2.0: Ritual, Auswahl, Identität

**Datum:** 2026-07-18
**Status:** Entwurf (wartet auf User-Review)
**Entscheidungen (mit User geklärt):** Vollbild-Ritual · 3 zeigen / N wählen · eigene Board-Sektion · Autoflow bereitet vor statt still zu tauschen

## 1. Ausgangslage: Befunde

| # | Befund | Ort |
|---|--------|-----|
| 1 | **Platzhalter-Subquests in PROD:** Das JSON-Beispiel im Generierungs-Prompt enthält wörtlich `"subQuests": [{"title": "Schritt 1"}, {"title": "Schritt 2"}]` (de) bzw. `Step 1/Step 2` (en) — Gratis-Modelle kopieren Beispiele. Die Validierung prüft nur `subQuests.length >= 2`, nie den Inhalt → Platzhalter passieren, der Strikt-Retry feuert nicht. | `functions/geminiPrompts.js:210,237`, `functions/aiQuestValidation.js:57` |
| 2 | **Schmiede ist eine Black Box:** Kleine Karte + Knopf → 3 Ladezeilen → offene System-Dailies werden stumm ersetzt → Toast. Kein Preview, keine Wahl, kein Moment zwischen „geschmiedet" und „auf dem Board". | `components/QuestForgeCard.jsx`, `solo-leveling-v5.jsx:835-869` |
| 3 | **Pro-Autoflow tauscht unsichtbar** beim App-Start (konservativer Auto-Swap). Widerspricht der Auswahl-Philosophie. | `solo-leveling-v5.jsx:908-945` |
| 4 | **KI-Quests sind auf dem Board unsichtbar als solche:** `aiGenerated`-Flag existiert, aber keine visuelle Identität/Trennung. | `components/views/DashboardView.jsx:627` |
| 5 | **Free-Verschwendung:** Der Prompt generiert exakt 3 Quests, `generateDailySystemQuestsAsync` schneidet auf die Slot-Anzahl (Free: 1) — 2 Vorschläge werden weggeworfen. | `data/helpers.js:314-336`, `functions/geminiPrompts.js` |

## 2. Sofort-Fix: Prompt-Beispiel + Validierung (wirkt auf ALLE Generierungswege)

1. **Prompt** (`functions/geminiPrompts.js`, de + en): Das JSON-Antwortbeispiel bekommt
   realistische Subquests — de: `[{"title": "Laufschuhe anziehen und rausgehen"},
   {"title": "25 Minuten im Wohlfuehltempo laufen"}]`, en sinngemäß. Zusätzliche
   Regel im REGELN/RULES-Block: „subQuests sind konkrete Handlungen — niemals
   generische Platzhalter wie ‚Schritt 1'."
2. **Validierung** (`functions/aiQuestValidation.js`): neuer Reject-Grund
   `placeholder-subquests`, wenn (a) irgendein Subquest-Titel auf
   `/^(schritt|step)\s*\d+\.?$/i` passt ODER (b) alle Subquest-Titel einer Quest
   nach Normalisierung identisch sind. Fehlschlag löst den **bestehenden
   Strikt-Retry** aus (gleicher Mechanismus wie `desc-too-short`).
3. Tests in `scripts/test-ai-quest-validation.mjs`: Platzhalter de/en → reject;
   echte Subquests → pass; Groß-/Kleinschreibung und „Schritt 3." mit Punkt.

## 3. Neues State-Feld: `forge.pending`

```js
forge: {
  pending: null | {
    proposals: [/* max 3 normalisierte Quests (wie aiQuests heute) */],
    date: "YYYY-MM-DD",      // Gültigkeitstag
    generatedAtMs: 0,
    source: "manual" | "auto",
  },
}
```

- **Lebenszyklus:** entsteht bei erfolgreicher Generierung; überlebt Reloads;
  wird im Tagesreset-Block verworfen, wenn `pending.date !== today`.
- **Anti-Farming:** Existiert ein Pending-Set für heute, wird NICHT neu
  generiert — Ritual öffnet direkt in Phase 2 mit demselben Set. (Pro darf per
  „Neu schmieden" im Ritual explizit überschreiben — serverseitiges Rate-Limit
  deckelt wie heute; Free nicht, Credit ist verbraucht.)
- **Merge** (`data/storage.js`, Muster vom Signal-Paket): höheres
  `generatedAtMs` gewinnt komplett (kein Feld-Merge von Vorschlagslisten).
- **Default** in `data/defaultState.js`: `forge: { pending: null }`.
- Reine Helfer in **neuem Modul `data/forge.js`** (pur, node-testbar):
  `createPendingSet(proposals, { source, today, nowMs })`,
  `isPendingSetValid(state, today)`, `clearPendingSet(state)`,
  `getSelectableCount(state)` = `min(getDailySystemQuestCount(state),
  countManualForgeTargets(state.quests))`,
  `acceptProposals(state, proposalIds, { today }) → { state, accepted }`
  (nutzt `swapSystemQuests`/`getSwappedQuests` mode "manual" mit exakt den
  gewählten Quests; stempelt `recordQuestsSwapped` + `recordQuestsAssigned`
  nur für Angenommene; löscht `pending`).

## 4. Das Schmiede-Ritual (`components/ForgeRitualModal.jsx`)

Vollbild-Overlay nach dem Struktur-Muster von `GoalRitualModal` (Portal,
Phasen-State, idle/loading/failed mit Retry). NEXUS-Ästhetik: dunkel, präzise,
Akzent Indigo — **kein Neon, kein Fake-HUD** (Design-Präferenz).

- **Phase „Schmieden":** Sequenz „Profil lesen → Muster erkennen → Quests
  schmieden", Dauer = echter API-Call (kein Fake-Timer). Darunter 2–3 echte
  Dossier-Zeilen aus `getDossierSummary` (z.B. „Beste Aktivzeit: morgens",
  „Gemieden: VIT") — mit Daten-Gate; unterhalb des Gates neutraler Text
  („Das System kalibriert sich noch"). Die Generierung fordert **immer 3
  Vorschläge** an (voller Prompt-Output, kein Slice mehr im Ritual-Pfad).
- **Phase „Auswahl":** 3 Vorschlagskarten (Titel, Kategorie-Chip, Schwierigkeit,
  `estimatedMinutes`, Beschreibung, Subquests aufklappbar). Tippen togglet
  Auswahl (Akzentrahmen), Kopfzeile zeigt „Gewählt: K von N". N =
  `getSelectableCount` (Free effektiv 1, Pro nach Intensität; gekappt durch
  freie unangetastete Dailies). Bei N = 0: Hinweis „Heute alles erledigt —
  Vorschläge verfallen um Mitternacht" (kein toter Button). Pro sieht
  zusätzlich einen sekundären „Neu schmieden"-Knopf (überschreibt das Set,
  serverseitiges Rate-Limit deckelt); Free nicht (Tages-Credit verbraucht).
- **Phase „Annehmen":** CTA „Ins Quest-Log übernehmen" → `acceptProposals` →
  kurzer Bestätigungsmoment (Karten fliegen ab / Glow-freier Puls) → `onClose`.
  Toast wie heute („neu kalibriert"). Schließen (X) ist in jeder Phase erlaubt
  und verwirft NICHTS.
- **Fehlerzustand:** wie heute `failed` + Retry-Knopf. Der Credit stempelt
  NUR bei Erfolg (Pending-Set erstellt, §7) — Fehlversuche und deren Retries
  sind für Free also immer frei.

## 5. Schmiede-Karte (`components/QuestForgeCard.jsx`) — Zustände statt Black Box

| Zustand | Anzeige | Aktion |
|---------|---------|--------|
| bereit (kein Pending) | wie heute: Eyebrow + „Schmieden"-CTA | öffnet Ritual, startet Generierung |
| Pending vorhanden | „⚑ {n} Vorschläge bereit" + „Ansehen"-CTA | öffnet Ritual direkt in Phase Auswahl |
| gesperrt/verbraucht/keine Ziele | wie heute (Level-Gate, usedToday, allDone) | disabled |

## 6. Board-Sektion „AUS DER SCHMIEDE" (`components/views/DashboardView.jsx`)

Angenommene Vorschläge tragen `origin: "forge"` (zusätzlich zu `aiGenerated`,
bestehende Quests unberührt). Das Board rendert sie als eigenen Block zwischen
Loadout-Kopf und den übrigen Sektionen: Sektionstitel „AUS DER SCHMIEDE",
Karten mit dezentem Indigo-Akzentrahmen + Schmiede-Glyphe (bestehende
Icon-Familie, kein neues Asset nötig — `NAV_ICONS`/`STORY_ICONS` prüfen, sonst
Text-Glyphe „⚒"). Mechanik unverändert: es SIND System-Dailies (Slot, XP,
Verfall, Like/Dislike, Ersetzen — alles greift automatisch).

## 7. Autoflow → „Vorbereiten" + Credits

- **Autoflow** (`solo-leveling-v5.jsx:908-945`): statt `swapSystemQuests` im
  Erfolgsfall nur noch `forge.pending = createPendingSet(aiQuests, { source:
  "auto" })` persistieren. Beide Pfade (Ritual + Autoflow) fordern **immer 3
  Vorschläge** an — der Slice auf die Slot-Anzahl in
  `generateDailySystemQuestsAsync` entfällt in diesen Pfaden (Auswahlbreite;
  begrenzt wird erst bei der Annahme). Guard-Keys
  (`sl_ai_quest_gen_date/attempts`) behalten ihre Semantik („heute
  vorbereitet"). Der Settings-Toggle
  `dynamicQuestsEnabled` steuert das Vorbereiten. Kein stiller Tausch mehr —
  `canAutoSwapSystemQuests` wird in diesem Pfad überflüssig.
- **Credits** (`data/freeLimits.js`): `applyForgeUsage` stempelt künftig bei
  **erfolgreicher Generierung** (Pending-Set erstellt), nicht mehr beim Swap —
  der API-Call ist die Kostenstelle; Auswahl/Annahme sind frei und bleiben den
  Tag über möglich. Fehlgeschlagene Generierung stempelt weiterhin NICHT.
  Free-Gates (Lv3 + 5 Quests, 1x/Tag) unverändert; Pro unverändert.
- **`handleForge`** wird zum Ritual-Opener: Karte → Ritual → Generierung läuft
  IM Ritual (Phase 1); der bisherige Direkt-Swap-Code wandert in
  `acceptProposals`.

## 8. Signale (bestehendes Fundament, keine neuen Typen)

Nur Angenommene zählen: `recordQuestsSwapped` (ersetzte Dailies, KEIN
implicitDislike) + `recordQuestsAssigned` (angenommene) — beides in
`acceptProposals`. Nicht gewählte Vorschläge erzeugen bewusst KEIN Signal
(kein Dislike-Äquivalent — Folge-Paket). `recordUserAction` beim Annehmen.

## 9. Tests

- `scripts/test-ai-quest-validation.mjs` erweitern: Platzhalter-Muster (§2.3).
- Neu `scripts/test-forge.mjs`: Pending-Lebenszyklus (create/valid/clear beim
  Rollover-Datum), `getSelectableCount`-Kappung (Slots vs. freie Dailies,
  0-Fall), `acceptProposals` (ersetzt exakt Gewählte, Signale gestempelt,
  pending geleert, keine XP-Inflation: Questanzahl konstant).
- `scripts/test-forge-limits.mjs` erweitern: Credit-Stempel bei Generierung
  statt Swap.
- `scripts/test-state-merge.mjs` erweitern: `forge.pending` neueres
  `generatedAtMs` gewinnt.
- Build + E2E-Smoke im Harness (Ritual mit Mock-Generator: Phasen, Auswahl-
  Kappung, Annehmen, Karte-Zustände).

## 10. Bewusst NICHT im Scope (YAGNI)

- Einzel-Reroll pro Vorschlagsslot; Schmiede-Historie/Archiv.
- „Nicht gewählt"-Signale (mit Block C/D bewerten).
- Änderungen an Free/Pro-Limits, Preisen, Intensitäts-Presets.
- Umbau der statischen Fallback-Vergabe (Pool bleibt wie er ist).

## 11. Risiken & offene Punkte

- **PROD-Hotfix-Charakter von §2:** Der Platzhalter-Fix betrifft Cloud
  Functions → wirkt erst nach Functions-Deploy. Da PROD seit 18.07. live
  generiert, sollte §2 früh im Plan stehen und ggf. vorab deploybar sein.
- **Slot-Ökonomie:** `acceptProposals` darf nie mehr ersetzen als
  `countManualForgeTargets` — Kappung ist doppelt (UI + Helfer).
- **Ritual-Dauer:** Gratis-Modelle brauchen real bis ~70s+ — Phase 1 braucht
  einen ehrlichen Fortschrittsanker (Sequenz-Zeilen + Dossier-Einblick), damit
  die Wartezeit nicht leer wirkt; Timeout-/Failed-Pfad wie heute 120s.
- **de.js** mit echten Umlauten, `functions/` ASCII-Deutsch (Konventionen).
