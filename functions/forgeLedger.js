const crypto = require("node:crypto");
const { FORGE_CANDIDATE_COUNT, FORGE_POLICY_VERSION } = require("./forgeQuality");

const RESERVATION_COLLECTION = "forgeGenerationReservations";
const DAILY_COLLECTION = "forgeGenerationDaily";
const GENERATING_LEASE_MS = 150000;
const USER_QUOTA_COLLECTION = "forgeGenerationUsers";
const TIME_ZONE_BINDING_MS = 24 * 60 * 60 * 1000;
const RESERVATION_TTL_MS = 2 * 86400000;
const MAX_COOLDOWN_MS = 15 * 60 * 1000;

const TECHNICAL_FAILURE_REASONS = new Set([
  "rate_limited", "timeout", "unavailable", "provider_unavailable",
]);
class ForgeLedgerError extends Error {
  constructor(reason, { retryable = false, retryAfterMs = 0 } = {}) {
    super(reason);
    this.name = "ForgeLedgerError";
    this.reason = reason;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

const digest = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

function utcDay(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function normalizeRequestId(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^[A-Za-z0-9_-]{8,96}$/.test(raw)) return null;
  return raw;
}
function normalizePendingId(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]{8,160}$/.test(raw) ? raw : null;
}

function normalizeTimeZone(value) {
  const raw = typeof value === "string" ? value.trim().slice(0, 64) : "";
  if (!raw) return null;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: raw }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function localDayInTimeZone(nowMs, timeZone) {
  const timestamp = Number(nowMs);
  if (!Number.isFinite(timestamp)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year && values.month && values.day
    ? `${values.year}-${values.month}-${values.day}`
    : null;
}

function resolveForgeRequestDay({ today, timeZone, nowMs = Date.now() } = {}) {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const requestedDay = typeof today === "string" ? today.trim() : "";
  const calculatedDay = normalizedTimeZone
    ? localDayInTimeZone(nowMs, normalizedTimeZone)
    : null;
  if (!normalizedTimeZone || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDay)
    || requestedDay !== calculatedDay) {
    throw new ForgeLedgerError("invalid_request", { retryable: false });
  }
  return { day: calculatedDay, timeZone: normalizedTimeZone };
}

function createLegacyRequestId({ tier, day }) {
  return tier === "free" ? `legacy_${day.replace(/-/g, "")}` : `legacy_${crypto.randomUUID()}`;
}

function reservationRef(db, uid, requestId) {
  return db.collection(RESERVATION_COLLECTION).doc(digest(`${uid}|${requestId}`));
}

function dailyRef(db, uid, day) {
  return db.collection(DAILY_COLLECTION).doc(digest(`${uid}|${day}`));
}

function isTechnicalForgeFailure(reason) {
  return TECHNICAL_FAILURE_REASONS.has(String(reason || ""));
}
function userQuotaRef(db, uid) {
  return db.collection(USER_QUOTA_COLLECTION).doc(digest(uid));
}


function cooldownForFailure(failureCount) {
  return Number(failureCount) >= 3 ? MAX_COOLDOWN_MS : 0;
}

async function resolveForgeTier(db, uid, nowMs = Date.now()) {
  // Compatibility source only: current Firestore rules let an owner write the
  // surrounding user document, so this field is not cryptographic entitlement
  // proof. A verified claim/webhook is a separate migration. This release still
  // fails closed on read errors: provider work never starts when tier/quota state
  // cannot be read reliably.
  const snapshot = await db.collection("users").doc(uid).get();
  if (!snapshot.exists) return "free";
  const premium = snapshot.data()?.premium || {};
  const activeUntilMs = Date.parse(premium.activeUntil || "");
  const active = premium.status !== "revoked"
    && premium.tier === "hunter_pro"
    && Number.isFinite(activeUntilMs)
    && activeUntilMs > nowMs;
  return active ? "pro" : "free";
}

async function reserveForgeGeneration({
  db,
  uid,
  requestId,
  tier = "free",
  activePolicy = null,
  today,
  timeZone,
  nowMs = Date.now(),
}) {
  const { day, timeZone: normalizedTimeZone } = resolveForgeRequestDay({ today, timeZone, nowMs });
  const normalizedRequestId = normalizeRequestId(requestId);
  if (!normalizedRequestId) throw new ForgeLedgerError("invalid_request_id");
  const requestRef = reservationRef(db, uid, normalizedRequestId);
  const usageRef = dailyRef(db, uid, day);
  const guardRef = userQuotaRef(db, uid);

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, usageSnapshot, guardSnapshot] = await Promise.all([
      transaction.get(requestRef),
      transaction.get(usageRef),
      transaction.get(guardRef),
    ]);
    const existing = requestSnapshot.exists ? requestSnapshot.data() : null;
    const usage = usageSnapshot.exists ? usageSnapshot.data() : {};
    const guard = guardSnapshot.exists ? guardSnapshot.data() : {};
    const guardedTimeZone = normalizeTimeZone(guard.timeZone);
    const boundAtMs = Math.max(0, Number(guard.boundAtMs || 0));
    const timeZoneBindingMismatch = tier === "free"
      && guardedTimeZone
      && guardedTimeZone !== normalizedTimeZone
      && nowMs - boundAtMs < TIME_ZONE_BINDING_MS;
    const nextBoundAtMs = guardedTimeZone === normalizedTimeZone && boundAtMs > 0
      ? boundAtMs
      : nowMs;
    const bindFreeTimeZone = () => {
      if (tier !== "free") return;
      transaction.set(guardRef, {
        uid, timeZone: normalizedTimeZone, boundAtMs: nextBoundAtMs, updatedAtMs: nowMs,
      }, { merge: true });
    };

