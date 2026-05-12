import React, { useMemo, useState } from "react";
import Modal from "./ui/Modal.jsx";
import { GEM_ICONS, NAV_ICONS } from "../data/icons.js";
import { getPremiumFeature, getPremiumStatus, PREMIUM_PRODUCT } from "../data/premium.js";

function PremiumBadge({ active, theme }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "6px 9px",
      borderRadius: 999,
      background: active ? "rgba(34,197,94,0.14)" : `${theme.primary}14`,
      border: `1px solid ${active ? "rgba(34,197,94,0.35)" : theme.primary + "40"}`,
      color: active ? "#4ade80" : theme.accent,
      fontSize: 9,
      fontWeight: 900,
      fontFamily: "'JetBrains Mono',monospace",
      letterSpacing: 1.4,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: active ? "#22c55e" : theme.primary,
        boxShadow: `0 0 8px ${active ? "#22c55e" : theme.primary}`,
      }} />
      {active ? "PREMIUM ACTIVE" : PREMIUM_PRODUCT.badge}
    </div>
  );
}

const PREMIUM_SIGNALS = [
  { label: "ACCESS", value: "PRO" },
  { label: "BETA PASS", value: "30D" },
  { label: "BILLING", value: "READY" },
];

export default function PremiumAccessModal({ open, onClose, state, theme, activatePremiumCode, notify, contextFeature }) {
  const [code, setCode] = useState("");
  const [inlineMessage, setInlineMessage] = useState(null);
  const premiumStatus = useMemo(() => getPremiumStatus(state?.premium), [state?.premium]);
  const feature = useMemo(() => getPremiumFeature(contextFeature), [contextFeature]);
  const accessStatus = premiumStatus.active ? "ACCESS ACTIVE" : "ACCESS LOCKED";
  const planOptions = [
    { label: "Monatlich", price: PREMIUM_PRODUCT.monthlyPrice, note: "spaeter per In-App Purchase", featured: false },
    { label: "Jaehrlich", price: PREMIUM_PRODUCT.yearlyPrice, note: "Bester Wert fuer Power-User", featured: true },
  ];

  const redeemCode = () => {
    const result = activatePremiumCode?.(code);
    if (result?.ok) {
      setCode("");
      setInlineMessage({ type: "success", text: result.message });
    } else if (result?.message) {
      setInlineMessage({ type: "warning", text: result.message });
    }
  };

  const startCheckout = () => {
    const msg = "Beta-Modus: Das echte Store-Billing wird vor dem App-Store-Release verbunden. Nutze aktuell einen Beta-Code.";
    setInlineMessage({ type: "info", text: msg });
    notify?.(msg, "info");
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="640px" aria-label="Hunter Pro Premium">
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(152deg, rgba(13,10,30,0.99), rgba(5,6,14,0.99) 48%, rgba(10,5,20,0.99))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 56px ${theme.primary}18`,
      }}>
        <style>{`
          @keyframes premiumRingSpin { to { transform: rotate(360deg); } }
          @keyframes premiumBreath { 0%, 100% { opacity: .48; transform: scale(.96); } 50% { opacity: .9; transform: scale(1.05); } }
          @keyframes premiumScan { 0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; } 30% { opacity: .75; } 100% { transform: translateX(220%) skewX(-18deg); opacity: 0; } }
          @keyframes premiumRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes premiumGridDrift { from { background-position: 0 0; } to { background-position: 44px 44px; } }
          @keyframes premiumTextShine { 0% { background-position: 0% 50%; } 100% { background-position: 180% 50%; } }
          @keyframes premiumRailPulse { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
        `}</style>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 16% 0%, ${theme.primary}30, transparent 34%), radial-gradient(circle at 88% 8%, rgba(168,85,247,0.24), transparent 32%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 38%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "premiumGridDrift 18s linear infinite",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 78%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          width: 220,
          height: 220,
          right: -76,
          top: -86,
          borderRadius: "50%",
          border: `1px solid ${theme.primary}22`,
          boxShadow: `inset 0 0 44px ${theme.primary}16, 0 0 46px rgba(168,85,247,0.14)`,
          animation: "premiumRingSpin 16s linear infinite",
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute",
            inset: 24,
            borderRadius: "50%",
            border: "1px dashed rgba(255,255,255,0.12)",
          }} />
          <div style={{
            position: "absolute",
            top: 20,
            left: "50%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: theme.accent,
            boxShadow: `0 0 18px ${theme.accent}`,
          }} />
        </div>
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, transparent, ${theme.primary}, #a855f7, ${theme.accent}, transparent)`,
          boxShadow: `0 0 24px ${theme.primary}66`,
        }} />
        <div style={{
          position: "absolute",
          left: 22,
          right: 22,
          top: 12,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.accent}66, rgba(255,255,255,0.35), ${theme.primary}66, transparent)`,
          animation: "premiumRailPulse 2.8s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", padding: "26px 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <PremiumBadge active={premiumStatus.active} theme={theme} />
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 27,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, rgba(251,191,36,0.14), rgba(168,85,247,0.12))",
                  border: "1px solid rgba(251,191,36,0.28)",
                  color: "#fde68a",
                  fontSize: 8,
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono',monospace",
                  letterSpacing: 2,
                }}>
                  PREMIUM ACCESS
                </span>
              </div>
              <div style={{
                marginTop: 12,
                color: theme.accent,
                fontSize: 9,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 3,
              }}>
                {feature.eyebrow}
              </div>
              <h2 style={{
                margin: "8px 0 5px",
                color: "transparent",
                background: `linear-gradient(90deg, #fff 0%, #fde68a 24%, ${theme.accent} 48%, #fff 72%, #c4b5fd 100%)`,
                backgroundSize: "180% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                animation: "premiumTextShine 5s linear infinite",
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 900,
                fontFamily: "'Cinzel',serif",
                textShadow: `0 0 26px ${theme.glow}`,
              }}>
                {premiumStatus.active ? PREMIUM_PRODUCT.name : feature.title}
              </h2>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                {premiumStatus.active ? "Mehr KI, mehr Auswertung, mehr Style. Die Core-App bleibt frei spielbar." : feature.desc}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Schliessen"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              x
            </button>
          </div>

          <div style={{
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(180px, 0.7fr)",
            gap: 12,
            padding: 14,
            borderRadius: 18,
            marginBottom: 14,
            background: `linear-gradient(135deg, rgba(255,255,255,0.075), ${theme.primary}12 46%, rgba(251,191,36,0.08))`,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 34px rgba(0,0,0,0.24), 0 0 34px ${theme.primary}14`,
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 42%, transparent 54%)",
              animation: "premiumScan 5.8s ease-in-out infinite",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", minWidth: 0 }}>
              <div style={{ color: "#fde68a", fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.4, marginBottom: 8 }}>
                MONARCH PASS
              </div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1.15 }}>
                {accessStatus}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>
                Ein sauberer Premium-Layer fuer Store-Kaeufe, Beta-Codes und gesperrte Pro-Module.
              </div>
            </div>
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 7 }}>
              {PREMIUM_SIGNALS.map((signal) => (
                <div key={signal.label} style={{
                  minWidth: 0,
                  padding: "9px 7px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.24)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "center",
                }}>
                  <div style={{ color: "#64748b", fontSize: 7, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.2 }}>{signal.label}</div>
                  <div style={{ color: signal.value === "READY" ? "#fde68a" : theme.accent, fontSize: 12, fontWeight: 900, marginTop: 5, fontFamily: "'JetBrains Mono',monospace" }}>{signal.value}</div>
                </div>
              ))}
            </div>
          </div>

          {premiumStatus.active && (
            <div style={{
              padding: "12px 14px",
              borderRadius: 14,
              marginBottom: 14,
              background: "rgba(34,197,94,0.09)",
              border: "1px solid rgba(34,197,94,0.24)",
              color: "#bbf7d0",
              fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1.5,
            }}>
              Hunter Pro ist aktiv bis {premiumStatus.activeUntilLabel}. Noch {premiumStatus.daysRemaining} Tage.
            </div>
          )}

          {!premiumStatus.active && (
            <div style={{
              position: "relative",
              overflow: "hidden",
              display: "grid",
              gap: 9,
              padding: 14,
              borderRadius: 16,
              marginBottom: 14,
              background: `linear-gradient(135deg, ${theme.primary}16, rgba(168,85,247,0.12))`,
              border: `1px solid ${theme.primary}35`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 28px rgba(0,0,0,0.22)`,
              animation: "premiumRise .35s ease both",
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 46,
                left: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                animation: "premiumScan 3.4s ease-in-out infinite",
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.055)",
                  border: `1px solid ${theme.primary}40`,
                  boxShadow: `0 0 22px ${theme.primary}22`,
                  animation: "premiumBreath 3s ease-in-out infinite",
                }}>
                  <img src={GEM_ICONS.gem || NAV_ICONS.shop} alt="" style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 12px ${theme.primary})` }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel',serif" }}>
                    Dieses Modul ist im Free-Modus gesperrt
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.45, marginTop: 2 }}>
                    Schalte Hunter Pro frei oder nutze in der Beta einen Code von dir.
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {feature.bullets.map((item) => (
                  <span key={item} style={{
                    padding: "6px 8px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#cbd5e1",
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            {planOptions.map(plan => (
              <div key={plan.label} style={{
                position: "relative",
                overflow: "hidden",
                minHeight: 94,
                padding: 14,
                borderRadius: 14,
                background: plan.featured ? `linear-gradient(145deg, ${theme.primary}18, rgba(251,191,36,0.08), rgba(255,255,255,0.035))` : "rgba(255,255,255,0.035)",
                border: `1px solid ${plan.featured ? "rgba(251,191,36,0.32)" : theme.primary + "2f"}`,
                boxShadow: plan.featured ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 28px ${theme.primary}16` : "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
                {plan.featured && (
                  <div style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    padding: "4px 7px",
                    borderRadius: 999,
                    background: "rgba(251,191,36,0.13)",
                    border: "1px solid rgba(251,191,36,0.26)",
                    color: "#fde68a",
                    fontSize: 7,
                    fontWeight: 900,
                    fontFamily: "'JetBrains Mono',monospace",
                    letterSpacing: 1,
                  }}>
                    BESTER WERT
                  </div>
                )}
                <div style={{ fontSize: 9, color: theme.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>
                  {plan.label.toUpperCase()}
                </div>
                <div style={{ color: "#fff", fontSize: 17, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1.15 }}>
                  {plan.price}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 7, lineHeight: 1.35 }}>
                  {plan.note}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "FREE", value: "Core Leveling", sub: "Quests, Habits, Streaks" },
              { label: "PRO", value: "Full System", sub: "AI, Analytics, VFX" },
            ].map((tier) => (
              <div key={tier.label} style={{
                padding: "11px 12px",
                borderRadius: 13,
                background: tier.label === "PRO" ? `${theme.primary}14` : "rgba(255,255,255,0.025)",
                border: `1px solid ${tier.label === "PRO" ? theme.primary + "38" : "rgba(255,255,255,0.06)"}`,
              }}>
                <div style={{ color: tier.label === "PRO" ? theme.accent : "#64748b", fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>{tier.label}</div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, marginTop: 5 }}>{tier.value}</div>
                <div style={{ color: "#64748b", fontSize: 9, marginTop: 3 }}>{tier.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
            {PREMIUM_PRODUCT.benefits.map((benefit, index) => (
              <div key={benefit.title} style={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0, 1fr)",
                gap: 10,
                alignItems: "start",
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.055)",
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${theme.primary}18`,
                  border: `1px solid ${theme.primary}30`,
                  color: theme.accent,
                  fontWeight: 900,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono',monospace",
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 800 }}>{benefit.title}</div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.45, marginTop: 2 }}>{benefit.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: "relative", overflow: "hidden", borderRadius: 15, marginBottom: 12, boxShadow: `0 15px 34px ${theme.primary}36, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
            <div style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 70,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
              animation: "premiumScan 3.9s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 1,
            }} />
            <button
              onClick={startCheckout}
              style={{
                position: "relative",
                width: "100%",
                minHeight: 52,
                borderRadius: 15,
                border: "1px solid rgba(255,255,255,0.16)",
                background: `linear-gradient(135deg, ${theme.primary}, #a855f7 52%, #f59e0b)`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2.4,
                fontFamily: "'Cinzel',serif",
                cursor: "pointer",
              }}
            >
              HUNTER PRO AKTIVIEREN
            </button>
          </div>

          <div style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(0,0,0,0.26)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src={GEM_ICONS.gem || NAV_ICONS.shop} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 12, color: "#e9d5ff", fontWeight: 900 }}>Beta-Code einloesen</div>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
                  Gibt in der Beta 30 Tage Premium frei.
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8 }}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") redeemCode(); }}
                placeholder="ARISE-BETA-30"
                autoCapitalize="characters"
                spellCheck={false}
                style={{
                  minWidth: 0,
                  height: 42,
                  borderRadius: 12,
                  border: `1px solid ${theme.primary}33`,
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  padding: "0 12px",
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace",
                  outline: "none",
                }}
              />
              <button
                onClick={redeemCode}
                style={{
                  minWidth: 96,
                  height: 42,
                  borderRadius: 12,
                  border: `1px solid ${theme.primary}55`,
                  background: `${theme.primary}18`,
                  color: theme.accent,
                  fontSize: 10,
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono',monospace",
                  cursor: "pointer",
                }}
              >
                AKTIVIEREN
              </button>
            </div>

            {inlineMessage && (
              <div style={{
                marginTop: 10,
                padding: "9px 10px",
                borderRadius: 10,
                background: inlineMessage.type === "success" ? "rgba(34,197,94,0.1)" : inlineMessage.type === "warning" ? "rgba(239,68,68,0.1)" : `${theme.primary}12`,
                border: `1px solid ${inlineMessage.type === "success" ? "rgba(34,197,94,0.25)" : inlineMessage.type === "warning" ? "rgba(239,68,68,0.24)" : theme.primary + "26"}`,
                color: inlineMessage.type === "success" ? "#86efac" : inlineMessage.type === "warning" ? "#fca5a5" : "#cbd5e1",
                fontSize: 10,
                lineHeight: 1.45,
              }}>
                {inlineMessage.text}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, fontSize: 9, color: "#475569", lineHeight: 1.5, fontFamily: "'JetBrains Mono',monospace" }}>
            Store-Hinweis: Vor dem Release wird der Button mit Apple In-App Purchase und Google Play Billing verbunden. Beta-Codes sind nur fuer Testaccounts gedacht.
          </div>
        </div>
      </div>
    </Modal>
  );
}
