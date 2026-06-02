# Free / Pro Rebalance Phase 3 - AI Free Taste

**Goal:** Give free accounts a controlled AI preview: 3 successful interactive generations total, max 1 per local day, unlocked at Level 3 after 5 completed quests. Pro remains unlimited.

**Scope:** Meter deliberate user actions only:

- Task photo scan
- Quest description generation
- Optional quest photo verification

Automatic dynamic quests and automatic coach messages stay Pro-only so a background effect never spends a free credit.

## Implementation

1. Add pure AI trial helpers to `data/freeLimits.js` and cover them in `scripts/test-free-limits.mjs`.
2. Persist `state.ai.freeCreditsUsed` and `state.ai.lastFreeCreditDate`; merge and migrate them conservatively.
3. Expose a `recordAIFreeGeneration()` action from `hooks/useGameState.jsx`.
4. Add `requireAIGeneration()` and `runAIGeneration()` in `solo-leveling-v5.jsx`.
5. Route Task Scan, Quest Description, and Quest Verification through the wrapper. A credit is recorded only after a successful Cloud Function response.
6. Update free-facing scan/detail labels so an available preview is not presented as already Pro-only.

## Verification

- `node scripts/test-free-limits.mjs`
- all `scripts/test-*.mjs`
- `npm run build`

## Pre-launch hardening note

Cloud Functions already enforce a protected per-account daily API limit in `functions/rateLimiter.js`. The current Hunter Pro entitlement remains client-authored in the existing billing architecture. Before launch, move billing entitlement verification to a server-trusted source and enforce AI feature access in the callable functions as well.
