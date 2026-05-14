// ─── GATE ARTIFACTS ───────────────────────────────────────────
// Items that drop from Dungeon Gates and unlock real productivity
// features — not just passive stat multipliers.
//
// Each artifact extends the ToDo system with a new capability:
// focus tags, habit chains, planning tools, timer bonuses, etc.

import { ITEM_ICONS, GATE_ICONS, HABIT_ICONS, QUEST_ICONS, NAV_ICONS, SKILL_ICONS, STAT_ICONS } from "./icons.js";

// ─── ARTIFACT POOL ────────────────────────────────────────────
export const ARTIFACT_POOL = [
  // ── E-Rang Artifacts ──────────────────────────────────────────
  {
    id: "zeitkristall",
    name: "Zeitkristall",
    desc: "Verkürzt die Quest-Reifezeit um 30 Minuten.",
    lore: "Ein Fragment der Zeit, eingeschlossen in einem Gate-Kristall. Es beschleunigt den Fluss der Realität.",
    category: "quest",
    rarity: "uncommon",
    minRank: "E",
    dropChance: 0.35,
    iconSrc: ITEM_ICONS.potion,
    icon: "⏳",
    color: "#22d3ee",
    effect: { type: "quest_timer_reduction", value: 30 }, // 30 minutes
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Zeitkristall erlangt.",
        "Quest-Reifezeit permanent um 30 Minuten verkürzt.",
        "Die Zeit beugt sich deinem Willen, Hunter."
      ]
    }
  },
  {
    id: "routine_stein",
    name: "Routine-Stein",
    desc: "Schaltet einen zusätzlichen Habit-Slot frei.",
    lore: "Ein uralter Stein, der die Macht der Wiederholung in sich trägt. Er verstärkt die Kraft der Gewohnheit.",
    category: "habit",
    rarity: "uncommon",
    minRank: "E",
    dropChance: 0.35,
    iconSrc: HABIT_ICONS.timer,
    icon: "🪨",
    color: "#22c55e",
    effect: { type: "habit_slot_bonus", value: 1 },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Routine-Stein erlangt.",
        "+1 Habit-Slot permanent freigeschaltet.",
        "Disziplin wird zur zweiten Natur."
      ]
    }
  },

  // ── D-Rang Artifacts ──────────────────────────────────────────
  {
    id: "fokus_amulett",
    name: "Fokus-Amulett",
    desc: "Markiere 1 Quest pro Tag als Tagesfokus → +50% XP beim Abschluss.",
    lore: "Dieses Amulett fokussiert die Willenskraft auf ein einziges Ziel. Wer es trägt, wird unaufhaltsam.",
    category: "quest",
    rarity: "rare",
    minRank: "D",
    dropChance: 0.25,
    iconSrc: SKILL_ICONS.magic,
    icon: "🎯",
    color: "#f59e0b",
    effect: { type: "daily_focus_quest", xpBonus: 0.5 },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Fokus-Amulett erlangt.",
        "Neue Fähigkeit: Markiere täglich 1 Quest als Tagesfokus.",
        "Tagesfokus-Quests gewähren +50% XP.",
        "Konzentration ist Macht, Hunter."
      ]
    }
  },
  {
    id: "kalender_rune",
    name: "Kalender-Rune",
    desc: "Quests mit Deadline zeigen 2h vorher eine auffällige Warnung.",
    lore: "Die Rune offenbart den Fluss der Zeit. Keine Deadline entgeht dem Auge des Hunters.",
    category: "planning",
    rarity: "rare",
    minRank: "D",
    dropChance: 0.25,
    iconSrc: NAV_ICONS.calendar,
    icon: "📅",
    color: "#a855f7",
    effect: { type: "deadline_warning", hoursBeforeWarning: 2 },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Kalender-Rune erlangt.",
        "Deadline-Warnung aktiviert: 2 Stunden vor Ablauf.",
        "Das System warnt dich rechtzeitig."
      ]
    }
  },
  {
    id: "ketten_fragment",
    name: "Ketten-Fragment",
    desc: "+1 zusätzliche Chain-Quest-Stufe möglich (Standard: 3 → jetzt 4).",
    lore: "Ein Fragment einer uralten Kette. Es verlängert die Verbindung zwischen Quests.",
    category: "quest",
    rarity: "rare",
    minRank: "D",
    dropChance: 0.20,
    iconSrc: QUEST_ICONS.chain,
    icon: "⛓️",
    color: "#6366f1",
    effect: { type: "chain_quest_bonus", value: 1 },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Ketten-Fragment erlangt.",
        "Maximale Chain-Quest-Stufe um +1 erhöht.",
        "Die Kette wird stärker mit jedem Glied."
      ]
    }
  },

  // ── C-Rang Artifacts ──────────────────────────────────────────
  {
    id: "duplex_rune",
    name: "Duplex-Rune",
    desc: "Quest-Klonen: Kopiere eine erfolgreiche Quest als Template.",
    lore: "Die Rune der Dualität erlaubt es, Erfolge zu replizieren.",
    category: "quest",
    rarity: "epic",
    minRank: "C",
    dropChance: 0.20,
    iconSrc: QUEST_ICONS.daily,
    icon: "📋",
    color: "#3b82f6",
    effect: { type: "quest_clone" },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Duplex-Rune erlangt.",
        "Neue Fähigkeit: Klone erfolgreiche Quests als wiederverwendbare Templates.",
        "Effizienz ist die Waffe des klugen Hunters."
      ]
    }
  },
  {
    id: "momentum_kristall",
    name: "Momentum-Kristall",
    desc: "3 Quests hintereinander abgeschlossen → 4. Quest gibt doppelte XP.",
    lore: "Der Kristall absorbiert Momentum. Je mehr du tust, desto stärker wirst du.",
    category: "quest",
    rarity: "epic",
    minRank: "C",
    dropChance: 0.18,
    iconSrc: STAT_ICONS.agi,
    icon: "💎",
    color: "#22d3ee",
    effect: { type: "momentum_bonus", questsNeeded: 3, xpMult: 2.0 },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Momentum-Kristall erlangt.",
        "Momentum-Modus aktiviert: 3 Quests am Stück → 4. Quest gibt doppelte XP.",
        "Momentum ist unaufhaltsam."
      ]
    }
  },
  {
    id: "planungs_kompass",
    name: "Planungs-Kompass",
    desc: "Plane Quests für morgen schon heute Abend.",
    lore: "Der Kompass zeigt nicht nach Norden — er zeigt in die Zukunft.",
    category: "planning",
    rarity: "epic",
    minRank: "C",
    dropChance: 0.15,
    iconSrc: NAV_ICONS.goals,
    icon: "🧭",
    color: "#34d399",
    effect: { type: "quest_pre_planning" },
    systemMessage: {
      title: "ARTIFACT ENTDECKT",
      lines: [
        "Planungs-Kompass erlangt.",
        "Neue Fähigkeit: Quest-Vorplanung für den nächsten Tag.",
        "Vorbereitung ist der halbe Sieg."
      ]
    }
  },

  // ── B-Rang Artifacts ──────────────────────────────────────────
  {
    id: "disziplin_siegel",
    name: "Disziplin-Siegel",
    desc: "Markiere 1 Stunde pro Tag als 'Eiserne Stunde' → alle Quests darin: +100% XP.",
    lore: "Dieses Siegel brennt sich in die Zeit. Eine Stunde absoluter Kontrolle.",
    category: "focus",
    rarity: "epic",
    minRank: "B",
    dropChance: 0.15,
    iconSrc: SKILL_ICONS.defense,
    icon: "🔱",
    color: "#ef4444",
    effect: { type: "iron_hour", xpBonus: 1.0 },
    systemMessage: {
      title: "SELTENES ARTIFACT ENTDECKT",
      lines: [
        "Disziplin-Siegel erlangt.",
        "Neue Fähigkeit: 'Eiserne Stunde' — 1h pro Tag mit +100% XP.",
        "Absolute Disziplin. Absolute Macht.",
        "Wähle deine Stunde weise, Hunter."
      ]
    }
  },
  {
    id: "willenskraft_relikt",
    name: "Willenskraft-Relikt",
    desc: "Streak-Freeze: 1x pro Woche einen verpassten Habit-Tag nachholen.",
    lore: "Ein Relikt aus einer vergangenen Ära. Es biegt die Regeln der Disziplin.",
    category: "habit",
    rarity: "epic",
    minRank: "B",
    dropChance: 0.12,
    iconSrc: STAT_ICONS.vit,
    icon: "🛡️",
    color: "#a78bfa",
    effect: { type: "habit_streak_freeze", usesPerWeek: 1 },
    systemMessage: {
      title: "SELTENES ARTIFACT ENTDECKT",
      lines: [
        "Willenskraft-Relikt erlangt.",
        "Neue Fähigkeit: Streak-Freeze — 1x pro Woche einen Habit-Tag nachholen.",
        "Selbst der stärkste Hunter verdient eine zweite Chance."
      ]
    }
  },

  // ── A-Rang Artifacts ──────────────────────────────────────────
  {
    id: "monarchen_auge",
    name: "Monarchen-Auge",
    desc: "Wochen-Vorschau: KI-generierte Übersicht basierend auf Habits + Quests.",
    lore: "Das Auge des Monarchen sieht alle Pfade. Vergangenheit, Gegenwart und Zukunft.",
    category: "planning",
    rarity: "legendary",
    minRank: "A",
    dropChance: 0.10,
    iconSrc: SKILL_ICONS.magic,
    icon: "👁️",
    color: "#f59e0b",
    effect: { type: "weekly_preview" },
    systemMessage: {
      title: "LEGENDÄRES ARTIFACT ENTDECKT",
      lines: [
        "Monarchen-Auge erlangt.",
        "Das Auge sieht alles. Es offenbart deine Woche.",
        "KI-Analyse deiner Quests und Habits: AKTIVIERT.",
        "Du siehst nun, was andere nicht sehen können."
      ]
    }
  },
  {
    id: "perfektions_siegel",
    name: "Perfektions-Siegel",
    desc: "Perfekter Tag: Alle Habits abgehakt → Bonus-Belohnung + System-Nachricht.",
    lore: "Das Siegel des Perfektionisten. Es verlangt alles — und belohnt mit allem.",
    category: "habit",
    rarity: "legendary",
    minRank: "A",
    dropChance: 0.10,
    iconSrc: NAV_ICONS.achievements,
    icon: "⭐",
    color: "#fbbf24",
    effect: { type: "perfect_day_bonus", xpBonus: 100, goldBonus: 50 },
    systemMessage: {
      title: "LEGENDÄRES ARTIFACT ENTDECKT",
      lines: [
        "Perfektions-Siegel erlangt.",
        "'Perfekter Tag'-Bonus freigeschaltet.",
        "Alle Habits an einem Tag = Bonus-Belohnung.",
        "Perfektion ist kein Zufall — es ist eine Entscheidung."
      ]
    }
  },

  // ── S-Rang Artifacts ──────────────────────────────────────────
  {
    id: "zeitverwerfung",
    name: "Zeitverwerfung",
    desc: "+1 permanenter Extra-Quest-Slot.",
    lore: "Die Zeitverwerfung zerreisst die Grenzen der Realität. Mehr Quests. Mehr Macht.",
    category: "quest",
    rarity: "legendary",
    minRank: "S",
    dropChance: 0.08,
    iconSrc: GATE_ICONS.red,
    icon: "🌀",
    color: "#e879f9",
    effect: { type: "permanent_quest_slot", value: 1 },
    systemMessage: {
      title: "MYTHISCHES ARTIFACT ENTDECKT",
      lines: [
        "Zeitverwerfung erlangt.",
        "+1 permanenter Quest-Slot freigeschaltet.",
        "Die Grenzen deiner Realität wurden erweitert.",
        "Du bist jenseits aller Grenzen, Monarch."
      ]
    }
  },
];

