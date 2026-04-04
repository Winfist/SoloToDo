import React from 'react';
import { MP_THEME } from './data/mpConstants';

const MP_NAV_ITEMS = [
  { id: "guild", icon: "🏰", label: "Guild" },
  { id: "raids", icon: "🌀", label: "Raids" },
  { id: "ranks", icon: "🏆", label: "Ranks" },
  { id: "social", icon: "💬", label: "Social" },
];

export default function MPNavigation({ currentView, setCurrentView }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: `linear-gradient(0deg, ${MP_THEME.bg}fc 0%, ${MP_THEME.bg}f0 100%)`,
      backdropFilter: "blur(16px)",
      borderTop: `1px solid ${MP_THEME.primary}22`,
      zIndex: 100,
      boxShadow: `0 -8px 32px rgba(0,0,0,0.5)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 480, margin: "0 auto", padding: "8px 16px 22px" }}>
      {MP_NAV_ITEMS.map(item => {
        const active = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            style={{
              padding: "8px 16px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: active ? MP_THEME.accent : "#64748b",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: active ? "translateY(-2px)" : "none",
              position: "relative",
              background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            {/* Active background glow */}
            {active && (
              <div style={{
                position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)",
                width: 40, height: 40, borderRadius: "50%",
                background: `radial-gradient(circle, ${MP_THEME.primary}25, transparent 70%)`,
                filter: "blur(8px)",
                animation: "mpGlow 2s ease-in-out infinite",
              }} />
            )}

            <div style={{ 
              fontSize: 22,
              filter: active ? `drop-shadow(0 0 8px ${MP_THEME.primary}88)` : "grayscale(100%) opacity(0.5)",
              transition: "all 0.3s",
              position: "relative",
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: active ? 800 : 500,
              letterSpacing: 1,
              opacity: active ? 1 : 0.5,
              transition: "all 0.3s",
              position: "relative",
            }}>
              {item.label}
            </div>
            
            {/* Active Indicator Line */}
            <div style={{
              width: active ? 20 : 0, height: 2, borderRadius: 1,
              background: `linear-gradient(90deg, ${MP_THEME.primary}, ${MP_THEME.accent})`,
              boxShadow: active ? `0 0 8px ${MP_THEME.primary}` : "none",
              position: "absolute", bottom: -2,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          </button>
        );
      })}
      </div>
    </nav>
  );
}
