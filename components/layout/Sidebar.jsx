import React from "react";

// Desktop Sidebar — visible at ≥1024px.
// Mirrors BottomNav logic but rendered as a vertical rail.

const SYSTEM_SUB_VIEWS = ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "settings", "more"];
const TRAINING_SUB_VIEWS = ["goals", "calendar"];
const TAB_FEATURE_MAP = {
  training: "training_tab", dungeon: "dungeons", story: "story",
  stats: "stats_view", analytics: "analytics", achievements: "achievements",
  challenges: "challenges", shadows: "shadow_army", equipment: "equipment",
  jobs: "jobs", shop: "shop", goals: "goals", calendar: "calendar", sanctum: "sanctum",
};

export default function Sidebar({
  view,
  navConfig,
  allTabs,
  defaultKeys,
  can,
  onNavigate,
  activeDungeons,
  statPoints,
  theme,
  logo,
}) {
  const configKeys = navConfig?.tabs || defaultKeys;

  const tabs = configKeys
    .map((key) => {
      const def = allTabs.find((t) => t.key === key);
      if (!def) return null;
      const feat = TAB_FEATURE_MAP[key];
      if (feat && !can(feat)) return null;
      let badge = 0;
      if (key === "dungeon") badge = activeDungeons?.length || 0;
      if (key === "stats" && statPoints > 0) badge = statPoints;
      return { ...def, badge };
    })
    .filter(Boolean);

  const isActive = (key) => {
    if (view === key) return true;
    if (key === "system" && SYSTEM_SUB_VIEWS.includes(view) && !configKeys.includes(view)) return true;
    if (key === "training" && TRAINING_SUB_VIEWS.includes(view) && !configKeys.includes(view)) return true;
    return false;
  };

  return (
    <aside
      aria-label="Seitennavigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 72,
        zIndex: "var(--z-nav)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "max(var(--space-4), env(safe-area-inset-top))",
        paddingBottom: "max(var(--space-4), env(safe-area-inset-bottom))",
        background: "linear-gradient(to right, rgba(6,6,16,0.98), rgba(10,10,26,0.85))",
        borderRight: `1px solid ${theme?.primary + "22" || "var(--theme-primary-22)"}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: `4px 0 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Logo */}
      {logo && (
        <div style={{ marginBottom: "var(--space-6)", flexShrink: 0 }}>
          <img src={logo} alt="Arise" style={{ width: 32, height: 32, objectFit: "contain", filter: `drop-shadow(0 0 8px ${theme?.glow || "var(--theme-glow)"})` }} />
        </div>
      )}

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", flex: 1, width: "100%", alignItems: "center" }}>
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          return (
            <button
              key={tab.key}
              data-tutorial={`nav-${tab.key}`}
              onClick={() => onNavigate(tab.key)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              title={tab.label}
              style={{
                position: "relative",
                width: 52,
                height: 52,
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: active ? "var(--theme-primary-18)" : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                cursor: "pointer",
                transition: "background var(--duration-fast) var(--ease-out)",
              }}
            >
              {active && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -1,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    background: theme?.primary || "var(--theme-primary)",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    boxShadow: `0 0 8px ${theme?.glow || "var(--theme-glow)"}`,
                  }}
                />
              )}
              <div style={{ position: "relative" }}>
                <img
                  src={tab.iconSrc}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: tab.isGate ? 28 : 22,
                    height: tab.isGate ? 28 : 22,
                    objectFit: "contain",
                    filter: active
                      ? `brightness(1.35) drop-shadow(0 0 6px ${theme?.glow || "var(--theme-glow)"}) saturate(1.3)`
                      : "brightness(0.55) saturate(0.4)",
                    transition: "filter var(--duration-fast) var(--ease-out)",
                  }}
                />
                {tab.badge > 0 && (
                  <span
                    aria-label={`${tab.badge} ausstehend`}
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -7,
                      minWidth: 14,
                      height: 14,
                      borderRadius: "var(--radius-full)",
                      background: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: "var(--font-black)",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid #000",
                      padding: "0 2px",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 7, fontWeight: "var(--font-black)", letterSpacing: 0.5, color: active ? (theme?.accent || "var(--theme-accent)") : "#475569", fontFamily: "var(--font-sans)" }}>
                {tab.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
