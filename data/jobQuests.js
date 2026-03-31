export const JOB_QUESTS = {
  berserker: [
    {
      id: "berserker_trial_1",
      name: "Der Weg des Zorns",
      level: 1,
      tasks: [{ type: "questCategory", category: "str", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "berserker_trial_5",
      name: "Berserker Prüfung",
      level: 5,
      tasks: [
        { type: "dungeonStrategy", strategy: "str", count: 3 },
        { type: "stat", stat: "str", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ],
  archmage: [
    {
      id: "archmage_trial_1",
      name: "Mentale Disziplin",
      level: 1,
      tasks: [{ type: "questCategory", category: "int", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "archmage_trial_5",
      name: "Erzmagier Prüfung",
      level: 5,
      tasks: [
        { type: "dungeonStrategy", strategy: "int", count: 3 },
        { type: "stat", stat: "int", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ],
  guardian: [
    {
      id: "guardian_trial_1",
      name: "Eiserner Wille",
      level: 1,
      tasks: [{ type: "questCategory", category: "vit", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "guardian_trial_5",
      name: "Wächter Prüfung",
      level: 5,
      tasks: [
        { type: "dungeonStrategy", strategy: "vit", count: 3 },
        { type: "stat", stat: "vit", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ],
  assassin: [
    {
      id: "assassin_trial_1",
      name: "Schattenpfad",
      level: 1,
      tasks: [{ type: "questCategory", category: "agi", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "assassin_trial_5",
      name: "Assassinen Prüfung",
      level: 5,
      tasks: [
        { type: "dungeonStrategy", strategy: "agi", count: 3 },
        { type: "stat", stat: "agi", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ],
  monarch: [
    {
      id: "monarch_trial_1",
      name: "Souveräne Präsenz",
      level: 1,
      tasks: [{ type: "questCategory", category: "cha", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "monarch_trial_5",
      name: "Monarch Prüfung",
      level: 5,
      tasks: [
        { type: "questCategory", category: "cha", count: 10 },
        { type: "stat", stat: "cha", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ],
  necromancer: [
    {
      id: "necromancer_trial_1",
      name: "Ruf der Toten",
      level: 1,
      tasks: [{ type: "questCategory", category: "cha", count: 5 }],
      rewards: { jobXp: 50, xp: 200, gold: 100 }
    },
    {
      id: "necromancer_trial_5",
      name: "Nekromanten Prüfung",
      level: 5,
      tasks: [
        { type: "shadow_count", count: 20 },
        { type: "stat", stat: "cha", value: 75 }
      ],
      rewards: { jobXp: 200, xp: 1000, gold: 500 }
    }
  ]
};
