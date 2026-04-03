export const JOB_QUESTS = {
  berserker: [
    {
      id: "berserker_trial_1",
      name: "Trial of Wrath",
      description: "Beweise deine rohe Kraft.",
      levelRequired: 1,
      tasks: [
        { type: "complete_quests", category: "str", difficulty: "hard", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "berserker_trial_3",
      name: "Unstoppable Force",
      description: "Zeige, dass nichts dich aufhalten kann.",
      levelRequired: 3,
      tasks: [
        { type: "complete_quests", category: "str", count: 15, current: 0 },
        { type: "stat_reach", stat: "str", value: 50 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 2500, statBonus: { str: 5 } }
    },
    {
      id: "berserker_trial_5",
      name: "Berserker's Fury",
      description: "Entfessle den wahren Berserker in dir.",
      levelRequired: 5,
      tasks: [
        { type: "dungeon_clear", strategy: "str", count: 3, current: 0 },
        { type: "complete_quests", difficulty: "boss", category: "str", count: 3, current: 0 }
      ],
      rewards: { 
        jobXp: 200, xp: 1000, gold: 5000, 
        title: "Berserker's Heir",
        abilityUnlock: "rage_mode" 
      }
    },
    {
      id: "berserker_trial_7",
      name: "Wrath Incarnate",
      description: "Werde zur Verkörperung der Zerstörung.",
      levelRequired: 7,
      tasks: [
        { type: "stat_reach", stat: "str", value: 100 },
        { type: "dungeon_clear", rank: "B", count: 1, current: 0 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 10000, statBonus: { str: 10 } }
    },
    {
      id: "berserker_mastery",
      name: "Grand Master of Wrath",
      description: "Erreiche die Meisterschaft des Berserkers.",
      levelRequired: 10,
      tasks: [
        { type: "dungeon_clear", rank: "A", count: 1, current: 0 },
        { type: "use_ability", ability: "rage_mode", count: 10, current: 0 }
      ],
      rewards: { 
        jobXp: 1000, xp: 5000, gold: 25000,
        title: "Grand Master Berserker",
        cosmetic: "berserker_aura"
      }
    }
  ],
  
  archmage: [
    {
      id: "archmage_trial_1",
      name: "Pursuit of Knowledge",
      description: "Beginne den Pfad des Wissens.",
      levelRequired: 1,
      tasks: [
        { type: "complete_quests", category: "int", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "archmage_trial_3",
      name: "Scholarly Mind",
      description: "Vertiefe dein Verständnis.",
      levelRequired: 3,
      tasks: [
        { type: "stat_reach", stat: "int", value: 40 },
        { type: "complete_quests", category: "int", difficulty: "hard", count: 5, current: 0 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 2500, shopDiscount: 5 }
    },
    {
      id: "archmage_trial_5",
      name: "Arcane Mastery",
      description: "Meistere die taktischen Künste.",
      levelRequired: 5,
      tasks: [
        { type: "dungeon_clear", strategy: "int", count: 3, current: 0 },
        { type: "solve_puzzles", count: 5, current: 0 }
      ],
      rewards: { 
        jobXp: 200, xp: 1000, gold: 5000,
        title: "Arcane Scholar",
        abilityUnlock: "insight"
      }
    },
    {
      id: "archmage_trial_7",
      name: "Mind Over Matter",
      description: "Transzendiere physische Limitationen.",
      levelRequired: 7,
      tasks: [
        { type: "stat_reach", stat: "int", value: 100 },
        { type: "dungeon_clear", withoutDamage: true, count: 1, current: 0 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 10000, statBonus: { int: 10 } }
    },
    {
      id: "archmage_mastery",
      name: "Grand Archmage",
      description: "Werde zum Meister aller Geheimnisse.",
      levelRequired: 10,
      tasks: [
        { type: "dungeon_clear", rank: "A", strategy: "int", count: 1, current: 0 },
        { type: "complete_all_puzzle_floors", current: 0 }
      ],
      rewards: {
        jobXp: 1000, xp: 5000, gold: 25000,
        title: "Grand Archmage",
        cosmetic: "arcane_aura"
      }
    }
  ],
  
  guardian: [
    {
      id: "guardian_trial_1",
      name: "Shield Bearer",
      description: "Lerne, dich zu schützen.",
      levelRequired: 1,
      tasks: [
        { type: "complete_quests", category: "vit", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "guardian_trial_3",
      name: "Enduring Spirit",
      description: "Zeige unerschütterliche Ausdauer.",
      levelRequired: 3,
      tasks: [
        { type: "maintain_streak", days: 7 },
        { type: "complete_quests", category: "vit", count: 15, current: 0 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 2500, streakShield: 1 }
    },
    {
      id: "guardian_trial_5",
      name: "Immovable Object",
      description: "Werde unaufhaltsam.",
      levelRequired: 5,
      tasks: [
        { type: "dungeon_clear", strategy: "vit", count: 3, current: 0 },
        { type: "survive_without_losing_hp", dungeonCount: 1, current: 0 }
      ],
      rewards: {
        jobXp: 200, xp: 1000, gold: 5000,
        title: "Bulwark",
        abilityUnlock: "fortress"
      }
    },
    {
      id: "guardian_trial_7",
      name: "Iron Will",
      description: "Dein Wille ist stärker als Stahl.",
      levelRequired: 7,
      tasks: [
        { type: "stat_reach", stat: "vit", value: 100 },
        { type: "maintain_streak", days: 30 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 10000, statBonus: { vit: 10 } }
    },
    {
      id: "guardian_mastery",
      name: "Eternal Guardian",
      description: "Werde zum ewigen Beschützer.",
      levelRequired: 10,
      tasks: [
        { type: "dungeon_clear_without_defeat", count: 10, current: 0 },
        { type: "protect_streak", consecutiveDays: 60 }
      ],
      rewards: {
        jobXp: 1000, xp: 5000, gold: 25000,
        title: "Eternal Guardian",
        cosmetic: "guardian_shield_aura"
      }
    }
  ],
  
  assassin: [
    {
      id: "assassin_trial_1",
      name: "Swift Blade",
      description: "Geschwindigkeit ist deine Waffe.",
      levelRequired: 1,
      tasks: [
        { type: "complete_quests", category: "agi", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "assassin_trial_3",
      name: "Treasure Hunter",
      description: "Gold fließt zu dir.",
      levelRequired: 3,
      tasks: [
        { type: "earn_gold", amount: 5000, current: 0 },
        { type: "complete_quests", category: "agi", count: 15, current: 0 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 5000 }
    },
    {
      id: "assassin_trial_5",
      name: "Shadow Dance",
      description: "Bewege dich wie ein Schatten.",
      levelRequired: 5,
      tasks: [
        { type: "dungeon_clear", strategy: "agi", count: 3, current: 0 },
        { type: "clear_dungeon_fast", timeBonus: true, count: 2, current: 0 }
      ],
      rewards: {
        jobXp: 200, xp: 1000, gold: 7500,
        title: "Shadow Dancer",
        abilityUnlock: "shadow_step"
      }
    },
    {
      id: "assassin_trial_7",
      name: "Phantom Strike",
      description: "Du bist unsichtbar und tödlich.",
      levelRequired: 7,
      tasks: [
        { type: "stat_reach", stat: "agi", value: 100 },
        { type: "skip_floors", count: 5, current: 0 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 15000, statBonus: { agi: 10 } }
    },
    {
      id: "assassin_mastery",
      name: "Master Assassin",
      description: "Niemand entkommt dir.",
      levelRequired: 10,
      tasks: [
        { type: "dungeon_clear", rank: "A", strategy: "agi", count: 1, current: 0 },
        { type: "use_ability", ability: "shadow_step", count: 30, current: 0 }
      ],
      rewards: {
        jobXp: 1000, xp: 5000, gold: 30000,
        title: "Phantom",
        cosmetic: "shadow_trail"
      }
    }
  ],
  
  monarch: [
    {
      id: "monarch_trial_1",
      name: "Lord of Shadows",
      description: "Beginne, deine Armee zu führen.",
      levelRequired: 1,
      tasks: [
        { type: "own_shadows", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "monarch_trial_3",
      name: "Army Builder",
      description: "Erweitere deine Macht.",
      levelRequired: 3,
      tasks: [
        { type: "own_shadows", count: 15, current: 0 },
        { type: "deploy_formation", count: 10, current: 0 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 2500, shadowCapacity: 5 }
    },
    {
      id: "monarch_trial_5",
      name: "Commander",
      description: "Führe deine Armee in den Kampf.",
      levelRequired: 5,
      tasks: [
        { type: "dungeon_clear_with_shadows", count: 5, current: 0 },
        { type: "shadow_evolve", count: 3, current: 0 }
      ],
      rewards: {
        jobXp: 200, xp: 1000, gold: 5000,
        title: "Shadow Commander",
        abilityUnlock: "domain_expansion"
      }
    },
    {
      id: "monarch_trial_7",
      name: "Sovereign",
      description: "Herrsche über alle Schatten.",
      levelRequired: 7,
      tasks: [
        { type: "own_named_shadow", count: 1, current: 0 },
        { type: "complete_shadow_missions", count: 20, current: 0 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 10000, shadowCapacity: 10 }
    },
    {
      id: "monarch_mastery",
      name: "Shadow Monarch",
      description: "Werde zum wahren Monarchen.",
      levelRequired: 10,
      tasks: [
        { type: "own_shadows", count: 30, current: 0 },
        { type: "own_named_shadow", count: 3, current: 0 },
        { type: "use_ability", ability: "domain_expansion", count: 10, current: 0 }
      ],
      rewards: {
        jobXp: 1000, xp: 5000, gold: 25000,
        title: "Shadow Monarch",
        cosmetic: "monarch_crown_aura"
      }
    }
  ],
  
  necromancer: [
    {
      id: "necromancer_trial_1",
      name: "Death's Apprentice",
      description: "Lerne die Geheimnisse der Toten.",
      levelRequired: 1,
      tasks: [
        { type: "extract_shadow", count: 5, current: 0 }
      ],
      rewards: { jobXp: 50, xp: 200, gold: 1000 }
    },
    {
      id: "necromancer_trial_3",
      name: "Soul Harvester",
      description: "Sammle die Seelen der Gefallenen.",
      levelRequired: 3,
      tasks: [
        { type: "extract_shadow", count: 15, current: 0 },
        { type: "dungeon_clear", rank: "C", count: 3, current: 0 }
      ],
      rewards: { jobXp: 100, xp: 500, gold: 2500, shadowXpBonus: 0.1 }
    },
    {
      id: "necromancer_trial_5",
      name: "Master of the Dead",
      description: "Die Toten gehorchen dir.",
      levelRequired: 5,
      tasks: [
        { type: "shadow_evolve_to_tier", tier: 3, count: 3, current: 0 },
        { type: "complete_quests", difficulty: "boss", count: 10, current: 0 }
      ],
      rewards: {
        jobXp: 200, xp: 1000, gold: 5000,
        title: "Death Knight",
        abilityUnlock: "army_of_the_dead"
      }
    },
    {
      id: "necromancer_trial_7",
      name: "Lord of the Undead",
      description: "Transzendiere den Tod selbst.",
      levelRequired: 7,
      tasks: [
        { type: "awaken_named_shadow", count: 1, current: 0 },
        { type: "dungeon_clear", rank: "A", count: 1, current: 0 }
      ],
      rewards: { jobXp: 400, xp: 2000, gold: 10000, shadowEvolutionDiscount: 0.25 }
    },
    {
      id: "necromancer_mastery",
      name: "True Necromancer",
      description: "Werde zum Erben des Shadow Monarchen.",
      levelRequired: 10,
      tasks: [
        { type: "own_named_shadow", count: 4, current: 0 },
        { type: "shadow_army_power", value: 1000, current: 0 },
        { type: "use_ability", ability: "army_of_the_dead", count: 5, current: 0 }
      ],
      rewards: {
        jobXp: 1000, xp: 5000, gold: 25000,
        title: "True Necromancer",
        cosmetic: "death_aura",
        unlock: "tier_6_shadows"
      }
    }
  ]
};
