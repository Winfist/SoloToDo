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

export function genFlowId() { return `flow_${genId()}`; }

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
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillMsg(lines, vars) {
  return lines.map(l =>
    l.replace("${n}", vars.n || "").replace("${lvl}", vars.lvl || "")
  );
}

function getQuestSystemLines(quest, ctx) {
  const { streak, penaltyActive, isFirstToday, didLevelUp, newLevel } = ctx;
  if (didLevelUp) return fillMsg(pickMsg(MSG.levelup), { lvl: newLevel });
  if (penaltyActive) return pickMsg(MSG.penalty);
  if (quest.type === "emergency") return pickMsg(MSG.emergency);
  if (quest.difficulty === "boss") return pickMsg(MSG.boss);
  if (quest.difficulty === "hard") return pickMsg(MSG.hard);
  if (quest.type === "hidden") return pickMsg(MSG.hidden);
  if (isFirstToday) return pickMsg(MSG.first);
  if (streak >= 14) return fillMsg(pickMsg(MSG.streak_high), { n: streak });
  if (streak >= 7) return fillMsg(pickMsg(MSG.streak_mid), { n: streak });
  if (streak >= 3) return fillMsg(pickMsg(MSG.streak_low), { n: streak });
  return pickMsg(MSG.normal);
}

