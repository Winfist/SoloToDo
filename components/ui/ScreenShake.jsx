// ScreenShake.jsx — Triggers a screen shake effect via CSS animation
// Used for Boss quest completion, Dungeon clears, and critical moments
// Trigger via: window.dispatchEvent(new CustomEvent("screenShake", { detail: { intensity, duration } }))
import React, { useState, useEffect, useRef, useCallback } from "react";

export default function ScreenShake({ disabled = false, children }) {
  const [shaking, setShaking] = useState(false);
  const [config, setConfig] = useState({ intensity: 4, duration: 400 });
  const timerRef = useRef(null);

  const shake = useCallback(({ intensity = 4, duration = 400 } = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfig({ intensity, duration });
    setShaking(true);
    timerRef.current = setTimeout(() => setShaking(false), duration);
  }, []);

  useEffect(() => {
    if (disabled) return;
    const handler = (e) => shake(e.detail || {});
    window.addEventListener("screenShake", handler);
    return () => {
      window.removeEventListener("screenShake", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [disabled, shake]);

  return (
    <div
      style={{
        animation: shaking ? `screenShake ${config.duration}ms ease-out` : "none",
        "--shake-intensity": `${config.intensity}px`,
      }}
    >
      {children}
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(calc(var(--shake-intensity) * -1), calc(var(--shake-intensity) * 0.5)) rotate(-0.5deg); }
          20% { transform: translate(var(--shake-intensity), calc(var(--shake-intensity) * -0.5)) rotate(0.5deg); }
          30% { transform: translate(calc(var(--shake-intensity) * -0.7), var(--shake-intensity)) rotate(-0.3deg); }
          40% { transform: translate(calc(var(--shake-intensity) * 0.7), calc(var(--shake-intensity) * -0.7)) rotate(0.3deg); }
          50% { transform: translate(calc(var(--shake-intensity) * -0.5), calc(var(--shake-intensity) * 0.3)) rotate(-0.2deg); }
          60% { transform: translate(calc(var(--shake-intensity) * 0.4), calc(var(--shake-intensity) * -0.2)) rotate(0.15deg); }
          70% { transform: translate(calc(var(--shake-intensity) * -0.3), calc(var(--shake-intensity) * 0.15)) rotate(-0.1deg); }
          80% { transform: translate(calc(var(--shake-intensity) * 0.2), calc(var(--shake-intensity) * -0.1)) rotate(0.05deg); }
          90% { transform: translate(calc(var(--shake-intensity) * -0.1), calc(var(--shake-intensity) * 0.05)); }
        }
      `}</style>
    </div>
  );
}

/**
 * Trigger screen shake from anywhere
 * @param {number} intensity - Shake pixel intensity (default 4)
 * @param {number} duration - Duration in ms (default 400)
 */
export function triggerScreenShake(intensity = 4, duration = 400) {
  window.dispatchEvent(new CustomEvent("screenShake", {
    detail: { intensity, duration }
  }));
}
