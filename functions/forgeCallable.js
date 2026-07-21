const { HttpsError } = require("firebase-functions/v2/https");
const {
  getUniqueWeakestStat,
  sanitizeForgeModelProfile,
  sanitizeGeneratedAIQuests,
  sanitizeQuestStats,
} = require("./aiQuestProfile");
const { generateForgeMessages } = require("./forgePrompts");
const {
  DEFAULT_FORGE_ACTIVE_POLICY,
  getRequestedCountForPolicy,
  resolveForgeActivePolicy,
} = require("./forgePolicy");
const { FORGE_POLICY_VERSION } = require("./forgeQuality");
const { ForgeGenerationError, collectForgeCandidates } = require("./forgeGeneration");
const {
  ForgeLedgerError,
  commitLegacyForgeGeneration,
  commitForgeGeneration: commitLedgerGeneration,
  createLegacyRequestId,
  markForgeGenerationFailed,
  markForgeGenerationReady,
  normalizeRequestId,
  normalizePendingId,
  resolveForgeRequestDay,
  reserveForgeGeneration,
  resolveForgeTier,
  utcDay,
} = require("./forgeLedger");

const PUBLIC_MESSAGES = {
  invalid_request: "Die Schmiede-Anfrage ist ungueltig.",
  invalid_request_id: "Die Schmiede-Anfrage hat keine gueltige Kennung.",
  in_progress: "Diese Schmiedung laeuft bereits.",
  cooldown: "Die Schmiede braucht nach mehreren Fehlern eine kurze Pause.",
  active_request: "Fuer heute existiert bereits eine reservierte Schmiedung.",
  quota_exhausted: "Die kostenlose Schmiedung fuer heute wurde bereits genutzt.",
  empty: "Die Schmiede konnte diesmal keine sichere Quest erzeugen.",
  quality_rejected: "Die erzeugten Quests haben die Qualitaetspruefung nicht bestanden.",
  safety_rejected: "Die erzeugten Quests haben die Sicherheitspruefung nicht bestanden.",
  rate_limited: "Die KI ist kurz ausgelastet. Bitte spaeter erneut versuchen.",
  timeout: "Die Schmiede hat zu lange gebraucht.",
  unavailable: "Die Schmiede ist gerade nicht sicher verfuegbar.",
  provider_unavailable: "Die Quest-Erzeugung ist gerade nicht verfuegbar.",
  reservation_missing: "Die reservierte Schmiedung wurde nicht gefunden.",
  reservation_not_ready: "Die reservierte Schmiedung ist noch nicht bereit.",
};

function classifyError(error) {
  if (error instanceof ForgeGenerationError || error instanceof ForgeLedgerError) {
    return {
      reason: error.reason,
      retryable: Boolean(error.retryable),
      retryAfterMs: Math.max(0, Number(error.retryAfterMs) || 0),
      meta: error.meta || {},
    };
  }
  const code = String(error?.code || "");
  if (code.includes("resource-exhausted")) {
    return { reason: "rate_limited", retryable: true, retryAfterMs: 180000, meta: {} };
  }
  if (code.includes("deadline-exceeded") || code.includes("timeout")) {
    return { reason: "timeout", retryable: true, retryAfterMs: 30000, meta: {} };
  }
  if (code.includes("unavailable")) {
    return { reason: "unavailable", retryable: true, retryAfterMs: 30000, meta: {} };
  }
  if (code.includes("invalid-argument") || code.includes("unauthenticated")) {
    return { reason: "invalid_request", retryable: false, retryAfterMs: 0, meta: {} };
  }
  return { reason: "provider_unavailable", retryable: true, retryAfterMs: 30000, meta: {} };
}
function toPublicGenerationError(typed) {
  const internalReason = String(typed?.reason || "");
  let reason = "provider_unavailable";
  if (internalReason === "invalid_request" || internalReason === "invalid_request_id") {
    reason = "invalid_request";
  } else if (internalReason === "empty" || internalReason === "quality_rejected") {
    reason = "quality_rejected";
  } else if (internalReason === "safety_rejected") {
    reason = "safety_rejected";
  } else if (internalReason === "timeout") {
    reason = "timeout";
  } else if (["rate_limited", "cooldown", "quota_exhausted", "in_progress", "active_request"]
    .includes(internalReason)) {
    reason = "rate_limited";
  }
  const retryable = reason === "invalid_request" ? false : Boolean(typed?.retryable)
    || ["rate_limited", "timeout", "provider_unavailable"].includes(reason);
  return {
    ...typed,
    reason,
    retryable,
    retryAfterMs: retryable ? Math.max(0, Number(typed?.retryAfterMs) || 0) : 0,
  };
}

