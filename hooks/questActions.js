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
  checkHiddenQuestTriggers, generateChainedQuest, generateOperationStep, getDailyModifier
} from '../data/helpers.js';
import { OPERATIONS } from '../data/questPool.js';
import { generateRedemptionQuests } from '../data/protocolHelpers.js';
import { CHARISMA_CHAINS } from '../data/charismaDungeons.js';
import { isFeatureUnlocked } from '../data/featureUnlocks.js';
import { hasFocusQuestAbility, getFocusQuestXpBonus, getMomentumBonus, getQuestTimerReduction } from '../data/artifactHelpers.js';
import { getStateLocale, translate } from '../data/i18n.js';
import { getQuestVerificationPolicy } from '../data/questVerification.js';
import { getYesterdayKey } from '../data/dateUtils.js';

function ltState(state, key, params = {}) {
  return translate(getStateLocale(state), key, params);
}

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
  const hasVerificationBonus = verificationBonus && getQuestVerificationPolicy(quest).mode === "photo";

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
  if (hasVerificationBonus) xpGain = Math.round(xpGain * 1.2);

  // ── Fokus-Amulett: +50% XP if this quest is the daily focus ──
  if (hasFocusQuestAbility(state) && state.dailyFocusQuestId === questId) {
    const focusBonus = getFocusQuestXpBonus(state);
    xpGain = Math.round(xpGain * (1 + focusBonus));
  }

  // ── Momentum-Kristall: 3 quests in a row → 4th gets double XP ──
  const momentum = getMomentumBonus(state);
  if (momentum) {
    const completionCount = (state.dailyQuestCompletionCount || 0);
    if (completionCount > 0 && completionCount % momentum.questsNeeded === 0) {
      xpGain = Math.round(xpGain * momentum.xpMult);
    }
  }

  let finalSysIntegrity = state.integrityScore !== undefined ? state.integrityScore : 100;
  const notifications = [];

  if (!quest.isSystem) {
    if ((state.dailyUserXP || 0) > 200 + state.level * 5) {
      xpGain = Math.round(xpGain * 0.5);
    } else if ((state.dailyUserXP || 0) + xpGain > 200 + state.level * 5) {
      notifications.push({ msg: ltState(state, "questActions.softCap"), type: "warning" });
    }
    const actualElapsedHours = (Date.now() - (quest.createdAtMs || Date.now())) / 3600000;
    if (actualElapsedHours < 0.1) finalSysIntegrity = Math.max(0, finalSysIntegrity - 5);
    if (finalSysIntegrity < 50) {
      xpGain = Math.round(xpGain * (finalSysIntegrity / 100));
      if (Math.random() < 0.3) notifications.push({ msg: ltState(state, "questActions.integrityLow"), type: "warning" });
    }
  }

  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
  let goldMult = (1 + (equipBonuses.goldBonus || 0) + (skillBonuses.goldBonus || 0) + (formBonus?.goldBonus || 0)) * (typeCfg.goldMult || 1) * (quest.chainMultiplier || 1);
  let goldGain = Math.round(diff.gold * goldMult);
  if (hasVerificationBonus) goldGain = Math.round(goldGain * 1.1);

  let next = calculateLevelUp(state, xpGain);
  const didLevelUp = next._didLevelUp;
  const earnedPoints = next._levelsGained;
  const newLevel = next.level;

  next = awardJobXp({ ...next, gold: state.gold + goldGain, totalGoldEarned: (state.totalGoldEarned || 0) + goldGain }, "quest_complete", {
    category: quest.category,
    difficulty: quest.difficulty
  });

  if (next._jobLevelUp) {
    notifications.push({ msg: ltState(state, "questActions.jobLevelUp", { job: JOBS[next._jobLevelUp.job].name, level: next._jobLevelUp.newLevel }), type: "levelup" });
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
    notifications.push({ msg: ltState(state, "questActions.shadowCreated", { title: quest.title, className: SHADOW_CLASSES[newShadow.class].name }), type: "shadow" });
  }

  if (soulLinkActive) notifications.push({ msg: ltState(state, "questActions.soulLinkActive"), type: "success" });

  // Penalty
  let newPenalty = { ...state.penaltyZone };
  if (newPenalty.active) {
    newPenalty.questsCompletedInPenalty = (newPenalty.questsCompletedInPenalty || 0) + 1;
    const needed = newPenalty.redemptionLeft || 3;
    if (newPenalty.questsCompletedInPenalty >= needed) {
      newPenalty.active = false;
      notifications.push({ msg: ltState(state, "questActions.penaltyCleared"), type: "success" });
    }
  }

  // Shadow Regression
  let newShadowRegression = { ...(state.shadowRegression || {}) };
  let regressionSystemMessage = null;
  if (newShadowRegression.active && quest.isRedemption) {
    newShadowRegression.questsCompleted = (newShadowRegression.questsCompleted || 0) + 1;
    if (newShadowRegression.questsCompleted >= 5) {
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
        title: ltState(state, "questActions.regressionTitle"),
        lines: [
          ltState(state, "questActions.regressionLine1"),
          ltState(state, "questActions.regressionStreakRestored", { streak: restoredStreak }),
          ltState(state, "questActions.regressionLine3"),
          ltState(state, "questActions.regressionWelcome"),
        ]
      };
      xpGain = Math.round(xpGain * 2);
      notifications.push({ msg: ltState(state, "questActions.regressionCompleted", { streak: restoredStreak }), type: "named" });
    } else {
      const remaining = 5 - newShadowRegression.questsCompleted;
      notifications.push({ msg: ltState(state, "questActions.regressionProgress", { completed: newShadowRegression.questsCompleted, remaining }), type: "info" });
    }
  }

  // Chained quest
  let extraQuests = [];
  if (quest.type === "chained" && quest.chainStep < quest.chainTotal) {
    let nextStep;
    if (quest.operationId) {
      const op = OPERATIONS.find(o => o.id === quest.operationId);
      if (op) {
        const locale = getStateLocale(state);
        nextStep = generateOperationStep(op, quest.chainStep + 1, locale);
      }
    }
    if (!nextStep) {
      nextStep = generateChainedQuest(quest.title, quest.category, quest.difficulty, quest.chainStep + 1, quest.chainTotal);
    }
    extraQuests = [nextStep];
    notifications.push({ msg: ltState(state, "questActions.chainStep", { step: quest.chainStep, total: quest.chainTotal, multiplier: nextStep.chainMultiplier.toFixed(2) }), type: "info" });
  } else if (quest.type === "chained" && quest.chainStep >= quest.chainTotal) {
    notifications.push({ msg: ltState(state, "questActions.chainCompleted"), type: "gold" });
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
          title: ltState(state, "questActions.charismaQuestTitle", { name: chain.name, floor: nextStepIdx + 1, title: nextStepData.title }),
          category: "cha", difficulty: nextStepData.difficulty, type: "side",
          isSystem: true, isCharismaQuest: true, charismaChainId: chain.id,
          charismaStep: nextStepIdx + 1, xpMult: nextStepData.xpMult,
          createdAt: today, createdAtMs: Date.now(),
        };
        extraQuests = [...extraQuests, nextQ];
        newCharismaDungeons = { ...newCharismaDungeons, stepHistory };
        notifications.push({ msg: ltState(state, "questActions.charismaNextFloor", { name: chain.name, floor: quest.charismaStep, nextFloor: nextStepIdx + 1 }), type: "info" });
      } else {
        const chaBonus = chain.reward.chaBonus || 3;
        newCharismaDungeons = {
          ...newCharismaDungeons, stepHistory,
          completedChains: [...(newCharismaDungeons.completedChains || []), chain.id],
          activeChains: Object.fromEntries(Object.entries(newCharismaDungeons.activeChains || {}).filter(([k]) => k !== chain.id))
        };
        charismaDungeonSystemMessage = {
          title: ltState(state, "questActions.charismaCompletedTitle"),
          lines: [
            ltState(state, "questActions.charismaCompletedLine", { icon: chain.icon, name: chain.name }),
            ltState(state, "questActions.charismaChaBonus", { bonus: chaBonus }),
            ltState(state, "questActions.charismaTitleUnlocked", { title: chain.reward.title }),
            ltState(state, "questActions.charismaAwakening"),
          ]
        };
        notifications.push({ msg: ltState(state, "questActions.charismaCompletedNotify", { name: chain.name, bonus: chaBonus }), type: "named" });
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
    notifications.push({ msg: ltState(state, "questActions.hiddenCompleted"), type: "named" });
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
        const wasCompletedYesterday = !!h.history?.[getYesterdayKey()]?.completed;
        const newStreak = wasCompletedYesterday ? (h.currentStreak || 0) + 1 : 1;
        return {
          ...h,
          currentStreak: newStreak,
          streak: newStreak,
          bestStreak: Math.max(h.bestStreak || 0, newStreak),
          totalCompletions: (h.totalCompletions || 0) + 1,
          scheduledDays: (h.scheduledDays || 0) + (h.history?.[today]?.scheduled ? 0 : 1),
          history: {
            ...h.history,
            [today]: {
              completed: true,
              completedAt: new Date().toISOString(),
              xp: 0,
              gold: 0,
              ...(h.verification === "counter" ? { counterValue: h.targetCount } : {})
            }
          }
        };
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
      notifications.push({ msg: ltState(state, "questActions.codexMastered", { stat: quest.rewardStat?.toUpperCase() || quest.category.toUpperCase() }), type: "success" });
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

  const newlyCompletedQuest = {
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
    wasVerified: hasVerificationBonus,
  };

  next = {
    ...next,
    stats: newStats,
    quests: updatedQuests,
    reminders: (state.reminders || []).filter(r => r.questId !== questId),
    completedQuests: [...(state.completedQuests || []), newlyCompletedQuest],
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
    dailyQuestCompletionCount: (state.dailyQuestCompletionCount || 0) + 1,
    // Clear daily focus after completion
    ...(state.dailyFocusQuestId === questId ? { dailyFocusQuestId: null } : {}),
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
      notifications.push({ msg: ltState(state, "questActions.namedShadowAwakened", { name: ns.name, title: ns.title }), type: "named" });
    });
  }

  // Apply verification bonus tracking before achievement check
  if (hasVerificationBonus) {
    next.ai = { ...(next.ai || {}), verifiedQuests: ((next.ai?.verifiedQuests) || 0) + 1 };
    notifications.push({ msg: ltState(state, "questActions.verificationBonus"), type: "success" });
  }

  const { nextState: afterAch, newAchievements } = processAchievements(next);
  next = afterAch;

  // Charisma chain unlocks
  const newCha = next.stats?.cha || 0;
  const currentUnlocked = next.charismaDungeons?.unlockedChains || ["social_exposure"];
  const newlyUnlockedChains = CHARISMA_CHAINS.filter(c => newCha >= c.chaThreshold && !currentUnlocked.includes(c.id));
  if (newlyUnlockedChains.length > 0) {
    next.charismaDungeons = { ...next.charismaDungeons, unlockedChains: [...currentUnlocked, ...newlyUnlockedChains.map(c => c.id)] };
    newlyUnlockedChains.forEach(c => notifications.push({ msg: ltState(state, "questActions.charismaUnlocked", { icon: c.icon, name: c.name }), type: "success", delay: 800 }));
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
    newlyCompletedQuests: [newlyCompletedQuest],
  };
}

/**
 * Handle completing an emergency quest.
 */
export function buildCompleteEmergencyQuestState(eq, state, processAchievements, verificationBonus = false) {
  const diff = DIFFICULTIES.find(d => d.key === eq.difficulty) || DIFFICULTIES[1];
  const hasVerificationBonus = verificationBonus && getQuestVerificationPolicy(eq).mode === "photo";
  let xpGain = Math.round(diff.xp * 2.5);
  let goldGain = Math.round(diff.gold * 2.5);
  if (hasVerificationBonus) xpGain = Math.round(xpGain * 1.2);
  if (hasVerificationBonus) goldGain = Math.round(goldGain * 1.1);
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
    totalQuestsCompleted: (state.totalQuestsCompleted || 0) + 1,
    ...(hasVerificationBonus
      ? { ai: { ...(next.ai || {}), verifiedQuests: (next.ai?.verifiedQuests || 0) + 1 } }
      : {})
  };
  const { nextState: afterAch, newAchievements } = processAchievements(next);
  next = afterAch;

  return { nextState: next, didLevelUp, earnedPoints, newLevel, xpGain, goldGain, newAchievements, eq, wasVerified: hasVerificationBonus };
}
