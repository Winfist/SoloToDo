import { SEASONS, WORLD_EVENTS } from "./seasons.js";

// ─── ENGLISH OVERRIDES FOR SEASONS ────────────────────────────────────────────
const EN_SEASONS = {
  frost: {
    name: "Frost Monarch",
    loreText: "The Frost Monarch reigns. Cold tempers the body. Only the tough survive the winter.",
    systemQuests: [
      { title: "Icy Morning Routine: Cold shower 3 days in a row" },
      { title: "Frost Training: 30 min outdoor sports in winter" },
    ],
    achievement: { title: "Frost Monarch", desc: "Complete 10 Quests during the Frost season" },
    seasonTitle: "Frost Monarch",
  },
  spring: {
    name: "Spring Awakening",
    loreText: "Rebirth. The gates open after a long sleep. Every day a new ascent.",
    systemQuests: [
      { title: "Spring Awakening: Start a 7-day morning routine" },
      { title: "Start a new skill – practice daily for 5 days" },
    ],
    achievement: { title: "Awakened", desc: "Complete 10 Quests during the Spring Awakening season" },
    seasonTitle: "Awakened",
  },
  inferno: {
    name: "Inferno Gate",
    loreText: "The gates of hell are open. The heat forges legends. Only the strong survive.",
    systemQuests: [
      { title: "Inferno Challenge: 100 push-ups in 5 days" },
      { title: "Heatwave: Maximum training intensity for 3 days" },
    ],
    achievement: { title: "Inferno Conqueror", desc: "Complete 10 Quests during the Inferno Gate season" },
    seasonTitle: "Inferno Conqueror",
  },
  redgate: {
    name: "Red Gate",
    loreText: "The Red Gate opens. No way out. Double your power – or fall.",
    systemQuests: [
      { title: "Red Gate: Study 1 hour daily – 7 days" },
      { title: "Autumn Offensive: Complete financial planning" },
    ],
    achievement: { title: "Red Gate Survivor", desc: "Complete 10 Quests during the Red Gate season" },
    seasonTitle: "Red Gate Survivor",
  },
};

const EN_WORLD_EVENTS = {
  double_xp: {
    name: "Double Experience",
    desc: "All XP +50% for this week",
  },
  gold_rush: {
    name: "Gold Rush",
    desc: "All Gold rewards +75% for this week",
  },
  shadow_surge: {
    name: "Shadow Surge",
    desc: "Shadow extraction rate doubled this week",
  },
  dungeon_frenzy: {
    name: "Dungeon Frenzy",
    desc: "+30% success chance in Dungeons this week",
  },
  chain_breaker: {
    name: "Chain Breaker",
    desc: "Chained Quests give +50% XP this week",
  },
  stat_surge: {
    name: "Stat Surge",
    desc: "Stat points from Quests +100% this week",
  },
  merchant_arrival: {
    name: "Merchant Arrival",
    desc: "All Shop items -30% discount this week",
  },
  emergency_protocol: {
    name: "Emergency Protocol",
    desc: "Emergency Quests give 3× rewards this week",
  },
};

/**
 * Returns the localized seasons object.
 * @param {string} locale "en" or "de"
 */
export function getLocalizedSeasons(locale) {
  if (!locale || locale.startsWith("de")) return SEASONS;

  const localized = {};
  for (const [key, season] of Object.entries(SEASONS)) {
    const override = EN_SEASONS[key];
    if (!override) {
      localized[key] = season;
      continue;
    }

    localized[key] = {
      ...season,
      name: override.name || season.name,
      loreText: override.loreText || season.loreText,
      seasonTitle: override.seasonTitle || season.seasonTitle,
      achievement: {
        ...season.achievement,
        ...override.achievement
      },
      systemQuests: season.systemQuests.map((sq, i) => {
        const sqOverride = override.systemQuests[i];
        if (!sqOverride) return sq;
        return {
          ...sq,
          title: sqOverride.title || sq.title
        };
      })
    };
  }

  return localized;
}

/**
 * Returns the localized world events array.
 * @param {string} locale "en" or "de"
 */
export function getLocalizedWorldEvents(locale) {
  if (!locale || locale.startsWith("de")) return WORLD_EVENTS;

  return WORLD_EVENTS.map(event => {
    const override = EN_WORLD_EVENTS[event.key];
    if (!override) return event;
    return {
      ...event,
      name: override.name || event.name,
      desc: override.desc || event.desc
    };
  });
}
