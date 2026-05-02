// Central icon registry – maps keys to /icons/*.png assets
// Usage: import { STAT_ICONS, SHADOW_ICONS, GATE_ICONS } from '../data/icons.js';
//        <img src={STAT_ICONS.str} className="game-icon" alt="STR" />

export const STAT_ICONS = {
    str: "/icons/stat_str.webp",
    int: "/icons/stat_int.webp",
    vit: "/icons/stat_vit.webp",
    agi: "/icons/stat_agi.webp",
    cha: "/icons/stat_cha.webp",
};

export const SHADOW_ICONS = {
    soldier:   "/icons/shadow_soldier.webp",
    mage:      "/icons/shadow_mage.webp",
    commander: "/icons/shadow_commander.webp",
    igris:     "/icons/shadow_igris.webp",
    beru:      "/icons/shadow_beru.webp",
    bellion:   "/icons/shadow_bellion.webp",
    assassin:  "/icons/shadow_assassin.webp",
    knight:    "/icons/shadow_knight.webp",
    healer:    "/icons/shadow_healer.webp",
};

export const GATE_ICONS = {
    normal:   "/icons/gate_normal.webp",
    red:      "/icons/gate_red.webp",
    ice:      "/icons/gate_ice.webp",
    saferoom: "/icons/gate_saferoom.webp",
};

export const ITEM_ICONS = {
    blade: "/icons/item_blade.webp",
    armor: "/icons/item_armor.webp",
    ring: "/icons/item_ring.webp",
    potion: "/icons/item_potion.webp",
};

export const SHOP_ICONS = {
    title: "/icons/icon_title.webp",
    theme: "/icons/icon_theme.webp",
};

export const SKILL_ICONS = {
    attack: "/icons/skill_attack.webp",
    defense: "/icons/skill_defense.webp",
    magic: "/icons/skill_magic.webp",
    speed: "/icons/skill_speed.webp",
};

export const SYSTEM_ICONS = {
    logo: "/icons/setup_logo.webp",
};

export const NAV_ICONS = {
    dashboard:    "/icons/nav_dashboard.webp",
    goals:        "/icons/nav_goals.webp",
    settings:     "/icons/nav_settings.webp",
    shop:         "/icons/nav_shop.webp",
    jobs:         "/icons/nav_jobs.webp",
    events:       "/icons/nav_events.webp",
    analytics:    "/icons/nav_analytics.webp",
    achievements: "/icons/nav_achievements.webp",
    timer:        "/icons/nav_timer.webp",
    guild:        "/icons/nav_guild.webp",
};

export const QUEST_ICONS = {
    daily:     "/icons/quest_daily.webp",
    weekly:    "/icons/quest_weekly.webp",
    emergency: "/icons/quest_emergency.webp",
    chain:     "/icons/quest_chain.webp",
    hidden:    "/icons/quest_hidden.webp",
};

export const BACKGROUNDS = {
    habitBanner: "/backgrounds/habit_banner_epic.png",
    emergency:   "/backgrounds/emergency_hero.png",
    boss:        "/backgrounds/quest_bg_boss.png",
    standard:    "/backgrounds/quest_bg_standard.png",
};

export const DIFF_ICONS = {
    easy:   "/icons/diff_easy.webp",
    normal: "/icons/diff_normal.webp",
    hard:   "/icons/diff_hard.webp",
    boss:   "/icons/diff_boss.webp",
};

export const ROLE_ICONS = {
    tank:      "/icons/role_tank.webp",
    vanguard:  "/icons/role_vanguard.webp",
    core:      "/icons/role_core.webp",
    rearguard: "/icons/role_rearguard.webp",
};

export const STYLE_ICONS = {
    aggressive: "/icons/style_aggressive.webp",
    tactical:   "/icons/style_tactical.webp",
    defensive:  "/icons/style_defensive.webp",
    swift:      "/icons/style_swift.webp",
};

export const DUNGEON_ICONS = {
    bloodmoon:   "/icons/dungeon_bloodmoon.webp",
    densemana:   "/icons/dungeon_densemana.webp",
    floorElite:  "/icons/floor_elite.webp",
    floorPuzzle: "/icons/floor_puzzle.webp",
    floorTreasure: "/icons/floor_treasure.webp",
};