function finiteCount(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numeric = Math.round(Number(value));
  return Number.isFinite(numeric) ? Math.max(0, Math.min(max, numeric)) : fallback;
}

function safeRejectionCounts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value)
    .filter(([key]) => /^[a-z0-9-]{1,64}$/.test(key))
    .map(([key, count]) => [key, finiteCount(count, 0, 100)]);
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function isLegacyForgeRequest(data) {
  if (!data || typeof data !== "object") return false;
  return data.clientPolicyVersion == null
    && data.requestId == null
    && data.today == null
    && data.timeZone == null;
}

function createFailureResponse(error, {
  activePolicy = DEFAULT_FORGE_ACTIVE_POLICY,
  requestedCount = getRequestedCountForPolicy(activePolicy),
  requestId = null,
  attemptCount = null,
} = {}) {
  const internalError = classifyError(error);
  const typed = toPublicGenerationError(internalError);
  const sourceMeta = typed.meta && typeof typed.meta === "object" ? typed.meta : {};
  const rejections = safeRejectionCounts(sourceMeta.rejectionCounts);
  return {
    ok: false,
    quests: [],
    reason: typed.reason,
    retryable: typed.retryable,
    retryAfterMs: typed.retryAfterMs,
    meta: {
      policyVersion: FORGE_POLICY_VERSION,
      activePolicy,
      requestedCount,
      validCount: 0,
      attemptCount: finiteCount(attemptCount == null ? sourceMeta.attemptCount : attemptCount, 0, 2),
      outcome: "empty",
      ...(requestId ? { requestId } : {}),
      ...(Number.isFinite(Number(sourceMeta.rejectedCandidateCount)) ? {
        rejectedCandidateCount: finiteCount(sourceMeta.rejectedCandidateCount, 0, 100),
      } : {}),
      ...(rejections ? { rejectionCounts: rejections } : {}),
    },
  };
}

function createSuccessResponse(quests, {
  activePolicy = DEFAULT_FORGE_ACTIVE_POLICY,
  requestedCount = getRequestedCountForPolicy(activePolicy),
  requestId,
  generatedMeta = {},
  cached = false,
  extraMeta = {},
} = {}) {
  const safeQuests = Array.isArray(quests) ? quests.slice(0, requestedCount) : [];
  if (safeQuests.length === 0) {
    return createFailureResponse(new ForgeGenerationError("empty"), {
      activePolicy, requestedCount, requestId,
    });
  }
  const rejections = safeRejectionCounts(generatedMeta.rejectionCounts);
  return {
    ok: true,
    quests: safeQuests,
    reason: null,
    retryable: false,
    retryAfterMs: 0,
    meta: {
      ...extraMeta,
      policyVersion: FORGE_POLICY_VERSION,
      activePolicy,
      requestedCount,
      validCount: safeQuests.length,
      attemptCount: finiteCount(generatedMeta.attemptCount, 0, 2),
      outcome: safeQuests.length >= requestedCount ? "complete" : "partial",
      cached: Boolean(cached),
      ...(requestId ? { requestId } : {}),
      ...(Number.isFinite(Number(generatedMeta.rejectedCandidateCount)) ? {
        rejectedCandidateCount: finiteCount(generatedMeta.rejectedCandidateCount, 0, 100),
      } : {}),
      ...(rejections ? { rejectionCounts: rejections } : {}),
    },
  };
}
function httpsCodeFor(reason) {
  if (reason === "invalid_request" || reason === "invalid_request_id") return "invalid-argument";
  if (reason === "quota_exhausted") return "resource-exhausted";
  if (reason === "in_progress" || reason === "active_request") return "aborted";
  if (reason === "empty" || reason === "quality_rejected" || reason === "safety_rejected") return "failed-precondition";
  if (reason === "rate_limited") return "resource-exhausted";
  return "unavailable";
}

function toHttpsError(error, { requestId = null } = {}) {
  const typed = classifyError(error);
  return new HttpsError(
    httpsCodeFor(typed.reason),
    PUBLIC_MESSAGES[typed.reason] || PUBLIC_MESSAGES.unavailable,
    {
      forge: {
        reason: typed.reason,
        retryable: typed.retryable,
        retryAfterMs: typed.retryAfterMs,
        requestId,
        policyVersion: FORGE_POLICY_VERSION,
        ...(typed.meta && Object.keys(typed.meta).length > 0 ? { meta: typed.meta } : {}),
      },
    },
  );
}

