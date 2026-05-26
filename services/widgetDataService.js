// ─── WIDGET DATA SERVICE ──────────────────────────────────────
// Bridges React app state → iOS WidgetKit via shared UserDefaults.
// Uses capacitor-widget-bridge to write JSON to App Group container.
// Called on every persist() so the widget always shows fresh data.

import { Capacitor } from '@capacitor/core';
import { getLocalDateKey, getToday } from '../data/dateUtils.js';
import { getLocaleObject, getStateLocale, translate } from '../data/i18n.js';

const APP_GROUP = 'group.com.solotodo.app';
const WIDGET_DATA_KEY = 'widgetData';
export const WIDGET_ACTION_QUEUE_KEY = 'widgetActionQueue';
// Which quest is currently expanded inline in the widget. The widget writes
// this on tap; we clear it whenever the app pushes fresh data so opening the
// app collapses the widget back to its list view.
const WIDGET_EXPANDED_KEY = 'widgetExpandedQuestId';

// ─── Default Widget Config ────────────────────────────────────
export const DEFAULT_WIDGET_CONFIG = {
  modules: ['streak_xp', 'quests', 'habits', 'micro_habits', 'hunter_card'],
  questFilter: 'all',       // 'all' | 'system' | 'custom' | 'daily' | 'priority'
  questSort: 'focus',        // 'focus' | 'priority' | 'deadline'
  maxQuests: 5,
  showHunterCard: true,
  showSystemMessage: true,
  syncTheme: true,
  // Rotation: widget cycles through quest batches automatically.
  // Default OFF — a stable, curated top-list is more glanceable than
  // content that changes every few minutes. Opt-in via settings.
  rotationEnabled: false,
  rotationIntervalMinutes: 5,  // 5 | 10 | 15 | 30
  // Display sections: user can toggle what appears in widgets
  showSections: {
    streak: true,
    quests: true,
    habits: true,
    microHabits: true,
    stats: true,
    heatmap: true,
    systemMessage: true,
  },
  liveActivity: {
    emergencyQuest: true,
    streakWarning: true,
    deadlineAlert: true,
  }
};

// ─── All available widget modules ─────────────────────────────
const WIDGET_MODULE_BASE = [
  { key: 'streak_xp', icon: '🔥', color: '#f97316' },
  { key: 'quests', icon: '🗡️', color: '#f59e0b' },
  { key: 'daily_quests', icon: '📋', color: '#22d3ee' },
  { key: 'focus_quest', icon: '🎯', color: '#ef4444' },
  { key: 'habits', icon: '💪', color: '#22c55e' },
  { key: 'micro_habits', icon: '🧬', color: '#06b6d4' },
  { key: 'hunter_card', icon: '🏆', color: '#a855f7' },
  { key: 'health', icon: '❤️', color: '#ef4444' },
  { key: 'screen_time', icon: '📱', color: '#f59e0b' },
  { key: 'deadline_alert', icon: '⏰', color: '#dc2626' },
  { key: 'system_message', icon: '💬', color: '#6366f1' },
  { key: 'week_heatmap', icon: '📊', color: '#22c55e' },
  { key: 'streak_shield', icon: '🛡️', color: '#3b82f6' },
  { key: 'shadow_army', icon: '👻', color: '#64748b' },
];

export function getWidgetModules(localeOrMode = 'auto') {
  return WIDGET_MODULE_BASE.map(module => ({
    ...module,
    label: translate(localeOrMode, `widgets.modules.${module.key}.label`),
    desc: translate(localeOrMode, `widgets.modules.${module.key}.desc`),
  }));
}

export const WIDGET_MODULES = getWidgetModules('de');

// ─── RANKS (duplicated minimally for widget payload) ──────────
const RANKS_MINIMAL = [
  { name: 'E', minLv: 1, color: '#6b7280' },
  { name: 'D', minLv: 11, color: '#22d3ee' },
  { name: 'C', minLv: 21, color: '#34d399' },
  { name: 'B', minLv: 36, color: '#a78bfa' },
  { name: 'A', minLv: 51, color: '#f59e0b' },
  { name: 'S', minLv: 71, color: '#ef4444' },
  { name: 'SSS', minLv: 91, color: '#e879f9' },
];

