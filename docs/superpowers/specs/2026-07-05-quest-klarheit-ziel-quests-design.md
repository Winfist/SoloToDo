# Quest-Klarheit & Ziel-Quests — Design

**Datum:** 2026-07-05
**Status:** Entwurf zur Review
**Umsetzung:** Drei Pakete, sequenziell implementiert und deployed (A → B → C).

## Problem

1. **Leere Quests im Board:** Hidden Quests („Weekend Warrior", „A Thousand Cuts", insgesamt 17 in `data/helpers.js` `HIDDEN_QUESTS`) erscheinen nach Trigger-Auslösung als offene Quests mit nur einem Titel — ohne Beschreibung und ohne Aufgaben. Ursache: Beim Einfügen ins Board (`hooks/questActions.js`, Hidden-Quest-Trigger-Block) werden nur `title`, `category`, `difficulty` übernommen; die in den Sprachdateien vorhandene `desc` wird verworfen. Konzeptionell ist die Trigger-Bedingung beim Erscheinen bereits erfüllt — es gibt nichts mehr zu tun, die „Quest" ist nur ein Abhak-Klick. Chained Quests (`generateChainedQuest`) haben ebenfalls keine Beschreibung.
2. **Personalisierung fehlt im Kern-Loop:** Die tägliche System-Quest-Vergabe zieht rein aus dem statischen `QUEST_POOL` (fokus-gewichtet 60/30/10 nach Lebensbereichen). Die Lebensziele des Users (GoalFramework, Ziele mit Meilensteinen, Unlock ab Level 5) fließen nicht in die täglichen Quests ein, obwohl das KI-Profil (`data/aiQuestProfile.js`) sie bereits erfasst.

## Entscheidungen (mit User abgestimmt)

- Hidden Quests werden **Achievements mit Sofort-Belohnung** (keine leeren Board-Einträge mehr), plus **Sammel-Galerie**.
- Personalisierung als **Hybrid**: statischer Pool bleibt Rückgrat; täglich 1–2 **Ziel-Quests** deterministisch aus Meilensteinen, KI veredelt optional.
- Ziel-Erfassung dreigleisig: **System-Ritual** beim Level-5-Unlock, **Meta-Quest** bei leerem Slot, **KI-Zielvorschläge** (Pro).
- Free/Pro: **Kern free** (1 Ziel-Quest/Tag deterministisch), **KI-Veredelung, 2. Slot und KI-Vorschläge Pro** — konsistent zur „voll spielbar + Limits"-Philosophie.
- KI läuft weiter über die bestehende OpenRouter-Infrastruktur (`openrouter/free`, `functions/geminiService.js`) — bereits kostenlos, keine neue Abhängigkeit.

## Paket A — Quest-Klarheit

### Hidden Quests → Achievements

- `checkHiddenQuestTriggers` (`data/helpers.js`) bleibt unverändert (liefert Titel, `desc`, `discoveryMsg` lokalisiert).
- `hooks/questActions.js`: Der Trigger-Block legt **keine Quest mehr ins Board**. Stattdessen:
  - Belohnung sofort gutschreiben: Basis-XP der Schwierigkeit × `reward.xpMult`, Gold analog (dieselbe Formel wie bisher beim manuellen Abschluss).
  - Eintrag direkt in `hiddenQuests.completed`; die Zwischenstufe `discovered` als offener Board-Eintrag entfällt.
  - Bestehendes `hiddenQuestModal` (`hooks/rewardFlowBuilders.js`) zeigt Titel, Story-Beschreibung, Entdeckungstext **und die erhaltene Belohnung**.
- Der Completion-Zweig `quest.type === "hidden"` in `questActions.js` bleibt für die Migrationsphase erhalten, wird danach toter Code und fliegt raus.

### Migration bestehender States

