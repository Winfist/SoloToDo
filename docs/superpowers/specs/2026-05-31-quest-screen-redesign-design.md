# Quest-Screen Redesign — Design Spec

**Datum:** 2026-05-31
**Status:** Zur Review
**Umfang:** ③ Quest-Erstellung als Schritt-für-Schritt-Wizard · ④ Systemruf-Frequenz am Quest-Board

> Teil eines größeren Batches. ① „Übergangstext entfernen" ist bereits umgesetzt (separater Schritt). ② „Habit-Erstellung" folgt als eigenes Spec danach.

---

## 1. Kontext & Problem

**③ Quest-Erstellung.** Das Erstellungs-Modal („Quest Forge", inline in `solo-leveling-v5.jsx` ~Z. 2030–2520) stapelt ~13 Felder + 3 Tabs (Erstellen / Mein Pool / Bibliothek) auf **einem** scrollenden Screen: Titel, Typ, Schwierigkeit, Kategorie, Details-Aufklapper (Beschreibung, Etappen, Pool/Tags), Priorität, Energie, Kontext, Fälligkeit, Erinnerung, Habit-Sync, XP-Vorschau. „Auf den ersten Blick zu viel."

**④ Frequenz.** Wie viele System-Quests pro Tag ein User bekommt, ist nur über `QuestIntensityControl` einstellbar — und das steckt **ausschließlich in den Einstellungen** (`SettingsView.jsx:1522`) und ist für Free-User **komplett gesperrt** (`PremiumLockedOverlay`). Am Quest-Board selbst gibt es nur einen „Filter"-Button (Typ/Herkunft), der zudem hinter dem Unlock `quest_filters` liegt. Ergebnis: Frequenz fühlt sich „nicht am Bildschirm einstellbar" an.

---

## 2. Ziele / Nicht-Ziele

**Ziele**
- Quest-Erstellung in einen geführten 3-Schritt-Wizard überführen (Approach A, vom User bestätigt).
- Eine „Frequenz"-Steuerung direkt am Quest-Board neben „Filter" platzieren.
- Klares Free-/Premium-Modell für die System-Quest-Menge/Tag.

**Nicht-Ziele**
- Die Quest-**Detailansicht** (`QuestDetailModal`) wird **nicht** angefasst.
- Die 5 Intensitäts-Presets (`questIntensity.js`) bleiben inhaltlich unverändert.
- Die adaptive Overload-Engine (`questPlanning.js`) wird **nur sichtbar gemacht**, nicht in der Logik geändert.
- Keine Änderung an `createQuest` / `addChainedQuest` Geschäftslogik — nur die UI/Flow drumherum.

---

## 3. ③ Quest-Erstellungs-Wizard

### 3.1 Schritt-Struktur

| Schritt | Titel | Felder | Footer |
|---|---|---|---|
| **1** | Was? | Titel (Pflicht, Autofokus) · Typ/Frequenz (Einzeln/Täglich/Wöchentlich*/Kette*) · Einstieg: 🎲 Zufall · 📋 Vorlage · ⭐ Pool | „Weiter ›" |
| **2** | Einstufung | Schwierigkeit · Bereich (Stat) · Live-XP/Gold-Vorschau | „‹ Zurück" · „Weiter ›" · „✦ Sofort erstellen" |
| **3** | Feinschliff *(optional)* | Beschreibung (+KI) · Etappen (max 5) · Priorität · Energie · Kontext · Fälligkeit · Erinnerung · Habit-Sync (nur daily/weekly) · In Pool speichern (+Tags) · Foto-Scan (Premium) | „‹ Zurück" · „✦ Erstellen ✦" |

\* feature-gated (`can('weekly_quests')`, `can('chained_quests')`) — unverändert.

### 3.2 Regeln
- **Pflicht ist nur der Titel.** „Erstellen" ist ab Schritt 2 möglich (Schritt 3 optional übersprungen).
- **Stepper** oben (1–2–3) zeigt Fortschritt; erledigte Schritte als ✓; Tippen auf einen Schritt = direkter Sprung (Titel muss gesetzt sein).
- **Einstieg/Vorlagen:** Die alten 3 Tabs (Erstellen/Pool/Bibliothek) entfallen als Top-Tabs. Stattdessen auf Schritt 1: 🎲 Zufall (befüllt direkt), 📋 Vorlage (öffnet Bibliothek-Picker), ⭐ Pool (eigene Templates). Auswahl befüllt Felder und springt zu Schritt 1/2.
- **Edit-Flow:** Bearbeiten öffnet denselben Wizard mit vorbefüllten Werten, Start auf Schritt 1, alle Schritte frei navigierbar; Footer-CTA = „Speichern".
- **Chained:** Typ „Kette" → beim Erstellen weiterhin `addChainedQuest(...)`.
- **Quick-Add** (Board, separat) bleibt unangetastet (Titel+Enter → Side-Quest).

### 3.3 State / Logik (unverändert wiederverwendet)
`qTitle, qType, qDiff, qCat, qDescription, qSubQuests, qTags, qSaveToPool, qPriority, qEnergy, qContext, qDueDate, qReminderPreset, qReminderAt, qSyncHabit, editingQuestId` + `createQuest` / `addChainedQuest` / `requireQuestSlot` / `createQuestFromTemplate` / Randomizer. Neu nur: `wizardStep` (1–3) State + Navigation.

### 3.4 Betroffene Dateien
- `solo-leveling-v5.jsx` — Erstellungs-Modal (~Z. 2030–2520) in Schritt-Container umbauen. Kandidat: in eine eigene Komponente `components/QuestForgeWizard.jsx` auslagern (Datei ist 169 KB; Auslagern verbessert Wartbarkeit). Props: alle obigen State-Werte/Setter + Handler.

---

## 4. ④ Systemruf-Frequenz am Board

### 4.1 Platzierung
Quest-Board-Header (`components/views/DashboardView.jsx`, Filter-Zeile ~Z. 816–839): neben „⚙ Filter" ein zweiter Button **„⚡ Frequenz · N/Tag"**. Tippen öffnet ein kompaktes Popover mit `QuestIntensityControl` (`compact` / `surface="embedded"`, existiert bereits).
- „Filter" behält Typ- + Herkunft-Filter wie heute.
- „Frequenz" ist **immer sichtbar** (nicht hinter `quest_filters` gated), damit Free es sieht.

### 4.2 Free-Modell (bestätigt)
- **Fix 1 System-Quest/Tag** (Preset `baby_gate`), **immer an**, nicht abschaltbar.
- Läuft bereits über die Tages-Generierung (`generateDailySystemQuests(getDailySystemQuestCount(s), s)` in `useGameState.jsx` ~Z. 573) — Default-Preset = baby_gate = 1. **Keine Engine-Änderung nötig.**
- Im Popover: aktuelle „1/Tag" sichtbar, höhere Presets als 🔒 angedeutet + dezenter Upsell („Mehr Systemrufe? → Hunter Pro"). Statt Voll-Sperre (heutiges `PremiumLockedOverlay`) eine **Teil-Sperre**, die den Baseline-Wert zeigt.

