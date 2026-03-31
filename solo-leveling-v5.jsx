import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { JOBS } from "./data/jobs";
import { JOB_QUESTS } from "./data/jobQuests";

// ─── RANKS ────────────────────────────────────────────────────
const RANKS = [
  { name:"E",   label:"E-Rank Hunter",   minLv:1,  maxLv:10,  xpPerLv:100,  color:"#6b7280", glow:"rgba(107,114,128,0.4)" },
  { name:"D",   label:"D-Rank Hunter",   minLv:11, maxLv:20,  xpPerLv:250,  color:"#22d3ee", glow:"rgba(34,211,238,0.4)"  },
  { name:"C",   label:"C-Rank Hunter",   minLv:21, maxLv:35,  xpPerLv:500,  color:"#34d399", glow:"rgba(52,211,153,0.4)"  },
  { name:"B",   label:"B-Rank Hunter",   minLv:36, maxLv:50,  xpPerLv:900,  color:"#a78bfa", glow:"rgba(167,139,250,0.4)" },
  { name:"A",   label:"A-Rank Hunter",   minLv:51, maxLv:70,  xpPerLv:1500, color:"#f59e0b", glow:"rgba(245,158,11,0.4)"  },
  { name:"S",   label:"S-Rank Hunter",   minLv:71, maxLv:90,  xpPerLv:3000, color:"#ef4444", glow:"rgba(239,68,68,0.4)"   },
  { name:"SSS", label:"National Level",  minLv:91, maxLv:100, xpPerLv:6000, color:"#e879f9", glow:"rgba(232,121,249,0.4)" },
];

const DIFFICULTIES = [
  { key:"easy",   label:"Easy",   xp:20,  gold:10,  color:"#6b7280", icon:"◇" },
  { key:"normal", label:"Normal", xp:50,  gold:25,  color:"#22d3ee", icon:"◆" },
  { key:"hard",   label:"Hard",   xp:120, gold:60,  color:"#a78bfa", icon:"★" },
  { key:"boss",   label:"Boss",   xp:300, gold:150, color:"#ef4444", icon:"♛" },
];

const CATEGORIES = [
  { key:"str", label:"Strength",     full:"Sport / Fitness", stat:"STR", icon:"⚔️", color:"#ef4444" },
  { key:"int", label:"Intelligence", full:"Lernen / Lesen",  stat:"INT", icon:"📖", color:"#3b82f6" },
  { key:"vit", label:"Vitality",     full:"Erholung",        stat:"VIT", icon:"🛡️", color:"#22c55e" },
  { key:"agi", label:"Agility",      full:"Produktivität",   stat:"AGI", icon:"⚡", color:"#f59e0b" },
  { key:"cha", label:"Charisma",     full:"Soziales",        stat:"CHA", icon:"👥", color:"#a855f7" },
];

const STRATEGIES = [
  { key:"str", label:"Aggressive", desc:"Frontalangriff ohne Rücksicht",  icon:"⚔️", color:"#ef4444" },
  { key:"int", label:"Tactical",   desc:"Strategie, Täuschung & Planung", icon:"🧠", color:"#3b82f6" },
  { key:"vit", label:"Defensive",  desc:"Schildwall – Ausdauer gewinnt",  icon:"🛡️", color:"#22c55e" },
  { key:"agi", label:"Swift",      desc:"Schnell, lautlos, unsichtbar",   icon:"⚡", color:"#f59e0b" },
];

// ─── SHADOW ARMY DATA ─────────────────────────────────────────
const SHADOW_CLASSES = {
  soldier: {
    name:"Shadow Soldier", icon:"⚔️", color:"#64748b",
    baseStats:{ power:10, speed:10, loyalty:10, presence:5 },
    passiveEffect:"+2% XP von allen Quests",
    description:"Standard-Schattenkrieger"
  },
  knight: {
    name:"Shadow Knight", icon:"🛡️", color:"#3b82f6",
    baseStats:{ power:18, speed:8, loyalty:12, presence:7 },
    passiveEffect:"+5% Dungeon Verteidigung",
    description:"Gepanzerter Frontline-Kämpfer"
  },
  mage: {
    name:"Shadow Mage", icon:"🔮", color:"#a855f7",
    baseStats:{ power:8, speed:12, loyalty:10, presence:15 },
    passiveEffect:"+3% XP von INT-Quests",
    description:"Magischer Unterstützer"
  },
  assassin: {
    name:"Shadow Assassin", icon:"🗡️", color:"#22c55e",
    baseStats:{ power:14, speed:18, loyalty:8, presence:5 },
    passiveEffect:"+5% Gold von Dungeons",
    description:"Schneller Schattenangreifer"
  },
  healer: {
    name:"Shadow Healer", icon:"💚", color:"#14b8a6",
    baseStats:{ power:5, speed:10, loyalty:18, presence:12 },
    passiveEffect:"+1 Tag Streak-Schutz",
    description:"Beschützer der Armee"
  },
  commander: {
    name:"Shadow Commander", icon:"👑", color:"#f59e0b",
    baseStats:{ power:15, speed:12, loyalty:15, presence:18 },
    passiveEffect:"Alle Shadows +10% Stats",
    description:"Führt andere Shadows an",
    unlockCondition:"Mindestens 10 Shadows besitzen"
  },
};

const SHADOW_TIERS = {
  1:{ name:"Basic",     color:"#64748b", maxLevel:20, statMult:1.0, abilitySlots:1, evolutionCost:0,     glowIntensity:0.2 },
  2:{ name:"Elite",     color:"#3b82f6", maxLevel:35, statMult:1.3, abilitySlots:2, evolutionCost:500,   glowIntensity:0.4 },
  3:{ name:"Commander", color:"#a855f7", maxLevel:50, statMult:1.6, abilitySlots:3, evolutionCost:1500,  glowIntensity:0.6 },
  4:{ name:"Named",     color:"#f59e0b", maxLevel:75, statMult:2.0, abilitySlots:4, evolutionCost:5000,  glowIntensity:0.8 },
  5:{ name:"Monarch",   color:"#ef4444", maxLevel:100,statMult:3.0, abilitySlots:5, evolutionCost:20000, glowIntensity:1.0 },
};

const NAMED_SHADOWS = {
  igris: {
    id:"igris", name:"Igris", title:"The Bloodred Commander",
    class:"knight", tier:4, icon:"🩸",
    unlockCondition:{ type:"dungeon_rank", dungeonRank:"A", desc:"A-Rank Dungeon besiegen" },
    uniqueAbility:{ name:"Crimson Blade", effect:"Critical Strike +50% in Dungeons", icon:"⚔️" },
    lore:"Einst ein loyaler Ritter, nun der treueste Schatten des Monarchen.",
    glowColor:"#dc2626",
  },
  tank: {
    id:"tank", name:"Tank", title:"The Iron Fortress",
    class:"knight", tier:4, icon:"🛡️",
    unlockCondition:{ type:"stat", stat:"vit", value:100, desc:"VIT 100 erreichen" },
    uniqueAbility:{ name:"Unbreakable Defense", effect:"1x täglich: Dungeon-Schaden Immunität", icon:"🛡️" },
    lore:"Ein Koloss aus Schatten, unerschütterlich wie ein Berg.",
    glowColor:"#3b82f6",
  },
  beru: {
    id:"beru", name:"Beru", title:"The Ant King",
    class:"assassin", tier:4, icon:"🐜",
    unlockCondition:{ type:"dungeon_rank", dungeonRank:"S", desc:"S-Rank Dungeon besiegen" },
    uniqueAbility:{ name:"Consume", effect:"Absorbiert 5% der Boss-Stats permanent", icon:"👅" },
    lore:"Der gefallene König der Ameisen, wiedergeboren als Schatten.",
    glowColor:"#22c55e",
  },
  bellion: {
    id:"bellion", name:"Bellion", title:"The Grand Marshal",
    class:"commander", tier:5, icon:"⚜️",
    unlockCondition:{ type:"level", value:90, desc:"Level 90 erreichen" },
    uniqueAbility:{ name:"Army Command", effect:"Kann gesamte Shadow Army gleichzeitig kommandieren", icon:"👑" },
    lore:"Der oberste General des ursprünglichen Shadow Monarchen.",
    glowColor:"#f59e0b",
  },
};

const FORMATION_SLOTS = {
  vanguard:  { name:"Vanguard",  maxSlots:3, bonus:"+15% Aggressive Strategy", icon:"⚔️", preferredClasses:["knight","soldier"], color:"#ef4444" },
  core:      { name:"Core",      maxSlots:5, bonus:"+10% All Strategies",       icon:"🛡️", preferredClasses:["any"],              color:"#6366f1" },
  rearguard: { name:"Rearguard", maxSlots:2, bonus:"+20% XP & Gold",            icon:"🎯", preferredClasses:["mage","healer","assassin"], color:"#22c55e" },
};

// Class assignment based on quest category & difficulty
function assignShadowClass(quest, playerLevel) {
  if (quest.difficulty === "boss") {
    const roll = Math.random();
    if (playerLevel >= 50 && roll < 0.05) return "commander";
    if (roll < 0.25) return "knight";
    if (roll < 0.45) return "assassin";
    return "soldier";
  }
  const catMap = { str:"knight", int:"mage", vit:"healer", agi:"assassin", cha:"soldier" };
  return catMap[quest.category] || "soldier";
}

function assignShadowTier(quest) {
  const diffMap = { easy:1, normal:1, hard:2, boss:3 };
  return diffMap[quest.difficulty] || 1;
}

function calcShadowXpToNext(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

function createShadowFromQuest(quest, playerLevel) {
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
      power:    Math.round(baseStats.power    * tierData.statMult),
      speed:    Math.round(baseStats.speed    * tierData.statMult),
      loyalty:  Math.round(baseStats.loyalty  * tierData.statMult),
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

function calcFormationBonus(shadowArmy, allShadowsActive=false) {
  if (!shadowArmy) return { dungeonBonus:0, xpBonus:0, goldBonus:0 };
  const deployed = (shadowArmy.shadows||[]).filter(s=>allShadowsActive || s.isDeployed);
  let dungeonBonus = 0, xpBonus = 0, goldBonus = 0;
  const vCount = deployed.filter(s=>s.deploymentSlot==="vanguard").length;
  const cCount  = deployed.filter(s=>s.deploymentSlot==="core").length;
  const rCount  = deployed.filter(s=>s.deploymentSlot==="rearguard").length;
  if (vCount >= 2) dungeonBonus += 15;
  if (cCount >= 3) dungeonBonus += 10;
  if (rCount >= 1) { xpBonus += 20; goldBonus += 20; }
  // Named shadows
  const named = deployed.filter(s=>s.isNamed);
  named.forEach(s=>{ dungeonBonus += 10; xpBonus += 5; });
  // Commander bonus
  const hasCommander = deployed.some(s=>s.class==="commander");
  if (hasCommander) { dungeonBonus += 5; xpBonus += 5; goldBonus += 5; }
  return { dungeonBonus, xpBonus: xpBonus/100, goldBonus: goldBonus/100 };
}

function checkNamedShadowUnlocks(state) {
  const earned = [];
  const army = state.shadowArmy;
  if (!army) return earned;
  const alreadyHas = id => army.shadows.some(s=>s.id===id||s.namedId===id);

  Object.values(NAMED_SHADOWS).forEach(ns => {
    if (alreadyHas(ns.id)) return;
    const { type, dungeonRank, stat, value } = ns.unlockCondition;
    let unlocked = false;
    if (type==="dungeon_rank") {
      unlocked = (state.dungeonHistory||[]).some(d=>d.won&&d.dungeonRank===dungeonRank);
    } else if (type==="stat") {
      unlocked = (state.stats?.[stat]||0) >= value;
    } else if (type==="level") {
      unlocked = state.level >= value;
    }
    if (unlocked) earned.push(ns);
  });
  return earned;
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:"first_quest",    name:"Erste Schritte",       icon:"⚔️",  desc:"Schließe deine erste Quest ab",        cat:"quests",   check: s => (s.totalQuestsCompleted||0) >= 1,    reward:{ xp:50,   gold:20  } },
  { id:"quests_10",      name:"Fleißiger Hunter",      icon:"📋",  desc:"Schließe 10 Quests ab",                cat:"quests",   check: s => (s.totalQuestsCompleted||0) >= 10,   reward:{ xp:100,  gold:50  } },
  { id:"quests_50",      name:"Quest Meister",         icon:"🏆",  desc:"Schließe 50 Quests ab",                cat:"quests",   check: s => (s.totalQuestsCompleted||0) >= 50,   reward:{ xp:500,  gold:200 } },
  { id:"quests_100",     name:"Legendärer Hunter",     icon:"👑",  desc:"Schließe 100 Quests ab",               cat:"quests",   check: s => (s.totalQuestsCompleted||0) >= 100,  reward:{ xp:1000, gold:500, title:"Legendary Hunter" } },
  { id:"boss_first",     name:"Besieger",              icon:"💀",  desc:"Schließe deine erste Boss-Quest ab",   cat:"quests",   check: s => (s.shadowArmy?.shadows||[]).length >= 1, reward:{ xp:200, gold:100 } },
  { id:"boss_5",         name:"Schattenherr",          icon:"🌑",  desc:"Beschwöre 5 Schatten",                 cat:"shadows",  check: s => (s.shadowArmy?.shadows||[]).length >= 5, reward:{ xp:400, gold:200 } },
  { id:"boss_15",        name:"Schattenmonarch",       icon:"☠️",  desc:"Beschwöre 15 Schatten",                cat:"shadows",  check: s => (s.shadowArmy?.shadows||[]).length >= 15, reward:{ xp:1500, gold:600, title:"Shadow Monarch" } },
  { id:"shadow_named",   name:"Erste Berufung",        icon:"🩸",  desc:"Erwecke einen Named Shadow",           cat:"shadows",  check: s => (s.shadowArmy?.shadows||[]).some(sh=>sh.isNamed), reward:{ xp:800, gold:400, title:"Shadow Sovereign" } },
  { id:"shadow_tier3",   name:"Elite Armee",           icon:"💜",  desc:"Habe einen Tier-3 Shadow",             cat:"shadows",  check: s => (s.shadowArmy?.shadows||[]).some(sh=>sh.tier>=3), reward:{ xp:600, gold:300 } },
  { id:"formation_full", name:"Volles Kommando",       icon:"🎖️",  desc:"Fülle alle Formation-Slots",          cat:"shadows",  check: s => {const a=s.shadowArmy;if(!a)return false;const d=a.shadows.filter(sh=>sh.isDeployed);return d.filter(sh=>sh.deploymentSlot==="vanguard").length>=3&&d.filter(sh=>sh.deploymentSlot==="core").length>=5;}, reward:{ xp:1000, gold:500 } },
  { id:"streak_3",       name:"Beständigkeit",         icon:"🔥",  desc:"Erreiche einen 3-Tage Streak",         cat:"streaks",  check: s => (s.streak||0) >= 3,                  reward:{ xp:100,  gold:50  } },
  { id:"streak_7",       name:"Unaufhaltsam",          icon:"⚡",  desc:"Erreiche einen 7-Tage Streak",         cat:"streaks",  check: s => (s.streak||0) >= 7,                  reward:{ xp:300,  gold:150, title:"Unstoppable" } },
  { id:"streak_30",      name:"Eiserne Disziplin",     icon:"💎",  desc:"Erreiche einen 30-Tage Streak",        cat:"streaks",  check: s => (s.streak||0) >= 30,                 reward:{ xp:2000, gold:1000, title:"Iron Discipline" } },
  { id:"level_10",       name:"Erweckung",             icon:"✨",  desc:"Erreiche Level 10",                    cat:"progress", check: s => s.level >= 10,                        reward:{ xp:100,  gold:50  } },
  { id:"rank_d",         name:"D-Rang Aufstieg",       icon:"🌀",  desc:"Erreiche D-Rang (Level 11)",           cat:"progress", check: s => s.level >= 11,                        reward:{ xp:300,  gold:150 } },
  { id:"rank_c",         name:"C-Rang Aufstieg",       icon:"💚",  desc:"Erreiche C-Rang (Level 21)",           cat:"progress", check: s => s.level >= 21,                        reward:{ xp:600,  gold:300 } },
  { id:"rank_b",         name:"B-Rang Aufstieg",       icon:"💜",  desc:"Erreiche B-Rang (Level 36)",           cat:"progress", check: s => s.level >= 36,                        reward:{ xp:1200, gold:600 } },
  { id:"rank_a",         name:"A-Rang Aufstieg",       icon:"🧡",  desc:"Erreiche A-Rang (Level 51)",           cat:"progress", check: s => s.level >= 51,                        reward:{ xp:2500, gold:1000, title:"A-Rank Hunter" } },
  { id:"rank_s",         name:"S-Rang Aufstieg",       icon:"❤️",  desc:"Erreiche S-Rang (Level 71)",           cat:"progress", check: s => s.level >= 71,                        reward:{ xp:5000, gold:2000, title:"S-Rank Hunter" } },
  { id:"dungeon_first",  name:"Gate Öffner",           icon:"🌀",  desc:"Bezwinge deinen ersten Dungeon",       cat:"dungeons", check: s => (s.dungeonHistory||[]).filter(d=>d.won).length >= 1, reward:{ xp:200, gold:100 } },
  { id:"dungeon_10",     name:"Dungeon Meister",       icon:"🏯",  desc:"Bezwinge 10 Dungeons",                 cat:"dungeons", check: s => (s.dungeonHistory||[]).filter(d=>d.won).length >= 10, reward:{ xp:800, gold:400 } },
  { id:"dungeon_25",     name:"Gate Legende",          icon:"⚡",  desc:"Bezwinge 25 Dungeons",                 cat:"dungeons", check: s => (s.dungeonHistory||[]).filter(d=>d.won).length >= 25, reward:{ xp:2000, gold:800, title:"Gate Legend" } },
  { id:"str_20",         name:"Krieger",               icon:"💪",  desc:"Erreiche STR 20",                      cat:"stats",    check: s => (s.stats?.str||0) >= 20,              reward:{ xp:150,  gold:75  } },
  { id:"int_20",         name:"Gelehrter",             icon:"🧠",  desc:"Erreiche INT 20",                      cat:"stats",    check: s => (s.stats?.int||0) >= 20,              reward:{ xp:150,  gold:75  } },
  { id:"vit_20",         name:"Eiserner Körper",       icon:"🛡️",  desc:"Erreiche VIT 20",                      cat:"stats",    check: s => (s.stats?.vit||0) >= 20,              reward:{ xp:150,  gold:75  } },
  { id:"agi_20",         name:"Blitzschnell",          icon:"💨",  desc:"Erreiche AGI 20",                      cat:"stats",    check: s => (s.stats?.agi||0) >= 20,              reward:{ xp:150,  gold:75  } },
  { id:"all_stats_10",   name:"Ausgewogener Hunter",   icon:"⭐",  desc:"Alle Stats auf 10",                    cat:"stats",    check: s => Object.values(s.stats||{}).every(v=>v>=10), reward:{ xp:400, gold:200 } },
  { id:"gold_1000",      name:"Goldfieber",            icon:"💰",  desc:"Sammle insgesamt 1000 Gold",           cat:"misc",     check: s => (s.totalGoldEarned||0) >= 1000,       reward:{ xp:200,  gold:0   } },
  { id:"equip_first",    name:"Ausgerüstet",           icon:"🗡️",  desc:"Equipe dein erstes Item",              cat:"misc",     check: s => Object.values(s.equipment?.slots||{}).some(v=>v), reward:{ xp:100, gold:50 } },
];

// ─── SKILLS ───────────────────────────────────────────────────
const SKILLS = [
  { id:"power_strike",  name:"Power Strike",      icon:"⚔️", stat:"str", threshold:10, desc:"+5% XP aus STR-Quests",                 effect:{ type:"xp_bonus_cat",  cat:"str", bonus:0.05 } },
  { id:"berserker",     name:"Berserker Instinct", icon:"🔥", stat:"str", threshold:25, desc:"+15% XP aus Hard & Boss Quests",         effect:{ type:"xp_hard_bonus", bonus:0.15 } },
  { id:"quick_learner", name:"Quick Learner",      icon:"📖", stat:"int", threshold:10, desc:"+5% XP aus INT-Quests",                 effect:{ type:"xp_bonus_cat",  cat:"int", bonus:0.05 } },
  { id:"tactical_mind", name:"Tactical Mind",      icon:"🧠", stat:"int", threshold:25, desc:"+10% Dungeon Erfolgswahrscheinlichkeit", effect:{ type:"dungeon_bonus", bonus:10 } },
  { id:"resilience",    name:"Resilience",         icon:"🛡️", stat:"vit", threshold:10, desc:"1 Tag Streak-Schutz",                   effect:{ type:"streak_shield", days:1 } },
  { id:"iron_will",     name:"Iron Will",          icon:"💪", stat:"vit", threshold:25, desc:"+2 Tage Streak-Schutz",                 effect:{ type:"streak_shield", days:2 } },
  { id:"swift_fingers", name:"Swift Fingers",      icon:"💨", stat:"agi", threshold:10, desc:"+5% Gold aus allen Quests",             effect:{ type:"gold_bonus",    bonus:0.05 } },
  { id:"shadow_step",   name:"Shadow Step",        icon:"🌑", stat:"agi", threshold:25, desc:"+10% Erfolg mit AGI-Strategie",         effect:{ type:"strat_bonus",   strat:"agi", bonus:10 } },
  { id:"presence",      name:"Sovereign Presence", icon:"👥", stat:"cha", threshold:10, desc:"+3% XP Bonus global",                   effect:{ type:"xp_global",     bonus:0.03 } },
  { id:"cmd_aura",      name:"Commanding Aura",    icon:"👑", stat:"cha", threshold:25, desc:"Schatten-Boss-Quests +30% XP",          effect:{ type:"shadow_xp",     bonus:0.30 } },
];

// ─── DUNGEON MODIFIERS ────────────────────────────────────────
const DUNGEON_MODIFIERS = [
  { id:"blood_moon",  name:"Blood Moon",     icon:"🌙", desc:"+50% XP, +15% Schwierigkeit",  xpMult:1.5, diffMod:15,  color:"#ef4444" },
  { id:"dense_mana",  name:"Dense Mana",     icon:"💜", desc:"INT-Strategien +20% Erfolg",   intBonus:20,              color:"#a78bfa" },
  { id:"blessing",    name:"Hunter's Bless", icon:"✨", desc:"+10% Erfolg für alle Gates",    successBonus:10,          color:"#f59e0b" },
  { id:"shadow_surge",name:"Shadow Surge",   icon:"🌑", desc:"Boss-Quest XP x2",             shadowXpMult:2.0,         color:"#6366f1" },
  { id:"double_loot", name:"Double Loot",    icon:"💰", desc:"+60% Gold aus Dungeons",        goldMult:1.6,             color:"#22c55e" },
  { id:"none",        name:"Stable Gates",   icon:"🌀", desc:"Keine besonderen Bedingungen",                            color:"#64748b" },
];

// ─── SPRINT 3: DUNGEON ENHANCEMENTS ──────────────────────────

const FLOOR_TYPES = {
  combat:     { name:"Combat",     icon:"⚔️",  color:"#ef4444", desc:"Gegner blockieren den Weg",       safeRoom:false },
  elite:      { name:"Elite",      icon:"💀",  color:"#a855f7", desc:"Mächtiger Elite-Gegner",           safeRoom:false },
  puzzle:     { name:"Puzzle",     icon:"🔮",  color:"#3b82f6", desc:"Magisches Rätsel – INT hilft",     safeRoom:false },
  trap:       { name:"Trap",       icon:"⚡",  color:"#f59e0b", desc:"Fallen-Korridor – AGI gefragt",    safeRoom:false },
  safe_room:  { name:"Safe Room",  icon:"🏕️",  color:"#22c55e", desc:"Erholungsraum – Heilt Ausdauer",  safeRoom:true  },
  treasure:   { name:"Treasure",   icon:"💰",  color:"#fbbf24", desc:"Schatzkammer – Bonus-Gold",        safeRoom:false },
  ambush:     { name:"Ambush",     icon:"🗡️",  color:"#dc2626", desc:"Hinterhalt! Vorsicht geboten",     safeRoom:false },
  boss_arena: { name:"Boss Arena", icon:"👑",  color:"#e879f9", desc:"Endboss-Kammer",                  safeRoom:false },
};

const BOSS_PHASES = {
  E: [
    { phase:1, name:"Awakening",   hp:100, desc:"Boss erwacht aus dem Schlaf",          icon:"👹", atkMod:1.0, color:"#6b7280" },
    { phase:2, name:"Frenzy",      hp:50,  desc:"Boss greift wild um sich!",             icon:"😤", atkMod:1.5, color:"#f59e0b" },
    { phase:3, name:"Last Stand",  hp:20,  desc:"Verzweifelte letzte Anstrengung",        icon:"💀", atkMod:2.0, color:"#ef4444" },
  ],
  D: [
    { phase:1, name:"Dominant",    hp:100, desc:"Boss dominiert das Schlachtfeld",        icon:"🏯", atkMod:1.0, color:"#22d3ee" },
    { phase:2, name:"Berserker",   hp:60,  desc:"Boss verfällt in den Berserkermodus!",   icon:"🔥", atkMod:1.6, color:"#f59e0b" },
    { phase:3, name:"Death's Door",hp:25,  desc:"Boss kämpft ums Überleben!",             icon:"☠️", atkMod:2.2, color:"#ef4444" },
  ],
  C: [
    { phase:1, name:"Composed",    hp:100, desc:"Boss bleibt kalkulierend",               icon:"❄️", atkMod:1.0, color:"#34d399" },
    { phase:2, name:"Unleashed",   hp:65,  desc:"Boss entfesselt versteckte Macht!",      icon:"💥", atkMod:1.7, color:"#a78bfa" },
    { phase:3, name:"Omega Form",  hp:30,  desc:"Boss erreicht seine ultimative Form!",   icon:"🌌", atkMod:2.5, color:"#e879f9" },
  ],
  B: [
    { phase:1, name:"Sovereign",   hp:100, desc:"Boss regiert das Schlachtfeld",          icon:"🐉", atkMod:1.2, color:"#a78bfa" },
    { phase:2, name:"Ascended",    hp:70,  desc:"Boss steigt auf eine höhere Ebene!",     icon:"🌑", atkMod:1.9, color:"#6366f1" },
    { phase:3, name:"True Form",   hp:35,  desc:"Boss enthüllt seine wahre Gestalt!",     icon:"👁️",  atkMod:2.8, color:"#ef4444" },
  ],
  A: [
    { phase:1, name:"Majestic",    hp:100, desc:"Boss demonstriert überwältigende Macht", icon:"🏰", atkMod:1.3, color:"#f59e0b" },
    { phase:2, name:"Catastrophic",hp:70,  desc:"Katastrophale Energie entweicht!",       icon:"⚡", atkMod:2.1, color:"#dc2626" },
    { phase:3, name:"Calamity",    hp:40,  desc:"Katastrophenform aktiviert!",             icon:"🌪️", atkMod:3.0, color:"#e879f9" },
  ],
  S: [
    { phase:1, name:"Monarch",     hp:100, desc:"Ein Monarch betritt das Feld",           icon:"👑", atkMod:1.5, color:"#e879f9" },
    { phase:2, name:"Transcendent",hp:75,  desc:"Transzendiert Zeit und Raum!",           icon:"🌌", atkMod:2.5, color:"#f59e0b" },
    { phase:3, name:"World Ender", hp:45,  desc:"Die Welt bebt – Alles oder Nichts!",     icon:"💀", atkMod:4.0, color:"#ef4444" },
  ],
};

// Generate floor plan for a dungeon
function generateFloorPlan(dungeon) {
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

// Get floor event logs
function getFloorLogs(floor, dungeon, strategy, playerStats, isStrong, isWeak) {
  const ft = FLOOR_TYPES[floor.type];
  const events = {
    combat: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Gegner in Sichtweite!`, type:"system" },
      { text:isStrong ? "Überwältigende Kraft! Gegner fliehen!" : "Schwerer Kampf – Schritt für Schritt.", type: isStrong?"success":"action" },
    ],
    elite: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Ein mächtiger Gegner!`, type:"danger" },
      { text: isWeak ? "⚠ Kritische Gefahr! Alle Reserven mobilisiert!" : "Elite-Gegner konfrontiert – Klinge geschwungen!", type: isWeak?"danger":"action" },
    ],
    puzzle: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Runen leuchten auf...`, type:"info" },
      { text:(playerStats.int||0)>=15 ? "🧠 Mana-Rätsel entschlüsselt! Weg frei!" : "Rätsel gelöst... fast. Energie verbraucht.", type:"info" },
    ],
    trap: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Boden ist instabil!`, type:"warning" },
      { text:(playerStats.agi||0)>=15 ? "⚡ Fallen blitzschnell umgangen!" : "Fallen aktiviert – Schaden genommen!", type:"warning" },
    ],
    safe_room: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Ein sicherer Ort!`, type:"success" },
      { text:"Ausdauer wiederhergestellt. Shadow Army ruht sich aus.", type:"success" },
    ],
    treasure: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – Schätze locken!`, type:"gold" },
      { text:"Schatzkiste geöffnet! Gold-Bonus erhalten.", type:"gold" },
    ],
    ambush: [
      { text:`Boden ${floor.floor}: ${ft.icon} ${ft.name} – HINTERHALT!`, type:"danger" },
      { text:isStrong ? "Hinterhalt abgewehrt! Gegner ausgelöscht!" : "Hinterhalt! Schwere Gegenwehr nötig!", type: isStrong?"success":"danger" },
    ],
    boss_arena: [],
  };
  return events[floor.type] || [{ text:`Boden ${floor.floor} betritt...`, type:"system" }];
}

