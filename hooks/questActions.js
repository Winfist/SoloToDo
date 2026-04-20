// ─── QUEST ACTIONS ────────────────────────────────────────────
// Extracted from hooks/useGameState.jsx
// Pure action functions for quest-related operations.
// All functions receive (state, deps) as parameters – no direct hook state.

import { DIFFICULTIES, QUEST_TYPES_CONFIG, SHADOW_CLASSES } from '../data/gameData.js';
import { JOBS } from '../data/jobs.js';
import {
  genId, getToday, calculateLevelUp, awardJobXp,
  calcFormationBonus, getEquipBonuses, getSkillBonuses, getJobBonuses,
  createShadowFromQuest, calcShadowXpToNext, checkNamedShadowUnlocks,
  checkHiddenQuestTriggers, generateChainedQuest, getDailyModifier
} from '../data/helpers.js';
import { generateRedemptionQuests } from '../data/protocolHelpers.js';
import { CHARISMA_CHAINS } from '../data/charismaDungeons.js';
import { isFeatureUnlocked } from '../data/featureUnlocks.js';

/**
 * Compute XP gain for a quest based on bonuses.
 */
export function computeXpGain(quest, streakBonus, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses = {}) {
  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
  let xp = diff.xp;
  xp *= (1 + streakBonus / 100);
  xp *= (1 + (equipBonuses.xpBonus || 0));
  xp *= (1 + (skillBonuses.xpCatBonus?.[quest.category] || 0));
  xp *= (1 + (jobBonuses.xpCatBonus?.[quest.category] || 0));
  if (quest.difficulty === "hard" || quest.difficulty === "boss") xp *= (1 + (skillBonuses.xpHardBonus || 0) + (jobBonuses.hardBossXpBonus || 0));
  xp *= (1 + (skillBonuses.xpGlobal || 0));
  xp *= (1 + (jobBonuses.xpGlobal || 0));
  xp *= (1 + (formBonus?.xpBonus || 0));
  if (penaltyActive) xp *= 0.8;
  xp *= (jobBonuses.xpGlobalMultiplier || 1.0);
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
  xp *= (typeCfg.xpMult || 1);
  xp *= (quest.chainMultiplier || 1);
  xp *= (quest.xpMult || 1);
  return Math.round(xp);
}

/**
 * Handle completing a regular quest.
 * Returns { nextState, sideEffects } – sideEffects contains UI triggers.
 */
