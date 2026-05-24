import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// TopBar — Minimal/Luxe header
//
// Replaces the old two-row neon HUD header. Shows only identity
// (rank + name) and currency (gold/gems); every secondary action
// (Sanctum, Focus, Protocol, Guild, Music, Settings, Logout) is
// bundled behind a single labelled action menu.
//
// Dumb / prop-driven so it can be previewed in isolation. The
// parent derives `available`/`status` from feature gates + state
// and maps `onAction(key)` to the real handlers.
// ─────────────────────────────────────────────────────────────

const DEFAULT_LABELS = {
  menu: "Menü",
  actionsTitle: "Aktionen",
  power: "Stärke",
  streak: "Serie",
  level: "Level",
  sanctum: "Sanctum",
  sanctumDesc: "Deine Basis",
  focus: "Fokus",
  focusDesc: "Fokus-Session starten",
  protocol: "Protokoll",
  protocolDesc: "Dawn / Dusk",
  protocolActive: "Läuft",
  guild: "Gilde",
  guildDesc: "Hunter Association",
  hunterIsland: "Hunter-Insel",
  hunterIslandDesc: "Alle Module",
  arsenal: "Arsenal",
  arsenalDesc: "Waffen & Ruestung",
  soulLink: "Soul Link",
  season: "Season",
  musicOn: "Musik an",
  musicOff: "Musik aus",
  settings: "Einstellungen",
  logout: "Abmelden",
};

function formatAmount(v) {
  const n = Number(v || 0);
  if (n >= 10000) return (n / 1000).toFixed(1).replace(".0", "").replace(".", ",") + "K";
  return n.toLocaleString("de-DE");
}

function MenuRow({ icon, label, desc, color, badge, danger, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 10px",
        borderRadius: 12,
        border: "none",
        background: hover ? "rgba(255,255,255,0.05)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.18s ease",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: danger ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)"}`,
        }}
      >
        {typeof icon === "string" ? (
          <img src={icon} alt="" aria-hidden="true" style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.92 }} />
        ) : (
          icon
        )}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: danger ? "#f87171" : "#e8edf4",
              fontFamily: "var(--font-sans)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: color || "#67e8f9",
                background: `${color || "#67e8f9"}1a`,
                border: `1px solid ${color || "#67e8f9"}33`,
                borderRadius: 5,
                padding: "1px 5px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {badge}
            </span>
          )}
        </span>
        {desc && (
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "#6b7484",
              fontFamily: "var(--font-sans)",
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {desc}
          </span>
        )}
      </span>
    </button>
  );
}

function CurrencyChip({ icon, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="press-feedback"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        height: 34,
        padding: "0 10px",
        borderRadius: 11,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
    >
      <img src={icon} alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: color,
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 0.2,
        }}
      >
        {formatAmount(value)}
      </span>
    </button>
  );
}

