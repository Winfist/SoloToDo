// signals.js — Verhaltenssignale als Direkt-Aggregation (Spec 2026-07-14 §3).
// Reine state->state-Recorder, defensiv: sie laufen im Boot-Pfad und duerfen
// niemals werfen. Einziger Import: dateUtils.

import { getLocalDateKey } from "./dateUtils.js";

const CATS = ["str", "int", "vit", "agi", "cha"];
const TEMPLATE_CAP = 200;
const RECENT_CAP = 10;
const SESSION_WINDOW_DAYS = 14;
const NOTE_MAX = 140;
const MUTE_AFTER_IGNORED = 3;
const MUTE_DAYS = 7;

export const DEFAULT_QUEST_SIGNALS = {
  byTemplate: {},
  byCategory: {},
  completionHours: { morgen: 0, mittag: 0, abend: 0, nacht: 0 },
  completionWeekdays: [0, 0, 0, 0, 0, 0, 0],
  recentExpired: [],
  recentDisliked: [],
};
export const DEFAULT_SESSION_SIGNALS = { days: {} };
export const DEFAULT_COACH_SIGNALS = {
  byType: {},
  daily: { date: null, coachingShown: 0, warningShown: 0 },
  pendingOutcome: [],
};

export function getHourBucket(hour) {
  const h = Number(hour);
  if (h >= 5 && h < 10) return "morgen";
  if (h >= 10 && h < 14) return "mittag";
  if (h >= 14 && h < 20) return "abend";
  return "nacht";
}

const cleanNote = (value) => typeof value === "string"
  ? value.trim().replace(/\s+/g, " ").slice(0, NOTE_MAX)
  : "";
const dayKey = (value) => (typeof value === "string" && value ? value : getLocalDateKey(new Date()));
const addDays = (key, days) => {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  d.setDate(d.getDate() + days);
  return getLocalDateKey(d);
};

function getQuestSignals(state) {
  const qs = state?.questSignals || {};
  return {
    byTemplate: { ...(qs.byTemplate || {}) },
    byCategory: { ...(qs.byCategory || {}) },
    completionHours: { ...DEFAULT_QUEST_SIGNALS.completionHours, ...(qs.completionHours || {}) },
    completionWeekdays: Array.isArray(qs.completionWeekdays) && qs.completionWeekdays.length === 7
      ? [...qs.completionWeekdays] : [0, 0, 0, 0, 0, 0, 0],
    recentExpired: Array.isArray(qs.recentExpired) ? [...qs.recentExpired] : [],
    recentDisliked: Array.isArray(qs.recentDisliked) ? [...qs.recentDisliked] : [],
  };
}

const templateEntry = (map, id) => ({
  assigned: 0, completed: 0, expired: 0, swapped: 0, liked: 0, disliked: 0,
  lastAssignedAt: null, lastDislikedAt: null,
  ...(map[id] || {}),
});
const categoryEntry = (map, cat) => ({
  assigned: 0, completed: 0, expired: 0, liked: 0, disliked: 0,
  ...(map[cat] || {}),
});
const bump = (entry, field, delta = 1) => ({ ...entry, [field]: Math.max(0, (Number(entry[field]) || 0) + delta) });

function capTemplates(byTemplate) {
  const keys = Object.keys(byTemplate);
  if (keys.length <= TEMPLATE_CAP) return byTemplate;
  const sorted = keys.sort((a, b) => String(byTemplate[a].lastAssignedAt || "").localeCompare(String(byTemplate[b].lastAssignedAt || "")));
  const next = { ...byTemplate };
  for (const key of sorted.slice(0, keys.length - TEMPLATE_CAP)) delete next[key];
  return next;
}

function pushRecent(list, entry) {
  return [entry, ...list].slice(0, RECENT_CAP);
}

