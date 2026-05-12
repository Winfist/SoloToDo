import React, { useMemo, useState } from "react";
import Modal from "./ui/Modal.jsx";
import { GEM_ICONS, NAV_ICONS } from "../data/icons.js";
import { getPremiumStatus, PREMIUM_PRODUCT } from "../data/premium.js";

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

export default function PremiumAccessModal({ open, onClose, state, theme, activatePremiumCode, notify }) {
  const [code, setCode] = useState("");
  const [inlineMessage, setInlineMessage] = useState(null);
  const premiumStatus = useMemo(() => getPremiumStatus(state?.premium), [state?.premium]);

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
    <Modal open={open} onClose={onClose} maxWidth="520px" aria-label="Hunter Pro Premium">
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(10,8,24,0.98), rgba(4,4,12,0.99))",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 16% 0%, ${theme.primary}28, transparent 34%), radial-gradient(circle at 88% 8%, rgba(168,85,247,0.2), transparent 32%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, transparent, ${theme.primary}, #a855f7, ${theme.accent}, transparent)`,
          boxShadow: `0 0 24px ${theme.primary}66`,
        }} />

        <div style={{ position: "relative", padding: "24px 22px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <PremiumBadge active={premiumStatus.active} theme={theme} />
              <h2 style={{
                margin: "12px 0 5px",
                color: "#fff",
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 900,
                fontFamily: "'Cinzel',serif",
                textShadow: `0 0 22px ${theme.glow}`,
              }}>
                {PREMIUM_PRODUCT.name}
              </h2>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                Mehr KI, mehr Auswertung, mehr Style. Die Core-App bleibt frei spielbar.
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Monatlich", price: PREMIUM_PRODUCT.monthlyPrice, note: "spaeter per In-App Purchase" },
              { label: "Jaehrlich", price: PREMIUM_PRODUCT.yearlyPrice, note: "beste Option fuer Power-User" },
            ].map(plan => (
              <div key={plan.label} style={{
                minHeight: 94,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255,255,255,0.035)",
                border: `1px solid ${theme.primary}2f`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
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

          <button
            onClick={startCheckout}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${theme.primary}, #a855f7)`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 2,
              fontFamily: "'Cinzel',serif",
              cursor: "pointer",
              boxShadow: `0 12px 32px ${theme.primary}36, inset 0 1px 0 rgba(255,255,255,0.2)`,
              marginBottom: 12,
            }}
          >
            ICH WILL HUNTER PRO
          </button>

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
