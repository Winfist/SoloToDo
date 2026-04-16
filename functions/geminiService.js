// geminiService.js — Google AI SDK wrapper for SoloToDo (v2.0)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HttpsError } = require("firebase-functions/v2/https");

const MODEL_NAME = "gemini-2.0-flash";

let _model = null;

function getModel() {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    console.log(`[GeminiService] Initializing Google AI SDK: Model=${MODEL_NAME}`);
    const client = new GoogleGenerativeAI(apiKey);
    _model = client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });
  }
  return _model;
}

// Strip markdown code fences if Gemini wraps JSON in them
function stripMarkdown(text) {
  if (!text) return "";
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function is429(err) {
  return err?.status === 429 || (err?.message && err.message.includes("429"));
}

/**
 * Text-only generation (retries once after 15s on transient 429)
 */
async function callGemini(prompt) {
  const model = getModel();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return stripMarkdown(result.response.text());
    } catch (err) {
      if (is429(err) && attempt === 0) {
        console.warn("[GeminiService] 429 RPM limit — retry in 15s…");
        await sleep(15000);
        continue;
      }
      console.error("Gemini Text Error [Full]:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      if (is429(err)) {
        throw new HttpsError("resource-exhausted", "KI-Fehler: Kurzes Rate Limit. Bitte in 2-3 Minuten erneut versuchen.");
      }
      const errorDetails = err.message || JSON.stringify(err);
      throw new HttpsError("unknown", `KI-Fehler: ${errorDetails}`);
    }
  }
}

/**
 * Multimodal generation (text + image, retries once after 15s on transient 429)
 */
async function callGeminiWithImage(prompt, imageBase64, mimeType = "image/jpeg") {
  const model = getModel();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType, data: imageBase64 } },
      ]);
      return stripMarkdown(result.response.text());
    } catch (err) {
      if (is429(err) && attempt === 0) {
        console.warn("[GeminiService] 429 RPM limit (image) — retry in 15s…");
        await sleep(15000);
        continue;
      }
      console.error("Gemini Vision Error [Full]:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      if (is429(err)) {
        throw new HttpsError("resource-exhausted", "KI-Bild-Fehler: Kurzes Rate Limit. Bitte in 2-3 Minuten erneut versuchen.");
      }
      const errorDetails = err.message || JSON.stringify(err);
      throw new HttpsError("unknown", `KI-Bild-Fehler: ${errorDetails}`);
    }
  }
}

/**
 * Safe JSON parse with fallback
 */
function parseJSON(text, fallback = null) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

module.exports = { callGemini, callGeminiWithImage, parseJSON };
