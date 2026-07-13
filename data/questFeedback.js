// questFeedback.js — Ein-Tipp-Feedback auf abgeschlossene System-/KI-Quests.
// Schreibt in die seit jeher vorhandenen (bisher toten) Felder der
// completedQuests-Eintraege; von dort fliessen sie automatisch ueber
// buildAIQuestProfile in jeden Generierungs-Prompt.

export const FELT_DIFFICULTY = ["too_easy", "ok", "too_hard"];
export const CATEGORY_FEEDBACK = ["more", "less"];

export function applyQuestFeedback(state = {}, completedQuestId, patch = {}) {
  const feltDifficulty = FELT_DIFFICULTY.includes(patch.feltDifficulty) ? patch.feltDifficulty : undefined;
  const categoryFeedback = CATEGORY_FEEDBACK.includes(patch.categoryFeedback) ? patch.categoryFeedback : undefined;
  if (!completedQuestId || (feltDifficulty === undefined && categoryFeedback === undefined)) return state;

  let changed = false;
  const completedQuests = (state.completedQuests || []).map((quest) => {
    if (!quest || quest.id !== completedQuestId) return quest;
    changed = true;
    return {
      ...quest,
      ...(feltDifficulty !== undefined ? { feltDifficulty } : {}),
      ...(categoryFeedback !== undefined ? { categoryFeedback } : {}),
    };
  });
  return changed ? { ...state, completedQuests } : state;
}
