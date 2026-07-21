import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";

const require = createRequire(import.meta.url);
const admin = require("../functions/node_modules/firebase-admin");
const {
  ForgeLedgerError,
  localDayInTimeZone,
  markForgeGenerationReady,
  reserveForgeGeneration,
} = require("../functions/forgeLedger");

const PROJECT_ID = "demo-solo-todo";
const TIME_ZONE = "Europe/Berlin";
const REGION = "europe-west1";

function assertEmulatorEnvironment() {
  assert.match(PROJECT_ID, /^demo-/, "The integration test must use a Firebase demo project.");
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "FIRESTORE_EMULATOR_HOST is required.");
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, "FIREBASE_AUTH_EMULATOR_HOST is required.");
  const environmentProject = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (environmentProject) assert.equal(environmentProject, PROJECT_ID);
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function readyResponse(requestId, day) {
  return {
    ok: true,
    quests: [{
      id: "forge-emulator-candidate",
      title: "Create the emulator QA record",
      category: "int",
      difficulty: "normal",
      desc: "Create a local-only QA record for the Forge ledger. Keep the result inside the Firebase Emulator Suite.",
      doneWhen: "Done when one local emulator QA record has been created.",
      estimatedMinutes: 10,
      questDNA: {
        version: 1,
        actionKind: "produce",
        contextKind: "computer",
        focusMode: "interruptible",
        outcomeKind: "artifact",
        requirements: ["computer"],
      },
      goalRef: null,
      subQuests: [
        { title: "Prepare the local record" },
        { title: "Verify the local record" },
      ],
    }],
    reason: null,
    retryable: false,
    retryAfterMs: 0,
    meta: {
      policyVersion: "forge-3.0",
      requestId,
      requestedCount: 6,
      validCount: 1,
      attemptCount: 1,
      outcome: "partial",
      quotaDay: day,
      tier: "free",
      requiresCommit: true,
    },
  };
}

async function expectCallableFailure(callable, payload, expectedReason) {
  await assert.rejects(
    callable(payload),
    (error) => {
      assert.equal(error.code, "functions/invalid-argument");
      assert.equal(error.details?.forge?.reason, expectedReason);
      return true;
    },
  );
}

assertEmulatorEnvironment();

const adminApp = admin.initializeApp({ projectId: PROJECT_ID }, "forge-emulator-integration");
const db = adminApp.firestore();
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: PROJECT_ID + ".firebaseapp.com",
  projectId: PROJECT_ID,
  appId: "1:1234567890:web:forge-emulator",
}, "forge-emulator-integration");

try {
  const auth = getAuth(clientApp);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const credential = await signInAnonymously(auth);
  const uid = credential.user.uid;
  assert.ok(uid, "The Auth emulator must issue an authenticated user id.");

  const nowMs = Date.now();
  const day = localDayInTimeZone(nowMs, TIME_ZONE);
  assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
  const requestId = "forge_emulator_" + crypto.randomUUID().replaceAll("-", "");
  const pendingId = "forge_pending_" + crypto.randomUUID().replaceAll("-", "");

  const reserved = await reserveForgeGeneration({
    db,
    uid,
    requestId,
    tier: "free",
    today: day,
    timeZone: TIME_ZONE,
    nowMs,
  });
  assert.equal(reserved.kind, "reserved");
  assert.equal(reserved.reservation.status, "generating");

  const ready = await markForgeGenerationReady({
    db,
    uid,
    requestId,
    response: readyResponse(requestId, day),
    expectedAttempt: reserved.reservation.attempts,
    nowMs: nowMs + 1,
  });
  assert.equal(ready.status, "ready");

  const reservationRef = db.collection("forgeGenerationReservations")
    .doc(digest(uid + "|" + requestId));
  const dailyRef = db.collection("forgeGenerationDaily").doc(digest(uid + "|" + day));
  const [readyReservation, readyDaily] = await Promise.all([
    reservationRef.get(),
    dailyRef.get(),
  ]);
  assert.equal(readyReservation.data()?.uid, uid);
  assert.equal(readyReservation.data()?.status, "ready");
  assert.equal(readyDaily.data()?.readyRequestId, requestId);
  assert.equal(readyDaily.data()?.committedRequestId, undefined);

  const functions = getFunctions(clientApp, REGION);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  const commitForgeGeneration = httpsCallable(functions, "commitForgeGeneration");
  const payload = { requestId, pendingId, timeZone: TIME_ZONE };

  const firstCommit = await commitForgeGeneration(payload);
  assert.equal(firstCommit.data?.ok, true);
  assert.equal(firstCommit.data?.meta?.requestId, requestId);
  assert.equal(firstCommit.data?.meta?.alreadyCommitted, false);
  assert.equal(firstCommit.data?.meta?.freeCreditConsumed, true);
  assert.equal(firstCommit.data?.meta?.quotaDay, day);

  const repeatedCommit = await commitForgeGeneration(payload);
  assert.equal(repeatedCommit.data?.ok, true);
  assert.equal(repeatedCommit.data?.meta?.alreadyCommitted, true);

  await expectCallableFailure(commitForgeGeneration, {
    ...payload,
    pendingId: pendingId + "_other",
  }, "invalid_request");
  await expectCallableFailure(commitForgeGeneration, {
    ...payload,
    timeZone: "UTC",
  }, "invalid_request");

  const [committedReservation, committedDaily] = await Promise.all([
    reservationRef.get(),
    dailyRef.get(),
  ]);
  assert.equal(committedReservation.data()?.status, "committed");
  assert.equal(committedReservation.data()?.pendingId, pendingId);
  assert.equal(committedReservation.data()?.timeZone, TIME_ZONE);
  assert.equal(committedDaily.data()?.committedRequestId, requestId);
  assert.equal(committedDaily.data()?.readyRequestId, requestId);
  assert.equal(committedDaily.data()?.failureCount, 0);

  await assert.rejects(
    reserveForgeGeneration({
      db,
      uid,
      requestId: "forge_emulator_second_" + crypto.randomUUID().replaceAll("-", ""),
      tier: "free",
      today: day,
      timeZone: TIME_ZONE,
      nowMs: nowMs + 10,
    }),
    (error) => error instanceof ForgeLedgerError && error.reason === "quota_exhausted",
  );

  console.log("test-forge-emulator: Auth, Firestore transactions, callable commit, idempotency and free daily quota passed");
} finally {
  await Promise.allSettled([
    deleteClientApp(clientApp),
    adminApp.delete(),
  ]);
}
