const RANKS = [
  { name: "E", label: "E-Rank Hunter", minLv: 1, maxLv: 10, xpPerLv: 100, color: "#6b7280", glow: "rgba(107,114,128,0.4)" },
  { name: "D", label: "D-Rank Hunter", minLv: 11, maxLv: 20, xpPerLv: 250, color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { name: "C", label: "C-Rank Hunter", minLv: 21, maxLv: 35, xpPerLv: 500, color: "#34d399", glow: "rgba(52,211,153,0.4)" },
  { name: "B", label: "B-Rank Hunter", minLv: 36, maxLv: 50, xpPerLv: 900, color: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { name: "A", label: "A-Rank Hunter", minLv: 51, maxLv: 70, xpPerLv: 1500, color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { name: "S", label: "S-Rank Hunter", minLv: 71, maxLv: 90, xpPerLv: 3000, color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { name: "SSS", label: "National Level", minLv: 91, maxLv: 100, xpPerLv: 6000, color: "#e879f9", glow: "rgba(232,121,249,0.4)" },
];

const DIFFICULTIES = [
  { key: "easy", label: "Easy", xp: 5, gold: 10, color: "#6b7280", icon: "◇", waitHours: 1 },
  { key: "normal", label: "Normal", xp: 15, gold: 25, color: "#22d3ee", icon: "◆", waitHours: 2 },
  { key: "hard", label: "Hard", xp: 40, gold: 60, color: "#a78bfa", icon: "★", waitHours: 4 },
  { key: "boss", label: "Boss", xp: 100, gold: 150, color: "#ef4444", icon: "♛", waitHours: 8 },
];

const CATEGORIES = [
  { key: "str", label: "Strength", full: "Sport / Fitness", stat: "STR", icon: "⚔️", color: "#ef4444" },
  { key: "int", label: "Intelligence", full: "Lernen / Lesen", stat: "INT", icon: "📖", color: "#3b82f6" },
  { key: "vit", label: "Vitality", full: "Erholung", stat: "VIT", icon: "🛡️", color: "#22c55e" },
  { key: "agi", label: "Agility", full: "Produktivität", stat: "AGI", icon: "⚡", color: "#f59e0b" },
  { key: "cha", label: "Charisma", full: "Soziales", stat: "CHA", icon: "👥", color: "#a855f7" },
];

const STRATEGIES = [
  { key: "str", label: "Aggressive", desc: "Frontalangriff ohne Rücksicht", icon: "⚔️", color: "#ef4444" },
  { key: "int", label: "Tactical", desc: "Strategie, Täuschung & Planung", icon: "🧠", color: "#3b82f6" },
  { key: "vit", label: "Defensive", desc: "Schildwall – Ausdauer gewinnt", icon: "🛡️", color: "#22c55e" },
  { key: "agi", label: "Swift", desc: "Schnell, lautlos, unsichtbar", icon: "⚡", color: "#f59e0b" },
];

// ─── QUEST TEMPLATES LIBRARY ──────────────────────────────────
const QUEST_TEMPLATES = [
  // STR
  { t: "20 Liegestütze", c: "str", d: "easy", tp: "daily" }, { t: "50 Liegestütze", c: "str", d: "normal", tp: "daily" },
  { t: "100 Liegestütze", c: "str", d: "hard", tp: "side" }, { t: "30 Kniebeugen", c: "str", d: "easy", tp: "daily" },
  { t: "100 Kniebeugen", c: "str", d: "normal", tp: "daily" }, { t: "Plank 60 Sekunden halten", c: "str", d: "easy", tp: "daily" },
  { t: "Plank 3 Minuten halten", c: "str", d: "hard", tp: "side" }, { t: "10-Minuten HIIT Training", c: "str", d: "normal", tp: "daily" },
  { t: "30 Minuten Joggen", c: "str", d: "normal", tp: "daily" }, { t: "5km Laufen", c: "str", d: "hard", tp: "side" },
  { t: "10km Laufen", c: "str", d: "boss", tp: "weekly" }, { t: "Klimmzüge – 3 Sätze", c: "str", d: "normal", tp: "daily" },
  { t: "Gym Session 1 Stunde", c: "str", d: "hard", tp: "side" }, { t: "50 Situps", c: "str", d: "easy", tp: "daily" },
  { t: "20 Burpees", c: "str", d: "normal", tp: "daily" }, { t: "Fahrrad fahren 30 Min", c: "str", d: "normal", tp: "daily" },
  { t: "Schwimmen 500m", c: "str", d: "hard", tp: "side" }, { t: "Seilspringen 5 Minuten", c: "str", d: "normal", tp: "daily" },
  { t: "Morgen-Stretching 10 Min", c: "str", d: "easy", tp: "daily" }, { t: "Yoga-Session 20 Min", c: "str", d: "easy", tp: "daily" },
  { t: "8000 Schritte gehen", c: "str", d: "normal", tp: "daily" }, { t: "10.000 Schritte Challenge", c: "str", d: "boss", tp: "weekly" },
  { t: "Sprint-Intervalle 10x30s", c: "str", d: "hard", tp: "side" }, { t: "Treppensteigen 10 Etagen", c: "str", d: "normal", tp: "daily" },
  { t: "Dips 30 Stück", c: "str", d: "normal", tp: "daily" }, { t: "Wandern 2 Stunden", c: "str", d: "hard", tp: "weekly" },
  // INT
  { t: "30 Minuten lesen", c: "int", d: "easy", tp: "daily" }, { t: "1 Stunde lesen", c: "int", d: "normal", tp: "daily" },
  { t: "Buchkapitel lesen", c: "int", d: "easy", tp: "daily" }, { t: "Buch komplett auslesen", c: "int", d: "boss", tp: "weekly" },
  { t: "Neue Sprache lernen 30 Min", c: "int", d: "normal", tp: "daily" }, { t: "20 Vokabeln lernen", c: "int", d: "easy", tp: "daily" },
  { t: "Online-Kurs Einheit", c: "int", d: "normal", tp: "daily" }, { t: "Lehrreichen Podcast hören", c: "int", d: "easy", tp: "daily" },
  { t: "Dokumentation schauen", c: "int", d: "easy", tp: "daily" }, { t: "Fachtext lesen", c: "int", d: "easy", tp: "daily" },
  { t: "Notizen zusammenfassen", c: "int", d: "easy", tp: "daily" }, { t: "Neues Thema 1h recherchieren", c: "int", d: "normal", tp: "daily" },
  { t: "20 Flashcards erstellen", c: "int", d: "normal", tp: "side" }, { t: "Text auswendig lernen", c: "int", d: "hard", tp: "side" },
  { t: "Programmieren 1 Stunde", c: "int", d: "normal", tp: "daily" }, { t: "Mathe-Rätsel lösen", c: "int", d: "normal", tp: "daily" },
  { t: "500 Wörter schreiben", c: "int", d: "normal", tp: "daily" }, { t: "Mind-Map erstellen", c: "int", d: "easy", tp: "daily" },
  { t: "Philosophischen Text lesen", c: "int", d: "hard", tp: "side" }, { t: "Wissenschaftliche Studie lesen", c: "int", d: "hard", tp: "side" },
  { t: "Tagesrückblick journalen", c: "int", d: "easy", tp: "daily" }, { t: "Kreatives Schreiben 1h", c: "int", d: "normal", tp: "daily" },
  { t: "5 Fakten über neues Thema lernen", c: "int", d: "easy", tp: "daily" }, { t: "Essay schreiben", c: "int", d: "hard", tp: "side" },
  { t: "Sprachkurs-Modul abschließen", c: "int", d: "hard", tp: "weekly" }, { t: "TED-Talk ansehen und notieren", c: "int", d: "normal", tp: "daily" },
  // VIT
  { t: "8 Gläser Wasser trinken", c: "vit", d: "easy", tp: "daily" }, { t: "Früh schlafen gehen", c: "vit", d: "easy", tp: "daily" },
  { t: "8 Stunden schlafen", c: "vit", d: "normal", tp: "daily" }, { t: "Kein Bildschirm 1h vor Schlaf", c: "vit", d: "normal", tp: "daily" },
  { t: "Gesunde Mahlzeit kochen", c: "vit", d: "normal", tp: "daily" }, { t: "Kein Junkfood heute", c: "vit", d: "normal", tp: "daily" },
  { t: "10 Minuten meditieren", c: "vit", d: "easy", tp: "daily" }, { t: "Tiefenentspannung 20 Min", c: "vit", d: "easy", tp: "daily" },
  { t: "Kalt duschen", c: "vit", d: "normal", tp: "daily" }, { t: "30 Minuten frische Luft", c: "vit", d: "easy", tp: "daily" },
  { t: "Handy-freie Stunde", c: "vit", d: "normal", tp: "daily" }, { t: "Kein Zucker heute", c: "vit", d: "hard", tp: "side" },
  { t: "Kein Alkohol diese Woche", c: "vit", d: "boss", tp: "weekly" }, { t: "Vitamine einnehmen", c: "vit", d: "easy", tp: "daily" },
  { t: "5 Portionen Obst & Gemüse", c: "vit", d: "normal", tp: "daily" }, { t: "Intermittent Fasting 16h", c: "vit", d: "hard", tp: "side" },
  { t: "Natur-Wanderung 1h", c: "vit", d: "normal", tp: "side" }, { t: "Sauna oder Bad entspannen", c: "vit", d: "easy", tp: "side" },
  { t: "Box Breathing 5 Minuten", c: "vit", d: "easy", tp: "daily" }, { t: "Bildschirmzeit unter 2h", c: "vit", d: "hard", tp: "daily" },
  { t: "Frühstück nicht überspringen", c: "vit", d: "easy", tp: "daily" }, { t: "Schlafzeit regulieren", c: "vit", d: "normal", tp: "weekly" },
  { t: "Abends spazieren gehen", c: "vit", d: "easy", tp: "daily" }, { t: "Digitaler Detox halber Tag", c: "vit", d: "boss", tp: "weekly" },
  // AGI
  { t: "To-Do Liste erstellen", c: "agi", d: "easy", tp: "daily" }, { t: "Aufgeschobene Aufgabe erledigen", c: "agi", d: "normal", tp: "daily" },
  { t: "Schreibtisch aufräumen", c: "agi", d: "easy", tp: "daily" }, { t: "E-Mails beantworten", c: "agi", d: "easy", tp: "daily" },
  { t: "25-Min Pomodoro", c: "agi", d: "easy", tp: "daily" }, { t: "4 Pomodoros am Stück", c: "agi", d: "hard", tp: "side" },
  { t: "Wochenziel setzen", c: "agi", d: "easy", tp: "weekly" }, { t: "Zimmer aufräumen", c: "agi", d: "normal", tp: "daily" },
  { t: "Wohnung putzen", c: "agi", d: "hard", tp: "weekly" }, { t: "Projekt-Plan schreiben", c: "agi", d: "normal", tp: "side" },
  { t: "Digitale Dateien sortieren", c: "agi", d: "easy", tp: "daily" }, { t: "Rucksack ausmisten", c: "agi", d: "easy", tp: "daily" },
  { t: "Budget überprüfen", c: "agi", d: "normal", tp: "weekly" }, { t: "Einkaufen gehen", c: "agi", d: "easy", tp: "daily" },
  { t: "Wichtige Telefonate erledigen", c: "agi", d: "normal", tp: "daily" }, { t: "Vor 7 Uhr aufstehen", c: "agi", d: "hard", tp: "daily" },
  { t: "Deep Work Session 2h", c: "agi", d: "boss", tp: "weekly" }, { t: "Inbox Zero erreichen", c: "agi", d: "hard", tp: "side" },
  { t: "Kleiderschrank sortieren", c: "agi", d: "normal", tp: "side" }, { t: "Wunschliste schreiben", c: "agi", d: "easy", tp: "side" },
  { t: "Routine für morgen planen", c: "agi", d: "easy", tp: "daily" }, { t: "Prokrastinierte Aufgabe JETZT", c: "agi", d: "boss", tp: "daily" },
  { t: "Wichtigstes Ziel priorisieren", c: "agi", d: "normal", tp: "daily" }, { t: "Arbeitsplatz optimieren", c: "agi", d: "normal", tp: "side" },
  // CHA
  { t: "Freund anschreiben", c: "cha", d: "easy", tp: "daily" }, { t: "Familie anrufen", c: "cha", d: "easy", tp: "daily" },
  { t: "Jemanden zum Essen einladen", c: "cha", d: "normal", tp: "side" }, { t: "Neuen Kontakt knüpfen", c: "cha", d: "normal", tp: "side" },
  { t: "Jemandem ein Kompliment machen", c: "cha", d: "easy", tp: "daily" }, { t: "Jemanden um Hilfe bitten", c: "cha", d: "normal", tp: "daily" },
  { t: "Jemanden aktiv unterstützen", c: "cha", d: "easy", tp: "daily" }, { t: "Social Media Pause 1 Tag", c: "cha", d: "hard", tp: "daily" },
  { t: "Öffentlich reden", c: "cha", d: "boss", tp: "weekly" }, { t: "Ehrenamtliche Stunde", c: "cha", d: "normal", tp: "weekly" },
  { t: "3x aufrichtig Danke sagen", c: "cha", d: "easy", tp: "daily" }, { t: "Konflikt aktiv lösen", c: "cha", d: "hard", tp: "side" },
  { t: "Konstruktives Feedback geben", c: "cha", d: "normal", tp: "daily" }, { t: "Netzwerk-Event besuchen", c: "cha", d: "hard", tp: "weekly" },
  { t: "Handgeschriebenen Brief schreiben", c: "cha", d: "normal", tp: "side" }, { t: "Mit Fremdem Gespräch führen", c: "cha", d: "normal", tp: "daily" },
  { t: "Positives teilen", c: "cha", d: "easy", tp: "daily" }, { t: "Experten um Rat fragen", c: "cha", d: "hard", tp: "side" },
  { t: "Zusammen Sport machen", c: "cha", d: "normal", tp: "side" }, { t: "Jemanden überraschen", c: "cha", d: "normal", tp: "side" },
  { t: "Alten Freund wiederfinden", c: "cha", d: "hard", tp: "weekly" }, { t: "Gruppenaktivität organisieren", c: "cha", d: "boss", tp: "weekly" },
  { t: "Selbst-Gespräch / Affirmation", c: "cha", d: "easy", tp: "daily" }, { t: "Postkarte schicken", c: "cha", d: "easy", tp: "side" },
];

// ─── SHADOW ARMY DATA ─────────────────────────────────────────
const SHADOW_CLASSES = {
  soldier: {
    name: "Shadow Soldier", icon: "⚔️", color: "#64748b",
    baseStats: { power: 10, speed: 10, loyalty: 10, presence: 5 },
    passiveEffect: "+2% XP von allen Quests",
    description: "Standard-Schattenkrieger"
  },
  knight: {
    name: "Shadow Knight", icon: "🛡️", color: "#3b82f6",
    baseStats: { power: 18, speed: 8, loyalty: 12, presence: 7 },
    passiveEffect: "+5% Dungeon Verteidigung",
    description: "Gepanzerter Frontline-Kämpfer"
  },
  mage: {
    name: "Shadow Mage", icon: "🔮", color: "#a855f7",
    baseStats: { power: 8, speed: 12, loyalty: 10, presence: 15 },
    passiveEffect: "+3% XP von INT-Quests",
    description: "Magischer Unterstützer"
  },
  assassin: {
    name: "Shadow Assassin", icon: "🗡️", color: "#22c55e",
    baseStats: { power: 14, speed: 18, loyalty: 8, presence: 5 },
    passiveEffect: "+5% Gold von Dungeons",
    description: "Schneller Schattenangreifer"
  },
  healer: {
    name: "Shadow Healer", icon: "💚", color: "#14b8a6",
    baseStats: { power: 5, speed: 10, loyalty: 18, presence: 12 },
    passiveEffect: "+1 Tag Streak-Schutz",
    description: "Beschützer der Armee"
  },
  commander: {
    name: "Shadow Commander", icon: "👑", color: "#f59e0b",
    baseStats: { power: 15, speed: 12, loyalty: 15, presence: 18 },
    passiveEffect: "Alle Shadows +10% Stats",
    description: "Führt andere Shadows an",
    unlockCondition: "Mindestens 10 Shadows besitzen"
  },
};

const SHADOW_TIERS = {
  1: { name: "Basic", color: "#64748b", maxLevel: 20, statMult: 1.0, abilitySlots: 1, evolutionCost: 0, glowIntensity: 0.2 },
  2: { name: "Elite", color: "#3b82f6", maxLevel: 35, statMult: 1.3, abilitySlots: 2, evolutionCost: 500, glowIntensity: 0.4 },
  3: { name: "Commander", color: "#a855f7", maxLevel: 50, statMult: 1.6, abilitySlots: 3, evolutionCost: 1500, glowIntensity: 0.6 },
  4: { name: "Named", color: "#f59e0b", maxLevel: 75, statMult: 2.0, abilitySlots: 4, evolutionCost: 5000, glowIntensity: 0.8 },
  5: { name: "Monarch", color: "#ef4444", maxLevel: 100, statMult: 3.0, abilitySlots: 5, evolutionCost: 20000, glowIntensity: 1.0 },
};

const NAMED_SHADOWS = {
  igris: {
    id: "igris", name: "Igris", title: "The Bloodred Commander",
    class: "knight", tier: 4, icon: "🩸",
    unlockCondition: { type: "dungeon_rank", dungeonRank: "A", desc: "A-Rank Dungeon besiegen" },
    uniqueAbility: { name: "Crimson Blade", effect: "Critical Strike +50% in Dungeons", icon: "⚔️" },
    lore: "Einst ein loyaler Ritter, nun der treueste Schatten des Monarchen.",
    glowColor: "#dc2626",
  },
  tank: {
    id: "tank", name: "Tank", title: "The Iron Fortress",
    class: "knight", tier: 4, icon: "🛡️",
    unlockCondition: { type: "stat", stat: "vit", value: 100, desc: "VIT 100 erreichen" },
    uniqueAbility: { name: "Unbreakable Defense", effect: "1x täglich: Dungeon-Schaden Immunität", icon: "🛡️" },
    lore: "Ein Koloss aus Schatten, unerschütterlich wie ein Berg.",
    glowColor: "#3b82f6",
  },
  beru: {
    id: "beru", name: "Beru", title: "The Ant King",
    class: "assassin", tier: 4, icon: "🐜",
    unlockCondition: { type: "dungeon_rank", dungeonRank: "S", desc: "S-Rank Dungeon besiegen" },
    uniqueAbility: { name: "Consume", effect: "Absorbiert 5% der Boss-Stats permanent", icon: "👅" },
    lore: "Der gefallene König der Ameisen, wiedergeboren als Schatten.",
    glowColor: "#22c55e",
  },
  bellion: {
    id: "bellion", name: "Bellion", title: "The Grand Marshal",
    class: "commander", tier: 5, icon: "⚜️",
    unlockCondition: { type: "level", value: 90, desc: "Level 90 erreichen" },
    uniqueAbility: { name: "Army Command", effect: "Kann gesamte Shadow Army gleichzeitig kommandieren", icon: "👑" },
    lore: "Der oberste General des ursprünglichen Shadow Monarchen.",
    glowColor: "#f59e0b",
  },
};

const FORMATION_SLOTS = {
  vanguard: { name: "Vanguard", maxSlots: 3, bonus: "+15% Aggressive Strategy", icon: "⚔️", preferredClasses: ["knight", "soldier"], color: "#ef4444" },
  core: { name: "Core", maxSlots: 5, bonus: "+10% All Strategies", icon: "🛡️", preferredClasses: ["any"], color: "#6366f1" },
  rearguard: { name: "Rearguard", maxSlots: 2, bonus: "+20% XP & Gold", icon: "🎯", preferredClasses: ["mage", "healer", "assassin"], color: "#22c55e" },
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
  const catMap = { str: "knight", int: "mage", vit: "healer", agi: "assassin", cha: "soldier" };
  return catMap[quest.category] || "soldier";
}

function assignShadowTier(quest) {
  const diffMap = { easy: 1, normal: 1, hard: 2, boss: 3 };
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

function calcFormationBonus(shadowArmy, allShadowsActive = false) {
  if (!shadowArmy) return { dungeonBonus: 0, xpBonus: 0, goldBonus: 0 };
  const deployed = (shadowArmy.shadows || []).filter(s => allShadowsActive || s.isDeployed);
  let dungeonBonus = 0, xpBonus = 0, goldBonus = 0;
  const vCount = deployed.filter(s => s.deploymentSlot === "vanguard").length;
  const cCount = deployed.filter(s => s.deploymentSlot === "core").length;
  const rCount = deployed.filter(s => s.deploymentSlot === "rearguard").length;
  if (vCount >= 2) dungeonBonus += 15;
  if (cCount >= 3) dungeonBonus += 10;
  if (rCount >= 1) { xpBonus += 20; goldBonus += 20; }
  // Named shadows
  const named = deployed.filter(s => s.isNamed);
  named.forEach(s => { dungeonBonus += 10; xpBonus += 5; });
  // Commander bonus
  const hasCommander = deployed.some(s => s.class === "commander");
  if (hasCommander) { dungeonBonus += 5; xpBonus += 5; goldBonus += 5; }
  return { dungeonBonus, xpBonus: xpBonus / 100, goldBonus: goldBonus / 100 };
}

function checkNamedShadowUnlocks(state) {
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

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_quest", name: "Erste Schritte", icon: "⚔️", desc: "Schließe deine erste Quest ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 1, reward: { xp: 50, gold: 20 } },
  { id: "quests_10", name: "Fleißiger Hunter", icon: "📋", desc: "Schließe 10 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 10, reward: { xp: 100, gold: 50 } },
  { id: "quests_50", name: "Quest Meister", icon: "🏆", desc: "Schließe 50 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 50, reward: { xp: 500, gold: 200 } },
  { id: "quests_100", name: "Legendärer Hunter", icon: "👑", desc: "Schließe 100 Quests ab", cat: "quests", check: s => (s.totalQuestsCompleted || 0) >= 100, reward: { xp: 1000, gold: 500, title: "Legendary Hunter" } },
  { id: "boss_first", name: "Besieger", icon: "💀", desc: "Schließe deine erste Boss-Quest ab", cat: "quests", check: s => (s.shadowArmy?.shadows || []).length >= 1, reward: { xp: 200, gold: 100 } },
  { id: "boss_5", name: "Schattenherr", icon: "🌑", desc: "Beschwöre 5 Schatten", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).length >= 5, reward: { xp: 400, gold: 200 } },
  { id: "boss_15", name: "Schattenmonarch", icon: "☠️", desc: "Beschwöre 15 Schatten", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).length >= 15, reward: { xp: 1500, gold: 600, title: "Shadow Monarch" } },
  { id: "shadow_named", name: "Erste Berufung", icon: "🩸", desc: "Erwecke einen Named Shadow", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).some(sh => sh.isNamed), reward: { xp: 800, gold: 400, title: "Shadow Sovereign" } },
  { id: "shadow_tier3", name: "Elite Armee", icon: "💜", desc: "Habe einen Tier-3 Shadow", cat: "shadows", check: s => (s.shadowArmy?.shadows || []).some(sh => sh.tier >= 3), reward: { xp: 600, gold: 300 } },
  { id: "formation_full", name: "Volles Kommando", icon: "🎖️", desc: "Fülle alle Formation-Slots", cat: "shadows", check: s => { const a = s.shadowArmy; if (!a) return false; const d = a.shadows.filter(sh => sh.isDeployed); return d.filter(sh => sh.deploymentSlot === "vanguard").length >= 3 && d.filter(sh => sh.deploymentSlot === "core").length >= 5; }, reward: { xp: 1000, gold: 500 } },
  { id: "streak_3", name: "Beständigkeit", icon: "🔥", desc: "Erreiche einen 3-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 3, reward: { xp: 100, gold: 50 } },
  { id: "streak_7", name: "Unaufhaltsam", icon: "⚡", desc: "Erreiche einen 7-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 7, reward: { xp: 300, gold: 150, title: "Unstoppable" } },
  { id: "streak_30", name: "Eiserne Disziplin", icon: "💎", desc: "Erreiche einen 30-Tage Streak", cat: "streaks", check: s => (s.streak || 0) >= 30, reward: { xp: 2000, gold: 1000, title: "Iron Discipline" } },
  { id: "level_10", name: "Erweckung", icon: "✨", desc: "Erreiche Level 10", cat: "progress", check: s => s.level >= 10, reward: { xp: 100, gold: 50 } },
  { id: "rank_d", name: "D-Rang Aufstieg", icon: "🌀", desc: "Erreiche D-Rang (Level 11)", cat: "progress", check: s => s.level >= 11, reward: { xp: 300, gold: 150 } },
  { id: "rank_c", name: "C-Rang Aufstieg", icon: "💚", desc: "Erreiche C-Rang (Level 21)", cat: "progress", check: s => s.level >= 21, reward: { xp: 600, gold: 300 } },
  { id: "rank_b", name: "B-Rang Aufstieg", icon: "💜", desc: "Erreiche B-Rang (Level 36)", cat: "progress", check: s => s.level >= 36, reward: { xp: 1200, gold: 600 } },
  { id: "rank_a", name: "A-Rang Aufstieg", icon: "🧡", desc: "Erreiche A-Rang (Level 51)", cat: "progress", check: s => s.level >= 51, reward: { xp: 2500, gold: 1000, title: "A-Rank Hunter" } },
  { id: "rank_s", name: "S-Rang Aufstieg", icon: "❤️", desc: "Erreiche S-Rang (Level 71)", cat: "progress", check: s => s.level >= 71, reward: { xp: 5000, gold: 2000, title: "S-Rank Hunter" } },
  { id: "dungeon_first", name: "Gate Öffner", icon: "🌀", desc: "Bezwinge deinen ersten Dungeon", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 1, reward: { xp: 200, gold: 100 } },
  { id: "dungeon_10", name: "Dungeon Meister", icon: "🏯", desc: "Bezwinge 10 Dungeons", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 10, reward: { xp: 800, gold: 400 } },
  { id: "dungeon_25", name: "Gate Legende", icon: "⚡", desc: "Bezwinge 25 Dungeons", cat: "dungeons", check: s => (s.dungeonHistory || []).filter(d => d.won).length >= 25, reward: { xp: 2000, gold: 800, title: "Gate Legend" } },
  { id: "str_20", name: "Krieger", icon: "💪", desc: "Erreiche STR 20", cat: "stats", check: s => (s.stats?.str || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "int_20", name: "Gelehrter", icon: "🧠", desc: "Erreiche INT 20", cat: "stats", check: s => (s.stats?.int || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "vit_20", name: "Eiserner Körper", icon: "🛡️", desc: "Erreiche VIT 20", cat: "stats", check: s => (s.stats?.vit || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "agi_20", name: "Blitzschnell", icon: "💨", desc: "Erreiche AGI 20", cat: "stats", check: s => (s.stats?.agi || 0) >= 20, reward: { xp: 150, gold: 75 } },
  { id: "all_stats_10", name: "Ausgewogener Hunter", icon: "⭐", desc: "Alle Stats auf 10", cat: "stats", check: s => Object.values(s.stats || {}).every(v => v >= 10), reward: { xp: 400, gold: 200 } },
  { id: "gold_1000", name: "Goldfieber", icon: "💰", desc: "Sammle insgesamt 1000 Gold", cat: "misc", check: s => (s.totalGoldEarned || 0) >= 1000, reward: { xp: 200, gold: 0 } },
  { id: "equip_first", name: "Ausgerüstet", icon: "🗡️", desc: "Equipe dein erstes Item", cat: "misc", check: s => Object.values(s.equipment?.slots || {}).some(v => v), reward: { xp: 100, gold: 50 } },
  { id: "story_ch1", name: "Erste Erweckung", icon: "📖", desc: "Schließe Kapitel 1 ab", cat: "story", check: s => (s.story?.completedChapters || []).includes("ch1"), reward: { xp: 100, gold: 50 } },
  { id: "story_arc1", name: "Der schwächste Hunter", icon: "🗡️", desc: "Schließe Arc 1 komplett ab", cat: "story", check: s => ["ch1", "ch2", "ch3"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 500, gold: 200, title: "Survivor" } },
  { id: "story_arise", name: "ARISE", icon: "🌑", desc: "Schließe das ARISE-Kapitel ab", cat: "story", check: s => (s.story?.completedChapters || []).includes("ch7"), reward: { xp: 800, gold: 400, title: "Shadow Master" } },
  { id: "story_arc3", name: "Der Schattenmonarch erwacht", icon: "👑", desc: "Schließe Arc 3 komplett ab", cat: "story", check: s => ["ch7", "ch8", "ch9"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 2000, gold: 1000 } },
  { id: "story_complete", name: "Shadow Monarch", icon: "☠️", desc: "Schließe die gesamte Story aus", cat: "story", check: s => ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10", "ch11", "ch12", "ch13", "ch14", "ch15", "ch16", "ch17", "ch18", "ch19", "ch20"].every(id => (s.story?.completedChapters || []).includes(id)), reward: { xp: 25000, gold: 10000, title: "Shadow Monarch" } },
  { id: "health_link", name: "Vitalität Gekoppelt", icon: "❤️", desc: "Synchronisiere zum ersten Mal Health Tracker Daten", cat: "misc", check: s => !!s.healthSyncDate, reward: { xp: 300, gold: 100 } },
  { id: "challenge_first", name: "Rookie Herausforderer", icon: "🎖️", desc: "Schließe deine erste Community/Weekly Challenge ab", cat: "quests", check: s => (s.completedChallenges || []).length >= 1, reward: { xp: 400, gold: 150 } },
  { id: "challenge_master", name: "Veteran der Gilde", icon: "🌍", desc: "Schließe 5 Challenges ab", cat: "quests", check: s => (s.completedChallenges || []).length >= 5, reward: { xp: 1500, gold: 600, title: "Guild Veteran" } },
  { id: "focus_10", name: "Tiefen Fokus", icon: "⏳", desc: "Nutze den Focus Mode für insgesamt 10 Sessions", cat: "streaks", check: s => (s.stats?.focusSessions || 0) >= 10, reward: { xp: 500, gold: 200 } },
  { id: "micro_100", name: "Drop-by-Drop", icon: "💧", desc: "Absolviere 100 Micro-Habit Taps", cat: "habits", check: s => (s.microHabits?.totalTaps || 0) >= 100, reward: { xp: 400, gold: 150 } },
];

// ─── SKILLS ───────────────────────────────────────────────────
const SKILLS = [
  { id: "power_strike", name: "Power Strike", icon: "⚔️", stat: "str", threshold: 10, desc: "+5% XP aus STR-Quests", effect: { type: "xp_bonus_cat", cat: "str", bonus: 0.05 } },
  { id: "berserker", name: "Berserker Instinct", icon: "🔥", stat: "str", threshold: 25, desc: "+15% XP aus Hard & Boss Quests", effect: { type: "xp_hard_bonus", bonus: 0.15 } },
  { id: "quick_learner", name: "Quick Learner", icon: "📖", stat: "int", threshold: 10, desc: "+5% XP aus INT-Quests", effect: { type: "xp_bonus_cat", cat: "int", bonus: 0.05 } },
  { id: "tactical_mind", name: "Tactical Mind", icon: "🧠", stat: "int", threshold: 25, desc: "+10% Dungeon Erfolgswahrscheinlichkeit", effect: { type: "dungeon_bonus", bonus: 10 } },
  { id: "resilience", name: "Resilience", icon: "🛡️", stat: "vit", threshold: 10, desc: "1 Tag Streak-Schutz", effect: { type: "streak_shield", days: 1 } },
  { id: "iron_will", name: "Iron Will", icon: "💪", stat: "vit", threshold: 25, desc: "+2 Tage Streak-Schutz", effect: { type: "streak_shield", days: 2 } },
  { id: "swift_fingers", name: "Swift Fingers", icon: "💨", stat: "agi", threshold: 10, desc: "+5% Gold aus allen Quests", effect: { type: "gold_bonus", bonus: 0.05 } },
  { id: "shadow_step", name: "Shadow Step", icon: "🌑", stat: "agi", threshold: 25, desc: "+10% Erfolg mit AGI-Strategie", effect: { type: "strat_bonus", strat: "agi", bonus: 10 } },
  { id: "presence", name: "Sovereign Presence", icon: "👥", stat: "cha", threshold: 10, desc: "+3% XP Bonus global", effect: { type: "xp_global", bonus: 0.03 } },
  { id: "cmd_aura", name: "Commanding Aura", icon: "👑", stat: "cha", threshold: 25, desc: "Schatten-Boss-Quests +30% XP", effect: { type: "shadow_xp", bonus: 0.30 } },
];

// ─── DUNGEON MODIFIERS ────────────────────────────────────────
const DUNGEON_MODIFIERS = [
  { id: "blood_moon", name: "Blood Moon", icon: "🌙", desc: "+50% XP, +15% Schwierigkeit", xpMult: 1.5, diffMod: 15, color: "#ef4444" },
  { id: "dense_mana", name: "Dense Mana", icon: "💜", desc: "INT-Strategien +20% Erfolg", intBonus: 20, color: "#a78bfa" },
  { id: "blessing", name: "Hunter's Bless", icon: "✨", desc: "+10% Erfolg für alle Gates", successBonus: 10, color: "#f59e0b" },
  { id: "shadow_surge", name: "Shadow Surge", icon: "🌑", desc: "Boss-Quest XP x2", shadowXpMult: 2.0, color: "#6366f1" },
  { id: "double_loot", name: "Double Loot", icon: "💰", desc: "+60% Gold aus Dungeons", goldMult: 1.6, color: "#22c55e" },
  { id: "none", name: "Stable Gates", icon: "🌀", desc: "Keine besonderen Bedingungen", color: "#64748b" },
];

// ─── SPRINT 3: DUNGEON ENHANCEMENTS ──────────────────────────

const FLOOR_TYPES = {
  combat: { name: "Combat", icon: "⚔️", color: "#ef4444", desc: "Gegner blockieren den Weg", safeRoom: false },
  elite: { name: "Elite", icon: "💀", color: "#a855f7", desc: "Mächtiger Elite-Gegner", safeRoom: false },
  puzzle: { name: "Puzzle", icon: "🔮", color: "#3b82f6", desc: "Magisches Rätsel – INT hilft", safeRoom: false },
  trap: { name: "Trap", icon: "⚡", color: "#f59e0b", desc: "Fallen-Korridor – AGI gefragt", safeRoom: false },
  safe_room: { name: "Safe Room", icon: "🏕️", color: "#22c55e", desc: "Erholungsraum – Heilt Ausdauer", safeRoom: true },
  treasure: { name: "Treasure", icon: "💰", color: "#fbbf24", desc: "Schatzkammer – Bonus-Gold", safeRoom: false },
  ambush: { name: "Ambush", icon: "🗡️", color: "#dc2626", desc: "Hinterhalt! Vorsicht geboten", safeRoom: false },
  boss_arena: { name: "Boss Arena", icon: "👑", color: "#e879f9", desc: "Endboss-Kammer", safeRoom: false },
};

const BOSS_PHASES = {
  E: [
    { phase: 1, name: "Awakening", hp: 100, desc: "Boss erwacht aus dem Schlaf", icon: "👹", atkMod: 1.0, color: "#6b7280" },
    { phase: 2, name: "Frenzy", hp: 50, desc: "Boss greift wild um sich!", icon: "😤", atkMod: 1.5, color: "#f59e0b" },
    { phase: 3, name: "Last Stand", hp: 20, desc: "Verzweifelte letzte Anstrengung", icon: "💀", atkMod: 2.0, color: "#ef4444" },
  ],
  D: [
    { phase: 1, name: "Dominant", hp: 100, desc: "Boss dominiert das Schlachtfeld", icon: "🏯", atkMod: 1.0, color: "#22d3ee" },
    { phase: 2, name: "Berserker", hp: 60, desc: "Boss verfällt in den Berserkermodus!", icon: "🔥", atkMod: 1.6, color: "#f59e0b" },
    { phase: 3, name: "Death's Door", hp: 25, desc: "Boss kämpft ums Überleben!", icon: "☠️", atkMod: 2.2, color: "#ef4444" },
  ],
  C: [
    { phase: 1, name: "Composed", hp: 100, desc: "Boss bleibt kalkulierend", icon: "❄️", atkMod: 1.0, color: "#34d399" },
    { phase: 2, name: "Unleashed", hp: 65, desc: "Boss entfesselt versteckte Macht!", icon: "💥", atkMod: 1.7, color: "#a78bfa" },
    { phase: 3, name: "Omega Form", hp: 30, desc: "Boss erreicht seine ultimative Form!", icon: "🌌", atkMod: 2.5, color: "#e879f9" },
  ],
  B: [
    { phase: 1, name: "Sovereign", hp: 100, desc: "Boss regiert das Schlachtfeld", icon: "🐉", atkMod: 1.2, color: "#a78bfa" },
    { phase: 2, name: "Ascended", hp: 70, desc: "Boss steigt auf eine höhere Ebene!", icon: "🌑", atkMod: 1.9, color: "#6366f1" },
    { phase: 3, name: "True Form", hp: 35, desc: "Boss enthüllt seine wahre Gestalt!", icon: "👁️", atkMod: 2.8, color: "#ef4444" },
  ],
  A: [
    { phase: 1, name: "Majestic", hp: 100, desc: "Boss demonstriert überwältigende Macht", icon: "🏰", atkMod: 1.3, color: "#f59e0b" },
    { phase: 2, name: "Catastrophic", hp: 70, desc: "Katastrophale Energie entweicht!", icon: "⚡", atkMod: 2.1, color: "#dc2626" },
    { phase: 3, name: "Calamity", hp: 40, desc: "Katastrophenform aktiviert!", icon: "🌪️", atkMod: 3.0, color: "#e879f9" },
  ],
  S: [
    { phase: 1, name: "Monarch", hp: 100, desc: "Ein Monarch betritt das Feld", icon: "👑", atkMod: 1.5, color: "#e879f9" },
    { phase: 2, name: "Transcendent", hp: 75, desc: "Transzendiert Zeit und Raum!", icon: "🌌", atkMod: 2.5, color: "#f59e0b" },
    { phase: 3, name: "World Ender", hp: 45, desc: "Die Welt bebt – Alles oder Nichts!", icon: "💀", atkMod: 4.0, color: "#ef4444" },
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

// ─── SPRINT 2: QUEST SYSTEM 2.0 ──────────────────────────────

const QUEST_TYPES_CONFIG = {
  side: { label: "Side", color: "#a78bfa", icon: "📋", xpMult: 1.0, goldMult: 1.0 },
  daily: { label: "Daily", color: "#22d3ee", icon: "📅", xpMult: 1.2, goldMult: 1.2 },
  weekly: { label: "Weekly", color: "#8b5cf6", icon: "📆", xpMult: 2.0, goldMult: 2.0 },
  emergency: { label: "Emergency", color: "#ef4444", icon: "🚨", xpMult: 2.5, goldMult: 2.5 },
  chained: { label: "Chained", color: "#f59e0b", icon: "⛓️", xpMult: 1.0, goldMult: 1.0 },
  hidden: { label: "Hidden", color: "#6366f1", icon: "❓", xpMult: 3.0, goldMult: 3.0 },
};

const HIDDEN_QUESTS = [
  {
    id: "hq_shadow_whisper",
    title: "Shadow's Whisper",
    desc: "Du hörst eine Stimme im Dunkeln...",
    category: "cha", difficulty: "hard",
    triggerCondition: { type: "shadow_count", value: 3 },
    discoveryMsg: "Die Stimmen der Gefallenen sprechen zu dir.",
    reward: { xpMult: 3, goldMult: 3 },
  },
  {
    id: "hq_thousand_cuts",
    title: "A Thousand Cuts",
    desc: "Kleine Siege führen zum großen Sieg.",
    category: "agi", difficulty: "normal",
    triggerCondition: { type: "total_quests", value: 10 },
    discoveryMsg: "Deine Ausdauer hat eine verborgene Quest enthüllt.",
    reward: { xpMult: 3, goldMult: 2 },
  },
  {
    id: "hq_iron_resolve",
    title: "Iron Resolve",
    desc: "Dein Wille ist stärker als jede Mauer.",
    category: "vit", difficulty: "hard",
    triggerCondition: { type: "streak", value: 5 },
    discoveryMsg: "Ein Streak von 5 Tagen hat eine verborgene Quest freigeschaltet!",
    reward: { xpMult: 3, goldMult: 3 },
  },
  {
    id: "hq_mind_palace",
    title: "Mind Palace",
    desc: "Die Stille zwischen den Gedanken ist Kraft.",
    category: "int", difficulty: "hard",
    triggerCondition: { type: "stat_value", stat: "int", value: 20 },
    discoveryMsg: "Dein Intellekt hat eine verborgene Kammer geöffnet.",
    reward: { xpMult: 4, goldMult: 2 },
  },
  {
    id: "hq_berserker_trial",
    title: "Berserker's Trial",
    desc: "Kämpfe bis zur letzten Kraft.",
    category: "str", difficulty: "boss",
    triggerCondition: { type: "stat_value", stat: "str", value: 25 },
    discoveryMsg: "Eine legendäre Prüfung erwartet dich.",
    reward: { xpMult: 5, goldMult: 4 },
  },
];

// Check which hidden quests should be triggered
function checkHiddenQuestTriggers(state) {
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

// Generate the daily emergency quest (resets each day)
function generateEmergencyQuest(playerLevel) {
  const templates = [
    {
      title: "NOTFALL: Körperlicher Einsatz", category: "str", difficulty: "hard",
      desc: "Das System verlangt sofortige Bewegung. Mache sofort 20 Liegestütze oder 30 Kniebeugen!"
    },
    {
      title: "NOTFALL: Geistiger Fokus", category: "int", difficulty: "hard",
      desc: "Stoppe alles Ablenkende. Lese 15 Minuten konzentriert oder meditiere, ohne Smartphone."
    },
    {
      title: "NOTFALL: Dehydrations-Warnung", category: "vit", difficulty: "hard",
      desc: "VIT-Stats sinken! Trinke als Sofortmaßnahme 1 Liter Wasser."
    },
    {
      title: "NOTFALL: Umgebungswechsel", category: "agi", difficulty: "hard",
      desc: "Sauerstoff-Mangel! Verlasse das aktuelle Gebiet sofort für 10 Minuten (frische Luft)."
    },
    {
      title: "NOTFALL: Soziale Direktive", category: "cha", difficulty: "normal",
      desc: "Verbindung zu Fragmenten herstellen: Melde dich bei jemandem, mit dem du länger nicht gesprochen hast."
    },
  ];
  const seed = parseInt(getToday().replace(/-/g, "")) % templates.length;
  const tmpl = templates[seed];
  const expires = new Date(); expires.setHours(23, 59, 59, 999);
  return {
    id: `emergency_${getToday()}`,
    ...tmpl,
    type: "emergency",
    timeLimit: expires.toISOString(),
    xpMult: 2.5, goldMult: 2.5,
    createdAt: getToday(),
    systemMessage: "NOTFALL-QUEST DETEKTIERT. Sofortiges Handeln erforderlich.",
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
  { id: "iron_dagger", slot: "weapon", name: "Iron Dagger", rarity: "common", icon: "🗡️", ranks: ["E"], bonus: { xpBonus: 0.03 }, desc: "+3% XP" },
  { id: "hunters_blade", slot: "weapon", name: "Hunter's Blade", rarity: "uncommon", icon: "⚔️", ranks: ["D"], bonus: { xpBonus: 0.06 }, desc: "+6% XP" },
  { id: "shadow_sword", slot: "weapon", name: "Shadow Sword", rarity: "rare", icon: "🌑", ranks: ["C"], bonus: { xpBonus: 0.10, goldBonus: 0.05 }, desc: "+10% XP, +5% Gold" },
  { id: "void_blade", slot: "weapon", name: "Void Blade", rarity: "epic", icon: "💜", ranks: ["B"], bonus: { xpBonus: 0.15, strBonus: 5 }, desc: "+15% XP, +5 STR" },
  { id: "demon_king_blade", slot: "weapon", name: "Demon King's Blade", rarity: "legendary", icon: "🔱", ranks: ["A", "S"], bonus: { xpBonus: 0.25, strBonus: 10, goldBonus: 0.10 }, desc: "+25% XP, +10 STR, +10% Gold" },
  { id: "leather_armor", slot: "armor", name: "Leather Armor", rarity: "common", icon: "🧥", ranks: ["E"], bonus: { streakShield: 1 }, desc: "+1 Streak-Schutz" },
  { id: "hunters_coat", slot: "armor", name: "Hunter's Coat", rarity: "uncommon", icon: "🥋", ranks: ["D"], bonus: { streakShield: 1, dungeonBonus: 5 }, desc: "+1 Schutz, +5% Dungeon" },
  { id: "shadow_armor", slot: "armor", name: "Shadow Armor", rarity: "rare", icon: "🛡️", ranks: ["C"], bonus: { streakShield: 2, dungeonBonus: 8 }, desc: "+2 Schutz, +8% Dungeon" },
  { id: "void_plate", slot: "armor", name: "Void Plate", rarity: "epic", icon: "💠", ranks: ["B"], bonus: { streakShield: 3, dungeonBonus: 12, vitBonus: 5 }, desc: "+3 Schutz, +12% Dungeon, +5 VIT" },
  { id: "monarch_robes", slot: "armor", name: "Monarch's Robes", rarity: "legendary", icon: "👑", ranks: ["A", "S"], bonus: { streakShield: 5, dungeonBonus: 20, vitBonus: 10 }, desc: "+5 Schutz, +20% Dungeon, +10 VIT" },
  { id: "copper_ring", slot: "ring", name: "Copper Ring", rarity: "common", icon: "💍", ranks: ["E", "D"], bonus: { goldBonus: 0.05 }, desc: "+5% Gold" },
  { id: "mana_ring", slot: "ring", name: "Mana Ring", rarity: "uncommon", icon: "🔮", ranks: ["C"], bonus: { xpBonus: 0.05, intBonus: 3 }, desc: "+5% XP, +3 INT" },
  { id: "shadow_ring", slot: "ring", name: "Shadow Ring", rarity: "rare", icon: "🌀", ranks: ["B"], bonus: { xpBonus: 0.08, goldBonus: 0.08, agiBonus: 3 }, desc: "+8% XP+Gold, +3 AGI" },
  { id: "monarch_signet", slot: "ring", name: "Monarch's Signet", rarity: "legendary", icon: "💎", ranks: ["S"], bonus: { xpBonus: 0.15, goldBonus: 0.15, chaBonus: 10 }, desc: "+15% XP+Gold, +10 CHA" },
];

const RARITY_COLORS = { common: "#6b7280", uncommon: "#22c55e", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b" };
const RARITY_LABELS = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary" };

// ─── DUNGEONS ─────────────────────────────────────────────────
const DUNGEON_TEMPLATES = [
  { id: "goblin_lair", name: "Goblin Lair", desc: "Verseuchte Höhle voller Goblins", rank: "E", requirements: { str: 5 }, primaryStat: "str", xp: 200, gold: 150, icon: "👺", floors: 2 },
  { id: "cursed_forest", name: "Cursed Forest", desc: "Magische Fallen im dunklen Wald", rank: "E", requirements: { int: 5 }, primaryStat: "int", xp: 180, gold: 140, icon: "🌲", floors: 2 },
  { id: "dark_cave", name: "Dark Cave", desc: "Untote in verlassenen Minen", rank: "E", requirements: { vit: 5 }, primaryStat: "vit", xp: 190, gold: 145, icon: "🦇", floors: 2 },
  { id: "rat_den", name: "Rat King's Den", desc: "Riesige Ratten und ihr König", rank: "E", requirements: { agi: 5 }, primaryStat: "agi", xp: 170, gold: 135, icon: "🐀", floors: 2 },
  { id: "library_ruin", name: "Library Ruin", desc: "Ruinen einer alten Bibliothek", rank: "D", requirements: { int: 15, agi: 8 }, primaryStat: "int", xp: 400, gold: 400, icon: "📚", floors: 3 },
  { id: "iron_fortress", name: "Iron Fortress", desc: "Stahlharte Festung mit Golem-Wächtern", rank: "D", requirements: { str: 12, vit: 10 }, primaryStat: "str", xp: 420, gold: 450, icon: "⚙️", floors: 3 },
  { id: "shadow_cave", name: "Shadow Cave", desc: "Schattenwesen lauern im Dunkeln", rank: "D", requirements: { agi: 12, int: 10 }, primaryStat: "agi", xp: 380, gold: 350, icon: "🌑", floors: 3 },
  { id: "ice_palace", name: "Ice Palace", desc: "Eisiger Palast des Winterkönigs", rank: "C", requirements: { vit: 25, str: 20 }, primaryStat: "vit", xp: 800, gold: 1000, icon: "❄️", floors: 4 },
  { id: "thunder_gate", name: "Thunder Gate", desc: "Portal durchzogen von Blitzen", rank: "C", requirements: { agi: 25, int: 15 }, primaryStat: "agi", xp: 850, gold: 1200, icon: "⚡", floors: 4 },
  { id: "blood_altar", name: "Blood Altar", desc: "Verfluchter Altar des Dämonenfürsten", rank: "C", requirements: { str: 30, cha: 15 }, primaryStat: "str", xp: 900, gold: 1500, icon: "🩸", floors: 4 },
  { id: "dragon_nest", name: "Dragon Nest", desc: "Nest des uralten Drachen Verthaxis", rank: "B", requirements: { str: 40, vit: 35, int: 25 }, primaryStat: "str", xp: 1500, gold: 4000, icon: "🐉", floors: 5 },
  { id: "void_rift", name: "Void Rift", desc: "Riss in der Realität", rank: "B", requirements: { int: 40, agi: 35 }, primaryStat: "int", xp: 1600, gold: 4500, icon: "🌀", floors: 5 },
  { id: "shadow_castle", name: "Shadow Castle", desc: "Festung des Schattenkönigs", rank: "A", requirements: { str: 60, int: 55, vit: 50, agi: 45 }, primaryStat: "str", xp: 3000, gold: 10000, icon: "🏰", floors: 7 },
  { id: "monarchs_domain", name: "Monarch's Domain", desc: "Reich eines ursprünglichen Monarchen", rank: "S", requirements: { str: 90, int: 85, vit: 80, agi: 75, cha: 70 }, primaryStat: "str", xp: 6000, gold: 25000, icon: "👑", floors: 10 },
];

const SHOP_ITEMS = [
  { id: "extra_slot", type: "consumable", name: "Extra Task Slot", cost: 100, minRank: "E", desc: "+1 Tagesaufgabe heute" },
  { id: "title_shadow_monarch", type: "title", name: "Shadow Monarch", cost: 500, minRank: "D", desc: "Der König der Schatten" },
  { id: "title_arise", type: "title", name: "ARISE!", cost: 300, minRank: "D", desc: "Erwecke deine Armee" },
  { id: "title_s_hunter", type: "title", name: "S-Rank Hunter", cost: 1000, minRank: "B", desc: "Elite unter den Jägern" },
  { id: "title_sovereign", type: "title", name: "Sovereign", cost: 2000, minRank: "A", desc: "Herrscher über alles" },
  { id: "theme_crimson", type: "theme", name: "Crimson Gate", cost: 400, minRank: "D", desc: "Rotes Portal-Theme", themeKey: "crimson" },
  { id: "theme_shadow", type: "theme", name: "Shadow Realm", cost: 600, minRank: "C", desc: "Reich der Schatten", themeKey: "shadow" },
  { id: "theme_ice", type: "theme", name: "Ice Monarch", cost: 800, minRank: "B", desc: "Eisiger Monarch", themeKey: "ice" },
  { id: "theme_golden", type: "theme", name: "Ruler's Authority", cost: 1200, minRank: "A", desc: "Goldene Macht", themeKey: "golden" },
];

const THEMES = {
  default: { primary: "#22d3ee", secondary: "#a855f7", glow: "rgba(34,211,238,0.35)", accent: "#67e8f9", bg: "#06060e", card: "rgba(10,10,22,0.88)", surface: "rgba(16,16,36,0.6)" },
  crimson: { primary: "#dc2626", secondary: "#991b1b", glow: "rgba(220,38,38,0.35)", accent: "#fca5a5", bg: "#0a0808", card: "rgba(24,12,12,0.85)", surface: "rgba(40,20,20,0.6)" },
  shadow: { primary: "#6366f1", secondary: "#4338ca", glow: "rgba(99,102,241,0.35)", accent: "#a5b4fc", bg: "#06060f", card: "rgba(10,10,28,0.85)", surface: "rgba(18,18,42,0.6)" },
  ice: { primary: "#06b6d4", secondary: "#0891b2", glow: "rgba(6,182,212,0.35)", accent: "#a5f3fc", bg: "#060a0f", card: "rgba(10,16,28,0.85)", surface: "rgba(16,24,42,0.6)" },
  golden: { primary: "#d97706", secondary: "#b45309", glow: "rgba(217,119,6,0.35)", accent: "#fde68a", bg: "#0a0806", card: "rgba(24,20,12,0.85)", surface: "rgba(40,32,18,0.6)" },
};

const DEFAULT_STATE = {
  hunterName: "", level: 1, xp: 0, gold: 0, totalGoldEarned: 0,
  tutorialCompleted: false,
  stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 },
  statPoints: 0,
  quests: [], completedQuests: [], streak: 0, lastActiveDate: null, lastWelcomeDate: null,
  shopPurchases: [], selectedTheme: "default", selectedTitle: "",
  shadowArmy: { shadows: [], capacity: 20, formations: { vanguard: [], core: [], rearguard: [] }, totalShadowXp: 0 },
  totalXpEarned: 0, totalQuestsCompleted: 0,
  dailyUserQuestsCreated: 0, extraDailySlots: 0,
  dungeons: [], lastDungeonRefresh: null, dungeonHistory: [],
  achievements: { unlocked: [], notified: [] },
  skills: { unlocked: [] },
  equipment: { slots: { weapon: null, armor: null, ring1: null, ring2: null }, inventory: [] },
  penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 },
  todayModifier: null,
  emergencyQuest: null,      // today's emergency quest object (or null)
  emergencyDone: false,      // completed today?
  emergencyFailed: false,    // failed today (penalty active)?
  goals: [],                 // Overarching goals with milestones
  habits: [],                // recurring habit tracking objects
  microHabits: { habits: null, daily: {} }, // micro-habit tap counters
  hiddenQuests: { discovered: [], completed: [] },
  weeklyQuestReset: null,    // ISO date of last weekly reset
  lastSystemTaskTime: null,  // timestamp for periodic pool quests
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
  },
  story: {
    completedChapters: [],  // Array von chapter IDs z.B. ["ch1", "ch2"]
    completedArcs: [],       // Array von arc IDs z.B. ["arc1"]
    totalStoryXp: 0,
  },
  multiplayer: {
    activeRaid: null,
    guild: null,
    social: null,
    publicStats: { totalXp: 0, dungeonsCleared: 0 }
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
const getRank = (lv) => RANKS.find(r => lv >= r.minLv && lv <= r.maxLv) || RANKS[0];
const getXpForLevel = (lv) => getRank(lv).xpPerLv;
const getRankIndex = (n) => RANKS.findIndex(r => r.name === n);
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const getToday = () => new Date().toISOString().slice(0, 10);

function getDailyModifier() {
  const seed = parseInt(getToday().replace(/-/g, "")) % DUNGEON_MODIFIERS.length;
  return DUNGEON_MODIFIERS[seed];
}
function calcPowerLevel(stats, level) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return Math.round(total * (1 + level * 0.08));
}
function getEquipBonuses(equipment) {
  const bonuses = { xpBonus: 0, goldBonus: 0, dungeonBonus: 0, streakShield: 0, strBonus: 0, intBonus: 0, vitBonus: 0, agiBonus: 0, chaBonus: 0 };
  if (!equipment?.slots) return bonuses;
  Object.values(equipment.slots).forEach(item => {
    if (!item) return;
    Object.entries(item.bonus || {}).forEach(([k, v]) => { bonuses[k] = (bonuses[k] || 0) + v; });
  });
  return bonuses;
}
function checkSkillUnlocks(stats) { return SKILLS.filter(sk => (stats[sk.stat] || 0) >= sk.threshold); }
function getSkillBonuses(skills, stats) {
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
function checkAchievements(state) {
  const unlocked = state.achievements?.unlocked || [];
  const newOnes = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    try { if (ach.check(state)) newOnes.push(ach); } catch { }
  }
  return newOnes;
}
function generateDungeons(playerRankName) {
  const rankIdx = getRankIndex(playerRankName);
  const pool = DUNGEON_TEMPLATES.filter(d => {
    const dIdx = getRankIndex(d.rank);
    return dIdx >= Math.max(0, rankIdx - 1) && dIdx <= Math.min(RANKS.length - 1, rankIdx + 1);
  });
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return shuffled.slice(0, 3).map(d => ({ ...d, instanceId: genId(), cleared: false, expiresAt: expires }));
}

function generateDailySystemQuests(count = 3) {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => ({
    ...q,
    id: `sys_${genId()}`,
    type: "daily",
    isSystem: true,
    createdAt: getToday()
  }));
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

function calcSuccessChance(dungeon, stats, stratKey, skillBonuses, modifier, formationBonus, jobBonuses = {}, playerLevel = 1) {
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

  // Job Strategy Bonus
  chance += (jobBonuses.stratBonus?.[stratKey] || 0);

  // Job Dungeon Bonus
  chance += (jobBonuses.dungeonBonus || 0);

  // Fortress Active (Guardian)
  if (jobBonuses.fortressActive) {
    return 100; // Garantierter Erfolg
  }

  let maxChance = 85;
  const dungeonRankIdx = getRankIndex(dungeon.rank);
  const playerRankIdx = getRankIndex(getRank(playerLevel).name);
  const rankDiff = playerRankIdx - dungeonRankIdx;

  if (rankDiff >= 3) {
    maxChance = 100; // Overleveled
  } else if (rankDiff === 2) {
    maxChance = 95;
  } else if (rankDiff === 1) {
    maxChance = 90;
  }

  return Math.max(10, Math.min(maxChance, Math.round(chance)));
}
function getEquipDropForDungeon(dungeonRank) {
  if (Math.random() > 0.40) return null;
  const pool = EQUIPMENT_POOL.filter(e => e.ranks.includes(dungeonRank));
  if (!pool.length) return null;
  return { ...pool[Math.floor(Math.random() * pool.length)], instanceId: genId() };
}
function hoursUntilMidnight() {
  const now = new Date(), midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 3600000);
}

// ─── DATA MIGRATION ───────────────────────────────────────────
function migrateState(oldState) {
  if (!oldState) return null;

  // Start with DEFAULT_STATE and merge top-level properties
  const s = { ...DEFAULT_STATE, ...oldState };
  s.level = Math.max(1, s.level || 1);
  s.xp = s.xp || 0;

  // Deep-merge critical nested objects
  s.stats = { ...DEFAULT_STATE.stats, ...(oldState.stats || {}) };
  s.shadowArmy = { ...DEFAULT_STATE.shadowArmy, ...(oldState.shadowArmy || {}) };
  s.jobs = { ...DEFAULT_STATE.jobs, ...(oldState.jobs || {}) };
  if (oldState.jobs) {
    s.jobs.levels = { ...DEFAULT_STATE.jobs.levels, ...(oldState.jobs.levels || {}) };
    s.jobs.xp = { ...DEFAULT_STATE.jobs.xp, ...(oldState.jobs.xp || {}) };
    s.jobs.activeAbilityCooldowns = { ...DEFAULT_STATE.jobs.activeAbilityCooldowns, ...(oldState.jobs.activeAbilityCooldowns || {}) };
  }
  s.equipment = { ...DEFAULT_STATE.equipment, ...(oldState.equipment || {}) };
  if (oldState.equipment) {
    s.equipment.slots = { ...DEFAULT_STATE.equipment.slots, ...(oldState.equipment.slots || {}) };
  }
  s.achievements = { ...DEFAULT_STATE.achievements, ...(oldState.achievements || {}) };
  s.hiddenQuests = { ...DEFAULT_STATE.hiddenQuests, ...(oldState.hiddenQuests || {}) };
  s.story = { ...DEFAULT_STATE.story, ...(oldState.story || {}) };

  // V4 → V5 Legacy: convert shadows to shadowArmy
  if (!oldState.shadowArmy && oldState.shadows) {
    const newShadows = (oldState.shadows || []).map(sh => ({
      id: sh.id || genId(),
      name: sh.name,
      originalSource: sh.name,
      sourceDate: sh.date || getToday(),
      class: "soldier", tier: 1, isNamed: false,
      level: 1, xp: 0, xpToNext: calcShadowXpToNext(1),
      stats: { power: 10, speed: 10, loyalty: 10, presence: 5 },
      abilities: [], isDeployed: false, deploymentSlot: null,
      evolutionStage: 1, glowColor: "#64748b",
      summonsCount: 1, dungeonsCleared: 0, totalXpGenerated: 0,
    }));
    s.shadowArmy = { shadows: newShadows, capacity: 20, formations: { vanguard: [], core: [], rearguard: [] }, totalShadowXp: 0 };
  }

  return s;
}

// ─── STORAGE ──────────────────────────────────────────────────
async function loadState() {
  try {
    // 1. Try Firestore if logged in
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("System: Cloud-Daten geladen.");
        return migrateState(docSnap.data());
      }
    }
    // 2. Fallback to LocalStorage
    let r = await window.storage.get("sl-todo-v5");
    if (!r) r = await window.storage.get("sl-todo-v4");
    if (r) {
      const s = migrateState(JSON.parse(r.value));
      if (s && user) {
        saveState(s);
      }
      return s;
    }
    return null;
  } catch (e) {
    console.error("System: Ladefehler:", e);
    return null;
  }
}

async function saveState(s) {
  try {
    // 1. Save to LocalStorage (Always)
    await window.storage.set("sl-todo-v5", JSON.stringify(s));

    // 2. Save to Cloud if logged in
    const user = auth.currentUser;
    if (user && s) {
      const docRef = doc(db, "users", user.uid);
      // We don't want to save temporary UI state like _abilityActivated
      const { _abilityActivated, _jobLevelUp, ...persistenceState } = s;
      const cleanState = JSON.parse(JSON.stringify(persistenceState));

      if (user.email) cleanState.email = user.email;
      if (user.displayName || cleanState.hunterName) {
        cleanState.displayName = user.displayName || cleanState.hunterName;
      }

      await setDoc(docRef, cleanState, { merge: true });
    }
  } catch (e) {
    console.error("System: Speicherfehler:", e);
  }
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

@media (max-width: 440px) {
  .header-hide-mobile { display: none !important; }
  .header-compact { gap: 4px !important; }
  .stat-item-compact { padding: 4px 6px !important; }
  .stat-value-compact { fontSize: 10px !important; }
}
`;

// ─── PARTICLES ────────────────────────────────────────────────
function ParticleField({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let anim;
    const resize = () => { c.width = c.offsetWidth * 1.5; c.height = c.offsetHeight * 1.5; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 40 }, () => ({ x: Math.random() * 1000, y: Math.random() * 1000, r: Math.random() * 1.5 + 0.3, dx: (Math.random() - 0.5) * 0.2, dy: -Math.random() * 0.4 - 0.05, a: Math.random() * 0.6 + 0.15, phase: Math.random() * Math.PI * 2 }));
    let t = 0;
    function draw() {
      t += 0.01; ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        const f = 0.5 + 0.5 * Math.sin(t * 2 + p.phase);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.8 + 0.4 * f), 0, Math.PI * 2);
        ctx.fillStyle = theme.accent + Math.round(p.a * f * 255).toString(16).padStart(2, "0");
        ctx.shadowColor = theme.primary; ctx.shadowBlur = 6 * f; ctx.fill(); ctx.shadowBlur = 0;
        p.x += p.dx + Math.sin(t + p.phase) * 0.15; p.y += p.dy;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10 || p.x > c.width + 10) p.x = Math.random() * c.width;
      }
      anim = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", resize); };
  }, [theme]);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.7 }} />;
}


// ─── MUSIC PLAYER ─────────────────────────────────────────────
function MusicPlayer({ play, volume = 0.3 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (play) {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked or audio error:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [play, volume]);

  return (
    <audio
      ref={audioRef}
      src="/Solo Grind.mp3"
      loop
      style={{ display: "none" }}
    />
  );
}

// ─── SYSTEM NOTIFICATION ──────────────────────────────────────

function SystemNotification({ message, type = "info", onDone }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t1 = setTimeout(() => setExiting(true), 2400); const t2 = setTimeout(onDone, 2800); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [onDone]);
  const colors = { info: "#4f6ef7", success: "#22c55e", gold: "#f59e0b", xp: "#a78bfa", levelup: "#e879f9", dungeon: "#22d3ee", defeat: "#ef4444", achievement: "#f59e0b", skill: "#22d3ee", penalty: "#ef4444", shadow: "#7c3aed", named: "#f59e0b" };
  const c = colors[type] || colors.info;
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 200, animation: exiting ? "sysNotifOut 0.4s ease forwards" : "sysNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none", width: "calc(100% - 32px)", maxWidth: 420 }}>
      <div style={{ background: "linear-gradient(135deg,rgba(8,8,16,0.97),rgba(16,12,28,0.97))", border: `1px solid ${c}55`, borderLeft: `3px solid ${c}`, borderRadius: 12, padding: "12px 18px", backdropFilter: "blur(16px)", boxShadow: `0 8px 32px rgba(0,0,0,0.6),0 0 20px ${c}22`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, animation: "breathe 1.5s infinite", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: c, marginBottom: 2, fontFamily: "'JetBrains Mono',monospace" }}>SYSTEM</div>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, lineHeight: 1.4 }}>{message}</div>
        </div>
      </div>
    </div>
  );
}

// ─── ACHIEVEMENT TOAST ────────────────────────────────────────
function AchievementToast({ achievement, onDone }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t1 = setTimeout(() => setExiting(true), 3500); const t2 = setTimeout(onDone, 4000); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 110, right: 16, zIndex: 210, maxWidth: 280, animation: exiting ? "achIn 4s ease forwards reverse" : "achIn 4s ease forwards" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(12,10,22,0.97),rgba(24,20,10,0.97))", border: "1px solid #f59e0b44", borderLeft: "3px solid #f59e0b", borderRadius: 12, padding: "12px 14px", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(245,158,11,0.15)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>ACHIEVEMENT UNLOCKED</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 26 }}>{achievement.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fde68a", fontFamily: "'Cinzel',serif" }}>{achievement.name}</div>
            <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>{achievement.desc}</div>
            {achievement.reward.xp > 0 && <div style={{ fontSize: 10, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>+{achievement.reward.xp} XP · +{achievement.reward.gold} G</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── XP FLOAT ─────────────────────────────────────────────────
function XpFloat({ x, y, xp, gold }) {
  return (
    <div style={{ position: "fixed", left: x, top: y, zIndex: 300, pointerEvents: "none", animation: "floatUp 1.2s ease-out forwards" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa", fontFamily: "'Cinzel',serif", textShadow: "0 0 12px rgba(167,139,250,0.6)", whiteSpace: "nowrap" }}>+{xp} XP</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>+{gold} G</div>
    </div>
  );
}

// ─── LEVEL UP ─────────────────────────────────────────────────
function LevelUpCinematic({ levelData, rank, oldRank, onClose }) {
  const level = levelData?.level || levelData;
  const earnedPoints = levelData?.earnedPoints || 0;
  const isRankUp = oldRank && oldRank.name !== rank.name;
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: "levelUpBg 4s ease forwards", background: "rgba(0,0,0,0.93)" }}>
      <div style={{ position: "absolute", width: 500, height: 500, background: `conic-gradient(from 0deg,transparent,${rank.color}08,transparent,${rank.color}05,transparent)`, animation: "levelUpRays 8s linear infinite", borderRadius: "50%" }} />
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: `2px solid ${rank.color}44`, animation: "ringExpand 1.5s ease-out forwards" }} />
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: rank.color, fontFamily: "'JetBrains Mono',monospace", animation: "levelUpText 1.2s ease-out forwards", marginBottom: 12, opacity: 0 }}>{isRankUp ? "RANK UP" : "LEVEL UP"}</div>
        <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 60px ${rank.color},0 0 120px ${rank.color}66`, animation: "levelUpText 1s ease-out 0.15s forwards", opacity: 0, lineHeight: 1 }}>{level}</div>
        <div style={{ fontSize: 18, color: rank.color, fontFamily: "'Cinzel',serif", letterSpacing: 4, animation: "levelUpRank 1.8s ease-out forwards", opacity: 0, marginTop: 12, textShadow: `0 0 20px ${rank.glow}` }}>{rank.label}</div>
        {earnedPoints > 0 && <div style={{ fontSize: 15, color: "#fff", fontFamily: "'JetBrains Mono',monospace", marginTop: 18, animation: "levelUpRank 2s ease-out forwards", opacity: 0 }}>+ {earnedPoints} Stat-Punkte</div>}
        {isRankUp && <div style={{ marginTop: 20, padding: "8px 24px", borderRadius: 20, background: `linear-gradient(135deg,${rank.color}22,${rank.color}11)`, border: `1px solid ${rank.color}44`, fontSize: 12, color: rank.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, animation: "levelUpRank 2s ease-out forwards", opacity: 0 }}>★ NEW RANK ACHIEVED ★</div>}
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

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2400),
      setTimeout(() => setPhase(5), 3200),
      setTimeout(onClose, isNamed ? 6000 : 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onClose, isNamed]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 998, background: isNamed ? "rgba(1,0,4,0.98)" : "rgba(2,0,8,0.97)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: "fadeIn 0.4s" }}>
      {/* Named shadow: rotating monarch rays */}
      {isNamed && phase >= 1 && (
        <div style={{ position: "absolute", width: 600, height: 600, background: `conic-gradient(from 0deg,transparent,${glowColor}06,transparent,${glowColor}04,transparent)`, animation: "monarchRays 12s linear infinite", borderRadius: "50%" }} />
      )}
      {/* Ground crack */}
      {phase >= 1 && <div style={{ position: "absolute", bottom: "28%", left: "15%", right: "15%", height: isNamed ? 3 : 2, background: `linear-gradient(90deg,transparent,${glowColor},transparent)`, animation: "ariseGround 1s ease-out forwards", transformOrigin: "center" }} />}
      {/* Secondary cracks for named */}
      {isNamed && phase >= 1 && <div style={{ position: "absolute", bottom: "27%", left: "30%", right: "30%", height: 1, background: `linear-gradient(90deg,transparent,${glowColor}88,transparent)`, animation: "ariseGround 1.2s ease-out 0.1s forwards", transformOrigin: "center" }} />}
      {/* Energy pillar */}
      {phase >= 2 && (
        <div style={{ position: "absolute", bottom: "28%", left: "50%", transform: "translateX(-50%)", width: isNamed ? 120 : 80, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
          <div style={{ width: isNamed ? 4 : 3, background: `linear-gradient(0deg,transparent,${glowColor},${glowColor}aa)`, animation: "ariseEnergy 1.2s ease-out forwards", height: 0, transformOrigin: "bottom" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center bottom,${glowColor}${isNamed ? "55" : "33"},transparent)`, animation: "ariseEnergy 1.2s ease-out forwards" }} />
        </div>
      )}
      {/* ARISE text */}
      {phase >= 2 && (
        <div style={{ position: "absolute", top: "18%", textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: isNamed ? 60 : 52, fontWeight: 900, color: glowColor, fontFamily: "'Cinzel',serif", animation: `ariseText 1s ease-out forwards,ariseGlow 2s ease-in-out 1s infinite`, opacity: 0, letterSpacing: 2, ["--glow-color"]: glowColor }}>ARISE</div>
          {isNamed && phase >= 3 && <div style={{ fontSize: 11, letterSpacing: 6, color: glowColor + "aa", fontFamily: "'JetBrains Mono',monospace", marginTop: 8, animation: "fadeIn 0.6s both" }}>NAMED SHADOW AWAKENED</div>}
        </div>
      )}
      {/* Shadow figure */}
      {phase >= 3 && (
        <div style={{ textAlign: "center", animation: "ariseShadow 1s cubic-bezier(0.34,1.56,0.64,1) forwards", opacity: 0 }}>
          {isNamed ? (
            <div style={{ fontSize: 100, animation: "namedGlow 2s ease-in-out infinite", ["--named-color"]: glowColor }}>{shadow.icon}</div>
          ) : (
            <div style={{ fontSize: 100, filter: `brightness(0.15) saturate(200%) sepia(100%) hue-rotate(${shadow?.class === "knight" ? 200 : shadow?.class === "mage" ? 280 : shadow?.class === "assassin" ? 120 : shadow?.class === "healer" ? 160 : 220}deg) brightness(0.8)`, textShadow: `0 0 40px ${glowColor}` }}>👤</div>
          )}
          {phase >= 4 && (
            <div style={{ animation: "fadeIn 0.6s both" }}>
              <div style={{ fontSize: isNamed ? 18 : 16, fontWeight: 700, color: glowColor, fontFamily: "'Cinzel',serif", letterSpacing: 3, marginTop: 12, textShadow: `0 0 20px ${glowColor}` }}>{shadow?.name || "Shadow Soldier"}</div>
              {isNamed && shadow.title && <div style={{ fontSize: 11, color: glowColor + "aa", fontFamily: "'Cinzel',serif", letterSpacing: 2, marginTop: 4 }}>{shadow.title}</div>}
              <div style={{ fontSize: 10, color: cls.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>{cls.icon}</span>
                <span>{cls.name.toUpperCase()}</span>
                <span style={{ color: tierData.color }}>· {tierData.name.toUpperCase()}</span>
              </div>
              {isNamed && phase >= 5 && shadow.uniqueAbility && (
                <div style={{ marginTop: 16, padding: "8px 20px", borderRadius: 12, background: `${glowColor}15`, border: `1px solid ${glowColor}44`, display: "inline-block", animation: "scaleIn 0.4s ease" }}>
                  <div style={{ fontSize: 9, color: glowColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 4 }}>UNIQUE ABILITY</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{shadow.uniqueAbility.icon} {shadow.uniqueAbility.name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{shadow.uniqueAbility.effect}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 40, fontSize: 10, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>TAP TO SKIP</div>
      {/* Version Marker */}
      <div style={{
        marginTop: "auto", padding: "10px 0", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.03)",
        fontSize: "10px", color: "rgba(255,255,255,0.15)",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3
      }}>
        ARISE SYSTEM v1.3.6 (FORCED UPDATE)
      </div>
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
      background: `linear-gradient(135deg,rgba(8,8,20,0.9),rgba(12,10,24,0.85))`,
      border: `1px solid ${shadow.isNamed ? shadow.glowColor + "55" : cls.color + "33"}`,
      borderRadius: 16, padding: "14px 12px", cursor: "pointer",
      boxShadow: shadow.isNamed ? `0 0 16px ${shadow.glowColor}22` : "none",
      position: "relative", overflow: "hidden",
      animation: `shadowRise 0.4s ease ${index * 0.06}s both`,
      transition: "all 0.2s",
      ["--shadow-glow"]: cls.color,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = shadow.isNamed ? shadow.glowColor + "88" : cls.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = shadow.isNamed ? shadow.glowColor + "55" : cls.color + "33"; e.currentTarget.style.transform = "none"; }}>
      {/* Tier shine */}
      {shadow.tier >= 3 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: "40%", height: "100%", background: `linear-gradient(90deg,transparent,${tierData.color}0a,transparent)`, animation: "tierShine 3s ease-in-out infinite" }} />
        </div>
      )}
      {/* Named badge */}
      {shadow.isNamed && (
        <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 6px", borderRadius: 4, background: `${shadow.glowColor}22`, border: `1px solid ${shadow.glowColor}55`, fontSize: 8, color: shadow.glowColor, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>NAMED</div>
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `${cls.color}15`, border: `1px solid ${cls.color}33`, flexShrink: 0, fontSize: shadow.isNamed ? 26 : 22 }}>
          {shadow.isNamed ? shadow.icon : cls.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: shadow.isNamed ? shadow.glowColor : "#e2e8f0", fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shadow.name}</div>
          {shadow.isNamed && shadow.title && <div style={{ fontSize: 9, color: shadow.glowColor + "99", fontFamily: "'Outfit',sans-serif", marginTop: 1 }}>{shadow.title}</div>}
          <div style={{ display: "flex", gap: 5, marginTop: 4, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: cls.color + "15" }}>{cls.icon} {shadow.class.toUpperCase()}</span>
            <span style={{ fontSize: 9, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", padding: "1px 5px", borderRadius: 4, background: tierData.color + "15", border: `1px solid ${tierData.color}33` }}>T{shadow.tier}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif" }}>Lv.{shadow.level}</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 10 }}>
        {[{ k: "power", icon: "⚔", c: "#ef4444" }, { k: "speed", icon: "⚡", c: "#f59e0b" }, { k: "loyalty", icon: "💙", c: "#3b82f6" }, { k: "presence", icon: "✦", c: "#a855f7" }].map(({ k, icon, c }) => (
          <div key={k} style={{ textAlign: "center", background: c + "0a", borderRadius: 6, padding: "4px 2px", border: `1px solid ${c}18` }}>
            <div style={{ fontSize: 9, color: c }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", fontFamily: "'JetBrains Mono',monospace" }}>{shadow.stats[k]}</div>
          </div>
        ))}
      </div>
      {/* XP bar */}
      <div style={{ height: 3, background: "#0f1628", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${cls.color}88,${cls.color})`, transition: "width 0.6s ease" }} />
      </div>
      {/* Deployment / slot info */}
      {shadow.isDeployed && slotData ? (
        <div style={{ fontSize: 9, color: slotData.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{slotData.icon}</span><span>{slotData.name.toUpperCase()}</span>
        </div>
      ) : (
        <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>RESERVE</div>
      )}
    </div>
  );
}

// ─── SHADOW DETAIL MODAL ──────────────────────────────────────
function ShadowDetailModal({ shadow, theme, onClose, onDeploy, onUndeploy, onEvolve, gold }) {
  const cls = SHADOW_CLASSES[shadow.class] || SHADOW_CLASSES.soldier;
  const tierData = SHADOW_TIERS[shadow.tier] || SHADOW_TIERS[1];
  const nextTierData = SHADOW_TIERS[shadow.tier + 1];
  const xpPct = Math.min((shadow.xp / shadow.xpToNext) * 100, 100);
  const canEvolve = nextTierData && gold >= nextTierData.evolutionCost && shadow.level >= tierData.maxLevel;
  const slotData = shadow.deploymentSlot ? FORMATION_SLOTS[shadow.deploymentSlot] : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(2,2,8,0.95)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "linear-gradient(180deg,rgba(10,10,22,0.99),rgba(6,6,16,0.99))", border: `1px solid ${shadow.isNamed ? shadow.glowColor + "44" : cls.color + "33"}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", animation: "slideUp 0.3s ease", maxHeight: "85vh", overflowY: "auto" }}>
        {/* Close handle */}
        <div style={{ width: 36, height: 3, background: "#1e2940", borderRadius: 2, margin: "0 auto 20px" }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: `${cls.color}15`, border: `2px solid ${shadow.isNamed ? shadow.glowColor + "66" : cls.color + "44"}`, fontSize: shadow.isNamed ? 36 : 28, boxShadow: shadow.isNamed ? `0 0 20px ${shadow.glowColor}44` : "none" }}>
            {shadow.isNamed ? shadow.icon : cls.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: shadow.isNamed ? shadow.glowColor : "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{shadow.name}</div>
            {shadow.isNamed && shadow.title && <div style={{ fontSize: 11, color: shadow.glowColor + "88", fontFamily: "'Cinzel',serif", letterSpacing: 1, marginTop: 2 }}>{shadow.title}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: cls.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: cls.color + "18" }}>{cls.icon} {cls.name}</span>
              <span style={{ fontSize: 10, color: tierData.color, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: tierData.color + "18", border: `1px solid ${tierData.color}33` }}>Tier {shadow.tier} · {tierData.name}</span>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>LEVEL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{shadow.level}</div>
          </div>
        </div>
        {/* XP */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            <span>EXP</span><span>{shadow.xp} / {shadow.xpToNext}</span>
          </div>
          <div style={{ height: 6, background: "#0a0a14", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${cls.color}88,${cls.color})`, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>Max Level für diesen Tier: {tierData.maxLevel}</div>
        </div>
        {/* Stats */}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>KAMPFSTATS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {[{ k: "power", name: "Power", icon: "⚔️", color: "#ef4444", desc: "Dungeon-Erfolg" }, { k: "speed", name: "Speed", icon: "⚡", color: "#f59e0b", desc: "Clear-Zeit Reduktion" }, { k: "loyalty", name: "Loyalty", icon: "💙", color: "#3b82f6", desc: "Bonus-Aktivierungschance" }, { k: "presence", name: "Presence", icon: "✦", color: "#a855f7", desc: "Passive Effekt-Stärke" }].map(({ k, name, icon, color, desc }) => (
            <div key={k} style={{ background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{icon} {name}</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif" }}>{shadow.stats[k]}</span>
              </div>
              <div style={{ height: 3, background: "#0a0a14", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((shadow.stats[k] / 100) * 100, 100)}%`, height: "100%", borderRadius: 2, background: color + "66" }} />
              </div>
              <div style={{ fontSize: 8, color: "#334155", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>{desc}</div>
            </div>
          ))}
        </div>
        {/* Passive Effect */}
        <div style={{ background: `${cls.color}0a`, border: `1px solid ${cls.color}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>PASSIVE EFFEKT</div>
          <div style={{ fontSize: 12, color: cls.color, fontWeight: 600 }}>{cls.passiveEffect}</div>
        </div>
        {/* Named: unique ability & lore */}
        {shadow.isNamed && (
          <>
            <div style={{ background: `${shadow.glowColor}0a`, border: `1px solid ${shadow.glowColor}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>UNIQUE ABILITY</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{shadow.uniqueAbility?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: shadow.glowColor, fontFamily: "'Cinzel',serif" }}>{shadow.uniqueAbility?.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{shadow.uniqueAbility?.effect}</div>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, fontStyle: "italic", fontSize: 12, color: "#64748b", lineHeight: 1.6, borderLeft: `2px solid ${shadow.glowColor}44` }}>"{shadow.lore}"</div>
          </>
        )}
        {/* Deployment */}
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>FORMATION</div>
        {shadow.isDeployed ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: `${slotData?.color}15`, border: `1px solid ${slotData?.color}44`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{slotData?.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: slotData?.color, fontFamily: "'JetBrains Mono',monospace" }}>{slotData?.name.toUpperCase()}</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>{slotData?.bonus}</div>
              </div>
            </div>
            <button onClick={() => onUndeploy(shadow.id)} style={{ padding: "10px 16px", borderRadius: 10, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1 }}>RECALL</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 18 }}>
            {Object.entries(FORMATION_SLOTS).map(([slotKey, slot]) => (
              <button key={slotKey} onClick={() => onDeploy(shadow.id, slotKey)} style={{ padding: "10px 6px", borderRadius: 10, background: `${slot.color}10`, border: `1px solid ${slot.color}33`, color: slot.color, textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = slot.color + "20"; }} onMouseLeave={e => { e.currentTarget.style.background = slot.color + "10"; }}>
                <div style={{ fontSize: 18 }}>{slot.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{slot.name.toUpperCase()}</div>
                <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{slot.bonus}</div>
              </button>
            ))}
          </div>
        )}
        {/* Evolution */}
        {nextTierData && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${nextTierData.color}22`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 2 }}>EVOLUTION</div>
                <div style={{ fontSize: 12, color: nextTierData.color, fontWeight: 700 }}>Tier {shadow.tier} → Tier {shadow.tier + 1} ({nextTierData.name})</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>KOSTEN</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>{nextTierData.evolutionCost}G</div>
              </div>
            </div>
            {!canEvolve && shadow.level < tierData.maxLevel && <div style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>⚠ Erfordert Level {tierData.maxLevel} (aktuell {shadow.level})</div>}
            {!canEvolve && gold < nextTierData.evolutionCost && <div style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>⚠ Zu wenig Gold ({gold}G / {nextTierData.evolutionCost}G)</div>}
            <button onClick={() => canEvolve && onEvolve(shadow.id)} disabled={!canEvolve} style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 12, fontWeight: 700, background: canEvolve ? `linear-gradient(135deg,${nextTierData.color}25,${nextTierData.color}10)` : "rgba(255,255,255,0.03)", color: canEvolve ? nextTierData.color : "#334155", border: `1px solid ${canEvolve ? nextTierData.color + "44" : "#1e2940"}`, fontFamily: "'Cinzel',serif", letterSpacing: 2, cursor: canEvolve ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              {canEvolve ? "✦ EVOLUTION ✦" : "EVOLUTION GESPERRT"}
            </button>
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, background: "transparent", color: "#334155", border: "1px solid #1e293b", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 2 }}>SCHLIESSEN</button>
      </div>
    </div>
  );
}

// ─── FORMATION EDITOR ─────────────────────────────────────────
function FormationEditor({ shadowArmy, theme, onDeploy, onUndeploy, formationBonus }) {
  const shadows = shadowArmy?.shadows || [];
  const deployed = shadows.filter(s => s.isDeployed);
  const reserve = shadows.filter(s => !s.isDeployed);

  return (
    <div>
      {/* Bonus overview */}
      <div style={{ background: `linear-gradient(135deg,${theme.primary}0a,transparent)`, border: `1px solid ${theme.primary}18`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>FORMATIONS-BONI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[{ label: "Dungeon", val: `+${formationBonus.dungeonBonus}%`, color: "#ef4444", icon: "⚔️" }, { label: "XP", val: `+${Math.round(formationBonus.xpBonus * 100)}%`, color: "#a78bfa", icon: "✨" }, { label: "Gold", val: `+${Math.round(formationBonus.goldBonus * 100)}%`, color: "#fbbf24", icon: "💰" }].map(({ label, val, color, icon }) => (
            <div key={label} style={{ textAlign: "center", padding: "8px", background: color + "0a", borderRadius: 10, border: `1px solid ${color}18` }}>
              <div style={{ fontSize: 14 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Cinzel',serif", marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Slots */}
      {Object.entries(FORMATION_SLOTS).map(([slotKey, slot]) => {
        const inSlot = deployed.filter(s => s.deploymentSlot === slotKey);
        const emptySlots = slot.maxSlots - inSlot.length;
        return (
          <div key={slotKey} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{slot.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: slot.color, fontFamily: "'JetBrains Mono',monospace" }}>{slot.name.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: "#475569", marginLeft: 8 }}>{slot.bonus}</span>
              </div>
              <span style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>{inSlot.length}/{slot.maxSlots}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${slot.maxSlots},1fr)`, gap: 6 }}>
              {inSlot.map(s => {
                const cls = SHADOW_CLASSES[s.class] || SHADOW_CLASSES.soldier;
                return (
                  <div key={s.id} onClick={() => onUndeploy(s.id)} style={{ background: `${cls.color}12`, border: `1px solid ${cls.color}33`, borderRadius: 10, padding: "8px 6px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ef444420"; e.currentTarget.style.borderColor = "#ef444455"; }} onMouseLeave={e => { e.currentTarget.style.background = cls.color + "12"; e.currentTarget.style.borderColor = cls.color + "33"; }}>
                    <div style={{ fontSize: 16 }}>{s.isNamed ? s.icon : cls.icon}</div>
                    <div style={{ fontSize: 8, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.length > 7 ? s.name.slice(0, 7) + "…" : s.name}</div>
                    <div style={{ fontSize: 7, color: "#475569", marginTop: 1 }}>Lv.{s.level}</div>
                  </div>
                );
              })}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} style={{ border: `1px dashed ${slot.color}22`, borderRadius: 10, padding: "8px 6px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 16, opacity: 0.2, animation: "formationPulse 2s ease-in-out infinite" }}>{slot.icon}</div>
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
function StatRadar({ stats, theme, size = 160 }) {
  const keys = ["str", "int", "vit", "agi", "cha"];
  const maxStat = Math.max(...keys.map(k => stats[k] || 0), 20);
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const angle = i => (Math.PI * 2 * i) / 5 - Math.PI / 2;
  const pt = (i, f) => [cx + r * f * Math.cos(angle(i)), cy + r * f * Math.sin(angle(i))];
  const grid = [0.25, 0.5, 0.75, 1].map(f => keys.map((_, i) => pt(i, f).join(",")).join(" "));
  const data = keys.map((k, i) => { const v = Math.min((stats[k] || 0) / maxStat, 1); return pt(i, Math.max(v, 0.05)).join(","); }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={theme.primary + "15"} strokeWidth={0.5} />)}
      {keys.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke={theme.primary + "15"} strokeWidth={0.5} />)}
      <polygon points={data} fill={theme.primary + "22"} stroke={theme.accent} strokeWidth={1.5} strokeLinejoin="round" />
      {keys.map((k, i) => { const [px, py] = pt(i, 1.22); const cat = CATEGORIES.find(c => c.key === k); return <text key={k} x={px} y={py} textAnchor="middle" dominantBaseline="central" fill={cat.color} fontSize={9} fontFamily="'JetBrains Mono',monospace" fontWeight="600">{cat.stat}</text>; })}
    </svg>
  );
}

// ─── QUEST TIMER ──────────────────────────────────────────────
function QuestTimer({ expiresAt, color = "#ef4444" }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setTimeLeft(calc());
    const iv = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const urgent = timeLeft < 3600;
  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
      color: urgent ? "#ef4444" : color,
      background: urgent ? "#ef444415" : "transparent",
      padding: urgent ? "1px 5px" : "0", borderRadius: 4,
      animation: urgent && timeLeft < 600 ? "breathe 0.8s infinite" : "none",
      letterSpacing: 1,
    }}>
      ⏱ {h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}
    </span>
  );
}

// ─── QUEST TYPE BADGE ─────────────────────────────────────────
function QuestTypeBadge({ type }) {
  const cfg = QUEST_TYPES_CONFIG[type] || QUEST_TYPES_CONFIG.side;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
      color: cfg.color, background: cfg.color + "18",
      border: `1px solid ${cfg.color}44`,
      padding: "1px 6px", borderRadius: 4, letterSpacing: 0.5,
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {cfg.icon} {cfg.label.toUpperCase()}
    </span>
  );
}

// ─── EMERGENCY QUEST CARD ─────────────────────────────────────
function EmergencyQuestCard({ quest, done, failed, onComplete, theme }) {
  const [hover, setHover] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (!quest) return null;
  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty) || DIFFICULTIES[1];
  const cat = CATEGORIES.find(c => c.key === quest.category) || CATEGORIES[0];
  const expired = quest.timeLimit && new Date(quest.timeLimit) < new Date();
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: done ? "rgba(34,197,94,0.06)" : failed || expired ? "rgba(239,68,68,0.06)" : "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.04))",
        border: `1px solid ${done ? "#22c55e44" : failed || expired ? "#ef444444" : "#ef4444"}`,
        borderLeft: `3px solid ${done ? "#22c55e" : failed || expired ? "#ef444466" : "#ef4444"}`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 16,
        animation: !done && !failed && !expired ? "glow 2s infinite" : "none",
        transition: "all 0.25s",
        opacity: done || failed ? 0.7 : 1,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16, animation: !done && !failed && !expired ? "pulse 1s infinite" : "none" }}>🚨</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <QuestTypeBadge type="emergency" />
            {!done && !failed && !expired && quest.timeLimit && <QuestTimer expiresAt={quest.timeLimit} color="#ef4444" />}
            {(expired || failed) && !done && <span style={{ fontSize: 9, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace" }}>ABGELAUFEN</span>}
            {done && <span style={{ fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>ERFÜLLT ✓</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#64748b" : "#fff", fontFamily: "'Outfit',sans-serif", textDecoration: done ? "line-through" : "none" }}>{quest.title}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10, lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>{quest.desc}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: cat.color }}>{cat.icon} {cat.stat}</span>
          <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
          <span style={{ color: "#a78bfa" }}>+{diff.xp * 2.5 | 0} XP</span>
          <span style={{ color: "#334155", margin: "0 6px" }}>·</span>
          <span style={{ color: "#fbbf24" }}>+{diff.gold * 2.5 | 0} G</span>
        </div>
        {!done && !failed && !expired && (
          <button onClick={() => {
            if (!confirming) {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            } else {
              onComplete(quest);
            }
          }} style={{ padding: "7px 16px", borderRadius: 10, fontSize: 11, fontWeight: 800, background: confirming ? "rgba(245,158,11,0.2)" : "linear-gradient(135deg,#ef444425,#ef444410)", color: confirming ? "#f59e0b" : "#ef4444", border: `1px solid ${confirming ? "#f59e0b" : "#ef444455"}`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, transition: "all 0.3s" }}>
            {confirming ? "JA?" : "ERFÜLLEN"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CHAINED QUEST PROGRESS ───────────────────────────────────
function ChainedQuestProgress({ quest }) {
  const steps = quest.chainTotal || 3;
  const current = quest.chainStep || 1;
  const mult = quest.chainMultiplier || 1;
  return (
    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < current ? "#f59e0b" : "#1e2940", transition: "background 0.3s" }} />
      ))}
      <span style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>x{mult.toFixed(2)}</span>
    </div>
  );
}

// ─── QUEST CARD ───────────────────────────────────────────────
function QuestCard({ quest, index, theme, onComplete, onDelete }) {
  const [completing, setCompleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState(false);
  const cardRef = useRef(null);
  const diff = DIFFICULTIES.find(d => d.key === quest.difficulty);
  const cat = CATEGORIES.find(c => c.key === quest.category);
  const typeCfg = QUEST_TYPES_CONFIG[quest.type] || QUEST_TYPES_CONFIG.side;
  const xpGain = Math.round((diff?.xp || 50) * (quest.chainMultiplier || 1) * (typeCfg.xpMult || 1));
  const goldGain = Math.round((diff?.gold || 25) * (quest.chainMultiplier || 1) * (typeCfg.goldMult || 1));
  const isHidden = quest.type === "hidden";
  const handleComplete = () => {
    // Check constraint before animating disappearance
    if (!quest.isSystem && quest.createdAtMs) {
      const waitHours = diff?.waitHours || 1;
      const elapsedMs = Date.now() - quest.createdAtMs;
      const requiredMs = waitHours * 3600 * 1000;
      if (elapsedMs < requiredMs) {
        onComplete(quest.id, null); // Trigger the notification in App
        return;
      }
    }

    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000); // 3 seconds to confirm
      return;
    }
    setCompleting(true); const rect = cardRef.current?.getBoundingClientRect(); setTimeout(() => onComplete(quest.id, rect ? { x: rect.left + rect.width / 2, y: rect.top } : null), 500);
  };
  return (
    <div ref={cardRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: completing ? `linear-gradient(135deg,${diff.color}15,transparent)` : hover ? `linear-gradient(135deg,${theme.card},${diff.color}08)` : theme.card,
      border: `1px solid ${hover ? diff.color + "44" : isHidden ? typeCfg.color + "33" : theme.primary + "18"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8,
      borderLeft: `3px solid ${isHidden ? typeCfg.color : diff.color}${hover ? "cc" : "66"}`,
      animation: completing ? "fadeOut 0.5s ease forwards" : `cardEnter 0.4s ease ${index * 0.06}s both`,
      display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      transform: hover && !completing ? "translateX(4px)" : "none", backdropFilter: "blur(8px)",
      boxShadow: isHidden ? `0 0 12px ${typeCfg.color}18` : "none"
    }}>
      <button onClick={handleComplete} style={{
        width: confirming ? 46 : 38, height: 38, borderRadius: 10, flexShrink: 0, marginTop: 2,
        background: completing ? diff.color + "22" : confirming ? "#f59e0b22" : "transparent",
        border: `2px solid ${completing ? diff.color : confirming ? "#f59e0b" : diff.color + "44"}`,
        color: confirming ? "#f59e0b" : diff.color, fontSize: confirming ? 11 : 15, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", transform: completing ? "scale(1.1)" : confirming ? "scale(1.05)" : hover ? "scale(1.05)" : "scale(1)"
      }}>
        {completing ? <span style={{ animation: "checkPop 0.4s ease forwards", display: "inline-block" }}>✓</span> : confirming ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>JA?</span> : <span style={{ opacity: 0.5 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
          <QuestTypeBadge type={quest.type} />
          <span style={{ color: diff.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: diff.color + "15", fontSize: 9 }}>{diff.icon} {diff.label}</span>
          <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, background: cat.color + "15", color: cat.color, fontFamily: "'JetBrains Mono',monospace" }}>{cat.icon} {cat.stat}</span>
          {quest.type === "weekly" && quest.timeLimit && <QuestTimer expiresAt={quest.timeLimit} color="#8b5cf6" />}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: completing ? "#64748b" : "#e2e8f0", textDecoration: completing ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Outfit',sans-serif" }}>{quest.title}</div>
        {quest.type === "chained" && <ChainedQuestProgress quest={quest} />}
        <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
          <span style={{ color: "#a78bfa" }}>+{xpGain} XP</span>
          <span style={{ margin: "0 5px", color: "#1e293b" }}>·</span>
          <span style={{ color: "#fbbf24" }}>+{goldGain} G</span>
          {isHidden && <span style={{ margin: "0 5px", color: typeCfg.color }}>· 🌟 Verborgene Belohnung</span>}
        </div>
      </div>
      <button onClick={() => onDelete(quest.id)} style={{ fontSize: 14, color: "#1e293b", background: "transparent", padding: "4px", opacity: hover ? 1 : 0, transition: "opacity 0.2s", flexShrink: 0 }}>✕</button>
    </div>
  );
}
// ─── DUNGEON GATE ─────────────────────────────────────────────
function DungeonGate({ dungeon, playerStats, theme, onEnter, modifier }) {
  const [hover, setHover] = useState(false);
  const rankData = RANKS.find(r => r.name === dungeon.rank) || RANKS[0];
  const reqs = Object.entries(dungeon.requirements);
  const timeLeft = Math.max(0, new Date(dungeon.expiresAt) - new Date());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: dungeon.cleared ? "rgba(6,6,14,0.4)" : theme.card,
      border: `1px solid ${dungeon.cleared ? "#1e293b" : hover ? rankData.color + "66" : rankData.color + "25"}`,
      borderRadius: 20, padding: 0, position: "relative", overflow: "hidden", opacity: dungeon.cleared ? 0.4 : 1,
      backdropFilter: "blur(16px)", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      transform: hover && !dungeon.cleared ? "translateY(-4px)" : "none",
      boxShadow: hover && !dungeon.cleared ? `0 12px 40px rgba(0,0,0,0.5),0 0 30px ${rankData.color}18` : "0 4px 20px rgba(0,0,0,0.2)"
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2, padding: "4px 12px", borderRadius: 8, background: rankData.color + "18", border: `1.5px solid ${rankData.color}44`, fontSize: 10, fontWeight: 900, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, boxShadow: `0 0 10px ${rankData.color}15` }}>{dungeon.rank}-RANK</div>
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", background: `radial-gradient(circle,${rankData.color}15,transparent)`, border: `2px solid ${rankData.color}33` }}>
          {!dungeon.cleared && <>
            <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: `1.5px solid ${rankData.color}30`, borderTopColor: rankData.color + "88", animation: "portalSwirl 3s linear infinite" }} />
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: `1px solid ${rankData.color}20`, borderBottomColor: rankData.color + "55", animation: "portalSwirl 5s linear infinite reverse" }} />
          </>}
          <span style={{ fontSize: 28, position: "relative", zIndex: 1, filter: !dungeon.cleared ? `drop-shadow(0 0 8px ${rankData.color}88)` : "none", animation: !dungeon.cleared ? "gateFloat 3s ease-in-out infinite" : "none" }}>{dungeon.cleared ? "✓" : dungeon.icon}</span>
          <div style={{ position: "absolute", top: 2, left: 2, width: 8, height: 8, borderTop: `2px solid ${rankData.color}55`, borderLeft: `2px solid ${rankData.color}55` }} />
          <div style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderTop: `2px solid ${rankData.color}55`, borderRight: `2px solid ${rankData.color}55` }} />
          <div style={{ position: "absolute", bottom: 2, left: 2, width: 8, height: 8, borderBottom: `2px solid ${rankData.color}55`, borderLeft: `2px solid ${rankData.color}55` }} />
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 8, height: 8, borderBottom: `2px solid ${rankData.color}55`, borderRight: `2px solid ${rankData.color}55` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: dungeon.cleared ? "#475569" : "#fff", fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>{dungeon.name}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{dungeon.desc}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace", padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>🏛 {dungeon.floors} Floors</span>
            {!dungeon.cleared && timeLeft > 0 && <span style={{ fontSize: 10, color: hoursLeft < 2 ? "#ef4444" : "#475569", fontFamily: "'JetBrains Mono',monospace", padding: "2px 7px", borderRadius: 5, background: hoursLeft < 2 ? "#ef444410" : "rgba(255,255,255,0.03)", border: `1px solid ${hoursLeft < 2 ? "#ef444420" : "rgba(255,255,255,0.06)"}` }}>⏱ {hoursLeft}h {minsLeft}m</span>}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 18px", display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {reqs.map(([stat, val]) => {
          const cat = CATEGORIES.find(c => c.key === stat); const met = (playerStats[stat] || 0) >= val; return (
            <div key={stat} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 10, background: met ? cat.color + "12" : "#ef444408", color: met ? cat.color : "#ef4444", border: `1px solid ${met ? cat.color + "33" : "#ef444425"}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <span>{cat.icon}</span> {cat.stat} {val} {met ? "✓" : `(${playerStats[stat] || 0})`}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${rankData.color}12`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(180deg,transparent,${rankData.color}06)` }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.12)" }}>
            <span style={{ fontSize: 10 }}>💎</span>
            <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>+{modifier?.xpMult ? Math.round(dungeon.xp * modifier.xpMult) : dungeon.xp}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.12)" }}>
            <span style={{ fontSize: 10 }}>🪙</span>
            <span style={{ fontSize: 11, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>+{modifier?.goldMult ? Math.round(dungeon.gold * modifier.goldMult) : dungeon.gold}</span>
          </div>
        </div>
        {dungeon.cleared
          ? <div style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, fontWeight: 700 }}>CLEARED ✓</div>
          : <button onClick={() => onEnter(dungeon)} style={{
            padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 900,
            background: `linear-gradient(135deg,${rankData.color}30,${rankData.color}15)`,
            color: rankData.color, border: `1.5px solid ${rankData.color}55`,
            fontFamily: "'Cinzel',serif", letterSpacing: 3,
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            transform: hover ? "scale(1.06)" : "scale(1)",
            boxShadow: hover ? `0 0 24px ${rankData.color}33,0 4px 16px rgba(0,0,0,0.3)` : "none",
          }}>ENTER ▶</button>
        }
      </div>
    </div>
  );
}

// ─── SPRINT 3: FLOOR PROGRESS BAR ─────────────────────────────
function FloorProgressBar({ floors, currentFloor, totalFloors }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 16 }}>
      {floors.map((f, i) => {
        const ft = FLOOR_TYPES[f.type];
        const isCurrent = f.floor === currentFloor && !f.completed;
        const isPast = f.completed;
        const isFuture = !f.completed && f.floor !== currentFloor;
        return (
          <div key={i} style={{
            flex: f.type === "boss_arena" ? 2 : 1, display: "flex", alignItems: "center",
            flexDirection: "column", gap: 3, position: "relative",
          }}>
            <div style={{
              height: f.type === "boss_arena" ? 36 : 28,
              width: "100%",
              borderRadius: 6,
              background: isPast ? "#22c55e22" : isCurrent ? ft.color + "28" : "rgba(10,10,20,0.6)",
              border: `1px solid ${isPast ? "#22c55e55" : isCurrent ? ft.color : "#1e2940"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isPast ? 10 : f.type === "boss_arena" ? 16 : 12,
              transition: "all 0.4s",
              animation: isCurrent ? `floorActiveGlow 1.5s infinite` : "none",
              "--floor-color": ft.color,
              boxShadow: isCurrent ? `0 0 10px ${ft.color}44` : "none",
              opacity: isFuture ? 0.4 : 1,
              position: "relative", overflow: "hidden",
            }}>
              {isPast ? "✓" : ft.icon}
              {isCurrent && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,transparent,${ft.color}22,transparent)`, animation: "rankShine 1.5s ease-in-out infinite" }} />}
            </div>
            <div style={{ fontSize: 7, color: isPast ? "#22c55e" : isCurrent ? ft.color : "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, textAlign: "center", whiteSpace: "nowrap" }}>
              {f.type === "boss_arena" ? "BOSS" : f.floor}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPRINT 3: BOSS PHASE UI ──────────────────────────────────
function BossPhaseUI({ rank, bossHp, bossMaxHp, currentPhase, phases }) {
  const phaseData = currentPhase <= phases.length ? phases[currentPhase - 1] : phases[phases.length - 1];
  const hpPercent = Math.max(0, (bossHp / bossMaxHp) * 100);
  const phaseColor = phaseData?.color || "#ef4444";
  return (
    <div style={{
      background: "rgba(8,2,16,0.96)",
      border: `1px solid ${phaseColor}44`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 14,
      animation: "bossPhaseIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 28, animation: "bossShake 0.5s ease", filter: `drop-shadow(0 0 10px ${phaseColor})` }}>{phaseData?.icon || "👑"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: phaseColor, letterSpacing: 2, fontWeight: 700 }}>
              PHASE {currentPhase}/{phases.length} · {phaseData?.name?.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: phaseColor, fontFamily: "'Cinzel',serif" }}>{Math.round(hpPercent)}%</div>
          </div>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>{phaseData?.desc}</div>
        </div>
      </div>
      {/* HP Bar */}
      <div style={{ height: 8, background: "#0a0a14", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg,${phaseColor}99,${phaseColor})`,
          width: `${hpPercent}%`,
          transition: "width 0.8s ease",
          boxShadow: `0 0 10px ${phaseColor}66`,
        }} />
        {/* Phase thresholds */}
        {phases.slice(0, -1).map((p, i) => (
          <div key={i} style={{ position: "absolute", top: 0, left: `${p.hp}%`, width: 2, height: "100%", background: "#1e293b", zIndex: 2 }} />
        ))}
      </div>
      {/* Phase dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i + 1 < currentPhase ? "#22c55e" : i + 1 === currentPhase ? p.color : "#1e293b",
            transition: "all 0.4s",
            boxShadow: i + 1 === currentPhase ? `0 0 6px ${p.color}` : "none",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── SPRINT 3: DUNGEON BATTLE ─────────────────────────────────
function DungeonBattle({ dungeon, playerStats, theme, onResult, onClose, skillBonuses, modifier, formationBonus, state, persist, notify }) {
  const [phase, setPhase] = useState("strategy");
  const [strategy, setStrategy] = useState(STRATEGIES[0]);
  const [battleLog, setBattleLog] = useState([]);
  const [result, setResult] = useState(null);
  const [portalRot, setPortalRot] = useState(0);
  const [equipDrop, setEquipDrop] = useState(null);
  const animRef = useRef(null);
  // Sprint 3 state
  const [floorPlan] = useState(() => generateFloorPlan(dungeon));
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorsCompleted, setFloorsCompleted] = useState([]);
  const [bossPhase, setBossPhase] = useState(1);
  const [bossHp, setBossHp] = useState(100);
  const [showExtraction, setShowExtraction] = useState(false);
  const [goldBonus, setGoldBonus] = useState(0);

  const rankData = RANKS.find(r => r.name === dungeon.rank) || RANKS[0];
  const bossPhaseDefs = BOSS_PHASES[dungeon.rank] || BOSS_PHASES.E;
  const jobBonuses = getJobBonuses(state);
  const chance = calcSuccessChance(dungeon, playerStats, strategy.key, skillBonuses, modifier, formationBonus, jobBonuses, state?.level || 1);
  const chanceLabel = chance >= 65 ? "HIGH" : chance >= 40 ? "MEDIUM" : "RISKY";
  const chanceColor = chance >= 65 ? "#22c55e" : chance >= 40 ? "#f59e0b" : "#ef4444";

  // Archmage Insight: Best strategy
  const isInsightActive = jobBonuses.autoSolvePuzzle || (state.jobs.activeAbilityCooldowns?.insight && Date.now() < state.jobs.activeAbilityCooldowns.insight + 43200000);
  const bestStrat = isInsightActive ? CATEGORIES.reduce((best, cur) => {
    const curChance = calcSuccessChance(dungeon, playerStats, cur.key, skillBonuses, modifier, formationBonus, jobBonuses, state?.level || 1);
    return curChance > best.chance ? { key: cur.key, chance: curChance } : best;
  }, { key: "", chance: -1 }) : null;

  useEffect(() => {
    if (phase !== "entering") return;
    let rot = 0;
    const spin = () => { rot += 2; setPortalRot(rot); animRef.current = requestAnimationFrame(spin); };
    animRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const addLog = (log) => setBattleLog(prev => [...prev, log]);

  const startBattle = () => {
    setPhase("entering");
    setTimeout(() => { setPhase("floors"); runNextFloor(1, []); }, 2400);
  };

  const runNextFloor = (floorNum, completedSoFar) => {
    const fl = floorPlan[floorNum - 1];
    if (!fl) { finishAllFloors(completedSoFar); return; }
    setCurrentFloor(floorNum);
    setBattleLog([]);

    const isStrong = (playerStats[strategy.key] || 0) >= (dungeon.requirements[dungeon.primaryStat] || 10) * 1.4;
    const isWeak = (playerStats[strategy.key] || 0) < (dungeon.requirements[dungeon.primaryStat] || 10) * 0.6;

    if (fl.type === "boss_arena") {
      // Boss fight with phases
      setBossHp(100);
      setBossPhase(1);
      setPhase("boss");
      runBossPhase(1, completedSoFar, isStrong, isWeak, floorNum);
      return;
    }

    if (fl.type === "safe_room") {
      const safeLog = [
        { text: `▶ FLOOR ${floorNum}/${dungeon.floors} · 🏕️ SAFE ROOM`, type: "success" },
        { text: "Die Shadow Army erholt sich. Kräfte wiederhergestellt.", type: "success" },
        { text: "Taktische Neuausrichtung abgeschlossen.", type: "info" },
      ];
      let delay = 0;
      safeLog.forEach((l, i) => setTimeout(() => addLog(l), delay += 600));
      setTimeout(() => {
        const next = [...completedSoFar, floorNum];
        setFloorsCompleted(next);
        setTimeout(() => runNextFloor(floorNum + 1, next), 800);
      }, delay + 800);
      return;
    }

    if (fl.type === "treasure") {
      const bonus = Math.floor(dungeon.gold * 0.2);
      setGoldBonus(prev => prev + bonus);
      const tLog = [
        { text: `▶ FLOOR ${floorNum}/${dungeon.floors} · 💰 SCHATZKAMMER`, type: "gold" },
        { text: `Truhe geöffnet! +${bonus} Gold Bonus geborgen.`, type: "gold" },
      ];
      let delay = 0;
      tLog.forEach((l, i) => setTimeout(() => addLog(l), delay += 700));
      setTimeout(() => {
        const next = [...completedSoFar, floorNum];
        setFloorsCompleted(next);
        setTimeout(() => runNextFloor(floorNum + 1, next), 700);
      }, delay + 700);
      return;
    }

    const ft = FLOOR_TYPES[fl.type];
    const logs = [
      { text: `▶ FLOOR ${floorNum}/${dungeon.floors} · ${ft.icon} ${ft.name.toUpperCase()}`, type: "system" },
      { text: `[${strategy.icon} ${strategy.label}] Taktik angewendet`, type: "info" },
      ...getFloorLogs(fl, dungeon, strategy, playerStats, isStrong, isWeak),
      { text: `Floor ${floorNum} abgeschlossen.`, type: "success" },
    ];
    if (modifier && modifier.id !== "none" && floorNum === 1) logs.splice(2, 0, { text: `[MODIFIER] ${modifier.icon} ${modifier.name}`, type: "info" });
    if (formationBonus?.dungeonBonus > 0 && floorNum === 1) logs.splice(2, 0, { text: `[SHADOW] +${formationBonus.dungeonBonus}% Formation-Bonus`, type: "shadow" });

    let delay = 0;
    logs.forEach((l, i) => setTimeout(() => addLog(l), delay += 750));
    setTimeout(() => {
      const next = [...completedSoFar, floorNum];
      setFloorsCompleted(next);
      setTimeout(() => runNextFloor(floorNum + 1, next), 900);
    }, delay + 700);
  };

  const runBossPhase = (pNum, completedSoFar, isStrong, isWeak, floorNum) => {
    const ph = bossPhaseDefs[pNum - 1];
    if (!ph) { finishBoss(completedSoFar, floorNum); return; }
    setBossPhase(pNum);
    const hpAtPhaseEnd = pNum < bossPhaseDefs.length ? bossPhaseDefs[pNum].hp : 0;

    const phaseLogs = [
      { text: `⚔️ BOSS PHASE ${pNum}/${bossPhaseDefs.length} · ${ph.icon} ${ph.name.toUpperCase()}`, type: "danger" },
      { text: ph.desc, type: "warning" },
    ];
    if (pNum === 1) {
      if (isStrong) phaseLogs.push({ text: `${strategy.icon} Überlegene Kraft! Boss zurückgedrängt!`, type: "success" });
      else if (isWeak) phaseLogs.push({ text: "⚠ Kritisches Defizit! Boss dominiert!", type: "danger" });
      else phaseLogs.push({ text: `${strategy.icon} Harter Kampf gegen den Boss...`, type: "action" });
    } else {
      phaseLogs.push({ text: `Boss verstärkt! ATK-Multiplikator ×${ph.atkMod}!`, type: "danger" });
      phaseLogs.push({ text: isStrong ? `${strategy.icon} Entschlossener Gegenschlag!` : "Alle Kräfte mobilisiert – durchhalten!", type: isStrong ? "success" : "action" });
    }

    let delay = 0;
    phaseLogs.forEach((l, i) => setTimeout(() => addLog(l), delay += 800));

    // Animate HP
    const targetHp = hpAtPhaseEnd;
    setTimeout(() => setBossHp(targetHp), delay + 400);

    if (pNum < bossPhaseDefs.length) {
      setTimeout(() => {
        addLog({ text: `Boss-Energie übersteigt Grenzwert... Phase ${pNum + 1} aktiviert!`, type: "danger" });
        setTimeout(() => runBossPhase(pNum + 1, completedSoFar, isStrong, isWeak, floorNum), 1200);
      }, delay + 1800);
    } else {
      setTimeout(() => finishBoss(completedSoFar, floorNum), delay + 1800);
    }
  };

  const finishBoss = (completedSoFar, floorNum) => {
    const won = Math.random() * 100 < chance;
    const next = [...completedSoFar, floorNum];
    setFloorsCompleted(next);
    if (won) {
      setBossHp(0);
      setTimeout(() => setShowExtraction(true), 800);
      setTimeout(() => setShowExtraction(false), 3200);
      setTimeout(() => finishAllFloors(next, true), 3400);
    } else {
      addLog({ text: "💀 HUNTER DEFEATED – Niederlage...", type: "danger" });
      setTimeout(() => finishAllFloors(next, false), 1500);
    }
  };

  const finishAllFloors = (completedFloors, bossWon = undefined) => {
    const won = bossWon !== undefined ? bossWon : Math.random() * 100 < chance;
    const xpMult = modifier?.xpMult || 1;
    const goldMult = modifier?.goldMult || 1;
    const bonusXp = Math.floor(completedFloors.length / dungeon.floors * dungeon.xp * 0.15);
    const xpResult = won ? Math.round(dungeon.xp * xpMult + bonusXp) : Math.round(dungeon.xp * 0.08);
    const goldResult = won ? Math.round((dungeon.gold + goldBonus) * goldMult) : 0;
    const drop = won ? getEquipDropForDungeon(dungeon.rank) : null;
    setEquipDrop(drop);
    setResult({ won, xp: xpResult, gold: goldResult, drop, floorsCleared: completedFloors.length, totalFloors: dungeon.floors, goldBonus, strategy: strategy.key });
    setPhase("result");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,2,8,0.97)", backdropFilter: "blur(8px)", animation: "fadeIn 0.3s", overflowY: "auto" }}>

      {/* EXTRACTION CINEMATIC */}
      {showExtraction && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s" }}>
          <div style={{ fontSize: 72, animation: "float 1s ease-in-out infinite", filter: "drop-shadow(0 0 30px #22c55e)" }}>🌀</div>
          <div style={{ fontSize: 14, letterSpacing: 8, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace", animation: "breathe 0.6s infinite" }}>EXTRACTION</div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>DUNGEON VERLASSEN...</div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: `breathe 0.8s infinite`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {phase === "strategy" && (
        <div style={{ width: "100%", maxWidth: 440, padding: "0 20px", animation: "slideUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 10, filter: `drop-shadow(0 0 20px ${rankData.color})`, animation: "gateFloat 2s ease-in-out infinite" }}>{dungeon.icon}</div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{dungeon.rank}-RANK · {dungeon.floors} FLOORS</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>{dungeon.name}</div>
            {modifier && modifier.id !== "none" && <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: modifier.color + "15", border: `1px solid ${modifier.color}33`, fontSize: 11, color: modifier.color, fontFamily: "'JetBrains Mono',monospace" }}>{modifier.icon} {modifier.name}</div>}
            {formationBonus?.dungeonBonus > 0 && <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "#7c3aed15", border: "1px solid #7c3aed33", fontSize: 11, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace" }}>🌑 Shadow Army +{formationBonus.dungeonBonus}%</div>}
          </div>
          {/* Floor Preview */}
          <div style={{ background: "rgba(6,6,14,0.9)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid #1e2940" }}>
            <div style={{ fontSize: 8, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>FLOOR-VORSCHAU</div>
            <div style={{ display: "flex", gap: 3 }}>
              {floorPlan.map((f, i) => {
                const ft = FLOOR_TYPES[f.type];
                return (
                  <div key={i} style={{
                    flex: f.type === "boss_arena" ? 2 : 1,
                    background: ft.color + "18", border: `1px solid ${ft.color}44`,
                    borderRadius: 6, padding: "5px 4px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10 }}>{ft.icon}</div>
                    <div style={{ fontSize: 6, color: ft.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>F{f.floor}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>STRATEGIE WÄHLEN</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {STRATEGIES.map(s => {
              const isActive = strategy.key === s.key;
              const isBest = bestStrat?.key === s.key;
              return (
                <button key={s.key} onClick={() => setStrategy(s)} style={{ padding: "14px 12px", borderRadius: 12, textAlign: "left", background: isActive ? s.color + "14" : isBest ? s.color + "08" : "rgba(10,10,20,0.6)", border: `1px solid ${isActive ? s.color + "66" : isBest ? s.color + "33" : "#1e2940"}`, color: isActive ? s.color : isBest ? s.color + "aa" : "#64748b", transition: "all 0.22s", position: "relative" }}>
                  {isBest && <div style={{ position: "absolute", top: -8, right: -6, fontSize: 14, animation: "pulse 2s infinite" }}>👁️</div>}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                  <div style={{ fontSize: 11, marginTop: 8, fontFamily: "'JetBrains Mono',monospace", color: isActive ? s.color : "#475569" }}>{CATEGORIES.find(c => c.key === s.key)?.stat}: <span style={{ fontWeight: 700 }}>{playerStats[s.key] || 0}</span></div>
                </button>
              );
            })}
          </div>
          <div style={{ background: "rgba(8,8,18,0.9)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: `1px solid ${chanceColor}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>ERFOLGSWAHRSCHEINLICHKEIT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: chanceColor, fontFamily: "'JetBrains Mono',monospace", padding: "2px 8px", borderRadius: 5, background: chanceColor + "15", border: `1px solid ${chanceColor}33` }}>{chanceLabel}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: chanceColor, fontFamily: "'Cinzel',serif" }}>{chance}%</span>
              </div>
            </div>
            <div style={{ height: 5, background: "#0a0a14", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${chance}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${chanceColor}88,${chanceColor})`, transition: "width 0.4s ease", boxShadow: `0 0 8px ${chanceColor}44` }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 12, background: "transparent", color: "#475569", border: "1px solid #1e2940", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ABBRECHEN</button>
            <button onClick={startBattle} style={{ flex: 2, padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 700, background: `linear-gradient(135deg,${rankData.color}28,${rankData.color}10)`, color: rankData.color, border: `1px solid ${rankData.color}55`, fontFamily: "'Cinzel',serif", letterSpacing: 2, boxShadow: `0 4px 20px ${rankData.color}18` }}>⚔️ BETRETEN</button>
          </div>
        </div>
      )}

      {phase === "entering" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 28px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${rankData.color}55`, borderTopColor: rankData.color, transform: `rotate(${portalRot}deg)` }} />
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: `1px solid ${rankData.color}33`, borderBottomColor: rankData.color + "88", transform: `rotate(${-portalRot * 1.6}deg)` }} />
            <div style={{ position: "absolute", inset: 28, borderRadius: "50%", border: `1px solid ${rankData.color}22`, borderTopColor: rankData.color + "55", transform: `rotate(${portalRot * 0.8}deg)` }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, filter: `drop-shadow(0 0 18px ${rankData.color})` }}>{dungeon.icon}</div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 6, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", animation: "breathe 0.9s infinite" }}>{dungeon.name}</div>
        </div>
      )}

      {(phase === "floors" || phase === "boss") && (
        <div style={{ width: "100%", maxWidth: 440, padding: "0 20px 20px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: rankData.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{dungeon.rank}-RANK · {dungeon.name}</div>
            <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>FLOOR {currentFloor}/{dungeon.floors}</div>
          </div>
          {/* Floor Progress */}
          <FloorProgressBar floors={floorPlan} currentFloor={currentFloor} totalFloors={dungeon.floors} />
          {/* Shadow Step Skip Button */}
          {phase === "floors" && state.jobs?.current === "assassin" && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  const now = Date.now();
                  const lastUsed = state.jobs.activeAbilityCooldowns?.shadow_step || 0;
                  if (now < lastUsed + 28800000) {
                    notify("Shadow Step auf Cooldown.", "info");
                    return;
                  }
                  // Notify and skip
                  addLog({ text: "✨ SHADOW STEP: Floor übersprungen!", type: "shadow" });
                  setTimeout(() => runNextFloor(currentFloor + 1, [...floorsCompleted, currentFloor]), 1000);
                  // Update cooldown in global state
                  const newCooldowns = { ...state.jobs.activeAbilityCooldowns, shadow_step: now };
                  persist({ ...state, jobs: { ...state.jobs, activeAbilityCooldowns: newCooldowns } });
                }}
                disabled={Date.now() < (state.jobs.activeAbilityCooldowns?.shadow_step || 0) + 28800000}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 10, fontWeight: 900, background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid #14b8a655", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}
              >✨ SHADOW STEP (SKIP FLOOR)</button>
            </div>
          )}
          {/* Boss Phase UI */}
          {phase === "boss" && <BossPhaseUI rank={dungeon.rank} bossHp={bossHp} bossMaxHp={100} currentPhase={bossPhase} phases={bossPhaseDefs} />}
          {/* Battle Log */}
          <div style={{ background: "rgba(3,3,9,0.95)", border: `1px solid ${phase === "boss" ? "#ef444420" : "#0f1628"}`, borderRadius: 14, padding: "16px 16px", minHeight: 180, maxHeight: 300, overflowY: "auto", fontFamily: "'JetBrains Mono',monospace" }}>
            {battleLog.map((log, i) => {
              const colors = { system: "#6366f1", info: "#22d3ee", warning: "#f59e0b", danger: "#ef4444", success: "#22c55e", action: "#e2e8f0", shadow: "#a78bfa", gold: "#fbbf24" };
              return (
                <div key={i} style={{ fontSize: 11, color: colors[log.type] || "#e2e8f0", marginBottom: 10, animation: "battleLogIn 0.4s ease", display: "flex", gap: 8 }}>
                  <span style={{ color: "#1e293b", flexShrink: 0 }}>&gt;</span><span style={{ lineHeight: 1.5 }}>{log.text}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><span style={{ color: "#1e293b", fontSize: 12 }}>&gt;</span><div style={{ width: 7, height: 13, background: "#6366f1", animation: "cursorBlink 1s infinite" }} /></div>
          </div>
          {/* Floor progress indicator */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>{floorsCompleted.length}/{dungeon.floors} FLOORS</div>
            <div style={{ flex: 1, height: 2, background: "#0a0a14", borderRadius: 1, overflow: "hidden", maxWidth: 120 }}>
              <div style={{ height: "100%", background: rankData.color, borderRadius: 1, width: `${(floorsCompleted.length / dungeon.floors) * 100}%`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div style={{ textAlign: "center", padding: "0 24px", width: "100%", maxWidth: 420, animation: "dungeonResultIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 72, marginBottom: 12, filter: `drop-shadow(0 0 28px ${result.won ? "#22c55e" : "#ef4444"})`, animation: "gateFloat 2s ease-in-out infinite" }}>{result.won ? "🏆" : "💀"}</div>
          <div style={{ fontSize: result.won ? 28 : 22, fontWeight: 900, fontFamily: "'Cinzel',serif", color: result.won ? "#22c55e" : "#ef4444", textShadow: `0 0 32px ${result.won ? "#22c55e" : "#ef4444"}`, marginBottom: 6, letterSpacing: 2 }}>{result.won ? "DUNGEON CLEARED" : "HUNTER DEFEATED"}</div>
          {/* Floors stat */}
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 14 }}>
            {result.floorsCleared}/{result.totalFloors} FLOORS CONQUERED
          </div>
          <div style={{ background: "rgba(8,8,18,0.9)", border: `1px solid ${result.won ? "#22c55e22" : "#ef444422"}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12, display: "flex", justifyContent: "center", gap: 28 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>XP</div><div style={{ fontSize: 24, fontWeight: 900, color: result.won ? "#a78bfa" : "#334155", fontFamily: "'Cinzel',serif" }}>+{result.xp}</div></div>
            <div style={{ width: 1, background: "#0f1628" }} />
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>GOLD</div><div style={{ fontSize: 24, fontWeight: 900, color: result.won ? "#fbbf24" : "#334155", fontFamily: "'Cinzel',serif" }}>+{result.gold}</div></div>
            {result.goldBonus > 0 && <>
              <div style={{ width: 1, background: "#0f1628" }} />
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 5 }}>BONUS</div><div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", fontFamily: "'Cinzel',serif" }}>+{Math.round(result.goldBonus * (modifier?.goldMult || 1))}</div></div>
            </>}
          </div>
          {result.drop && (
            <div style={{ background: "rgba(8,8,18,0.9)", border: `1px solid ${RARITY_COLORS[result.drop.rarity]}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>{result.drop.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 9, color: RARITY_COLORS[result.drop.rarity], fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 2 }}>{RARITY_LABELS[result.drop.rarity].toUpperCase()} DROP</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{result.drop.name}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{result.drop.desc}</div>
              </div>
            </div>
          )}
          <button onClick={() => onResult(result)} style={{ width: "100%", padding: 16, borderRadius: 14, fontSize: 13, fontWeight: 700, background: result.won ? "linear-gradient(135deg,rgba(34,197,94,0.25),rgba(34,197,94,0.08))" : "linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.08))", color: result.won ? "#22c55e" : "#ef4444", border: `1px solid ${result.won ? "#22c55e44" : "#ef444444"}`, fontFamily: "'Cinzel',serif", letterSpacing: 2, animation: result.won ? "extractionPulse 2s infinite" : "none" }}>{result.won ? "⬆ EXTRACTION ABSCHLIESSEN" : "DUNGEON VERLASSEN"}</button>
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
          <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.5 }}>Das Job-System wird erst ab Level 50 freigeschaltet. Trainiere härter, Hunter. <br /><span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>Aktuelles Level: {state.level} / 50</span></div>
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

function SystemCLI({ message, onClose }) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentLineIndex < message.lines.length) {
      const currentLine = message.lines[currentLineIndex];
      if (currentCharIndex < currentLine.length) {
        const timeout = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[currentLineIndex] = (next[currentLineIndex] || "") + currentLine[currentCharIndex];
            return next;
          });
          setCurrentCharIndex(prev => prev + 1);
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, 400);
        return () => clearTimeout(timeout);
      }
    } else {
      setIsComplete(true);
    }
  }, [currentLineIndex, currentCharIndex, message.lines]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(2, 2, 8, 0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.3s ease" }}>
      <div style={{ width: "100%", maxWidth: 600, background: "rgba(10, 10, 20, 0.95)", border: "1px solid #6366f144", borderRadius: 12, padding: "24px", boxShadow: "0 0 40px rgba(99, 102, 241, 0.2)", position: "relative", overflow: "hidden" }}>
        {/* Scanline effect */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))", backgroundSize: "100% 4px, 3px 100%", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #6366f122", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1" }} />
            <div style={{ fontSize: 12, color: "#6366f1", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 3 }}>SYSTEM NACHRICHT</div>
          </div>
          <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>UID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
        </div>

        <div style={{ minHeight: 120, marginBottom: 24 }}>
          {displayedLines.map((line, i) => (
            <div key={i} style={{ color: i === 0 && message.title ? "#fff" : "#cbd5e1", fontSize: i === 0 && message.title ? 18 : 14, fontWeight: i === 0 && message.title ? 900 : 400, fontFamily: i === 0 && message.title ? "'Cinzel', serif" : "'JetBrains Mono', monospace", marginBottom: 12, lineHeight: 1.6, display: "flex", gap: 10 }}>
              <span style={{ color: "#6366f166", flexShrink: 0 }}>&gt;</span>
              <span>{line}</span>
            </div>
          ))}
          {!isComplete && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ color: "#6366f166", fontSize: 12 }}>&gt;</span>
              <div style={{ width: 7, height: 13, background: "#6366f1", animation: "cursorBlink 1s infinite" }} />
            </div>
          )}
        </div>

        {isComplete && (
          <button onClick={() => { if (message.onComplete) message.onComplete(); onClose(); }} style={{ width: "100%", padding: "14px", borderRadius: 8, background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", border: "1px solid #6366f144", fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, cursor: "pointer", transition: "all 0.3s" }}>[ NACHRICHT BESTÄTIGEN ]</button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────

export {
  RANKS, DIFFICULTIES, CATEGORIES, STRATEGIES, QUEST_TEMPLATES,
  SHADOW_CLASSES, SHADOW_TIERS, NAMED_SHADOWS, FORMATION_SLOTS,
  ACHIEVEMENTS, SKILLS, DUNGEON_MODIFIERS, FLOOR_TYPES, BOSS_PHASES,
  EQUIPMENT_POOL, RARITY_COLORS, RARITY_LABELS, DUNGEON_TEMPLATES, SHOP_ITEMS, THEMES, DEFAULT_STATE,
  JOB_XP_SOURCES, JOB_XP_LEVELS, JOB_TITLES,
  assignShadowClass, assignShadowTier, calcShadowXpToNext, createShadowFromQuest, calcFormationBonus, checkNamedShadowUnlocks, generateFloorPlan, getFloorLogs, checkHiddenQuestTriggers, generateEmergencyQuest, generateChainedQuest,
  getRank, getXpForLevel, getRankIndex, genId, getToday, getDailyModifier, calcPowerLevel, getEquipBonuses, checkSkillUnlocks, getSkillBonuses, checkAchievements, generateDungeons, generateDailySystemQuests
};
