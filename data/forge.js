// forge.js - persistent Forge state, ranking compatibility and atomic accept.

import { swapSystemQuests, getSwappedQuests, countManualForgeTargets } from "./questSwap.js";
import { getDailySystemQuestCount } from "./questIntensity.js";
import { getDossierSummary } from "./hunterDossier.js";
import { recordQuestsSwapped, recordQuestsAssigned, recordUserAction } from "./signals.js";
import { QUEST_LOADOUT_CAP } from "./questPlanning.js";
import { buildForgeContext, FORGE_COMPILER_VERSION } from "./forgeCompiler.js";

const MAX_PROPOSALS = 3;
const PENDING_SCHEMA_VERSION = 3;
const CATEGORY_IDS = ["str", "int", "vit", "agi", "cha"];
const PENDING_STATUSES = new Set(["ready", "partial", "fallback", "no_fit"]);

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
  // Keep the 2.2 fingerprint stable: migrated pending sets retain their exact
  // existing id, while an id-less legacy set derives the same id as before.
  const fingerprint = [pending?.date || "", generatedAtMs, pending?.source || "", proposalFingerprint].join("|");
  return `forge_${generatedAtMs.toString(36)}_${hashText(fingerprint)}`;
}

function uniqueValidIds(values, allowedIds) {
  if (!Array.isArray(values)) return null;
  const ids = values.filter((id) => typeof id === "string" && id);
  if (ids.length !== values.length || new Set(ids).size !== ids.length) return null;
  if (allowedIds && ids.some((id) => !allowedIds.has(id))) return null;
  return ids;
}

function sanitizeDiagnostics(value) {
  if (!value || typeof value !== "object") return null;
  const rejectionCounts = {};
  for (const [key, count] of Object.entries(value.rejectionCounts || {})) {
    if (/^[a-z0-9_]{1,48}$/.test(key)) rejectionCounts[key] = Math.max(0, Math.floor(finiteNumber(count)));
  }
  return {
    inputCount: Math.floor(finiteNumber(value.inputCount)),
    eligibleCount: Math.floor(finiteNumber(value.eligibleCount)),
    rejectedCount: Math.floor(finiteNumber(value.rejectedCount)),
    generatedCount: Math.floor(finiteNumber(value.generatedCount ?? value.inputCount)),
    validCount: Math.floor(finiteNumber(value.validCount ?? value.eligibleCount)),
    attemptCount: Math.floor(finiteNumber(value.attemptCount)),
    rejectionCounts,
  };
}

function sanitizeReasonsById(value, allowedIds) {
  if (!value || typeof value !== "object") return {};
  const allowedKeys = new Set([
    "goal_continuity",
    "active_goal",
    "quick_win",
    "proven_recipe",
    "reliable_category",
    "weakest_stat",
    "exploration",
  ]);
  const result = {};
  for (const [id, reason] of Object.entries(value)) {
    if (!allowedIds.has(id) || !reason || !allowedKeys.has(reason.key)) continue;
    const params = {};
    if (typeof reason.params?.goalTitle === "string") params.goalTitle = reason.params.goalTitle.slice(0, 140);
    if (CATEGORY_IDS.includes(reason.params?.category)) params.category = reason.params.category;
    result[id] = { key: reason.key, params };
  }
  return result;
}

