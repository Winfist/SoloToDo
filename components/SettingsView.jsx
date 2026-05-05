import { useState, useEffect, useRef, useCallback } from "react";
import { NAV_ICONS, STAT_ICONS, STORY_ICONS, SHADOW_ICONS, ITEM_ICONS, SHOP_ICONS, GEM_ICONS, CHA_ICONS } from "../data/icons.js";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import NativeStatsDashboard from "./NativeStatsDashboard";
import { Capacitor } from "@capacitor/core";

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
        maxHeight: open ? 2000 : 0, overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
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
export default function SettingsView({ state, persist, theme, can, onLogout, updateHealthData, claimHealthReward }) {
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
        <SettingRow label="Automatische System-Quests" desc="Alle 3 Stunden neue System-Aufgaben vorschlagen" value={getSetting("autoSystemTasks", false)} onChange={() => toggleSetting("autoSystemTasks", false)} theme={theme} />
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
