# Free/Pro Rebalance — Phase 1: Limits Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-source-of-truth limits layer (`FREE_LIMITS` + pure quota helpers), raise the free quest cap from 1 → 10/day, and make that cap un-buyable-around by capping purchasable extra slots at 5/day.

**Architecture:** All newly-tested logic lives in a **zero-import** module `data/freeLimits.js` so it is trivially unit-testable with the project's Node-script convention (no i18n/DOM coupling). `data/premium.js` imports from it and keeps its existing public API (`getDailyQuestCreationStatus`, `FREE_DAILY_QUEST_LIMIT`) as thin wrappers/re-exports, so no caller breaks. The two shop buy-handlers in `hooks/useGameState.jsx` gain a guardrail check before granting an extra slot.

**Tech Stack:** Vanilla ESM JS, React 18 (hooks), Vite. No test framework — tests are standalone `node scripts/test-*.mjs` files using a local `assert()` that calls `process.exit(1)` on failure.

**Spec:** `docs/superpowers/specs/2026-06-02-free-pro-rebalance-design.md` (§4 limits, §5 guardrails). This plan implements **only** §4 + §5 guardrail #1. De-gating, per-feature quotas, AI taste, and copy are Phases 2–4 (see Roadmap).

---

## File Structure

| File | Responsibility | Phase 1 change |
|---|---|---|
| `data/freeLimits.js` | **New.** Pure limits config + pure status/guard functions. Zero imports. | Create |
| `data/premium.js` | Premium status + the public quest-creation status API. | Import from `freeLimits.js`; delegate `getDailyQuestCreationStatus`; re-export `FREE_LIMITS` / `FREE_DAILY_QUEST_LIMIT` / `canPurchaseExtraSlot`. |
| `scripts/test-free-limits.mjs` | **New.** Unit tests for `freeLimits.js`. | Create |
| `package.json` | npm scripts. | Add `test:free-limits`. |
| `hooks/useGameState.jsx` | Game state + shop buy handlers. | Guardrail in `buyItem` (`extra_slot`) + `buyGemItem` (`gem_extra_slot`). |
| `data/locales/en.js`, `data/locales/de.js` | UI strings. | Add `shop.notifications.extraSlotCapped`. |

---

## Task 1: `data/freeLimits.js` — the limits config

**Files:**
- Create: `data/freeLimits.js`
- Create: `scripts/test-free-limits.mjs`
- Modify: `package.json` (scripts block)

- [ ] **Step 1: Write the failing test**

Create `scripts/test-free-limits.mjs`:

```js
import { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT } from "../data/freeLimits.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

// ── FREE_LIMITS config ──
assert(FREE_LIMITS.questsPerDay === 10, "questsPerDay should be 10");
assert(FREE_LIMITS.purchasableSlotsPerDay === 5, "purchasableSlotsPerDay should be 5");
assert(FREE_LIMITS.dungeonsPerDay === 3, "dungeonsPerDay should be 3");
assert(FREE_LIMITS.charismaDungeonsPerDay === 1, "charismaDungeonsPerDay should be 1");
assert(FREE_LIMITS.equipmentSlots === 3, "equipmentSlots should be 3");
assert(FREE_LIMITS.equipmentMaxRarity === "rare", "equipmentMaxRarity should be 'rare'");
assert(FREE_LIMITS.shadowsMax === 5, "shadowsMax should be 5");
assert(FREE_LIMITS.jobsMax === 1, "jobsMax should be 1");
assert(FREE_LIMITS.aiFreeCreditsTotal === 3, "aiFreeCreditsTotal should be 3");
assert(FREE_LIMITS.aiFreeCreditsPerDay === 1, "aiFreeCreditsPerDay should be 1");
assert(FREE_DAILY_QUEST_LIMIT === 10, "FREE_DAILY_QUEST_LIMIT back-compat alias should equal 10");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("test-free-limits: all assertions passed.");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-free-limits.mjs`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` (`data/freeLimits.js` does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `data/freeLimits.js`:

```js
// ─── FREE-TIER LIMITS ─────────────────────────────────────────
// Single source of truth for every free-tier cap. Pro resolves to Infinity
// at the call sites. This module has ZERO imports so it stays trivially
// unit-testable (no i18n/DOM coupling).

