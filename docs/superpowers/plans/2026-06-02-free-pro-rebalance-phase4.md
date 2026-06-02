# Free / Pro Rebalance Phase 4 - Social, Copy, and Parked Screen Time

**Goal:** Finish the approved Free / Pro presentation: keep viral and engagement loops free, park Screen Time until Apple entitlement approval, reconcile cosmetic copy, and enforce Named Shadows as a Pro distinction.

## Implementation

1. Add a pure `canAddNamedShadow()` policy and gate every Named Shadow award path behind level unlock + Pro.
2. Remove `challenges` and `soullink_overlay` from Premium route gating.
3. Open the Soul Link overlay for free users after its level unlock and expose an entry in Hunter Island.
4. Add a central `SCREEN_TIME_ENABLED = false` flag. Hide Screen Time settings, dashboard widgets, analytics metrics, native widget modules, and automatic Screen Time Quest injection while preserving the implementation for later reactivation.
5. Update Premium copy:
   - Free manual Quest limit is 10/day, not 1/day.
   - AI entry-point copy mentions the earned 3-generation preview.
   - Premium customization sells the Custom Theme Creator and motion effects, not shop-earnable themes or transitions.
   - Widget copy omits Screen Time.
6. Add a focused Phase 4 regression script.

## Verification

- `node scripts/test-free-pro-phase4.mjs`
- `node scripts/test-free-limits.mjs`
- all `scripts/test-*.mjs`
- `npm run build`
