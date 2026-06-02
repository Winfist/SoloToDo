import React, { useState } from "react";
import { NAV_ICONS, STAT_ICONS } from "../data/icons";
import { getToday } from "../data/dateUtils.js";

// ═══════════════════════════════════════════════════════════════
// SOUL LINK VIEW
// Connect with a partner via 6-char code for accountability
// ═══════════════════════════════════════════════════════════════

export default function SoulLinkView({
  state, theme,
  createSoulLinkCode, joinSoulLinkCode, breakSoulLinkCode, sendReviveToPartner,
  onClose
}) {
  const [codeInput, setCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const soulLink = state?.soulLink || {};
  const isLinked = !!soulLink.linkCode;
  const today = getToday();
  const bothActive = soulLink.bothActive;

  const t = theme || { primary: "#22d3ee", accent: "#67e8f9", card: "rgba(10,10,22,0.88)", glow: "rgba(34,211,238,0.35)" };

  const handleCreate = async () => {
    setLoading(true);
    const code = await createSoulLinkCode();
    if (code) setGeneratedCode(code);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (codeInput.trim().length < 4) return;
    setLoading(true);
    await joinSoulLinkCode(codeInput.trim().toUpperCase());
    setLoading(false);
    setCodeInput("");
  };

  const handleBreak = async () => {
    if (!window.confirm("Soul Link wirklich trennen?")) return;
    await breakSoulLinkCode();
  };

  const handleRevive = async () => {
    await sendReviveToPartner();
  };

  return (
    <div data-tutorial="soullink-view" style={{
      position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.92)",
      display: "flex", flexDirection: "column", alignItems: "center",
      overflowY: "auto", padding: "1.5rem 1rem", fontFamily: "'Courier New', monospace"
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: t.primary, textTransform: "uppercase", opacity: 0.7 }}>
              SYSTEM FEATURE
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: t.primary, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
              <img src={NAV_ICONS.guild} alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 6px ${t.primary}88)` }} /> SOUL LINK
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            color: "#9ca3af", padding: "0.4rem 0.8rem", borderRadius: "6px",
            cursor: "pointer", fontSize: "0.75rem"
          }}>✕ SCHLIESSEN</button>
        </div>

        {!isLinked ? (
          <>
            {/* Explanation */}
            <div style={{
              background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem"
            }}>
              <div style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Verbinde dich mit einem Partner. Ihr seht gegenseitig Streak und Quest-Status.
                Wenn <strong style={{ color: t.primary }}>beide heute aktiv</strong> sind, erhaltet ihr <strong style={{ color: "#fbbf24" }}>+25% XP</strong>.
                Dein Partner kann deinen Streak mit einem <strong style={{ color: "#f472b6" }}>Revive</strong> retten.
              </div>
            </div>

            {/* Create Code */}
            <div style={{
              background: t.card, border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px", padding: "1.25rem", marginBottom: "1rem"
            }}>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                Code erstellen
              </div>
              {generatedCode ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>Dein Code:</div>
                  <div style={{
                    fontSize: "2rem", fontWeight: 900, letterSpacing: "0.4em",
                    color: t.primary, background: "rgba(0,0,0,0.5)", borderRadius: "8px",
                    padding: "0.5rem 1rem", display: "inline-block",
                    border: `1px solid ${t.primary}40`
                  }}>{generatedCode}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
                    Teile diesen Code mit deinem Partner
                  </div>
                </div>
              ) : (
                <button onClick={handleCreate} disabled={loading} style={{
                  width: "100%", padding: "0.75rem",
                  background: `linear-gradient(135deg, ${t.primary}30, ${t.primary}15)`,
                  border: `1px solid ${t.primary}60`, borderRadius: "8px",
                  color: t.primary, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.85rem", letterSpacing: "0.1em", opacity: loading ? 0.5 : 1
                }}>
                  {loading ? "ERSTELLE..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src={NAV_ICONS.guild} alt="" style={{ width: 14, height: 14, objectFit: "contain", filter: "brightness(0.9)" }} /> CODE GENERIEREN</span>}
                </button>
              )}
            </div>

            {/* Join with Code */}
            <div style={{
              background: t.card, border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px", padding: "1.25rem"
            }}>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                Code eingeben
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  style={{
                    flex: 1, padding: "0.6rem 0.8rem",
                    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px", color: "#e2e8f0", fontSize: "1rem",
                    letterSpacing: "0.3em", textTransform: "uppercase",
                    fontFamily: "'Courier New', monospace", outline: "none"
                  }}
                />
                <button onClick={handleJoin} disabled={loading || codeInput.length < 4} style={{
                  padding: "0.6rem 1rem",
                  background: codeInput.length >= 4 ? `${t.primary}30` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${codeInput.length >= 4 ? t.primary + "60" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "6px", color: codeInput.length >= 4 ? t.primary : "#6b7280",
                  cursor: codeInput.length >= 4 ? "pointer" : "not-allowed",
                  fontWeight: 700, fontSize: "0.8rem"
                }}>
                  {loading ? "..." : "VERBINDEN"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Both Active Indicator */}
            {bothActive && (
              <div style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,85,247,0.15))",
                border: "1px solid rgba(34,211,238,0.5)", borderRadius: "10px",
                padding: "0.75rem 1rem", marginBottom: "1rem", textAlign: "center",
                animation: "pulse-link 2s ease-in-out infinite"
              }}>
                <style>{`@keyframes pulse-link { 0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0.3)} 50%{box-shadow:0 0 0 8px rgba(34,211,238,0)} }`}</style>
                <span style={{ color: t.primary, fontWeight: 700, fontSize: "0.85rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src={STAT_ICONS.agi} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /> BEIDE AKTIV — +25% XP BONUS AKTIV</span>
                </span>
              </div>
            )}

            {/* Link Code display */}
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ color: "#9ca3af", fontSize: "0.7rem", marginBottom: "0.3rem" }}>EUER CODE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.4em", color: t.primary }}>
                {soulLink.linkCode}
              </div>
            </div>

            {/* Partner Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {/* You */}
              <div style={{
                background: t.card, border: `1px solid ${t.primary}40`,
                borderRadius: "10px", padding: "1rem", textAlign: "center"
              }}>
                <div style={{ color: "#6b7280", fontSize: "0.65rem", marginBottom: "0.5rem" }}>DU</div>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  {state.hunterName || "Hunter"}
                </div>
                <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  Lv. {state.level || 1}
                </div>
                <div style={{
                  color: state.lastActiveDate === today ? "#22c55e" : "#6b7280",
                  fontSize: "1.25rem", fontWeight: 700
                }}>
                  <img src={STAT_ICONS.str} alt="" style={{ width: 18, height: 18, objectFit: "contain", filter: "drop-shadow(0 0 4px #22c55e)", marginRight: 4, verticalAlign: "middle" }} /> {state.streak || 0}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.65rem", marginTop: "0.25rem" }}>
                  {state.lastActiveDate === today ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><img src="/icons/quest_s.webp" alt="" style={{ width: 10, height: 10, objectFit: "contain" }} /> Heute aktiv</span> : "Noch inaktiv"}
                </div>
              </div>

              {/* Partner */}
              <div style={{
                background: t.card,
                border: `1px solid ${soulLink.partnerLastActive === today ? "#a855f7" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px", padding: "1rem", textAlign: "center"
              }}>
                <div style={{ color: "#6b7280", fontSize: "0.65rem", marginBottom: "0.5rem" }}>PARTNER</div>
                {soulLink.partnerName ? (
                  <>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                      {soulLink.partnerName}
                    </div>
                    <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      Lv. {soulLink.partnerLevel || 1}
                    </div>
                    <div style={{
                      color: soulLink.partnerLastActive === today ? "#a855f7" : "#6b7280",
                      fontSize: "1.25rem", fontWeight: 700
                    }}>
                      <img src={STAT_ICONS.str} alt="" style={{ width: 18, height: 18, objectFit: "contain", filter: "drop-shadow(0 0 4px #a855f7)", marginRight: 4, verticalAlign: "middle" }} /> {soulLink.partnerStreak || 0}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.65rem", marginTop: "0.25rem" }}>
                      {soulLink.partnerLastActive === today ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><img src="/icons/quest_s.webp" alt="" style={{ width: 10, height: 10, objectFit: "contain" }} /> Heute aktiv</span> : "Noch inaktiv"}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "1rem" }}>
                    Wartet auf Partner...
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {soulLink.partnerName && (
              <button onClick={handleRevive} disabled={(soulLink.revivesLeft || 0) <= 0} style={{
                width: "100%", padding: "0.75rem", marginBottom: "0.75rem",
                background: (soulLink.revivesLeft || 0) > 0 ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${(soulLink.revivesLeft || 0) > 0 ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "8px", color: (soulLink.revivesLeft || 0) > 0 ? "#f472b6" : "#6b7280",
                cursor: (soulLink.revivesLeft || 0) > 0 ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: "0.85rem"
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src={STAT_ICONS.vit} alt="" style={{ width: 14, height: 14, objectFit: "contain", filter: "drop-shadow(0 0 4px #f472b6)" }} /> STREAK-REVIVE SENDEN ({soulLink.revivesLeft || 0} verbleibend)</span>
              </button>
            )}

            <button onClick={handleBreak} style={{
              width: "100%", padding: "0.6rem",
              background: "transparent", border: "1px solid rgba(100,100,100,0.3)",
              borderRadius: "8px", color: "#6b7280", cursor: "pointer", fontSize: "0.75rem"
            }}>
              SOUL LINK TRENNEN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
