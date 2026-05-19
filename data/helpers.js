// ─── HELPERS ──────────────────────────────────────────────────
// Extracted from data/constants.jsx
// Contains all game-logic utility functions and job XP configuration.

import { RANKS, DUNGEON_MODIFIERS, SKILLS, ACHIEVEMENTS, DUNGEON_TEMPLATES, EQUIPMENT_POOL, SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS } from "./gameData.js";
import { JOBS } from "./jobs.js";
import { QUEST_POOL } from "./questPool.js";
import { getSystemQuestPoolForLocale, localizeQuestTemplate } from "./localizedQuestPool.js";
import { getToday } from "./dateUtils.js";
import { getStateLocale, resolveLocale, translate } from "./i18n.js";
import { getQuestKey, normalizeQuestForStorage } from "./questUtils.js";

// ─── JOB XP CONFIG ────────────────────────────────────────────
export const JOB_XP_SOURCES = {
  aligned_quest: 10,
  aligned_dungeon: 50,
  job_quest: 100,
  shadow_synergy: 25,
  boss_kill: 75,
};
export const JOB_XP_LEVELS = [
  0,    // Level 0 (nicht freigeschaltet)
  0,    // Level 1 (Start)
  100,  // Level 2
  250,  // Level 3
  500,  // Level 4
  1000, // Level 5 (Active Ability)
  1750, // Level 6
  2750, // Level 7
  4000, // Level 8
  5500, // Level 9
  7500  // Level 10 (Grand Master)
];
export const JOB_TITLES = {
  1: "Novice",
  3: "Adept",
  5: "Expert",
  7: "Master",
  10: "Grand Master"
};

// ─── CORE HELPERS ─────────────────────────────────────────────
export const getRank = (lv) => RANKS.find(r => lv >= r.minLv && lv <= r.maxLv) || RANKS[0];
export const getXpForLevel = (lv) => getRank(lv).xpPerLv;
export const getRankIndex = (n) => RANKS.findIndex(r => r.name === n);
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export { getToday };

export function getDailyModifier() {
  const seed = parseInt(getToday().replace(/-/g, "")) % DUNGEON_MODIFIERS.length;
  return DUNGEON_MODIFIERS[seed];
}

export function calcPowerLevel(stats, level) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return Math.round(total * (1 + level * 0.08));
}

export function getEquipBonuses(equipment) {
  const bonuses = { xpBonus: 0, goldBonus: 0, dungeonBonus: 0, streakShield: 0, strBonus: 0, intBonus: 0, vitBonus: 0, agiBonus: 0, chaBonus: 0 };
  if (!equipment?.slots) return bonuses;
  Object.values(equipment.slots).forEach(item => {
    if (!item) return;
    Object.entries(item.bonus || {}).forEach(([k, v]) => { bonuses[k] = (bonuses[k] || 0) + v; });
  });
  return bonuses;
}

export function checkSkillUnlocks(stats) { return SKILLS.filter(sk => (stats[sk.stat] || 0) >= sk.threshold); }

export function getSkillBonuses(skills, stats) {
  const bonuses = { xpCatBonus: {}, xpHardBonus: 0, dungeonBonus: 0, streakShield: 0, goldBonus: 0, stratBonus: {}, xpGlobal: 0, shadowXpMult: 1 };
  checkSkillUnlocks(stats).forEach(skill => {
    const e = skill.effect;
    if (e.type === "xp_bonus_cat") bonuses.xpCatBonus[e.cat] = (bonuses.xpCatBonus[e.cat] || 0) + e.bonus;
    if (e.type === "xp_hard_bonus") bonuses.xpHardBonus += e.bonus;
    if (e.type === "dungeon_bonus") bonuses.dungeonBonus += e.bonus;
    if (e.type === "streak_shield") bonuses.streakShield += e.days;
    if (e.type === "gold_bonus") bonuses.goldBonus += e.bonus;
    if (e.type === "strat_bonus") bonuses.stratBonus[e.strat] = (bonuses.stratBonus[e.strat] || 0) + e.bonus;
    if (e.type === "xp_global") bonuses.xpGlobal += e.bonus;
    if (e.type === "shadow_xp") bonuses.shadowXpMult = (bonuses.shadowXpMult || 1) + e.bonus;
  });
  return bonuses;
}

