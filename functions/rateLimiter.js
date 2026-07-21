// rateLimiter.js — Per-user daily rate limiting via Firestore /aiUsage/{userId}

const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

const MAX_DAILY_CALLS = 100; // Conservative limit to stay under Gemini free-tier quota

function todayString() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD in UTC
}

/**
 * Check if the user is within their daily limit, then increment the counter.
 * Throws HttpsError("resource-exhausted") if the limit is reached.
 */
async function checkAndIncrementRateLimit(userId, { failClosed = false } = {}) {
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
    // Re-throw HttpsError (rate limit exceeded), log and ignore all other errors
    // so that Firestore permission issues don't block the AI call.
    if (err instanceof HttpsError) throw err;
    if (failClosed) {
      throw new HttpsError("unavailable", "KI-Nutzung kann gerade nicht sicher reserviert werden.");
    }
    console.warn("[RateLimiter] Fehler beim Rate-Limit-Check (wird ignoriert):", err.message || err);
  }
}

module.exports = { checkAndIncrementRateLimit };
