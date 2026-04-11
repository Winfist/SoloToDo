// GemBoosterBanner.jsx – Shows active gem boosters in the dashboard
import React, { useState, useEffect } from 'react';
import { GEM_ICONS } from '../data/icons.js';

export default function GemBoosterBanner({ activeBoosters, theme }) {
  const [, forceUpdate] = useState(0);

  // Refresh every 30s to update countdown
  useEffect(() => {
    if (!activeBoosters || activeBoosters.length === 0) return;
    const interval = setInterval(() => forceUpdate(v => v + 1), 30000);
    return () => clearInterval(interval);
  }, [activeBoosters]);

  if (!activeBoosters || activeBoosters.length === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.04))",
      border: "1px solid #a855f733",
      borderLeft: "3px solid #a855f766",
      borderRadius: 14,
      padding: "12px 16px",
      marginBottom: 12,
      animation: "fadeIn 0.3s ease",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Subtle glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "30%", height: "100%",
        background: "radial-gradient(circle at 100% 50%, rgba(124,58,237,0.1), transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: activeBoosters.length > 1 ? 8 : 0
      }}>
        <img src={GEM_ICONS.gem} alt="💎" style={{
          width: 18, height: 18, objectFit: "contain",
          filter: "drop-shadow(0 0 4px #a855f788)",
          animation: "float 3s ease-in-out infinite"
        }} />
        <div style={{
          fontSize: 9, letterSpacing: 2, color: "#a855f7",
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700
        }}>AKTIVE GEM BOOSTER</div>
      </div>

      {activeBoosters.map((b, i) => {
        const remaining = Math.max(0, b.expiresAt - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const totalDuration = b.expiresAt - b.activatedAt;
        const progress = Math.max(0, Math.min(1, remaining / totalDuration));

        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            marginTop: i > 0 || activeBoosters.length > 1 ? 6 : 2
          }}>
            <div style={{
              fontSize: 12, color: "#c084fc", fontWeight: 600,
              fontFamily: "'Outfit',sans-serif",
              flex: 1, display: "flex", alignItems: "center", gap: 6
            }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>⚡</span>
              <span style={{ fontSize: 11 }}>{b.name}</span>
            </div>
            <div style={{
              width: 60, height: 4, borderRadius: 2,
              background: "rgba(124,58,237,0.15)"
            }}>
              <div style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: progress > 0.3 ? "#a855f7" : "#ef4444",
                borderRadius: 2,
                transition: "width 30s linear"
              }} />
            </div>
            <span style={{
              fontSize: 10, color: progress > 0.3 ? "#a855f7" : "#ef4444",
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700, minWidth: 48, textAlign: "right"
            }}>{hours}h {mins}m</span>
          </div>
        );
      })}
    </div>
  );
}
