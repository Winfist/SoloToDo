import React from "react";

export default function Chip({
  children,
  color = "var(--theme-primary)",
  size = "sm",
  dot = false,
  onClick,
  style,
}) {
  const small = size === "sm";
  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: small ? "2px var(--space-2)" : "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-full)",
        fontSize: small ? "var(--text-xs)" : "var(--text-sm)",
        fontWeight: "var(--font-semibold)",
        letterSpacing: "0.04em",
        background: `${color}18`,
        color,
        border: `1px solid ${color}33`,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} aria-hidden="true" />}
      {children}
    </span>
  );
}
