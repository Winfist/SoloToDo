// LetterboxOverlay.jsx — Cinematic letterbox bars for epic moments
// Trigger via: window.dispatchEvent(new CustomEvent("letterbox", { detail: { duration, text, color } }))
import React, { useRef, useEffect, useState, useCallback } from "react";

export default function LetterboxOverlay({ disabled = false }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("");
  const [color, setColor] = useState("#fff");
  const [phase, setPhase] = useState("idle"); // idle → entering → holding → exiting → idle
  const timerRef = useRef(null);

  const activate = useCallback(({ duration = 2500, text: t = "", color: c = "#fff" } = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setText(t);
    setColor(c);
    setActive(true);
    setPhase("entering");

    // After bars are in → hold
    timerRef.current = setTimeout(() => {
      setPhase("holding");

      // After hold duration → exit
      timerRef.current = setTimeout(() => {
        setPhase("exiting");

        // After exit animation → idle
        timerRef.current = setTimeout(() => {
          setActive(false);
          setPhase("idle");
          setText("");
        }, 600);
      }, Math.max(duration - 1200, 800));
    }, 600);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handler = (e) => activate(e.detail || {});
    window.addEventListener("letterbox", handler);
    return () => {
      window.removeEventListener("letterbox", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [disabled, activate]);

  if (disabled || !active) return null;

  const isEntering = phase === "entering" || phase === "holding";
  const isExiting = phase === "exiting";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        pointerEvents: "none",
        perspective: "1000px",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "12vh",
          background: "linear-gradient(180deg, #000 80%, rgba(0,0,0,0.6) 100%)",
          transform: isEntering ? "translateY(0)" : isExiting ? "translateY(-100%)" : "translateY(-100%)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Subtle scan line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent 10%, ${color}44 50%, transparent 90%)`,
            boxShadow: `0 0 12px ${color}33`,
          }}
        />
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "12vh",
          background: "linear-gradient(0deg, #000 80%, rgba(0,0,0,0.6) 100%)",
          transform: isEntering ? "translateY(0)" : isExiting ? "translateY(100%)" : "translateY(100%)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Subtle scan line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent 10%, ${color}44 50%, transparent 90%)`,
            boxShadow: `0 0 12px ${color}33`,
          }}
        />
      </div>

      {/* Center text */}
      {text && phase === "holding" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            animation: "letterboxTextIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 12,
              color: `${color}88`,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              textTransform: "uppercase",
              textShadow: `0 0 30px ${color}44, 0 0 60px ${color}22`,
              animation: "letterboxTextGlow 2s ease-in-out infinite",
            }}
          >
            {text}
          </div>
          {/* Decorative line below */}
          <div
            style={{
              width: 60,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
              margin: "12px auto 0",
              animation: "letterboxLineExpand 0.6s ease-out 0.2s both",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes letterboxTextIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); filter: blur(8px); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        @keyframes letterboxTextGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes letterboxLineExpand {
          0% { width: 0; opacity: 0; }
          100% { width: 80px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Trigger letterbox from anywhere in the app
 * @param {string} text - Optional text to show (e.g. "LEVEL UP")
 * @param {number} duration - Total duration in ms (default 2500)
 * @param {string} color - Accent color (default "#fff")
 */
export function triggerLetterbox(text = "", duration = 2500, color = "#fff") {
  window.dispatchEvent(new CustomEvent("letterbox", {
    detail: { text, duration, color }
  }));
}
