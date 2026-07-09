# Ziele-Seite „Etappen-Pfad" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Ziele-&-Fortschritt-Seite (GoalFramework-Listenteil) wird zum Etappen-Pfad-Design umgebaut (User-gewählte Variante B + Statuszeile aus C): jedes Ziel als vertikale Meilenstein-Reise mit pulsierender nächster Etappe und „HEUTE ALS ZIEL-QUEST AKTIV"-Badge.

**Architecture:** Nur der Anzeige-Teil von `components/GoalFramework.jsx` wird ersetzt (GoalCard → neuer Pfad-Renderer, neue Statuszeile). CreateGoalModal, handleCreate/Edit/Delete/UpdateMilestone und die Fix-4-Buttons bleiben funktional unverändert. Neue Strings lokalisiert (de+en, `quests.goalPage.*`) — die Alt-Strings des Modals bleiben unangetastet (separates Thema). Referenz-Design: Harness `goal-redesign-preview.jsx` Variante B (wird nach Abschluss gelöscht).

**Tech Stack:** React Inline-Styles, Design-Tokens (Cinzel/JetBrains Mono/Outfit), bestehende Kategorie-Farben aus GOAL_CATEGORIES.

**WICHTIG:** Branch `feature/ziele-seite-etappen-pfad`, lokal committen, nicht pushen. Qualitätsanspruch: Journey als skeptischer User durchspielen (leer / 1 Ziel / mehrere / abgeschlossen / Meilenstein-Abhaken), Screenshots vergleichen.

---

### Task 1: Locale-Keys `quests.goalPage.*` (de+en)

- [ ] `data/locales/de.js`, neben `goalRitual`:

```js
    goalPage: {
      eyebrow: "DEINE BESTIMMUNG",
      title: "Ziele & Fortschritt",
      statGoals: "AKTIVE ZIELE",
      statMilestones: "MEILENSTEINE",
      statDone: "ERREICHT",
      todayActive: "HEUTE ALS ZIEL-QUEST AKTIV",
      nextStage: "NÄCHSTE ETAPPE",
      completedSection: "ERREICHTE ZIELE",
      confirmMilestone: "Meilenstein „{title}“ abschließen?",
    },
```

- [ ] `en.js` analog (OWN GOALS wording): eyebrow "YOUR PURPOSE", title "Goals & Progress", statGoals "ACTIVE GOALS", statMilestones "MILESTONES", statDone "ACHIEVED", todayActive "ACTIVE AS TODAY'S GOAL QUEST", nextStage "NEXT STAGE", completedSection "ACHIEVED GOALS", confirmMilestone "Complete milestone '{title}'?".
- [ ] Commit: `i18n(goals): Etappen-Pfad-Seitentexte`

### Task 2: Pfad-Renderer in GoalFramework

**Files:** Modify `components/GoalFramework.jsx` (GoalCard ersetzen), `useI18n` importieren.

- [ ] Neue Komponente `GoalPathCard({ goal, todayQuestMilestoneId, onCompleteMilestone, onEdit, onDelete, theme, t })` nach Referenz Variante B:
  - Karte: `borderLeft: 3px solid <catColor>`, Titel (Outfit 800) + `X/Y`-Zähler (Mono, catColor), Kebab-/Inline-Aktionen für Edit/Delete (bestehende Handler).
  - Vertikaler Pfad: pro Meilenstein Node (erledigt: gefüllt catColor + Titel durchgestrichen; nächster: größerer Ring, `boxShadow`-Glow + `animation: pulse 2s infinite`; künftige: gedimmt) + Verbindungslinie (erledigt: catColor66, sonst grau).
  - Nächster Node ist tappbar: `window.confirm(t confirmMilestone)`-frei — stattdessen 2-Tap-Muster wie Quest-Board? Nein, einfacher: Tap → kleiner Inline-Confirm-Chip („✓ bestätigen", 3s), dann `onCompleteMilestone`. Kein confirm()-Dialog.
  - Badge unter dem nächsten Node: `todayActive` (grün, Mono) wenn `todayQuestMilestoneId === milestone.id`, sonst `nextStage` dezent.
- [ ] Haupt-Render: Eyebrow + Titel (lokalisiert), Statuszeile (3 Kacheln aus Variante C: aktive Ziele, Meilensteine done/total, erreicht), dann `GoalPathCard`-Liste, dann Abschnitt `completedSection` (kompakte ✓-Zeilen), Footer: `✦ RITUAL` (onStartRitual, jetzt immer sichtbar) + `+ NEUES ZIEL` (openCreate). Empty-State von Fix 4 bleibt.
- [ ] `todayQuestMilestoneId` ableiten: `(state.quests||[]).find(q => q.type === "goal" && !q.completed && q.linkedGoalId === goal.id)?.linkedMilestoneId`.
- [ ] `onCompleteMilestone(goalId, msId)` → bestehendes `handleUpdateMilestone(goalId, msId, true)`.
- [ ] Commit: `feat(goals): Ziele-Seite als Etappen-Pfad (Variante B + Statuszeile)`

### Task 3: Verifikation

- [ ] Harness: GoalFramework mit 4 Zuständen mounten (leer / 1 Ziel mit heutiger Quest / 2 Ziele / 1 abgeschlossen) → Screenshots mobil (375px), Vergleich mit Referenz.
- [ ] Interaktion: nächster Node → Confirm-Chip → onUpdateMilestone feuert (Mock zählt), erledigte Nodes nicht klickbar.
- [ ] `npm run build` + Kern-Testsuite grün; Referenz-Harness + Verifikations-Harness löschen.
- [ ] Merge nach main (lokal), Memory-Update.

## Self-Review
- Variante B umgesetzt inkl. C-Statuszeile ✓; bestehende Logik (Create/Edit/Delete/Milestone-XP) unangetastet ✓; neue Strings de+en ✓; Fix-4-Einstiege bleiben ✓; Journey-Zustände im Smoke ✓.
