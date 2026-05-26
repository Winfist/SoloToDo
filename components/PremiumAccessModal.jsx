import React, { useMemo, useState } from "react";
import Modal from "./ui/Modal.jsx";
import { getLocalizedPremiumFeature, getLocalizedPremiumProduct, getPremiumStatus, PREMIUM_PRODUCT } from "../data/premium.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { openLegalPage } from "../services/legalLinks.js";

const SUCCESS = "#34d399";

// Pick a foreground that stays legible on any theme accent.
function readableOn(hex) {
  const c = String(hex || "").replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0a0b11" : "#ffffff";
}

function MarkIcon({ color = "#fff", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l7-6 7 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 17.5l7-6 7 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

function CheckIcon({ color = "#fff", size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ color = "#94a3b8", size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" stroke={color} strokeWidth="1.8" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ color = "#94a3b8", size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#475569", flexShrink: 0 }} />;
}

const HOVER_STYLES = `
  .hp-cta { transition: filter .15s ease, transform .1s ease; }
  .hp-cta:hover { filter: brightness(1.06); }
  .hp-cta:active { transform: translateY(1px); }
  .hp-plan { transition: border-color .15s ease, background .15s ease, box-shadow .15s ease, transform .1s ease; }
  .hp-plan:active { transform: translateY(1px); }
  .hp-close { transition: background .15s ease, color .15s ease; }
  .hp-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  .hp-link { background: none; border: none; padding: 0; font: inherit; cursor: pointer; transition: color .15s ease; }
  .hp-link:hover { color: #cbd5e1 !important; }
  .hp-redeem { transition: background .15s ease; }
  .hp-redeem:hover { filter: brightness(1.12); }
`;

export default function PremiumAccessModal({ open, onClose, state, theme, activatePremiumCode, notify, contextFeature }) {
  const { t, locale } = useI18n();
  const [code, setCode] = useState("");
  const [inlineMessage, setInlineMessage] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [betaOpen, setBetaOpen] = useState(false);

  const premiumStatus = useMemo(() => getPremiumStatus(state?.premium), [state?.premium]);
  const premiumProduct = useMemo(() => getLocalizedPremiumProduct(locale), [locale]);
  const feature = useMemo(() => getLocalizedPremiumFeature(contextFeature, locale), [contextFeature, locale]);

  const accent = theme?.primary || "#22d3ee";
  const accentFg = useMemo(() => readableOn(accent), [accent]);
  const isActive = premiumStatus.active;
  const showContext = !!contextFeature && contextFeature !== "premium_store" && !isActive;

  const benefits = useMemo(() => ([
    { title: t("premium.benefitUnlimited.title"), desc: t("premium.benefitUnlimited.desc") },
    ...(premiumProduct.benefits || []),
  ]), [premiumProduct, t]);

  const plans = [
    {
      id: "yearly",
      label: t("premium.planYearly"),
      price: PREMIUM_PRODUCT.yearlyAmount,
      unit: t("premium.perYear"),
      note: t("premium.billedYearly", { perMonth: PREMIUM_PRODUCT.yearlyPerMonth }),
      save: PREMIUM_PRODUCT.yearlySavings,
    },
    {
      id: "monthly",
      label: t("premium.planMonthly"),
      price: PREMIUM_PRODUCT.monthlyAmount,
      unit: t("premium.perMonth"),
      note: t("premium.planMonthlyNote"),
      save: null,
    },
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
    const msg = t("premium.checkoutInfo");
    setInlineMessage({ type: "info", text: msg });
    notify?.(msg, "info");
  };

  const showBetaInfo = () => setInlineMessage({ type: "info", text: t("premium.checkoutInfo") });

  const numeric = { fontVariantNumeric: "tabular-nums" };

  const messageColors = {
    success: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.28)", text: "#bbf7d0" },
    warning: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", text: "#fca5a5" },
    info: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", text: "#cbd5e1" },
  };

  const linkStyle = { fontSize: 11, color: "#64748b", textDecoration: "underline", textUnderlineOffset: "2px" };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="448px"
      aria-label="Hunter Pro"
      style={{
        background: "#0b0c12",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
      }}
    >
      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-xl)",
        background: "linear-gradient(180deg, #0f1018 0%, #0a0b11 56%)",
        color: "#f1f5f9",
        fontFamily: "var(--font-sans, 'Outfit', system-ui, sans-serif)",
      }}>
        <style>{HOVER_STYLES}</style>
        {/* one soft, static highlight behind the header */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 132,
          background: `radial-gradient(120% 100% at 50% 0%, ${accent}16, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", padding: "24px 22px 22px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(150deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                <MarkIcon color={accent} size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: "#f8fafc", lineHeight: 1.1 }}>
                  {premiumProduct.name}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? SUCCESS : "#8b97a8" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? SUCCESS : "#8b97a8" }}>
                    {isActive ? t("premium.activeLabel") : t("premium.freeLabel")}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="hp-close"
              onClick={onClose}
              aria-label={t("common.close")}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Hero */}
          {isActive ? (
            <div style={{
              display: "flex",
              gap: 11,
              alignItems: "center",
              padding: "13px 14px",
              borderRadius: 13,
              marginBottom: 22,
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.28)",
            }}>
              <span style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(52,211,153,0.18)",
              }}>
                <CheckIcon color={SUCCESS} size={13} />
              </span>
              <div style={{ fontSize: 12.5, color: "#bbf7d0", lineHeight: 1.4, ...numeric }}>
                {t("premium.activeUntil", { date: premiumStatus.activeUntilLabel, days: premiumStatus.daysRemaining })}
              </div>
            </div>
          ) : (
            <>
              {showContext && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 11,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: `${accent}16`,
                  border: `1px solid ${accent}30`,
                }}>
                  <LockIcon color={accent} size={11} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: accent }}>
                    {t("premium.contextLocked")}
                  </span>
                </div>
              )}
              <h2 style={{ margin: "0 0 9px", fontSize: 25, lineHeight: 1.18, fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" }}>
                {showContext ? feature.title : t("premium.heroTitle")}
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 13.5, lineHeight: 1.55, color: "#94a3b8" }}>
                {showContext ? feature.desc : t("premium.heroSubtitle")}
              </p>
            </>
          )}

          {/* Benefits */}
          <div style={{ marginBottom: isActive ? 4 : 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", marginBottom: 15 }}>
              {isActive ? t("premium.benefitsActiveTitle") : t("premium.benefitsTitle")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {benefits.map((b) => (
                <div key={b.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    marginTop: 1,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    background: `${accent}1f`,
                    border: `1px solid ${accent}3d`,
                  }}>
                    <CheckIcon color={accent} size={12} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e8edf3", lineHeight: 1.3 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: "#8b97a8", lineHeight: 1.45, marginTop: 2 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plans + checkout (locked only) */}
          {!isActive && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0 20px" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {plans.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className="hp-plan"
                      onClick={() => setSelectedPlan(plan.id)}
                      aria-pressed={selected}
                      style={{
                        position: "relative",
                        textAlign: "left",
                        padding: "14px 14px 15px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: selected ? `${accent}14` : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${selected ? accent : "rgba(255,255,255,0.1)"}`,
                        boxShadow: selected ? `0 0 0 3px ${accent}1f` : "none",
                        color: "#f1f5f9",
                      }}
                    >
                      {plan.save && (
                        <span style={{
                          position: "absolute",
                          top: 13,
                          right: 13,
                          padding: "3px 7px",
                          borderRadius: 999,
                          background: `${accent}26`,
                          color: accent,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.01em",
                          ...numeric,
                        }}>
                          {plan.save}
                        </span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          border: `1.5px solid ${selected ? accent : "rgba(255,255,255,0.28)"}`,
                        }}>
                          {selected && <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent }} />}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{plan.label}</span>
                      </div>
                      <div style={{ marginTop: 11 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc", whiteSpace: "nowrap", ...numeric }}>{plan.price}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{plan.unit}</div>
                      </div>
                      <div style={{ marginTop: 5, fontSize: 10.5, color: "#64748b", lineHeight: 1.35, minHeight: 28, ...numeric }}>
                        {plan.note}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                className="hp-cta"
                onClick={startCheckout}
                style={{
                  width: "100%",
                  minHeight: 52,
                  borderRadius: 14,
                  border: "none",
                  background: accent,
                  color: accentFg,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  boxShadow: `0 6px 16px ${accent}24`,
                }}
              >
                {t("premium.ctaUnlock")}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8, marginTop: 13, color: "#64748b", fontSize: 11 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <LockIcon color="#64748b" size={12} />
                  {t("premium.cancelAnytime")}
                </span>
                <Dot />
                <span>{t("premium.securedBy")}</span>
              </div>
            </>
          )}

          {/* Footer: beta code + legal */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {!betaOpen ? (
              <button
                type="button"
                className="hp-link"
                onClick={() => setBetaOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 12.5, fontWeight: 600 }}
              >
                {t("premium.betaToggle")}
                <ChevronIcon color={accent} size={14} />
              </button>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>
                  {t("premium.betaTitle")}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 11, lineHeight: 1.45 }}>
                  {t("premium.betaHint")}
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
                      height: 44,
                      borderRadius: 11,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      padding: "0 13px",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      letterSpacing: "0.04em",
                      outline: "none",
                    }}
                  />
                  <button
                    className="hp-redeem"
                    onClick={redeemCode}
                    style={{
                      minWidth: 96,
                      height: 44,
                      borderRadius: 11,
                      border: `1px solid ${accent}55`,
                      background: `${accent}1a`,
                      color: accent,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t("premium.redeem")}
                  </button>
                </div>
              </div>
            )}

            {inlineMessage && (
              <div style={{
                marginTop: 13,
                padding: "9px 11px",
                borderRadius: 10,
                fontSize: 11.5,
                lineHeight: 1.45,
                background: messageColors[inlineMessage.type]?.bg,
                border: `1px solid ${messageColors[inlineMessage.type]?.border}`,
                color: messageColors[inlineMessage.type]?.text,
              }}>
                {inlineMessage.text}
              </div>
            )}

            <p style={{ margin: "16px 0 0", fontSize: 11, lineHeight: 1.5, color: "#5b6776" }}>
              {isActive ? t("premium.manageNote") : t("premium.legalNote")}
            </p>

            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 11 }}>
              <button type="button" className="hp-link" onClick={() => openLegalPage("terms")} style={linkStyle}>{t("premium.terms")}</button>
              <Dot />
              <button type="button" className="hp-link" onClick={() => openLegalPage("privacy")} style={linkStyle}>{t("premium.privacy")}</button>
              <Dot />
              <button type="button" className="hp-link" onClick={showBetaInfo} style={linkStyle}>{t("premium.restore")}</button>
            </div>

            <p style={{ margin: "13px 0 0", fontSize: 10.5, lineHeight: 1.5, color: "#475569" }}>
              {t("premium.storeNote")}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
