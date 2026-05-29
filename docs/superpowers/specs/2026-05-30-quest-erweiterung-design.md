# Quest-Erweiterung — Design

**Datum:** 2026-05-30
**Status:** Approved (Ansatz A)
**Scope:** Großer, voll bilingualer (DE+EN) Ausbau aller Quest-Typen.

## Ziel

Mehr Variation und Wiederspielwert über alle Quest-Typen. Konkret: Haupt-Pool
~verdoppeln, Emergency-Quests aus der Vorhersehbarkeit holen, Hidden-Quests
ausbauen, und die bisher Deutsch-only Sonder-Quests (Redemption, Seasonal,
Hidden) ins bestehende i18n-System migrieren, damit vor dem Launch alles
konsistent zweisprachig ist.

## Ansatz

**Ansatz A — In bestehende Strukturen erweitern.** Keine Architektur-Umbauten.
Wir folgen den heutigen Mustern (`QUEST_POOL` + `EN_OVERRIDES`, `translate()`
Locale-Keys) und füllen sie auf. Geringes Regressionsrisiko vor dem Launch.

Verworfen: Ansatz B (neues `data/questContent/`-Modul) — sauberer langfristig,
aber großer Refactor der Generierungslogik, zu riskant kurz vor Launch.

## Betroffene Dateien (Ist-Zustand)

| Quest-Typ | Quelle | Ist | Bilingual? |
|---|---|---|---|
| Side/Daily-Pool | `data/questPool.js`, `data/localizedQuestPool.js` (`EN_OVERRIDES`) | ~65 | ✅ |
| Emergency | `data/helpers.js` (`generateEmergencyQuest`) + `data/locales/{de,en}.js` | 5 fix, deterministisch | ✅ |
| Hidden | `data/helpers.js` (`HIDDEN_QUESTS`, `checkHiddenQuestTriggers`) | 5 | ❌ nur DE |
| Chained / Missionen | `data/helpers.js` (`generateChainedQuest`) | dynamisch, kein Content | – |
| Redemption | `data/protocolHelpers.js` (`generateRedemptionQuests`) | 3 (STR/INT/VIT) | ❌ nur DE |
| Seasonal/Weekly | `data/protocolHelpers.js` (`generateSeasonalQuests`) | 4 Seasons × 2 | ❌ nur DE |

Stat-Modell bleibt: **STR, INT, VIT, AGI, CHA**. Neue Themen werden auf diese
fünf gemappt (kein neuer Stat).

---

## 1. Haupt-Pool: ~65 → ~140 Quests

`data/questPool.js` erweitern, jede neue Quest bekommt einen DE-Eintrag dort
und einen passenden `EN_OVERRIDES`-Eintrag in `data/localizedQuestPool.js`
(Titel-Override optional, `desc` + `subQuests` Pflicht für sauberes EN).

### Struktur jeder neuen Quest
```js
{
  id: "qp_<stat>_<n>", title, category: "<stat>", difficulty, minLevel,
  desc, tags: [...], subQuests: [{ id, title, completed: false }, ...]
}
```
- IDs konsistent fortführen (`qp_str_05`, `qp_str_05b`, …); keine bestehende ID
  ändern (Save-Kompatibilität via `templateId`/`questKey`).
- `difficulty` ∈ easy/normal/hard/boss. Belohnung kommt aus `DIFFICULTIES`.

### Verteilung pro Stat (~13-15 neue je Stat)
Pro Stat etwa: 2 easy, 4 normal, 4 hard, 1-2 boss, plus Endgame.

### Level-Kurve schließen
- Neue **„hard"-Quests bei minLevel 15-19** (heute Lücke zwischen hard ~14 und
  boss 20).
- Neue **Endgame-Quests** bei minLevel 25 / 30 / 40 (boss-Tier), damit hohe
  Hunter frischen Content sehen.

### Neue Themen → Stat-Mapping
- **VIT:** Achtsamkeit/Mental Health (Journaling, Atemarbeit, Dankbarkeit,
  Digital-Detox-Tiefe), Ernährungs-Detail, Natur/Outdoor-Erholung.
- **CHA:** Beziehungen & Familie (Qualitätszeit, Konflikt klären, Kontakt
  halten, Wertschätzung zeigen).
- **INT:** Kreativität & Skills (Musik, Schreiben, Zeichnen, Side-Project),
  Finanz-Tiefe (Budget, Investment-Lernen).
- **AGI:** Karriere/Beruf (Bewerbung, Skill-Building, Netzwerk-Pflege),
  Haushalt/Umgebung, Gewohnheits-Systeme.
- **STR:** Mobility-Spezialisierung, Sport-Disziplinen, Outdoor-Challenges.

---

## 2. Emergency-Quests: 5 fix → Pool ~18, echte Zufallswahl

`generateEmergencyQuest` in `data/helpers.js` umbauen:
- Template-Liste von 5 → ~18 (3-4 pro Stat).
- Auswahl **zufällig statt deterministisch per Datum**; letzte Auswahl in
  `state` merken (z. B. `state.lastEmergencyTemplateId`) und ausschließen, um
  direkte Wiederholung zu vermeiden. Determinismus pro Kalendertag bleibt
  erhalten (eine Emergency je Tag), nur die Vorhersehbarkeit fällt weg.
- Bilingual über neue Locale-Keys `quests.emergency.<key>.{title,desc}` in
  `de.js` **und** `en.js`.
- Bestehende Signatur (`playerLevel`, `stateOrLanguage`) und das Rückgabe-Objekt
  (`type:"emergency"`, `xpMult/goldMult: 2.5`, `timeLimit`, `templateId`)
  beibehalten.

