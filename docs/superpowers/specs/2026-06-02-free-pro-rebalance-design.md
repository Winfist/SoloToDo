# Free / Pro Rebalance — "Voll spielbar + Limits" — Design Spec

- **Date:** 2026-06-02
- **Status:** Approved — ready for implementation planning (§11 decisions confirmed 2026-06-02)
- **Author:** John + Claude
- **Related:** `2026-06-01-tier-levelup-tutorials-design.md` (level-gating context)

---

## 1. Goal & Context

### The problem
Today the free tier feels empty and the monetization is structurally hostile:

- **Double-gating.** Almost every interesting feature is locked by **two** independent
  systems at once — a **level gate** (`data/featureUnlocks.js`, unlock by playing) **and**
  a **hard Premium wall** (`data/premium.js` → `PREMIUM_ROUTE_FEATURES`). A free player
  crosses Level 11, the System celebrates *"D-RANG AUFSTIEG — Dungeon Gates aktiviert"*,
  taps the gate — and immediately hits the paywall (`navigateToWithAccess` →
  `requirePremium` in `solo-leveling-v5.jsx`). Earned, then taken away. Worst possible
  free-user moment.
- **1 quest/day.** `FREE_DAILY_QUEST_LIMIT = 1`. A to-do app where a free user may create
  exactly one task per day drives 1-star reviews in the first session.
- **Hard-walled for free** (full block, no taste): Dungeons, Equipment, Shadow Army, Jobs,
  Story, Analytics, Events, Dawn/Dusk, Seasons, Soul Link, Charisma — plus all AI, Quest
  Intensity, and the premium widgets.

Net effect: Free is a *demo with a lock*, not a generous game with a premium boost.

### The decision
Adopt **"Voll spielbar + Limits"**: the free user plays the **complete core loop**
(including the RPG fantasy — dungeons, equipment, shadows), but **capped by quotas**.
Pro removes the caps and adds the multipliers (AI, advanced analytics, the customization
*creator* + motion FX, ad-free). Free should feel like a real game; Pro should feel like
turning off the limiters.

### Constraints (from user memory)
- Premium / minimal-luxe; no gimmickry. German UI. iPhone-first.
- Pre-launch iOS hardening; AdMob + IAP in play. IAP still untested (needs Mac).

---

## 2. The gate model (the core principle)

Two gate types remain, and they **compose cleanly**. We remove the third (the hard Pro
wall on RPG-depth routes).

| Gate | Question it answers | Changes? |
|---|---|---|
| **Level gate** (`featureUnlocks.js`) | *When* does a feature appear? | **Unchanged** — progression by playing. |
| **Quota gate** (new) | *How much* does a free user get? | **New** — free is capped, Pro = unlimited. |
| ~~Hard Pro wall~~ (`PREMIUM_ROUTE_FEATURES`) | ~~Can a free user enter at all?~~ | **Removed** for RPG-depth routes; replaced by quota gates. |

**The rule going forward:** a feature is gated by **Level (always) + EITHER a quota
(free-capped, Pro-unlimited) OR Pro-only (no free access beyond an explicit taste)**.
Never "level-unlock, then hard Pro wall." This is the single sentence that resolves the
double-gating.

- **Quota features** = the RPG depth a free user should *feel* daily: dungeons, equipment,
  shadows, jobs, charisma dungeons, quest creation.
- **Pro-only features** = multipliers/convenience/cosmetics that don't fit a quota model:
  all AI, Quest Intensity automation, Advanced Analytics, the Custom-Theme *Creator* +
  premium Motion-FX, premium widgets (biometrics/vision board), ad-free gem flow.

---

## 3. The three buckets

### 🟢 Bucket A — fully free (this *is* the game)
Quests (manual, capped — see §4), Habits, Stats, Calendar, Goals/Training, Focus Mode,
Achievements/Weeklys, Shop + Gem Shop, Inner Sanctum, Codex, **Soul Link / Social,
Events**. No Pro wall, no quota beyond the quest cap.

### 🟡 Bucket B — free but quota-capped (the RPG fantasy, to hook)

| Feature | Free | Pro |
|---|---|---|
| Quest creation (manual) | **10 / day** | unlimited |
| Dungeon Gates | **3 / day** | unlimited |
| Equipment | **3 slots, up to rarity *Rare*** | all slots + Epic/Legendary |
| Shadow Army | **up to 5 shadows** | unlimited + Named Shadows |
| Jobs / Classes | **1 class** | Multi-class + Respec |
| Charisma Dungeons | **1 / day** | unlimited |

