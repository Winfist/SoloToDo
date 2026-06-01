# Tier Level-Up "Present + Try-It" Tutorials — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static `tier_1..8` tutorials into short guided "try-it" flows — after the existing level-up cinematic + unlock cascade, walk the player to the headline new feature and have them engage it once.

**Architecture:** Reuse the entire existing tutorial overlay + the already-wired level-up chain (`LevelUpCinematic → SystemUnlockSequence → triggerTierTutorial(tier)`). The work is almost entirely **data**: rewrite each `tier_N` step array in `data/tutorialSteps.js` into a 2–3 step guided flow, plus add four `data-tutorial` anchors on dashboard/tab controls. Island headlines (tiers 5–8) already have `data-tutorial="system-<key>"` anchors on their app-grid tiles, so they need no new anchors.

**Tech Stack:** React/JSX (Vite), the existing `TutorialOverlay` (coachmarks, `click`/`input` action detection, `advanceWhenTarget`/`advanceWhenAbsent`, portal-hide, scroll-lock), `data/tutorialSteps.js` step schema. Verified live via the preview (real session) — see `local-preview-auth-wall`.

---

## Spec
`docs/superpowers/specs/2026-06-01-tier-levelup-tutorials-design.md`. Headline map (final): T1 Habit Tracker (Heute) → add habit · T2 Ziele (Training tab) → open goals · T3 Dawn/Dusk → set routine · T4 Dungeon Gates (Dungeon tab) → open a gate · T5 Shadow Army (Island) · T6 Jobs (Island) · T7 Soul Link (Island) · T8 Multiplayer (Island).

## Step schema reference (existing, do not change)
A step object supports: `id`, `type` (`"cinematic"|"info"|"action"`), `target`, `contextTarget`, `contextPadding`, `title`, `text`, `action` (`"click"|"input"`), `position` (`"top"|"bottom"|"center"`), `scrollTo`, `scrollBlock` (`"center"|"start"`), `pulseIntensity` (`"strong"`), `icon`, `confetti`, `optional`, `advanceWhenTarget`, `advanceWhenAbsent`, `advanceDelayMs`. Titles/texts may be German literals (the file already uses literals + an i18n fallback).

## Try-it pattern (every tier)
1. **Navigate (action)** — target the nav/tile that reaches the feature; for tab/island, add `advanceWhenTarget` = the destination view anchor and `advanceWhenAbsent: "[data-page-transition='active']"`.
2. **(dashboard tiers only) Engage (action)** — target the feature's primary control.
3. **Close (cinematic, confetti)** — one celebratory beat.
Keep ≤ 3 steps/tier. The unlock cascade already presented everything.

---

## Task 1: Dev trigger hook (verification helper)

**Files:** Modify `solo-leveling-v5.jsx` (near the other `tutorialRef` usage, e.g. around line 929).

- [ ] **Step 1: Expose a DEV-only trigger so any tier tutorial can be tested without leveling**

Add, inside `App`, after `tutorialRef` is assigned (search `tutorialRef.current?.triggerTierTutorial`):

```jsx
useEffect(() => {
  if (!import.meta.env.DEV) return;
  window.__triggerTier = (n) => tutorialRef.current?.triggerTierTutorial(n);
  return () => { delete window.__triggerTier; };
}, []);
```

- [ ] **Step 2: Verify in preview**

`preview_start` "dev"; navigate `/`; in console `window.__triggerTier(1)`. Expected: the `tier_1` tutorial overlay appears. (If the app isn't past onboarding, that's fine — the tier sequence still triggers.)

- [ ] **Step 3: Commit**

```bash
git add solo-leveling-v5.jsx
git commit -m "chore(tutorial): DEV-only window.__triggerTier hook for tier-tutorial testing"
```

---

## Task 2: Tier 1 — Habit Tracker (dashboard template)

**Files:**
- Modify: `components/views/DashboardView.jsx` (the HabitTracker create control)
- Modify: `data/tutorialSteps.js` (`tier_1.steps`)

- [ ] **Step 1: Find the habit "add" control**

Run: `grep -rn "habit" components/HabitTracker*.jsx components/**/HabitTracker*.jsx` (or `grep -rln "function HabitTracker" components`). Open it and find the button that opens the create-habit modal (the `+`/"Neuer Habit" control).

- [ ] **Step 2: Add the anchor**

On that button add `data-tutorial="habit-add"`. Example shape:
```jsx
<button data-tutorial="habit-add" onClick={openCreate} ...>+ Neuer Habit</button>
```

- [ ] **Step 3: Rewrite `tier_1.steps`**