export function checkAchievements(state) {
  const unlocked = state.achievements?.unlocked || [];
  const newOnes = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    try { if (ach.check(state)) newOnes.push(ach); } catch { }
  }
  return newOnes;
}

export function generateDungeons(playerRankName) {
  const rankIdx = getRankIndex(playerRankName);
  const pool = DUNGEON_TEMPLATES.filter(d => {
    const dIdx = getRankIndex(d.rank);
    return dIdx >= Math.max(0, rankIdx - 1) && dIdx <= Math.min(RANKS.length - 1, rankIdx + 1);
  });
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return shuffled.slice(0, 3).map(d => ({ ...d, instanceId: genId(), cleared: false, expiresAt: expires }));
}

export const STARTER_QUEST_TEMPLATE_IDS = [
  "qp_str_01",
  "qp_int_01",
  "qp_vit_01",
  "qp_agi_01",
];

export function generateStarterQuests(languageMode = "auto") {
  const today = getToday();
  const locale = resolveLocale(languageMode);
  return STARTER_QUEST_TEMPLATE_IDS
    .map(templateId => QUEST_POOL.find(q => q.id === templateId))
    .filter(Boolean)
    .map(q => localizeQuestTemplate(q, locale))
    .map((q, index) => normalizeQuestForStorage({
      ...q,
      id: `starter_${genId()}`,
      templateId: q.templateId || q.id,
      type: "daily",
      isSystem: true,
      isStarter: true,
      createdAt: today,
      dueDate: today,
      priority: index === 0 ? "high" : "medium",
      energy: index === 0 ? "medium" : "low",
      origin: "starter",
    }));
}

