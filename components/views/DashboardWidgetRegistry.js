// Single source of truth for all dashboard widgets.
// The visual dashboard renders carousel widgets as a compact summary strip.

export const DASHBOARD_WIDGETS = [
  { key: "hunter_status", label: "Hunter Status", icon: "LV", color: "#22d3ee", desc: "Level und XP", requires: null, removable: true },
  { key: "today_command", label: "Heute", icon: "NOW", color: "#22d3ee", desc: "Fokus, Reminder und Risiken", requires: null, removable: false },
  { key: "streak_display", label: "Serie", icon: "STR", color: "#f97316", desc: "Aktuelle Serie", requires: null, removable: true, carousel: true },
  { key: "daily_progress", label: "Tagesfortschritt", icon: "DAY", color: "#22c55e", desc: "Erledigt und offen", requires: null, removable: true, carousel: true },
  { key: "health_summary", label: "Biometrics", icon: "BIO", color: "#38bdf8", desc: "Schritte und Schlaf", requires: null, removable: true, carousel: true },
  { key: "screen_time_summary", label: "Bildschirmzeit", icon: "FOC", color: "#f59e0b", desc: "Limit und Trend", requires: null, removable: true, carousel: true },
  { key: "quests", label: "Quest Board", icon: "QST", color: "#f59e0b", desc: "Aktive Quests", requires: null, removable: false },
  { key: "gem_booster", label: "Gem Boosters", icon: "GEM", color: "#a855f7", desc: "Aktive Booster", requires: "gem_shop", removable: true },
  { key: "habits", label: "Habit Tracker", icon: "HAB", color: "#22c55e", desc: "Gewohnheiten", requires: "habit_tracker", removable: true },
  { key: "micro_habits", label: "Micro-Habits", icon: "MIC", color: "#06b6d4", desc: "Kleine Aufgaben", requires: "micro_habits", removable: true },
  { key: "next_unlock", label: "System-Update", icon: "UPD", color: "#6366f1", desc: "Nächstes Unlock", requires: null, removable: true },
  { key: "quick_access", label: "Schnellzugriff", icon: "GO", color: "#6366f1", desc: "Shortcuts", requires: null, removable: true },
  { key: "vision_board", label: "Vision Board", icon: "VIS", color: "#a855f7", desc: "Affirmationen", requires: "vision_board", removable: true },
];

export const DEFAULT_DASHBOARD_LAYOUT = [
  "today_command",
  "hunter_status",
  "streak_display",
  "daily_progress",
  "health_summary",
  "screen_time_summary",
  "quests",
  "gem_booster",
  "habits",
  "micro_habits",
  "next_unlock",
];

export const DEFAULT_HIDDEN_WIDGETS = ["quick_access", "vision_board"];

const LEGACY_CLEANUP_LAYOUT = [
  "today_command",
  "gem_booster",
  "hunter_status",
  "streak_display",
  "daily_progress",
  "health_summary",
  "screen_time_summary",
  "quests",
  "habits",
  "micro_habits",
  "next_unlock",
];

function sameOrder(a = [], b = []) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

export function mergeConfig(saved, can) {
  const allKeys = DASHBOARD_WIDGETS.map(w => w.key);
  const savedLayout = saved?.layout || null;
  let layout = (sameOrder(savedLayout, LEGACY_CLEANUP_LAYOUT) ? DEFAULT_DASHBOARD_LAYOUT : (savedLayout || DEFAULT_DASHBOARD_LAYOUT))
    .filter(k => allKeys.includes(k));
  let hidden = saved?.hidden ?? [...DEFAULT_HIDDEN_WIDGETS];
  const collapsed = saved?.collapsed ?? {};

  const mandatoryKeys = DASHBOARD_WIDGETS.filter(w => !w.removable).map(w => w.key);
  for (const key of mandatoryKeys) {
    if (!layout.includes(key)) {
      layout.unshift(key);
      hidden = hidden.filter(k => k !== key);
    }
  }

  // Carousel widgets must always be in layout (they render in the horizontal strip).
  // If the user's saved config predates these widgets, they'd end up in "hidden" and never show.
  const carouselKeys = DASHBOARD_WIDGETS.filter(w => w.carousel).map(w => w.key);
  for (const key of carouselKeys) {
    if (!layout.includes(key)) {
      // Insert after today_command so they're grouped at the top
      const todayIdx = layout.indexOf('today_command');
      layout.splice(todayIdx + 1, 0, key);
      hidden = hidden.filter(k => k !== key);
    }
  }

  const known = new Set([...layout, ...hidden]);
  for (const key of allKeys) {
    if (!known.has(key)) {
      if (key === "today_command") layout.unshift(key);
      else hidden.push(key);
    }
  }

  layout = layout.filter(k => allKeys.includes(k));
  hidden = hidden.filter(k => allKeys.includes(k));

  return { layout, hidden, collapsed };
}

export function getWidgetDef(key) {
  return DASHBOARD_WIDGETS.find(w => w.key === key) || null;
}
