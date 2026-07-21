const assert = require("node:assert/strict");
const {
  ForgeLedgerError,
  commitForgeGeneration,
  cooldownForFailure,
  createLegacyRequestId,
  localDayInTimeZone,
  markForgeGenerationFailed,
  markForgeGenerationReady,
  normalizePendingId,
  normalizeRequestId,
  reserveForgeGeneration,
  resolveForgeRequestDay,
  resolveForgeTier,
} = require("./forgeLedger");

class Snapshot {
  constructor(value) {
    this.value = value;
    this.exists = value !== undefined;
  }
  data() { return this.value; }
}

class Ref {
  constructor(db, collection, id) {
    this.db = db;
    this.key = `${collection}/${id}`;
  }
  async get() {
    if (this.db.failReads || this.db.failReadKeys.has(this.key)) {
      throw new Error("firestore unavailable");
    }
    return new Snapshot(this.db.values.get(this.key));
  }
}

class FakeDb {
  constructor() {
    this.values = new Map();
    this.failReads = false;
    this.failReadKeys = new Set();
  }
  collection(name) {
    return { doc: (id) => new Ref(this, name, id) };
  }
  seed(collection, id, value) {
    this.values.set(`${collection}/${id}`, value);
  }
  async runTransaction(callback) {
    if (this.failReads) throw new Error("firestore unavailable");
    const transaction = {
      get: (ref) => ref.get(),
      set: (ref, value, options = {}) => {
        const current = this.values.get(ref.key) || {};
        this.values.set(ref.key, options.merge ? { ...current, ...value } : value);
      },
    };
    return callback(transaction);
  }
}

const NOW = Date.parse("2026-07-21T12:00:00.000Z");
const TODAY = "2026-07-21";
const TIME_ZONE = "Europe/Berlin";
const requestContext = { today: TODAY, timeZone: TIME_ZONE };
const reserve = (db, options) => reserveForgeGeneration({
  db,
  tier: "free",
  nowMs: NOW,
  ...requestContext,
  ...options,
});
const response = {
  ok: true,
  quests: [{ title: "Q1" }, { title: "Q2" }],
  reason: null,
  retryable: false,
  retryAfterMs: 0,
  meta: { policyVersion: "forge-3.0", requestedCount: 6, validCount: 2, attemptCount: 2, outcome: "partial" },
};

