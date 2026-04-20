// ─── DUNGEON ACTIONS ──────────────────────────────────────────
// Extracted from hooks/useGameState.jsx
// Pure action functions for dungeon-related operations.

import { SHADOW_TIERS, FORMATION_SLOTS } from '../data/gameData.js';
import { JOBS } from '../data/jobs.js';
import {
  getRank, genId, getToday, calculateLevelUp, awardJobXp,
  calcShadowXpToNext, checkNamedShadowUnlocks, getJobBonuses
} from '../data/helpers.js';

/**
 * Build the next state after a dungeon is finished.
 */
export function buildFinishDungeonState(dungeon, result, state, processAchievements) {
  let next = calculateLevelUp(state, result.xp);
  const didLevelUp = next._didLevelUp;
  const earnedPoints = next._levelsGained;
  const newLevel = next.level;
  const oldRank = getRank(state.level);

  let newInventory = [...(next.equipment?.inventory || [])];
  if (result.drop) newInventory.push(result.drop);

  let updatedShadows = (state.shadowArmy?.shadows || []).map(s => {
    if (!s.isDeployed) return s;
    let newSXp = s.xp + Math.floor(result.xp * 0.1);
    let newSLevel = s.level;
    while (newSXp >= s.xpToNext && newSLevel < (SHADOW_TIERS[s.tier]?.maxLevel || 20)) {
      newSXp -= calcShadowXpToNext(newSLevel); newSLevel++;
    }
    return { ...s, xp: newSXp, level: newSLevel, xpToNext: calcShadowXpToNext(newSLevel), dungeonsCleared: (s.dungeonsCleared || 0) + 1 };
  });
  const newShadowArmy = { ...state.shadowArmy, shadows: updatedShadows };
  const totalGold = result.gold + (result.goldBonus ? Math.round(result.goldBonus * (state.todayModifier?.goldMult || 1)) : 0);

  next = awardJobXp(
    { ...next, gold: state.gold + totalGold, totalGoldEarned: (state.totalGoldEarned || 0) + totalGold },
    "dungeon_complete",
    { strategy: result.strategy, dungeonRank: dungeon.rank }
  );

  const notifications = [];
  if (next._jobLevelUp) {
    notifications.push({ msg: `JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} Lv.${next._jobLevelUp.newLevel}!`, type: "levelup" });
    delete next._jobLevelUp;
  }

  // Guardian-Passiv: Rewards bei Niederlage
  if (!result.won && getJobBonuses(state).dungeonFailureRewards > 0) {
    const partialXp = Math.floor(result.xp * getJobBonuses(state).dungeonFailureRewards);
    const partialGold = Math.floor(result.gold * getJobBonuses(state).dungeonFailureRewards);
    next.xp += partialXp;
    next.gold += partialGold;
    notifications.push({ msg: `Guardian-Passiv: +${partialXp} XP, +${partialGold} Gold trotz Niederlage`, type: "success" });
  }

  next = {
    ...next,
    dungeons: state.dungeons.map(d => d.instanceId === dungeon.instanceId ? { ...d, cleared: true } : d),
    dungeonHistory: [
      ...(state.dungeonHistory || []),
      {
        dungeonId: dungeon.id, dungeonName: dungeon.name, dungeonRank: dungeon.rank,
        won: result.won, xp: result.xp, gold: totalGold,
        floorsCleared: result.floorsCleared || dungeon.floors, date: getToday()
      }
    ],
    totalXpEarned: (state.totalXpEarned || 0) + result.xp,
    equipment: { ...state.equipment, inventory: newInventory },
    shadowArmy: newShadowArmy
  };

  // Named shadow unlocks
  const newNameds = checkNamedShadowUnlocks(next);
  if (newNameds.length > 0) {
    newNameds.forEach(ns => {
      const namedShadow = {
        ...ns, id: genId(), namedId: ns.id,
        level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
        stats: { power: 40, speed: 35, loyalty: 50, presence: 30 },
        abilities: [ns.uniqueAbility || {}],
        isDeployed: false, deploymentSlot: null, evolutionStage: 1,
        summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
      };
      next.shadowArmy.shadows = [...next.shadowArmy.shadows, namedShadow];
      notifications.push({ msg: `${ns.name} – ${ns.title} – ist erwacht!`, type: "named" });
    });
  }

  next = processAchievements(next);

  return {
    nextState: next,
    didLevelUp,
    earnedPoints,
    newLevel,
    oldRank,
    newNameds,
    notifications,
    result,
    dungeon,
  };
}

/**
 * Build the next state for deploying a shadow to a formation slot.
 */
export function buildDeployShadowState(shadowId, slot, state) {
  const slotData = FORMATION_SLOTS[slot];
  const currentInSlot = (state.shadowArmy?.shadows || []).filter(s => s.isDeployed && s.deploymentSlot === slot).length;
  if (currentInSlot >= slotData.maxSlots) return { error: `${slotData.name} ist voll! (Max ${slotData.maxSlots})` };
  const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: true, deploymentSlot: slot } : s);
  return { nextState: { ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } }, msg: `Shadow in ${slotData.name} positioniert!` };
}

/**
 * Build the next state for undeploying a shadow.
 */
export function buildUndeployShadowState(shadowId, state) {
  const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, isDeployed: false, deploymentSlot: null } : s);
  return { nextState: { ...state, shadowArmy: { ...state.shadowArmy, shadows: newShadows } }, msg: "Shadow zurückgerufen." };
}

/**
 * Build the next state for evolving a shadow to the next tier.
 */
export function buildEvolveShadowState(shadowId, state, processAchievements) {
  const shadow = (state.shadowArmy?.shadows || []).find(s => s.id === shadowId);
  if (!shadow) return null;
  const nextTier = SHADOW_TIERS[shadow.tier + 1];
  if (!nextTier || state.gold < nextTier.evolutionCost) return null;
  const newStats = {
    power: Math.round(shadow.stats.power * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
    speed: Math.round(shadow.stats.speed * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
    loyalty: Math.round(shadow.stats.loyalty * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
    presence: Math.round(shadow.stats.presence * nextTier.statMult / SHADOW_TIERS[shadow.tier].statMult),
  };
  const newShadows = (state.shadowArmy.shadows || []).map(s => s.id === shadowId ? { ...s, tier: s.tier + 1, stats: newStats, glowColor: nextTier.color } : s);
  let next = { ...state, gold: state.gold - nextTier.evolutionCost, shadowArmy: { ...state.shadowArmy, shadows: newShadows } };
  next = processAchievements(next);
  return { nextState: next, shadow, nextTier };
}
