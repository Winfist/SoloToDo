import { FEATURE_UNLOCKS } from "../data/featureUnlocks.js";
import { getFeatureIconName } from "../components/tutorial/featureIconMap.js";

const VALID_ICON_NAMES = new Set([
  "gate", "shop", "sanctum", "story", "habit", "goal", "shadow",
  "codex", "job", "season", "link", "star", "bolt", "scan", "music",
  "chart", "calendar", "trophy", "focus", "gem", "equip", "chain",
]);

let failures = 0;

for (const key of Object.keys(FEATURE_UNLOCKS)) {
  const iconName = getFeatureIconName(key);
  if (VALID_ICON_NAMES.has(iconName)) {
    console.log("PASS", key, "->", iconName);
  } else {
    console.error("FAIL", key, "->", iconName);
    failures += 1;
  }
}

if (failures) {
  console.error(`\n${failures} feature(s) without a valid icon`);
  process.exit(1);
}

console.log("\nAll feature keys map to a valid icon.");
