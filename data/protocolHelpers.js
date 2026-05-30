// ─── PROTOCOL HELPERS ─────────────────────────────────────────
// Extracted from data/constants.jsx
// Contains Shadow Regression, Dawn/Dusk Protocol, and Season helpers.

import { genId, getToday } from "./helpers.js";
import { translate, getStateLocale } from "./i18n.js";

// ─── SHADOW REGRESSION HELPERS ────────────────────────────────
export function generateRedemptionQuests(playerLevel, state = null) {
  const locale = getStateLocale(state);
  const categories = ["str", "int", "vit", "agi", "cha"];
  return categories.map((cat, i) => {
    const stepNum = i + 1;
    return {
      id: genId(),
      title: translate(locale, `quests.redemption.${stepNum}.title`),
      desc: translate(locale, `quests.redemption.${stepNum}.desc`),
      category: cat,
      difficulty: "hard",
      type: "redemption",
      isSystem: true,
      isRedemption: true,
      createdAt: getToday(),
      createdAtMs: Date.now(),
      xpMult: 1.5,
      regressionStep: stepNum,
    };
  });
}

// ─── DAWN/DUSK PROTOCOL HELPERS ───────────────────────────────
export function isDawnWindow() {
  const h = new Date().getHours();
  return h >= 5 && h < 11;
}

export function isDuskWindow() {
  const h = new Date().getHours();
  return h >= 18 && h < 23;
}

export function calculateProtocolXp(run, playerLevel) {
  const base = run.type === "dawn" ? 80 : 60;
  const floorBonus = (run.floorsCompleted || 0) * 20;
  const perfectBonus = run.isPerfect ? Math.round((base + floorBonus) * 0.5) : 0;
  const levelBonus = Math.floor((playerLevel || 1) / 10) * 10;
  return base + floorBonus + perfectBonus + levelBonus;
}

// ─── SEASON HELPERS ───────────────────────────────────────────
export function generateSeasonalQuests(seasonKey, state = null) {
  const locale = getStateLocale(state);
  const SEASON_MAP = {
    frost: [
      { difficulty: "hard", category: "vit" },
      { difficulty: "normal", category: "str" },
      { difficulty: "hard", category: "int" },
      { difficulty: "normal", category: "vit" },
    ],
    spring: [
      { difficulty: "boss", category: "vit" },
      { difficulty: "hard", category: "int" },
      { difficulty: "normal", category: "cha" },
      { difficulty: "hard", category: "agi" },
    ],
    inferno: [
      { difficulty: "boss", category: "str" },
      { difficulty: "hard", category: "str" },
      { difficulty: "hard", category: "vit" },
      { difficulty: "normal", category: "agi" },
    ],
    redgate: [
      { difficulty: "hard", category: "int" },
      { difficulty: "normal", category: "int" },
      { difficulty: "hard", category: "cha" },
      { difficulty: "normal", category: "str" },
    ],
  };
  const configs = SEASON_MAP[seasonKey] || SEASON_MAP.frost;
  return configs.map((cfg, i) => ({
    id: genId(),
    title: translate(locale, `quests.seasonal.${seasonKey}.${i + 1}.title`),
    category: cfg.category,
    difficulty: cfg.difficulty,
    type: "weekly",
    isSystem: true,
    isSeasonal: true,
    createdAt: getToday(),
    createdAtMs: Date.now(),
  }));
}
