import React from "react";
import BottomNav from "./BottomNav.jsx";
import Sidebar from "./Sidebar.jsx";

// AppShell — wraps the app layout.
// - Mobile (< 1024px): BottomNav fixed at bottom
// - Desktop (≥ 1024px): Sidebar fixed on the left
//
// The existing state-based view system in useGameState is untouched.
// This component only manages layout chrome; view rendering stays in solo-leveling-v5.jsx.

export default function AppShell({
  view,
  children,
  navConfig,
  allTabs,
  defaultKeys,
  can,
  onNavigate,
  activeDungeons,
  statPoints,
  penaltyActive,
  theme,
  logo,
  hideNav,
}) {
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const navProps = { view, navConfig, allTabs, defaultKeys, can, onNavigate, activeDungeons, statPoints, theme };

  return (
    <div style={{ minHeight: "100vh", background: "var(--theme-bg)", color: "#e2e8f0", fontFamily: "var(--font-sans)", position: "relative" }}>
      {/* Sidebar on desktop */}
      {isDesktop && !hideNav && (
        <Sidebar {...navProps} logo={logo} />
      )}

      {/* Main content area — offset for sidebar on desktop */}
      <div
        style={{
          marginLeft: isDesktop && !hideNav ? 72 : 0,
          paddingBottom: !isDesktop && !hideNav ? 80 : 0,
          minHeight: "100vh",
          transition: "margin-left var(--duration-normal) var(--ease-out)",
        }}
      >
        {children}
      </div>

      {/* Bottom nav on mobile */}
      {!isDesktop && !hideNav && (
        <BottomNav {...navProps} penaltyActive={penaltyActive} hidden={hideNav} />
      )}
    </div>
  );
}
