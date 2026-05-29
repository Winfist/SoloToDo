// ─── REWARD FLOW BUILDERS ─────────────────────────────────────────────────────
// Pure utility module (no React hooks, no side effects).
// Each builder produces a RewardFlow object consumed by UnifiedResultModal
// and the animation controller in solo-leveling-v5.jsx.
//
// RewardFlow shape:
// {
//   id, source, variant,
//   summary: { title, subtitle, tone, systemLines[] },
//   rewards: [{ kind, label, value, accent, icon }],
//   highlights: [{ kind, title, body, priority }],
//   animationQueue: [{ type, payload, skippable }],
//   deferredUi: { xpFloat, passiveToasts[], systemMessages[], hiddenQuestModal, achievementPayloads[] },
//   suppressDuplicates: { achievementsShownInModal[], levelUpShownInModal }
// }

import { CATEGORIES, DIFFICULTIES, SHADOW_CLASSES } from '../data/gameData.js';
import { genId } from '../data/helpers.js';
import { getLocaleObject, getStateLocale, resolveLocale, translate } from '../data/i18n.js';
import { STAT_ICONS } from '../data/icons.js';

// Maps a quest category/stat to its custom stat icon (str/int/vit/agi/cha).
function statIconFor(cat, fallbackKey) {
  const statKey = String(cat?.stat || fallbackKey || '').toLowerCase();
  return STAT_ICONS[statKey] || null;
}

export function genFlowId() { return `flow_${genId()}`; }

function trFlow(locale, key, params = {}) {
  return translate(locale, `rewardFlows.${key}`, params);
}

function getFlowPool(localeOrMode, key) {
  const locale = resolveLocale(localeOrMode);
  const localized = getLocaleObject(locale)?.rewardFlows?.pools?.[key];
  const fallback = getLocaleObject("de")?.rewardFlows?.pools?.[key];
  return localized || fallback || MSG[key] || [];
}

// ─── SYSTEM TEXT POOL ─────────────────────────────────────────────────────────
const MSG = {
  boss: [
    ["S-Rang Quest bezwungen.", "Außergewöhnliche Leistung registriert.", "Die Macht des Monarchen wächst."],
    ["Boss eliminiert.", "Du hast das Unmögliche vollbracht.", "Die Schatten flüstern deinen Namen."],
    ["Ein Gegner weniger.", "Deine Stärke kennt keine Grenzen.", "Respekt, Hunter."],
  ],
  hard: [
    ["Schwere Herausforderung gemeistert.", "Das System erkennt wahre Stärke."],
    ["Beeindruckend.", "Wenige erreichen dieses Level."],
    ["Widerstand bezwungen.", "Dein Wille ist stärker als das Hindernis."],
  ],
  hidden: [["Verborgenes Wissen erlangt.", "Die Wahrheit enthüllt sich dem Würdigen."]],
  streak_high: [["${n}-Tage-Streak.", "Unaufhaltsam. Legendär."]],
  streak_mid: [["${n}-Tage-Streak.", "Disziplin formt Macht."]],
  streak_low: [["${n}-Tage-Streak aufgebaut.", "Beständigkeit wird belohnt."]],
  first: [["Tägliche Jagd beginnt.", "Zeige keine Schwäche, Hunter."]],
  penalty: [["Der Hunter kehrt zurück.", "Die Schatten warteten."]],
  levelup: [["Level ${lvl} erreicht.", "Neue Fähigkeiten freigeschaltet."]],
  emergency: [
    ["Notfallmission abgeschlossen.", "Unter Druck zeigt sich wahre Stärke.", "Doppelte Belohnungen gewährt."],
    ["Notfall neutralisiert.", "Das System erhöht deine Bewertung.", "Hervorragende Reaktionszeit."],
    ["Krisensituation gemeistert.", "Der Hunter beweist seine Klasse.", "Bonus-Belohnungen freigeschaltet."],
  ],
  normal: [
    ["Quest abgeschlossen.", "Weitermachen, Hunter."],
    ["Auftrag erfüllt.", "Jede Quest zählt."],
    ["Erledigt.", "Stärke wächst durch Beständigkeit."],
    ["Fortschritt registriert.", "Der nächste Schritt wartet."],
    ["Bestätigt.", "Aufgeben war nie eine Option."],
    ["Abgeschlossen.", "Das System vermerkt deinen Fortschritt."],
  ],
  dungeon_win: [
    ["Dungeon bezwungen.", "Die Beute gehört dem Sieger."],
    ["Vollständiger Sieg.", "Die Dunkelheit weicht zurück."],
    ["Gate geschlossen.", "Ein weiterer Triumph für den Monarchen."],
  ],
  dungeon_boss: [
    ["Boss-Gate bezwungen.", "Monumentale Leistung registriert.", "Die Schatten verneigen sich."],
    ["Dungeon-Monarch besiegt.", "Deine Macht ist ohne Gleichen.", "Das System erkennt den wahren Hunter."],
  ],
  dungeon_defeat: [
    ["Mission gescheitert.", "Der Hunter tritt zurück.", "Analysiere. Werde stärker."],
    ["Niederlage verzeichnet.", "Der Kampf ist verloren — nicht der Krieg."],
  ],
  story_chapter: [
    ["Kapitel abgeschlossen.", "Die Geschichte des Hunters schreitet voran."],
    ["Neues Wissen erlangt.", "Der Weg zum Monarchen wird klarer."],
  ],
  story_boss: [
    ["Erzfeind besiegt.", "Das Schicksal neigt sich dem Monarchen.", "Legende bestätigt."],
    ["Bossbegegnung überstanden.", "Der Hunter schreibt Geschichte."],
  ],
  protocol_perfect: [
    ["PERFECT RUN BESTÄTIGT.", "Absoluter Fokus. Absolute Disziplin.", "Das System honoriert Perfektion."],
    ["Makellos. Vollständig. Perfekt.", "Der Monarch kennt keine halben Maßnahmen."],
  ],
};