Severity bleibt optional/leichtgewichtig: alle hard (CHA normal) wie heute; kein
neues Balancing-System.

---

## 3. Hidden-Quests: 5 → ~13, bilingual

`HIDDEN_QUESTS` in `data/helpers.js` erweitern und Texte ins i18n ziehen
(`quests.hidden.<id>.{title,desc,discoveryMsg}` in `de.js` + `en.js`); der Array
hält nur noch `id`, `category`, `difficulty`, `triggerCondition`, `reward`.

### Neue Trigger-Typen (in `checkHiddenQuestTriggers` ergänzen)
- `perfect_day` — alle Tagesquests an einem Tag erfüllt.
- `time_of_day` — Aktion in einem Zeitfenster (z. B. vor 6 Uhr).
- `stat_combo` — zwei Stats ≥ Schwelle gleichzeitig.
- `dungeon_clears` — N Dungeons bezwungen.
- `focus_sessions` — N Focus-Sessions.

Bestehende Trigger (`shadow_count`, `total_quests`, `streak`, `stat_value`)
unverändert. Reward-Format (`xpMult`/`goldMult`) bleibt.

---

## 4. Redemption: 3 → 5, bilingual

`generateRedemptionQuests` in `data/protocolHelpers.js`:
- AGI- und CHA-Schritt ergänzen (5 Schritte, einer pro Stat).
- Texte über `quests.redemption.<step>.{title,desc}` in `de.js` + `en.js`;
  Locale via `state` reinreichen (analog Emergency).
- `regressionStep`, `xpMult: 1.5`, `isRedemption`, `type:"redemption"` bleiben.
- Hinweis: `penaltyZone.redemptionLeft` / Trigger nutzen heute „3". Beim Wechsel
  auf 5 Schritte die Stelle in `hooks/useGameState.jsx` (`redemptionLeft: 3`)
  und `hooks/questActions.js` (`newPenalty.redemptionLeft || 3`) konsistent
  mitziehen — ODER bewusst 3 Pflicht-Schritte aus 5 generierten lassen.
  **Entscheidung:** 5 Quests generieren, aber weiterhin 3 zum Abschluss nötig
  (mehr Auswahl, kein Balance-Eingriff).

---

## 5. Seasonal/Weekly: 8 → ~20, bilingual + echter Weekly-Pool

`generateSeasonalQuests` in `data/protocolHelpers.js`:
- Pro Season von 2 → 4-5 Templates.
- Texte über `quests.seasonal.<key>.<n>.title` (+ ggf. desc) in `de.js`+`en.js`.
- `type:"weekly"`, `isSeasonal:true` bleiben.

Optional in diesem Scope, aber empfohlen: kleiner **Weekly-Pool** unabhängig von
Seasons (`type:"weekly"`, 2x Multiplier wie in `QUEST_TYPES_CONFIG`), damit es
außerhalb aktiver Seasons Wochen-Content gibt. Falls die Generierung dafür heute
nicht existiert, wird das als eigener, klar abgegrenzter Schritt im
Implementierungsplan behandelt (nicht im Pool-Ausbau vermischt).

---

## 6. Neu: „Operationen" (benannte Missionen)

Der `chained`-Mechanismus (`generateChainedQuest`) erzeugt heute nur dynamische
Schritte ohne Inhalt. Wir ergänzen **Content-Templates** für mehrstufige,
benannte Missionen (Story-Rahmen + feste Schritte), bilingual.

- Neue Datenquelle (z. B. `OPERATIONS` in `questPool.js` oder eigener Export),
  je Operation: `id`, Titel, Beschreibung, `category`, `steps[]` (jeweils Titel
  + ggf. SubQuests), Difficulty-Kurve, Belohnung.
- Wiederverwendung des bestehenden `chained`-Multiplikators (`1 + (step-1)*0.25`).
- Bilingual via `EN_OVERRIDES`-analoger Mechanik bzw. Locale-Keys.

Dieser Punkt ist der einzige mit etwas neuer Generierungs-Logik; im Plan als
letzter, optional abtrennbarer Schritt geführt, falls Zeit/Risiko es erfordern.

---

## Konsistenz & Kompatibilität

- **Keine bestehende Quest-ID ändern.** Nur additiv. `questKey`/`templateId`
  sorgen für stabile Identität in gespeicherten States.
- **Locale-Parität:** Jeder neue `de.js`-Key bekommt zwingend einen `en.js`-Key
  (gleiche Struktur). Self-Check im Plan: DE/EN-Key-Diff = leer.
- **Balancing:** Keine Änderung an `DIFFICULTIES`-Belohnungen oder
  Multiplikatoren. Neue Quests nutzen die bestehenden Tiers.
- **Themen-Mapping** ändert keine Stat-Definitionen.

## Test / Verifikation

- App lokal starten, neue Quests im Dashboard sichtbar (DE + EN umschalten).
- Emergency-Quest mehrfach triggern → unterschiedliche Auswahl, kein direktes
  Wiederholen.
- Hidden-Trigger für mind. einen neuen Typ manuell auslösen.
- DE/EN-Key-Parität prüfen (kein fehlender Übersetzungs-Key).
- Bestehender Save lädt ohne Fehler (additiv, keine ID-Kollision).

## Offen / bewusst draußen (YAGNI)

- Kein neuer Stat, keine neue Difficulty-Stufe, kein neues Belohnungssystem.
- Kein Refactor der Quest-Generierung (Ansatz B verworfen).
- Emergency-Severity-Stufen nur falls trivial; sonst weglassen.
