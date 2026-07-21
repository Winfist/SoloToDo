const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const DOMAIN_IDS = ["fitness", "knowledge", "health", "career", "social", "dating", "finance", "mindset"];
const DIFFICULTIES = ["easy", "normal", "hard", "boss"];
const QUEST_DNA_ACTION_KINDS = new Set(["prepare", "practice", "produce", "organize", "communicate", "move", "recover", "review"]);
const QUEST_DNA_CONTEXT_KINDS = new Set(["any", "home", "computer", "phone", "outside", "errand", "social"]);
const QUEST_DNA_FOCUS_MODES = new Set(["interruptible", "continuous"]);
const QUEST_DNA_OUTCOME_KINDS = new Set(["artifact", "decision", "message_sent", "scheduled", "environment_changed", "practice_block", "movement_block", "recovery_block"]);
const QUEST_DNA_REQUIREMENTS = new Set(["computer", "phone", "outdoors", "materials", "other_person", "opening_hours"]);
const QUEST_DNA_VERSION = 1;
const CATEGORY_ID_SET = new Set(CATEGORY_IDS);
const DOMAIN_ID_SET = new Set(DOMAIN_IDS);
const DIFFICULTY_SET = new Set(DIFFICULTIES);

function safeText(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function clampInteger(value, min = 0, max = 1000000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(Math.round(number), min), max);
}