Replace the `tier_1` `steps` array in `data/tutorialSteps.js` with:
```js
    steps: [
      {
        id: "tier1_try_habit",
        type: "action",
        target: "[data-tutorial='habit-add']",
        contextTarget: "[data-tutorial='habit-tracker']",
        contextPadding: 16,
        title: "HABIT TRACKER",
        text: "Dein neues Modul ist da. Leg jetzt deinen ersten Habit an — tippe auf Hinzufügen.",
        action: "click",
        position: "top",
        scrollTo: true,
        scrollBlock: "center",
        pulseIntensity: "strong",
      },
      {
        id: "tier1_done",
        type: "cinematic",
        title: "ROUTINE GESTARTET",
        text: "Stark. Habits machen kleine Wiederholungen sichtbar — bau sie täglich aus.",
        position: "center",
        icon: "OK",
        confetti: true,
      },
    ],
```

- [ ] **Step 4: Verify live**

Preview: `window.__triggerTier(1)`. Confirm: coach highlights the habit-add button (scrolled to center, no overlap, skip clear), tapping it advances to the "ROUTINE GESTARTET" close with confetti. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add components/views/DashboardView.jsx components/HabitTracker*.jsx data/tutorialSteps.js
git commit -m "feat(tutorial): tier 1 try-it — guide to first habit"
```

---

## Task 3: Tier 2 — Ziele (Training tab)

**Files:**
- Modify: the Goals/Training view component (locate in Step 1)
- Modify: `data/tutorialSteps.js` (`tier_2.steps`)

- [ ] **Step 1: Find the Training/Goals view + create-goal control**

Run: `grep -rln "goals\|Ziele\|GoalsView\|createGoal\|addGoal" components`. Identify the view rendered for the `training` tab and its create-goal button. Note a stable container element for `advanceWhenTarget`.

- [ ] **Step 2: Add anchors**

On the goals view container add `data-tutorial="goals-view"`; on its create-goal button add `data-tutorial="goal-create"`.

- [ ] **Step 3: Rewrite `tier_2.steps`**

```js
    steps: [
      {
        id: "tier2_goto_training",
        type: "action",
        target: "[data-tutorial='nav-training']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "TRAINING-HUB",
        text: "Ziele leben im Training-Tab. Öffne ihn.",
        action: "click",
        position: "top",
        pulseIntensity: "strong",
        advanceWhenTarget: "[data-tutorial='goals-view']",
        advanceWhenAbsent: "[data-page-transition='active']",
      },
      {
        id: "tier2_try_goal",
        type: "action",
        target: "[data-tutorial='goal-create']",
        contextTarget: "[data-tutorial='goals-view']",
        contextPadding: 16,
        title: "ERSTES ZIEL",
        text: "Setz dein erstes langfristiges Ziel — tippe auf Neues Ziel.",
        action: "click",
        position: "top",
        scrollTo: true,
        scrollBlock: "center",
        pulseIntensity: "strong",
      },
      {
        id: "tier2_done",
        type: "cinematic",
        title: "VISION GESETZT",
        text: "Große Ziele entstehen aus täglichen Schritten. Der Weg wird klarer.",
        position: "center",
        icon: "GOAL",
        confetti: true,
      },
    ],
```

- [ ] **Step 4: Verify live** — `window.__triggerTier(2)`: tap Training tab → goals view → create-goal highlighted → done. Screenshot.

- [ ] **Step 5: Commit** — `git commit -am "feat(tutorial): tier 2 try-it — guide to first goal"`

---

## Task 4: Tier 3 — Dawn/Dusk Protocol

**Files:** Modify the Dawn/Dusk component (`components/DawnDuskProtocol.jsx` per repo) + `data/tutorialSteps.js` (`tier_3.steps`).

- [ ] **Step 1: Find the Dawn/Dusk entry + its primary "set routine" control**

Run: `grep -rln "DawnDusk\|Dawn/Dusk\|dawn_dusk\|Protocol" components`. Locate where it renders on the dashboard (or its module) and the control that starts/sets a routine.

- [ ] **Step 2: Add anchors** — container `data-tutorial="dawn-dusk"`, primary control `data-tutorial="dawn-dusk-start"`.

- [ ] **Step 3: Rewrite `tier_3.steps`**

```js
    steps: [
      {
        id: "tier3_try_dawndusk",
        type: "action",
        target: "[data-tutorial='dawn-dusk-start']",
        contextTarget: "[data-tutorial='dawn-dusk']",
        contextPadding: 16,
        title: "DAWN / DUSK PROTOKOLL",
        text: "Morgen- und Abendroutinen geben deinem Tag Struktur. Aktiviere deine erste Routine.",
        action: "click",
        position: "top",
        scrollTo: true,
        scrollBlock: "center",
        pulseIntensity: "strong",
      },
      {
        id: "tier3_done",
        type: "cinematic",
        title: "RHYTHMUS AKTIV",
        text: "Disziplin wird gemessen. Achievements und Weeklys warten ebenfalls auf dich.",
        position: "center",
        icon: "ACH",
        confetti: true,
      },
    ],
