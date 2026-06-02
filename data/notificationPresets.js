// Notification intensity presets. This stays import-free so the rules can be
// tested without React, Capacitor, Firebase, or i18n coupling.

// Category key -> tier. 0 = essential, 1 = nudge, 2 = pressure.
export const NOTIFICATION_CATEGORIES = {
  custom_reminder: 0,
  due_warning: 0,
  emergency_expiry: 0,
  rune_deadline: 0,

  due_upcoming: 1,
  habit_nudge: 1,
  weekly_summary: 1,
  gate_reset: 1,
  weekly_expiry: 1,
  emergency_morning: 1,

  daily_activity: 2,
  streak_protection: 2,
  late_night: 2,
};

export const DEFAULT_NOTIFICATION_PRESET_KEY = "standard";

export const NOTIFICATION_PRESETS = [
  {
    key: "funkstille",
    label: "Funkstille",
    shortLabel: "Still",
    tone: "Nur Essentielles",
    desc: "Nur was wirklich zählt: eigene Reminder, Deadlines und Notfälle.",
    color: "#64748b",
    maxTier: 0,
    plus: [],
    minus: [],
    dailyCap: null,
    quietStart: 21,
    quietEnd: 9,
  },
  {
    key: "dezent",
    label: "Dezent",
    shortLabel: "Dezent",
    tone: "Sanft",
    desc: "Sanfte Nudges für Habits, Wochenrückblick und Gate-Reset.",
    color: "#22d3ee",
    maxTier: 1,
    plus: [],
    minus: [],
    dailyCap: 3,
    quietStart: 22,
    quietEnd: 8,
  },
  {
    key: "standard",
    label: "Standard",
    shortLabel: "Standard",
    tone: "Ausgewogen",
    desc: "Nudges plus Streak-Schutz, damit keine Serie reißt.",
    color: "#34d399",
    maxTier: 1,
    plus: ["streak_protection"],
    minus: [],
    dailyCap: 5,
    quietStart: 22,
    quietEnd: 8,
  },
  {
    key: "intensiv",
    label: "Intensiv",
    shortLabel: "Intensiv",
    tone: "Maximal",
    desc: "Alles an: Tages-Pushes, Streak-Druck und Late-Night-Warnungen.",
    color: "#ef4444",
    maxTier: 2,
    plus: [],
    minus: [],
    dailyCap: 8,
    quietStart: 0,
    quietEnd: 7,
  },
];

export function getNotificationPreset(value) {
  if (value && typeof value === "object" && value.key && Number.isInteger(value.maxTier)) {
    return value;
  }
  const key = typeof value === "string"
    ? value
    : value?.settings?.notificationLevel || value?.notificationLevel;
  return NOTIFICATION_PRESETS.find(preset => preset.key === key)
    || NOTIFICATION_PRESETS.find(preset => preset.key === DEFAULT_NOTIFICATION_PRESET_KEY)
    || NOTIFICATION_PRESETS[0];
}

export function getCategoryTier(category) {
  const tier = NOTIFICATION_CATEGORIES[category];
  return Number.isInteger(tier) ? tier : 0;
}

export function isEssentialCategory(category) {
  return getCategoryTier(category) === 0;
}

export function isCategoryEnabled(presetOrKey, category) {
  const preset = getNotificationPreset(presetOrKey);
  if (preset.minus?.includes(category)) return false;
  if (preset.plus?.includes(category)) return true;
  return getCategoryTier(category) <= preset.maxTier;
}

export function getHour(value = new Date()) {
  if (Number.isFinite(value)) return Math.max(0, Math.min(23, Math.floor(value)));
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getHours();
  return new Date().getHours();
}

export function isWithinQuietHours(hourOrDate, presetOrKey) {
  const preset = getNotificationPreset(presetOrKey);
  const start = preset.quietStart;
  const end = preset.quietEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start === end) return false;

  const hour = getHour(hourOrDate);
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function canFireNotification({ presetOrKey, presetKey, category, firedToday = 0, hour, now } = {}) {
  const preset = getNotificationPreset(presetOrKey ?? presetKey);
  if (!isCategoryEnabled(preset, category)) return false;
  if (isEssentialCategory(category)) return true;
  const currentHour = hour ?? now ?? new Date();
  if (isWithinQuietHours(currentHour, preset)) return false;
  if (Number.isInteger(preset.dailyCap) && firedToday >= preset.dailyCap) return false;
  return true;
}

export function formatNotificationPresetSummary(presetOrKey) {
  const preset = getNotificationPreset(presetOrKey);
  const cap = preset.dailyCap == null ? "Essentielles immer" : `max ${preset.dailyCap}/Tag`;
  return `${cap} · Ruhe ${preset.quietStart}-${preset.quietEnd} Uhr`;
}
