const fs = require('fs');

const fileContent = fs.readFileSync('solo-leveling-v5.jsx', 'utf8');
const lines = fileContent.split('\n');

// Find start of constants (line 10 usually, let's find 'const RANKS = [')
const startIdx = lines.findIndex(line => line.includes('const RANKS = ['));

// Find end of constants/helpers, right before 'export default function App('
const endIdx = lines.findIndex(line => line.includes('export default function App('));

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find start or end index', startIdx, endIdx);
    process.exit(1);
}

const constantsData = lines.slice(startIdx, endIdx).join('\n');

const exportsToAdd = `
export {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests
};
`;

const constantsFile = constantsData + '\n' + exportsToAdd;
fs.writeFileSync('data/constants.js', constantsFile);

const newLines = [
  ...lines.slice(0, startIdx),
  `import {
    RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
    SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
    ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
    EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE,
    JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
    assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
    getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests
  } from './src/data/constants';`,
  ...lines.slice(endIdx)
];

fs.writeFileSync('solo-leveling-v5.jsx', newLines.join('\n'));
console.log('Successfully extracted constants and updated solo-leveling-v5.jsx!');
