import { useState, useEffect, useRef, useCallback } from "react";
import { NAV_ICONS, STAT_ICONS, STORY_ICONS, SHADOW_ICONS, ITEM_ICONS, SHOP_ICONS, GEM_ICONS, CHA_ICONS } from "../data/icons.js";
import { GEM_SHOP_ITEMS, SHOP_ITEMS, THEMES } from "../data/gameData.js";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import NativeStatsDashboard from "./NativeStatsDashboard";
import ScreenTimeDashboard from "./ScreenTimeDashboard.jsx";
import { Capacitor } from "@capacitor/core";
import QuestIntensityControl from "./QuestIntensityControl.jsx";

// ─── NAV TAB REGISTRY ─────────────────────────────────────────
// All possible bottom-navigation tabs the user can choose from.
// Export for use in solo-leveling-v5.jsx bottom nav.
export const ALL_NAV_TABS = [
  { key: "dashboard", iconSrc: "/icons/nav_dashboard.webp", label: "Heute", desc: "Tagesübersicht & Quests" },
  { key: "training", iconSrc: "/icons/nav_goals.webp", label: "Ziele", desc: "Ziele, Habits & Training", requires: "training_tab" },
  { key: "dungeon", iconSrc: "/icons/gate_normal.webp", label: "Gates", desc: "Dungeon Gates betreten", requires: "dungeons", isGate: true },
  { key: "story", iconSrc: "/icons/story_scroll.webp", label: "Story", desc: "Deine Heldenreise", requires: "story" },
  { key: "system", iconSrc: "/icons/nav_settings.webp", label: "System", desc: "Alle Module & Menüs" },
  { key: "stats", iconSrc: "/icons/stat_str.webp", label: "Stats", desc: "Hunter Stats & Skills", requires: "stats_view" },
  { key: "analytics", iconSrc: "/icons/nav_analytics.webp", label: "Analytics", desc: "Fortschritts-Auswertung", requires: "analytics" },
  { key: "achievements", iconSrc: "/icons/nav_achievements.webp", label: "Erfolge", desc: "Meilensteine & Belohnungen", requires: "achievements" },
  { key: "challenges", iconSrc: "/icons/nav_events.webp", label: "Events", desc: "Challenges & Missionen", requires: "challenges" },
  { key: "shadows", iconSrc: "/icons/shadow_soldier.webp", label: "Schatten", desc: "Shadow Army verwalten", requires: "shadow_army" },
  { key: "equipment", iconSrc: "/icons/item_blade.webp", label: "Arsenal", desc: "Waffen & Rüstung", requires: "equipment" },
  { key: "jobs", iconSrc: "/icons/nav_jobs.webp", label: "Jobs", desc: "Hunter-Klassen", requires: "jobs" },
  { key: "shop", iconSrc: "/icons/nav_shop.webp", label: "Shop", desc: "Items & Themes kaufen", requires: "shop" },
  { key: "goals", iconSrc: "/icons/nav_goals.webp", label: "Goals", desc: "Langfristige Visionen", requires: "goals" },
  { key: "calendar", iconSrc: "/icons/nav_timer.webp", label: "Kalender", desc: "Quest-Kalender & Planung", requires: "calendar" },
  { key: "settings", iconSrc: "/icons/nav_settings.webp", label: "Settings", desc: "Einstellungen & Export" },
  { key: "sanctum", iconSrc: "/icons/nav_timer.webp", label: "Sanctum", desc: "Meditation & Willenskraft", requires: "sanctum" },
];

export const DEFAULT_NAV_KEYS = ["dashboard", "training", "dungeon", "story", "system"];

// ─── CONSTANTS ────────────────────────────────────────────────
const MAX_NAV_TABS = 5;
const ITEM_HEIGHT = 64; // px – height per draggable navbar item (including gap)
const FONT_SIZE_OPTIONS = [
  { key: "small", label: "Klein", value: 14 },
  { key: "normal", label: "Normal", value: 16 },
  { key: "large", label: "Groß", value: 18 },
];

const THEME_FLAVOR = {
  default: "Klares System-HUD mit kaltem Mana-Glow und ruhiger Hunter-UI.",
  crimson: "Ein roter Gate-Riss, als hätte der Dungeon die Oberfläche erreicht.",
  shadow: "Tiefe Schatten, violette Energie und ein Blick direkt ins Monarchenreich.",
  ice: "Kristallines Frostlicht mit sauberer, gefährlich stiller UI-Präsenz.",
  golden: "Herrscher-Aura, warmes Gold und ein HUD wie ein Befehl von oben.",
  celestial: "Weißgoldene Lichtkanten für ein fast göttliches System-Interface.",
  void: "Dunkler Void-Druck mit lila Raumrissen und schwerer Portalenergie.",
  dragon: "Drachenfeuer, Ascheglut und aggressive orange-rote Akzente.",
  starfall: "Kosmischer Nachthimmel mit Sternenlicht und ruhiger S-Rank-Eleganz.",
  blood_sovereign: "Blutroter Monarch-Stil, schwer, selten und kompromisslos.",
};

const TRANSITION_FLAVOR = {
  domain_shift: "Der klassische System-Shift mit Mana-Sweep und sauberem HUD-Reveal.",
  shadow_step: "Ein lautloser Dash durch Schattenklingen und Nachbilder.",
  red_gate: "Ein rotes Dungeon-Tor reisst die Oberfläche der App auf.",
  frost_seal: "Frostige Runen, Glasbruch und ein eiskalter Monarchen-Schnitt.",
  dragons_breath: "Drachenfeuer, Aschefunken und ein brennender Portal-Durchbruch.",
  celestial_judgment: "Goldene Lichtlanzen und Herrscher-Geometrie im First-Class-Look.",
  system_override: "Terminal-Glitch, Hex-Fragmente und ein kompletter Interface-Rewrite.",
  eclipse_monarch: "Die Ultra-Premium Eclipse mit Schattenkrone und Arise-Partikeln.",
};

const clampTransitionSpeed = (value) => Math.min(1.8, Math.max(0.7, Number(value) || 1));

const getThemeTokens = (key, customThemeData) => {
  if (key === "custom" && customThemeData) {
    return {
      primary: customThemeData.primary || "#3b82f6",
      secondary: customThemeData.secondary || customThemeData.accent || "#60a5fa",
      accent: customThemeData.accent || customThemeData.primary || "#60a5fa",
      bg: customThemeData.bg || "#0a0a1a",
      card: customThemeData.card || "rgba(15,15,30,0.85)",
      glow: customThemeData.glow || customThemeData.primary || "rgba(59,130,246,0.35)",
    };
  }
  return THEMES[key] || THEMES.default;
};

