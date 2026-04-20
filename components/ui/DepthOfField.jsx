// DepthOfField.jsx — Tilt-shift blur effect when modals/overlays are open
// Creates a premium "bokeh" feel by blurring background content
// Trigger: Add className "dof-active" to body or a parent element
import React, { useEffect, useState } from "react";

export default function DepthOfField({ active = false, intensity = 6, tintColor = "rgba(0,0,0,0.4)" }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (active) {
      setVisible(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        pointerEvents: active ? "auto" : "none",
        opacity,
        transition: "opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Tilt-shift blur overlay — top band */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "25%",
          background: `linear-gradient(180deg, ${tintColor}, transparent)`,
          backdropFilter: `blur(${intensity}px) saturate(0.7)`,
          WebkitBackdropFilter: `blur(${intensity}px) saturate(0.7)`,
          maskImage: "linear-gradient(180deg, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, black 30%, transparent 100%)",
        }}
      />

      {/* Center clear band — sharp focus area */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          bottom: "20%",
          left: 0,
          right: 0,
          background: `${tintColor.replace(/[\d.]+\)/, "0.15)")}`,
          backdropFilter: "blur(1px) saturate(0.85)",
          WebkitBackdropFilter: "blur(1px) saturate(0.85)",
        }}
      />

      {/* Bottom band */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "25%",
          background: `linear-gradient(0deg, ${tintColor}, transparent)`,
          backdropFilter: `blur(${intensity}px) saturate(0.7)`,
          WebkitBackdropFilter: `blur(${intensity}px) saturate(0.7)`,
          maskImage: "linear-gradient(0deg, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(0deg, black 30%, transparent 100%)",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