```
If Dawn/Dusk has no single tappable entry on the dashboard, fall back to the Achievements headline: anchor `achievements-view` + a nav step to it (mirror Task 3's two-step nav pattern). Decide during Step 1 based on what exists; keep ≤ 3 steps.

- [ ] **Step 4: Verify live** — `window.__triggerTier(3)`. Screenshot.

- [ ] **Step 5: Commit** — `git commit -am "feat(tutorial): tier 3 try-it — Dawn/Dusk routine"`

---

## Task 5: Tier 4 — Dungeon Gates (Dungeon tab)

**Files:** Dungeon/Gates view component (locate) + `data/tutorialSteps.js` (`tier_4.steps`).

- [ ] **Step 1: Find the Dungeon view + a single gate element**

Run: `grep -rln "dungeon\|Gate\|GATES\|gates" components`. Identify the dungeon view container and one enterable gate card/button.

- [ ] **Step 2: Add anchors** — container `data-tutorial="dungeon-view"`, first gate `data-tutorial="dungeon-gate"`.

- [ ] **Step 3: Rewrite `tier_4.steps`**

```js
    steps: [
      {
        id: "tier4_goto_dungeon",
        type: "action",
        target: "[data-tutorial='nav-dungeon']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "DUNGEON GATES",
        text: "D-Rang erreicht. Über diesen Tab betrittst du Gates. Öffne ihn.",
        action: "click",
        position: "top",
        pulseIntensity: "strong",
        advanceWhenTarget: "[data-tutorial='dungeon-view']",
        advanceWhenAbsent: "[data-page-transition='active']",
      },
      {
        id: "tier4_try_gate",
        type: "action",
        target: "[data-tutorial='dungeon-gate']",
        contextTarget: "[data-tutorial='dungeon-view']",
        contextPadding: 16,
        title: "ERSTES GATE",
        text: "Wähle ein Gate und sieh dir die Herausforderung an. Dort warten Etagen, Bosse und seltene Belohnungen.",
        action: "click",
        position: "top",
        scrollTo: true,
        scrollBlock: "center",
        pulseIntensity: "strong",
      },
      {
        id: "tier4_done",
        type: "cinematic",
        title: "DIE JAGD BEGINNT",
        text: "Du bist kein Anfänger mehr. Shop, Equipment und Story stehen dir jetzt offen.",
        position: "center",
        icon: "GATE",
        confetti: true,
      },
    ],
```

- [ ] **Step 4: Verify live** — `window.__triggerTier(4)`. Screenshot.

- [ ] **Step 5: Commit** — `git commit -am "feat(tutorial): tier 4 try-it — open a dungeon gate"`

---

## Task 6: Tiers 5–8 — Island modules (Shadow Army, Jobs, Soul Link, Multiplayer)

These share one pattern: navigate to Hunter-Island → tap the module's existing `system-<key>` app-tile → arrive at the module view. **No new anchors on the tiles** (they already have `data-tutorial="system-${item.key}"`). You only add a `data-tutorial="<x>-view"` on each destination module's root container if one doesn't exist.

**Files:** the four module view components + `data/tutorialSteps.js` (`tier_5..8.steps`).

- [ ] **Step 1: Resolve the exact tile keys + ensure the island is in apps-mode reachable**

Run: `grep -n "item.key\|activateTile\|raw.map" components/views/HunterIslandHub.jsx` and trace `raw` (~line 1019) to list the `key` values for shadow army, jobs, soul link, multiplayer (likely route keys like `shadows`, `jobs`, `soul_link`/`soullink`, `multiplayer`). Confirm the app-grid (`apps-grid`) is shown by default when entering the island, or that the nav lands there; if the island opens in portal mode, the navigate step should target `mode-toggle` first (reuse the onboarding `switch_to_apps` pattern) — only add that step if needed.

- [ ] **Step 2: Add destination view anchors (only where missing)**

For each module view root add `data-tutorial="shadow-view"`, `"jobs-view"`, `"soullink-view"`, `"multiplayer-view"` (check first — `stats-view` already exists, others may too).

- [ ] **Step 3: Rewrite `tier_5.steps` (Shadow Army) — template for 6/7/8**

```js
    steps: [
      {
        id: "tier5_goto_island",
        type: "action",
        target: "[data-tutorial='nav-system']",
        contextTarget: "[data-tutorial='bottom-nav']",
        contextPadding: 8,
        title: "HUNTER-INSEL",
        text: "Dein neues Modul liegt auf der Hunter-Insel. Öffne sie.",
        action: "click",
        position: "top",
        pulseIntensity: "strong",
        advanceWhenTarget: "[data-tutorial='apps-grid']",
        advanceWhenAbsent: "[data-page-transition='active']",
      },
      {
        id: "tier5_open_shadows",
        type: "action",
        target: "[data-tutorial='system-shadows']",
        contextTarget: "[data-tutorial='apps-grid']",
        contextPadding: 14,
        title: "SHADOW ARMY",
        text: "Erwecke besiegte Gegner als Schatten. Tippe auf Shadow Army.",
        action: "click",
        position: "top",
        scrollTo: true,
        pulseIntensity: "strong",
        advanceWhenTarget: "[data-tutorial='shadow-view']",
        advanceWhenAbsent: "[data-page-transition='active']",
      },
      {
        id: "tier5_done",
        type: "cinematic",
        title: "SCHATTEN ERWACHEN",
        text: "Deine Armee wächst, Monarch. Der Hunter's Codex steht ebenfalls offen.",
        position: "center",
        icon: "SHA",
        confetti: true,
      },
    ],
