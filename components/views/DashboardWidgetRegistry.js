// ─── DASHBOARD WIDGET REGISTRY ────────────────────────────────
// Single source of truth for all widgets available on the dashboard.
// Each widget defines its key, label, icon, feature requirement, and
// whether the user may remove it.

export const DASHBOARD_WIDGETS = [
  { key: "today_command", label: "Heute", icon: "NOW", color: "#22d3ee", desc: "Top 3, Reminder und Risiken", requires: null, removable: false },
  { key: "gem_booster", label: "Gem Boosters", icon: "💎", color: "#a855f7", desc: "Aktive Premium-Booster", requires: "gem_shop", removable: true },
  { key: "hunter_status", label: "Hunter Status", icon: "⚔️", color: "#22d3ee", desc: "Level, Stats & XP-Übersicht", requires: null, removable: true },
  { key: "streak_display", label: "Streak-Anzeige", icon: "🔥", color: "#f97316", desc: "Dein Streak mit Flammen-Effekt", requires: null, removable: true },
  { key: "daily_progress", label: "Tagesfortschritt", icon: "📊", color: "#22c55e", desc: "Wie viel du heute geschafft hast", requires: null, removable: true },
  { key: "quests", label: "Hunter Quests", icon: "📜", color: "#f59e0b", desc: "Aktive Quests & Filter", requires: null, removable: false },
  { key: "quick_access", label: "Schnellzugriff", icon: "⚡", color: "#6366f1", desc: "Shortcuts zu Features", requires: null, removable: true },
  { key: "vision_board", label: "Vision Board", icon: "🔮", color: "#a855f7", desc: "Affirmationen & Motivation", requires: "vision_board", removable: true },
  { key: "habits", label: "Habit Tracker", icon: "🎯", color: "#22c55e", desc: "Tägliche Gewohnheiten", requires: "habit_tracker", removable: true },
  { key: "micro_habits", label: "Micro-Habits", icon: "✨", color: "#06b6d4", desc: "Kleine tägliche Aufgaben", requires: "micro_habits", removable: true },
  { key: "next_unlock", label: "System-Update", icon: "🔓", color: "#6366f1", desc: "Nächstes Feature-Unlock", requires: null, removable: true },
  { key: "health_summary", label: "Bewegung & Health", icon: "👟", color: "#38bdf8", desc: "HealthTracker & Belohnungen", requires: null, removable: true },
];

// The default layout order — new users get this
export const DEFAULT_DASHBOARD_LAYOUT = [
  "today_command",
  "gem_booster",
  "hunter_status",
  "quests",
  "habits",
  "micro_habits",
  "vision_board",
  "health_summary",
  "next_unlock",
];

// Which widgets are hidden by default (new widgets start hidden so existing
// users don't get a changed dashboard unexpectedly)
export const DEFAULT_HIDDEN_WIDGETS = ["streak_display", "daily_progress", "quick_access"];

/**
 * Merge a saved config with the latest registry.
 * Handles: new widgets added, removed widgets, missing fields.
 */
export function mergeConfig(saved, can) {
  const allKeys = DASHBOARD_WIDGETS.map(w => w.key);

  // layout: saved order, but only valid keys
  let layout = (saved?.layout || DEFAULT_DASHBOARD_LAYOUT).filter(k => allKeys.includes(k));

  // hidden: saved hidden list
  let hidden = saved?.hidden ?? [...DEFAULT_HIDDEN_WIDGETS];

  // collapsed: saved collapsed map
  let collapsed = saved?.collapsed ?? {};

  // Enforce mandatory widgets
  const mandatoryKeys = DASHBOARD_WIDGETS.filter(w => !w.removable).map(w => w.key);
  for (const m of mandatoryKeys) {
    if (!layout.includes(m)) {
      layout.unshift(m);
      hidden = hidden.filter(k => k !== m);
    }
  }

  // Any new widgets not in layout AND not in hidden → add to hidden
  const known = new Set([...layout, ...hidden]);
  for (const key of allKeys) {
    if (!known.has(key)) {
      if (key === "today_command") {
        layout.unshift(key);
      } else {
        hidden.push(key);
      }
    }
  }

  // Remove keys that no longer exist in registry
  layout = layout.filter(k => allKeys.includes(k));
  hidden = hidden.filter(k => allKeys.includes(k));

  return { layout, hidden, collapsed };
}

/**
 * Get the widget definition by key.
 */
export function getWidgetDef(key) {
  return DASHBOARD_WIDGETS.find(w => w.key === key) || null;
}
