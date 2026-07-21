import { DOMAIN_IDS, getFocusStats } from "./lifeDomains.js";
import { getDossierSummary } from "./hunterDossier.js";
import {
  buildForgeAIProfile,
  createForgeRequestId,
  getWeakestStat,
  serializeForgeAIProfile,
} from "./forgeAIProfile.js";

const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const DIFFICULTIES = ["easy", "normal", "hard", "boss"];
const DOMAIN_ID_SET = new Set(DOMAIN_IDS);
const CATEGORY_ID_SET = new Set(CATEGORY_IDS);
const DIFFICULTY_SET = new Set(DIFFICULTIES);

function cleanText(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanInteger(value, max = 1000000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(Math.round(number), 0), max);
}

function uniqueTexts(values, limit, maxLength = 120) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = cleanText(value, maxLength);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function cleanFeedback(quest) {
  const feedback = {
    feltDifficulty: cleanText(quest?.feltDifficulty, 32),
    durationFeedback: cleanText(quest?.durationFeedback, 32),
    categoryFeedback: cleanText(quest?.categoryFeedback, 32),
  };
  return Object.fromEntries(Object.entries(feedback).filter(([, value]) => value));
}

function mapRecentCompletedQuest(quest) {
  const category = CATEGORY_ID_SET.has(quest?.category) ? quest.category : null;
  const difficulty = DIFFICULTY_SET.has(quest?.difficulty) ? quest.difficulty : null;
  const feedback = cleanFeedback(quest);
  const actualDurationMinutes = quest?.actualDurationMs
    ? cleanInteger(Number(quest.actualDurationMs) / 60000, 1440)
    : 0;

  return {
    title: cleanText(quest?.title, 140),
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
    source: quest?.isSystem ? "system" : "custom",
    ...(actualDurationMinutes ? { actualDurationMinutes } : {}),
    ...(Object.keys(feedback).length > 0 ? { feedback } : {}),
  };
}

function getRecentFocusMinutes(focus) {
  return Object.entries(focus?.daily || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .reduce((sum, [, day]) => sum + cleanInteger(day?.totalMinutes, 1440), 0);
}

function buildLegacyAIQuestProfile(state = {}) {
  const lifeDomains = (state.lifeDomains || [])
    .filter((domain, index, domains) => DOMAIN_ID_SET.has(domain) && domains.indexOf(domain) === index)
    .slice(0, 3);
  const completedQuests = Array.isArray(state.completedQuests) ? state.completedQuests : [];
  const recentCompletedQuests = [...completedQuests]
    .reverse()
    .map(mapRecentCompletedQuest)
    .filter((quest) => quest.title)
    .slice(0, 8);
  const categoryCompletions = Object.fromEntries(CATEGORY_IDS.map((category) => [
    category,
    completedQuests.filter((quest) => quest?.category === category).length,
  ]));
  const openCustomTitles = (state.quests || [])
    .filter((quest) => quest && !quest.completed && !quest.isSystem)
    .map((quest) => quest.title);
  const completedCustomTitles = [...completedQuests]
    .reverse()
    .filter((quest) => quest && !quest.isSystem)
    .map((quest) => quest.title);
  const customQuestPatterns = uniqueTexts([
    ...openCustomTitles,
    ...completedCustomTitles,
    ...(state.customQuestPool?.recentlyUsed || []),
  ], 8, 140);
  const activeGoals = (state.goals || [])
    .filter((goal) => Array.isArray(goal?.milestones) && goal.milestones.some((milestone) => !milestone.completed))
    .map((goal) => ({
      title: cleanText(goal.title, 140),
      category: cleanText(goal.category, 32),
      nextMilestone: cleanText(goal.milestones.find((milestone) => !milestone.completed)?.title, 140),
    }))
    .filter((goal) => goal.title)
    .slice(0, 3);
  const activeHabits = (state.habits || [])
    .filter((habit) => habit && habit.active !== false)
    .map((habit) => ({
      title: cleanText(habit.title, 140),
      category: cleanText(habit.category, 32),
      frequency: cleanText(habit.frequency, 32),
      currentStreak: cleanInteger(habit.currentStreak ?? habit.streak, 10000),
      totalCompletions: cleanInteger(habit.totalCompletions, 100000),
    }))
    .filter((habit) => habit.title)
    .slice(0, 4);

  const dossier = getDossierSummary(state);
  const behaviorSignals = {
    bestTime: dossier.bestTime?.bucket || null,
    categoryCompletionRates: Object.fromEntries(
      Object.entries(dossier.categoryCompletionRates).map(([cat, rate]) => [cat, Math.round(rate * 100) / 100])
    ),
    avoidCategories: dossier.avoidCategories,
    reliableCategories: dossier.reliableCategories,
    likedCategories: dossier.likedCategories,
    ghostDaysLast14: dossier.ghost?.ghostDays || 0,
    recentExpiredTitles: [...new Set((state.questSignals?.recentExpired || []).map((e) => cleanText(e?.title, 140)).filter(Boolean))].slice(0, 5),
    recentDislikedTitles: [...new Set((state.questSignals?.recentDisliked || []).map((e) => cleanText(e?.title, 140)).filter(Boolean))].slice(0, 5),
    userNotes: (state.questSignals?.recentDisliked || []).map((e) => cleanText(e?.note, 140)).filter(Boolean).slice(0, 3),
  };

  return {
    lifeDomains,
    focusStats: getFocusStats(lifeDomains),
    categoryCompletions,
    recentCompletedQuests,
    customQuestPatterns,
    activeGoals,
    activeHabits,
    focusSummary: {
      totalMinutes: cleanInteger(state.focus?.totalMinutes, 1000000),
      totalSessions: cleanInteger(state.focus?.totalSessions, 100000),
      recentMinutes: getRecentFocusMinutes(state.focus),
    },
    behaviorSignals,
  };
}

export function buildAIQuestProfile(state = {}, options = {}) {
  return buildLegacyAIQuestProfile(state, options);
}

export function buildAIQuestRequest(state = {}, language = "de", options = {}) {
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(options.today || "")
    ? options.today
    : new Date(nowMs).toISOString().slice(0, 10);
  const timeZone = cleanText(options.timeZone, 64)
    || Intl.DateTimeFormat?.().resolvedOptions?.().timeZone
    || "UTC";
  const stats = Object.fromEntries(CATEGORY_IDS.map((category) => [
    category,
    cleanInteger(state.stats?.[category], 1000000),
  ]));
  const profile = buildForgeAIProfile(state, { nowMs, today });
  serializeForgeAIProfile(profile);

  return {
    requestId: cleanText(options.requestId, 96) || createForgeRequestId(nowMs),
    clientPolicyVersion: "forge-3.0",
    today,
    timeZone,
    stats,
    level: Math.max(1, cleanInteger(state.level, 1000)),
    weakestStat: getWeakestStat(stats),
    profile,
    language: language === "en" ? "en" : "de",
  };
}
