// questPoolWeighting.js — Gewichtete Auswahl aus dem statischen Quest-Pool.
// Personalisierung OHNE KI: Lebensbereiche, aktive Ziele, User-Feedback und
// der schwaechste Stat verschieben die Auswahlwahrscheinlichkeit. Gilt fuer
// Free-User ab Tag 1 und als Fallback, wenn die KI-Generierung scheitert.

import { getFocusStats } from "./lifeDomains.js";
import { GOAL_CATEGORY_TO_STAT } from "./goalQuests.js";
import { getAvoidedCategories, getLikedCategories } from "./hunterDossier.js";

const CATS = ["str", "int", "vit", "agi", "cha"];

export function computeCategoryWeights(state = {}) {
  const weights = Object.fromEntries(CATS.map((cat) => [cat, 1]));

  for (const stat of getFocusStats(state.lifeDomains)) {
    if (weights[stat] != null) weights[stat] += 2;
  }

  for (const goal of state.goals || []) {
    const stat = GOAL_CATEGORY_TO_STAT[goal?.category];
    const hasOpenMilestone = (goal?.milestones || []).some((m) => m && !m.completed);
    if (stat && hasOpenMilestone && weights[stat] != null) weights[stat] += 2;
  }

  // Feedback der letzten 20 Abschluesse (Chips aus dem Reward-Moment)
  for (const quest of (state.completedQuests || []).slice(-20)) {
    if (!quest?.category || weights[quest.category] == null) continue;
    if (quest.categoryFeedback === "more") weights[quest.category] += 1;
    if (quest.categoryFeedback === "less") weights[quest.category] = Math.max(0.25, weights[quest.category] - 1);
  }

  // Dossier-Signale (Spec §8.1): Meidung daempft, Vorliebe verstaerkt.
  for (const cat of getAvoidedCategories(state)) {
    if (weights[cat] != null) weights[cat] = Math.max(0.25, weights[cat] * 0.5);
  }
  for (const cat of getLikedCategories(state)) {
    if (weights[cat] != null) weights[cat] += 1;
  }

  const stats = state.stats || {};
  const lowest = CATS.reduce((lo, cat) => ((Number(stats[cat]) || 0) < (Number(stats[lo]) || 0) ? cat : lo), CATS[0]);
  weights[lowest] += 1;

  return weights;
}

// Gewichte * Zufallsrauschen -> Reihenfolge. rng injizierbar fuer Tests.
export function orderPoolByWeight(pool = [], weights = {}, rng = Math.random) {
  return [...(pool || [])]
    .map((quest) => ({ quest, score: (weights[quest.category] ?? 1) * (0.5 + rng()) }))
    .sort((a, b) => b.score - a.score)
    .map(({ quest }) => quest);
}