(async () => {
  assert.equal(normalizeRequestId("short"), null);
  assert.equal(normalizeRequestId("request_1234"), "request_1234");
  assert.equal(normalizePendingId("forge_pending_123"), "forge_pending_123");
  assert.equal(normalizePendingId("bad"), null);
  assert.equal(createLegacyRequestId({ tier: "free", day: TODAY }), "legacy_20260721");
  assert.equal(localDayInTimeZone(Date.parse("2026-07-21T22:30:00Z"), TIME_ZONE), "2026-07-22");
  assert.deepEqual(resolveForgeRequestDay({ today: TODAY, timeZone: TIME_ZONE, nowMs: NOW }), {
    day: TODAY,
    timeZone: TIME_ZONE,
  });
  assert.throws(
    () => resolveForgeRequestDay({ today: "2026-07-20", timeZone: TIME_ZONE, nowMs: NOW }),
    (error) => error instanceof ForgeLedgerError && error.reason === "invalid_request",
  );
  assert.throws(
    () => resolveForgeRequestDay({ today: TODAY, timeZone: "Mars/Olympus", nowMs: NOW }),
    (error) => error instanceof ForgeLedgerError && error.reason === "invalid_request",
  );

  assert.equal(cooldownForFailure(1), 0);
  assert.equal(cooldownForFailure(2), 0);
  assert.equal(cooldownForFailure(3), 15 * 60 * 1000);

  const db = new FakeDb();
  db.seed("users", "free-user", { premium: { tier: "free" } });
  db.seed("users", "pro-user", {
    premium: { tier: "hunter_pro", activeUntil: "2099-01-01T00:00:00.000Z" },
  });
  assert.equal(await resolveForgeTier(db, "free-user", NOW), "free");
  assert.equal(await resolveForgeTier(db, "pro-user", NOW), "pro");

  const zoneDb = new FakeDb();
  const zoneFirst = await reserve(zoneDb, {
    uid: "zone-user",
    requestId: "request_zone_1",
  });
  assert.equal(zoneFirst.kind, "reserved");
  await assert.rejects(
    reserve(zoneDb, {
      uid: "zone-user",
      requestId: "request_zone_2",
      nowMs: NOW + 1000,
      timeZone: "Pacific/Kiritimati",
      today: "2026-07-22",
    }),
    (error) => error instanceof ForgeLedgerError && error.reason === "invalid_request",
  );
  const zoneRebound = await reserve(zoneDb, {
    uid: "zone-user",
    requestId: "request_zone_3",
    nowMs: NOW + 24 * 60 * 60 * 1000 + 1,
    timeZone: "Pacific/Kiritimati",
    today: "2026-07-23",
  });
  assert.equal(zoneRebound.kind, "reserved", "time zone can be rebound after the abuse guard expires");

  const first = await reserve(db, { uid: "free-user", requestId: "request_free_1" });
  assert.equal(first.kind, "reserved");
  assert.equal(first.day, TODAY);
  assert.equal(first.reservation.timeZone, TIME_ZONE);
  await markForgeGenerationReady({
    db,
    uid: "free-user",
    requestId: "request_free_1",
    response,
    nowMs: NOW + 1000,
  });

  const cached = await reserve(db, {
    uid: "free-user",
    requestId: "request_free_1",
    nowMs: NOW + 2000,
  });
  assert.equal(cached.kind, "cached");
  assert.deepEqual(cached.reservation.response, response);

  const storageRetry = await reserve(db, {
    uid: "free-user",
    requestId: "request_free_retry",
    nowMs: NOW + 3000,
  });
  assert.equal(storageRetry.kind, "cached");
  assert.equal(storageRetry.reusedReady, true);
  assert.deepEqual(storageRetry.reservation.response, response);
  assert.equal(storageRetry.requestId, "request_free_retry");

  const committed = await commitForgeGeneration({
    db,
    uid: "free-user",
    requestId: "request_free_retry",
    pendingId: "forge_pending_123",
    timeZone: TIME_ZONE,
    nowMs: NOW + 4000,
  });
  assert.equal(committed.alreadyCommitted, false);
  const repeated = await commitForgeGeneration({
    db,
    uid: "free-user",
    requestId: "request_free_retry",
    pendingId: "forge_pending_123",
    timeZone: TIME_ZONE,
    nowMs: NOW + 5000,
  });
  assert.equal(repeated.alreadyCommitted, true);

  await assert.rejects(
    commitForgeGeneration({
      db,
      uid: "free-user",
      requestId: "request_free_retry",
      pendingId: "forge_pending_other",
      timeZone: TIME_ZONE,
      nowMs: NOW + 6000,
    }),
    (error) => error instanceof ForgeLedgerError && error.reason === "invalid_request",
  );
  await assert.rejects(
    commitForgeGeneration({
      db,
      uid: "free-user",
      requestId: "request_free_retry",
      pendingId: "forge_pending_123",
      timeZone: "UTC",
      nowMs: NOW + 6000,
    }),
    (error) => error instanceof ForgeLedgerError && error.reason === "invalid_request",
  );
  await assert.rejects(
    reserve(db, {
      uid: "free-user",
      requestId: "request_free_after_commit",
      nowMs: NOW + 7000,
    }),
    (error) => error instanceof ForgeLedgerError && error.reason === "quota_exhausted",
  );

  const nonTechnicalDb = new FakeDb();
  await reserve(nonTechnicalDb, { uid: "reset-user", requestId: "request_reset_1" });
  const technicalOne = await markForgeGenerationFailed({
    db: nonTechnicalDb,
    uid: "reset-user",
    requestId: "request_reset_1",
    reason: "timeout",
    nowMs: NOW + 1,
  });
  assert.equal(technicalOne.failureCount, 1);
  await reserve(nonTechnicalDb, {
    uid: "reset-user", requestId: "request_reset_2", nowMs: NOW + 2,
  });
  const reset = await markForgeGenerationFailed({
    db: nonTechnicalDb,
    uid: "reset-user",
    requestId: "request_reset_2",
    reason: "quality_rejected",
    nowMs: NOW + 3,
  });
  assert.equal(reset.technical, false);
  assert.equal(reset.failureCount, 0);
  assert.equal(reset.cooldownUntilMs, 0);

  const cooldownDb = new FakeDb();
  for (let index = 1; index <= 3; index += 1) {
    const atMs = NOW + index * 1000;
    await reserve(cooldownDb, {
      uid: "cooldown-user",
      requestId: `request_cooldown_${index}`,
      nowMs: atMs,
    });
    const failed = await markForgeGenerationFailed({
      db: cooldownDb,
      uid: "cooldown-user",
      requestId: `request_cooldown_${index}`,
      reason: index === 2 ? "timeout" : "provider_unavailable",
      nowMs: atMs + 1,
    });
    assert.equal(failed.failureCount, index);
    assert.equal(failed.cooldownUntilMs, index < 3 ? 0 : atMs + 1 + 15 * 60 * 1000);
  }
  await assert.rejects(
    reserve(cooldownDb, {
      uid: "cooldown-user",
      requestId: "request_cooldown_4",
      nowMs: NOW + 4000,
    }),
    (error) => error instanceof ForgeLedgerError
      && error.reason === "cooldown"
      && error.retryAfterMs > 0,
  );
  const afterCooldown = await reserve(cooldownDb, {
    uid: "cooldown-user",
    requestId: "request_cooldown_4",
    nowMs: NOW + 3001 + 15 * 60 * 1000,
  });
  assert.equal(afterCooldown.kind, "reserved");

  const proDb = new FakeDb();
  for (let index = 1; index <= 2; index += 1) {
    await reserve(proDb, {
      uid: "pro-reset",
      tier: "pro",
      requestId: `request_pro_fail_${index}`,
      nowMs: NOW + index,
    });
    await markForgeGenerationFailed({
      db: proDb,
      uid: "pro-reset",
      requestId: `request_pro_fail_${index}`,
      reason: "provider_unavailable",
      nowMs: NOW + index + 10,
    });
  }
  await reserve(proDb, {
    uid: "pro-reset",
    tier: "pro",
    requestId: "request_pro_success",
    nowMs: NOW + 100,
  });
  await markForgeGenerationReady({
    db: proDb,
    uid: "pro-reset",
    requestId: "request_pro_success",
    response,
    nowMs: NOW + 110,
  });
  await commitForgeGeneration({
    db: proDb,
    uid: "pro-reset",
    requestId: "request_pro_success",
    pendingId: "forge_pending_pro",
    timeZone: TIME_ZONE,
    nowMs: NOW + 120,
  });
  await reserve(proDb, {
    uid: "pro-reset",
    tier: "pro",
    requestId: "request_pro_after",
    nowMs: NOW + 130,
  });
  const afterSuccessFailure = await markForgeGenerationFailed({
    db: proDb,
    uid: "pro-reset",
    requestId: "request_pro_after",
    reason: "timeout",
    nowMs: NOW + 140,
  });
  assert.equal(afterSuccessFailure.failureCount, 1, "successful commit resets the technical series");

  const raceDb = new FakeDb();
  const raceFirst = await reserve(raceDb, {
    uid: "race-user",
    requestId: "request_race_1",
    nowMs: NOW,
  });
  const raceSecond = await reserve(raceDb, {
    uid: "race-user",
    requestId: "request_race_1",
    nowMs: NOW + 150001,
  });
  assert.equal(raceSecond.reservation.attempts, 2);
  const staleFailure = await markForgeGenerationFailed({
    db: raceDb,
    uid: "race-user",
    requestId: "request_race_1",
    reason: "timeout",
    expectedAttempt: raceFirst.reservation.attempts,
    nowMs: NOW + 150100,
  });
  assert.equal(staleFailure.superseded, true);

  const failingDb = new FakeDb();
  failingDb.failReads = true;
  await assert.rejects(resolveForgeTier(failingDb, "u", NOW), /firestore unavailable/);

  console.log("testForgeLedger: all assertions passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
