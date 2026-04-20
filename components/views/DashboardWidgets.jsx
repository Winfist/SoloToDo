import React from "react";
import { STAT_ICONS, NAV_ICONS, GATE_ICONS, SHADOW_ICONS, STORY_ICONS } from "../../data/icons.js";
import StreakFlame from "../ui/StreakFlame.jsx";

// ─── STREAK DISPLAY WIDGET ────────────────────────────────────
export function StreakDisplayWidget({ state, theme }) {
  const streak = state.streak || 0;
  const maxStreak = state.maxStreak || streak;
  const streakPercent = maxStreak > 0 ? Math.min(100, (streak / maxStreak) * 100) : 0;
  const intensity = Math.min(streak, 10);
  const flameColor = streak >= 7 ? "#ef4444" : streak >= 3 ? "#f97316" : "#fbbf24";

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${flameColor}20`,
      borderRadius: 18,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(16px)",
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: "50%", height: "100%",
        background: `radial-gradient(circle at 100% 30%, ${flameColor}12, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        {/* Flame icon cluster */}
        <div style={{
          width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center",
          background: `radial-gradient(circle, ${flameColor}20, transparent 70%)`,
          borderRadius: "50%", position: "relative", flexShrink: 0,
        }}>
          <img
            src={STAT_ICONS.str}
            alt="Streak"
            style={{
              width: 36, height: 36, objectFit: "contain",
              filter: `drop-shadow(0 0 ${6 + intensity}px ${flameColor}88) brightness(1.2)`,
              animation: streak > 0 ? "pulse 1.5s infinite" : "none",
            }}
          />
          {streak >= 5 && (
            <div style={{
              position: "absolute", bottom: -2, right: -2,
              width: 20, height: 20, borderRadius: "50%",
              background: `linear-gradient(135deg, ${flameColor}, ${flameColor}cc)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 900, color: "#fff",
              boxShadow: `0 0 8px ${flameColor}66`,
              fontFamily: "'JetBrains Mono',monospace",
            }}>🔥</div>
          )}
        </div>

        {/* Text + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, letterSpacing: 3, color: flameColor,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 4,
          }}>AKTUELLE SERIE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, color: "#fff",
              fontFamily: "'Cinzel',serif", lineHeight: 1,
              textShadow: `0 0 20px ${flameColor}44`,
            }}>{streak}</span>
            <StreakFlame streak={streak} size={32} disabled={state.settings?.streakFlame === false} />
            <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>
              {streak === 1 ? "Tag" : "Tage"}
            </span>
          </div>

          {/* Progress bar to personal record */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>
            <span>FORTSCHRITT</span>
            <span>REKORD: {maxStreak}</span>
          </div>
          <div style={{
            height: 6, background: "rgba(15,15,30,0.9)", borderRadius: 3,
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{
              width: `${streakPercent}%`, height: "100%", borderRadius: 3,
              background: `linear-gradient(90deg, ${flameColor}cc, ${flameColor})`,
              boxShadow: `0 0 10px ${flameColor}44`,
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>
      </div>

      {/* Milestone badges */}
      {streak > 0 && (
        <div style={{
          display: "flex", gap: 6, marginTop: 12, justifyContent: "center",
        }}>
          {[3, 7, 14, 30, 60, 100].map(milestone => {
            const reached = streak >= milestone;
            return (
              <div key={milestone} style={{
                padding: "3px 8px", borderRadius: 6,
                background: reached ? `${flameColor}18` : "rgba(255,255,255,0.02)",
                border: `1px solid ${reached ? flameColor + "44" : "rgba(255,255,255,0.04)"}`,
                fontSize: 9, fontWeight: 700, color: reached ? flameColor : "#334155",
                fontFamily: "'JetBrains Mono',monospace",
                transition: "all 0.3s",
              }}>{milestone}d</div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── DAILY PROGRESS WIDGET ────────────────────────────────────
export function DailyProgressWidget({ state, theme }) {
  const allQuests = (state.quests || []);
  const todayQuests = allQuests.filter(q => !q.completed);
  const completedToday = state.questsCompletedToday || 0;
  const totalForToday = todayQuests.length + completedToday;
  const percent = totalForToday > 0 ? Math.round((completedToday / totalForToday) * 100) : 0;

  const statusColor = percent >= 100 ? "#22c55e" : percent >= 60 ? "#f59e0b" : theme.primary;
  const statusText = percent >= 100 ? "QUEST COMPLETE" : percent >= 60 ? "GUT UNTERWEGS" : "AKTIV";

  // Ring progress
  const size = 64;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${statusColor}20`,
      borderRadius: 18,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(16px)",
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
        background: `radial-gradient(circle at 0% 50%, ${statusColor}08, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        {/* Progress ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={statusColor} strokeWidth={strokeWidth}
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${statusColor}66)` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'JetBrains Mono',monospace",
          }}>{percent}%</div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 9, letterSpacing: 3, color: statusColor,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6,
          }}>TAGESFORTSCHRITT</div>
          <div style={{
            fontSize: 13, color: "#e2e8f0", fontWeight: 700, marginBottom: 4,
            fontFamily: "'Outfit',sans-serif",
          }}>{statusText}</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>
                {completedToday}
              </div>
              <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>ERLEDIGT</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#64748b", fontFamily: "'Cinzel',serif" }}>
                {todayQuests.length}
              </div>
              <div style={{ fontSize: 8, color: "#475569", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>OFFEN</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── QUICK ACCESS WIDGET ──────────────────────────────────────
export function QuickAccessWidget({ navigateTo, can, theme, setShowFocusMode, setShowDawnDusk, setShowSoulLink }) {
  const shortcuts = [
    { key: "dungeon",     label: "Gates",     iconSrc: GATE_ICONS.normal,   color: "#ef4444",  requires: "dungeons",   action: () => navigateTo("dungeon") },
    { key: "story",       label: "Story",     iconSrc: STORY_ICONS.scroll,  color: "#a78bfa",  requires: "story",      action: () => navigateTo("story") },
    { key: "stats",       label: "Stats",     iconSrc: STAT_ICONS.str,      color: "#22d3ee",  requires: "stats_view", action: () => navigateTo("stats") },
    { key: "shadows",     label: "Schatten",  iconSrc: SHADOW_ICONS.soldier, color: "#8b5cf6",  requires: "shadow_army",action: () => navigateTo("shadows") },
    { key: "analytics",   label: "Analytics", iconSrc: NAV_ICONS.analytics, color: "#06b6d4",  requires: "analytics",  action: () => navigateTo("analytics") },
    { key: "focus",       label: "Focus",     iconSrc: NAV_ICONS.timer,     color: "#c084fc",  requires: "focus_mode", action: () => setShowFocusMode?.(true) },
  ].filter(s => can(s.requires));

  if (shortcuts.length === 0) return null;

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.primary}15`,
      borderRadius: 18,
      padding: "16px 14px 14px",
      backdropFilter: "blur(16px)",
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 3, color: theme.accent,
        fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
        marginBottom: 12, paddingLeft: 4,
      }}>SCHNELLZUGRIFF</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(shortcuts.length, 4)}, 1fr)`,
        gap: 8,
      }}>
        {shortcuts.slice(0, 8).map((s, i) => (
          <button
            key={s.key}
            onClick={s.action}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "12px 4px 10px", borderRadius: 14,
              background: `${s.color}08`,
              border: `1px solid ${s.color}20`,
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              animation: `slideUp 0.3s ease ${i * 0.04}s both`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color + "55";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}18`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = s.color + "20";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `radial-gradient(circle, ${s.color}18, transparent)`,
              border: `1.5px solid ${s.color}30`,
            }}>
              <img src={s.iconSrc} alt={s.label} style={{
                width: 20, height: 20, objectFit: "contain",
                filter: `brightness(1.15) drop-shadow(0 0 4px ${s.color}66)`,
              }} />
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, color: s.color,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
            }}>{s.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
