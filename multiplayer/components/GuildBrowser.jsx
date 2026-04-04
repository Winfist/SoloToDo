import React, { useState, useEffect } from 'react';
import { MP_THEME, GUILD_TIERS } from '../data/mpConstants';
import { fetchAvailableGuilds } from '../mpFirebase';

export default function GuildBrowser({ onJoin, onBack, myUid }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    setLoading(true);
    try {
      const data = await fetchAvailableGuilds();
      setGuilds(data.filter(g => !g.memberIds?.includes(myUid)));
    } catch (e) {
      console.error("Error loading guilds:", e);
    }
    setLoading(false);
  };

  const handleJoin = async (guildId) => {
    setJoining(guildId);
    try {
      await onJoin(guildId);
    } catch (e) {
      console.error("Error joining guild:", e);
      setJoining(null);
    }
  };

  return (
    <div style={{ animation: "mpFadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
            GILDEN SUCHEN
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>
            Verfügbare Gilden
          </div>
        </div>
        <button onClick={onBack} style={{
          padding: "8px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
          cursor: "pointer", transition: "all 0.2s",
        }}>
          ← Zurück
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "mpSpin 2s linear infinite" }}>🌀</div>
          <div style={{ fontSize: 11, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
            Gilden werden geladen...
          </div>
        </div>
      ) : guilds.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 40,
          background: MP_THEME.card, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏜️</div>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 6 }}>Keine Gilden gefunden</div>
          <div style={{ fontSize: 11, color: MP_THEME.textMuted }}>Sei der Erste und gründe eine Gilde!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {guilds.map(guild => {
            const tier = GUILD_TIERS[guild.tier] || GUILD_TIERS.E;
            const isFull = (guild.memberIds?.length || 0) >= guild.maxMembers;
            return (
              <div key={guild.id} style={{
                background: MP_THEME.card, borderRadius: 16, padding: "16px 20px",
                border: `1px solid ${tier.color}22`,
                display: "flex", alignItems: "center", gap: 14,
                opacity: isFull ? 0.5 : 1,
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 36 }}>{guild.icon || "🏰"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Cinzel',serif" }}>
                      {guild.name}
                    </div>
                    <span style={{ fontSize: 11, color: tier.color, fontFamily: "'JetBrains Mono',monospace" }}>
                      {guild.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
                    {tier.name} · {guild.memberIds?.length || 0}/{guild.maxMembers} Members
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(guild.id)}
                  disabled={isFull || joining === guild.id}
                  style={{
                    padding: "10px 18px", borderRadius: 12, fontSize: 11, fontWeight: 800,
                    background: isFull ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${MP_THEME.primary}, ${MP_THEME.secondary})`,
                    color: isFull ? "#475569" : "#fff",
                    border: "none", fontFamily: "'Cinzel',serif", letterSpacing: 1,
                    cursor: isFull ? "not-allowed" : "pointer",
                    boxShadow: isFull ? "none" : `0 2px 12px ${MP_THEME.glow}`,
                    transition: "all 0.2s",
                  }}
                >
                  {joining === guild.id ? "..." : isFull ? "VOLL" : "JOIN"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh */}
      <button onClick={loadGuilds} style={{
        width: "100%", padding: 12, marginTop: 16, borderRadius: 12,
        background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)`,
        color: MP_THEME.textMuted, fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
        cursor: "pointer", transition: "all 0.2s",
      }}>
        🔄 Aktualisieren
      </button>
    </div>
  );
}
