// geminiService.js — Gemini API wrapper using @google/genai SDK

const { GoogleGenAI } = require("@google/genai");
const { HttpsError } = require("firebase-functions/v2/https");

const MODEL = "gemini-2.0-flash";

let _ai = null;
function getAI() {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set.");
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// Strip markdown code fences if Gemini wraps JSON in them
function stripMarkdown(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

// Text-only generation
async function callGemini(prompt) {
  try {
    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return stripMarkdown(response.text);
  } catch (err) {
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      throw new HttpsError("resource-exhausted", "Tageslimit der KI erreicht (429).");
    }
    console.error("Gemini API Error:", err);
    throw new HttpsError("internal", "KI-Backend Fehler.");
  }
}

// Multimodal generation (text + image)
async function callGeminiWithImage(prompt, imageBase64, mimeType = "image/jpeg") {
  try {
    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
    });
    return stripMarkdown(response.text);
  } catch (err) {
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      throw new HttpsError("resource-exhausted", "Tageslimit der KI erreicht (429).");
    }
    console.error("Gemini API Image Error:", err);
    throw new HttpsError("internal", "KI-Backend Bild-Fehler.");
  }
}

// Safe JSON parse with fallback
function parseJSON(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from the text
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