// ─── RARITY CONFIG ────────────────────────────────────────────
export const ARTIFACT_RARITY = {
  uncommon: { label: "Uncommon", color: "#22c55e", glow: "rgba(34,197,94,0.4)" },
  rare:     { label: "Rare",     color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  epic:     { label: "Epic",     color: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  legendary:{ label: "Legendary",color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
};

// ─── DROP LOGIC ───────────────────────────────────────────────

/**
 * Roll for an artifact drop after a dungeon victory.
 * Returns the artifact object or null.
 */
export function rollArtifactDrop(dungeonRank, discoveredArtifacts = []) {
  const discovered = new Set(discoveredArtifacts);

  // Filter pool: matching rank + not already discovered
  const pool = ARTIFACT_POOL.filter(a =>
    a.minRank === dungeonRank && !discovered.has(a.id)
  );

  if (pool.length === 0) return null;

  // Roll for each artifact in the pool (highest rarity first)
  const rarityOrder = ["legendary", "epic", "rare", "uncommon"];
  const sorted = [...pool].sort((a, b) =>
    rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  for (const artifact of sorted) {
    if (Math.random() < artifact.dropChance) {
      return artifact;
    }
  }

  return null;
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────

/**
 * Check if a specific artifact has been discovered.
 */
export function hasArtifact(state, artifactId) {
  return (state?.artifacts?.discovered || []).includes(artifactId);
}

/**
 * Get all discovered artifact objects.
 */
export function getDiscoveredArtifacts(state) {
  const ids = state?.artifacts?.discovered || [];
  return ARTIFACT_POOL.filter(a => ids.includes(a.id));
}

/**
 * Get the quest timer reduction in minutes from artifacts.
 */
export function getQuestTimerReduction(state) {
  if (!hasArtifact(state, "zeitkristall")) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "zeitkristall");
  return artifact?.effect?.value || 0;
}

/**
 * Get extra habit slots from artifacts.
 */
export function getArtifactHabitSlotBonus(state) {
  if (!hasArtifact(state, "routine_stein")) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "routine_stein");
  return artifact?.effect?.value || 0;
}

/**
 * Check if daily focus quest feature is unlocked.
 */
export function hasFocusQuestAbility(state) {
  return hasArtifact(state, "fokus_amulett");
}

/**
 * Get the focus quest XP bonus multiplier (e.g. 0.5 = +50%).
 */
export function getFocusQuestXpBonus(state) {
  if (!hasArtifact(state, "fokus_amulett")) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "fokus_amulett");
  return artifact?.effect?.xpBonus || 0;
}

/**
 * Check if deadline warning is unlocked.
 */
export function hasDeadlineWarning(state) {
  return hasArtifact(state, "kalender_rune");
}

/**
 * Get deadline warning hours.
 */
export function getDeadlineWarningHours(state) {
  if (!hasDeadlineWarning(state)) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "kalender_rune");
  return artifact?.effect?.hoursBeforeWarning || 0;
}

/**
 * Get extra chain quest steps from artifacts.
 */
export function getChainQuestBonus(state) {
  if (!hasArtifact(state, "ketten_fragment")) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "ketten_fragment");
  return artifact?.effect?.value || 0;
}

