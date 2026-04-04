import React, { useState, useEffect, useRef } from 'react';
import { MP_THEME, RANK_COLORS, CHAT_CONFIG } from '../data/mpConstants';

export default function ChatPanel({ messages, onSend, playerName, playerLevel, playerRank, placeholder }) {
  const [text, setText] = useState("");
  const [lastSent, setLastSent] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const now = Date.now();
    if (now - lastSent < CHAT_CONFIG.rateLimitMs) return;
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setLastSent(now);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getTimeStr = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  };

  const getRankIcon = (rank) => {
    const icons = { "E": "◇", "D": "◆", "C": "★", "B": "✦", "A": "♛", "S": "☠", "SSS": "👑" };
    return icons[rank] || "◇";
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: MP_THEME.card, borderRadius: 16,
      border: `1px solid rgba(255,255,255,0.05)`, overflow: "hidden",
    }}>
      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: 200, maxHeight: 400,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>💬</div>
            <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
              Noch keine Nachrichten. Sei der Erste!
            </div>
          </div>
        ) : messages.map((msg, idx) => {
          const isMe = msg.userId === (window.__currentUid || "");
          const rankColor = RANK_COLORS[msg.rank] || "#6b7280";
          return (
            <div key={msg.id || idx} style={{
              display: "flex", gap: 10,
              animation: idx === messages.length - 1 ? "mpFadeIn 0.3s ease" : "none",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: `${rankColor}22`, border: `1px solid ${rankColor}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: rankColor,
              }}>
                {getRankIcon(msg.rank)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: isMe ? MP_THEME.accent : "#fff",
                    fontFamily: "'Cinzel',serif",
                  }}>
                    {msg.displayName}
                  </span>
                  <span style={{
                    fontSize: 8, color: rankColor,
                    fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                    padding: "1px 5px", borderRadius: 4,
                    background: `${rankColor}15`, border: `1px solid ${rankColor}33`,
                  }}>
                    Lv.{msg.level} {msg.rank}
                  </span>
                  <span style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>
                    {getTimeStr(msg.timestamp)}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, color: "#cbd5e1", marginTop: 3,
                  lineHeight: 1.5, wordBreak: "break-word",
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid rgba(255,255,255,0.05)`,
        display: "flex", gap: 8,
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value.slice(0, CHAT_CONFIG.maxMessageLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Nachricht eingeben..."}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12,
            background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", outline: "none", fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            padding: "0 18px", borderRadius: 12,
            background: text.trim()
              ? `linear-gradient(135deg, ${MP_THEME.primary}, ${MP_THEME.secondary})`
              : "rgba(255,255,255,0.05)",
            color: text.trim() ? "#fff" : "#475569",
            fontWeight: 800, fontFamily: "'Cinzel',serif", fontSize: 11,
            border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          SENDEN
        </button>
      </div>
    </div>
  );
}
