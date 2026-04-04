import React, { useState, useEffect } from 'react';
import { MP_THEME } from '../data/mpConstants';
import { subscribeToGlobalChat, sendGlobalMessage } from '../mpFirebase';
import ChatPanel from '../components/ChatPanel';
import { auth } from '../../firebase';

export default function SocialView({ playerState }) {
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("global"); // global | friends

  const myUid = auth.currentUser?.uid;
  if (myUid) window.__currentUid = myUid;

  // Subscribe to global chat
  useEffect(() => {
    if (tab !== "global") return;
    const unsub = subscribeToGlobalChat((msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [tab]);

  const handleSend = async (text) => {
    const rank = getRankName(playerState?.level || 1);
    await sendGlobalMessage(text, playerState?.hunterName || "Hunter", playerState?.level || 1, rank);
  };

  return (
    <div style={{ animation: "mpFadeIn 0.3s ease", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
          HUNTER NETWORK
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${MP_THEME.glow}` }}>
          💬 Social Hub
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "global", label: "Global Chat", icon: "🌐" },
          { id: "friends", label: "Freunde", icon: "👥" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", borderRadius: 12, fontSize: 11,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: tab === t.id ? `${MP_THEME.primary}22` : "rgba(255,255,255,0.03)",
            color: tab === t.id ? MP_THEME.accent : "#64748b",
            border: `1px solid ${tab === t.id ? MP_THEME.primary + "44" : "rgba(255,255,255,0.06)"}`,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Global Chat */}
      {tab === "global" && (
        <div style={{ flex: 1 }}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            playerName={playerState?.hunterName}
            playerLevel={playerState?.level}
            playerRank={getRankName(playerState?.level)}
            placeholder="Nachricht an alle Hunter..."
          />
        </div>
      )}

      {/* Friends – Coming Soon */}
      {tab === "friends" && (
        <div style={{
          flex: 1,
          background: MP_THEME.card,
          border: `1px solid rgba(255,255,255,0.05)`,
          borderRadius: 16, padding: "40px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "mpFloat 3s ease-in-out infinite" }}>👥</div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: MP_THEME.raidPurple, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
            COMING SOON
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 8 }}>
            Freundesystem
          </div>
          <div style={{ fontSize: 12, color: MP_THEME.textMuted, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
            Bald kannst du andere Hunter als Freunde hinzufügen, ihre Profile sehen und zusammen auf Raids gehen.
          </div>

          {/* Feature preview cards */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "center" }}>
            {[
              { icon: "📨", label: "Anfragen" },
              { icon: "🤝", label: "Freunde" },
              { icon: "⚔️", label: "Co-op" },
            ].map(f => (
              <div key={f.label} style={{
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <div style={{ fontSize: 20, opacity: 0.5 }}>{f.icon}</div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
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
