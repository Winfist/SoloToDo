# Free/Pro Rebalance — Phase 2a: De-gate + Daily-Run Quotas (Dungeons + Charisma) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remove the hard Pro wall from Dungeon Gates and Charisma Dungeons so free users can enter, and cap free *runs* per day (Dungeons 3/day, Charisma 1/day) via the `getQuotaStatus` foundation from Phase 1.

**Architecture:** De-gating = drop the two routes from `PREMIUM_ROUTE_FEATURES` (dungeon) and remove the `premiumStatus?.active &&` render guard (charisma overlay). Quota = gate the *run* action (dungeon entry in `onEnterGate`; charisma start in `startCharismaChain`) using the already-tested pure `getQuotaStatus`, backed by two daily counters that reset in the existing rollover. No new pure logic — Phase 1 already covers + tests it.

**Tech Stack:** Vanilla ESM JS, React 18, Vite. No new unit tests (quota logic already covered by `scripts/test-free-limits.mjs`); verification = `vite build` + manual mock-harness pass.

**Spec:** `docs/superpowers/specs/2026-06-02-free-pro-rebalance-design.md` §2 (gate model), §3 Bucket B, §4 limits.

**Scope note:** This is increment **2a**. Equipment slot/rarity cap, 5-shadow cap, and 1-job cap (count-based gates, different pattern) are **2b** — a separate plan.

---

## Task 1: De-gate routes + expose `getQuotaStatus` + fix paywall copy

**Files:** Modify `data/premium.js`

- [ ] **Step 1: Drop dungeon + charisma from the hard Pro wall**

In `PREMIUM_ROUTE_FEATURES`, remove the `dungeon` and `charisma_overlay` lines:

```js
export const PREMIUM_ROUTE_FEATURES = {
  analytics: "advanced_analytics",
  story: "story_mode",
  equipment: "equipment",
  shadows: "shadow_army",
  jobs: "jobs",
  challenges: "events",
  protocol_overlay: "dawn_dusk",
  seasons_overlay: "seasons",
  soullink_overlay: "soul_link",
};
```

(Equipment/shadows/jobs stay for now — Phase 2b. challenges/protocol/seasons/soullink — Phase 4.)

- [ ] **Step 2: Re-export `getQuotaStatus` so consumers import from one place**

Extend the existing re-export line (added in Phase 1):

```js
export { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT, canPurchaseExtraSlot, getQuotaStatus } from "./freeLimits.js";
```

- [ ] **Step 3: Update the dungeon + charisma paywall copy to mean "cap reached"**

The Premium modal now appears when a *free* user hits the daily cap (not a hard wall). In `PREMIUM_FEATURES`, replace the `dungeons` and `charisma_dungeons` entries' `desc` + `bullets`:

```js
  dungeons: {
    eyebrow: "GATE ACCESS",
    title: "Mehr Dungeon Gates sind Hunter Pro",
    desc: "Free-Hunter koennen 3 Gates pro Tag betreten. Hunter Pro hebt das Tageslimit auf.",
    bullets: ["3 Gates/Tag gratis", "Unbegrenzt mit Pro", "Boss-Runs & Loot"],
  },
```

```js
  charisma_dungeons: {
    eyebrow: "SOCIAL GATES",
    title: "Mehr Charisma Dungeons sind Hunter Pro",
    desc: "Starte 1 Charisma-Kette pro Tag gratis. Hunter Pro macht soziales Training unbegrenzt.",
    bullets: ["1 Kette/Tag gratis", "Unbegrenzt mit Pro", "CHA Progress"],
  },
```

- [ ] **Step 4: Verify + commit**

Run: `node scripts/test-free-limits.mjs` (regression — still green) and `node --check data/premium.js`
Expected: pass + no syntax error.

```bash
git add data/premium.js
git commit -m "feat(limits): de-gate dungeon + charisma routes; quota-aware paywall copy"
```

---

## Task 2: Daily-run counters (init + reset)

**Files:** Modify `hooks/useGameState.jsx`

- [ ] **Step 1: Initialise the counters in fresh state**

Find the fresh-state block (the one with `dailyUserQuestsCreated: 0, extraDailySlots: 0, dailyUserXP: 0,`) and add the two counters:

```js
    dailyUserQuestsCreated: 0,
    extraDailySlots: 0,
    dailyUserXP: 0,
    dailyDungeonsRun: 0,
    dailyCharismaRun: 0,
```

- [ ] **Step 2: Reset them on the daily rollover**

In the daily-rollover block, find `s.dailyUserXP = 0;` and add the resets right after:

```js
            s.dailyUserQuestsCreated = 0;
            s.extraDailySlots = 0;
            s.dailyUserXP = 0;
            s.dailyDungeonsRun = 0;
            s.dailyCharismaRun = 0;
```

> `getQuotaStatus` defaults a missing counter to 0, so existing persisted states stay valid (backward compatible) — these resets just keep the day boundary correct.

- [ ] **Step 3: Commit** (committed together with Task 4's import change to keep the file's commits coherent — see Task 4 Step 4.)

---

## Task 3: Dungeon entry quota gate

**Files:** Modify `solo-leveling-v5.jsx`

- [ ] **Step 1: Import `getQuotaStatus`**

Extend the existing premium import (currently `import { getDailyQuestCreationStatus, getPremiumFeatureForRoute } from './data/premium.js';`):

```js
import { getDailyQuestCreationStatus, getPremiumFeatureForRoute, getQuotaStatus } from './data/premium.js';
```

- [ ] **Step 2: Gate `onEnterGate` and count the run**

Replace the `onEnterGate` handler (single line, currently):

