import {
  NOTIFICATION_PRESETS,
  DEFAULT_NOTIFICATION_PRESET_KEY,
  getNotificationPreset,
  getCategoryTier,
  isCategoryEnabled,
  isWithinQuietHours,
  canFireNotification,
  isEssentialCategory,
  formatNotificationPresetSummary,
  INACTIVITY_COMEBACK_DAYS,
  INACTIVITY_COMEBACK_HOUR,
  computeInactivityComebackAt,
} from "../data/notificationPresets.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures += 1;
  }
};

assert(DEFAULT_NOTIFICATION_PRESET_KEY === "standard", "default preset is standard");
assert(NOTIFICATION_PRESETS.length === 4, "four presets exist");
assert(NOTIFICATION_PRESETS.every(p => p.key && Number.isInteger(p.maxTier)), "presets well-formed");
assert(NOTIFICATION_PRESETS.every(p => p.label && p.desc), "presets have label + desc");

assert(getNotificationPreset("intensiv").key === "intensiv", "resolve by key string");
assert(getNotificationPreset("nope").key === "standard", "unknown key falls back to standard");
assert(getNotificationPreset(undefined).key === "standard", "undefined falls back");
assert(getNotificationPreset({ settings: { notificationLevel: "dezent" } }).key === "dezent", "resolve from state object");
assert(getNotificationPreset({ settings: {} }).key === "standard", "state without level falls back");

assert(getCategoryTier("emergency_expiry") === 0, "emergency is tier 0");
assert(getCategoryTier("habit_nudge") === 1, "habit nudge is tier 1");
assert(getCategoryTier("daily_activity") === 2, "daily activity is tier 2");
assert(getCategoryTier("totally_unknown") === 0, "unknown category treated as essential");
assert(isEssentialCategory("due_warning") === true, "due_warning is essential");
assert(isEssentialCategory("streak_protection") === false, "streak_protection is not essential");

assert(isCategoryEnabled("funkstille", "custom_reminder") === true, "funkstille keeps essentials");
assert(isCategoryEnabled("funkstille", "habit_nudge") === false, "funkstille drops nudges");
assert(isCategoryEnabled("funkstille", "daily_activity") === false, "funkstille drops pressure");
assert(isCategoryEnabled("dezent", "habit_nudge") === true, "dezent keeps nudges");
assert(isCategoryEnabled("dezent", "streak_protection") === false, "dezent drops streak protection");
assert(isCategoryEnabled("standard", "habit_nudge") === true, "standard keeps nudges");
assert(isCategoryEnabled("standard", "streak_protection") === true, "standard adds streak protection via plus");
assert(isCategoryEnabled("standard", "daily_activity") === false, "standard drops daily_activity");
assert(isCategoryEnabled("standard", "late_night") === false, "standard drops late_night");
assert(isCategoryEnabled("intensiv", "daily_activity") === true, "intensiv keeps daily_activity");
assert(isCategoryEnabled("intensiv", "late_night") === true, "intensiv keeps late_night");

const standard = getNotificationPreset("standard");
assert(isWithinQuietHours(23, standard) === true, "23:00 within 22-8");
assert(isWithinQuietHours(3, standard) === true, "03:00 within 22-8");
assert(isWithinQuietHours(22, standard) === true, "22:00 start boundary inclusive");
assert(isWithinQuietHours(8, standard) === false, "08:00 end boundary exclusive");
assert(isWithinQuietHours(12, standard) === false, "noon outside 22-8");
const intensiv = getNotificationPreset("intensiv");
assert(isWithinQuietHours(3, intensiv) === true, "03:00 within 0-7");
assert(isWithinQuietHours(7, intensiv) === false, "07:00 end boundary exclusive");
assert(isWithinQuietHours(9, intensiv) === false, "09:00 outside 0-7");

assert(canFireNotification({ presetOrKey: "standard", category: "emergency_expiry", firedToday: 99, hour: 3 }) === true, "essential bypasses cap + quiet hours");
assert(canFireNotification({ presetOrKey: "standard", category: "daily_activity", firedToday: 0, hour: 12 }) === false, "disabled category never fires");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 0, hour: 23 }) === false, "nudge blocked during quiet hours");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 0, hour: 19 }) === true, "nudge allowed daytime under cap");
assert(canFireNotification({ presetOrKey: "standard", category: "habit_nudge", firedToday: 5, hour: 19 }) === false, "nudge blocked at cap");
assert(canFireNotification({ presetOrKey: "funkstille", category: "due_warning", firedToday: 999, hour: 3 }) === true, "funkstille essential always fires");

assert(formatNotificationPresetSummary(getNotificationPreset("standard")).includes("max 5/Tag"), "standard summary shows cap");
assert(formatNotificationPresetSummary(getNotificationPreset("funkstille")).includes("Essentielles"), "funkstille summary shows essentials-only");

// ── Inactivity comeback push (Reaktivierung nach 2 Tagen Abwesenheit) ──
assert(INACTIVITY_COMEBACK_DAYS === 2, "comeback fires after 2 days of absence");
assert(getCategoryTier("inactivity_comeback") === 1, "inactivity_comeback is a tier-1 nudge");
assert(isCategoryEnabled("funkstille", "inactivity_comeback") === false, "funkstille users get no comeback push");
assert(isCategoryEnabled("dezent", "inactivity_comeback") === true, "dezent users get the comeback push");
assert(isCategoryEnabled("standard", "inactivity_comeback") === true, "standard users get the comeback push");
assert(isCategoryEnabled("intensiv", "inactivity_comeback") === true, "intensiv users get the comeback push");
{
  const base = new Date("2026-07-02T23:50:00").getTime();
  const at = computeInactivityComebackAt(base);
  assert(at instanceof Date && at.getDate() === 4 && at.getHours() === INACTIVITY_COMEBACK_HOUR && at.getMinutes() === 0,
    `comeback scheduled 2 days later at ${INACTIVITY_COMEBACK_HOUR}:00 (got ${at})`);
  // Fire hour must lie outside EVERY preset's quiet hours so scheduling never silently drops it
  assert(NOTIFICATION_PRESETS.every(p => !isWithinQuietHours(INACTIVITY_COMEBACK_HOUR, p)),
    "comeback hour is outside all quiet-hour windows");
}

if (failures) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("test-notification-presets: all assertions passed.");
