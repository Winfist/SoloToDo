// ─── WIDGET DATA SERVICE ──────────────────────────────────────
// Bridges React app state → iOS WidgetKit via shared UserDefaults.
// Uses capacitor-widget-bridge to write JSON to App Group container.
// Called on every persist() so the widget always shows fresh data.

import { Capacitor } from '@capacitor/core';

const APP_GROUP = 'group.com.solotodo.app';
const WIDGET_DATA_KEY = 'widgetData';

// ─── Default Widget Config ────────────────────────────────────
export const DEFAULT_WIDGET_CONFIG = {
  modules: ['streak_xp', 'quests', 'habits', 'micro_habits', 'hunter_card'],
  questFilter: 'all',       // 'all' | 'system' | 'custom' | 'daily' | 'priority'
  questSort: 'focus',        // 'focus' | 'priority' | 'deadline'
  maxQuests: 3,
  showHunterCard: true,
  showSystemMessage: true,
  syncTheme: true,
  liveActivity: {
    emergencyQuest: true,
    streakWarning: true,
    deadlineAlert: true,
  }
};

// ─── All available widget modules ─────────────────────────────
export const WIDGET_MODULES = [
  { key: 'streak_xp', label: 'Streak & XP', icon: '🔥', color: '#f97316', desc: 'Aktuelle Serie + Level + XP-Fortschritt' },
  { key: 'quests', label: 'Quest Board', icon: '🗡️', color: '#f59e0b', desc: 'Aktive Quests als Liste mit Difficulty' },
  { key: 'daily_quests', label: 'Daily Quests', icon: '📋', color: '#22d3ee', desc: 'Nur tägliche Quests (erledigt/offen)' },
  { key: 'focus_quest', label: 'Focus Quest', icon: '🎯', color: '#ef4444', desc: 'Die eine wichtigste Quest prominent' },
  { key: 'habits', label: 'Habit Progress', icon: '💪', color: '#22c55e', desc: 'Heutige Habits als Checklist' },
  { key: 'micro_habits', label: 'Micro-Habits', icon: '🧬', color: '#06b6d4', desc: 'Kompakte Counter-Leiste' },
  { key: 'hunter_card', label: 'Hunter Card', icon: '🏆', color: '#a855f7', desc: 'Level, Rang, Titel, Stats' },
  { key: 'health', label: 'Biometrics', icon: '❤️', color: '#ef4444', desc: 'Schritte + Schlaf von heute' },
  { key: 'screen_time', label: 'Screen Time', icon: '📱', color: '#f59e0b', desc: 'Heutiges Limit vs. Aktuell' },
  { key: 'deadline_alert', label: 'Deadline Alert', icon: '⏰', color: '#dc2626', desc: 'Quest mit nächstem Fälligkeitsdatum' },
  { key: 'system_message', label: 'System Message', icon: '💬', color: '#6366f1', desc: 'Motivations-Spruch im System-Stil' },
  { key: 'week_heatmap', label: 'Wochen-Heatmap', icon: '📊', color: '#22c55e', desc: '7-Tage Mini-Grid der Aktivität' },
  { key: 'streak_shield', label: 'Streak Shield', icon: '🛡️', color: '#3b82f6', desc: 'Streak-Schutz-Status + Warnung' },
  { key: 'shadow_army', label: 'Shadow Army', icon: '👻', color: '#64748b', desc: 'Anzahl Shadows + stärkster Shadow' },
];

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

function getRankForLevel(level) {
  for (let i = RANKS_MINIMAL.length - 1; i >= 0; i--) {
    if (level >= RANKS_MINIMAL[i].minLv) return RANKS_MINIMAL[i];
  }
  return RANKS_MINIMAL[0];
}

// ─── System Messages for Widget ───────────────────────────────
const SYSTEM_MESSAGES = [
  'Die Schatten gehorchen dir, Hunter. Zeig ihnen deinen Willen.',
  'Jeder Tag ohne Quest ist ein verlorener Tag. ARISE!',
  'Dein Streak ist dein Schwert — lass es nicht rosten.',
  'Das System beobachtet dich. Enttäusche es nicht.',
  'Selbst der schwächste Hunter kann zum Monarchen aufsteigen.',
  'Konsistenz ist dein stärkster Skill.',
  'Die Dunkelheit kann dich nicht besiegen, wenn du weitermachst.',
  'Hunter, dein Potenzial ist unbegrenzt. Beweise es.',
  'Jede Quest bringt dich dem Monarch-Rang näher.',
  'Disziplin ist die Brücke zwischen Zielen und Erfolgen.',
];

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

