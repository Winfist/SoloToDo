// forge.js — Persistenter Datenkern der Quest-Schmiede.
// Ein Pending-Set ist eine einmalige Auswahl: Annahme ersetzt atomar die
// gewählten Dailies und schließt danach immer das komplette Set.

import { swapSystemQuests, getSwappedQuests, countManualForgeTargets } from "./questSwap.js";
import { getDailySystemQuestCount } from "./questIntensity.js";
import { getDossierSummary } from "./hunterDossier.js";
import { recordQuestsSwapped, recordQuestsAssigned, recordUserAction } from "./signals.js";
import { QUEST_LOADOUT_CAP } from "./questPlanning.js";

const MAX_PROPOSALS = 3;
const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];

export const DEFAULT_FORGE = { pending: null, updatedAtMs: 0 };

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const normalizeTitle = (value) => String(value || "")
  .normalize("NFKC")
  .toLocaleLowerCase("de-DE")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

function hashText(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function derivePendingId(pending) {
  const proposalFingerprint = (pending?.proposals || [])
    .map((quest) => `${quest?.id || ""}:${normalizeTitle(quest?.title)}`)
    .join("|");
  const generatedAtMs = finiteNumber(pending?.generatedAtMs);
  const fingerprint = [pending?.date || "", generatedAtMs, pending?.source || "", proposalFingerprint].join("|");
  return `forge_${generatedAtMs.toString(36)}_${hashText(fingerprint)}`;
}

function normalizePendingSet(pending) {
  if (!pending || typeof pending !== "object") return null;
  const proposals = (Array.isArray(pending.proposals) ? pending.proposals : [])
    .filter(Boolean)
    .slice(0, MAX_PROPOSALS)
    .map((quest) => ({ ...quest, origin: "forge" }));
  if (proposals.length === 0) return null;

  const generatedAtMs = finiteNumber(pending.generatedAtMs);
  const normalized = {
    ...pending,
    proposals,
    date: String(pending.date || ""),
    generatedAtMs,
    source: pending.source === "auto" ? "auto" : "manual",
  };
  const existingId = typeof pending.id === "string" ? pending.id.trim().slice(0, 160) : "";
  return { ...normalized, id: existingId || derivePendingId(normalized) };
}

export function createPendingSet(proposals, { source = "manual", today = "", nowMs = Date.now() } = {}) {
  const generatedAtMs = finiteNumber(nowMs, Date.now());
  const pending = normalizePendingSet({
    proposals: Array.isArray(proposals) ? proposals : [],
    date: String(today || ""),
    generatedAtMs,
    source,
  });
  // Auch ein leeres Ergebnis behält die erwartete Pending-Shape. Es wird von
  // isPendingSetValid abgewiesen und nie persistiert/angenommen.
  if (pending) return pending;
  const empty = {
    proposals: [],
    date: String(today || ""),
    generatedAtMs,
    source: source === "auto" ? "auto" : "manual",
  };
  return { ...empty, id: derivePendingId(empty) };
}

export function normalizeForgeState(forge) {
  const raw = forge && typeof forge === "object" ? forge : {};
  const pending = normalizePendingSet(raw.pending);
  // Legacy-States hatten nur pending.generatedAtMs. Math.max macht auch
  // direkte Generierungs-Writes robust, die updatedAtMs noch nicht setzten.
  const updatedAtMs = Math.max(
    finiteNumber(raw.updatedAtMs),
    finiteNumber(pending?.generatedAtMs),
  );
  return { ...raw, pending, updatedAtMs };
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

// LWW-Register mit Tombstone: höheres updatedAtMs gewinnt; bei Gleichstand
// gewinnt pending:null. Zwei gleichzeitige Live-Sets werden unabhängig von
// Merge-Richtung deterministisch aufgelöst.
export function mergeForgeState(primaryForge, fallbackForge) {
  const primary = normalizeForgeState(primaryForge);
  const fallback = normalizeForgeState(fallbackForge);
  if (primary.updatedAtMs > fallback.updatedAtMs) return primary;
  if (fallback.updatedAtMs > primary.updatedAtMs) return fallback;
  if (!primary.pending || !fallback.pending) {
    return { ...DEFAULT_FORGE, updatedAtMs: primary.updatedAtMs };
  }

  const primaryKey = `${primary.pending.id}|${stableValue(primary.pending)}`;
  const fallbackKey = `${fallback.pending.id}|${stableValue(fallback.pending)}`;
  return primaryKey >= fallbackKey ? primary : fallback;
}

export function isPendingSetValid(state, today) {
  const pending = state?.forge?.pending;
  return Boolean(pending
    && pending.date === String(today || "")
    && Array.isArray(pending.proposals)
    && pending.proposals.length > 0);
}

export function clearPendingSet(state, { nowMs = Date.now() } = {}) {
  const forge = normalizeForgeState(state?.forge);
  if (!forge.pending) return { ...(state || {}), forge };
  return {
    ...(state || {}),
    forge: {
      ...forge,
      pending: null,
      updatedAtMs: Math.max(forge.updatedAtMs, finiteNumber(nowMs, Date.now())),
    },
  };
}

export function getSelectableCount(state) {
  try {
    return Math.max(0, Math.min(
      QUEST_LOADOUT_CAP,
      getDailySystemQuestCount(state || {}),
      countManualForgeTargets(state?.quests || [])
    ));
  } catch {
    return 0;
  }
}

function getActiveGoalTitles(state) {
  const titles = new Map();
  for (const goal of Array.isArray(state?.goals) ? state.goals : []) {
    if (!Array.isArray(goal?.milestones) || !goal.milestones.some((milestone) => milestone && !milestone.completed)) continue;
    const title = String(goal?.title || "").trim();
    const key = normalizeTitle(title);
    if (key && !titles.has(key)) titles.set(key, title);
  }
  return titles;
}

function getWeakestStats(state) {
  const values = CATEGORY_IDS.map((category) => Number(state?.stats?.[category]));
  if (values.some((value) => !Number.isFinite(value))) return new Set();
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return new Set();
  return new Set(CATEGORY_IDS.filter((_, index) => values[index] === minimum));
}

function getVisibleReason(meta, posture) {
  if (meta.negative) return null;
  const ordered = posture === "struggling"
    ? ["quick_win", "active_goal", "reliable_category", "weakest_stat"]
    : ["active_goal", "quick_win", "reliable_category", "weakest_stat"];
  for (const key of ordered) {
    if (key === "quick_win" && meta.quickWin) return { key, params: {} };
    if (key === "active_goal" && meta.goalTitle) return { key, params: { goalTitle: meta.goalTitle } };
    if (key === "reliable_category" && meta.reliable) return { key, params: { category: meta.category } };
    if (key === "weakest_stat" && meta.weakest) return { key, params: { category: meta.category } };
  }
  return null;
}

// Deterministische, lexikografische Empfehlung. Es werden bewusst keine
// schwer kalibrierbaren Score-Gewichte persistiert. Bei mehreren Slots wird
// erst nach Ziel-/Verhaltenssignalen eine neue Kategorie bevorzugt.
export function recommendForgeSet(state, proposals, selectableCount) {
  try {
    const seenIds = new Set();
    const list = (Array.isArray(proposals) ? proposals : [])
      .filter((quest) => {
        if (!quest || typeof quest.id !== "string" || !quest.id || seenIds.has(quest.id)) return false;
        seenIds.add(quest.id);
        return true;
      })
      .slice(0, MAX_PROPOSALS);
    const dossier = getDossierSummary(state || {});
    const avoided = new Set(dossier.avoidCategories || []);
    const liked = new Set(dossier.likedCategories || []);
    const reliable = new Set(dossier.reliableCategories || []);
    const negativeTitles = new Set([
      ...(state?.questSignals?.recentDisliked || []),
      ...(state?.questSignals?.recentExpired || []),
    ].map((entry) => normalizeTitle(entry?.title)).filter(Boolean));
    const activeGoals = getActiveGoalTitles(state);
    const weakestStats = getWeakestStats(state);
    const posture = dossier.posture || "neutral";

    const metadata = list.map((quest, index) => {
      const category = CATEGORY_IDS.includes(quest.category) ? quest.category : null;
      const minutes = Number(quest.estimatedMinutes);
      const normalizedMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : Number.POSITIVE_INFINITY;
      const goalTitle = activeGoals.get(normalizeTitle(quest.goalRef)) || null;
      const recentNegative = negativeTitles.has(normalizeTitle(quest.title));
      const isAvoided = Boolean(category && avoided.has(category));
      return {
        quest,
        index,
        category,
        minutes: normalizedMinutes,
        negative: recentNegative || isAvoided,
        quickWin: normalizedMinutes >= 5 && normalizedMinutes <= 15,
        feasible: normalizedMinutes <= 35,
        goalTitle,
        liked: Boolean(category && liked.has(category)),
        reliable: Boolean(category && reliable.has(category)),
        weakest: Boolean(category && weakestStats.has(category)),
      };
    });

    const compare = (left, right, selectedCategories = new Set()) => {
      const booleans = posture === "struggling"
        ? [
          [left.negative, right.negative, false],
          [left.quickWin, right.quickWin, true],
          [Boolean(left.goalTitle), Boolean(right.goalTitle), true],
          [left.liked, right.liked, true],
          [left.reliable, right.reliable, true],
        ]
        : [
          [left.negative, right.negative, false],
          [Boolean(left.goalTitle), Boolean(right.goalTitle), true],
          [left.feasible, right.feasible, true],
          [left.liked, right.liked, true],
          [left.reliable, right.reliable, true],
        ];
      for (const [a, b, preferTrue] of booleans) {
        if (a === b) continue;
        return preferTrue ? (a ? -1 : 1) : (a ? 1 : -1);
      }

      const leftRepeats = Boolean(left.category && selectedCategories.has(left.category));
      const rightRepeats = Boolean(right.category && selectedCategories.has(right.category));
      if (leftRepeats !== rightRepeats) return leftRepeats ? 1 : -1;
      if (left.weakest !== right.weakest) return left.weakest ? -1 : 1;
      if (left.minutes !== right.minutes) return left.minutes - right.minutes;
      return left.index - right.index;
    };

    const recommendationLimit = Math.max(0, Math.min(
      list.length,
      Number.isFinite(Number(selectableCount)) ? Math.floor(Number(selectableCount)) : 0,
    ));
    const remaining = [...metadata];
    const recommended = [];
    const selectedCategories = new Set();
    while (recommended.length < recommendationLimit && remaining.length > 0) {
      remaining.sort((a, b) => compare(a, b, selectedCategories));
      const chosen = remaining.shift();
      recommended.push(chosen);
      if (chosen.category) selectedCategories.add(chosen.category);
    }
    remaining.sort((a, b) => compare(a, b));
    const ordered = [...recommended, ...remaining];
    const reasonsById = {};
    for (const meta of metadata) {
      const reason = getVisibleReason(meta, posture);
      if (reason) reasonsById[meta.quest.id] = reason;
    }

    return {
      orderedIds: ordered.map((meta) => meta.quest.id),
      recommendedIds: recommended.map((meta) => meta.quest.id),
      reasonsById,
    };
  } catch {
    return { orderedIds: [], recommendedIds: [], reasonsById: {} };
  }
}

const acceptResult = (state, acceptedCount, selectableCount, reason, acceptedIds = []) => ({
  state: state || {},
  acceptedCount,
  selectableCount,
  reason,
  acceptedIds,
});

// Die Set-ID und die Kapazität werden innerhalb desselben State-Callbacks
// erneut geprüft. Bei Drift gibt es keinen Teil-Swap.
export function acceptProposals(state, selection, { today = "", nowMs = Date.now() } = {}) {
  let selectableCount = 0;
  try {
    const proposalIds = Array.isArray(selection?.proposalIds) ? selection.proposalIds : [];
    if (proposalIds.length === 0) {
      selectableCount = getSelectableCount(state);
      return acceptResult(state, 0, selectableCount, "empty");
    }
    if (!Array.isArray(state?.quests)) return acceptResult(state, 0, 0, "storage_error");
    selectableCount = getSelectableCount(state);
    if (proposalIds.some((id) => typeof id !== "string" || !id) || new Set(proposalIds).size !== proposalIds.length) {
      return acceptResult(state, 0, selectableCount, "stale_set");
    }
    const uniqueIds = proposalIds;

    const forge = normalizeForgeState(state?.forge);
    const pending = forge.pending;
    if (!pending || typeof selection?.pendingId !== "string" || selection.pendingId !== pending.id) {
      return acceptResult(state, 0, selectableCount, "stale_set");
    }
    if (pending.date !== String(today || "")) {
      return acceptResult(state, 0, selectableCount, "expired");
    }

    const wanted = new Set(uniqueIds);
    const selected = pending.proposals.filter((quest) => quest && wanted.has(quest.id));
    if (selected.length !== uniqueIds.length) return acceptResult(state, 0, selectableCount, "stale_set");
    if (selectableCount < selected.length) return acceptResult(state, 0, selectableCount, "capacity_changed");

    const acceptedAtMs = finiteNumber(nowMs, Date.now());
    const accepted = selected.map((quest) => ({ ...quest, origin: "forge", forgeAcceptedAtMs: acceptedAtMs }));
    const replaced = getSwappedQuests(state.quests, accepted, { mode: "manual" });
    if (!Array.isArray(replaced) || replaced.length !== accepted.length) {
      return acceptResult(state, 0, selectableCount, "storage_error");
    }
    const quests = swapSystemQuests(state.quests, accepted, { mode: "manual" });
    if (!Array.isArray(quests)
      || quests.length !== state.quests.length
      || accepted.some((quest) => quests.filter((stored) => stored?.id === quest.id).length !== 1)) {
      return acceptResult(state, 0, selectableCount, "storage_error");
    }

    let next = { ...state, quests };
    next = recordQuestsSwapped(next, replaced, today);
    next = recordQuestsAssigned(next, accepted, today);
    next = recordUserAction(next, today);
    next = clearPendingSet(next, { nowMs: acceptedAtMs });
    return acceptResult(next, accepted.length, selectableCount, null, accepted.map((quest) => quest.id));
  } catch {
    return acceptResult(state, 0, selectableCount, "storage_error");
  }
}