function forQuests(state, quests, fn) {
  try {
    const qs = getQuestSignals(state);
    const questArray = Array.isArray(quests) ? quests : [];
    for (let i = questArray.length - 1; i >= 0; i--) {
      const quest = questArray[i];
      if (!quest) continue;
      fn(qs, quest);
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

export function recordQuestsAssigned(state, quests, today) {
  const day = dayKey(today);
  return forQuests(state, quests, (qs, quest) => {
    if (quest.templateId) {
      qs.byTemplate[quest.templateId] = { ...bump(templateEntry(qs.byTemplate, quest.templateId), "assigned"), lastAssignedAt: day };
    }
    if (CATS.includes(quest.category)) {
      qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "assigned");
    }
  });
}

export function recordQuestsExpired(state, quests, today) {
  const day = dayKey(today);
  return forQuests(state, quests, (qs, quest) => {
    if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), "expired");
    if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "expired");
    if (quest.title) qs.recentExpired = pushRecent(qs.recentExpired, { title: String(quest.title).slice(0, 140), category: quest.category || null, date: day });
  });
}

export function recordQuestCompleted(state, quest, nowMs) {
  try {
    if (!quest) return state || {};
    const qs = getQuestSignals(state);
    const at = Number.isFinite(Number(nowMs)) ? new Date(Number(nowMs)) : new Date();
    qs.completionHours[getHourBucket(at.getHours())] += 1;
    qs.completionWeekdays[at.getDay()] += 1;
    if (quest.isSystem) {
      if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), "completed");
      if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "completed");
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

export function recordQuestsSwapped(state, replacedQuests, today, { implicitDislike = false } = {}) {
  const day = dayKey(today);
  return forQuests(state, replacedQuests, (qs, quest) => {
    if (quest.templateId) {
      let entry = bump(templateEntry(qs.byTemplate, quest.templateId), "swapped");
      if (implicitDislike) entry = { ...bump(entry, "disliked"), lastDislikedAt: day };
      qs.byTemplate[quest.templateId] = entry;
    }
    if (CATS.includes(quest.category) && implicitDislike) {
      qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), "disliked");
    }
    if (implicitDislike && quest.title) {
      qs.recentDisliked = pushRecent(qs.recentDisliked, { questId: quest.id || null, title: String(quest.title).slice(0, 140), category: quest.category || null, note: "", date: day });
    }
  });
}

// rating: "liked" | "disliked" | null (null = Undo). Setzt quest.userRating
// und haelt die Zaehler per Delta konsistent.
export function applyQuestRating(state, questId, rating, today) {
  try {
    const quests = Array.isArray(state?.quests) ? state.quests : [];
    const quest = quests.find((q) => q && q.id === questId);
    if (!quest) return state || {};
    const previous = quest.userRating || null;
    const nextRating = rating === "liked" || rating === "disliked" ? rating : null;
    if (previous === nextRating) return state;
    const day = dayKey(today);
    const qs = getQuestSignals(state);

    const applyDelta = (which, delta) => {
      if (quest.templateId) qs.byTemplate[quest.templateId] = bump(templateEntry(qs.byTemplate, quest.templateId), which, delta);
      if (CATS.includes(quest.category)) qs.byCategory[quest.category] = bump(categoryEntry(qs.byCategory, quest.category), which, delta);
    };
    if (previous) applyDelta(previous, -1);
    if (nextRating) applyDelta(nextRating, +1);

    if (nextRating === "disliked") {
      if (quest.templateId) qs.byTemplate[quest.templateId] = { ...templateEntry(qs.byTemplate, quest.templateId), lastDislikedAt: day };
      qs.recentDisliked = pushRecent(qs.recentDisliked, { questId, title: String(quest.title || "").slice(0, 140), category: quest.category || null, note: "", date: day });
    }
    if (previous === "disliked" && nextRating !== "disliked") {
      qs.recentDisliked = qs.recentDisliked.filter((entry) => entry.questId !== questId);
    }
    qs.byTemplate = capTemplates(qs.byTemplate);
    return {
      ...state,
      quests: quests.map((q) => (q.id === questId ? { ...q, userRating: nextRating } : q)),
      questSignals: qs,
    };
  } catch {
    return state || {};
  }
}

