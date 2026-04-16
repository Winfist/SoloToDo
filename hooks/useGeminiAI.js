// useGeminiAI.js — React hook for all Gemini AI Cloud Function calls

import { useState, useCallback, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Helper: convert File/Blob or <input type="file"> result to base64 string
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = reader.result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [isLoading, setIsLoading] = useState(false);
  // Initialize from localStorage so rate limit message persists across page reloads
  const [error, setError] = useState(() => {
    if (!isRateLimitActive()) return null;
    const minsLeft = Math.ceil((getRateLimitExpiry() - Date.now()) / 60000);
    const label = minsLeft > 10 ? "Tageslimit erreicht. Zurücksetzen um Mitternacht UTC." : `Kurze Pause (~${minsLeft} Min.). Gemini braucht kurz Luft.`;
    return `${label} (✕ zum sofortigen Zurücksetzen)`;
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
        ? `Tageslimit erreicht. Zurücksetzen um Mitternacht UTC. (✕ zum sofortigen Zurücksetzen)`
        : `Kurze Pause (~${minsLeft} Min.). Gemini braucht kurz Luft. (✕ zum sofortigen Zurücksetzen)`;
      setError(errorMsg);
    } else if (err?.message && err.message.includes("KI-Fehler")) {
      setError(err.message);
    } else {
      setError(err?.message || "Unbekannter Fehler.");
    }
  }

  // ─── Feature A: Quest photo verification ─────────────────────────────────

  const verifyQuest = useCallback(async (imageFile, questTitle, questDesc = "") => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const fn = httpsCallable(functions, "verifyQuestPhoto");
      const result = await fn({ imageBase64: base64, mimeType, questTitle, questDesc });
      return result.data; // { verified, reason, confidence }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Feature C: Scan task photo ───────────────────────────────────────────

  const scanTaskPhoto = useCallback(async (imageFile) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const fn = httpsCallable(functions, "scanTaskPhoto");
      const result = await fn({ imageBase64: base64, mimeType });
      return result.data; // { tasks: [{ title, category, difficulty }] }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Feature B1: Generate dynamic daily quests ────────────────────────────

  const generateQuests = useCallback(async () => {
    if (!state || rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const stats = state.stats || {};
      const level = state.level || 1;
      const recentQuests = (state.completedQuests || [])
        .slice(-10)
        .map((q) => q.title)
        .filter(Boolean);

      // Find weakest stat
      const statValues = Object.entries(stats);
      const weakestStat = statValues.length > 0
        ? statValues.sort((a, b) => a[1] - b[1])[0][0]
        : null;

      const fn = httpsCallable(functions, "generateDynamicQuests");
      const result = await fn({ stats, level, weakestStat, recentQuests });
      return result.data; // { quests }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state]);

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
      });
      return result.data; // { title, lines }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state]);

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
      });
      return result.data; // { response }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  // ─── Feature E: Generate quest description ────────────────────────────────

  const generateQuestDesc = useCallback(async (title, category) => {
    if (rateLimitErrorRef.current) return null;
    setIsLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "generateQuestDescription");
      const result = await fn({ title, category });
      return result.data; // { description, subQuests, suggestedDifficulty }
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    rateLimitError,
    isRateLimited: () => rateLimitErrorRef.current,
    clearError: () => { setError(null); rateLimitErrorRef.current = false; setRateLimitError(false); clearRateLimitExpiry(); },
    verifyQuest,
    scanTaskPhoto,
    generateQuests,
    generateSystemMsg,
    askCoach,
    generateQuestDesc,
  };
}