const QUEST_WAIT_HOURS = {
  easy: 0,
  normal: 0.5,
  hard: 1,
  boss: 2,
};

function getRankForLevel(level) {
  for (let i = RANKS_MINIMAL.length - 1; i >= 0; i--) {
    if (level >= RANKS_MINIMAL[i].minLv) return RANKS_MINIMAL[i];
  }
  return RANKS_MINIMAL[0];
}

// ─── System Messages for Widget ───────────────────────────────
function getSystemMessages(locale) {
  const messages = getLocaleObject(locale)?.widgets?.messages;
  return Array.isArray(messages) && messages.length > 0
    ? messages
    : [translate(locale, 'widgets.fallbackSystemMessage')];
}

// ─── Quest Filter Logic ───────────────────────────────────────
function filterQuests(quests, filter) {
  const active = (quests || []).filter(q => !q.completed);
  switch (filter) {
    case 'system': return active.filter(q => q.isSystem);
    case 'custom': return active.filter(q => !q.isSystem);
    case 'daily': return active.filter(q => q.type === 'daily');
    default: return active;
  }
}

function sortQuests(quests, sortMode) {
  const sorted = [...quests];
  switch (sortMode) {
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));
    case 'deadline':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'focus':
    default:
      // Focus: high priority first, then daily, then deadline, then rest
      return sorted.sort((a, b) => {
        const pA = a.priority === 'high' ? 0 : a.type === 'daily' ? 1 : a.dueDate ? 2 : 3;
        const pB = b.priority === 'high' ? 0 : b.type === 'daily' ? 1 : b.dueDate ? 2 : 3;
        return pA - pB;
      });
  }
}

// ─── Quest text helpers (widget content) ──────────────────────
// A quest title alone often doesn't say what to actually do — so we
// also send a short description and the next open sub-quest ("next step").
function truncateText(str, max) {
  const t = (str || '').trim();
  if (t.length <= max) return t;
  return (t.slice(0, max).replace(/\s+\S*$/, '').trim() || t.slice(0, max).trim()) + '…';
}

function nextOpenStep(quest) {
  const next = (quest.subQuests || []).find(sq => sq && !sq.completed && (sq.title || '').trim());
  return next ? next.title.trim() : null;
}

// The quest's stages ("Etappen") — what to actually do. Sent so the widget can
// reveal them inline on tap (e.g. "20 Liegestütze", "10 Sit-Ups"). Capped and
// truncated to keep the shared payload small.
function questStages(quest) {
  return (quest.subQuests || [])
    .filter(sq => sq && (sq.title || '').trim())
    .slice(0, 8)
    .map(sq => ({ title: truncateText(sq.title, 70), done: !!sq.completed }));
}

const DEFAULT_MICRO_HABITS = [
  { id: 'water', label: 'Wasser', dailyTarget: 8 },
  { id: 'posture', label: 'Haltung', dailyTarget: 5 },
  { id: 'stretch', label: 'Stretch', dailyTarget: 4 },
  { id: 'gratitude', label: 'Dankbar', dailyTarget: 3 },
  { id: 'breathe', label: 'Atmen', dailyTarget: 3 },
];

function normalizeMicroHabitList(raw) {
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (raw && typeof raw === 'object') {
    const entries = Object.entries(raw).map(([id, cfg]) => ({ id, ...(cfg || {}) }));
    if (entries.length > 0) return entries;
  }
  return DEFAULT_MICRO_HABITS;
}

function getMicroTarget(cfg) {
  return Number(cfg?.dailyTarget ?? cfg?.target ?? 5) || 5;
}

