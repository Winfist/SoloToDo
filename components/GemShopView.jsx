// GemShopView.jsx – Premium Gem Crystal Shop
import React, { useState, useMemo } from 'react';
import { GEM_ICONS } from '../data/icons.js';

const GEM_CATEGORIES = [
  { key: "all", label: "Alle", icon: "💎" },
  { key: "booster", label: "Booster", icon: "⚡" },
  { key: "theme", label: "Themes", icon: "🎨" },
  { key: "title", label: "Titel", icon: "🏅" },
  { key: "cosmetic", label: "Cosmetics", icon: "🌑" },
  { key: "convenience", label: "Tools", icon: "🛠️" },
];

export default function GemShopView({
  state, theme, buyGemItem, watchRewardedAd,
  claimDailyGemBonus, getActiveGemBoosters,
  GEM_SHOP_ITEMS, onWatchAd, notify
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [showAdModal, setShowAdModal] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const adsToday = state.lastAdWatchDate === today ? (state.adsWatchedToday || 0) : 0;
  const adsRemaining = Math.max(0, 5 - adsToday);
  const dailyClaimed = state.gemStreak?.lastClaimDate === today;
  const gemStreak = state.gemStreak?.current || 0;
  const activeBoosters = getActiveGemBoosters ? getActiveGemBoosters() : [];

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return GEM_SHOP_ITEMS || [];
    return (GEM_SHOP_ITEMS || []).filter(item => item.category === activeTab);
  }, [activeTab, GEM_SHOP_ITEMS]);

  const getCategoryIcon = (cat) => {
    const c = GEM_CATEGORIES.find(c => c.key === cat);
    return c ? c.icon : "💎";
  };

  const getCategoryLabel = (cat) => {
    switch(cat) {
      case "booster": return "BOOSTER";
      case "theme": return "PREMIUM THEMES";
      case "title": return "PREMIUM TITEL";
      case "cosmetic": return "SHADOW COSMETICS";
      case "convenience": return "CONVENIENCE";
      default: return "ITEMS";
    }
  };

  // Group items by category for "all" view
  const groupedItems = useMemo(() => {
    if (activeTab !== "all") return null;
    const groups = {};
    (GEM_SHOP_ITEMS || []).forEach(item => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [activeTab, GEM_SHOP_ITEMS]);

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.06))`,
        border: "1px solid #7c3aed33",
        borderRadius: 20,
        padding: "20px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: 0, right: 0, width: "40%", height: "100%",
          background: "radial-gradient(circle at 100% 30%, rgba(124,58,237,0.15), transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20, width: 80, height: 80,
          background: "radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)",
          borderRadius: "50%", pointerEvents: "none"
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{
              fontSize: 10, letterSpacing: 4, color: "#a855f7",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: 6,
              animation: "pulse 3s infinite"
            }}>GEM CRYSTAL SHOP</div>
            <div style={{
              fontSize: 20, fontWeight: 900, color: "#fff",
              fontFamily: "'Cinzel',serif", letterSpacing: 2
            }}>Premium Shop</div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))",
            border: "1px solid #a855f744",
            boxShadow: "0 4px 20px rgba(124,58,237,0.15)"
          }}>
            <img src={GEM_ICONS.gem} style={{
              width: 22, height: 22, objectFit: "contain",
              filter: "drop-shadow(0 0 6px #a855f788)",
              animation: "float 3s ease-in-out infinite"
            }} alt="💎" />
            <span style={{
              fontSize: 22, fontWeight: 900, color: "#c084fc",
              fontFamily: "'Cinzel',serif"
            }}>{(state.gems || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Earn Gems Section */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {/* Watch Ad Button */}
          <button
            onClick={() => { if (adsRemaining > 0) onWatchAd(); }}
            disabled={adsRemaining <= 0}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: adsRemaining > 0
                ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))"
                : "rgba(30,30,50,0.4)",
              border: `1px solid ${adsRemaining > 0 ? "#a855f755" : "#333"}`,
              color: adsRemaining > 0 ? "#c084fc" : "#475569",
              fontSize: 11, fontWeight: 700,
              fontFamily: "'JetBrains Mono',monospace",
              cursor: adsRemaining > 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4
            }}
          >
            <span style={{ fontSize: 14 }}>🎬</span>
            <span>Werbung ansehen</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>{adsRemaining}/5 heute · +3-5💎</span>
          </button>

          {/* Daily Bonus */}
          <button
            onClick={() => { if (!dailyClaimed) claimDailyGemBonus(); }}
            disabled={dailyClaimed}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: dailyClaimed
                ? "rgba(34,197,94,0.05)"
                : "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
              border: `1px solid ${dailyClaimed ? "#22c55e33" : "#22c55e55"}`,
              color: dailyClaimed ? "#22c55e88" : "#22c55e",
              fontSize: 11, fontWeight: 700,
              fontFamily: "'JetBrains Mono',monospace",
              cursor: dailyClaimed ? "default" : "pointer",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4
            }}
          >
            <span style={{ fontSize: 14 }}>{dailyClaimed ? "✅" : "📅"}</span>
            <span>{dailyClaimed ? "Beansprucht!" : "Daily Bonus"}</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>
              Streak: {gemStreak} Tage{gemStreak > 0 && gemStreak % 7 === 6 ? " · 🔥 Morgen Tag-7!" : ""}
            </span>
          </button>
        </div>
      </div>

      {/* Active Boosters */}
      {activeBoosters.length > 0 && (
        <div style={{
          background: "rgba(124,58,237,0.06)",
          border: "1px solid #a855f733",
          borderRadius: 14,
          padding: "12px 16px",
          marginBottom: 16
        }}>
          <div style={{
            fontSize: 9, letterSpacing: 3, color: "#a855f7",
            fontFamily: "'JetBrains Mono',monospace", marginBottom: 8
          }}>AKTIVE BOOSTER</div>
          {activeBoosters.map((b, i) => {
            const remaining = Math.max(0, b.expiresAt - Date.now());
            const hours = Math.floor(remaining / 3600000);
            const mins = Math.floor((remaining % 3600000) / 60000);
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: i < activeBoosters.length - 1 ? "1px solid #a855f715" : "none"
              }}>
                <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 600 }}>⚡ {b.name}</span>
                <span style={{
                  fontSize: 10, color: "#a855f7",
                  fontFamily: "'JetBrains Mono',monospace"
                }}>{hours}h {mins}m</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Tabs */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto",
        paddingBottom: 12, marginBottom: 16,
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none"
      }}>
        {GEM_CATEGORIES.map(cat => {
          const isActive = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 10, fontWeight: 700,
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                background: isActive
                  ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))"
                  : "transparent",
                color: isActive ? "#c084fc" : "#64748b",
                border: `1px solid ${isActive ? "#a855f755" : "#1e2940"}`,
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {activeTab === "all" ? (
        // Grouped view
        Object.entries(groupedItems || {}).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10, letterSpacing: 3, color: "#7c3aed",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span>{getCategoryIcon(cat)}</span>
              <span>{getCategoryLabel(cat)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <GemShopItemCard
                  key={item.id} item={item} state={state}
                  theme={theme} buyGemItem={buyGemItem} idx={idx}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredItems.map((item, idx) => (
            <GemShopItemCard
              key={item.id} item={item} state={state}
              theme={theme} buyGemItem={buyGemItem} idx={idx}
            />
          ))}
          {filteredItems.length === 0 && (
            <div style={{
              textAlign: "center", padding: "32px", color: "#475569",
              fontSize: 12, fontFamily: "'JetBrains Mono',monospace"
            }}>Keine Items in dieser Kategorie</div>
          )}
        </div>
      )}

      {/* Coming Soon: Gem Packs */}
      <div style={{
        background: "rgba(10,10,22,0.6)",
        border: "1px dashed #a855f733",
        borderRadius: 16,
        padding: "20px",
        marginTop: 24,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>💰</div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#64748b",
          fontFamily: "'Cinzel',serif", marginBottom: 6
        }}>Gem-Pakete</div>
        <div style={{
          fontSize: 10, color: "#475569",
          fontFamily: "'JetBrains Mono',monospace"
        }}>Coming Soon – Kaufe Gems direkt mit Echtgeld</div>
      </div>
    </div>
  );
}

function GemShopItemCard({ item, state, theme, buyGemItem, idx }) {
  const owned = !item.repeatable && (state.gemPurchases || []).includes(item.id);
  const canAfford = (state.gems || 0) >= item.cost;
  const isActiveTheme = item.type === "theme" && state.selectedTheme === item.themeKey;
  const isActiveTitle = item.type === "title" && state.selectedTitle === item.name;
  const isActive = isActiveTheme || isActiveTitle;

  const typeColors = {
    booster: "#a855f7",
    theme: "#06b6d4",
    title: "#f59e0b",
    cosmetic: "#6366f1",
    consumable: "#22c55e",
  };
  const itemColor = typeColors[item.type] || "#a855f7";

  return (
    <div style={{
      background: isActive
        ? `linear-gradient(135deg, ${itemColor}12, transparent)`
        : theme.card,
      border: `1px solid ${isActive ? itemColor + "44" : "#1e294020"}`,
      borderLeft: `3px solid ${itemColor}66`,
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      backdropFilter: "blur(8px)",
      animation: `cardEnter 0.4s ease ${idx * 0.05}s both`,
      transition: "all 0.2s"
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 10,
        background: isActive ? `${itemColor}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? itemColor + "33" : "rgba(255,255,255,0.06)"}`
      }}>
        {item.iconSrc ? (
          <img src={item.iconSrc} alt={item.name} style={{
            width: 24, height: 24, objectFit: "contain",
            filter: `drop-shadow(0 0 4px ${itemColor}66)`
          }} />
        ) : (
          <span style={{ fontSize: 20 }}>💎</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: isActive ? itemColor : "#e2e8f0",
            fontFamily: "'Cinzel',serif"
          }}>{item.name}</div>
          {isActive && (
            <div style={{
              fontSize: 8, color: itemColor,
              padding: "1px 6px", borderRadius: 3,
              background: `${itemColor}22`,
              fontFamily: "'JetBrains Mono',monospace"
            }}>AKTIV</div>
          )}
          {owned && !isActive && (
            <div style={{
              fontSize: 8, color: "#22c55e",
              padding: "1px 6px", borderRadius: 3,
              background: "rgba(34,197,94,0.12)",
              fontFamily: "'JetBrains Mono',monospace"
            }}>BESITZT</div>
          )}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>
          {item.desc}
        </div>
        {item.type === "booster" && item.duration && (
          <div style={{
            fontSize: 9, color: "#7c3aed",
            fontFamily: "'JetBrains Mono',monospace", marginTop: 3
          }}>⏱ {Math.round(item.duration / 3600000)}h Dauer</div>
        )}
      </div>

      {/* Buy Button */}
      {owned && !item.repeatable ? (
        (item.type === "theme" || item.type === "title") ? (
          <button onClick={() => buyGemItem(item)} style={{
            padding: "8px 16px", borderRadius: 10,
            fontSize: 10, fontWeight: 700,
            background: isActive ? `${itemColor}22` : "transparent",
            color: isActive ? itemColor : "#475569",
            border: `1px solid ${isActive ? itemColor + "44" : "#1e2940"}`,
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 1,
            cursor: "pointer"
          }}>{isActive ? "AKTIV" : "NUTZEN"}</button>
        ) : (
          <div style={{
            padding: "8px 14px", borderRadius: 10,
            fontSize: 10, fontWeight: 700,
            color: "#22c55e88",
            border: "1px solid #22c55e22",
            fontFamily: "'JetBrains Mono',monospace"
          }}>✓</div>
        )
      ) : (
        <button
          onClick={() => buyGemItem(item)}
          disabled={!canAfford}
          style={{
            padding: "8px 16px", borderRadius: 10,
            fontSize: 11, fontWeight: 700,
            background: canAfford
              ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))"
              : "transparent",
            color: canAfford ? "#c084fc" : "#334155",
            border: `1px solid ${canAfford ? "#a855f755" : "#1e2940"}`,
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 0.5,
            cursor: canAfford ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 5
          }}
        >
          <img src={GEM_ICONS.gem} style={{
            width: 12, height: 12, objectFit: "contain",
            opacity: canAfford ? 1 : 0.3
          }} alt="💎" />
          {item.cost}
        </button>
      )}
    </div>
  );
}