export default function TopBar({
  innerRef,
  rank = { name: "E", color: "#94a3b8", label: "Hunter" },
  theme = { primary: "#22d3ee", accent: "#67e8f9" },
  penaltyActive = false,
  isCompact = false,
  isCreatingEntry = false,
  hunterName = "Hunter",
  title = "",
  level = 1,
  gold = 0,
  gems = 0,
  streak = 0,
  powerLevel = 0,
  isMusicPlaying = false,
  icons = {},
  available = {},
  status = {},
  labels = {},
  onAction = () => {},
}) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const fire = (key) => { setMenuOpen(false); onAction(key); };

  const accent = theme.accent || theme.primary || "#67e8f9";
  const gold_c = "#d4b066";
  const gem_c = "#a78bfa";

  const padV = isCompact ? 7 : 11;
  const rankSize = isCompact ? 30 : 38;

  // Build the action list (only what's available)
  const actions = [];
  if (available.sanctum) actions.push({ key: "sanctum", icon: icons.sanctum || icons.timer, label: L.sanctum, desc: L.sanctumDesc, color: "#34d399" });
  if (available.focus) actions.push({ key: "focus", icon: icons.focus || icons.timer, label: L.focus, desc: L.focusDesc, color: accent });
  if (available.protocol) actions.push({ key: "protocol", icon: icons.protocol || icons.timer, label: L.protocol, desc: L.protocolDesc, color: "#fbbf24", badge: status.protocolActive ? L.protocolActive : null });
  if (available.hunterIsland) actions.push({ key: "hunterIsland", icon: icons.hunterIsland || icons.system || icons.settings, label: L.hunterIsland, desc: L.hunterIslandDesc, color: accent });
  if (available.arsenal) actions.push({ key: "arsenal", icon: icons.arsenal, label: L.arsenal, desc: L.arsenalDesc, color: "#fbbf24" });
  if (available.guild) actions.push({ key: "guild", icon: icons.guild, label: L.guild, desc: L.guildDesc, color: "#fbbf24" });
  if (available.soulLink) actions.push({ key: "soulLink", icon: icons.soulLink, label: L.soulLink, desc: status.soulLinkPartner || L.soulLink, color: accent });
  if (available.season) actions.push({ key: "season", icon: icons.season, label: L.season, desc: status.seasonName || L.season, color: accent });

  return (
    <header
      ref={innerRef}
      data-tutorial="header-stats"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: `calc(max(env(safe-area-inset-top, 0px), 8px) + ${padV}px)`,
        paddingBottom: padV,
        paddingLeft: 16,
        paddingRight: 16,
        background: "rgba(8,9,14,0.72)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: `1px solid ${penaltyActive ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
        opacity: isCreatingEntry ? 0 : 1,
        pointerEvents: isCreatingEntry ? "none" : "auto",
        transition: "padding 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ── Identity ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, flex: "1 1 auto" }}>
          {/* Rank hexagon with level badge — calm, no animation */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: rankSize,
                height: rankSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(150deg, ${rank.color}22, ${rank.color}08)`,
                border: `1px solid ${rank.color}55`,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                transition: "width 0.3s ease, height 0.3s ease",
              }}
            >
              <span
                style={{
                  fontSize: isCompact ? 12 : 15,
                  fontWeight: 800,
                  color: rank.color,
                  fontFamily: "var(--font-display)",
                  transition: "font-size 0.3s ease",
                }}
              >
                {rank.name}
              </span>
            </div>
            <span
              style={{
                position: "absolute",
                bottom: -4,
                right: -5,
                minWidth: 17,
                height: 15,
                padding: "0 3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
                background: "rgba(8,9,14,0.96)",
                border: `1px solid ${rank.color}66`,
                color: "#cbd5e1",
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {level}
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: penaltyActive ? "#f87171" : "#f1f5f9",
                fontFamily: "var(--font-sans)",
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {hunterName}
            </div>
            {!isCompact && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                  fontSize: 11,
                  color: "#7b8494",
                  fontFamily: "var(--font-sans)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{title || rank.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Currency + Menu ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          {icons.coin && <CurrencyChip icon={icons.coin} value={gold} color={gold_c} onClick={() => onAction("gold")} />}
          {available.gems && icons.gem && <CurrencyChip icon={icons.gem} value={gems} color={gem_c} onClick={() => onAction("gems")} />}

          {/* Single menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={L.menu}
            aria-expanded={menuOpen}
            className="press-feedback"
            style={{
              flexShrink: 0,
              width: 38,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 11,
              background: menuOpen ? `${accent}1f` : "rgba(255,255,255,0.035)",
              border: `1px solid ${menuOpen ? accent + "55" : "rgba(255,255,255,0.07)"}`,
              cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            {/* 2x2 dot launcher glyph */}
            <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    background: menuOpen ? accent : "#9aa3b2",
                    transition: "background 0.2s ease",
                  }}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      {/* ── Action menu ── */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.35)" }}
          />
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% - 2px)",
              right: 14,
              zIndex: 50,
              width: 252,
              maxWidth: "calc(100vw - 28px)",
              background: "rgba(13,15,21,0.98)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16,
              padding: 8,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 2px 0 rgba(255,255,255,0.03) inset",
              animation: "topbarMenuIn 0.18s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {/* Status header — power + streak */}
            <div
              style={{
                display: "flex",
                padding: "4px 6px 10px",
                marginBottom: 4,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ flex: 1, padding: "0 4px" }}>
                <div style={{ fontSize: 10, color: "#6b7484", fontFamily: "var(--font-sans)", marginBottom: 1 }}>{L.power}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: accent, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                  {Number(powerLevel || 0).toLocaleString("de-DE")}
                </div>
              </div>
              {streak > 0 && (
                <div style={{ flex: 1, padding: "0 4px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 10, color: "#6b7484", fontFamily: "var(--font-sans)", marginBottom: 1 }}>{L.streak}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 700, color: streak >= 3 ? "#fb923c" : "#e8edf4", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                    {icons.streak && <img src={icons.streak} alt="" aria-hidden="true" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                    {streak}
                  </div>
                </div>
              )}
            </div>

            {actions.map((a) => (
              <MenuRow key={a.key} icon={a.icon} label={a.label} desc={a.desc} color={a.color} badge={a.badge} onClick={() => fire(a.key)} />
            ))}

            {(actions.length > 0) && <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />}

            {available.music && (
              <MenuRow
                icon={<span style={{ fontSize: 17, color: isMusicPlaying ? accent : "#9aa3b2" }}>{isMusicPlaying ? "♫" : "♪"}</span>}
                label={isMusicPlaying ? L.musicOn : L.musicOff}
                onClick={() => fire("music")}
              />
            )}
            <MenuRow icon={icons.settings} label={L.settings} onClick={() => fire("settings")} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />
            <MenuRow
              icon={<span style={{ fontSize: 15, color: "#f87171" }}>{"⏻"}</span>}
              label={L.logout}
              danger
              onClick={() => fire("logout")}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes topbarMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  );
}
