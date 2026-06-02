import {
  PREMIUM_DASHBOARD_WIDGET_KEYS,
  PREMIUM_ROUTE_FEATURES,
  PREMIUM_WIDGET_MODULE_KEYS,
  getPremiumFeature,
} from "../data/premium.js";
import { SCREEN_TIME_ENABLED } from "../data/featureFlags.js";
import { en } from "../data/locales/en.js";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from "../components/views/DashboardWidgetRegistry.js";
import { readFile } from "node:fs/promises";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

assert(PREMIUM_ROUTE_FEATURES.challenges === undefined, "Events route should be free");
assert(PREMIUM_ROUTE_FEATURES.soullink_overlay === undefined, "Soul Link overlay should be free");
assert(SCREEN_TIME_ENABLED === false, "Screen Time should stay parked until Apple entitlement approval");
assert(!PREMIUM_DASHBOARD_WIDGET_KEYS.includes("screen_time_summary"), "Screen Time summary must not be sold as a Premium dashboard widget");
assert(!PREMIUM_WIDGET_MODULE_KEYS.includes("screen_time"), "Screen Time module must not be sold as a Premium widget module");
assert(!DASHBOARD_WIDGETS.some(widget => widget.key === "screen_time_summary"), "Parked Screen Time widget must not appear in the dashboard registry");
assert(!DEFAULT_DASHBOARD_LAYOUT.includes("screen_time_summary"), "Parked Screen Time widget must not appear in the default dashboard layout");
assert(getPremiumFeature("unlimited_quests").desc.includes("10"), "Quest paywall copy should mention the 10/day Free limit");
assert(!getPremiumFeature("advanced_widgets").desc.includes("Bildschirmzeit"), "Premium widget copy must not sell parked Screen Time");
assert(!getPremiumFeature("widgets").desc.includes("Screen Time"), "Widget module copy must not sell parked Screen Time");
assert(en.premium.features.dungeons.desc.includes("3 Gates"), "English Dungeon copy should describe the Free quota");
assert(en.premium.features.equipment.desc.includes("Rare"), "English Equipment copy should describe the Free tier");
assert(en.premium.features.shadow_army.desc.includes("5 Shadows"), "English Shadow copy should describe the Free quota");
assert(en.premium.features.jobs.desc.includes("one class"), "English Jobs copy should describe the Free class lock");
assert(en.premium.features.charisma_dungeons.desc.includes("1 Charisma chain"), "English Charisma copy should describe the Free quota");

const namedAwardFiles = [
  "../hooks/questActions.js",
  "../hooks/dungeonActions.js",
  "../hooks/useGameState.jsx",
];
for (const file of namedAwardFiles) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  assert(source.includes("canAddNamedShadow"), `${file} should gate Named Shadow awards`);
  assert(source.includes("isFeatureUnlocked('named_shadows'"), `${file} should keep the Named Shadow level gate`);
}

const helpersSource = await readFile(new URL("../data/helpers.js", import.meta.url), "utf8");
assert(helpersSource.includes("SCREEN_TIME_ENABLED && state?.screenTimePreferences?.enabled"), "Screen Time Quest injection should stay behind the release flag");

const settingsSource = await readFile(new URL("../components/SettingsView.jsx", import.meta.url), "utf8");
assert(settingsSource.includes("SCREEN_TIME_ENABLED && <SettingsSection"), "Screen Time settings should stay behind the release flag");

const dashboardSource = await readFile(new URL("../components/views/DashboardView.jsx", import.meta.url), "utf8");
assert(dashboardSource.includes("SCREEN_TIME_ENABLED && q && q.isScreenTime"), "Legacy Screen Time Quest interception should stay behind the release flag");

const analyticsSource = await readFile(new URL("../components/AnalyticsDashboard.jsx", import.meta.url), "utf8");
assert(analyticsSource.includes('SCREEN_TIME_ENABLED ? "HEALTH + USAGE" : "HEALTH"'), "Analytics heading should omit parked Screen Time");
assert(analyticsSource.includes("...(SCREEN_TIME_ENABLED ? ["), "Analytics Screen Time metrics should stay behind the release flag");
assert(analyticsSource.includes("{SCREEN_TIME_ENABLED && <div"), "Analytics Focus Guard should stay behind the release flag");

const widgetServiceSource = await readFile(new URL("../services/widgetDataService.js", import.meta.url), "utf8");
assert(widgetServiceSource.includes("...(SCREEN_TIME_ENABLED ? [{ key: 'screen_time'"), "Native Screen Time widget module should stay behind the release flag");
assert(widgetServiceSource.includes(".filter(module => SCREEN_TIME_ENABLED || module !== 'screen_time')"), "Native widget sync should remove legacy Screen Time selections while parked");
assert(widgetServiceSource.includes("const screenTime = SCREEN_TIME_ENABLED ? {"), "Native widget payload should omit Screen Time data while parked");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("test-free-pro-phase4: all assertions passed.");