export function generateDailySystemQuests(count = 3, state = null) {
  const level = state?.level || 1;
  const stats = state?.stats || { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
  const locale = getStateLocale(state);
  const today = getToday();
  const activeQuestKeys = new Set((state?.quests || []).filter(q => !q.completed).map(getQuestKey));

  // Pool nach Level filtern
  const validPool = getSystemQuestPoolForLocale(locale).filter(q => level >= (q.minLevel || 1));

  // Finde stärkste Defizite
  let lowestStat = null;
  let lowestVal = Infinity;
  let highestVal = -1;
  Object.entries(stats).forEach(([stat, val]) => {
    if (val < lowestVal) { lowestVal = val; lowestStat = stat; }
    if (val > highestVal) { highestVal = val; }
  });

  const needsDeficiencyFocus = (highestVal - lowestVal >= 3) || (level >= 5 && lowestStat);

  const selected = [];
  const generatedIds = new Set();

  if (needsDeficiencyFocus && lowestStat && selected.length < count) {
    const penaltyPool = validPool.filter(q => q.category === lowestStat);
    if (penaltyPool.length > 0) {
      const penaltyQ = penaltyPool[Math.floor(Math.random() * penaltyPool.length)];
      generatedIds.add(penaltyQ.id);
      selected.push(normalizeQuestForStorage({
        ...penaltyQ,
        id: `sys_${genId()}`,
        templateId: penaltyQ.templateId || penaltyQ.id,
        type: "daily",
        isSystem: true,
        xpMult: 1.5,
        systemMessage: translate(locale, "quests.deficiencyMessage", { stat: lowestStat.toUpperCase() }),
        createdAt: today,
        dueDate: today,
      }));
    }
  }

  // --- Inject Screen Time OCR Quest only when the feature is configured ---
  const screenTimeQuestKey = `screen_time_quest:${today}`;
  if (state?.screenTimePreferences?.enabled && selected.length < count && !activeQuestKeys.has(screenTimeQuestKey)) {
    const limitMinutes = state?.screenTimePreferences?.dailyLimitMinutes || 120;
    const hours = Math.floor(limitMinutes / 60);
    const minutes = limitMinutes % 60;
    const timeString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

    generatedIds.add("screen_time_quest");
    selected.push(normalizeQuestForStorage({
      id: `sys_screentime_${genId()}`,
      templateId: "screen_time_quest",
      questKey: screenTimeQuestKey,
      title: translate(locale, "quests.screenTimeTitle", { time: timeString }),
      description: translate(locale, "quests.screenTimeDesc"),
      category: "int",
      difficulty: "hard", // Making it a bit harder to encourage focus!
      type: "daily",
      isSystem: true,
      isScreenTime: true, // Special flag for our Modal intercept
      xpMult: 2.0,
      goldMult: 2.5,
      createdAt: today,
      dueDate: today,
    }));
  }

  const shuffled = validPool.filter(q => !generatedIds.has(q.id)).sort(() => Math.random() - 0.5);
  for (const q of shuffled) {
    if (selected.length >= count) break; // Now selected.length will correctly count the injected quest
    selected.push(normalizeQuestForStorage({
      ...q,
      id: `sys_${genId()}`,
      templateId: q.templateId || q.id,
      type: "daily",
      isSystem: true,
      createdAt: today,
      dueDate: today,
    }));
  }

  return selected;
}

/**
 * Async variant: tries to generate quests via AI, falls back to static pool.
 * @param {number} count
 * @param {object} state
 * @param {Function|null} generateFn - async fn from useGeminiAI, returns { quests }
 * @returns {Promise<Array>}
 */
export async function generateDailySystemQuestsAsync(count = 3, state = null, generateFn = null) {
  if (!generateFn) return generateDailySystemQuests(count, state);

  try {
    const aiResult = await Promise.race([
      generateFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);

    if (aiResult?.quests?.length > 0) {
      const today = getToday();
      return aiResult.quests.slice(0, count).map(q => normalizeQuestForStorage({
        ...q,
        id: `sys_ai_${genId()}`,
        type: "daily",
        isSystem: true,
        aiGenerated: true,
        createdAt: today,
        dueDate: today,
      }));
    }
  } catch {
    // Fall through to static pool
  }

  return generateDailySystemQuests(count, state);
}

export function getJobBonuses(state) {
  const bonuses = {
    xpGlobal: 0,
    goldBonus: 0,
    dungeonBonus: 0,
    streakShield: 0,
    shopDiscount: 0,
    xpCatBonus: {},
    stratBonus: {},
    questSpeedBonus: {},
    dungeonTimeReduction: 0,
    floorSkipChance: 0,
    xpGlobalMultiplier: 1.0,
    goldGlobalMultiplier: 1.0,
    dungeonFailureRewards: 0,
    dungeonRetryChance: 0,
    shadowStatBonus: {},
    shadowXpBonus: 0,
    shadowCapacityBonus: 0,
    autoSolvePuzzle: false,
    trapDamageReduction: 0,
    allShadowsActive: false,
  };

  if (!state?.jobs?.current) return bonuses;

  const currentJob = state.jobs.current;
  const level = state.jobs.levels[currentJob] || 0;
  const jobDef = JOBS[currentJob];
  const now = Date.now();
  const cooldowns = state.jobs.activeAbilityCooldowns || {};

  if (currentJob === "berserker") {
    bonuses.questSpeedBonus.str = 0.30;
    if (level >= 3) bonuses.xpCatBonus.str = (bonuses.xpCatBonus.str || 0) + 0.10;
    if (level >= 5) bonuses.stratBonus.str = (bonuses.stratBonus.str || 0) + 20;
    if (level >= 7) bonuses.hardBossXpBonus = 0.25;
    if (cooldowns.rage_mode && now < cooldowns.rage_mode + 3600000) bonuses.xpGlobalMultiplier *= 2.0;
  } else if (currentJob === "archmage") {
    bonuses.xpCatBonus.int = (bonuses.xpCatBonus.int || 0) + 0.30;
    if (level >= 3) bonuses.shopDiscount = Math.floor((state.stats?.int || 0) / 5);
    if (level >= 5) bonuses.stratBonus.int = (bonuses.stratBonus.int || 0) + 15;
    if (level >= 7) bonuses.autoSolvePuzzle = true;
    if (cooldowns.insight && now < cooldowns.insight + 43200000) bonuses.insightActive = true;
  } else if (currentJob === "guardian") {
    bonuses.streakShield += 3;
    if (level >= 3) bonuses.stratBonus.vit = (bonuses.stratBonus.vit || 0) + 15;
    if (level >= 5) bonuses.dungeonFailureRewards = 0.50;
    if (level >= 7) bonuses.streakShield += 3;
    if (cooldowns.fortress && now < cooldowns.fortress + 3600000) bonuses.fortressActive = true;
  } else if (currentJob === "assassin") {
    bonuses.goldBonus += 0.50;
    if (level >= 3) bonuses.stratBonus.agi = (bonuses.stratBonus.agi || 0) + 20;
    if (level >= 5) bonuses.dungeonTimeReduction += 0.20;
    if (level >= 7) bonuses.floorSkipChance += 0.10;
  } else if (currentJob === "monarch") {
    bonuses.xpGlobal += 0.15;
    if (level >= 3) bonuses.shadowCapacityBonus += 10;
    if (level >= 5) bonuses.shadowDungeonParticipation = true;
    if (level >= 7) bonuses.shadowXpBonus += 0.50;
    if (cooldowns.domain_expansion && now < cooldowns.domain_expansion + 3600000) {
      bonuses.xpGlobal *= 2.0;
      bonuses.goldBonus *= 2.0;
      bonuses.dungeonBonus += 20;
    }
  } else if (currentJob === "necromancer") {
    bonuses.shadowExtractionGuaranteed = true;
    if (level >= 3) bonuses.tempShadowsFromDungeon = true;
    if (level >= 5) bonuses.shadowEvolutionDiscount = 0.50;
    if (level >= 7) bonuses.canAwakeNamedShadows = true;
    if (cooldowns.army_of_the_dead && now < cooldowns.army_of_the_dead + 3600000) bonuses.allShadowsActive = true;
  }

  return bonuses;
}

export function calculateLevelUp(state, xpGain) {
  let newXp = (state.xp || 0) + xpGain;
  let newLevel = state.level || 1;
  let levelsGained = 0;

  while (newXp >= getXpForLevel(newLevel) && newLevel < 100) {
    newXp -= getXpForLevel(newLevel);
    newLevel++;
    levelsGained++;
  }

  const didLevelUp = levelsGained > 0;
  const earnedPoints = levelsGained * 1;

  return {
    ...state,
    xp: newXp,
    level: newLevel,
    statPoints: (state.statPoints || 0) + earnedPoints,
    totalXpEarned: (state.totalXpEarned || 0) + xpGain,
    _didLevelUp: didLevelUp,
    _levelsGained: levelsGained,
    _oldLevel: state.level
  };
}

export function recalculateLevelFromTotalXp(state) {
  const totalXp = state.totalXpEarned || state.xp || 0;
  let remainingXp = totalXp;
  let level = 1;

  while (remainingXp >= getXpForLevel(level) && level < 100) {
    remainingXp -= getXpForLevel(level);
    level++;
  }

  return { ...state, level, xp: remainingXp, totalXpEarned: totalXp };
}

export function awardJobXp(state, source, context = {}) {
  if (!state.jobs?.current) return state;

  const currentJob = state.jobs.current;
  const jobDef = JOBS[currentJob];
  let xpGain = 0;

  switch (source) {
    case "quest_complete":
      if (context.category === jobDef.statFocus) {
        xpGain = JOB_XP_SOURCES.aligned_quest;
        if (context.difficulty === "boss") xpGain += JOB_XP_SOURCES.boss_kill;
      }
      break;
    case "dungeon_complete":
      if (context.strategy === jobDef.statFocus) xpGain = JOB_XP_SOURCES.aligned_dungeon;
      break;
    case "job_quest":
      xpGain = JOB_XP_SOURCES.job_quest;
      break;
    case "shadow_mission":
      const synergyShadows = (context.shadows || []).filter(s =>
        jobDef.shadowSynergy?.affectedClasses?.includes(s.class) ||
        jobDef.shadowSynergy?.affectedClasses?.includes("all")
      );
      if (synergyShadows.length > 0) xpGain = JOB_XP_SOURCES.shadow_synergy;
      break;
  }

  if (xpGain === 0) return state;

  const newXp = (state.jobs.xp[currentJob] || 0) + xpGain;
  const currentLevel = state.jobs.levels[currentJob] || 0;
  let newLevel = currentLevel;

  while (newLevel < JOB_XP_LEVELS.length - 1 && newXp >= JOB_XP_LEVELS[newLevel + 1]) {
    newLevel++;
  }

  return {
    ...state,
    jobs: {
      ...state.jobs,
      xp: { ...state.jobs.xp, [currentJob]: newXp },
      levels: { ...state.jobs.levels, [currentJob]: newLevel }
    },
    _jobLevelUp: newLevel > currentLevel ? { job: currentJob, newLevel } : null
  };
}

export function checkJobUnlocked(state, jobKey) {
  const job = JOBS[jobKey];
  if (!job) return false;
  const req = job.unlockRequirement;
  if (state.level < req.level) return false;
  if (req.allJobsLevel5) {
    const allAtFive = Object.keys(JOBS)
      .filter(k => k !== "necromancer")
      .every(k => (state.jobs?.levels?.[k] || 0) >= 5);
    if (!allAtFive) return false;
  }
  if (req.minShadows && (state.shadowArmy?.shadows?.length || 0) < req.minShadows) return false;
  return true;
}

export function checkAllJobsLevel5(state) {
  return Object.keys(JOBS)
    .filter(k => k !== "necromancer")
    .every(k => (state.jobs?.levels?.[k] || 0) >= 5);
}

export function formatCooldown(seconds) {
  if (seconds >= 86400) { const days = Math.floor(seconds / 86400); return `${days} Tag${days > 1 ? "e" : ""}`; }
  if (seconds >= 3600) { const hours = Math.floor(seconds / 3600); return `${hours} Stunde${hours > 1 ? "n" : ""}`; }
  const mins = Math.floor(seconds / 60);
  return `${mins} Minute${mins > 1 ? "n" : ""}`;
}

export function calculateJobQuestProgress(state, task) {
  switch (task.type) {
    case "complete_quests":
      return (state.completedQuests || []).filter(q => {
        if (task.category && q.category !== task.category) return false;
        if (task.difficulty && q.difficulty !== task.difficulty) return false;
        return true;
      }).length;
    case "stat_reach":
      return state.stats?.[task.stat] || 0;
    case "dungeon_clear":
      return (state.dungeonHistory || []).filter(d => {
        if (!d.won) return false;
        if (task.strategy && d.strategy !== task.strategy) return false;
        if (task.rank && d.dungeonRank !== task.rank) return false;
        return true;
      }).length;
    case "own_shadows":
      return state.shadowArmy?.shadows?.length || 0;
    case "own_named_shadow":
      return (state.shadowArmy?.shadows || []).filter(s => s.isNamed).length;
    case "maintain_streak":
      return state.streak || 0;
    case "earn_gold":
      return state.totalGoldEarned || 0;
    default:
      return task.current || 0;
  }
}

export function calcSuccessChance(dungeon, stats, stratKey, skillBonuses, modifier, formationBonus, jobBonuses = {}, playerLevel = 1) {
  let chance = 28;
  const reqs = Object.entries(dungeon.requirements);
  const metCount = reqs.filter(([k, v]) => (stats[k] || 0) >= v).length;
  chance += Math.round((metCount / reqs.length) * 42);
  const statVal = stats[stratKey] || 0;
  const primaryReq = dungeon.requirements[dungeon.primaryStat] || 10;
  const ratio = Math.min(statVal / Math.max(primaryReq, 1), 2.5);
  chance += stratKey === dungeon.primaryStat ? Math.round(ratio * 16) : Math.round(ratio * 7);
  chance += skillBonuses.dungeonBonus || 0;
  if (stratKey === "int" && modifier?.intBonus) chance += modifier.intBonus;
  if (modifier?.successBonus) chance += modifier.successBonus;
  chance += (skillBonuses.stratBonus?.[stratKey] || 0);
  chance += formationBonus?.dungeonBonus || 0;
  chance += (jobBonuses.stratBonus?.[stratKey] || 0);
  chance += (jobBonuses.dungeonBonus || 0);
  if (jobBonuses.fortressActive) return 100;

  let maxChance = 85;
  const dungeonRankIdx = getRankIndex(dungeon.rank);
  const playerRankIdx = getRankIndex(getRank(playerLevel).name);
  const rankDiff = playerRankIdx - dungeonRankIdx;

  if (rankDiff >= 3) maxChance = 100;
  else if (rankDiff === 2) maxChance = 95;
  else if (rankDiff === 1) maxChance = 90;

  return Math.max(10, Math.min(maxChance, Math.round(chance)));
}

export function getEquipDropForDungeon(dungeonRank) {
  if (Math.random() > 0.40) return null;
  const pool = EQUIPMENT_POOL.filter(e => e.ranks.includes(dungeonRank));
  if (!pool.length) return null;
  return { ...pool[Math.floor(Math.random() * pool.length)], instanceId: genId() };
}

export function hoursUntilMidnight() {
  const now = new Date(), midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 3600000);
}

// ─── SHADOW HELPERS ───────────────────────────────────────────
export function assignShadowClass(quest, playerLevel) {
  if (quest.difficulty === "boss") {
    const roll = Math.random();
    if (playerLevel >= 50 && roll < 0.05) return "commander";
    if (roll < 0.25) return "knight";
    if (roll < 0.45) return "assassin";
    return "soldier";
  }
  const catMap = { str: "knight", int: "mage", vit: "healer", agi: "assassin", cha: "soldier" };
  return catMap[quest.category] || "soldier";
}

export function assignShadowTier(quest) {
  const diffMap = { easy: 1, normal: 1, hard: 2, boss: 3 };
  return diffMap[quest.difficulty] || 1;
}

export function calcShadowXpToNext(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function createShadowFromQuest(quest, playerLevel) {
  const cls = assignShadowClass(quest, playerLevel);
  const tier = assignShadowTier(quest);
  const clsData = SHADOW_CLASSES[cls];
  const tierData = SHADOW_TIERS[tier];
  const baseStats = clsData.baseStats;
  return {
    id: genId(),
    name: quest.title,
    originalSource: quest.title,
    sourceDate: getToday(),
    class: cls,
    tier,
    isNamed: false,
    level: 1,
    xp: 0,
    xpToNext: calcShadowXpToNext(1),
    stats: {
      power: Math.round(baseStats.power * tierData.statMult),
      speed: Math.round(baseStats.speed * tierData.statMult),
      loyalty: Math.round(baseStats.loyalty * tierData.statMult),
      presence: Math.round(baseStats.presence * tierData.statMult),
    },
    abilities: [],
    isDeployed: false,
    deploymentSlot: null,
    evolutionStage: 1,
    glowColor: clsData.color,
    summonsCount: 1,
    dungeonsCleared: 0,
    totalXpGenerated: 0,
  };
}

export function calcFormationBonus(shadowArmy, allShadowsActive = false) {
  if (!shadowArmy) return { dungeonBonus: 0, xpBonus: 0, goldBonus: 0, streakShield: 0 };
  const deployed = (shadowArmy.shadows || []).filter(s => allShadowsActive || s.isDeployed);
  let dungeonBonus = 0, xpBonus = 0, goldBonus = 0, streakShield = 0;
  const vCount = deployed.filter(s => s.deploymentSlot === "vanguard").length;
  const cCount = deployed.filter(s => s.deploymentSlot === "core").length;
  const rCount = deployed.filter(s => s.deploymentSlot === "rearguard").length;
  if (vCount >= 2) dungeonBonus += 15;
  if (cCount >= 3) dungeonBonus += 10;
  if (rCount >= 1) { xpBonus += 20; goldBonus += 20; }
  const named = deployed.filter(s => s.isNamed);
  named.forEach(() => { dungeonBonus += 10; xpBonus += 5; });
  const hasCommander = deployed.some(s => s.class === "commander");
  if (hasCommander) { dungeonBonus += 5; xpBonus += 5; goldBonus += 5; }
  const healerCount = deployed.filter(s => s.class === "healer").length;
  if (healerCount > 0) streakShield += healerCount;
  return { dungeonBonus, xpBonus: xpBonus / 100, goldBonus: goldBonus / 100, streakShield };
}

export function checkNamedShadowUnlocks(state) {
  const earned = [];
  const army = state.shadowArmy;
  if (!army) return earned;
  const alreadyHas = id => army.shadows.some(s => s.id === id || s.namedId === id);

  Object.values(NAMED_SHADOWS).forEach(ns => {
    if (alreadyHas(ns.id)) return;
    const { type, dungeonRank, stat, value } = ns.unlockCondition;
    let unlocked = false;
    if (type === "dungeon_rank") {
      unlocked = (state.dungeonHistory || []).some(d => d.won && d.dungeonRank === dungeonRank);
    } else if (type === "stat") {
      unlocked = (state.stats?.[stat] || 0) >= value;
    } else if (type === "level") {
      unlocked = state.level >= value;
    }
    if (unlocked) earned.push(ns);
  });
  return earned;
}

// ─── FLOOR / DUNGEON HELPERS ──────────────────────────────────
export function generateFloorPlan(dungeon) {
  const totalFloors = dungeon.floors || 3;
  const floors = [];
  for (let f = 1; f <= totalFloors; f++) {
    let type;
    if (f === totalFloors) { type = "boss_arena"; }
    else if (f === 1) { type = "combat"; }
    else {
      const isSafeRoom = totalFloors >= 4 && f === Math.floor(totalFloors / 2);
      if (isSafeRoom) { type = "safe_room"; }
      else {
        const roll = Math.random();
        if (roll < 0.10) type = "treasure";
        else if (roll < 0.22) type = "trap";
        else if (roll < 0.34) type = "puzzle";
        else if (roll < 0.46) type = "elite";
        else if (roll < 0.55) type = "ambush";
        else type = "combat";
      }
    }
    floors.push({ floor: f, type, completed: false, skipped: false });
  }
  return floors;
}

export function getFloorLogs(floor, dungeon, strategy, playerStats, isStrong, isWeak) {
  const ft = { combat: { name: "Combat", icon: "⚔️" }, elite: { name: "Elite", icon: "💀" }, puzzle: { name: "Puzzle", icon: "🔮" }, trap: { name: "Trap", icon: "⚡" }, safe_room: { name: "Safe Room", icon: "🏕️" }, treasure: { name: "Treasure", icon: "💰" }, ambush: { name: "Ambush", icon: "🗡️" }, boss_arena: { name: "Boss Arena", icon: "👑" } }[floor.type] || { name: floor.type, icon: "⚔️" };
  const events = {
    combat: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Gegner in Sichtweite!`, type: "system" },
      { text: isStrong ? "Überwältigende Kraft! Gegner fliehen!" : "Schwerer Kampf – Schritt für Schritt.", type: isStrong ? "success" : "action" },
    ],
    elite: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Ein mächtiger Gegner!`, type: "danger" },
      { text: isWeak ? "⚠ Kritische Gefahr! Alle Reserven mobilisiert!" : "Elite-Gegner konfrontiert – Klinge geschwungen!", type: isWeak ? "danger" : "action" },
    ],
    puzzle: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Runen leuchten auf...`, type: "info" },
      { text: (playerStats.int || 0) >= 15 ? "🧠 Mana-Rätsel entschlüsselt! Weg frei!" : "Rätsel gelöst... fast. Energie verbraucht.", type: "info" },
    ],
    trap: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Boden ist instabil!`, type: "warning" },
      { text: (playerStats.agi || 0) >= 15 ? "⚡ Fallen blitzschnell umgangen!" : "Fallen aktiviert – Schaden genommen!", type: "warning" },
    ],
    safe_room: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Ein sicherer Ort!`, type: "success" },
      { text: "Ausdauer wiederhergestellt. Shadow Army ruht sich aus.", type: "success" },
    ],
    treasure: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – Schätze locken!`, type: "gold" },
      { text: "Schatzkiste geöffnet! Gold-Bonus erhalten.", type: "gold" },
    ],
    ambush: [
      { text: `Boden ${floor.floor}: ${ft.icon} ${ft.name} – HINTERHALT!`, type: "danger" },
      { text: isStrong ? "Hinterhalt abgewehrt! Gegner ausgelöscht!" : "Hinterhalt! Schwere Gegenwehr nötig!", type: isStrong ? "success" : "danger" },
    ],
    boss_arena: [],
  };
  return events[floor.type] || [{ text: `Boden ${floor.floor} betritt...`, type: "system" }];
}

