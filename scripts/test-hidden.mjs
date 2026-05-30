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
