# Tier Level-Up Tutorials — "Present + Try-It" — Design Spec

- **Date:** 2026-06-01
- **Status:** Approved direction (brainstorm), pending spec review
- **Author:** John + Claude
- **Related:** `2026-06-01-tutorial-levelup-2.0-design.md`, `2026-06-01-tutorial-2.0-integration.md`

---

## 1. Goal & Context

When a player crosses a level that unlocks a new tier of features, they should (1) see
the unlock **presented beautifully**, then (2) be **guided through using the headline
feature once** — so the unlock is understood, not just announced.

Today the presentation exists (`LevelUpCinematic` → `SystemUnlockSequence` cascade), but
the follow-up `tier_1..8` tutorials are **mostly static cinematics** — only tiers 1/2/4
have a single highlight (info) step; tiers 3/5/6/7/8 are just a text card. There is **no
interactive "try the new feature" beat.** This spec adds exactly that, reusing the
existing tutorial overlay.

### Constraints (from user memory)
- Premium / minimal-luxe; no gimmickry. German UI. iPhone-first.
- **One headline feature per tier** gets the interactive try-it (decided in brainstorm);
  the rest are only presented in the cascade. Keep it short — no nagging.
- Interaction model **A**: guided coachmark on the **real** feature (same system as
  onboarding), driving **one real action**. The global "Überspringen" stays available.

---

## 2. Architecture — reuse, don't rebuild

The level-up serial chain is already wired correctly (`solo-leveling-v5.jsx`):

```
LevelUpCinematic (number/rank)
  → [AriseCinematic if a shadow]
  → SystemUnlockSequence (cascade — presents ALL newly unlocked features)
  → handleSystemUnlockComplete()  →  tutorialRef.triggerTierTutorial(tier)
  → the tier_N tutorial runs through the normal TutorialProvider + TutorialOverlay
```

**We do not touch this chain.** The work is:
1. **Rewrite the `tier_1..8` step sequences** in `data/tutorialSteps.js` from "cinematic
   only" into a short guided try-it (3–4 steps).
2. **Add `data-tutorial` anchors** to the headline feature's entry point + the one
   actionable control, where missing.
3. Everything else is reused: coachmark positioning, action detection (`click`/`input`),
   `advanceWhenTarget`/`advanceWhenAbsent`, the **portal-hide** during page transitions,
   the **hard scroll-lock**, reduced-motion, the skip button.

This keeps the change isolated to **data + a handful of anchors**, with no new components
or overlay logic.

---

## 3. The per-tier try-it sequence (pattern)

Each `tier_N` sequence becomes (lean, 3–4 steps):

1. **Nudge (info, optional, 1 line)** — short coach: "Probier dein neues Modul aus."
   *(Skipped where the cascade close already says enough — keep total ≤ 4 steps.)*
2. **Navigate (action)** — highlight where the headline feature lives and require the tap
   that goes there:
   - **On the Heute/dashboard** → highlight the feature in place (no nav).
   - **Behind a nav tab** (`nav-training`, `nav-dungeon`) → highlight the tab; tap navigates.
   - **In the Hunter-Island hub** → highlight `nav-system` → (apps grid) → the module tile.
   Uses `advanceWhenTarget` on the destination element so the step completes only once the
   feature screen is actually shown; the portal/page transition is auto-hidden.
3. **One real action (action)** — coachmark on the feature's primary control; the user
   performs THE one thing (create / enter / choose / open). Completion detected via the
   existing `click`/`input` action handlers (or `advanceWhenTarget` for view-only opens).
4. **Close (cinematic, 1 beat)** — "Geschafft — [Feature] ist jetzt Teil deines Systems."
   `confetti: true` on the headline close.

If the user is already on the feature screen when the tutorial starts, the Navigate step
auto-satisfies (`advanceWhenTarget` present) and is skipped.

---

## 4. Headline map (final)