function pickMsg(arr) {
  if (!arr || !arr.length) return [];
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillMsg(lines, vars) {
  return lines.map(l =>
    l.replace("${n}", vars.n || "").replace("${lvl}", vars.lvl || "")
  );
}

function pickFlowMsg(locale, key) {
  return pickMsg(getFlowPool(locale, key));
}

function getQuestSystemLines(quest, ctx, locale) {
  const { streak, penaltyActive, isFirstToday, didLevelUp, newLevel } = ctx;
  if (didLevelUp) return fillMsg(pickFlowMsg(locale, "levelup"), { lvl: newLevel });
  if (penaltyActive) return pickFlowMsg(locale, "penalty");
  if (quest.type === "emergency") return pickFlowMsg(locale, "emergency");
  if (quest.difficulty === "boss") return pickFlowMsg(locale, "boss");
  if (quest.difficulty === "hard") return pickFlowMsg(locale, "hard");
  if (quest.type === "hidden") return pickFlowMsg(locale, "hidden");
  if (isFirstToday) return pickFlowMsg(locale, "first");
  if (streak >= 14) return fillMsg(pickFlowMsg(locale, "streak_high"), { n: streak });
  if (streak >= 7) return fillMsg(pickFlowMsg(locale, "streak_mid"), { n: streak });
  if (streak >= 3) return fillMsg(pickFlowMsg(locale, "streak_low"), { n: streak });
  return pickFlowMsg(locale, "normal");
}

// ─── BUILD: REGULAR QUEST ─────────────────────────────────────────────────────
export function buildQuestRewardFlow(result, oldLevel, rect, localeOrMode = null) {
  const {
    nextState, didLevelUp, earnedPoints, newLevel, xpGain, goldGain,
    ariseData, newNameds, soulLinkActive, notifications,
    newlyDiscoveredHQ, regressionSystemMessage, charismaDungeonSystemMessage,
    quest, newAchievements,
  } = result;
  const locale = localeOrMode || getStateLocale(nextState);

  const isBoss = quest.difficulty === 'boss';
  const variant = isBoss ? 'boss' : 'standard';
  const tone = isBoss ? 'gold' : 'cold';

  const cat = CATEGORIES.find(c => c.key === quest.category);
  const statGain = Math.ceil(xpGain / 40);

  // ── Rewards ──
  const rewards = [
    { kind: 'xp',   label: trFlow(locale, "labels.xp"), value: `+${xpGain} XP`,   accent: '#a78bfa', icon: '⚔' },
    { kind: 'gold', label: trFlow(locale, "labels.gold"), value: `+${goldGain} G`,  accent: '#fbbf24', icon: '◈' },
    { kind: 'stat', label: trFlow(locale, "labels.statIncreased", { stat: (cat?.stat || quest.category).toUpperCase() }), value: `+${statGain}`, accent: cat?.color || '#60a5fa', icon: '↑', iconSrc: statIconFor(cat, quest.category) },
  ];
  if (soulLinkActive) {
    rewards.push({ kind: 'bonus', label: trFlow(locale, "labels.soulLinkBonus"), value: '+25% XP', accent: '#f472b6', icon: '🔗' });
  }
  if (didLevelUp) {
    rewards.push({ kind: 'level', label: trFlow(locale, "labels.levelUp"), value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true });
  }

  // ── Highlights ──
  const highlights = [];
  const achievementsShownInModal = [];

  if (newAchievements && newAchievements.length) {
    newAchievements.forEach(a => {
      highlights.push({ kind: 'achievement', title: a.name, body: a.desc, priority: 2 });
      achievementsShownInModal.push(a.id);
    });
  }
  if (ariseData && (!newNameds || !newNameds.length)) {
    const cls = SHADOW_CLASSES?.[ariseData.class];
    highlights.push({
      kind: 'arise',
      title: trFlow(locale, "highlights.shadowAwakened", { name: ariseData.name }),
      body: cls ? trFlow(locale, "highlights.shadowClass", { className: cls.name }) : trFlow(locale, "highlights.shadowRaised"),
      priority: 1
    });
  }
  if (newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      highlights.push({ kind: 'named_shadow', title: `${ns.name} — ${ns.title || ''}`, body: trFlow(locale, "highlights.namedShadowUnlocked"), priority: 1 });
    });
  }
  if (regressionSystemMessage) {
    highlights.push({ kind: 'regression', title: regressionSystemMessage.title, body: regressionSystemMessage.lines[0], priority: 3 });
  }
  if (charismaDungeonSystemMessage) {
    highlights.push({ kind: 'charisma_dungeon', title: charismaDungeonSystemMessage.title, body: charismaDungeonSystemMessage.lines[0], priority: 2 });
  }
  if (newlyDiscoveredHQ && newlyDiscoveredHQ.length) {
    newlyDiscoveredHQ.forEach(hq => {
      highlights.push({ kind: 'hidden_quest', title: hq.title, body: hq.discoveryMsg || trFlow(locale, "highlights.hiddenQuestDiscovered"), priority: 2 });
    });
  }
  highlights.sort((a, b) => a.priority - b.priority);

  // ── Animation Queue ──
  const animationQueue = [];
  if (didLevelUp) {
    animationQueue.push({ type: 'levelup', payload: { level: newLevel, earnedPoints, oldLevel }, skippable: false });
  }
  if (ariseData && (!newNameds || !newNameds.length)) {
    animationQueue.push({ type: 'arise', payload: ariseData, skippable: true });
  }
  if (newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      animationQueue.push({ type: 'arise', payload: ns, skippable: true });
    });
  }
  if (regressionSystemMessage) {
    animationQueue.push({ type: 'system_message', payload: regressionSystemMessage, skippable: true });
  }
  if (charismaDungeonSystemMessage) {
    animationQueue.push({ type: 'system_message', payload: charismaDungeonSystemMessage, skippable: true });
  }

  // ── Deferred UI ──
  const excludeTypes = new Set(['levelup', 'shadow', 'named']);
  const passiveToasts = (notifications || [])
    .filter(n => !excludeTypes.has(n.type))
    .map((n, i) => ({ msg: n.msg, type: n.type, delayMs: i * 300 }));

  const hiddenQuestModal = (newlyDiscoveredHQ && newlyDiscoveredHQ.length > 0)
    ? newlyDiscoveredHQ[0]
    : null;

  const streak = nextState.streak || 0;
  const penaltyActive = nextState.penaltyZone?.active || false;
  const systemLines = getQuestSystemLines(quest, {
    streak, penaltyActive, isFirstToday: false, didLevelUp, newLevel
  }, locale);

  return {
    id: genFlowId(),
    source: 'quest',
    variant,
    summary: {
      title: trFlow(locale, "summary.questCompleted"),
      subtitle: quest.title,
      tone,
      systemLines,
    },
    rewards,
    highlights,
    animationQueue,
    deferredUi: {
      xpFloat: rect ? { x: rect.x - 20, y: rect.y, xp: xpGain, gold: goldGain } : null,
      passiveToasts,
      systemMessages: [],
      hiddenQuestModal,
      achievementPayloads: newAchievements || [],
    },
    suppressDuplicates: {
      achievementsShownInModal,
      levelUpShownInModal: didLevelUp,
    },
  };
}