### 🔵 Bucket C — Pro-only (multipliers, no quota model)
- **AI Forge** (the cost center): Task-Scan, Quest-Details, Verification, Dynamic Quests,
  AI-Coach — see §6 for the free taste.
- **Quest Intensity** (auto System-call cadence).
- **Advanced Analytics** (basic stats stay free in Bucket A).
- **Customization:** Custom-Theme **Creator** + premium **Motion-FX** (HUD/Cursor/
  Cinematic). *Ready-made themes/transitions stay the gem-earnable path — see §7.*
- **Premium Widgets:** Biometrics, Vision Board. *(Screen Time parked — see §8.)*
- **Ad-free Gem Flow:** free watches an ad for the daily gem bonus; Pro skips it.
- **Story** — premium narrative content with no natural quota; **Pro-only** (confirmed).

**Pro pitch (5 pillars):** Unbegrenzt · KI-Forge · Pro-Insights · Dein Look · Werbefrei.

---

## 4. Free-tier limits — single source of truth

Replace the lone `FREE_DAILY_QUEST_LIMIT` with a `FREE_LIMITS` config in `data/premium.js`,
so every cap lives in one place and Pro resolves to `Infinity`:

```js
export const FREE_LIMITS = {
  questsPerDay: 10,          // was FREE_DAILY_QUEST_LIMIT = 1
  purchasableSlotsPerDay: 5, // NEW — guardrail #1 (see §5)
  dungeonsPerDay: 3,
  charismaDungeonsPerDay: 1,
  equipmentSlots: 3,
  equipmentMaxRarity: "rare", // common | uncommon | rare
  shadowsMax: 5,
  jobsMax: 1,
  aiFreeCreditsTotal: 3,      // see §6
  aiFreeCreditsPerDay: 1,
};
```

A small `requireQuota(featureKey, state)` helper mirrors the existing `requirePremium`
pattern: Pro → always allowed; free → allowed while under the daily/total cap, else open
the Premium modal with the matching `contextFeature`. Daily counters reset in the existing
daily-rollover block in `hooks/useGameState.jsx` (where `dailyUserQuestsCreated` /
`dailyUserXP` already reset).

New state counters needed (reset daily unless noted): `dailyDungeonsRun`,
`dailyCharismaRun`, `dailySlotsPurchased`; persistent: shadow count + equipment already
live in state; AI free-credit tracking (`state.ai.freeCreditsUsed`, total + lastUsedDate).

---

## 5. Anti-abuse guardrails (so the 10/day cap is real)

The quest cap only matters if it can't be trivially bypassed. Two leaks found in
`data/gameData.js`:

1. **Buyable quest slots have no daily ceiling.** `SHOP_ITEMS.extra_slot` (100 gold) and
   `GEM_SHOP_ITEMS.gem_extra_slot` (8 gems) each grant "+1 slot today" with no limit. Gold
   is farmed from the very quests you complete (~25 gold/quest → ~4 quests buys a slot), so
   a determined free user blows past 10.
   → **Fix (committed): cap purchasable extra slots at `purchasableSlotsPerDay = 5`**,
   counted across gold *and* gems. Enforced in the buy handlers + reflected in
   `getDailyQuestCreationStatus`.

2. **Self-created quests grant full XP at user-chosen difficulty.** 10 quests on "Boss"
   (100 XP) ≈ 1000 base XP/day ≈ 10 levels at E-rank. The only brake is per-difficulty
   `waitHours` (Boss = 2h), itself skippable via `gem_quest_skip` (5 gems).
   → **Fix (OPTIONAL — confirmed deferred, not phase 1):** give self-created quests **reduced
   XP**, with the meaningful XP coming from System quests, dungeons, and (Pro) verified
   quests. Listed here so it's captured; **not committed in phase 1** — we ship guardrail #1
   first and only add this if the cap still leaks in practice. (Touches `computeXpGain`.)

3. **Keep the daily free gem faucet modest** so it can't compound into XP boosters
   (`gem_mega_xp` +100%) or slot purchases. No change required if the ad-gated daily bonus
   stays small; flagged for awareness.

---

## 6. AI free taste

Every account gets **3 free AI generations total**, designed so they can't be farmed and
so the user has earned some progress first:

- **Max 1 per day** (no two on the same day).
- **Unlocked at Level 3** (where `ai_task_scan` / `ai_quest_desc` first appear in
  `featureUnlocks.js`) **and** after **≥ 5 completed quests** (confirmed).
