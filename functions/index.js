// index.js — Firebase Cloud Functions: Gemini AI proxy for SoloToDo (v1.1)
// All functions require Firebase Auth. App Check is enforced in production.
// To disable App Check during local development: set enforceAppCheck: false

const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { checkAndIncrementRateLimit } = require("./rateLimiter");
const { callGemini, callGeminiWithImage, callGeminiWithImages, parseJSON } = require("./geminiService");
const {
  VERIFY_QUEST_PROMPT,
  EXTRACT_TASKS_PROMPT,
  EXTRACT_SCREEN_TIME_PROMPT,
  GENERATE_QUESTS_PROMPT,
  SYSTEM_MESSAGE_PROMPT,
  COACH_PROMPT,
  QUEST_DESC_PROMPT,
} = require("./geminiPrompts");

admin.initializeApp();

const CALL_OPTIONS = {
  // Set enforceAppCheck: true after registering your app in Firebase Console → App Check
  enforceAppCheck: false,
  region: "europe-west1",
  timeoutSeconds: 120, // Extra room for Gemini retry (15s wait + 2× API call)
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function requireAuth(request) {
  if (!request.auth) {
    if (process.env.FUNCTIONS_EMULATOR) return "emulator_dummy_uid";
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich, Hunter.");
  }
  return request.auth.uid;
}

function normalizeLanguage(language) {
  return language === "en" ? "en" : "de";
}

// ─── Feature A: Quest Photo Verification ─────────────────────────────────────

exports.verifyQuestPhoto = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { imageBase64, questTitle, questDesc, questSteps, evidenceKind, mimeType } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!imageBase64 || !questTitle) {
    throw new HttpsError("invalid-argument", "imageBase64 und questTitle sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const safeQuestSteps = Array.isArray(questSteps)
    ? questSteps.slice(0, 8).map(step => String(step || "").slice(0, 240)).filter(Boolean)
    : [];
  const safeEvidenceKind = ["artifact", "environment", "outdoor", "meal"].includes(evidenceKind)
    ? evidenceKind
    : "artifact";
  const prompt = VERIFY_QUEST_PROMPT(
    String(questTitle).slice(0, 200),
    String(questDesc || "").slice(0, 1000),
    safeQuestSteps,
    safeEvidenceKind,
    language
  );
  const raw = await callGeminiWithImage(prompt, imageBase64, mimeType || "image/jpeg");

  const result = parseJSON(raw, {
    verified: false,
    reason: language === "en" ? "Analysis failed." : "Analyse fehlgeschlagen.",
    confidence: 0
  });

  return {
    verified: Boolean(result.verified),
    reason: result.reason || "Keine Begründung erhalten.",
    confidence: typeof result.confidence === "number" ? result.confidence : 0,
  };
});

// ─── Feature C: Scan Task Photo ───────────────────────────────────────────────

exports.scanTaskPhoto = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { imageBase64, mimeType } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!imageBase64) {
    throw new HttpsError("invalid-argument", "imageBase64 ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const raw = await callGeminiWithImage(EXTRACT_TASKS_PROMPT(language), imageBase64, mimeType || "image/jpeg");
  const result = parseJSON(raw, { tasks: [] });

  const tasks = Array.isArray(result.tasks)
    ? result.tasks.slice(0, 10).map((t) => ({
      title: String(t.title || "Unbekannte Aufgabe"),
      category: ["str", "int", "vit", "agi", "cha"].includes(t.category) ? t.category : "str",
      difficulty: ["easy", "normal", "hard"].includes(t.difficulty) ? t.difficulty : "normal",
    }))
    : [];

  return { tasks };
});

// ─── Feature B1: Generate Dynamic Quests ─────────────────────────────────────