```js
              onEnterGate={(dungeon) => { setPreview3DDungeon(null); const fee = DUNGEON_ENTRY_FEES[dungeon.rank] || 0; if (fee > 0) persist({ ...state, gold: state.gold - fee }); setActiveDungeon(dungeon); setBattlePendingStart(true); }}
```

with:

```js
              onEnterGate={(dungeon) => {
                const dq = getQuotaStatus("dungeons", { premiumActive: premiumStatus?.active, state });
                if (!dq.allowed) { openPremiumModal("dungeons"); return; }
                setPreview3DDungeon(null);
                const fee = DUNGEON_ENTRY_FEES[dungeon.rank] || 0;
                persist({ ...state, gold: fee > 0 ? state.gold - fee : state.gold, dailyDungeonsRun: (state.dailyDungeonsRun || 0) + 1 });
                setActiveDungeon(dungeon);
                setBattlePendingStart(true);
              }}
```

> `premiumStatus` and `openPremiumModal` are already in scope in this component. The counter is incremented on entry (one entry = one run); the daily reset (Task 2) clears it.

- [ ] **Step 3: Commit**

```bash
git add solo-leveling-v5.jsx
git commit -m "feat(limits): cap free dungeon runs at 3/day at gate entry"
```

---

## Task 4: Charisma start quota gate

**Files:** Modify `hooks/useGameState.jsx`, `data/locales/en.js`, `data/locales/de.js`

- [ ] **Step 1: Add the cap message**

In `data/locales/en.js`, inside the `questActions` object (next to `charismaAlreadyActive`), add:

```js
      charismaDailyCap: "Daily Charisma Dungeon limit reached. Hunter Pro removes the cap.",
```

In `data/locales/de.js`, same object:

```js
      charismaDailyCap: "Tageslimit fuer Charisma Dungeons erreicht. Hunter Pro hebt das Limit auf.",
```

- [ ] **Step 2: Import `getQuotaStatus` in the hook**

Extend the existing import (currently `import { getDailyQuestCreationStatus, getPremiumStatus, redeemBetaPremiumCode, canPurchaseExtraSlot } from '../data/premium.js';`):

```js
import { getDailyQuestCreationStatus, getPremiumStatus, redeemBetaPremiumCode, canPurchaseExtraSlot, getQuotaStatus } from '../data/premium.js';
```

- [ ] **Step 3: Gate `startCharismaChain` + count the run**

In `startCharismaChain`, after the three existing guard checks (the `charismaAlreadyCompleted` line) and before `const step = chain.steps[0];`, insert:

```js
    const chQuota = getQuotaStatus("charisma_dungeons", { premiumActive: getPremiumStatus(state?.premium).active, state });
    if (!chQuota.allowed) { notify(ltState(state, "questActions.charismaDailyCap"), "warning"); return; }
```

In the same function's `persist({ ... })`, add the counter increment:

```js
    persist({
      ...state,
      quests: [...state.quests, quest],
      dailyCharismaRun: (state.dailyCharismaRun || 0) + 1,
      charismaDungeons: {
        ...state.charismaDungeons,
        activeChains: { ...(state.charismaDungeons?.activeChains || {}), [chainId]: { currentStep: 1, startedAt: getToday() } }
      }
    });
```

- [ ] **Step 4: Commit** (includes Task 2's counter init/reset, same file)

```bash
git add hooks/useGameState.jsx data/locales/en.js data/locales/de.js
git commit -m "feat(limits): cap free charisma chains at 1/day; init+reset daily-run counters"
```

---

## Task 5: De-gate the Charisma overlay render

**Files:** Modify `solo-leveling-v5.jsx`

- [ ] **Step 1: Drop the premium-only render guard**

Replace (currently):

```jsx
            {premiumStatus?.active && showCharismaView && (
              <CharismaDungeonsView
```

with:

```jsx
            {showCharismaView && (
              <CharismaDungeonsView
```

> Free users can now open and browse Charisma Dungeons; the per-day run cap (Task 4) is what gates them, not entry.

- [ ] **Step 2: Build smoke test**

Run: `npx vite build`
Expected: build succeeds (exit 0).

- [ ] **Step 3: Commit**

```bash
git add solo-leveling-v5.jsx
git commit -m "feat(limits): allow free users into the Charisma Dungeons view"
```

---

## Self-Review

- **Spec coverage:** §2 hard-wall removal for dungeon + charisma (Tasks 1, 5) ✔; §3/§4 quotas Dungeons 3/day (Task 3) + Charisma 1/day (Task 4) ✔; counters reset daily (Task 2) ✔; paywall now means "cap reached" not "no access" (Task 1 Step 3) ✔.
- **Placeholder scan:** none — every edit has exact before/after. `~line` markers are search anchors paired with literal code.
- **Type consistency:** `getQuotaStatus(featureKey, { premiumActive, state })` is called identically in `onEnterGate` and `startCharismaChain`, matching the Phase 1 signature + its tests. Counter fields `dailyDungeonsRun` / `dailyCharismaRun` match `QUOTA_CONFIG` (`data/freeLimits.js`).

## Manual verification (mock harness, free user)
1. Open Dungeon view (no paywall now). Enter 3 gates → 4th entry opens the Premium modal (`dungeons`). Next day → resets to 3.
2. Open Charisma Dungeons (no paywall now). Start 1 chain → 2nd start shows the `charismaDailyCap` toast.
3. Premium user → unlimited dungeon entries + charisma chains (regression).

## Next (Phase 2b)
Equipment (3 slots, max rarity Rare), Shadow Army (5 shadows), Jobs (1 class) — de-gate routes + count/rarity caps at `equipItem` / shadow-extract / job-select.