// ─── BUILD: REGULAR QUEST ─────────────────────────────────────────────────────
export function buildQuestRewardFlow(result, oldLevel, rect) {
  const {
    nextState, didLevelUp, earnedPoints, newLevel, xpGain, goldGain,
    ariseData, newNameds, soulLinkActive, notifications,
    newlyDiscoveredHQ, regressionSystemMessage, charismaDungeonSystemMessage,
    quest, newAchievements,
  } = result;

  const isBoss = quest.difficulty === 'boss';
  const variant = isBoss ? 'boss' : 'standard';
  const tone = isBoss ? 'gold' : 'cold';

  const cat = CATEGORIES.find(c => c.key === quest.category);
  const statGain = Math.ceil(xpGain / 40);

  // ── Rewards ──
  const rewards = [
    { kind: 'xp',   label: 'ERFAHRUNGSPUNKTE', value: `+${xpGain} XP`,   accent: '#a78bfa', icon: '⚔' },
    { kind: 'gold', label: 'GOLD ERHALTEN',     value: `+${goldGain} G`,  accent: '#fbbf24', icon: '◈' },
    { kind: 'stat', label: `${(cat?.stat || quest.category).toUpperCase()} ERHÖHT`, value: `+${statGain}`, accent: cat?.color || '#60a5fa', icon: '↑' },
  ];
  if (soulLinkActive) {
    rewards.push({ kind: 'bonus', label: 'SOUL LINK BONUS', value: '+25% XP', accent: '#f472b6', icon: '🔗' });
  }
  if (didLevelUp) {
    rewards.push({ kind: 'level', label: 'LEVEL UP', value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true });
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
    highlights.push({ kind: 'arise', title: `${ariseData.name} ist erwacht`, body: cls ? `Klasse: ${cls.name}` : 'Schatten erhoben', priority: 1 });
  }
  if (newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      highlights.push({ kind: 'named_shadow', title: `${ns.name} — ${ns.title || ''}`, body: 'Benannter Schatten freigeschaltet', priority: 1 });
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
      highlights.push({ kind: 'hidden_quest', title: hq.title, body: hq.discoveryMsg || 'Verborgene Quest entdeckt', priority: 2 });
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
  });

  return {
    id: genFlowId(),
    source: 'quest',
    variant,
    summary: {
      title: 'QUEST ABGESCHLOSSEN',
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
export function buildEmergencyRewardFlow(result) {
  const { nextState, didLevelUp, earnedPoints, newLevel, xpGain, goldGain, newAchievements, eq } = result;

  const highlights = [];
  const achievementsShownInModal = [];
  if (newAchievements && newAchievements.length) {
    newAchievements.forEach(a => {
      highlights.push({ kind: 'achievement', title: a.name, body: a.desc, priority: 2 });
      achievementsShownInModal.push(a.id);
    });
  }
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: `${earnedPoints} Stat-Punkte erhalten`, priority: 1 });
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
      title: 'NOTFALL BEWÄLTIGT',
      subtitle: eq?.title || 'Notfallmission',
      tone: 'red',
      systemLines: pickMsg(MSG.emergency),
    },
    rewards: [
      { kind: 'xp',   label: 'NOTFALL-XP (2.5×)', value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      { kind: 'gold', label: 'NOTFALL-GOLD (2.5×)', value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' },
      { kind: 'stat', label: `${(cat?.stat || eq?.category || 'STAT').toUpperCase()} ERHÖHT`, value: `+${statGain}`, accent: '#ef4444', icon: '↑' },
      ...(didLevelUp ? [{ kind: 'level', label: 'LEVEL UP', value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
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
export function buildDungeonRewardFlow(dungeon, result, didLevelUp, earnedPoints, newLevel, oldLevel, xpGain, goldGain, newNameds, newAchievements) {
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
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: `${earnedPoints} Stat-Punkte erhalten`, priority: 1 });
  }
  if (newNameds && newNameds.length) {
    newNameds.forEach(ns => {
      highlights.push({ kind: 'named_shadow', title: `${ns.name} — ${ns.title || ''}`, body: 'Benannter Schatten freigeschaltet', priority: 1 });
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

  const sysPool = !won ? MSG.dungeon_defeat : (variant === 'boss' ? MSG.dungeon_boss : MSG.dungeon_win);

  return {
    id: genFlowId(),
    source: 'dungeon',
    variant,
    summary: {
      title: won ? 'DUNGEON BEZWUNGEN' : 'DUNGEON GESCHEITERT',
      subtitle: dungeon.name || dungeon.title || 'Gate',
      tone,
      systemLines: pickMsg(sysPool),
    },
    rewards: won ? [
      { kind: 'xp',   label: 'DUNGEON-XP',   value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      { kind: 'gold', label: 'DUNGEON-GOLD',  value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' },
      ...(didLevelUp ? [{ kind: 'level', label: 'LEVEL UP', value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
    ] : [
      { kind: 'defeat', label: 'NIEDERLAGE', value: 'Kein Reward', accent: '#ef4444', icon: '✗' },
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
      levelUpShownInModal: didLevelUp && won,
    },
  };
}

// ─── BUILD: STORY CHAPTER ─────────────────────────────────────────────────────
export function buildStoryChapterRewardFlow(chapter, xpGain, goldGain, didLevelUp, newLevel, earnedPoints) {
  const highlights = [];
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: `${earnedPoints || 0} Stat-Punkte erhalten`, priority: 1 });
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
      title: 'KAPITEL ABGESCHLOSSEN',
      subtitle: chapter.title || 'Story-Kapitel',
      tone: 'cold',
      systemLines: pickMsg(MSG.story_chapter),
    },
    rewards: [
      { kind: 'xp',   label: 'KAPITEL-XP',   value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      ...(goldGain > 0 ? [{ kind: 'gold', label: 'GOLD ERHALTEN', value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' }] : []),
      ...(didLevelUp ? [{ kind: 'level', label: 'LEVEL UP', value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
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
export function buildStoryBossRewardFlow(boss, xpGain, goldGain, didLevelUp, newLevel, earnedPoints, titleGranted) {
  const highlights = [];
  if (titleGranted) {
    highlights.push({ kind: 'title', title: `Titel erhalten: "${titleGranted}"`, body: 'Permanentes Erbe des Monarchen', priority: 1 });
  }
  if (didLevelUp) {
    highlights.push({ kind: 'level_up', title: `LEVEL ${newLevel}`, body: `${earnedPoints || 0} Stat-Punkte erhalten`, priority: 2 });
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
      title: 'BOSS BESIEGT',
      subtitle: boss.name || boss.title || 'Story-Boss',
      tone: 'gold',
      systemLines: pickMsg(MSG.story_boss),
    },
    rewards: [
      { kind: 'xp',   label: 'BOSS-XP',    value: `+${xpGain} XP`,  accent: '#a78bfa', icon: '⚔' },
      ...(goldGain > 0 ? [{ kind: 'gold', label: 'GOLD ERHALTEN', value: `+${goldGain} G`, accent: '#fbbf24', icon: '◈' }] : []),
      ...(didLevelUp ? [{ kind: 'level', label: 'LEVEL UP', value: `Level ${newLevel}`, accent: '#ffffff', icon: '★', special: true }] : []),
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
export function buildProtocolRewardFlow(run, xpGain, isPerfect, elapsed) {
  const isDAWN = run?.type === 'dawn' || run?.protocol === 'dawn';
  const subtitle = isDAWN ? 'Morgenprotokoll' : 'Abendprotokoll';

  const systemMessage = {
    title: 'PERFECT RUN BESTÄTIGT',
    lines: [
      'Alle Aufgaben abgeschlossen.',
      `Protokoll: ${subtitle}`,
      'Das System honoriert absolute Disziplin.',
      'Bonus-XP für perfekte Ausführung gewährt.',
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
      systemLines: pickMsg(MSG.protocol_perfect),
    },
    rewards: [
      { kind: 'xp', label: 'PROTOKOLL-XP (PERFECT)', value: `+${xpGain} XP`, accent: '#fbbf24', icon: '★' },
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
