const MAX_EVENT_NAME_LENGTH = 40;
const MAX_PARAM_COUNT = 25;
const VALID_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const RESERVED_PREFIX = /^(firebase_|google_|ga_)/i;
const FORBIDDEN_PARAM_NAME = /(^|_)(id|ids|title|titles|goal|goals|note|notes|text|message|fingerprint|hash)(_|$)/i;

const enumField = (...values) => ({ type: "enum", values: new Set(values) });
const numberField = { type: "number" };
const booleanField = { type: "boolean" };

const POLICY = enumField("forge-2.2", "forge-3.0");
const SOURCE = enumField("ai", "fallback", "manual", "auto", "reforge", "system", "starter", "replacement", "forge", "widget", "unknown");
const RESULT = enumField(
  "ready", "partial", "no_fit", "complete", "empty", "success", "failed", "unavailable",
  "quality_rejected", "safety_rejected", "rate_limited", "timeout", "provider_unavailable",
  "invalid_request", "storage_error", "capacity_changed", "context_changed",
);
const LOAD = enumField("normal", "elevated", "high", "unknown");
const DURATION = enumField("quick", "standard", "deep", "unknown");
const LATENCY = enumField("under_2s", "2_to_5s", "5_to_15s", "15_to_30s", "30_to_60s", "over_60s", "unknown");
const CATEGORY = enumField("str", "int", "vit", "agi", "cha", "unknown");
const DIFFICULTY = enumField("easy", "normal", "hard", "boss", "unknown");

// Only declared values may reach Firebase. There is deliberately no schema
// field for Quest/Goal IDs, titles, notes, fingerprints, hashes or raw messages.
export const ANALYTICS_EVENT_SCHEMAS = Object.freeze({
  forge_opened: { policy_version: POLICY, content_source: SOURCE, has_pending: booleanField, capacity_count: numberField },
  forge_generation: {
    policy_version: POLICY, content_source: SOURCE, result_status: RESULT, valid_count: numberField,
    recommended_count: numberField, load_band: LOAD, duration_band: DURATION, attempt_count: numberField,
    latency_bucket: LATENCY, retry_recovered: booleanField,
  },
  forge_result_viewed: {
    policy_version: POLICY, result_status: RESULT, valid_count: numberField, recommended_count: numberField,
    load_band: LOAD, duration_band: DURATION, content_source: SOURCE, capacity_count: numberField,
  },
  forge_alternatives_opened: { policy_version: POLICY, valid_count: numberField, recommended_count: numberField, memory_available: booleanField },
  forge_recommendation_changed: { policy_version: POLICY, previous_rank: numberField, next_rank: numberField, duration_band: DURATION },
  forge_accepted: {
    policy_version: POLICY, result_status: RESULT, accepted_count: numberField, recommended_count: numberField,
    load_band: LOAD, duration_band: DURATION, content_source: SOURCE, goal_count: numberField,
    recommendation_unchanged: booleanField, decision_latency_bucket: LATENCY,
  },
  forge_reforge: { policy_version: POLICY, content_source: SOURCE, result_status: RESULT },
  forge_pending_expired: { policy_version: POLICY, content_source: SOURCE, valid_count: numberField },
  quest_started: { origin: SOURCE, start_source: enumField("subquest", "focus"), duration_band: DURATION, same_day: booleanField },
  quest_completed: {
    category: CATEGORY, difficulty: DIFFICULTY, is_system: booleanField, origin: SOURCE,
    same_day: booleanField, started_same_day: booleanField, minutes_since_forge_accept: numberField,
    duration_band: DURATION, streak: numberField, content_source: SOURCE,
  },
  level_up: { level: numberField, previous_level: numberField },
  comeback_return: { days_missed: numberField, previous_streak: numberField },
  regression_started: { previous_streak: numberField, days_missed: numberField },
  system_mark_assigned: { quest_age_days: numberField, mark_count: numberField },
  goal_quest_assigned: { count: numberField, slots: numberField },
  goal_setup_quest_assigned: {},
  day_goal_reached: { streak: numberField },
  system_mark_completed: { category: CATEGORY, difficulty: DIFFICULTY, xp_gain: numberField },
  regression_completed: { restored_streak: numberField },
  meta_quest_goal_created: {},
  milestone_completed_via_quest: { category: CATEGORY },
  dungeon_entered: { rank: enumField("e", "d", "c", "b", "a", "s", "unknown"), floors: numberField, won: booleanField },
  shop_purchase: { cost: numberField, currency: enumField("gold", "gems") },
  memory_action: { policy_version: POLICY, memory_action: enumField("prefer", "neutral", "avoid", "reset") },
});

export function sanitizeAnalyticsName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > MAX_EVENT_NAME_LENGTH) return null;
  if (!VALID_NAME.test(name) || RESERVED_PREFIX.test(name)) return null;
  return name;
}

function sanitizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function sanitizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === 1) return Boolean(value);
  return undefined;
}

function sanitizeSchemaValue(rule, value) {
  if (rule?.type === "number") return sanitizeNumber(value);
  if (rule?.type === "boolean") return sanitizeBoolean(value);
  if (rule?.type === "enum" && typeof value === "string" && rule.values.has(value)) return value;
  return undefined;
}

export function sanitizeEventParams(eventName, params = {}) {
  const schema = ANALYTICS_EVENT_SCHEMAS[eventName];
  if (!schema || !params || typeof params !== "object" || Array.isArray(params)) return {};
  const sanitized = {};
  for (const [key, rule] of Object.entries(schema)) {
    if (Object.keys(sanitized).length >= MAX_PARAM_COUNT) break;
    if (FORBIDDEN_PARAM_NAME.test(key)) continue;
    const value = sanitizeSchemaValue(rule, params[key]);
    if (value !== undefined) sanitized[key] = value;
  }
  return sanitized;
}

export function hasAnalyticsSchema(eventName) {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENT_SCHEMAS, eventName);
}
