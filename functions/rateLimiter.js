// rateLimiter.js — Per-user daily rate limiting via Firestore /aiUsage/{userId}

const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

const MAX_DAILY_CALLS = 30;

function todayString() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD in UTC
}

/**
 * Check if the user is within their daily limit, then increment the counter.
 * Throws HttpsError("resource-exhausted") if the limit is reached.
 */
async function checkAndIncrementRateLimit(userId) {
  if (process.env.FUNCTIONS_EMULATOR) {
    console.log("[RateLimiter] Emulator detected, bypassing rate limit.");
    return;
  }

  const db = admin.firestore();
  const ref = db.collection("aiUsage").doc(userId);
  const today = todayString();

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : {};

      // Reset counter on a new day
      const callsToday = data.lastCallDate === today ? (data.callsToday || 0) : 0;

      if (callsToday >= MAX_DAILY_CALLS) {
        throw new HttpsError(
          "resource-exhausted",
          `Tageslimit erreicht (${MAX_DAILY_CALLS} KI-Calls/Tag). Das System erwartet dich morgen wieder, Hunter.`
        );
      }

      tx.set(
        ref,
        {
          callsToday: callsToday + 1,
          lastCallDate: today,
          totalCalls: admin.firestore.FieldValue.increment(1),
        },
        { merge: true }
      );
    });
  } catch (err) {
    // Re-throw HttpsError (rate limit or transaction conflict), wrap others
    if (err.code) throw err; // already an HttpsError
    throw new HttpsError("internal", "Rate-Limiter Fehler.", err.message);
  }
}

module.exports = { checkAndIncrementRateLimit };
