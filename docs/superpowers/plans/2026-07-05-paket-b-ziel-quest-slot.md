# Paket B „Ziel-Quest-Slot" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Täglich 1 (Pro: 2) Quest deterministisch aus dem nächsten offenen Meilenstein der GoalFramework-Ziele; ohne Ziele erscheint die Meta-Quest „Definiere dein erstes Ziel", die sich beim Anlegen eines Ziels selbst abschließt.

**Architecture:** Neues pures Modul `data/goalQuests.js` (Ableitung + Rotation, node-testbar) wird vom täglichen Reset in `hooks/useGameState.jsx` aufgerufen. Neuer Quest-Typ `goal` in `QUEST_TYPES_CONFIG` (Badge, XP wie Daily 1,2×). Verknüpfung über die bestehende `linkedGoalId`/`linkedMilestoneId`-Konvention aus GoalFramework. Quest-Abschluss schließt den Meilenstein NICHT automatisch ab; die QuestCard bekommt für Ziel-Quests eine Schnellaktion „Meilenstein erreicht", die beides gemeinsam abschließt (Meilenstein-Bonus +50 XP wie im GoalFramework). Rotation persistiert als `state.goalQuestPlanning.lastServedByGoalId`.

**Tech Stack:** React (JSX, Inline-Styles), pure ES-Module in `data/`, Test-Skripte `node scripts/*.mjs`, i18n `translate(locale, key, params)`, Firebase Analytics via bestehendem `trackEvent`.

**Spec:** `docs/superpowers/specs/2026-07-05-quest-klarheit-ziel-quests-design.md` (Abschnitt Paket B)

**WICHTIG:** Feature-Branch `feature/paket-b-ziel-quest-slot`, nur lokal committen, **nicht pushen**.