function createGenerateForgeHandler({
  admin,
  requireAuth,
  checkAndIncrementRateLimit,
  callGemini,
  parseJSON,
  resolveActivePolicy = resolveForgeActivePolicy,
  now = () => Date.now(),
} = {}) {
  return async function generateForge(request) {
    const uid = requireAuth(request);
    const data = request?.data || {};
    const legacyClient = isLegacyForgeRequest(data);
    const db = admin.firestore();
    let activePolicy = DEFAULT_FORGE_ACTIVE_POLICY;
    try {
      const resolvedPolicy = await resolveActivePolicy(db);
      if (["forge-2.2", "forge-3.0"].includes(resolvedPolicy)) activePolicy = resolvedPolicy;
    } catch {
      activePolicy = DEFAULT_FORGE_ACTIVE_POLICY;
    }
    if (legacyClient) activePolicy = "forge-2.2";
    const requestedCount = getRequestedCountForPolicy(activePolicy);
    const numericLevel = Number(data.level);
    if (!data.stats || typeof data.stats !== "object" || Array.isArray(data.stats)
      || !Number.isFinite(numericLevel) || numericLevel < 1) {
      return createFailureResponse(new ForgeGenerationError("invalid_request", { retryable: false }), {
        activePolicy, requestedCount,
      });
    }

    const nowMs = now();
    let forgeDay;
    try {
      forgeDay = legacyClient
        ? { day: utcDay(nowMs), timeZone: "UTC" }
        : resolveForgeRequestDay({
          today: data.today,
          timeZone: data.timeZone,
          nowMs,
        });
    } catch (error) {
      return createFailureResponse(error, { activePolicy, requestedCount });
    }
    const { day, timeZone } = forgeDay;
    const hasSuppliedRequestId = data.requestId !== undefined && data.requestId !== null;
    const suppliedRequestId = hasSuppliedRequestId ? normalizeRequestId(data.requestId) : null;
    if (hasSuppliedRequestId && !suppliedRequestId) {
      return createFailureResponse(new ForgeLedgerError("invalid_request_id"), {
        activePolicy, requestedCount,
      });
    }

    let tier;
    try {
      tier = await resolveForgeTier(db, uid, nowMs);
    } catch {
      return createFailureResponse(new ForgeLedgerError("unavailable", {
        retryable: true, retryAfterMs: 30000,
      }), { activePolicy, requestedCount });
    }
    const requestId = suppliedRequestId || createLegacyRequestId({ tier, day });

    let reservation;
    try {
      reservation = await reserveForgeGeneration({
        db,
        uid,
        requestId,
        tier,
        activePolicy,
        today: day,
        timeZone,
        nowMs,
      });
    } catch (error) {
      const publicError = error instanceof ForgeLedgerError
        ? error
        : new ForgeLedgerError("unavailable", { retryable: true, retryAfterMs: 30000 });
      return createFailureResponse(publicError, {
        activePolicy, requestedCount, requestId,
      });
    }
    if (reservation.kind === "cached") {
      const cached = reservation.reservation?.response;
      if (!cached || !Array.isArray(cached.quests)
        || cached.quests.length < 1 || cached.quests.length > 6) {
        return createFailureResponse(new ForgeLedgerError("unavailable", {
          retryable: true, retryAfterMs: 30000,
        }), { activePolicy, requestedCount, requestId });
      }
      // A ready reservation is policy-bound. Re-labelling cached 2.2 content as
      // 3.0 would bypass the DNA/quality gates; serving cached 3.0 content after
      // a 2.2 kill-switch would defeat the rollback. Fail closed and let the
      // client surface a retryable technical state instead of mixing policies.
      if (cached.meta?.activePolicy !== activePolicy) {
        return createFailureResponse(new ForgeLedgerError("unavailable", {
          retryable: true,
          retryAfterMs: 30000,
        }), { activePolicy, requestedCount, requestId });
      }

      return createSuccessResponse(cached.quests, {
        activePolicy,
        requestedCount,
        requestId,
        generatedMeta: cached.meta || {},
        cached: true,
        extraMeta: {
          quotaDay: cached.meta?.quotaDay || day,
          tier: cached.meta?.tier || reservation.tier || tier,
          requiresCommit: !legacyClient,
          weakestStat: cached.meta?.weakestStat || null,
          profileMode: "minimized",
        },
      });
    }
    const expectedAttempt = Number(reservation.reservation?.attempts) || null;
    let providerAttemptCount = 0;

    try {
      await checkAndIncrementRateLimit(uid, { failClosed: true });
      const language = data.language === "en" ? "en" : "de";
      const stats = sanitizeQuestStats(data.stats);
      const level = Math.max(1, Math.min(1000, Math.round(numericLevel)));
      const weakestStat = getUniqueWeakestStat(stats);
      const rawProfile = data.forgeProfile || data.profile;
      const modelProfile = sanitizeForgeModelProfile(rawProfile);
      const activeGoalTitles = modelProfile.activeGoals.map((goal) => goal.title);
      const context = {
        language,
        activeGoalTitles,
        recentDislikedTitles: [],
        recentExpiredTitles: [],
      };

      const generated = await collectForgeCandidates({
        callProvider: (messages, options) => {
          providerAttemptCount += 1;
          return callGemini(messages, { ...options, redactErrors: true });
        },
        createMessages: ({ strict, excludeTitles, requestedCount: promptCount }) => generateForgeMessages({
          stats,
          level,
          weakestStat,
          profile: modelProfile,
          language,
          strict,
          excludeTitles,
          requestedCount: promptCount,
          activePolicy,
        }),
        parseResponse: (raw) => parseJSON(raw, { quests: [] }),
        sanitizeCandidates: sanitizeGeneratedAIQuests,
        context,
        maxProviderCalls: 2,
        requestedCount,
        qualityMode: activePolicy,
      });
      const response = createSuccessResponse(generated.quests, {
        activePolicy,
        requestedCount,
        requestId,
        generatedMeta: generated.meta,
        cached: false,
        extraMeta: {
          quotaDay: day,
          tier,
          requiresCommit: !legacyClient,
          weakestStat,
          profileMode: "minimized",
        },
      });
      if (legacyClient) {
        await commitLegacyForgeGeneration({
          db,
          uid,
          requestId,
          response,
          expectedAttempt,
          nowMs: now(),
        });
      } else {
        await markForgeGenerationReady({
          db,
          uid,
          requestId,
          response,
          expectedAttempt,
          nowMs: now(),
        });
      }
      return response;
    } catch (error) {
      const typed = classifyError(error);
      try {
        await markForgeGenerationFailed({
          db,
          uid,
          requestId,
          reason: typed.reason,
          expectedAttempt,
          nowMs: now(),
        });
      } catch {
        return createFailureResponse(new ForgeLedgerError("unavailable", {
          retryable: true, retryAfterMs: 30000,
        }), { activePolicy, requestedCount, requestId, attemptCount: providerAttemptCount });
      }
      return createFailureResponse(error, {
        activePolicy, requestedCount, requestId, attemptCount: providerAttemptCount,
      });
    }
  };
}

