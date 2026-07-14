// useGeminiAI.js — React hook for all Gemini AI Cloud Function calls

import { useState, useCallback, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { getStateLocale, translate } from "../data/i18n.js";
import { buildAIQuestRequest, buildAIQuestProfile } from "../data/aiQuestProfile.js";

// Helper: Resize and convert to Base64 to prevent 413 Payload Too Large
const compressFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        // Limit max dimension to 1024px for OCR speed and payload limits
        const MAX_DIM = 1024;
        if (width > height && width > MAX_DIM) {
          height = Math.round(height * (MAX_DIM / width));
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round(width * (MAX_DIM / height));
          height = MAX_DIM;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Export as heavily compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.src = e.target.result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const RATE_LIMIT_KEY = "sl_ai_rate_limit_until";

function getRateLimitExpiry() {
  const v = localStorage.getItem(RATE_LIMIT_KEY);
  return v ? parseInt(v, 10) : 0;
}

function setRateLimitExpiry(ms = 60 * 60 * 1000) {
  const expiry = new Date(Date.now() + ms);
  localStorage.setItem(RATE_LIMIT_KEY, String(expiry.getTime()));
  return expiry;
}

function clearRateLimitExpiry() {
  localStorage.removeItem(RATE_LIMIT_KEY);
}

function isRateLimitActive() {
  return Date.now() < getRateLimitExpiry();
}

export function useGeminiAI(state) {
  const language = getStateLocale(state);
  const [isLoading, setIsLoading] = useState(false);
  // Initialize from localStorage so rate limit message persists across page reloads
  const [error, setError] = useState(() => {
    if (!isRateLimitActive()) return null;
    const minsLeft = Math.ceil((getRateLimitExpiry() - Date.now()) / 60000);
    const label = minsLeft > 10 ? translate(language, "ai.rateDaily") : translate(language, "ai.ratePause", { minutes: minsLeft });
    return `${label} ${translate(language, "ai.resetHint", { symbol: "x" })}`;
  });
  const [rateLimitError, setRateLimitError] = useState(() => isRateLimitActive());
  // Ref so callbacks always read the latest value (avoids stale closure in useCallback)
  const rateLimitErrorRef = useRef(isRateLimitActive());

  function isRateLimitErr(err) {
    if (!err) return false;
    if (err?.code === "resource-exhausted" || err?.code === "functions/resource-exhausted") return true;
    const msg = err?.message || "";
    return msg.includes("Rate Limit") || msg.includes("resource-exhausted") || msg.includes("429") || msg.includes("quota");
  }

  function handleError(err) {
    console.error("[useGeminiAI]", err);
    if (isRateLimitErr(err)) {
      rateLimitErrorRef.current = true;
      setRateLimitError(true);
      const msg = err?.message || "";
      const isDailyLimit = msg.includes("Tageslimit");
      // Daily limit → 60 min lockout; transient RPM spike → 3 min lockout
      const lockMs = isDailyLimit ? 60 * 60 * 1000 : 3 * 60 * 1000;
      const expiry = setRateLimitExpiry(lockMs);
      const minsLeft = Math.ceil((expiry - Date.now()) / 60000);
      const errorMsg = isDailyLimit
        ? `${translate(language, "ai.rateDaily")} ${translate(language, "ai.resetHint", { symbol: "x" })}`
        : `${translate(language, "ai.ratePause", { minutes: minsLeft })} ${translate(language, "ai.resetHint", { symbol: "x" })}`;
      setError(errorMsg);
    } else if (err?.message && err.message.includes("KI-Fehler")) {
      setError(err.message);
    } else {
      setError(err?.message || translate(language, "ai.unknownError"));
    }
  }

  // ─── Feature A: Quest photo verification ─────────────────────────────────

  const verifyQuest = useCallback(async (imageFile, questData = {}) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { questTitle, questDesc = "", questSteps = [], evidenceKind = "artifact" } = questData;
      const { base64, mimeType } = await compressFileToBase64(imageFile);
      const fn = httpsCallable(functions, "verifyQuestPhoto");
      const result = await fn({ imageBase64: base64, mimeType, questTitle, questDesc, questSteps, evidenceKind, language });
      return result.data; // { verified, reason, confidence }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // ─── Feature C: Scan task photo ───────────────────────────────────────────

  const scanTaskPhoto = useCallback(async (imageFile) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await compressFileToBase64(imageFile);
      const fn = httpsCallable(functions, "scanTaskPhoto");
      const result = await fn({ imageBase64: base64, mimeType, language });
      return result.data; // { tasks: [{ title, category, difficulty }] }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const extractScreenTime = useCallback(async (imageFileOrFiles) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      // Support both single file and array of files
      const files = Array.isArray(imageFileOrFiles) ? imageFileOrFiles : [imageFileOrFiles];
      const images = [];
      for (const file of files.slice(0, 4)) {
        const { base64, mimeType } = await compressFileToBase64(file);
        images.push({ base64, mimeType });
      }
      const fn = httpsCallable(functions, "extractScreenTime");
      const result = await fn({ images, language });
      return result.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // ─── Feature B1: Generate dynamic daily quests ────────────────────────────

  const generateQuests = useCallback(async () => {
    if (!state || rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      // Gratis-Modelle brauchen real oft >70s (Callable-Default) — bis zum
      // Function-Timeout (120s) warten statt kurz vor dem Ergebnis abzubrechen.
      const fn = httpsCallable(functions, "generateDynamicQuests", { timeout: 120000 });
      const result = await fn(buildAIQuestRequest(state, language));
      return result.data; // { quests }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state, language]);

  // ─── Feature B2: Generate system message ─────────────────────────────────

  const generateSystemMsg = useCallback(async (context, messageType) => {
    if (!state || rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "generateSystemMessage");
      const result = await fn({
        context,
        messageType,
        hunterName: state.hunterName || "Hunter",
        stats: state.stats || {},
        streak: state.streak || 0,
        language,
      });
      return result.data; // { title, lines }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state, language]);

  // ─── Feature D: Ask coach ─────────────────────────────────────────────────

  const askCoach = useCallback(async (question) => {
    if (!state || rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const openQuests = (state.quests || [])
        .filter((q) => !q.completed)
        .slice(0, 5)
        .map((q) => ({ title: q.title }));

      const fn = httpsCallable(functions, "askCoach");
      const result = await fn({
        question,
        hunterName: state.hunterName || "Hunter",
        stats: state.stats || {},
        level: state.level || 1,
        streak: state.streak || 0,
        openQuests,
        language,
      });
      return result.data; // { response }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state, language]);

  // ─── Feature E: Generate quest description ────────────────────────────────

  const generateQuestDesc = useCallback(async (title, category) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "generateQuestDescription");
      const result = await fn({ title, category, language });
      return result.data; // { description, subQuests, suggestedDifficulty }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // ─── Paket C: Ziel-Vorschläge ─────────────────────────────────────────────

  const suggestGoals = useCallback(async (questionnaire = null) => {
    if (!state || rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      // Wie generateQuests: Gratis-Modelle + Retry brauchen mehr als die 70s Callable-Default.
      const fn = httpsCallable(functions, "suggestGoals", { timeout: 120000 });
      const result = await fn({ profile: buildAIQuestProfile(state), language, ...(questionnaire ? { questionnaire } : {}) });
      return result.data; // { goals }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state, language]);

  return {
    isLoading,
    error,
    rateLimitError,
    isRateLimited: () => rateLimitErrorRef.current,
    clearError: () => { setError(null); rateLimitErrorRef.current = false; setRateLimitError(false); clearRateLimitExpiry(); },
    verifyQuest,
    scanTaskPhoto,
    extractScreenTime,
    generateQuests,
    generateSystemMsg,
    askCoach,
    generateQuestDesc,
    suggestGoals,
  };
}