export function buildCompleteQuestState(questId, state, processAchievements, gemBoosterMult = 1, verificationBonus = false) {
  const quest = state.quests.find(q => q.id === questId);
  if (!quest) return null;

  const today = getToday();
  const oldStreak = state.streak;
  const newStreak = state.lastActiveDate === today ? oldStreak : (oldStreak + 1);
  const streakBonusPct = Math.min(newStreak, 5) * 10;
  const equipBonuses = getEquipBonuses(state.equipment);
  const skillBonuses = getSkillBonuses(null, state.stats);
  const jobBonuses = getJobBonuses(state);
  const formBonus = calcFormationBonus(state.shadowArmy, jobBonuses.allShadowsActive);
  const penaltyActive = state.penaltyZone?.active;
  const soulLinkActive = state.soulLink?.bothActive;

  let xpGain = computeXpGain(quest, streakBonusPct, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses);
  xpGain = Math.round(xpGain * gemBoosterMult);
  if (soulLinkActive) xpGain = Math.round(xpGain * 1.25);
  if (state.restBuff?.active) xpGain = Math.round(xpGain * 1.1);
  if (verificationBonus) xpGain = Math.round(xpGain * 1.2);

  let finalSysIntegrity = state.integrityScore !== undefined ? state.integrityScore : 100;
  const notifications = [];

  if (!quest.isSystem) {
    if ((state.dailyUserXP || 0) > 200 + state.level * 5) {
      xpGain = Math.round(xpGain * 0.5);
    } else if ((state.dailyUserXP || 0) + xpGain > 200 + state.level * 5) {
      notifications.push({ msg: "Tägliches XP Soft-Cap erreicht. Künftige eigene Quests geben -50%.", type: "warning" });
    }
    const actualElapsedHours = (Date.now() - (quest.createdAtMs || Date.now())) / 3600000;
    if (actualElapsedHours < 0.1) finalSysIntegrity = Math.max(0, finalSysIntegrity - 5);
    if (finalSysIntegrity < 50) {
      xpGain = Math.round(xpGain * (finalSysIntegrity / 100));
      if (Math.random() < 0.3) notifications.push({ msg: "System-Integrität niedrig. XP für eigene Quests verringert.", type: "warning" });
    }
  }

  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
  let goldMult = (1 + (equipBonuses.goldBonus || 0) + (skillBonuses.goldBonus || 0) + (formBonus?.goldBonus || 0)) * (typeCfg.goldMult || 1) * (quest.chainMultiplier || 1);
  let goldGain = Math.round(diff.gold * goldMult);
  if (verificationBonus) goldGain = Math.round(goldGain * 1.1);

  let next = calculateLevelUp(state, xpGain);
  const didLevelUp = next._didLevelUp;
  const earnedPoints = next._levelsGained;
  const newLevel = next.level;

  next = awardJobXp({ ...next, gold: state.gold + goldGain, totalGoldEarned: (state.totalGoldEarned || 0) + goldGain }, "quest_complete", {
    category: quest.category,
    difficulty: quest.difficulty
  });

  if (next._jobLevelUp) {
    notifications.push({ msg: `JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} ist nun Level ${next._jobLevelUp.newLevel}!`, type: "levelup" });
    // NOTE: Do NOT delete _jobLevelUp — the cinematic in App reads it from state.
    // It will be cleaned up by the JobLevelUpCinematic onClose handler.
  }

  // Shadow ARISE for boss quests
  let newShadowArmy = { ...next.shadowArmy };
  let ariseData = null;
  if (quest.difficulty === "boss") {
    const newShadow = createShadowFromQuest(quest, newLevel);
    newShadowArmy = { ...newShadowArmy, shadows: [...(newShadowArmy.shadows || []), newShadow] };
    ariseData = newShadow;
    notifications.push({ msg: `${quest.title} wurde zu einem ${SHADOW_CLASSES[newShadow.class].name}!`, type: "shadow" });
  }

  if (soulLinkActive) notifications.push({ msg: "🔗 Soul Link aktiv! +25% XP Bonus", type: "success" });

  // Penalty
  let newPenalty = { ...state.penaltyZone };
  if (newPenalty.active) {
    newPenalty.questsCompletedInPenalty = (newPenalty.questsCompletedInPenalty || 0) + 1;
    const needed = newPenalty.redemptionLeft || 3;
    if (newPenalty.questsCompletedInPenalty >= needed) {
      newPenalty.active = false;
      notifications.push({ msg: "Strafe abgebüßt. Willkommen zurück, Hunter.", type: "success" });
    }
  }

  // Shadow Regression
  let newShadowRegression = { ...(state.shadowRegression || {}) };
  let regressionSystemMessage = null;
  if (newShadowRegression.active && quest.isRedemption) {
    newShadowRegression.questsCompleted = (newShadowRegression.questsCompleted || 0) + 1;
    if (newShadowRegression.questsCompleted >= 3) {
      const restoredStreak = Math.floor((newShadowRegression.previousStreak || 0) * 0.5);
      newShadowRegression = {
        ...newShadowRegression,
        active: false,
        completedAt: today,
        regressionHistory: [
          ...(newShadowRegression.regressionHistory || []),
          { date: today, previousStreak: newShadowRegression.previousStreak, restoredStreak }
        ]
      };
      newPenalty = { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 };
      regressionSystemMessage = {
        title: "SCHATTENRÜCKKEHR VOLLSTÄNDIG",
        lines: ["Du hast die Dunkelheit überwunden.", `Streak wiederhergestellt: ${restoredStreak} Tage`, "Der Schatten wird zu deiner Stärke.", "WILLKOMMEN ZURÜCK, HUNTER."]
      };
      xpGain = Math.round(xpGain * 2);
      notifications.push({ msg: `⚡ SHADOW REGRESSION ABGESCHLOSSEN! Streak auf ${restoredStreak} Tage wiederhergestellt!`, type: "named" });
    } else {
      const remaining = 3 - newShadowRegression.questsCompleted;
      notifications.push({ msg: `Schattenrückforderung ${newShadowRegression.questsCompleted}/3 – Noch ${remaining} verbleibend.`, type: "info" });
    }
  }

  // Chained quest
  let extraQuests = [];
  if (quest.type === "chained" && quest.chainStep < quest.chainTotal) {
    const nextStep = generateChainedQuest(quest.title, quest.category, quest.difficulty, quest.chainStep + 1, quest.chainTotal);
    extraQuests = [nextStep];
    notifications.push({ msg: `⛓️ Kette ${quest.chainStep}/${quest.chainTotal} erfüllt! Multiplikator: x${nextStep.chainMultiplier.toFixed(2)}`, type: "info" });
  } else if (quest.type === "chained" && quest.chainStep >= quest.chainTotal) {
    notifications.push({ msg: "⛓️ QUEST-KETTE ABGESCHLOSSEN! Maximaler Multiplikator erreicht!", type: "gold" });
  }

  // Charisma dungeon progression
  let newCharismaDungeons = { ...(state.charismaDungeons || {}) };
  let charismaDungeonSystemMessage = null;
  if (quest.isCharismaQuest && quest.charismaChainId) {
    const chain = CHARISMA_CHAINS.find(c => c.id === quest.charismaChainId);
    if (chain) {
      const nextStepIdx = quest.charismaStep;
      const stepHistory = [...(newCharismaDungeons.stepHistory || []), { chainId: quest.charismaChainId, step: quest.charismaStep, completedAt: today, xpGained: xpGain }];
      if (nextStepIdx < chain.steps.length) {
        const nextStepData = chain.steps[nextStepIdx];
        const nextQ = {
          id: genId(),
          title: `[${chain.name}] Etage ${nextStepIdx + 1}: ${nextStepData.title}`,
          category: "cha", difficulty: nextStepData.difficulty, type: "side",
          isSystem: true, isCharismaQuest: true, charismaChainId: chain.id,
          charismaStep: nextStepIdx + 1, xpMult: nextStepData.xpMult,
          createdAt: today, createdAtMs: Date.now(),
        };
        extraQuests = [...extraQuests, nextQ];
        newCharismaDungeons = { ...newCharismaDungeons, stepHistory };
        notifications.push({ msg: `🎭 ${chain.name}: Etage ${quest.charismaStep} bezwungen! Weiter zu Etage ${nextStepIdx + 1}.`, type: "info" });
      } else {
        const chaBonus = chain.reward.chaBonus || 3;
        newCharismaDungeons = {
          ...newCharismaDungeons, stepHistory,
          completedChains: [...(newCharismaDungeons.completedChains || []), chain.id],
          activeChains: Object.fromEntries(Object.entries(newCharismaDungeons.activeChains || {}).filter(([k]) => k !== chain.id))
        };
        charismaDungeonSystemMessage = {
          title: "CHARISMA-DUNGEON BEZWUNGEN",
          lines: [`${chain.icon} ${chain.name} vollständig abgeschlossen.`, `+${chaBonus} CHA dauerhaft erlangt.`, `Titel freigeschaltet: "${chain.reward.title}"`, "Das System erkennt dein soziales Erwachen an."]
        };
        notifications.push({ msg: `👑 CHARISMA DUNGEON ABGESCHLOSSEN: ${chain.name}! +${chaBonus} CHA permanent.`, type: "named" });
        next._charismaChaBonus = (next._charismaChaBonus || 0) + chaBonus;
        next._charismaTitle = chain.reward.title;
      }
    }
  }

  // Hidden quest
  let newHiddenQuests = { ...state.hiddenQuests };
  if (quest.type === "hidden") {
    newHiddenQuests = {
      discovered: (newHiddenQuests.discovered || []).filter(id => id !== quest.hiddenId),
      completed: [...(newHiddenQuests.completed || []), quest.hiddenId || quest.id]
    };
    notifications.push({ msg: "🌟 Verborgene Quest erfüllt! Legendäre Belohnung erhalten!", type: "named" });
  }

  const updatedQuests = [
    ...(quest.type === "daily" ? state.quests.map(q => q.id === questId ? { ...q, completed: true } : q) : state.quests.filter(q => q.id !== questId)),
    ...extraQuests
  ];

  // Habit linking
  let newHabits = state.habits;
  if (quest.linkedHabitId && state.habits) {
    newHabits = state.habits.map(h => {
      if (h.id === quest.linkedHabitId && !h.history?.[today]?.completed) {
        const hNewStreak = state.lastActiveDate === today ? h.streak : (h.streak + 1);
        return { ...h, streak: hNewStreak, bestStreak: Math.max(h.bestStreak || 0, hNewStreak), totalCompletions: (h.totalCompletions || 0) + 1, history: { ...h.history, [today]: { completed: true, xp: 0, gold: 0 } } };
      }
      return h;
    });
  }

  // Codex quest
  let newCodexMastered = state.codexMastered || [];
  let codexStatBonus = 0;
  if (quest.isCodexQuest && quest.codexId) {
    if (!newCodexMastered.includes(quest.codexId)) {
      newCodexMastered = [...newCodexMastered, quest.codexId];
      codexStatBonus = 1;
      notifications.push({ msg: `📜 CODEX GEMEISTERT! Permanente Weisheit erlangt. +1 ${quest.rewardStat?.toUpperCase() || quest.category.toUpperCase()}`, type: "success" });
    }
  }

  const finalStreak = (newShadowRegression.active === false && newShadowRegression.completedAt === today && !state.shadowRegression?.completedAt)
    ? Math.floor((newShadowRegression.previousStreak || 0) * 0.5)
    : newStreak;

  const charismaChaBonus = next._charismaChaBonus || 0;
  const charismaTitle = next._charismaTitle || null;
  delete next._charismaChaBonus;
  delete next._charismaTitle;

  const categoryStatGain = Math.ceil(xpGain / 40) + codexStatBonus;
  const newStats = {
    ...state.stats,
    [quest.category]: (state.stats[quest.category] || 0) + categoryStatGain,
  };
  // Add charisma dungeon bonus to CHA (avoid double-add when quest.category is already "cha")
  if (charismaChaBonus > 0) {
    newStats.cha = (newStats.cha || 0) + charismaChaBonus;
  }

  next = {
    ...next,
    stats: newStats,
    quests: updatedQuests,
    completedQuests: [...(state.completedQuests || []), {
      ...quest,
      completedAt: today,
      completedAtMs: Date.now(),
      actualDurationMs: quest.createdAtMs ? Date.now() - quest.createdAtMs : null,
      xpEarned: xpGain,
      goldEarned: goldGain,
      rating: null,
      feltDifficulty: null,
      durationFeedback: null,
      notes: null,
      categoryFeedback: null,
      wasVerified: verificationBonus,
    }],
    habits: newHabits,
    streak: finalStreak, lastActiveDate: today, shadowArmy: newShadowArmy,
    totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1,
    penaltyZone: newPenalty, hiddenQuests: newHiddenQuests,
    dailyUserXP: (state.dailyUserXP || 0) + (!quest.isSystem ? xpGain : 0),
    integrityScore: finalSysIntegrity,
    codexMastered: newCodexMastered,
    shadowRegression: newShadowRegression,
    soulLink: { ...(state.soulLink || {}) },
    charismaDungeons: newCharismaDungeons,
    ...(charismaTitle ? { selectedTitle: charismaTitle } : {}),
    seasons: {
      ...(state.seasons || {}),
      seasonalCompletions: quest.isSeasonal
        ? [...(state.seasons?.seasonalCompletions || []), quest.id]
        : (state.seasons?.seasonalCompletions || [])
    }
  };

  // Hidden quest triggers
  const newlyDiscoveredHQ = isFeatureUnlocked('hidden_quests', next.level) ? checkHiddenQuestTriggers(next) : [];
  if (newlyDiscoveredHQ.length > 0) {
    const newDiscovered = [...(next.hiddenQuests.discovered || []), ...newlyDiscoveredHQ.map(hq => hq.id)];
    next.hiddenQuests = { ...next.hiddenQuests, discovered: newDiscovered };
    const hqAsQuests = newlyDiscoveredHQ.map(hq => ({
      id: genId(), hiddenId: hq.id,
      title: hq.title, category: hq.category, difficulty: hq.difficulty,
      type: "hidden", createdAt: today,
      xpMult: hq.reward.xpMult, goldMult: hq.reward.goldMult,
    }));
    next.quests = [...next.quests, ...hqAsQuests];
  }

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

  // Apply verification bonus tracking before achievement check
  if (verificationBonus) {
    next.ai = { ...(next.ai || {}), verifiedQuests: ((next.ai?.verifiedQuests) || 0) + 1 };
    notifications.push({ msg: "📸 Beweis-Bonus: +20% XP & +10% Gold!", type: "success" });
  }

  const { nextState: afterAch, newAchievements } = processAchievements(next);
  next = afterAch;

  // Charisma chain unlocks
  const newCha = next.stats?.cha || 0;
  const currentUnlocked = next.charismaDungeons?.unlockedChains || ["social_exposure"];
  const newlyUnlockedChains = CHARISMA_CHAINS.filter(c => newCha >= c.chaThreshold && !currentUnlocked.includes(c.id));
  if (newlyUnlockedChains.length > 0) {
    next.charismaDungeons = { ...next.charismaDungeons, unlockedChains: [...currentUnlocked, ...newlyUnlockedChains.map(c => c.id)] };
    newlyUnlockedChains.forEach(c => notifications.push({ msg: `🎭 Charisma-Dungeon freigeschaltet: ${c.icon} ${c.name}!`, type: "success", delay: 800 }));
  }

  return {
    nextState: next,
    didLevelUp,
    earnedPoints,
    newLevel,
    xpGain,
    goldGain,
    ariseData,
    newNameds,
    soulLinkActive,
    notifications,
    newlyDiscoveredHQ,
    regressionSystemMessage,
    charismaDungeonSystemMessage,
    quest,
    oldLevel: state.level,
    newAchievements,
  };
}

/**
 * Handle completing an emergency quest.
 */
export function buildCompleteEmergencyQuestState(eq, state, processAchievements) {
  const diff = DIFFICULTIES.find(d => d.key === eq.difficulty) || DIFFICULTIES[1];
  const xpGain = Math.round(diff.xp * 2.5);
  const goldGain = Math.round(diff.gold * 2.5);
  let next = calculateLevelUp(state, xpGain);
  const didLevelUp = next._didLevelUp;
  const earnedPoints = next._levelsGained;
  const newLevel = next.level;

  next = {
    ...next,
    gold: state.gold + goldGain,
    totalGoldEarned: (state.totalGoldEarned || 0) + goldGain,
    stats: { ...next.stats, [eq.category]: (next.stats[eq.category] || 0) + 2 },
    emergencyDone: true,
    totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1
  };
  const { nextState: afterAch, newAchievements } = processAchievements(next);
  next = afterAch;

  return { nextState: next, didLevelUp, earnedPoints, newLevel, xpGain, goldGain, newAchievements, eq };
}