function uniqueSafeTexts(values, limit, maxLength = 120) {
  const seen = new Set();
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = safeText(value, maxLength);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function sanitizeQuestStats(stats) {
  return Object.fromEntries(CATEGORY_IDS.map((category) => [
    category,
    clampInteger(stats?.[category], 0, 1000000),
  ]));
}

function getUniqueWeakestStat(stats) {
  const safe = sanitizeQuestStats(stats);
  const entries = CATEGORY_IDS.map((category) => [category, safe[category]]);
  const minimum = Math.min(...entries.map(([, value]) => value));
  const weakest = entries.filter(([, value]) => value === minimum);
  return weakest.length === 1 ? weakest[0][0] : null;
}
function sanitizeRecentQuestTitles(titles) {
  return uniqueSafeTexts(titles, 10, 140);
}

function sanitizeAIQuestProfile(profile) {
  const value = profile && typeof profile === "object" ? profile : {};
  const lifeDomains = [...new Set(Array.isArray(value.lifeDomains) ? value.lifeDomains : [])]
    .filter((domain) => DOMAIN_ID_SET.has(domain))
    .slice(0, 3);
  const focusStats = [...new Set(Array.isArray(value.focusStats) ? value.focusStats : [])]
    .filter((category) => CATEGORY_ID_SET.has(category))
    .slice(0, CATEGORY_IDS.length);
  const categoryCompletions = Object.fromEntries(CATEGORY_IDS.map((category) => [
    category,
    clampInteger(value.categoryCompletions?.[category], 0, 100000),
  ]));
  const recentCompletedQuests = (Array.isArray(value.recentCompletedQuests) ? value.recentCompletedQuests : [])
    .map((quest) => {
      const feedback = {
        feltDifficulty: safeText(quest?.feedback?.feltDifficulty, 32),
        durationFeedback: safeText(quest?.feedback?.durationFeedback, 32),
        categoryFeedback: safeText(quest?.feedback?.categoryFeedback, 32),
      };
      const cleanedFeedback = Object.fromEntries(Object.entries(feedback).filter(([, item]) => item));
      return {
        title: safeText(quest?.title, 140),
        ...(CATEGORY_ID_SET.has(quest?.category) ? { category: quest.category } : {}),
        ...(DIFFICULTY_SET.has(quest?.difficulty) ? { difficulty: quest.difficulty } : {}),
        source: quest?.source === "system" ? "system" : "custom",
        ...(quest?.actualDurationMinutes ? {
          actualDurationMinutes: clampInteger(quest.actualDurationMinutes, 0, 1440),
        } : {}),
        ...(Object.keys(cleanedFeedback).length > 0 ? { feedback: cleanedFeedback } : {}),
      };
    })
    .filter((quest) => quest.title)
    .slice(0, 8);
  const activeGoals = (Array.isArray(value.activeGoals) ? value.activeGoals : [])
    .map((goal) => ({
      title: safeText(goal?.title, 140),
      category: safeText(goal?.category, 32),
      nextMilestone: safeText(goal?.nextMilestone, 140),
    }))
    .filter((goal) => goal.title)
    .slice(0, 3);
  const activeHabits = (Array.isArray(value.activeHabits) ? value.activeHabits : [])
    .map((habit) => ({
      title: safeText(habit?.title, 140),
      category: safeText(habit?.category, 32),
      frequency: safeText(habit?.frequency, 32),
      currentStreak: clampInteger(habit?.currentStreak, 0, 10000),
      totalCompletions: clampInteger(habit?.totalCompletions, 0, 100000),
    }))
    .filter((habit) => habit.title)
    .slice(0, 4);

  const rawSignals = value.behaviorSignals && typeof value.behaviorSignals === "object" ? value.behaviorSignals : {};
  const TIME_BUCKETS = new Set(["morgen", "mittag", "abend", "nacht"]);
  const cleanCategoryList = (list) => [...new Set(Array.isArray(list) ? list : [])]
    .filter((cat) => CATEGORY_ID_SET.has(cat)).slice(0, CATEGORY_IDS.length);
  const behaviorSignals = {
    bestTime: TIME_BUCKETS.has(rawSignals.bestTime) ? rawSignals.bestTime : null,
    categoryCompletionRates: Object.fromEntries(CATEGORY_IDS
      .filter((cat) => Number.isFinite(Number(rawSignals.categoryCompletionRates?.[cat])))
      .map((cat) => [cat, Math.min(1, Math.max(0, Number(rawSignals.categoryCompletionRates[cat])))])),
    avoidCategories: cleanCategoryList(rawSignals.avoidCategories),
    reliableCategories: cleanCategoryList(rawSignals.reliableCategories),
    likedCategories: cleanCategoryList(rawSignals.likedCategories),
    ghostDaysLast14: clampInteger(rawSignals.ghostDaysLast14, 0, 14),
    recentExpiredTitles: uniqueSafeTexts(rawSignals.recentExpiredTitles, 5, 140),
    recentDislikedTitles: uniqueSafeTexts(rawSignals.recentDislikedTitles, 5, 140),
    userNotes: uniqueSafeTexts(rawSignals.userNotes, 3, 140),
  };

  return {
    lifeDomains,
    focusStats,
    categoryCompletions,
    recentCompletedQuests,
    customQuestPatterns: uniqueSafeTexts(value.customQuestPatterns, 8, 140),
    activeGoals,
    activeHabits,
    focusSummary: {
      totalMinutes: clampInteger(value.focusSummary?.totalMinutes, 0, 1000000),
      totalSessions: clampInteger(value.focusSummary?.totalSessions, 0, 100000),
      recentMinutes: clampInteger(value.focusSummary?.recentMinutes, 0, 10080),
    },
    behaviorSignals,
  };
}

// Forge 3.0 sends only its explicit minimal contract. Active goal/habit titles
// are allowed intent context; historical quest titles, notes, and IDs are
// excluded.
function sanitizeForgeModelProfile(profile) {
  const raw = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
  const recipePattern = /^r1\|(prepare|practice|produce|organize|communicate|move|recover|review)\|(any|home|computer|phone|outside|errand|social)\|(quick|standard|deep)$/;
  const actionKinds = new Set(QUEST_DNA_ACTION_KINDS);
  const outcomeKinds = new Set(QUEST_DNA_OUTCOME_KINDS);
  const habitFrequencies = new Set(["daily", "weekdays", "weekly", "custom"]);

  const activeGoals = (Array.isArray(raw.activeGoals) ? raw.activeGoals : [])
    .map((goal) => {
      const title = safeText(goal?.title, 140);
      const nextMilestone = safeText(goal?.nextMilestone, 140);
      const rawResume = goal?.resume && typeof goal.resume === "object" && !Array.isArray(goal.resume)
        ? goal.resume : {};
      const resume = {
        ...(recipePattern.test(String(rawResume.recipeKey || "")) ? { recipeKey: rawResume.recipeKey } : {}),
        ...(actionKinds.has(rawResume.actionKind) ? { actionKind: rawResume.actionKind } : {}),
        ...(outcomeKinds.has(rawResume.outcomeKind) ? { outcomeKind: rawResume.outcomeKind } : {}),
      };
      return {
        title,
        ...(CATEGORY_ID_SET.has(goal?.category) ? { category: goal.category } : {}),
        ...(nextMilestone ? { nextMilestone } : {}),
        ...(Object.keys(resume).length > 0 ? { resume } : {}),
      };
    })
    .filter((goal) => goal.title)
    .slice(0, 3);

  const activeHabits = (Array.isArray(raw.activeHabits) ? raw.activeHabits : [])
    .map((habit) => ({
      title: safeText(habit?.title, 120),
      ...(CATEGORY_ID_SET.has(habit?.category) ? { category: habit.category } : {}),
      frequency: habitFrequencies.has(habit?.frequency) ? habit.frequency : "custom",
    }))
    .filter((habit) => habit.title)
    .slice(0, 2);

  const rawLearning = raw.learning && typeof raw.learning === "object" && !Array.isArray(raw.learning)
    ? raw.learning : {};
  const learning = {
    preferences: (Array.isArray(rawLearning.preferences) ? rawLearning.preferences : [])
      .map((entry) => ({
        recipeKey: recipePattern.test(String(entry?.recipeKey || "")) ? entry.recipeKey : null,
        value: ["prefer", "avoid", "neutral"].includes(entry?.value) ? entry.value : null,
      }))
      .filter((entry) => entry.recipeKey && entry.value)
      .slice(0, 12),
    patterns: (Array.isArray(rawLearning.patterns) ? rawLearning.patterns : [])
      .map((entry) => ({
        recipeKey: recipePattern.test(String(entry?.recipeKey || "")) ? entry.recipeKey : null,
        outcomes: clampInteger(entry?.outcomes, 0, 1000),
        completionBand: ["unknown", "low", "medium", "high"].includes(entry?.completionBand)
          ? entry.completionBand : "unknown",
        reliable: entry?.reliable === true,
      }))
      .filter((entry) => entry.recipeKey)
      .slice(0, 10),
  };
  const allowedCategories = [...new Set(Array.isArray(raw.allowedCategories) ? raw.allowedCategories : CATEGORY_IDS)]
    .filter((category) => CATEGORY_ID_SET.has(category));

  return {
    activeGoals,
    activeHabits,
    learning,
    stats: sanitizeQuestStats(raw.stats),
    loadBand: ["normal", "elevated", "high"].includes(raw.loadBand) ? raw.loadBand : "normal",
    allowedCategories: allowedCategories.length > 0 ? allowedCategories : CATEGORY_IDS,
  };
}

function sanitizeGeneratedQuestDNA(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || value.version !== QUEST_DNA_VERSION) return null;
  const actionKind = typeof value.actionKind === "string" ? value.actionKind : "";
  const contextKind = typeof value.contextKind === "string" ? value.contextKind : "";
  const focusMode = typeof value.focusMode === "string" ? value.focusMode : "";
  const outcomeKind = typeof value.outcomeKind === "string" ? value.outcomeKind : "";
  const rawRequirements = Array.isArray(value.requirements) ? value.requirements : null;
  if (!QUEST_DNA_ACTION_KINDS.has(actionKind)
    || !QUEST_DNA_CONTEXT_KINDS.has(contextKind)
    || !QUEST_DNA_FOCUS_MODES.has(focusMode)
    || !QUEST_DNA_OUTCOME_KINDS.has(outcomeKind)
    || !rawRequirements
    || rawRequirements.length > QUEST_DNA_REQUIREMENTS.size) return null;
  const requirements = rawRequirements.map((item) => typeof item === "string" ? item : "");
  if (requirements.some((item) => !QUEST_DNA_REQUIREMENTS.has(item))) return null;
  return {
    version: QUEST_DNA_VERSION,
    actionKind,
    contextKind,
    focusMode,
    outcomeKind,
    requirements: [...new Set(requirements)],
  };
}
function sanitizeGeneratedAIQuests(quests, { limit = 3 } = {}) {
  const safeLimit = Math.max(1, Math.min(12, clampInteger(limit, 1, 12)));
  return (Array.isArray(quests) ? quests : []).slice(0, safeLimit).map((quest) => {
    const estimatedMinutes = typeof quest?.estimatedMinutes === "number"
      && Number.isInteger(quest.estimatedMinutes)
      ? quest.estimatedMinutes
      : null;
    const goalRef = safeText(quest?.goalRef, 140);
    const questDNA = sanitizeGeneratedQuestDNA(quest?.questDNA);
    return {
      title: safeText(quest?.title, 160),
      ...(CATEGORY_ID_SET.has(quest?.category) ? { category: quest.category } : {}),
      ...(["easy", "normal", "hard"].includes(quest?.difficulty) ? { difficulty: quest.difficulty } : {}),
      desc: safeText(quest?.desc, 500),
      doneWhen: safeText(quest?.doneWhen, 200),
      ...(estimatedMinutes !== null ? { estimatedMinutes } : {}),
      ...(goalRef ? { goalRef } : {}),
      ...(questDNA ? { questDNA } : {}),
      subQuests: (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
        .slice(0, 5)
        .map((subQuest) => ({ title: safeText(subQuest?.title || subQuest, 180) }))
        .filter((subQuest) => subQuest.title),
      isSystem: true,
      aiGenerated: true,
    };
  }).filter((quest) => quest.title);
}

// Fragebogen aus dem Ziel-Ritual ("Ich weiss noch nicht"-Pfad).
function sanitizeQuestionnaire(raw) {
  if (!raw || typeof raw !== "object") return null;
  const clean = {
    burningDomain: safeText(raw.burningDomain, 32),
    threeMonthWish: safeText(raw.threeMonthWish, 240),
    timeBudget: ["10", "30", "60"].includes(String(raw.timeBudget)) ? String(raw.timeBudget) : "",
    blocker: safeText(raw.blocker, 240),
  };
  return Object.values(clean).some(Boolean) ? clean : null;
}

module.exports = {
  clampInteger,
  getUniqueWeakestStat,
  safeText,
  sanitizeAIQuestProfile,
  sanitizeForgeModelProfile,
  sanitizeGeneratedAIQuests,
  sanitizeGeneratedQuestDNA,
  sanitizeQuestionnaire,
  sanitizeQuestStats,
  sanitizeRecentQuestTitles,
};
