import React, { useEffect, useState } from "react";
import { GEM_ICONS } from "../data/icons.js";

export default function GemBoosterBanner({ activeBoosters, theme }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!activeBoosters || activeBoosters.length === 0) return undefined;
    const interval = setInterval(() => forceUpdate(v => v + 1), 30000);
    return () => clearInterval(interval);
  }, [activeBoosters]);

  if (!activeBoosters || activeBoosters.length === 0) return null;

  const accent = theme?.accent || "#a78bfa";
  const primary = theme?.primary || "#22d3ee";
  const strongest = activeBoosters.reduce((best, booster) => {
    const remaining = Math.max(0, booster.expiresAt - Date.now());
    return !best || remaining < best.remaining ? { booster, remaining } : best;
  }, null);

  const formatRemaining = (remaining) => {
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <section
      style={{
        background: "rgba(8,12,24,0.86)",
        border: "1px solid rgba(148,163,184,0.14)",
        borderLeft: `3px solid ${accent}66`,
        borderRadius: 12,
        padding: "11px 12px",
        marginBottom: 10,
        boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: activeBoosters.length > 1 ? 9 : 0 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: `${accent}10`,
            border: `1px solid ${accent}2c`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img src={GEM_ICONS.gem} alt="" style={{ width: 17, height: 17, objectFit: "contain", filter: "brightness(1.08)" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: accent, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, letterSpacing: 1.2 }}>
            GEM BOOSTER
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeBoosters.length === 1 ? activeBoosters[0].name : `${activeBoosters.length} aktive Booster`}
          </div>
        </div>

        {strongest && (
          <div style={{ color: "#cbd5e1", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, flexShrink: 0 }}>
            {formatRemaining(strongest.remaining)}
          </div>
        )}
      </div>

      {activeBoosters.length === 1 && (
        (() => {
          const booster = activeBoosters[0];
          const remaining = Math.max(0, booster.expiresAt - Date.now());
          const totalDuration = Math.max(1, booster.expiresAt - booster.activatedAt);
          const progress = Math.max(0, Math.min(1, remaining / totalDuration));
          return (
            <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginTop: 9 }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 999, background: progress <= 0.3 ? "#ef4444" : primary, transition: "width 30s linear" }} />
            </div>
          );
        })()
      )}

      {activeBoosters.length > 1 && (
        <div style={{ display: "grid", gap: 7 }}>
          {activeBoosters.map((booster, index) => {
            const remaining = Math.max(0, booster.expiresAt - Date.now());
            const totalDuration = Math.max(1, booster.expiresAt - booster.activatedAt);
            const progress = Math.max(0, Math.min(1, remaining / totalDuration));
            const urgent = progress <= 0.3;

            return (
              <div key={`${booster.name}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px 48px", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#cbd5e1", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {booster.name}
                </span>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 999, background: urgent ? "#ef4444" : primary, transition: "width 30s linear" }} />
                </div>
                <span style={{ color: urgent ? "#ef4444" : "#94a3b8", fontSize: 10, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>
                  {formatRemaining(remaining)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