// ─── QUEST HELPERS ────────────────────────────────────────────
const HIDDEN_QUESTS = [
  { id: "hq_shadow_whisper", title: "Shadow's Whisper", desc: "Du hörst eine Stimme im Dunkeln...", category: "cha", difficulty: "hard", triggerCondition: { type: "shadow_count", value: 3 }, discoveryMsg: "Die Stimmen der Gefallenen sprechen zu dir.", reward: { xpMult: 3, goldMult: 3 } },
  { id: "hq_thousand_cuts", title: "A Thousand Cuts", desc: "Kleine Siege führen zum großen Sieg.", category: "agi", difficulty: "normal", triggerCondition: { type: "total_quests", value: 10 }, discoveryMsg: "Deine Ausdauer hat eine verborgene Quest enthüllt.", reward: { xpMult: 3, goldMult: 2 } },
  { id: "hq_iron_resolve", title: "Iron Resolve", desc: "Dein Wille ist stärker als jede Mauer.", category: "vit", difficulty: "hard", triggerCondition: { type: "streak", value: 5 }, discoveryMsg: "Ein Streak von 5 Tagen hat eine verborgene Quest freigeschaltet!", reward: { xpMult: 3, goldMult: 3 } },
  { id: "hq_mind_palace", title: "Mind Palace", desc: "Die Stille zwischen den Gedanken ist Kraft.", category: "int", difficulty: "hard", triggerCondition: { type: "stat_value", stat: "int", value: 20 }, discoveryMsg: "Dein Intellekt hat eine verborgene Kammer geöffnet.", reward: { xpMult: 4, goldMult: 2 } },
  { id: "hq_berserker_trial", title: "Berserker's Trial", desc: "Kämpfe bis zur letzten Kraft.", category: "str", difficulty: "boss", triggerCondition: { type: "stat_value", stat: "str", value: 25 }, discoveryMsg: "Eine legendäre Prüfung erwartet dich.", reward: { xpMult: 5, goldMult: 4 } },
];

