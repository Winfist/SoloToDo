export const JOBS = {
  berserker: {
    id: "berserker",
    name: "Berserker",
    icon: "⚔️",
    color: "#ef4444",
    statFocus: "str",
    unlockRequirement: { level: 50 },
    passives: {
      base: "+30% Speed für STR-Quests",
      level3: "+10% XP aus STR",
      level5: "+20% Dungeon Damage (Aggressive)",
      level7: "+25% XP für Hard/Boss",
      level10: "Rage Mode unlocked"
    },
    activeAbility: {
      key: "rage_mode",
      name: "Rage Mode",
      icon: "🔥",
      desc: "2x XP für 1 Stunde",
      unlockLevel: 5,
      cooldown: 86400 // 24h
    }
  },
  archmage: {
    id: "archmage",
    name: "Archmage",
    icon: "📖",
    color: "#3b82f6",
    statFocus: "int",
    unlockRequirement: { level: 50 },
    passives: {
      base: "+30% XP für INT",
      level3: "+1% Shop-Discount pro 5 INT",
      level5: "+15% Tactical Strategy Success",
      level7: "Rätsel automatisch lösen",
      level10: "Insight unlocked"
    },
    activeAbility: {
      key: "insight",
      name: "Insight",
      icon: "👁️",
      desc: "Zeigt optimale Dungeonstrategie",
      unlockLevel: 5,
      cooldown: 43200 // 12h
    }
  },
  guardian: {
    id: "guardian",
    name: "Guardian",
    icon: "🛡️",
    color: "#10b981",
    statFocus: "vit",
    unlockRequirement: { level: 50 },
    passives: {
      base: "Streak Shield +3",
      level3: "+10% Vit Stats Bonus",
      level5: "Dungeon Failure Rewards = 50%",
      level7: "Absoluter Schutz vor XP-Verlust",
      level10: "Fortress unlocked"
    },
    activeAbility: {
      key: "fortress",
      name: "Fortress",
      icon: "🏰",
      desc: "Dungeon Niederlage -> Trotzdem Sieg mit 50% Reward",
      unlockLevel: 5,
      cooldown: 604800 // 7 days
    }
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    icon: "🗡️",
    color: "#14b8a6",
    statFocus: "agi",
    unlockRequirement: { level: 50 },
    passives: {
      base: "Gold Bonus +50%",
      level3: "+10% AGI Quests XP",
      level5: "Dungeon Time Reduction +20%",
      level7: "Floor Skip Chance +10%",
      level10: "Shadow Step unlocked"
    },
    activeAbility: {
      key: "shadow_step",
      name: "Shadow Step",
      icon: "💨",
      desc: "Dungeon FloorSkip manuell (3x/Tag)",
      unlockLevel: 5,
      cooldown: 28800 // 8h per use
    }
  },
  monarch: {
    id: "monarch",
    name: "Monarch",
    icon: "👑",
    color: "#f59e0b",
    statFocus: "cha",
    unlockRequirement: { level: 50 },
    passives: {
      base: "Alle XP +15%",
      level3: "Shadow Capacity +10",
      level5: "Shadow Support in Dungeon +15%",
      level7: "Alle Stats +5",
      level10: "Domain Expansion unlocked"
    },
    activeAbility: {
      key: "domain_expansion",
      name: "Domain Expansion",
      icon: "🌌",
      desc: "Alle Boni verdoppelt für 1 Stunde",
      unlockLevel: 5,
      cooldown: 86400 // 24h
    }
  },
  necromancer: {
    id: "necromancer",
    name: "Necromancer",
    icon: "💀",
    color: "#a855f7",
    statFocus: "cha",
    unlockRequirement: { level: 50 },
    passives: {
      base: "Shadow XP +30%",
      level3: "Shadow Evolution Cost -20%",
      level5: "Shadow Auto-Fight Bonus",
      level7: "Dungeon Extraction Bonus +25%",
      level10: "Army of the Dead unlocked"
    },
    activeAbility: {
      key: "army_of_the_dead",
      name: "Army of the Dead",
      icon: "🧟",
      desc: "Alle Shadows zählen als eingesetzt im Dungeon",
      unlockLevel: 5,
      cooldown: 604800 // 7 days
    }
  }
};