```

- [ ] **Step 4: Rewrite `tier_6` (Jobs), `tier_7` (Soul Link), `tier_8` (Multiplayer)** using the same three-step shape, swapping: nav target stays `nav-system`; module target = `system-<key>` (jobs/soul_link/multiplayer keys from Step 1); `advanceWhenTarget` = the matching `*-view`; titles/texts/icons:
  - T6 Jobs — icon `"JOB"`, close "KLASSE GEWÄHLT" / "Spezialisiere dich. Formationen und Events sind jetzt offen."
  - T7 Soul Link — icon `"LINK"`, close "VERBUNDEN" / "Soziale Ketten, Named Shadows und Seasons erwarten dich."
  - T8 Multiplayer — icon `"MP"`, close "ELITE-STATUS" / "Die Hunter Association steht offen. Willkommen in der Elite.", and keep `isFinale: true` on the close.

- [ ] **Step 5: Verify live** — `window.__triggerTier(5)` … `(8)`: each navigates island → module tile → module view → close. Screenshot tiers 5 and 6 at minimum.

- [ ] **Step 6: Commit** — `git commit -am "feat(tutorial): tiers 5-8 try-it — island module walkthroughs"`

---

## Task 7: Audit + remove the dev hook

- [ ] **Step 1: Static target audit**

Re-run the onboarding-style audit: extract every `target`/`advanceWhenTarget` from the `tier_*` sequences and confirm each `data-tutorial` value exists in source:
```bash
grep -oE "data-tutorial='[^']+'" data/tutorialSteps.js | sort -u
```
Cross-check each against `grep -rn "data-tutorial=\"<value>\"" components solo-leveling-v5.jsx`. Every tier target must resolve. Fix any miss.

- [ ] **Step 2: Run existing tests**

Run: `npm run test:sigil && npm run test:icons && npm run validate:quests`
Expected: all pass (these don't cover tiers but confirm nothing else broke).

- [ ] **Step 3: Remove the DEV trigger hook**

Delete the `window.__triggerTier` effect from Task 1.

- [ ] **Step 4: Commit**

```bash
git commit -am "chore(tutorial): remove DEV tier-trigger hook; tier try-it audit clean"
```

---

## Self-review notes

- **Spec coverage:** present→navigate→engage→close pattern (Tasks 2–6) ✓; one headline/tier ✓; reuse overlay + chain (no overlay edits) ✓; tier-3 Dawn/Dusk with Achievements fallback (Task 4) ✓; island tiles reuse `system-<key>` ✓; verification live + audit (Task 7) ✓; Pro path out of scope ✓.
- **Anchors added:** `habit-add`, `goals-view`+`goal-create`, `dawn-dusk`+`dawn-dusk-start`, `dungeon-view`+`dungeon-gate`, and `*-view` roots for island modules where missing. Island tiles need none.
- **Risk/uncertainty flagged for execution (reproduce-first):** exact tile keys + whether the island opens in apps vs portal mode (Task 6 Step 1); Dawn/Dusk dashboard entry vs Achievements fallback (Task 4). Each is resolved by a grep before the code step, not a placeholder.
- **No overlay/provider/chain changes** — keeps blast radius to data + thin anchors.
