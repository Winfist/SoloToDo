// useGeminiAI.js — React hook for all Gemini AI Cloud Function calls

import { useState, useCallback } from "react";
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

export function useGeminiAI(state) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(false);

  function handleError(err) {
    if (err?.code === "resource-exhausted" || err?.code === "functions/resource-exhausted") {
      setRateLimitError(true);
      setError("Tageslimit erreicht. Komm morgen wieder, Hunter.");
    } else {
      setError(err?.message || "Unbekannter Fehler.");
    }
    console.error("[useGeminiAI]", err);
  }

  // ─── Feature A: Quest photo verification ─────────────────────────────────

  const verifyQuest = useCallback(async (imageFile, questTitle, questDesc = "") => {
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
    if (!state) return null;
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
    if (!state) return null;
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
    if (!state) return null;
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
    clearError: () => { setError(null); setRateLimitError(false); },
    verifyQuest,
    scanTaskPhoto,
    generateQuests,
    generateSystemMsg,
    askCoach,
    generateQuestDesc,
  };
}
