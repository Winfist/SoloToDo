import React, { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════
// SHADOW REGRESSION CINEMATIC
// Shown when the player misses days and enters Shadow Regression
// ═══════════════════════════════════════════════════════════════

export default function ShadowRegressionCinematic({ state, onClose, theme }) {
  const [phase, setPhase] = useState("enter"); // "enter" | "main" | "exit"
  const regression = state?.shadowRegression || {};
  const previousStreak = regression.previousStreak || 0;
  const restoredStreak = Math.floor(previousStreak * 0.5);
  const completed = regression.questsCompleted || 0;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("main"), 600);
    return () => clearTimeout(t1);
  }, []);

  const steps = [
    { label: "Schattenrückforderung I", sub: "Körperliche Buße", done: completed >= 1 },
    { label: "Schattenrückforderung II", sub: "Mentale Prüfung", done: completed >= 2 },
    { label: "Schattenrückforderung III", sub: "Die Rückkehr", done: completed >= 3 },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "radial-gradient(ellipse at center, #1a0008 0%, #070007 60%, #000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: phase === "enter" ? 0 : 1, transition: "opacity 0.6s ease",
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Crimson particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: "-10px",
            width: `${1 + Math.random() * 2}px`,
            height: `${40 + Math.random() * 80}px`,
            background: `rgba(${180 + Math.random() * 75}, 0, ${Math.random() * 30}, ${0.3 + Math.random() * 0.5})`,
            borderRadius: "2px",
            animation: `fall ${3 + Math.random() * 4}s linear ${Math.random() * 3}s infinite`,
            transform: `translateX(${(Math.random() - 0.5) * 30}px)`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes glitch {
          0%, 100% { text-shadow: 2px 0 #dc2626, -2px 0 #7c3aed; }
          25% { text-shadow: -2px 0 #dc2626, 2px 0 #7c3aed; transform: translateX(2px); }
          50% { text-shadow: 2px 0 #7c3aed, -2px 0 #dc2626; transform: translateX(-1px); }
          75% { text-shadow: -1px 0 #dc2626, 1px 0 #7c3aed; transform: translateX(1px); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: "0.7rem", letterSpacing: "0.4em", color: "#dc2626",
          textTransform: "uppercase", marginBottom: "0.5rem", opacity: 0.8
        }}>
          SYSTEM WARNUNG
        </div>
        <div style={{
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 900, color: "#ef4444",
          letterSpacing: "0.1em", textTransform: "uppercase",
          animation: "glitch 2.5s ease-in-out infinite"
        }}>
          SHADOW REGRESSION
        </div>
        <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.5rem", letterSpacing: "0.2em" }}>
          AKTIVIERT
        </div>
      </div>

      {/* Streak info */}
      <div style={{
        background: "rgba(30, 0, 10, 0.8)", border: "1px solid rgba(220, 38, 38, 0.4)",
        borderRadius: "12px", padding: "1.25rem 2rem", marginBottom: "2rem",
        textAlign: "center", position: "relative", zIndex: 1
      }}>
        <div style={{ color: "#6b7280", fontSize: "0.75rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
          VERLORENER STREAK
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <div>
            <div style={{ color: "#4b5563", fontSize: "0.7rem" }}>WAR</div>
            <div style={{ color: "#dc2626", fontSize: "2rem", fontWeight: 900 }}>
              🔥{previousStreak}
            </div>
          </div>
          <div style={{ color: "#4b5563", fontSize: "1.5rem" }}>→</div>
          <div>
            <div style={{ color: "#4b5563", fontSize: "0.7rem" }}>WIEDERHERGESTELLT</div>
            <div style={{ color: "#a855f7", fontSize: "2rem", fontWeight: 900 }}>
              🔥{restoredStreak}
            </div>
          </div>
        </div>
        <div style={{ color: "#6b7280", fontSize: "0.7rem", marginTop: "0.5rem" }}>
          Schließe 3 Redemption-Quests ab um {restoredStreak} Tage wiederzuerlangen
        </div>
      </div>

      {/* Redemption Steps */}
      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1, marginBottom: "2rem" }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.85rem 1.25rem", marginBottom: "0.5rem",
            background: step.done ? "rgba(167, 20, 40, 0.25)" : "rgba(20, 0, 10, 0.6)",
            border: `1px solid ${step.done ? "rgba(220, 38, 38, 0.6)" : "rgba(100, 0, 30, 0.4)"}`,
            borderRadius: "8px", transition: "all 0.3s",
            animation: step.done ? "pulse-red 1.5s ease-in-out 2" : "none"
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: step.done ? "#dc2626" : "rgba(100, 0, 30, 0.5)",
              border: `2px solid ${step.done ? "#ef4444" : "#6b7280"}`,
              fontSize: "0.8rem", fontWeight: 700, color: step.done ? "#fff" : "#6b7280"
            }}>
              {step.done ? "✓" : i + 1}
            </div>
            <div>
              <div style={{ color: step.done ? "#f87171" : "#9ca3af", fontSize: "0.85rem", fontWeight: 700 }}>
                {step.label}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lore text */}
      <div style={{
        color: "#4b5563", fontSize: "0.75rem", textAlign: "center", maxWidth: "320px",
        lineHeight: 1.6, position: "relative", zIndex: 1, marginBottom: "2rem",
        fontStyle: "italic"
      }}>
        "Der Schatten vergisst nicht. Der Schatten vergibt nicht.<br />
        Aber der Schatten bietet dir eine letzte Chance."
      </div>

      {/* Close button */}
      <button onClick={onClose} style={{
        background: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.5)",
        color: "#ef4444", padding: "0.6rem 2rem", borderRadius: "6px",
        cursor: "pointer", fontSize: "0.8rem", letterSpacing: "0.2em",
        textTransform: "uppercase", position: "relative", zIndex: 1,
        transition: "all 0.2s"
      }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(220, 38, 38, 0.3)"}
        onMouseOut={e => e.currentTarget.style.background = "rgba(220, 38, 38, 0.15)"}
      >
        VERSTANDEN — ZUR MISSION
      </button>
    </div>
  );
}
