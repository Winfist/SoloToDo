// geminiService.js — OpenRouter wrapper for SoloToDo (v3.0)
const { HttpsError } = require("firebase-functions/v2/https");

// Using "openrouter/free" routes to the best available free model.
const MODEL_NAME = "openrouter/free";

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
async function callOpenRouter(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY; // Fallback so .env renaming isn't strictly required
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://solotodo.app", // Important for OpenRouter
          "X-Title": "SoloToDo",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: messages,
          temperature: 0.7,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (is429(response.status, data) && attempt === 0) {
          console.warn("[OpenRouter] 429 Rate limit — retry in 15s…");
          await sleep(15000);
          continue;
        }
        console.error("OpenRouter API Error:", JSON.stringify(data));
        if (is429(response.status, data)) {
          throw new HttpsError("resource-exhausted", "KI-Fehler: Kurzes Rate Limit. Bitte in 2-3 Minuten erneut versuchen.");
        }
        throw new HttpsError("unknown", `KI-Fehler: ${data.error?.message || JSON.stringify(data)}`);
      }

      const textOutput = data.choices?.[0]?.message?.content || "";
      return stripMarkdown(textOutput);

    } catch (err) {
      if (err instanceof HttpsError) throw err;

      console.error("OpenRouter Fetch Error:", err.message);
      if (attempt === 1) {
        throw new HttpsError("unknown", `Netzwerk-Fehler zur KI: ${err.message}`);
      }
      await sleep(2000);
    }
  }
}

/**
 * Text-only generation
 */
async function callGemini(prompt) {
  return await callOpenRouter([
    { role: "user", content: prompt }
  ]);
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

module.exports = { callGemini, callGeminiWithImage, callGeminiWithImages, parseJSON };
