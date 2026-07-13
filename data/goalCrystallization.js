// goalCrystallization.js — Ziele aus Verhalten herauskristallisieren.
// Rein regelbasiert (kein KI-Call): >=5 erledigte EIGENE Quests in einer
// Kategorie ohne aktives Ziel -> einmal pro Woche ein Vorschlag.
// Abgelehnte Kategorien pausieren 4 Wochen.

import { GOAL_CATEGORY_TO_STAT } from "./goalQuests.js";

const STAT_TO_GOAL_CATEGORY = Object.fromEntries(
  Object.entries(GOAL_CATEGORY_TO_STAT).map(([goalCategory, stat]) => [stat, goalCategory])
);
const MIN_COMPLETIONS = 5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DECLINE_MS = 4 * WEEK_MS;

export function getCrystallizationSuggestion(state = {}, { now = Date.now() } = {}) {
  // Ziele schalten erst mit Level 5 frei (wie shouldShowGoalRitual) - vorher
  // wuerde die Karte in eine gesperrte View routen und den Wochen-Slot verbrennen.
  if ((state?.level || 1) < 5) return null;

  const meta = state.goalCrystallization || {};
  if (meta.lastCheckAt && now - meta.lastCheckAt < WEEK_MS) return null;

  const declined = meta.declinedUntilByCategory || {};
  const activeGoalCategories = new Set(
    (state.goals || [])
      .filter((goal) => (goal?.milestones || []).some((m) => m && !m.completed))
      .map((goal) => goal.category)
  );

  const counts = {};
  for (const quest of state.completedQuests || []) {
    if (!quest || quest.isSystem) continue; // nur eigene Aufgaben = echtes Interesse
    const goalCategory = STAT_TO_GOAL_CATEGORY[quest.category];
    if (!goalCategory) continue;
    counts[goalCategory] = (counts[goalCategory] || 0) + 1;
  }

  const candidates = Object.entries(counts)
    .filter(([category, count]) => count >= MIN_COMPLETIONS
      && !activeGoalCategories.has(category)
      && !(declined[category] && declined[category] > now))
    .sort((a, b) => b[1] - a[1]);

  if (candidates.length === 0) return null;
  return { category: candidates[0][0], count: candidates[0][1] };
}

export function markCrystallizationChecked(state = {}, { now = Date.now() } = {}) {
  return {
    ...state,
    goalCrystallization: { ...(state.goalCrystallization || {}), lastCheckAt: now },
  };
}

export function declineCrystallization(state = {}, category, { now = Date.now() } = {}) {
  return {
    ...state,
    goalCrystallization: {
      ...(state.goalCrystallization || {}),
      lastCheckAt: now,
      declinedUntilByCategory: {
        ...(state.goalCrystallization?.declinedUntilByCategory || {}),
        [category]: now + DECLINE_MS,
      },
    },
  };
}
