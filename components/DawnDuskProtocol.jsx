import React, { useState, useEffect, useRef } from "react";
import { STAT_ICONS, NAV_ICONS } from "../data/icons.js";

// ═══════════════════════════════════════════════════════════════
// DAWN/DUSK PROTOCOL — Timed Routine Dungeon Run
// ═══════════════════════════════════════════════════════════════

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function isDawnWindow() { const h = new Date().getHours(); return h >= 5 && h < 11; }
function isDuskWindow() { const h = new Date().getHours(); return h >= 18 && h < 23; }

const CATEGORIES = {
  str: { color: "#ef4444", label: "STR", icon: "⚔️", iconSrc: STAT_ICONS.str },
  int: { color: "#3b82f6", label: "INT", icon: "📖", iconSrc: STAT_ICONS.int },
  vit: { color: "#22c55e", label: "VIT", icon: "❤️", iconSrc: STAT_ICONS.vit },
  agi: { color: "#f59e0b", label: "AGI", icon: "⚡", iconSrc: STAT_ICONS.agi },
  cha: { color: "#a855f7", label: "CHA", icon: "✨", iconSrc: STAT_ICONS.cha },
};

const TUTORIAL_SLIDES = [
  {
    iconSrc: NAV_ICONS.timer,
    title: "PROTOCOL ERKANNT",
    subtitle: "SYSTEM — NEUE DIREKTIVE",
    color: "#22d3ee",
    lines: [
      "Das System hat deine täglichen Muster analysiert.",
      "Ein spezialisiertes Trainingsprotokoll wurde für dich freigeschaltet.",
      "Morgen- und Abendroutinen werden als Dungeon-Runs behandelt.",
    ],
    lore: "\"Disziplin ist die Brücke zwischen Ziel und Vollendung.\""
  },
  {
    icon: "⏰",
    iconSrc: NAV_ICONS.timer,
    title: "ZEITFENSTER",
    subtitle: "SYSTEM — PROTOKOLL-FENSTER",
    color: "#fbbf24",
    lines: [
      "DAWN  —  05:00 bis 11:00 Uhr  (90 Min. Timer)",
      "DUSK  —  18:00 bis 23:00 Uhr  (60 Min. Timer)",
      "Das Protokoll kann nur innerhalb dieser Zeitfenster aktiviert werden.",
    ],
    lore: "\"Die stärksten Hunter entstehen in den Stunden, in denen andere schlafen.\""
  },
  {
    iconSrc: STAT_ICONS.cha,
    title: "ETAGEN-SYSTEM",
    subtitle: "SYSTEM — DUNGEON-STRUKTUR",
    color: "#a855f7",
    lines: [
      "Konfiguriere bis zu 5 Etagen pro Protokoll.",
      "Jede Etage muss der Reihe nach bezwungen werden.",
      "Wähle die Kategorie passend zur Etagen-Aufgabe (STR / INT / VIT ...).",
    ],
    lore: "\"Ein Dungeon ohne Ordnung ist nur Chaos. Bezwinge ihn Floor für Floor.\""
  },
  {
    iconSrc: STAT_ICONS.vit,
    title: "PERFECT RUN",
    subtitle: "SYSTEM — BONUS-PROTOKOLL",
    color: "#22c55e",
    lines: [
      "Schließe ALLE Etagen ab, BEVOR der Timer abläuft.",
      "Perfect Run gewährt +50% Bonus-XP auf alle Etagen.",
      "Jeder Perfect Run wird in deiner Akte vermerkt.",
    ],
    lore: "\"Perfektion ist kein Ziel. Es ist eine Gewohnheit.\""
  },
];