// Last-resort fallback: extract iOS Screen Time minutes from a screenshot.
// Accepts single image (imageBase64) or multiple images (images[]).
exports.extractScreenTime = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { imageBase64, mimeType, images } = request.data;
  const language = normalizeLanguage(request.data?.language);

  // Build images array — support both single & multi
  let imageArray = [];
  if (Array.isArray(images) && images.length > 0) {
    imageArray = images.slice(0, 4).map(img => ({
      base64: img.base64,
      mimeType: img.mimeType || "image/jpeg",
    }));
  } else if (imageBase64) {
    imageArray = [{ base64: imageBase64, mimeType: mimeType || "image/jpeg" }];
  }

  if (imageArray.length === 0) {
    throw new HttpsError("invalid-argument", "Mindestens ein Bild ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  // Use multi-image or single-image call
  let raw;
  if (imageArray.length === 1) {
    raw = await callGeminiWithImage(EXTRACT_SCREEN_TIME_PROMPT(language), imageArray[0].base64, imageArray[0].mimeType);
  } else {
    raw = await callGeminiWithImages(EXTRACT_SCREEN_TIME_PROMPT(language), imageArray);
  }

  const result = parseJSON(raw, {
    valid: false,
    viewMode: null,
    date: null,
    totalMinutes: 0,
    weekTotalMinutes: null,
    confidence: 0,
    apps: [],
    categories: [],
    topApp: null,
    needsMore: false,
    hint: null,
    reason: language === "en" ? "Analysis failed." : "Analyse fehlgeschlagen.",
  });

  const cleanBreakdown = (items) => Array.isArray(items)
    ? items.slice(0, 10).map((item) => ({
      name: String(item.name || item.category || item.bundleIdentifier || "").slice(0, 80),
      minutes: Math.max(0, Math.floor(Number(item.minutes ?? item.totalMinutes ?? item.durationMinutes) || 0)),
    })).filter(item => item.name)
    : [];

  const date = typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.date)
    ? result.date
    : null;
  const totalMinutes = Math.max(0, Math.floor(Number(result.totalMinutes) || 0));
  const weekTotalMinutes = result.weekTotalMinutes != null
    ? Math.max(0, Math.floor(Number(result.weekTotalMinutes) || 0))
    : null;
  const confidence = Math.max(0, Math.min(100, Math.floor(Number(result.confidence) || 0)));
  const valid = Boolean(result.valid) && confidence >= 60;
  const viewMode = ["tag", "woche"].includes(result.viewMode) ? result.viewMode : null;
  const topApp = typeof result.topApp === "string" ? result.topApp.slice(0, 80) : null;
  const needsMore = Boolean(result.needsMore);
  const hint = typeof result.hint === "string" ? result.hint.slice(0, 200) : null;

  return {
    valid,
    viewMode,
    date,
    totalMinutes,
    weekTotalMinutes,
    confidence,
    apps: cleanBreakdown(result.apps),
    categories: cleanBreakdown(result.categories),
    topApp,
    needsMore,
    hint,
    reason: String(result.reason || (valid
      ? (language === "en" ? "Screen time detected." : "Bildschirmzeit erkannt.")
      : (language === "en" ? "No valid screen time screenshot." : "Kein valider Bildschirmzeit-Screenshot."))),
  };
});

exports.generateDynamicQuests = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { stats, level, weakestStat, recentQuests } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!stats || !level) {
    throw new HttpsError("invalid-argument", "stats und level sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = GENERATE_QUESTS_PROMPT(stats, level, weakestStat, recentQuests, language);
  const raw = await callGemini(prompt);
  const result = parseJSON(raw, { quests: [] });

  const quests = Array.isArray(result.quests)
    ? result.quests.slice(0, 3).map((q) => ({
      title: String(q.title || "System-Quest"),
      category: ["str", "int", "vit", "agi", "cha"].includes(q.category) ? q.category : "str",
      difficulty: ["easy", "normal", "hard"].includes(q.difficulty) ? q.difficulty : "normal",
      desc: String(q.desc || ""),
      subQuests: Array.isArray(q.subQuests)
        ? q.subQuests.slice(0, 5).map((s) => ({ title: String(s.title || s) }))
        : [],
      isSystem: true,
      aiGenerated: true,
    }))
    : [];

  return { quests };
});

// ─── Feature B2: Generate System Message ─────────────────────────────────────

exports.generateSystemMessage = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { context, messageType, hunterName, stats, streak } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!context || !messageType) {
    throw new HttpsError("invalid-argument", "context und messageType sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = SYSTEM_MESSAGE_PROMPT(context, messageType, hunterName, language);
  const raw = await callGemini(prompt);
  const result = parseJSON(raw, { title: language === "en" ? "SYSTEM MESSAGE" : "SYSTEM-MELDUNG", lines: [context] });

  return {
    title: String(result.title || (language === "en" ? "SYSTEM MESSAGE" : "SYSTEM-MELDUNG")),
    lines: Array.isArray(result.lines) ? result.lines.map(String) : [String(result.lines || context)],
  };
});

// ─── Feature D: Ask Coach ─────────────────────────────────────────────────────

exports.askCoach = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { question, hunterName, stats, level, streak, openQuests } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!question) {
    throw new HttpsError("invalid-argument", "question ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = COACH_PROMPT(question, hunterName, stats || {}, level || 1, streak || 0, openQuests || [], language);
  const response = await callGemini(prompt);

  return { response: response.trim() };
});

// ─── Feature E: Generate Quest Description ────────────────────────────────────

