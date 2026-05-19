import { JOB_QUESTS } from "./jobQuests.js";

// ─── ENGLISH OVERRIDES FOR JOB QUESTS ─────────────────────────────────────────
const EN_JOB_QUESTS = {
  berserker: {
    berserker_trial_1: { description: "Prove your raw strength." },
    berserker_trial_3: { description: "Show that nothing can stop you." },
    berserker_trial_5: { description: "Unleash the true berserker within you." },
    berserker_trial_7: { description: "Become the embodiment of destruction." },
    berserker_mastery: { description: "Achieve the mastery of the Berserker." },
  },
  archmage: {
    archmage_trial_1: { description: "Begin the path of knowledge." },
    archmage_trial_3: { description: "Deepen your understanding." },
    archmage_trial_5: { description: "Master the tactical arts." },
    archmage_trial_7: { description: "Transcend physical limitations." },
    archmage_mastery: { description: "Become the master of all secrets." },
  },
  guardian: {
    guardian_trial_1: { description: "Learn to protect yourself." },
    guardian_trial_3: { description: "Show unwavering endurance." },
    guardian_trial_5: { description: "Become unstoppable." },
    guardian_trial_7: { description: "Your will is stronger than steel." },
    guardian_mastery: { description: "Become the eternal protector." },
  },
  assassin: {
    assassin_trial_1: { description: "Speed is your weapon." },
    assassin_trial_3: { description: "Gold flows to you." },
    assassin_trial_5: { description: "Move like a shadow." },
    assassin_trial_7: { description: "You are invisible and deadly." },
    assassin_mastery: { description: "No one escapes you." },
  },
  monarch: {
    monarch_trial_1: { description: "Begin to lead your army." },
    monarch_trial_3: { description: "Expand your power." },
    monarch_trial_5: { description: "Lead your army into battle." },
    monarch_trial_7: { description: "Rule over all shadows." },
    monarch_mastery: { description: "Become the true monarch." },
  },
  necromancer: {
    necromancer_trial_1: { description: "Learn the secrets of the dead." },
    necromancer_trial_3: { description: "Harvest the souls of the fallen." },
    necromancer_trial_5: { description: "The dead obey you." },
    necromancer_trial_7: { description: "Transcend death itself." },
    necromancer_mastery: { description: "Become the heir to the Shadow Monarch." },
  }
};

/**
 * Returns the localized job quests based on the locale.
 * @param {string} locale "en" or "de"
 */
export function getLocalizedJobQuests(locale) {
  if (!locale || locale.startsWith("de")) {
    return JOB_QUESTS;
  }

  const localized = {};

  for (const [jobClass, trials] of Object.entries(JOB_QUESTS)) {
    localized[jobClass] = trials.map(trial => {
      const override = EN_JOB_QUESTS[jobClass]?.[trial.id];
      if (!override) return trial;

      return {
        ...trial,
        description: override.description || trial.description
      };
    });
  }

  return localized;
}
