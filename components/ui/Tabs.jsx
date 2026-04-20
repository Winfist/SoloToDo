import React from "react";

export function Tabs({ tabs, active, onChange, style }) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-1)",
        background: "var(--theme-surface)",
        border: "1px solid var(--theme-primary-12)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-1)",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontSize: "var(--text-sm)",
              fontWeight: isActive ? "var(--font-bold)" : "var(--font-normal)",
              color: isActive ? "var(--theme-accent)" : "#475569",
              background: isActive ? "var(--theme-primary-18)" : "transparent",
              cursor: "pointer",
              transition: "all var(--duration-fast) var(--ease-out)",
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-1)",
              whiteSpace: "nowrap",
              minHeight: "var(--min-touch)",
            }}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && (
              <span style={{ background: "var(--theme-primary)", color: "#000", borderRadius: "var(--radius-full)", padding: "0 5px", fontSize: 10, fontWeight: 900, minWidth: 16, textAlign: "center" }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