export const JOB_ICONS = {
    berserker:  "/icons/job_berserker.webp",
    archmage:   "/icons/job_archmage.webp",
    insight:    "/icons/job_insight.webp",
    guardian:   "/icons/job_guardian.webp",
    fortress:   "/icons/job_fortress.webp",
    assassin:   "/icons/job_assassin.webp",
    shadowstep: "/icons/job_shadowstep.webp",
    monarch:    "/icons/job_monarch.webp",
    domain:     "/icons/job_domain.webp",
    necromancer:"/icons/job_necromancer.webp",
    necromancerBig:"/icons/class_necromancer.webp",
    assassinBig: "/icons/class_assassin.webp",
    berserkerBig: "/icons/class_berserker.webp",
    archmageBig: "/icons/class_archmage.webp",
    armydead:   "/icons/job_armydead.webp",
};

export const HABIT_ICONS = {
    fitness:      "/icons/habit_fitness.webp",
    health:       "/icons/habit_health.webp",
    mindfulness:  "/icons/habit_mindfulness.webp",
    weekday:      "/icons/habit_weekday.webp",
    weekend:      "/icons/habit_weekend.webp",
    manual:       "/icons/habit_manual.webp",
    timer:        "/icons/habit_timer.webp",
    counter:      "/icons/habit_counter.webp",
};

export const MICRO_ICONS = {
    water:     "/icons/micro_water.webp",
    stretch:   "/icons/micro_stretch.webp",
    gratitude: "/icons/micro_gratitude.webp",
    breathe:   "/icons/micro_breathe.webp",
};

export const HEALTH_ICONS = {
    steps: "/icons/health_steps.webp",
    sleep: "/icons/health_sleep.webp",
};

export const SEASON_ICONS = {
    frost:     "/icons/season_frost.webp",
    spring:    "/icons/season_spring.webp",
    inferno:   "/icons/season_inferno.webp",
    redgate:   "/icons/season_redgate.webp",
    statsurge: "/icons/season_statsurge.webp",
    merchant:  "/icons/season_merchant.webp",
};

export const CHA_ICONS = {
    conversation:   "/icons/cha_conversation.webp",
    romance:        "/icons/cha_romance.webp",
    publicspeaking: "/icons/cha_publicspeaking.webp",
};

export const DOMAIN_ICONS = {
    career: "/icons/domain_career.webp",
    dating: "/icons/domain_dating.webp",
};

export const SOCIAL_ICONS = {
    global: "/icons/social_global.webp",
};

export const STORY_ICONS = {
    arise:       "/icons/story_arise.webp",
    scroll:      "/icons/story_scroll.webp",
    helmet:      "/icons/story_helmet.webp",
    blackheart:  "/icons/story_blackheart.webp",
    butterfly:   "/icons/story_butterfly.webp",
    cerberus:    "/icons/story_cerberus.webp",
    dawn:        "/icons/story_dawn.webp",
    dragon:      "/icons/story_dragon.webp",
    association: "/icons/story_association.webp",
    mountain:    "/icons/story_mountain.webp",
    door:        "/icons/story_door.webp",
    scales:      "/icons/story_scales.webp",
    statue:      "/icons/story_statue.webp",
    systeminit:  "/icons/story_systeminit.webp",
};

export const BOSS_ICONS = {
    awakening:  "/icons/boss_awakening.webp",
    unleashed:  "/icons/boss_unleashed.webp",
    calamity:   "/icons/calamity.webp",
    deathsdoor: "/icons/deaths_door.webp",
};

export const GEM_ICONS = {
    gem:        "/icons/gem.webp",
    gemShop:    "/icons/gem.webp",
    booster:    "/icons/gem.webp",
    adReward:   "/icons/gem.webp",
};

export const GUILD_CRESTS = {
    crest1: "/icons/crest_1.webp",
    crest2: "/icons/crest_2.webp",
    crest3: "/icons/crest_3.webp",
    crest4: "/icons/crest_4.webp",
    crest5: "/icons/crest_5.webp",
    crest6: "/icons/crest_6.webp",
};

export const MILESTONE_ICONS = {
    streak100: "/icons/milestone_streak_100.webp",
};

export const ABILITY_ICONS = {
    consume: "/icons/ability_consume.webp",
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
