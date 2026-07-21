import assert from "node:assert/strict";
import {
  ANALYTICS_EVENT_SCHEMAS,
  hasAnalyticsSchema,
  sanitizeAnalyticsName,
  sanitizeEventParams,
} from "../services/analyticsPolicy.js";

const sentinels = {
  quest_title: "Sentinel Quest Title",
  goal_name: "Sentinel Goal",
  user_note: "secret note",
  quest_id: "quest-secret-42",
  fingerprint: "semantic-secret",
  content_hash: "deadbeef",
};

assert.equal(sanitizeAnalyticsName("forge_generation"), "forge_generation");
assert.equal(sanitizeAnalyticsName("firebase_secret"), null);
assert.equal(hasAnalyticsSchema("forge_generation"), true);
assert.equal(hasAnalyticsSchema("unknown_event"), false);

assert.deepEqual(sanitizeEventParams("forge_generation", {
  policy_version: "forge-3.0",
  content_source: "manual",
  result_status: "partial",
  valid_count: 2,
  attempt_count: 2,
  latency_bucket: "15_to_30s",
  ...sentinels,
}), {
  policy_version: "forge-3.0",
  content_source: "manual",
  result_status: "partial",
  valid_count: 2,
  attempt_count: 2,
  latency_bucket: "15_to_30s",
});

assert.deepEqual(sanitizeEventParams("forge_accepted", {
  content_source: "made_up_source",
  accepted_count: 2,
  recommendation_unchanged: 1,
  decision_latency_bucket: "2_to_5s",
  title: "must disappear",
}), {
  accepted_count: 2,
  recommendation_unchanged: true,
  decision_latency_bucket: "2_to_5s",
});

assert.deepEqual(sanitizeEventParams("unknown_event", sentinels), {});
assert.equal(Object.keys(ANALYTICS_EVENT_SCHEMAS).length >= 20, true);

console.log("Analytics privacy sentinel tests passed.");
