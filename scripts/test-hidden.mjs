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
console.log("✓ Hidden: neue Trigger feuern korrekt");
