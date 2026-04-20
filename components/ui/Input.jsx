import React from "react";

export default function Input({
  label,
  error,
  prefix,
  suffix,
  style,
  containerStyle,
  ...props
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", ...containerStyle }}>
      {label && (
        <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "#94a3b8" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && (
          <span style={{ position: "absolute", left: "var(--space-3)", color: "#475569", pointerEvents: "none", fontSize: "var(--text-base)" }} aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          style={{
            width: "100%",
            minHeight: "var(--min-touch)",
            padding: `0 ${suffix ? "var(--space-8)" : "var(--space-3)"} 0 ${prefix ? "var(--space-8)" : "var(--space-3)"}`,
            background: "var(--theme-surface)",
            border: `1px solid ${error ? "rgba(220,38,38,0.5)" : "var(--theme-primary-22)"}`,
            borderRadius: "var(--radius-md)",
            color: "#e2e8f0",
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--theme-primary)";
            e.target.style.boxShadow = "0 0 0 2px var(--theme-primary-22)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "rgba(220,38,38,0.5)" : "var(--theme-primary-22)";
            e.target.style.boxShadow = "";
          }}
          {...props}
        />
        {suffix && (
          <span style={{ position: "absolute", right: "var(--space-3)", color: "#475569", pointerEvents: "none" }} aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {error && <span role="alert" style={{ fontSize: "var(--text-xs)", color: "#fca5a5" }}>{error}</span>}
    </div>
  );
}
