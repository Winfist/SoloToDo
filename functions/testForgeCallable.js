const assert = require("node:assert/strict");
const { HttpsError } = require("firebase-functions/v2/https");
const {
  createCommitForgeHandler,
  createGenerateForgeHandler,
} = require("./forgeCallable");
const {
  getRequestedCountForPolicy,
  resolveForgeActivePolicy,
} = require("./forgePolicy");

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
    this.failTransactions = false;
    this.failReadKeys = new Set();
  }
  collection(name) {
    return { doc: (id) => new Ref(this, name, id) };
  }
  seed(collection, id, value) {
    this.values.set(`${collection}/${id}`, value);
  }
  async runTransaction(callback) {
    if (this.failReads || this.failTransactions) throw new Error("firestore unavailable");
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
const PUBLIC_REASONS = new Set([
  "quality_rejected",
  "safety_rejected",
  "rate_limited",
  "timeout",
  "provider_unavailable",
  "invalid_request",
]);

function dna(minutes = 20) {
  return {
    version: 1,
    actionKind: "produce",
    contextKind: "computer",
    focusMode: minutes > 35 ? "continuous" : "interruptible",
    outcomeKind: "artifact",
    requirements: ["computer"],
  };
}

function candidate(index, { includeDNA = true, ...overrides } = {}) {
  const topics = ["outline", "route", "meal plan", "desk layout", "message draft", "lesson review"];
  const topic = topics[index % topics.length];
  const minutes = index === 0 ? 10 : 20 + index;
  return {
    title: `Complete ${topic} ${index}`,
    category: ["str", "int", "vit", "agi", "cha"][index % 5],
    difficulty: "normal",
    desc: `Work on the ${topic} for a concrete result. Save the finished ${topic} record for the next action.`,
    doneWhen: `Done when ${minutes} minutes are completed and the ${topic} result is saved.`,
    estimatedMinutes: minutes,
    ...(includeDNA ? { questDNA: dna(minutes) } : {}),
    goalRef: null,
    subQuests: [
      { title: `Prepare the ${topic} material ${index}` },
      { title: `Complete and save the ${topic} result ${index}` },
    ],
    ...overrides,
  };
}

function request(uid, requestId, overrides = {}) {
  return {
    auth: { uid },
    data: {
      requestId,
      today: TODAY,
      timeZone: TIME_ZONE,
      stats: { str: 1, int: 1, vit: 2, agi: 3, cha: 4 },
      level: 7,
      language: "en",
      profile: {
        activeGoals: [],
        activeHabits: [{ title: "Morning walk", category: "vit", frequency: "daily" }],
        learning: {
          preferences: [{ recipeKey: "r1|move|outside|quick", value: "prefer" }],
          patterns: [],
        },
        stats: { str: 1, int: 1, vit: 2, agi: 3, cha: 4 },
        loadBand: "normal",
        allowedCategories: ["str", "int", "vit", "agi", "cha"],
        recentCompletedQuests: [{ id: "private-id", title: "PRIVATE_HISTORY" }],
      },
      ...overrides,
    },
  };
}

function legacyRequest(uid, overrides = {}) {
  return {
    auth: { uid },
    data: {
      stats: { str: 1, int: 1, vit: 2, agi: 3, cha: 4 },
      level: 7,
      language: "en",
      profile: {
        activeGoals: [],
        activeHabits: [{ title: "Morning walk", category: "vit", frequency: "daily" }],
        behaviorSignals: {},
      },
      ...overrides,
    },
  };
}

function assertPublicShape(result) {
  assert.deepEqual(Object.keys(result).sort(), [
    "meta", "ok", "quests", "reason", "retryAfterMs", "retryable",
  ]);
  assert.equal(result.meta.policyVersion, "forge-3.0");
  if (!result.ok) assert(PUBLIC_REASONS.has(result.reason), result.reason);
}

function harness({
  db = new FakeDb(),
  policy = null,
  provider,
  rateLimit = async () => {},
  now = () => NOW,
} = {}) {
  if (policy) db.seed("systemConfig", "questForge", { activePolicy: policy });
  let providerCalls = 0;
  let rateLimitCalls = 0;
  const messages = [];
  const generate = createGenerateForgeHandler({
    admin: { firestore: () => db },
    requireAuth: (value) => {
      if (!value?.auth?.uid) throw new HttpsError("unauthenticated", "auth required");
      return value.auth.uid;
    },
    checkAndIncrementRateLimit: async (uid, options) => {
      rateLimitCalls += 1;
      assert.deepEqual(options, { failClosed: true });
      return rateLimit(uid, options);
    },
    callGemini: async (value, options) => {
      providerCalls += 1;
      messages.push(value);
      assert.deepEqual(options, { maxAttempts: 1, redactErrors: true });
      return provider(value, options, providerCalls);
    },
    parseJSON: JSON.parse,
    now,
  });
  return {
    db,
    generate,
    messages,
    providerCalls: () => providerCalls,
    rateLimitCalls: () => rateLimitCalls,
  };
}

(async () => {
  assert.equal(getRequestedCountForPolicy("forge-2.2"), 3);
  assert.equal(getRequestedCountForPolicy("forge-3.0"), 6);
  const policyDb = new FakeDb();
  policyDb.seed("systemConfig", "questForge", { activePolicy: "forge-2.2" });
  assert.equal(await resolveForgeActivePolicy(policyDb), "forge-2.2");
  policyDb.seed("systemConfig", "questForge", { activePolicy: "invalid" });
  assert.equal(await resolveForgeActivePolicy(policyDb), "forge-3.0");

  const legacyCompat = harness({
    provider: async () => JSON.stringify({
      quests: [0, 1, 2].map((index) => candidate(index, { includeDNA: false })),
    }),
  });
  const legacyCompatFirst = await legacyCompat.generate(legacyRequest("legacy-compat-free"));
  assertPublicShape(legacyCompatFirst);
  assert.equal(legacyCompatFirst.ok, true);
  assert.equal(legacyCompatFirst.quests.length, 3);
  assert.equal(legacyCompatFirst.meta.activePolicy, "forge-2.2");
  assert.equal(legacyCompatFirst.meta.requestedCount, 3);
  assert.equal(legacyCompatFirst.meta.requiresCommit, false);
  assert.equal(legacyCompat.providerCalls(), 1);
  assert.equal(legacyCompat.rateLimitCalls(), 1);
  const legacyFreeDocs = [...legacyCompat.db.values.values()]
    .filter((value) => value?.uid === "legacy-compat-free");
  const legacyFreeReservation = legacyFreeDocs.find((value) => value?.response);
  const legacyFreeDaily = legacyFreeDocs.find((value) => value?.committedRequestId);
  assert.equal(legacyFreeReservation?.status, "committed");
  assert.equal(legacyFreeReservation?.response?.meta?.requiresCommit, false);
  assert.match(legacyFreeReservation?.pendingId || "", /^legacy_pending_/);
  assert.equal(legacyFreeDaily?.committedRequestId, legacyFreeReservation?.requestId);
  assert.equal(legacyFreeDaily?.readyRequestId, legacyFreeReservation?.requestId);

  const legacyCompatRepeated = await legacyCompat.generate(legacyRequest("legacy-compat-free"));
  assertPublicShape(legacyCompatRepeated);
  assert.equal(legacyCompatRepeated.ok, true);
  assert.equal(legacyCompatRepeated.meta.cached, true);
  assert.equal(legacyCompatRepeated.meta.requiresCommit, false);
  assert.equal(legacyCompat.providerCalls(), 1, "legacy Free repetition reuses its atomically committed result");
  assert.equal(legacyCompat.rateLimitCalls(), 1);

  const modernAfterLegacy = await legacyCompat.generate(request(
    "legacy-compat-free",
    "forge_modern_after_legacy",
    { clientPolicyVersion: "forge-3.0" },
  ));
  assertPublicShape(modernAfterLegacy);
  assert.equal(modernAfterLegacy.ok, false);
  assert.equal(modernAfterLegacy.reason, "rate_limited", "legacy atomic commit consumes the Free day");

  const legacyProDb = new FakeDb();
  legacyProDb.seed("users", "legacy-compat-pro", {
    premium: { tier: "hunter_pro", activeUntil: "2099-01-01T00:00:00.000Z" },
  });
  const legacyPro = harness({
    db: legacyProDb,
    provider: async () => JSON.stringify({
      quests: [0, 1, 2].map((index) => candidate(index, { includeDNA: false })),
    }),
  });
  const legacyProFirst = await legacyPro.generate(legacyRequest("legacy-compat-pro"));
  const legacyProSecond = await legacyPro.generate(legacyRequest("legacy-compat-pro"));
  assert.equal(legacyProFirst.ok, true);
  assert.equal(legacyProSecond.ok, true);
  assert.equal(legacyProFirst.meta.activePolicy, "forge-2.2");
  assert.equal(legacyProSecond.meta.requiresCommit, false);
  assert.equal(legacyPro.providerCalls(), 2, "legacy Pro remains able to generate repeatedly");
  assert.equal(legacyPro.rateLimitCalls(), 2);

  const primary = harness({
    provider: async () => JSON.stringify({ quests: [0, 1, 2, 3, 4, 5].map(candidate) }),
  });
  const generated = await primary.generate(request("primary-user", "forge_request_123"));
  assertPublicShape(generated);
  assert.equal(generated.ok, true);
  assert.equal(generated.reason, null);
  assert.equal(generated.quests.length, 6);
  assert.equal(generated.meta.activePolicy, "forge-3.0");
  assert.equal(generated.meta.requestedCount, 6);
  assert.equal(generated.meta.validCount, 6);
  assert.equal(generated.meta.outcome, "complete");
  assert.equal(generated.meta.weakestStat, null);
  assert.equal(primary.providerCalls(), 1);
  assert.equal(primary.rateLimitCalls(), 1);
  assert.equal(typeof primary.messages[0].system, "string");
  assert.equal(typeof primary.messages[0].user, "string");
  assert(primary.messages[0].user.includes("questDNA"));
  assert(primary.messages[0].user.includes("Morning walk"));
  assert(!primary.messages[0].user.includes("PRIVATE_HISTORY"));

  const cached = await primary.generate(request("primary-user", "forge_request_123"));
  assertPublicShape(cached);
  assert.equal(cached.meta.cached, true);
  assert.equal(primary.providerCalls(), 1);
  assert.equal(primary.rateLimitCalls(), 1);

  const storageRetry = await primary.generate(request("primary-user", "forge_request_retry"));
  assertPublicShape(storageRetry);
  assert.equal(storageRetry.ok, true);
  assert.equal(storageRetry.meta.cached, true);
  assert.equal(storageRetry.meta.requestId, "forge_request_retry");
  assert.equal(primary.providerCalls(), 1, "uncommitted storage retry reuses the ready result");
  assert.equal(primary.rateLimitCalls(), 1);

  const commit = createCommitForgeHandler({
    admin: { firestore: () => primary.db },
    requireAuth: (value) => value.auth.uid,
    now: () => NOW + 1000,
  });
  const committed = await commit({
    auth: { uid: "primary-user" },
    data: {
      requestId: "forge_request_retry",
      pendingId: "forge_pending_123",
      timeZone: TIME_ZONE,
    },
  });
  assert.equal(committed.ok, true);
  assert.equal(committed.meta.alreadyCommitted, false);
  const repeated = await commit({
    auth: { uid: "primary-user" },
    data: {
      requestId: "forge_request_retry",
      pendingId: "forge_pending_123",
      timeZone: TIME_ZONE,
    },
  });
  assert.equal(repeated.meta.alreadyCommitted, true);
  await assert.rejects(
    commit({
      auth: { uid: "primary-user" },
      data: {
        requestId: "forge_request_retry",
        pendingId: "forge_pending_other",
        timeZone: TIME_ZONE,
      },
    }),
    (error) => error.details?.forge?.reason === "invalid_request",
  );

  const quota = await primary.generate(request("primary-user", "forge_request_after_commit"));
  assertPublicShape(quota);
  assert.equal(quota.ok, false);
  assert.equal(quota.reason, "rate_limited");

  const invalidId = await primary.generate(request("primary-user", ""));
  assertPublicShape(invalidId);
  assert.equal(invalidId.reason, "invalid_request");
  assert.equal(invalidId.retryable, false);
  const invalidInput = await primary.generate(request("primary-user", "forge_invalid_input", {
    stats: null,
  }));
  assertPublicShape(invalidInput);
  assert.equal(invalidInput.reason, "invalid_request");
  await assert.rejects(
    primary.generate({ data: request("x", "forge_auth_test").data }),
    (error) => String(error.code).includes("unauthenticated"),
  );

  const legacy = harness({
    policy: "forge-2.2",
    provider: async () => JSON.stringify({
      quests: [0, 1, 2].map((index) => candidate(index, { includeDNA: false })),
    }),
  });
  const legacyResult = await legacy.generate(request("legacy-user", "forge_legacy_123"));
  assertPublicShape(legacyResult);
  assert.equal(legacyResult.ok, true);
  assert.equal(legacyResult.quests.length, 3);
  assert.equal(legacyResult.meta.activePolicy, "forge-2.2");
  assert.equal(legacyResult.meta.requestedCount, 3);
  assert.equal(legacyResult.quests[0].questDNA, undefined);
  assert(!legacy.messages[0].user.includes("questDNA"), "2.2 prompt uses the legacy response schema");

  // A ready 2.2 reservation must never be re-labelled and delivered as 3.0
  // after the policy switch. The mismatch fails closed without another model
  // call; a future request/day can then run under the new policy.
  legacy.db.seed("systemConfig", "questForge", { activePolicy: "forge-3.0" });
  const switchedCached = await legacy.generate(request("legacy-user", "forge_legacy_123"));
  assertPublicShape(switchedCached);
  assert.equal(switchedCached.ok, false);
  assert.equal(switchedCached.reason, "provider_unavailable");
  assert.equal(switchedCached.meta.activePolicy, "forge-3.0");
  assert.equal(switchedCached.meta.requestedCount, 6);
  assert.equal(legacy.providerCalls(), 1, "policy mismatch must not re-use or regenerate the cached batch");


  const missingDNA = harness({
    provider: async () => JSON.stringify({
      quests: [0, 1, 2, 3, 4, 5].map((index) => candidate(index, { includeDNA: false })),
    }),
  });
  const missingDNAResult = await missingDNA.generate(request("dna-user", "forge_dna_missing"));
  assertPublicShape(missingDNAResult);
  assert.equal(missingDNAResult.ok, false);
  assert.equal(missingDNAResult.reason, "quality_rejected");
  assert.equal(missingDNAResult.meta.rejectionCounts["invalid-quest-dna"], 12);

  const partial = harness({
    provider: async (_messages, _options, call) => JSON.stringify({
      quests: call === 1 ? [candidate(0), candidate(1)] : [],
    }),
  });
  const partialResult = await partial.generate(request("partial-user", "forge_partial_123"));
  assertPublicShape(partialResult);
  assert.equal(partialResult.ok, true);
  assert.equal(partialResult.quests.length, 2);
  assert.equal(partialResult.meta.outcome, "partial");
  assert.equal(partialResult.meta.attemptCount, 2);
  const partialCached = await partial.generate(request("partial-user", "forge_partial_123"));
  assert.equal(partialCached.ok, true);
  assert.equal(partialCached.quests.length, 2);
  assert.equal(partialCached.meta.cached, true);
  assert.equal(partial.providerCalls(), 2);

  const empty = harness({
    provider: async () => JSON.stringify({ quests: [] }),
  });
  const emptyResult = await empty.generate(request("empty-user", "forge_empty_123"));
  assertPublicShape(emptyResult);
  assert.equal(emptyResult.reason, "quality_rejected");
  assert.equal(emptyResult.meta.outcome, "empty");

  const unsafe = harness({
    provider: async () => JSON.stringify({
      quests: [0, 1, 2, 3, 4, 5].map((index) => candidate(index, {
        title: `Buy crypto stock ${index}`,
        desc: `Buy crypto stock ${index} today. Save the investment position for later.`,
      })),
    }),
  });
  const unsafeResult = await unsafe.generate(request("unsafe-user", "forge_unsafe_123"));
  assertPublicShape(unsafeResult);
  assert.equal(unsafeResult.reason, "safety_rejected");

  const rateLimited = harness({
    provider: async () => {
      throw new Error("provider must not run");
    },
    rateLimit: async () => {
      const error = new Error("RAW_RATE_DETAIL");
      error.code = "functions/resource-exhausted";
      throw error;
    },
  });
  const rateResult = await rateLimited.generate(request("rate-user", "forge_rate_123"));
  assertPublicShape(rateResult);
  assert.equal(rateResult.reason, "rate_limited");
  assert.equal(rateLimited.providerCalls(), 0);

  const providerFailure = harness({
    provider: async () => {
      const error = new Error("RAW_PROVIDER_DETAIL");
      error.code = "functions/unavailable";
      throw error;
    },
  });
  const providerResult = await providerFailure.generate(request("provider-user", "forge_provider_123"));
  assertPublicShape(providerResult);
  assert.equal(providerResult.reason, "provider_unavailable");
  assert.equal(JSON.stringify(providerResult).includes("RAW_PROVIDER_DETAIL"), false);

  const timeout = harness({
    provider: async () => {
      const error = new Error("RAW_TIMEOUT_DETAIL");
      error.code = "functions/deadline-exceeded";
      throw error;
    },
  });
  const timeoutResult = await timeout.generate(request("timeout-user", "forge_timeout_123"));
  assertPublicShape(timeoutResult);
  assert.equal(timeoutResult.reason, "timeout");

  const entitlementDb = new FakeDb();
  entitlementDb.failReadKeys.add("users/entitlement-user");
  const entitlement = harness({
    db: entitlementDb,
    provider: async () => {
      throw new Error("provider must not run");
    },
  });
  const entitlementResult = await entitlement.generate(
    request("entitlement-user", "forge_entitlement_123"),
  );
  assertPublicShape(entitlementResult);
  assert.equal(entitlementResult.reason, "provider_unavailable");
  assert.equal(entitlement.providerCalls(), 0);

  const ledgerDb = new FakeDb();
  ledgerDb.failTransactions = true;
  const ledger = harness({
    db: ledgerDb,
    provider: async () => {
      throw new Error("provider must not run");
    },
  });
  const ledgerResult = await ledger.generate(request("ledger-user", "forge_ledger_123"));
  assertPublicShape(ledgerResult);
  assert.equal(ledgerResult.reason, "provider_unavailable");
  assert.equal(ledger.providerCalls(), 0);

  const configDb = new FakeDb();
  configDb.failReadKeys.add("systemConfig/questForge");
  const configFallback = harness({
    db: configDb,
    provider: async () => JSON.stringify({ quests: [0, 1, 2, 3, 4, 5].map(candidate) }),
  });
  const configResult = await configFallback.generate(request("config-user", "forge_config_123"));
  assert.equal(configResult.ok, true);
  assert.equal(configResult.meta.activePolicy, "forge-3.0");
  assert.equal(configResult.quests.length, 6);

  console.log("testForgeCallable: all assertions passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