### 4.3 Premium-Modell
- Voller Preset-Picker (Baby 1 → Patrouille 2 → Drill 3 → Red Gate 3 → Monarch 4 pro Tag).
- AKTIV/AUS-Toggle für **intervallbasierte** Extra-Rufe (`autoSystemTasks`, `assignRandomTask`, alle `intervalHours`).
- Info: nächster Ruf / aktive Auto-Quests / Daily-Start (wie heute in `QuestIntensityControl`).

### 4.4 Adaptiv (nur sichtbar machen)
Bei Overload (`getQuestPlanningSnapshot(...).overloadStatus.overloaded`) zeigt das Frequenz-Control einen Status „Gedrosselt — zu viele offene Quests; statt neuer Rufe gibt's eine Comeback-Quest." Logik bleibt in `questPlanning.js` / `useGameState.jsx` (Z. 570–577) unverändert.

### 4.5 Betroffene Dateien
- `components/views/DashboardView.jsx` — neuer „Frequenz"-Button + Popover-State neben dem Filter.
- `components/QuestIntensityControl.jsx` — Free-Darstellung: Teil-Sperre statt Voll-Overlay (Baseline 1/Tag sichtbar, Upgrade gesperrt). Adaptiv-Status-Zeile ergänzen.
- (Keine Änderung an `questIntensity.js`, `questPlanning.js`, Generierungslogik.)

---

## 5. Verifikation
- esbuild-Parsecheck der geänderten/neuen Dateien.
- Lokaler Vite-Dev-Server hinter der Auth-Wall (siehe Memory „local_preview_workflow"): Wizard durchklicken (Schritt 1→3, Sofort-Erstellen ab Schritt 2, Edit-Flow, Chained, Vorlage/Zufall/Pool). Frequenz-Popover in Free- und Premium-Zustand (Premium-Status togglen), Overload-Status provozieren.
- Bestehende Tests/Harness laufen lassen, falls vorhanden (`scripts/`).

## 6. Offene Punkte
- Genaue Komponentengrenze für `QuestForgeWizard.jsx` (volle Auslagerung vs. In-Place-Refactor) wird im Plan festgelegt.
- Exakte Free-Teil-Sperre-Optik (Wieviel vom Premium-Picker „angeteasert" wird) im Plan/Bau.
