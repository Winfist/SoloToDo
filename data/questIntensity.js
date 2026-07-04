import { isPremiumActive } from "./premium.js";
import { getQuestOverloadPreset } from "./questPlanning.js";

export const DEFAULT_QUEST_INTENSITY_KEY = "baby_gate";

export const QUEST_INTENSITY_PRESETS = [
  {
    key: "baby_gate",
    label: "Baby Gate",
    rank: "E-",
    shortLabel: "Baby",
    intervalHours: 24,
    dailyQuestCount: 1,
    activeCap: 1,
    color: "#64748b",
    iconKey: "easy",
    tone: "Fast kein Druck",
    desc: "Ein Systemruf pro Tag. Perfekt, wenn du nur einen kleinen Push willst.",
  },
  {
    key: "e_rank_patrol",
    label: "E-Rank Patrouille",
    rank: "E",
    shortLabel: "Patrouille",
    intervalHours: 8,
    dailyQuestCount: 2,
    activeCap: 2,
    color: "#22d3ee",
    iconKey: "normal",
    tone: "Locker",
    desc: "Alle acht Stunden ein neuer Auftrag. Gut für Alltag ohne Dauerstress.",
  },
  {
    key: "hunter_patrol",
    label: "Hunter Drill",
    rank: "D",
    shortLabel: "Drill",
    intervalHours: 4,
    dailyQuestCount: 3,
    activeCap: 4,
    color: "#34d399",
    iconKey: "normal",
    tone: "Ausgewogen",
    desc: "Alle vier Stunden ein Systemruf. Der Standard für spürbaren Fortschritt.",
  },
  {
    key: "red_gate",
    label: "Red Gate Alarm",
    rank: "B",
    shortLabel: "Red Gate",
    intervalHours: 3,
    dailyQuestCount: 3,
    activeCap: 6,
    color: "#f59e0b",
    iconKey: "hard",
    tone: "Intensiv",
    desc: "Alle drei Stunden Druck vom System. Für Tage, an denen du viel schaffen willst.",
  },
  {
    key: "monarch_call",
    label: "Monarch Call",
    rank: "S",
    shortLabel: "Monarch",
    intervalHours: 2,
    dailyQuestCount: 4,
    activeCap: 8,
    color: "#ef4444",
    iconKey: "boss",
    tone: "Brutal",
    desc: "Alle zwei Stunden ein neuer Auftrag. Nur aktivieren, wenn du wirklich jagen willst.",
  },
];

export function getQuestIntensityPreset(value) {
  const key = typeof value === "string"
    ? value
    : value?.settings?.questIntensity || value?.questIntensity;
  return QUEST_INTENSITY_PRESETS.find(preset => preset.key === key)
    || QUEST_INTENSITY_PRESETS.find(preset => preset.key === DEFAULT_QUEST_INTENSITY_KEY)
    || QUEST_INTENSITY_PRESETS[0];
}

export function getEffectiveQuestIntensityPreset(value, nowMs = Date.now()) {
  const selected = getQuestIntensityPreset(value);
  if (typeof value === "string" || value?.intervalHours) return selected;
  return isPremiumActive(value?.premium, nowMs)
    ? selected
    : getQuestIntensityPreset(DEFAULT_QUEST_INTENSITY_KEY);
}

export function getQuestIntensityIntervalMs(value) {
  return getEffectiveQuestIntensityPreset(value).intervalHours * 60 * 60 * 1000;
}

export function getDailySystemQuestCount(value) {
  return getEffectiveQuestIntensityPreset(value).dailyQuestCount;
}

export function getQuestIntensityActiveCap(value) {
  return getEffectiveQuestIntensityPreset(value).activeCap;
}

// One plain-language answer to "wie stark greift das System ein?" — always
// built from EFFECTIVE values (free users are pinned to baby_gate even when
// a higher intensity is selected), so the Settings banner never lies.
export function getSystemCallSummary(state, nowMs = Date.now()) {
  const selected = getQuestIntensityPreset(state);
  const effective = getEffectiveQuestIntensityPreset(state, nowMs);
  const overload = getQuestOverloadPreset(state);
  return {
    selectedKey: selected.key,
    effectiveKey: effective.key,
    limitedByFree: selected.key !== effective.key,
    callsPerDay: effective.dailyQuestCount,
    intervalHours: effective.intervalHours,
    intensityLabel: effective.label,
    pauseAtOpenQuests: overload.overloadCount,
    warnAtOpenQuests: overload.warningCount,
    staleDays: overload.staleDays,
    overloadLabel: overload.label,
  };
}

export function formatQuestIntensityInterval(presetOrValue) {
  const preset = typeof presetOrValue === "object" && presetOrValue.intervalHours
    ? presetOrValue
    : getQuestIntensityPreset(presetOrValue);
  if (preset.intervalHours >= 24) return "1x pro Tag";
  return `alle ${preset.intervalHours} Stunden`;
}

export function formatQuestIntensityCooldown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "bereit";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