export function checkHiddenQuestTriggers(state) {
  const hidden = state.hiddenQuests || { discovered: [], completed: [] };
  const discovered = hidden.discovered || [];
  const completed = hidden.completed || [];
  const newlyDiscovered = [];
  for (const hq of HIDDEN_QUESTS) {
    if (discovered.includes(hq.id) || completed.includes(hq.id)) continue;
    const tc = hq.triggerCondition;
    let triggered = false;
    if (tc.type === "shadow_count") triggered = (state.shadowArmy?.shadows || []).length >= tc.value;
    if (tc.type === "total_quests") triggered = (state.totalQuestsCompleted || 0) >= tc.value;
    if (tc.type === "streak") triggered = (state.streak || 0) >= tc.value;
    if (tc.type === "stat_value") triggered = (state.stats?.[tc.stat] || 0) >= tc.value;
    if (triggered) newlyDiscovered.push(hq);
  }
  return newlyDiscovered;
}

export function generateEmergencyQuest(playerLevel, stateOrLanguage = null) {
  const locale = typeof stateOrLanguage === "string" ? resolveLocale(stateOrLanguage) : getStateLocale(stateOrLanguage);
  const templates = [
    { key: "physical", category: "str", difficulty: "hard" },
    { key: "cognitive", category: "int", difficulty: "hard" },
    { key: "hydration", category: "vit", difficulty: "hard" },
    { key: "oxygen", category: "agi", difficulty: "hard" },
    { key: "social", category: "cha", difficulty: "normal" },
  ];
  const seed = parseInt(getToday().replace(/-/g, "")) % templates.length;
  const tmpl = templates[seed];
  const expires = new Date(); expires.setHours(23, 59, 59, 999);
  return {
    id: `emergency_${getToday()}`,
    templateId: `emergency_${tmpl.key}`,
    title: translate(locale, `quests.emergency.${tmpl.key}.title`),
    desc: translate(locale, `quests.emergency.${tmpl.key}.desc`),
    category: tmpl.category,
    difficulty: tmpl.difficulty,
    type: "emergency",
    timeLimit: expires.toISOString(),
    xpMult: 2.5, goldMult: 2.5,
    createdAt: getToday(),
    systemMessage: translate(locale, "quests.emergencyMessage"),
  };
}

export function generateChainedQuest(baseTitle, category, difficulty, step, totalSteps) {
  return {
    id: genId(),
    title: baseTitle,
    category, difficulty,
    type: "chained",
    isSystem: true,
    chainStep: step,
    chainTotal: totalSteps,
    chainMultiplier: 1 + (step - 1) * 0.25,
    createdAt: getToday(),
  };
}

// ─── DUNGEON GATE IMAGE RESOLVER ──────────────────────────────
import { GATE_ICONS } from "./icons.js";
export function getDungeonGateImage(dungeon) {
  const idMap = { ice_palace: GATE_ICONS.ice, blood_altar: GATE_ICONS.red };
  if (idMap[dungeon?.id]) return idMap[dungeon.id];
  const rankMap = { B: GATE_ICONS.red, C: GATE_ICONS.red };
  return rankMap[dungeon?.rank] || GATE_ICONS.normal;
}
