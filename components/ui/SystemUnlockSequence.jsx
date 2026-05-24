import React, { useEffect, useMemo, useRef, useState } from "react";

const STYLE_ID = "system-unlock-sequence-fx";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
@keyframes susFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes susPortal { 0% { transform: scale(.72) rotate(0deg); opacity: .35; } 55% { opacity: 1; } 100% { transform: scale(1.08) rotate(180deg); opacity: .9; } }
@keyframes susScan { 0% { transform: translateY(-120%); opacity: 0; } 18% { opacity: .85; } 100% { transform: translateY(120%); opacity: 0; } }
@keyframes susCardIn { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes susPulse { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) {
  .sus-animated { animation: none !important; transition: none !important; }
}
`;
  document.head.appendChild(style);
}

function featureCopy(feature) {
  if (!feature) return { label: "System", desc: "Modul aktiviert" };
  return {
    label: feature.label || feature.key || "System",
    desc: feature.desc || "Neues Modul freigeschaltet",
  };
}

export default function SystemUnlockSequence({ tier, features = [], message, onComplete }) {
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);
  const visibleFeatures = useMemo(() => features.slice(0, 6).map(featureCopy), [features]);
  const extraCount = Math.max(0, features.length - visibleFeatures.length);
  const title = message?.title || `TIER ${tier || "?"} UNLOCK`;
  const lines = message?.lines?.length ? message.lines : ["Neue Systemmodule wurden freigeschaltet.", "Initialisierung abgeschlossen."];

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase(3);
      const done = setTimeout(complete, 3600);
      return () => clearTimeout(done);
    }

    const timers = [
      setTimeout(() => setPhase(1), 550),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2700),
      setTimeout(complete, 7600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === "Escape") complete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System unlock sequence"
      className="sus-animated"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10010,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        color: "#e2e8f0",
        background: "radial-gradient(circle at 50% 22%, rgba(99,102,241,0.28), transparent 34%), linear-gradient(180deg, rgba(2,6,23,0.96), rgba(5,3,16,0.99))",
        overflow: "hidden",
        animation: "susFadeIn .35s ease both",
      }}
    >
      <div className="sus-animated" style={{ position: "absolute", width: "min(92vw, 620px)", aspectRatio: "1", borderRadius: "50%", border: "1px solid rgba(99,102,241,.22)", boxShadow: "0 0 110px rgba(99,102,241,.18)", animation: "susPortal 5.5s cubic-bezier(.22,1,.36,1) infinite alternate", pointerEvents: "none" }} />
      <div className="sus-animated" style={{ position: "absolute", inset: "-20% 0", background: "linear-gradient(180deg, transparent 0%, rgba(34,211,238,.18) 48%, rgba(255,255,255,.18) 50%, rgba(34,211,238,.12) 52%, transparent 100%)", animation: "susScan 3.6s linear infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,.025), rgba(255,255,255,.025) 1px, transparent 1px, transparent 7px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1, textAlign: "center" }}>
        <div className="sus-animated" style={{ margin: "0 auto 18px", width: 84, height: 84, borderRadius: 999, display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(34,211,238,.24), rgba(99,102,241,.1) 56%, transparent)", border: "1px solid rgba(125,211,252,.45)", boxShadow: "0 0 42px rgba(34,211,238,.28), inset 0 0 28px rgba(99,102,241,.18)", animation: "susPulse 2s ease-in-out infinite" }}>
          <span style={{ fontSize: 11, letterSpacing: 2, color: "#7dd3fc", fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>TIER</span>
          <span style={{ fontSize: 30, lineHeight: 1, color: "#fff", fontWeight: 900, fontFamily: "'Cinzel',serif", textShadow: "0 0 18px rgba(125,211,252,.75)" }}>{tier || "?"}</span>
        </div>

        <div style={{ fontSize: 10, letterSpacing: 4, color: "#38bdf8", fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, marginBottom: 10 }}>
          SYSTEM UPDATE BESTAETIGT
        </div>
        <h2 style={{ margin: 0, color: "#fff", fontSize: "clamp(30px, 8vw, 54px)", lineHeight: 1.02, fontFamily: "'Cinzel',serif", fontWeight: 900, textShadow: "0 0 32px rgba(99,102,241,.55)" }}>
          {title}
        </h2>

        <div style={{ margin: "22px auto 20px", maxWidth: 460, textAlign: "left", display: "grid", gap: 8 }}>
          {lines.slice(0, phase >= 2 ? 4 : 2).map((line, index) => (
            <div key={`${line}-${index}`} className="sus-animated" style={{ display: "flex", gap: 9, alignItems: "flex-start", color: index === 0 ? "#e0f2fe" : "#94a3b8", fontSize: 12, lineHeight: 1.55, fontFamily: "'JetBrains Mono',monospace", animation: `susCardIn .45s ${index * 90}ms ease both` }}>
              <span style={{ color: "#38bdf8", flexShrink: 0 }}>{">"}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 10, marginBottom: 22 }}>
          {visibleFeatures.map((feature, index) => (
            <div key={`${feature.label}-${index}`} className="sus-animated" style={{ minHeight: 104, padding: "14px 12px", borderRadius: 14, background: "linear-gradient(160deg, rgba(15,23,42,.86), rgba(30,27,75,.54))", border: "1px solid rgba(125,211,252,.18)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 12px 32px rgba(2,6,23,.38)", textAlign: "left", animation: phase >= 1 ? `susCardIn .5s ${index * 90}ms ease both` : "none", opacity: phase >= 1 ? 1 : 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", marginBottom: 10, background: "rgba(56,189,248,.12)", border: "1px solid rgba(56,189,248,.28)", color: "#7dd3fc", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>
                {String(feature.label).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1.15, marginBottom: 5 }}>
                {feature.label}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.4 }}>
                {feature.desc}
              </div>
            </div>
          ))}
          {extraCount > 0 && (
            <div className="sus-animated" style={{ minHeight: 104, padding: "14px 12px", borderRadius: 14, background: "rgba(34,211,238,.08)", border: "1px dashed rgba(125,211,252,.32)", display: "grid", placeItems: "center", color: "#7dd3fc", fontSize: 12, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", animation: phase >= 1 ? "susCardIn .5s ease both" : "none", opacity: phase >= 1 ? 1 : 0 }}>
              +{extraCount} MODULE
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={complete}
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid rgba(125,211,252,.45)",
            background: phase >= 3 ? "linear-gradient(135deg, rgba(14,165,233,.28), rgba(99,102,241,.24))" : "rgba(15,23,42,.62)",
            color: phase >= 3 ? "#f8fafc" : "#7dd3fc",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: 3,
            fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace",
            boxShadow: phase >= 3 ? "0 0 26px rgba(56,189,248,.18), inset 0 1px 0 rgba(255,255,255,.12)" : "none",
          }}
        >
          {phase >= 3 ? "FORTFAHREN" : "INITIALISIERUNG LAEUFT"}
        </button>
      </div>
    </div>
  );
}