// ─── BUILD: EMERGENCY QUEST ───────────────────────────────────────────────────
export function buildEmergencyRewardFlow(result, localeOrMode = null) {
  const { nextState, didLevelUp, earnedPoints, newLevel, xpGain, goldGain, newAchievements, eq } = result;
  const locale = localeOrMode || getStateLocale(nextState);

  const highlights = [];
  const achievementsShownInModal = [];
  if (newAchievements && newAchievements.length) {
    newAchievements.forEach(a => {
      highlights.push({ kind: 'achievement', title: a.name, body: a.desc, priority: 2 });
      achievementsShownInModal.push(a.id);
    });
  }
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: trFlow(locale, "highlights.statPointsEarned", { points: earnedPoints }), priority: 1 });
  }

  const animationQueue = [];
  if (didLevelUp) {
    animationQueue.push({ type: 'levelup', payload: { level: newLevel, earnedPoints, oldLevel: (nextState.level - (nextState._levelsGained || 1)) }, skippable: false });
  }

  const statGain = 2;
  const cat = eq ? CATEGORIES.find(c => c.key === eq.category) : null;

  return {
    id: genFlowId(),
    source: 'emergency',
    variant: 'emergency',
    summary: {
      title: trFlow(locale, "summary.emergencyCompleted"),
      subtitle: eq?.title || trFlow(locale, "summary.emergencyFallback"),
      tone: 'red',
      systemLines: pickFlowMsg(locale, "emergency"),
    },
    rewards: [
      { kind: 'xp',   label: trFlow(locale, "labels.emergencyXp"), value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      { kind: 'gold', label: trFlow(locale, "labels.emergencyGold"), value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' },
      { kind: 'stat', label: trFlow(locale, "labels.statIncreased", { stat: (cat?.stat || eq?.category || 'STAT').toUpperCase() }), value: `+${statGain}`, accent: '#ef4444', icon: '↑', iconSrc: statIconFor(cat, eq?.category) },
      ...(didLevelUp ? [{ kind: 'level', label: trFlow(locale, "labels.levelUp"), value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
    ],
    highlights,
    animationQueue,
    deferredUi: {
      xpFloat: null,
      passiveToasts: [],
      systemMessages: [],
      hiddenQuestModal: null,
      achievementPayloads: newAchievements || [],
    },
    suppressDuplicates: {
      achievementsShownInModal,
      levelUpShownInModal: didLevelUp,
    },
  };
}

// ─── BUILD: DUNGEON ───────────────────────────────────────────────────────────
export function buildDungeonRewardFlow(dungeon, result, didLevelUp, earnedPoints, newLevel, oldLevel, xpGain, goldGain, newNameds, newAchievements, artifactDrop = null, localeOrMode = "auto") {
  const locale = resolveLocale(localeOrMode);
  const won = result === 'win' || result?.won !== false;
  const variant = !won ? 'defeat' : (dungeon.difficulty === 'boss' ? 'boss' : 'standard');
  const tone = !won ? 'red' : (variant === 'boss' ? 'gold' : 'cold');

  const highlights = [];
  const achievementsShownInModal = [];

  if (newAchievements && newAchievements.length) {
    newAchievements.forEach(a => {
      highlights.push({ kind: 'achievement', title: a.name, body: a.desc, priority: 2 });
      achievementsShownInModal.push(a.id);
    });
  }
  if (didLevelUp && won) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: trFlow(locale, "highlights.statPointsEarned", { points: earnedPoints }), priority: 1 });
  }
  if (newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      highlights.push({ kind: 'named_shadow', title: `${ns.name} — ${ns.title || ''}`, body: trFlow(locale, "highlights.namedShadowUnlocked"), priority: 1 });
    });
  }
  // Gate Artifact highlight
  if (artifactDrop) {
    highlights.push({
      kind: 'artifact',
      title: `${artifactDrop.icon} ${artifactDrop.name}`,
      body: artifactDrop.desc,
      priority: 0, // Highest priority — show first
    });
  }
  highlights.sort((a, b) => a.priority - b.priority);

  const animationQueue = [];
  if (won && didLevelUp) {
    animationQueue.push({ type: 'levelup', payload: { level: newLevel, earnedPoints, oldLevel }, skippable: false });
  }
  if (won && newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      animationQueue.push({ type: 'arise', payload: ns, skippable: true });
    });
  }
  // Artifact discovery system message (after other animations)
  if (artifactDrop && artifactDrop.systemMessage) {
    animationQueue.push({
      type: 'system_message',
      payload: artifactDrop.systemMessage,
      skippable: true,
    });
  }

  const sysPoolKey = !won ? "dungeon_defeat" : (variant === 'boss' ? "dungeon_boss" : "dungeon_win");

  const rewards = won ? [
    { kind: 'xp',   label: trFlow(locale, "labels.dungeonXp"), value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
    { kind: 'gold', label: trFlow(locale, "labels.dungeonGold"), value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' },
    ...(didLevelUp ? [{ kind: 'level', label: trFlow(locale, "labels.levelUp"), value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
    ...(artifactDrop ? [{ kind: 'artifact', label: trFlow(locale, "labels.artifactDiscovered"), value: artifactDrop.name, accent: artifactDrop.color || '#f59e0b', icon: artifactDrop.icon || '⚡', special: true }] : []),
  ] : [
    { kind: 'defeat', label: trFlow(locale, "labels.defeat"), value: trFlow(locale, "labels.noReward"), accent: '#ef4444', icon: '✗' },
  ];

  return {
    id: genFlowId(),
    source: 'dungeon',
    variant,
    summary: {
      title: won ? trFlow(locale, "summary.dungeonWon") : trFlow(locale, "summary.dungeonFailed"),
      subtitle: dungeon.name || dungeon.title || 'Gate',
      tone,
      systemLines: pickFlowMsg(locale, sysPoolKey),
    },
    rewards,
    highlights,
    animationQueue,
    deferredUi: {
      xpFloat: null,
      passiveToasts: [],
      systemMessages: [],
      hiddenQuestModal: null,
      achievementPayloads: newAchievements || [],
    },
    suppressDuplicates: {
      achievementsShownInModal,
      levelUpShownInModal: didLevelUp && won,
    },
  };
}

// ─── BUILD: STORY CHAPTER ─────────────────────────────────────────────────────
export function buildStoryChapterRewardFlow(chapter, xpGain, goldGain, didLevelUp, newLevel, earnedPoints, localeOrMode = "auto") {
  const locale = resolveLocale(localeOrMode);
  const highlights = [];
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: trFlow(locale, "highlights.statPointsEarned", { points: earnedPoints || 0 }), priority: 1 });
  }

  const animationQueue = [];
  if (didLevelUp) {
    animationQueue.push({ type: 'levelup', payload: { level: newLevel, earnedPoints: earnedPoints || 0, oldLevel: newLevel - 1 }, skippable: false });
  }

  return {
    id: genFlowId(),
    source: 'story_chapter',
    variant: 'standard',
    summary: {
      title: trFlow(locale, "summary.storyChapterCompleted"),
      subtitle: chapter.title || trFlow(locale, "summary.storyChapterFallback"),
      tone: 'cold',
      systemLines: pickFlowMsg(locale, "story_chapter"),
    },
    rewards: [
      { kind: 'xp',   label: trFlow(locale, "labels.chapterXp"), value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      ...(goldGain > 0 ? [{ kind: 'gold', label: trFlow(locale, "labels.gold"), value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' }] : []),
      ...(didLevelUp ? [{ kind: 'level', label: trFlow(locale, "labels.levelUp"), value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
    ],
    highlights,
    animationQueue,
    deferredUi: {
      xpFloat: null,
      passiveToasts: [],
      systemMessages: [],
      hiddenQuestModal: null,
      achievementPayloads: [],
    },
    suppressDuplicates: {
      achievementsShownInModal: [],
      levelUpShownInModal: didLevelUp,
    },
  };
}

// ─── BUILD: STORY BOSS ────────────────────────────────────────────────────────
export function buildStoryBossRewardFlow(boss, xpGain, goldGain, didLevelUp, newLevel, earnedPoints, titleGranted, localeOrMode = "auto") {
  const locale = resolveLocale(localeOrMode);
  const highlights = [];
  if (titleGranted) {
    highlights.push({ kind: 'title', title: trFlow(locale, "highlights.titleGranted", { title: titleGranted }), body: trFlow(locale, "highlights.monarchLegacy"), priority: 1 });
  }
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: trFlow(locale, "highlights.statPointsEarned", { points: earnedPoints || 0 }), priority: 2 });
  }

  const animationQueue = [];
  if (didLevelUp) {
    animationQueue.push({ type: 'levelup', payload: { level: newLevel, earnedPoints: earnedPoints || 0, oldLevel: newLevel - 1 }, skippable: false });
  }

  return {
    id: genFlowId(),
    source: 'story_boss',
    variant: 'story_boss',
    summary: {
      title: trFlow(locale, "summary.storyBossDefeated"),
      subtitle: boss.name || boss.title || trFlow(locale, "summary.storyBossFallback"),
      tone: 'gold',
      systemLines: pickFlowMsg(locale, "story_boss"),
    },
    rewards: [
      { kind: 'xp',   label: trFlow(locale, "labels.bossXp"), value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      ...(goldGain > 0 ? [{ kind: 'gold', label: trFlow(locale, "labels.gold"), value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' }] : []),
      ...(didLevelUp ? [{ kind: 'level', label: trFlow(locale, "labels.levelUp"), value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
    ],
    highlights,
    animationQueue,
    deferredUi: {
      xpFloat: null,
      passiveToasts: [],
      systemMessages: [],
      hiddenQuestModal: null,
      achievementPayloads: [],
    },
    suppressDuplicates: {
      achievementsShownInModal: [],
      levelUpShownInModal: didLevelUp,
    },
  };
}

// ─── BUILD: PROTOCOL (DAWN/DUSK PERFECT RUN) ─────────────────────────────────
export function buildProtocolRewardFlow(run, xpGain, isPerfect, elapsed, localeOrMode = "auto") {
  const locale = resolveLocale(localeOrMode);
  const isDAWN = run?.type === 'dawn' || run?.protocol === 'dawn';
  const subtitle = isDAWN ? trFlow(locale, "summary.morningProtocol") : trFlow(locale, "summary.eveningProtocol");

  const systemMessage = {
    title: trFlow(locale, "summary.protocolPerfectConfirmed"),
    lines: [
      trFlow(locale, "protocol.allTasksCompleted"),
      trFlow(locale, "protocol.protocolName", { protocol: subtitle }),
      trFlow(locale, "protocol.disciplineRewarded"),
      trFlow(locale, "protocol.bonusGranted"),
    ],
  };

  return {
    id: genFlowId(),
    source: 'protocol',
    variant: 'perfect_run',
    summary: {
      title: 'PERFECT RUN',
      subtitle,
      tone: 'gold',
      systemLines: pickFlowMsg(locale, "protocol_perfect"),
    },
    rewards: [
      { kind: 'xp', label: trFlow(locale, "labels.protocolXpPerfect"), value: `+${xpGain} XP`, accent: '#fbbf24', icon: '★' },
    ],
    highlights: [],
    animationQueue: [
      { type: 'system_message', payload: systemMessage, skippable: true },
    ],
    deferredUi: {
      xpFloat: null,
      passiveToasts: [],
      systemMessages: [],
      hiddenQuestModal: null,
      achievementPayloads: [],
    },
    suppressDuplicates: {
      achievementsShownInModal: [],
      levelUpShownInModal: false,
    },
  };
}
