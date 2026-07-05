import { checkHiddenQuestTriggers } from "../data/helpers.js";

function fires(id, state) {
  return checkHiddenQuestTriggers(state).some(q => q.id === id);
}
const base = { hiddenQuests: { discovered: [], completed: [] }, stats: {}, shadowArmy: { shadows: [] } };

// stat_combo: zwei Stats gleichzeitig über Schwelle
if (!fires("hq_dual_mastery", { ...base, stats: { str: 30, int: 30 } })) { console.error("stat_combo trigger broken"); process.exit(1); }
// dungeon_clears
if (!fires("hq_gate_breaker", { ...base, dungeonHistory: Array(15).fill({ won: true }) })) { console.error("dungeon_clears trigger broken"); process.exit(1); }
// focus_sessions
if (!fires("hq_flow_state", { ...base, stats: { focusSessions: 25 } })) { console.error("focus_sessions trigger broken"); process.exit(1); }

// gold_amount
if (!fires("hq_gold_hoarder", { ...base, gold: 5000 })) { console.error("gold_amount trigger broken"); process.exit(1); }

// shadow_count
if (!fires("hq_shadow_collector", { ...base, shadowArmy: { shadows: Array(10).fill({}) } })) { console.error("shadow_count trigger broken"); process.exit(1); }

// time_of_day_between (mocking Date)
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super("2023-10-14T00:00:00Z"); // Saturday 12 AM UTC
    } else {
      super(...args);
    }
  }
};

if (!fires("hq_night_owl", base)) { console.error("time_of_day_between trigger broken"); process.exit(1); }

// weekend_hard_boss
if (!fires("hq_weekend_warrior", { ...base, completedQuests: [{ difficulty: "hard" }] })) { console.error("weekend_hard_boss trigger broken"); process.exit(1); }

console.log("✓ Hidden: neue Trigger feuern korrekt");

// ── Achievement-Redemption (Paket A) ──
import { redeemHiddenAchievements, computeHiddenAchievementReward, HIDDEN_QUESTS } from "../data/helpers.js";

// Belohnungsformel: normal (15 XP / 25 Gold) × Typ hidden (3×/3×) × Quest-Mult (3×/2×)
const cuts = HIDDEN_QUESTS.find(h => h.id === "hq_thousand_cuts");
const reward = computeHiddenAchievementReward(cuts);
if (reward.xp !== 135) { console.error(`reward.xp expected 135, got ${reward.xp}`); process.exit(1); }
if (reward.gold !== 150) { console.error(`reward.gold expected 150, got ${reward.gold}`); process.exit(1); }

// Redemption: schreibt XP/Gold gut, trägt in completed ein, leert discovered, ist idempotent
const redeemBase = {
  ...base, level: 10, xp: 0, gold: 100, totalGoldEarned: 0,
  hiddenQuests: { discovered: ["hq_thousand_cuts"], completed: [] },
  settings: { language: "de" },
};
const r1 = redeemHiddenAchievements(redeemBase, ["hq_thousand_cuts"]);
if (r1.redeemed.length !== 1) { console.error("redeem should redeem 1"); process.exit(1); }
if (r1.redeemed[0].grantedXp !== 135 || r1.redeemed[0].grantedGold !== 150) { console.error("granted values wrong"); process.exit(1); }
if (!r1.redeemed[0].title || !r1.redeemed[0].desc) { console.error("redeemed must carry locale title+desc"); process.exit(1); }
if (r1.state.gold !== 250) { console.error(`gold expected 250, got ${r1.state.gold}`); process.exit(1); }
if (!r1.state.hiddenQuests.completed.includes("hq_thousand_cuts")) { console.error("not marked completed"); process.exit(1); }
if (r1.state.hiddenQuests.discovered.length !== 0) { console.error("discovered must be emptied"); process.exit(1); }
const r2 = redeemHiddenAchievements(r1.state, ["hq_thousand_cuts"]);
if (r2.redeemed.length !== 0) { console.error("redeem must be idempotent"); process.exit(1); }

console.log("✓ Hidden: Achievement-Redemption korrekt");

// ── Integration: Quest-Abschluss löst Achievement sofort ein, kein Board-Eintrag ──
import { buildCompleteQuestState } from "../hooks/questActions.js";
import { DEFAULT_STATE } from "../data/defaultState.js";

const passThrough = (s) => ({ nextState: s, newAchievements: [] });
const intState = structuredClone(DEFAULT_STATE);
intState.level = 99; // hidden_quests-Feature sicher freigeschaltet
intState.settings = { ...(intState.settings || {}), language: "de" };
intState.totalQuestsCompleted = 9; // Abschluss Nr. 10 triggert hq_thousand_cuts
intState.hiddenQuests = { discovered: [], completed: [] };
intState.quests = [{ id: "tq1", title: "Testquest", category: "int", difficulty: "easy", type: "side", isSystem: true, createdAt: "2023-01-01", createdAtMs: Date.now() - 3600000 }];
const intResult = buildCompleteQuestState("tq1", intState, passThrough);
if (!intResult) { console.error("buildCompleteQuestState returned null"); process.exit(1); }
if (intResult.nextState.quests.some(q => q.type === "hidden")) { console.error("hidden board entry must not be created"); process.exit(1); }
if (!intResult.nextState.hiddenQuests.completed.includes("hq_thousand_cuts")) { console.error("achievement not completed"); process.exit(1); }
if (intResult.nextState.hiddenQuests.discovered.length !== 0) { console.error("discovered must stay empty"); process.exit(1); }
const cutsRedeemed = intResult.newlyDiscoveredHQ.find(h => h.id === "hq_thousand_cuts");
if (!cutsRedeemed || !cutsRedeemed.grantedXp || !cutsRedeemed.grantedGold) { console.error("newlyDiscoveredHQ must carry granted rewards"); process.exit(1); }
console.log("✓ Hidden: Integration Sofort-Einlösung korrekt");