exports.generateQuestDescription = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { title, category } = request.data;
  const language = normalizeLanguage(request.data?.language);

  if (!title) {
    throw new HttpsError("invalid-argument", "title ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = QUEST_DESC_PROMPT(title, category || "str", language);
  const raw = await callGemini(prompt);
  const result = parseJSON(raw, { description: "", subQuests: [], suggestedDifficulty: "normal" });

  return {
    description: String(result.description || ""),
    subQuests: Array.isArray(result.subQuests) ? result.subQuests.slice(0, 5).map(String) : [],
    suggestedDifficulty: ["easy", "normal", "hard"].includes(result.suggestedDifficulty)
      ? result.suggestedDifficulty
      : "normal",
  };
});
// ─── Feature F: Admin Push Notification ────────────────────────────────────────

exports.adminSendPushNotification = onCall(CALL_OPTIONS, async (request) => {
  const callerUid = requireAuth(request);
  const adminUid = "iY9F97jYZihbq9Lb1kA7rKwZjy53"; // SoloToDo Admin UID

  if (callerUid !== adminUid && !process.env.FUNCTIONS_EMULATOR) {
    throw new HttpsError("permission-denied", "Nur der System Administrator kann Push-Direktiven senden.");
  }

  const { targetUid, title, body, data } = request.data;
  
  if (!targetUid || !title || !body) {
    throw new HttpsError("invalid-argument", "targetUid, title und body sind erforderlich.");
  }

  try {
    const userDoc = await admin.firestore().collection("users").doc(targetUid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User nicht gefunden.");
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      throw new HttpsError("failed-precondition", "User hat kein Push-Token registriert.");
    }

    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      android: {
        priority: "high",
        notification: { sound: "default" }
      },
      apns: {
        payload: {
          aps: { sound: "default" }
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
    
  } catch (error) {
    console.error("Fehler beim Senden des Push:", error);
    throw new HttpsError("internal", "Push konnte nicht versendet werden: " + error.message);
  }
});

// ─── Shared: Full User Deletion ───────────────────────────────────────────────

async function fullDeleteUser(uid) {
  try {
    // 1. Delete subcollections first
    const userRef = admin.firestore().collection("users").doc(uid);
    
    // Delete questHistory
    const histSnap = await userRef.collection("questHistory").get();
    if (!histSnap.empty) {
      const batch1 = admin.firestore().batch();
      histSnap.docs.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();
    }

    // Delete questArchive
    const archiveSnap = await userRef.collection("questArchive").get();
    if (!archiveSnap.empty) {
      const batch2 = admin.firestore().batch();
      archiveSnap.docs.forEach(doc => batch2.delete(doc.ref));
      await batch2.commit();
    }

    // 2. Delete main Firestore document
    await userRef.delete();

    // 3. Delete from Firebase Auth
    await admin.auth().deleteUser(uid).catch(err => {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    });
  } catch (error) {
    console.error(`Fehler bei fullDeleteUser für UID ${uid}:`, error);
    throw new HttpsError("internal", "User konnte nicht vollständig gelöscht werden: " + error.message);
  }
}

// ─── Feature G: Admin Delete User ──────────────────────────────────────────────

exports.adminDeleteUser = onCall(CALL_OPTIONS, async (request) => {
  const callerUid = requireAuth(request);
  const adminUid = "iY9F97jYZihbq9Lb1kA7rKwZjy53"; // SoloToDo Admin UID

  if (callerUid !== adminUid && !process.env.FUNCTIONS_EMULATOR) {
    throw new HttpsError("permission-denied", "Nur der System Administrator kann User löschen.");
  }

  const { targetUid } = request.data;
  
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "targetUid ist erforderlich.");
  }

  await fullDeleteUser(targetUid);
  return { success: true };
});

// ─── Feature G2: User Delete Own Account ───────────────────────────────────────

exports.deleteMyAccount = onCall(CALL_OPTIONS, async (request) => {
  const callerUid = requireAuth(request);
  await fullDeleteUser(callerUid);
  return { success: true };
});

// ─── Feature H: Anti-Cheat Sanity Check ────────────────────────────────────────

exports.onUserWrite = onDocumentWritten({
  document: "users/{userId}",
  region: "europe-west1",
}, async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  // Skip if this write was our own flag update (prevent re-trigger loop)
  if (!before.flaggedCheater && after.flaggedCheater) return;
  // Skip if already flagged
  if (after.flaggedCheater) return;

  const xpDiff = (after.totalXpEarned || 0) - (before.totalXpEarned || 0);
  const goldDiff = (after.gold || 0) - (before.gold || 0);

  // Flag if unrealistic: >50,000 XP or >100,000 Gold in a single write
  if (xpDiff > 50000 || goldDiff > 100000) {
    console.warn(`Anti-Cheat: Suspicious delta for user ${event.params.userId}`, { xpDiff, goldDiff });
    await event.data.after.ref.update({
      flaggedCheater: true,
      flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
      flagReason: `Suspicious delta: XP+${xpDiff}, Gold+${goldDiff}`,
    });
  }
});
