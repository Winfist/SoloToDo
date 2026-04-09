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
    soldier: "/icons/shadow_soldier.png",
    mage: "/icons/shadow_mage.png",
    commander: "/icons/shadow_commander.png",
    igris: "/icons/shadow_igris.png",
    beru: "/icons/shadow_beru.png",
};

export const GATE_ICONS = {
    normal: "/icons/gate_normal.png",
    red: "/icons/gate_red.png",
    ice: "/icons/gate_ice.png",
    saferoom: "/icons/gate_saferoom.png",
};

export const ITEM_ICONS = {
    blade: "/icons/item_blade.png",
    armor: "/icons/item_armor.png",
};

// Tip: Use raw <img> tags in components directly:
// <img src={STAT_ICONS.str} alt="STR" style={{ width: 24, height: 24, objectFit: "contain" }} />
