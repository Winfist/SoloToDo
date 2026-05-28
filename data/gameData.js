// ─── GAME DATA ────────────────────────────────────────────────
// Extracted from data/constants.jsx
// Contains all static data arrays and configuration objects.

import { STAT_ICONS, SHADOW_ICONS, GATE_ICONS, ITEM_ICONS, QUEST_ICONS, DIFF_ICONS, ROLE_ICONS, STYLE_ICONS, DUNGEON_ICONS, BACKGROUNDS, STORY_ICONS, HABIT_ICONS, NAV_ICONS, MICRO_ICONS, SHOP_ICONS, SKILL_ICONS, SYSTEM_ICONS, BOSS_ICONS, ABILITY_ICONS, JOB_ICONS } from "./icons.js";

export const RANKS = [
  { name: "E", label: "E-Rank Hunter", minLv: 1, maxLv: 10, xpPerLv: 100, color: "#6b7280", glow: "rgba(107,114,128,0.4)" },
  { name: "D", label: "D-Rank Hunter", minLv: 11, maxLv: 20, xpPerLv: 250, color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { name: "C", label: "C-Rank Hunter", minLv: 21, maxLv: 35, xpPerLv: 500, color: "#34d399", glow: "rgba(52,211,153,0.4)" },
  { name: "B", label: "B-Rank Hunter", minLv: 36, maxLv: 50, xpPerLv: 900, color: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { name: "A", label: "A-Rank Hunter", minLv: 51, maxLv: 70, xpPerLv: 1500, color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { name: "S", label: "S-Rank Hunter", minLv: 71, maxLv: 90, xpPerLv: 3000, color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { name: "SSS", label: "National Level", minLv: 91, maxLv: 100, xpPerLv: 6000, color: "#e879f9", glow: "rgba(232,121,249,0.4)" },
];

export const DIFFICULTIES = [
  { key: "easy", label: "Easy", xp: 5, gold: 10, color: "#6b7280", icon: "◇", iconSrc: DIFF_ICONS.easy, waitHours: 0 },
  { key: "normal", label: "Normal", xp: 15, gold: 25, color: "#22d3ee", icon: "◆", iconSrc: DIFF_ICONS.normal, waitHours: 0.5 },
  { key: "hard", label: "Hard", xp: 40, gold: 60, color: "#a78bfa", icon: "★", iconSrc: DIFF_ICONS.hard, waitHours: 1 },
  { key: "boss", label: "Boss", xp: 100, gold: 150, color: "#ef4444", icon: "♛", iconSrc: DIFF_ICONS.boss, waitHours: 2 },
];

export const CATEGORIES = [
  { key: "str", label: "Strength", full: "Sport / Fitness", stat: "STR", icon: "⚔️", iconSrc: STAT_ICONS.str, color: "#ef4444" },
  { key: "int", label: "Intelligence", full: "Lernen / Lesen", stat: "INT", icon: "📖", iconSrc: STAT_ICONS.int, color: "#3b82f6" },
  { key: "vit", label: "Vitality", full: "Erholung", stat: "VIT", icon: "🛡️", iconSrc: STAT_ICONS.vit, color: "#22c55e" },
  { key: "agi", label: "Agility", full: "Produktivität", stat: "AGI", icon: "⚡", iconSrc: STAT_ICONS.agi, color: "#f59e0b" },
  { key: "cha", label: "Charisma", full: "Soziales", stat: "CHA", icon: "👥", iconSrc: STAT_ICONS.cha, color: "#a855f7" },
];

export const STRATEGIES = [
  { key: "str", label: "Aggressive", desc: "Frontalangriff ohne Rücksicht", icon: "⚔️", iconSrc: STYLE_ICONS.aggressive, color: "#ef4444" },
  { key: "int", label: "Tactical", desc: "Strategie, Täuschung & Planung", icon: "🧠", iconSrc: STYLE_ICONS.tactical, color: "#3b82f6" },
  { key: "vit", label: "Defensive", desc: "Schildwall – Ausdauer gewinnt", icon: "🛡️", iconSrc: STYLE_ICONS.defensive, color: "#22c55e" },
  { key: "agi", label: "Swift", desc: "Schnell, lautlos, unsichtbar", icon: "⚡", iconSrc: STYLE_ICONS.swift, color: "#f59e0b" },
];



// ─── SHADOW ARMY DATA ─────────────────────────────────────────
export const SHADOW_CLASSES = {
  soldier: {
    name: "Shadow Soldier", icon: "⚔️", iconSrc: SHADOW_ICONS.soldier, color: "#64748b",
    baseStats: { power: 10, speed: 10, loyalty: 10, presence: 5 },
    passiveEffect: "+2% XP von allen Quests",
    description: "Standard-Schattenkrieger"
  },
  knight: {
    name: "Shadow Knight", icon: "🛡️", iconSrc: SHADOW_ICONS.knight, color: "#3b82f6",
    baseStats: { power: 18, speed: 8, loyalty: 12, presence: 7 },
    passiveEffect: "+5% Dungeon Verteidigung",
    description: "Gepanzerter Frontline-Kämpfer"
  },
  mage: {
    name: "Shadow Mage", icon: "🔮", iconSrc: SHADOW_ICONS.mage, color: "#a855f7",
    baseStats: { power: 8, speed: 12, loyalty: 10, presence: 15 },
    passiveEffect: "+3% XP von INT-Quests",
    description: "Magischer Unterstützer"
  },
  assassin: {
    name: "Shadow Assassin", icon: "🗡️", iconSrc: SHADOW_ICONS.assassin, color: "#22c55e",
    baseStats: { power: 14, speed: 18, loyalty: 8, presence: 5 },
    passiveEffect: "+5% Gold von Dungeons",
    description: "Schneller Schattenangreifer"
  },
  healer: {
    name: "Shadow Healer", icon: "💚", iconSrc: SHADOW_ICONS.healer, color: "#14b8a6",
    baseStats: { power: 5, speed: 10, loyalty: 18, presence: 12 },
    passiveEffect: "+1 Tag Streak-Schutz",
    description: "Beschützer der Armee"
  },
  commander: {
    name: "Shadow Commander", icon: "👑", iconSrc: SHADOW_ICONS.commander, color: "#f59e0b",
    baseStats: { power: 15, speed: 12, loyalty: 15, presence: 18 },
    passiveEffect: "Alle Shadows +10% Stats",
    description: "Führt andere Shadows an",
    unlockCondition: "Mindestens 10 Shadows besitzen"
  },
};

export const SHADOW_TIERS = {
  1: { name: "Basic", color: "#64748b", maxLevel: 20, statMult: 1.0, abilitySlots: 1, evolutionCost: 0, glowIntensity: 0.2 },
  2: { name: "Elite", color: "#3b82f6", maxLevel: 35, statMult: 1.3, abilitySlots: 2, evolutionCost: 500, glowIntensity: 0.4 },
  3: { name: "Commander", color: "#a855f7", maxLevel: 50, statMult: 1.6, abilitySlots: 3, evolutionCost: 800, glowIntensity: 0.6 },
  4: { name: "Named", color: "#f59e0b", maxLevel: 75, statMult: 2.0, abilitySlots: 4, evolutionCost: 2500, glowIntensity: 0.8 },
  5: { name: "Monarch", color: "#ef4444", maxLevel: 100, statMult: 3.0, abilitySlots: 5, evolutionCost: 10000, glowIntensity: 1.0 },
};

export const NAMED_SHADOWS = {
  igris: {
    id: "igris", name: "Igris", title: "The Bloodred Commander",
    class: "knight", tier: 4, icon: "🩸", iconSrc: SHADOW_ICONS.igris,
    unlockCondition: { type: "dungeon_rank", dungeonRank: "A", desc: "A-Rank Dungeon besiegen" },
    uniqueAbility: { name: "Crimson Blade", effect: "Critical Strike +50% in Dungeons", icon: "⚔️", iconSrc: ITEM_ICONS.blade },
    lore: "Einst ein loyaler Ritter, nun der treueste Schatten des Monarchen.",
    glowColor: "#dc2626",
  },
  tank: {
    id: "tank", name: "Tank", title: "The Iron Fortress",
    class: "knight", tier: 4, icon: "🛡️", iconSrc: SHADOW_ICONS.knight,
    unlockCondition: { type: "stat", stat: "vit", value: 100, desc: "VIT 100 erreichen" },
    uniqueAbility: { name: "Unbreakable Defense", effect: "1x täglich: Dungeon-Schaden Immunität", icon: "🛡️", iconSrc: SKILL_ICONS.defense },
    lore: "Ein Koloss aus Schatten, unerschütterlich wie ein Berg.",
    glowColor: "#3b82f6",
  },
  beru: {
    id: "beru", name: "Beru", title: "The Ant King",
    class: "assassin", tier: 4, icon: "🐜", iconSrc: SHADOW_ICONS.beru,
    unlockCondition: { type: "dungeon_rank", dungeonRank: "S", desc: "S-Rank Dungeon besiegen" },
    uniqueAbility: { name: "Consume", effect: "Absorbiert 5% der Boss-Stats permanent", icon: "👅", iconSrc: ABILITY_ICONS.consume },
    lore: "Der gefallene König der Ameisen, wiedergeboren als Schatten.",
    glowColor: "#22c55e",
  },
  bellion: {
    id: "bellion", name: "Bellion", title: "The Grand Marshal",
    class: "commander", tier: 5, icon: "⚜️", iconSrc: SHADOW_ICONS.bellion,
    unlockCondition: { type: "level", value: 90, desc: "Level 90 erreichen" },
    uniqueAbility: { name: "Army Command", effect: "Kann gesamte Shadow Army gleichzeitig kommandieren", icon: "👑", iconSrc: SHADOW_ICONS.commander },
    lore: "Der oberste General des ursprünglichen Shadow Monarchen.",
    glowColor: "#f59e0b",
  },
};

export const FORMATION_SLOTS = {
  vanguard: { name: "Vanguard", maxSlots: 3, bonus: "+15% Aggressive Strategy", icon: "⚔️", iconSrc: ROLE_ICONS.vanguard, preferredClasses: ["knight", "soldier"], color: "#ef4444" },
  core: { name: "Core", maxSlots: 5, bonus: "+10% All Strategies", icon: "🛡️", iconSrc: ROLE_ICONS.core, preferredClasses: ["any"], color: "#6366f1" },
  rearguard: { name: "Rearguard", maxSlots: 2, bonus: "+20% XP & Gold", icon: "🎯", iconSrc: ROLE_ICONS.rearguard, preferredClasses: ["mage", "healer", "assassin"], color: "#22c55e" },
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first_quest", name: "Erste Schritte", icon: "⚔️", iconSrc: QUEST_ICONS.daily, desc: "Schließe deine erste Quest ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 1, reward: { xp: 50, gold: 20 } },
  { id: "quests_10", name: "Fleißiger Hunter", icon: "📋", iconSrc: QUEST_ICONS.weekly, desc: "Schließe 10 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 10, reward: { xp: 100, gold: 50 } },
  { id: "quests_50", name: "Quest Meister", icon: "🏆", iconSrc: QUEST_ICONS.chain, desc: "Schließe 50 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 50, reward: { xp: 500, gold: 200 } },
  { id: "quests_100", name: "Legendärer Hunter", icon: "👑", iconSrc: NAV_ICONS.achievements, desc: "Schließe 100 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 100, reward: { xp: 1000, gold: 500, title: "Legendary Hunter" } },
  { id: "boss_first", name: "Besieger", icon: "💀", iconSrc: DIFF_ICONS.boss, desc: "Schließe deine erste Boss-Quest ab", cat: "quests", check: s => (s.shadowArmy?.shadows || []).length >= 1, reward: { xp: 200, gold: 100 } },
  { id: "boss_5", name: "Schattenherr", icon: "🌑", iconSrc: SHADOW_ICONS.soldier, desc: "Beschwöre 5 Schatten", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).length >= 5, reward: { xp: 400, gold: 200 } },
  { id: "boss_15", name: "Schattenmonarch", icon: "☠️", iconSrc: SHADOW_ICONS.commander, desc: "Beschwöre 15 Schatten", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).length >= 15, reward: { xp: 1500, gold: 600, title: "Shadow Monarch" } },
  { id: "shadow_named", name: "Erste Berufung", icon: "🩸", iconSrc: SHADOW_ICONS.igris, desc: "Erwecke einen Named Shadow", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).some(sh => sh.isNamed), reward: { xp: 800, gold: 400, title: "Shadow Sovereign" } },
  { id: "shadow_tier3", name: "Elite Armee", icon: "💜", iconSrc: SHADOW_ICONS.knight, desc: "Habe einen Tier-3 Shadow", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).some(sh => sh.tier >= 3), reward: { xp: 600, gold: 300 } },
  { id: "formation_full", name: "Volles Kommando", icon: "🎖️", iconSrc: ROLE_ICONS.core, desc: "Fülle alle Formation-Slots", cat: "shadows", check: s => { const a = s.shadowArmy; if (!a) return false; const d = a.shadows.filter(sh => sh.isDeployed); return d.filter(sh => sh.deploymentSlot === "vanguard").length >= 3 && d.filter(sh => sh.deploymentSlot === "core").length >= 5; }, reward: { xp: 1000, gold: 500 } },
  { id: "streak_3", name: "Beständigkeit", icon: "🔥", iconSrc: STAT_ICONS.str, desc: "Erreiche einen 3-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 3, reward: { xp: 100, gold: 50 } },
  { id: "streak_7", name: "Unaufhaltsam", icon: "⚡", iconSrc: STAT_ICONS.agi, desc: "Erreiche einen 7-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 7, reward: { xp: 300, gold: 150, title: "Unstoppable" } },
  { id: "streak_30", name: "Eiserne Disziplin", icon: "💎", iconSrc: NAV_ICONS.timer, desc: "Erreiche einen 30-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 30, reward: { xp: 2000, gold: 1000, gems: 10, title: "Iron Discipline" } },
  { id: "level_10", name: "Erweckung", icon: "✨", iconSrc: STAT_ICONS.int, desc: "Erreiche Level 10", cat: "progress", check: s => s.level >= 10, reward: { xp: 100, gold: 50 } },
  { id: "rank_d", name: "D-Rang Aufstieg", icon: "🌀", iconSrc: GATE_ICONS.normal, desc: "Erreiche D-Rang (Level 11)", cat: "progress", check: s => s.level >= 11, reward: { xp: 300, gold: 150 } },
  { id: "rank_c", name: "C-Rang Aufstieg", icon: "💚", iconSrc: GATE_ICONS.ice, desc: "Erreiche C-Rang (Level 21)", cat: "progress", check: s => s.level >= 21, reward: { xp: 600, gold: 300 } },
  { id: "rank_b", name: "B-Rang Aufstieg", icon: "💜", iconSrc: GATE_ICONS.saferoom, desc: "Erreiche B-Rang (Level 36)", cat: "progress", check: s => s.level >= 36, reward: { xp: 1200, gold: 600 } },
  { id: "rank_a", name: "A-Rang Aufstieg", icon: "🧡", iconSrc: GATE_ICONS.red, desc: "Erreiche A-Rang (Level 51)", cat: "progress", check: s => s.level >= 51, reward: { xp: 2500, gold: 1000, title: "A-Rank Hunter" } },
  { id: "rank_s", name: "S-Rang Aufstieg", icon: "❤️", iconSrc: DUNGEON_ICONS.bloodmoon, desc: "Erreiche S-Rang (Level 71)", cat: "progress", check: s => s.level >= 71, reward: { xp: 5000, gold: 2000, title: "S-Rank Hunter" } },
  { id: "dungeon_first", name: "Gate Öffner", icon: "🌀", iconSrc: GATE_ICONS.normal, desc: "Bezwinge deinen ersten Dungeon", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 1, reward: { xp: 200, gold: 100 } },
  { id: "dungeon_10", name: "Dungeon Meister", icon: "🏯", iconSrc: DUNGEON_ICONS.densemana, desc: "Bezwinge 10 Dungeons", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 10, reward: { xp: 800, gold: 400 } },
  { id: "dungeon_25", name: "Gate Legende", icon: "⚡", iconSrc: DIFF_ICONS.boss, desc: "Bezwinge 25 Dungeons", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 25, reward: { xp: 2000, gold: 800, title: "Gate Legend" } },
  { id: "str_20", name: "Krieger", icon: "💪", iconSrc: STAT_ICONS.str, desc: "Erreiche STR 20", cat: "stats", check: s => (s.stats?.str || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "int_20", name: "Gelehrter", icon: "🧠", iconSrc: STAT_ICONS.int, desc: "Erreiche INT 20", cat: "stats", check: s => (s.stats?.int || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "vit_20", name: "Eiserner Körper", icon: "🛡️", iconSrc: STAT_ICONS.vit, desc: "Erreiche VIT 20", cat: "stats", check: s => (s.stats?.vit || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "agi_20", name: "Blitzschnell", icon: "💨", iconSrc: STAT_ICONS.agi, desc: "Erreiche AGI 20", cat: "stats", check: s => (s.stats?.agi || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "all_stats_10", name: "Ausgewogener Hunter", icon: "⭐", iconSrc: NAV_ICONS.dashboard, desc: "Alle Stats auf 10", cat: "stats", check: s => Object.values(s.stats || {}).every(v => v >= 10), reward: { xp: 400, gold: 200 } },
  { id: "gold_1000", name: "Goldfieber", icon: "💰", iconSrc: NAV_ICONS.shop, desc: "Sammle insgesamt 1000 Gold", cat: "misc", check: s => (s.totalGoldEarned || 0) >= 1000, reward: { xp: 200, gold: 0 } },
  { id: "equip_first", name: "Ausgerüstet", icon: "🗡️", iconSrc: ITEM_ICONS.armor, desc: "Equipe dein erstes Item", cat: "misc", check: s => Object.values(s.equipment?.slots || {}).some(v => v), reward: { xp: 100, gold: 50 } },
  { id: "story_ch1", name: "Erste Erweckung", icon: "📖", iconSrc: STORY_ICONS.scroll, desc: "Schließe Kapitel 1 ab", cat: "story", check: s => (s.story?.completedChapters || []).includes("ch1"), reward: { xp: 100, gold: 50 } },
  { id: "story_arc1", name: "Der schwächste Hunter", icon: "🗡️", iconSrc: STORY_ICONS.helmet, desc: "Schließe Arc 1 komplett ab", cat: "story", check: s => ["ch1", "ch2", "ch3"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 500, gold: 200, title: "Survivor" } },
  { id: "story_arise", name: "ARISE", icon: "🌑", iconSrc: STORY_ICONS.arise, desc: "Schließe das ARISE-Kapitel ab", cat: "story", check: s => (s.story?.completedChapters || []).includes("ch7"), reward: { xp: 800, gold: 400, title: "Shadow Master" } },
  { id: "story_arc3", name: "Der Schattenmonarch erwacht", icon: "👑", iconSrc: STORY_ICONS.blackheart, desc: "Schließe Arc 3 komplett ab", cat: "story", check: s => ["ch7", "ch8", "ch9"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 2000, gold: 1000 } },
  { id: "story_complete", name: "Shadow Monarch", icon: "☠️", iconSrc: NAV_ICONS.achievements, desc: "Schließe die gesamte Story aus", cat: "story", check: s => ["ch1","ch2","ch3","ch4","ch5","ch6","ch7","ch8","ch9","ch10","ch11","ch12","ch13","ch14","ch15","ch16","ch17","ch18","ch19","ch20"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 25000, gold: 10000, gems: 50, title: "Shadow Monarch" } },
  { id: "health_link", name: "Vitalität Gekoppelt", icon: "❤️", iconSrc: HABIT_ICONS.health, desc: "Synchronisiere zum ersten Mal Health Tracker Daten", cat: "misc", check: s => !!s.healthSyncDate, reward: { xp: 300, gold: 100 } },
  { id: "challenge_first", name: "Rookie Herausforderer", icon: "🎖️", iconSrc: QUEST_ICONS.emergency, desc: "Schließe deine erste Community/Weekly Challenge ab", cat: "quests", check: s => (s.completedChallenges || []).length >= 1, reward: { xp: 400, gold: 150 } },
  { id: "challenge_master", name: "Veteran der Gilde", icon: "🌍", iconSrc: NAV_ICONS.guild, desc: "Schließe 5 Challenges ab", cat: "quests", check: s => (s.completedChallenges || []).length >= 5, reward: { xp: 1500, gold: 600, title: "Guild Veteran" } },
  { id: "focus_10", name: "Tiefen Fokus", icon: "⏳", iconSrc: HABIT_ICONS.timer, desc: "Nutze den Focus Mode für insgesamt 10 Sessions", cat: "streaks", check: s => (s.stats?.focusSessions || 0) >= 10, reward: { xp: 500, gold: 200 } },
  { id: "micro_100", name: "Drop-by-Drop", icon: "💧", iconSrc: MICRO_ICONS.water, desc: "Absolviere 100 Micro-Habit Taps", cat: "habits", check: s => (s.microHabits?.totalTaps || 0) >= 100, reward: { xp: 400, gold: 150 } },
  // ─── KI-Achievements ──────────────────────────────────────────
  { id: "ai_verify_1",  name: "Ehrlicher Hunter",      icon: "📸", iconSrc: QUEST_ICONS.daily,     desc: "Beweise eine Quest mit einem Foto",   cat: "misc",   check: s => (s.ai?.verifiedQuests || 0) >= 1,  reward: { xp: 100, gold: 50 } },
  { id: "ai_verify_10", name: "Transparenter Krieger", icon: "🏅", iconSrc: NAV_ICONS.achievements, desc: "Beweise 10 Quests mit Fotos",          cat: "misc",   check: s => (s.ai?.verifiedQuests || 0) >= 10, reward: { xp: 500, gold: 200, title: "Verified Hunter" } },
  { id: "ai_scan_1",    name: "Digitaler Scanner",     icon: "🔍", iconSrc: QUEST_ICONS.chain,      desc: "Scanne Aufgaben von einem Foto",      cat: "misc",   check: s => (s.ai?.scannedTasks || 0) >= 1,    reward: { xp: 100, gold: 50 } },
  { id: "ai_scan_10",   name: "Paperless Hunter",      icon: "📱", iconSrc: NAV_ICONS.analytics,   desc: "Scanne 10 Aufgabenblätter",           cat: "misc",   check: s => (s.ai?.scannedTasks || 0) >= 10,   reward: { xp: 500, gold: 200 } },
];

// ─── SKILLS ───────────────────────────────────────────────────
export const SKILLS = [
  { id: "power_strike", name: "Power Strike", icon: "⚔️", iconSrc: SKILL_ICONS.attack, stat: "str", threshold: 10, desc: "+5% XP aus STR-Quests", effect: { type: "xp_bonus_cat", cat: "str", bonus: 0.05 } },
  { id: "berserker", name: "Berserker Instinct", icon: "🔥", iconSrc: SKILL_ICONS.attack, stat: "str", threshold: 25, desc: "+15% XP aus Hard & Boss Quests", effect: { type: "xp_hard_bonus", bonus: 0.15 } },
  { id: "quick_learner", name: "Quick Learner", icon: "📖", iconSrc: SKILL_ICONS.magic, stat: "int", threshold: 10, desc: "+5% XP aus INT-Quests", effect: { type: "xp_bonus_cat", cat: "int", bonus: 0.05 } },
  { id: "tactical_mind", name: "Tactical Mind", icon: "🧠", iconSrc: SKILL_ICONS.magic, stat: "int", threshold: 25, desc: "+10% Dungeon Erfolgswahrscheinlichkeit", effect: { type: "dungeon_bonus", bonus: 10 } },
  { id: "resilience", name: "Resilience", icon: "🛡️", iconSrc: SKILL_ICONS.defense, stat: "vit", threshold: 10, desc: "1 Tag Streak-Schutz", effect: { type: "streak_shield", days: 1 } },
  { id: "iron_will", name: "Iron Will", icon: "💪", iconSrc: SKILL_ICONS.defense, stat: "vit", threshold: 25, desc: "+2 Tage Streak-Schutz", effect: { type: "streak_shield", days: 2 } },
  { id: "swift_fingers", name: "Swift Fingers", icon: "💨", iconSrc: SKILL_ICONS.speed, stat: "agi", threshold: 10, desc: "+5% Gold aus allen Quests", effect: { type: "gold_bonus", bonus: 0.05 } },
  { id: "shadow_step", name: "Shadow Step", icon: "🌑", iconSrc: SKILL_ICONS.speed, stat: "agi", threshold: 25, desc: "+10% Erfolg mit AGI-Strategie", effect: { type: "strat_bonus", strat: "agi", bonus: 10 } },
  { id: "presence", name: "Sovereign Presence", icon: "👥", iconSrc: SKILL_ICONS.magic, stat: "cha", threshold: 10, desc: "+3% XP Bonus global", effect: { type: "xp_global", bonus: 0.03 } },
  { id: "cmd_aura", name: "Commanding Aura", icon: "👑", iconSrc: SYSTEM_ICONS.logo, stat: "cha", threshold: 25, desc: "Schatten-Boss-Quests +30% XP", effect: { type: "shadow_xp", bonus: 0.30 } },
];

// ─── DUNGEON MODIFIERS ────────────────────────────────────────
export const DUNGEON_MODIFIERS = [
  { id: "blood_moon", name: "Blood Moon", icon: "🌙", iconSrc: DUNGEON_ICONS.bloodmoon, desc: "+50% XP, +15% Schwierigkeit", xpMult: 1.5, diffMod: 15, color: "#ef4444" },
  { id: "dense_mana", name: "Dense Mana", icon: "💜", iconSrc: DUNGEON_ICONS.densemana, desc: "INT-Strategien +20% Erfolg", intBonus: 20, color: "#a78bfa" },
  { id: "blessing", name: "Hunter's Bless", icon: "✨", iconSrc: STAT_ICONS.int, desc: "+10% Erfolg für alle Gates", successBonus: 10, color: "#f59e0b" },
  { id: "shadow_surge", name: "Shadow Surge", icon: "🌑", iconSrc: SHADOW_ICONS.commander, desc: "Boss-Quest XP x2", shadowXpMult: 2.0, color: "#6366f1" },
  { id: "double_loot", name: "Double Loot", icon: "💰", iconSrc: ITEM_ICONS.ring, desc: "+60% Gold aus Dungeons", goldMult: 1.6, color: "#22c55e" },
  { id: "none", name: "Stable Gates", icon: "🌀", iconSrc: GATE_ICONS.normal, desc: "Keine besonderen Bedingungen", color: "#64748b" },
];

// ─── FLOOR TYPES ──────────────────────────────────────────────
export const FLOOR_TYPES = {
  combat:    { name: "Combat",    icon: "⚔️", iconSrc: SKILL_ICONS.attack,          color: "#ef4444", desc: "Gegner blockieren den Weg",        safeRoom: false },
  elite:     { name: "Elite",     icon: "💀", iconSrc: DUNGEON_ICONS.floorElite,     color: "#a855f7", desc: "Mächtiger Elite-Gegner",            safeRoom: false },
  puzzle:    { name: "Puzzle",    icon: "🔮", iconSrc: DUNGEON_ICONS.floorPuzzle,    color: "#3b82f6", desc: "Magisches Rätsel – INT hilft",       safeRoom: false },
  trap:      { name: "Trap",      icon: "⚡", iconSrc: SKILL_ICONS.speed,            color: "#f59e0b", desc: "Fallen-Korridor – AGI gefragt",      safeRoom: false },
  safe_room: { name: "Safe Room", icon: "🏕️", iconSrc: GATE_ICONS.saferoom,          color: "#22c55e", desc: "Erholungsraum – Heilt Ausdauer",    safeRoom: true  },
  treasure:  { name: "Treasure",  icon: "💰", iconSrc: DUNGEON_ICONS.floorTreasure,    color: "#fbbf24", desc: "Schatzkammer – Bonus-Gold",          safeRoom: false },
  ambush:    { name: "Ambush",    icon: "🗡️", iconSrc: SHADOW_ICONS.assassin,        color: "#dc2626", desc: "Hinterhalt! Vorsicht geboten",       safeRoom: false },
  boss_arena:{ name: "Boss Arena",icon: "👑", iconSrc: DIFF_ICONS.boss,              color: "#e879f9", desc: "Endboss-Kammer",                     safeRoom: false },
};

// ─── BOSS PHASES ──────────────────────────────────────────────
export const BOSS_PHASES = {
  E: [
    { phase: 1, name: "Awakening", hp: 100, desc: "Boss erwacht aus dem Schlaf", icon: "👹", iconSrc: BOSS_ICONS.awakening, atkMod: 1.0, color: "#6b7280" },
    { phase: 2, name: "Frenzy", hp: 50, desc: "Boss greift wild um sich!", icon: "😤", iconSrc: BOSS_ICONS.unleashed, atkMod: 1.5, color: "#f59e0b" },
    { phase: 3, name: "Last Stand", hp: 20, desc: "Verzweifelte letzte Anstrengung", icon: "💀", iconSrc: BOSS_ICONS.deathsdoor, atkMod: 2.0, color: "#ef4444" },
  ],
  D: [
    { phase: 1, name: "Dominant", hp: 100, desc: "Boss dominiert das Schlachtfeld", icon: "🏯", iconSrc: BOSS_ICONS.awakening, atkMod: 1.0, color: "#22d3ee" },
    { phase: 2, name: "Berserker", hp: 60, desc: "Boss verfällt in den Berserkermodus!", icon: "🔥", iconSrc: BOSS_ICONS.unleashed, atkMod: 1.6, color: "#f59e0b" },
    { phase: 3, name: "Death's Door", hp: 25, desc: "Boss kämpft ums Überleben!", icon: "☠️", iconSrc: BOSS_ICONS.deathsdoor, atkMod: 2.2, color: "#ef4444" },
  ],
  C: [
    { phase: 1, name: "Composed", hp: 100, desc: "Boss bleibt kalkulierend", icon: "❄️", iconSrc: BOSS_ICONS.awakening, atkMod: 1.0, color: "#34d399" },
    { phase: 2, name: "Unleashed", hp: 65, desc: "Boss entfesselt versteckte Macht!", icon: "💥", iconSrc: BOSS_ICONS.unleashed, atkMod: 1.7, color: "#a78bfa" },
    { phase: 3, name: "Omega Form", hp: 30, desc: "Boss erreicht seine ultimative Form!", icon: "🌌", iconSrc: BOSS_ICONS.calamity, atkMod: 2.5, color: "#e879f9" },
  ],
  B: [
    { phase: 1, name: "Sovereign", hp: 100, desc: "Boss regiert das Schlachtfeld", icon: "🐉", iconSrc: BOSS_ICONS.awakening, atkMod: 1.2, color: "#a78bfa" },
    { phase: 2, name: "Ascended", hp: 70, desc: "Boss steigt auf eine höhere Ebene!", icon: "🌑", iconSrc: BOSS_ICONS.unleashed, atkMod: 1.9, color: "#6366f1" },
    { phase: 3, name: "True Form", hp: 35, desc: "Boss enthüllt seine wahre Gestalt!", icon: "👁️", iconSrc: BOSS_ICONS.calamity, atkMod: 2.8, color: "#ef4444" },
  ],
  A: [
    { phase: 1, name: "Majestic", hp: 100, desc: "Boss demonstriert überwältigende Macht", icon: "🏰", iconSrc: BOSS_ICONS.awakening, atkMod: 1.3, color: "#f59e0b" },
    { phase: 2, name: "Catastrophic", hp: 70, desc: "Katastrophale Energie entweicht!", icon: "⚡", iconSrc: BOSS_ICONS.unleashed, atkMod: 2.1, color: "#dc2626" },
    { phase: 3, name: "Calamity", hp: 40, desc: "Katastrophenform aktiviert!", icon: "🌪️", iconSrc: BOSS_ICONS.calamity, atkMod: 3.0, color: "#e879f9" },
  ],
  S: [
    { phase: 1, name: "Monarch", hp: 100, desc: "Ein Monarch betritt das Feld", icon: "👑", iconSrc: BOSS_ICONS.awakening, atkMod: 1.5, color: "#e879f9" },
    { phase: 2, name: "Transcendent", hp: 75, desc: "Transzendiert Zeit und Raum!", icon: "🌌", iconSrc: BOSS_ICONS.unleashed, atkMod: 2.5, color: "#f59e0b" },
    { phase: 3, name: "World Ender", hp: 45, desc: "Die Welt bebt – Alles oder Nichts!", icon: "💀", iconSrc: BOSS_ICONS.calamity, atkMod: 4.0, color: "#ef4444" },
  ],
};

// ─── QUEST TYPES CONFIG ───────────────────────────────────────
export const QUEST_TYPES_CONFIG = {
  side: { label: "Side", color: "#a78bfa", icon: "📋", iconSrc: NAV_ICONS.goals, xpMult: 1.0, goldMult: 1.0 },
  daily: { label: "Daily", color: "#22d3ee", icon: "📅", iconSrc: QUEST_ICONS.daily, xpMult: 1.2, goldMult: 1.2 },
  weekly: { label: "Weekly", color: "#8b5cf6", icon: "📆", iconSrc: QUEST_ICONS.weekly, xpMult: 2.0, goldMult: 2.0 },
  emergency: { label: "Emergency", color: "#ef4444", icon: "🚨", iconSrc: QUEST_ICONS.emergency, xpMult: 2.5, goldMult: 2.5 },
  chained: { label: "Chained", color: "#f59e0b", icon: "⛓️", iconSrc: QUEST_ICONS.chain, xpMult: 1.0, goldMult: 1.0 },
  hidden: { label: "Hidden", color: "#6366f1", icon: "❓", iconSrc: QUEST_ICONS.hidden, xpMult: 3.0, goldMult: 3.0 },
};

// ─── EQUIPMENT ────────────────────────────────────────────────
export const EQUIPMENT_POOL = [
  { id: "iron_dagger", slot: "weapon", name: "Iron Dagger", rarity: "common", icon: "🗡️", iconSrc: ITEM_ICONS.blade, ranks: ["E"], bonus: { xpBonus: 0.03 }, desc: "+3% XP" },
  { id: "hunters_blade", slot: "weapon", name: "Hunter's Blade", rarity: "uncommon", icon: "⚔️", iconSrc: ITEM_ICONS.blade, ranks: ["D"], bonus: { xpBonus: 0.06 }, desc: "+6% XP" },
  { id: "shadow_sword", slot: "weapon", name: "Shadow Sword", rarity: "rare", icon: "🌑", iconSrc: ITEM_ICONS.blade, ranks: ["C"], bonus: { xpBonus: 0.10, goldBonus: 0.05 }, desc: "+10% XP, +5% Gold" },
  { id: "void_blade", slot: "weapon", name: "Void Blade", rarity: "epic", icon: "💜", iconSrc: ITEM_ICONS.blade, ranks: ["B"], bonus: { xpBonus: 0.15, strBonus: 5 }, desc: "+15% XP, +5 STR" },
  { id: "demon_king_blade", slot: "weapon", name: "Demon King's Blade", rarity: "legendary", icon: "🔱", iconSrc: ITEM_ICONS.blade, ranks: ["A", "S"], bonus: { xpBonus: 0.25, strBonus: 10, goldBonus: 0.10 }, desc: "+25% XP, +10 STR, +10% Gold" },
  { id: "leather_armor", slot: "armor", name: "Leather Armor", rarity: "common", icon: "🧥", iconSrc: ITEM_ICONS.armor, ranks: ["E"], bonus: { streakShield: 1 }, desc: "+1 Streak-Schutz" },
  { id: "hunters_coat", slot: "armor", name: "Hunter's Coat", rarity: "uncommon", icon: "🥋", iconSrc: ITEM_ICONS.armor, ranks: ["D"], bonus: { streakShield: 1, dungeonBonus: 5 }, desc: "+1 Schutz, +5% Dungeon" },
  { id: "shadow_armor", slot: "armor", name: "Shadow Armor", rarity: "rare", icon: "🛡️", iconSrc: ITEM_ICONS.armor, ranks: ["C"], bonus: { streakShield: 2, dungeonBonus: 8 }, desc: "+2 Schutz, +8% Dungeon" },
  { id: "void_plate", slot: "armor", name: "Void Plate", rarity: "epic", icon: "💠", iconSrc: ITEM_ICONS.armor, ranks: ["B"], bonus: { streakShield: 3, dungeonBonus: 12, vitBonus: 5 }, desc: "+3 Schutz, +12% Dungeon, +5 VIT" },
  { id: "monarch_robes", slot: "armor", name: "Monarch's Robes", rarity: "legendary", icon: "👑", iconSrc: ITEM_ICONS.armor, ranks: ["A", "S"], bonus: { streakShield: 5, dungeonBonus: 20, vitBonus: 10 }, desc: "+5 Schutz, +20% Dungeon, +10 VIT" },
  { id: "copper_ring", slot: "ring", name: "Copper Ring", rarity: "common", icon: "💍", iconSrc: ITEM_ICONS.ring, ranks: ["E", "D"], bonus: { goldBonus: 0.05 }, desc: "+5% Gold" },
  { id: "mana_ring", slot: "ring", name: "Mana Ring", rarity: "uncommon", icon: "🔮", iconSrc: ITEM_ICONS.ring, ranks: ["C"], bonus: { xpBonus: 0.05, intBonus: 3 }, desc: "+5% XP, +3 INT" },
  { id: "shadow_ring", slot: "ring", name: "Shadow Ring", rarity: "rare", icon: "🌀", iconSrc: ITEM_ICONS.ring, ranks: ["B"], bonus: { xpBonus: 0.08, goldBonus: 0.08, agiBonus: 3 }, desc: "+8% XP+Gold, +3 AGI" },
  { id: "monarch_signet", slot: "ring", name: "Monarch's Signet", rarity: "legendary", icon: "💎", iconSrc: ITEM_ICONS.ring, ranks: ["S"], bonus: { xpBonus: 0.15, goldBonus: 0.15, chaBonus: 10 }, desc: "+15% XP+Gold, +10 CHA" },
];

export const RARITY_COLORS = { common: "#6b7280", uncommon: "#22c55e", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b" };
export const RARITY_LABELS = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary" };

// ─── DUNGEONS ─────────────────────────────────────────────────
export const DUNGEON_TEMPLATES = [
  { id: "goblin_lair", name: "Goblin Lair", desc: "Verseuchte Höhle voller Goblins", rank: "E", requirements: { str: 5 }, primaryStat: "str", xp: 200, gold: 150, floors: 2 },
  { id: "cursed_forest", name: "Cursed Forest", desc: "Magische Fallen im dunklen Wald", rank: "E", requirements: { int: 5 }, primaryStat: "int", xp: 180, gold: 140, floors: 2 },
  { id: "dark_cave", name: "Dark Cave", desc: "Untote in verlassenen Minen", rank: "E", requirements: { vit: 5 }, primaryStat: "vit", xp: 190, gold: 145, floors: 2 },
  { id: "rat_den", name: "Rat King's Den", desc: "Riesige Ratten und ihr König", rank: "E", requirements: { agi: 5 }, primaryStat: "agi", xp: 170, gold: 135, floors: 2 },
  { id: "library_ruin", name: "Library Ruin", desc: "Ruinen einer alten Bibliothek", rank: "D", requirements: { int: 15, agi: 8 }, primaryStat: "int", xp: 400, gold: 400, floors: 3 },
  { id: "iron_fortress", name: "Iron Fortress", desc: "Stahlharte Festung mit Golem-Wächtern", rank: "D", requirements: { str: 12, vit: 10 }, primaryStat: "str", xp: 420, gold: 450, floors: 3 },
  { id: "shadow_cave", name: "Shadow Cave", desc: "Schattenwesen lauern im Dunkeln", rank: "D", requirements: { agi: 12, int: 10 }, primaryStat: "agi", xp: 380, gold: 350, floors: 3 },
  { id: "ice_palace", name: "Ice Palace", desc: "Eisiger Palast des Winterkönigs", rank: "C", requirements: { vit: 25, str: 20 }, primaryStat: "vit", xp: 800, gold: 1000, floors: 4 },
  { id: "thunder_gate", name: "Thunder Gate", desc: "Portal durchzogen von Blitzen", rank: "C", requirements: { agi: 25, int: 15 }, primaryStat: "agi", xp: 850, gold: 1200, floors: 4 },
  { id: "blood_altar", name: "Blood Altar", desc: "Verfluchter Altar des Dämonenfürsten", rank: "C", requirements: { str: 30, cha: 15 }, primaryStat: "str", xp: 900, gold: 1500, floors: 4 },
  { id: "dragon_nest", name: "Dragon Nest", desc: "Nest des uralten Drachen Verthaxis", rank: "B", requirements: { str: 40, vit: 35, int: 25 }, primaryStat: "str", xp: 1500, gold: 4000, floors: 5 },
  { id: "void_rift", name: "Void Rift", desc: "Riss in der Realität", rank: "B", requirements: { int: 40, agi: 35 }, primaryStat: "int", xp: 1600, gold: 4500, floors: 5 },
  { id: "shadow_castle", name: "Shadow Castle", desc: "Festung des Schattenkönigs", rank: "A", requirements: { str: 60, int: 55, vit: 50, agi: 45 }, primaryStat: "str", xp: 3000, gold: 10000, floors: 7 },
  { id: "monarchs_domain", name: "Monarch's Domain", desc: "Reich eines ursprünglichen Monarchen", rank: "S", requirements: { str: 90, int: 85, vit: 80, agi: 75, cha: 70 }, primaryStat: "str", xp: 6000, gold: 25000, floors: 10 },
];

// ─── SHOP ITEMS ───────────────────────────────────────────────
export const SHOP_ITEMS = [
  { id: "potion_heal", type: "consumable", name: "Elixir of Recovery", cost: 150, minRank: "E", iconSrc: ITEM_ICONS.potion, desc: "Heilt einen gebrochenen Streak sofort (Löscht Shadow Regression)" },
  { id: "extra_slot", type: "consumable", name: "Extra Task Slot", cost: 100, minRank: "E", iconSrc: QUEST_ICONS.daily, desc: "+1 Tagesaufgabe heute" },
  { id: "title_shadow_monarch", type: "title", name: "Shadow Monarch", cost: 500, minRank: "D", iconSrc: SHOP_ICONS.title, desc: "Der König der Schatten" },
  { id: "title_arise", type: "title", name: "ARISE!", cost: 300, minRank: "D", iconSrc: SHOP_ICONS.title, desc: "Erwecke deine Armee" },
  { id: "title_s_hunter", type: "title", name: "S-Rank Hunter", cost: 1000, minRank: "B", iconSrc: SHOP_ICONS.title, desc: "Elite unter den Jägern" },
  { id: "title_sovereign", type: "title", name: "Sovereign", cost: 2000, minRank: "A", iconSrc: SHOP_ICONS.title, desc: "Herrscher über alles" },
  { id: "theme_crimson", type: "theme", name: "Crimson Gate", cost: 400, minRank: "D", iconSrc: SHOP_ICONS.theme, desc: "Rotes Portal-Theme", themeKey: "crimson" },
  { id: "theme_shadow", type: "theme", name: "Shadow Realm", cost: 600, minRank: "C", iconSrc: SHOP_ICONS.theme, desc: "Reich der Schatten", themeKey: "shadow" },
  { id: "theme_ice", type: "theme", name: "Ice Monarch", cost: 800, minRank: "B", iconSrc: SHOP_ICONS.theme, desc: "Eisiger Monarch", themeKey: "ice" },
  { id: "theme_golden", type: "theme", name: "Ruler's Authority", cost: 1200, minRank: "A", iconSrc: SHOP_ICONS.theme, desc: "Goldene Macht", themeKey: "golden" },
];

// ─── GEM SHOP ITEMS ───────────────────────────────────────────
export const GEM_SHOP_ITEMS = [
  { id: "gem_xp_surge", type: "booster", name: "XP Surge Crystal", cost: 15, desc: "+50% XP für 2 Stunden", duration: 7200000, effect: { xpMult: 1.5 }, category: "booster", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_gold_rush", type: "booster", name: "Gold Rush Fragment", cost: 12, desc: "+75% Gold für 2 Stunden", duration: 7200000, effect: { goldMult: 1.75 }, category: "booster", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_double_drop", type: "booster", name: "Double Drop Token", cost: 25, desc: "Doppelte Dungeon-Drops für 24h", duration: 86400000, effect: { dungeonDropMult: 2 }, category: "booster", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_streak_shield", type: "booster", name: "Streak Shield Crystal", cost: 20, desc: "3 Tage absoluter Streak-Schutz", duration: 259200000, effect: { streakShield: true }, category: "booster", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_mega_xp", type: "booster", name: "Mega XP Elixir", cost: 50, desc: "+100% XP für 24 Stunden", duration: 86400000, effect: { xpMult: 2.0 }, category: "booster", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_theme_celestial", type: "theme", name: "Celestial Monarch", cost: 80, desc: "Himmlisches Gold/Weiß Theme", themeKey: "celestial", category: "theme", iconSrc: SHOP_ICONS.theme },
  { id: "gem_theme_void", type: "theme", name: "Void Emperor", cost: 80, desc: "Tiefes Void-Lila Theme", themeKey: "void", category: "theme", iconSrc: SHOP_ICONS.theme },
  { id: "gem_theme_dragon", type: "theme", name: "Dragon's Breath", cost: 120, desc: "Drachenfeuer Orange/Rot Theme", themeKey: "dragon", category: "theme", iconSrc: SHOP_ICONS.theme },
  { id: "gem_theme_starfall", type: "theme", name: "Starfall", cost: 120, desc: "Kosmischer Sternenhimmel", themeKey: "starfall", category: "theme", iconSrc: SHOP_ICONS.theme },
  { id: "gem_theme_blood", type: "theme", name: "Blood Sovereign", cost: 200, desc: "Ultra-Premium Blut-Monarch Theme", themeKey: "blood_sovereign", category: "theme", iconSrc: SHOP_ICONS.theme },
  { id: "gem_title_monarch", type: "title", name: "Monarch of Shadows", cost: 40, desc: "Der wahre Schattenherrscher", category: "title", iconSrc: SHOP_ICONS.title },
  { id: "gem_title_celestial", type: "title", name: "Celestial Hunter", cost: 50, desc: "Jäger des Himmels", category: "title", iconSrc: SHOP_ICONS.title },
  { id: "gem_title_dragon", type: "title", name: "Dragon Slayer", cost: 60, desc: "Bezwinger der Drachen", category: "title", iconSrc: SHOP_ICONS.title },
  { id: "gem_title_void", type: "title", name: "Void Walker", cost: 80, desc: "Wanderer der Leere", category: "title", iconSrc: SHOP_ICONS.title },
  { id: "gem_title_absolute", type: "title", name: "The Absolute Being", cost: 150, desc: "Der Absolute", category: "title", iconSrc: SHOP_ICONS.title },
  { id: "gem_transition_shadow_step", type: "transition", name: "Shadow Step", cost: 35, desc: "Lautloser Blink mit Speed-Cuts, Nachbildern und Schattenklingen.", transitionKey: "shadow_step", category: "transition", iconSrc: JOB_ICONS.shadowstep, previewColor: "#22c55e", rarity: "rare" },
  { id: "gem_transition_red_gate", type: "transition", name: "Red Gate Breach", cost: 60, desc: "Ein rotes Dungeon-Tor reisst die Realitaet auf.", transitionKey: "red_gate", category: "transition", iconSrc: GATE_ICONS.red, previewColor: "#ef4444", rarity: "epic" },
  { id: "gem_transition_frost", type: "transition", name: "Frost Monarch Seal", cost: 60, desc: "Eisige Runen, gefrorenes Glas und ein kristallklarer Shatter-Reveal.", transitionKey: "frost_seal", category: "transition", iconSrc: GATE_ICONS.ice, previewColor: "#38bdf8", rarity: "epic" },
  { id: "gem_transition_dragon", type: "transition", name: "Dragon's Breath", cost: 95, desc: "Flammenkreis, Aschefunken und ein brennender Portal-Durchbruch.", transitionKey: "dragons_breath", category: "transition", iconSrc: STORY_ICONS.dragon, previewColor: "#f97316", rarity: "legendary" },
  { id: "gem_transition_celestial", type: "transition", name: "Celestial Judgment", cost: 120, desc: "Goldene Lichtlanzen und Herrscher-Geometrie im First-Class-Look.", transitionKey: "celestial_judgment", category: "transition", iconSrc: STORY_ICONS.scales, previewColor: "#facc15", rarity: "legendary" },
  { id: "gem_transition_system", type: "transition", name: "System Override", cost: 140, desc: "Terminal-Glitches, Hex-Fragmente und ein kompletter Interface-Rewrite.", transitionKey: "system_override", category: "transition", iconSrc: STORY_ICONS.systeminit, previewColor: "#22f5c7", rarity: "mythic" },
  { id: "gem_transition_eclipse", type: "transition", name: "Arise: Eclipse Monarch", cost: 220, desc: "Ultra-Premium Eclipse, Schattenkrone und aufsteigende Monarch-Partikel.", transitionKey: "eclipse_monarch", category: "transition", iconSrc: STORY_ICONS.arise, previewColor: "#c084fc", rarity: "mythic" },
  { id: "gem_aura_crimson", type: "cosmetic", name: "Shadow Aura: Crimson", cost: 30, desc: "Rote Aura für alle Shadows", effect: { auraColor: "#ef4444" }, category: "cosmetic", iconSrc: "/icons/gem.webp" },
  { id: "gem_aura_celestial", type: "cosmetic", name: "Shadow Aura: Celestial", cost: 30, desc: "Goldene Aura für alle Shadows", effect: { auraColor: "#fbbf24" }, category: "cosmetic", iconSrc: "/icons/gem.webp" },
  { id: "gem_aura_void", type: "cosmetic", name: "Shadow Aura: Void", cost: 30, desc: "Violette Void-Aura", effect: { auraColor: "#a855f7" }, category: "cosmetic", iconSrc: "/icons/gem.webp" },
  { id: "gem_nameplate_ancient", type: "cosmetic", name: "Ancient Nameplate", cost: 20, desc: "Antikes Namensschild für Shadows", category: "cosmetic", iconSrc: "/icons/gem.webp" },
  { id: "gem_quest_skip", type: "consumable", name: "Quest Timer Skip", cost: 5, desc: "Überspringt die Wartezeit einer Quest", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_extra_slot", type: "consumable", name: "Premium Quest Slot", cost: 8, desc: "+1 Extra Quest-Slot für heute", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_dungeon_refresh", type: "consumable", name: "Dungeon Refresh", cost: 10, desc: "Generiere sofort neue Dungeons", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_shadow_rename", type: "consumable", name: "Shadow Rename Token", cost: 15, desc: "Benenne einen Shadow um", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_stat_reset", type: "consumable", name: "Stat Reset Scroll", cost: 30, desc: "Alle Stat-Punkte zurücksetzen und neu verteilen", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
  { id: "gem_path_reset", type: "consumable", name: "Path Reset Crystal", cost: 40, desc: "Wähle deine 3 Wege (Lebensbereiche) neu — max. 1x pro Woche", category: "convenience", repeatable: true, iconSrc: "/icons/gem.webp" },
];

// ─── THEMES ───────────────────────────────────────────────────
// Each theme carries color tokens + optional spacing/radius overrides.
// CSS counterpart: styles/tokens.css (set via data-theme attribute).
const _themeBase = {
  spacing: { sm: "8px", md: "16px", lg: "24px", xl: "32px" },
  radius: { sm: "6px", md: "10px", lg: "14px", xl: "18px", full: "9999px" },
};
export const THEMES = {
  default: { ..._themeBase, primary: "#22d3ee", secondary: "#a855f7", glow: "rgba(34,211,238,0.35)", accent: "#67e8f9", bg: "#06060e", card: "rgba(10,10,22,0.88)", surface: "rgba(16,16,36,0.6)" },
  crimson: { ..._themeBase, primary: "#dc2626", secondary: "#991b1b", glow: "rgba(220,38,38,0.35)", accent: "#fca5a5", bg: "#0a0808", card: "rgba(24,12,12,0.85)", surface: "rgba(40,20,20,0.6)" },
  shadow: { ..._themeBase, primary: "#6366f1", secondary: "#4338ca", glow: "rgba(99,102,241,0.35)", accent: "#a5b4fc", bg: "#06060f", card: "rgba(10,10,28,0.85)", surface: "rgba(18,18,42,0.6)" },
  ice: { ..._themeBase, primary: "#06b6d4", secondary: "#0891b2", glow: "rgba(6,182,212,0.35)", accent: "#a5f3fc", bg: "#060a0f", card: "rgba(10,16,28,0.85)", surface: "rgba(16,24,42,0.6)" },
  golden: { ..._themeBase, primary: "#d97706", secondary: "#b45309", glow: "rgba(217,119,6,0.35)", accent: "#fde68a", bg: "#0a0806", card: "rgba(24,20,12,0.85)", surface: "rgba(40,32,18,0.6)" },
  celestial: { ..._themeBase, primary: "#daa520", secondary: "#f5deb3", glow: "rgba(218,165,32,0.35)", accent: "#ffe4b5", bg: "#0a0806", card: "rgba(22,18,12,0.88)", surface: "rgba(36,30,20,0.6)" },
  void: { ..._themeBase, primary: "#7c3aed", secondary: "#581c87", glow: "rgba(124,58,237,0.35)", accent: "#c4b5fd", bg: "#08060f", card: "rgba(14,10,28,0.88)", surface: "rgba(22,16,42,0.6)" },
  dragon: { ..._themeBase, primary: "#ea580c", secondary: "#9a3412", glow: "rgba(234,88,12,0.35)", accent: "#fdba74", bg: "#0a0604", card: "rgba(24,14,8,0.88)", surface: "rgba(38,22,14,0.6)" },
  starfall: { ..._themeBase, primary: "#818cf8", secondary: "#4f46e5", glow: "rgba(129,140,248,0.35)", accent: "#e0e7ff", bg: "#060610", card: "rgba(10,10,26,0.88)", surface: "rgba(18,18,44,0.6)" },
  blood_sovereign: { ..._themeBase, primary: "#be123c", secondary: "#881337", glow: "rgba(190,18,60,0.35)", accent: "#fda4af", bg: "#0a0406", card: "rgba(24,10,14,0.88)", surface: "rgba(38,16,22,0.6)" },
};
