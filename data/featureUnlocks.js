// ─── PROGRESSIVE FEATURE UNLOCK SYSTEM ────────────────────────
// Single source of truth for which features unlock at which level.
// Features are grouped into tiers that feel natural for RPG progression.

export const FEATURE_UNLOCKS = {
  // ─── STUFE 0 — Level 1: Basics ──────────────────────────────
  quests_basic:       { level: 1,  tier: 0, label: "Quests",           desc: "Erstelle und schließe Quests ab" },
  stats_view:         { level: 1,  tier: 0, label: "Hunter Stats",     desc: "Deine Werte im Überblick" },
  settings:           { level: 1,  tier: 0, label: "Einstellungen",    desc: "Grundeinstellungen" },
  calendar:           { level: 1,  tier: 0, label: "Kalender",         desc: "Quest-Kalender & Planung" },

  // ─── STUFE 1 — Level 3: Erste Systeme ───────────────────────
  habit_tracker:      { level: 3,  tier: 1, label: "Habit Tracker",    desc: "Baue tägliche Routinen auf" },
  emergency_quests:   { level: 3,  tier: 1, label: "Notfall-Quests",   desc: "Tägliche System-Herausforderungen" },
  quest_filters:      { level: 3,  tier: 1, label: "Quest-Filter",     desc: "Filtere deine aktiven Quests" },
  analytics:          { level: 3,  tier: 1, label: "Analytics",        desc: "Fortschritts-Auswertung" },
  ai_task_scan:       { level: 3,  tier: 1, label: "Task-Scanner",     desc: "Fotografiere deine Aufgaben" },
  music:              { level: 1,  tier: 0, label: "Music Player",     desc: "Epische Hintergrundmusik" },

  // ─── STUFE 2 — Level 5: Ziele & Vision ──────────────────────
  goals:              { level: 5,  tier: 2, label: "Ziele",            desc: "Langfristige Visionen setzen" },
  training_tab:       { level: 5,  tier: 2, label: "Training-Hub",     desc: "Ziele & tägliches Training" },
  micro_habits:       { level: 5,  tier: 2, label: "Micro-Habits",     desc: "Kleine tägliche Gewohnheiten" },
  vision_board:       { level: 5,  tier: 2, label: "Vision Board",     desc: "Manifestiere dein Schicksal" },
  focus_mode:         { level: 3,  tier: 1, label: "Focus Mode",       desc: "Tiefe Konzentration aktivieren" },
  ai_quest_desc:      { level: 5,  tier: 2, label: "KI Quest-Hilfe",   desc: "KI generiert Quest-Beschreibungen" },

  // ─── STUFE 3 — Level 8: Tracking & Routinen ────────────────
  achievements:       { level: 8,  tier: 3, label: "Achievements",     desc: "Meilensteine & Belohnungen" },
  weekly_quests:      { level: 8,  tier: 3, label: "Weekly Quests",    desc: "Wöchentliche Herausforderungen" },
  dawn_dusk:          { level: 8,  tier: 3, label: "Dawn/Dusk Protocol", desc: "Morgen- & Abendroutinen" },
  ai_coach:           { level: 8,  tier: 3, label: "KI-Coach",         desc: "Das System spricht zu dir" },

  // ─── STUFE 4 — Level 11: D-Rang (Dungeons & Shop) ──────────
  dungeons:           { level: 11, tier: 4, label: "Dungeon Gates",    desc: "Besiege magische Portale" },
  shop:               { level: 11, tier: 4, label: "Shop",             desc: "Titel, Themes & Items kaufen" },
  gem_shop:           { level: 11, tier: 4, label: "Gem Shop",         desc: "Premium-Shop mit Gems 💎" },
  equipment:          { level: 11, tier: 4, label: "Equipment",        desc: "Waffen & Rüstung verwalten" },
  chained_quests:     { level: 11, tier: 4, label: "Chained Quests",   desc: "Mehrteilige Ketten-Quests" },
  story:              { level: 11, tier: 4, label: "Story",            desc: "Deine Heldenreise als Hunter" },
  sanctum:            { level: 11, tier: 4, label: "Inner Sanctum",    desc: "Meditation & Willenskraft" },
  ai_verification:    { level: 11, tier: 4, label: "Quest-Verifikation", desc: "Beweise deine Quests mit Fotos" },

  // ─── STUFE 5 — Level 15: Schatten-Erweckung ────────────────
  shadow_army:        { level: 15, tier: 5, label: "Shadow Army",      desc: "Erwecke besiegte Gegner als Schatten" },
  codex:              { level: 15, tier: 5, label: "Hunter's Codex",   desc: "Verlorene Weisheiten entdecken" },
  ai_dynamic_quests:  { level: 15, tier: 5, label: "KI-Quests",        desc: "KI generiert personalisierte Quests" },

  // ─── STUFE 6 — Level 21: C-Rang (Advanced) ─────────────────
  jobs:               { level: 21, tier: 6, label: "Jobs",             desc: "Hunter-Klassen & Spezialisierung" },
  formations:         { level: 21, tier: 6, label: "Formationen",      desc: "Schatten-Aufstellung optimieren" },
  challenges:         { level: 21, tier: 6, label: "Events",           desc: "Challenges & Missionen" },
  hidden_quests:      { level: 21, tier: 6, label: "Hidden Quests",    desc: "Verborgene Quests entdecken" },

  // ─── STUFE 7 — Level 30: Sozial & Saisonal ─────────────────
  soul_link:          { level: 30, tier: 7, label: "Soul Link",        desc: "Partner-Verbindung herstellen" },
  charisma_dungeons:  { level: 30, tier: 7, label: "Charisma Dungeons", desc: "Soziale Ketten bezwingen" },
  named_shadows:      { level: 30, tier: 7, label: "Named Shadows",    desc: "Legendäre Schatten erwecken" },
  seasons:            { level: 30, tier: 7, label: "Seasons",          desc: "Saisonale Events & World Events" },

  // ─── STUFE 8 — Level 36: B-Rang (Endgame) ──────────────────
  multiplayer:        { level: 36, tier: 8, label: "Multiplayer",      desc: "Hunter Association beitreten" },
};

