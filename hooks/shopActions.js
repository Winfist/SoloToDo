// ─── SHOP & JOB ACTIONS ───────────────────────────────────────
// Extracted from hooks/useGameState.jsx
// Pure action functions for shop, equipment, job, and stat operations.

import { JOBS } from '../data/jobs.js';
import {
  getRank, getRankIndex, getToday, generateDungeons, getJobBonuses, checkAllJobsLevel5
} from '../data/helpers.js';
import { DEFAULT_STATE } from '../data/defaultState.js';

/**
 * Build next state after purchasing a shop item.
 */
export function buildBuyItemState(item, state, processAchievements, triggerSystemMessageFn) {
  const jobBonuses = getJobBonuses(state);
  const discount = jobBonuses.shopDiscount || 0;
  const finalCost = Math.max(1, Math.floor(item.cost * (1 - discount / 100)));

  if (state.gold < finalCost) return { error: "Nicht genug Gold!" };
  if (item.type !== "consumable" && state.shopPurchases.includes(item.id)) return { error: "Bereits gekauft!" };
  if (getRankIndex(getRank(state.level).name) < getRankIndex(item.minRank)) return { error: "Rang zu niedrig!" };

  let consumableEffects = {};
  let shopSystemMessage = null;

  if (item.type === "consumable") {
    if (item.id === "extra_slot") {
      consumableEffects = { extraDailySlots: (state.extraDailySlots || 0) + 1 };
    }
    if (item.id === "potion_heal") {
      const recoverStreak = state.shadowRegression?.active ? (state.shadowRegression.previousStreak || 0) : (state.streak + 2);
      consumableEffects = {
        streak: recoverStreak,
        shadowRegression: null,
        penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 }
      };
      shopSystemMessage = {
        title: "SYSTEM RECOVERY",
        lines: [
          "Elixir of Recovery konsumiert.",
          "Verlorene Vitalität vollständig wiederhergestellt.",
          `Streak auf ${recoverStreak} gesetzt.`,
          "Strafzonen-Status aufgehoben."
        ]
      };
    }
  }

  let next = {
    ...state,
    gold: state.gold - finalCost,
    ...(item.type !== "consumable" ? { shopPurchases: [...state.shopPurchases, item.id] } : {}),
    ...consumableEffects,
    ...(item.type === "theme" ? { selectedTheme: item.themeKey } : {}),
    ...(item.type === "title" ? { selectedTitle: item.name } : {})
  };
  next = processAchievements(next);

  return {
    nextState: next,
    shopSystemMessage,
    notifyMsg: item.name,
    notifyType: item.id === "potion_heal" ? "success" : "gold"
  };
}

/**
 * Build next state after purchasing a gem shop item.
 */