    if (existing && existing.uid !== uid) throw new ForgeLedgerError("reservation_mismatch");
    if (existing && (existing.day !== day || existing.timeZone !== normalizedTimeZone)) {
      throw new ForgeLedgerError("invalid_request", { retryable: false });
    }
    if (existing?.status === "committed"
      || (existing?.status === "ready" && (tier !== "free" || !usage.readyRequestId || usage.readyRequestId === normalizedRequestId))) {
      bindFreeTimeZone();
      return {
        kind: "cached",
        day,
        requestId: normalizedRequestId,
        tier: existing.tier || tier,
        reservation: existing,
      };
    }
    if (existing?.status === "generating") {
      const leaseRemaining = Number(existing.leaseUntilMs || 0) - nowMs;
      if (leaseRemaining > 0) {
        throw new ForgeLedgerError("in_progress", { retryable: true, retryAfterMs: leaseRemaining });
      }
    }

    const cooldownRemaining = Number(usage.cooldownUntilMs || 0) - nowMs;
    if (cooldownRemaining > 0) {
      throw new ForgeLedgerError("cooldown", { retryable: true, retryAfterMs: cooldownRemaining });
    }
    if (tier === "free" && usage.committedRequestId && usage.committedRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }
    if (timeZoneBindingMismatch) {
      throw new ForgeLedgerError("invalid_request", { retryable: false });
    }
    if (tier === "free" && usage.readyRequestId && usage.readyRequestId !== normalizedRequestId) {
      const readyRequestId = normalizeRequestId(usage.readyRequestId);
      if (!readyRequestId) {
        throw new ForgeLedgerError("unavailable", { retryable: true, retryAfterMs: 30000 });
      }
      const readySnapshot = await transaction.get(reservationRef(db, uid, readyRequestId));
      const ready = readySnapshot.exists ? readySnapshot.data() : null;
      if (!ready
        || ready.uid !== uid
        || ready.requestId !== readyRequestId
        || ready.status !== "ready"
        || ready.day !== day
        || ready.timeZone !== normalizedTimeZone
        || !Array.isArray(ready.response?.quests)
        || ready.response.quests.length < 1
        || ready.response.quests.length > FORGE_CANDIDATE_COUNT) {
        throw new ForgeLedgerError("unavailable", { retryable: true, retryAfterMs: 30000 });
      }
      if (activePolicy && ready.response?.meta?.activePolicy !== activePolicy) {
        throw new ForgeLedgerError("unavailable", { retryable: true, retryAfterMs: 30000 });
      }
      const alias = {
        ...ready,
        requestId: normalizedRequestId,
        updatedAtMs: nowMs,
        leaseUntilMs: 0,
        expiresAtMs: nowMs + RESERVATION_TTL_MS,
      };
      transaction.set(requestRef, alias, { merge: false });
      transaction.set(usageRef, {
        uid,
        day,
        timeZone: normalizedTimeZone,
        activeRequestId: normalizedRequestId,
        activeLeaseUntilMs: 0,
        readyRequestId: normalizedRequestId,
        readyAtMs: Number(usage.readyAtMs || nowMs),
        updatedAtMs: nowMs,
      }, { merge: true });
      bindFreeTimeZone();
      return {
        kind: "cached",
        day,
        requestId: normalizedRequestId,
        tier: alias.tier || tier,
        reservation: alias,
        reusedReady: true,
      };
    }
    const activeLeaseRemaining = Number(usage.activeLeaseUntilMs || 0) - nowMs;
    if (tier === "free" && usage.activeRequestId && usage.activeRequestId !== normalizedRequestId
      && activeLeaseRemaining > 0) {
      throw new ForgeLedgerError("active_request", { retryable: true, retryAfterMs: activeLeaseRemaining });
    }