- Tracked via `state.ai.freeCreditsUsed` + `lastFreeCreditDate`. After 3 used → the AI
  entry points route to the Premium modal (`contextFeature` = the relevant AI feature).

Rationale: AI is the strongest converter but a real per-call cost; a metered taste hooks
without opening a free farm.

---

## 7. Cosmetics reconciliation

"Premium Customization" currently overlaps with the gem/gold shop, which already sells
free users themes (Crimson 400 gold, Void 80 gems) and page transitions (35–220 gems) in
`data/gameData.js`. That double-sell devalues the Pro pitch.

**Resolution:**
- **Drop "exklusive Themes" from the Pro benefit copy** (`data/premium.js`
  `PREMIUM_PRODUCT.benefits` + locale strings).
- **Pro customization = the Custom-Theme *Creator* + premium Motion-FX** (HUD/Cursor/
  Cinematic), which the shop does *not* sell.
- **Ready-made themes/transitions stay the gem-earnable path** for free users — unchanged.

---

## 8. iOS / Apple constraints

- **Screen Time = parked.** iOS exposes Screen Time only via `FamilyControls` /
  `DeviceActivity`, which require a **special Apple entitlement** (granted case-by-case,
  intended for parental-control apps) and the data largely cannot leave the device. High
  risk of rejection. **Do not ship "Bildschirmzeit" as a Pro selling point until the
  entitlement is confirmed.** Remove `screen_time` from `PREMIUM_WIDGET_MODULE_KEYS` /
  dashboard widget keys for now.
- **HealthKit / Biometrics = OK behind Pro**, subject to Guideline 5.1.3 (never use health
  data for advertising/selling; request only what is displayed; privacy policy required).
- **Trial:** keep **30 days** for the launch phase, plan to drop to **7 days** later.
  Implement as an **App Store introductory offer** (App Store Connect / RevenueCat), not
  only via the existing beta-code mechanism. The activation/expiry plumbing in
  `data/premium.js` (`activeUntil`, `source`, `getPremiumStatus`) is reusable.
- *(Apple policy shifts; re-verify all of the above before submission. Knowledge as of
  Jan 2026.)*

---

## 9. Affected code (map for the implementation plan)

| File | Change |
|---|---|
| `data/premium.js` | Add `FREE_LIMITS`; remove RPG-depth routes from `PREMIUM_ROUTE_FEATURES` (dungeon, equipment, shadows, jobs, charisma); keep `story` Pro; drop `soul_link` from Pro; update `getDailyQuestCreationStatus` for the slot cap; trim `PREMIUM_FEATURES` + benefit copy (cosmetics, screen_time); add `requireQuota` helper. |
| `data/featureUnlocks.js` | No level changes; remains the "when it appears" source. |
| `solo-leveling-v5.jsx` | `navigateToWithAccess` / `requirePremium` / the bounce `useEffect` (~L826) — for quota features, replace "block + bounce" with "allow entry; enforce quota inside the feature." Keep hard gating only for Bucket C. |
| `hooks/useGameState.jsx` | New daily counters + reset in the rollover block; quota checks on dungeon run / shadow extract / equip / job pick; AI free-credit tracking; (optional) reduced self-quest XP in `computeXpGain`. |
| `data/gameData.js` | Enforce `purchasableSlotsPerDay` in the `extra_slot` / `gem_extra_slot` buy paths; themes/transitions unchanged. |
| Locale files (`data/locales/*.js`) | Premium benefit copy edits (cosmetics wording, remove screen-time emphasis); new quota/limit strings. |

---

## 10. Out of scope (Phase 2)

**Personalized AI Quest Forge** — Pro-only generation of custom quests from user *behavior*
(self-created quests, completion patterns, feedback) + the **3 paths chosen at onboarding**.
This replaces/extends the current broadcast System-quests with per-user tailored quests.
Designed and built **after** this rebalance lands, as its own spec → plan → implementation.

---

## 11. Decisions (confirmed 2026-06-02)

1. **Reduced self-quest XP (§5.2):** **deferred** — not in phase 1. Ship guardrail #1
   (slot-purchase cap) first; revisit only if the 10/day cap still leaks in practice.
2. **AI free taste (§6):** unlocks after **≥ 5 completed quests** (plus Level 3, max 1/day,
   3 total).
3. **Story:** **Pro-only** — premium narrative content, no natural quota; stays in
   `PREMIUM_ROUTE_FEATURES`.
4. **Events:** **free** (Bucket A), alongside Soul Link / Social.