export function buildBuyGemItemState(item, state, processAchievements) {
  if ((state.gems || 0) < item.cost) return { error: "Nicht genug Gems!" };
  if (!item.repeatable && (state.gemPurchases || []).includes(item.id)) return { error: "Bereits gekauft!" };

  let effects = {};
  let gemSystemMessage = null;

  if (item.type === "booster") {
    const newBooster = {
      id: item.id, name: item.name, effect: item.effect,
      activatedAt: Date.now(),
      expiresAt: Date.now() + item.duration,
    };
    effects.activeGemBoosters = [...(state.activeGemBoosters || []).filter(b => b.expiresAt > Date.now()), newBooster];
    gemSystemMessage = {
      title: "BOOSTER AKTIVIERT",
      lines: [`${item.name} wurde eingesetzt!`, `${item.desc}`, `Dauer: ${Math.round(item.duration / 3600000)} Stunden.`, "Möge die Macht mit dir sein, Hunter."]
    };
  } else if (item.type === "theme") {
    effects.selectedTheme = item.themeKey;
  } else if (item.type === "title") {
    effects.selectedTitle = item.name;
  } else if (item.type === "consumable") {
    if (item.id === "gem_extra_slot") {
      effects.extraDailySlots = (state.extraDailySlots || 0) + 1;
    } else if (item.id === "gem_dungeon_refresh") {
      effects.dungeons = generateDungeons(getRank(state.level || 1).name);
      effects.lastDungeonRefresh = getToday();
    } else if (item.id === "gem_stat_reset") {
      const totalStatPoints = Object.values(state.stats || {}).reduce((a, b) => a + b, 0);
      effects.stats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
      effects.statPoints = (state.statPoints || 0) + totalStatPoints;
      gemSystemMessage = {
        title: "STAT RESET",
        lines: ["Alle Stat-Punkte wurden zurückgesetzt.", `${totalStatPoints + (state.statPoints || 0)} Punkte stehen zur Verfügung.`, "Verteile sie weise, Hunter."]
      };
    }
  }

  const newPurchases = item.repeatable ? (state.gemPurchases || []) : [...(state.gemPurchases || []), item.id];

  let next = {
    ...state,
    gems: (state.gems || 0) - item.cost,
    gemPurchases: newPurchases,
    ...effects,
  };
  next = processAchievements(next);

  return {
    nextState: next,
    gemSystemMessage,
    isDungeonRefresh: item.id === "gem_dungeon_refresh",
    notifyMsg: item.name,
    notifyType: item.type === "booster" ? "success" : "named"
  };
}

/**
 * Build next state after switching jobs.
 */
export function buildSwitchJobState(jobKey, state) {
  const jobDef = JOBS[jobKey];
  if (!jobDef) return { error: "Job nicht gefunden." };

  const req = jobDef.unlockRequirement;
  if (state.level < req.level) return { error: `Mindestlevel ${req.level} erforderlich für ${jobDef.name}.` };
  if (req.allJobsLevel5 && !checkAllJobsLevel5(state)) return { error: "Alle anderen Jobs müssen Level 5 sein." };
  if (req.minShadows && (state.shadowArmy?.shadows?.length || 0) < req.minShadows) return { error: `Mindestens ${req.minShadows} Shadows erforderlich.` };

  return {
    nextState: { ...state, jobs: { ...state.jobs, current: jobKey } },
    msg: `Job gewechselt zu: ${jobDef.name}`
  };
}

/**
 * Build next state after activating a job ability.
 */
export function buildActivateJobAbilityState(jobKey, state) {
  const jobDef = JOBS[jobKey];
  if (!jobDef || state.jobs?.current !== jobKey) return { error: "Falscher Job oder kein Job aktiv." };

  const ability = jobDef.activeAbility;
  const level = state.jobs.levels[jobKey] || 0;

  if (level < ability.unlockLevel) return { error: `${jobDef.name} Level ${ability.unlockLevel} benötigt.` };

  const now = Date.now();
  const cooldowns = { ...state.jobs.activeAbilityCooldowns };
  const lastUsed = cooldowns[ability.key] || 0;

  if (now < lastUsed + (ability.cooldown * 1000)) {
    const remaining = Math.ceil((lastUsed + (ability.cooldown * 1000) - now) / 1000);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    return { error: `Cooldown: ${h}h ${m}m` };
  }

  if (ability.key === "shadow_step") {
    const today = getToday();
    const usesToday = cooldowns.shadow_step_uses?.[today] || 0;
    if (usesToday >= (ability.maxUsesPerDay || 3)) return { error: "Shadow Step heute bereits 3x benutzt." };
    cooldowns.shadow_step_uses = { ...cooldowns.shadow_step_uses, [today]: usesToday + 1 };
  }

  cooldowns[ability.key] = now;

  return {
    nextState: {
      ...state,
      jobs: { ...state.jobs, activeAbilityCooldowns: cooldowns },
      _abilityActivated: { ability, job: jobDef }
    },
    msg: `${ability.name} AKTIVIERT!`
  };
}
