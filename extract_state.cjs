const fs = require('fs');

const fileContent = fs.readFileSync('solo-leveling-v5.jsx', 'utf8');
const lines = fileContent.split('\n');

const startIdx = lines.findIndex(line => line.includes('export default function App({'));
const endIdx = lines.findIndex(line => line.includes('if (loading) return'));

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find start or end index', startIdx, endIdx);
    process.exit(1);
}

const stateLines = lines.slice(startIdx + 1, endIdx); // lines 21 to 749

// Find all state variables, setters, and functions to export
const exportsSet = new Set();

stateLines.forEach(line => {
    // Match const [state, setState]
    const stateMatch = line.match(/const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState/);
    if (stateMatch) {
        exportsSet.add(stateMatch[1]);
        exportsSet.add(stateMatch[2]);
    }

    // Match const funcName = useCallback / () => / function
    // e.g. const notify = useCallback(...
    // const deleteQuest = id => ...
    // const createQuest = () => ...
    const funcMatch = line.match(/^\s*const\s+(\w+)\s*=\s*(useCallback|\([^\)]*\)\s*=>|\w+\s*=>)/);
    if (funcMatch) {
        exportsSet.add(funcMatch[1]);
    }
});

// manually add a few we might have missed
const extra = ['enterPortal', 'exitPortal'];
extra.forEach(e => exportsSet.add(e));

const exportsList = Array.from(exportsSet).join(',\n    ');

const hookContent = `
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
    RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
    SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
    ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
    EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE,
    JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
    assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
    getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests
} from '../data/constants';
import { saveState, loadState, clearState, migrateState, hoursUntilMidnight, getLevelUpStats } from '../utils/storage'; // Assuming these exist, we'll see where they are

export function useGameState(initialHunterName, onLogout) {
${stateLines.join('\n')}

  return {
    ${exportsList}
  };
}
`;

// wait, loadState, saveState etc are defined below in the file?
// Actually loadState etc are probably defined outside App or inside... wait! loadState was defined OUTSIDE App!
// Let's check where they are. 

// Just in case, let's just write the hook to src/hooks/useGameState.js
if (!fs.existsSync('hooks')) {
    fs.mkdirSync('hooks', { recursive: true });
}
fs.writeFileSync('hooks/useGameState.js', hookContent);

const modifiedAppLines = [
    ...lines.slice(0, startIdx + 1),
    `  const gameState = useGameState(initialHunterName, onLogout);`,
    `  const {`,
    `    ${exportsList}`,
    `  } = gameState;`,
    ...lines.slice(endIdx)
];

const newImports = [
    `import { useGameState } from './hooks/useGameState';`
];

// prepend new imports right before export default function App
modifiedAppLines.splice(startIdx, 0, ...newImports);

fs.writeFileSync('solo-leveling-v5.jsx', modifiedAppLines.join('\n'));
console.log('Successfully extracted state logic!');
