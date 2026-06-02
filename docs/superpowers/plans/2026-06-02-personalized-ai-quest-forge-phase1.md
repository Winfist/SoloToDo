# Personalized AI Quest Forge - Phase 1 Plan

**Goal:** Feed bounded onboarding and behavior context into the existing Pro dynamic
Quest generator without adding persistent state or changing the static fallback.

## Implementation

1. Add a pure client helper that derives a privacy-bounded Forge profile from state.
2. Add a server helper that sanitizes all profile fields and numeric inputs again.
3. Send the derived profile from `useGeminiAI` to `generateDynamicQuests`.
4. Extend the Gemini prompt with untrusted-data boundaries and personalization rules.
5. Bound generated Quest titles, descriptions, and sub-Quest titles on return.
6. Add a focused regression script and run the existing regression suite, build, and
   browser smoke test.

## Verification

- `node scripts/test-ai-quest-profile.mjs`
- all `scripts/test-*.mjs`
- `npm run build`