// ─── Build Widget Payload ─────────────────────────────────────
function buildWidgetPayload(state) {
  const config = state.widgetConfig || DEFAULT_WIDGET_CONFIG;
  const rank = getRankForLevel(state.level || 1);
  const today = new Date().toISOString().split('T')[0];

  // Quest data
  const filtered = filterQuests(state.quests, config.questFilter);
  const sorted = sortQuests(filtered, config.questSort);
  const topQuests = sorted.slice(0, config.maxQuests || 3).map(q => ({
    id: q.id,
    title: q.title || 'Quest',
    category: q.category || 'agi',
    difficulty: q.difficulty || 'normal',
    type: q.type || 'side',
    priority: q.priority || 'medium',
    dueDate: q.dueDate || null,
    isSystem: !!q.isSystem,
  }));

  // Focus quest (highest priority open quest)
  const focusQuest = sorted[0] ? {
    title: sorted[0].title,
    category: sorted[0].category,
    difficulty: sorted[0].difficulty,
  } : null;

  // Habits
  const habits = (state.habits || []).map(h => ({
    name: h.name || 'Habit',
    completed: !!(h.completedDates || []).includes(today),
    icon: h.icon || '💪',
  }));
  const habitsCompleted = habits.filter(h => h.completed).length;
  const habitsTotal = habits.length;

  // Micro-habits
  const microConfig = state.microHabits?.habits;
  const microDaily = state.microHabits?.daily?.[today] || {};
  const microHabits = microConfig ? Object.entries(microConfig).map(([key, cfg]) => ({
    key,
    label: cfg.label || key,
    icon: cfg.icon || '⭐',
    current: microDaily[key] || 0,
    target: cfg.target || 5,
  })) : [];

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
    const dateStr = d.toISOString().split('T')[0];
    const count = (state.completedQuests || []).filter(q => {
      const cd = q.completedAt || q.date;
      return cd && cd.startsWith(dateStr);
    }).length;
    weekHeatmap.push({ date: dateStr, day: d.toLocaleDateString('de-DE', { weekday: 'short' }), count });
  }

  // System message
  const msgIndex = Math.floor(Date.now() / 86400000) % SYSTEM_MESSAGES.length;
  const systemMessage = SYSTEM_MESSAGES[msgIndex];

  // Theme colors
  const THEMES_MAP = {
    default: { primary: '#22d3ee', accent: '#67e8f9', glow: 'rgba(34,211,238,0.35)', bg: '#06060e' },
    crimson: { primary: '#dc2626', accent: '#fca5a5', glow: 'rgba(220,38,38,0.35)', bg: '#0a0808' },
    shadow: { primary: '#6366f1', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.35)', bg: '#06060f' },
    ice: { primary: '#06b6d4', accent: '#a5f3fc', glow: 'rgba(6,182,212,0.35)', bg: '#060a0f' },
    golden: { primary: '#d97706', accent: '#fde68a', glow: 'rgba(217,119,6,0.35)', bg: '#0a0806' },
    void: { primary: '#7c3aed', accent: '#c4b5fd', glow: 'rgba(124,58,237,0.35)', bg: '#08060f' },
    dragon: { primary: '#ea580c', accent: '#fdba74', glow: 'rgba(234,88,12,0.35)', bg: '#0a0604' },
    blood_sovereign: { primary: '#be123c', accent: '#fda4af', glow: 'rgba(190,18,60,0.35)', bg: '#0a0406' },
  };

  const selectedTheme = state.selectedTheme || 'default';
  const themeColors = (selectedTheme === 'custom' && state.customThemeData)
    ? { primary: state.customThemeData.primary, accent: state.customThemeData.accent, glow: state.customThemeData.glow, bg: state.customThemeData.bg }
    : (THEMES_MAP[selectedTheme] || THEMES_MAP.default);

  return {
    // Timestamp
    updatedAt: new Date().toISOString(),

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

    // Quest data
    quests: topQuests,
    focusQuest,
    totalOpen,
    completedToday,
    nearestDeadline: nearestDeadline ? {
      title: nearestDeadline.title,
      dueDate: nearestDeadline.dueDate,
    } : null,

    // Habits
    habits: habits.slice(0, 6),
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
      daysProtected: 0, // computed from booster expiry
    },

    // Theme
    theme: config.syncTheme !== false ? themeColors : THEMES_MAP.default,

    // Config (so widget knows which modules to show)
    config: {
      modules: config.modules || DEFAULT_WIDGET_CONFIG.modules,
      maxQuests: config.maxQuests || 3,
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

export async function syncWidgetData(state) {
  // Only sync on native iOS
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() !== 'ios') return;

  try {
    const payload = buildWidgetPayload(state);
    const payloadStr = JSON.stringify(payload);

    // Skip if unchanged (debounce)
    const hash = simpleHash(payloadStr);
    if (hash === _lastPayloadHash) return;
    _lastPayloadHash = hash;

    const { WidgetBridgePlugin } = await import('capacitor-widget-bridge');

    await WidgetBridgePlugin.setItem({
      group: APP_GROUP,
      key: WIDGET_DATA_KEY,
      value: payloadStr,
    });

    // Trigger widget timeline reload
    await WidgetBridgePlugin.reloadAllTimelines();

    console.log('[Widget] Data synced successfully');
  } catch (err) {
    // Silently fail — widget bridge might not be available
    console.warn('[Widget] Sync failed (non-critical):', err.message);
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