// ─── SYSTEM TUTORIAL OVERLAY ────────────────────────────────────
function SystemTutorial({ onClose }) {
  const [phase, setPhase] = useState("enter");
  const [slide, setSlide] = useState(0);
  const current = TUTORIAL_SLIDES[slide];
  const isLast = slide === TUTORIAL_SLIDES.length - 1;

  useEffect(() => {
    const t = setTimeout(() => setPhase("main"), 400);
    return () => clearTimeout(t);
  }, []);

  const nextSlide = () => {
    if (isLast) { onClose(); return; }
    setPhase("exit");
    setTimeout(() => { setSlide(s => s + 1); setPhase("enter"); setTimeout(() => setPhase("main"), 300); }, 250);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "radial-gradient(ellipse at 30% 20%, #000d1a 0%, #03020d 60%, #000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace", padding: "1.5rem"
    }}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker { 0%,100% { opacity:1; } 92% { opacity:1; } 93% { opacity:0.85; } 95% { opacity:1; } 97% { opacity:0.9; } }
        @keyframes system-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.25), inset 0 0 30px rgba(34,211,238,0.04); }
          50% { box-shadow: 0 0 0 6px rgba(34,211,238,0.05), inset 0 0 50px rgba(34,211,238,0.08); }
        }
        @keyframes icon-float {
          0%,100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes slide-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slide-down { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-20px); } }
        @keyframes dot-bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
        @keyframes grid-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>

      {/* Animated grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "grid-scroll 8s linear infinite",
      }} />

      {/* Scanline effect */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden"
      }}>
        <div style={{
          width: "100%", height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)",
          animation: "scanline 4s linear infinite"
        }} />
      </div>

      {/* Corner decorations */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map(pos => {
        const styles = {
          "top-left": { top: "1rem", left: "1rem", borderTop: "1px solid", borderLeft: "1px solid" },
          "top-right": { top: "1rem", right: "1rem", borderTop: "1px solid", borderRight: "1px solid" },
          "bottom-left": { bottom: "1rem", left: "1rem", borderBottom: "1px solid", borderLeft: "1px solid" },
          "bottom-right": { bottom: "1rem", right: "1rem", borderBottom: "1px solid", borderRight: "1px solid" },
        };
        return (
          <div key={pos} style={{
            position: "absolute", width: "24px", height: "24px",
            borderColor: `${current.color}40`, ...styles[pos], pointerEvents: "none"
          }} />
        );
      })}

      {/* SYSTEM label */}
      <div style={{
        position: "absolute", top: "1.75rem", textAlign: "center",
        fontSize: "0.6rem", letterSpacing: "0.5em", color: current.color,
        opacity: 0.5, animation: "flicker 6s infinite"
      }}>
        ◈ SYSTEM — INITIALISIERUNG ◈
      </div>

      {/* Main card */}
      <div style={{
        width: "100%", maxWidth: "420px", position: "relative", zIndex: 1,
        opacity: phase === "main" ? 1 : 0,
        transform: phase === "exit" ? "translateY(-20px)" : "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        animation: phase === "main" ? "system-pulse 3s ease-in-out infinite" : "none",
        background: "rgba(4,6,18,0.92)",
        border: `1px solid ${current.color}35`,
        borderRadius: "16px",
        padding: "2rem 1.75rem",
      }}>
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: "2px",
          background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
          borderRadius: "2px"
        }} />

        {/* Slide subtitle */}
        <div style={{
          fontSize: "0.6rem", letterSpacing: "0.4em", color: current.color,
          opacity: 0.7, marginBottom: "1.25rem", textAlign: "center"
        }}>
          {current.subtitle}
        </div>

        {/* Icon */}
        <div style={{
          textAlign: "center", fontSize: "3.5rem", marginBottom: "1rem",
          animation: "icon-float 3s ease-in-out infinite"
        }}>
          {current.iconSrc ? (
            <img src={current.iconSrc} alt={current.title} style={{ width: 64, height: 64, objectFit: "contain", filter: `drop-shadow(0 0 16px ${current.color}99) brightness(1.15)` }} />
          ) : current.icon}
        </div>

        {/* Title */}
        <div style={{
          textAlign: "center", fontSize: "1.5rem", fontWeight: 900,
          color: current.color, letterSpacing: "0.12em",
          marginBottom: "1.5rem", textTransform: "uppercase",
          textShadow: `0 0 20px ${current.color}60`
        }}>
          {current.title}
        </div>

        {/* Lines */}
        <div style={{
          background: "rgba(0,0,0,0.3)", borderRadius: "10px",
          border: `1px solid ${current.color}18`, padding: "1rem 1.1rem",
          marginBottom: "1.25rem"
        }}>
          {current.lines.map((line, i) => (
            <div key={i} style={{
              display: "flex", gap: "0.75rem", alignItems: "flex-start",
              marginBottom: i < current.lines.length - 1 ? "0.75rem" : 0,
              animation: `slide-up 0.4s ease ${i * 0.1}s both`
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
                background: `${current.color}20`, border: `1px solid ${current.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", color: current.color, fontWeight: 900
              }}>
                {i + 1}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: "0.82rem", lineHeight: 1.55 }}>{line}</div>
            </div>
          ))}
        </div>

        {/* Lore */}
        <div style={{
          color: "#4b5563", fontSize: "0.72rem", textAlign: "center",
          fontStyle: "italic", lineHeight: 1.5, marginBottom: "1.75rem"
        }}>
          {current.lore}
        </div>

        {/* Slide dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "1.25rem" }}>
          {TUTORIAL_SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? "20px" : "6px", height: "6px", borderRadius: "3px",
              background: i === slide ? current.color : "rgba(255,255,255,0.12)",
              transition: "all 0.3s ease",
              animation: i === slide ? "dot-bounce 1.5s ease-in-out infinite" : "none"
            }} />
          ))}
        </div>

        {/* CTA button */}
        <button onClick={nextSlide} style={{
          width: "100%", padding: "0.85rem",
          background: `linear-gradient(135deg, ${current.color}22, ${current.color}0d)`,
          border: `1px solid ${current.color}60`,
          borderRadius: "10px", color: current.color,
          cursor: "pointer", fontWeight: 900, fontSize: "0.82rem",
          letterSpacing: "0.2em", textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          transition: "all 0.2s",
          textShadow: `0 0 10px ${current.color}60`
        }}
          onMouseOver={e => e.currentTarget.style.background = `${current.color}30`}
          onMouseOut={e => e.currentTarget.style.background = `linear-gradient(135deg, ${current.color}22, ${current.color}0d)`}
        >
          {isLast ? "◈ PROTOKOLL AKTIVIEREN ◈" : `WEITER — ${slide + 2}/${TUTORIAL_SLIDES.length}`}
        </button>

        {/* Bottom accent */}
        <div style={{
          position: "absolute", bottom: 0, left: "30%", right: "30%", height: "1px",
          background: `linear-gradient(90deg, transparent, ${current.color}40, transparent)`
        }} />
      </div>

      {/* Skip */}
      <button onClick={onClose} style={{
        position: "absolute", bottom: "1.75rem",
        background: "transparent", border: "none",
        color: "#374151", fontSize: "0.7rem", cursor: "pointer",
        letterSpacing: "0.2em"
      }}>ÜBERSPRINGEN</button>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function DawnDuskProtocol({
  state, theme,
  startDawnDuskRun, completeProtocolFloor, configureProtocolTasks, abandonProtocolRun,
  onClose
}) {
  const [tab, setTab] = useState("dawn");
  const [screen, setScreen] = useState("main");
  const [configTasks, setConfigTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", category: "str" });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const timerRef = useRef(null);

  const run = state?.dawnDusk?.currentRun;
  const dawnTasks = state?.dawnDusk?.morningTasks || [];
  const duskTasks = state?.dawnDusk?.eveningTasks || [];
  const perfectRuns = state?.dawnDusk?.perfectRuns || 0;
  const runHistory = state?.dawnDusk?.runHistory || [];

  // Auto-show tutorial on first ever open
  useEffect(() => {
    const seen = localStorage.getItem("ddp_tutorial_seen");
    if (!seen && runHistory.length === 0 && dawnTasks.length === 0 && duskTasks.length === 0) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (run) { setScreen("run"); setTimeLeft(Math.max(0, run.timerSeconds - Math.round((Date.now() - run.startedAt) / 1000))); }
    else setScreen("main");
  }, [!!run]);

  useEffect(() => {
    if (screen !== "run" || !run) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, run]);

  const handleStartRun = () => startDawnDuskRun(tab);
  const handleFloorComplete = (floorId) => completeProtocolFloor(floorId);

  const handleSaveConfig = () => {
    configureProtocolTasks(tab, configTasks);
    setScreen("main");
  };

  const handleAbandon = () => {
    if (!window.confirm("Protokoll wirklich abbrechen?")) return;
    abandonProtocolRun();
    setScreen("main");
  };

  const openConfig = () => {
    setConfigTasks((tab === "dawn" ? dawnTasks : duskTasks).map(t => ({ ...t })));
    setScreen("config");
  };

  const addTask = () => {
    if (!newTask.title.trim() || configTasks.length >= 5) return;
    setConfigTasks(prev => [...prev, { id: Date.now().toString(36), title: newTask.title.trim(), category: newTask.category }]);
    setNewTask({ title: "", category: "str" });
  };

  const currentTasks = tab === "dawn" ? dawnTasks : duskTasks;
  const windowOpen = tab === "dawn" ? isDawnWindow() : isDuskWindow();
  const windowText = tab === "dawn" ? "05:00 – 11:00 Uhr" : "18:00 – 23:00 Uhr";
  const timerPct = run ? Math.max(0, timeLeft / run.timerSeconds) * 100 : 100;
  const timerColor = timerPct > 50 ? "#22c55e" : timerPct > 25 ? "#f59e0b" : "#ef4444";
  const tabColor = tab === "dawn" ? "#fbbf24" : "#818cf8";
  const tabGlow = tab === "dawn" ? "rgba(251,191,36,0.15)" : "rgba(129,140,248,0.15)";

  return (
    <>
      <style>{`
        @keyframes protocol-glow {
          0%,100% { box-shadow: 0 0 20px rgba(34,211,238,0.08); }
          50% { box-shadow: 0 0 40px rgba(34,211,238,0.18); }
        }
        @keyframes floor-enter { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes timer-pulse {
          0%,100% { text-shadow: 0 0 10px currentColor; }
          50% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
        }
        @keyframes perfect-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes active-floor-pulse {
          0%,100% { border-color: rgba(34,211,238,0.4); box-shadow: 0 0 0 0 rgba(34,211,238,0.2); }
          50% { border-color: rgba(34,211,238,0.8); box-shadow: 0 0 0 4px rgba(34,211,238,0.05); }
        }
        @keyframes window-blink {
          0%,100% { opacity:1; } 50% { opacity:0.5; }
        }
        @keyframes header-scan {
          0% { background-position: 0 0; }
          100% { background-position: 30px 30px; }
        }
      `}</style>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <SystemTutorial onClose={() => {
          localStorage.setItem("ddp_tutorial_seen", "1");
          setShowTutorial(false);
        }} />
      )}

      <div style={{
        position: "fixed", inset: 0, zIndex: 9100, background: "#04040c",
        display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace",
        overflowY: "auto"
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "rgba(4,6,18,0.98)",
          borderBottom: `1px solid ${run ? (run.type === "dawn" ? "rgba(251,191,36,0.25)" : "rgba(129,140,248,0.25)") : "rgba(34,211,238,0.15)"}`,
          padding: "0.85rem 1rem",
          backgroundImage: "linear-gradient(rgba(34,211,238,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.02) 1px, transparent 1px)",
          backgroundSize: "30px 30px", animation: "header-scan 10s linear infinite"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: "0.55rem", letterSpacing: "0.45em", color: "#22d3ee",
                opacity: 0.6, marginBottom: "0.2rem"
              }}>
                ◈ SYSTEM — SPEZIALISIERTES PROTOKOLL
              </div>
              <div style={{
                fontSize: "1.15rem", fontWeight: 900, color: "#e2e8f0", letterSpacing: "0.06em",
                textShadow: run ? `0 0 20px ${run.type === "dawn" ? "#fbbf24" : "#818cf8"}50` : "none"
              }}>
                {screen === "run"
                  ? (run?.type === "dawn" ? "DAWN PROTOCOL" : "DUSK PROTOCOL")
                  : "DAWN / DUSK PROTOCOL"
                }
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {screen !== "run" && (
                <button onClick={() => setShowTutorial(true)} style={{
                  background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
                  color: "#22d3ee", padding: "0.3rem 0.6rem", borderRadius: "6px",
                  cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em"
                }}>? HILFE</button>
              )}
              {screen !== "run" ? (
                <button onClick={onClose} style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#6b7280", padding: "0.3rem 0.6rem", borderRadius: "6px",
                  cursor: "pointer", fontSize: "0.75rem"
                }}>✕</button>
              ) : (
                <button onClick={handleAbandon} style={{
                  background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.35)",
                  color: "#ef4444", padding: "0.3rem 0.7rem", borderRadius: "6px",
                  cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em"
                }}>✕ ABBRUCH</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "1rem", maxWidth: "480px", margin: "0 auto", width: "100%" }}>

          {/* ══ MAIN SCREEN ══ */}
          {screen === "main" && (
            <>
              {/* Tab selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.25rem" }}>
                {["dawn", "dusk"].map(type => {
                  const isActive = tab === type;
                  const c = type === "dawn" ? "#fbbf24" : "#818cf8";
                  return (
                    <button key={type} onClick={() => setTab(type)} style={{
                      padding: "0.8rem 0.5rem", borderRadius: "10px", cursor: "pointer",
                      background: isActive ? `${c}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? `${c}55` : "rgba(255,255,255,0.07)"}`,
                      color: isActive ? c : "#4b5563",
                      fontWeight: isActive ? 900 : 400, fontSize: "0.9rem",
                      transition: "all 0.2s",
                      boxShadow: isActive ? `0 0 20px ${c}15` : "none",
                      fontFamily: "'Courier New', monospace",
                      letterSpacing: "0.08em"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{type === "dawn" ? <img src="/icons/story_dawn.png" alt="Dawn" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #fbbf2488) brightness(1.1)" }} /> : <img src="/icons/health_sleep.png" alt="Dusk" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px #818cf888) brightness(1.1)" }} />}</div>
                      <div style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>
                        {type === "dawn" ? "DAWN" : "DUSK"}
                      </div>
                      <div style={{ fontSize: "0.6rem", opacity: 0.6, marginTop: "0.1rem" }}>
                        {type === "dawn" ? "05–11 Uhr" : "18–23 Uhr"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stats bar */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem"
              }}>
                <div style={{
                  padding: "0.65rem", background: "rgba(251,191,36,0.06)",
                  borderRadius: "8px", border: "1px solid rgba(251,191,36,0.15)", textAlign: "center"
                }}>
                  <div style={{ color: "#fbbf24", fontSize: "1.3rem", fontWeight: 900 }}>{perfectRuns}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.6rem", letterSpacing: "0.15em" }}>PERFECT</div>
                </div>
                <div style={{
                  padding: "0.65rem", background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center"
                }}>
                  <div style={{ color: "#e2e8f0", fontSize: "1.3rem", fontWeight: 900 }}>{runHistory.length}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.6rem", letterSpacing: "0.15em" }}>RUNS</div>
                </div>
                <div style={{
                  padding: "0.65rem",
                  background: windowOpen ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)",
                  borderRadius: "8px",
                  border: `1px solid ${windowOpen ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: windowOpen ? "#22c55e" : "#ef4444",
                    animation: windowOpen ? "window-blink 2s ease-in-out infinite" : "none"
                  }}>
                    {windowOpen ? "● OFFEN" : "○ ZU"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                    {windowText}
                  </div>
                </div>
              </div>

              {/* Floor list */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "0.75rem"
                }}>
                  <div style={{
                    color: "#e2e8f0", fontWeight: 700, fontSize: "0.82rem",
                    letterSpacing: "0.12em"
                  }}>
                     <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{tab === "dawn" ? <img src="/icons/story_dawn.png" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /> : <img src="/icons/health_sleep.png" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />} {tab === "dawn" ? "MORGEN-ETAGEN" : "ABEND-ETAGEN"}</span>
                    <span style={{ color: tabColor, marginLeft: "0.5rem" }}>
                      {currentTasks.length}/5
                    </span>
                  </div>
                </div>

                {currentTasks.length === 0 ? (
                  <div style={{
                    padding: "2rem 1rem", textAlign: "center",
                    border: `1px dashed ${tabColor}25`, borderRadius: "12px",
                    background: `${tabColor}05`
                  }}>
                     <div style={{ marginBottom: "0.5rem" }}><img src={tab === "dawn" ? "/icons/story_dawn.png" : "/icons/health_sleep.png"} alt="" style={{ width: 36, height: 36, objectFit: "contain", filter: `drop-shadow(0 0 8px ${tabColor}88) brightness(1.1)` }} /></div>
                    <div style={{ color: "#4b5563", fontSize: "0.82rem", lineHeight: 1.5 }}>
                      Keine Etagen konfiguriert.<br />
                      <span style={{ color: tabColor, opacity: 0.7 }}>Richte deine Routine ein →</span>
                    </div>
                  </div>
                ) : (
                  currentTasks.map((task, i) => {
                    const cat = CATEGORIES[task.category] || CATEGORIES.str;
                    return (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "center", gap: "0.85rem",
                        padding: "0.7rem 0.9rem", marginBottom: "0.4rem",
                        background: "rgba(255,255,255,0.025)", borderRadius: "9px",
                        border: `1px solid ${cat.color}20`,
                        animation: `floor-enter 0.3s ease ${i * 0.06}s both`
                      }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${cat.color}15`, border: `1px solid ${cat.color}40`,
                          fontSize: "0.7rem", color: cat.color, fontWeight: 900
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>
                            Etage {i + 1}: {task.title}
                          </div>
                          <div style={{ color: cat.color, fontSize: "0.62rem", marginTop: "0.1rem", opacity: 0.7, display: "flex", alignItems: "center", gap: 3 }}>
                            <img src={cat.iconSrc} alt={cat.label} style={{ width: 10, height: 10, objectFit: "contain" }} />
                            {cat.label}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {currentTasks.length > 0 && windowOpen && (
                  <button onClick={handleStartRun} style={{
                    padding: "1rem", borderRadius: "10px", cursor: "pointer",
                    fontWeight: 900, fontSize: "0.88rem", letterSpacing: "0.15em",
                    fontFamily: "'Courier New', monospace",
                    background: `linear-gradient(135deg, ${tabColor}22, ${tabColor}08)`,
                    border: `1px solid ${tabColor}60`,
                    color: tabColor,
                    boxShadow: `0 0 25px ${tabColor}15`,
                    transition: "all 0.2s"
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = `${tabColor}28`; e.currentTarget.style.boxShadow = `0 0 35px ${tabColor}30`; }}
                    onMouseOut={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${tabColor}22, ${tabColor}08)`; e.currentTarget.style.boxShadow = `0 0 25px ${tabColor}15`; }}
                  >
                     <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{tab === "dawn" ? <img src="/icons/story_dawn.png" alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /> : <img src="/icons/health_sleep.png" alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />} {tab === "dawn" ? "DAWN PROTOCOL STARTEN" : "DUSK PROTOCOL STARTEN"}</span>
                  </button>
                )}

                {currentTasks.length > 0 && !windowOpen && (
                  <div style={{
                    textAlign: "center", padding: "0.85rem",
                    background: "rgba(239,68,68,0.05)", borderRadius: "10px",
                    border: "1px solid rgba(239,68,68,0.15)"
                  }}>
                    <div style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                      ○ ZEITFENSTER GESCHLOSSEN
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.7rem", marginTop: "0.25rem" }}>
                      Verfügbar: {windowText}
                    </div>
                  </div>
                )}

                <button onClick={openConfig} style={{
                  padding: "0.7rem", borderRadius: "9px", cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
                  color: "#6b7280", fontSize: "0.78rem", letterSpacing: "0.1em",
                  fontFamily: "'Courier New', monospace", transition: "all 0.2s"
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#9ca3af"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#6b7280"; }}
                >
                   <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><img src={NAV_ICONS.settings} alt="" style={{ width: 14, height: 14, objectFit: "contain", filter: "brightness(0.8)" }} /> ETAGEN KONFIGURIEREN</span>
                </button>
              </div>
            </>
          )}

          {/* ══ CONFIG SCREEN ══ */}
          {screen === "config" && (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem"
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: `${tabColor}18`, border: `1px solid ${tabColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem"
                }}>
                   {tab === "dawn" ? <img src="/icons/story_dawn.png" alt="Dawn" style={{ width: 20, height: 20, objectFit: "contain", filter: `drop-shadow(0 0 4px ${tabColor}88)` }} /> : <img src="/icons/health_sleep.png" alt="Dusk" style={{ width: 20, height: 20, objectFit: "contain", filter: `drop-shadow(0 0 4px ${tabColor}88)` }} />}
                </div>
                <div>
                  <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.88rem" }}>
                    {tab === "dawn" ? "Morgen-Etagen" : "Abend-Etagen"} konfigurieren
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "0.68rem" }}>max. 5 Etagen · sequenziell</div>
                </div>
              </div>

              {/* Existing tasks */}
              {configTasks.map((task, i) => {
                const cat = CATEGORIES[task.category] || CATEGORIES.str;
                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    marginBottom: "0.4rem", padding: "0.65rem 0.8rem",
                    background: "rgba(255,255,255,0.03)", borderRadius: "8px",
                    border: `1px solid ${cat.color}20`
                  }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "5px",
                      background: `${cat.color}20`, border: `1px solid ${cat.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", color: cat.color, fontWeight: 900, flexShrink: 0
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, color: "#cbd5e1", fontSize: "0.82rem" }}>{task.title}</div>
                    <div style={{ color: cat.color, fontSize: "0.65rem", opacity: 0.7 }}>{cat.label}</div>
                    <button onClick={() => setConfigTasks(p => p.filter(t => t.id !== task.id))} style={{
                      background: "transparent", border: "none", color: "#4b5563",
                      cursor: "pointer", fontSize: "0.9rem", padding: "0 0.2rem",
                      transition: "color 0.2s"
                    }}
                      onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseOut={e => e.currentTarget.style.color = "#4b5563"}
                    >✕</button>
                  </div>
                );
              })}

              {configTasks.length < 5 && (
                <div style={{
                  marginTop: "0.75rem", marginBottom: "1.25rem",
                  padding: "1rem", background: "rgba(255,255,255,0.02)",
                  borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)"
                }}>
                  <div style={{ color: "#6b7280", fontSize: "0.68rem", letterSpacing: "0.2em", marginBottom: "0.6rem" }}>
                    NEUE ETAGE
                  </div>
                  <input
                    value={newTask.title}
                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                    placeholder="Aufgabe eingeben..."
                    style={{
                      width: "100%", padding: "0.6rem 0.8rem", marginBottom: "0.6rem",
                      background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "6px", color: "#e2e8f0", fontSize: "0.82rem",
                      fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box"
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
                    {Object.entries(CATEGORIES).map(([cat, { color, label, icon }]) => (
                      <button key={cat} onClick={() => setNewTask(p => ({ ...p, category: cat }))} style={{
                        flex: 1, padding: "0.45rem 0.2rem", borderRadius: "6px", cursor: "pointer",
                        background: newTask.category === cat ? `${color}22` : "transparent",
                        border: `1px solid ${newTask.category === cat ? `${color}60` : "rgba(255,255,255,0.08)"}`,
                        color: newTask.category === cat ? color : "#4b5563",
                        fontSize: "0.62rem", fontWeight: 700, fontFamily: "'Courier New', monospace",
                        transition: "all 0.15s"
                      }}>
                         <div>{CATEGORIES[cat]?.iconSrc ? <img src={CATEGORIES[cat].iconSrc} alt={label} style={{ width: 14, height: 14, objectFit: "contain", filter: newTask.category === cat ? `drop-shadow(0 0 4px ${color}88)` : "brightness(0.6)" }} /> : icon}</div>
                        <div>{label}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={addTask} style={{
                    width: "100%", padding: "0.6rem",
                    background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)",
                    borderRadius: "7px", color: "#22d3ee", cursor: "pointer",
                    fontSize: "0.78rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.1em"
                  }}>+ ETAGE HINZUFÜGEN</button>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setScreen("main")} style={{
                  flex: 1, padding: "0.7rem", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                  color: "#6b7280", cursor: "pointer", fontSize: "0.78rem",
                  fontFamily: "'Courier New', monospace"
                }}>ABBRECHEN</button>
                <button onClick={handleSaveConfig} style={{
                  flex: 2, padding: "0.7rem",
                  background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.4)",
                  borderRadius: "8px", color: "#22d3ee", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.82rem", fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.08em"
                }}>SPEICHERN · {configTasks.length} ETAGEN</button>
              </div>
            </>
          )}

          {/* ══ ACTIVE RUN SCREEN ══ */}
          {screen === "run" && run && (
            <>
              {/* Timer block */}
              <div style={{
                textAlign: "center", marginBottom: "1.5rem",
                padding: "1.25rem", borderRadius: "14px",
                background: `rgba(4,6,18,0.8)`,
                border: `1px solid ${timerColor}30`,
                boxShadow: `0 0 30px ${timerColor}10`
              }}>
                <div style={{
                  fontSize: "0.6rem", letterSpacing: "0.45em", color: timerColor,
                  opacity: 0.6, marginBottom: "0.4rem"
                }}>
                   {run.type === "dawn" ? "DAWN" : "DUSK"} — COUNTDOWN
                </div>
                <div style={{
                  fontSize: "3.5rem", fontWeight: 900, color: timerColor,
                  letterSpacing: "0.08em", lineHeight: 1,
                  animation: timeLeft > 0 && timeLeft < 60 ? "timer-pulse 1s ease-in-out infinite" : "none",
                  textShadow: `0 0 20px ${timerColor}80`
                }}>
                  {formatTime(timeLeft)}
                </div>

                {/* Timer bar */}
                <div style={{
                  height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px",
                  marginTop: "0.75rem", overflow: "hidden"
                }}>
                  <div style={{
                    width: `${timerPct}%`, height: "100%",
                    background: `linear-gradient(90deg, ${timerColor}80, ${timerColor})`,
                    borderRadius: "3px", transition: "width 1s linear, background 1.5s"
                  }} />
                </div>

                {/* Progress info */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: "0.6rem"
                }}>
                  <div style={{ color: "#4b5563", fontSize: "0.68rem" }}>
                    ETAGE {run.floorsCompleted}/{run.totalFloors}
                  </div>
                  {run.isPerfectPossible && timeLeft > 0 ? (
                    <div style={{
                      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                      background: "linear-gradient(90deg, #fbbf24, #22c55e, #fbbf24)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      animation: "perfect-shimmer 2s linear infinite"
                    }}>
                      ⭐ PERFECT MÖGLICH
                    </div>
                  ) : timeLeft === 0 ? (
                    <div style={{ color: "#ef4444", fontSize: "0.65rem" }}>✗ Perfect Run vorbei</div>
                  ) : null}
                </div>
              </div>

              {/* Dungeon corridor — floors */}
              <div style={{ position: "relative" }}>
                {/* Vertical connector line */}
                <div style={{
                  position: "absolute", left: "22px", top: "12px",
                  bottom: "12px", width: "2px",
                  background: "linear-gradient(180deg, rgba(34,211,238,0.3), rgba(34,211,238,0.05))",
                  zIndex: 0
                }} />

                {run.floors.map((floor, i) => {
                  const isActive = !floor.completed && (i === 0 || run.floors[i - 1]?.completed);
                  const isLocked = !floor.completed && !isActive;
                  const cat = CATEGORIES[floor.category] || CATEGORIES.str;

                  return (
                    <div key={floor.id} style={{
                      display: "flex", alignItems: "center", gap: "0.85rem",
                      padding: "0.85rem 0.9rem 0.85rem 0.5rem",
                      marginBottom: "0.5rem", borderRadius: "12px",
                      background: floor.completed
                        ? "rgba(34,197,94,0.07)"
                        : isActive
                          ? "rgba(34,211,238,0.06)"
                          : "rgba(255,255,255,0.018)",
                      border: `1px solid ${floor.completed
                        ? "rgba(34,197,94,0.35)"
                        : isActive
                          ? "rgba(34,211,238,0.4)"
                          : "rgba(255,255,255,0.05)"}`,
                      opacity: isLocked ? 0.45 : 1,
                      transition: "all 0.35s ease",
                      animation: isActive ? "active-floor-pulse 2s ease-in-out infinite" : "none",
                      position: "relative", zIndex: 1
                    }}>
                      {/* Floor number circle */}
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: floor.completed
                          ? "rgba(34,197,94,0.2)"
                          : isActive
                            ? "rgba(34,211,238,0.15)"
                            : "rgba(255,255,255,0.04)",
                        border: `2px solid ${floor.completed ? "#22c55e" : isActive ? "#22d3ee" : "#1f2937"}`,
                        fontSize: floor.completed ? "0.9rem" : "0.8rem",
                        color: floor.completed ? "#22c55e" : isActive ? "#22d3ee" : "#374151",
                        fontWeight: 900,
                        boxShadow: isActive ? "0 0 12px rgba(34,211,238,0.25)" : "none",
                        transition: "all 0.3s"
                      }}>
                        {floor.completed ? "✓" : isLocked ? "🔒" : i + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: floor.completed ? "#6ee7b7" : isActive ? "#e2e8f0" : "#374151",
                          fontSize: "0.84rem", fontWeight: isActive ? 700 : 500,
                          textDecoration: floor.completed ? "line-through" : "none",
                          textDecorationColor: "rgba(34,197,94,0.5)"
                        }}>
                          Etage {i + 1}: {floor.title}
                        </div>
                        <div style={{
                          color: floor.completed ? "#22c55e" : cat.color,
                          fontSize: "0.62rem", marginTop: "0.12rem", opacity: 0.7
                        }}>
                           <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><img src={cat.iconSrc} alt={cat.label} style={{ width: 10, height: 10, objectFit: "contain" }} /> {cat.label}</span>
                          {floor.completed && floor.completedAt && (
                            <span style={{ color: "#374151", marginLeft: "0.5rem" }}>
                              · {new Date(floor.completedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {isActive && (
                        <button onClick={() => handleFloorComplete(floor.id)} style={{
                          padding: "0.5rem 0.85rem", flexShrink: 0,
                          background: "rgba(34,211,238,0.15)",
                          border: "1px solid rgba(34,211,238,0.5)", borderRadius: "7px",
                          color: "#22d3ee", cursor: "pointer", fontWeight: 900, fontSize: "0.75rem",
                          fontFamily: "'Courier New', monospace", letterSpacing: "0.05em",
                          transition: "all 0.15s",
                          boxShadow: "0 0 10px rgba(34,211,238,0.2)"
                        }}
                          onMouseOver={e => { e.currentTarget.style.background = "rgba(34,211,238,0.28)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(34,211,238,0.35)"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "rgba(34,211,238,0.15)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(34,211,238,0.2)"; }}
                        >
                          DONE ✓
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
