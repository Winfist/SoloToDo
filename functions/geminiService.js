// geminiService.js — OpenRouter wrapper for SoloToDo (v3.0)
const { HttpsError } = require("firebase-functions/v2/https");

// Prioritaetenliste deutsch-tauglicher Gratis-Modelle. OpenRouter probiert sie
// der Reihe nach ("models"-Fallback-Routing); "openrouter/free" ist die letzte
// Stufe (Blind-Routing). Bei der Umsetzung gegen den aktuellen Katalog pruefen:
// https://openrouter.ai/models?max_price=0 - IDs aendern sich gelegentlich.
const MODEL_CANDIDATES = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "openrouter/free",
];
const MODEL_NAME = MODEL_CANDIDATES[0];

// Strip markdown code fences if response wraps JSON in them
function stripMarkdown(text) {
  if (!text) return "";
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function is429(status, errorData) {
  return status === 429 || (errorData && JSON.stringify(errorData).includes("429"));
}

/**
 * Base fetch function to OpenRouter
 */
async function callOpenRouter(messages, { maxAttempts = 2, redactErrors = false, timeoutMs = 45000 } = {}) {
  const safeTimeoutMs = Math.max(100, Math.min(90000, Number(timeoutMs) || 45000));
  const safeAttempts = Math.max(1, Math.min(2, Number(maxAttempts) || 1));
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY; // Fallback so .env renaming isn't strictly required
  if (!apiKey) {
    if (redactErrors) {
      throw new HttpsError("unavailable", "Quest-Erzeugung ist nicht verfuegbar.");
    }
    throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  }

  for (let attempt = 0; attempt < safeAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), safeTimeoutMs);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://solo-todo.web.app", // Important for OpenRouter
          "X-Title": "SoloToDo",
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL_NAME,
          models: MODEL_CANDIDATES,
          messages: messages,
          temperature: 0.7,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (is429(response.status, data) && attempt < safeAttempts - 1) {
          console.warn("[OpenRouter] 429 Rate limit — retry in 15s…");
          await sleep(15000);
          continue;
        }
        if (redactErrors) {
          console.error(`[OpenRouter] Forge provider error (HTTP ${Number(response.status) || 0}).`);
        } else {
          console.error("OpenRouter API Error:", JSON.stringify(data));
        }
        if (is429(response.status, data)) {
          throw new HttpsError("resource-exhausted", "KI-Fehler: Kurzes Rate Limit. Bitte in 2-3 Minuten erneut versuchen.");
        }
        throw new HttpsError("unknown", redactErrors
          ? "Quest-Erzeugung ist nicht verfuegbar."
          : `KI-Fehler: ${data.error?.message || JSON.stringify(data)}`);
      }

      const textOutput = data.choices?.[0]?.message?.content || "";
      return stripMarkdown(textOutput);

    } catch (err) {
      if (err?.name === "AbortError") {
        if (redactErrors) console.error("[OpenRouter] Forge provider timeout.");
        if (attempt === safeAttempts - 1) throw new HttpsError("deadline-exceeded", "Quest-Erzeugung hat zu lange gedauert.");
        await sleep(2000);
        continue;
      }
      if (err instanceof HttpsError) throw err;

      if (redactErrors) {
        console.error("[OpenRouter] Forge network error.");
      } else {
        console.error("OpenRouter Fetch Error:", err.message);
      }
      if (attempt === safeAttempts - 1) {
        throw new HttpsError("unknown", redactErrors
          ? "Quest-Erzeugung ist nicht verfuegbar."
          : `Netzwerk-Fehler zur KI: ${err.message}`);
      }
      await sleep(2000);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Text-only generation
 */
function buildTextMessages(promptOrMessages) {
  if (promptOrMessages && typeof promptOrMessages === "object") {
    const system = String(promptOrMessages.system || "").trim();
    const user = String(promptOrMessages.user || "").trim();
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    if (user) messages.push({ role: "user", content: user });
    return messages;
  }
  return [{ role: "user", content: String(promptOrMessages || "") }];
}

async function callGemini(promptOrMessages, options = {}) {
  return await callOpenRouter(buildTextMessages(promptOrMessages), options);
}

/**
 * Multimodal generation (text + single image)
 */
async function callGeminiWithImage(prompt, imageBase64, mimeType = "image/jpeg") {
  return await callOpenRouter([
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
      ]
    }
  ]);
}

/**
 * Multimodal generation with MULTIPLE images (text + images[])
 */
async function callGeminiWithImages(prompt, images) {
  const contentArray = [{ type: "text", text: prompt }];

  for (const img of images) {
    const mimeMap = img.mimeType || "image/jpeg";
    contentArray.push({
      type: "image_url",
      image_url: { url: `data:${mimeMap};base64,${img.base64}` }
    });
  }

  return await callOpenRouter([
    {
      role: "user",
      content: contentArray
    }
  ]);
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

module.exports = { buildTextMessages, callGemini, callGeminiWithImage, callGeminiWithImages, parseJSON };