| Tier | Lvl | Headline feature | Location | Try-it action | Completion |
|---|---|---|---|---|---|
| 1 | 3 | Habit Tracker | Heute (dashboard) | Add first habit | open habit-add control |
| 2 | 5 | Ziele (Goals) | Training tab | Set first goal | open goal-create |
| 3 | 8 | Dawn/Dusk Protocol | dashboard/module | Set a routine | open dawn/dusk *(swap to Achievements = open+view if preferred)* |
| 4 | 11 | Dungeon Gates | Dungeon tab | Open first gate | open a gate |
| 5 | 15 | Shadow Army | Hunter-Island | Open the module | arrive at shadow view |
| 6 | 21 | Jobs | Hunter-Island | Open Jobs (choose class) | arrive at jobs view |
| 7 | 30 | Soul Link | Hunter-Island | Open Soul Link | arrive at soul-link view |
| 8 | 36 | Multiplayer | Hunter-Island | Open the Association | arrive at multiplayer view |

For **view-heavy** headlines (Shadow Army roster, Soul Link, Multiplayer, optional
Achievements), "try-it" = **navigate to + open** the module with a one-line coach tour;
no forced sub-action (YAGNI — opening it once is "testing" it).

---

## 5. Anchors to add (`data-tutorial`)

Already present and reused: `habit-tracker`, `nav-training`, `nav-dungeon`, `nav-system`,
`apps-grid`, `bottom-nav`, dynamic `nav-${key}`.

To add (exact elements located during planning):
- `habit-add` — the "new habit" control inside the habit tracker.
- `goal-create` — the create-goal control in the Training/Goals view.
- `dawn-dusk` — the Dawn/Dusk entry (or its set-routine control).
- `dungeon-gate` — a single gate card/button in the Dungeon view.
- `apps-grid` module tiles for **shadow_army, jobs, soul_link, multiplayer** —
  e.g. `app-tile-shadow_army` etc. (one anchor per headline tile), so the Navigate step
  can target the right tile in the island app grid.

Each anchor is a thin addition to an existing element; no structural change.

---

## 6. Files to change

| File | Change |
|---|---|
| `data/tutorialSteps.js` | Rewrite `tier_1` … `tier_8` step arrays into the try-it pattern (§3) using the §4 map. |
| `components/views/DashboardView.jsx` | Add `habit-add` (+ `dawn-dusk` if it lives here). |
| Training/Goals view component | Add `goal-create`. |
| Dungeon view component | Add `dungeon-gate`. |
| `components/views/HunterIslandHub.jsx` | Add per-tile anchors for the 4 island headlines. |
| (locale files `de.js`/`en.js`) | Tier step titles/texts if they go through i18n keys. |

No changes to `TutorialOverlay.jsx`, `TutorialProvider.jsx`, the level-up chain, or
`SystemUnlockSequence` (presentation already done in 2.0).

---

## 7. Testing / Verification

- **Live drive in preview** (the real session works — see `local-preview-auth-wall`):
  the tier tutorials can be triggered without leveling by calling
  `tutorialRef.triggerTierTutorial(n)` — expose a temporary `window` hook during dev, or
  drive a real level-up. Verify per tier: cascade → tutorial navigates to the feature →
  the action completes → close beat; targets resolve; no scroll; transitions hidden.
- **Static audit:** every new tier step `target` resolves to a real anchor (same grep
  audit used for onboarding).
- **On device (TestFlight):** confirm the navigate/action timing + the page-transition
  hide for island modules.
- Reduced-motion + skip behave (inherited from the overlay).

---

## 8. Out of scope (later)

- **Pro-user tutorial path (H):** free users follow the above; pro unlocks branch
  mid-progression and must showcase all pro modules. Separate spec.
- Re-styling the present-unlock visuals (done in 2.0).
- New animation systems — we reuse the overlay.

---

## 9. Definition of Done

- Each tier `1..8` plays: present (cascade) → guided navigate → one real action → close.
- One headline feature per tier; rest presented only. Total ≤ 4 steps/tier.
- All tier step targets resolve; skip + reduced-motion respected; transitions hidden.
- Verified live for at least tiers 1, 4, and one island tier (5/6); rest audited.
