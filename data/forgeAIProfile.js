const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const RECIPE_KEY = /^r1\|(prepare|practice|produce|organize|communicate|move|recover|review)\|(any|home|computer|phone|outside|errand|social)\|(quick|standard|deep)$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function cleanText(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanInteger(value, max = 1000000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(Math.round(number), 0), max);
}

function cleanTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function cleanRecipeKey(value) {
  return typeof value === "string" && RECIPE_KEY.test(value) ? value : null;
}

function isMilestoneOpen(milestone) {
  return milestone && milestone.completed !== true && !milestone.completedAt && !milestone.completedAtMs;
}

function getGoalProgressEntry(state, goal) {
  const byGoalId = state?.forgeGoalProgress?.byGoalId || {};
  if (goal?.id && byGoalId[goal.id]) return byGoalId[goal.id];
  return null;
}

function buildActiveGoals(state) {
  return (state.goals || [])
    .filter((goal) => goal && goal.completed !== true)
    .map((goal) => {
      const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
      const progress = getGoalProgressEntry(state, goal);
      const current = milestones.find((item) => item?.id && item.id === progress?.currentMilestoneId && isMilestoneOpen(item))
        || milestones.find(isMilestoneOpen);
      const resume = progress && (progress.lastActionKind || progress.lastOutcomeKind || progress.lastRecipeKey)
        ? {
            ...(cleanRecipeKey(progress.lastRecipeKey) ? { recipeKey: progress.lastRecipeKey } : {}),
            ...(cleanText(progress.lastActionKind, 32) ? { actionKind: cleanText(progress.lastActionKind, 32) } : {}),
            ...(cleanText(progress.lastOutcomeKind, 32) ? { outcomeKind: cleanText(progress.lastOutcomeKind, 32) } : {}),
          }
        : null;
      return {
        title: cleanText(goal.title, 140),
        ...(CATEGORY_IDS.includes(goal.category) ? { category: goal.category } : {}),
        ...(current?.title ? { nextMilestone: cleanText(current.title, 140) } : {}),
        ...(resume && Object.keys(resume).length ? { resume } : {}),
      };
    })
    .filter((goal) => goal.title && goal.nextMilestone)
    .slice(0, 3);
}

function buildActiveHabits(state) {
  return (state.habits || [])
    .filter((habit) => habit && habit.active !== false)
    .map((habit) => ({
      title: cleanText(habit.title, 120),
      category: CATEGORY_IDS.includes(habit.category) ? habit.category : undefined,
      frequency: ["daily", "weekdays", "weekly", "custom"].includes(habit.frequency) ? habit.frequency : "custom",
    }))
    .filter((habit) => habit.title)
    .slice(0, 2);
}

function buildLearningSummary(state, nowMs) {
  const learning = state.forgeLearning || {};
  const preferences = Object.entries(learning.preferencesByRecipe || {})
    .map(([recipeKey, entry]) => ({
      recipeKey: cleanRecipeKey(recipeKey),
      value: ["prefer", "avoid", "neutral"].includes(entry?.value) ? entry.value : null,
      updatedAtMs: cleanTimestamp(entry?.updatedAtMs),
    }))
    .filter((entry) => entry.recipeKey && entry.value && entry.updatedAtMs >= Number(learning.resetAtMs || 0))
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs)
    .slice(0, 12)
    .map(({ recipeKey, value }) => ({ recipeKey, value }));

  const cutoff = nowMs - 28 * DAY_MS;
  const groups = new Map();
  for (const outcome of Object.values(learning.outcomesByQuestId || {})) {
    const recipeKey = cleanRecipeKey(outcome?.recipeKey);
    const assignedAtMs = cleanTimestamp(outcome?.assignedAtMs);
    const updatedAtMs = cleanTimestamp(outcome?.updatedAtMs);
    if (!recipeKey || Math.max(assignedAtMs, updatedAtMs) < cutoff || updatedAtMs < Number(learning.resetAtMs || 0)) continue;
    const group = groups.get(recipeKey) || { recipeKey, resolved: 0, completed: 0, confidence: "high" };
    const resolved = Boolean(outcome.completedAtMs || outcome.expiredAtMs || outcome.swappedAtMs || outcome.deletedAtMs);
    if (resolved) group.resolved += 1;
    if (outcome.completedAtMs && !outcome.editedAtMs) group.completed += 1;
    if (outcome.dnaConfidence === "medium") group.confidence = "medium";
    groups.set(recipeKey, group);
  }

  const patterns = [...groups.values()]
    .map((entry) => ({
      recipeKey: entry.recipeKey,
      outcomes: entry.resolved,
      completionBand: entry.resolved === 0
        ? "unknown"
        : entry.completed / entry.resolved > 0.75 ? "high" : entry.completed / entry.resolved >= 0.5 ? "medium" : "low",
      reliable: entry.completed >= (entry.confidence === "medium" ? 8 : 5)
        && entry.resolved > 0
        && entry.completed / entry.resolved > 0.75,
    }))
    .filter((entry) => entry.outcomes > 0)
    .sort((left, right) => Number(right.reliable) - Number(left.reliable) || right.outcomes - left.outcomes || left.recipeKey.localeCompare(right.recipeKey))
    .slice(0, 10);

  return { preferences, patterns };
}

