import { Capacitor } from "@capacitor/core";
import { logEvent as logWebEvent } from "firebase/analytics";
import { analytics as webAnalytics } from "../firebase.js";
import {
  hasAnalyticsSchema,
  sanitizeAnalyticsName,
  sanitizeEventParams,
} from "./analyticsPolicy.js";

const MAX_EVENT_NAME_LENGTH = 40;
const MAX_PARAM_COUNT = 25;
const MAX_STRING_LENGTH = 100;
const VALID_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const RESERVED_PREFIX = /^(firebase_|google_|ga_)/i;

function sanitizeName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > MAX_EVENT_NAME_LENGTH) return null;
  if (!VALID_NAME.test(name) || RESERVED_PREFIX.test(name)) return null;
  return name;
}

function sanitizeScalar(value) {
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function sanitizeAnalyticsParams(params = {}) {
  if (!params || typeof params !== "object" || Array.isArray(params)) return {};

  const sanitized = {};
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (Object.keys(sanitized).length >= MAX_PARAM_COUNT) break;
    const key = sanitizeName(rawKey);
    const value = sanitizeScalar(rawValue);
    if (!key || value === undefined) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function trackEvent(eventName, params = {}) {
  try {
    const name = sanitizeAnalyticsName(eventName);
    if (!name || !hasAnalyticsSchema(name)) return false;

    const sanitizedParams = sanitizeEventParams(name, params);
    if (isNativePlatform()) {
      const { FirebaseAnalytics } = await import("@capacitor-firebase/analytics");
      await FirebaseAnalytics.logEvent({ name, params: sanitizedParams });
      return true;
    }

    if (!webAnalytics) return false;
    logWebEvent(webAnalytics, name, sanitizedParams);
    return true;
  } catch {
    return false;
  }
}
