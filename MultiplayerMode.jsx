import React, { useState } from 'react';
import { MP_THEME, MP_CSS } from './multiplayer/data/mpConstants';
import MPNavigation from './multiplayer/MPNavigation';
import GuildView from './multiplayer/views/GuildView';
import RaidsView from './multiplayer/views/RaidsView';
import LeaderboardView from './multiplayer/views/LeaderboardView';
import SocialView from './multiplayer/views/SocialView';

export default function MultiplayerMode({ playerState, onExitMP, onStateUpdate }) {
  const [currentView, setCurrentView] = useState("guild");

  const rank = getRankName(playerState?.level || 1);
  const rankColor = getRankColor(rank);

  return (
    <div style={{
      minHeight: "100vh",
      background: MP_THEME.bg,
      color: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      paddingBottom: 80,
      overflowX: "hidden",
      width: "100%",
      boxSizing: "border-box",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ${MP_CSS}
      `}</style>

      {/* Dynamic Background Effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" opacity=\"0.03\"><path d=\"M0 0h40v40H0z\" fill=\"none\"/><path d=\"M0 19h40v2H0z\" fill=\"%23fff\"/></svg>')", animation: "mpScan 10s linear infinite" }} />
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%", background: `radial-gradient(ellipse at center, ${MP_THEME.primary}15, transparent 70%)`, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-20%", width: "60%", height: "60%", background: `radial-gradient(ellipse at center, ${MP_THEME.secondary}15, transparent 70%)`, filter: "blur(80px)" }} />
        {/* Glow particle field */}
        <div style={{ position: "absolute", top: "30%", left: "50%", width: 6, height: 6, borderRadius: "50%", background: MP_THEME.accent, opacity: 0.6, animation: "mpFloat 4s ease-in-out infinite", boxShadow: `0 0 15px ${MP_THEME.accent}` }} />
        <div style={{ position: "absolute", top: "60%", left: "20%", width: 4, height: 4, borderRadius: "50%", background: MP_THEME.primary, opacity: 0.4, animation: "mpFloat 5s ease-in-out infinite 1s", boxShadow: `0 0 10px ${MP_THEME.primary}` }} />
        <div style={{ position: "absolute", top: "45%", right: "15%", width: 4, height: 4, borderRadius: "50%", background: MP_THEME.accent, opacity: 0.5, animation: "mpFloat 6s ease-in-out infinite 2s", boxShadow: `0 0 10px ${MP_THEME.accent}` }} />
      </div>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: `linear-gradient(180deg, rgba(6,6,15,0.95) 0%, rgba(6,6,15,0.85) 100%)`,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${MP_THEME.primary}44`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05) inset`,
        padding: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto", width: "100%" }}>
          {/* Back Button */}
          <button
            onClick={onExitMP}
            style={{
              background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`,
              color: "#94a3b8", borderRadius: 10, padding: "8px 14px",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s", cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <span>←</span> Solo Mode
          </button>

          {/* Player Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Rank Badge */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${rankColor}18`, border: `1px solid ${rankColor}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: rankColor,
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              {rank}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>
                {playerState?.hunterName || "Hunter"}
              </div>
              <div style={{ fontSize: 9, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>
                ASSOCIATION
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "16px", maxWidth: 480, width: "100%", zIndex: 1, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        {currentView === "guild" && <GuildView playerState={playerState} onStateUpdate={onStateUpdate} />}
        {currentView === "raids" && <RaidsView playerState={playerState} onStateUpdate={onStateUpdate} />}
        {currentView === "ranks" && <LeaderboardView playerState={playerState} onStateUpdate={onStateUpdate} />}
        {currentView === "social" && <SocialView playerState={playerState} onStateUpdate={onStateUpdate} />}
      </main>

      {/* MP Navigation */}
      <MPNavigation currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

function getRankName(level) {
  if (level >= 91) return "SSS";
  if (level >= 71) return "S";
  if (level >= 51) return "A";
  if (level >= 36) return "B";
  if (level >= 21) return "C";
  if (level >= 11) return "D";
  return "E";
}

function getRankColor(rank) {
  const colors = { "E": "#6b7280", "D": "#22d3ee", "C": "#34d399", "B": "#a78bfa", "A": "#f59e0b", "S": "#ef4444", "SSS": "#e879f9" };
  return colors[rank] || "#6b7280";
}