function getLoadBand(state, today) {
  let pressure = 0;
  for (const quest of state.quests || []) {
    if (!quest || quest.completed || quest.archived) continue;
    pressure += quest.required || quest.mandatory || quest.priority === "high" ? 2 : 1;
    if (quest.dueDate && quest.dueDate < today) pressure += 2;
    if (quest.inQuestLog || quest.questLog) pressure += 1;
  }
  return pressure >= 10 ? "high" : pressure >= 6 ? "elevated" : "normal";
}

function fitProfileToLimit(profile, maxChars) {
  let candidate = profile;
  const serializedLength = () => JSON.stringify(candidate).length;
  if (serializedLength() <= maxChars) return candidate;

  // Remove least important structured collections first; never slice JSON text.
  candidate = { ...candidate, activeHabits: candidate.activeHabits.slice(0, 1) };
  if (serializedLength() <= maxChars) return candidate;
  candidate = {
    ...candidate,
    learning: { ...candidate.learning, patterns: candidate.learning.patterns.slice(0, 5) },
  };
  if (serializedLength() <= maxChars) return candidate;
  candidate = {
    ...candidate,
    learning: { ...candidate.learning, preferences: candidate.learning.preferences.slice(0, 6) },
  };
  if (serializedLength() <= maxChars) return candidate;
  candidate = { ...candidate, activeHabits: [] };
  if (serializedLength() <= maxChars) return candidate;
  return { ...candidate, learning: { preferences: [], patterns: [] } };
}

export function buildForgeAIProfile(state = {}, { nowMs = Date.now(), today = new Date(nowMs).toISOString().slice(0, 10) } = {}) {
  const learning = buildLearningSummary(state, nowMs);
  const stats = Object.fromEntries(CATEGORY_IDS.map((category) => [category, cleanInteger(state.stats?.[category])]));
  return fitProfileToLimit({
    activeGoals: buildActiveGoals(state),
    activeHabits: buildActiveHabits(state),
    learning,
    stats,
    loadBand: getLoadBand(state, today),
    allowedCategories: CATEGORY_IDS,
  }, 4000);
}

export function serializeForgeAIProfile(profile, maxChars = 4000) {
  const fitted = fitProfileToLimit(profile && typeof profile === "object" ? profile : {}, maxChars);
  const serialized = JSON.stringify(fitted);
  if (serialized.length > maxChars) throw new Error("forge_profile_too_large");
  return serialized;
}

export function getWeakestStat(stats = {}) {
  const values = CATEGORY_IDS.map((key) => ({ key, value: cleanInteger(stats[key]) }));
  const minimum = Math.min(...values.map((entry) => entry.value));
  const weakest = values.filter((entry) => entry.value === minimum);
  return weakest.length === 1 ? weakest[0].key : null;
}

export function createForgeRequestId(nowMs = Date.now()) {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `forge_${Math.max(0, Math.floor(nowMs)).toString(36)}_${random}`.slice(0, 96);
}