Beim App-Start (bestehender Migrationsblock in `hooks/useGameState.jsx`): offene `type: "hidden"`-Quests im Board werden automatisch eingelöst — Belohnung gutschreiben, in `completed` verschieben, kurze Benachrichtigung. Kein User verliert Belohnungen; leere Karten verschwinden. Cross-Device: Migration ist idempotent (Board-Eintrag weg + `completed`-Eintrag vorhanden ⇒ nichts zu tun).

### Sammel-Galerie „Geheimnisse"

Neue Sektion im Stats-Bereich: eingelöste Achievements mit Titel + Story-Text + Belohnung; unentdeckte als „???"-Silhouette mit Kategorie-Hinweis (STR/INT/…), ohne Trigger-Bedingung zu verraten. Free für alle (Retention-Feature). Datenquelle: `HIDDEN_QUESTS` + `state.hiddenQuests.completed`.

### Chained Quests

`generateChainedQuest` (`data/helpers.js`) bekommt einen `desc`-Parameter; Folge-Glieder erben die Beschreibung der Ursprungs-Quest. Operations-Ketten setzen `desc` bereits über `generateOperationStep`.

### Absicherung

Neues `scripts/test-quest-content.mjs`: iteriert über alle Quest-Erzeuger (Pool-Templates beider Locales, Emergency, Chained, Charisma-Ketten, Ziel-Quest ab Paket B) und schlägt fehl, wenn eine erzeugte Quest weder Beschreibung noch Teilaufgaben hat.

## Paket B — Ziel-Quest-Slot

### Erzeugung (deterministisch, offline-fähig)

Beim täglichen Reset wird zusätzlich **eine Quest vom neuen Typ `goal`** erzeugt (eigener Badge im Board):

- Quelle: aktive Ziele aus dem GoalFramework (`state.goals`, Meilenstein offen). Bei mehreren Zielen Rotation nach „am längsten nicht bedient" (persistiert als `lastServedAt` je Ziel).
- Ableitung aus dem **nächsten offenen Meilenstein**:
  - Titel: „Ziel-Schritt: 〈Meilenstein〉"
  - Beschreibung: „Dein nächster Schritt Richtung ‚〈Ziel〉'. Arbeite heute konkret daran."
  - Kategorie-Mapping (deckungsgleich mit `GOAL_CATEGORIES` in `components/GoalFramework.jsx`): fitness→str, learning→int, health→vit, productivity→agi, social→cha.
  - Schwierigkeit `normal`, XP/Gold wie Dailies. Verknüpfung über `goalId` + `milestoneId` + Erzeugungsdatum.
- Lokalisierung: Templates in `data/locales/de.js` + `en.js` (keine hartkodierten Strings).

### Meilenstein-Verknüpfung

Quest-Abschluss = „heute daran gearbeitet"; der Meilenstein wird **nicht** automatisch abgeschlossen. Auf der Quest-Karte gibt es die Schnellaktion „Meilenstein erreicht ✓", die Quest **und** Meilenstein gemeinsam abschließt (inkl. bestehendem Meilenstein-Bonus aus dem GoalFramework). Große Meilensteine funktionieren so über mehrere Tage.

### Leerer Zustand (Meta-Quest)

Ohne aktives Ziel zeigt der Slot die Meta-Quest **„Definiere dein erstes Ziel"**: Tippen öffnet das GoalFramework; sobald ein Ziel angelegt ist, schließt sich die Quest automatisch ab (normale XP). Erscheint erst ab Level 5 (Feature-Unlock `goals` in `data/featureUnlocks.js`); darunter gibt es keinen Ziel-Slot.

### Free/Pro

- Free: 1 Ziel-Quest/Tag.
- Pro: bis zu 2 Ziel-Quests/Tag (bei ≥2 aktiven Zielen).
- Limit-Definition in `data/freeLimits.js` nach bestehendem Muster.

### Analytics

Events in die bestehende Retention-Instrumentierung: `goal_quest_completed`, `milestone_completed_via_quest`, `meta_quest_goal_created`.