function inspectPendingSet(pending) {
  if (!pending || typeof pending !== "object") return { pending: null, invalid: false };
  const rawProposals = Array.isArray(pending.proposals) ? pending.proposals : [];
  const isDeclaredV3 = Number(pending.schemaVersion) >= PENDING_SCHEMA_VERSION || pending.kind || pending.composition;
  if (isDeclaredV3 && rawProposals.length > MAX_PROPOSALS) return { pending: null, invalid: true, reason: "too_many_proposals" };
  const proposals = rawProposals.filter(Boolean).slice(0, MAX_PROPOSALS).map((quest) => ({ ...quest, origin: "forge" }));
  const proposalIds = proposals.map((quest) => quest?.id);
  if (proposalIds.some((id) => typeof id !== "string" || !id) || new Set(proposalIds).size !== proposalIds.length) {
    return { pending: null, invalid: true, reason: "invalid_proposal_ids" };
  }

  const generatedAtMs = finiteNumber(pending.generatedAtMs);
  const kind = pending.kind === "notice" ? "notice" : "set";
  const status = PENDING_STATUSES.has(pending.status)
    ? pending.status
    : proposals.length > 0 ? "ready" : "no_fit";
  const quotaCommitStatus = pending.quotaCommitStatus === "pending" ? "pending" : "committed";
  const quotaRequestId = typeof pending.quotaRequestId === "string" ? pending.quotaRequestId.trim().slice(0, 96) : "";
  const quotaTimeZone = typeof pending.quotaTimeZone === "string" ? pending.quotaTimeZone.trim().slice(0, 64) : "";
  if (quotaCommitStatus === "pending"
    && (!/^[A-Za-z0-9_-]{8,96}$/.test(quotaRequestId)
      || !/^[A-Za-z0-9_+./-]{1,64}$/.test(quotaTimeZone))) {
    return { pending: null, invalid: true, reason: "invalid_quota_commit" };
  }
  if (kind === "set" && proposals.length === 0) {
    if (!isDeclaredV3) return { pending: null, invalid: false };
    return { pending: null, invalid: true, reason: "empty_set" };
  }
  if (kind === "notice" && (proposals.length > 0 || status !== "no_fit")) {
    return { pending: null, invalid: true, reason: "invalid_notice" };
  }

  const allowedIds = new Set(proposalIds);
  const rawComposition = pending.composition && typeof pending.composition === "object" ? pending.composition : null;
  const orderedIds = rawComposition ? uniqueValidIds(rawComposition.orderedIds, allowedIds) : [...proposalIds];
  const recommendedIds = rawComposition ? uniqueValidIds(rawComposition.recommendedIds, allowedIds) : [];
  const previewIds = rawComposition ? uniqueValidIds(rawComposition.previewIds, allowedIds) : [...proposalIds];
  if (!orderedIds || !recommendedIds || !previewIds
    || orderedIds.length !== proposalIds.length
    || proposalIds.some((id) => !orderedIds.includes(id))) {
    return { pending: null, invalid: true, reason: "invalid_composition" };
  }
  const compilerVersion = String(rawComposition?.compilerVersion || pending.compilerVersion || "legacy").slice(0, 24);
  const composition = {
    compilerVersion,
    orderedIds,
    recommendedIds,
    previewIds,
    reasonsById: sanitizeReasonsById(rawComposition?.reasonsById, allowedIds),
    contextSignature: String(rawComposition?.contextSignature || pending.contextSignature || "").slice(0, 120),
    targetSignature: String(rawComposition?.targetSignature || "").slice(0, 120),
    selectableCountAtCompile: Math.max(0, Math.min(MAX_PROPOSALS, Math.floor(finiteNumber(rawComposition?.selectableCountAtCompile ?? rawComposition?.setSummary?.capacity)))),
    setSummary: rawComposition?.setSummary && typeof rawComposition.setSummary === "object"
      ? {
        capacity: Math.max(0, Math.min(MAX_PROPOSALS, Math.floor(finiteNumber(rawComposition.setSummary.capacity)))),
        recommendedCount: Math.max(0, Math.min(MAX_PROPOSALS, Math.floor(finiteNumber(rawComposition.setSummary.recommendedCount)))),
        estimatedMinutes: Math.floor(finiteNumber(rawComposition.setSummary.estimatedMinutes)),
        goalCount: Math.floor(finiteNumber(rawComposition.setSummary.goalCount)),
        quickCount: Math.floor(finiteNumber(rawComposition.setSummary.quickCount)),
        exploredCount: Math.floor(finiteNumber(rawComposition.setSummary.exploredCount)),
        loadBand: ["normal", "elevated", "high"].includes(rawComposition.setSummary.loadBand) ? rawComposition.setSummary.loadBand : "normal",
        minuteBudget: Math.floor(finiteNumber(rawComposition.setSummary.minuteBudget)),
      }
      : null,
  };
  const existingId = typeof pending.id === "string" ? pending.id.trim().slice(0, 160) : "";
  const normalized = {
    ...pending,
    schemaVersion: PENDING_SCHEMA_VERSION,
    legacy: !isDeclaredV3,
    kind,
    status,
    qualityPolicyVersion: pending.qualityPolicyVersion === "forge-3.0" || compilerVersion === FORGE_COMPILER_VERSION ? "forge-3.0" : "forge-2.2",
    contentSource: pending.contentSource === "fallback" ? "fallback" : "ai",
    quotaCommitStatus,
    quotaRequestId: quotaCommitStatus === "pending" ? quotaRequestId : "",
    quotaTimeZone: quotaCommitStatus === "pending" ? quotaTimeZone : "",
    proposals,
    composition,
    diagnostics: sanitizeDiagnostics(pending.diagnostics),
    date: String(pending.date || ""),
    generatedAtMs,
    source: ["auto", "reforge"].includes(pending.source) ? pending.source : "manual",
  };
  return { pending: { ...normalized, id: existingId || derivePendingId(normalized) }, invalid: false };
}

