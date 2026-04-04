// ─── MULTIPLAYER THEME ────────────────────────────────────────
export const MP_THEME = {
  primary: "#f59e0b",
  secondary: "#dc2626",
  accent: "#fcd34d",
  bg: "#0a0806",
  card: "rgba(24, 20, 12, 0.85)",
  guildGreen: "#22c55e",
  raidPurple: "#8b5cf6",
  glow: "rgba(245, 158, 11, 0.35)",
  surface: "rgba(40, 32, 18, 0.6)",
  border: "rgba(245, 158, 11, 0.15)",
  textMuted: "#94a3b8",
  textSecondary: "#cbd5e1",
};

// ─── GUILD ICONS ──────────────────────────────────────────────
export const GUILD_ICONS = [
  "🏰", "⚔️", "🛡️", "🐉", "🦅", "🐺", "🔥", "❄️",
  "🌑", "⚡", "💎", "👑", "🗡️", "🏯", "🌀", "☠️",
  "🦁", "🐍", "🦊", "🐻", "🌙", "☀️", "🌊", "🌲",
  "💀", "🎭", "🔮", "🏴", "⭐", "🦇", "🐲", "🎯",
];

// ─── GUILD TIERS ──────────────────────────────────────────────
export const GUILD_TIERS = {
  E: { name: "E-Tier", color: "#6b7280", maxMembers: 10, icon: "◇", xpRequired: 0 },
  D: { name: "D-Tier", color: "#22d3ee", maxMembers: 20, icon: "◆", xpRequired: 5000 },
  C: { name: "C-Tier", color: "#34d399", maxMembers: 30, icon: "★", xpRequired: 20000 },
  B: { name: "B-Tier", color: "#a78bfa", maxMembers: 40, icon: "✦", xpRequired: 75000 },
  A: { name: "A-Tier", color: "#f59e0b", maxMembers: 50, icon: "♛", xpRequired: 200000 },
  S: { name: "S-Tier", color: "#ef4444", maxMembers: 75, icon: "☠", xpRequired: 500000 },
};

// ─── GUILD ROLES ──────────────────────────────────────────────
export const GUILD_ROLES = {
  master: { label: "Guild Master", icon: "👑", color: "#fcd34d", priority: 0 },
  officer: { label: "Officer", icon: "⚔️", color: "#f59e0b", priority: 1 },
  member: { label: "Member", icon: "🛡️", color: "#94a3b8", priority: 2 },
};

// ─── CHAT CONFIG ──────────────────────────────────────────────
export const CHAT_CONFIG = {
  maxMessageLength: 200,
  rateLimitMs: 3000,
  maxMessagesDisplay: 50,
  globalChatCollection: "globalChat",
  guildChatSubcollection: "messages",
};

// ─── RANK COLORS (mirrors solo mode) ──────────────────────────
export const RANK_COLORS = {
  "E": "#6b7280",
  "D": "#22d3ee",
  "C": "#34d399",
  "B": "#a78bfa",
  "A": "#f59e0b",
  "S": "#ef4444",
  "SSS": "#e879f9",
};

// ─── RAID TEMPLATES (Visual only for Stufe 1) ─────────────────
export const RAID_TEMPLATES = [
  {
    id: "r_monarchs_domain",
    rank: "S",
    title: "Monarch's Domain",
    desc: "Das Reich eines uralten Monarchen. Nur die stärksten Hunter überleben.",
    minPlayers: 4, maxPlayers: 8, minLevel: 80,
    rewards: ["50,000 XP (Split)", "Legendary Equipment", "Exclusive Shadow"],
    icon: "👑", color: "#e879f9",
    timeEstimate: "~45 min",
  },
  {
    id: "r_dragons_nest",
    rank: "A",
    title: "Dragon's Nest",
    desc: "Nest des uralten Drachen. Kooperation ist der Schlüssel.",
    minPlayers: 3, maxPlayers: 4, minLevel: 60,
    rewards: ["25,000 XP (Split)", "Epic Equipment", "Rare Shadow"],
    icon: "🐉", color: "#f59e0b",
    timeEstimate: "~30 min",
  },
  {
    id: "r_void_rift",
    rank: "B",
    title: "Void Rift",
    desc: "Ein Riss in der Realität. Unberechenbare Gegner lauern.",
    minPlayers: 2, maxPlayers: 4, minLevel: 40,
    rewards: ["10,000 XP (Split)", "Rare Equipment", "Gold Bonus"],
    icon: "🌀", color: "#a78bfa",
    timeEstimate: "~20 min",
  },
  {
    id: "r_ice_palace",
    rank: "C",
    title: "Ice Palace",
    desc: "Eisiger Palast des Winterkönigs. Team-Strategie erforderlich.",
    minPlayers: 2, maxPlayers: 4, minLevel: 25,
    rewards: ["5,000 XP (Split)", "Uncommon Equipment", "Gold"],
    icon: "❄️", color: "#22d3ee",
    timeEstimate: "~15 min",
  },
  {
    id: "r_shadow_labyrinth",
    rank: "D",
    title: "Shadow Labyrinth",
    desc: "Verworrenes Labyrinth voller Schattenwesen.",
    minPlayers: 2, maxPlayers: 3, minLevel: 10,
    rewards: ["2,000 XP (Split)", "Common Equipment", "Gold"],
    icon: "🌑", color: "#6b7280",
    timeEstimate: "~10 min",
  },
];

// ─── MP CSS ANIMATIONS ────────────────────────────────────────
export const MP_CSS = `
@keyframes mpFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes mpSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes mpPulseGold { 0%,100% { box-shadow: 0 0 8px rgba(245,158,11,0.2); } 50% { box-shadow: 0 0 24px rgba(245,158,11,0.5); } }
@keyframes mpGlow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes mpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes mpShimmer { 0% { left: -100%; } 100% { left: 200%; } }
@keyframes mpBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes mpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes portalOpen {
  0% { transform: scale(0) rotate(0deg); opacity: 0; filter: blur(20px); }
  50% { transform: scale(1.15) rotate(180deg); opacity: 1; filter: blur(0); }
  100% { transform: scale(1) rotate(360deg); opacity: 1; filter: blur(0); }
}
@keyframes portalRipple {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(4); opacity: 0; }
}
@keyframes letterReveal {
  0% { opacity: 0; transform: translateY(20px) scale(0.5); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes dimensionShift {
  0% { clip-path: circle(0% at 50% 50%); }
  100% { clip-path: circle(150% at 50% 50%); }
}
`;
