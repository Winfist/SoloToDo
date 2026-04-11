// Central icon registry – maps keys to /icons/*.png assets
// Usage: import { STAT_ICONS, SHADOW_ICONS, GATE_ICONS } from '../data/icons.js';
//        <img src={STAT_ICONS.str} className="game-icon" alt="STR" />

export const STAT_ICONS = {
    str: "/icons/stat_str.png",
    int: "/icons/stat_int.png",
    vit: "/icons/stat_vit.png",
    agi: "/icons/stat_agi.png",
    cha: "/icons/stat_cha.png",
};

export const SHADOW_ICONS = {
    soldier:   "/icons/shadow_soldier.png",
    mage:      "/icons/shadow_mage.png",
    commander: "/icons/shadow_commander.png",
    igris:     "/icons/shadow_igris.png",
    beru:      "/icons/shadow_beru.png",
    bellion:   "/icons/shadow_bellion.png",
    assassin:  "/icons/shadow_assassin.png",
    knight:    "/icons/shadow_knight.png",
    healer:    "/icons/shadow_healer.png",
};

export const GATE_ICONS = {
    normal:   "/icons/gate_normal.png",
    red:      "/icons/gate_red.png",
    ice:      "/icons/gate_ice.png",
    saferoom: "/icons/gate_saferoom.png",
};

export const ITEM_ICONS = {
    blade: "/icons/item_blade.png",
    armor: "/icons/item_armor.png",
};

export const NAV_ICONS = {
    dashboard:    "/icons/nav_dashboard.png",
    goals:        "/icons/nav_goals.png",
    settings:     "/icons/nav_settings.png",
    shop:         "/icons/nav_shop.png",
    jobs:         "/icons/nav_jobs.png",
    events:       "/icons/nav_events.png",
    analytics:    "/icons/nav_analytics.png",
    achievements: "/icons/nav_achievements.png",
    timer:        "/icons/nav_timer.png",
    guild:        "/icons/nav_guild.png",
};

export const QUEST_ICONS = {
    daily:     "/icons/quest_daily.png",
    weekly:    "/icons/quest_weekly.png",
    emergency: "/icons/quest_emergency.png",
    chain:     "/icons/quest_chain.png",
    hidden:    "/icons/quest_hidden.png",
};

export const DIFF_ICONS = {
    easy:   "/icons/diff_easy.png",
    normal: "/icons/diff_normal.png",
    hard:   "/icons/diff_hard.png",
    boss:   "/icons/diff_boss.png",
};

export const ROLE_ICONS = {
    tank:      "/icons/role_tank.png",
    vanguard:  "/icons/role_vanguard.png",
    core:      "/icons/role_core.png",
    rearguard: "/icons/role_rearguard.png",
};

export const STYLE_ICONS = {
    aggressive: "/icons/style_aggressive.png",
    tactical:   "/icons/style_tactical.png",
    defensive:  "/icons/style_defensive.png",
    swift:      "/icons/style_swift.png",
};

export const DUNGEON_ICONS = {
    bloodmoon:  "/icons/dungeon_bloodmoon.png",
    densemana:  "/icons/dungeon_densemana.png",
    floorElite: "/icons/floor_elite.png",
    floorPuzzle:"/icons/floor_puzzle.png",
};

export const JOB_ICONS = {
    berserker:  "/icons/job_berserker.png",
    archmage:   "/icons/job_archmage.png",
    insight:    "/icons/job_insight.png",
    guardian:   "/icons/job_guardian.png",
    fortress:   "/icons/job_fortress.png",
    assassin:   "/icons/job_assassin.png",
    shadowstep: "/icons/job_shadowstep.png",
    monarch:    "/icons/job_monarch.png",
    domain:     "/icons/job_domain.png",
    necromancer:"/icons/job_necromancer.png",
    armydead:   "/icons/job_armydead.png",
};

export const HABIT_ICONS = {
    fitness:      "/icons/habit_fitness.png",
    health:       "/icons/habit_health.png",
    mindfulness:  "/icons/habit_mindfulness.png",
    weekday:      "/icons/habit_weekday.png",
    weekend:      "/icons/habit_weekend.png",
    manual:       "/icons/habit_manual.png",
    timer:        "/icons/habit_timer.png",
    counter:      "/icons/habit_counter.png",
};

export const MICRO_ICONS = {
    water:     "/icons/micro_water.png",
    stretch:   "/icons/micro_stretch.png",
    gratitude: "/icons/micro_gratitude.png",
    breathe:   "/icons/micro_breathe.png",
};

export const HEALTH_ICONS = {
    steps: "/icons/health_steps.png",
    sleep: "/icons/health_sleep.png",
};

export const SEASON_ICONS = {
    frost:     "/icons/season_frost.png",
    spring:    "/icons/season_spring.png",
    inferno:   "/icons/season_inferno.png",
    redgate:   "/icons/season_redgate.png",
    statsurge: "/icons/season_statsurge.png",
    merchant:  "/icons/season_merchant.png",
};

export const CHA_ICONS = {
    conversation:   "/icons/cha_conversation.png",
    romance:        "/icons/cha_romance.png",
    publicspeaking: "/icons/cha_publicspeaking.png",
};

export const DOMAIN_ICONS = {
    career: "/icons/domain_career.png",
    dating: "/icons/domain_dating.png",
};

export const SOCIAL_ICONS = {
    global: "/icons/social_global.png",
};

export const STORY_ICONS = {
    arise:       "/icons/story_arise.png",
    scroll:      "/icons/story_scroll.png",
    helmet:      "/icons/story_helmet.png",
    blackheart:  "/icons/story_blackheart.png",
    butterfly:   "/icons/story_butterfly.png",
    cerberus:    "/icons/story_cerberus.png",
    dawn:        "/icons/story_dawn.png",
    dragon:      "/icons/story_dragon.png",
    association: "/icons/story_association.png",
    mountain:    "/icons/story_mountain.png",
    door:        "/icons/story_door.png",
    scales:      "/icons/story_scales.png",
    statue:      "/icons/story_statue.png",
    systeminit:  "/icons/story_systeminit.png",
};

export const BOSS_ICONS = {
    awakening:  "/icons/boss_awakening.png",
    unleashed:  "/icons/boss_unleashed.png",
    calamity:   "/icons/calamity.png",
    deathsdoor: "/icons/deaths_door.png",
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