function normalizeMarker(marker) {
  if (!marker || typeof marker !== "object") return null;
  return {
    pendingId: typeof marker.pendingId === "string" ? marker.pendingId.slice(0, 160) : "",
    reason: typeof marker.reason === "string" ? marker.reason.slice(0, 48) : "cleared",
    atMs: finiteNumber(marker.atMs),
    schemaVersion: Math.max(1, Math.floor(finiteNumber(marker.schemaVersion, PENDING_SCHEMA_VERSION))),
  };
}

export function createPendingSet(proposals, {
  source = "manual",
  today = "",
  nowMs = Date.now(),
  contentSource = "ai",
  status = null,
  composition = null,
  context = null,
  diagnostics = null,
} = {}) {
  const generatedAtMs = finiteNumber(nowMs, Date.now());
  const list = (Array.isArray(proposals) ? proposals : []).filter(Boolean).slice(0, MAX_PROPOSALS);
  const ids = list.map((quest) => quest?.id).filter((id) => typeof id === "string" && id);
  const resultStatus = PENDING_STATUSES.has(status)
    ? status
    : list.length > 0 ? "ready" : "no_fit";
  const rawComposition = composition || {};
  const pending = {
    schemaVersion: PENDING_SCHEMA_VERSION,
    kind: list.length > 0 ? "set" : "notice",
    status: list.length > 0 ? resultStatus : "no_fit",
    qualityPolicyVersion: context || rawComposition.compilerVersion === FORGE_COMPILER_VERSION ? "forge-3.0" : "forge-2.2",
    contentSource: contentSource === "fallback" ? "fallback" : "ai",
    proposals: list,
    composition: {
      compilerVersion: String(rawComposition.compilerVersion || (context ? FORGE_COMPILER_VERSION : "legacy")),
      orderedIds: rawComposition.orderedIds || ids,
      recommendedIds: rawComposition.recommendedIds || [],
      previewIds: rawComposition.previewIds || ids,
      reasonsById: rawComposition.reasonsById || {},
      contextSignature: rawComposition.contextSignature || context?.signature || "",
      targetSignature: rawComposition.targetSignature || context?.dayLoad?.targetSignature || "",
      selectableCountAtCompile: rawComposition.setSummary?.capacity ?? context?.selectableCount ?? 0,
      setSummary: rawComposition.setSummary || null,
    },
    diagnostics,
    date: String(today || ""),
    generatedAtMs,
    source: ["auto", "reforge"].includes(source) ? source : "manual",
  };
  const inspected = inspectPendingSet(pending);
  if (inspected.pending) return inspected.pending;
  // Keep createPendingSet total and deterministic. Invalid input is returned as
  // an empty notice; normalizeForgeState will quarantine it if persisted.
  const empty = { ...pending, kind: "notice", status: "no_fit", proposals: [], composition: { ...pending.composition, orderedIds: [], recommendedIds: [], previewIds: [], reasonsById: {} } };
  return { ...empty, id: derivePendingId(empty) };
}

