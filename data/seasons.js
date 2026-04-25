// ─── GATE SEASONS & WORLD EVENTS ─────────────────────────────────────────────
import { SEASON_ICONS, QUEST_ICONS } from "./icons.js";
import { getLocalDateKey } from "./dateUtils.js";

export const SEASONS = {
  frost: {
    key: "frost",
    name: "Frost Monarch",
    months: [11, 0, 1], // Dez, Jan, Feb
    icon: "❄️",
    iconSrc: SEASON_ICONS.frost,
    colors: {
      primary: "#67e8f9",
      secondary: "#0ea5e9",
      bg: "#0c1a2e",
      accent: "#bae6fd",
      glow: "rgba(103,232,249,0.4)",
    },
    questModifier: { category: "vit", xpMult: 1.3, goldMult: 1.1 },
    loreText: "Der Frost-Monarch regiert. Kälte stählt den Körper. Nur die Harten überleben den Winter.",
    systemQuests: [
      { title: "Eisige Morgenroutine: Kaltdusche 3 Tage in Folge", difficulty: "hard", category: "vit" },
      { title: "Frost-Training: 30 Min Outdoor-Sport im Winter", difficulty: "normal", category: "str" },
    ],
    achievement: { id: "frost_monarch", title: "Frost Monarch", desc: "Schließe 10 Quests während der Frost-Saison ab" },
    seasonTitle: "Frost Monarch",
  },
  spring: {
    key: "spring",
    name: "Spring Awakening",
    months: [2, 3, 4], // Mär, Apr, Mai
    icon: "🌸",
    iconSrc: SEASON_ICONS.spring,
    colors: {
      primary: "#34d399",
      secondary: "#10b981",
      bg: "#0a1f14",
      accent: "#6ee7b7",
      glow: "rgba(52,211,153,0.4)",
    },
    questModifier: { category: "str", xpMult: 1.2, goldMult: 1.15 },
    loreText: "Wiedergeburt. Die Tore öffnen sich nach langem Schlaf. Jeder Tag ein neuer Aufstieg.",
    systemQuests: [
      { title: "Frühlingserwachen: 7-Tage Morgenroutine starten", difficulty: "boss", category: "vit" },
      { title: "Neue Fähigkeit beginnen – 5 Tage täglich üben", difficulty: "hard", category: "int" },
    ],
    achievement: { id: "spring_awakening", title: "Erwachter", desc: "Schließe 10 Quests während der Spring Awakening-Saison ab" },
    seasonTitle: "Erwachter",
  },
  inferno: {
    key: "inferno",
    name: "Inferno Gate",
    months: [5, 6, 7], // Jun, Jul, Aug
    icon: "🔥",
    iconSrc: SEASON_ICONS.inferno,
    colors: {
      primary: "#f97316",
      secondary: "#ef4444",
      bg: "#1a0a00",
      accent: "#fdba74",
      glow: "rgba(249,115,22,0.4)",
    },
    questModifier: { category: "str", xpMult: 1.4, goldMult: 1.2 },
    loreText: "Die Tore der Hölle sind offen. Die Hitze schmiedet Legenden. Nur die Starken überleben.",
    systemQuests: [
      { title: "Inferno-Challenge: 100 Liegestütze in 5 Tagen", difficulty: "boss", category: "str" },
      { title: "Hitzewelle: Maximale Trainingsintensität 3 Tage", difficulty: "hard", category: "str" },
    ],
    achievement: { id: "inferno_conqueror", title: "Inferno-Bezwinger", desc: "Schließe 10 Quests während des Inferno Gates ab" },
    seasonTitle: "Inferno-Bezwinger",
  },
  redgate: {
    key: "redgate",
    name: "Red Gate",
    months: [8, 9, 10], // Sep, Okt, Nov
    icon: "🔴",
    iconSrc: SEASON_ICONS.redgate,
    colors: {
      primary: "#ef4444",
      secondary: "#dc2626",
      bg: "#150505",
      accent: "#fca5a5",
      glow: "rgba(239,68,68,0.4)",
    },
    questModifier: { category: "int", xpMult: 1.35, goldMult: 1.15 },
    loreText: "Das Rote Tor öffnet sich. Kein Ausweg. Verdopple deine Kraft – oder falle.",
    systemQuests: [
      { title: "Rotes Tor: 1 Stunde täglich lernen – 7 Tage", difficulty: "hard", category: "int" },
      { title: "Herbst-Offensive: Finanzielle Planung abschließen", difficulty: "normal", category: "int" },
    ],
    achievement: { id: "red_gate_survivor", title: "Red Gate Survivor", desc: "Schließe 10 Quests während des Roten Tores ab" },
    seasonTitle: "Red Gate Survivor",
  },
};

export const WORLD_EVENTS = [
  {
    key: "double_xp",
    name: "Doppelte Erfahrung",
    icon: "⚡",
    desc: "Alle XP +50% für diese Woche",
    effect: { xpMult: 1.5 },
  },
  {
    key: "gold_rush",
    name: "Gold-Rush",
    icon: "💰",
    desc: "Alle Gold-Belohnungen +75% für diese Woche",
    effect: { goldMult: 1.75 },
  },
  {
    key: "shadow_surge",
    name: "Schattenschwarm",
    icon: "🌑",
    desc: "Schattenextraktionsrate verdoppelt diese Woche",
    effect: { shadowExtraction: 2 },
  },
  {
    key: "dungeon_frenzy",
    name: "Dungeon-Raserei",
    icon: "🌀",
    desc: "+30% Erfolgschance in Dungeons diese Woche",
    effect: { dungeonBonus: 30 },
  },
  {
    key: "chain_breaker",
    name: "Kettenbrecher",
    icon: "⛓️",
    iconSrc: QUEST_ICONS.chain,
    desc: "Chained Quests geben +50% XP diese Woche",
    effect: { chainedXpMult: 1.5 },
  },
  {
    key: "stat_surge",
    name: "Stat-Surge",
    icon: "📊",
    iconSrc: SEASON_ICONS.statsurge,
    desc: "Stat-Punkte aus Quests +100% diese Woche",
    effect: { statMult: 2 },
  },
  {
    key: "merchant_arrival",
    name: "Händler angekommen",
    icon: "🏪",
    iconSrc: SEASON_ICONS.merchant,
    desc: "Alle Shop-Items -30% Rabatt diese Woche",
    effect: { shopDiscount: 30 },
  },
  {
    key: "emergency_protocol",
    name: "Notfall-Protokoll",
    icon: "🚨",
    desc: "Emergency Quests geben 3× Belohnungen diese Woche",
    effect: { emergencyXpMult: 3 },
  },
];

export function detectCurrentSeason() {
  const month = new Date().getMonth();
  return Object.values(SEASONS).find((s) => s.months.includes(month))?.key || "frost";
}

export function getNextWorldEvent(currentKey) {
  const idx = WORLD_EVENTS.findIndex((e) => e.key === currentKey);
  if (idx === -1) return WORLD_EVENTS[0];
  return WORLD_EVENTS[(idx + 1) % WORLD_EVENTS.length];
}

export function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 7 : (8 - day) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return getLocalDateKey(d);
}