export function applyDislikeNote(state, questId, note) {
  try {
    const clean = cleanNote(note);
    const qs = getQuestSignals(state);
    const index = qs.recentDisliked.findIndex((entry) => entry.questId === questId);
    if (index === -1) return state || {};
    qs.recentDisliked = qs.recentDisliked.map((entry, i) => (i === index ? { ...entry, note: clean } : entry));
    return { ...(state || {}), questSignals: qs };
  } catch {
    return state || {};
  }
}

function getSessionSignals(state) {
  const days = state?.sessionSignals?.days;
  return { days: days && typeof days === "object" ? { ...days } : {} };
}

function trimSessionDays(days, today) {
  const cutoff = addDays(today, -(SESSION_WINDOW_DAYS - 1));
  const next = {};
  for (const [key, value] of Object.entries(days)) {
    if (key >= cutoff && key <= today) next[key] = value;
  }
  return next;
}

function bumpSessionDay(state, today, field) {
  try {
    const day = dayKey(today);
    const session = getSessionSignals(state);
    const entry = { opens: 0, actions: 0, ...(session.days[day] || {}) };
    entry[field] = Math.max(0, (Number(entry[field]) || 0) + 1);
    session.days = trimSessionDays({ ...session.days, [day]: entry }, day);
    return { ...(state || {}), sessionSignals: session };
  } catch {
    return state || {};
  }
}

export function recordAppOpen(state, today) { return bumpSessionDay(state, today, "opens"); }
export function recordUserAction(state, today) { return bumpSessionDay(state, today, "actions"); }

function getCoachSignals(state) {
  const cs = state?.coachSignals || {};
  return {
    byType: { ...(cs.byType || {}) },
    daily: { ...DEFAULT_COACH_SIGNALS.daily, ...(cs.daily || {}) },
    pendingOutcome: Array.isArray(cs.pendingOutcome) ? [...cs.pendingOutcome] : [],
  };
}
const coachTypeEntry = (map, type) => ({
  shown: 0, actedSameDay: 0, consecutiveIgnored: 0, mutedUntil: null,
  ...(map[type] || {}),
});

export function recordInterventionShown(state, checkId, kind, today) {
  try {
    if (!checkId) return state || {};
    const day = dayKey(today);
    const cs = getCoachSignals(state);
    cs.byType[checkId] = bump(coachTypeEntry(cs.byType, checkId), "shown");
    const daily = cs.daily.date === day ? cs.daily : { date: day, coachingShown: 0, warningShown: 0 };
    cs.daily = kind === "warning"
      ? { ...daily, warningShown: daily.warningShown + 1 }
      : { ...daily, coachingShown: daily.coachingShown + 1 };
    if (!cs.pendingOutcome.some((p) => p.type === checkId && p.date === day)) {
      cs.pendingOutcome = [...cs.pendingOutcome, { type: checkId, date: day }];
    }
    return { ...(state || {}), coachSignals: cs };
  } catch {
    return state || {};
  }
}

export function resolveInterventionOutcomes(state, today) {
  try {
    const day = dayKey(today);
    const cs = getCoachSignals(state);
    const days = state?.sessionSignals?.days || {};
    const open = [];
    for (const pending of cs.pendingOutcome) {
      if (!pending?.type || !pending?.date || pending.date >= day) { if (pending?.date >= day) open.push(pending); continue; }
      const acted = (Number(days[pending.date]?.actions) || 0) > 0;
      let entry = coachTypeEntry(cs.byType, pending.type);
      entry = acted
        ? { ...bump(entry, "actedSameDay"), consecutiveIgnored: 0 }
        : bump(entry, "consecutiveIgnored");
      if (!acted && entry.consecutiveIgnored >= MUTE_AFTER_IGNORED) {
        entry = { ...entry, consecutiveIgnored: entry.consecutiveIgnored, mutedUntil: addDays(day, MUTE_DAYS) };
      }
      cs.byType[pending.type] = entry;
    }
    cs.pendingOutcome = open;
    return { ...(state || {}), coachSignals: cs };
  } catch {
    return state || {};
  }
}