// ─── REUSABLE TOGGLE ──────────────────────────────────────────
function Toggle({ value, onChange, color, disabled }) {
  const isOn = !!value;
  return (
    <button
      onClick={disabled ? undefined : onChange}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none", cursor: disabled ? "default" : "pointer",
        position: "relative", transition: "background 0.25s ease",
        background: disabled ? "rgba(255,255,255,0.04)" : isOn ? (color || "#6366f1") : "rgba(255,255,255,0.1)",
        opacity: disabled ? 0.4 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: isOn ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isOn ? `0 0 8px ${color || "#6366f1"}88` : "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ─── SETTINGS ROW ─────────────────────────────────────────────
function SettingRow({ label, desc, value, onChange, color, disabled, lockLevel, theme }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: disabled ? "#475569" : "#e2e8f0" }}>{label}</div>
        <div style={{ fontSize: 10, color: disabled ? "#334155" : "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
          {disabled && lockLevel ? `🔒 Ab Level ${lockLevel}` : desc}
        </div>
      </div>
      <Toggle value={value} onChange={onChange} color={color || theme?.primary} disabled={disabled} />
    </div>
  );
}

// ─── COLLAPSIBLE SECTION ──────────────────────────────────────
function SettingsSection({ title, icon, color, open, onToggle, children, theme, badge }) {
  return (
    <div style={{
      background: theme.card, border: `1px solid ${(color || theme.primary)}22`,
      borderRadius: 18, marginBottom: 14, overflow: "hidden",
      transition: "border-color 0.3s",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "16px 18px", background: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "background 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color || theme.primary}15`, border: `1px solid ${color || theme.primary}25`,
            fontSize: 16,
          }}>{icon}</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>{title}</div>
            {badge && <span style={{ fontSize: 9, color: color || theme.primary, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{badge}</span>}
          </div>
        </div>
        <div style={{
          fontSize: 10, color: color || theme.primary, transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>▼</div>
      </button>
      <div style={{
        maxHeight: open ? 5000 : 0, overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── THEME SWITCHER ─────────────────────────────────────────────
function ThemeSwitcher({ state, persist, theme, onOpenShop }) {
  const selectedTheme = state.selectedTheme || "default";
  const ownedGold = state.shopPurchases || [];
  const ownedGems = state.gemPurchases || [];
  const goldThemes = SHOP_ITEMS.filter(item => item.type === "theme");
  const gemThemes = GEM_SHOP_ITEMS.filter(item => item.type === "theme");

  const themeOptions = [
    {
      key: "default",
      name: "System Core",
      desc: THEME_FLAVOR.default,
      source: "Basis",
      iconSrc: NAV_ICONS.settings,
      unlocked: true,
    },
    ...goldThemes.map(item => ({
      key: item.themeKey,
      name: item.name,
      desc: THEME_FLAVOR[item.themeKey] || item.desc,
      source: "Gold Shop",
      iconSrc: item.iconSrc || SHOP_ICONS.theme,
      price: item.cost,
      currency: "gold",
      shopTab: "gold",
      unlocked: ownedGold.includes(item.id) || selectedTheme === item.themeKey,
    })),
    ...gemThemes.map(item => ({
      key: item.themeKey,
      name: item.name,
      desc: THEME_FLAVOR[item.themeKey] || item.desc,
      source: "Gem Shop",
      iconSrc: item.iconSrc || SHOP_ICONS.theme,
      price: item.cost,
      currency: "gems",
      shopTab: "gems",
      unlocked: ownedGems.includes(item.id) || selectedTheme === item.themeKey,
    })),
  ];

  if (state.customThemeData) {
    themeOptions.push({
      key: "custom",
      name: "Eigene Signatur",
      desc: "Dein handgebauter Hunter-Look aus dem Custom Theme Creator.",
      source: "Custom",
      iconSrc: SHOP_ICONS.theme,
      unlocked: true,
    });
  }

  const selectTheme = (option) => {
    if (!option.unlocked) {
      onOpenShop?.(option.shopTab || "gems", option.currency === "gems" ? "theme" : null);
      return;
    }
    if (option.key !== selectedTheme) {
      persist({ ...state, selectedTheme: option.key });
    }
  };

  return (
    <div style={{ padding: "2px 0 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2.5, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            THEME MATRIX
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.45 }}>
            Wechsel gekaufte Designs sofort, inklusive Premium-Themes aus dem Gem Shop.
          </div>
        </div>
        <div style={{
          padding: "6px 8px", borderRadius: 999, border: `1px solid ${theme.primary}33`,
          background: `${theme.primary}10`, color: theme.accent, fontSize: 9,
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.2,
          whiteSpace: "nowrap",
        }}>
          {themeOptions.filter(option => option.unlocked).length}/{themeOptions.length} AKTIVIERBAR
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(136px, 1fr))", gap: 10 }}>
        {themeOptions.map(option => {
          const tokens = getThemeTokens(option.key, state.customThemeData);
          const active = selectedTheme === option.key;
          const unlocked = option.unlocked;
          const primary = tokens.primary || theme.primary;
          const secondary = tokens.secondary || tokens.accent || primary;
          const accent = tokens.accent || primary;
          const priceIcon = option.currency === "gems" ? GEM_ICONS.gem : "/icon/coin.png";

          return (
            <button
              key={option.key}
              onClick={() => selectTheme(option)}
              aria-pressed={active}
              className="press-feedback"
              style={{
                position: "relative",
                minHeight: 178,
                padding: 10,
                borderRadius: 14,
                overflow: "hidden",
                textAlign: "left",
                background: active
                  ? `linear-gradient(180deg, ${primary}1f, rgba(8,8,18,0.78))`
                  : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                border: `1.5px solid ${active ? primary + "88" : unlocked ? primary + "2f" : "rgba(255,255,255,0.06)"}`,
                boxShadow: active ? `0 0 24px ${primary}33, inset 0 1px 0 rgba(255,255,255,0.16)` : "inset 0 1px 0 rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = active ? primary + "aa" : primary + "66";
                e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.28), 0 0 24px ${primary}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = active ? primary + "88" : unlocked ? primary + "2f" : "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = active ? `0 0 24px ${primary}33, inset 0 1px 0 rgba(255,255,255,0.16)` : "inset 0 1px 0 rgba(255,255,255,0.06)";
              }}
            >
              <div style={{
                position: "absolute", inset: 0, opacity: unlocked ? 1 : 0.55,
                background: `radial-gradient(circle at 20% 0%, ${primary}32, transparent 34%), radial-gradient(circle at 88% 18%, ${secondary}26, transparent 34%)`,
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative", zIndex: 1, filter: unlocked ? "none" : "grayscale(0.45) brightness(0.72)" }}>
                <div style={{
                  height: 72,
                  borderRadius: 11,
                  background: `linear-gradient(135deg, ${tokens.bg || "#06060e"} 0%, ${tokens.card || "rgba(10,10,22,0.88)"} 54%, ${primary}2b 100%)`,
                  border: `1px solid ${primary}55`,
                  overflow: "hidden",
                  position: "relative",
                  marginBottom: 10,
                }}>
                  <div style={{
                    position: "absolute", inset: 8,
                    border: `1px solid ${primary}44`,
                    boxShadow: `inset 0 0 18px ${primary}18`,
                    clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
                  }} />
                  <div style={{
                    position: "absolute", left: 14, top: 15, width: 42, height: 4,
                    background: `linear-gradient(90deg, ${primary}, transparent)`,
                    boxShadow: `0 0 10px ${primary}`,
                  }} />
                  <div style={{
                    position: "absolute", left: 14, top: 28, width: 68, height: 5,
                    background: "rgba(255,255,255,0.16)", borderRadius: 999,
                  }} />
                  <div style={{
                    position: "absolute", left: 14, top: 41, width: 46, height: 5,
                    background: `${accent}55`, borderRadius: 999,
                  }} />
                  <div style={{
                    position: "absolute", right: 12, bottom: 10, width: 26, height: 26,
                    borderRadius: "50%", border: `1px solid ${accent}77`,
                    boxShadow: `0 0 18px ${accent}55`,
                  }} />
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, width: 24, left: active ? "76%" : "18%",
                    background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
                    transform: "skewX(-18deg)",
                    opacity: active ? 0.9 : 0.45,
                    transition: "left 0.45s ease",
                  }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <img src={option.iconSrc} alt="" style={{ width: 16, height: 16, objectFit: "contain", filter: `drop-shadow(0 0 6px ${primary}88)` }} />
                    <div style={{ color: "#f8fafc", fontSize: 12, fontWeight: 900, fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {option.name}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    {[primary, secondary, accent].map((color, index) => (
                      <span key={`${option.key}-${index}`} style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}88` }} />
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 9.5, color: "#94a3b8", lineHeight: 1.35, minHeight: 38, marginBottom: 10 }}>
                  {option.desc}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{
                    fontSize: 8.5, letterSpacing: 1.1, color: active ? "#020617" : unlocked ? accent : "#64748b",
                    background: active ? accent : unlocked ? `${primary}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? accent : unlocked ? primary + "44" : "rgba(255,255,255,0.07)"}`,
                    padding: "4px 6px", borderRadius: 999, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}>
                    {active ? "AKTIV" : unlocked ? "AUSWÄHLEN" : "SHOP"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: unlocked ? "#64748b" : "#cbd5e1", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>
                    {!unlocked && option.price ? <img src={priceIcon} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} /> : null}
                    {!unlocked && option.price ? `${option.price} ${option.currency === "gems" ? "GEMS" : "GOLD"}` : option.source}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE TRANSITION SWITCHER ──────────────────────────────────
function TransitionSwitcher({ state, persist, theme, onOpenShop, onPreviewPageTransition }) {
  const selectedTransition = state.selectedPageTransition || "domain_shift";
  const ownedGems = state.gemPurchases || [];
  const persistedSpeed = clampTransitionSpeed(state.settings?.pageTransitionSpeed || 1);
  const [draftSpeed, setDraftSpeed] = useState(persistedSpeed);
  const transitionItems = GEM_SHOP_ITEMS.filter(item => item.type === "transition");
  const transitionOptions = [
    {
      key: "domain_shift",
      name: "Domain Shift",
      desc: TRANSITION_FLAVOR.domain_shift,
      source: "Basis",
      iconSrc: STORY_ICONS.systeminit,
      color: theme.primary,
      rarity: "system",
      unlocked: true,
    },
    ...transitionItems.map(item => ({
      key: item.transitionKey,
      name: item.name,
      desc: TRANSITION_FLAVOR[item.transitionKey] || item.desc,
      source: "Gem Shop",
      iconSrc: item.iconSrc || STORY_ICONS.arise,
      color: item.previewColor || theme.primary,
      rarity: item.rarity || "rare",
      price: item.cost,
      unlocked: ownedGems.includes(item.id) || selectedTransition === item.transitionKey,
    })),
  ];
  const activeTransitionName = transitionOptions.find(option => option.key === selectedTransition)?.name || "Transition";

  useEffect(() => {
    setDraftSpeed(persistedSpeed);
  }, [persistedSpeed]);

  const selectTransition = (option) => {
    if (!option.unlocked) {
      onOpenShop?.("gems", "transition");
      return;
    }
    if (option.key !== selectedTransition) {
      persist({ ...state, selectedPageTransition: option.key });
    }
    onPreviewPageTransition?.(option.key, option.name);
  };

  const commitSpeed = (value, preview = true) => {
    const nextSpeed = clampTransitionSpeed(value);
    setDraftSpeed(nextSpeed);
    persist({
      ...state,
      settings: {
        ...(state.settings || {}),
        pageTransitionSpeed: nextSpeed,
      },
    });
    if (preview) {
      window.setTimeout(() => {
        onPreviewPageTransition?.(selectedTransition, `${activeTransitionName} ${nextSpeed.toFixed(2)}X`);
      }, 80);
    }
  };

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2.5, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>
            GATE TRANSITIONS
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.45 }}>
            Wähle, wie sich Seiten öffnen: Shadow Step, Red Gate, Eclipse und mehr.
          </div>
        </div>
        <div style={{
          padding: "6px 8px", borderRadius: 999, border: `1px solid ${theme.primary}33`,
          background: `${theme.primary}10`, color: theme.accent, fontSize: 9,
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.2,
          whiteSpace: "nowrap",
        }}>
          {transitionOptions.filter(option => option.unlocked).length}/{transitionOptions.length} FREI
        </div>
      </div>

      <div style={{
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${theme.primary}24`,
        background: `linear-gradient(135deg, ${theme.primary}10, rgba(255,255,255,0.025))`,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.primary}66, transparent)`,
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 800, fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>
              Animationsgeschwindigkeit
            </div>
            <div style={{ fontSize: 9.5, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
              Kürzer für schnelle UI, länger für Kino-Effekt.
            </div>
          </div>
          <div style={{
            padding: "6px 8px",
            borderRadius: 9,
            color: theme.accent,
            background: `${theme.primary}16`,
            border: `1px solid ${theme.primary}35`,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            fontWeight: 900,
            minWidth: 54,
            textAlign: "center",
            boxShadow: `0 0 14px ${theme.primary}16`,
          }}>
            {draftSpeed.toFixed(2)}X
          </div>
        </div>
        <input
          type="range"
          min="0.7"
          max="1.8"
          step="0.05"
          value={draftSpeed}
          onChange={e => setDraftSpeed(clampTransitionSpeed(e.target.value))}
          onPointerUp={e => commitSpeed(e.currentTarget.value)}
          onBlur={e => commitSpeed(e.currentTarget.value, false)}
          style={{
            width: "100%",
            accentColor: theme.primary,
            cursor: "pointer",
            height: 22,
          }}
          aria-label="Animationsgeschwindigkeit"
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 8.5, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
          <span>CINEMA</span>
          <span>NORMAL</span>
          <span>BLITZ</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(146px, 1fr))", gap: 10 }}>
        {transitionOptions.map(option => {
          const active = selectedTransition === option.key;
          const color = option.color || theme.primary;
          const locked = !option.unlocked;
          const isGate = option.key.includes("gate") || option.key.includes("dragon");
          const isSystem = option.key.includes("system");
          const isEclipse = option.key.includes("eclipse");

          return (
            <button
              key={option.key}
              onClick={() => selectTransition(option)}
              aria-pressed={active}
              className="press-feedback"
              style={{
                position: "relative",
                minHeight: 166,
                padding: 10,
                borderRadius: 14,
                overflow: "hidden",
                textAlign: "left",
                background: active
                  ? `linear-gradient(180deg, ${color}1f, rgba(5,5,14,0.84))`
                  : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                border: `1.5px solid ${active ? color + "99" : option.unlocked ? color + "35" : "rgba(255,255,255,0.06)"}`,
                boxShadow: active ? `0 0 26px ${color}35, inset 0 1px 0 rgba(255,255,255,0.15)` : "inset 0 1px 0 rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = color + "77";
                e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.28), 0 0 24px ${color}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = active ? color + "99" : option.unlocked ? color + "35" : "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = active ? `0 0 26px ${color}35, inset 0 1px 0 rgba(255,255,255,0.15)` : "inset 0 1px 0 rgba(255,255,255,0.06)";
              }}
            >
              <div style={{
                position: "absolute", inset: 0, opacity: locked ? 0.45 : 1,
                background: `radial-gradient(circle at 50% -10%, ${color}36, transparent 42%), linear-gradient(135deg, ${color}12, transparent 48%)`,
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1, filter: locked ? "grayscale(0.5) brightness(0.72)" : "none" }}>
                <div style={{
                  height: 66,
                  borderRadius: 11,
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 10,
                  background: `linear-gradient(135deg, rgba(2,6,23,0.95), ${color}18 55%, rgba(15,23,42,0.86))`,
                  border: `1px solid ${color}55`,
                  boxShadow: active ? `inset 0 0 24px ${color}18` : "inset 0 0 16px rgba(0,0,0,0.4)",
                }}>
                  <div style={{
                    position: "absolute", left: "50%", top: "50%", width: isGate ? 54 : 42, height: isGate ? 54 : 42,
                    transform: "translate(-50%, -50%)",
                    borderRadius: isGate ? "50%" : 8,
                    border: `1.5px solid ${color}88`,
                    boxShadow: `0 0 20px ${color}55, inset 0 0 18px ${color}22`,
                    animation: active ? "pulse 1.8s ease-in-out infinite" : "none",
                  }} />
                  {isEclipse && (
                    <div style={{
                      position: "absolute", left: "50%", top: "50%", width: 22, height: 22,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%", background: "#030712",
                      boxShadow: `0 0 0 8px ${color}22, 0 0 22px ${color}`,
                    }} />
                  )}
                  {isSystem ? Array.from({ length: 5 }, (_, i) => (
                    <div key={`sys-${option.key}-${i}`} style={{
                      position: "absolute", left: 10 + i * 17, top: 13 + (i % 2) * 18,
                      width: 14, height: 10, borderRadius: 3,
                      border: `1px solid ${color}55`, background: `${color}14`,
                      boxShadow: `0 0 10px ${color}22`,
                    }} />
                  )) : Array.from({ length: 4 }, (_, i) => (
                    <div key={`cut-${option.key}-${i}`} style={{
                      position: "absolute", left: `${8 + i * 23}%`, top: `${12 + (i % 2) * 18}%`,
                      width: 2, height: 62,
                      background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
                      transform: `rotate(${isGate ? 18 : -28}deg)`,
                      opacity: active ? 0.95 : 0.55,
                      boxShadow: `0 0 12px ${color}`,
                    }} />
                  ))}
                  <div style={{
                    position: "absolute", left: active ? "72%" : "18%", top: 0, bottom: 0, width: 26,
                    background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
                    transform: "skewX(-18deg)",
                    transition: "left 0.5s ease",
                  }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, minWidth: 0 }}>
                  <img src={option.iconSrc} alt="" style={{ width: 17, height: 17, objectFit: "contain", filter: `drop-shadow(0 0 6px ${color}88)` }} />
                  <div style={{ color: "#f8fafc", fontSize: 12, fontWeight: 900, fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {option.name}
                  </div>
                </div>

                <div style={{ fontSize: 9.5, color: "#94a3b8", lineHeight: 1.35, minHeight: 38, marginBottom: 10 }}>
                  {option.desc}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{
                    fontSize: 8.5, letterSpacing: 1.1, color: active ? "#020617" : option.unlocked ? color : "#64748b",
                    background: active ? color : option.unlocked ? `${color}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? color : option.unlocked ? color + "44" : "rgba(255,255,255,0.07)"}`,
                    padding: "4px 6px", borderRadius: 999, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}>
                    {active ? "AKTIV" : option.unlocked ? "AUSWÄHLEN" : "SHOP"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: option.unlocked ? "#64748b" : "#cbd5e1", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, textTransform: "uppercase" }}>
                    {!option.unlocked && option.price ? <img src={GEM_ICONS.gem} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} /> : null}
                    {!option.unlocked && option.price ? `${option.price} GEMS` : option.rarity}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── NAVBAR CUSTOMIZER (Drag & Drop + Tap) ────────────────────
function NavbarCustomizer({ navKeys, onChange, allTabs, can, theme }) {
  // Local state so drag reordering is snappy (persist only on commit)
  const [localKeys, setLocalKeys] = useState(navKeys);
  useEffect(() => setLocalKeys(navKeys), [navKeys]);

  // ── Drag state ──
  const [dragInfo, setDragInfo] = useState(null);
  // dragInfo = { index, startY, offsetY }
  const dragInfoRef = useRef(null);
  const listenerCleanupRef = useRef(null);

  const commitKeys = useCallback((keys) => {
    setLocalKeys(keys);
    onChange(keys);
  }, [onChange]);

  // Which position would dragged item land in?
  const getTargetIndex = useCallback((info) => {
    if (!info) return -1;
    const delta = Math.round(info.offsetY / ITEM_HEIGHT);
    return Math.max(0, Math.min(localKeys.length - 1, info.index + delta));
  }, [localKeys.length]);

  // Visual transform for each item during drag
  const getItemStyle = useCallback((i) => {
    const info = dragInfoRef.current;
    if (!info) return {};
    const targetIdx = getTargetIndex(info);
    const dragIdx = info.index;

    if (i === dragIdx) {
      return {
        transform: `translateY(${info.offsetY}px) scale(1.04)`,
        zIndex: 20, position: "relative",
        boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${theme.primary}33`,
        transition: "box-shadow 0.2s, scale 0.2s",
      };
    }

    let shiftY = 0;
    if (targetIdx > dragIdx) {
      if (i > dragIdx && i <= targetIdx) shiftY = -ITEM_HEIGHT;
    } else if (targetIdx < dragIdx) {
      if (i >= targetIdx && i < dragIdx) shiftY = ITEM_HEIGHT;
    }

    return {
      transform: shiftY ? `translateY(${shiftY}px)` : "none",
      transition: "transform 0.25s cubic-bezier(0.2, 0, 0, 1)",
      zIndex: 1,
    };
  }, [getTargetIndex, theme.primary]);

  // ── Pointer-based drag handlers ──
  const handleDragStart = useCallback((e, index) => {
    e.preventDefault();
    const startY = e.clientY;
    const info = { index, startY, offsetY: 0 };
    dragInfoRef.current = info;
    setDragInfo(info);

    const handleMove = (me) => {
      me.preventDefault();
      const newInfo = { ...dragInfoRef.current, offsetY: me.clientY - dragInfoRef.current.startY };
      dragInfoRef.current = newInfo;
      setDragInfo({ ...newInfo });
    };

    const handleEnd = () => {
      const finalInfo = dragInfoRef.current;
      if (finalInfo) {
        const targetIdx = Math.max(0, Math.min(localKeys.length - 1, finalInfo.index + Math.round(finalInfo.offsetY / ITEM_HEIGHT)));
        if (targetIdx !== finalInfo.index) {
          const newKeys = [...localKeys];
          const [item] = newKeys.splice(finalInfo.index, 1);
          newKeys.splice(targetIdx, 0, item);
          commitKeys(newKeys);
        }
      }
      dragInfoRef.current = null;
      setDragInfo(null);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleEnd);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleEnd);
    listenerCleanupRef.current = handleEnd;
  }, [localKeys, commitKeys]);

  // Cleanup on unmount
  useEffect(() => () => { if (listenerCleanupRef.current) listenerCleanupRef.current(); }, []);

  // ── Move up/down (fallback) ──
  const moveUp = (idx) => {
    if (idx === 0) return;
    const keys = [...localKeys];
    [keys[idx - 1], keys[idx]] = [keys[idx], keys[idx - 1]];
    commitKeys(keys);
  };
  const moveDown = (idx) => {
    if (idx >= localKeys.length - 1) return;
    const keys = [...localKeys];
    [keys[idx], keys[idx + 1]] = [keys[idx + 1], keys[idx]];
    commitKeys(keys);
  };

  // ── Remove / Add ──
  const removeTab = (idx) => {
    if (localKeys.length <= 2) return; // minimum 2 tabs
    const keys = [...localKeys];
    keys.splice(idx, 1);
    commitKeys(keys);
  };
  const addTab = (key) => {
    if (localKeys.length >= MAX_NAV_TABS) return;
    commitKeys([...localKeys, key]);
  };

  // ── Reset ──
  const resetToDefault = () => commitKeys([...DEFAULT_NAV_KEYS]);

  // Available (not active) tabs
  const activeTabs = localKeys.map(k => allTabs.find(t => t.key === k)).filter(Boolean);
  const availableTabs = allTabs.filter(t => !localKeys.includes(t.key));

  return (
    <div>
      {/* Section label */}
      <div style={{ fontSize: 9, letterSpacing: 3, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10, marginTop: 4 }}>
        AKTIVE TABS ({localKeys.length}/{MAX_NAV_TABS})
      </div>

      {/* ── Draggable Active Tabs List ── */}
      <div style={{ position: "relative" }}>
        {activeTabs.map((tab, i) => {
          const isDragged = dragInfo?.index === i;
          const dynamicStyle = dragInfo ? getItemStyle(i) : {};
          return (
            <div
              key={tab.key}
              data-drag-item
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", marginBottom: 6, borderRadius: 14,
                background: isDragged ? `${theme.primary}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isDragged ? theme.primary + "55" : "rgba(255,255,255,0.06)"}`,
                userSelect: "none", WebkitUserSelect: "none",
                ...dynamicStyle,
              }}
            >
              {/* Drag handle */}
              <div
                onPointerDown={(e) => handleDragStart(e, i)}
                style={{
                  touchAction: "none", cursor: "grab", padding: "6px 4px",
                  color: "#475569", fontSize: 16, lineHeight: 1,
                  display: "flex", alignItems: "center",
                }}
              >⠿</div>

              {/* Position indicator */}
              <div style={{
                width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${theme.primary}18`, border: `1px solid ${theme.primary}30`,
                fontSize: 10, fontWeight: 900, color: theme.accent, fontFamily: "'JetBrains Mono',monospace",
              }}>{i + 1}</div>

              {/* Icon */}
              <img src={tab.iconSrc} alt={tab.label} style={{
                width: 22, height: 22, objectFit: "contain",
                filter: `brightness(1.1) drop-shadow(0 0 4px ${theme.primary}55)`,
              }} />

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</div>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{tab.desc}</div>
              </div>

              {/* Move up/down */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{
                  width: 24, height: 18, borderRadius: 5, border: "none", cursor: i === 0 ? "default" : "pointer",
                  background: i === 0 ? "transparent" : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "#1e293b" : "#64748b", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}>▲</button>
                <button onClick={() => moveDown(i)} disabled={i >= localKeys.length - 1} style={{
                  width: 24, height: 18, borderRadius: 5, border: "none", cursor: i >= localKeys.length - 1 ? "default" : "pointer",
                  background: i >= localKeys.length - 1 ? "transparent" : "rgba(255,255,255,0.05)",
                  color: i >= localKeys.length - 1 ? "#1e293b" : "#64748b", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}>▼</button>
              </div>

              {/* Remove */}
              <button onClick={() => removeTab(i)} disabled={localKeys.length <= 2} style={{
                width: 26, height: 26, borderRadius: 8, border: "none",
                background: localKeys.length <= 2 ? "transparent" : "rgba(239,68,68,0.08)",
                color: localKeys.length <= 2 ? "#1e293b" : "#ef4444",
                cursor: localKeys.length <= 2 ? "default" : "pointer",
                fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}>✕</button>
            </div>
          );
        })}
      </div>

      {/* ── Available Tabs Grid ── */}
      {availableTabs.length > 0 && (
        <>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginTop: 18, marginBottom: 10 }}>
            VERFÜGBARE TABS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {availableTabs.map(tab => {
              const locked = tab.requires && !can(tab.requires);
              const full = localKeys.length >= MAX_NAV_TABS;
              const disabled = locked || full;
              return (
                <button
                  key={tab.key}
                  onClick={disabled ? undefined : () => addTab(tab.key)}
                  style={{
                    padding: "10px 12px", borderRadius: 12, border: `1px solid ${disabled ? "rgba(255,255,255,0.04)" : theme.primary + "22"}`,
                    background: disabled ? "rgba(10,10,22,0.4)" : "rgba(255,255,255,0.02)",
                    display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.4 : 1, filter: locked ? "grayscale(0.7)" : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = theme.primary + "55"; e.currentTarget.style.background = `${theme.primary}0a`; } }}
                  onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = theme.primary + "22"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; } }}
                >
                  {locked ? (
                    <span style={{ fontSize: 14 }}>🔒</span>
                  ) : (
                    <img src={tab.iconSrc} alt={tab.label} style={{ width: 18, height: 18, objectFit: "contain", filter: `brightness(1.1) drop-shadow(0 0 3px ${theme.primary}44)` }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: locked ? "#475569" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</div>
                    <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                      {locked ? `Level ${tab.requires === "training_tab" ? 5 : tab.requires === "story" || tab.requires === "dungeons" ? 11 : "?"}` : tab.desc}
                    </div>
                  </div>
                  {!disabled && <span style={{ fontSize: 14, color: theme.primary, fontWeight: 700 }}>+</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Live Preview ── */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>LIVE PREVIEW</div>
        <div style={{
          display: "flex", justifyContent: "center", gap: 2,
          padding: "10px 6px 8px", borderRadius: 14,
          background: "linear-gradient(to top, rgba(6,6,16,0.98), rgba(10,10,26,0.85))",
          border: `1px solid ${theme.primary}44`,
        }}>
          {activeTabs.map(tab => (
            <div key={tab.key} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "4px 0",
            }}>
              <img src={tab.iconSrc} alt={tab.label} style={{
                width: tab.isGate ? 28 : 20, height: tab.isGate ? 28 : 20, objectFit: "contain",
                filter: `brightness(1.2) drop-shadow(0 0 5px ${theme.glow}) saturate(1.2)`,
              }} />
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.5, color: theme.accent, fontFamily: "'Outfit',sans-serif" }}>{tab.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reset Button ── */}
      <button
        onClick={resetToDefault}
        style={{
          width: "100%", marginTop: 14, padding: "10px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#64748b", fontSize: 11, fontWeight: 600,
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#94a3b8"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
      >↻ Standard wiederherstellen</button>
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════
//  MAIN SETTINGS VIEW
// ═════════════════════════════════════════════════════════════════
export default function SettingsView({ state, persist, theme, can, onLogout, onOpenShop, onPreviewPageTransition, updateHealthData, claimHealthReward, updateScreenTimeData, claimScreenTimeReward, geminiAI }) {
  // ── Section states ──
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (key) => setOpenSection(prev => prev === key ? null : key);

  // ── Theme creator cache (existing) ──
  const [primaryCache, setPrimaryCache] = useState(state.customThemeData?.primary || "#3b82f6");
  const [bgCache, setBgCache] = useState(state.customThemeData?.bg || "#0a0a1a");
  const [accentCache, setAccentCache] = useState(state.customThemeData?.accent || "#60a5fa");

  // ── AI usage (existing) ──
  const [aiUsage, setAiUsage] = useState(null);
  useEffect(() => {
    if (!can?.('ai_quest_desc')) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "aiUsage", uid)).then(snap => {
      if (snap.exists()) setAiUsage(snap.data());
    }).catch(() => { });
  }, []);

  // ── Settings helpers ──
  const getSetting = (key, defaultVal = true) => state.settings?.[key] ?? defaultVal;
  const toggleSetting = (key, defaultVal = true) => {
    const settings = { ...(state.settings || {}) };
    settings[key] = !(settings[key] ?? defaultVal);
    persist({ ...state, settings });
  };

  const toggleAI = (field, defaultVal = true) => {
    persist({ ...state, ai: { ...(state.ai || {}), [field]: !(state.ai?.[field] ?? defaultVal) } });
  };

  const saveCustomTheme = () => {
    persist({
      ...state,
      selectedTheme: "custom",
      customThemeData: { primary: primaryCache, bg: bgCache, accent: accentCache, card: "rgba(15,15,30,0.85)", text: "#f8fafc", glow: primaryCache },
    });
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "solo-leveling-data.json");
    dlAnchorElem.click();
  };

  const clearCache = () => {
    if (confirm("Lokalen Cache leeren? Deine Daten bleiben in der Cloud gespeichert.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // ── Navbar ──
  const handleNavChange = (keys) => {
    persist({ ...state, navbarConfig: { tabs: keys } });
  };

  const userEmail = auth.currentUser?.email || "—";
  const fontSize = state.settings?.fontSize || "normal";

  return (
    <div style={{ animation: "fadeIn 0.3s ease", paddingBottom: 60 }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
          SYSTEM PREFERENCES
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 15px ${theme.glow}` }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img src={NAV_ICONS.settings} alt="Settings" style={{ width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 0 4px " + theme.glow + ")" }} /> Einstellungen
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           SECTION 1: ERSCHEINUNGSBILD
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Erscheinungsbild" icon="🎨" color="#a78bfa" open={openSection === "look"} onToggle={() => toggleSection("look")} theme={theme} badge="THEME · DISPLAY">

        <ThemeSwitcher state={state} persist={persist} theme={theme} onOpenShop={onOpenShop} />

        <TransitionSwitcher state={state} persist={persist} theme={theme} onOpenShop={onOpenShop} onPreviewPageTransition={onPreviewPageTransition} />

        {/* Particles Toggle */}
        <SettingRow label="Partikel-Effekte" desc="Schwebende Partikel im Hintergrund" value={getSetting("particles", true)} onChange={() => toggleSetting("particles", true)} theme={theme} />

        {/* Reduce Motion */}
        <SettingRow label="Animationen reduzieren" desc="Weniger Bewegung in der UI" value={getSetting("reduceMotion", false)} onChange={() => toggleSetting("reduceMotion", false)} theme={theme} />

        {/* XP Animations */}
        <SettingRow label="XP-Animationen" desc="Fliegende XP/Gold-Anzeige bei Quest-Abschluss" value={getSetting("xpAnimations", true)} onChange={() => toggleSetting("xpAnimations", true)} theme={theme} />

        {/* Font Size Slider */}
        <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Schriftgröße</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>Globale Textgröße anpassen</div>
          <div style={{ display: "flex", gap: 6 }}>
            {FONT_SIZE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  const settings = { ...(state.settings || {}), fontSize: opt.key };
                  persist({ ...state, settings });
                }}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10,
                  background: fontSize === opt.key ? `${theme.primary}22` : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${fontSize === opt.key ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`,
                  color: fontSize === opt.key ? theme.accent : "#64748b",
                  fontSize: opt.value - 4, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.25s", fontFamily: "'Outfit',sans-serif",
                  boxShadow: fontSize === opt.key ? `0 0 12px ${theme.primary}22` : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Custom Theme Creator ── */}
        <div style={{ paddingTop: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>CUSTOM THEME CREATOR</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "BG", val: bgCache, set: setBgCache },
              { label: "PRIMARY", val: primaryCache, set: setPrimaryCache },
              { label: "ACCENT", val: accentCache, set: setAccentCache },
            ].map(c => (
              <div key={c.label}>
                <div style={{ fontSize: 8, color: "#cbd5e1", marginBottom: 4, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{c.label}</div>
                <div style={{ position: "relative" }}>
                  <input type="color" value={c.val} onChange={e => c.set(e.target.value)} style={{ width: "100%", height: 34, border: "none", borderRadius: 8, cursor: "pointer", background: "rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveCustomTheme} style={{
            width: "100%", marginTop: 14, padding: 12, borderRadius: 10,
            background: `linear-gradient(135deg, ${primaryCache}, ${accentCache})`,
            border: "none", color: "#fff", fontWeight: 800, fontFamily: "'Cinzel',serif", fontSize: 11,
            cursor: "pointer", letterSpacing: 2, boxShadow: `0 4px 16px ${primaryCache}44`,
            display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
          }}>
            <img src={SHOP_ICONS.theme} alt="theme" style={{ width: 14, height: 14, objectFit: "contain" }} /> THEME AKTIVIEREN
          </button>
        </div>
      </SettingsSection>

      {/* ════════════════════════════════════════════════════════════
           SECTION 1b: VISUELLE EFFEKTE (v3.0)
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Visuelle Effekte" icon="✨" color="#22d3ee" open={openSection === "vfx"} onToggle={() => toggleSection("vfx")} theme={theme} badge="ARISE v3.0">
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 14 }}>
          Premium-Effekte für ein immersives Erlebnis. Deaktiviere einzelne Effekte für bessere Performance auf älteren Geräten.
        </div>

        <SettingRow label="3D Tilt-Karten" desc="Perspektivischer 3D-Effekt auf Hover/Touch" value={getSetting("tiltCards", true)} onChange={() => toggleSetting("tiltCards", true)} color="#22d3ee" theme={theme} />
        <SettingRow label="Animierte Borders" desc="Rotierende Conic-Gradient Ränder bei Boss/Hard Quests" value={getSetting("rarityBorders", true)} onChange={() => toggleSetting("rarityBorders", true)} color="#a78bfa" theme={theme} />
        <SettingRow label="Scroll-Animationen" desc="Viewport-basierte Einblend-Animationen" value={getSetting("scrollReveal", true)} onChange={() => toggleSetting("scrollReveal", true)} color="#3b82f6" theme={theme} />
        <SettingRow label="Quest-Completion Effekte" desc="Konfetti & Shockwave bei Quest-Abschluss" value={getSetting("completionFx", true)} onChange={() => toggleSetting("completionFx", true)} color="#f59e0b" theme={theme} />
        <SettingRow label="Atmosphärische Wisps" desc="Schwebende Lichtpartikel basierend auf Shadow Army" value={getSetting("atmosphericWisps", true)} onChange={() => toggleSetting("atmosphericWisps", true)} color="#6366f1" theme={theme} />
        <SettingRow label="Tageszeit-Atmosphäre" desc="Hintergrund passt sich der Uhrzeit an" value={getSetting("timeOfDay", true)} onChange={() => toggleSetting("timeOfDay", true)} color="#f97316" theme={theme} />
        <SettingRow label="Glitch-Text Effekte" desc="Cyberpunk Scan-Reveal für System-Nachrichten" value={getSetting("glitchText", true)} onChange={() => toggleSetting("glitchText", true)} color="#ef4444" theme={theme} />
        <SettingRow label="Animierte Zahlen" desc="Smooth Counter-Animation für Level/XP/Stats" value={getSetting("animatedNumbers", true)} onChange={() => toggleSetting("animatedNumbers", true)} color="#22c55e" theme={theme} />

        {/* v3.0 Phase 2 — New Effects */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#6366f1", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>PHASE 2 EFFECTS</div>

        <SettingRow label="Kino-Letterbox" desc="Cinematic Bars bei Level-Up & Arise" value={getSetting("letterboxMode", true)} onChange={() => toggleSetting("letterboxMode", true)} color="#f59e0b" theme={theme} />
        <SettingRow label="XP-Partikel Trail" desc="Leuchtende Orbs fliegen zum Header bei Quest-Abschluss" value={getSetting("xpParticleTrail", true)} onChange={() => toggleSetting("xpParticleTrail", true)} color="#a78bfa" theme={theme} />
        <SettingRow label="Boot-Sequenz" desc="Neural Interface Startup beim App-Start" value={getSetting("bootSequence", true)} onChange={() => toggleSetting("bootSequence", true)} color="#22d3ee" theme={theme} />

        {/* v3.0 Phase 3 — Premium Effects */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>PHASE 3 EFFECTS</div>

        <SettingRow label="Magnetischer Cursor" desc="Gradient-Glow folgt der Maus (nur Desktop)" value={getSetting("magneticCursor", true)} onChange={() => toggleSetting("magneticCursor", true)} color="#6366f1" theme={theme} />
        <SettingRow label="Screen Shake" desc="Bildschirm-Erschütterung bei Boss/Hard Quests" value={getSetting("screenShake", true)} onChange={() => toggleSetting("screenShake", true)} color="#ef4444" theme={theme} />

        {/* v3.0 Phase 4 — Ambient & Transitions */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>PHASE 4 EFFECTS</div>

        <SettingRow label="Streak-Flamme" desc="Canvas-Feuereffekt neben dem Streak-Counter" value={getSetting("streakFlame", true)} onChange={() => toggleSetting("streakFlame", true)} color="#f97316" theme={theme} />
        <SettingRow label="Motion Blur" desc="Übergangs-Blur beim View-Wechsel" value={getSetting("motionBlur", true)} onChange={() => toggleSetting("motionBlur", true)} color="#8b5cf6" theme={theme} />

        {/* v3.0 Phase 5 — HUD & Polish */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>PHASE 5 EFFECTS</div>

        <SettingRow label="HUD Overlay" desc="Corner-Brackets, Uhr, FPS, Rank-Info" value={getSetting("hudOverlay", true)} onChange={() => toggleSetting("hudOverlay", true)} color="#22d3ee" theme={theme} />
      </SettingsSection>


      {/* ════════════════════════════════════════════════════════════
           SECTION 2: NAVIGATION ANPASSEN
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Navigation anpassen" icon="📱" color="#22d3ee" open={openSection === "nav"} onToggle={() => toggleSection("nav")} theme={theme} badge="DRAG & DROP">
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 14 }}>
          Wähle bis zu {MAX_NAV_TABS} Tabs für deine Bottom-Navigation. Halte ⠿ zum Ziehen oder nutze die Pfeile.
        </div>
        <NavbarCustomizer
          navKeys={state.navbarConfig?.tabs || DEFAULT_NAV_KEYS}
          onChange={handleNavChange}
          allTabs={ALL_NAV_TABS}
          can={can}
          theme={theme}
        />
      </SettingsSection>


      {/* ════════════════════════════════════════════════════════════
           SECTION 3: BENACHRICHTIGUNGEN
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Benachrichtigungen" icon="🔔" color="#f59e0b" open={openSection === "notif"} onToggle={() => toggleSection("notif")} theme={theme}>
        <SettingRow label="System-Nachrichten" desc="CLI-Nachrichten beim App-Start" value={getSetting("systemMessages", true)} onChange={() => toggleSetting("systemMessages", true)} theme={theme} />
        <SettingRow label="Haptisches Feedback" desc="Vibration bei Quest-Abschluss" value={getSetting("haptics", true)} onChange={() => toggleSetting("haptics", true)} theme={theme} />
        <SettingRow label="Quest-Completion Cinematic" desc="Epische Belohnungs-Animation" value={getSetting("questCinematic", true)} onChange={() => toggleSetting("questCinematic", true)} theme={theme} />

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, lineHeight: 1.4 }}>
            Probleme mit Benachrichtigungen? Klicke hier und schließe die App sofort. In 5 Sekunden sollte eine Test-Nachricht erscheinen.
          </div>
          <button onClick={async () => {
            try {
              const IS_CAPACITOR = Capacitor.isNativePlatform();
              if (IS_CAPACITOR) {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                  await LocalNotifications.requestPermissions();
                }
                await LocalNotifications.schedule({
                  notifications: [{
                    id: Math.floor(Math.random() * 100000),
                    title: "SYSTEM TEST",
                    body: "Die Benachrichtigungen funktionieren einwandfrei!",
                    schedule: { at: new Date(Date.now() + 5000) },
                    sound: "default"
                  }]
                });
                alert("Geplant! Schließe jetzt die App (Geh auf den Home-Screen).");
              } else {
                if (Notification.permission !== "granted") await Notification.requestPermission();
                new Notification("SYSTEM TEST", { body: "Die Benachrichtigungen funktionieren!" });
              }
            } catch (e) {
              alert("Fehler beim Senden: " + e.message);
            }
          }} style={{
            width: "100%", padding: "10px", borderRadius: 8,
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            color: "#f59e0b", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
            cursor: "pointer", transition: "all 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
          >
            TEST-BENACHRICHTIGUNG SENDEN (5s)
          </button>
        </div>
      </SettingsSection>


      {/* ════════════════════════════════════════════════════════════
           SECTION 4: GAMEPLAY
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Gameplay" icon="⚔️" color="#ef4444" open={openSection === "game"} onToggle={() => toggleSection("game")} theme={theme}>
        <SettingRow label="Quest-Wartezeit" desc="Zeige Timer bis Quest abschließbar ist" value={getSetting("questTimer", true)} onChange={() => toggleSetting("questTimer", true)} theme={theme} />
        <SettingRow label="Auto-Schwierigkeit" desc="Schwierigkeit automatisch erkennen (z.B. '10 Liegestütz' → Easy)" value={getSetting("autoDifficulty", true)} onChange={() => toggleSetting("autoDifficulty", true)} theme={theme} />
        <SettingRow label="Dashboard Stats" desc="Hunter Stats auf dem Dashboard standardmäßig anzeigen" value={getSetting("dashboardStatsOpen", true)} onChange={() => toggleSetting("dashboardStatsOpen", true)} theme={theme} />
        <SettingRow label="Vision Board" desc="Tägliche Affirmationen auf dem Dashboard" value={getSetting("visionBoard", true)} onChange={() => toggleSetting("visionBoard", true)} theme={theme} />
      </SettingsSection>


      {/* ════════════════════════════════════════════════════════════
           SECTION 4B: AUFGABEN-AUTOMATION
         â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <SettingsSection title="Aufgaben-Automation" icon="AUTO" color="#22d3ee" open={openSection === "automation"} onToggle={() => toggleSection("automation")} theme={theme}>
        <QuestIntensityControl state={state} persist={persist} theme={theme} />
      </SettingsSection>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SECTION 5: SYSTEM KI
         ════════════════════════════════════════════════════════════ */}
      {can?.('ai_quest_desc') && (
        <SettingsSection title="System KI" icon="🤖" color="#22c55e" open={openSection === "ai"} onToggle={() => toggleSection("ai")} theme={theme}
          badge={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: (state.ai?.enabled ?? true) ? "#22c55e" : "#ef4444", display: "inline-block", boxShadow: (state.ai?.enabled ?? true) ? "0 0 6px #22c55e" : "none" }} />{(state.ai?.enabled ?? true) ? "ONLINE" : "OFFLINE"}</span>}
        >
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14, lineHeight: 1.5 }}>
            KI-gestützte Features: Quest-Fotos, Aufgaben-Scanner, KI-Coach und dynamische Quests.
          </div>

          {/* Daily usage */}
          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: theme.accent, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "#94a3b8" }}>DAILY API CALLS</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{aiUsage?.callsToday || 0} / 30</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(((aiUsage?.callsToday || 0) / 30) * 100, 100)}%`, background: (aiUsage?.callsToday || 0) >= 25 ? "#ef4444" : theme.primary, borderRadius: 2, transition: "width 0.4s" }} />
            </div>
            {(aiUsage?.callsToday || 0) >= 30 && (
              <div style={{ fontSize: 9, color: "#ef4444", marginTop: 6, letterSpacing: 1 }}>TAGESLIMIT ERREICHT — RESET UM MITTERNACHT</div>
            )}
          </div>

          {/* AI Toggles */}
          {can?.('ai_verification') ? (
            <SettingRow label="Quest-Verifikation" desc="Foto-Beweis für +20% XP & Gold" value={state.ai?.verificationEnabled ?? true} onChange={() => toggleAI("verificationEnabled")} color="#22c55e" theme={theme} />
          ) : (
            <SettingRow label="Quest-Verifikation" desc="Foto-Beweis für Quest-Abschluss" disabled lockLevel={11} theme={theme} />
          )}

          {can?.('ai_coach') ? (
            <SettingRow label="KI-Systemnachrichten" desc="Dynamische Coach-Interventionen" value={state.ai?.dynamicMessagesEnabled ?? true} onChange={() => toggleAI("dynamicMessagesEnabled")} color="#22c55e" theme={theme} />
          ) : (
            <SettingRow label="KI-Systemnachrichten" desc="Coach-Interventionen" disabled lockLevel={8} theme={theme} />
          )}

          {/*
          {can?.('ai_coach') ? (
            <SettingRow label="KI-Coach Chat" desc="Floating Chat-Widget für Coaching" value={state.ai?.coachEnabled ?? false} onChange={() => toggleAI("coachEnabled", false)} color="#22c55e" theme={theme} />
          ) : (
            <SettingRow label="KI-Coach Chat" desc="Chat-Widget" disabled lockLevel={8} theme={theme} />
          )}
          */}

          {can?.('ai_dynamic_quests') ? (
            <SettingRow label="Dynamische Quests" desc="KI generiert tägliche System-Quests" value={state.ai?.dynamicQuestsEnabled ?? true} onChange={() => toggleAI("dynamicQuestsEnabled")} color="#22c55e" theme={theme} />
          ) : (
            <SettingRow label="Dynamische Quests" desc="KI-basierte Quest-Generierung" disabled lockLevel={15} theme={theme} />
          )}

          {/* Master Switch */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (state.ai?.enabled ?? true) ? "#22c55e" : "#94a3b8", fontFamily: "'Cinzel',serif" }}>
                  KI-Subsystem Status
                </div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                  {(state.ai?.enabled ?? true) ? "Alle KI-Features aktiv" : "Alle KI-Features deaktiviert"}
                </div>
              </div>
              <Toggle value={state.ai?.enabled ?? true} onChange={() => toggleAI("enabled")} color="#22c55e" />
            </div>
            <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.05)" }}>
              <strong>DATENSCHUTZ & AGB:</strong> Durch die Aktivierung der KI-Features erklärst du dich damit einverstanden, dass questbezogene Texte und verifizierte Bilder an Google's Gemini API gesendet und verarbeitet werden. Wir speichern keine Bilder dauerhaft. Opt-Out ist jederzeit über diesen Schalter möglich, wodurch das gesamte KI-System deaktiviert wird.
            </div>
          </div>
        </SettingsSection>
      )}


      {/* ════════════════════════════════════════════════════════════
           SECTION 5B: GESUNDHEIT & NATIVE DATEN
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Health & Sensoren" icon="❤️" color="#ef4444" open={openSection === "health"} onToggle={() => toggleSection("health")} theme={theme}>
        <div style={{ padding: "0 0 16px 0" }}>
          <NativeStatsDashboard state={state} persist={persist} updateHealthData={updateHealthData} claimHealthReward={claimHealthReward} />
        </div>
      </SettingsSection>

      <SettingsSection title="Bildschirmzeit & Fokus" icon="FOCUS" color="#f59e0b" open={openSection === "screenTime"} onToggle={() => toggleSection("screenTime")} theme={theme}>
        <div style={{ padding: "0 0 16px 0" }}>
          <ScreenTimeDashboard
            state={state}
            persist={persist}
            updateScreenTimeData={updateScreenTimeData}
            claimScreenTimeReward={claimScreenTimeReward}
            geminiAI={geminiAI}
          />
        </div>
      </SettingsSection>


      {/* ════════════════════════════════════════════════════════════
           SECTION: WIDGET INTERFACE
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Widget Interface" icon="📡" color="#22d3ee" open={openSection === "widget"} onToggle={() => toggleSection("widget")} theme={theme} badge="iOS WIDGET">
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 14 }}>
          Konfiguriere, welche Daten auf deinem iOS Home Screen und Lock Screen Widget angezeigt werden.
        </div>

        {/* ── Quest Filter ── */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Quest-Filter</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>Welche Quests im Widget anzeigen</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "Alle" },
              { key: "system", label: "System" },
              { key: "custom", label: "Eigene" },
              { key: "daily", label: "Dailies" },
            ].map(opt => {
              const wc = state.widgetConfig || {};
              const active = (wc.questFilter || "all") === opt.key;
              return (
                <button key={opt.key} onClick={() => { const widgetConfig = { ...(state.widgetConfig || {}), questFilter: opt.key }; persist({ ...state, widgetConfig }); }}
                  style={{ flex: 1, minWidth: 60, padding: "8px 6px", borderRadius: 10, background: active ? `${theme.primary}22` : "rgba(255,255,255,0.03)", border: `1.5px solid ${active ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: active ? theme.accent : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.25s", fontFamily: "'Outfit',sans-serif" }}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Quest Sort ── */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Sortierung</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>Quest-Reihenfolge im Widget</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "focus", label: "🎯 Fokus" },
              { key: "priority", label: "⚡ Priorität" },
              { key: "deadline", label: "⏰ Deadline" },
            ].map(opt => {
              const wc = state.widgetConfig || {};
              const active = (wc.questSort || "focus") === opt.key;
              return (
                <button key={opt.key} onClick={() => { const widgetConfig = { ...(state.widgetConfig || {}), questSort: opt.key }; persist({ ...state, widgetConfig }); }}
                  style={{ flex: 1, padding: "8px 6px", borderRadius: 10, background: active ? `${theme.primary}22` : "rgba(255,255,255,0.03)", border: `1.5px solid ${active ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: active ? theme.accent : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.25s", fontFamily: "'Outfit',sans-serif" }}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Max Quests ── */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Angezeigte Quests</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>Maximale Anzahl im Widget</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const wc = state.widgetConfig || {};
              const active = (wc.maxQuests || 3) === n;
              return (
                <button key={n} onClick={() => { const widgetConfig = { ...(state.widgetConfig || {}), maxQuests: n }; persist({ ...state, widgetConfig }); }}
                  style={{ width: 40, height: 36, borderRadius: 10, background: active ? `${theme.primary}22` : "rgba(255,255,255,0.03)", border: `1.5px solid ${active ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: active ? theme.accent : "#64748b", fontSize: 14, fontWeight: 900, cursor: "pointer", transition: "all 0.25s", fontFamily: "'JetBrains Mono',monospace" }}
                >{n}</button>
              );
            })}
          </div>
        </div>

        {/* ── Module Toggles ── */}
        <div style={{ paddingTop: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>WIDGET MODULE</div>
          {[
            { key: 'streak_xp', label: 'Streak & XP', icon: '🔥', color: '#f97316', desc: 'Serie + Level + XP-Fortschritt' },
            { key: 'quests', label: 'Quest Board', icon: '🗡️', color: '#f59e0b', desc: 'Aktive Quests als Liste' },
            { key: 'daily_quests', label: 'Daily Quests', icon: '📋', color: '#22d3ee', desc: 'Nur tägliche Quests' },
            { key: 'focus_quest', label: 'Focus Quest', icon: '🎯', color: '#ef4444', desc: 'Wichtigste Quest prominent' },
            { key: 'habits', label: 'Habit Progress', icon: '💪', color: '#22c55e', desc: 'Heutige Habits als Checklist' },
            { key: 'micro_habits', label: 'Micro-Habits', icon: '🧬', color: '#06b6d4', desc: 'Kompakte Counter-Leiste' },
            { key: 'hunter_card', label: 'Hunter Card', icon: '🏆', color: '#a855f7', desc: 'Level, Rang, Titel, Stats' },
            { key: 'health', label: 'Biometrics', icon: '❤️', color: '#ef4444', desc: 'Schritte + Schlaf' },
            { key: 'screen_time', label: 'Screen Time', icon: '📱', color: '#f59e0b', desc: 'Limit vs. Aktuell' },
            { key: 'deadline_alert', label: 'Deadline Alert', icon: '⏰', color: '#dc2626', desc: 'Nächstes Fälligkeitsdatum' },
            { key: 'system_message', label: 'System Message', icon: '💬', color: '#6366f1', desc: 'Motivations-Spruch' },
            { key: 'week_heatmap', label: 'Wochen-Heatmap', icon: '📊', color: '#22c55e', desc: '7-Tage Aktivitäts-Grid' },
            { key: 'streak_shield', label: 'Streak Shield', icon: '🛡️', color: '#3b82f6', desc: 'Schutz-Status' },
            { key: 'shadow_army', label: 'Shadow Army', icon: '👻', color: '#64748b', desc: 'Shadows + Stärkstes' },
          ].map(mod => {
            const wc = state.widgetConfig || {};
            const activeModules = wc.modules || ['streak_xp', 'quests', 'habits', 'micro_habits', 'hunter_card'];
            const isActive = activeModules.includes(mod.key);
            return (
              <div key={mod.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}15`, border: `1px solid ${mod.color}25`, fontSize: 14 }}>{mod.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#e2e8f0" : "#475569" }}>{mod.label}</div>
                    <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{mod.desc}</div>
                  </div>
                </div>
                <Toggle value={isActive} onChange={() => { const modules = isActive ? activeModules.filter(k => k !== mod.key) : [...activeModules, mod.key]; const widgetConfig = { ...(state.widgetConfig || {}), modules }; persist({ ...state, widgetConfig }); }} color={mod.color} />
              </div>
            );
          })}
        </div>

        {/* ── Additional Toggles ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>ERWEITERTE OPTIONEN</div>
        <SettingRow label="Theme synchronisieren" desc="Widget nutzt dein App-Theme" value={(state.widgetConfig || {}).syncTheme !== false} onChange={() => { const wc = state.widgetConfig || {}; persist({ ...state, widgetConfig: { ...wc, syncTheme: !(wc.syncTheme !== false) } }); }} color="#22d3ee" theme={theme} />
        <SettingRow label="System-Nachrichten" desc="Motivations-Sprüche im Widget" value={(state.widgetConfig || {}).showSystemMessage !== false} onChange={() => { const wc = state.widgetConfig || {}; persist({ ...state, widgetConfig: { ...wc, showSystemMessage: !(wc.showSystemMessage !== false) } }); }} color="#6366f1" theme={theme} />

        {/* ── Quest Rotation ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>QUEST-ROTATION</div>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>
          Bei vielen Quests rotiert das Widget automatisch alle paar Minuten durch verschiedene Quest-Gruppen, statt nur die Top-3 zu zeigen.
        </div>

        <SettingRow label="Quest-Rotation" desc="Automatisch durch Quest-Batches rotieren" value={(state.widgetConfig || {}).rotationEnabled !== false} onChange={() => { const wc = state.widgetConfig || {}; persist({ ...state, widgetConfig: { ...wc, rotationEnabled: !(wc.rotationEnabled !== false) } }); }} color="#f59e0b" theme={theme} />

        {(state.widgetConfig || {}).rotationEnabled !== false && (
          <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Rotations-Intervall</div>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>Wie oft das Widget die nächsten Quests zeigt</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[5, 10, 15, 30].map(n => {
                const wc = state.widgetConfig || {};
                const active = (wc.rotationIntervalMinutes || 5) === n;
                return (
                  <button key={n} onClick={() => { const widgetConfig = { ...(state.widgetConfig || {}), rotationIntervalMinutes: n }; persist({ ...state, widgetConfig }); }}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 10, background: active ? `${theme.primary}22` : "rgba(255,255,255,0.03)", border: `1.5px solid ${active ? theme.primary + "66" : "rgba(255,255,255,0.06)"}`, color: active ? theme.accent : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.25s", fontFamily: "'JetBrains Mono',monospace" }}
                  >{n} Min</button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Widget Display Sections ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#a78bfa", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>WIDGET SEKTIONEN</div>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>
          Bestimme welche Bereiche im Large Widget sichtbar sind.
        </div>

        {[
          { key: "streak", label: "Streak & XP", desc: "Serie, Level, XP-Fortschritt", color: "#f97316" },
          { key: "quests", label: "Quest-Liste", desc: "Aktive Quests mit Difficulty-Icons", color: "#f59e0b" },
          { key: "habits", label: "Habits", desc: "Heutige Habits als Checkmarks", color: "#22c55e" },
          { key: "microHabits", label: "Micro-Habits", desc: "Mini-Fortschritts-Dots", color: "#06b6d4" },
          { key: "stats", label: "Stats-Footer", desc: "STR INT VIT AGI CHA Anzeige", color: "#a78bfa" },
          { key: "heatmap", label: "Wochen-Heatmap", desc: "7-Tage Aktivitäts-Übersicht", color: "#22c55e" },
          { key: "systemMessage", label: "Motivations-Spruch", desc: "Tägliche System-Nachricht", color: "#6366f1" },
        ].map(section => {
          const wc = state.widgetConfig || {};
          const sections = wc.showSections || {};
          const active = sections[section.key] !== false;
          return (
            <div key={section.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#e2e8f0" : "#475569" }}>{section.label}</div>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{section.desc}</div>
              </div>
              <Toggle value={active} onChange={() => {
                const showSections = { ...(wc.showSections || {}), [section.key]: !active };
                const widgetConfig = { ...wc, showSections };
                persist({ ...state, widgetConfig });
              }} color={section.color} />
            </div>
          );
        })}

        {/* ── Live Activity Toggles ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>LIVE ACTIVITIES</div>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>Temporäre Lock Screen Anzeigen für zeitkritische Events (max. 8h).</div>
        <SettingRow label="Emergency Quests" desc="Live Alert bei Emergency Quest" value={(state.widgetConfig?.liveActivity || {}).emergencyQuest !== false} onChange={() => { const wc = state.widgetConfig || {}; const la = { ...(wc.liveActivity || {}), emergencyQuest: !(wc.liveActivity?.emergencyQuest !== false) }; persist({ ...state, widgetConfig: { ...wc, liveActivity: la } }); }} color="#ef4444" theme={theme} />
        <SettingRow label="Streak-Warnung" desc="Live Alert wenn Streak in Gefahr" value={(state.widgetConfig?.liveActivity || {}).streakWarning !== false} onChange={() => { const wc = state.widgetConfig || {}; const la = { ...(wc.liveActivity || {}), streakWarning: !(wc.liveActivity?.streakWarning !== false) }; persist({ ...state, widgetConfig: { ...wc, liveActivity: la } }); }} color="#f97316" theme={theme} />
        <SettingRow label="Deadline-Countdown" desc="Live Timer bei Quest Deadline < 2h" value={(state.widgetConfig?.liveActivity || {}).deadlineAlert !== false} onChange={() => { const wc = state.widgetConfig || {}; const la = { ...(wc.liveActivity || {}), deadlineAlert: !(wc.liveActivity?.deadlineAlert !== false) }; persist({ ...state, widgetConfig: { ...wc, liveActivity: la } }); }} color="#dc2626" theme={theme} />

        {/* ── Widget Preview ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>WIDGET PREVIEW</div>
        
        {/* Large Widget Preview */}
        <div style={{ borderRadius: 20, background: "linear-gradient(145deg, #03030a, #06060e, #0a0a16, #06060e)", border: `1px solid ${theme.primary}22`, position: "relative", overflow: "hidden" }}>
          {/* Scanlines */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.02, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 2.5px)" }} />
          {/* Top edge glow */}
          <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 1.5, background: `linear-gradient(90deg, transparent, ${theme.primary}99, ${theme.primary}, ${theme.primary}99, transparent)`, boxShadow: `0 3px 20px ${theme.primary}33, 0 1px 8px ${theme.primary}55` }} />
          {/* Bloom beneath glow */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, background: `linear-gradient(to bottom, ${theme.primary}0a, transparent)`, pointerEvents: "none" }} />
          {/* Bottom edge */}
          <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 0.5, background: `linear-gradient(90deg, transparent, ${theme.primary}33, transparent)` }} />
          {/* Corner vignette */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25))", pointerEvents: "none" }} />

          <div style={{ padding: "14px 16px", position: "relative" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 7, letterSpacing: 2.5, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>
                <span style={{ color: `${theme.accent}66` }}>「</span>
                <span style={{ color: theme.accent, textShadow: `0 0 6px ${theme.accent}44` }}>SYSTEM</span>
                <span style={{ color: `${theme.accent}66` }}>」</span>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: theme.primary, boxShadow: `0 0 6px ${theme.primary}88` }} />
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: (() => { const r = (state.level || 1); if (r >= 30) return '#e879f9'; if (r >= 25) return '#ef4444'; if (r >= 20) return '#f59e0b'; if (r >= 15) return '#a78bfa'; if (r >= 10) return '#34d399'; if (r >= 5) return '#22d3ee'; return '#6b7280'; })(), textShadow: "0 0 8px currentColor" }}>
                  {state.level >= 30 ? 'S' : state.level >= 25 ? 'A' : state.level >= 20 ? 'B' : state.level >= 15 ? 'C' : state.level >= 10 ? 'D' : 'E'}
                </span>
              </div>
            </div>

            {/* Hunter info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 3 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{state.hunterName || "Hunter"}</div>
                <div style={{ fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: "#64748b", letterSpacing: 1.5 }}>LEVEL {state.level || 1}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, color: (state.streak || 0) >= 7 ? "#f97316" : "#fbbf24", textShadow: (state.streak || 0) > 0 ? "0 0 6px currentColor" : "none" }}>🔥{state.streak || 0}</span>
                <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#fbbf24" }}>◆{state.gold || 0}</span>
              </div>
            </div>

            {/* XP Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(((state.xp || 0) / (state.xpNeeded || 100)) * 100, 100)}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, borderRadius: 2, boxShadow: `0 0 8px ${theme.primary}66, 0 0 16px ${theme.primary}33` }} />
              </div>
              <span style={{ fontSize: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#334155" }}>{state.xp || 0}/{state.xpNeeded || 100}</span>
            </div>

            {/* Glow divider */}
            <div style={{ height: 0.5, background: `linear-gradient(90deg, transparent, ${theme.primary}77, transparent)`, boxShadow: `0 0 4px ${theme.primary}33`, marginBottom: 6 }} />

            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <div style={{ width: 10, height: 1, borderRadius: 1, background: "#33415566" }} />
              <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#334155", letterSpacing: 2 }}>AKTIVE QUESTS</span>
              <div style={{ flex: 1, height: 0.5, background: "#33415520" }} />
            </div>

            {/* Glass quest panel */}
            <div style={{ borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `0.5px solid ${theme.primary}22`, padding: "6px", marginBottom: 6, backgroundImage: `linear-gradient(to bottom, ${theme.primary}05, transparent)` }}>
              {(state.quests || []).filter(q => !q.completed).slice(0, 3).map((q, i, arr) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "4px 0" }}>
                    {/* Left accent bar */}
                    <div style={{ width: 2, height: 16, borderRadius: 1, marginRight: 6, background: q.difficulty === 'boss' ? '#ef4444' : q.difficulty === 'hard' ? '#a78bfa' : q.difficulty === 'normal' ? '#22d3ee' : '#64748b', boxShadow: `0 0 4px ${q.difficulty === 'boss' ? '#ef444466' : q.difficulty === 'hard' ? '#a78bfa66' : '#22d3ee66'}` }} />
                    {/* Difficulty icon text */}
                    <span style={{ fontSize: 9, fontWeight: 700, color: q.difficulty === 'boss' ? '#ef4444' : q.difficulty === 'hard' ? '#a78bfa' : '#22d3ee', marginRight: 6 }}>
                      {q.difficulty === 'boss' ? '♛' : q.difficulty === 'hard' ? '★' : '◆'}
                    </span>
                    {/* Title */}
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title || "Quest"}</span>
                    {/* Category tag */}
                    <span style={{ fontSize: 6, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, padding: "2px 5px", borderRadius: 3, background: `${q.category === 'str' ? '#ef4444' : q.category === 'int' ? '#60a5fa' : q.category === 'vit' ? '#34d399' : q.category === 'agi' ? '#fbbf24' : q.category === 'cha' ? '#c084fc' : '#64748b'}15`, color: q.category === 'str' ? '#ef4444' : q.category === 'int' ? '#60a5fa' : q.category === 'vit' ? '#34d399' : q.category === 'agi' ? '#fbbf24' : q.category === 'cha' ? '#c084fc' : '#64748b', border: `0.5px solid ${q.category === 'str' ? '#ef4444' : q.category === 'int' ? '#60a5fa' : q.category === 'vit' ? '#34d399' : q.category === 'agi' ? '#fbbf24' : q.category === 'cha' ? '#c084fc' : '#64748b'}22` }}>
                      {(q.category || "AGI").toUpperCase()}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 0.5, background: "rgba(255,255,255,0.025)", marginLeft: 8 }} />}
                </div>
              ))}
              {(state.quests || []).filter(q => !q.completed).length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0" }}>
                  <span style={{ fontSize: 11, color: "#34d399" }}>✓</span>
                  <span style={{ fontSize: 9, color: "#334155", fontStyle: "italic" }}>Keine offenen Quests</span>
                </div>
              )}
              {(state.quests || []).filter(q => !q.completed).length > 3 && (
                <div style={{ textAlign: "right", paddingTop: 2 }}>
                  <span style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: `${theme.primary}66`, letterSpacing: 0.5 }}>+{(state.quests || []).filter(q => !q.completed).length - 3} weitere</span>
                </div>
              )}
            </div>

            {/* Stats footer */}
            <div style={{ height: 0.5, background: `linear-gradient(90deg, transparent, ${theme.primary}33, transparent)`, marginBottom: 5 }} />
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { l: "STR", v: state.stats?.str || 0, c: "#ef4444" },
                { l: "INT", v: state.stats?.int || 0, c: "#60a5fa" },
                { l: "VIT", v: state.stats?.vit || 0, c: "#34d399" },
                { l: "AGI", v: state.stats?.agi || 0, c: "#fbbf24" },
                { l: "CHA", v: state.stats?.cha || 0, c: "#c084fc" },
              ].map(s => (
                <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 5px", borderRadius: 4, background: `${s.c}0d`, border: `0.5px solid ${s.c}1a` }}>
                  <span style={{ fontSize: 5, fontWeight: 700, color: `${s.c}aa` }}>{s.l === "STR" ? "💪" : s.l === "INT" ? "🧠" : s.l === "VIT" ? "❤️" : s.l === "AGI" ? "⚡" : "👥"}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* Rotation indicator */}
            {(state.widgetConfig || {}).rotationEnabled !== false && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "4px 8px", borderRadius: 5, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <span style={{ fontSize: 8, color: "#f59e0b" }}>↻</span>
                <span style={{ fontSize: 7, color: "#f59e0b", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 0.5 }}>
                  ROTATION: {(state.widgetConfig || {}).rotationIntervalMinutes || 5} MIN
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Size label */}
        <div style={{ fontSize: 7, color: "#1e293b", fontFamily: "'JetBrains Mono',monospace", marginTop: 8, textAlign: "center", letterSpacing: 2 }}>LARGE WIDGET · LIVE PREVIEW</div>
      </SettingsSection>

      {/* ════════════════════════════════════════════════════════════
           SECTION 6: DATEN & ACCOUNT
         ════════════════════════════════════════════════════════════ */}
      <SettingsSection title="Daten & Account" icon="💾" color="#6366f1" open={openSection === "data"} onToggle={() => toggleSection("data")} theme={theme}>

        {/* Account Info */}
        <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>HUNTER PROFILE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "NAME", value: state.hunterName || "—" },
              { label: "E-MAIL", value: userEmail },
              { label: "LEVEL", value: state.level || 1 },
              { label: "STREAK", value: `${state.streak || 0} Tage` },
              { label: "GOLD", value: (state.gold || 0).toLocaleString() },
            ].map(info => (
              <div key={info.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>{info.label}</span>
                <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{info.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: theme.accent, marginBottom: 10, wordBreak: "break-all" }}>
            GET /api/v1/hunter/{state.multiplayer?.social?.friends ? "linked" : "local"}/export?token=***
          </div>
          <button onClick={exportData} style={{
            width: "100%", padding: 12, borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0", fontWeight: 700, fontSize: 11, fontFamily: "'Cinzel',serif",
            cursor: "pointer", transition: "all 0.2s", letterSpacing: 1,
            display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          >
            <img src={NAV_ICONS.analytics} alt="export" style={{ width: 14, height: 14, objectFit: "contain" }} /> JSON EXPORTIEREN
          </button>
        </div>

        {/* Clear Cache */}
        <button onClick={clearCache} style={{
          width: "100%", padding: 12, borderRadius: 10, marginBottom: 10,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          color: "#f87171", fontWeight: 700, fontSize: 11, fontFamily: "'Cinzel',serif",
          cursor: "pointer", transition: "all 0.2s", letterSpacing: 1,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
        >🗑 CACHE LEEREN</button>

        {/* Logout */}
        {onLogout && (
          <button onClick={onLogout} style={{
            width: "100%", padding: 12, borderRadius: 10, marginBottom: 10,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444", fontWeight: 800, fontSize: 12, fontFamily: "'Cinzel',serif",
            cursor: "pointer", transition: "all 0.2s", letterSpacing: 2,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
          >SYSTEM VERLASSEN</button>
        )}

        {/* Version */}
        <div style={{ textAlign: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>SOLO LEVELING v5.0</div>
          <div style={{ fontSize: 8, color: "#1e293b", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>SYSTEM BUILD {new Date().toISOString().slice(0, 10)}</div>
        </div>
      </SettingsSection>

    </div>
  );
}