export const FREE_LIMITS = {
  questsPerDay: 10,           // manual quest creation/day (was 1)
  purchasableSlotsPerDay: 5,  // guardrail: max extra slots a free user can buy/day
  dungeonsPerDay: 3,
  charismaDungeonsPerDay: 1,
  equipmentSlots: 3,
  equipmentMaxRarity: "rare", // common | uncommon | rare
  shadowsMax: 5,
  jobsMax: 1,
  aiFreeCreditsTotal: 3,
  aiFreeCreditsPerDay: 1,
};

// Back-compat: existing imports use this name.
export const FREE_DAILY_QUEST_LIMIT = FREE_LIMITS.questsPerDay;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-free-limits.mjs`
Expected: PASS — `test-free-limits: all assertions passed.`

- [ ] **Step 5: Add npm script and commit**

In `package.json`, add to the `scripts` block (next to the other `test:*` entries):

```json
    "test:free-limits": "node scripts/test-free-limits.mjs",
```

```bash
git add data/freeLimits.js scripts/test-free-limits.mjs package.json
git commit -m "feat(limits): add FREE_LIMITS single source of truth"
```

---

## Task 2: `computeQuestCreationStatus` + `canPurchaseExtraSlot`

These are the pure functions behind the 10/day cap and the slot guardrail. `premiumActive` is passed in (not resolved here) so the module stays import-free.

**Files:**
- Modify: `data/freeLimits.js`
- Modify: `scripts/test-free-limits.mjs`

- [ ] **Step 1: Write the failing test**

Append to `scripts/test-free-limits.mjs` (before the final `if (failures)` block):

```js
import { computeQuestCreationStatus, canPurchaseExtraSlot } from "../data/freeLimits.js";

// ── computeQuestCreationStatus: free baseline ──
let s = computeQuestCreationStatus({ premiumActive: false, createdCount: 0, extraDailySlots: 0 });
assert(s.limit === 10, "free limit with no extras should be 10");
assert(s.remaining === 10, "free remaining at 0 created should be 10");
assert(s.canCreate === true, "free can create at 0/10");

// ── free at cap ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 10, extraDailySlots: 0 });
assert(s.remaining === 0, "free remaining at 10 created should be 0");
assert(s.canCreate === false, "free cannot create at 10/10");

// ── extra slots add to the limit ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 10, extraDailySlots: 3 });
assert(s.limit === 13, "3 bought slots should raise limit to 13");
assert(s.canCreate === true, "can create again after buying slots");

// ── extra slots are clamped to purchasableSlotsPerDay (defensive) ──
s = computeQuestCreationStatus({ premiumActive: false, createdCount: 0, extraDailySlots: 99 });
assert(s.paidExtraSlots === 5, "extra slots clamp to 5 in status");
assert(s.limit === 15, "limit clamps to 10 + 5 = 15");

// ── premium = unlimited ──
s = computeQuestCreationStatus({ premiumActive: true, createdCount: 999, extraDailySlots: 0 });
assert(s.limit === Infinity, "premium limit is Infinity");
assert(s.canCreate === true, "premium can always create");

// ── canPurchaseExtraSlot ──
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 0 }).ok === true, "free can buy first slot");
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 5 }).ok === false, "free blocked at 5 bought");
assert(canPurchaseExtraSlot({ premiumActive: false, extraDailySlots: 4 }).remaining === 1, "1 slot remaining at 4 bought");
assert(canPurchaseExtraSlot({ premiumActive: true, extraDailySlots: 99 }).ok === true, "premium never blocked");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-free-limits.mjs`
Expected: FAIL — `computeQuestCreationStatus is not a function` (not exported yet).

- [ ] **Step 3: Write minimal implementation**

Append to `data/freeLimits.js`:

```js
// Pure quest-creation status. `premiumActive` is resolved by the caller.
export function computeQuestCreationStatus({ premiumActive = false, createdCount = 0, extraDailySlots = 0 } = {}) {
  const created = Math.max(0, Number(createdCount) || 0);
  const rawSlots = Math.max(0, Number(extraDailySlots) || 0);
  const paidExtraSlots = premiumActive ? rawSlots : Math.min(rawSlots, FREE_LIMITS.purchasableSlotsPerDay);
  const limit = premiumActive ? Infinity : FREE_LIMITS.questsPerDay + paidExtraSlots;
  const remaining = premiumActive ? Infinity : Math.max(0, limit - created);
  return {
    premiumActive,
    createdCount: created,
    freeLimit: FREE_LIMITS.questsPerDay,
    paidExtraSlots,
    purchasableSlotsPerDay: FREE_LIMITS.purchasableSlotsPerDay,
    purchasableSlotsRemaining: premiumActive ? Infinity : Math.max(0, FREE_LIMITS.purchasableSlotsPerDay - rawSlots),
    limit,
    remaining,
    canCreate: premiumActive || created < limit,
  };
}

