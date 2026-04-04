import React, { useState } from 'react';
import { MP_THEME, RAID_TEMPLATES } from '../data/mpConstants';

const RANK_COLORS = { "S": "#e879f9", "A": "#f59e0b", "B": "#a78bfa", "C": "#22d3ee", "D": "#6b7280" };

export default function RaidsView({ playerState }) {
  const [selectedRaid, setSelectedRaid] = useState(null);
  const playerLevel = playerState?.level || 1;

  return (
    <div style={{ animation: "mpFadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
          COOPERATIVE DUNGEONS
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${MP_THEME.glow}` }}>
          🌀 Raid Gates
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${MP_THEME.raidPurple}15, ${MP_THEME.secondary}10)`,
        border: `1px solid ${MP_THEME.raidPurple}33`,
        borderRadius: 14, padding: "12px 16px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ fontSize: 20, animation: "mpFloat 2s ease-in-out infinite" }}>🔮</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MP_THEME.raidPurple, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
            COMING SOON
          </div>
          <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
            Echtzeit Raid-Lobbies werden in einem zukünftigen Update freigeschaltet
          </div>
        </div>
      </div>

      {/* Raid Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {RAID_TEMPLATES.map((raid, idx) => {
          const rankColor = RANK_COLORS[raid.rank] || "#6b7280";
          const meetsLevel = playerLevel >= raid.minLevel;
          const isSelected = selectedRaid === raid.id;

          return (
            <div
              key={raid.id}
              onClick={() => setSelectedRaid(isSelected ? null : raid.id)}
              style={{
                background: isSelected
                  ? `linear-gradient(180deg, ${rankColor}15, rgba(0,0,0,0.3))`
                  : MP_THEME.card,
                border: `1px solid ${isSelected ? rankColor + "55" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 16,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isSelected ? "scale(1.01)" : "scale(1)",
                animation: `mpFadeIn 0.3s ease ${idx * 0.05}s both`,
              }}
            >
              {/* Raid Header */}
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${rankColor}18`,
                  border: `1px solid ${rankColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  filter: meetsLevel ? `drop-shadow(0 0 8px ${rankColor}66)` : "grayscale(0.5)",
                }}>
                  {raid.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: rankColor,
                      fontFamily: "'JetBrains Mono',monospace",
                      padding: "2px 6px", borderRadius: 4,
                      background: `${rankColor}18`, border: `1px solid ${rankColor}33`,
                      letterSpacing: 1,
                    }}>
                      {raid.rank}-RANK
                    </span>
                    <span style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                      {raid.timeEstimate}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif",
                    marginTop: 4, textShadow: isSelected ? `0 0 10px ${rankColor}44` : "none",
                  }}>
                    {raid.title}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                    {raid.minPlayers}–{raid.maxPlayers} Hunter · Min Lv.{raid.minLevel}
                  </div>
                </div>
                <div style={{
                  fontSize: 16, color: isSelected ? rankColor : "#334155",
                  transition: "all 0.3s",
                  transform: isSelected ? "rotate(90deg)" : "none",
                }}>
                  →
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div style={{
                  padding: "0 20px 20px",
                  animation: "mpFadeIn 0.3s ease",
                }}>
                  <div style={{ height: 1, background: `${rankColor}22`, marginBottom: 16 }} />

                  <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 14, lineHeight: 1.5 }}>
                    {raid.desc}
                  </div>

                  {/* Level Check */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 10, marginBottom: 14,
                    background: meetsLevel ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${meetsLevel ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>
                    <span style={{ fontSize: 14 }}>{meetsLevel ? "✅" : "🔒"}</span>
                    <div style={{
                      fontSize: 10, color: meetsLevel ? "#22c55e" : "#ef4444",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}>
                      {meetsLevel
                        ? `Level-Anforderung erfüllt (Lv.${playerLevel}/${raid.minLevel})`
                        : `Level ${raid.minLevel} benötigt (Du: Lv.${playerLevel})`
                      }
                    </div>
                  </div>

                  {/* Rewards */}
                  <div style={{
                    padding: 14, background: "rgba(0,0,0,0.4)", borderRadius: 12,
                    border: `1px solid ${rankColor}15`, marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 9, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>
                      BELOHNUNGEN
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {raid.rewards.map((r, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#cbd5e1", fontFamily: "'JetBrains Mono',monospace", display: "flex", gap: 6 }}>
                          <span style={{ color: rankColor }}>•</span> {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Join Button (disabled – Coming Soon) */}
                  <button disabled style={{
                    width: "100%", padding: 14, borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    color: "#475569", fontWeight: 800, fontSize: 12,
                    fontFamily: "'Cinzel',serif", letterSpacing: 2,
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <span style={{ animation: "mpPulseGold 2s infinite", fontSize: 14 }}>🔒</span>
                    RAID LOBBY · COMING SOON
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
