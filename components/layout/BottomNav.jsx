import React from "react";
import { getPremiumFeatureForRoute } from "../../data/premium.js";
import { useI18n } from "../i18n/I18nProvider.jsx";
const SYSTEM_SUB_VIEWS = ["stats", "shadows", "jobs", "equipment", "achievements", "shop", "analytics", "challenges", "settings", "more"];
const TRAINING_SUB_VIEWS = ["goals", "calendar"];
const TAB_FEATURE_MAP = {
  training: "training_tab", dungeon: "dungeons", story: "story",
  stats: "stats_view", analytics: "analytics", achievements: "achievements",
  challenges: "challenges", shadows: "shadow_army", equipment: "equipment",
  jobs: "jobs", shop: "shop", goals: "goals", calendar: "calendar", sanctum: "sanctum",
};

export default function BottomNav({
  view,
  navConfig,     // state.navbarConfig
  allTabs,       // ALL_NAV_TABS
  defaultKeys,   // DEFAULT_NAV_KEYS
  can,           // feature gate function
  onNavigate,    // (key) => void — calls navigateTo
  activeDungeons,
  statPoints,
  penaltyActive,
  theme,         // legacy JS theme object (still used for colors during migration)
  hidden,        // hide nav (e.g. isCreatingEntry)
  premiumStatus, // used for pro indicator
}) {
  const { t } = useI18n();
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

  const accent = theme?.accent || "var(--theme-accent)";

  return (
    <nav
      data-tutorial="bottom-nav"
      aria-label={t("nav.aria")}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-nav)",
        background: "linear-gradient(to top, rgba(8,9,14,0.96), rgba(10,11,18,0.82))",
        borderTop: `1px solid ${penaltyActive ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        boxShadow: "0 -1px 24px rgba(0,0,0,0.35)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity var(--duration-fast) var(--ease-out)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", maxWidth: 520, margin: "0 auto", padding: "0 var(--space-1)" }}>
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          const iconSize = tab.isGate ? 27 : 22;
          const premiumFeature = getPremiumFeatureForRoute(tab.key);
          const isProLocked = !!premiumFeature && !premiumStatus?.active;

          return (
            <button
              key={tab.key}
              data-tutorial={`nav-${tab.key}`}
              onClick={() => onNavigate(tab.key)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="press-feedback"
              style={{
                flex: 1,
                padding: "7px 0 5px",
                background: "transparent",
                border: "none",
                color: active ? accent : "#5b6472",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                position: "relative",
                transition: "color 0.25s ease",
                cursor: "pointer",
                minHeight: 48,
                fontFamily: "var(--font-sans)",
              }}
            >
              {/* Active indicator — calm hairline */}
              {active && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "32%",
                    right: "32%",
                    height: 2,
                    background: accent,
                    borderRadius: "0 0 2px 2px",
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
                    width: iconSize,
                    height: iconSize,
                    objectFit: "contain",
                    display: "block",
                    transition: "transform 0.25s ease, filter 0.25s ease, opacity 0.25s ease",
                    transform: active ? "scale(1.06)" : "scale(1)",
                    opacity: active ? 1 : 0.5,
                    filter: active
                      ? `brightness(1.2) drop-shadow(0 0 6px ${theme?.glow || "var(--theme-glow)"})`
                      : "grayscale(0.3)",
                  }}
                />
                {isProLocked && (
                  <div style={{
                    position: "absolute",
                    top: -6,
                    right: -13,
                    background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.35)",
                    borderRadius: 5,
                    padding: "1px 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3
                  }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: "#fde68a", fontFamily: "var(--font-sans)", letterSpacing: 0.5 }}>PRO</span>
                  </div>
                )}
                {tab.badge > 0 && (
                  <span
                    aria-label={t("common.pending", { count: tab.badge })}
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -8,
                      minWidth: 15,
                      height: 15,
                      borderRadius: "var(--radius-full)",
                      background: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      border: "2px solid rgba(8,9,14,0.95)",
                      padding: "0 3px",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: active ? 700 : 600,
                letterSpacing: 0.2,
                opacity: active ? 1 : 0.75,
                transition: "all 0.25s ease",
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