**Design-Entscheidungen (beim Planen fixiert):**
- Ziel-Quests werden auch an „overloaded"-Comeback-Tagen erzeugt — sie sind der persönliche Anker, max. 2 Stück.
- Typ-Multiplikator wie Daily (1,2×), Schwierigkeit `normal` (Spec: „XP/Gold wie Dailies").
- `isSystem: true` + Typ `goal` ⇒ `shouldRetainQuestAtReset` räumt sie beim Reset automatisch ab (kein Zusatzcode).
- Ziel-Quests sind wegen `linkedGoalId` bereits nicht ersetzbar (`data/questUtils.js:127`) — kein Zusatzcode.
- GoalFrameworks eigene Meilenstein-Logik bleibt unangetastet (Follow-up-Cleanup, nicht Paket B).

---

## File-Übersicht

- Create: `data/goalQuests.js` — Kategorie-Mapping, Rotation, `generateGoalQuests`, `generateGoalSetupQuest`, `withMilestoneCompleted`
- Modify: `data/freeLimits.js` — `GOAL_QUEST_SLOTS = { free: 1, pro: 2 }` + `getGoalQuestSlots`
- Modify: `data/gameData.js` — `QUEST_TYPES_CONFIG.goal` (Z. 250–257)
- Modify: `data/icons.js` — `QUEST_ICONS.goal` (Z. 68–74)
- Modify: `hooks/useGameState.jsx` — Reset-Integration (nach Z. 647), Meta-Quest-AutoComplete-Effect (Muster Z. 1036–1047), Aktion `completeGoalMilestone`
- Modify: `data/constants.jsx` — QuestCard (Z. 1033): Schnellaktion für Ziel-Quests
- Modify: `components/views/QuestLogView.jsx` — Prop-Durchreichung
- Modify: `solo-leveling-v5.jsx` — Handler-Verdrahtung
- Modify: `data/locales/de.js` + `en.js` — `quests.goalSlot.*`
- Create: `scripts/test-goal-quests.mjs`; Modify: `package.json` (+`test:goal-quests`), `scripts/test-quest-content.mjs` (Audit erweitern)

---

### Task 1: Pures Ableitungs-Modul `data/goalQuests.js` (TDD)

**Files:**
- Create: `data/goalQuests.js`
- Create: `scripts/test-goal-quests.mjs`
- Modify: `package.json`

- [ ] **Step 1: Failing Test schreiben** — `scripts/test-goal-quests.mjs`:

```js
import { generateGoalQuests, generateGoalSetupQuest, withMilestoneCompleted, GOAL_CATEGORY_TO_STAT } from "../data/goalQuests.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const goalA = { id: "gA", title: "Marathon laufen", category: "fitness", milestones: [
  { id: "mA1", title: "5 km am Stück laufen", completed: true },
  { id: "mA2", title: "10 km am Stück laufen", completed: false },
] };
const goalB = { id: "gB", title: "Spanisch lernen", category: "learning", milestones: [
  { id: "mB1", title: "Erste 100 Vokabeln", completed: false },
] };
const goalDone = { id: "gC", title: "Fertig", category: "social", milestones: [{ id: "mC1", title: "x", completed: true }] };
const base = { settings: { language: "de" }, level: 10, goals: [goalA, goalB, goalDone], quests: [], goalQuestPlanning: {} };

// Ableitung: nächster OFFENER Meilenstein, Kategorie-Mapping, Inhalt vorhanden
const r1 = generateGoalQuests(base, { limit: 1 });
check(r1.quests.length === 1, "limit 1 -> genau 1 Quest");
const q1 = r1.quests[0];
check(q1.type === "goal" && q1.isSystem === true, "Typ goal + isSystem");
check(q1.linkedGoalId && q1.linkedMilestoneId, "Verknuepfung gesetzt");
check(q1.linkedMilestoneId !== "mA1" && q1.linkedMilestoneId !== "mC1", "abgeschlossene Meilensteine nie waehlen");
check(q1.title.includes("10 km") || q1.title.includes("100 Vokabeln"), "Titel traegt Meilenstein");
check(Boolean(q1.desc && q1.desc.trim()), "desc vorhanden");
check(q1.difficulty === "normal", "Schwierigkeit normal");
check(["str", "int"].includes(q1.category), "Kategorie aus Mapping");
check(GOAL_CATEGORY_TO_STAT.fitness === "str" && GOAL_CATEGORY_TO_STAT.learning === "int", "Mapping deckungsgleich mit GoalFramework");

// Rotation: zuletzt bedientes Ziel kommt nicht sofort wieder dran
const served = { goalQuestPlanning: { lastServedByGoalId: { [q1.linkedGoalId]: "2026-07-04" } } };
const r2 = generateGoalQuests({ ...base, ...served }, { limit: 1 });
check(r2.quests[0].linkedGoalId !== q1.linkedGoalId, "Rotation bedient das andere Ziel");

// Pro-Limit 2: zwei verschiedene Ziele; bei nur 1 aktiven Ziel nur 1 Quest
const r3 = generateGoalQuests(base, { limit: 2 });
check(r3.quests.length === 2, "Pro-Limit 2 -> 2 Quests");
check(r3.quests[0].linkedGoalId !== r3.quests[1].linkedGoalId, "2 Quests aus 2 verschiedenen Zielen");
const r4 = generateGoalQuests({ ...base, goals: [goalB] }, { limit: 2 });
check(r4.quests.length === 1, "nur 1 aktives Ziel -> nur 1 Quest trotz Pro");

// Planning-State wird fortgeschrieben
check(r1.planning.lastServedByGoalId[q1.linkedGoalId], "lastServed wird gestempelt");

// Keine aktiven Ziele -> Meta-Quest
const setup = generateGoalSetupQuest({ settings: { language: "de" } });
check(setup.isGoalSetup === true && setup.type === "goal" && setup.isSystem === true, "Meta-Quest Flags");
check(Boolean(setup.desc && setup.desc.trim()) && Boolean(setup.title), "Meta-Quest hat Titel + desc");
const rEmpty = generateGoalQuests({ ...base, goals: [goalDone] }, { limit: 1 });
check(rEmpty.quests.length === 0, "keine offenen Meilensteine -> keine Ziel-Quest (Meta-Quest macht der Caller)");

// Meilenstein-Abschluss: pur, +50 XP Bonus, idempotent
const ms = withMilestoneCompleted(base, "gA", "mA2");
check(ms.completed === true && ms.xpBonus === 50, "Meilenstein abgeschlossen mit 50 XP Bonus");
const msGoal = ms.state.goals.find(g => g.id === "gA");
check(msGoal.milestones.find(m => m.id === "mA2").completed === true, "Meilenstein im State abgeschlossen");
check(ms.state.totalXpEarned === (base.totalXpEarned || 0) + 50 || ms.state.xp !== undefined, "XP wurden gutgeschrieben");
const msAgain = withMilestoneCompleted(ms.state, "gA", "mA2");
check(msAgain.completed === false, "idempotent: bereits abgeschlossen -> completed false, kein Doppel-Bonus");
const msMissing = withMilestoneCompleted(base, "gX", "mX");
check(msMissing.completed === false, "unbekanntes Ziel -> no-op");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ Goal-Quests: Ableitung, Rotation, Limits, Meilenstein-Abschluss korrekt");
```

`package.json` neben `test:quest-content`:

```json
    "test:goal-quests": "node scripts/test-goal-quests.mjs",
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npm run test:goal-quests`
Expected: FAIL — Modul `data/goalQuests.js` existiert nicht.

- [ ] **Step 3: Modul implementieren** — `data/goalQuests.js`:

```js
// Ziel-Quest-Slot (Paket B): leitet die tägliche Ziel-Quest deterministisch
// aus dem nächsten offenen Meilenstein der GoalFramework-Ziele ab.
// Pur und node-testbar — keine React-/Firebase-Abhängigkeiten.
import { genId, getToday, calculateLevelUp } from "./helpers.js";
import { getStateLocale, translate } from "./i18n.js";

// Deckungsgleich mit dem Inline-Mapping in components/GoalFramework.jsx (handleGenerateQuest).
export const GOAL_CATEGORY_TO_STAT = {
  fitness: "str",
  learning: "int",
  health: "vit",
  productivity: "agi",
  social: "cha",
};

export function getNextOpenMilestone(goal) {
  return (goal?.milestones || []).find(m => m && !m.completed) || null;
}

function activeGoals(goals) {
  return (goals || []).filter(g => g && getNextOpenMilestone(g));
}

// Rotation: am längsten nicht bediente Ziele zuerst (nie gestempelt = zuerst).
function sortByLeastRecentlyServed(goals, lastServedByGoalId) {
  return [...goals].sort((a, b) => {
    const servedA = lastServedByGoalId[a.id] || "";
    const servedB = lastServedByGoalId[b.id] || "";
    return servedA.localeCompare(servedB);
  });
}

export function generateGoalQuests(state, { limit = 1 } = {}) {
  const locale = getStateLocale(state);
  const today = getToday();
  const lastServedByGoalId = { ...(state?.goalQuestPlanning?.lastServedByGoalId || {}) };
  const candidates = sortByLeastRecentlyServed(activeGoals(state?.goals), lastServedByGoalId);

  const quests = [];
  for (const goal of candidates) {
    if (quests.length >= limit) break;
    const milestone = getNextOpenMilestone(goal);
    quests.push({
      id: `goal_${genId()}`,
      title: translate(locale, "quests.goalSlot.title", { milestone: milestone.title }),
      desc: translate(locale, "quests.goalSlot.desc", { goal: goal.title }),
      category: GOAL_CATEGORY_TO_STAT[goal.category] || "int",
      difficulty: "normal",
      type: "goal",
      isSystem: true,
      linkedGoalId: goal.id,
      linkedMilestoneId: milestone.id,
      createdAt: today,
      createdAtMs: Date.now(),
      dueDate: today,
    });
    lastServedByGoalId[goal.id] = today;
  }

  return { quests, planning: { lastServedByGoalId } };
}

// Meta-Quest, wenn kein aktives Ziel existiert. Schließt sich über den
// AutoComplete-Effect in useGameState selbst ab, sobald ein Ziel angelegt ist.
export function generateGoalSetupQuest(state) {
  const locale = getStateLocale(state);
  const today = getToday();
  return {
    id: `goal_setup_${getToday()}`,
    title: translate(locale, "quests.goalSlot.setupTitle"),
    desc: translate(locale, "quests.goalSlot.setupDesc"),
    category: "int",
    difficulty: "easy",
    type: "goal",
    isSystem: true,
    isGoalSetup: true,
    createdAt: today,
    createdAtMs: Date.now(),
    dueDate: today,
  };
}

// Schließt einen Meilenstein pur ab (Bonus +50 XP, wie GoalFramework.handleUpdateMilestone).
// Rückgabe { state, completed, xpBonus }: completed=false, wenn Ziel/Meilenstein fehlt
// oder bereits abgeschlossen (idempotent, kein Doppel-Bonus).
export function withMilestoneCompleted(state, goalId, milestoneId) {
  const goals = state?.goals || [];
  const goal = goals.find(g => g.id === goalId);
  const milestone = goal?.milestones?.find(m => m.id === milestoneId);
  if (!goal || !milestone || milestone.completed) {
    return { state, completed: false, xpBonus: 0 };
  }
  const xpBonus = Math.min(milestone.xpBonus || 50, 50);
  const updatedGoals = goals.map(g => g.id !== goalId ? g : {
    ...g,
    milestones: g.milestones.map(m => m.id === milestoneId
      ? { ...m, completed: true, completedAt: m.completedAt || getToday() }
      : m),
  });
  const next = calculateLevelUp({ ...state, goals: updatedGoals }, xpBonus);
  const allDone = updatedGoals.find(g => g.id === goalId).milestones.every(m => m.completed);
  return { state: next, completed: true, xpBonus, allDone };
}
```

- [ ] **Step 4: Locale-Keys anlegen** — `data/locales/de.js`, im `quests`-Objekt neben `hiddenGallery` (aus Paket A):

```js
    goalSlot: {
      title: "Ziel-Schritt: {milestone}",
      desc: "Dein nächster Schritt Richtung „{goal}“. Arbeite heute konkret daran.",
      setupTitle: "Definiere dein erstes Ziel",
      setupDesc: "Das System wartet auf deine Bestimmung. Lege im Ziele-Bereich dein erstes Ziel mit Meilensteinen fest — es speist ab morgen deine tägliche Ziel-Quest.",
      milestoneDone: "MEILENSTEIN ERREICHT",
      milestoneDoneNotify: "Meilenstein erreicht: {milestone} (+{xp} XP Bonus)",
      goalCompleted: "ZIEL ERREICHT: {goal}",
    },
```

`data/locales/en.js`, gleiche Stelle:

```js
    goalSlot: {
      title: "Goal step: {milestone}",
      desc: "Your next step towards „{goal}“. Work on it today.",
      setupTitle: "Define your first goal",
      setupDesc: "The System awaits your purpose. Create your first goal with milestones in the Goals area — it will feed your daily goal quest starting tomorrow.",
      milestoneDone: "MILESTONE REACHED",
      milestoneDoneNotify: "Milestone reached: {milestone} (+{xp} XP bonus)",
      goalCompleted: "GOAL ACHIEVED: {goal}",
    },
```

(en.js: Anführungszeichen um {goal} als einfache Quotes ausführen, kein Umlaut-Risiko.)

- [ ] **Step 5: Test laufen lassen — muss bestehen**

Run: `npm run test:goal-quests`
Expected: PASS (`✓ Goal-Quests: ...`)

- [ ] **Step 6: Commit**

```bash
git add data/goalQuests.js scripts/test-goal-quests.mjs package.json data/locales/de.js data/locales/en.js
git commit -m "feat(goals): pures Ziel-Quest-Modul (Ableitung, Rotation, Meilenstein-Abschluss)"
```

---

### Task 2: Free/Pro-Slots in `data/freeLimits.js` (TDD-light)

**Files:**
- Modify: `data/freeLimits.js`
- Modify: `scripts/test-goal-quests.mjs`

- [ ] **Step 1: Test ergänzen** (ans Ende von `scripts/test-goal-quests.mjs`, vor der Erfolgs-Zeile):

```js
import { getGoalQuestSlots, GOAL_QUEST_SLOTS } from "../data/freeLimits.js";
check(GOAL_QUEST_SLOTS.free === 1 && GOAL_QUEST_SLOTS.pro === 2, "Slot-Konstanten 1/2");
check(getGoalQuestSlots({ premiumActive: false }) === 1, "free -> 1 Slot");
check(getGoalQuestSlots({ premiumActive: true }) === 2, "pro -> 2 Slots");
```

- [ ] **Step 2: Laufen lassen — muss fehlschlagen** (`npm run test:goal-quests`, Export fehlt).

- [ ] **Step 3: Implementieren** — `data/freeLimits.js`, unter `QUOTA_CONFIG`:

```js
// Ziel-Quest-Slot (Paket B): Kern free (1/Tag), Pro bekommt 2 — kein Infinity,
// weil pro Slot ein eigenes aktives Ziel noetig ist.
export const GOAL_QUEST_SLOTS = { free: 1, pro: 2 };

export function getGoalQuestSlots({ premiumActive = false } = {}) {
  return premiumActive ? GOAL_QUEST_SLOTS.pro : GOAL_QUEST_SLOTS.free;
}
```

- [ ] **Step 4: Laufen lassen — muss bestehen**, dann bestehende Limits-Suite gegenprüfen:

Run: `npm run test:goal-quests; npm run test:free-limits`
Expected: beide PASS.

- [ ] **Step 5: Commit**

```bash
git add data/freeLimits.js scripts/test-goal-quests.mjs
git commit -m "feat(goals): Free/Pro-Slot-Limits fuer Ziel-Quests (1/2)"
```

---

### Task 3: Quest-Typ `goal` (Badge) + Reset-Integration

**Files:**
- Modify: `data/icons.js` (Z. 68–74), `data/gameData.js` (Z. 250–257)
- Modify: `hooks/useGameState.jsx` (Imports + Reset-Block nach Z. 647)

- [ ] **Step 1: Icon + Typ-Config**

`data/icons.js`, `QUEST_ICONS` ergänzen:

```js
    goal:      "/icons/nav_goals.webp",
```

`data/gameData.js`, `QUEST_TYPES_CONFIG` nach `hidden` ergänzen (XP/Gold wie Daily):

```js
  goal: { label: "Goal", color: "#34d399", icon: "🎯", iconSrc: QUEST_ICONS.goal, xpMult: 1.2, goldMult: 1.2 },
```

- [ ] **Step 2: Reset-Integration** — `hooks/useGameState.jsx`: Import ergänzen (`generateGoalQuests`, `generateGoalSetupQuest` aus `'../data/goalQuests.js'`; `getGoalQuestSlots` aus `'../data/premium.js'`? — nein: aus `'../data/freeLimits.js'`; `getPremiumStatus` ist bereits importiert, Z. 29). Direkt nach `s.quests = [...s.quests, ...newSysQuests];` (Z. 647) einfügen:

```js
            // ── Ziel-Quest-Slot (Paket B): 1 (Pro: 2) Quest aus den eigenen Zielen.
            // Läuft bewusst auch an Comeback-Tagen — der persönliche Anker bleibt.
            if (isFeatureUnlocked('goals', s.level || 1)) {
              const goalSlots = getGoalQuestSlots({ premiumActive: getPremiumStatus(s.premium).active });
              const goalGen = generateGoalQuests(s, { limit: goalSlots });
              if (goalGen.quests.length > 0) {
                s.quests = [...s.quests, ...goalGen.quests];
                s.goalQuestPlanning = goalGen.planning;
                trackEvent('goal_quest_assigned', { count: goalGen.quests.length, slots: goalSlots });
              } else {
                s.quests = [...s.quests, generateGoalSetupQuest(s)];
                trackEvent('goal_setup_quest_assigned', {});
              }
            }
```

- [ ] **Step 3: Build prüfen**

Run: `npm run build`
Expected: grün.

- [ ] **Step 4: Commit**

```bash
git add data/icons.js data/gameData.js hooks/useGameState.jsx
git commit -m "feat(goals): taeglicher Ziel-Quest-Slot im Reset (1 free / 2 Pro)"
```

---

### Task 4: Meta-Quest schließt sich selbst ab

**Files:**
- Modify: `hooks/useGameState.jsx` (neuer Effect nach dem Step-Goal-AutoComplete, Z. 1036–1047)

- [ ] **Step 1: Effect einbauen** — direkt unter dem bestehenden Step-Goal-Effect:

```js
  // Meta-Quest „Definiere dein erstes Ziel" schließt sich selbst ab,
  // sobald ein aktives Ziel mit offenem Meilenstein existiert.
  useEffect(() => {
    if (!state) return;
    const hasActiveGoal = (state.goals || []).some(g => (g.milestones || []).some(m => m && !m.completed));
    if (!hasActiveGoal) return;
    const due = (state.quests || []).find(q => q.isGoalSetup && !q.completed);
    if (due) {
      trackEvent('meta_quest_goal_created', {});
      completeQuest(due.id);
    }
  }, [state, completeQuest]);
```

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: grün.

- [ ] **Step 3: Commit**

```bash
git add hooks/useGameState.jsx
git commit -m "feat(goals): Meta-Quest schliesst sich beim ersten Ziel selbst ab"
```

---

### Task 5: Schnellaktion „Meilenstein erreicht" (QuestCard + Verdrahtung)

**Files:**
- Modify: `hooks/useGameState.jsx` — neue Aktion `completeGoalMilestone`
- Modify: `data/constants.jsx` — QuestCard (Z. 1033): optionale Prop `onMilestoneDone`
- Modify: `components/views/QuestLogView.jsx` — Prop durchreichen (Z. 13 + 62)
- Modify: `solo-leveling-v5.jsx` — Handler an QuestLogView übergeben

- [ ] **Step 1: Aktion in useGameState** — neben `completeQuest`-Definition (nach dem Meta-Quest-Effect einfügen). **Wichtig, vorher verifizieren:** ob `persist` `stateRef.current` synchron aktualisiert (so nutzt es `getReplacementCandidates`, Z. 1174 ff.). Wenn ja, gilt folgende Reihenfolge — Quest zuerst regulär abschließen (voller Reward-Flow), danach Meilenstein auf dem aktualisierten `stateRef.current` abschließen:

```js
  // Schnellaktion Ziel-Quest: Quest UND verknüpften Meilenstein gemeinsam abschließen.
  const completeGoalMilestone = useCallback((questId) => {
    const current = stateRef.current || state;
    const quest = (current?.quests || []).find(q => q.id === questId);
    if (!quest || !quest.linkedGoalId || !quest.linkedMilestoneId) return;
    completeQuest(questId);
    const afterQuest = stateRef.current || current;
    const result = withMilestoneCompleted(afterQuest, quest.linkedGoalId, quest.linkedMilestoneId);
    if (!result.completed) return;
    persist(result.state);
    const milestoneTitle = afterQuest.goals.find(g => g.id === quest.linkedGoalId)?.milestones.find(m => m.id === quest.linkedMilestoneId)?.title || "";
    notify(ltState(afterQuest, "quests.goalSlot.milestoneDoneNotify", { milestone: milestoneTitle, xp: result.xpBonus }), "success");
    if (result.allDone) {
      const goalTitle = result.state.goals.find(g => g.id === quest.linkedGoalId)?.title || "";
      setTimeout(() => notify(ltState(result.state, "quests.goalSlot.goalCompleted", { goal: goalTitle }), "named"), 1500);
    }
    trackEvent('milestone_completed_via_quest', { category: quest.category });
  }, [state, completeQuest, persist, notify]);
```

Import `withMilestoneCompleted` aus `'../data/goalQuests.js'` ergänzen. `completeGoalMilestone` in das Rückgabe-Objekt des Hooks aufnehmen (dort, wo `completeQuest` exportiert wird).

Falls `persist` `stateRef.current` NICHT synchron stellt: Meilenstein-Abschluss stattdessen via funktionalem Update in denselben `persist`-Fluss integrieren (dann `completeQuest` zuerst, Meilenstein im `setTimeout(0)`), und das im Commit-Text vermerken.

- [ ] **Step 2: QuestCard-Schnellaktion** — `data/constants.jsx`, QuestCard-Signatur (Z. 1033) um `onMilestoneDone` erweitern. Im Action-Bereich der Karte (dort, wo bedingte Buttons wie Replace/Pin gerendert werden — Block lesen und dieselbe Stilistik übernehmen) ergänzen:

```jsx
{!quest.completed && quest.linkedMilestoneId && onMilestoneDone && (
  <button
    onClick={(e) => { e.stopPropagation(); onMilestoneDone(quest.id); }}
    className="press-feedback"
    style={{ fontSize: 9, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid #34d39944", borderRadius: 8, padding: "4px 10px", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}
  >
    ✓ {tHook("quests.goalSlot.milestoneDone")}
  </button>
)}
```

(Übersetzungszugriff wie im umgebenden QuestCard-Code lösen — prüfen, ob dort `useI18n`/`t` bereits verfügbar ist; sonst `translate` + Locale-Prop-Muster des Files übernehmen.)

- [ ] **Step 3: Verdrahtung** — `components/views/QuestLogView.jsx`: Prop `completeGoalMilestone` in der Signatur (Z. 9–13) ergänzen und an QuestCard weitergeben (`onMilestoneDone={completeGoalMilestone}`, Z. 62). `solo-leveling-v5.jsx`: an der Stelle, wo `<QuestLogView ... completeQuest={...}>` gerendert wird, `completeGoalMilestone={completeGoalMilestone}` ergänzen (kommt aus dem useGameState-Hook-Destructuring — dort ebenfalls ergänzen).

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add hooks/useGameState.jsx data/constants.jsx components/views/QuestLogView.jsx solo-leveling-v5.jsx
git commit -m "feat(goals): Schnellaktion Meilenstein-erreicht auf Ziel-Quest-Karten"
```

---

### Task 6: Content-Audit erweitern + Gesamtverifikation

**Files:**
- Modify: `scripts/test-quest-content.mjs`

- [ ] **Step 1: Audit erweitern** — vor dem Abschluss-Block in `scripts/test-quest-content.mjs`:

```js
// 7. Ziel-Quests: Ableitung + Meta-Quest liefern immer Inhalt (beide Locales)
import { generateGoalQuests, generateGoalSetupQuest } from "../data/goalQuests.js";
for (const locale of ["de", "en"]) {
  const gState = { settings: { language: locale }, goals: [{ id: "g1", title: "Testziel", category: "fitness", milestones: [{ id: "m1", title: "Teilschritt", completed: false }] }] };
  const gen = generateGoalQuests(gState, { limit: 1 });
  if (gen.quests.length !== 1 || !hasContent(gen.quests[0])) fail(`GoalQuest[${locale}]: kein desc`);
  const setup = generateGoalSetupQuest({ settings: { language: locale } });
  if (!hasContent(setup)) fail(`GoalSetupQuest[${locale}]: kein desc`);
}
```

- [ ] **Step 2: Alle Tests + Build**

Run (PowerShell):

```powershell
npm run test:goal-quests; npm run test:quest-content; npm run test:hidden; npm run test:free-limits; npm run test:quest-utils; npm run test:quest-planning; npm run test:state-merge; npm run validate:quests; npm run build
```

Expected: alles grün.

- [ ] **Step 3: Smoke im Harness** — Wegwerf-Harness (Muster `gallery-smoke` aus Paket A, danach löschen): QuestCard aus `data/constants.jsx` mit einer generierten Ziel-Quest mounten → Badge „Goal", Titel „Ziel-Schritt: …", Beschreibung sichtbar, Schnellaktions-Button gerendert; Klick ruft Handler (Mock) auf. Screenshot als Beleg.

- [ ] **Step 4: Commit + Abschluss**

```bash
git add scripts/test-quest-content.mjs
git commit -m "test(goals): Ziel-Quests im Content-Audit"
```

Danach: finishing-a-development-branch (Merge-Optionen präsentieren, NICHT pushen).

---

## Self-Review (gegen Spec-Abschnitt „Paket B")

- Erzeugung beim täglichen Reset, Rotation „am längsten nicht bedient", Ableitung aus nächstem offenem Meilenstein: Task 1 + 3 ✓
- Titel/Beschreibung lokalisiert (de+en), Kategorie-Mapping deckungsgleich GOAL_CATEGORIES: Task 1 ✓
- Meilenstein wird nicht auto-abgeschlossen; Schnellaktion „Meilenstein erreicht" mit Bonus (+50 XP wie GoalFramework): Task 5 ✓
- Meta-Quest bei leerem Zustand + Auto-Abschluss beim ersten Ziel: Task 1 (Erzeuger) + 3 (Zuweisung) + 4 (AutoComplete) ✓
- Free 1 / Pro 2 in freeLimits nach bestehendem Muster: Task 2 ✓
- Ab Level 5 (Feature-Unlock `goals`): Task 3 (Gate im Reset-Block) ✓
- Analytics (`goal_quest_assigned`, `milestone_completed_via_quest`, `meta_quest_goal_created` + Setup-Zuweisung): Tasks 3–5 ✓
- Verwaiste Ziel-Quests: Typ `goal` ist `isSystem` ⇒ wird bei jedem Reset abgeräumt und frisch abgeleitet; Schnellaktion prüft Existenz über `withMilestoneCompleted`-No-op ✓