    const reservation = {
      uid,
      requestId: normalizedRequestId,
      day,
      timeZone: normalizedTimeZone,
      tier,
      status: "generating",
      policyVersion: FORGE_POLICY_VERSION,
      ...(activePolicy ? { activePolicy } : {}),
      attempts: Math.max(0, Number(existing?.attempts || 0)) + 1,
      createdAtMs: Number(existing?.createdAtMs || nowMs),
      updatedAtMs: nowMs,
      leaseUntilMs: nowMs + GENERATING_LEASE_MS,
      expiresAtMs: nowMs + RESERVATION_TTL_MS,
    };
    transaction.set(requestRef, reservation, { merge: false });
    transaction.set(usageRef, {
      uid,
      day,
      timeZone: normalizedTimeZone,
      activeRequestId: normalizedRequestId,
      activeLeaseUntilMs: reservation.leaseUntilMs,
      failureCount: Math.max(0, Number(usage.failureCount || 0)),
      cooldownUntilMs: Math.max(0, Number(usage.cooldownUntilMs || 0)),
      updatedAtMs: nowMs,
    }, { merge: true });
    bindFreeTimeZone();
    return { kind: "reserved", day, requestId: normalizedRequestId, tier, reservation };
  });
}

// Legacy 2.2 clients cannot issue the explicit post-persistence commit added
// in Forge 3.0. Keep that compatibility exception isolated in one Firestore
// transaction: a valid generated response and the Free daily consumption
// become visible together, while generation/quality/provider failures consume
// nothing. Modern clients never call this path.
async function commitLegacyForgeGeneration({
  db,
  uid,
  requestId,
  response,
  expectedAttempt = null,
  nowMs = Date.now(),
}) {
  const normalizedRequestId = normalizeRequestId(requestId);
  if (!normalizedRequestId) throw new ForgeLedgerError("invalid_request_id");
  const requestRef = reservationRef(db, uid, normalizedRequestId);
  return db.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) throw new ForgeLedgerError("reservation_missing");
    const current = requestSnapshot.data();
    if (current.uid !== uid || current.requestId !== normalizedRequestId) {
      throw new ForgeLedgerError("reservation_mismatch");
    }
    if (Number.isFinite(Number(expectedAttempt)) && Number(expectedAttempt) > 0
      && Number(current.attempts) !== Number(expectedAttempt)) {
      throw new ForgeLedgerError("reservation_superseded", { retryable: true });
    }
    if (current.status === "committed") return current;
    if (current.status !== "generating") {
      throw new ForgeLedgerError("reservation_not_generating");
    }

    const usageRef = dailyRef(db, uid, current.day);
    const usageSnapshot = await transaction.get(usageRef);
    const usage = usageSnapshot.exists ? usageSnapshot.data() : {};
    if (current.tier === "free" && usage.activeRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("reservation_superseded", { retryable: true });
    }
    if (current.tier === "free" && usage.committedRequestId
      && usage.committedRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }
    if (current.tier === "free" && usage.readyRequestId
      && usage.readyRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }

    const pendingId = "legacy_pending_" + normalizedRequestId;
    const committed = {
      ...current,
      status: "committed",
      response,
      pendingId,
      committedAtMs: nowMs,
      updatedAtMs: nowMs,
      leaseUntilMs: 0,
    };
    transaction.set(requestRef, committed, { merge: false });
    transaction.set(usageRef, {
      uid,
      day: current.day,
      timeZone: current.timeZone,
      activeRequestId: normalizedRequestId,
      activeLeaseUntilMs: 0,
      ...(current.tier === "free" ? {
        readyRequestId: normalizedRequestId,
        readyAtMs: nowMs,
        committedRequestId: normalizedRequestId,
        committedAtMs: nowMs,
      } : {}),
      failureCount: 0,
      cooldownUntilMs: 0,
      updatedAtMs: nowMs,
    }, { merge: true });
    return committed;
  });
}

