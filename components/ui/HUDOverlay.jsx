// HUDOverlay.jsx — Persistent holographic HUD elements
// Adds subtle corner brackets, scan lines, and data readouts
import React, { useState, useEffect, useRef } from "react";

export default function HUDOverlay({ rank = "E", level = 1, streak = 0, xpPercent = 0, theme, disabled = false }) {
  const [clock, setClock] = useState("");
  const [fps, setFps] = useState(60);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Clock
  useEffect(() => {
    if (disabled) return;
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [disabled]);

  // FPS counter (update every 30 frames)
  useEffect(() => {
    if (disabled) return;
    let running = true;
    let frameCount = 0;
    let lastCheck = performance.now();

    function tick() {
      if (!running) return;
      frameCount++;
      const now = performance.now();
      if (now - lastCheck >= 500) {
        setFps(Math.round(frameCount / ((now - lastCheck) / 1000)));
        frameCount = 0;
        lastCheck = now;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [disabled]);

  if (disabled) return null;

  const accentColor = theme?.primary || "#22d3ee";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        opacity: 0.45,
        mixBlendMode: "screen",
      }}
    >
      {/* ── Corner Brackets ── */}
      {/* Top-Left */}
      <div style={{ position: "absolute", top: 8, left: 8 }}>
        <div style={{ width: 20, height: 20, borderTop: `1.5px solid ${accentColor}`, borderLeft: `1.5px solid ${accentColor}`, opacity: 0.6 }} />
        <div style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", color: accentColor, marginTop: 4, letterSpacing: 1.5, opacity: 0.7 }}>
          SL.OS
        </div>
      </div>

      {/* Top-Right */}
      <div style={{ position: "absolute", top: 8, right: 8, textAlign: "right" }}>
        <div style={{ width: 20, height: 20, borderTop: `1.5px solid ${accentColor}`, borderRight: `1.5px solid ${accentColor}`, opacity: 0.6, marginLeft: "auto" }} />
        <div style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", color: accentColor, marginTop: 4, letterSpacing: 1.5, opacity: 0.7 }}>
          {clock}
        </div>
      </div>

      {/* Bottom-Left */}
      <div style={{ position: "absolute", bottom: 72, left: 8 }}>
        <div style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", color: accentColor, marginBottom: 4, letterSpacing: 1.5, opacity: 0.5 }}>
          RNK:{rank} · LV:{level}
        </div>
        <div style={{ width: 20, height: 20, borderBottom: `1.5px solid ${accentColor}`, borderLeft: `1.5px solid ${accentColor}`, opacity: 0.6 }} />
      </div>

      {/* Bottom-Right */}
      <div style={{ position: "absolute", bottom: 72, right: 8, textAlign: "right" }}>
        <div style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", color: fps < 30 ? "#ef4444" : accentColor, marginBottom: 4, letterSpacing: 1.5, opacity: 0.5 }}>
          {fps}FPS
        </div>
        <div style={{ width: 20, height: 20, borderBottom: `1.5px solid ${accentColor}`, borderRight: `1.5px solid ${accentColor}`, opacity: 0.6, marginLeft: "auto" }} />
      </div>

      {/* ── Subtle Scan Line ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)`,
          animation: "hudScanLine 8s linear infinite",
        }}
      />

      {/* ── XP Progress micro-bar (bottom center) ── */}
      <div style={{
        position: "absolute",
        bottom: 68,
        left: "50%",
        transform: "translateX(-50%)",
        width: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}>
        <div style={{
          width: "100%",
          height: 1.5,
          background: `${accentColor}15`,
          borderRadius: 1,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${xpPercent}%`,
            height: "100%",
            background: accentColor,
            borderRadius: 1,
            transition: "width 1s ease",
            boxShadow: `0 0 4px ${accentColor}44`,
          }} />
        </div>
        <div style={{ fontSize: 6, fontFamily: "'JetBrains Mono',monospace", color: accentColor, opacity: 0.5, letterSpacing: 2 }}>
          {Math.round(xpPercent)}%
        </div>
      </div>

      <style>{`
        @keyframes hudScanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
