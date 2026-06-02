# Personalized AI Quest Forge - Phase 1 Design

- **Date:** 2026-06-02
- **Status:** Approved for implementation
- **Scope:** Dynamic Pro System Quests only

## Goal

Upgrade the existing Gemini-generated Daily Quests from a thin stat-based prompt to a
small personalized Forge profile. The Forge should account for the three life domains
chosen during onboarding and for recent behavior without persisting a second profile.

## Inputs

The client derives a bounded transient profile from existing state:

- up to 3 onboarding life domains and their focus stats
- completion counts by stat category
- up to 8 recent completed Quests with bounded feedback fields
- up to 8 own Quest patterns from open, completed, and recently used Quests
- up to 3 active goals with their next milestone
- up to 4 active habits with streak and completion totals
- aggregate Focus minutes and sessions, including the recent seven-day total

## Privacy Boundary

The Forge never sends notes, hunter name, account data, Screen Time, health data, raw
habit history, raw Focus sessions, or full state. The Cloud Function sanitizes the
client profile again before adding it to the prompt. User-authored strings are marked
as untrusted context and must never be treated as model instructions.

## Behavior

- The existing Pro-only dynamic Quest cadence stays unchanged.
- Static System Quests remain the fallback when Gemini fails or times out.
- At least one generated Quest trains the weakest stat.
- When Forge context exists, at least two generated Quests should connect to chosen
  paths, recent behavior, goals, or habits.
- Generated output remains limited to three Daily Quests with bounded text fields.

## Deferred

- UI for Quest feedback capture
- server-side RevenueCat entitlement verification
- long-term Forge profile persistence or embeddings
- analytics for generated Quest acceptance and completion rates
