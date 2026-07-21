const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const DOMAIN_IDS = ["fitness", "knowledge", "health", "career", "social", "dating", "finance", "mindset"];
const DIFFICULTIES = ["easy", "normal", "hard", "boss"];
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

function sanitizeGeneratedAIQuests(quests) {
  return (Array.isArray(quests) ? quests : []).slice(0, 3).map((quest) => {
    const estimatedMinutes = typeof quest?.estimatedMinutes === "number"
      && Number.isInteger(quest.estimatedMinutes)
      ? quest.estimatedMinutes
      : null;
    const goalRef = safeText(quest?.goalRef, 140);
    return {
      title: safeText(quest?.title, 160),
      ...(CATEGORY_ID_SET.has(quest?.category) ? { category: quest.category } : {}),
      ...(["easy", "normal", "hard"].includes(quest?.difficulty) ? { difficulty: quest.difficulty } : {}),
      desc: safeText(quest?.desc, 500),
      doneWhen: safeText(quest?.doneWhen, 200),
      ...(estimatedMinutes !== null ? { estimatedMinutes } : {}),
      ...(goalRef ? { goalRef } : {}),
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
  safeText,
  sanitizeAIQuestProfile,
  sanitizeGeneratedAIQuests,
  sanitizeQuestionnaire,
  sanitizeQuestStats,
  sanitizeRecentQuestTitles,
};
