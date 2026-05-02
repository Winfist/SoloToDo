// Central icon registry – maps keys to /icons/*.png assets
// Usage: import { STAT_ICONS, SHADOW_ICONS, GATE_ICONS } from '../data/icons.js';
//        <img src={STAT_ICONS.str} className="game-icon" alt="STR" />

export const STAT_ICONS = {
    str: "/icons/.webp",
    int: "/icons/.webp",
    vit: "/icons/.webp",
    agi: "/icons/.webp",
    cha: "/icons/.webp",
};

export const SHADOW_ICONS = {
    soldier:   "/icons/.webp",
    mage:      "/icons/.webp",
    commander: "/icons/.webp",
    igris:     "/icons/.webp",
    beru:      "/icons/.webp",
    bellion:   "/icons/.webp",
    assassin:  "/icons/.webp",
    knight:    "/icons/.webp",
    healer:    "/icons/.webp",
};

export const GATE_ICONS = {
    normal:   "/icons/.webp",
    red:      "/icons/.webp",
    ice:      "/icons/.webp",
    saferoom: "/icons/.webp",
};

export const ITEM_ICONS = {
    blade: "/icons/.webp",
    armor: "/icons/.webp",
    ring: "/icons/.webp",
    potion: "/icons/.webp",
};

export const SHOP_ICONS = {
    title: "/icons/.webp",
    theme: "/icons/.webp",
};

export const SKILL_ICONS = {
    attack: "/icons/.webp",
    defense: "/icons/.webp",
    magic: "/icons/.webp",
    speed: "/icons/.webp",
};

export const SYSTEM_ICONS = {
    logo: "/icons/.webp",
};

export const NAV_ICONS = {
    dashboard:    "/icons/.webp",
    goals:        "/icons/.webp",
    settings:     "/icons/.webp",
    shop:         "/icons/.webp",
    jobs:         "/icons/.webp",
    events:       "/icons/.webp",
    analytics:    "/icons/.webp",
    achievements: "/icons/.webp",
    timer:        "/icons/.webp",
    guild:        "/icons/.webp",
};

export const QUEST_ICONS = {
    daily:     "/icons/.webp",
    weekly:    "/icons/.webp",
    emergency: "/icons/.webp",
    chain:     "/icons/.webp",
    hidden:    "/icons/.webp",
};

export const BACKGROUNDS = {
    habitBanner: "/backgrounds/habit_banner_epic.png",
    emergency:   "/backgrounds/emergency_hero.png",
    boss:        "/backgrounds/quest_bg_boss.png",
    standard:    "/backgrounds/quest_bg_standard.png",
};

export const DIFF_ICONS = {
    easy:   "/icons/.webp",
    normal: "/icons/.webp",
    hard:   "/icons/.webp",
    boss:   "/icons/.webp",
};

export const ROLE_ICONS = {
    tank:      "/icons/.webp",
    vanguard:  "/icons/.webp",
    core:      "/icons/.webp",
    rearguard: "/icons/.webp",
};

export const STYLE_ICONS = {
    aggressive: "/icons/.webp",
    tactical:   "/icons/.webp",
    defensive:  "/icons/.webp",
    swift:      "/icons/.webp",
};

export const DUNGEON_ICONS = {
    bloodmoon:   "/icons/.webp",
    densemana:   "/icons/.webp",
    floorElite:  "/icons/.webp",
    floorPuzzle: "/icons/.webp",
    floorTreasure: "/icons/.webp",
};

export const JOB_ICONS = {
    berserker:  "/icons/.webp",
    archmage:   "/icons/.webp",
    insight:    "/icons/.webp",
    guardian:   "/icons/.webp",
    fortress:   "/icons/.webp",
    assassin:   "/icons/.webp",
    shadowstep: "/icons/.webp",
    monarch:    "/icons/.webp",
    domain:     "/icons/.webp",
    necromancer:"/icons/.webp",
    necromancerBig:"/icons/.webp",
    assassinBig: "/icons/.webp",
    berserkerBig: "/icons/.webp",
    archmageBig: "/icons/.webp",
    armydead:   "/icons/.webp",
};

export const HABIT_ICONS = {
    fitness:      "/icons/.webp",
    health:       "/icons/.webp",
    mindfulness:  "/icons/.webp",
    weekday:      "/icons/.webp",
    weekend:      "/icons/.webp",
    manual:       "/icons/.webp",
    timer:        "/icons/.webp",
    counter:      "/icons/.webp",
};

export const MICRO_ICONS = {
    water:     "/icons/.webp",
    stretch:   "/icons/.webp",
    gratitude: "/icons/.webp",
    breathe:   "/icons/.webp",
};

export const HEALTH_ICONS = {
    steps: "/icons/.webp",
    sleep: "/icons/.webp",
};

export const SEASON_ICONS = {
    frost:     "/icons/.webp",
    spring:    "/icons/.webp",
    inferno:   "/icons/.webp",
    redgate:   "/icons/.webp",
    statsurge: "/icons/.webp",
    merchant:  "/icons/.webp",
};

export const CHA_ICONS = {
    conversation:   "/icons/.webp",
    romance:        "/icons/.webp",
    publicspeaking: "/icons/.webp",
};

export const DOMAIN_ICONS = {
    career: "/icons/.webp",
    dating: "/icons/.webp",
};

export const SOCIAL_ICONS = {
    global: "/icons/.webp",
};

export const STORY_ICONS = {
    arise:       "/icons/.webp",
    scroll:      "/icons/.webp",
    helmet:      "/icons/.webp",
    blackheart:  "/icons/.webp",
    butterfly:   "/icons/.webp",
    cerberus:    "/icons/.webp",
    dawn:        "/icons/.webp",
    dragon:      "/icons/.webp",
    association: "/icons/.webp",
    mountain:    "/icons/.webp",
    door:        "/icons/.webp",
    scales:      "/icons/.webp",
    statue:      "/icons/.webp",
    systeminit:  "/icons/.webp",
};

export const BOSS_ICONS = {
    awakening:  "/icons/.webp",
    unleashed:  "/icons/.webp",
    calamity:   "/icons/.webp",
    deathsdoor: "/icons/.webp",
};

export const GEM_ICONS = {
    gem:        "/icons/.webp",
    gemShop:    "/icons/.webp",
    booster:    "/icons/.webp",
    adReward:   "/icons/.webp",
};

export const GUILD_CRESTS = {
    crest1: "/icons/.webp",
    crest2: "/icons/.webp",
    crest3: "/icons/.webp",
    crest4: "/icons/.webp",
    crest5: "/icons/.webp",
    crest6: "/icons/.webp",
};

export const MILESTONE_ICONS = {
    streak100: "/icons/.webp",
};

export const ABILITY_ICONS = {
    consume: "/icons/.webp",
};

// ─── CONVENIENCE: Lookup helpers for components ────────────────

/**
 * Resolve an icon source for a stat key (str, int, vit, agi, cha).
 */
export function getStatIcon(key) {
    return STAT_ICONS[key] || null;
}

/**
 * Resolve an icon source for a shadow class.
 */
export function getShadowIcon(cls) {
    return SHADOW_ICONS[cls] || null;
}

/**
 * Resolve an icon source for a difficulty key.
 */
export function getDiffIcon(key) {
    return DIFF_ICONS[key] || null;
}

/**
 * Resolve a nav icon by view key.
 */
export function getNavIcon(key) {
    return NAV_ICONS[key] || null;
}
