import React, { useState, useMemo, useEffect } from 'react';
import { GEM_ICONS, QUEST_ICONS, STORY_ICONS, STAT_ICONS } from '../data/icons.js';
import { getToday as getLocalToday } from '../data/dateUtils.js';

const GEM_CATEGORIES = [
  { key: "all", label: "Alle", icon: "💎", color: "#a855f7" },
  { key: "booster", label: "Booster", icon: "⚡", color: "#f59e0b" },
  { key: "theme", label: "Themes", icon: "🎨", color: "#06b6d4" },
  { key: "title", label: "Titel", icon: "🏅", color: "#ef4444" },
  { key: "cosmetic", label: "Cosmetics", icon: "🌑", color: "#6366f1" },
  { key: "convenience", label: "Tools", icon: "🛠️", color: "#22c55e" },
];

function Particles({ color, suffix }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`p-${suffix}-${i}`} style={{
          position: "absolute", bottom: 0,
          left: `${Math.random() * 100}%`,
          width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, ${color}00)`,
          animation: `shopParticle ${4 + Math.random() * 4}s ${Math.random() * 4}s infinite ease-out`,
          "--sp-tx": `${-30 + Math.random() * 60}px`,
          "--sp-ty": `${-40 - Math.random() * 60}px`,
        }} />
      ))}
    </div>
  );
}

export default function UnifiedShopView({
  state, theme, 
  SHOP_ITEMS, HUNTER_CODEX,
  GEM_SHOP_ITEMS,
  shopUnlocked, rank, getRankIndex,
  buyItem, buyGemItem, persist, notify, can,
  genId, getToday,
  watchRewardedAd, claimDailyGemBonus, getActiveGemBoosters, onWatchAd
}) {
  const [activeShop, setActiveShop] = useState(window.__SHOP_START_TAB || "gold");
  const [activeGemTab, setActiveGemTab] = useState("all");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [purchaseFlash, setPurchaseFlash] = useState(null);

  useEffect(() => {
    if (window.__SHOP_START_TAB) {
      setActiveShop(window.__SHOP_START_TAB);
      window.__SHOP_START_TAB = null;
    }
  }, []);

  const isGem = activeShop === "gems";
  const primaryColor = isGem ? "#a855f7" : "#fbbf24";
  const secondaryColor = isGem ? "#c084fc" : "#fde68a";
  const bgGradient = isGem 
    ? "linear-gradient(145deg, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.06) 40%, rgba(99,102,241,0.12) 100%)"
    : "linear-gradient(145deg, rgba(251,191,36,0.14) 0%, rgba(245,158,11,0.06) 40%, rgba(217,119,6,0.1) 100%)";

  // Gem specific states
  const today = getLocalToday();
  const adsToday = state.lastAdWatchDate === today ? (state.adsWatchedToday || 0) : 0;
  const adsRemaining = Math.max(0, 5 - adsToday);
  const dailyClaimed = state.gemStreak?.lastClaimDate === today;
  const gemStreak = state.gemStreak?.current || 0;
  const activeBoosters = getActiveGemBoosters ? getActiveGemBoosters() : [];

  const handleGemBuy = (item) => {
    setPurchaseFlash(item.id);
    buyGemItem(item);
    setTimeout(() => setPurchaseFlash(null), 600);
  };

  const gemFilteredItems = useMemo(() => {
    if (activeGemTab === "all") return GEM_SHOP_ITEMS || [];
    return (GEM_SHOP_ITEMS || []).filter(item => item.category === activeGemTab);
  }, [activeGemTab, GEM_SHOP_ITEMS]);

  const gemGroupedItems = useMemo(() => {
    if (activeGemTab !== "all") return null;
    const groups = {};
    (GEM_SHOP_ITEMS || []).forEach(item => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [activeGemTab, GEM_SHOP_ITEMS]);

  const getGemCatLabel = (cat) => GEM_CATEGORIES.find(c => c.key === cat)?.label?.toUpperCase() || "ITEMS";
  const getGemCatColor = (cat) => GEM_CATEGORIES.find(c => c.key === cat)?.color || "#a855f7";

  return (
    <div style={{ animation: "fadeIn 0.4s ease", position: "relative" }}>

      {/* ═══ UNIFIED HEADER & TOGGLE ═══ */}
      <div style={{
        background: bgGradient,
        border: `1px solid ${primaryColor}44`,
        borderRadius: 24,
        padding: "24px 22px 20px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.5s ease",
        animation: "shopHeaderGlow 4s ease-in-out infinite",
      }}>
        {/* Radial glow effects */}
        <div style={{
          position: "absolute", top: -30, right: -30, width: 200, height: 200,
          background: `radial-gradient(circle, ${primaryColor}33, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none", animation: "breathe 4s ease-in-out infinite",
          transition: "background 0.5s",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -20, width: 150, height: 150,
          background: `radial-gradient(circle, ${secondaryColor}22, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none", transition: "background 0.5s",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${primaryColor}66 30%, ${secondaryColor}88 50%, ${primaryColor}66 70%, transparent 100%)`,
          backgroundSize: "200% 100%", animation: "holoShimmer 3s linear infinite",
        }} />

        <Particles color={primaryColor} suffix={activeShop} />

        {/* Tab Switcher */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24, position: "relative", zIndex: 2,
          background: "rgba(0,0,0,0.2)", padding: 6, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)"
        }}>
          {[
            { id: "gold", label: "Gold Shop", icon: "🪙", color: "#fbbf24" },
            { id: "gems", label: "Gem Shop", icon: "💎", color: "#a855f7", locked: !can('gem_shop') }
          ].map(tab => {
            const isActive = activeShop === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { if (!tab.locked) setActiveShop(tab.id); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  background: isActive ? `linear-gradient(145deg, ${tab.color}33, ${tab.color}11)` : "transparent",
                  border: isActive ? `1px solid ${tab.color}44` : "1px solid transparent",
                  color: isActive ? tab.color : "#94a3b8",
                  fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
                  cursor: tab.locked ? "not-allowed" : "pointer",
                  opacity: tab.locked ? 0.5 : 1, transition: "all 0.3s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: isActive ? `0 4px 16px ${tab.color}22` : "none",
                }}
              >
                <span>{tab.locked ? "🔒" : tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Currency Display */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div style={{ transition: "translate 0.3s, opacity 0.3s" }}>
            <div style={{
              fontSize: 10, letterSpacing: 4, color: secondaryColor,
              fontFamily: "'JetBrains Mono',monospace", marginBottom: 4,
              textShadow: `0 0 12px ${primaryColor}88`,
            }}>◆ {isGem ? "PREMIUM STORE" : "SYSTEM SHOP"} ◆</div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: "#fff",
              fontFamily: "'Cinzel',serif", letterSpacing: 2,
              textShadow: `0 2px 12px ${primaryColor}66`,
            }}>{isGem ? "Kristallium" : "Gold Kammer"}</div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 18px", borderRadius: 16,
            background: `linear-gradient(145deg, ${primaryColor}33, ${primaryColor}11)`,
            border: `1px solid ${primaryColor}55`,
            boxShadow: `0 4px 24px ${primaryColor}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
            position: "relative", overflow: "hidden",
            minWidth: 120, justifyContent: "center"
          }}>
            <div style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%",
              border: `1px solid ${primaryColor}66`,
              animation: "gemPulseRing 2s ease-out infinite", pointerEvents: "none",
            }} />
            <img src={isGem ? GEM_ICONS.gem : "/icon/coin.png"} style={{
              width: 24, height: 24, objectFit: "contain",
              filter: `drop-shadow(0 0 10px ${primaryColor}aa)`,
              animation: "gemFloat 4s ease-in-out infinite",
            }} alt={isGem ? "💎" : "G"} />
            <span style={{
              fontSize: 24, fontWeight: 900, color: secondaryColor,
              fontFamily: "'Cinzel',serif", textShadow: `0 0 16px ${primaryColor}88`,
            }}>{(isGem ? (state.gems || 0) : state.gold).toLocaleString()}</span>
          </div>
        </div>

        {/* Earn Gems Actions */}
        {isGem && (
          <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 2, marginTop: 18, animation: "fadeIn 0.4s ease" }}>
            <button
              className="shop-btn-hover"
              onClick={() => { if (adsRemaining > 0) onWatchAd(); }}
              disabled={adsRemaining <= 0}
              style={{
                flex: 1, padding: "12px", borderRadius: 14,
                background: adsRemaining > 0 ? "rgba(168,85,247,0.15)" : "rgba(20,20,40,0.4)",
                border: `1px solid ${adsRemaining > 0 ? "rgba(168,85,247,0.3)" : "#1e294030"}`,
                color: adsRemaining > 0 ? "#e9d5ff" : "#475569",
                fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                cursor: adsRemaining > 0 ? "pointer" : "not-allowed",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>🎬</span>
              <span>Werbung ansehen</span>
              <div style={{ fontSize: 9, opacity: 0.8 }}>{adsRemaining}/5 heute · +3-5 💎</div>
            </button>

            <button
              className="shop-btn-hover"
              onClick={() => { if (!dailyClaimed) claimDailyGemBonus(); }}
              disabled={dailyClaimed}
              style={{
                flex: 1, padding: "12px", borderRadius: 14,
                background: dailyClaimed ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.15)",
                border: `1px solid ${dailyClaimed ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.3)"}`,
                color: dailyClaimed ? "rgba(34,197,94,0.5)" : "#4ade80",
                fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                cursor: dailyClaimed ? "default" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>{dailyClaimed ? "✅" : "🎁"}</span>
              <span>{dailyClaimed ? "Beansprucht!" : "Daily Bonus"}</span>
              <div style={{ fontSize: 9, opacity: 0.8 }}>🔥 Streak: {gemStreak} Tage</div>
            </button>
          </div>
        )}
      </div>

      {/* ═══ GOLD SHOP CONTENT ═══ */}
      {activeShop === "gold" && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {!shopUnlocked && (
            <div style={{
              background: "linear-gradient(145deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 18,
              padding: "18px", marginBottom: 18, textAlign: "center",
              fontSize: 12, color: "#f87171", position: "relative", overflow: "hidden",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🔒</div>Shop ab D-Rang verfügbar
            </div>
          )}

          {[
            { type: "consumable", label: "VERBRAUCHSGÜTER", icon: "⚗️", color: "#22c55e" },
            { type: "title", label: "PREMIUM TITEL", icon: "🏅", color: "#f59e0b" },
            { type: "theme", label: "EXKLUSIVE THEMES", icon: "🎨", color: "#06b6d4" },
          ].map((section, si) => (
            <div key={section.type} style={{ marginBottom: 28, animation: `shopSectionIn 0.4s ease ${si * 0.1}s both` }}>
              <CategoryHeader label={section.label} icon={section.icon} color={section.color} />
              
              {SHOP_ITEMS.filter(i => i.type === section.type).map((item, idx) => {
                const owned = state.shopPurchases.includes(item.id);
                const canAfford = state.gold >= item.cost;
                const rankOk = getRankIndex(rank.name) >= getRankIndex(item.minRank);
                const isActive = (item.type === "theme" && state.selectedTheme === item.themeKey) || (item.type === "title" && state.selectedTitle === item.name);
                const buyable = canAfford && rankOk && shopUnlocked;

                return (
                  <ShopItemCard 
                    key={item.id} item={item} color={section.color} 
                    isHovered={hoveredItem === item.id} onHover={setHoveredItem}
                    isActive={isActive} isOwned={owned} canBuy={buyable} 
                    rankOk={rankOk} currencyIcon="/icon/coin.png"
                    onBuy={() => buyItem(item)}
                    onUse={() => { if (item.type === "theme") persist({ ...state, selectedTheme: item.themeKey }); else persist({ ...state, selectedTitle: item.name }); }}
                    delay={si * 0.1 + idx * 0.05}
                  />
                );
              })}
            </div>
          ))}

          {/* Hunter's Codex */}
          {shopUnlocked && can('codex') && (
            <CodexSection 
              state={state} persist={persist} HUNTER_CODEX={HUNTER_CODEX} 
              genId={genId} getToday={getToday} notify={notify}
            />
          )}
        </div>
      )}

      {/* ═══ GEM SHOP CONTENT ═══ */}
      {activeShop === "gems" && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          
          {/* Active Boosters */}
          {activeBoosters.length > 0 && <ActiveBoosters boosters={activeBoosters} />}

          {/* Categories */}
          <div style={{
            display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 20,
            WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none",
          }}>
            {GEM_CATEGORIES.map(cat => {
              const isActive = activeGemTab === cat.key;
              return (
                <button
                  key={cat.key} className={isActive ? "" : "shop-tab-hover"}
                  onClick={() => setActiveGemTab(cat.key)}
                  style={{
                    padding: "10px 16px", borderRadius: 14, fontSize: 10, fontWeight: 800,
                    fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap",
                    background: isActive ? `linear-gradient(145deg, ${cat.color}30, ${cat.color}10)` : "rgba(255,255,255,0.02)",
                    color: isActive ? cat.color : "#475569",
                    border: `1px solid ${isActive ? cat.color + "55" : "rgba(255,255,255,0.06)"}`,
                    cursor: "pointer", flexShrink: 0, position: "relative", overflow: "hidden",
                    boxShadow: isActive ? `0 4px 20px ${cat.color}22` : "none",
                  }}
                >
                  {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cat.color}88, transparent)` }} />}
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>

          {/* Items */}
          {activeGemTab === "all" ? (
            Object.entries(gemGroupedItems || {}).map(([cat, items], gi) => (
              <div key={cat} style={{ marginBottom: 28, animation: `shopSectionIn 0.4s ease ${gi * 0.1}s both` }}>
                <CategoryHeader label={getGemCatLabel(cat)} color={getGemCatColor(cat)} />
                {items.map((item, idx) => {
                  const owned = !item.repeatable && (state.gemPurchases || []).includes(item.id);
                  const canAfford = (state.gems || 0) >= item.cost;
                  const isActive = (item.type === "theme" && state.selectedTheme === item.themeKey) || (item.type === "title" && state.selectedTitle === item.name);
                  return (
                    <ShopItemCard 
                      key={item.id} item={item} color={getGemCatColor(cat)}
                      isHovered={hoveredItem === item.id} onHover={setHoveredItem} purchaseFlash={purchaseFlash === item.id}
                      isActive={isActive} isOwned={owned} canBuy={canAfford}
                      currencyIcon={GEM_ICONS.gem} delay={gi * 0.1 + idx * 0.05}
                      onBuy={() => handleGemBuy(item)} onUse={() => handleGemBuy(item)}
                    />
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gemFilteredItems.map((item, idx) => {
                const owned = !item.repeatable && (state.gemPurchases || []).includes(item.id);
                const canAfford = (state.gems || 0) >= item.cost;
                const isActive = (item.type === "theme" && state.selectedTheme === item.themeKey) || (item.type === "title" && state.selectedTitle === item.name);
                return (
                  <ShopItemCard 
                    key={item.id} item={item} color={getGemCatColor(activeGemTab)}
                    isHovered={hoveredItem === item.id} onHover={setHoveredItem} purchaseFlash={purchaseFlash === item.id}
                    isActive={isActive} isOwned={owned} canBuy={canAfford}
                    currencyIcon={GEM_ICONS.gem} delay={idx * 0.05}
                    onBuy={() => handleGemBuy(item)} onUse={() => handleGemBuy(item)}
                  />
                );
              })}
              {gemFilteredItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#475569", border: "1px dashed rgba(168,85,247,0.15)", borderRadius: 18 }}>💎 Keine Items in dieser Kategorie</div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Shared Subcomponents ──

function CategoryHeader({ label, icon, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "0 2px" }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg, ${color}, ${color}44)`, boxShadow: `0 0 8px ${color}44` }} />
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      <div style={{ fontSize: 10, letterSpacing: 3, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textShadow: `0 0 12px ${color}44` }}>{label}</div>
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${color}33, transparent)` }} />
    </div>
  )
}

function ShopItemCard({ item, color, isHovered, onHover, purchaseFlash, isActive, isOwned, canBuy, rankOk = true, currencyIcon, delay, onBuy, onUse }) {
  return (
    <div
      className="shop-card-hover"
      onMouseEnter={() => onHover(item.id)} onMouseLeave={() => onHover(null)}
      style={{
        "--card-glow": `${color}20`, "--card-border-hover": `${color}44`,
        background: isActive ? `linear-gradient(145deg, ${color}12, ${color}04, transparent)` : purchaseFlash ? `linear-gradient(145deg, ${color}22, transparent)` : "rgba(10,10,22,0.6)",
        border: `1px solid ${isActive ? color + "40" : "rgba(255,255,255,0.06)"}`,
        borderLeft: `3px solid ${isActive ? color : color + "44"}`,
        borderRadius: 18, padding: "16px 18px", marginBottom: 8,
        display: "flex", alignItems: "center", gap: 14, backdropFilter: "blur(12px)",
        animation: `itemReveal 0.4s ease ${delay}s both`, position: "relative", overflow: "hidden",
      }}
    >
      {isHovered && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent 40%, ${color}08 45%, ${color}12 50%, transparent 60%)`, backgroundSize: "200% 100%", animation: "holoShimmer 1.5s linear infinite", pointerEvents: "none" }} />}
      {isActive && <div style={{ position: "absolute", top: 0, left: 3, right: 0, height: 2, background: `linear-gradient(90deg, ${color}88, ${color}22, transparent)` }} />}
      {purchaseFlash && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${color}33, transparent 70%)`, animation: "fadeIn 0.2s, fadeOut 0.4s 0.2s", pointerEvents: "none" }} />}

      <div style={{
        width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14,
        background: isActive ? `linear-gradient(145deg, ${color}20, ${color}08)` : "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        border: `1px solid ${isActive ? color + "35" : "rgba(255,255,255,0.08)"}`,
        boxShadow: isActive ? `0 0 16px ${color}22` : "none", transition: "all 0.3s ease",
      }}>
        {item.iconSrc ? (
          <img src={item.iconSrc} alt={item.name} style={{ width: 26, height: 26, objectFit: "contain", filter: `drop-shadow(0 0 6px ${color}77)`, transform: isHovered ? "scale(1.15) rotate(5deg)" : "scale(1)", transition: "transform 0.3s ease" }} />
        ) : (
          <span style={{ fontSize: 22 }}>✨</span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? color : "#f1f5f9", fontFamily: "'Cinzel',serif" }}>{item.name}</div>
          {isActive && <div style={{ fontSize: 8, color, padding: "2px 8px", borderRadius: 4, background: `linear-gradient(90deg, ${color}25, ${color}10)`, border: `1px solid ${color}33`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>✦ AKTIV</div>}
          {isOwned && !isActive && <div style={{ fontSize: 8, color: "#4ade80", padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>✓ BESITZT</div>}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{item.desc}</div>
        {!rankOk && <div style={{ fontSize: 9, marginTop: 4, fontFamily: "'JetBrains Mono',monospace", color: "#f87171" }}>🔒 {item.minRank}-Rang benötigt</div>}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {isOwned ? (
          (item.type === "theme" || item.type === "title") ? (
            <button className="shop-btn-hover" onClick={onUse} style={{ padding: "10px 18px", borderRadius: 12, fontSize: 10, fontWeight: 800, background: isActive ? `linear-gradient(145deg, ${color}25, ${color}10)` : "rgba(255,255,255,0.03)", color: isActive ? color : "#64748b", border: `1px solid ${isActive ? color + "44" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", boxShadow: isActive ? `0 4px 16px ${color}22` : "none" }}>{isActive ? "AKTIV" : "NUTZEN"}</button>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 16 }}>✓</div>
          )
        ) : (
          <button className="shop-btn-hover" onClick={onBuy} disabled={!canBuy || !rankOk} style={{ padding: "10px 18px", borderRadius: 12, fontSize: 12, fontWeight: 800, background: canBuy && rankOk ? `linear-gradient(145deg, ${color}28, ${color}0a)` : "rgba(255,255,255,0.02)", color: canBuy && rankOk ? color : "#334155", border: `1px solid ${canBuy && rankOk ? color + "44" : "rgba(255,255,255,0.06)"}`, cursor: canBuy && rankOk ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, position: "relative", overflow: "hidden", boxShadow: canBuy && rankOk ? `0 4px 16px ${color}15` : "none" }}>
            {canBuy && rankOk && <div style={{ position: "absolute", top: 0, bottom: 0, width: "30%", background: `linear-gradient(90deg, transparent, ${color}22, transparent)`, animation: "shopBtnShine 3s infinite", pointerEvents: "none" }} />}
            <img src={currencyIcon} style={{ width: 14, height: 14, opacity: canBuy && rankOk ? 1 : 0.3 }} alt="$" />
            <span>{item.cost}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function ActiveBoosters({ boosters }) {
  return (
    <div style={{ background: "linear-gradient(145deg, rgba(124,58,237,0.1), rgba(168,85,247,0.04))", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 18, padding: "14px 18px", marginBottom: 18, position: "relative", overflow: "hidden", animation: "shopSectionIn 0.5s ease both" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "#c084fc", fontFamily: "'JetBrains Mono',monospace", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px #a855f7", animation: "boosterOrb 1.5s infinite" }} />
        AKTIVE BOOSTER
      </div>
      {boosters.map((b, i) => {
        const remaining = Math.max(0, b.expiresAt - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const progress = Math.max(0, Math.min(1, remaining / (b.expiresAt - (b.activatedAt || b.expiresAt - 7200000))));
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < boosters.length - 1 ? "1px solid rgba(168,85,247,0.1)" : "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#e9d5ff", fontWeight: 600 }}>{b.name}</div>
              <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(124,58,237,0.15)", marginTop: 4, overflow: "hidden" }}>
                <div style={{ width: `${progress * 100}%`, height: "100%", background: progress > 0.3 ? "linear-gradient(90deg, #7c3aed, #a855f7)" : "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 2, transition: "width 30s linear" }} />
              </div>
            </div>
            <span style={{ fontSize: 10, color: progress > 0.3 ? "#c084fc" : "#f87171", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, minWidth: 48, textAlign: "right" }}>{hours}h {mins}m</span>
          </div>
        );
      })}
    </div>
  )
}

function CodexSection({ state, persist, HUNTER_CODEX, genId, getToday, notify }) {
  return (
    <div style={{ marginTop: 32, padding: "24px", borderRadius: 22, background: "linear-gradient(145deg, rgba(124,58,237,0.1), rgba(168,85,247,0.04), rgba(99,102,241,0.08))", border: "1px solid rgba(124,58,237,0.3)", position: "relative", overflow: "hidden", animation: "shopSectionIn 0.6s ease 0.4s both" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #a855f744, #7c3aed66, #a855f744, transparent)", backgroundSize: "200% 100%", animation: "holoShimmer 4s linear infinite" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel',serif", letterSpacing: 2, textShadow: "0 0 16px #a855f755", animation: "codexGlow 3s ease-in-out infinite" }}>Hunter's Codex</div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginTop: 4 }}>VERLORENE WEISHEITEN</div>
        </div>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(145deg, rgba(168,85,247,0.15), rgba(124,58,237,0.05))", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", animation: "float 3s infinite", boxShadow: "0 4px 20px rgba(168,85,247,0.15)" }}>
          <img src={STORY_ICONS.scroll} alt="Codex" style={{ width: 30, height: 30, objectFit: "contain", filter: "drop-shadow(0 0 8px #a855f7aa)" }} />
        </div>
      </div>
      
      {/* Available to Buy */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 24 }}>
        {HUNTER_CODEX.filter(c => !(state.codex || []).includes(c.id)).slice(0, 4).map((item, ci) => {
          const canAfford = state.gold >= item.cost;
          const rqLv = item.tier === 1 ? 5 : item.tier === 2 ? 15 : 30;
          const rankOk = (state.stats[item.stat] || 0) >= rqLv;
          const buyable = canAfford && rankOk;
          return (
            <div key={item.id} className="shop-card-hover" style={{ "--card-glow": "rgba(168,85,247,0.15)", "--card-border-hover": "#a855f744", background: "rgba(10,10,22,0.5)", border: "1px solid rgba(124,58,237,0.25)", borderLeft: "3px solid rgba(168,85,247,0.5)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, animation: `itemReveal 0.4s ease ${0.2 + ci * 0.08}s both` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: "linear-gradient(145deg, rgba(168,85,247,0.15), rgba(124,58,237,0.05))", border: "1px solid rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📜</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e9d5ff", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Unbekanntes Fragment {item.id.replace(/codex_|_gen_/g, "")}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>
                  <span style={{ color: "#c084fc", padding: "1px 6px", borderRadius: 4, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)" }}>{item.stat.toUpperCase()}-Pfad</span>
                  <span style={{ color: rankOk ? "#4ade80" : "#f87171", padding: "1px 6px", borderRadius: 4, background: rankOk ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)" }}>{rankOk ? "✓" : "✗"} {rqLv} {item.stat.toUpperCase()}</span>
                </div>
              </div>
              <button className="shop-btn-hover" onClick={() => {
                const newQuest = { id: genId(), title: `Codex meistern: ${item.rule}`, category: item.stat, difficulty: item.tier === 1 ? "easy" : item.tier === 2 ? "normal" : "hard", type: "side", isCodexQuest: true, codexId: item.id, rewardStat: item.stat, createdAt: getToday(), createdAtMs: Date.now() };
                persist({ ...state, gold: state.gold - item.cost, codex: [...(state.codex || []), item.id], quests: [...state.quests, newQuest] });
                notify(`Codex gekauft! Schließe die Quest ab.`, "success");
              }} disabled={!buyable} style={{ padding: "10px 16px", borderRadius: 12, fontSize: 11, fontWeight: 800, background: buyable ? "linear-gradient(145deg, rgba(168,85,247,0.22), rgba(168,85,247,0.06))" : "rgba(255,255,255,0.02)", color: buyable ? "#c084fc" : "#475569", border: `1px solid ${buyable ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)"}`, cursor: buyable ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 5, boxShadow: buyable ? "0 4px 16px rgba(168,85,247,0.12)" : "none" }}>
                <img src="/icon/coin.png" style={{ width: 12, height: 12, opacity: buyable ? 1 : 0.3 }} alt="G" />{item.cost}
              </button>
            </div>
          );
        })}
      </div>

      {/* Unlocked */}
      {state.codex && state.codex.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingTop: 18, borderTop: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "#7c3aed" }} />
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#a855f7", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>DEIN CODEX ({state.codex.length}/{HUNTER_CODEX.length})</div>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, #7c3aed33, transparent)" }} />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {state.codex.map((id, ci) => {
              const item = HUNTER_CODEX.find(c => c.id === id);
              if (!item) return null;
              const isMastered = (state.codexMastered || []).includes(item.id);
              return (
                <div key={id} className="shop-card-hover" style={{ "--card-glow": isMastered ? "rgba(34,197,94,0.12)" : "rgba(124,58,237,0.12)", "--card-border-hover": isMastered ? "#22c55e44" : "#7c3aed44", padding: "14px 16px", borderRadius: 16, background: isMastered ? "linear-gradient(145deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))" : "linear-gradient(145deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))", borderLeft: `3px solid ${isMastered ? "#22c55e" : "#7c3aed"}`, border: `1px solid ${isMastered ? "rgba(34,197,94,0.2)" : "rgba(124,58,237,0.2)"}`, borderLeftWidth: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isMastered ? "#86efac" : "#f1f5f9", marginBottom: 4, fontFamily: "'Cinzel',serif" }}>{item.rule}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{item.desc}</div>
                  {isMastered ? (
                    <div style={{ fontSize: 9, color: "#4ade80", fontFamily: "'JetBrains Mono',monospace", marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", width: "fit-content" }}><img src={STAT_ICONS[item.stat]} alt={item.stat} style={{ width: 11, height: 11 }} /> GEMEISTERT (+1)</div>
                  ) : (
                    <div style={{ fontSize: 9, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)", width: "fit-content" }}><img src={QUEST_ICONS.daily} alt="active" style={{ width: 11, height: 11 }} /> Quest aktiv...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