// ─── SPRINT 2: QUEST SYSTEM 2.0 ──────────────────────────────

const QUEST_TYPES_CONFIG = {
  side:      { label:"Side",      color:"#a78bfa", icon:"📋", xpMult:1.0, goldMult:1.0 },
  daily:     { label:"Daily",     color:"#22d3ee", icon:"📅", xpMult:1.2, goldMult:1.2 },
  weekly:    { label:"Weekly",    color:"#8b5cf6", icon:"📆", xpMult:2.0, goldMult:2.0 },
  emergency: { label:"Emergency", color:"#ef4444", icon:"🚨", xpMult:2.5, goldMult:2.5 },
  chained:   { label:"Chained",   color:"#f59e0b", icon:"⛓️", xpMult:1.0, goldMult:1.0 },
  hidden:    { label:"Hidden",    color:"#6366f1", icon:"❓", xpMult:3.0, goldMult:3.0 },
};

const HIDDEN_QUESTS = [
  {
    id:"hq_shadow_whisper",
    title:"Shadow's Whisper",
    desc:"Du hörst eine Stimme im Dunkeln...",
    category:"cha", difficulty:"hard",
    triggerCondition:{ type:"shadow_count", value:3 },
    discoveryMsg:"Die Stimmen der Gefallenen sprechen zu dir.",
    reward:{ xpMult:3, goldMult:3 },
  },
  {
    id:"hq_thousand_cuts",
    title:"A Thousand Cuts",
    desc:"Kleine Siege führen zum großen Sieg.",
    category:"agi", difficulty:"normal",
    triggerCondition:{ type:"total_quests", value:10 },
    discoveryMsg:"Deine Ausdauer hat eine verborgene Quest enthüllt.",
    reward:{ xpMult:3, goldMult:2 },
  },
  {
    id:"hq_iron_resolve",
    title:"Iron Resolve",
    desc:"Dein Wille ist stärker als jede Mauer.",
    category:"vit", difficulty:"hard",
    triggerCondition:{ type:"streak", value:5 },
    discoveryMsg:"Ein Streak von 5 Tagen hat eine verborgene Quest freigeschaltet!",
    reward:{ xpMult:3, goldMult:3 },
  },
  {
    id:"hq_mind_palace",
    title:"Mind Palace",
    desc:"Die Stille zwischen den Gedanken ist Kraft.",
    category:"int", difficulty:"hard",
    triggerCondition:{ type:"stat_value", stat:"int", value:20 },
    discoveryMsg:"Dein Intellekt hat eine verborgene Kammer geöffnet.",
    reward:{ xpMult:4, goldMult:2 },
  },
  {
    id:"hq_berserker_trial",
    title:"Berserker's Trial",
    desc:"Kämpfe bis zur letzten Kraft.",
    category:"str", difficulty:"boss",
    triggerCondition:{ type:"stat_value", stat:"str", value:25 },
    discoveryMsg:"Eine legendäre Prüfung erwartet dich.",
    reward:{ xpMult:5, goldMult:4 },
  },
];

// Check which hidden quests should be triggered
function checkHiddenQuestTriggers(state) {
  const hidden = state.hiddenQuests || { discovered:[], completed:[] };
  const discovered = hidden.discovered || [];
  const completed = hidden.completed || [];
  const newlyDiscovered = [];
  for (const hq of HIDDEN_QUESTS) {
    if (discovered.includes(hq.id)||completed.includes(hq.id)) continue;
    const tc = hq.triggerCondition;
    let triggered = false;
    if (tc.type==="shadow_count") triggered = (state.shadowArmy?.shadows||[]).length >= tc.value;
    if (tc.type==="total_quests") triggered = (state.totalQuestsCompleted||0) >= tc.value;
    if (tc.type==="streak") triggered = (state.streak||0) >= tc.value;
    if (tc.type==="stat_value") triggered = (state.stats?.[tc.stat]||0) >= tc.value;
    if (triggered) newlyDiscovered.push(hq);
  }
  return newlyDiscovered;
}

// Generate the daily emergency quest (resets each day)
function generateEmergencyQuest(playerLevel) {
  const templates = [
    { title:"NOTFALL: Körperlicher Einsatz gefordert", category:"str", difficulty:"hard",
      desc:"Das System verlangt sofortigen körperlichen Einsatz!" },
    { title:"NOTFALL: Geistige Ausdauer testen", category:"int", difficulty:"hard",
      desc:"Keine Pause – Wissen ist Macht!" },
    { title:"NOTFALL: Erholungsprotokoll aktiviert", category:"vit", difficulty:"hard",
      desc:"Dein Körper benötigt sofortige Erholung." },
    { title:"NOTFALL: Agilitäts-Direktive", category:"agi", difficulty:"hard",
      desc:"Bewegung ist Überleben. Jetzt handeln!" },
    { title:"NOTFALL: Soziale Mission", category:"cha", difficulty:"normal",
      desc:"Ein Hunter muss auch ohne Klinge kämpfen können." },
  ];
  const seed = parseInt(getToday().replace(/-/g,"")) % templates.length;
  const tmpl = templates[seed];
  const expires = new Date(); expires.setHours(23,59,59,999);
  return {
    id: `emergency_${getToday()}`,
    ...tmpl,
    type: "emergency",
    timeLimit: expires.toISOString(),
    xpMult: 2.5, goldMult: 2.5,
    createdAt: getToday(),
    systemMessage:"NOTFALL-QUEST DETEKTIERT. Sofortiges Handeln erforderlich.",
  };
}

// Generate a new chained quest
function generateChainedQuest(baseTitle, category, difficulty, step, totalSteps) {
  return {
    id: genId(),
    title: baseTitle,
    category, difficulty,
    type: "chained",
    chainStep: step,
    chainTotal: totalSteps,
    chainMultiplier: 1 + (step - 1) * 0.25,
    createdAt: getToday(),
  };
}

// ─── EQUIPMENT ────────────────────────────────────────────────
const EQUIPMENT_POOL = [
  { id:"iron_dagger",      slot:"weapon", name:"Iron Dagger",        rarity:"common",    icon:"🗡️",  ranks:["E"],     bonus:{ xpBonus:0.03 },                            desc:"+3% XP" },
  { id:"hunters_blade",    slot:"weapon", name:"Hunter's Blade",     rarity:"uncommon",  icon:"⚔️",  ranks:["D"],     bonus:{ xpBonus:0.06 },                            desc:"+6% XP" },
  { id:"shadow_sword",     slot:"weapon", name:"Shadow Sword",       rarity:"rare",      icon:"🌑",  ranks:["C"],     bonus:{ xpBonus:0.10, goldBonus:0.05 },            desc:"+10% XP, +5% Gold" },
  { id:"void_blade",       slot:"weapon", name:"Void Blade",         rarity:"epic",      icon:"💜",  ranks:["B"],     bonus:{ xpBonus:0.15, strBonus:5 },               desc:"+15% XP, +5 STR" },
  { id:"demon_king_blade", slot:"weapon", name:"Demon King's Blade", rarity:"legendary", icon:"🔱",  ranks:["A","S"], bonus:{ xpBonus:0.25, strBonus:10, goldBonus:0.10 }, desc:"+25% XP, +10 STR, +10% Gold" },
  { id:"leather_armor",    slot:"armor",  name:"Leather Armor",      rarity:"common",    icon:"🧥",  ranks:["E"],     bonus:{ streakShield:1 },                          desc:"+1 Streak-Schutz" },
  { id:"hunters_coat",     slot:"armor",  name:"Hunter's Coat",      rarity:"uncommon",  icon:"🥋",  ranks:["D"],     bonus:{ streakShield:1, dungeonBonus:5 },          desc:"+1 Schutz, +5% Dungeon" },
  { id:"shadow_armor",     slot:"armor",  name:"Shadow Armor",       rarity:"rare",      icon:"🛡️",  ranks:["C"],     bonus:{ streakShield:2, dungeonBonus:8 },          desc:"+2 Schutz, +8% Dungeon" },
  { id:"void_plate",       slot:"armor",  name:"Void Plate",         rarity:"epic",      icon:"💠",  ranks:["B"],     bonus:{ streakShield:3, dungeonBonus:12, vitBonus:5 }, desc:"+3 Schutz, +12% Dungeon, +5 VIT" },
  { id:"monarch_robes",    slot:"armor",  name:"Monarch's Robes",    rarity:"legendary", icon:"👑",  ranks:["A","S"], bonus:{ streakShield:5, dungeonBonus:20, vitBonus:10 }, desc:"+5 Schutz, +20% Dungeon, +10 VIT" },
  { id:"copper_ring",      slot:"ring",   name:"Copper Ring",        rarity:"common",    icon:"💍",  ranks:["E","D"], bonus:{ goldBonus:0.05 },                          desc:"+5% Gold" },
  { id:"mana_ring",        slot:"ring",   name:"Mana Ring",          rarity:"uncommon",  icon:"🔮",  ranks:["C"],     bonus:{ xpBonus:0.05, intBonus:3 },               desc:"+5% XP, +3 INT" },
  { id:"shadow_ring",      slot:"ring",   name:"Shadow Ring",        rarity:"rare",      icon:"🌀",  ranks:["B"],     bonus:{ xpBonus:0.08, goldBonus:0.08, agiBonus:3 }, desc:"+8% XP+Gold, +3 AGI" },
  { id:"monarch_signet",   slot:"ring",   name:"Monarch's Signet",   rarity:"legendary", icon:"💎",  ranks:["S"],     bonus:{ xpBonus:0.15, goldBonus:0.15, chaBonus:10 }, desc:"+15% XP+Gold, +10 CHA" },
];

const RARITY_COLORS = { common:"#6b7280", uncommon:"#22c55e", rare:"#3b82f6", epic:"#a855f7", legendary:"#f59e0b" };
const RARITY_LABELS = { common:"Common", uncommon:"Uncommon", rare:"Rare", epic:"Epic", legendary:"Legendary" };

// ─── DUNGEONS ─────────────────────────────────────────────────
const DUNGEON_TEMPLATES = [
  { id:"goblin_lair",     name:"Goblin Lair",       desc:"Verseuchte Höhle voller Goblins",       rank:"E", requirements:{str:5},               primaryStat:"str", xp:200,  gold:80,   icon:"👺", floors:2 },
  { id:"cursed_forest",   name:"Cursed Forest",     desc:"Magische Fallen im dunklen Wald",        rank:"E", requirements:{int:5},               primaryStat:"int", xp:180,  gold:70,   icon:"🌲", floors:2 },
  { id:"dark_cave",       name:"Dark Cave",         desc:"Untote in verlassenen Minen",            rank:"E", requirements:{vit:5},               primaryStat:"vit", xp:190,  gold:75,   icon:"🦇", floors:2 },
  { id:"rat_den",         name:"Rat King's Den",    desc:"Riesige Ratten und ihr König",           rank:"E", requirements:{agi:5},               primaryStat:"agi", xp:170,  gold:65,   icon:"🐀", floors:2 },
  { id:"library_ruin",    name:"Library Ruin",      desc:"Ruinen einer alten Bibliothek",          rank:"D", requirements:{int:15,agi:8},        primaryStat:"int", xp:400,  gold:150,  icon:"📚", floors:3 },
  { id:"iron_fortress",   name:"Iron Fortress",     desc:"Stahlharte Festung mit Golem-Wächtern",  rank:"D", requirements:{str:12,vit:10},       primaryStat:"str", xp:420,  gold:160,  icon:"⚙️", floors:3 },
  { id:"shadow_cave",     name:"Shadow Cave",       desc:"Schattenwesen lauern im Dunkeln",        rank:"D", requirements:{agi:12,int:10},       primaryStat:"agi", xp:380,  gold:140,  icon:"🌑", floors:3 },
  { id:"ice_palace",      name:"Ice Palace",        desc:"Eisiger Palast des Winterkönigs",        rank:"C", requirements:{vit:25,str:20},       primaryStat:"vit", xp:800,  gold:300,  icon:"❄️", floors:4 },
  { id:"thunder_gate",    name:"Thunder Gate",      desc:"Portal durchzogen von Blitzen",          rank:"C", requirements:{agi:25,int:15},       primaryStat:"agi", xp:850,  gold:320,  icon:"⚡", floors:4 },
  { id:"blood_altar",     name:"Blood Altar",       desc:"Verfluchter Altar des Dämonenfürsten",   rank:"C", requirements:{str:30,cha:15},       primaryStat:"str", xp:900,  gold:350,  icon:"🩸", floors:4 },
  { id:"dragon_nest",     name:"Dragon Nest",       desc:"Nest des uralten Drachen Verthaxis",     rank:"B", requirements:{str:40,vit:35,int:25},primaryStat:"str", xp:1500, gold:600,  icon:"🐉", floors:5 },
  { id:"void_rift",       name:"Void Rift",         desc:"Riss in der Realität",                   rank:"B", requirements:{int:40,agi:35},       primaryStat:"int", xp:1600, gold:650,  icon:"🌀", floors:5 },
  { id:"shadow_castle",   name:"Shadow Castle",     desc:"Festung des Schattenkönigs",             rank:"A", requirements:{str:60,int:55,vit:50,agi:45},primaryStat:"str", xp:3000, gold:1200, icon:"🏰", floors:7 },
  { id:"monarchs_domain", name:"Monarch's Domain",  desc:"Reich eines ursprünglichen Monarchen",   rank:"S", requirements:{str:90,int:85,vit:80,agi:75,cha:70},primaryStat:"str", xp:6000, gold:2500, icon:"👑", floors:10 },
];

const SHOP_ITEMS = [
  { id:"title_shadow_monarch", type:"title", name:"Shadow Monarch",   cost:500,  minRank:"D", desc:"Der König der Schatten" },
  { id:"title_arise",          type:"title", name:"ARISE!",           cost:300,  minRank:"D", desc:"Erwecke deine Armee" },
  { id:"title_s_hunter",       type:"title", name:"S-Rank Hunter",    cost:1000, minRank:"B", desc:"Elite unter den Jägern" },
  { id:"title_sovereign",      type:"title", name:"Sovereign",        cost:2000, minRank:"A", desc:"Herrscher über alles" },
  { id:"theme_crimson",        type:"theme", name:"Crimson Gate",     cost:400,  minRank:"D", desc:"Rotes Portal-Theme",   themeKey:"crimson" },
  { id:"theme_shadow",         type:"theme", name:"Shadow Realm",     cost:600,  minRank:"C", desc:"Reich der Schatten",   themeKey:"shadow"  },
  { id:"theme_ice",            type:"theme", name:"Ice Monarch",      cost:800,  minRank:"B", desc:"Eisiger Monarch",      themeKey:"ice"     },
  { id:"theme_golden",         type:"theme", name:"Ruler's Authority",cost:1200, minRank:"A", desc:"Goldene Macht",        themeKey:"golden"  },
];

const THEMES = {
  default:{ primary:"#4f6ef7", secondary:"#7c3aed", glow:"rgba(79,110,247,0.35)",  accent:"#93b4fd", bg:"#080810", card:"rgba(12,12,24,0.85)",  surface:"rgba(20,20,40,0.6)"  },
  crimson:{ primary:"#dc2626", secondary:"#991b1b", glow:"rgba(220,38,38,0.35)",   accent:"#fca5a5", bg:"#0a0808", card:"rgba(24,12,12,0.85)",  surface:"rgba(40,20,20,0.6)"  },
  shadow: { primary:"#6366f1", secondary:"#4338ca", glow:"rgba(99,102,241,0.35)",  accent:"#a5b4fc", bg:"#06060f", card:"rgba(10,10,28,0.85)",  surface:"rgba(18,18,42,0.6)"  },
  ice:    { primary:"#06b6d4", secondary:"#0891b2", glow:"rgba(6,182,212,0.35)",   accent:"#a5f3fc", bg:"#060a0f", card:"rgba(10,16,28,0.85)",  surface:"rgba(16,24,42,0.6)"  },
  golden: { primary:"#d97706", secondary:"#b45309", glow:"rgba(217,119,6,0.35)",   accent:"#fde68a", bg:"#0a0806", card:"rgba(24,20,12,0.85)",  surface:"rgba(40,32,18,0.6)"  },
};

const DEFAULT_STATE = {
  hunterName:"", level:1, xp:0, gold:0, totalGoldEarned:0,
  stats:{ str:0, int:0, vit:0, agi:0, cha:0 },
  quests:[], completedQuests:[], streak:0, lastActiveDate:null,
  shopPurchases:[], selectedTheme:"default", selectedTitle:"",
  shadowArmy:{ shadows:[], capacity:20, formations:{ vanguard:[], core:[], rearguard:[] }, totalShadowXp:0 },
  totalXpEarned:0, totalQuestsCompleted:0,
  dungeons:[], lastDungeonRefresh:null, dungeonHistory:[],
  achievements:{ unlocked:[], notified:[] },
  skills:{ unlocked:[] },
  equipment:{ slots:{ weapon:null, armor:null, ring1:null, ring2:null }, inventory:[] },
  penaltyZone:{ active:false, redemptionLeft:0, questsCompletedInPenalty:0 },
  todayModifier: null,
  emergencyQuest: null,      // today's emergency quest object (or null)
  emergencyDone: false,      // completed today?
  emergencyFailed: false,    // failed today (penalty active)?
  hiddenQuests: { discovered:[], completed:[] },
  weeklyQuestReset: null,    // ISO date of last weekly reset
  jobs: {
    current: null,        // aktiver Job
    levels: {
      berserker: 0,
      archmage: 0,
      guardian: 0,
      assassin: 0,
      monarch: 0,
      necromancer: 0
    },
    xp: {
      berserker: 0,
      archmage: 0,
      guardian: 0,
      assassin: 0,
      monarch: 0,
      necromancer: 0
    },
    activeAbilityCooldowns: {} // jobAbilityKey: timestamp
  }
};

// ─── HELPERS ──────────────────────────────────────────────────
const JOB_XP_SOURCES = {
  aligned_quest: 10,      // Quest mit passendem Stat
  aligned_dungeon: 50,    // Dungeon mit passender Strategie  
  job_quest: 100,         // Spezielle Job-Quest
  shadow_synergy: 25,     // Mission mit Synergy-Shadows
  boss_kill: 75,          // Boss-Quest mit Job-Stat
};
const JOB_XP_LEVELS = [
  0,      // Level 0 (nicht freigeschaltet)
  0,      // Level 1 (Start)
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5 (Active Ability)
  1750,   // Level 6
  2750,   // Level 7
  4000,   // Level 8
  5500,   // Level 9
  7500    // Level 10 (Grand Master)
];
const JOB_TITLES = {
  1: "Novice",
  3: "Adept", 
  5: "Expert",
  7: "Master",
  10: "Grand Master"
};
const getRank       = (lv) => RANKS.find(r => lv >= r.minLv && lv <= r.maxLv) || RANKS[0];
const getXpForLevel = (lv) => getRank(lv).xpPerLv;
const getRankIndex  = (n)  => RANKS.findIndex(r => r.name === n);
const genId         = ()   => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const getToday      = ()   => new Date().toISOString().slice(0,10);

function getDailyModifier() {
  const seed = parseInt(getToday().replace(/-/g,"")) % DUNGEON_MODIFIERS.length;
  return DUNGEON_MODIFIERS[seed];
}
function calcPowerLevel(stats, level) {
  const total = Object.values(stats).reduce((a,b) => a+b, 0);
  return Math.round(total * (1 + level * 0.08));
}
function getEquipBonuses(equipment) {
  const bonuses = { xpBonus:0, goldBonus:0, dungeonBonus:0, streakShield:0, strBonus:0, intBonus:0, vitBonus:0, agiBonus:0, chaBonus:0 };
  if (!equipment?.slots) return bonuses;
  Object.values(equipment.slots).forEach(item => {
    if (!item) return;
    Object.entries(item.bonus || {}).forEach(([k,v]) => { bonuses[k] = (bonuses[k]||0) + v; });
  });
  return bonuses;
}
function checkSkillUnlocks(stats) { return SKILLS.filter(sk => (stats[sk.stat]||0) >= sk.threshold); }
function getSkillBonuses(skills, stats) {
  const bonuses = { xpCatBonus:{}, xpHardBonus:0, dungeonBonus:0, streakShield:0, goldBonus:0, stratBonus:{}, xpGlobal:0, shadowXpMult:1 };
  checkSkillUnlocks(stats).forEach(skill => {
    const e = skill.effect;
    if (e.type==="xp_bonus_cat")  bonuses.xpCatBonus[e.cat] = (bonuses.xpCatBonus[e.cat]||0) + e.bonus;
    if (e.type==="xp_hard_bonus") bonuses.xpHardBonus += e.bonus;
    if (e.type==="dungeon_bonus") bonuses.dungeonBonus += e.bonus;
    if (e.type==="streak_shield") bonuses.streakShield += e.days;
    if (e.type==="gold_bonus")    bonuses.goldBonus += e.bonus;
    if (e.type==="strat_bonus")   bonuses.stratBonus[e.strat] = (bonuses.stratBonus[e.strat]||0) + e.bonus;
    if (e.type==="xp_global")     bonuses.xpGlobal += e.bonus;
    if (e.type==="shadow_xp")     bonuses.shadowXpMult = (bonuses.shadowXpMult||1) + e.bonus;
  });
  return bonuses;
}
function checkAchievements(state) {
  const unlocked = state.achievements?.unlocked || [];
  const newOnes = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    try { if (ach.check(state)) newOnes.push(ach); } catch {}
  }
  return newOnes;
}
function generateDungeons(playerRankName) {
  const rankIdx = getRankIndex(playerRankName);
  const pool = DUNGEON_TEMPLATES.filter(d => {
    const dIdx = getRankIndex(d.rank);
    return dIdx >= Math.max(0,rankIdx-1) && dIdx <= Math.min(RANKS.length-1, rankIdx+1);
  });
  const shuffled = [...pool].sort(() => Math.random()-0.5);
  const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
  return shuffled.slice(0,3).map(d => ({ ...d, instanceId:genId(), cleared:false, expiresAt:expires }));
}

function getJobBonuses(state) {
  const bonuses = {
    // Basis-Boni
    xpGlobal: 0,
    goldBonus: 0,
    dungeonBonus: 0,
    streakShield: 0,
    shopDiscount: 0,
    
    // Kategorie-spezifisch
    xpCatBonus: {},        // { str: 0.1, int: 0.05 }
    stratBonus: {},        // { str: 20, int: 15 }
    
    // Spezial-Boni
    questSpeedBonus: {},   // { str: 0.3 } = 30% schneller
    dungeonTimeReduction: 0,
    floorSkipChance: 0,
    
    // Multiplikatoren
    xpGlobalMultiplier: 1.0,
    goldGlobalMultiplier: 1.0,
    
    // Dungeon-spezifisch
    dungeonFailureRewards: 0,  // Anteil der Rewards bei Niederlage
    dungeonRetryChance: 0,
    
    // Shadow-Synergien
    shadowStatBonus: {},   // { knight: 0.2, soldier: 0.2 }
    shadowXpBonus: 0,
    shadowCapacityBonus: 0,
    
    // Puzzle/Fallen
    autoSolvePuzzle: false,
    trapDamageReduction: 0,
    
    // Flags
    allShadowsActive: false,  // Army of the Dead
  };
  
  if (!state?.jobs?.current) return bonuses;
  
  const currentJob = state.jobs.current;
  const level = state.jobs.levels[currentJob] || 0;
  const jobDef = JOBS[currentJob];
  const now = Date.now();
  const cooldowns = state.jobs.activeAbilityCooldowns || {};
  
  // === BERSERKER ===
  if (currentJob === "berserker") {
    // Base: +30% Quest Speed für STR
    bonuses.questSpeedBonus.str = 0.30;
    
    if (level >= 3) bonuses.xpCatBonus.str = (bonuses.xpCatBonus.str || 0) + 0.10;
    if (level >= 5) bonuses.stratBonus.str = (bonuses.stratBonus.str || 0) + 20;
    if (level >= 7) {
      // Hard & Boss +25% XP - als separater Multiplikator
      bonuses.hardBossXpBonus = 0.25;
    }
    
    // Rage Mode Active (1h Dauer)
    if (cooldowns.rage_mode && now < cooldowns.rage_mode + 3600000) {
      bonuses.xpGlobalMultiplier *= 2.0;
    }
  }
  
  // === ARCHMAGE ===
  else if (currentJob === "archmage") {
    // Base: +30% XP von INT
    bonuses.xpCatBonus.int = (bonuses.xpCatBonus.int || 0) + 0.30;
    
    if (level >= 3) {
      // +1% Discount pro 5 INT
      bonuses.shopDiscount = Math.floor((state.stats?.int || 0) / 5);
    }
    if (level >= 5) bonuses.stratBonus.int = (bonuses.stratBonus.int || 0) + 15;
    if (level >= 7) bonuses.autoSolvePuzzle = true;
    
    // Insight Active (12h) - zeigt beste Strategie
    if (cooldowns.insight && now < cooldowns.insight + 43200000) {
      bonuses.insightActive = true;
    }
  }
  
  // === GUARDIAN ===
  else if (currentJob === "guardian") {
    // Base: 3 Tage Streak-Schutz
    bonuses.streakShield += 3;
    
    if (level >= 3) bonuses.stratBonus.vit = (bonuses.stratBonus.vit || 0) + 15;
    if (level >= 5) bonuses.dungeonFailureRewards = 0.50;
    if (level >= 7) bonuses.streakShield += 3; // Total 6
    
    // Fortress Active (1 Woche CD) - Dungeon-Niederlage unmöglich
    if (cooldowns.fortress && now < cooldowns.fortress + 3600000) { // 1h Dauer
      bonuses.fortressActive = true;
    }
  }
  
  // === ASSASSIN ===
  else if (currentJob === "assassin") {
    // Base: +50% Gold
    bonuses.goldBonus += 0.50;
    
    if (level >= 3) bonuses.stratBonus.agi = (bonuses.stratBonus.agi || 0) + 20;
    if (level >= 5) bonuses.dungeonTimeReduction += 0.20;
    if (level >= 7) bonuses.floorSkipChance += 0.10;
    
    // Shadow Step wird im Dungeon gehandhabt (3x/Tag)
  }
  
  // === MONARCH ===
  else if (currentJob === "monarch") {
    // Base: +15% XP global
    bonuses.xpGlobal += 0.15;
    
    if (level >= 3) bonuses.shadowCapacityBonus += 10;
    if (level >= 5) {
      // Shadows kämpfen in Dungeons - erhöht Dungeon-Bonus
      bonuses.shadowDungeonParticipation = true;
    }
    if (level >= 7) bonuses.shadowXpBonus += 0.50;
    
    // Domain Expansion (24h CD, 1h Dauer)
    if (cooldowns.domain_expansion && now < cooldowns.domain_expansion + 3600000) {
      bonuses.xpGlobal *= 2.0;
      bonuses.goldBonus *= 2.0;
      bonuses.dungeonBonus += 20;
    }
  }
  
  // === NECROMANCER ===
  else if (currentJob === "necromancer") {
    // Base: 100% Shadow Extraction (Boss-Quests)
    bonuses.shadowExtractionGuaranteed = true;
    
    if (level >= 3) bonuses.tempShadowsFromDungeon = true;
    if (level >= 5) bonuses.shadowEvolutionDiscount = 0.50;
    if (level >= 7) bonuses.canAwakeNamedShadows = true;
    
    // Army of the Dead (1 Woche CD, 1h Dauer)
    if (cooldowns.army_of_the_dead && now < cooldowns.army_of_the_dead + 3600000) {
      bonuses.allShadowsActive = true;
    }
  }
  
  return bonuses;
}

