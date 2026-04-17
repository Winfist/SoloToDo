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

// Corner bracket decoration for the FAB button
function CornerBrackets({ color }) {
  const size = 8;
  const thickness = 2;
  const corners = [
    { top: 0, left: 0, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` },
    { top: 0, right: 0, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` },
    { bottom: 0, left: 0, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` },
    { bottom: 0, right: 0, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` },
  ];
  return (
    <>
      {corners.map((style, i) => (
        <div key={i} style={{ position: "absolute", width: size, height: size, pointerEvents: "none", ...style }} />
      ))}
    </>
  );
}

// Panel corner marks (L-shapes in each corner of the chat panel)
function PanelCorners({ color }) {
  const size = 10;
  const thickness = 1;
  const corners = [
    { top: 0, left: 0, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` },
    { top: 0, right: 0, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` },
    { bottom: 0, left: 0, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` },
    { bottom: 0, right: 0, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` },
  ];
  return (
    <>
      {corners.map((style, i) => (
        <div key={i} style={{ position: "absolute", width: size, height: size, pointerEvents: "none", zIndex: 2, ...style }} />
      ))}
    </>
  );
}

export function AIChatWidget({ geminiAI, state, theme = {} }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  const messagesEndRef = useRef(null);

  const primary = theme.primary || "#00c8ff";
  const glow = theme.glow || "rgba(0,200,255,0.35)";

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendMessage(question) {
    if (!question.trim() || geminiAI.isLoading || geminiAI.isRateLimited()) return;
    setInput("");

    const userMsg = { role: "user", text: question };
    setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), userMsg]);
    setTyping(true);

    const result = await geminiAI.askCoach(question);
    setTyping(false);

    if (result?.response) {
      const sysMsg = { role: "system", text: result.response };
      setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), sysMsg]);
    } else if (!geminiAI.isRateLimited() && !geminiAI.error) {
      const sysMsg = { role: "system", text: "Das System schweigt. Versuche es später erneut." };
      setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), sysMsg]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const fabStyle = {
    position: "fixed",
    bottom: 88,
    right: 20,
    zIndex: 8000,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: open
      ? `linear-gradient(135deg, ${primary}22, ${primary}11)`
      : `linear-gradient(135deg, #0a0a1a, #0d0d22)`,
    border: `1px solid ${open ? primary : primary + "66"}`,
    color: primary,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    boxShadow: fabHover || open
      ? `0 0 0 4px ${primary}22, 0 0 24px ${primary}55, 0 0 48px ${primary}22`
      : `0 0 0 2px ${primary}11, 0 0 16px ${primary}33`,
    transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
    transform: fabHover ? "scale(1.07)" : "scale(1)",
    overflow: "visible",
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes fabSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Pulse ring behind FAB */}
      {!open && (
        <div style={{
          position: "fixed",
          bottom: 88 + 28 - 28,
          right: 20 + 28 - 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: `1px solid ${primary}`,
          zIndex: 7998,
          animation: "pulseRing 2s ease-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        style={fabStyle}
        title="KI-Coach öffnen"
        aria-label="KI-Coach"
      >
        {/* Corner targeting brackets */}
        <CornerBrackets color={primary} />

        {open ? (
          <span style={{ fontSize: "0.9rem", color: primary, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0 }}>✕</span>
        ) : (
          <>
            <span style={{ fontSize: "1.1rem", color: primary, lineHeight: 1, filter: `drop-shadow(0 0 6px ${primary})` }}>◈</span>
            <span style={{ fontSize: "0.45rem", letterSpacing: "0.2em", color: primary + "cc", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, lineHeight: 1 }}>SYS</span>
          </>
        )}

        {/* Loading dot */}
        {!open && geminiAI.isLoading && (
          <div style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: primary,
            animation: "blink 1s infinite",
            boxShadow: `0 0 6px ${primary}`,
          }} />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 152,
          right: 12,
          zIndex: 7999,
          width: "min(360px, calc(100vw - 24px))",
          background: "linear-gradient(170deg, #07070f 0%, #040408 100%)",
          border: `1px solid ${primary}33`,
          borderRadius: 10,
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          color: "#c8d8ff",
          boxShadow: `0 0 0 1px ${primary}11, 0 8px 48px rgba(0,0,0,0.6), 0 0 32px ${primary}18`,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.22s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "60vh",
          overflow: "hidden",
        }}>
          {/* Corner marks */}
          <PanelCorners color={primary + "88"} />

          {/* Scan line overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,255,0.012) 3px, rgba(0,200,255,0.012) 4px)",
            pointerEvents: "none",
            zIndex: 1,
            borderRadius: 10,
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px 9px",
            borderBottom: `1px solid ${primary}1a`,
            position: "relative",
            zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: primary, fontSize: "0.55rem", opacity: 0.7 }}>◈</span>
              <span style={{
                fontSize: "0.6rem",
                color: primary,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}>
                [ SYS · KI-COACH ]
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                fontSize: "0.5rem",
                color: geminiAI.isLoading ? "#f59e0b" : "#22c55e",
                letterSpacing: "0.12em",
                fontWeight: 700,
              }}>
                {geminiAI.isLoading ? "ANALYSIERT" : "ONLINE"}
              </span>
              <span style={{
                fontSize: "0.6rem",
                color: geminiAI.isLoading ? "#f59e0baa" : "#22c55eaa",
                animation: "cursorBlink 1s step-end infinite",
                lineHeight: 1,
              }}>▋</span>
            </div>
          </div>

          {/* Rate limit / error banner */}
          {geminiAI.error && (
            <div style={{
              background: "rgba(200,0,0,0.1)",
              borderBottom: "1px solid rgba(200,0,0,0.18)",
              padding: "6px 12px",
              fontSize: "0.68rem",
              color: "#f87171",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 2,
            }}>
              {geminiAI.error}
              <button style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }} onClick={geminiAI.clearError}>✕</button>
            </div>
          )}

          {/* Message history */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 80,
            maxHeight: "calc(60vh - 200px)",
            position: "relative",
            zIndex: 2,
          }}>
            {messages.length === 0 && (
              <p style={{ color: "#1e3040", fontSize: "0.72rem", textAlign: "center", margin: "16px 0", letterSpacing: "0.05em" }}>
                &gt; Stelle dem System eine Frage, Hunter.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === "user" ? {
                alignSelf: "flex-end",
                background: `${primary}12`,
                border: `1px solid ${primary}22`,
                borderRadius: "6px 6px 2px 6px",
                padding: "6px 10px",
                fontSize: "0.74rem",
                color: "#8bb8dd",
                maxWidth: "85%",
                wordBreak: "break-word",
                animation: "slideUp 0.2s ease",
              } : {
                alignSelf: "flex-start",
                fontSize: "0.74rem",
                color: "#00cc88",
                lineHeight: 1.55,
                maxWidth: "95%",
                wordBreak: "break-word",
                animation: "slideUp 0.2s ease",
              }}>
                {msg.role === "system" && (
                  <span style={{ color: "#005533", fontSize: "0.62rem", marginRight: 4, letterSpacing: "0.05em" }}>[SYSTEM]&nbsp;</span>
                )}
                <TypewriterText text={msg.text} active={i === messages.length - 1 && msg.role === "system"} />
              </div>
            ))}
            {typing && (
              <div style={{ alignSelf: "flex-start", fontSize: "0.74rem", color: "#00cc88", lineHeight: 1.55 }}>
                <span style={{ color: "#005533", fontSize: "0.62rem", marginRight: 4 }}>[SYSTEM]&nbsp;</span>
                <span style={{ color: "#00cc88", fontSize: "0.7rem", animation: "blink 0.8s infinite" }}>■ ■ ■</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            padding: "8px 12px",
            borderTop: `1px solid ${primary}12`,
            position: "relative",
            zIndex: 2,
          }}>
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                style={{
                  background: `${primary}08`,
                  border: `1px solid ${primary}22`,
                  borderRadius: 3,
                  color: "#4a7a90",
                  padding: "4px 8px",
                  fontSize: "0.6rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.04em",
                  transition: "all 0.15s",
                }}
                onClick={() => sendMessage(qa.question)}
                disabled={geminiAI.isLoading || geminiAI.rateLimitError}
              >
                &gt; {qa.label}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{
            display: "flex",
            gap: 6,
            padding: "8px 12px 12px",
            borderTop: `1px solid ${primary}12`,
            position: "relative",
            zIndex: 2,
          }}>
            <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 8, color: primary + "66", fontSize: "0.7rem", pointerEvents: "none", fontFamily: "inherit" }}>&gt;</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Frage das System..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: `${primary}07`,
                  border: `1px solid ${primary}22`,
                  borderRadius: 4,
                  color: "#c8d8ff",
                  fontFamily: "inherit",
                  fontSize: "0.74rem",
                  padding: "7px 10px 7px 20px",
                  outline: "none",
                  minWidth: 0,
                }}
                maxLength={300}
                disabled={geminiAI.isLoading || geminiAI.rateLimitError}
              />
            </div>
            <button
              style={{
                background: input.trim() && !geminiAI.isLoading ? `${primary}22` : "rgba(255,255,255,0.03)",
                border: `1px solid ${input.trim() && !geminiAI.isLoading ? primary + "55" : primary + "15"}`,
                color: input.trim() && !geminiAI.isLoading ? primary : primary + "33",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: input.trim() && !geminiAI.isLoading ? "pointer" : "default",
                fontFamily: "inherit",
                fontSize: "0.72rem",
                flexShrink: 0,
                letterSpacing: "0.08em",
                transition: "all 0.15s",
                boxShadow: input.trim() && !geminiAI.isLoading ? `0 0 10px ${primary}22` : "none",
              }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || geminiAI.isLoading || geminiAI.rateLimitError}
            >
              ▶
            </button>
          </div>
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
