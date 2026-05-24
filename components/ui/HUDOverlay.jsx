// HUDOverlay.jsx — minimal corner frame
// The old sci-fi telemetry (SL.OS label, live clock, FPS counter, RNK/LV
// readout, scan line, XP micro-bar) was removed: it read as gimmicky and
// added no real information. All that remains is a pair of faint corner
// ticks for a subtle "framed" feel.
import React from "react";

export default function HUDOverlay({ theme, disabled = false }) {
  if (disabled) return null;

  const c = theme?.primary || "#22d3ee";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        opacity: 0.18,
        contain: "layout style paint",
      }}
    >
      {/* Bottom-left tick */}
      <div style={{ position: "absolute", bottom: 70, left: 8, width: 16, height: 16, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      {/* Bottom-right tick */}
      <div style={{ position: "absolute", bottom: 70, right: 8, width: 16, height: 16, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
    </div>
  );
}
