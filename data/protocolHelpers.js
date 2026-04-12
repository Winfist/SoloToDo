// ─── PROTOCOL HELPERS ─────────────────────────────────────────
// Extracted from data/constants.jsx
// Contains Shadow Regression, Dawn/Dusk Protocol, and Season helpers.

import { genId, getToday } from "./helpers.js";

// ─── SHADOW REGRESSION HELPERS ────────────────────────────────
export function generateRedemptionQuests(playerLevel) {
  const templates = [
    { title: "Schattenrückforderung I: Körperliche Buße", category: "str", desc: "Überwinde die Schwäche des Körpers. Der Schatten wartet." },
    { title: "Schattenrückforderung II: Mentale Prüfung", category: "int", desc: "Überwinde die Schwäche des Geistes. Beweise deine Disziplin." },
    { title: "Schattenrückforderung III: Die Rückkehr", category: "vit", desc: "Der letzte Schritt. Beweise, dass du zurückgekehrt bist." },
  ];
  return templates.map((t, i) => ({
    id: genId(),
    title: t.title,
    category: t.category,
    difficulty: "hard",
    type: "redemption",
    isSystem: true,
    isRedemption: true,
    createdAt: getToday(),
    createdAtMs: Date.now(),
    xpMult: 1.5,
    regressionStep: i + 1,
  }));
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
export function generateSeasonalQuests(seasonKey) {
  const SEASON_MAP = {
    frost: [
      { title: "Eisige Morgenroutine: Kaltdusche 3 Tage in Folge", difficulty: "hard", category: "vit" },
      { title: "Frost-Training: 30 Min Outdoor-Sport im Winter", difficulty: "normal", category: "str" },
    ],
    spring: [
      { title: "Frühlingserwachen: 7-Tage Morgenroutine starten", difficulty: "boss", category: "vit" },
      { title: "Neue Fähigkeit beginnen – 5 Tage täglich üben", difficulty: "hard", category: "int" },
    ],
    inferno: [
      { title: "Inferno-Challenge: 100 Liegestütze in 5 Tagen", difficulty: "boss", category: "str" },
      { title: "Hitzewelle: Maximale Trainingsintensität 3 Tage", difficulty: "hard", category: "str" },
    ],
    redgate: [
      { title: "Rotes Tor: 1 Stunde täglich lernen – 7 Tage", difficulty: "hard", category: "int" },
      { title: "Herbst-Offensive: Finanzielle Planung abschließen", difficulty: "normal", category: "int" },
    ],
  };
  const templates = SEASON_MAP[seasonKey] || SEASON_MAP.frost;
  return templates.map((t) => ({
    id: genId(),
    title: t.title,
    category: t.category,
    difficulty: t.difficulty,
    type: "weekly",
    isSystem: true,
    isSeasonal: true,
    createdAt: getToday(),
    createdAtMs: Date.now(),
  }));
}