function awardJobXp(state, source, context = {}) {
  if (!state.jobs?.current) return state;
  
  const currentJob = state.jobs.current;
  const jobDef = JOBS[currentJob];
  let xpGain = 0;
  
  switch (source) {
    case "quest_complete":
      // Nur wenn Quest-Kategorie zum Job-Stat passt
      if (context.category === jobDef.statFocus) {
        xpGain = JOB_XP_SOURCES.aligned_quest;
        if (context.difficulty === "boss") xpGain += JOB_XP_SOURCES.boss_kill;
      }
      break;
      
    case "dungeon_complete":
      // Nur wenn Strategie zum Job-Stat passt
      if (context.strategy === jobDef.statFocus) {
        xpGain = JOB_XP_SOURCES.aligned_dungeon;
      }
      break;
      
    case "job_quest":
      xpGain = JOB_XP_SOURCES.job_quest;
      break;
      
    case "shadow_mission":
      // Wenn Shadows mit Synergy-Klassen dabei waren
      const synergyShadows = (context.shadows || []).filter(s => 
        jobDef.shadowSynergy?.affectedClasses?.includes(s.class) ||
        jobDef.shadowSynergy?.affectedClasses?.includes("all")
      );
      if (synergyShadows.length > 0) {
        xpGain = JOB_XP_SOURCES.shadow_synergy;
      }
      break;
  }
  
  if (xpGain === 0) return state;
  
  const newXp = (state.jobs.xp[currentJob] || 0) + xpGain;
  const currentLevel = state.jobs.levels[currentJob] || 0;
  let newLevel = currentLevel;
  
  // Level-Up Check
  while (newLevel < JOB_XP_LEVELS.length - 1 && newXp >= JOB_XP_LEVELS[newLevel + 1]) {
    newLevel++;
  }
  
  const leveledUp = newLevel > currentLevel;
  
  return {
    ...state,
    jobs: {
      ...state.jobs,
      xp: { ...state.jobs.xp, [currentJob]: newXp },
      levels: { ...state.jobs.levels, [currentJob]: newLevel }
    },
    _jobLevelUp: leveledUp ? { job: currentJob, newLevel } : null
  };
}

function checkJobUnlocked(state, jobKey) {
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

function checkAllJobsLevel5(state) {
  return Object.keys(JOBS)
    .filter(k => k !== "necromancer")
    .every(k => (state.jobs?.levels?.[k] || 0) >= 5);
}

function formatCooldown(seconds) {
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days} Tag${days > 1 ? "e" : ""}`;
  }
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} Stunde${hours > 1 ? "n" : ""}`;
  }
  const mins = Math.floor(seconds / 60);
  return `${mins} Minute${mins > 1 ? "n" : ""}`;
}