## Paket C — Ziel-Ritual + KI

### System-Ritual (Level-5-Unlock)

Beim Freischalten des Ziele-Features erscheint statt des stillen Unlocks ein inszenierter System-Dialog (Stil der Tutorial-2.0-Sequenzen): „Das System hat deine Aktivität analysiert. Definiere nun deine Bestimmung." Geführter Flow: 1–3 Ziele (Kategorie → Titel → optional Meilensteine), schreibt direkt in `state.goals`. Abbruch erlaubt — die Meta-Quest aus Paket B bleibt Auffangnetz.

### KI-Zielvorschläge (Pro)

- Neuer Prompt `suggestGoals` in `functions/geminiPrompts.js`, aufgerufen über eine neue Callable (gleiches Muster wie `generateDynamicQuests`, inkl. Rate-Limiter und Input-Sanitizing über `functions/aiQuestProfile.js`).
- Input: bestehendes KI-Profil (Lebensbereiche, Kategorien-Historie, Habits). Output: 2–3 Zielvorschläge mit je 3–4 Meilensteinen, client-seitig validiert und längenbegrenzt (bestehende Bounding-Helfer wiederverwenden).
- Sichtbar im Ritual und im GoalFramework; Free-User sehen den Button mit Pro-Hinweis (bestehendes „earn-it"-Muster).

### KI-Veredelung der Ziel-Quest (Pro)

Beim Erzeugen der täglichen Ziel-Quest ruft der Client (nur Pro, max. 1×/Tag, Ergebnis im State gecacht) `generateDynamicQuests` mit Ziel- + Meilenstein-Kontext auf und ersetzt die generische Formulierung durch eine konkrete Tagesaufgabe mit 2–3 Teilaufgaben. Validierung wie im bestehenden Forge-Code (Titel-/Längen-Bounding).

### Fallback-Garantie

Jeder KI-Pfad fällt bei Fehler, Rate-Limit, Offline oder ungültiger Antwort lautlos auf die deterministische Variante aus Paket B zurück. **Der Ziel-Slot ist nie leer und nie von der KI abhängig.**

## Fehlerbehandlung (Querschnitt)

- KI-Ausfall/Kontingent: deterministischer Fallback (s. o.).
- Ziel über Nacht gelöscht/abgeschlossen: verwaiste Ziel-Quest wird beim nächsten Reset ersetzt; Schnellaktion prüft Existenz von `goalId`/`milestoneId` vor dem Abschluss.
- Cross-Device-Sync: Ziel-Quests tragen `goalId` + Datum und werden im Merge wie andere System-Quests behandelt (Lehre aus dem Resurrection-Fix 406810f: idempotente Migration, keine Wiederbelebung eingelöster Hidden Quests).
- Hidden-Quest-Migration ist idempotent und verträgt mehrfache Ausführung.

## Tests & Verifikation

- Je Paket ein Skript nach `scripts/test-*.mjs`-Muster:
  - A: Hidden-Achievement-Konvertierung (Trigger → Sofort-Belohnung, Modal-Payload, Migration idempotent), Chained-Desc, `test-quest-content.mjs`-Audit.
  - B: Ziel-Quest-Ableitung (Mapping, Rotation, Empty-State-Meta-Quest, Free/Pro-Limit, verwaiste Quests).
  - C: Prompt-Validierung/Bounding, Fallback-Pfade.
- `npm run build` grün je Paket.
- Smoke-Test über den `/run-solo-todo`-Harness.
- Deploy einzeln je Paket (`npm run deploy`, nicht `firebase deploy` direkt).

## Nicht-Ziele

- Kein Ersatz des statischen Quest-Pools durch KI (bewusst dagegen entschieden).
- Keine Änderung an Dungeon-/Schatten-/Job-Systemen.
- Keine neuen bezahlten KI-Modelle; es bleibt bei `openrouter/free`.
