import React from "react";

const BASE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  minHeight: "var(--min-touch)",
  padding: "0 var(--space-4)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--text-base)",
  fontWeight: "var(--font-semibold)",
  fontFamily: "var(--font-sans)",
  letterSpacing: "0.02em",
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "all var(--duration-fast) var(--ease-out)",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  position: "relative",
  overflow: "hidden",
};

const VARIANTS = {
  primary: {
    background: "var(--theme-primary)",
    color: "#000",
    borderColor: "var(--theme-primary)",
    boxShadow: "0 0 16px var(--theme-glow)",
  },
  ghost: {
    background: "var(--theme-primary-12)",
    color: "var(--theme-accent)",
    borderColor: "var(--theme-primary-22)",
  },
  danger: {
    background: "rgba(220,38,38,0.15)",
    color: "#fca5a5",
    borderColor: "rgba(220,38,38,0.3)",
  },
  monarch: {
    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))",
    color: "#fff",
    borderColor: "var(--theme-primary-44)",
    boxShadow: "0 0 24px var(--theme-glow), var(--shadow-inset)",
  },
  subtle: {
    background: "transparent",
    color: "#64748b",
    borderColor: "transparent",
  },
};

const SIZES = {
  sm: { minHeight: "32px", padding: "0 var(--space-3)", fontSize: "var(--text-sm)" },
  md: {},
  lg: { minHeight: "52px", padding: "0 var(--space-8)", fontSize: "var(--text-md)" },
  icon: { minHeight: "var(--min-touch)", width: "var(--min-touch)", padding: "0", borderRadius: "var(--radius-lg)" },
};

export default function Button({
  variant = "ghost",
  size = "md",
  disabled = false,
  loading = false,
  children,
  style,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}) {
  const variantStyle = VARIANTS[variant] || VARIANTS.ghost;
  const sizeStyle = SIZES[size] || {};

  const disabledStyle = disabled || loading
    ? { opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }
    : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      style={{ ...BASE, ...variantStyle, ...sizeStyle, ...disabledStyle, ...style }}
      {...props}
    >
      {loading ? (
        <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