// Guardrail #1: can a (free) user buy another daily extra slot?
export function canPurchaseExtraSlot({ premiumActive = false, extraDailySlots = 0 } = {}) {
  if (premiumActive) return { ok: true, remaining: Infinity };
  const purchased = Math.max(0, Number(extraDailySlots) || 0);
  const remaining = Math.max(0, FREE_LIMITS.purchasableSlotsPerDay - purchased);
  return { ok: remaining > 0, remaining };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-free-limits.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/freeLimits.js scripts/test-free-limits.mjs
git commit -m "feat(limits): pure quest-creation status + extra-slot guardrail"
```

---

## Task 3: `getQuotaStatus` — generic per-feature quota (foundation for Phase 2)

Pure helper that Phase 2 will use for dungeons/charisma. Reads a daily counter field that may not exist yet (defaults to 0), so it is forward-compatible.

**Files:**
- Modify: `data/freeLimits.js`
- Modify: `scripts/test-free-limits.mjs`

- [ ] **Step 1: Write the failing test**

Append to `scripts/test-free-limits.mjs`:

```js
import { getQuotaStatus, QUOTA_CONFIG } from "../data/freeLimits.js";

assert(QUOTA_CONFIG.dungeons.limitKey === "dungeonsPerDay", "dungeons maps to dungeonsPerDay");

// untracked feature → always allowed, infinite
let q = getQuotaStatus("not_a_feature", { premiumActive: false, state: {} });
assert(q.tracked === false && q.allowed === true && q.remaining === Infinity, "unknown feature is unlimited");

// free dungeons, none used
q = getQuotaStatus("dungeons", { premiumActive: false, state: {} });
assert(q.limit === 3 && q.remaining === 3 && q.allowed === true, "free dungeons start at 3/3");

// free dungeons, at cap
q = getQuotaStatus("dungeons", { premiumActive: false, state: { dailyDungeonsRun: 3 } });
assert(q.remaining === 0 && q.allowed === false, "free dungeons blocked at 3 run");

// premium dungeons unlimited
q = getQuotaStatus("dungeons", { premiumActive: true, state: { dailyDungeonsRun: 99 } });
assert(q.limit === Infinity && q.allowed === true, "premium dungeons unlimited");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-free-limits.mjs`
Expected: FAIL — `getQuotaStatus is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `data/freeLimits.js`:

```js
// featureKey → which daily counter field + which FREE_LIMITS key caps it.
export const QUOTA_CONFIG = {
  dungeons:          { counter: "dailyDungeonsRun", limitKey: "dungeonsPerDay" },
  charisma_dungeons: { counter: "dailyCharismaRun", limitKey: "charismaDungeonsPerDay" },
};

// Pure per-feature quota status. `state` supplies the daily counter; `premiumActive` from caller.
export function getQuotaStatus(featureKey, { premiumActive = false, state = {} } = {}) {
  const cfg = QUOTA_CONFIG[featureKey];
  if (!cfg) return { tracked: false, premiumActive, used: 0, limit: Infinity, remaining: Infinity, allowed: true };
  const used = Math.max(0, Number(state?.[cfg.counter]) || 0);
  const limit = premiumActive ? Infinity : Number(FREE_LIMITS[cfg.limitKey]) || 0;
  const remaining = premiumActive ? Infinity : Math.max(0, limit - used);
  return { tracked: true, premiumActive, used, limit, remaining, allowed: premiumActive || used < limit };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-free-limits.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/freeLimits.js scripts/test-free-limits.mjs
git commit -m "feat(limits): generic getQuotaStatus helper (dungeons/charisma)"
```

---

## Task 4: Wire `data/premium.js` to the new module (no behavior break)

Make `premium.js` delegate to `freeLimits.js` so the whole app uses one source. Public API names stay identical.

**Files:**
- Modify: `data/premium.js` (top imports; `FREE_DAILY_QUEST_LIMIT` line 4; `getDailyQuestCreationStatus` lines 248-263)

- [ ] **Step 1: Replace the local constant with re-exports**

In `data/premium.js`, **remove** line 4:

```js
export const FREE_DAILY_QUEST_LIMIT = 1;
```

and **add** to the import section at the top (after the existing `import { getLocaleObject, resolveLocale } from "./i18n.js";`):

```js
import { FREE_LIMITS, computeQuestCreationStatus, canPurchaseExtraSlot } from "./freeLimits.js";
export { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT, canPurchaseExtraSlot } from "./freeLimits.js";
```

- [ ] **Step 2: Delegate `getDailyQuestCreationStatus`**

Replace the body of `getDailyQuestCreationStatus` (lines ~248-263) with:

```js
export function getDailyQuestCreationStatus(state, nowMs = Date.now()) {
  const premiumStatus = getPremiumStatus(state?.premium, nowMs);
  return computeQuestCreationStatus({
    premiumActive: premiumStatus.active,
    createdCount: Number(state?.dailyUserQuestsCreated || 0),
    extraDailySlots: Number(state?.extraDailySlots || 0),
  });
}
```

> Note: the returned object keeps every field the old version had (`premiumActive`, `createdCount`, `freeLimit`, `paidExtraSlots`, `limit`, `remaining`, `canCreate`) plus two new ones — so existing consumers (`solo-leveling-v5.jsx`, `useGameState.jsx`) are unaffected.

- [ ] **Step 3: Verify nothing else references the old `FREE_DAILY_QUEST_LIMIT = 1`**

Run: `git grep -n "FREE_DAILY_QUEST_LIMIT" -- "*.js" "*.jsx"`
Expected: all hits resolve to the re-export from `freeLimits.js` (no remaining literal `= 1`). Confirm `data/premium.js` no longer defines it locally.

- [ ] **Step 4: Smoke-check the import chain builds**

Run: `npx vite build`
Expected: build succeeds (no unresolved import / circular-import error between `premium.js` and `freeLimits.js`). `freeLimits.js` has no imports, so no cycle is possible.

- [ ] **Step 5: Commit**

```bash
git add data/premium.js
git commit -m "refactor(limits): premium.js delegates quest-status to freeLimits; quest cap now 10/day"
```

---

## Task 5: Enforce the slot guardrail in the shop handlers

Block a free user from buying more than `purchasableSlotsPerDay` extra slots/day in both the gold shop (`buyItem`) and the gem shop (`buyGemItem`).

**Files:**
- Modify: `hooks/useGameState.jsx` (import line; `buyItem` ~line 2058; `buyGemItem` ~line 2541)
- Modify: `data/locales/en.js`, `data/locales/de.js` (`shop.notifications` object)

- [ ] **Step 1: Add the locale string**

In `data/locales/en.js`, inside the `shop.notifications` object (next to the existing `notEnoughGems` / `dungeonsRefreshed` keys), add:

```js
extraSlotCapped: "Daily extra-slot limit reached. Hunter Pro removes the cap.",
```

In `data/locales/de.js`, same object, add:

```js
extraSlotCapped: "Tageslimit fuer Extra-Slots erreicht. Hunter Pro hebt das Limit auf.",
```

> de.js intentionally avoids umlauts (project convention — see locale memory): use `fuer`, not `für`.

- [ ] **Step 2: Import the guard in `useGameState.jsx`**

Add `canPurchaseExtraSlot` to the existing `from "../data/premium.js"` import (premium.js re-exports it after Task 4). If quest-status is imported there as `getDailyQuestCreationStatus`, extend that same line, e.g.:

```js
import { getPremiumStatus, getDailyQuestCreationStatus, canPurchaseExtraSlot } from "../data/premium.js";
```

(Match the exact existing import statement; just add the `canPurchaseExtraSlot` identifier.)

- [ ] **Step 3: Guard `buyItem` (gold shop, `extra_slot`)**

Replace the `extra_slot` branch (currently lines ~2058-2060):

```js
      if (item.id === "extra_slot") {
        consumableEffects = { extraDailySlots: (state.extraDailySlots || 0) + 1 };
      }
```

with:

```js
      if (item.id === "extra_slot") {
        const slot = canPurchaseExtraSlot({
          premiumActive: getPremiumStatus(state?.premium).active,
          extraDailySlots: state.extraDailySlots || 0,
        });
        if (!slot.ok) {
          notify(ltState(state, "shop.notifications.extraSlotCapped"), "warning");
          return;
        }
        consumableEffects = { extraDailySlots: (state.extraDailySlots || 0) + 1 };
      }
```

- [ ] **Step 4: Guard `buyGemItem` (gem shop, `gem_extra_slot`)**

Replace the `gem_extra_slot` branch (currently lines ~2541-2542):

```js
      if (item.id === "gem_extra_slot") {
        effects.extraDailySlots = (state.extraDailySlots || 0) + 1;
      } else if (item.id === "gem_dungeon_refresh") {
```

with:

```js
      if (item.id === "gem_extra_slot") {
        const slot = canPurchaseExtraSlot({
          premiumActive: getPremiumStatus(state?.premium).active,
          extraDailySlots: state.extraDailySlots || 0,
        });
        if (!slot.ok) {
          notify(ltState(state, "shop.notifications.extraSlotCapped"), "warning");
          return;
        }
        effects.extraDailySlots = (state.extraDailySlots || 0) + 1;
      } else if (item.id === "gem_dungeon_refresh") {
```

> The early `return` happens before gems/gold are deducted (deduction is in the final `persist` of each handler), so a blocked purchase costs the user nothing. Confirm this while editing: the `return` must be above the `persist(...)` call in each handler.

- [ ] **Step 5: Verify in the running app**

The local Firebase login is dead — use the **mock harness** (per project workflow) to run as a free (non-premium) user. Verify:
1. Create quests until blocked → the block now triggers at **10** (not 1); the 11th opens the Premium modal (`unlimited_quests`).
2. Buy "Extra Task Slot" (gold) / "Premium Quest Slot" (gems) repeatedly → the **6th** purchase is refused with the `extraSlotCapped` toast; gold/gems are not deducted on the refused attempt.
3. As a premium user → no slot cap, quest creation unlimited (regression check).

- [ ] **Step 6: Commit**

```bash
git add hooks/useGameState.jsx data/locales/en.js data/locales/de.js
git commit -m "feat(limits): cap purchasable extra quest slots at 5/day (free)"
```

---

## Self-Review

- **Spec coverage (§4 + §5.1):** `FREE_LIMITS` (Task 1) ✔; quest cap 1→10 (Task 1 value + Task 4 delegation) ✔; slot-purchase cap of 5/day (Tasks 2 + 5) ✔; `getQuotaStatus` foundation for §3 quota features (Task 3) ✔. §5.2 reduced self-quest XP is **confirmed deferred** (spec §11.1) — out of Phase 1 by design. §5.3 gem faucet — no change required.
- **Placeholder scan:** none — every code step shows full code; locale strings are literal; the only `~line` markers are anchors for edits in large existing files, each paired with the exact before/after code.
- **Type consistency:** `computeQuestCreationStatus`/`canPurchaseExtraSlot`/`getQuotaStatus` signatures and field names (`canCreate`, `paidExtraSlots`, `remaining`, `limit`, `allowed`, `remaining`) are used identically in tests, in `premium.js` delegation, and in the `useGameState.jsx` call sites. `getDailyQuestCreationStatus` return shape is a superset of the original.

---

## Roadmap — later phases (separate plans, each preceded by targeted code reading)

- **Phase 2 — De-gate RPG depth + per-feature quotas.** Remove `dungeon`/`equipment`/`shadows`/`jobs`/`charisma` from `PREMIUM_ROUTE_FEATURES` (keep `story`); in `solo-leveling-v5.jsx` replace "block + bounce" with "allow entry"; wire `getQuotaStatus` + new daily counters (`dailyDungeonsRun`, `dailyCharismaRun`) into the dungeon-run and charisma flows (init + daily reset in `useGameState.jsx` rollover); enforce equipment slot/rarity caps and the 5-shadow / 1-job caps.
- **Phase 3 — AI free taste.** Metered 3-lifetime / 1-per-day credit gated by Level 3 **and** ≥ 5 completed quests; after exhaustion the AI entry points route to the Premium modal.
- **Phase 4 — Pro copy, cosmetics, Apple.** Drop "exklusive Themes" from the Pro pitch (Creator + Motion-FX only); remove `screen_time` from the premium widget keys; remove `soul_link` from `PREMIUM_ROUTE_FEATURES`; confirm Events free; locale copy pass.
