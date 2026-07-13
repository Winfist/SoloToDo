import { getForgeStatus, applyForgeUsage, AI_FREE_TRIAL_REQUIREMENTS } from "../data/freeLimits.js";

let failures = 0;
const check = (cond, msg) => { if (!cond) { console.error(`✗ ${msg}`); failures += 1; } };

const earned = { level: 3, totalQuestsCompleted: 5, ai: {} };

// Earn-it-Gate gilt fuer Free UND Pro
check(getForgeStatus({ premiumActive: false, state: { level: 2, totalQuestsCompleted: 9 }, today: "2026-07-13" }).reason === "level", "unter Lv3 gesperrt");
check(getForgeStatus({ premiumActive: true, state: { level: 5, totalQuestsCompleted: 1 }, today: "2026-07-13" }).reason === "quests", "unter 5 Quests auch fuer Pro gesperrt");

// Free: 1x/Tag, KEIN Lebenszeit-Deckel
check(getForgeStatus({ premiumActive: false, state: earned, today: "2026-07-13" }).allowed === true, "Free: verfuegbar");
const used = applyForgeUsage(earned, { premiumActive: false, today: "2026-07-13" });
check(used.ai.lastForgeDate === "2026-07-13", "Verbrauch stempelt lastForgeDate");
check(getForgeStatus({ premiumActive: false, state: used, today: "2026-07-13" }).reason === "daily", "Free: heute verbraucht");
check(getForgeStatus({ premiumActive: false, state: used, today: "2026-07-14" }).allowed === true, "Free: morgen wieder frei (kein Gesamtdeckel)");

// Getrennt vom interaktiven Credit: freeCreditsUsed beeinflusst die Schmiede nicht
const interactiveSpent = { ...earned, ai: { freeCreditsUsed: 3 } };
check(getForgeStatus({ premiumActive: false, state: interactiveSpent, today: "2026-07-13" }).allowed === true, "3 verbrauchte interaktive Credits sperren die Schmiede nicht");

// Pro: kein Tages-Stempel
check(getForgeStatus({ premiumActive: true, state: used, today: "2026-07-13" }).allowed === true, "Pro: trotz Stempel erlaubt");
const proState = applyForgeUsage(used, { premiumActive: true, today: "2026-07-14" });
check(proState.ai.lastForgeDate === "2026-07-13", "Pro-Nutzung stempelt nicht");

check(AI_FREE_TRIAL_REQUIREMENTS.minLevel === 3, "Earn-it-Schwelle unveraendert");

if (failures > 0) { console.error(`${failures} Fehler`); process.exit(1); }
console.log("✓ test-forge-limits: alles gruen");
