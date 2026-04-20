// MagneticCursor.jsx — Premium cursor glow that follows mouse movement
// Global radial gradient that tracks cursor + buttons glow on proximity
import React, { useRef, useEffect, useCallback, useState } from "react";

export default function MagneticCursor({ disabled = false, color = "#22d3ee", intensity = 0.12 }) {
  const glowRef = useRef(null);
  const posRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef(null);
  const [isTouch, setIsTouch] = useState(false);

  // Detect touch device — disable on mobile
  useEffect(() => {
    const checkTouch = () => setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  const updateGlow = useCallback(() => {
    if (!glowRef.current) return;
    const { x, y } = posRef.current;
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, transparent 40%)`;
  }, [color, intensity]);

  useEffect(() => {
    if (disabled || isTouch) return;

    const handleMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateGlow);

      // Proximity glow on interactive elements
      const elements = document.querySelectorAll("[data-magnetic]");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        const maxDist = 150;

        if (dist < maxDist) {
          const factor = 1 - dist / maxDist;
          const glowIntensity = Math.round(factor * 40);
          el.style.boxShadow = `0 0 ${glowIntensity}px ${color}${Math.round(factor * 80).toString(16).padStart(2, '0')}`;
          el.style.borderColor = `${color}${Math.round(factor * 120).toString(16).padStart(2, '0')}`;
          // Subtle magnetic pull
          const pullX = (cx - e.clientX) * factor * 0.04;
          const pullY = (cy - e.clientY) * factor * 0.04;
          el.style.transform = `translate(${pullX}px, ${pullY}px)`;
        } else {
          el.style.boxShadow = "";
          el.style.borderColor = "";
          el.style.transform = "";
        }
      });
    };

    const handleLeave = () => {
      posRef.current = { x: -200, y: -200 };
      if (glowRef.current) {
        glowRef.current.style.background = "transparent";
      }
      // Reset all magnetic elements
      document.querySelectorAll("[data-magnetic]").forEach((el) => {
        el.style.boxShadow = "";
        el.style.borderColor = "";
        el.style.transform = "";
      });
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [disabled, isTouch, updateGlow, color]);

  if (disabled || isTouch) return null;

  return (
    <div
      ref={glowRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        transition: "background 0.15s ease",
      }}
    />
  );
}