/**
 * Check if momentum bonus is active.
 * Returns { active, questsNeeded, xpMult } or null.
 */
export function getMomentumBonus(state) {
  if (!hasArtifact(state, "momentum_kristall")) return null;
  const artifact = ARTIFACT_POOL.find(a => a.id === "momentum_kristall");
  return {
    active: true,
    questsNeeded: artifact?.effect?.questsNeeded || 3,
    xpMult: artifact?.effect?.xpMult || 2.0,
  };
}

/**
 * Check if quest cloning is unlocked.
 */
export function hasQuestClone(state) {
  return hasArtifact(state, "duplex_rune");
}

/**
 * Check if quest pre-planning is unlocked.
 */
export function hasQuestPrePlanning(state) {
  return hasArtifact(state, "planungs_kompass");
}

/**
 * Check if iron hour is unlocked.
 */
export function hasIronHour(state) {
  return hasArtifact(state, "disziplin_siegel");
}

/**
 * Get iron hour XP bonus.
 */
export function getIronHourXpBonus(state) {
  if (!hasIronHour(state)) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "disziplin_siegel");
  return artifact?.effect?.xpBonus || 0;
}

/**
 * Check if habit streak freeze is unlocked.
 */
export function hasHabitStreakFreeze(state) {
  return hasArtifact(state, "willenskraft_relikt");
}

/**
 * Check if perfect day bonus is active.
 */
export function getPerfectDayBonus(state) {
  if (!hasArtifact(state, "perfektions_siegel")) return null;
  const artifact = ARTIFACT_POOL.find(a => a.id === "perfektions_siegel");
  return {
    xpBonus: artifact?.effect?.xpBonus || 100,
    goldBonus: artifact?.effect?.goldBonus || 50,
  };
}

/**
 * Get extra permanent quest slots from artifacts.
 */
export function getArtifactQuestSlotBonus(state) {
  if (!hasArtifact(state, "zeitverwerfung")) return 0;
  const artifact = ARTIFACT_POOL.find(a => a.id === "zeitverwerfung");
  return artifact?.effect?.value || 0;
}

/**
 * Get a summary of all active artifact effects for display.
 */
export function getActiveArtifactEffects(state) {
  const effects = [];
  const discovered = getDiscoveredArtifacts(state);

  for (const artifact of discovered) {
    effects.push({
      id: artifact.id,
      name: artifact.name,
      icon: artifact.icon,
      color: artifact.color,
      desc: artifact.desc,
      rarity: artifact.rarity,
      category: artifact.category,
    });
  }

  return effects;
}
