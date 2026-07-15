// hunterDossier.js — Das Dossier ist kein Dokument, sondern reine Selektoren
// ueber questSignals/sessionSignals (Spec 2026-07-14 §5). Jeder Selektor hat
// ein Mindestdaten-Gate und liefert darunter null/leer.

const CATS = ["str", "int", "vit", "agi", "cha"];
const MIN_COMPLETIONS_FOR_TIME = 10;
const MIN_ASSIGNED_PER_CATEGORY = 5;
const MIN_SESSION_DAYS = 7;
const NET_RATING_THRESHOLD = 2;
const COOLDOWN_DAYS = 14;
const AVOID_RATE = 0.25;
const RELIABLE_RATE = 0.75;
const STRUGGLING_GHOST_RATE = 0.4;
const STRUGGLING_COMPLETION_RATE = 0.3;
const CRUISING_STREAK = 7;
const CRUISING_COMPLETION_RATE = 0.7;

const categories = (state) => state?.questSignals?.byCategory || {};
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function getBestTimeBucket(state) {
  const hours = state?.questSignals?.completionHours || {};
  const entries = ["morgen", "mittag", "abend", "nacht"].map((bucket) => [bucket, num(hours[bucket])]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total < MIN_COMPLETIONS_FOR_TIME) return null;
  const [bucket, count] = entries.reduce((top, entry) => (entry[1] > top[1] ? entry : top));
  return { bucket, percent: Math.round((count / total) * 100) };
}

export function getCategoryCompletionRates(state) {
  const rates = {};
  for (const cat of CATS) {
    const entry = categories(state)[cat];
    if (num(entry?.assigned) >= MIN_ASSIGNED_PER_CATEGORY) {
      rates[cat] = num(entry.completed) / num(entry.assigned);
    }
  }
  return rates;
}

export function getAvoidedCategories(state) {
  const rates = getCategoryCompletionRates(state);
  return CATS.filter((cat) => {
    const entry = categories(state)[cat];
    const netDislikes = num(entry?.disliked) - num(entry?.liked);
    return (rates[cat] !== undefined && rates[cat] < AVOID_RATE) || netDislikes >= NET_RATING_THRESHOLD;
  });
}

export function getReliableCategories(state) {
  const rates = getCategoryCompletionRates(state);
  return CATS.filter((cat) => rates[cat] !== undefined && rates[cat] > RELIABLE_RATE);
}

export function getLikedCategories(state) {
  return CATS.filter((cat) => {
    const entry = categories(state)[cat];
    return num(entry?.liked) - num(entry?.disliked) >= NET_RATING_THRESHOLD;
  });
}

export function getGhostStats(state) {
  const days = Object.values(state?.sessionSignals?.days || {});
  const withData = days.filter((day) => num(day?.opens) > 0 || num(day?.actions) > 0);
  if (withData.length < MIN_SESSION_DAYS) return null;
  const ghostDays = withData.filter((day) => num(day?.opens) > 0 && num(day?.actions) === 0).length;
  return { ghostDays, daysWithData: withData.length };
}

export function getWeakestWeekday(state) {
  const weekdays = state?.questSignals?.completionWeekdays;
  if (!Array.isArray(weekdays) || weekdays.length !== 7) return null;
  const total = weekdays.reduce((sum, count) => sum + num(count), 0);
  if (total < MIN_COMPLETIONS_FOR_TIME) return null;
  return weekdays.reduce((weakest, count, index) => (num(count) < num(weekdays[weakest]) ? index : weakest), 0);
}

const withinDays = (dateKey, todayKey, days) => {
  if (!dateKey || !todayKey) return false;
  const then = new Date(`${dateKey}T12:00:00`).getTime();
  const now = new Date(`${todayKey}T12:00:00`).getTime();
  if (!Number.isFinite(then) || !Number.isFinite(now)) return false;
  return now - then < days * 86400000;
};

export function getTemplateCooldowns(state, todayKey) {
  const blocked = new Set();
  for (const [templateId, entry] of Object.entries(state?.questSignals?.byTemplate || {})) {
    const ignoredHard = num(entry?.assigned) >= 3 && num(entry?.completed) === 0
      && withinDays(entry?.lastAssignedAt, todayKey, COOLDOWN_DAYS);
    const disliked = num(entry?.disliked) >= 1 && withinDays(entry?.lastDislikedAt, todayKey, COOLDOWN_DAYS);
    if (ignoredHard || disliked) blocked.add(templateId);
  }
  return blocked;
}

function getOverallSystemCompletionRate(state) {
  let assigned = 0;
  let completed = 0;
  for (const cat of CATS) {
    assigned += num(categories(state)[cat]?.assigned);
    completed += num(categories(state)[cat]?.completed);
  }
  if (assigned < MIN_COMPLETIONS_FOR_TIME) return null;
  return completed / assigned;
}

export function getCoachPosture(state) {
  const ghost = getGhostStats(state);
  const rate = getOverallSystemCompletionRate(state);
  if ((ghost && ghost.ghostDays / ghost.daysWithData >= STRUGGLING_GHOST_RATE)
    || (rate !== null && rate < STRUGGLING_COMPLETION_RATE)) return "struggling";
  if ((Number(state?.streak) || 0) >= CRUISING_STREAK && rate !== null && rate > CRUISING_COMPLETION_RATE) return "cruising";
  return "neutral";
}

export function getDossierSummary(state) {
  return {
    bestTime: getBestTimeBucket(state),
    avoidCategories: getAvoidedCategories(state),
    reliableCategories: getReliableCategories(state),
    likedCategories: getLikedCategories(state),
    categoryCompletionRates: getCategoryCompletionRates(state),
    ghost: getGhostStats(state),
    weakestWeekday: getWeakestWeekday(state),
    posture: getCoachPosture(state),
  };
}
