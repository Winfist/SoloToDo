// NeuralBootSequence.jsx — AAA-game style boot sequence on app start
// BUG FIX #9: Uses localStorage with daily key so boot shows once per day,
// not once per tab (sessionStorage) which caused repeats on new tabs.
import React, { useState, useEffect, useRef, useMemo } from "react";

const BOOT_KEY_PREFIX = "sl_boot_shown_";

export default function NeuralBootSequence({ hunterName = "HUNTER", rankName = "E", level = 1, onComplete, disabled = false }) {
  const [phase, setPhase] = useState(0); // 0=idle, 1-6=boot phases, 7=done
  const [visible, setVisible] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [hudItems, setHudItems] = useState([]);
  const [glitchFlash, setGlitchFlash] = useState(false);
  const timerRefs = useRef([]);

  // Already shown today? Uses localStorage with daily key for cross-tab persistence
  const alreadyShown = useMemo(() => {
    try {
      const todayKey = BOOT_KEY_PREFIX + new Date().toISOString().slice(0, 10);
      return localStorage.getItem(todayKey) === "true";
    }
    catch { return false; }
  }, []);

  // Clear all timeouts
  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };
  const delay = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timerRefs.current.push(t);
    return t;
  };

  useEffect(() => {
    if (disabled || alreadyShown) {
      onComplete?.();
      return;
    }

    try {
      const todayKey = BOOT_KEY_PREFIX + new Date().toISOString().slice(0, 10);
      localStorage.setItem(todayKey, "true");
      // Clean up old boot keys (older than today)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BOOT_KEY_PREFIX) && key !== todayKey) {
          localStorage.removeItem(key);
        }
      }
    }
    catch { }

    setVisible(true);
    setPhase(1);

    // ── Phase 1: Scan Lines (0-400ms)
    delay(() => {
      setPhase(2);
      // Animate scan progress
      let prog = 0;
      const scanInterval = setInterval(() => {
        prog += 3;
        setScanProgress(Math.min(prog, 100));
        if (prog >= 100) clearInterval(scanInterval);
      }, 12);
      timerRefs.current.push(scanInterval);
    }, 100);

    // ── Phase 2: System Initializing typewriter (400-1000ms)
    const initText = "NEURAL INTERFACE INITIALIZING...";
    let charIdx = 0;
    delay(() => {
      setPhase(3);
      const typeInterval = setInterval(() => {
        charIdx++;
        setTypeText(initText.slice(0, charIdx));
        if (charIdx >= initText.length) clearInterval(typeInterval);
      }, 28);
      timerRefs.current.push(typeInterval);
    }, 500);

    // ── Phase 3: Glitch flash (1000ms)
    delay(() => {
      setGlitchFlash(true);
      delay(() => setGlitchFlash(false), 120);
    }, 1100);

    // ── Phase 4: HUD Assembly (1200-1800ms)
    const hudData = [
      { label: "HUNTER ID", value: (hunterName || "UNKNOWN").toUpperCase(), color: "#22d3ee", delay: 0 },
      { label: "RANK", value: rankName, color: "#a78bfa", delay: 120 },
      { label: "LEVEL", value: String(level), color: "#34d399", delay: 240 },
      { label: "STATUS", value: "ONLINE", color: "#22c55e", delay: 360 },
    ];
    delay(() => {
      setPhase(4);
      hudData.forEach((item, i) => {
        delay(() => {
          setHudItems(prev => [...prev, item]);
        }, item.delay);
      });
    }, 1200);

    // ── Phase 5: "SYSTEM ONLINE" + Glow (1800ms)
    delay(() => {
      setPhase(5);
    }, 1800);

    // ── Phase 6: Fade out (2200ms)
    delay(() => {
      setPhase(6);
    }, 2300);

    // ── Complete (2800ms)
    delay(() => {
      setVisible(false);
      setPhase(7);
      onComplete?.();
    }, 2900);

    return clearTimers;
  }, [disabled, alreadyShown]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#020208",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: phase === 6 ? 0 : 1,
        transition: "opacity 0.6s ease-out",
        overflow: "hidden",
      }}
    >
      {/* ── Scan Lines Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          pointerEvents: "none",
          opacity: phase >= 2 ? 0.6 : 0,
          transition: "opacity 0.3s",
        }}
      />

      {/* ── Moving Scan Bar ── */}
      {phase >= 1 && phase < 5 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(34,211,238,0.8), rgba(34,211,238,0.6), transparent)",
            boxShadow: "0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.15)",
            animation: "bootScanBar 1.5s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Glitch Flash ── */}
      {glitchFlash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(34,211,238,0.08)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Corner HUD brackets ── */}
      {phase >= 2 && (
        <>
          <div style={{ position: "absolute", top: 20, left: 20, width: 24, height: 24, borderTop: "2px solid rgba(34,211,238,0.5)", borderLeft: "2px solid rgba(34,211,238,0.5)", animation: "bootCornerIn 0.4s ease-out both", opacity: phase >= 6 ? 0 : 1, transition: "opacity 0.4s" }} />
          <div style={{ position: "absolute", top: 20, right: 20, width: 24, height: 24, borderTop: "2px solid rgba(34,211,238,0.5)", borderRight: "2px solid rgba(34,211,238,0.5)", animation: "bootCornerIn 0.4s ease-out 0.1s both", opacity: phase >= 6 ? 0 : 1, transition: "opacity 0.4s" }} />
          <div style={{ position: "absolute", bottom: 20, left: 20, width: 24, height: 24, borderBottom: "2px solid rgba(34,211,238,0.5)", borderLeft: "2px solid rgba(34,211,238,0.5)", animation: "bootCornerIn 0.4s ease-out 0.2s both", opacity: phase >= 6 ? 0 : 1, transition: "opacity 0.4s" }} />
          <div style={{ position: "absolute", bottom: 20, right: 20, width: 24, height: 24, borderBottom: "2px solid rgba(34,211,238,0.5)", borderRight: "2px solid rgba(34,211,238,0.5)", animation: "bootCornerIn 0.4s ease-out 0.3s both", opacity: phase >= 6 ? 0 : 1, transition: "opacity 0.4s" }} />
        </>
      )}

      {/* ── Central Content ── */}
      <div style={{ position: "relative", width: "100%", maxWidth: 380, padding: "0 24px", textAlign: "center" }}>

        {/* System Logo / Hex Symbol */}
        {phase >= 2 && (
          <div
            style={{
              marginBottom: 24,
              animation: "bootLogoIn 0.5s ease-out both",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.15))",
                border: "1px solid rgba(34,211,238,0.4)",
                animation: "bootHexPulse 1.5s ease-in-out infinite",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#22d3ee",
                  fontFamily: "'Cinzel', serif",
                  textShadow: "0 0 20px rgba(34,211,238,0.6)",
                }}
              >
                SL
              </span>
            </div>
          </div>
        )}

        {/* Scan Progress Bar */}
        {phase >= 2 && phase < 5 && (
          <div style={{ marginBottom: 20, animation: "bootFadeIn 0.3s ease-out both" }}>
            <div
              style={{
                height: 2,
                background: "rgba(34,211,238,0.1)",
                borderRadius: 1,
                overflow: "hidden",
                width: "80%",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${scanProgress}%`,
                  background: "linear-gradient(90deg, #22d3ee, #6366f1)",
                  borderRadius: 1,
                  transition: "width 0.05s linear",
                  boxShadow: "0 0 8px rgba(34,211,238,0.5)",
                }}
              />
            </div>
          </div>
        )}

        {/* Typewriter Text */}
        {phase >= 3 && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: "#22d3ee",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              marginBottom: 24,
              minHeight: 16,
              animation: "bootFadeIn 0.3s ease-out both",
              textShadow: "0 0 12px rgba(34,211,238,0.4)",
            }}
          >
            {phase < 5 ? (
              <>
                {typeText}
                <span style={{ animation: "bootCursor 0.8s step-end infinite" }}>█</span>
              </>
            ) : (
              <span style={{ color: "#22c55e", letterSpacing: 6, animation: "bootSystemOnline 0.4s ease-out both" }}>
                ▸ SYSTEM ONLINE
              </span>
            )}
          </div>
        )}

        {/* HUD Assembly */}
        {phase >= 4 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              maxWidth: 280,
              margin: "0 auto",
            }}
          >
            {hudItems.map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.color}33`,
                  borderRadius: 8,
                  textAlign: "left",
                  animation: `bootHudItemIn 0.35s ease-out ${i * 0.08}s both`,
                }}
              >
                <div
                  style={{
                    fontSize: 7,
                    letterSpacing: 2,
                    color: `${item.color}88`,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: item.color,
                    fontFamily: item.label === "HUNTER ID" ? "'Cinzel', serif" : "'JetBrains Mono', monospace",
                    letterSpacing: item.label === "HUNTER ID" ? 1 : 2,
                    textShadow: `0 0 10px ${item.color}44`,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Status Dots */}
        {phase >= 3 && phase < 6 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginTop: 28,
              animation: "bootFadeIn 0.4s ease-out 0.3s both",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: scanProgress > (i + 1) * 30 ? "#22d3ee" : "rgba(34,211,238,0.2)",
                  boxShadow: scanProgress > (i + 1) * 30 ? "0 0 6px rgba(34,211,238,0.5)" : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Ambient Glow ── */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          width: "60%",
          height: "30%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(34,211,238,0.04), transparent 70%)",
          pointerEvents: "none",
          animation: "bootGlow 2s ease-in-out infinite",
        }}
      />

      {/* ── Bottom Build Info ── */}
      {phase >= 3 && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            animation: "bootFadeIn 0.5s ease-out 0.5s both",
          }}
        >
          <div style={{ fontSize: 8, color: "rgba(34,211,238,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3 }}>
            ABYSSAL SOVEREIGN OS v5.0 · BUILD {new Date().toISOString().slice(0, 10).replace(/-/g, "")}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bootScanBar {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes bootCornerIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bootLogoIn {
          0% { opacity: 0; transform: scale(0.6) rotate(-10deg); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
        }
        @keyframes bootHexPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(34,211,238,0.2); }
          50% { box-shadow: 0 0 28px rgba(34,211,238,0.4), 0 0 56px rgba(34,211,238,0.1); }
        }
        @keyframes bootFadeIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bootCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bootSystemOnline {
          0% { opacity: 0; transform: scale(0.8); filter: blur(4px); }
          50% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes bootHudItemIn {
          0% { opacity: 0; transform: translateX(-12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes bootGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
