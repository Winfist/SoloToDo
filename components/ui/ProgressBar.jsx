import React from "react";

export default function ProgressBar({
  value = 0,       // 0–100
  max = 100,
  color = "var(--theme-primary)",
  height = 6,
  glow = true,
  label,
  animated = true,
  style,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{
        width: "100%",
        height,
        borderRadius: "var(--radius-full)",
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "var(--radius-full)",
          boxShadow: glow ? `0 0 8px ${color}88` : undefined,
          transition: animated ? `width var(--duration-slow) var(--ease-out)` : undefined,
        }}
      />
    </div>
  );
}
