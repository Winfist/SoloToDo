const {
  FORGE_CANDIDATE_COUNT,
  FORGE_POLICY_VERSION,
  areNearDuplicateForgeQuests,
  exactGoalTitle,
  normalizeForgeText,
  validateForgeBatch,
  validateForgeCandidate,
  validateLegacyForgeCandidate,
} = require("./forgeQuality");

class ForgeGenerationError extends Error {
  constructor(reason, { retryable = true, retryAfterMs = 0, meta = {} } = {}) {
    super(reason);
    this.name = "ForgeGenerationError";
    this.reason = reason;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
    this.meta = meta;
  }
}

function incrementReasons(target, reasons) {
  for (const reason of reasons || []) target[reason] = (target[reason] || 0) + 1;
}

function canonicalizeCandidate(quest, activeGoalTitles) {
  const canonicalGoal = exactGoalTitle(quest?.goalRef, activeGoalTitles);
  if (!canonicalGoal) {
    const { goalRef, ...rest } = quest;
    return rest;
  }
  return { ...quest, goalRef: canonicalGoal };
}

function selectForgeCandidates(candidates, requestedCount, context = {}) {
  const target = Math.max(1, Math.min(
    FORGE_CANDIDATE_COUNT,
    Math.round(Number(requestedCount) || FORGE_CANDIDATE_COUNT),
  ));
  const selected = [];
  const add = (candidate) => {
    if (!candidate || selected.includes(candidate) || selected.length >= target) return;
    selected.push(candidate);
  };
  const activeGoalTitles = Array.isArray(context.activeGoalTitles) ? context.activeGoalTitles : [];
  const isGoal = (candidate) => exactGoalTitle(candidate?.goalRef, activeGoalTitles);
  const isQuick = (candidate) => {
    const minutes = Number(candidate?.estimatedMinutes);
    return minutes >= 5 && minutes <= 15;
  };
  const isFeasible = (candidate) => {
    const minutes = Number(candidate?.estimatedMinutes);
    return minutes >= 5 && minutes <= 35;
  };

  if (target === 1 && activeGoalTitles.length > 0) {
    add(candidates.find((candidate) => isGoal(candidate) && isQuick(candidate)));
  } else {
    add(candidates.find(isGoal));
  }
  add(candidates.find(isQuick));
  if (target > 1) {
    add(candidates.find((candidate) => isFeasible(candidate) && !selected.includes(candidate)));
  }

  for (const candidate of candidates) {
    add(candidate);
    if (selected.length >= target) break;
  }
  return selected.slice(0, target);
}

async function collectForgeCandidates({
  callProvider,
  createMessages,
  parseResponse,
  sanitizeCandidates,
  context = {},
  maxProviderCalls = 2,
  requestedCount = FORGE_CANDIDATE_COUNT,
  qualityMode = FORGE_POLICY_VERSION,
} = {}) {
  if (typeof callProvider !== "function"
    || typeof createMessages !== "function"
    || typeof parseResponse !== "function"
    || typeof sanitizeCandidates !== "function") {
    throw new ForgeGenerationError("invalid_request", { retryable: false });
  }

  const targetCount = Math.max(1, Math.min(
    FORGE_CANDIDATE_COUNT,
    Math.round(Number(requestedCount) || FORGE_CANDIDATE_COUNT),
  ));
  const callLimit = Math.max(1, Math.min(2, Number(maxProviderCalls) || 2));
  const legacyPolicy = qualityMode === "forge-2.2";
  const pool = [];
  const seenTitles = new Set();
  const rejectionCounts = {};
  let rejectedCandidateCount = 0;
  let attemptCount = 0;
  let sawCandidateCount = 0;

  for (let attempt = 0; attempt < callLimit; attempt += 1) {
    const messages = createMessages({
      strict: attempt > 0,
      excludeTitles: pool.map((quest) => quest.title),
      requestedCount: targetCount,
    });
    attemptCount += 1;
    const raw = await callProvider(messages, { maxAttempts: 1 });
    let candidates;
    try {
      const parsed = parseResponse(raw);
      candidates = sanitizeCandidates(parsed?.quests, { limit: FORGE_CANDIDATE_COUNT });
      if (!Array.isArray(candidates)) throw new TypeError("invalid_candidate_array");
    } catch {
      rejectedCandidateCount += 1;
      incrementReasons(rejectionCounts, ["invalid-provider-response"]);
      continue;
    }
    sawCandidateCount += candidates.length;

    for (const candidate of candidates) {
      const titleKey = normalizeForgeText(candidate?.title);
      if (!titleKey || seenTitles.has(titleKey)) {
        rejectedCandidateCount += 1;
        incrementReasons(rejectionCounts, ["duplicate-titles"]);
        continue;
      }
      const verdict = legacyPolicy
        ? validateLegacyForgeCandidate(candidate, context)
        : validateForgeCandidate(candidate, context);
      if (!verdict.ok) {
        rejectedCandidateCount += 1;
        incrementReasons(rejectionCounts, verdict.reasons);
        continue;
      }
      const canonical = canonicalizeCandidate(candidate, context.activeGoalTitles || []);
      seenTitles.add(titleKey);
      if (!legacyPolicy && pool.some((existing) => areNearDuplicateForgeQuests(existing, canonical))) {
        rejectedCandidateCount += 1;
        incrementReasons(rejectionCounts, ["near-duplicate-quests"]);
        continue;
      }
      pool.push(canonical);
    }

    const interimSelected = selectForgeCandidates(pool, targetCount, context);
    const interimVerdict = legacyPolicy
      ? { ok: true, reasons: [] }
      : validateForgeBatch(interimSelected, {
        ...context,
        expectedCount: interimSelected.length || 1,
      });
    if (interimSelected.length >= targetCount && interimVerdict.ok) break;
    if (attempt < callLimit - 1 && !interimVerdict.ok) {
      incrementReasons(rejectionCounts, interimVerdict.reasons);
    }
  }

  const selected = selectForgeCandidates(pool, targetCount, context);
  const batchVerdict = legacyPolicy
    ? { ok: true, reasons: [] }
    : validateForgeBatch(selected, { ...context, expectedCount: selected.length || 1 });
  if (selected.length > 0 && batchVerdict.ok) {
    const outcome = selected.length >= targetCount ? "complete" : "partial";
    return {
      quests: selected,
      meta: {
        policyVersion: FORGE_POLICY_VERSION,
        requestedCount: targetCount,
        validCount: selected.length,
        attemptCount,
        outcome,
        rejectedCandidateCount,
        rejectionCounts,
      },
    };
  }

  incrementReasons(rejectionCounts, batchVerdict.reasons);
  const safetyRejected = (rejectionCounts["unsafe-content"] || 0)
    + (rejectionCounts["unsafe-tone-or-meta"] || 0) > 0;
  const emptyReason = pool.length === 0 && safetyRejected
    ? "safety_rejected"
    : sawCandidateCount === 0 ? "empty" : "quality_rejected";
  throw new ForgeGenerationError(emptyReason, {
    retryable: true,
    meta: {
      policyVersion: FORGE_POLICY_VERSION,
      requestedCount: targetCount,
      validCount: 0,
      attemptCount,
      outcome: "empty",
      rejectedCandidateCount,
      rejectionCounts,
    },
  });
}

module.exports = {
  ForgeGenerationError,
  collectForgeCandidates,
  selectForgeCandidates,
};
