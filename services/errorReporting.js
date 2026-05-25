// Lightweight crash/error reporting: graceful capture + best-effort remote sink.
// No user-facing alerts. Remote logging is throttled, deduped, and production-only.
import { db, auth } from "../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SESSION_LIMIT = 15;
let logged = 0;
const seen = new Set();

// Capacitor plugins that aren't available in every environment reject with these
// messages — they're noise, not bugs, so we never surface or upload them.
const isCapacitorPluginNoise = (msg) =>
  msg.includes("not implemented") ||
  msg.includes("unimplemented") ||
  msg.includes("plugin") ||
  msg.includes("Capacitor") ||
  msg.includes("capacitor") ||
  msg.includes("Health") ||
  msg.includes("Geolocation");

export async function logError(error, context = "window") {
  try {
    const message = String(error?.message || error || "Unknown error").slice(0, 500);
    const stack = String(error?.stack || "").slice(0, 4000);

    // Dedupe identical errors within a session, and always log to console.
    const sig = `${context}:${message}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    console.error(`[SoloToDo:${context}]`, message, error);

    // Cap remote writes per session; skip dev noise; require an authenticated owner.
    if (logged >= SESSION_LIMIT) return;
    if (import.meta.env.DEV) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    logged += 1;
    await addDoc(collection(db, "errorLogs"), {
      uid,
      context,
      message,
      stack,
      url: (typeof location !== "undefined" ? location.href : "").slice(0, 300),
      userAgent: (typeof navigator !== "undefined" ? navigator.userAgent : "").slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch (_) {
    // Error reporting must never throw.
  }
}

export function initErrorReporting() {
  if (typeof window === "undefined") return;
  window.mobileErrors = window.mobileErrors || [];

  window.onerror = function (msg, url, lineNo, _columnNo, error) {
    window.mobileErrors.push(`${msg} @ ${url}:${lineNo}`);
    logError(error || msg, "window.onerror");
    return false;
  };

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    const msg = String(reason?.message || reason || "");
    if (isCapacitorPluginNoise(msg)) {
      console.warn("[SoloToDo] Suppressed Capacitor plugin rejection:", msg);
      event.preventDefault();
      return;
    }
    window.mobileErrors.push(msg);
    logError(reason, "unhandledrejection");
  });
}
