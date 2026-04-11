import React from "react";
import { SEASONS, WORLD_EVENTS } from "../data/seasons.js";

// ═══════════════════════════════════════════════════════════════
// SEASON VIEW — Gate Seasons & World Events
// ═══════════════════════════════════════════════════════════════

function daysUntilMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 7 : (8 - day) % 7;
  return diff;
}

export default function SeasonView({ state, theme, onClose }) {
  const t = theme || { primary: "#22d3ee", accent: "#67e8f9", card: "rgba(10,10,22,0.88)" };
  const seasonKey = state?.seasons?.currentSeason || "frost";
  const worldEventKey = state?.seasons?.currentWorldEvent;
  const season = SEASONS[seasonKey] || SEASONS.frost;
  const worldEvent = WORLD_EVENTS.find(e => e.key === worldEventKey) || WORLD_EVENTS[0];
  const seasonalCompletions = state?.seasons?.seasonalCompletions?.length || 0;
  const seasonalQuests = (state?.quests || []).filter(q => q.isSeasonal);
  const daysLeft = daysUntilMonday();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9100,
      background: "#06060e",
      fontFamily: "'Courier New', monospace", overflowY: "auto"
    }}>
      {/* Season Hero Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${season.colors.bg} 0%, rgba(6,6,14,1) 100%)`,
        borderBottom: `1px solid ${season.colors.primary}30`,
        padding: "1.5rem 1rem 1rem",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, ${season.colors.glow || season.colors.primary + "20"} 0%, transparent 70%)`
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: season.colors.primary, textTransform: "uppercase" }}>
            GATE SEASON — AKTIV
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            color: "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "6px",
            cursor: "pointer", fontSize: "0.7rem"
          }}>✕</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {season.iconSrc ? (
            <img src={season.iconSrc} alt={season.name} style={{ width: 64, height: 64, objectFit: "contain", filter: `drop-shadow(0 4px 16px ${season.colors.primary}77) brightness(1.1)` }} />
          ) : (
            <div style={{ fontSize: "3rem" }}>{season.icon}</div>
          )}
          <div>
            <div style={{
              fontSize: "1.6rem", fontWeight: 900, color: season.colors.primary,
              letterSpacing: "0.08em"
            }}>
              {season.name}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.25rem", fontStyle: "italic" }}>
              {season.loreText}
            </div>
          </div>
        </div>

        {/* Season modifier */}
        <div style={{
          marginTop: "1rem", padding: "0.5rem 0.75rem",
          background: `${season.colors.primary}15`, borderRadius: "6px",
          border: `1px solid ${season.colors.primary}30`,
          fontSize: "0.8rem", color: season.colors.accent || season.colors.primary
        }}>
           <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{season.iconSrc ? <img src={season.iconSrc} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /> : null} Saison-Bonus: {season.questModifier.category?.toUpperCase()} Quests geben ×{season.questModifier.xpMult} XP</span>
        </div>
      </div>

      <div style={{ padding: "1rem", maxWidth: "480px", margin: "0 auto" }}>

        {/* World Event */}
        <div style={{
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)",
          borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "#fbbf24", marginBottom: "0.25rem" }}>
                WORLD EVENT — Diese Woche
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fde68a", display: "flex", alignItems: "center", gap: 6 }}>
                {worldEvent.iconSrc ? <img src={worldEvent.iconSrc} alt={worldEvent.name} style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 0 5px #fbbf2488)" }} /> : worldEvent.icon}
                {worldEvent.name}
              </div>
              <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                {worldEvent.desc}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ color: "#fbbf24", fontSize: "1.5rem", fontWeight: 900 }}>{daysLeft}</div>
              <div style={{ color: "#9ca3af", fontSize: "0.65rem" }}>Tage bis<br />Wechsel</div>
            </div>
          </div>
        </div>

        {/* Seasonal Quests */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
            {season.iconSrc ? <img src={season.iconSrc} alt={season.name} style={{ width: 18, height: 18, objectFit: "contain", filter: `drop-shadow(0 0 4px ${season.colors.primary}88)` }} /> : season.icon}
            Saison-Quests
          </div>
          {seasonalQuests.length > 0 ? (
            seasonalQuests.map(q => (
              <div key={q.id} style={{
                background: `${season.colors.primary}08`, borderRadius: "8px",
                border: `1px solid ${season.colors.primary}25`, padding: "0.75rem",
                marginBottom: "0.5rem"
              }}>
                <div style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>{q.title}</div>
                <div style={{ color: season.colors.primary, fontSize: "0.7rem", marginTop: "0.2rem" }}>
                  {q.difficulty?.toUpperCase()} · {q.category?.toUpperCase()} · {q.type?.toUpperCase()}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              color: "#6b7280", fontSize: "0.8rem", textAlign: "center",
              padding: "1rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px"
            }}>
              Saison-Quests erscheinen beim nächsten Tages-Reset
            </div>
          )}
        </div>

        {/* Season Achievement Progress */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px", padding: "1rem"
        }}>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
             Saison-Achievement
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
            {season.achievement.desc}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, (seasonalCompletions / 10) * 100)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${season.colors.secondary}, ${season.colors.primary})`,
                borderRadius: "3px", transition: "width 0.5s ease"
              }} />
            </div>
            <div style={{ color: season.colors.primary, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
              {seasonalCompletions}/10
            </div>
          </div>
          {seasonalCompletions >= 10 && (
            <div style={{ color: season.colors.primary, fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: 700 }}>
              ✅ Titel erhalten: "{season.achievement.title}"
            </div>
          )}
        </div>

        {/* All World Events */}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ color: "#6b7280", fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
            WORLD EVENT ROTATION
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {WORLD_EVENTS.map((ev, i) => (
              <div key={ev.key} style={{
                padding: "0.6rem 0.75rem", borderRadius: "8px",
                background: ev.key === worldEventKey ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${ev.key === worldEventKey ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.06)"}`,
              }}>
                 <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{ev.iconSrc ? <img src={ev.iconSrc} alt={ev.name} style={{ width: 20, height: 20, objectFit: "contain", filter: ev.key === worldEventKey ? `drop-shadow(0 0 4px rgba(251,191,36,0.6))` : "brightness(0.7)" }} /> : ev.icon}</div>
                <div style={{
                  color: ev.key === worldEventKey ? "#fde68a" : "#6b7280",
                  fontSize: "0.7rem", fontWeight: ev.key === worldEventKey ? 700 : 400,
                  marginTop: "0.2rem"
                }}>
                  {ev.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