export function normalizeForgeState(forge) {
  const raw = forge && typeof forge === "object" ? forge : {};
  const inspected = inspectPendingSet(raw.pending);
  const generatedAtMs = finiteNumber(raw?.pending?.generatedAtMs);
  const updatedAtMs = Math.max(finiteNumber(raw.updatedAtMs), finiteNumber(inspected.pending?.generatedAtMs), generatedAtMs);
  const pendingId = typeof raw?.pending?.id === "string" && raw.pending.id
    ? raw.pending.id.slice(0, 160)
    : raw.pending ? derivePendingId(raw.pending) : "";
  const quarantine = inspected.invalid
    ? { pendingId, reason: "invalid_set", atMs: updatedAtMs, schemaVersion: PENDING_SCHEMA_VERSION }
    : normalizeMarker(raw.quarantine);
  const tombstone = inspected.invalid
    ? { pendingId, reason: "invalid_set", atMs: updatedAtMs, schemaVersion: PENDING_SCHEMA_VERSION }
    : normalizeMarker(raw.tombstone);
  return {
    ...raw,
    pending: inspected.pending,
    updatedAtMs,
    ...(quarantine ? { quarantine } : {}),
    ...(tombstone ? { tombstone } : {}),
  };
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function mergeForgeState(primaryForge, fallbackForge) {
  const primary = normalizeForgeState(primaryForge);
  const fallback = normalizeForgeState(fallbackForge);
  if (primary.updatedAtMs > fallback.updatedAtMs) return primary;
  if (fallback.updatedAtMs > primary.updatedAtMs) return fallback;
  if (!primary.pending || !fallback.pending) {
    const tombstones = [primary, fallback].filter((value) => !value.pending);
    return tombstones.sort((left, right) => stableValue(right).localeCompare(stableValue(left)))[0]
      || { ...DEFAULT_FORGE, updatedAtMs: primary.updatedAtMs };
  }
  const primaryKey = `${primary.pending.id}|${stableValue(primary.pending)}`;
  const fallbackKey = `${fallback.pending.id}|${stableValue(fallback.pending)}`;
  return primaryKey >= fallbackKey ? primary : fallback;
}

export function isPendingSetValid(state, today) {
  const pending = normalizeForgeState(state?.forge).pending;
  return Boolean(pending
    && pending.kind === "set"
    && pending.date === String(today || "")
    && Array.isArray(pending.proposals)
    && pending.proposals.length > 0);
}

export function isPendingResultValid(state, today) {
  const pending = normalizeForgeState(state?.forge).pending;
  return Boolean(pending && pending.date === String(today || "")
    && (pending.kind === "notice" || pending.proposals.length > 0));
}

export function isPendingQuotaCommitted(pending) {
  return pending?.quotaCommitStatus !== "pending";
}

export function clearPendingSet(state, { nowMs = Date.now(), reason = "cleared" } = {}) {
  const forge = normalizeForgeState(state?.forge);
  if (!forge.pending) return { ...(state || {}), forge };
  const atMs = Math.max(forge.updatedAtMs, finiteNumber(nowMs, Date.now()));
  return {
    ...(state || {}),
    forge: {
      ...forge,
      pending: null,
      updatedAtMs: atMs,
      tombstone: { pendingId: forge.pending.id, reason: String(reason || "cleared").slice(0, 48), atMs, schemaVersion: PENDING_SCHEMA_VERSION },
    },
  };
}

function quarantinePendingSet(state, rawPending, { nowMs = Date.now() } = {}) {
  const forge = normalizeForgeState(state?.forge);
  const atMs = Math.max(forge.updatedAtMs, finiteNumber(nowMs, Date.now()));
  const pendingId = typeof rawPending?.id === "string" && rawPending.id
    ? rawPending.id.slice(0, 160)
    : derivePendingId(rawPending || {});
  const marker = { pendingId, reason: "invalid_set", atMs, schemaVersion: PENDING_SCHEMA_VERSION };
  return { ...(state || {}), forge: { ...forge, pending: null, updatedAtMs: atMs, quarantine: marker, tombstone: marker } };
}

export function getSelectableCount(state) {
  try {
    return Math.max(0, Math.min(QUEST_LOADOUT_CAP, getDailySystemQuestCount(state || {}), countManualForgeTargets(state?.quests || [])));
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

// Backward-compatible 2.2 ranker. New 3.0 callers should use
// compileForgeCandidates + composeForgeSet from forgeCompiler.js.
export function recommendForgeSet(state, proposals, selectableCount) {
  try {
    const seenIds = new Set();
    const list = (Array.isArray(proposals) ? proposals : []).filter((quest) => {
      if (!quest || typeof quest.id !== "string" || !quest.id || seenIds.has(quest.id)) return false;
      seenIds.add(quest.id);
      return true;
    }).slice(0, MAX_PROPOSALS);
    const dossier = getDossierSummary(state || {});
    const avoided = new Set(dossier.avoidCategories || []);
    const liked = new Set(dossier.likedCategories || []);
    const reliable = new Set(dossier.reliableCategories || []);
    const negativeTitles = new Set([...(state?.questSignals?.recentDisliked || []), ...(state?.questSignals?.recentExpired || []), ...(state?.questSignals?.recentDeleted || [])]
      .map((entry) => normalizeTitle(entry?.title)).filter(Boolean));
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
        quest, index, category, minutes: normalizedMinutes,
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
        ? [[left.negative, right.negative, false], [left.quickWin, right.quickWin, true], [Boolean(left.goalTitle), Boolean(right.goalTitle), true], [left.liked, right.liked, true], [left.reliable, right.reliable, true]]
        : [[left.negative, right.negative, false], [Boolean(left.goalTitle), Boolean(right.goalTitle), true], [left.feasible, right.feasible, true], [left.liked, right.liked, true], [left.reliable, right.reliable, true]];
      for (const [a, b, preferTrue] of booleans) {
        if (a !== b) return preferTrue ? (a ? -1 : 1) : (a ? 1 : -1);
      }
      const leftRepeats = Boolean(left.category && selectedCategories.has(left.category));
      const rightRepeats = Boolean(right.category && selectedCategories.has(right.category));
      if (leftRepeats !== rightRepeats) return leftRepeats ? 1 : -1;
      if (left.weakest !== right.weakest) return left.weakest ? -1 : 1;
      if (left.minutes !== right.minutes) return left.minutes - right.minutes;
      return left.index - right.index;
    };
    const recommendationLimit = Math.max(0, Math.min(list.length, Number.isFinite(Number(selectableCount)) ? Math.floor(Number(selectableCount)) : 0));
    const remaining = [...metadata];
    const recommended = [];
    const selectedCategories = new Set();
    while (recommended.length < recommendationLimit && remaining.length > 0) {
      remaining.sort((left, right) => compare(left, right, selectedCategories));
      const chosen = remaining.shift();
      recommended.push(chosen);
      if (chosen.category) selectedCategories.add(chosen.category);
    }
    remaining.sort((left, right) => compare(left, right));
    const ordered = [...recommended, ...remaining];
    const reasonsById = {};
    for (const meta of metadata) {
      const reason = getVisibleReason(meta, posture);
      if (reason) reasonsById[meta.quest.id] = reason;
    }
    return { orderedIds: ordered.map((meta) => meta.quest.id), recommendedIds: recommended.map((meta) => meta.quest.id), reasonsById };
  } catch {
    return { orderedIds: [], recommendedIds: [], reasonsById: {} };
  }
}
export function compileLegacyForgeSet(state, candidates, { proposalLimit = MAX_PROPOSALS } = {}) {
  const limit = Math.max(0, Math.min(MAX_PROPOSALS, Math.floor(finiteNumber(proposalLimit, MAX_PROPOSALS))));
  const list = (Array.isArray(candidates) ? candidates : []).filter(Boolean).slice(0, limit);
  const capacity = getSelectableCount(state);
  const ranking = recommendForgeSet(state, list, capacity);
  const byId = new Map(list.map((quest) => [quest?.id, quest]));
  const orderedIds = ranking.orderedIds.filter((id) => byId.has(id));
  const proposals = orderedIds.map((id) => byId.get(id));
  const recommendedIds = ranking.recommendedIds.filter((id) => byId.has(id));
  const recommended = recommendedIds.map((id) => byId.get(id));
  const estimatedMinutes = recommended.reduce((sum, quest) => sum + (Number(quest?.estimatedMinutes) || 0), 0);
  const composition = {
    compilerVersion: "legacy",
    status: proposals.length >= limit && limit > 0 ? "ready" : proposals.length > 0 ? "partial" : "no_fit",
    proposals,
    orderedIds,
    recommendedIds,
    previewIds: orderedIds,
    reasonsById: ranking.reasonsById,
    contextSignature: "",
    targetSignature: "",
    setSummary: {
      capacity,
      recommendedCount: recommended.length,
      estimatedMinutes,
      goalCount: recommended.filter((quest) => Boolean(quest?.goalRef)).length,
      quickCount: recommended.filter((quest) => Number(quest?.estimatedMinutes) >= 5 && Number(quest?.estimatedMinutes) <= 15).length,
      exploredCount: 0,
      loadBand: "normal",
      minuteBudget: 0,
    },
  };
  return {
    context: null,
    compilation: {
      eligible: list,
      diagnostics: { inputCount: list.length, eligibleCount: list.length, rejectedCount: 0, rejectionCounts: {} },
    },
    composition,
  };
}

const acceptResult = (state, acceptedCount, selectableCount, reason, acceptedIds = [], stateChanged = false) => ({
  state: state || {}, acceptedCount, selectableCount, reason, acceptedIds, stateChanged,
});

function isCompiledPending(pending) {
  return pending?.composition?.compilerVersion === FORGE_COMPILER_VERSION;
}

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

    const rawPending = state?.forge?.pending;
    const forge = normalizeForgeState(state?.forge);
    if (rawPending && !forge.pending) {
      const quarantined = quarantinePendingSet(state, rawPending, { nowMs });
      return acceptResult(quarantined, 0, selectableCount, "invalid_set", [], true);
    }
    const pending = forge.pending;
    const compiled = isCompiledPending(pending);
    if (proposalIds.some((id) => typeof id !== "string" || !id) || new Set(proposalIds).size !== proposalIds.length) {
      return acceptResult(state, 0, selectableCount, compiled ? "invalid_set" : "stale_set");
    }
    if (!pending || typeof selection?.pendingId !== "string" || selection.pendingId !== pending.id) {
      return acceptResult(state, 0, selectableCount, "stale_set");
    }
    if (!isPendingQuotaCommitted(pending)) return acceptResult(state, 0, selectableCount, "storage_error");
    if (pending.kind !== "set") return acceptResult(state, 0, selectableCount, "invalid_set");
    if (pending.date !== String(today || "")) return acceptResult(state, 0, selectableCount, "expired");

    const wanted = new Set(proposalIds);
    const selected = pending.proposals.filter((quest) => quest && wanted.has(quest.id));
    if (selected.length !== proposalIds.length) return acceptResult(state, 0, selectableCount, compiled ? "invalid_set" : "stale_set");
    if (compiled) {
      const allowedIds = new Set(pending.composition.orderedIds);
      if (proposalIds.some((id) => !allowedIds.has(id))) return acceptResult(state, 0, selectableCount, "invalid_set");
      if (pending.composition.contextSignature) {
        const currentContext = buildForgeContext(state, { today, nowMs });
        if (currentContext.signature !== pending.composition.contextSignature) {
          return acceptResult(state, 0, selectableCount, "context_changed");
        }
      }
    }
    if (selectableCount < selected.length) return acceptResult(state, 0, selectableCount, "capacity_changed");

    const acceptedAtMs = finiteNumber(nowMs, Date.now());
    let accepted = selected.map((quest) => ({ ...quest, origin: "forge", forgeAcceptedAtMs: acceptedAtMs }));
    const replaced = getSwappedQuests(state.quests, accepted, { mode: "manual" });
    if (!Array.isArray(replaced) || replaced.length !== accepted.length) return acceptResult(state, 0, selectableCount, "storage_error");
    accepted = accepted.map((quest, index) => ({
      ...quest,
      replacedQuestId: replaced[index].id,
    }));
    const quests = swapSystemQuests(state.quests, accepted, { mode: "manual" });
    if (!Array.isArray(quests) || quests.length !== state.quests.length
      || accepted.some((quest) => quests.filter((stored) => stored?.id === quest.id).length !== 1)) {
      return acceptResult(state, 0, selectableCount, "storage_error");
    }
    let next = { ...state, quests };
    next = recordQuestsSwapped(next, replaced, today);
    next = recordQuestsAssigned(next, accepted, today);
    next = recordUserAction(next, today);
    next = clearPendingSet(next, { nowMs: acceptedAtMs, reason: "accepted" });
    return acceptResult(next, accepted.length, selectableCount, null, accepted.map((quest) => quest.id), true);
  } catch {
    return acceptResult(state, 0, selectableCount, "storage_error");
  }
}

export { PENDING_SCHEMA_VERSION as FORGE_PENDING_SCHEMA_VERSION };