function isHabitScheduledToday(habit, date = new Date()) {
  const day = date.getDay();
  if (habit?.frequency === 'weekday' && (day === 0 || day === 6)) return false;
  if (habit?.frequency === 'weekend' && day > 0 && day < 6) return false;
  return true;
}

function isManualHabitCompletable(habit, today) {
  const completed = !!habit?.history?.[today]?.completed || !!(habit?.completedDates || []).includes(today);
  return habit?.active !== false && isHabitScheduledToday(habit) && habit?.verification === 'manual' && !completed;
}

// ─── Build Widget Payload ─────────────────────────────────────
function canCompleteQuestFromWidget(quest) {
  if (!quest?.id || quest.completed) return false;
  if (quest.isSystem || !quest.createdAtMs) return true;
  const waitHours = QUEST_WAIT_HOURS[quest.difficulty] ?? 1;
  return Date.now() - quest.createdAtMs >= waitHours * 3600 * 1000;
}

function buildWidgetPayload(state) {
  const config = state.widgetConfig || DEFAULT_WIDGET_CONFIG;
  const locale = getStateLocale(state);
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';
  const rank = getRankForLevel(state.level || 1);
  const now = new Date();
  const today = getToday();

  // Quest data — send ALL sorted quests so widget can handle rotation itself
  const filtered = filterQuests(state.quests, config.questFilter);
  const sorted = sortQuests(filtered, config.questSort);
  const allQuests = sorted.map(q => ({
    id: q.id,
    title: q.title || translate(locale, 'quests.fallbackTitle'),
    description: truncateText(q.description, 120),
    nextStep: nextOpenStep(q),
    stages: questStages(q),
    category: q.category || 'agi',
    difficulty: q.difficulty || 'normal',
    type: q.type || 'side',
    priority: q.priority || 'medium',
    dueDate: q.dueDate || null,
    isSystem: !!q.isSystem,
    canCompleteFromWidget: canCompleteQuestFromWidget(q),
  }));

  // Focus quest (highest priority open quest)
  const focusQuest = sorted[0] ? {
    id: sorted[0].id,
    title: sorted[0].title || translate(locale, 'quests.fallbackTitle'),
    description: truncateText(sorted[0].description, 120),
    nextStep: nextOpenStep(sorted[0]),
    stages: questStages(sorted[0]),
    category: sorted[0].category,
    difficulty: sorted[0].difficulty,
    canCompleteFromWidget: canCompleteQuestFromWidget(sorted[0]),
  } : null;

  // Habits
  const habits = (state.habits || [])
    .filter(h => h.active !== false && isHabitScheduledToday(h, now))
    .map(h => ({
    id: h.id,
    title: h.title || h.name || 'Habit',
    name: h.title || h.name || 'Habit',
    completed: !!h.history?.[today]?.completed || !!(h.completedDates || []).includes(today),
    icon: h.icon || 'H',
    verification: h.verification || 'manual',
    category: h.category || 'habit',
    linkedQuestId: h.linkedQuestId || null,
    canCompleteFromWidget: isManualHabitCompletable(h, today),
  }));
  const habitsCompleted = habits.filter(h => h.completed).length;
  const habitsTotal = habits.length;

  // Micro-habits
  const microConfig = normalizeMicroHabitList(state.microHabits?.habits);
  const microDaily = state.microHabits?.daily?.[today] || {};
  const microHabits = microConfig.map(cfg => {
    const id = cfg.id || cfg.key || cfg.label;
    const target = getMicroTarget(cfg);
    const current = Math.min(microDaily[id] || 0, target);
    return {
      id,
      key: id,
      label: cfg.label || id,
      icon: cfg.icon || (cfg.label || id || '?').slice(0, 1).toUpperCase(),
      current,
      target,
      completed: current >= target,
    };
  }).filter(h => h.id);

  // Stats
  const stats = state.stats || { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };

  // Health
  const healthData = state.healthData || {};
  const health = {
    steps: healthData.steps || 0,
    sleep: healthData.sleepHours || 0,
  };

  // Screen time
  const screenTime = {
    todayMinutes: state.screenTimeData?.todayMinutes || 0,
    limitMinutes: state.screenTimePreferences?.dailyLimitMinutes || 180,
  };

  // Shadow army
  const shadows = state.shadowArmy?.shadows || [];
  const strongestShadow = shadows.length > 0
    ? shadows.reduce((a, b) => (b.tier > a.tier || (b.tier === a.tier && b.level > a.level)) ? b : a)
    : null;

  // Quests completed today
  const completedToday = (state.completedQuests || []).filter(q => {
    const d = q.completedAt || q.date;
    return d && d.startsWith(today);
  }).length;

  // Total open quests
  const totalOpen = (state.quests || []).filter(q => !q.completed).length;

  // Deadline alert
  const questsWithDeadline = filtered.filter(q => q.dueDate);
  const nearestDeadline = questsWithDeadline.length > 0
    ? questsWithDeadline.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    : null;

  // Week heatmap (last 7 days quest completions)
  const weekHeatmap = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateKey(d);
    const count = (state.completedQuests || []).filter(q => {
      const cd = q.completedAt || q.date;
      return cd && cd.startsWith(dateStr);
    }).length;
    weekHeatmap.push({ date: dateStr, day: d.toLocaleDateString(dateLocale, { weekday: 'short' }), count });
  }

  // System message
  const systemMessages = getSystemMessages(locale);
  const msgIndex = Math.floor(Date.now() / 86400000) % systemMessages.length;
  const systemMessage = systemMessages[msgIndex];

  // Theme colors
  const THEMES_MAP = {
    default: { primary: '#22d3ee', accent: '#67e8f9', glow: 'rgba(34,211,238,0.35)', bg: '#06060e' },
    crimson: { primary: '#dc2626', accent: '#fca5a5', glow: 'rgba(220,38,38,0.35)', bg: '#0a0808' },
    shadow: { primary: '#6366f1', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.35)', bg: '#06060f' },
    ice: { primary: '#06b6d4', accent: '#a5f3fc', glow: 'rgba(6,182,212,0.35)', bg: '#060a0f' },
    golden: { primary: '#d97706', accent: '#fde68a', glow: 'rgba(217,119,6,0.35)', bg: '#0a0806' },
    celestial: { primary: '#daa520', accent: '#ffe4b5', glow: 'rgba(218,165,32,0.35)', bg: '#0a0806' },
    void: { primary: '#7c3aed', accent: '#c4b5fd', glow: 'rgba(124,58,237,0.35)', bg: '#08060f' },
    dragon: { primary: '#ea580c', accent: '#fdba74', glow: 'rgba(234,88,12,0.35)', bg: '#0a0604' },
    starfall: { primary: '#818cf8', accent: '#e0e7ff', glow: 'rgba(129,140,248,0.35)', bg: '#060610' },
    blood_sovereign: { primary: '#be123c', accent: '#fda4af', glow: 'rgba(190,18,60,0.35)', bg: '#0a0406' },
  };

  const selectedTheme = state.selectedTheme || 'default';
  const themeColors = (selectedTheme === 'custom' && state.customThemeData)
    ? { primary: state.customThemeData.primary, accent: state.customThemeData.accent, glow: state.customThemeData.glow, bg: state.customThemeData.bg }
    : (THEMES_MAP[selectedTheme] || THEMES_MAP.default);

  return {
    // Timestamp
    updatedAt: new Date().toISOString(),
    locale,

    // Hunter Info
    hunterName: state.hunterName || 'Hunter',
    level: state.level || 1,
    xp: state.xp || 0,
    xpNeeded: getXpForLevelSimple(state.level || 1),
    rank: rank.name,
    rankColor: rank.color,
    title: state.selectedTitle || '',
    streak: state.streak || 0,
    gold: state.gold || 0,
    gems: state.gems || 0,

    // Quest data — ALL quests for widget-side rotation
    quests: allQuests,
    focusQuest,
    totalOpen,
    completedToday,
    nearestDeadline: nearestDeadline ? {
      title: nearestDeadline.title,
      dueDate: nearestDeadline.dueDate,
    } : null,

    // Habits
    habits: habits.slice(0, 8),
    habitsCompleted,
    habitsTotal,

    // Micro-habits
    microHabits,

    // Stats
    stats,

    // Health & Screen Time
    health,
    screenTime,

    // Shadow Army
    shadowCount: shadows.length,
    strongestShadow: strongestShadow ? {
      name: strongestShadow.name,
      tier: strongestShadow.tier,
      level: strongestShadow.level,
    } : null,

    // Week heatmap
    weekHeatmap,

    // System message
    systemMessage,

    // Streak shield status
    streakShield: {
      active: !!(state.activeGemBoosters || []).find(b => b.effect?.streakShield),
      daysProtected: 0,
    },

    // Theme
    theme: config.syncTheme !== false ? themeColors : THEMES_MAP.default,

    // Config (so widget knows display preferences)
    config: {
      modules: config.modules || DEFAULT_WIDGET_CONFIG.modules,
      maxQuests: config.maxQuests || 5,
      rotationEnabled: config.rotationEnabled === true,
      rotationIntervalMinutes: config.rotationIntervalMinutes || 5,
      showSections: config.showSections || DEFAULT_WIDGET_CONFIG.showSections,
    },
  };
}