async function markForgeGenerationReady({ db, uid, requestId, response, expectedAttempt = null, nowMs = Date.now() }) {
  const requestRef = reservationRef(db, uid, requestId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists) throw new ForgeLedgerError("reservation_missing");
    const current = snapshot.data();
    if (current.uid !== uid || current.requestId !== requestId) throw new ForgeLedgerError("reservation_mismatch");
    if (Number.isFinite(Number(expectedAttempt)) && Number(expectedAttempt) > 0
      && Number(current.attempts) !== Number(expectedAttempt)) {
      throw new ForgeLedgerError("reservation_superseded", { retryable: true });
    }
    if (current.status === "committed" || current.status === "ready") return current;
    if (current.status !== "generating") throw new ForgeLedgerError("reservation_not_generating");
    const usageRef = dailyRef(db, uid, current.day);
    const usageSnapshot = await transaction.get(usageRef);
    const usage = usageSnapshot.exists ? usageSnapshot.data() : {};
    if (current.tier === "free" && usage.activeRequestId !== requestId) {
      throw new ForgeLedgerError("reservation_superseded", { retryable: true });
    }
    if (current.tier === "free" && usage.readyRequestId && usage.readyRequestId !== requestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }
    const next = {
      ...current,
      status: "ready",
      response,
      updatedAtMs: nowMs,
      leaseUntilMs: 0,
    };
    transaction.set(requestRef, next, { merge: false });
    if (current.tier === "free") {
      transaction.set(usageRef, {
        uid,
        day: current.day,
        activeRequestId: requestId,
        activeLeaseUntilMs: 0,
        readyRequestId: requestId,
        readyAtMs: nowMs,
        updatedAtMs: nowMs,
      }, { merge: true });
    }
    return next;
  });
}

async function markForgeGenerationFailed({ db, uid, requestId, reason, expectedAttempt = null, nowMs = Date.now() }) {
  const requestRef = reservationRef(db, uid, requestId);
  return db.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) return null;
    const current = requestSnapshot.data();
    if (current.uid !== uid || current.requestId !== requestId) throw new ForgeLedgerError("reservation_mismatch");
    if (Number.isFinite(Number(expectedAttempt)) && Number(expectedAttempt) > 0
      && Number(current.attempts) !== Number(expectedAttempt)) {
      return { ignored: true, superseded: true, status: current.status };
    }
    if (current.status !== "generating") {
      return { ignored: true, superseded: false, status: current.status };
    }
    const usageRef = dailyRef(db, uid, current.day);
    const usageSnapshot = await transaction.get(usageRef);
    const usage = usageSnapshot.exists ? usageSnapshot.data() : {};
    if (current.tier === "free" && usage.activeRequestId !== requestId) {
      return { ignored: true, superseded: true, status: current.status };
    }
    const technical = isTechnicalForgeFailure(reason);
    const failureCount = technical ? Math.max(0, Number(usage.failureCount || 0)) + 1 : 0;
    const cooldownMs = cooldownForFailure(failureCount);
    const cooldownUntilMs = cooldownMs > 0 ? nowMs + cooldownMs : 0;
    transaction.set(requestRef, {
      ...current,
      status: "failed",
      failureReason: String(reason || "provider_unavailable").slice(0, 48),
      updatedAtMs: nowMs,
      leaseUntilMs: 0,
      cooldownUntilMs,
    }, { merge: false });
    transaction.set(usageRef, {
      uid,
      day: current.day,
      timeZone: current.timeZone,
      activeRequestId: usage.activeRequestId === requestId ? null : (usage.activeRequestId || null),
      activeLeaseUntilMs: usage.activeRequestId === requestId ? 0 : Math.max(0, Number(usage.activeLeaseUntilMs || 0)),
      failureCount,
      cooldownUntilMs,
      updatedAtMs: nowMs,
    }, { merge: true });
    return { technical, failureCount, cooldownUntilMs };
  });
}

