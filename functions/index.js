// index.js — Firebase Cloud Functions: Gemini AI proxy for SoloToDo
// All functions require Firebase Auth. App Check is enforced in production.
// To disable App Check during local development: set enforceAppCheck: false

const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { checkAndIncrementRateLimit } = require("./rateLimiter");
const { callGemini, callGeminiWithImage, parseJSON } = require("./geminiService");
const {
  VERIFY_QUEST_PROMPT,
  EXTRACT_TASKS_PROMPT,
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
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function requireAuth(request) {
  if (!request.auth) {
    if (process.env.FUNCTIONS_EMULATOR) return "emulator_dummy_uid";
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich, Hunter.");
  }
  return request.auth.uid;
}

// ─── Feature A: Quest Photo Verification ─────────────────────────────────────

exports.verifyQuestPhoto = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { imageBase64, questTitle, questDesc, mimeType } = request.data;

  if (!imageBase64 || !questTitle) {
    throw new HttpsError("invalid-argument", "imageBase64 und questTitle sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = VERIFY_QUEST_PROMPT(questTitle, questDesc || "");
  const raw = await callGeminiWithImage(prompt, imageBase64, mimeType || "image/jpeg");

  const result = parseJSON(raw, { verified: false, reason: "Analyse fehlgeschlagen.", confidence: 0 });

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

  if (!imageBase64) {
    throw new HttpsError("invalid-argument", "imageBase64 ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const raw = await callGeminiWithImage(EXTRACT_TASKS_PROMPT, imageBase64, mimeType || "image/jpeg");
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

exports.generateDynamicQuests = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { stats, level, weakestStat, recentQuests } = request.data;

  if (!stats || !level) {
    throw new HttpsError("invalid-argument", "stats und level sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = GENERATE_QUESTS_PROMPT(stats, level, weakestStat, recentQuests);
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

  if (!context || !messageType) {
    throw new HttpsError("invalid-argument", "context und messageType sind erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = SYSTEM_MESSAGE_PROMPT(context, messageType, hunterName);
  const raw = await callGemini(prompt);
  const result = parseJSON(raw, { title: "SYSTEM-MELDUNG", lines: [context] });

  return {
    title: String(result.title || "SYSTEM-MELDUNG"),
    lines: Array.isArray(result.lines) ? result.lines.map(String) : [String(result.lines || context)],
  };
});

// ─── Feature D: Ask Coach ─────────────────────────────────────────────────────

exports.askCoach = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { question, hunterName, stats, level, streak, openQuests } = request.data;

  if (!question) {
    throw new HttpsError("invalid-argument", "question ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = COACH_PROMPT(question, hunterName, stats || {}, level || 1, streak || 0, openQuests || []);
  const response = await callGemini(prompt);

  return { response: response.trim() };
});

// ─── Feature E: Generate Quest Description ────────────────────────────────────

exports.generateQuestDescription = onCall(CALL_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { title, category } = request.data;

  if (!title) {
    throw new HttpsError("invalid-argument", "title ist erforderlich.");
  }

  await checkAndIncrementRateLimit(uid);

  const prompt = QUEST_DESC_PROMPT(title, category || "str");
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