function calculateJobQuestProgress(state, task) {
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

function calcSuccessChance(dungeon, stats, stratKey, skillBonuses, modifier, formationBonus, jobBonuses = {}) {
  let chance = 28;
  const reqs = Object.entries(dungeon.requirements);
  const metCount = reqs.filter(([k,v]) => (stats[k]||0) >= v).length;
  chance += Math.round((metCount/reqs.length)*42);
  const statVal = stats[stratKey]||0;
  const primaryReq = dungeon.requirements[dungeon.primaryStat]||10;
  const ratio = Math.min(statVal/Math.max(primaryReq,1), 2.5);
  chance += stratKey === dungeon.primaryStat ? Math.round(ratio*16) : Math.round(ratio*7);
  chance += skillBonuses.dungeonBonus||0;
  if (stratKey==="int" && modifier?.intBonus) chance += modifier.intBonus;
  if (modifier?.successBonus) chance += modifier.successBonus;
  chance += (skillBonuses.stratBonus?.[stratKey]||0);
  chance += formationBonus?.dungeonBonus || 0;
  
  // Job Strategy Bonus
  chance += (jobBonuses.stratBonus?.[stratKey] || 0);
  
  // Job Dungeon Bonus
  chance += (jobBonuses.dungeonBonus || 0);
  
  // Fortress Active (Guardian)
  if (jobBonuses.fortressActive) {
    return 100; // Garantierter Erfolg
  }
  
  return Math.max(10, Math.min(93, Math.round(chance)));
}
function getEquipDropForDungeon(dungeonRank) {
  if (Math.random() > 0.40) return null;
  const pool = EQUIPMENT_POOL.filter(e => e.ranks.includes(dungeonRank));
  if (!pool.length) return null;
  return { ...pool[Math.floor(Math.random()*pool.length)], instanceId: genId() };
}
function hoursUntilMidnight() {
  const now = new Date(), midnight = new Date(now);
  midnight.setHours(24,0,0,0);
  return Math.floor((midnight-now)/3600000);
}

// ─── DATA MIGRATION ───────────────────────────────────────────
function migrateState(oldState) {
  if (!oldState) return null;
  // V4 → V5: convert old shadows array to shadowArmy
  if (!oldState.shadowArmy && oldState.shadows) {
    const newShadows = (oldState.shadows||[]).map(s => ({
      id: s.id || genId(),
      name: s.name,
      originalSource: s.name,
      sourceDate: s.date || getToday(),
      class: "soldier", tier: 1, isNamed: false,
      level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
      stats: { power:10, speed:10, loyalty:10, presence:5 },
      abilities: [], isDeployed: false, deploymentSlot: null,
      evolutionStage: 1, glowColor: "#64748b",
      summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
    }));
    oldState.shadowArmy = { shadows: newShadows, capacity: 20, formations: { vanguard:[], core:[], rearguard:[] }, totalShadowXp: 0 };
    delete oldState.shadows;
  }
  if (!oldState.shadowArmy) {
    oldState.shadowArmy = { shadows:[], capacity:20, formations:{ vanguard:[], core:[], rearguard:[] }, totalShadowXp:0 };
  }
  if (!oldState.jobs) {
    oldState.jobs = {
      current: null,
      levels: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
      xp: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
      activeAbilityCooldowns: {}
    };
  }
  return oldState;
}

// ─── STORAGE ──────────────────────────────────────────────────
async function loadState() {
  try {
    // Try v5 first, then v4
    let r = await window.storage.get("sl-todo-v5");
    if (!r) r = await window.storage.get("sl-todo-v4");
    return r ? migrateState(JSON.parse(r.value)) : null;
  } catch { return null; }
}
async function saveState(s) {
  try { await window.storage.set("sl-todo-v5", JSON.stringify(s)); } catch(e) { console.error(e); }
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:${t.primary}44;border-radius:4px}
button{cursor:pointer;border:none;font-family:inherit;-webkit-tap-highlight-color:transparent}
input,select{font-family:inherit}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}
@keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes scaleIn{from{transform:scale(0.82);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes breathe{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px ${t.glow}}50%{box-shadow:0 0 24px ${t.glow},0 0 48px ${t.glow}}}
@keyframes xpFill{from{width:0}to{width:var(--fill)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.3)}}
@keyframes checkPop{0%{transform:scale(0) rotate(-45deg)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes cardEnter{from{transform:translateX(-12px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes rankShine{0%{left:-100%}100%{left:200%}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes levelUpBg{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}
@keyframes levelUpText{0%{transform:scale(0.3) translateY(40px);opacity:0}30%{transform:scale(1.1) translateY(0);opacity:1}50%{transform:scale(1)}100%{transform:scale(1);opacity:1}}
@keyframes levelUpRays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes levelUpRank{0%,40%{transform:translateY(20px);opacity:0}70%,100%{transform:translateY(0);opacity:1}}
@keyframes sysNotifIn{0%{transform:translateY(-100%) scale(0.8);opacity:0}60%{transform:translateY(4px) scale(1.02);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes sysNotifOut{to{transform:translateY(-100%) scale(0.8);opacity:0}}
@keyframes ringExpand{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(3);opacity:0}}
@keyframes statBarFill{from{width:0}to{width:var(--fill)}}
@keyframes shadowPulse{0%,100%{box-shadow:0 0 8px ${t.primary}22}50%{box-shadow:0 0 20px ${t.primary}44}}
@keyframes gateFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.02)}}
@keyframes battleLogIn{from{transform:translateX(-8px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes dungeonResultIn{0%{transform:scale(0.7) translateY(30px);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes cursorBlink{50%{opacity:0}}
@keyframes achIn{0%{transform:translateX(120%);opacity:0}15%{transform:translateX(-6px);opacity:1}85%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
@keyframes ariseGround{0%{transform:scaleX(0);opacity:0}40%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0.3}}
@keyframes ariseEnergy{0%{height:0;opacity:0}50%{height:100%;opacity:1}100%{height:100%;opacity:0}}
@keyframes ariseText{0%{letter-spacing:2px;opacity:0;filter:blur(8px)}50%{letter-spacing:12px;opacity:1;filter:blur(0)}100%{letter-spacing:12px;opacity:1;filter:blur(0)}}
@keyframes ariseShadow{0%{opacity:0;transform:scale(0.3) translateY(40px)}60%{opacity:1;transform:scale(1.05) translateY(0)}100%{opacity:1;transform:scale(1)}}
@keyframes ariseGlow{0%,100%{text-shadow:0 0 20px #7c3aed}50%{text-shadow:0 0 60px #7c3aed,0 0 120px #a78bfa}}
@keyframes penaltyPulse{0%,100%{border-color:#ef444422}50%{border-color:#ef444466}}
@keyframes glitch{0%,100%{transform:none;filter:none}20%{transform:translateX(-2px);filter:hue-rotate(90deg)}40%{transform:translateX(2px);filter:hue-rotate(-90deg)}60%{transform:none;filter:invert(0.1)}}
@keyframes shadowCardGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 16px var(--shadow-glow)}}
@keyframes shadowRise{0%{transform:translateY(20px) scale(0.9);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes formationPulse{0%,100%{opacity:0.4}50%{opacity:0.9}}
@keyframes namedGlow{0%,100%{filter:drop-shadow(0 0 8px var(--named-color))}50%{filter:drop-shadow(0 0 20px var(--named-color)) drop-shadow(0 0 40px var(--named-color))}}
@keyframes tierShine{0%{transform:translateX(-100%) rotate(45deg)}100%{transform:translateX(300%) rotate(45deg)}}
@keyframes monarchRays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes floorReveal{0%{transform:translateX(-20px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes bossPhaseIn{0%{transform:scale(0.6) translateY(20px);opacity:0;filter:blur(8px)}60%{transform:scale(1.08);opacity:1;filter:blur(0)}100%{transform:scale(1);opacity:1}}
@keyframes bossShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes extractionPulse{0%,100%{box-shadow:0 0 10px #22c55e33}50%{box-shadow:0 0 30px #22c55e66,0 0 60px #22c55e22}}
@keyframes hpBar{from{width:var(--from)}to{width:var(--to)}}
@keyframes phaseWave{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes floorActiveGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 12px var(--floor-color)}}
@keyframes safeRoomGlow{0%,100%{box-shadow:0 0 6px #22c55e22}50%{box-shadow:0 0 20px #22c55e55}}
`;

// ─── PARTICLES ────────────────────────────────────────────────
function ParticleField({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let anim;
    const resize = () => { c.width = c.offsetWidth*1.5; c.height = c.offsetHeight*1.5; };
    resize(); window.addEventListener("resize",resize);
    const pts = Array.from({length:40},()=>({ x:Math.random()*1000,y:Math.random()*1000,r:Math.random()*1.5+0.3,dx:(Math.random()-0.5)*0.2,dy:-Math.random()*0.4-0.05,a:Math.random()*0.6+0.15,phase:Math.random()*Math.PI*2 }));
    let t=0;
    function draw(){
      t+=0.01; ctx.clearRect(0,0,c.width,c.height);
      for(const p of pts){
        const f=0.5+0.5*Math.sin(t*2+p.phase);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(0.8+0.4*f),0,Math.PI*2);
        ctx.fillStyle=theme.accent+Math.round(p.a*f*255).toString(16).padStart(2,"0");
        ctx.shadowColor=theme.primary; ctx.shadowBlur=6*f; ctx.fill(); ctx.shadowBlur=0;
        p.x+=p.dx+Math.sin(t+p.phase)*0.15; p.y+=p.dy;
        if(p.y<-10){p.y=c.height+10;p.x=Math.random()*c.width;}
        if(p.x<-10||p.x>c.width+10) p.x=Math.random()*c.width;
      }
      anim=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{cancelAnimationFrame(anim);window.removeEventListener("resize",resize);};
  },[theme]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.7}}/>;
}

// ─── SYSTEM NOTIFICATION ──────────────────────────────────────
function SystemNotification({ message, type="info", onDone }) {
  const [exiting,setExiting]=useState(false);
  useEffect(()=>{const t1=setTimeout(()=>setExiting(true),2400);const t2=setTimeout(onDone,2800);return()=>{clearTimeout(t1);clearTimeout(t2);};},[onDone]);
  const colors={info:"#4f6ef7",success:"#22c55e",gold:"#f59e0b",xp:"#a78bfa",levelup:"#e879f9",dungeon:"#22d3ee",defeat:"#ef4444",achievement:"#f59e0b",skill:"#22d3ee",penalty:"#ef4444",shadow:"#7c3aed",named:"#f59e0b"};
  const c=colors[type]||colors.info;
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:200,animation:exiting?"sysNotifOut 0.4s ease forwards":"sysNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",pointerEvents:"none",width:"calc(100% - 32px)",maxWidth:420}}>
      <div style={{background:"linear-gradient(135deg,rgba(8,8,16,0.97),rgba(16,12,28,0.97))",border:`1px solid ${c}55`,borderLeft:`3px solid ${c}`,borderRadius:12,padding:"12px 18px",backdropFilter:"blur(16px)",boxShadow:`0 8px 32px rgba(0,0,0,0.6),0 0 20px ${c}22`,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:c,boxShadow:`0 0 8px ${c}`,animation:"breathe 1.5s infinite",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:c,marginBottom:2,fontFamily:"'JetBrains Mono',monospace"}}>SYSTEM</div>
          <div style={{fontSize:13,color:"#e2e8f0",fontWeight:500,lineHeight:1.4}}>{message}</div>
        </div>
      </div>
    </div>
  );
}

// ─── ACHIEVEMENT TOAST ────────────────────────────────────────
function AchievementToast({ achievement, onDone }) {
  const [exiting,setExiting]=useState(false);
  useEffect(()=>{const t1=setTimeout(()=>setExiting(true),3500);const t2=setTimeout(onDone,4000);return()=>{clearTimeout(t1);clearTimeout(t2);};},[onDone]);
  return (
    <div style={{position:"fixed",bottom:110,right:16,zIndex:210,maxWidth:280,animation:exiting?"achIn 4s ease forwards reverse":"achIn 4s ease forwards"}}>
      <div style={{background:"linear-gradient(135deg,rgba(12,10,22,0.97),rgba(24,20,10,0.97))",border:"1px solid #f59e0b44",borderLeft:"3px solid #f59e0b",borderRadius:12,padding:"12px 14px",backdropFilter:"blur(16px)",boxShadow:"0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(245,158,11,0.15)"}}>
        <div style={{fontSize:9,letterSpacing:3,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>ACHIEVEMENT UNLOCKED</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:26}}>{achievement.icon}</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fde68a",fontFamily:"'Cinzel',serif"}}>{achievement.name}</div>
            <div style={{fontSize:10,color:"#92400e",marginTop:2}}>{achievement.desc}</div>
            {achievement.reward.xp>0&&<div style={{fontSize:10,color:"#a78bfa",fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>+{achievement.reward.xp} XP · +{achievement.reward.gold} G</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── XP FLOAT ─────────────────────────────────────────────────
function XpFloat({ x, y, xp, gold }) {
  return (
    <div style={{position:"fixed",left:x,top:y,zIndex:300,pointerEvents:"none",animation:"floatUp 1.2s ease-out forwards"}}>
      <div style={{fontSize:18,fontWeight:800,color:"#a78bfa",fontFamily:"'Cinzel',serif",textShadow:"0 0 12px rgba(167,139,250,0.6)",whiteSpace:"nowrap"}}>+{xp} XP</div>
      <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",fontFamily:"'JetBrains Mono',monospace"}}>+{gold} G</div>
    </div>
  );
}

// ─── LEVEL UP ─────────────────────────────────────────────────
function LevelUpCinematic({ level, rank, oldRank, onClose }) {
  const isRankUp = oldRank && oldRank.name !== rank.name;
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"levelUpBg 4s ease forwards",background:"rgba(0,0,0,0.93)"}}>
      <div style={{position:"absolute",width:500,height:500,background:`conic-gradient(from 0deg,transparent,${rank.color}08,transparent,${rank.color}05,transparent)`,animation:"levelUpRays 8s linear infinite",borderRadius:"50%"}}/>
      <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",border:`2px solid ${rank.color}44`,animation:"ringExpand 1.5s ease-out forwards"}}/>
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{fontSize:11,letterSpacing:6,color:rank.color,fontFamily:"'JetBrains Mono',monospace",animation:"levelUpText 1.2s ease-out forwards",marginBottom:12,opacity:0}}>{isRankUp?"RANK UP":"LEVEL UP"}</div>
        <div style={{fontSize:96,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",textShadow:`0 0 60px ${rank.color},0 0 120px ${rank.color}66`,animation:"levelUpText 1s ease-out 0.15s forwards",opacity:0,lineHeight:1}}>{level}</div>
        <div style={{fontSize:18,color:rank.color,fontFamily:"'Cinzel',serif",letterSpacing:4,animation:"levelUpRank 1.8s ease-out forwards",opacity:0,marginTop:12,textShadow:`0 0 20px ${rank.glow}`}}>{rank.label}</div>
        {isRankUp&&<div style={{marginTop:20,padding:"8px 24px",borderRadius:20,background:`linear-gradient(135deg,${rank.color}22,${rank.color}11)`,border:`1px solid ${rank.color}44`,fontSize:12,color:rank.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,animation:"levelUpRank 2s ease-out forwards",opacity:0}}>★ NEW RANK ACHIEVED ★</div>}
      </div>
    </div>
  );
}

// ─── ARISE CINEMATIC (ENHANCED) ───────────────────────────────
function AriseCinematic({ shadow, onClose }) {
  const [phase, setPhase] = useState(0);
  const isNamed = shadow?.isNamed;
  const cls = shadow ? SHADOW_CLASSES[shadow.class] : SHADOW_CLASSES.soldier;
  const tierData = shadow ? SHADOW_TIERS[shadow.tier] : SHADOW_TIERS[1];
  const glowColor = isNamed ? shadow.glowColor : cls.color;

  useEffect(()=>{
    const timers = [
      setTimeout(()=>setPhase(1), 300),
      setTimeout(()=>setPhase(2), 900),
      setTimeout(()=>setPhase(3), 1600),
      setTimeout(()=>setPhase(4), 2400),
      setTimeout(()=>setPhase(5), 3200),
      setTimeout(onClose, isNamed ? 6000 : 4800),
    ];
    return ()=>timers.forEach(clearTimeout);
  },[onClose, isNamed]);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:998,background:isNamed?"rgba(1,0,4,0.98)":"rgba(2,0,8,0.97)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",animation:"fadeIn 0.4s"}}>
      {/* Named shadow: rotating monarch rays */}
      {isNamed&&phase>=1&&(
        <div style={{position:"absolute",width:600,height:600,background:`conic-gradient(from 0deg,transparent,${glowColor}06,transparent,${glowColor}04,transparent)`,animation:"monarchRays 12s linear infinite",borderRadius:"50%"}}/>
      )}
      {/* Ground crack */}
      {phase>=1&&<div style={{position:"absolute",bottom:"28%",left:"15%",right:"15%",height:isNamed?3:2,background:`linear-gradient(90deg,transparent,${glowColor},transparent)`,animation:"ariseGround 1s ease-out forwards",transformOrigin:"center"}}/>}
      {/* Secondary cracks for named */}
      {isNamed&&phase>=1&&<div style={{position:"absolute",bottom:"27%",left:"30%",right:"30%",height:1,background:`linear-gradient(90deg,transparent,${glowColor}88,transparent)`,animation:"ariseGround 1.2s ease-out 0.1s forwards",transformOrigin:"center"}}/>}
      {/* Energy pillar */}
      {phase>=2&&(
        <div style={{position:"absolute",bottom:"28%",left:"50%",transform:"translateX(-50%)",width:isNamed?120:80,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden"}}>
          <div style={{width:isNamed?4:3,background:`linear-gradient(0deg,transparent,${glowColor},${glowColor}aa)`,animation:"ariseEnergy 1.2s ease-out forwards",height:0,transformOrigin:"bottom"}}/>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center bottom,${glowColor}${isNamed?"55":"33"},transparent)`,animation:"ariseEnergy 1.2s ease-out forwards"}}/>
        </div>
      )}
      {/* ARISE text */}
      {phase>=2&&(
        <div style={{position:"absolute",top:"18%",textAlign:"center",width:"100%"}}>
          <div style={{fontSize:isNamed?60:52,fontWeight:900,color:glowColor,fontFamily:"'Cinzel',serif",animation:`ariseText 1s ease-out forwards,ariseGlow 2s ease-in-out 1s infinite`,opacity:0,letterSpacing:2,["--glow-color"]:glowColor}}>ARISE</div>
          {isNamed&&phase>=3&&<div style={{fontSize:11,letterSpacing:6,color:glowColor+"aa",fontFamily:"'JetBrains Mono',monospace",marginTop:8,animation:"fadeIn 0.6s both"}}>NAMED SHADOW AWAKENED</div>}
        </div>
      )}
      {/* Shadow figure */}
      {phase>=3&&(
        <div style={{textAlign:"center",animation:"ariseShadow 1s cubic-bezier(0.34,1.56,0.64,1) forwards",opacity:0}}>
          {isNamed?(
            <div style={{fontSize:100,animation:"namedGlow 2s ease-in-out infinite",["--named-color"]:glowColor}}>{shadow.icon}</div>
          ):(
            <div style={{fontSize:100,filter:`brightness(0.15) saturate(200%) sepia(100%) hue-rotate(${shadow?.class==="knight"?200:shadow?.class==="mage"?280:shadow?.class==="assassin"?120:shadow?.class==="healer"?160:220}deg) brightness(0.8)`,textShadow:`0 0 40px ${glowColor}`}}>👤</div>
          )}
          {phase>=4&&(
            <div style={{animation:"fadeIn 0.6s both"}}>
              <div style={{fontSize:isNamed?18:16,fontWeight:700,color:glowColor,fontFamily:"'Cinzel',serif",letterSpacing:3,marginTop:12,textShadow:`0 0 20px ${glowColor}`}}>{shadow?.name || "Shadow Soldier"}</div>
              {isNamed&&shadow.title&&<div style={{fontSize:11,color:glowColor+"aa",fontFamily:"'Cinzel',serif",letterSpacing:2,marginTop:4}}>{shadow.title}</div>}
              <div style={{fontSize:10,color:cls.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <span>{cls.icon}</span>
                <span>{cls.name.toUpperCase()}</span>
                <span style={{color:tierData.color}}>· {tierData.name.toUpperCase()}</span>
              </div>
              {isNamed&&phase>=5&&shadow.uniqueAbility&&(
                <div style={{marginTop:16,padding:"8px 20px",borderRadius:12,background:`${glowColor}15`,border:`1px solid ${glowColor}44`,display:"inline-block",animation:"scaleIn 0.4s ease"}}>
                  <div style={{fontSize:9,color:glowColor,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:4}}>UNIQUE ABILITY</div>
                  <div style={{fontSize:13,color:"#e2e8f0",fontFamily:"'Cinzel',serif"}}>{shadow.uniqueAbility.icon} {shadow.uniqueAbility.name}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{shadow.uniqueAbility.effect}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{position:"absolute",bottom:40,fontSize:10,color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:3}}>TAP TO SKIP</div>
    </div>
  );
}

// ─── SHADOW CARD ──────────────────────────────────────────────
function ShadowCard({ shadow, theme, onClick, showSlot, index }) {
  const cls = SHADOW_CLASSES[shadow.class] || SHADOW_CLASSES.soldier;
  const tierData = SHADOW_TIERS[shadow.tier] || SHADOW_TIERS[1];
  const xpPct = Math.min((shadow.xp / shadow.xpToNext) * 100, 100);
  const slotData = shadow.deploymentSlot ? FORMATION_SLOTS[shadow.deploymentSlot] : null;

  return (
    <div onClick={onClick} style={{
      background:`linear-gradient(135deg,rgba(8,8,20,0.9),rgba(12,10,24,0.85))`,
      border:`1px solid ${shadow.isNamed ? shadow.glowColor+"55" : cls.color+"33"}`,
      borderRadius:16,padding:"14px 12px",cursor:"pointer",
      boxShadow:shadow.isNamed?`0 0 16px ${shadow.glowColor}22`:"none",
      position:"relative",overflow:"hidden",
      animation:`shadowRise 0.4s ease ${index*0.06}s both`,
      transition:"all 0.2s",
      ["--shadow-glow"]: cls.color,
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=shadow.isNamed?shadow.glowColor+"88":cls.color+"66";e.currentTarget.style.transform="translateY(-2px)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=shadow.isNamed?shadow.glowColor+"55":cls.color+"33";e.currentTarget.style.transform="none";}}>
      {/* Tier shine */}
      {shadow.tier>=3&&(
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",borderRadius:16,pointerEvents:"none"}}>
          <div style={{position:"absolute",width:"40%",height:"100%",background:`linear-gradient(90deg,transparent,${tierData.color}0a,transparent)`,animation:"tierShine 3s ease-in-out infinite"}}/>
        </div>
      )}
      {/* Named badge */}
      {shadow.isNamed&&(
        <div style={{position:"absolute",top:8,right:8,padding:"2px 6px",borderRadius:4,background:`${shadow.glowColor}22`,border:`1px solid ${shadow.glowColor}55`,fontSize:8,color:shadow.glowColor,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>NAMED</div>
      )}
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
        <div style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:`${cls.color}15`,border:`1px solid ${cls.color}33`,flexShrink:0,fontSize:shadow.isNamed?26:22}}>
          {shadow.isNamed ? shadow.icon : cls.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:shadow.isNamed?shadow.glowColor:"#e2e8f0",fontFamily:"'Cinzel',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shadow.name}</div>
          {shadow.isNamed&&shadow.title&&<div style={{fontSize:9,color:shadow.glowColor+"99",fontFamily:"'Outfit',sans-serif",marginTop:1}}>{shadow.title}</div>}
          <div style={{display:"flex",gap:5,marginTop:4,alignItems:"center"}}>
            <span style={{fontSize:9,color:cls.color,fontFamily:"'JetBrains Mono',monospace",padding:"1px 5px",borderRadius:4,background:cls.color+"15"}}>{cls.icon} {shadow.class.toUpperCase()}</span>
            <span style={{fontSize:9,color:tierData.color,fontFamily:"'JetBrains Mono',monospace",padding:"1px 5px",borderRadius:4,background:tierData.color+"15",border:`1px solid ${tierData.color}33`}}>T{shadow.tier}</span>
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:900,color:"#e2e8f0",fontFamily:"'Cinzel',serif"}}>Lv.{shadow.level}</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:10}}>
        {[{k:"power",icon:"⚔",c:"#ef4444"},{k:"speed",icon:"⚡",c:"#f59e0b"},{k:"loyalty",icon:"💙",c:"#3b82f6"},{k:"presence",icon:"✦",c:"#a855f7"}].map(({k,icon,c})=>(
          <div key={k} style={{textAlign:"center",background:c+"0a",borderRadius:6,padding:"4px 2px",border:`1px solid ${c}18`}}>
            <div style={{fontSize:9,color:c}}>{icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#cbd5e1",fontFamily:"'JetBrains Mono',monospace"}}>{shadow.stats[k]}</div>
          </div>
        ))}
      </div>
      {/* XP bar */}
      <div style={{height:3,background:"#0f1628",borderRadius:2,overflow:"hidden",marginBottom:6}}>
        <div style={{width:`${xpPct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${cls.color}88,${cls.color})`,transition:"width 0.6s ease"}}/>
      </div>
      {/* Deployment / slot info */}
      {shadow.isDeployed&&slotData?(
        <div style={{fontSize:9,color:slotData.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,display:"flex",alignItems:"center",gap:4}}>
          <span>{slotData.icon}</span><span>{slotData.name.toUpperCase()}</span>
        </div>
      ):(
        <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>RESERVE</div>
      )}
    </div>
  );
}

// ─── SHADOW DETAIL MODAL ──────────────────────────────────────
function ShadowDetailModal({ shadow, theme, onClose, onDeploy, onUndeploy, onEvolve, gold }) {
  const cls = SHADOW_CLASSES[shadow.class] || SHADOW_CLASSES.soldier;
  const tierData = SHADOW_TIERS[shadow.tier] || SHADOW_TIERS[1];
  const nextTierData = SHADOW_TIERS[shadow.tier+1];
  const xpPct = Math.min((shadow.xp / shadow.xpToNext) * 100, 100);
  const canEvolve = nextTierData && gold >= nextTierData.evolutionCost && shadow.level >= tierData.maxLevel;
  const slotData = shadow.deploymentSlot ? FORMATION_SLOTS[shadow.deploymentSlot] : null;

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(2,2,8,0.95)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(180deg,rgba(10,10,22,0.99),rgba(6,6,16,0.99))",border:`1px solid ${shadow.isNamed?shadow.glowColor+"44":cls.color+"33"}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 32px",animation:"slideUp 0.3s ease",maxHeight:"85vh",overflowY:"auto"}}>
        {/* Close handle */}
        <div style={{width:36,height:3,background:"#1e2940",borderRadius:2,margin:"0 auto 20px"}}/>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:`${cls.color}15`,border:`2px solid ${shadow.isNamed?shadow.glowColor+"66":cls.color+"44"}`,fontSize:shadow.isNamed?36:28,boxShadow:shadow.isNamed?`0 0 20px ${shadow.glowColor}44`:"none"}}>
            {shadow.isNamed?shadow.icon:cls.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:900,color:shadow.isNamed?shadow.glowColor:"#e2e8f0",fontFamily:"'Cinzel',serif"}}>{shadow.name}</div>
            {shadow.isNamed&&shadow.title&&<div style={{fontSize:11,color:shadow.glowColor+"88",fontFamily:"'Cinzel',serif",letterSpacing:1,marginTop:2}}>{shadow.title}</div>}
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:cls.color,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:5,background:cls.color+"18"}}>{cls.icon} {cls.name}</span>
              <span style={{fontSize:10,color:tierData.color,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:5,background:tierData.color+"18",border:`1px solid ${tierData.color}33`}}>Tier {shadow.tier} · {tierData.name}</span>
            </div>
          </div>
          <div style={{textAlign:"center",padding:"8px 16px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:2}}>LEVEL</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",lineHeight:1}}>{shadow.level}</div>
          </div>
        </div>
        {/* XP */}
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>
            <span>EXP</span><span>{shadow.xp} / {shadow.xpToNext}</span>
          </div>
          <div style={{height:6,background:"#0a0a14",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:`${xpPct}%`,height:"100%",borderRadius:3,background:`linear-gradient(90deg,${cls.color}88,${cls.color})`,transition:"width 0.8s ease"}}/>
          </div>
          <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>Max Level für diesen Tier: {tierData.maxLevel}</div>
        </div>
        {/* Stats */}
        <div style={{fontSize:10,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>KAMPFSTATS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {[{k:"power",name:"Power",icon:"⚔️",color:"#ef4444",desc:"Dungeon-Erfolg"},{k:"speed",name:"Speed",icon:"⚡",color:"#f59e0b",desc:"Clear-Zeit Reduktion"},{k:"loyalty",name:"Loyalty",icon:"💙",color:"#3b82f6",desc:"Bonus-Aktivierungschance"},{k:"presence",name:"Presence",icon:"✦",color:"#a855f7",desc:"Passive Effekt-Stärke"}].map(({k,name,icon,color,desc})=>(
            <div key={k} style={{background:`${color}08`,border:`1px solid ${color}22`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,color,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{icon} {name}</span>
                <span style={{fontSize:20,fontWeight:900,color:"#e2e8f0",fontFamily:"'Cinzel',serif"}}>{shadow.stats[k]}</span>
              </div>
              <div style={{height:3,background:"#0a0a14",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${Math.min((shadow.stats[k]/100)*100,100)}%`,height:"100%",borderRadius:2,background:color+"66"}}/>
              </div>
              <div style={{fontSize:8,color:"#334155",marginTop:3,fontFamily:"'JetBrains Mono',monospace"}}>{desc}</div>
            </div>
          ))}
        </div>
        {/* Passive Effect */}
        <div style={{background:`${cls.color}0a`,border:`1px solid ${cls.color}22`,borderRadius:12,padding:"12px 14px",marginBottom:18}}>
          <div style={{fontSize:9,letterSpacing:2,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>PASSIVE EFFEKT</div>
          <div style={{fontSize:12,color:cls.color,fontWeight:600}}>{cls.passiveEffect}</div>
        </div>
        {/* Named: unique ability & lore */}
        {shadow.isNamed&&(
          <>
            <div style={{background:`${shadow.glowColor}0a`,border:`1px solid ${shadow.glowColor}33`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>UNIQUE ABILITY</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:24}}>{shadow.uniqueAbility?.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:shadow.glowColor,fontFamily:"'Cinzel',serif"}}>{shadow.uniqueAbility?.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{shadow.uniqueAbility?.effect}</div>
                </div>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 14px",marginBottom:18,fontStyle:"italic",fontSize:12,color:"#64748b",lineHeight:1.6,borderLeft:`2px solid ${shadow.glowColor}44`}}>"{shadow.lore}"</div>
          </>
        )}
        {/* Deployment */}
        <div style={{fontSize:10,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>FORMATION</div>
        {shadow.isDeployed?(
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            <div style={{flex:1,padding:"10px 14px",borderRadius:10,background:`${slotData?.color}15`,border:`1px solid ${slotData?.color}44`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>{slotData?.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:slotData?.color,fontFamily:"'JetBrains Mono',monospace"}}>{slotData?.name.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#475569",marginTop:1}}>{slotData?.bonus}</div>
              </div>
            </div>
            <button onClick={()=>onUndeploy(shadow.id)} style={{padding:"10px 16px",borderRadius:10,background:"transparent",color:"#475569",border:"1px solid #1e2940",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:1}}>RECALL</button>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:18}}>
            {Object.entries(FORMATION_SLOTS).map(([slotKey,slot])=>(
              <button key={slotKey} onClick={()=>onDeploy(shadow.id,slotKey)} style={{padding:"10px 6px",borderRadius:10,background:`${slot.color}10`,border:`1px solid ${slot.color}33`,color:slot.color,textAlign:"center",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=slot.color+"20";}} onMouseLeave={e=>{e.currentTarget.style.background=slot.color+"10";}}>
                <div style={{fontSize:18}}>{slot.icon}</div>
                <div style={{fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>{slot.name.toUpperCase()}</div>
                <div style={{fontSize:8,color:"#475569",marginTop:2}}>{slot.bonus}</div>
              </button>
            ))}
          </div>
        )}
        {/* Evolution */}
        {nextTierData&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${nextTierData.color}22`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:2}}>EVOLUTION</div>
                <div style={{fontSize:12,color:nextTierData.color,fontWeight:700}}>Tier {shadow.tier} → Tier {shadow.tier+1} ({nextTierData.name})</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>KOSTEN</div>
                <div style={{fontSize:16,fontWeight:900,color:"#fbbf24",fontFamily:"'Cinzel',serif"}}>{nextTierData.evolutionCost}G</div>
              </div>
            </div>
            {!canEvolve&&shadow.level<tierData.maxLevel&&<div style={{fontSize:9,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>⚠ Erfordert Level {tierData.maxLevel} (aktuell {shadow.level})</div>}
            {!canEvolve&&gold<nextTierData.evolutionCost&&<div style={{fontSize:9,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>⚠ Zu wenig Gold ({gold}G / {nextTierData.evolutionCost}G)</div>}
            <button onClick={()=>canEvolve&&onEvolve(shadow.id)} disabled={!canEvolve} style={{width:"100%",padding:12,borderRadius:10,fontSize:12,fontWeight:700,background:canEvolve?`linear-gradient(135deg,${nextTierData.color}25,${nextTierData.color}10)`:"rgba(255,255,255,0.03)",color:canEvolve?nextTierData.color:"#334155",border:`1px solid ${canEvolve?nextTierData.color+"44":"#1e2940"}`,fontFamily:"'Cinzel',serif",letterSpacing:2,cursor:canEvolve?"pointer":"not-allowed",transition:"all 0.2s"}}>
              {canEvolve?"✦ EVOLUTION ✦":"EVOLUTION GESPERRT"}
            </button>
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",marginTop:12,padding:12,borderRadius:10,background:"transparent",color:"#334155",border:"1px solid #1e293b",fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2}}>SCHLIESSEN</button>
      </div>
    </div>
  );
}

// ─── FORMATION EDITOR ─────────────────────────────────────────
function FormationEditor({ shadowArmy, theme, onDeploy, onUndeploy, formationBonus }) {
  const shadows = shadowArmy?.shadows || [];
  const deployed = shadows.filter(s=>s.isDeployed);
  const reserve = shadows.filter(s=>!s.isDeployed);

  return (
    <div>
      {/* Bonus overview */}
      <div style={{background:`linear-gradient(135deg,${theme.primary}0a,transparent)`,border:`1px solid ${theme.primary}18`,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:9,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>FORMATIONS-BONI</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{label:"Dungeon",val:`+${formationBonus.dungeonBonus}%`,color:"#ef4444",icon:"⚔️"},{label:"XP",val:`+${Math.round(formationBonus.xpBonus*100)}%`,color:"#a78bfa",icon:"✨"},{label:"Gold",val:`+${Math.round(formationBonus.goldBonus*100)}%`,color:"#fbbf24",icon:"💰"}].map(({label,val,color,icon})=>(
            <div key={label} style={{textAlign:"center",padding:"8px",background:color+"0a",borderRadius:10,border:`1px solid ${color}18`}}>
              <div style={{fontSize:14}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:900,color,fontFamily:"'Cinzel',serif",marginTop:2}}>{val}</div>
              <div style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Slots */}
      {Object.entries(FORMATION_SLOTS).map(([slotKey,slot])=>{
        const inSlot = deployed.filter(s=>s.deploymentSlot===slotKey);
        const emptySlots = slot.maxSlots - inSlot.length;
        return(
          <div key={slotKey} style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:16}}>{slot.icon}</span>
              <div style={{flex:1}}>
                <span style={{fontSize:11,fontWeight:700,color:slot.color,fontFamily:"'JetBrains Mono',monospace"}}>{slot.name.toUpperCase()}</span>
                <span style={{fontSize:9,color:"#475569",marginLeft:8}}>{slot.bonus}</span>
              </div>
              <span style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}>{inSlot.length}/{slot.maxSlots}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${slot.maxSlots},1fr)`,gap:6}}>
              {inSlot.map(s=>{
                const cls=SHADOW_CLASSES[s.class]||SHADOW_CLASSES.soldier;
                return(
                  <div key={s.id} onClick={()=>onUndeploy(s.id)} style={{background:`${cls.color}12`,border:`1px solid ${cls.color}33`,borderRadius:10,padding:"8px 6px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#ef444420";e.currentTarget.style.borderColor="#ef444455";}} onMouseLeave={e=>{e.currentTarget.style.background=cls.color+"12";e.currentTarget.style.borderColor=cls.color+"33";}}>
                    <div style={{fontSize:16}}>{s.isNamed?s.icon:cls.icon}</div>
                    <div style={{fontSize:8,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.length>7?s.name.slice(0,7)+"…":s.name}</div>
                    <div style={{fontSize:7,color:"#475569",marginTop:1}}>Lv.{s.level}</div>
                  </div>
                );
              })}
              {Array.from({length:emptySlots}).map((_,i)=>(
                <div key={`empty-${i}`} style={{border:`1px dashed ${slot.color}22`,borderRadius:10,padding:"8px 6px",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:16,opacity:0.2,animation:"formationPulse 2s ease-in-out infinite"}}>{slot.icon}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── STAT RADAR ───────────────────────────────────────────────
function StatRadar({ stats, theme, size=160 }) {
  const keys=["str","int","vit","agi","cha"];
  const maxStat=Math.max(...keys.map(k=>stats[k]||0),20);
  const cx=size/2,cy=size/2,r=size*0.38;
  const angle=i=>(Math.PI*2*i)/5-Math.PI/2;
  const pt=(i,f)=>[cx+r*f*Math.cos(angle(i)),cy+r*f*Math.sin(angle(i))];
  const grid=[0.25,0.5,0.75,1].map(f=>keys.map((_,i)=>pt(i,f).join(",")).join(" "));
  const data=keys.map((k,i)=>{const v=Math.min((stats[k]||0)/maxStat,1);return pt(i,Math.max(v,0.05)).join(",");}).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grid.map((g,i)=><polygon key={i} points={g} fill="none" stroke={theme.primary+"15"} strokeWidth={0.5}/>)}
      {keys.map((_,i)=><line key={i} x1={cx} y1={cy} x2={pt(i,1)[0]} y2={pt(i,1)[1]} stroke={theme.primary+"15"} strokeWidth={0.5}/>)}
      <polygon points={data} fill={theme.primary+"22"} stroke={theme.accent} strokeWidth={1.5} strokeLinejoin="round"/>
      {keys.map((k,i)=>{const[px,py]=pt(i,1.22);const cat=CATEGORIES.find(c=>c.key===k);return <text key={k} x={px} y={py} textAnchor="middle" dominantBaseline="central" fill={cat.color} fontSize={9} fontFamily="'JetBrains Mono',monospace" fontWeight="600">{cat.stat}</text>;})}
    </svg>
  );
}

// ─── QUEST TIMER ──────────────────────────────────────────────
function QuestTimer({ expiresAt, color="#ef4444" }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(()=>{
    const calc=()=>Math.max(0,Math.floor((new Date(expiresAt)-Date.now())/1000));
    setTimeLeft(calc());
    const iv=setInterval(()=>setTimeLeft(calc()),1000);
    return()=>clearInterval(iv);
  },[expiresAt]);
  const h=Math.floor(timeLeft/3600);
  const m=Math.floor((timeLeft%3600)/60);
  const s=timeLeft%60;
  const urgent=timeLeft<3600;
  const pad=n=>String(n).padStart(2,"0");
  return(
    <span style={{
      fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,
      color:urgent?"#ef4444":color,
      background:urgent?"#ef444415":"transparent",
      padding:urgent?"1px 5px":"0",borderRadius:4,
      animation:urgent&&timeLeft<600?"breathe 0.8s infinite":"none",
      letterSpacing:1,
    }}>
      ⏱ {h>0?`${pad(h)}:`:""}{ pad(m)}:{pad(s)}
    </span>
  );
}

// ─── QUEST TYPE BADGE ─────────────────────────────────────────
function QuestTypeBadge({ type }) {
  const cfg=QUEST_TYPES_CONFIG[type]||QUEST_TYPES_CONFIG.side;
  return(
    <span style={{
      fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
      color:cfg.color,background:cfg.color+"18",
      border:`1px solid ${cfg.color}44`,
      padding:"1px 6px",borderRadius:4,letterSpacing:0.5,
      display:"inline-flex",alignItems:"center",gap:3,
    }}>
      {cfg.icon} {cfg.label.toUpperCase()}
    </span>
  );
}

// ─── EMERGENCY QUEST CARD ─────────────────────────────────────
function EmergencyQuestCard({ quest, done, failed, onComplete, theme }) {
  const [hover, setHover]=useState(false);
  if (!quest) return null;
  const diff=DIFFICULTIES.find(d=>d.key===quest.difficulty)||DIFFICULTIES[1];
  const cat=CATEGORIES.find(c=>c.key===quest.category)||CATEGORIES[0];
  const expired=quest.timeLimit&&new Date(quest.timeLimit)<new Date();
  return(
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background:done?"rgba(34,197,94,0.06)":failed||expired?"rgba(239,68,68,0.06)":"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.04))",
        border:`1px solid ${done?"#22c55e44":failed||expired?"#ef444444":"#ef4444"}`,
        borderLeft:`3px solid ${done?"#22c55e":failed||expired?"#ef444466":"#ef4444"}`,
        borderRadius:14,padding:"14px 16px",marginBottom:16,
        animation:!done&&!failed&&!expired?"glow 2s infinite":"none",
        transition:"all 0.25s",
        opacity:done||failed?0.7:1,
      }}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:16,animation:!done&&!failed&&!expired?"pulse 1s infinite":"none"}}>🚨</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <QuestTypeBadge type="emergency"/>
            {!done&&!failed&&!expired&&quest.timeLimit&&<QuestTimer expiresAt={quest.timeLimit} color="#ef4444"/>}
            {(expired||failed)&&!done&&<span style={{fontSize:9,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>ABGELAUFEN</span>}
            {done&&<span style={{fontSize:9,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace"}}>ERFÜLLT ✓</span>}
          </div>
          <div style={{fontSize:14,fontWeight:700,color:done?"#64748b":"#fff",fontFamily:"'Outfit',sans-serif",textDecoration:done?"line-through":"none"}}>{quest.title}</div>
        </div>
      </div>
      <div style={{fontSize:10,color:"#64748b",marginBottom:10,lineHeight:1.5,fontFamily:"'Outfit',sans-serif"}}>{quest.desc}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>
          <span style={{color:cat.color}}>{cat.icon} {cat.stat}</span>
          <span style={{color:"#334155",margin:"0 6px"}}>·</span>
          <span style={{color:"#a78bfa"}}>+{diff.xp*2.5|0} XP</span>
          <span style={{color:"#334155",margin:"0 6px"}}>·</span>
          <span style={{color:"#fbbf24"}}>+{diff.gold*2.5|0} G</span>
        </div>
        {!done&&!failed&&!expired&&(
          <button onClick={()=>onComplete(quest)} style={{padding:"7px 16px",borderRadius:10,fontSize:11,fontWeight:700,background:"linear-gradient(135deg,#ef444425,#ef444410)",color:"#ef4444",border:"1px solid #ef444455",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>
            ERFÜLLEN
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CHAINED QUEST PROGRESS ───────────────────────────────────
function ChainedQuestProgress({ quest }) {
  const steps = quest.chainTotal||3;
  const current = quest.chainStep||1;
  const mult = quest.chainMultiplier||1;
  return(
    <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
      {Array.from({length:steps}).map((_,i)=>(
        <div key={i} style={{height:3,flex:1,borderRadius:2,background:i<current?"#f59e0b":"#1e2940",transition:"background 0.3s"}}/>
      ))}
      <span style={{fontSize:9,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>x{mult.toFixed(2)}</span>
    </div>
  );
}

// ─── QUEST CARD ───────────────────────────────────────────────
function QuestCard({ quest, index, theme, onComplete, onDelete }) {
  const [completing,setCompleting]=useState(false);
  const [hover,setHover]=useState(false);
  const cardRef=useRef(null);
  const diff=DIFFICULTIES.find(d=>d.key===quest.difficulty);
  const cat=CATEGORIES.find(c=>c.key===quest.category);
  const typeCfg=QUEST_TYPES_CONFIG[quest.type]||QUEST_TYPES_CONFIG.side;
  const xpGain=Math.round((diff?.xp||50)*(quest.chainMultiplier||1)*(typeCfg.xpMult||1));
  const goldGain=Math.round((diff?.gold||25)*(quest.chainMultiplier||1)*(typeCfg.goldMult||1));
  const isHidden=quest.type==="hidden";
  const handleComplete=()=>{setCompleting(true);const rect=cardRef.current?.getBoundingClientRect();setTimeout(()=>onComplete(quest.id,rect?{x:rect.left+rect.width/2,y:rect.top}:null),500);};
  return (
    <div ref={cardRef} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{
      background:completing?`linear-gradient(135deg,${diff.color}15,transparent)`:hover?`linear-gradient(135deg,${theme.card},${diff.color}08)`:theme.card,
      border:`1px solid ${hover?diff.color+"44":isHidden?typeCfg.color+"33":theme.primary+"18"}`,borderRadius:14,padding:"14px 16px",marginBottom:8,
      borderLeft:`3px solid ${isHidden?typeCfg.color:diff.color}${hover?"cc":"66"}`,
      animation:completing?"fadeOut 0.5s ease forwards":`cardEnter 0.4s ease ${index*0.06}s both`,
      display:"flex",alignItems:"flex-start",gap:12,transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)",
      transform:hover&&!completing?"translateX(4px)":"none",backdropFilter:"blur(8px)",
      boxShadow:isHidden?`0 0 12px ${typeCfg.color}18`:"none"}}>
      <button onClick={handleComplete} style={{width:38,height:38,borderRadius:10,flexShrink:0,marginTop:2,
        background:completing?diff.color+"22":"transparent",border:`2px solid ${completing?diff.color:diff.color+"44"}`,
        color:diff.color,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:completing?"scale(1.1)":hover?"scale(1.05)":"scale(1)"}}>
        {completing?<span style={{animation:"checkPop 0.4s ease forwards",display:"inline-block"}}>✓</span>:<span style={{opacity:0.5}}>✓</span>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4,flexWrap:"wrap"}}>
          <QuestTypeBadge type={quest.type}/>
          <span style={{color:diff.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,padding:"1px 6px",borderRadius:4,background:diff.color+"15",fontSize:9}}>{diff.icon} {diff.label}</span>
          <span style={{padding:"1px 6px",borderRadius:4,fontSize:9,background:cat.color+"15",color:cat.color,fontFamily:"'JetBrains Mono',monospace"}}>{cat.icon} {cat.stat}</span>
          {quest.type==="weekly"&&quest.timeLimit&&<QuestTimer expiresAt={quest.timeLimit} color="#8b5cf6"/>}
        </div>
        <div style={{fontSize:14,fontWeight:600,color:completing?"#64748b":"#e2e8f0",textDecoration:completing?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>{quest.title}</div>
        {quest.type==="chained"&&<ChainedQuestProgress quest={quest}/>}
        <div style={{fontSize:10,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>
          <span style={{color:"#a78bfa"}}>+{xpGain} XP</span>
          <span style={{margin:"0 5px",color:"#1e293b"}}>·</span>
          <span style={{color:"#fbbf24"}}>+{goldGain} G</span>
          {isHidden&&<span style={{margin:"0 5px",color:typeCfg.color}}>· 🌟 Verborgene Belohnung</span>}
        </div>
      </div>
      <button onClick={()=>onDelete(quest.id)} style={{fontSize:14,color:"#1e293b",background:"transparent",padding:"4px",opacity:hover?1:0,transition:"opacity 0.2s",flexShrink:0}}>✕</button>
    </div>
  );
}
// ─── DUNGEON GATE ─────────────────────────────────────────────
function DungeonGate({ dungeon, playerStats, theme, onEnter, modifier }) {
  const [hover,setHover]=useState(false);
  const rankData=RANKS.find(r=>r.name===dungeon.rank)||RANKS[0];
  const reqs=Object.entries(dungeon.requirements);
  const timeLeft=Math.max(0,new Date(dungeon.expiresAt)-new Date());
  const hoursLeft=Math.floor(timeLeft/3600000);
  const minsLeft=Math.floor((timeLeft%3600000)/60000);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{
      background:dungeon.cleared?"rgba(8,8,16,0.4)":hover?`linear-gradient(135deg,${theme.card},${rankData.color}06)`:theme.card,
      border:`1px solid ${dungeon.cleared?"#1e293b":hover?rankData.color+"55":rankData.color+"22"}`,
      borderRadius:16,padding:16,position:"relative",overflow:"hidden",opacity:dungeon.cleared?0.45:1,
      backdropFilter:"blur(12px)",transition:"all 0.3s",transform:hover&&!dungeon.cleared?"translateY(-2px)":"none"}}>
      <div style={{position:"absolute",top:12,right:12,padding:"3px 10px",borderRadius:6,background:rankData.color+"18",border:`1px solid ${rankData.color}33`,fontSize:10,fontWeight:800,color:rankData.color,fontFamily:"'JetBrains Mono',monospace"}}>{dungeon.rank}-RANK</div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:rankData.color+"12",fontSize:26,flexShrink:0,border:`1px solid ${rankData.color}22`,animation:!dungeon.cleared?"gateFloat 3s ease-in-out infinite":"none"}}>{dungeon.cleared?"✓":dungeon.icon}</div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:dungeon.cleared?"#475569":"#e2e8f0",fontFamily:"'Cinzel',serif",letterSpacing:0.5}}>{dungeon.name}</div>
          <div style={{fontSize:11,color:"#475569",marginTop:3}}>{dungeon.desc}</div>
          <div style={{fontSize:10,color:"#334155",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{dungeon.floors} Floors</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {reqs.map(([stat,val])=>{const cat=CATEGORIES.find(c=>c.key===stat);const met=(playerStats[stat]||0)>=val;return(
          <div key={stat} style={{padding:"3px 9px",borderRadius:6,fontSize:10,background:met?cat.color+"15":"#ef444412",color:met?cat.color:"#ef4444",border:`1px solid ${met?cat.color+"33":"#ef444430"}`,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>
            {cat.stat} {val} {met?"✓":`(${playerStats[stat]||0})`}
          </div>
        );})}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
          <span style={{color:theme.accent}}>+{modifier?.xpMult?Math.round(dungeon.xp*modifier.xpMult):dungeon.xp} XP</span>
          <span style={{color:"#475569",margin:"0 6px"}}>·</span>
          <span style={{color:"#fbbf24"}}>+{modifier?.goldMult?Math.round(dungeon.gold*modifier.goldMult):dungeon.gold} G</span>
          {!dungeon.cleared&&timeLeft>0&&<><span style={{color:"#475569",margin:"0 6px"}}>·</span><span style={{color:hoursLeft<2?"#ef4444":"#475569"}}>⏱ {hoursLeft}h {minsLeft}m</span></>}
        </div>
        {dungeon.cleared
          ?<div style={{fontSize:11,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>CLEARED ✓</div>
          :<button onClick={()=>onEnter(dungeon)} style={{padding:"8px 18px",borderRadius:10,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${rankData.color}22,${rankData.color}0a)`,color:rankData.color,border:`1px solid ${rankData.color}44`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,transition:"all 0.2s"}}>ENTER ▶</button>
        }
      </div>
    </div>
  );
}

// ─── SPRINT 3: FLOOR PROGRESS BAR ─────────────────────────────
function FloorProgressBar({ floors, currentFloor, totalFloors }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:16}}>
      {floors.map((f,i)=>{
        const ft=FLOOR_TYPES[f.type];
        const isCurrent=f.floor===currentFloor&&!f.completed;
        const isPast=f.completed;
        const isFuture=!f.completed&&f.floor!==currentFloor;
        return(
          <div key={i} style={{
            flex:f.type==="boss_arena"?2:1,display:"flex",alignItems:"center",
            flexDirection:"column",gap:3,position:"relative",
          }}>
            <div style={{
              height: f.type==="boss_arena"?36:28,
              width:"100%",
              borderRadius:6,
              background: isPast?"#22c55e22":isCurrent?ft.color+"28":"rgba(10,10,20,0.6)",
              border:`1px solid ${isPast?"#22c55e55":isCurrent?ft.color:"#1e2940"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:isPast?10:f.type==="boss_arena"?16:12,
              transition:"all 0.4s",
              animation: isCurrent?`floorActiveGlow 1.5s infinite`:"none",
              "--floor-color":ft.color,
              boxShadow: isCurrent?`0 0 10px ${ft.color}44`:"none",
              opacity: isFuture?0.4:1,
              position:"relative",overflow:"hidden",
            }}>
              {isPast?"✓":ft.icon}
              {isCurrent&&<div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent,${ft.color}22,transparent)`,animation:"rankShine 1.5s ease-in-out infinite"}}/>}
            </div>
            <div style={{fontSize:7,color:isPast?"#22c55e":isCurrent?ft.color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,textAlign:"center",whiteSpace:"nowrap"}}>
              {f.type==="boss_arena"?"BOSS":f.floor}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPRINT 3: BOSS PHASE UI ──────────────────────────────────
function BossPhaseUI({ rank, bossHp, bossMaxHp, currentPhase, phases }) {
  const phaseData = currentPhase <= phases.length ? phases[currentPhase-1] : phases[phases.length-1];
  const hpPercent = Math.max(0, (bossHp/bossMaxHp)*100);
  const phaseColor = phaseData?.color || "#ef4444";
  return (
    <div style={{
      background:"rgba(8,2,16,0.96)",
      border:`1px solid ${phaseColor}44`,
      borderRadius:14,padding:"14px 16px",marginBottom:14,
      animation:"bossPhaseIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{fontSize:28,animation:"bossShake 0.5s ease",filter:`drop-shadow(0 0 10px ${phaseColor})`}}>{phaseData?.icon||"👑"}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
            <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:phaseColor,letterSpacing:2,fontWeight:700}}>
              PHASE {currentPhase}/{phases.length} · {phaseData?.name?.toUpperCase()}
            </div>
            <div style={{fontSize:11,fontWeight:900,color:phaseColor,fontFamily:"'Cinzel',serif"}}>{Math.round(hpPercent)}%</div>
          </div>
          <div style={{fontSize:10,color:"#64748b",lineHeight:1.4}}>{phaseData?.desc}</div>
        </div>
      </div>
      {/* HP Bar */}
      <div style={{height:8,background:"#0a0a14",borderRadius:4,overflow:"hidden",position:"relative"}}>
        <div style={{
          height:"100%",borderRadius:4,
          background:`linear-gradient(90deg,${phaseColor}99,${phaseColor})`,
          width:`${hpPercent}%`,
          transition:"width 0.8s ease",
          boxShadow:`0 0 10px ${phaseColor}66`,
        }}/>
        {/* Phase thresholds */}
        {phases.slice(0,-1).map((p,i)=>(
          <div key={i} style={{position:"absolute",top:0,left:`${p.hp}%`,width:2,height:"100%",background:"#1e293b",zIndex:2}}/>
        ))}
      </div>
      {/* Phase dots */}
      <div style={{display:"flex",gap:6,marginTop:8}}>
        {phases.map((p,i)=>(
          <div key={i} style={{
            flex:1,height:3,borderRadius:2,
            background:i+1<currentPhase?"#22c55e":i+1===currentPhase?p.color:"#1e293b",
            transition:"all 0.4s",
            boxShadow:i+1===currentPhase?`0 0 6px ${p.color}`:"none",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── SPRINT 3: DUNGEON BATTLE ─────────────────────────────────
function DungeonBattle({ dungeon, playerStats, theme, onResult, onClose, skillBonuses, modifier, formationBonus }) {
  const [phase,setPhase]=useState("strategy");
  const [strategy,setStrategy]=useState(STRATEGIES[0]);
  const [battleLog,setBattleLog]=useState([]);
  const [result,setResult]=useState(null);
  const [portalRot,setPortalRot]=useState(0);
  const [equipDrop,setEquipDrop]=useState(null);
  const animRef=useRef(null);
  // Sprint 3 state
  const [floorPlan]=useState(()=>generateFloorPlan(dungeon));
  const [currentFloor,setCurrentFloor]=useState(1);
  const [floorsCompleted,setFloorsCompleted]=useState([]);
  const [bossPhase,setBossPhase]=useState(1);
  const [bossHp,setBossHp]=useState(100);
  const [showExtraction,setShowExtraction]=useState(false);
  const [goldBonus,setGoldBonus]=useState(0);

  const rankData=RANKS.find(r=>r.name===dungeon.rank)||RANKS[0];
  const bossPhaseDefs=BOSS_PHASES[dungeon.rank]||BOSS_PHASES.E;
  const jobBonuses=getJobBonuses(state);
  const chance=calcSuccessChance(dungeon,playerStats,strategy.key,skillBonuses,modifier,formationBonus,jobBonuses);
  const chanceLabel=chance>=65?"HIGH":chance>=40?"MEDIUM":"RISKY";
  const chanceColor=chance>=65?"#22c55e":chance>=40?"#f59e0b":"#ef4444";
  
  // Archmage Insight: Best strategy
  const isInsightActive = jobBonuses.autoSolvePuzzle || (state.jobs.activeAbilityCooldowns?.insight && Date.now() < state.jobs.activeAbilityCooldowns.insight + 43200000);
  const bestStrat = isInsightActive ? CATEGORIES.reduce((best, cur) => {
    const curChance = calcSuccessChance(dungeon, playerStats, cur.key, skillBonuses, modifier, formationBonus, jobBonuses);
    return curChance > best.chance ? { key: cur.key, chance: curChance } : best;
  }, { key: "", chance: -1 }) : null;

  useEffect(()=>{
    if(phase!=="entering")return;
    let rot=0;
    const spin=()=>{rot+=2;setPortalRot(rot);animRef.current=requestAnimationFrame(spin);};
    animRef.current=requestAnimationFrame(spin);
    return()=>cancelAnimationFrame(animRef.current);
  },[phase]);

  const addLog=(log)=>setBattleLog(prev=>[...prev,log]);

  const startBattle=()=>{
    setPhase("entering");
    setTimeout(()=>{ setPhase("floors"); runNextFloor(1, []); },2400);
  };

  const runNextFloor=(floorNum, completedSoFar)=>{
    const fl=floorPlan[floorNum-1];
    if(!fl){ finishAllFloors(completedSoFar); return; }
    setCurrentFloor(floorNum);
    setBattleLog([]);

    const isStrong=(playerStats[strategy.key]||0)>=(dungeon.requirements[dungeon.primaryStat]||10)*1.4;
    const isWeak=(playerStats[strategy.key]||0)<(dungeon.requirements[dungeon.primaryStat]||10)*0.6;

    if(fl.type==="boss_arena"){
      // Boss fight with phases
      setBossHp(100);
      setBossPhase(1);
      setPhase("boss");
      runBossPhase(1, completedSoFar, isStrong, isWeak, floorNum);
      return;
    }

    if(fl.type==="safe_room"){
      const safeLog=[
        {text:`▶ FLOOR ${floorNum}/${dungeon.floors} · 🏕️ SAFE ROOM`,type:"success"},
        {text:"Die Shadow Army erholt sich. Kräfte wiederhergestellt.",type:"success"},
        {text:"Taktische Neuausrichtung abgeschlossen.",type:"info"},
      ];
      let delay=0;
      safeLog.forEach((l,i)=>setTimeout(()=>addLog(l),delay+=600));
      setTimeout(()=>{
        const next=[...completedSoFar,floorNum];
        setFloorsCompleted(next);
        setTimeout(()=>runNextFloor(floorNum+1,next),800);
      },delay+800);
      return;
    }

    if(fl.type==="treasure"){
      const bonus=Math.floor(dungeon.gold*0.2);
      setGoldBonus(prev=>prev+bonus);
      const tLog=[
        {text:`▶ FLOOR ${floorNum}/${dungeon.floors} · 💰 SCHATZKAMMER`,type:"gold"},
        {text:`Truhe geöffnet! +${bonus} Gold Bonus geborgen.`,type:"gold"},
      ];
      let delay=0;
      tLog.forEach((l,i)=>setTimeout(()=>addLog(l),delay+=700));
      setTimeout(()=>{
        const next=[...completedSoFar,floorNum];
        setFloorsCompleted(next);
        setTimeout(()=>runNextFloor(floorNum+1,next),700);
      },delay+700);
      return;
    }

    const ft=FLOOR_TYPES[fl.type];
    const logs=[
      {text:`▶ FLOOR ${floorNum}/${dungeon.floors} · ${ft.icon} ${ft.name.toUpperCase()}`,type:"system"},
      {text:`[${strategy.icon} ${strategy.label}] Taktik angewendet`,type:"info"},
      ...getFloorLogs(fl,dungeon,strategy,playerStats,isStrong,isWeak),
      {text:`Floor ${floorNum} abgeschlossen.`,type:"success"},
    ];
    if(modifier&&modifier.id!=="none"&&floorNum===1) logs.splice(2,0,{text:`[MODIFIER] ${modifier.icon} ${modifier.name}`,type:"info"});
    if(formationBonus?.dungeonBonus>0&&floorNum===1) logs.splice(2,0,{text:`[SHADOW] +${formationBonus.dungeonBonus}% Formation-Bonus`,type:"shadow"});

    let delay=0;
    logs.forEach((l,i)=>setTimeout(()=>addLog(l),delay+=750));
    setTimeout(()=>{
      const next=[...completedSoFar,floorNum];
      setFloorsCompleted(next);
      setTimeout(()=>runNextFloor(floorNum+1,next),900);
    },delay+700);
  };

  const runBossPhase=(pNum, completedSoFar, isStrong, isWeak, floorNum)=>{
    const ph=bossPhaseDefs[pNum-1];
    if(!ph){ finishBoss(completedSoFar, floorNum); return; }
    setBossPhase(pNum);
    const hpAtPhaseEnd = pNum<bossPhaseDefs.length ? bossPhaseDefs[pNum].hp : 0;

    const phaseLogs=[
      {text:`⚔️ BOSS PHASE ${pNum}/${bossPhaseDefs.length} · ${ph.icon} ${ph.name.toUpperCase()}`,type:"danger"},
      {text:ph.desc,type:"warning"},
    ];
    if(pNum===1){
      if(isStrong) phaseLogs.push({text:`${strategy.icon} Überlegene Kraft! Boss zurückgedrängt!`,type:"success"});
      else if(isWeak) phaseLogs.push({text:"⚠ Kritisches Defizit! Boss dominiert!",type:"danger"});
      else phaseLogs.push({text:`${strategy.icon} Harter Kampf gegen den Boss...`,type:"action"});
    } else {
      phaseLogs.push({text:`Boss verstärkt! ATK-Multiplikator ×${ph.atkMod}!`,type:"danger"});
      phaseLogs.push({text:isStrong?`${strategy.icon} Entschlossener Gegenschlag!`:"Alle Kräfte mobilisiert – durchhalten!",type:isStrong?"success":"action"});
    }

    let delay=0;
    phaseLogs.forEach((l,i)=>setTimeout(()=>addLog(l),delay+=800));

    // Animate HP
    const targetHp=hpAtPhaseEnd;
    setTimeout(()=>setBossHp(targetHp),delay+400);

    if(pNum<bossPhaseDefs.length){
      setTimeout(()=>{
        addLog({text:`Boss-Energie übersteigt Grenzwert... Phase ${pNum+1} aktiviert!`,type:"danger"});
        setTimeout(()=>runBossPhase(pNum+1,completedSoFar,isStrong,isWeak,floorNum),1200);
      },delay+1800);
    } else {
      setTimeout(()=>finishBoss(completedSoFar,floorNum),delay+1800);
    }
  };

  const finishBoss=(completedSoFar,floorNum)=>{
    const won=Math.random()*100<chance;
    const next=[...completedSoFar,floorNum];
    setFloorsCompleted(next);
    if(won){
      setBossHp(0);
      setTimeout(()=>setShowExtraction(true),800);
      setTimeout(()=>setShowExtraction(false),3200);
      setTimeout(()=>finishAllFloors(next,true),3400);
    } else {
      addLog({text:"💀 HUNTER DEFEATED – Niederlage...",type:"danger"});
      setTimeout(()=>finishAllFloors(next,false),1500);
    }
  };

  const finishAllFloors=(completedFloors,bossWon=undefined)=>{
    const won=bossWon!==undefined?bossWon:Math.random()*100<chance;
    const xpMult=modifier?.xpMult||1;
    const goldMult=modifier?.goldMult||1;
    const bonusXp=Math.floor(completedFloors.length/dungeon.floors*dungeon.xp*0.15);
    const xpResult=won?Math.round(dungeon.xp*xpMult+bonusXp):Math.round(dungeon.xp*0.08);
    const goldResult=won?Math.round((dungeon.gold+goldBonus)*goldMult):0;
    const drop=won?getEquipDropForDungeon(dungeon.rank):null;
    setEquipDrop(drop);
    setResult({won,xp:xpResult,gold:goldResult,drop,floorsCleared:completedFloors.length,totalFloors:dungeon.floors,goldBonus, strategy: strategy.key});
    setPhase("result");
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(2,2,8,0.97)",backdropFilter:"blur(8px)",animation:"fadeIn 0.3s",overflowY:"auto"}}>

      {/* EXTRACTION CINEMATIC */}
      {showExtraction&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",flexDirection:"column",gap:16,animation:"fadeIn 0.3s"}}>
          <div style={{fontSize:72,animation:"float 1s ease-in-out infinite",filter:"drop-shadow(0 0 30px #22c55e)"}}>🌀</div>
          <div style={{fontSize:14,letterSpacing:8,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace",animation:"breathe 0.6s infinite"}}>EXTRACTION</div>
          <div style={{fontSize:10,letterSpacing:4,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>DUNGEON VERLASSEN...</div>
          <div style={{marginTop:16,display:"flex",gap:8}}>
            {[0,1,2,3,4].map(i=>(
              <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",animation:`breathe 0.8s infinite`,animationDelay:`${i*0.15}s`}}/>
            ))}
          </div>
        </div>
      )}

      {phase==="strategy"&&(
        <div style={{width:"100%",maxWidth:440,padding:"0 20px",animation:"slideUp 0.4s ease"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:52,marginBottom:10,filter:`drop-shadow(0 0 20px ${rankData.color})`,animation:"gateFloat 2s ease-in-out infinite"}}>{dungeon.icon}</div>
            <div style={{fontSize:10,letterSpacing:4,color:rankData.color,fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{dungeon.rank}-RANK · {dungeon.floors} FLOORS</div>
            <div style={{fontSize:24,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif"}}>{dungeon.name}</div>
            {modifier&&modifier.id!=="none"&&<div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:modifier.color+"15",border:`1px solid ${modifier.color}33`,fontSize:11,color:modifier.color,fontFamily:"'JetBrains Mono',monospace"}}>{modifier.icon} {modifier.name}</div>}
            {formationBonus?.dungeonBonus>0&&<div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:"#7c3aed15",border:"1px solid #7c3aed33",fontSize:11,color:"#a78bfa",fontFamily:"'JetBrains Mono',monospace"}}>🌑 Shadow Army +{formationBonus.dungeonBonus}%</div>}
          </div>
          {/* Floor Preview */}
          <div style={{background:"rgba(6,6,14,0.9)",borderRadius:12,padding:"12px 14px",marginBottom:14,border:"1px solid #1e2940"}}>
            <div style={{fontSize:8,color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:8}}>FLOOR-VORSCHAU</div>
            <div style={{display:"flex",gap:3}}>
              {floorPlan.map((f,i)=>{
                const ft=FLOOR_TYPES[f.type];
                return(
                  <div key={i} style={{
                    flex:f.type==="boss_arena"?2:1,
                    background:ft.color+"18",border:`1px solid ${ft.color}44`,
                    borderRadius:6,padding:"5px 4px",textAlign:"center",
                  }}>
                    <div style={{fontSize:10}}>{ft.icon}</div>
                    <div style={{fontSize:6,color:ft.color,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>F{f.floor}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{fontSize:9,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>STRATEGIE WÄHLEN</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {STRATEGIES.map(s=>{
              const isActive=strategy.key===s.key;
              const isBest = bestStrat?.key === s.key;
              return(
                <button key={s.key} onClick={()=>setStrategy(s)} style={{padding:"14px 12px",borderRadius:12,textAlign:"left",background:isActive?s.color+"14":isBest?s.color+"08":"rgba(10,10,20,0.6)",border:`1px solid ${isActive?s.color+"66":isBest?s.color+"33":"#1e2940"}`,color:isActive?s.color:isBest?s.color+"aa":"#64748b",transition:"all 0.22s",position:"relative"}}>
                  {isBest && <div style={{position:"absolute", top:-8, right:-6, fontSize:14, animation:"pulse 2s infinite"}}>👁️</div>}
                  <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</div>
                  <div style={{fontSize:10,opacity:0.7,marginTop:2,lineHeight:1.4}}>{s.desc}</div>
                  <div style={{fontSize:11,marginTop:8,fontFamily:"'JetBrains Mono',monospace",color:isActive?s.color:"#475569"}}>{CATEGORIES.find(c=>c.key===s.key)?.stat}: <span style={{fontWeight:700}}>{playerStats[s.key]||0}</span></div>
                </button>
              );
            })}
          </div>
          <div style={{background:"rgba(8,8,18,0.9)",borderRadius:12,padding:"14px 16px",marginBottom:18,border:`1px solid ${chanceColor}22`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>ERFOLGSWAHRSCHEINLICHKEIT</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,fontWeight:700,color:chanceColor,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:5,background:chanceColor+"15",border:`1px solid ${chanceColor}33`}}>{chanceLabel}</span>
                <span style={{fontSize:22,fontWeight:900,color:chanceColor,fontFamily:"'Cinzel',serif"}}>{chance}%</span>
              </div>
            </div>
            <div style={{height:5,background:"#0a0a14",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${chance}%`,height:"100%",borderRadius:3,background:`linear-gradient(90deg,${chanceColor}88,${chanceColor})`,transition:"width 0.4s ease",boxShadow:`0 0 8px ${chanceColor}44`}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:14,borderRadius:12,fontSize:12,background:"transparent",color:"#475569",border:"1px solid #1e2940",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>ABBRECHEN</button>
            <button onClick={startBattle} style={{flex:2,padding:14,borderRadius:12,fontSize:13,fontWeight:700,background:`linear-gradient(135deg,${rankData.color}28,${rankData.color}10)`,color:rankData.color,border:`1px solid ${rankData.color}55`,fontFamily:"'Cinzel',serif",letterSpacing:2,boxShadow:`0 4px 20px ${rankData.color}18`}}>⚔️ BETRETEN</button>
          </div>
        </div>
      )}

      {phase==="entering"&&(
        <div style={{textAlign:"center"}}>
          <div style={{position:"relative",width:160,height:160,margin:"0 auto 28px"}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${rankData.color}55`,borderTopColor:rankData.color,transform:`rotate(${portalRot}deg)`}}/>
            <div style={{position:"absolute",inset:14,borderRadius:"50%",border:`1px solid ${rankData.color}33`,borderBottomColor:rankData.color+"88",transform:`rotate(${-portalRot*1.6}deg)`}}/>
            <div style={{position:"absolute",inset:28,borderRadius:"50%",border:`1px solid ${rankData.color}22`,borderTopColor:rankData.color+"55",transform:`rotate(${portalRot*0.8}deg)`}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,filter:`drop-shadow(0 0 18px ${rankData.color})`}}>{dungeon.icon}</div>
          </div>
          <div style={{fontSize:10,letterSpacing:6,color:rankData.color,fontFamily:"'JetBrains Mono',monospace",animation:"breathe 0.9s infinite"}}>{dungeon.name}</div>
        </div>
      )}

      {(phase==="floors"||phase==="boss")&&(
        <div style={{width:"100%",maxWidth:440,padding:"0 20px 20px"}}>
          {/* Header */}
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:9,letterSpacing:4,color:rankData.color,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{dungeon.rank}-RANK · {dungeon.name}</div>
            <div style={{fontSize:11,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>FLOOR {currentFloor}/{dungeon.floors}</div>
          </div>
          {/* Floor Progress */}
          <FloorProgressBar floors={floorPlan} currentFloor={currentFloor} totalFloors={dungeon.floors}/>
          {/* Shadow Step Skip Button */}
          {phase==="floors" && state.jobs?.current === "assassin" && (
            <div style={{marginTop:8, display:"flex", justifyContent:"center"}}>
              <button 
                onClick={() => {
                  const now = Date.now();
                  const lastUsed = state.jobs.activeAbilityCooldowns?.shadow_step || 0;
                  if (now < lastUsed + 28800000) {
                      notify("Shadow Step auf Cooldown.", "info");
                      return;
                  }
                  // Notify and skip
                  addLog({text:"✨ SHADOW STEP: Floor übersprungen!", type:"shadow"});
                  setTimeout(() => runNextFloor(currentFloor + 1, [...floorsCompleted, currentFloor]), 1000);
                  // Update cooldown in global state
                  const newCooldowns = {...state.jobs.activeAbilityCooldowns, shadow_step: now};
                  persist({...state, jobs: {...state.jobs, activeAbilityCooldowns: newCooldowns}});
                }}
                disabled={Date.now() < (state.jobs.activeAbilityCooldowns?.shadow_step || 0) + 28800000}
                style={{padding:"8px 16px", borderRadius:10, fontSize:10, fontWeight:900, background:"rgba(20,184,166,0.15)", color:"#14b8a6", border:"1px solid #14b8a655", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1}}
              >✨ SHADOW STEP (SKIP FLOOR)</button>
            </div>
          )}
          {/* Boss Phase UI */}
          {phase==="boss"&&<BossPhaseUI rank={dungeon.rank} bossHp={bossHp} bossMaxHp={100} currentPhase={bossPhase} phases={bossPhaseDefs}/>}
          {/* Battle Log */}
          <div style={{background:"rgba(3,3,9,0.95)",border:`1px solid ${phase==="boss"?"#ef444420":"#0f1628"}`,borderRadius:14,padding:"16px 16px",minHeight:180,maxHeight:300,overflowY:"auto",fontFamily:"'JetBrains Mono',monospace"}}>
            {battleLog.map((log,i)=>{
              const colors={system:"#6366f1",info:"#22d3ee",warning:"#f59e0b",danger:"#ef4444",success:"#22c55e",action:"#e2e8f0",shadow:"#a78bfa",gold:"#fbbf24"};
              return(
                <div key={i} style={{fontSize:11,color:colors[log.type]||"#e2e8f0",marginBottom:10,animation:"battleLogIn 0.4s ease",display:"flex",gap:8}}>
                  <span style={{color:"#1e293b",flexShrink:0}}>&gt;</span><span style={{lineHeight:1.5}}>{log.text}</span>
                </div>
              );
            })}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><span style={{color:"#1e293b",fontSize:12}}>&gt;</span><div style={{width:7,height:13,background:"#6366f1",animation:"cursorBlink 1s infinite"}}/></div>
          </div>
          {/* Floor progress indicator */}
          <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}>{floorsCompleted.length}/{dungeon.floors} FLOORS</div>
            <div style={{flex:1,height:2,background:"#0a0a14",borderRadius:1,overflow:"hidden",maxWidth:120}}>
              <div style={{height:"100%",background:rankData.color,borderRadius:1,width:`${(floorsCompleted.length/dungeon.floors)*100}%`,transition:"width 0.6s ease"}}/>
            </div>
          </div>
        </div>
      )}

      {phase==="result"&&result&&(
        <div style={{textAlign:"center",padding:"0 24px",width:"100%",maxWidth:420,animation:"dungeonResultIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{fontSize:72,marginBottom:12,filter:`drop-shadow(0 0 28px ${result.won?"#22c55e":"#ef4444"})`,animation:"gateFloat 2s ease-in-out infinite"}}>{result.won?"🏆":"💀"}</div>
          <div style={{fontSize:result.won?28:22,fontWeight:900,fontFamily:"'Cinzel',serif",color:result.won?"#22c55e":"#ef4444",textShadow:`0 0 32px ${result.won?"#22c55e":"#ef4444"}`,marginBottom:6,letterSpacing:2}}>{result.won?"DUNGEON CLEARED":"HUNTER DEFEATED"}</div>
          {/* Floors stat */}
          <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:14}}>
            {result.floorsCleared}/{result.totalFloors} FLOORS CONQUERED
          </div>
          <div style={{background:"rgba(8,8,18,0.9)",border:`1px solid ${result.won?"#22c55e22":"#ef444422"}`,borderRadius:14,padding:"16px 20px",marginBottom:12,display:"flex",justifyContent:"center",gap:28}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:5}}>XP</div><div style={{fontSize:24,fontWeight:900,color:result.won?"#a78bfa":"#334155",fontFamily:"'Cinzel',serif"}}>+{result.xp}</div></div>
            <div style={{width:1,background:"#0f1628"}}/>
            <div style={{textAlign:"center"}}><div style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:5}}>GOLD</div><div style={{fontSize:24,fontWeight:900,color:result.won?"#fbbf24":"#334155",fontFamily:"'Cinzel',serif"}}>+{result.gold}</div></div>
            {result.goldBonus>0&&<>
              <div style={{width:1,background:"#0f1628"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:5}}>BONUS</div><div style={{fontSize:24,fontWeight:900,color:"#fbbf24",fontFamily:"'Cinzel',serif"}}>+{Math.round(result.goldBonus*(modifier?.goldMult||1))}</div></div>
            </>}
          </div>
          {result.drop&&(
            <div style={{background:"rgba(8,8,18,0.9)",border:`1px solid ${RARITY_COLORS[result.drop.rarity]}33`,borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>{result.drop.icon}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:9,color:RARITY_COLORS[result.drop.rarity],fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:2}}>{RARITY_LABELS[result.drop.rarity].toUpperCase()} DROP</div>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{result.drop.name}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{result.drop.desc}</div>
              </div>
            </div>
          )}
          <button onClick={()=>onResult(result)} style={{width:"100%",padding:16,borderRadius:14,fontSize:13,fontWeight:700,background:result.won?"linear-gradient(135deg,rgba(34,197,94,0.25),rgba(34,197,94,0.08))":"linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.08))",color:result.won?"#22c55e":"#ef4444",border:`1px solid ${result.won?"#22c55e44":"#ef444444"}`,fontFamily:"'Cinzel',serif",letterSpacing:2,animation:result.won?"extractionPulse 2s infinite":"none"}}>{result.won?"⬆ EXTRACTION ABSCHLIESSEN":"DUNGEON VERLASSEN"}</button>
        </div>
      )}
    </div>
  );
}

// ─── JOBS UI ──────────────────────────────────────────────────
function JobCard({ jobKey, level, xp, currentJob, onSwitch, onActivate, theme, requirementsMet, cooldowns }) {
  const job = JOBS[jobKey];
  const isCurrent = currentJob === jobKey;
  const nextXp = JOB_XP_LEVELS[level + 1] || JOB_XP_LEVELS[level];
  const progress = Math.min((xp / nextXp) * 100, 100);
  const title = JOB_TITLES[level] || "Novize";
  const ability = job.activeAbility;
  
  const lastUsed = cooldowns?.[ability.key] || 0;
  const now = Date.now();
  const isOnCooldown = now < (lastUsed + (ability.cooldown * 1000));
  const remaining = Math.max(0, Math.ceil((lastUsed + (ability.cooldown * 1000) - now) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);

  return (
    <div style={{
      background: isCurrent ? `linear-gradient(135deg, ${job.color}15, ${theme.card})` : theme.card,
      border: `1px solid ${isCurrent ? job.color + "66" : theme.primary + "12"}`,
      borderRadius: 18, padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden",
      backdropFilter: "blur(12px)", transition: "all 0.3s ease",
      opacity: requirementsMet ? 1 : 0.6,
      boxShadow: isCurrent ? `0 0 30px ${job.color}15` : "none"
    }}>
      {isCurrent && (
        <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, color: job.color, fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", animation: "pulse 2s infinite" }}>
          AKTIVE SPEZIALISIERUNG
        </div>
      )}
      
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: `${job.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: `1px solid ${job.color}33`, boxShadow: isCurrent ? `0 0 20px ${job.color}22` : "none" }}>{job.icon}</div>
        <div>
          <div style={{ fontSize: 11, color: job.color, fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{title.toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif" }}>{job.name}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>Lv. {level} / 10</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, background: "#0f0f1e", borderRadius: 3, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: job.color, boxShadow: `0 0 15px ${job.color}88`, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>

      {/* Bonuses */}
      <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: "14px", marginBottom: 18, border: `1px solid ${job.color}11` }}>
        <div style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>PASSIVE BONI & SYNERGIEN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(job.passives).map(([key, p], i) => {
            const isUnlocked = key === 'base' || (level >= parseInt(key.replace('level', '')) || 0);
            return (
              <div key={i} style={{ 
                fontSize: 11, color: isUnlocked ? "#cbd5e1" : "#475569", 
                display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.4,
                opacity: isUnlocked ? 1 : 0.5
              }}>
                <div style={{ 
                  fontSize: 8, padding: "2px 5px", borderRadius: 4, 
                  background: isUnlocked ? `${job.color}22` : "rgba(255,255,255,0.05)",
                  color: isUnlocked ? job.color : "#334155",
                  minWidth: 45, textAlign: "center", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {key === 'base' ? 'BASIS' : `LV.${key.replace('level', '')}`}
                </div>
                <span>{p}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Ability */}
      <div style={{ background: `${job.color}08`, border: `1px solid ${job.color}22`, borderRadius: 16, padding: "16px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: job.color, fontFamily: "'Cinzel', serif" }}>{ability.name}</div>
          </div>
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono', monospace", background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: 4 }}>
            COOLDOWN: {ability.cooldown / 3600}h
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 14, fontStyle: "italic" }}>"{ability.desc}"</div>
        
        {isCurrent ? (
          <button 
            onClick={() => onActivate(jobKey)}
            disabled={isOnCooldown || level < ability.unlockLevel}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, fontSize: 11, fontWeight: 800,
              background: isOnCooldown || level < ability.unlockLevel ? "rgba(255,255,255,0.02)" : `linear-gradient(135deg, ${job.color}dd, ${job.color}aa)`,
              color: isOnCooldown || level < ability.unlockLevel ? "#334155" : "#fff",
              border: `1px solid ${isOnCooldown || level < ability.unlockLevel ? "rgba(255,255,255,0.05)" : job.color + "44"}`,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, cursor: isOnCooldown || level < ability.unlockLevel ? "not-allowed" : "pointer",
              boxShadow: isOnCooldown || level < ability.unlockLevel ? "none" : `0 4px 15px ${job.color}33`,
              transition: "all 0.3s"
            }}
          >
            {level < ability.unlockLevel ? `FREISCHALTUNG BEI LV. ${ability.unlockLevel}` : isOnCooldown ? `${h}h ${m}m VERBLEIBEND` : "FÄHIGKEIT AKTIVIEREN"}
          </button>
        ) : (
          <button 
            onClick={() => onSwitch(jobKey)}
            disabled={!requirementsMet}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, fontSize: 11, fontWeight: 800,
              background: requirementsMet ? "rgba(255,255,255,0.05)" : "transparent",
              color: requirementsMet ? "#fff" : "#334155",
              border: `1px solid ${requirementsMet ? job.color + "44" : "rgba(255,255,255,0.05)"}`,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, cursor: requirementsMet ? "pointer" : "not-allowed"
            }}
          >
            {requirementsMet ? "DIESEN JOB WÄHLEN" : "VORAUSSETZUNGEN NICHT ERFÜLLT"}
          </button>
        )}
      </div>
    </div>
  );
}

function JobsView({ state, onSwitch, onActivate, theme }) {
  const currentJob = state.jobs?.current;
  
  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ marginBottom: 24, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎭</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", letterSpacing: 4 }}>JOB SYSTEM</h2>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Wähle eine Spezialisierung ab Level 50 um deine Macht als Hunter zu perfektionieren. Jeder Job bietet einzigartige Synergien mit deinem Shadow-System.</p>
      </div>

      {state.level < 50 && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderLeft: "4px solid #ef4444", borderRadius: 14, padding: "18px", marginBottom: 24, backdropFilter: "blur(8px)" }}>
          <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, marginBottom: 6, letterSpacing: 2 }}>ZUGRIFF VERWEIGERT</div>
          <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.5 }}>Das Job-System wird erst ab Level 50 freigeschaltet. Trainiere härter, Hunter. <br/><span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>Aktuelles Level: {state.level} / 50</span></div>
        </div>
      )}

      {Object.keys(JOBS).map(jobKey => {
        const req = JOBS[jobKey].unlockRequirement;
        let requirementsMet = state.level >= req.level;
        
        // Spezielle Requirements prüfen
        if (req.allJobsLevel5) {
          const allLevels = state.jobs?.levels || {};
          const otherJobs = Object.keys(JOBS).filter(k => k !== "necromancer");
          requirementsMet = requirementsMet && otherJobs.every(k => (allLevels[k] || 0) >= 5);
        }
        if (req.minShadows) {
          requirementsMet = requirementsMet && (state.shadowArmy?.shadows?.length || 0) >= req.minShadows;
        }

        return (
          <JobCard 
            key={jobKey}
            jobKey={jobKey}
            level={state.jobs?.levels?.[jobKey] || 0}
            xp={state.jobs?.xp?.[jobKey] || 0}
            currentJob={currentJob}
            onSwitch={onSwitch}
            onActivate={onActivate}
            theme={theme}
            requirementsMet={!!requirementsMet}
            cooldowns={state.jobs?.activeAbilityCooldowns}
          />
        );
      })}
    </div>
  );
}

function JobLevelUpCinematic({ job, newLevel, onClose }) {
  const title = JOB_TITLES[newLevel] || "Meister";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(1, 0, 5, 0.98)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer", animation: "fadeIn 0.5s ease" }}>
      <div style={{ textAlign: "center", maxWidth: 400, animation: "slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        <div style={{ fontSize: 80, marginBottom: 20, filter: `drop-shadow(0 0 30px ${job.color})`, animation: "float 3s infinite" }}>{job.icon}</div>
        <div style={{ fontSize: 12, letterSpacing: 8, color: job.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, animation: "pulse 2s infinite" }}>JOB LEVEL UP</div>
        <h2 style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>{job.name}</h2>
        <div style={{ fontSize: 20, color: job.color, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 4, marginBottom: 32 }}>{title.toUpperCase()} (LV. {newLevel})</div>
        
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${job.color}33`, borderRadius: 16, padding: "20px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>NEUE KRÄFTE FREIGESCHALTET</div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>Boni wurden verstärkt. Spezialisierung vertieft.</div>
        </div>
        
        <button style={{ background: job.color, color: "#fff", padding: "14px 40px", borderRadius: 14, fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel', serif", letterSpacing: 4, border: "none", boxShadow: `0 0 40px ${job.color}44` }}>WEITER</button>
      </div>
    </div>
  );
}

function AbilityActivationCinematic({ ability, job, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(1, 0, 5, 0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer", animation: "fadeIn 0.4s ease" }}>
       <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
         {Array.from({ length: 20 }).map((_, i) => (
           <div key={i} style={{
             position: "absolute", top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
             width: 2, height: 20 + Math.random() * 100, background: job.color, opacity: 0.3,
             transform: `rotate(${45 + Math.random() * 10}deg)`, animation: `skillFlow ${1 + Math.random()}s infinite linear`
           }} />
         ))}
       </div>
       <div style={{ textAlign: "center", animation: "scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
         <div style={{ fontSize: 100, marginBottom: 20, filter: `drop-shadow(0 0 40px ${job.color})`, animation: "pulse 1.5s infinite" }}>{ability.icon || "✨"}</div>
         <div style={{ fontSize: 14, letterSpacing: 6, color: job.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>FÄHIGKEIT AKTIVIERT</div>
         <h2 style={{ fontSize: 48, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel', serif", textShadow: `0 0 20px ${job.color}`, marginBottom: 16 }}>{ability.name.toUpperCase()}</h2>
         <div style={{ fontSize: 16, color: "#94a3b8", fontStyle: "italic", maxWidth: 300, margin: "0 auto" }}>"{ability.desc}"</div>
       </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App({ initialHunterName }) {
  const [state,setState]=useState(null);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("dashboard");
  const [showCreate,setShowCreate]=useState(false);
  const [levelUp,setLevelUp]=useState(null);
  const [showSetup,setShowSetup]=useState(false);
  const [questFilter,setQuestFilter]=useState("all");
  const [notifications,setNotifications]=useState([]);
  const [xpFloats,setXpFloats]=useState([]);
  const [prevRank,setPrevRank]=useState(null);
  const [activeDungeon,setActiveDungeon]=useState(null);
  const [achQueue,setAchQueue]=useState([]);
  const [ariseTarget,setAriseTarget]=useState(null);  // Now a shadow object
  const [selectedShadow,setSelectedShadow]=useState(null);
  const [shadowSubView,setShadowSubView]=useState("army"); // army | formation | named
  const [qTitle,setQTitle]=useState("");
  const [qDiff,setQDiff]=useState("normal");
  const [qCat,setQCat]=useState("agi");
  const [qType,setQType]=useState("side");
  const [showHiddenQuestModal,setShowHiddenQuestModal]=useState(null); // hq object

  useEffect(()=>{
    loadState().then(s=>{
      if(s){
        const today=getToday();
        if(s.lastActiveDate&&s.lastActiveDate!==today){
          const diff=Math.floor((new Date(today)-new Date(s.lastActiveDate))/86400000);
          if(diff>1){
            s.streak=0;
            const hadDailies=s.quests?.some(q=>q.type==="daily"&&!q.completed);
            if(diff>=2&&hadDailies&&!s.penaltyZone?.active){
              s.penaltyZone={active:true,redemptionLeft:3,questsCompletedInPenalty:0};
            }
          }
          s.quests=s.quests?.map(q=>q.type==="daily"?{...q,completed:false}:q)||[];
          // Reset emergency quest daily
          s.emergencyQuest=null;
          s.emergencyDone=false;
          s.emergencyFailed=false;
          // Reset weekly quests on Monday
          const dayOfWeek=new Date().getDay();
          if(dayOfWeek===1){
            s.quests=s.quests?.filter(q=>q.type!=="weekly")||[];
            s.weeklyQuestReset=today;
          }
        }
        s.lastActiveDate=today;
        // Generate emergency quest for today if missing
        if(!s.emergencyQuest||!s.emergencyQuest.id.endsWith(today)){
          s.emergencyQuest=generateEmergencyQuest(s.level||1);
          s.emergencyDone=false;
          s.emergencyFailed=false;
        }
        if(!s.hiddenQuests) s.hiddenQuests={discovered:[],completed:[]};
        if(!s.lastDungeonRefresh||s.lastDungeonRefresh!==today){
          s.dungeons=generateDungeons(getRank(s.level).name);
          s.lastDungeonRefresh=today;
          s.todayModifier=getDailyModifier();
        }

        // --- AUTH INTEGRATION ---
        if(!s.hunterName && initialHunterName) {
          s.hunterName = initialHunterName;
        }
        
        setState(s);
        if(!s.hunterName) setShowSetup(true);
      } else {
        const startState = { ...DEFAULT_STATE };
        if(initialHunterName) {
          startState.hunterName = initialHunterName;
          setShowSetup(false);
        } else {
          setShowSetup(true);
        }
        setState(startState);
      }
      setLoading(false);
    });
  },[initialHunterName]);

  const persist=useCallback(s=>{setState(s);saveState(s);},[]);

  const theme=useMemo(()=>THEMES[state?.selectedTheme||"default"],[state?.selectedTheme]);
  const modifier=state?.todayModifier||getDailyModifier();

  const removeNotif=useCallback(id=>setNotifications(prev=>prev.filter(n=>n.id!==id)),[]);
  const notify=useCallback((msg,type="info")=>setNotifications(prev=>[...prev,{id:genId(),msg,type}]),[]);

  const processAchievements=useCallback(nextState=>{
    const newAchs=checkAchievements(nextState);
    if(!newAchs.length) return nextState;
    const unlocked=[...(nextState.achievements?.unlocked||[]),...newAchs.map(a=>a.id)];
    let xpBonus=0,goldBonus=0;
    newAchs.forEach(a=>{xpBonus+=a.reward.xp||0;goldBonus+=a.reward.gold||0;});
    setAchQueue(prev=>[...prev,...newAchs]);
    return{...nextState,xp:nextState.xp+xpBonus,gold:nextState.gold+goldBonus,totalGoldEarned:(nextState.totalGoldEarned||0)+goldBonus,achievements:{...nextState.achievements,unlocked}};
  },[]);

  const computeXpGain = useCallback((quest, streakBonus, equipBonuses, skillBonuses, penaltyActive, formBonus, jobBonuses = {}) => {
    const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
    let xp = diff.xp;
    xp *= (1 + streakBonus / 100);
    xp *= (1 + (equipBonuses.xpBonus || 0));
    xp *= (1 + (skillBonuses.xpCatBonus?.[quest.category] || 0));
    xp *= (1 + (jobBonuses.xpCatBonus?.[quest.category] || 0));
    if (quest.difficulty === "hard" || quest.difficulty === "boss") xp *= (1 + (skillBonuses.xpHardBonus || 0));
    xp *= (1 + (skillBonuses.xpGlobal || 0));
    xp *= (1 + (jobBonuses.xpGlobal || 0));
    xp *= (1 + (formBonus?.xpBonus || 0));
    if (penaltyActive) xp *= 0.8;
    // Job multi
    xp *= (jobBonuses.xpGlobalMultiplier || 1.0);
    // Sprint 2: type multiplier + chain multiplier
    const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
    xp *= (typeCfg.xpMult || 1);
    xp *= (quest.chainMultiplier || 1);
    return Math.round(xp);
  }, []);

  const completeQuest=useCallback((questId,rect)=>{
    if(!state) return;
    const quest=state.quests.find(q=>q.id===questId); if(!quest) return;
    const today=getToday();
    const oldStreak=state.streak;
    const newStreak=state.lastActiveDate===today?oldStreak:(oldStreak+1);
    const streakBonusPct=Math.min(newStreak,5)*10;
    const equipBonuses=getEquipBonuses(state.equipment);
    const skillBonuses=getSkillBonuses(null,state.stats);
    const jobBonuses=getJobBonuses(state);
    const formBonus=calcFormationBonus(state.shadowArmy, jobBonuses.allShadowsActive);
    const penaltyActive=state.penaltyZone?.active;
    const xpGain=computeXpGain(quest,streakBonusPct,equipBonuses,skillBonuses,penaltyActive,formBonus,jobBonuses);
    const diff=DIFFICULTIES.find(d=>d.key===quest.difficulty);
    const typeCfg=QUEST_TYPES_CONFIG[quest.type]||QUEST_TYPES_CONFIG.side;
    let goldMult=(1+(equipBonuses.goldBonus||0)+(skillBonuses.goldBonus||0)+(formBonus?.goldBonus||0))*(typeCfg.goldMult||1)*(quest.chainMultiplier||1);
    const goldGain=Math.round(diff.gold*goldMult);
    if(rect) setXpFloats(prev=>[...prev,{id:genId(),x:rect.x-20,y:rect.y,xp:xpGain,gold:goldGain}]);
    setTimeout(()=>setXpFloats(prev=>prev.slice(1)),1400);
    let newXp=state.xp+xpGain,newLevel=state.level,didLevelUp=false;
    const oldRank=getRank(state.level);
    while(newXp>=getXpForLevel(newLevel)&&newLevel<100){newXp-=getXpForLevel(newLevel);newLevel++;didLevelUp=true;}
    // Job XP calculation
    let next = awardJobXp({...state, xp:newXp, level:newLevel, gold:state.gold+goldGain,totalGoldEarned:(state.totalGoldEarned||0)+goldGain}, "quest_complete", {
      category: quest.category,
      difficulty: quest.difficulty
    });
    
    if (next._jobLevelUp) {
      notify(`JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} ist nun Level ${next._jobLevelUp.newLevel}!`, "levelup");
      delete next._jobLevelUp;
    }
    
    // Shadow ARISE for boss quests
    let newShadowArmy={...next.shadowArmy};
    let ariseData=null;
    if(quest.difficulty==="boss"){
      const newShadow=createShadowFromQuest(quest,newLevel);
      newShadowArmy={...newShadowArmy,shadows:[...(newShadowArmy.shadows||[]),newShadow]};
      ariseData=newShadow;
      notify(`${quest.title} wurde zu einem ${SHADOW_CLASSES[newShadow.class].name}!`,"shadow");
    }
    // Penalty update
    let newPenalty={...state.penaltyZone};
    if(newPenalty.active){
      newPenalty.questsCompletedInPenalty=(newPenalty.questsCompletedInPenalty||0)+1;
      const needed=newPenalty.redemptionLeft||3;
      if(newPenalty.questsCompletedInPenalty>=needed){newPenalty.active=false;notify("Strafe abgebüßt. Willkommen zurück, Hunter.","success");}
    }
    // Handle chained quest: on complete, spawn next step or finish chain
    let extraQuests=[];
    if(quest.type==="chained"&&quest.chainStep<quest.chainTotal){
      const nextStep=generateChainedQuest(quest.title,quest.category,quest.difficulty,quest.chainStep+1,quest.chainTotal);
      extraQuests=[nextStep];
      notify(`⛓️ Kette ${quest.chainStep}/${quest.chainTotal} erfüllt! Multiplikator: x${nextStep.chainMultiplier.toFixed(2)}`,"info");
    } else if(quest.type==="chained"&&quest.chainStep>=quest.chainTotal){
      notify("⛓️ QUEST-KETTE ABGESCHLOSSEN! Maximaler Multiplikator erreicht!","gold");
    }
    // Handle hidden quest completion
    let newHiddenQuests={...state.hiddenQuests};
    if(quest.type==="hidden"){
      newHiddenQuests={
        discovered:(newHiddenQuests.discovered||[]).filter(id=>id!==quest.hiddenId),
        completed:[...(newHiddenQuests.completed||[]),quest.hiddenId||quest.id]
      };
      notify("🌟 Verborgene Quest erfüllt! Legendäre Belohnung erhalten!","named");
    }
    const updatedQuests=[
      ...(quest.type==="daily"?state.quests.map(q=>q.id===questId?{...q,completed:true}:q):state.quests.filter(q=>q.id!==questId)),
      ...extraQuests
    ];

    next={...next,
      stats:{...state.stats,[quest.category]:(state.stats[quest.category]||0)+Math.ceil(xpGain/20)},
      quests:updatedQuests,completedQuests:[...(state.completedQuests||[]),{...quest,completedAt:today}],
      streak:newStreak,lastActiveDate:today,shadowArmy:newShadowArmy,
      totalXpEarned:(state.totalXpEarned||0)+xpGain,
      totalQuestsCompleted:(state.totalQuestsCompleted||0)+1,
      penaltyZone:newPenalty,hiddenQuests:newHiddenQuests};
    // Check hidden quest triggers after state update
    const newlyDiscoveredHQ=checkHiddenQuestTriggers(next);
    if(newlyDiscoveredHQ.length>0){
      const newDiscovered=[...(next.hiddenQuests.discovered||[]),...newlyDiscoveredHQ.map(hq=>hq.id)];
      next.hiddenQuests={...next.hiddenQuests,discovered:newDiscovered};
      // Add discovered hidden quests as actual quests
      const hqAsQuests=newlyDiscoveredHQ.map(hq=>({
        id:genId(), hiddenId:hq.id,
        title:hq.title, category:hq.category, difficulty:hq.difficulty,
        type:"hidden", createdAt:today,
        xpMult:hq.reward.xpMult, goldMult:hq.reward.goldMult,
      }));
      next.quests=[...next.quests,...hqAsQuests];
      newlyDiscoveredHQ.forEach(hq=>{
        setTimeout(()=>notify(`❓ ${hq.discoveryMsg}`,"named"),600);
        setTimeout(()=>setShowHiddenQuestModal(hq),1200);
      });
    }
    // Check named shadow unlocks
    const newNameds=checkNamedShadowUnlocks(next);
    if(newNameds.length>0){
      newNameds.forEach(ns=>{
        const namedShadow={
          ...ns, id:genId(), namedId:ns.id,
          level:1, xp:0, xpToNext:calcShadowXpToNext(1),
          stats:{ power:40, speed:35, loyalty:50, presence:30 },
          abilities:[ns.uniqueAbility||{}],
          isDeployed:false, deploymentSlot:null, evolutionStage:1,
          summonsCount:1, dungeonsCleared:0, totalXpGenerated:0,
        };
        next.shadowArmy.shadows=[...next.shadowArmy.shadows,namedShadow];
        notify(`${ns.name} – ${ns.title} – ist erwacht!`,"named");
        setTimeout(()=>setAriseTarget(namedShadow),1000);
      });
    }
    next=processAchievements(next);
    persist(next);
    if(didLevelUp){setPrevRank(oldRank);setLevelUp(newLevel);}
    else if(!ariseData&&quest.type!=="hidden"&&quest.type!=="chained") notify(`+${xpGain} XP · +${goldGain} Gold`,"success");
    if(ariseData&&!newNameds.length) setTimeout(()=>setAriseTarget(ariseData),500);
  },[state,persist,processAchievements,computeXpGain,notify]);

  const deleteQuest=id=>persist({...state,quests:state.quests.filter(q=>q.id!==id)});

  const createQuest=()=>{
    if(!qTitle.trim()) return;
    // Weekly quest gets a timeLimit of next Monday midnight
    let timeLimit=undefined;
    if(qType==="weekly"){
      const d=new Date();
      const daysUntilMonday=(8-d.getDay())%7||7;
      d.setDate(d.getDate()+daysUntilMonday);d.setHours(23,59,59,999);
      timeLimit=d.toISOString();
    }
    const quest={id:genId(),title:qTitle.trim(),difficulty:qDiff,category:qCat,type:qType,createdAt:getToday(),...(timeLimit?{timeLimit}:{})};
    persist({...state,quests:[...state.quests,quest]});
    setQTitle(""); setShowCreate(false);
  };

  const completeEmergencyQuest=useCallback((eq)=>{
    if(!state||state.emergencyDone) return;
    const diff=DIFFICULTIES.find(d=>d.key===eq.difficulty)||DIFFICULTIES[1];
    const xpGain=Math.round(diff.xp*2.5);
    const goldGain=Math.round(diff.gold*2.5);
    let newXp=state.xp+xpGain,newLevel=state.level,didLevelUp=false;
    const oldRank=getRank(state.level);
    const jobBonuses=getJobBonuses(state);
    while(newXp>=getXpForLevel(newLevel)&&newLevel<100){newXp-=getXpForLevel(newLevel);newLevel++;didLevelUp=true;}
    let next={...state,xp:newXp,level:newLevel,gold:state.gold+goldGain,
      totalGoldEarned:(state.totalGoldEarned||0)+goldGain,
      stats:{...state.stats,[eq.category]:(state.stats[eq.category]||0)+3},
      emergencyDone:true,
      totalXpEarned:(state.totalXpEarned||0)+xpGain,
      totalQuestsCompleted:(state.totalQuestsCompleted||0)+1};
    next=processAchievements(next);
    persist(next);
    notify(`🚨 NOTFALL-QUEST ERFÜLLT! +${xpGain} XP · +${goldGain} Gold`,"named");
    if(didLevelUp){setPrevRank(oldRank);setLevelUp(newLevel);}
  },[state,persist,processAchievements,notify]);

  const addChainedQuest=useCallback((title,category,difficulty)=>{
    if(!title.trim()) return;
    const totalSteps=3;
    const firstQuest=generateChainedQuest(title,category,difficulty,1,totalSteps);
    persist({...state,quests:[...state.quests,firstQuest]});
    notify(`⛓️ Quest-Kette gestartet! ${totalSteps} Schritte · Multiplikator steigt mit jedem Erfolg.`,"info");
  },[state,persist,notify]);

  const finishDungeon=useCallback((dungeon,result)=>{
    let newXp=state.xp+result.xp,newLevel=state.level,didLevelUp=false;
    const oldRank=getRank(state.level);
    while(newXp>=getXpForLevel(newLevel)&&newLevel<100){newXp-=getXpForLevel(newLevel);newLevel++;didLevelUp=true;}
    let newInventory=[...(state.equipment?.inventory||[])];
    if(result.drop) newInventory.push(result.drop);
    
    let updatedShadows=(state.shadowArmy?.shadows||[]).map(s=>{
      if(!s.isDeployed) return s;
      let newSXp=s.xp+Math.floor(result.xp*0.1);
      let newSLevel=s.level;
      while(newSXp>=s.xpToNext&&newSLevel<(SHADOW_TIERS[s.tier]?.maxLevel||20)){newSXp-=calcShadowXpToNext(newSLevel);newSLevel++;}
      return{...s,xp:newSXp,level:newSLevel,xpToNext:calcShadowXpToNext(newSLevel),dungeonsCleared:(s.dungeonsCleared||0)+1};
    });
    const newShadowArmy={...state.shadowArmy,shadows:updatedShadows};
    const totalGold=result.gold+(result.goldBonus?Math.round(result.goldBonus*(state.todayModifier?.goldMult||1)):0);

    // Job XP calculation for dungeons
    let next = awardJobXp({...state, gold: state.gold + totalGold, totalGoldEarned: (state.totalGoldEarned || 0) + totalGold}, "dungeon_complete", {
        strategy: result.strategy,
        dungeonRank: dungeon.rank
    });

    if (next._jobLevelUp) {
        notify(`JOB LEVEL UP: ${JOBS[next._jobLevelUp.job].name} Lv.${next._jobLevelUp.newLevel}!`, "levelup");
        delete next._jobLevelUp;
    }

    // Guardian-Passiv: Rewards bei Niederlage
    if (!result.won && getJobBonuses(state).dungeonFailureRewards > 0) {
      const partialXp = Math.floor(result.xp * getJobBonuses(state).dungeonFailureRewards);
      const partialGold = Math.floor(result.gold * getJobBonuses(state).dungeonFailureRewards);
      next.xp += partialXp;
      next.gold += partialGold;
      notify(`Guardian-Passiv: +${partialXp} XP, +${partialGold} Gold trotz Niederlage`, "success");
    }

    next = {
      ...next,
      xp: next.xp + result.xp,
      dungeons:state.dungeons.map(d=>d.instanceId===dungeon.instanceId?{...d,cleared:true}:d),
      dungeonHistory:[...(state.dungeonHistory||[]),{dungeonId:dungeon.id,dungeonName:dungeon.name,dungeonRank:dungeon.rank,won:result.won,xp:result.xp,gold:totalGold,floorsCleared:result.floorsCleared||dungeon.floors,date:getToday()}],
      totalXpEarned:(state.totalXpEarned||0)+result.xp,
      equipment:{...state.equipment,inventory:newInventory},
      shadowArmy:newShadowArmy};

    // Check named shadow unlocks after dungeon
    const newNameds=checkNamedShadowUnlocks(next);
    if(newNameds.length>0){
      newNameds.forEach(ns=>{
        const namedShadow={
          ...ns, id:genId(), namedId:ns.id,
          level:1, xp:0, xpToNext:calcShadowXpToNext(1),
          stats:{ power:40, speed:35, loyalty:50, presence:30 },
          abilities:[ns.uniqueAbility||{}],
          isDeployed:false, deploymentSlot:null, evolutionStage:1,
          summonsCount:1, dungeonsCleared:0, totalXpGenerated:0,
        };
        next.shadowArmy.shadows=[...next.shadowArmy.shadows,namedShadow];
        notify(`${ns.name} – ${ns.title} – ist erwacht!`,"named");
        setTimeout(()=>setAriseTarget(namedShadow),800);
      });
    }
    next=processAchievements(next);
    persist(next); setActiveDungeon(null);
    if(didLevelUp){setPrevRank(oldRank);setLevelUp(newLevel);}
    else if (result.won) notify(`${dungeon.name} bezwungen! +${result.xp} XP · ${result.floorsCleared||"?"}/${dungeon.floors} Floors`, "dungeon");
    else notify(`Niederlage in ${dungeon.name}.`, "defeat");
  },[state,persist,processAchievements,notify]);

  const deployShadow=useCallback((shadowId,slot)=>{
    const slotData=FORMATION_SLOTS[slot];
    const currentInSlot=(state.shadowArmy?.shadows||[]).filter(s=>s.isDeployed&&s.deploymentSlot===slot).length;
    if(currentInSlot>=slotData.maxSlots){notify(`${slotData.name} ist voll! (Max ${slotData.maxSlots})`, "info"); return;}
    const newShadows=(state.shadowArmy.shadows||[]).map(s=>s.id===shadowId?{...s,isDeployed:true,deploymentSlot:slot}:s);
    persist({...state,shadowArmy:{...state.shadowArmy,shadows:newShadows}});
    notify(`Shadow in ${slotData.name} positioniert!`,"shadow");
  },[state,persist,notify]);

  const undeployShadow=useCallback((shadowId)=>{
    const newShadows=(state.shadowArmy.shadows||[]).map(s=>s.id===shadowId?{...s,isDeployed:false,deploymentSlot:null}:s);
    persist({...state,shadowArmy:{...state.shadowArmy,shadows:newShadows}});
    notify("Shadow zurückgerufen.","info");
  },[state,persist,notify]);

  const evolveShadow=useCallback((shadowId)=>{
    const shadow=(state.shadowArmy?.shadows||[]).find(s=>s.id===shadowId);
    if(!shadow) return;
    const nextTier=SHADOW_TIERS[shadow.tier+1];
    if(!nextTier||state.gold<nextTier.evolutionCost) return;
    const newStats={
      power:  Math.round(shadow.stats.power  *nextTier.statMult/SHADOW_TIERS[shadow.tier].statMult),
      speed:  Math.round(shadow.stats.speed  *nextTier.statMult/SHADOW_TIERS[shadow.tier].statMult),
      loyalty:Math.round(shadow.stats.loyalty*nextTier.statMult/SHADOW_TIERS[shadow.tier].statMult),
      presence:Math.round(shadow.stats.presence*nextTier.statMult/SHADOW_TIERS[shadow.tier].statMult),
    };
    const newShadows=(state.shadowArmy.shadows||[]).map(s=>s.id===shadowId?{...s,tier:s.tier+1,stats:newStats,glowColor:nextTier.color}:s);
    let next={...state,gold:state.gold-nextTier.evolutionCost,shadowArmy:{...state.shadowArmy,shadows:newShadows}};
    next=processAchievements(next);
    persist(next);
    notify(`${shadow.name} zu Tier ${shadow.tier+1} (${nextTier.name}) entwickelt!`,"shadow");
    setSelectedShadow(null);
  },[state,persist,processAchievements,notify]);

  const buyItem=item=>{
    const jobBonuses = getJobBonuses(state);
    const discount = jobBonuses.shopDiscount || 0;
    const finalCost = Math.max(1, Math.floor(item.cost * (1 - discount / 100)));

    if(state.gold < finalCost || state.shopPurchases.includes(item.id)) return;
    if(getRankIndex(getRank(state.level).name)<getRankIndex(item.minRank)) return;
    let next={...state,gold:state.gold-finalCost,shopPurchases:[...state.shopPurchases,item.id],
      ...(item.type==="theme"?{selectedTheme:item.themeKey}:{}),
      ...(item.type==="title"?{selectedTitle:item.name}:{})};
    next=processAchievements(next);
    persist(next); notify(`${item.name} erworben!`,"gold");
  };

  const equipItem=(item,slot)=>{const newSlots={...state.equipment.slots,[slot]:item};let next={...state,equipment:{...state.equipment,slots:newSlots}};next=processAchievements(next);persist(next);notify(`${item.name} ausgerüstet!`,"info");};
  const unequipItem=slot=>persist({...state,equipment:{...state.equipment,slots:{...state.equipment.slots,[slot]:null}}});

  const switchJob = useCallback((jobKey) => {
    const jobDef = JOBS[jobKey];
    if (!jobDef) return;
    
    const req = jobDef.unlockRequirement;
    if (state.level < req.level) {
      notify(`Mindestlevel ${req.level} erforderlich für ${jobDef.name}.`, "info");
      return;
    }
    
    if (req.allJobsLevel5 && !checkAllJobsLevel5(state)) {
      notify("Alle anderen Jobs müssen Level 5 sein.", "info");
      return;
    }
    
    if (req.minShadows && (state.shadowArmy?.shadows?.length || 0) < req.minShadows) {
      notify(`Mindestens ${req.minShadows} Shadows erforderlich.`, "info");
      return;
    }
    
    persist({ ...state, jobs: { ...state.jobs, current: jobKey } });
    notify(`Job gewechselt zu: ${jobDef.name}`, "success");
  }, [state, persist, notify]);

  const activateJobAbility = useCallback((jobKey) => {
    const jobDef = JOBS[jobKey];
    if (!jobDef || state.jobs?.current !== jobKey) return;
    
    const ability = jobDef.activeAbility;
    const level = state.jobs.levels[jobKey] || 0;
    
    if (level < ability.unlockLevel) {
      notify(`${jobDef.name} Level ${ability.unlockLevel} benötigt.`, "info");
      return;
    }
    
    const now = Date.now();
    const cooldowns = { ...state.jobs.activeAbilityCooldowns };
    const lastUsed = cooldowns[ability.key] || 0;
    
    if (now < lastUsed + (ability.cooldown * 1000)) {
      const remaining = Math.ceil((lastUsed + (ability.cooldown * 1000) - now) / 1000);
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      notify(`Cooldown: ${h}h ${m}m`, "info");
      return;
    }
    
    if (ability.key === "shadow_step") {
      const today = getToday();
      const usesToday = cooldowns.shadow_step_uses?.[today] || 0;
      if (usesToday >= (ability.maxUsesPerDay || 3)) {
        notify("Shadow Step heute bereits 3x benutzt.", "info");
        return;
      }
      cooldowns.shadow_step_uses = { ...cooldowns.shadow_step_uses, [today]: usesToday + 1 };
    }
    
    cooldowns[ability.key] = now;
    persist({
      ...state,
      jobs: { ...state.jobs, activeAbilityCooldowns: cooldowns },
      _abilityActivated: { ability, job: jobDef }
    });
    
    notify(`${ability.name} AKTIVIERT!`, "levelup");
  }, [state, persist, notify]);

  const finishSetup=name=>{
    const s={...DEFAULT_STATE,hunterName:name||"Hunter",lastActiveDate:getToday(),dungeons:generateDungeons("E"),lastDungeonRefresh:getToday(),achievements:{unlocked:[],notified:[]},skills:{unlocked:[]},equipment:{slots:{weapon:null,armor:null,ring1:null,ring2:null},inventory:[]},penaltyZone:{active:false,redemptionLeft:0,questsCompletedInPenalty:0},todayModifier:getDailyModifier(),emergencyQuest:generateEmergencyQuest(1),emergencyDone:false,emergencyFailed:false,hiddenQuests:{discovered:[],completed:[]},
      jobs: {
        current: null,
        levels: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
        xp: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 },
        activeAbilityCooldowns: {}
      }};
    persist(s); setShowSetup(false);
  };

  if(loading) return <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#080810"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,animation:"float 2s ease-in-out infinite"}}>⚔️</div><div style={{marginTop:12,fontSize:12,letterSpacing:4,color:"#4f6ef7",fontFamily:"'JetBrains Mono',monospace"}}>LOADING</div></div></div>;
  if(showSetup) return <SetupScreen onFinish={finishSetup} theme={theme}/>;

  const rank=getRank(state.level);
  const xpNeeded=getXpForLevel(state.level);
  const xpPercent=Math.min((state.xp/xpNeeded)*100,100);
  const streakBonus=Math.min(state.streak,5)*10;
  const shopUnlocked=getRankIndex(rank.name)>=getRankIndex("D");
  const activeDungeons=(state.dungeons||[]).filter(d=>!d.cleared&&new Date(d.expiresAt)>new Date());
  const filteredQuests=(state.quests||[]).filter(q=>{
    if(q.completed) return false;
    if(questFilter==="daily") return q.type==="daily";
    if(questFilter==="side") return q.type==="side";
    if(questFilter==="weekly") return q.type==="weekly";
    if(questFilter==="chained") return q.type==="chained";
    if(questFilter==="hidden") return q.type==="hidden";
    return true; // "all"
  });
  const hiddenQuestCount=(state.quests||[]).filter(q=>q.type==="hidden"&&!q.completed).length;
  const equipBonuses=getEquipBonuses(state.equipment);
  const unlockedSkills=checkSkillUnlocks(state.stats);
  const powerLevel=calcPowerLevel(state.stats,state.level);
  const achUnlocked=state.achievements?.unlocked||[];
  const penaltyActive=state.penaltyZone?.active;
  const shadowArmy=state.shadowArmy||{shadows:[],capacity:20};
  const jobBonuses=getJobBonuses(state);
  const formationBonus=calcFormationBonus(shadowArmy, jobBonuses.allShadowsActive);
  const namedShadows=shadowArmy.shadows.filter(s=>s.isNamed);
  const totalShadows=shadowArmy.shadows.length;

  return (
    <div style={{minHeight:"100vh",background:penaltyActive?`linear-gradient(180deg,${theme.bg},rgba(20,4,4,0.95))`:theme.bg,color:"#e2e8f0",fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{CSS(theme)}</style>
      <ParticleField theme={theme}/>
      {penaltyActive&&<div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",border:"2px solid #ef444422",animation:"penaltyPulse 2s infinite"}}/>}
      {notifications.map(n=><SystemNotification key={n.id} message={n.msg} type={n.type} onDone={()=>removeNotif(n.id)}/>)}
      {achQueue.slice(0,1).map(a=><AchievementToast key={a.id} achievement={a} onDone={()=>setAchQueue(prev=>prev.slice(1))}/>)}
      {xpFloats.map(f=><XpFloat key={f.id} x={f.x} y={f.y} xp={f.xp} gold={f.gold}/>)}
      {levelUp&&<LevelUpCinematic level={levelUp} rank={getRank(levelUp)} oldRank={prevRank} onClose={()=>setLevelUp(null)}/>}
      {ariseTarget&&<AriseCinematic shadow={ariseTarget} onClose={()=>setAriseTarget(null)}/>}
      {state._jobLevelUp && <JobLevelUpCinematic job={JOBS[state._jobLevelUp.job]} newLevel={state._jobLevelUp.newLevel} onClose={() => { const next = {...state}; delete next._jobLevelUp; persist(next); }} />}
      {state._abilityActivated && <AbilityActivationCinematic ability={state._abilityActivated.ability} job={state._abilityActivated.job} onClose={() => { const next = {...state}; delete next._abilityActivated; persist(next); }} />}
      {activeDungeon&&<DungeonBattle dungeon={activeDungeon} playerStats={state.stats} theme={theme} onResult={r=>finishDungeon(activeDungeon,r)} onClose={()=>setActiveDungeon(null)} skillBonuses={getSkillBonuses(null,state.stats)} modifier={modifier} formationBonus={formationBonus}/>}
      {selectedShadow&&<ShadowDetailModal shadow={selectedShadow} theme={theme} gold={state.gold} onClose={()=>setSelectedShadow(null)} onDeploy={deployShadow} onUndeploy={undeployShadow} onEvolve={evolveShadow}/>}

      {/* HIDDEN QUEST DISCOVERY MODAL */}
      {showHiddenQuestModal&&(
        <div onClick={()=>setShowHiddenQuestModal(null)} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(1,0,6,0.96)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.4s",cursor:"pointer"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:56,marginBottom:12,animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 0 20px #6366f1)"}}>❓</div>
              <div style={{fontSize:9,letterSpacing:5,color:"#6366f1",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>VERBORGENE QUEST ENTHÜLLT</div>
              <h2 style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",marginBottom:6,textShadow:"0 0 30px #6366f188"}}>{showHiddenQuestModal.title}</h2>
              <p style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{showHiddenQuestModal.discoveryMsg}</p>
            </div>
            <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid #6366f133",borderRadius:14,padding:"16px 20px",marginBottom:16}}>
              <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:10}}>BELOHNUNG</div>
              <div style={{display:"flex",gap:16,justifyContent:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>XP MULT</div><div style={{fontSize:22,fontWeight:900,color:"#a78bfa",fontFamily:"'Cinzel',serif"}}>x{showHiddenQuestModal.reward?.xpMult||3}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>GOLD MULT</div><div style={{fontSize:22,fontWeight:900,color:"#fbbf24",fontFamily:"'Cinzel',serif"}}>x{showHiddenQuestModal.reward?.goldMult||2}</div></div>
              </div>
            </div>
            <button onClick={()=>setShowHiddenQuestModal(null)} style={{width:"100%",padding:14,borderRadius:12,fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#6366f122,#6366f110)",color:"#a5b4fc",border:"1px solid #6366f144",fontFamily:"'Cinzel',serif",letterSpacing:2}}>QUEST ANNEHMEN</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:50,padding:"10px 16px",background:`linear-gradient(180deg,${theme.bg}ee,${theme.bg}dd)`,borderBottom:`1px solid ${penaltyActive?"#ef444422":theme.primary+"15"}`,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${rank.color}22,${rank.color}08)`,border:`1.5px solid ${rank.color}66`,position:"relative",overflow:"hidden",animation:"shadowPulse 3s infinite"}}>
              <span style={{fontSize:16,fontWeight:900,color:rank.color,fontFamily:"'Cinzel',serif",position:"relative",zIndex:1}}>{rank.name}</span>
              <div style={{position:"absolute",top:0,left:"-100%",width:"50%",height:"100%",background:`linear-gradient(90deg,transparent,${rank.color}22,transparent)`,animation:"rankShine 3s ease-in-out infinite"}}/>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:15,fontWeight:700,color:penaltyActive?"#ef4444":"#fff",fontFamily:"'Outfit',sans-serif"}}>{state.hunterName}</div>
                {penaltyActive&&<div style={{fontSize:9,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,padding:"1px 5px",borderRadius:3,background:"#ef444415",border:"1px solid #ef444433"}}>PENALTY</div>}
              </div>
              <div style={{fontSize:10,color:rank.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5}}>{state.selectedTitle||rank.label}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:"#475569",letterSpacing:1,marginBottom:1}}>PWR</div>
              <div style={{fontWeight:700,color:theme.accent}}>{powerLevel.toLocaleString()}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,color:"#fbbf24"}}>
              <span>💰</span><span style={{fontWeight:600}}>{state.gold.toLocaleString()}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,color:state.streak>=5?"#f97316":state.streak>=3?"#fb923c":"#94a3b8"}}>
              <span style={{animation:state.streak>=3?"pulse 1.5s infinite":"none"}}>🔥</span>
              <span style={{fontWeight:600}}>{state.streak}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{position:"relative",zIndex:1,padding:"16px",maxWidth:480,margin:"0 auto",paddingBottom:92}}>

        {/* PENALTY BANNER */}
        {penaltyActive&&(
          <div style={{background:"rgba(20,4,4,0.9)",border:"1px solid #ef444433",borderLeft:"3px solid #ef4444",borderRadius:14,padding:"14px 16px",marginBottom:14,backdropFilter:"blur(8px)",animation:"glitch 4s ease-in-out infinite"}}>
            <div style={{fontSize:9,letterSpacing:3,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>⚠ PENALTY ZONE AKTIV</div>
            <div style={{fontSize:12,color:"#fca5a5",fontWeight:500}}>Das System bestraft Inaktivität. Schließe {Math.max(0,(state.penaltyZone?.redemptionLeft||3)-(state.penaltyZone?.questsCompletedInPenalty||0))} weitere Quests ab.</div>
            <div style={{fontSize:10,color:"#ef4444",marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>-20% XP aus allen Quests</div>
          </div>
        )}
        {/* MODIFIER BANNER */}
        {modifier&&modifier.id!=="none"&&(
          <div style={{background:`linear-gradient(135deg,${modifier.color}10,transparent)`,border:`1px solid ${modifier.color}25`,borderLeft:`3px solid ${modifier.color}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{modifier.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:modifier.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>{modifier.name.toUpperCase()}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{modifier.desc}</div>
            </div>
            <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}>RESET IN {hoursUntilMidnight()}h</div>
          </div>
        )}

        {/* ═══ DASHBOARD ═══ */}
        {view==="dashboard"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{background:theme.card,border:`1px solid ${theme.primary}18`,borderRadius:18,padding:"22px 20px 18px",marginBottom:14,position:"relative",overflow:"hidden",backdropFilter:"blur(12px)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div>
                  <div style={{fontSize:10,color:"#64748b",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>LEVEL</div>
                  <div style={{fontSize:48,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",lineHeight:1}}>{state.level}</div>
                  {streakBonus>0&&<div style={{fontSize:10,color:"#f59e0b",marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>🔥 +{streakBonus}% XP</div>}
                  {formationBonus.dungeonBonus>0&&<div style={{fontSize:10,color:"#a78bfa",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>🌑 +{formationBonus.dungeonBonus}% Dungeon</div>}
                </div>
                <StatRadar stats={state.stats} theme={theme} size={100}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748b",marginBottom:5,fontFamily:"'JetBrains Mono',monospace"}}>
                <span>EXP</span><span>{state.xp.toLocaleString()} / {xpNeeded.toLocaleString()}</span>
              </div>
              <div style={{height:8,background:"#0f0f1e",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${xpPercent}%`,height:"100%",borderRadius:4,background:`linear-gradient(90deg,${theme.primary},${theme.accent})`,boxShadow:`0 0 12px ${theme.glow}`,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)"}}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:16}}>
              {CATEGORIES.map((cat,i)=>(
                <div key={cat.key} style={{background:theme.card,border:`1px solid ${cat.color}15`,borderRadius:12,padding:"10px 4px",textAlign:"center",backdropFilter:"blur(8px)",animation:`slideUp 0.3s ease ${i*0.05}s both`,transition:"border-color 0.3s,transform 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color+"44";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cat.color+"15";e.currentTarget.style.transform="none";}}>
                  <div style={{fontSize:16}}>{cat.icon}</div>
                  <div style={{fontSize:9,color:cat.color,marginTop:3,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1}}>{cat.stat}</div>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",fontFamily:"'Cinzel',serif",marginTop:1}}>{(state.stats[cat.key]||0)+(equipBonuses[cat.key+"Bonus"]||0)}</div>
                </div>
              ))}
            </div>

            {/* ── EMERGENCY QUEST ── */}
            {state.emergencyQuest&&(
              <EmergencyQuestCard
                quest={state.emergencyQuest}
                done={state.emergencyDone}
                failed={state.emergencyFailed}
                onComplete={completeEmergencyQuest}
                theme={theme}
              />
            )}

            {/* ── QUEST FILTERS + ADD ── */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:6}}>
              <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2,flex:1}}>
                {[
                  {key:"all",label:"Alle",color:theme.accent},
                  {key:"daily",label:"Daily",color:"#22d3ee"},
                  {key:"side",label:"Side",color:"#a78bfa"},
                  {key:"weekly",label:"Weekly",color:"#8b5cf6"},
                  {key:"chained",label:"Kette",color:"#f59e0b"},
                  ...(hiddenQuestCount>0?[{key:"hidden",label:`❓ ${hiddenQuestCount}`,color:"#6366f1"}]:[]),
                ].map(f=>(
                  <button key={f.key} onClick={()=>setQuestFilter(f.key)} style={{
                    padding:"5px 10px",borderRadius:8,fontSize:10,fontWeight:600,flexShrink:0,
                    background:questFilter===f.key?f.color+"22":"transparent",
                    color:questFilter===f.key?f.color:"#475569",
                    border:`1px solid ${questFilter===f.key?f.color+"44":"transparent"}`,
                    transition:"all 0.25s",fontFamily:"'JetBrains Mono',monospace"
                  }}>{f.label}</button>
                ))}
              </div>
              <button onClick={()=>setShowCreate(true)} style={{padding:"7px 14px",borderRadius:10,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${theme.primary}22,${theme.primary}10)`,color:theme.accent,border:`1px solid ${theme.primary}44`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>+ QUEST</button>
            </div>

            {filteredQuests.length===0?(
              <div style={{textAlign:"center",padding:"40px 20px",background:theme.card,borderRadius:14,border:`1px dashed ${theme.primary}15`,backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:36,marginBottom:10,animation:"float 3s ease-in-out infinite"}}>⚔️</div>
                <div style={{fontSize:14,color:"#475569",marginBottom:6}}>Keine aktiven Quests</div>
                <div style={{fontSize:11,color:"#334155"}}>Erstelle eine Quest um XP zu verdienen</div>
              </div>
            ):filteredQuests.map((q,i)=><QuestCard key={q.id} quest={q} index={i} theme={theme} onComplete={completeQuest} onDelete={deleteQuest}/>)}
          </div>
        )}

        {/* ═══ DUNGEONS ═══ */}
        {view==="dungeon"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>DUNGEON GATES</div>
              <div style={{fontSize:12,color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}>Reset in {hoursUntilMidnight()}h · {modifier?.id!=="none"?`${modifier?.icon} ${modifier?.name}` : "Stable Gates"}</div>
            </div>
            {activeDungeons.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:theme.card,borderRadius:14,border:`1px dashed ${theme.primary}15`,backdropFilter:"blur(8px)"}}><div style={{fontSize:36,marginBottom:10}}>🌀</div><div style={{fontSize:14,color:"#475569"}}>Keine aktiven Gates</div><div style={{fontSize:11,color:"#334155",marginTop:4}}>Kommen morgen wieder zurück</div></div>}
            {activeDungeons.map((d,i)=><div key={d.instanceId} style={{marginBottom:10,animation:`slideUp 0.35s ease ${i*0.1}s both`}}><DungeonGate dungeon={d} playerStats={{...state.stats,...Object.fromEntries(CATEGORIES.map(c=>[c.key,(state.stats[c.key]||0)+(equipBonuses[c.key+"Bonus"]||0)]))}} theme={theme} onEnter={setActiveDungeon} modifier={modifier}/></div>)}
            {(state.dungeons||[]).filter(d=>d.cleared).length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>HEUTE ABSOLVIERT</div>
                {(state.dungeons||[]).filter(d=>d.cleared).map((d,i)=><div key={d.instanceId} style={{marginBottom:8,opacity:0.4}}><DungeonGate dungeon={d} playerStats={state.stats} theme={theme} onEnter={()=>{}} modifier={modifier}/></div>)}
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS ═══ */}
        {view==="stats"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{background:theme.card,border:`1px solid ${theme.primary}18`,borderRadius:18,padding:"20px",marginBottom:16,display:"flex",flexDirection:"column",alignItems:"center",backdropFilter:"blur(12px)"}}>
              <StatRadar stats={state.stats} theme={theme} size={200}/>
              <div style={{display:"flex",gap:0,flexWrap:"wrap",justifyContent:"center",marginTop:4,width:"100%",background:"rgba(0,0,0,0.2)",borderRadius:12,overflow:"hidden"}}>
                {[{label:"TOTAL XP",value:(state.totalXpEarned||0).toLocaleString(),color:theme.accent},{label:"QUESTS",value:state.totalQuestsCompleted||0,color:theme.accent},{label:"STREAK",value:`${state.streak}d`,color:"#f59e0b"},{label:"PWR LVL",value:powerLevel,color:"#e879f9"},{label:"CLEARED",value:(state.dungeonHistory||[]).filter(d=>d.won).length,color:"#22d3ee"}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center",padding:"8px 10px",flex:"1 0 33%"}}>
                    <div style={{fontSize:8,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:3,letterSpacing:1}}>{s.label}</div>
                    <div style={{fontSize:15,fontWeight:800,color:s.color,fontFamily:"'Cinzel',serif"}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {CATEGORIES.map((cat,i)=>{const val=(state.stats[cat.key]||0)+(equipBonuses[cat.key+"Bonus"]||0);const base=state.stats[cat.key]||0;const maxD=Math.max(val,50);return(
              <div key={cat.key} style={{background:theme.card,border:`1px solid ${cat.color}12`,borderRadius:14,padding:"14px 16px",marginBottom:8,backdropFilter:"blur(8px)",animation:`cardEnter 0.4s ease ${i*0.06}s both`,transition:"border-color 0.3s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=cat.color+"33"} onMouseLeave={e=>e.currentTarget.style.borderColor=cat.color+"12"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>{cat.icon}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{cat.label}</div>
                      <div style={{fontSize:10,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>{cat.full}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:28,fontWeight:900,color:cat.color,fontFamily:"'Cinzel',serif"}}>{val}</div>
                    {equipBonuses[cat.key+"Bonus"]>0&&<div style={{fontSize:9,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>({base}+{equipBonuses[cat.key+"Bonus"]})</div>}
                  </div>
                </div>
                <div style={{height:5,background:"#0f0f1e",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${Math.min((val/maxD)*100,100)}%`,height:"100%",borderRadius:3,background:`linear-gradient(90deg,${cat.color}aa,${cat.color})`,boxShadow:`0 0 8px ${cat.color}44`,animation:"statBarFill 1s ease-out"}}/>
                </div>
              </div>
            );})}
            {unlockedSkills.length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>UNLOCKED SKILLS ({unlockedSkills.length})</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {unlockedSkills.map((sk,i)=>{const cat=CATEGORIES.find(c=>c.key===sk.stat);return(
                    <div key={sk.id} style={{background:theme.card,border:`1px solid ${cat.color}22`,borderRadius:12,padding:"12px",animation:`scaleIn 0.4s ease ${i*0.07}s both`}}>
                      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <span style={{fontSize:20}}>{sk.icon}</span>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:cat.color,fontFamily:"'Cinzel',serif"}}>{sk.name}</div>
                          <div style={{fontSize:10,color:"#475569",marginTop:2,lineHeight:1.4}}>{sk.desc}</div>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SHADOW ARMY ═══ */}
        {view==="shadows"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            {/* Header card */}
            <div style={{background:`linear-gradient(135deg,rgba(8,6,20,0.95),rgba(12,8,28,0.9))`,border:`1px solid #7c3aed33`,borderRadius:18,padding:"18px 20px",marginBottom:16,backdropFilter:"blur(12px)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:120,height:120,background:"radial-gradient(circle at 100% 0%,#7c3aed15,transparent)",borderRadius:"0 18px 0 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:4,color:"#7c3aed",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>SHADOW ARMY</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",lineHeight:1}}>{totalShadows}<span style={{fontSize:14,color:"#475569",fontWeight:400,marginLeft:4}}>/{shadowArmy.capacity}</span></div>
                  {namedShadows.length>0&&<div style={{fontSize:10,color:"#f59e0b",marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>★ {namedShadows.length} Named Shadow{namedShadows.length>1?"s":""}</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                  {[{label:"Deployed",value:shadowArmy.shadows.filter(s=>s.isDeployed).length,color:"#22c55e"},{label:"Dungeon",value:`+${formationBonus.dungeonBonus}%`,color:"#ef4444"},{label:"XP Bonus",value:`+${Math.round(formationBonus.xpBonus*100)}%`,color:"#a78bfa"}].map(({label,value,color})=>(
                    <div key={label} style={{padding:"6px 8px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:"1px solid rgba(255,255,255,0.05)"}}>
                      <div style={{fontSize:14,fontWeight:800,color,fontFamily:"'Cinzel',serif"}}>{value}</div>
                      <div style={{fontSize:8,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Capacity bar */}
              <div style={{height:4,background:"#0a0a14",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(totalShadows/shadowArmy.capacity)*100}%`,height:"100%",borderRadius:2,background:"linear-gradient(90deg,#7c3aed88,#a78bfa)",transition:"width 0.6s ease"}}/>
              </div>
              {/* Sub nav */}
              <div style={{display:"flex",gap:6,marginTop:14}}>
                {[{key:"army",label:"Armee",icon:"🌑"},{key:"formation",label:"Formation",icon:"⚔️"},{key:"named",label:"Named",icon:"★"}].map(sv=>(
                  <button key={sv.key} onClick={()=>setShadowSubView(sv.key)} style={{flex:1,padding:"7px 4px",borderRadius:9,fontSize:10,fontWeight:700,background:shadowSubView===sv.key?"#7c3aed22":"transparent",color:shadowSubView===sv.key?"#a78bfa":"#475569",border:`1px solid ${shadowSubView===sv.key?"#7c3aed44":"#1e2940"}`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s"}}>
                    <span>{sv.icon}</span><span>{sv.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ARMY sub-view */}
            {shadowSubView==="army"&&(
              totalShadows===0?(
                <div style={{textAlign:"center",padding:"48px 24px",background:theme.card,borderRadius:16,border:"1px dashed #7c3aed22",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:52,marginBottom:12,opacity:0.3,animation:"float 3s ease-in-out infinite"}}>🌑</div>
                  <div style={{fontSize:15,color:"#475569",fontFamily:"'Cinzel',serif",marginBottom:8}}>Keine Schatten erweckt</div>
                  <div style={{fontSize:12,color:"#334155",lineHeight:1.6}}>Schließe <span style={{color:"#ef4444"}}>Boss-Quests</span> ab um Schatten zu beschwören</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {shadowArmy.shadows.map((s,i)=><ShadowCard key={s.id} shadow={s} theme={theme} index={i} onClick={()=>setSelectedShadow(s)}/>)}
                </div>
              )
            )}

            {/* FORMATION sub-view */}
            {shadowSubView==="formation"&&(
              <FormationEditor shadowArmy={shadowArmy} theme={theme} onDeploy={deployShadow} onUndeploy={undeployShadow} formationBonus={formationBonus}/>
            )}

            {/* NAMED sub-view */}
            {shadowSubView==="named"&&(
              <div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:14}}>NAMED SHADOWS – FREISCHALTBAR</div>
                {Object.values(NAMED_SHADOWS).map((ns,i)=>{
                  const isOwned=shadowArmy.shadows.some(s=>s.namedId===ns.id||s.id===ns.id);
                  const cls=SHADOW_CLASSES[ns.class]||SHADOW_CLASSES.soldier;
                  const tierData=SHADOW_TIERS[ns.tier]||SHADOW_TIERS[4];
                  return(
                    <div key={ns.id} style={{background:isOwned?"rgba(8,8,20,0.9)":theme.card,border:`1px solid ${isOwned?ns.glowColor+"44":"#1e2940"}`,borderRadius:16,padding:"16px",marginBottom:10,opacity:isOwned?1:0.65,animation:`cardEnter 0.4s ease ${i*0.08}s both`,boxShadow:isOwned?`0 0 16px ${ns.glowColor}18`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <div style={{width:52,height:52,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:isOwned?ns.glowColor+"18":"rgba(255,255,255,0.03)",border:`2px solid ${isOwned?ns.glowColor+"66":"#1e2940"}`,fontSize:28}}>
                          {isOwned?ns.icon:<span style={{opacity:0.2}}>?</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:800,color:isOwned?ns.glowColor:"#475569",fontFamily:"'Cinzel',serif"}}>{isOwned?ns.name:"???"}</div>
                          <div style={{fontSize:10,color:isOwned?ns.glowColor+"99":"#334155",fontFamily:"'Cinzel',serif",letterSpacing:1,marginTop:2}}>{isOwned?ns.title:"Unbekannt"}</div>
                          <div style={{display:"flex",gap:5,marginTop:4}}>
                            <span style={{fontSize:9,color:cls.color,fontFamily:"'JetBrains Mono',monospace",padding:"1px 5px",borderRadius:4,background:cls.color+"15"}}>{cls.icon} {ns.class.toUpperCase()}</span>
                            <span style={{fontSize:9,color:tierData.color,fontFamily:"'JetBrains Mono',monospace",padding:"1px 5px",borderRadius:4,background:tierData.color+"15"}}>TIER {ns.tier}</span>
                          </div>
                        </div>
                        {isOwned&&<div style={{fontSize:9,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace",padding:"3px 8px",borderRadius:6,background:"#22c55e12",border:"1px solid #22c55e33"}}>OWNED</div>}
                      </div>
                      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                        <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:4}}>FREISCHALTBEDINGUNG</div>
                        <div style={{fontSize:11,color:isOwned?"#22c55e":"#94a3b8",display:"flex",alignItems:"center",gap:6}}>
                          {isOwned?<span>✓</span>:<span style={{opacity:0.5}}>○</span>}
                          {ns.unlockCondition.desc}
                        </div>
                      </div>
                      {isOwned&&ns.uniqueAbility&&(
                        <div style={{background:`${ns.glowColor}0a`,border:`1px solid ${ns.glowColor}22`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                          <div style={{fontSize:9,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:4}}>UNIQUE ABILITY</div>
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <span style={{fontSize:18}}>{ns.uniqueAbility.icon}</span>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:ns.glowColor,fontFamily:"'Cinzel',serif"}}>{ns.uniqueAbility.name}</div>
                              <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{ns.uniqueAbility.effect}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {isOwned&&<div style={{fontStyle:"italic",fontSize:11,color:"#475569",lineHeight:1.6,borderLeft:`2px solid ${ns.glowColor}33`,paddingLeft:10}}>"{ns.lore}"</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ JOBS ═══ */}
        {view === "jobs" && state && (
          <JobsView 
            state={state} 
            onSwitch={switchJob} 
            onActivate={activateJobAbility} 
            theme={theme} 
          />
        )}

        {/* ═══ EQUIPMENT ═══ */}
        {view==="equipment"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{background:theme.card,border:`1px solid ${theme.primary}18`,borderRadius:18,padding:"18px",marginBottom:16,backdropFilter:"blur(12px)"}}>
              <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:14}}>AUSGERÜSTET</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{slot:"weapon",label:"WAFFE",icon:"🗡️"},{slot:"armor",label:"RÜSTUNG",icon:"🛡️"},{slot:"ring1",label:"RING 1",icon:"💍"},{slot:"ring2",label:"RING 2",icon:"💍"}].map(({slot,label,icon})=>{
                  const equipped=state.equipment?.slots?.[slot];
                  return(
                    <div key={slot} style={{background:equipped?`linear-gradient(135deg,${RARITY_COLORS[equipped.rarity]}10,transparent)`:theme.surface,border:`1px solid ${equipped?RARITY_COLORS[equipped.rarity]+"33":theme.primary+"12"}`,borderRadius:12,padding:"12px",minHeight:90}}>
                      <div style={{fontSize:8,letterSpacing:2,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>{label}</div>
                      {equipped?(
                        <div>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{fontSize:22}}>{equipped.icon}</span><div><div style={{fontSize:12,fontWeight:700,color:RARITY_COLORS[equipped.rarity],fontFamily:"'Cinzel',serif"}}>{equipped.name}</div><div style={{fontSize:9,color:"#475569",marginTop:1}}>{equipped.desc}</div></div></div>
                          <button onClick={()=>unequipItem(slot)} style={{fontSize:9,padding:"3px 8px",borderRadius:6,background:"transparent",color:"#475569",border:"1px solid #1e2940",fontFamily:"'JetBrains Mono',monospace"}}>ABLEGEN</button>
                        </div>
                      ):(
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:50,opacity:0.2}}>
                          <span style={{fontSize:28}}>{icon}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.values(state.equipment?.slots||{}).some(v=>v)&&(
                <div style={{marginTop:14,padding:"10px 12px",background:theme.surface,borderRadius:10,fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"#64748b"}}>
                  <div style={{marginBottom:4,color:theme.accent,fontWeight:700}}>AKTIVE BONI</div>
                  {equipBonuses.xpBonus>0&&<div>+{Math.round(equipBonuses.xpBonus*100)}% XP</div>}
                  {equipBonuses.goldBonus>0&&<div>+{Math.round(equipBonuses.goldBonus*100)}% Gold</div>}
                  {equipBonuses.dungeonBonus>0&&<div>+{equipBonuses.dungeonBonus}% Dungeon Erfolg</div>}
                  {equipBonuses.streakShield>0&&<div>+{equipBonuses.streakShield} Streak-Schutz-Tage</div>}
                </div>
              )}
            </div>
            <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>INVENTAR ({(state.equipment?.inventory||[]).length})</div>
            {(state.equipment?.inventory||[]).length===0?(
              <div style={{textAlign:"center",padding:"32px 20px",background:theme.card,borderRadius:14,border:`1px dashed ${theme.primary}15`,backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:32,marginBottom:8,animation:"float 3s ease-in-out infinite"}}>🗡️</div>
                <div style={{fontSize:13,color:"#475569"}}>Kein Equipment</div>
                <div style={{fontSize:11,color:"#334155",marginTop:4}}>Bezwinge Dungeons für Item-Drops (40% Chance)</div>
              </div>
            ):(state.equipment?.inventory||[]).map((item,i)=>{
              const rc=RARITY_COLORS[item.rarity];
              const isEquipped=Object.values(state.equipment?.slots||{}).some(e=>e?.instanceId===item.instanceId);
              return(
                <div key={item.instanceId} style={{background:theme.card,border:`1px solid ${rc}22`,borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(8px)",animation:`cardEnter 0.4s ease ${i*0.05}s both`}}>
                  <span style={{fontSize:26}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <div style={{fontSize:13,fontWeight:700,color:rc,fontFamily:"'Cinzel',serif"}}>{item.name}</div>
                      <div style={{fontSize:8,padding:"1px 6px",borderRadius:3,background:rc+"18",color:rc,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,border:`1px solid ${rc}33`}}>{RARITY_LABELS[item.rarity].toUpperCase()}</div>
                    </div>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{item.desc}</div>
                  </div>
                  {isEquipped?<div style={{fontSize:10,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace",padding:"4px 10px",borderRadius:6,background:"#22c55e12",border:"1px solid #22c55e33"}}>EQUIPPED</div>
                  :<button onClick={()=>equipItem(item,item.slot==="ring"?"ring1":item.slot)} style={{fontSize:10,padding:"6px 14px",borderRadius:8,background:`linear-gradient(135deg,${rc}18,transparent)`,color:rc,border:`1px solid ${rc}33`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>EQUIP</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ACHIEVEMENTS ═══ */}
        {view==="achievements"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>ACHIEVEMENTS</div>
                <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{achUnlocked.length}/{ACHIEVEMENTS.length} freigeschaltet</div>
              </div>
              <div style={{padding:"8px 14px",borderRadius:10,background:"#f59e0b12",border:"1px solid #f59e0b22",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#92400e",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>PUNKTE</div>
                <div style={{fontSize:18,fontWeight:900,color:"#f59e0b",fontFamily:"'Cinzel',serif"}}>{achUnlocked.reduce((sum,id)=>{const a=ACHIEVEMENTS.find(ac=>ac.id===id);return sum+(a?.reward?.xp||0);},0)}</div>
              </div>
            </div>
            <div style={{height:5,background:"#0f0f1e",borderRadius:3,overflow:"hidden",marginBottom:20}}>
              <div style={{width:`${(achUnlocked.length/ACHIEVEMENTS.length)*100}%`,height:"100%",borderRadius:3,background:"linear-gradient(90deg,#f59e0b88,#f59e0b)",transition:"width 0.8s ease"}}/>
            </div>
            {["quests","dungeons","streaks","stats","shadows","misc"].map(cat=>{
              const catAchs=ACHIEVEMENTS.filter(a=>a.cat===cat);
              const catLabels={quests:"⚔️ Quests",dungeons:"🌀 Dungeons",streaks:"🔥 Streaks",stats:"📊 Stats",shadows:"🌑 Shadow Army",misc:"🎲 Sonstiges"};
              return(
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{fontSize:10,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>{catLabels[cat]}</div>
                  {catAchs.map((ach,i)=>{
                    const unlocked=achUnlocked.includes(ach.id);
                    return(
                      <div key={ach.id} style={{background:theme.card,border:`1px solid ${unlocked?"#f59e0b22":theme.primary+"12"}`,borderRadius:12,padding:"12px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:12,opacity:unlocked?1:0.45,backdropFilter:"blur(8px)",animation:`cardEnter 0.4s ease ${i*0.06}s both`}}>
                        <span style={{fontSize:24,filter:unlocked?"none":"grayscale(100%)"}}>{ach.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:unlocked?"#fde68a":"#475569",fontFamily:"'Cinzel',serif"}}>{ach.name}</div>
                          <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{ach.desc}</div>
                          {unlocked&&ach.reward.title&&<div style={{fontSize:9,color:"#f59e0b",marginTop:3,fontFamily:"'JetBrains Mono',monospace"}}>🏷 "{ach.reward.title}" freigeschaltet</div>}
                        </div>
                        {unlocked?<div style={{fontSize:12,color:"#f59e0b"}}>✓</div>:<div style={{textAlign:"right",fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}><div>+{ach.reward.xp} XP</div><div>{ach.reward.gold>0?`+${ach.reward.gold}G`:""}</div></div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ SHOP ═══ */}
        {view==="shop"&&(
          <div style={{animation:"fadeIn 0.35s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>SYSTEM SHOP</div>
                <div style={{fontSize:13,color:"#475569"}}>Kaufe Titel und Themes</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,background:"#fbbf2412",border:"1px solid #fbbf2422"}}>
                <span style={{fontSize:16}}>💰</span>
                <span style={{fontSize:18,fontWeight:900,color:"#fbbf24",fontFamily:"'Cinzel',serif"}}>{state.gold.toLocaleString()}</span>
              </div>
            </div>
            {!shopUnlocked&&<div style={{background:"rgba(239,68,68,0.05)",border:"1px solid #ef444422",borderRadius:14,padding:"16px",marginBottom:16,textAlign:"center",fontSize:12,color:"#ef4444"}}>⚠ Shop ab D-Rang verfügbar</div>}
            {["title","theme"].map(type=>(
              <div key={type} style={{marginBottom:24}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#475569",fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>{type==="title"?"TITEL":"THEMES"}</div>
                {SHOP_ITEMS.filter(i=>i.type===type).map((item,idx)=>{
                  const owned=state.shopPurchases.includes(item.id);
                  const canAfford=state.gold>=item.cost;
                  const rankOk=getRankIndex(rank.name)>=getRankIndex(item.minRank);
                  const isActive=(item.type==="theme"&&state.selectedTheme===item.themeKey)||(item.type==="title"&&state.selectedTitle===item.name);
                  return(
                    <div key={item.id} style={{background:isActive?`linear-gradient(135deg,${theme.primary}15,transparent)`:theme.card,border:`1px solid ${isActive?theme.primary+"44":theme.primary+"12"}`,borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(8px)",animation:`cardEnter 0.4s ease ${idx*0.07}s both`}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{fontSize:13,fontWeight:700,color:isActive?theme.accent:"#e2e8f0",fontFamily:"'Cinzel',serif"}}>{item.name}</div>
                          {isActive&&<div style={{fontSize:8,color:theme.accent,padding:"1px 5px",borderRadius:3,background:theme.primary+"22",fontFamily:"'JetBrains Mono',monospace"}}>AKTIV</div>}
                        </div>
                        <div style={{fontSize:10,color:"#64748b"}}>{item.desc}</div>
                        <div style={{fontSize:9,color:"#334155",marginTop:3,fontFamily:"'JetBrains Mono',monospace"}}>Ab {item.minRank}-Rang</div>
                      </div>
                      {owned?(
                        <button onClick={()=>{if(item.type==="theme")persist({...state,selectedTheme:item.themeKey});else persist({...state,selectedTitle:item.name});}} style={{padding:"8px 16px",borderRadius:10,fontSize:10,fontWeight:700,background:isActive?theme.primary+"22":"transparent",color:isActive?theme.accent:"#475569",border:`1px solid ${isActive?theme.primary+"44":"#1e2940"}`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>{isActive?"AKTIV":"NUTZEN"}</button>
                      ):(
                        <button onClick={()=>buyItem(item)} disabled={!canAfford||!rankOk||!shopUnlocked} style={{padding:"8px 16px",borderRadius:10,fontSize:10,fontWeight:700,background:canAfford&&rankOk&&shopUnlocked?`linear-gradient(135deg,#fbbf2422,#fbbf2408)`:"transparent",color:canAfford&&rankOk&&shopUnlocked?"#fbbf24":"#334155",border:`1px solid ${canAfford&&rankOk&&shopUnlocked?"#fbbf2444":"#1e2940"}`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,cursor:canAfford&&rankOk&&shopUnlocked?"pointer":"not-allowed"}}>
                          {item.cost}G
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:`${theme.bg}f0`,borderTop:`1px solid ${penaltyActive?"#ef444420":theme.primary+"12"}`,backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
          {[
            {key:"dashboard",  icon:"⚔️",  label:"Quests"},
            {key:"dungeon",    icon:"🌀",  label:"Gates",   badge:activeDungeons.length},
            {key:"shadows",    icon:"🌑",  label:"Army",    badge:namedShadows.length>0?namedShadows.length:0},
            {key:"stats",      icon:"📊",  label:"Stats"},
            {key:"jobs",       icon:"🎭",  label:"Jobs"},
            {key:"equipment",  icon:"🗡️",  label:"Equip",   badge:(state.equipment?.inventory||[]).length>0&&!Object.values(state.equipment?.slots||{}).every(Boolean)?1:0},
            {key:"achievements",icon:"🏆", label:"Ach.",    badge:ACHIEVEMENTS.filter(a=>!achUnlocked.includes(a.id)&&a.check(state)).length},
            {key:"shop",       icon:"🛒",  label:"Shop"},
          ].map(tab=>(
            <button key={tab.key} onClick={()=>setView(tab.key)} style={{flex:1,padding:"10px 0 8px",background:"transparent",color:view===tab.key?theme.accent:"#334155",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",transition:"color 0.25s"}}>
              {view===tab.key&&<div style={{position:"absolute",top:-1,left:"25%",right:"25%",height:2,background:`linear-gradient(90deg,transparent,${theme.accent},transparent)`,borderRadius:1}}/>}
              <div style={{position:"relative"}}>
                <span style={{fontSize:18,transition:"transform 0.2s",transform:view===tab.key?"scale(1.15)":"scale(1)",display:"block",filter:view===tab.key?`drop-shadow(0 0 6px ${theme.glow})`:"none"}}>{tab.icon}</span>
                {tab.badge>0&&<div style={{position:"absolute",top:-4,right:-6,width:14,height:14,borderRadius:"50%",background:"#22d3ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#000",fontFamily:"'JetBrains Mono',monospace",animation:"pulse 2s infinite"}}>{tab.badge}</div>}
              </div>
              <span style={{fontSize:8,fontWeight:700,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* QUEST CREATE MODAL */}
      {showCreate&&(
        <div onClick={()=>setShowCreate(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(2,2,8,0.9)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,margin:"0 auto",background:`linear-gradient(180deg,${theme.card},rgba(6,6,16,0.99))`,border:`1px solid ${theme.primary}22`,borderRadius:"20px 20px 0 0",padding:"24px 20px 32px",animation:"slideUp 0.3s ease",backdropFilter:"blur(20px)"}}>
            <div style={{width:36,height:3,background:"#1e2940",borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:10,letterSpacing:3,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:16}}>NEUE QUEST</div>
            <input value={qTitle} onChange={e=>setQTitle(e.target.value)} placeholder="Quest-Titel eingeben..." autoFocus
              style={{width:"100%",padding:"14px 16px",borderRadius:12,fontSize:14,background:"rgba(8,8,20,0.8)",border:`1px solid ${theme.primary}33`,color:"#e2e8f0",outline:"none",marginBottom:14,fontFamily:"'Outfit',sans-serif",letterSpacing:0.5}}
              onKeyDown={e=>e.key==="Enter"&&qTitle.trim()&&createQuest()}/>

            {/* Quest Type Selection */}
            <label style={{fontSize:9,color:"#475569",letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:8}}>TYP</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {[
                {key:"side",label:"📋 Side",color:"#a78bfa",desc:"Keine Zeitbegrenzung"},
                {key:"daily",label:"📅 Daily",color:"#22d3ee",desc:"Reset täglich"},
                {key:"weekly",label:"📆 Weekly",color:"#8b5cf6",desc:"2x XP & Gold"},
                {key:"chained",label:"⛓️ Kette",color:"#f59e0b",desc:"3er Kette +25%/Schritt"},
              ].map(t=>{
                const active=qType===t.key;
                return(
                  <button key={t.key} onClick={()=>setQType(t.key)} style={{
                    padding:"7px 10px",borderRadius:10,fontSize:11,fontWeight:600,
                    background:active?t.color+"22":"transparent",
                    color:active?t.color:"#475569",
                    border:`1px solid ${active?t.color+"55":theme.primary+"15"}`,
                    transition:"all 0.2s",fontFamily:"'JetBrains Mono',monospace",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  }}>
                    <span>{t.label}</span>
                    {active&&<span style={{fontSize:8,opacity:0.7}}>{t.desc}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <label style={{fontSize:9,color:"#475569",letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:6}}>SCHWIERIGKEIT</label>
                <div style={{display:"flex",gap:4}}>
                  {DIFFICULTIES.map(d=>(
                    <button key={d.key} onClick={()=>setQDiff(d.key)} title={`${d.label} (${d.xp} XP)`} style={{flex:1,padding:"9px 2px",borderRadius:10,fontSize:12,fontWeight:700,background:qDiff===d.key?d.color+"22":"transparent",color:qDiff===d.key?d.color:"#475569",border:`1px solid ${qDiff===d.key?d.color+"55":theme.primary+"15"}`,transition:"all 0.2s"}}>{d.icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:9,color:"#475569",letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:6}}>STAT</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3}}>
                  {CATEGORIES.map(c=>(
                    <button key={c.key} onClick={()=>setQCat(c.key)} style={{padding:"6px 2px",borderRadius:8,fontSize:10,background:qCat===c.key?c.color+"18":"transparent",color:qCat===c.key?c.color:"#64748b",border:`1px solid ${qCat===c.key?c.color+"44":theme.primary+"15"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:2,fontWeight:600,transition:"all 0.2s"}}>{c.icon}</button>
                  ))}
                </div>
              </div>
            </div>

            {qTitle.trim()&&(
              <div style={{background:theme.surface,borderRadius:10,padding:"10px 14px",marginBottom:14,border:`1px solid ${theme.primary}11`,fontSize:11,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
                {(()=>{
                  const typeCfg=QUEST_TYPES_CONFIG[qType]||QUEST_TYPES_CONFIG.side;
                  const diff=DIFFICULTIES.find(d=>d.key===qDiff);
                  const cat=CATEGORIES.find(c=>c.key===qCat);
                  const baseXp=Math.round(diff.xp*(typeCfg.xpMult||1));
                  const baseGold=Math.round(diff.gold*(typeCfg.goldMult||1));
                  return(<>
                    <span style={{color:typeCfg.color}}>{typeCfg.icon} {typeCfg.label}</span>
                    <span style={{color:"#1e293b"}}>·</span>
                    <span style={{color:cat.color}}>{cat.icon} {cat.stat}</span>
                    <span style={{color:"#1e293b"}}>·</span>
                    <span style={{color:theme.accent}}>+{baseXp} XP</span>
                    <span style={{color:"#1e293b"}}>·</span>
                    <span style={{color:"#fbbf24"}}>+{baseGold} G</span>
                    {qType==="chained"&&<span style={{color:"#f59e0b"}}>· ⛓️ 3 Schritte</span>}
                    {qType==="weekly"&&<span style={{color:"#8b5cf6"}}>· 📆 7 Tage</span>}
                    {qDiff==="boss"&&<span style={{color:"#7c3aed"}}>· 🌑 Schatten beschwören</span>}
                  </>);
                })()}
              </div>
            )}
            <button onClick={()=>{
              if(qType==="chained") addChainedQuest(qTitle,qCat,qDiff);
              else createQuest();
              setQTitle(""); setShowCreate(false);
            }} disabled={!qTitle.trim()} style={{width:"100%",padding:14,borderRadius:14,fontSize:13,fontWeight:700,background:qTitle.trim()?`linear-gradient(135deg,${theme.primary},${theme.secondary})`:"#0f0f1e",color:qTitle.trim()?"#fff":"#334155",letterSpacing:2,fontFamily:"'Cinzel',serif",boxShadow:qTitle.trim()?`0 4px 24px ${theme.glow}`:"none",transition:"all 0.3s"}}>⚔️ QUEST ANNEHMEN</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETUP ────────────────────────────────────────────────────
function SetupScreen({ onFinish, theme }) {
  const [name,setName]=useState("");
  const [phase,setPhase]=useState(0);
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),600);const t2=setTimeout(()=>setPhase(2),1400);const t3=setTimeout(()=>setPhase(3),2200);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};},[]);
  return (
    <div style={{minHeight:"100vh",background:"#060610",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes glow{0%,100%{text-shadow:0 0 20px #7c3aed88}50%{text-shadow:0 0 40px #7c3aed,0 0 80px #a78bfa}}@keyframes bGlow{0%,100%{border-color:#4f6ef744}50%{border-color:#4f6ef788}}button{cursor:pointer;border:none;font-family:inherit}input{font-family:inherit}`}</style>
      <div style={{textAlign:"center",maxWidth:380,width:"100%"}}>
        <div style={{fontSize:56,marginBottom:20,animation:"float 3s ease-in-out infinite",filter:"drop-shadow(0 0 20px rgba(124,58,237,0.6))"}}>⚔️</div>
        {phase>=1&&<div style={{animation:"fadeIn 0.8s ease",fontSize:9,letterSpacing:6,color:"#7c3aed",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>SYSTEM ACTIVATED</div>}
        {phase>=2&&<div style={{animation:"slideUp 0.6s ease"}}>
          <h1 style={{fontSize:42,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",letterSpacing:6,marginBottom:8,lineHeight:1,animation:"glow 3s ease-in-out infinite"}}>ARISE</h1>
          <p style={{fontSize:13,color:"#475569",lineHeight:1.6,fontFamily:"'Outfit',sans-serif"}}>Ein neuer Hunter wurde erkannt.<br/>Identifiziere dich.</p>
        </div>}
        {phase>=3&&<div style={{animation:"slideUp 0.6s ease",marginTop:32}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Hunter Name..." autoFocus
            style={{width:"100%",padding:"16px 20px",borderRadius:14,fontSize:16,textAlign:"center",background:"rgba(15,15,30,0.8)",border:"1.5px solid #4f6ef733",color:"#e2e8f0",outline:"none",fontFamily:"'Cinzel',serif",letterSpacing:3,animation:"bGlow 3s infinite"}}
            onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#4f6ef733"} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onFinish(name.trim())}/>
          <button onClick={()=>onFinish(name.trim()||"Hunter")} style={{width:"100%",padding:16,borderRadius:14,fontSize:14,fontWeight:900,marginTop:14,background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",color:"#fff",letterSpacing:4,fontFamily:"'Cinzel',serif",boxShadow:"0 4px 32px rgba(79,110,247,0.4),0 0 60px rgba(124,58,237,0.2)"}}>BEGIN HUNT</button>
        </div>}
      </div>
    </div>
  );
}
