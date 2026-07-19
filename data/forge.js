// forge.js — Pending-Set der Quest-Schmiede (Spec 2026-07-18 §3).
// Pur & defensiv: Vorschlaege entstehen bei der Generierung, leben genau einen
// Tag und werden erst bei der Annahme in echte Board-Quests getauscht.

import { swapSystemQuests, getSwappedQuests, countManualForgeTargets } from "./questSwap.js";
import { getDailySystemQuestCount } from "./questIntensity.js";
import { recordQuestsSwapped, recordQuestsAssigned, recordUserAction } from "./signals.js";

const MAX_PROPOSALS = 3;

export const DEFAULT_FORGE = { pending: null };

export function createPendingSet(proposals, { source = "manual", today = "", nowMs = Date.now() } = {}) {
  const list = (Array.isArray(proposals) ? proposals : [])
    .filter(Boolean)
    .slice(0, MAX_PROPOSALS)
    .map((quest) => ({ ...quest, origin: "forge" }));
  return {
    proposals: list,
    date: String(today || ""),
    generatedAtMs: Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now(),
    source: source === "auto" ? "auto" : "manual",
  };
}

export function isPendingSetValid(state, today) {
  const pending = state?.forge?.pending;
  return Boolean(pending
    && pending.date === String(today || "")
    && Array.isArray(pending.proposals)
    && pending.proposals.length > 0);
}

export function clearPendingSet(state) {
  return { ...(state || {}), forge: { ...(state?.forge || {}), pending: null } };
}

export function getSelectableCount(state) {
  try {
    return Math.max(0, Math.min(
      getDailySystemQuestCount(state || {}),
      countManualForgeTargets(state?.quests || [])
    ));
  } catch {
    return 0;
  }
}

// Annahme: ersetzt exakt die gewaehlten Vorschlaege (gekappt auf Slots/freie
// Dailies) via bestehendem Manual-Swap. Fasst state.ai NICHT an — der
// Schmiede-Credit ist bereits bei der Generierung gestempelt.
export function acceptProposals(state, proposalIds, { today = "" } = {}) {
  try {
    const pending = state?.forge?.pending;
    const wanted = new Set(Array.isArray(proposalIds) ? proposalIds : []);
    const selected = (pending?.proposals || [])
      .filter((quest) => quest && wanted.has(quest.id))
      .slice(0, getSelectableCount(state));
    if (selected.length === 0) return { state: state || {}, acceptedCount: 0 };

    const replaced = getSwappedQuests(state.quests || [], selected, { mode: "manual" });
    let next = { ...state, quests: swapSystemQuests(state.quests || [], selected, { mode: "manual" }) };
    next = recordQuestsSwapped(next, replaced, today);
    next = recordQuestsAssigned(next, selected.slice(0, replaced.length || selected.length), today);
    next = recordUserAction(next, today);
    next = { ...next, forge: { ...(next.forge || {}), pending: null } };
    return { state: next, acceptedCount: selected.length };
  } catch {
    return { state: state || {}, acceptedCount: 0 };
  }
}
