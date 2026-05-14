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
        background: "linear-gradient(to top, rgba(4,4,12,0.98), rgba(8,8,22,0.88))",
        borderTop: `1px solid ${penaltyActive ? "#ef444455" : (theme?.primary + "33" || "var(--theme-primary-44)")}`,
        backdropFilter: "blur(32px) saturate(1.6)",
        WebkitBackdropFilter: "blur(32px) saturate(1.6)",
        boxShadow: `0 -4px 32px ${theme?.glow || "var(--theme-glow)"}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity var(--duration-fast) var(--ease-out)",
      }}
    >
      {/* HUD corner brackets on nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: `1.5px solid ${theme?.primary + "33" || "var(--theme-primary-22)"}`, borderLeft: `1.5px solid ${theme?.primary + "33" || "var(--theme-primary-22)"}`, pointerEvents: "none", zIndex: 2, opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: `1.5px solid ${theme?.primary + "33" || "var(--theme-primary-22)"}`, borderRight: `1.5px solid ${theme?.primary + "33" || "var(--theme-primary-22)"}`, pointerEvents: "none", zIndex: 2, opacity: 0.5 }} />

      <div style={{ display: "flex", justifyContent: "center", maxWidth: 540, margin: "0 auto", padding: "0 var(--space-1)" }}>
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          const iconSize = tab.isGate ? 36 : 26;
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
                padding: "var(--space-3) 0 var(--space-2)",
                background: "transparent",
                border: "none",
                color: active ? (theme?.accent || "var(--theme-accent)") : "#475569",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                position: "relative",
                transition: "color 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                cursor: "pointer",
                minHeight: "var(--min-touch)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {/* Active indicator line */}
              {active && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "8%",
                    right: "8%",
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${theme?.accent || "var(--theme-accent)"}, transparent)`,
                    borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                    boxShadow: `0 2px 12px ${theme?.accent || "var(--theme-accent)"}, 0 0 24px ${theme?.glow || "var(--theme-glow)"}`,
                    animation: "neonPulse 2s ease-in-out infinite",
                  }}
                />
              )}
              {/* Radial glow underneath active icon */}
              {active && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "20%",
                    left: "15%",
                    right: "15%",
                    height: "60%",
                    background: `radial-gradient(ellipse at 50% 30%, ${theme?.glow || "rgba(34,211,238,0.15)"}, transparent 70%)`,
                    pointerEvents: "none",
                    filter: "blur(8px)",
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
                    transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: active ? "scale(1.2) translateY(-3px)" : "scale(1)",
                    filter: active
                      ? `brightness(1.4) drop-shadow(0 0 10px ${theme?.glow || "var(--theme-glow)"}) saturate(1.4)`
                      : "brightness(0.5) saturate(0.35)",
                  }}
                />
                {isProLocked && (
                  <div style={{
                    position: "absolute",
                    top: -6,
                    right: -14,
                    background: "rgba(251,191,36,0.15)",
                    border: "1px solid rgba(251,191,36,0.4)",
                    borderRadius: 6,
                    padding: "2px 4px",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4), 0 0 12px rgba(251,191,36,0.15)",
                    zIndex: 3
                  }}>
                    <span style={{ fontSize: 7, fontWeight: 900, color: "#fde68a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5 }}>PRO</span>
                  </div>
                )}
                {tab.badge > 0 && (
                  <span
                    aria-label={t("common.pending", { count: tab.badge })}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      borderRadius: "var(--radius-full)",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: "var(--font-black)",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      border: "2px solid rgba(0,0,0,0.8)",
                      padding: "0 3px",
                      animation: "pulse 2s infinite",
                      boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-black)",
                letterSpacing: 1,
                opacity: active ? 1 : 0.5,
                textShadow: active ? `0 0 8px ${theme?.glow || "var(--theme-glow)"}` : "none",
                transition: "all 0.3s ease",
              }}>
                {tab.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