// ─── TIER UNLOCK MESSAGES (SystemCLI style) ──────────────────
export const TIER_UNLOCK_MESSAGES = {
  1: {
    title: "SYSTEM UPDATE",
    lines: [
      "Neue Module erkannt.",
      "Habit-Tracking-System: ONLINE.",
      "Notfall-Quests & Focus Mode: AKTIVIERT.",
      "Disziplin ist der Schlüssel, Hunter."
    ]
  },
  2: {
    title: "SYSTEM EXPANSION",
    lines: [
      "Das Ziel-Modul wurde freigeschaltet.",
      "Langfristige Planung: AKTIVIERT.",
      "Vision Board & Micro-Habits: ONLINE.",
      "Der Weg wird klarer."
    ]
  },
  3: {
    title: "ERKENNUNG",
    lines: [
      "Achievement-System: INITIALISIERT.",
      "Dawn/Dusk-Protokoll: AKTIVIERT.",
      "Analytics & Kalender: ONLINE.",
      "Weeklys freigeschaltet. Deine Disziplin wird gemessen."
    ]
  },
  4: {
    title: "D-RANG AUFSTIEG — NEUE ÄRA",
    lines: [
      "RANG-AUFSTIEG BESTÄTIGT: D-RANG.",
      "Dungeon Gates wurden aktiviert.",
      "System-Shop & Equipment: ZUGÄNGLICH.",
      "Inner Sanctum & Story-Modul: ONLINE.",
      "Die wahre Jagd beginnt jetzt."
    ]
  },
  5: {
    title: "SCHATTEN-ERWECKUNG",
    lines: [
      "Shadow Extraction-Fähigkeit: FREIGESCHALTET.",
      "Besiegte Boss-Quests werden zu Schatten.",
      "Hunter's Codex: ZUGÄNGLICH.",
      "Deine Armee wächst, Monarch."
    ]
  },
  6: {
    title: "C-RANG ÜBERSCHRITTEN",
    lines: [
      "Job-System: ONLINE. Klassifizierung beginnt.",
      "Schatten-Formationen: BEREIT.",
      "Events & Hidden Quests freigeschaltet.",
      "Du bist kein gewöhnlicher Hunter mehr."
    ]
  },
  7: {
    title: "FORTGESCHRITTENE SYSTEME",
    lines: [
      "Soul Link-Protokoll: ONLINE.",
      "Charisma Dungeons: GEÖFFNET.",
      "Named Shadows können nun erweckt werden.",
      "Saisonale Events: AKTIV.",
      "Die Welt reagiert auf deine Macht."
    ]
  },
  8: {
    title: "B-RANG — ELITESTATUS",
    lines: [
      "Die Hunter Association hat dich registriert.",
      "Multiplayer-Portal: AKTIVIERT.",
      "Alle Systeme: ONLINE.",
      "Willkommen in der Elite, Hunter."
    ]
  }
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────

/**
 * Check if a specific feature is unlocked for the given player level.
 */
export function isFeatureUnlocked(featureKey, playerLevel) {
  const feature = FEATURE_UNLOCKS[featureKey];
  if (!feature) return true; // Unknown features default to unlocked (safety)
  return playerLevel >= feature.level;
}

/**
 * Get the next level at which any new feature unlocks.
 */
export function getNextUnlockLevel(playerLevel) {
  const allLevels = [...new Set(Object.values(FEATURE_UNLOCKS).map(f => f.level))].sort((a, b) => a - b);
  return allLevels.find(l => l > playerLevel) || null;
}

/**
 * Get all features that unlock at a specific level.
 */
export function getUnlocksAtLevel(level) {
  return Object.entries(FEATURE_UNLOCKS)
    .filter(([_, f]) => f.level === level)
    .map(([key, f]) => ({ key, ...f }));
}

/**
 * Get all features newly unlocked between oldLevel and newLevel.
 * Used during level-up to show unlock notifications.
 */
export function getNewlyUnlockedFeatures(oldLevel, newLevel) {
  const features = [];
  for (const [key, f] of Object.entries(FEATURE_UNLOCKS)) {
    if (f.level > oldLevel && f.level <= newLevel) {
      features.push({ key, ...f });
    }
  }
  return features.sort((a, b) => a.level - b.level);
}

/**
 * Get the highest tier that was newly crossed between oldLevel and newLevel.
 * Returns the tier number or null if no new tier was crossed.
 */
export function getNewlyUnlockedTier(oldLevel, newLevel) {
  const tierLevels = [...new Set(Object.values(FEATURE_UNLOCKS).map(f => f.level))].sort((a, b) => a - b);
  let highestNewTier = null;
  for (const tl of tierLevels) {
    if (tl > oldLevel && tl <= newLevel) {
      const tier = Object.values(FEATURE_UNLOCKS).find(f => f.level === tl)?.tier;
      if (tier !== undefined && (highestNewTier === null || tier > highestNewTier)) {
        highestNewTier = tier;
      }
    }
  }
  return highestNewTier;
}

/**
 * Get the first feature unlock level crossed by a level-up.
 * Used to gate the full unlock sequence before the tier tutorial starts.
 */
export function getLevelCrossingUnlock(oldLevel, newLevel) {
  const from = Number(oldLevel) || 0;
  const to = Number(newLevel) || 0;
  if (to <= from) return null;

  const unlockLevel = [...new Set(Object.values(FEATURE_UNLOCKS).map(f => f.level))]
    .sort((a, b) => a - b)
    .find(level => level > from && level <= to);

  if (!unlockLevel) return null;

  const features = getUnlocksAtLevel(unlockLevel);
  const tier = features.find(feature => feature.tier > 0)?.tier || null;
  if (!tier) return null;

  return {
    level: unlockLevel,
    tier,
    features,
    message: TIER_UNLOCK_MESSAGES[tier] || null,
  };
}

export { getFeatureIconName } from "../components/tutorial/featureIconMap.js";
