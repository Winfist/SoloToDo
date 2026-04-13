// AIChatWidget.jsx — Floating AI Coach widget in Solo Leveling "System" persona
// Always-visible floating button (bottom-right) that expands to a terminal-style chat panel.
// The System answers as an authoritative, cold RPG entity.

import { useState, useRef, useEffect } from "react";

const QUICK_ACTIONS = [
  { label: "Was als nächstes?", question: "Was soll ich als nächsten Schritt tun, um mich zu verbessern?" },
  { label: "Meine Schwächen", question: "Analysiere meine Stats und zeige mir meine größten Schwächen." },
  { label: "Motiviere mich", question: "Ich brauche Motivation. Sage mir, warum ich weitermachen soll." },
  { label: "Tagesplan", question: "Erstelle mir einen kurzen Quest-Plan für heute basierend auf meinen Stats." },
];

const MAX_MESSAGES = 5;

export function AIChatWidget({ geminiAI, state }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendMessage(question) {
    if (!question.trim() || geminiAI.isLoading) return;
    setInput("");

    const userMsg = { role: "user", text: question };
    setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), userMsg]);
    setTyping(true);

    const result = await geminiAI.askCoach(question);
    setTyping(false);

    const sysMsg = {
      role: "system",
      text: result?.response || "Das System schweigt. Versuche es später erneut.",
    };
    setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), sysMsg]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={styles.fab}
        title="KI-Coach öffnen"
        aria-label="KI-Coach"
      >
        <span style={styles.fabIcon}>{open ? "✕" : "👁"}</span>
        {!open && geminiAI.isLoading && <span style={styles.fabDot} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>SYSTEM · KI-COACH</span>
            <span style={styles.panelStatus}>
              {geminiAI.isLoading ? "ANALYSIERT..." : "ONLINE"}
            </span>
          </div>

          {/* Rate limit / error banner */}
          {geminiAI.error && (
            <div style={styles.errorBanner}>
              {geminiAI.error}
              <button style={styles.errorDismiss} onClick={geminiAI.clearError}>✕</button>
            </div>
          )}

          {/* Message history */}
          <div style={styles.messages}>
            {messages.length === 0 && (
              <p style={styles.emptyHint}>Stelle dem System eine Frage, Hunter.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === "user" ? styles.msgUser : styles.msgSystem}>
                {msg.role === "system" && <span style={styles.msgPrefix}>[SYSTEM] </span>}
                <TypewriterText text={msg.text} active={i === messages.length - 1 && msg.role === "system"} />
              </div>
            ))}
            {typing && (
              <div style={styles.msgSystem}>
                <span style={styles.msgPrefix}>[SYSTEM] </span>
                <span style={styles.blinkDots}>■ ■ ■</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div style={styles.quickActions}>
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                style={styles.quickBtn}
                onClick={() => sendMessage(qa.question)}
                disabled={geminiAI.isLoading}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage das System..."
              style={styles.input}
              maxLength={300}
              disabled={geminiAI.isLoading}
            />
            <button
              style={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || geminiAI.isLoading}
            >
              ▶
            </button>
          </div>

          <style>{`
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
            @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          `}</style>
        </div>
      )}
    </>
  );
}

// Typewriter effect for system responses
function TypewriterText({ text, active }) {
  const [displayed, setDisplayed] = useState(active ? "" : text);
  const indexRef = useRef(active ? 0 : text.length);

  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, active]);

  return <span>{displayed}</span>;
}

const styles = {
  fab: {
    position: "fixed", bottom: 24, right: 24, zIndex: 8000,
    width: 52, height: 52, borderRadius: "50%",
    background: "linear-gradient(135deg, #0a0a1a, #111128)",
    border: "1px solid rgba(0,200,255,0.4)",
    color: "#0af", fontSize: "1.3rem",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 20px rgba(0,150,255,0.25)",
    transition: "all 0.2s",
  },
  fabIcon: { lineHeight: 1 },
  fabDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: "50%",
    background: "#0af", animation: "blink 1s infinite",
  },
  panel: {
    position: "fixed", bottom: 86, right: 16, zIndex: 7999,
    width: "min(360px, calc(100vw - 32px))",
    background: "linear-gradient(180deg, #07070f 0%, #040408 100%)",
    border: "1px solid rgba(0,200,255,0.25)",
    borderRadius: 8,
    fontFamily: "'Courier New', monospace",
    color: "#c8d8ff",
    boxShadow: "0 0 40px rgba(0,100,200,0.2)",
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.2s ease",
    maxHeight: "70vh",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 14px 8px",
    borderBottom: "1px solid rgba(0,200,255,0.15)",
  },
  panelTitle: {
    fontSize: "0.6rem", color: "#0af", letterSpacing: "0.15em", textTransform: "uppercase",
  },
  panelStatus: {
    fontSize: "0.55rem", color: "#336", letterSpacing: "0.1em",
  },
  errorBanner: {
    background: "rgba(200,0,0,0.12)", borderBottom: "1px solid rgba(200,0,0,0.2)",
    padding: "6px 12px", fontSize: "0.7rem", color: "#f87171",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  errorDismiss: {
    background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.75rem",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: 10,
    minHeight: 80, maxHeight: "calc(70vh - 200px)",
  },
  emptyHint: {
    color: "#334455", fontSize: "0.72rem", textAlign: "center", margin: "16px 0",
  },
  msgUser: {
    alignSelf: "flex-end",
    background: "rgba(0,150,255,0.12)", border: "1px solid rgba(0,150,255,0.2)",
    borderRadius: "6px 6px 2px 6px",
    padding: "6px 10px", fontSize: "0.75rem", color: "#8bb8dd",
    maxWidth: "85%", wordBreak: "break-word",
    animation: "slideUp 0.2s ease",
  },
  msgSystem: {
    alignSelf: "flex-start",
    fontSize: "0.75rem", color: "#00cc88",
    lineHeight: 1.5, maxWidth: "95%",
    wordBreak: "break-word",
    animation: "slideUp 0.2s ease",
  },
  msgPrefix: {
    color: "#006644", fontSize: "0.65rem", marginRight: 4,
  },
  blinkDots: {
    color: "#00cc88", fontSize: "0.7rem",
    animation: "blink 0.8s infinite",
  },
  quickActions: {
    display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 14px",
    borderTop: "1px solid rgba(0,200,255,0.1)",
  },
  quickBtn: {
    background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.2)",
    borderRadius: 3, color: "#5a8aa0", padding: "4px 8px",
    fontSize: "0.62rem", cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.03em",
    transition: "background 0.15s",
  },
  inputRow: {
    display: "flex", gap: 6, padding: "8px 12px 12px",
    borderTop: "1px solid rgba(0,200,255,0.1)",
  },
  input: {
    flex: 1, background: "rgba(0,200,255,0.05)",
    border: "1px solid rgba(0,200,255,0.2)", borderRadius: 4,
    color: "#c8d8ff", fontFamily: "inherit", fontSize: "0.75rem",
    padding: "7px 10px", outline: "none",
    minWidth: 0,
  },
  sendBtn: {
    background: "rgba(0,150,255,0.2)", border: "1px solid rgba(0,150,255,0.4)",
    color: "#0af", borderRadius: 4, padding: "6px 12px",
    cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem",
    flexShrink: 0,
  },
};