// Simple XP calculator (avoids importing full constants)
function getXpForLevelSimple(level) {
  if (level <= 10) return 100;
  if (level <= 20) return 250;
  if (level <= 35) return 500;
  if (level <= 50) return 900;
  if (level <= 70) return 1500;
  if (level <= 90) return 3000;
  return 6000;
}

// ─── Sync Widget Data ─────────────────────────────────────────
// Call this in the persist() hook after every state change.
let _lastPayloadHash = '';
let _syncCount = 0;

export async function syncWidgetData(state) {
  // Only sync on native iOS
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Skipped: not native platform');
    return;
  }
  if (Capacitor.getPlatform() !== 'ios') {
    console.log('[Widget] Skipped: not iOS');
    return;
  }

  try {
    const payload = buildWidgetPayload(state);
    const payloadStr = JSON.stringify(payload);

    // Skip if unchanged (debounce) — but ALWAYS sync the first 3 calls
    const hash = simpleHash(payloadStr);
    if (hash === _lastPayloadHash && _syncCount > 3) {
      return;
    }
    _lastPayloadHash = hash;
    _syncCount++;

    console.log(`[Widget] Syncing... (#${_syncCount}, payload: ${(payloadStr.length / 1024).toFixed(1)}KB, quests: ${payload.quests.length}, level: ${payload.level})`);

    const { WidgetBridgePlugin } = await import('capacitor-widget-bridge');

    if (!WidgetBridgePlugin || !WidgetBridgePlugin.setItem) {
      console.error('[Widget] WidgetBridgePlugin.setItem not available!');
      return;
    }

    await WidgetBridgePlugin.setItem({
      group: APP_GROUP,
      key: WIDGET_DATA_KEY,
      value: payloadStr,
    });

    // Collapse any inline-expanded quest now that fresh data is in: opening the
    // app should reset the widget back to its list view.
    try {
      await WidgetBridgePlugin.setItem({ group: APP_GROUP, key: WIDGET_EXPANDED_KEY, value: '' });
    } catch (_) { /* non-critical */ }

    // Trigger widget timeline reload
    if (WidgetBridgePlugin.reloadAllTimelines) {
      await WidgetBridgePlugin.reloadAllTimelines();
    }

    console.log(`[Widget] ✅ Data synced successfully (#${_syncCount})`);
  } catch (err) {
    console.error('[Widget] ❌ Sync failed:', err.message, err.stack);
  }
}

// Simple string hash for change detection
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(h);
}
