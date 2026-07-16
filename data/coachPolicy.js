// coachPolicy.js — Anti-Nerv-Schicht (Spec 2026-07-14 §9): Budget, Mute,
// Posture. Pur und defensiv; die Anzeige (checkCoach in solo-leveling-v5)
// zeigt genau EINE Meldung und stempelt sie via recordInterventionShown.

import { getCoachPosture } from "./hunterDossier.js";

export const POSTURE_SUPPRESSED = {
  struggling: ["imbalance"],
  cruising: ["inactivity", "overexertion", "imbalance", "habitReminder", "openedButIdle", "questOverload"],
};

const DAILY_BUDGET = { coaching: 1, warning: 1 };

export function pickCoachMessage(state, messages, today) {
  try {
    const list = Array.isArray(messages) ? messages : [];
    if (list.length === 0) return null;
    const cs = state?.coachSignals || {};
    const daily = cs.daily?.date === today ? cs.daily : { coachingShown: 0, warningShown: 0 };
    const posture = getCoachPosture(state || {});
    const suppressed = new Set(POSTURE_SUPPRESSED[posture] || []);

    for (const message of list) {
      if (!message) continue;
      if (message.type === "celebration") return message;
      const checkId = message.checkId || null;
      if (checkId && suppressed.has(checkId)) continue;
      const mutedUntil = checkId ? cs.byType?.[checkId]?.mutedUntil : null;
      if (mutedUntil && String(today) <= String(mutedUntil)) continue;
      if (message.type === "warning") {
        if ((Number(daily.warningShown) || 0) >= DAILY_BUDGET.warning) continue;
        return message;
      }
      if ((Number(daily.coachingShown) || 0) >= DAILY_BUDGET.coaching) continue;
      return message;
    }
    return null;
  } catch {
    return null;
  }
}