async function commitForgeGeneration({
  db,
  uid,
  requestId,
  pendingId,
  timeZone,
  nowMs = Date.now(),
}) {
  const normalizedRequestId = normalizeRequestId(requestId);
  if (!normalizedRequestId) throw new ForgeLedgerError("invalid_request_id");
  const normalizedPendingId = normalizePendingId(pendingId);
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  if (!normalizedPendingId || !normalizedTimeZone) {
    throw new ForgeLedgerError("invalid_request", { retryable: false });
  }
  const requestRef = reservationRef(db, uid, normalizedRequestId);

  return db.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) throw new ForgeLedgerError("reservation_missing");
    const current = requestSnapshot.data();
    if (current.uid !== uid || current.requestId !== normalizedRequestId) {
      throw new ForgeLedgerError("reservation_mismatch");
    }
    if (current.timeZone !== normalizedTimeZone) {
      throw new ForgeLedgerError("invalid_request", { retryable: false });
    }
    if (current.status === "committed") {
      if (current.pendingId !== normalizedPendingId) {
        throw new ForgeLedgerError("invalid_request", { retryable: false });
      }
      return { alreadyCommitted: true, reservation: current };
    }
    if (current.status !== "ready") {
      throw new ForgeLedgerError("reservation_not_ready", { retryable: true });
    }

    const usageRef = dailyRef(db, uid, current.day);
    const usageSnapshot = await transaction.get(usageRef);
    const usage = usageSnapshot.exists ? usageSnapshot.data() : {};
    if (current.tier === "free" && usage.committedRequestId
      && usage.committedRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }
    if (current.tier === "free" && usage.readyRequestId
      && usage.readyRequestId !== normalizedRequestId) {
      throw new ForgeLedgerError("quota_exhausted");
    }
    const committed = {
      ...current,
      status: "committed",
      pendingId: normalizedPendingId,
      committedAtMs: nowMs,
      updatedAtMs: nowMs,
    };
    transaction.set(requestRef, committed, { merge: false });
    transaction.set(usageRef, {
      uid,
      day: current.day,
      timeZone: current.timeZone,
      activeRequestId: normalizedRequestId,
      activeLeaseUntilMs: 0,
      ...(current.tier === "free" ? {
        readyRequestId: normalizedRequestId,
        committedRequestId: normalizedRequestId,
        committedAtMs: nowMs,
      } : {}),
      failureCount: 0,
      cooldownUntilMs: 0,
      updatedAtMs: nowMs,
    }, { merge: true });
    return { alreadyCommitted: false, reservation: committed };
  });
}

module.exports = {
  ForgeLedgerError,
  commitLegacyForgeGeneration,
  commitForgeGeneration,
  cooldownForFailure,
  isTechnicalForgeFailure,
  createLegacyRequestId,
  markForgeGenerationFailed,
  localDayInTimeZone,
  markForgeGenerationReady,
  normalizeRequestId,
  normalizePendingId,
  normalizeTimeZone,
  resolveForgeRequestDay,
  reserveForgeGeneration,
  resolveForgeTier,
  utcDay,
};
