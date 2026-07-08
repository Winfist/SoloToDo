// Ziel-Quest-Slot (Paket B): leitet die tägliche Ziel-Quest deterministisch
// aus dem nächsten offenen Meilenstein der GoalFramework-Ziele ab.
// Pur und node-testbar — keine React-/Firebase-Abhängigkeiten.
import { genId, getToday, calculateLevelUp } from "./helpers.js";
import { getStateLocale, translate } from "./i18n.js";

// Deckungsgleich mit dem Inline-Mapping in components/GoalFramework.jsx (handleGenerateQuest).
export const GOAL_CATEGORY_TO_STAT = {
  fitness: "str",
  learning: "int",
  health: "vit",
  productivity: "agi",
  social: "cha",
};

export function getNextOpenMilestone(goal) {
  return (goal?.milestones || []).find(m => m && !m.completed) || null;
}

function activeGoals(goals) {
  return (goals || []).filter(g => g && getNextOpenMilestone(g));
}

// Rotation: am längsten nicht bediente Ziele zuerst (nie gestempelt = zuerst).
function sortByLeastRecentlyServed(goals, lastServedByGoalId) {
  return [...goals].sort((a, b) => {
    const servedA = lastServedByGoalId[a.id] || "";
    const servedB = lastServedByGoalId[b.id] || "";
    return servedA.localeCompare(servedB);
  });
}

export function generateGoalQuests(state, { limit = 1 } = {}) {
  const locale = getStateLocale(state);
  const today = getToday();
  const lastServedByGoalId = { ...(state?.goalQuestPlanning?.lastServedByGoalId || {}) };
  const candidates = sortByLeastRecentlyServed(activeGoals(state?.goals), lastServedByGoalId);

  const quests = [];
  for (const goal of candidates) {
    if (quests.length >= limit) break;
    const milestone = getNextOpenMilestone(goal);
    quests.push({
      id: `goal_${genId()}`,
      title: translate(locale, "quests.goalSlot.title", { milestone: milestone.title }),
      desc: translate(locale, "quests.goalSlot.desc", { goal: goal.title }),
      category: GOAL_CATEGORY_TO_STAT[goal.category] || "int",
      difficulty: "normal",
      type: "goal",
      isSystem: true,
      linkedGoalId: goal.id,
      linkedMilestoneId: milestone.id,
      createdAt: today,
      createdAtMs: Date.now(),
      dueDate: today,
    });
    lastServedByGoalId[goal.id] = today;
  }

  return { quests, planning: { lastServedByGoalId } };
}

// Meta-Quest, wenn kein aktives Ziel existiert. Schließt sich über den
// AutoComplete-Effect in useGameState selbst ab, sobald ein Ziel angelegt ist.
export function generateGoalSetupQuest(state) {
  const locale = getStateLocale(state);
  const today = getToday();
  return {
    id: `goal_setup_${today}`,
    title: translate(locale, "quests.goalSlot.setupTitle"),
    desc: translate(locale, "quests.goalSlot.setupDesc"),
    category: "int",
    difficulty: "easy",
    type: "goal",
    isSystem: true,
    isGoalSetup: true,
    createdAt: today,
    createdAtMs: Date.now(),
    dueDate: today,
  };
}

// Schließt einen Meilenstein pur ab (Bonus +50 XP, wie GoalFramework.handleUpdateMilestone).
// Rückgabe { state, completed, xpBonus, allDone }: completed=false, wenn Ziel/Meilenstein
// fehlt oder bereits abgeschlossen (idempotent, kein Doppel-Bonus).
export function withMilestoneCompleted(state, goalId, milestoneId) {
  const goals = state?.goals || [];
  const goal = goals.find(g => g.id === goalId);
  const milestone = goal?.milestones?.find(m => m.id === milestoneId);
  if (!goal || !milestone || milestone.completed) {
    return { state, completed: false, xpBonus: 0, allDone: false };
  }
  const xpBonus = Math.min(milestone.xpBonus || 50, 50);
  const updatedGoals = goals.map(g => g.id !== goalId ? g : {
    ...g,
    milestones: g.milestones.map(m => m.id === milestoneId
      ? { ...m, completed: true, completedAt: m.completedAt || getToday() }
      : m),
  });
  const next = calculateLevelUp({ ...state, goals: updatedGoals }, xpBonus);
  const allDone = updatedGoals.find(g => g.id === goalId).milestones.every(m => m.completed);
  return { state: next, completed: true, xpBonus, allDone };
}

// Ritual-Trigger (Paket C): einmalig ab Lv5, solange keine Ziele existieren.
export function shouldShowGoalRitual(state) {
  if ((state?.level || 1) < 5) return false;
  if (state?.goalRitual?.seen) return false;
  return (state?.goals || []).length === 0;
}

const SUGGESTION_CATEGORIES = new Set(Object.keys(GOAL_CATEGORY_TO_STAT));

function cleanLine(value, max = 140) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

// KI-Zielvorschläge client-seitig härten: max 3 Ziele, Kategorie-Whitelist,
// 1–5 nicht-leere Meilensteine, Längen begrenzt.
export function sanitizeGoalSuggestions(raw) {
  const goals = Array.isArray(raw?.goals) ? raw.goals : [];
  return goals
    .map(g => {
      const title = cleanLine(g?.title, 140);
      if (!title) return null;
      const category = SUGGESTION_CATEGORIES.has(g?.category) ? g.category : "productivity";
      let milestones = (Array.isArray(g?.milestones) ? g.milestones : [])
        .map(m => cleanLine(m, 140))
        .filter(Boolean)
        .slice(0, 5);
      if (milestones.length === 0) milestones = [title];
      return { title, category, milestones };
    })
    .filter(Boolean)
    .slice(0, 3);
}

// KI-Veredelung: valide Antwort von generateQuestDescription auf die
// deterministische Ziel-Quest anwenden. Ungültig/leer -> null (Fallback bleibt).
export function applyGoalQuestRefinement(quest, aiResult) {
  if (!quest || !aiResult) return null;
  const desc = cleanLine(aiResult.description, 300);
  const subQuests = (Array.isArray(aiResult.subQuests) ? aiResult.subQuests : [])
    .map(t => cleanLine(t, 140))
    .filter(Boolean)
    .slice(0, 3)
    .map((title, i) => ({ id: String(i + 1), title, completed: false }));
  if (!desc && subQuests.length === 0) return null;
  return {
    ...quest,
    desc: desc || quest.desc,
    ...(subQuests.length > 0 ? { subQuests } : {}),
    aiRefined: true,
  };
}
