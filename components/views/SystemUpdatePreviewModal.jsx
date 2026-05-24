import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  GATE_ICONS,
  HABIT_ICONS,
  HEALTH_ICONS,
  ITEM_ICONS,
  NAV_ICONS,
  QUEST_ICONS,
  SHADOW_ICONS,
  STORY_ICONS,
} from "../../data/icons.js";

const STYLE_ID = "system-update-preview-fx";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
@keyframes supFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes supLift { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes supSweep { 0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; } 26% { opacity: .75; } 100% { transform: translateX(520%) skewX(-18deg); opacity: 0; } }
@keyframes supRing { 0%, 100% { transform: rotate(0deg) scale(1); opacity: .65; } 50% { transform: rotate(180deg) scale(1.04); opacity: 1; } }
@keyframes supOrbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .sup-animated { animation: none !important; transition: none !important; }
}
`;
  document.head.appendChild(style);
}

const FEATURE_ICONS = {
  achievements: NAV_ICONS.achievements,
  ai_coach: NAV_ICONS.analytics,
  ai_dynamic_quests: QUEST_ICONS.hidden,
  ai_quest_desc: QUEST_ICONS.daily,
  ai_task_scan: QUEST_ICONS.daily,
  ai_verification: QUEST_ICONS.daily,
  analytics: NAV_ICONS.analytics,
  calendar: NAV_ICONS.dashboard,
  challenges: NAV_ICONS.events,
  chained_quests: QUEST_ICONS.chain,
  charisma_dungeons: NAV_ICONS.guild,
  codex: STORY_ICONS.scroll,
  dawn_dusk: STORY_ICONS.dawn,
  dungeons: GATE_ICONS.normal,
  emergency_quests: QUEST_ICONS.emergency,
  equipment: ITEM_ICONS.blade,
  focus_mode: NAV_ICONS.timer,
  formations: SHADOW_ICONS.commander,
  gem_shop: ITEM_ICONS.potion,
  goals: NAV_ICONS.goals,
  habit_tracker: HABIT_ICONS.health,
  hidden_quests: QUEST_ICONS.hidden,
  jobs: NAV_ICONS.jobs,
  micro_habits: HABIT_ICONS.counter,
  multiplayer: NAV_ICONS.guild,
  music: NAV_ICONS.timer,
  named_shadows: SHADOW_ICONS.igris,
  quest_filters: QUEST_ICONS.daily,
  sanctum: HEALTH_ICONS.sleep,
  seasons: NAV_ICONS.events,
  shadow_army: SHADOW_ICONS.soldier,
  shop: NAV_ICONS.shop,
  soul_link: NAV_ICONS.guild,
  story: STORY_ICONS.scroll,
  training_tab: NAV_ICONS.goals,
  vision_board: STORY_ICONS.systeminit,
  weekly_quests: QUEST_ICONS.weekly,
};

function getFeatureIcon(feature) {
  return FEATURE_ICONS[feature?.key] || GATE_ICONS.normal;
}

function MicroPreview({ feature, index, accent }) {
  const icon = getFeatureIcon(feature);
  return (
    <div
      className="sup-animated"
      style={{
        minHeight: 128,
        padding: "14px",
        borderRadius: 14,
        background: "linear-gradient(160deg, rgba(15,23,42,0.92), rgba(30,41,59,0.64))",
        border: `1px solid ${accent}24`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 14px 30px ${accent}10`,
        position: "relative",
        overflow: "hidden",
        animation: `supLift .45s ${index * 70}ms ease both`,
      }}
    >
      <div className="sup-animated" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 64, background: `linear-gradient(90deg, transparent, ${accent}1c, transparent)`, animation: "supSweep 4s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: `${accent}14`, border: `1px solid ${accent}33`, flexShrink: 0 }}>
          <img src={icon} alt="" style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 8px ${accent}88) brightness(1.14)` }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1.15, marginBottom: 5 }}>
            {feature.label}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.45 }}>
            {feature.desc}
          </div>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
        {[42, 74, 58].map((value, barIndex) => (
          <div key={barIndex} style={{ height: 24, borderRadius: 7, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.045)", display: "flex", alignItems: "flex-end", padding: 3 }}>
            <div style={{ width: "100%", height: `${value}%`, borderRadius: 5, background: `linear-gradient(180deg, ${accent}, ${accent}66)`, boxShadow: `0 0 10px ${accent}44` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemUpdatePreviewModal({ state, theme, nextLevel, unlocks = [], onClose }) {
  const accent = theme?.primary || "#6366f1";
  const currentLevel = Math.max(1, Number(state?.level) || 1);
  const progress = nextLevel ? Math.min(100, Math.round((currentLevel / nextLevel) * 100)) : 100;
  const hasUnlocks = unlocks.length > 0;

  const summary = useMemo(() => {
    if (!nextLevel) {
      return {
        eyebrow: "ALLE SYSTEME ONLINE",
        title: "Systemarchiv vollstaendig",
        body: "Du hast alle aktuellen Systemmodule erreicht. Neue Updates erscheinen hier, sobald das System erweitert wird.",
      };
    }
    return {
      eyebrow: `LEVEL ${nextLevel} UPDATE`,
      title: "Vorschau auf dein naechstes System",
      body: "Diese Module werden freigeschaltet, sobald du das Ziel-Level erreichst. Die echte Sequenz startet erst beim Level-Up.",
    };
  }, [nextLevel]);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System update preview"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      className="sup-animated"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10020,
        padding: "max(18px, env(safe-area-inset-top)) 16px 18px",
        background: "rgba(2,6,23,.78)",
        backdropFilter: "blur(18px) saturate(1.15)",
        WebkitBackdropFilter: "blur(18px) saturate(1.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "supFade .24s ease both",
      }}
    >
      <div
        className="sup-animated"
        style={{
          width: "min(100%, 720px)",
          maxHeight: "calc(100vh - 36px)",
          overflowX: "hidden",
          overflowY: "auto",
          borderRadius: 22,
          background: `radial-gradient(circle at 70% -10%, ${accent}28, transparent 34%), linear-gradient(180deg, rgba(9,13,28,.98), rgba(3,7,18,.99))`,
          border: `1px solid ${accent}38`,
          boxShadow: `0 24px 80px rgba(0,0,0,.62), 0 0 90px ${accent}16, inset 0 1px 0 rgba(255,255,255,.07)`,
          position: "relative",
          animation: "supLift .34s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <div className="sup-animated" style={{ position: "absolute", top: -160, right: -120, width: 360, height: 360, borderRadius: "50%", border: `1px solid ${accent}28`, animation: "supRing 6s ease-in-out infinite", pointerEvents: "none" }} />
        <div className="sup-animated" style={{ position: "absolute", top: 20, right: 26, width: 92, height: 92, borderRadius: "50%", border: `1px dashed ${accent}44`, animation: "supOrbit 9s linear infinite", pointerEvents: "none" }} />
        <div className="sup-animated" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 90, background: `linear-gradient(90deg, transparent, ${accent}18, transparent)`, animation: "supSweep 5s ease-in-out infinite", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "22px 18px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3.2, color: accent, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, marginBottom: 8 }}>
                {summary.eyebrow}
              </div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "clamp(24px, 7vw, 42px)", lineHeight: 1.02, fontWeight: 900, fontFamily: "'Cinzel',serif", textShadow: `0 0 26px ${accent}55` }}>
                {summary.title}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Preview schliessen"
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.035)",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              x
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)" }}>
              <div style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.55, marginBottom: 16 }}>
                {summary.body}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "JETZT", value: `Lv.${currentLevel}` },
                  { label: "ZIEL", value: nextLevel ? `Lv.${nextLevel}` : "MAX" },
                  { label: "MODULE", value: String(unlocks.length) },
                ].map(item => (
                  <div key={item.label} style={{ padding: "10px 8px", borderRadius: 12, background: "rgba(15,23,42,.7)", border: "1px solid rgba(255,255,255,.055)", textAlign: "center" }}>
                    <div style={{ color: "#64748b", fontSize: 8, letterSpacing: 1.6, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ color: "#fff", fontSize: 16, fontFamily: "'Cinzel',serif", fontWeight: 900 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ minHeight: 170, borderRadius: 16, background: `radial-gradient(circle, ${accent}1d, rgba(15,23,42,.82) 62%)`, border: `1px solid ${accent}28`, display: "grid", placeItems: "center", padding: 16, position: "relative", overflow: "hidden" }}>
              <div className="sup-animated" style={{ position: "absolute", width: 146, height: 146, borderRadius: "50%", border: `1px solid ${accent}45`, animation: "supRing 4s ease-in-out infinite", pointerEvents: "none" }} />
              <div style={{ position: "relative", width: 118, height: 118, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(2,6,23,.72)", border: "1px solid rgba(255,255,255,.08)" }}>
                <svg viewBox="0 0 120 120" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray="314" strokeDashoffset={314 - (314 * progress) / 100} style={{ transition: "stroke-dashoffset .8s ease" }} />
                </svg>
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{ color: "#fff", fontSize: 26, fontWeight: 900, fontFamily: "'Cinzel',serif", lineHeight: 1 }}>{progress}%</div>
                  <div style={{ color: "#64748b", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>SYNC</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 9, letterSpacing: 2.6, color: accent, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, margin: "6px 0 12px" }}>
            WAS DU BEKOMMST
          </div>
          {hasUnlocks ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
              {unlocks.map((feature, index) => (
                <MicroPreview key={feature.key || feature.label} feature={feature} index={index} accent={accent} />
              ))}
            </div>
          ) : (
            <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
              Keine weiteren Module in der aktuellen Systemliste.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
