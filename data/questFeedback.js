// questFeedback.js — Ein-Tipp-Feedback auf abgeschlossene System-/KI-Quests.
// Schreibt in die seit jeher vorhandenen (bisher toten) Felder der
// completedQuests-Eintraege; von dort fliessen sie automatisch ueber
// buildAIQuestProfile in jeden Generierungs-Prompt.

import { createQuestFingerprint, compareQuestSimilarity } from "./questSimilarity.js";
import { getQuestPlanningSnapshot } from "./questPlanning.js";
import { isSignalDeletableQuest } from "./signals.js";

export const FELT_DIFFICULTY = ["too_easy", "ok", "too_hard"];
export const CATEGORY_FEEDBACK = ["more", "less"];

// ── Loesch-Klassifikation (Spec 2026-07-22 §5.1) ──────────────────────────────
// Nicht jede Loeschung ist Ablehnung. Prueft VOR dem Entfernen der Quest:
//   duplicate — inhaltlich Aehnliches bleibt auf dem Board (Negativ-Signal
//               waere verkehrt herum: der User mag diese Art Aufgabe)
//   prune     — Aufraeumen unter Last (Board overloaded oder ab der dritten
//               Content-Loeschung des Tages): Volumen-, kein Inhalts-Signal
//   content   — gezielte Einzel-Loeschung, das wertvollste Negativ-Signal
export const MAX_CONTENT_DELETES_PER_DAY = 2;

export function classifyQuestDeletion(state = {}, quest, { today = "", nowMs = Date.now() } = {}) {
  try {
    if (!isSignalDeletableQuest(quest)) return "none";

    const fingerprint = createQuestFingerprint(quest);
    const remaining = (Array.isArray(state.quests) ? state.quests : [])
      .filter((q) => q && q.id !== quest.id && !q.completed);
    // Bewusst grosszuegig Richtung Unterdrueckung (auch "soft" zaehlt): ein
    // entgangenes Neutral-Signal kostet fast nichts, ein falsches Negativ-
    // Signal vergiftet das Profil.
    for (const open of remaining) {
      if (compareQuestSimilarity(fingerprint, createQuestFingerprint(open)).level !== "none") {
        return "duplicate";
      }
    }

    const overloaded = Boolean(getQuestPlanningSnapshot(state, nowMs)?.overloadStatus?.overloaded);
    const contentDeletesToday = (state.questSignals?.recentDeleted || [])
      .filter((entry) => entry && entry.date === String(today || "")).length;
    if (overloaded || contentDeletesToday >= MAX_CONTENT_DELETES_PER_DAY) return "prune";

    return "content";
  } catch {
    return "content";
  }
}

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
