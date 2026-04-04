import React, { useState, useEffect } from 'react';
import { MP_THEME } from '../data/mpConstants';
import { subscribeToGlobalChat, sendGlobalMessage } from '../mpFirebase';
import ChatPanel from '../components/ChatPanel';
import { auth } from '../../firebase';

export default function SocialView({ playerState, onStateUpdate }) {
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
    <div style={{ animation: "mpFadeIn 0.3s ease", display: "flex", flexDirection: "column", height: "100%", width: "100%", boxSizing: "border-box" }}>
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

      {/* Friends */}
      {tab === "friends" && (
        <div style={{ flex: 1, animation: "mpFadeIn 0.3s ease" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>DEIN HUNTER CODE</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input readOnly value={myUid || "Lokal (FakeID)"} style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }} />
              <button onClick={() => alert("Kopiert!")} style={{ background: MP_THEME.primary, border: "none", borderRadius: 8, padding: "0 16px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Kopieren</button>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>FREUND HINZUFÜGEN</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input id="frInput" placeholder="Hunter Code..." style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }} />
              <button onClick={() => {
                const val = document.getElementById("frInput").value;
                if (!val) return;
                if (playerState && onStateUpdate) {
                  const friends = playerState.multiplayer?.social?.friends || [];
                  onStateUpdate({ ...playerState, multiplayer: { ...playerState.multiplayer, social: { ...playerState.multiplayer.social, friends: [...friends, { uid: val, name: "Hunter_" + val.slice(0, 4), level: Math.floor(Math.random() * 50) + 10 }] } } });
                  document.getElementById("frInput").value = "";
                  alert("Freundschaftsanfrage akzeptiert!");
                }
              }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "0 16px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Add</button>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>DEINE FREUNDE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(playerState?.multiplayer?.social?.friends || []).length > 0 ? (
              playerState.multiplayer.social.friends.map((f, i) => (
                <div key={i} style={{ background: MP_THEME.card, border: `1px solid rgba(255,255,255,0.05)`, padding: "12px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>👤</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace" }}>Lv. {f.level}</div>
                    </div>
                  </div>
                  <button onClick={() => {
                    if (playerState && onStateUpdate) {
                      const friends = playerState.multiplayer.social.friends.filter(x => x.uid !== f.uid);
                      onStateUpdate({ ...playerState, multiplayer: { ...playerState.multiplayer, social: { ...playerState.multiplayer.social, friends } } });
                    }
                  }} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "6px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>Entfernen</button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: 11 }}>Noch keine Freunde in der Liste.</div>
            )}
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
