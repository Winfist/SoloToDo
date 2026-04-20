import React from "react";
import ProgressBar from "./ProgressBar.jsx";

// Labeled stat bar: [Label] [value/max] [bar]
export default function StatBar({
  label,
  value,
  max,
  color = "var(--theme-primary)",
  icon,
  height = 8,
  showValues = true,
  style,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "#94a3b8", fontWeight: "var(--font-medium)" }}>
          {icon && <span aria-hidden="true">{icon}</span>}
          {label}
        </span>
        {showValues && (
          <span className="tabular-nums" style={{ fontSize: "var(--text-sm)", color, fontWeight: "var(--font-bold)", fontFamily: "var(--font-mono)" }}>
            {value.toLocaleString()}<span style={{ color: "#475569" }}>/{max.toLocaleString()}</span>
          </span>
        )}
      </div>
      <ProgressBar value={value} max={max} color={color} height={height} />
    </div>
  );
}