function createCommitForgeHandler({ admin, requireAuth, now = () => Date.now() } = {}) {
  return async function commitForge(request) {
    const uid = requireAuth(request);
    const requestId = normalizeRequestId(request?.data?.requestId);
    const pendingId = normalizePendingId(request?.data?.pendingId);
    const timeZone = request?.data?.timeZone;
    if (!requestId) throw toHttpsError(new ForgeLedgerError("invalid_request_id"));
    if (!pendingId || typeof timeZone !== "string") {
      throw toHttpsError(new ForgeLedgerError("invalid_request"), { requestId });
    }
    try {
      const result = await commitLedgerGeneration({
        db: admin.firestore(),
        uid,
        requestId,
        pendingId,
        timeZone,
        nowMs: now(),
      });
      return {
        ok: true,
        meta: {
          requestId,
          policyVersion: FORGE_POLICY_VERSION,
          committed: true,
          alreadyCommitted: result.alreadyCommitted,
          quotaDay: result.reservation.day,
          tier: result.reservation.tier,
          freeCreditConsumed: result.reservation.tier === "free",
        },
      };
    } catch (error) {
      throw toHttpsError(error, { requestId });
    }
  };
}

module.exports = {
  classifyError,
  createCommitForgeHandler,
  createFailureResponse,
  createGenerateForgeHandler,
  createSuccessResponse,
  toHttpsError,
};
