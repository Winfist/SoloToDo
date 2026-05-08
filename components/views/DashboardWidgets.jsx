import React from "react";
import { STAT_ICONS, NAV_ICONS, GATE_ICONS, SHADOW_ICONS, STORY_ICONS } from "../../data/icons.js";
import StreakFlame from "../ui/StreakFlame.jsx";
import { getToday, formatLocalDateTime } from "../../data/dateUtils.js";

const summaryShell = (accent) => ({
  background: "linear-gradient(180deg, rgba(8,12,24,0.94), rgba(5,7,15,0.98))",
  border: "1px solid rgba(148,163,184,0.14)",
  borderTop: `1px solid ${accent}38`,
  borderRadius: 14,
  padding: 14,
  position: "relative",
  overflow: "hidden",
  minHeight: 138,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
});

export function StreakDisplayWidget({ state, theme }) {
  const streak = state.streak || 0;
  const maxStreak = state.maxStreak || streak;
  const streakPercent = maxStreak > 0 ? Math.min(100, (streak / maxStreak) * 100) : 0;
  const flameColor = streak >= 7 ? "#ef4444" : streak >= 3 ? "#f97316" : "#fbbf24";
  const milestones = [3, 7, 14, 30];

  return (
    <div style={summaryShell(flameColor)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: flameColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.4 }}>SERIE</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Konstanz heute</div>
        </div>
        <div style={{ padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
          Best {maxStreak}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 0.95 }}>{streak}</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{streak === 1 ? "Tag" : "Tage"}</span>
        </div>
        <StreakFlame streak={streak} size={26} disabled={state.settings?.streakFlame === false} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${streakPercent}%`, height: "100%", background: flameColor, borderRadius: 999, transition: "width 0.7s ease" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginTop: 10 }}>
          {milestones.map(milestone => {
            const reached = streak >= milestone;
            return (
              <div key={milestone} style={{
                textAlign: "center",
                padding: "4px 0",
                borderRadius: 7,
                background: reached ? `${flameColor}16` : "rgba(255,255,255,0.025)",
                border: `1px solid ${reached ? flameColor + "35" : "rgba(255,255,255,0.05)"}`,
                color: reached ? flameColor : "#475569",
                fontSize: 9,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono',monospace",
              }}>{milestone}d</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DailyProgressWidget({ state, theme }) {
  const allQuests = (state.quests || []);
  const today = getToday();
  const todayQuests = allQuests.filter(q => !q.completed && (q.type === "daily" || !q.dueDate || q.dueDate <= today));
  const completedToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
  const totalForToday = todayQuests.length + completedToday;
  const percent = totalForToday > 0 ? Math.round((completedToday / totalForToday) * 100) : 0;
  const statusColor = percent >= 100 ? "#22c55e" : percent >= 60 ? "#f59e0b" : theme.primary;
  const statusText = percent >= 100 ? "Fertig" : percent >= 60 ? "Im Lauf" : "Offen";

  return (
    <div style={summaryShell(statusColor)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: statusColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.4 }}>HEUTE</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Tagesfortschritt</div>
        </div>
        <div style={{ padding: "4px 8px", borderRadius: 8, background: `${statusColor}12`, border: `1px solid ${statusColor}2c`, color: statusColor, fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
          {statusText}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 0.95 }}>{percent}</span>
          <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>%</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 11, textAlign: "right" }}>
          <strong style={{ color: "#e2e8f0", fontSize: 14 }}>{completedToday}</strong> erledigt<br />
          <strong style={{ color: "#e2e8f0", fontSize: 14 }}>{todayQuests.length}</strong> offen
        </div>
      </div>

      <div style={{ marginTop: 13, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: statusColor, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

export function TodayCommandCenter({ state, theme, can, setShowFocusMode, snoozeReminder }) {
  const today = getToday();
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const typeRank = { daily: 0, weekly: 1, side: 2, chained: 3, hidden: 4 };
  const allQuests = state.quests || [];
  const activeQuests = allQuests.filter(q => !q.completed);
  const completedTodayCount = (state.completedQuests || []).filter(q => q.completedAt === today).length;
  const dueNowCount = activeQuests.filter(q => q.type === "daily" || !q.dueDate || q.dueDate <= today).length;
  const totalToday = dueNowCount + completedTodayCount;
  const progressPct = totalToday ? Math.round((completedTodayCount / totalToday) * 100) : 0;
  const focusQuests = activeQuests
    .filter(q => !q.completed)
    .sort((a, b) => {
      const aDue = a.dueDate ? (a.dueDate < today ? 0 : a.dueDate === today ? 1 : 3) : 4;
      const bDue = b.dueDate ? (b.dueDate < today ? 0 : b.dueDate === today ? 1 : 3) : 4;
      return aDue - bDue
        || (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
        || (a.isSystem ? 1 : 0) - (b.isSystem ? 1 : 0)
        || (typeRank[a.type] ?? 5) - (typeRank[b.type] ?? 5);
    })
    .slice(0, 3);
  const nextReminder = (state.reminders || [])
    .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];
  const completedToday = completedTodayCount > 0;
  const habitsOpen = (state.habits || []).filter(h => h.active !== false && !h.history?.[today]).length;
  const streakRisk = (state.streak || 0) > 0 && !completedToday;
  const overdueCount = activeQuests.filter(q => q.dueDate && q.dueDate < today).length;

  const dueLabel = (quest) => {
    if (!quest.dueDate) return quest.energy || "Offen";
    if (quest.dueDate < today) return "Überfällig";
    if (quest.dueDate === today) return "Heute";
    return quest.dueDate;
  };

  return (
    <section style={{
      background: "linear-gradient(180deg, rgba(8,12,24,0.96), rgba(4,6,14,0.98))",
      border: `1px solid ${streakRisk ? "#f59e0b44" : "rgba(148,163,184,0.14)"}`,
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>HEUTE</div>
          <h2 style={{ margin: "3px 0 0", fontSize: 22, lineHeight: 1.05, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", fontWeight: 900 }}>Einsatzplan</h2>
          <div style={{ marginTop: 5, color: "#94a3b8", fontSize: 12 }}>
            {overdueCount > 0 ? `${overdueCount} überfällig` : "Keine Altlasten"} / {dueNowCount} Schritte offen
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 24, color: "#f8fafc", fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{progressPct}%</div>
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>erledigt</div>
        </div>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 999, background: progressPct >= 100 ? "#22c55e" : theme.primary, transition: "width 0.7s ease" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ color: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.2 }}>NÄCHSTE SCHRITTE</div>
        {can?.("focus_mode") && (
          <button onClick={() => setShowFocusMode?.(true)} style={{
            minHeight: 30,
            padding: "0 10px",
            borderRadius: 8,
            background: `${theme.primary}14`,
            border: `1px solid ${theme.primary}30`,
            color: theme.accent || theme.primary,
            fontSize: 10,
            fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace",
            cursor: "pointer",
          }}>START</button>
        )}
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        {focusQuests.length ? focusQuests.map((q, i) => {
          const urgent = q.dueDate && q.dueDate < today;
          const accent = urgent ? "#ef4444" : q.priority === "high" ? "#f59e0b" : theme.primary;
          return (
            <div key={q.id} style={{
              display: "grid",
              gridTemplateColumns: "26px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px",
              borderRadius: 10,
              background: urgent ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${urgent ? "#ef44442f" : "rgba(255,255,255,0.07)"}`,
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: `${accent}16`, color: accent, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</div>
                <div style={{ color: "#64748b", fontSize: 10, marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>
                  {dueLabel(q)}{q.context ? ` / ${q.context}` : ""}
                </div>
              </div>
              <div style={{ color: accent, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", padding: "3px 6px", borderRadius: 6, background: `${accent}10`, border: `1px solid ${accent}24` }}>
                {(q.priority || "mid").slice(0, 3).toUpperCase()}
              </div>
            </div>
          );
        }) : (
          <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 12 }}>
            Keine offenen Fokus-Aufgaben.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
        <div style={{ padding: "9px 10px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", minWidth: 0 }}>
          <div style={{ color: nextReminder ? theme.primary : "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>REMINDER</div>
          <div style={{ color: "#e2e8f0", fontSize: 11, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{nextReminder ? formatLocalDateTime(nextReminder.reminderAt) : "Keiner"}</div>
          {nextReminder && (
            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
              <button onClick={() => snoozeReminder?.(nextReminder.id, 15)} style={{ padding: "5px 7px", borderRadius: 7, background: `${theme.primary}14`, border: `1px solid ${theme.primary}24`, color: theme.primary, fontSize: 9, fontWeight: 800 }}>+15</button>
              <button onClick={() => snoozeReminder?.(nextReminder.id, 60)} style={{ padding: "5px 7px", borderRadius: 7, background: `${theme.primary}14`, border: `1px solid ${theme.primary}24`, color: theme.primary, fontSize: 9, fontWeight: 800 }}>+60</button>
            </div>
          )}
        </div>
        <div style={{ padding: "9px 10px", borderRadius: 10, background: streakRisk ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.025)", border: `1px solid ${streakRisk ? "#f59e0b44" : "rgba(255,255,255,0.06)"}` }}>
          <div style={{ color: streakRisk ? "#f59e0b" : "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>SERIE</div>
          <div style={{ color: "#e2e8f0", fontSize: 11, marginTop: 4 }}>{streakRisk ? "Heute offen" : "Stabil"}</div>
        </div>
        <div style={{ padding: "9px 10px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>HABITS</div>
          <div style={{ color: "#e2e8f0", fontSize: 11, marginTop: 4 }}>{habitsOpen} offen</div>
        </div>
      </div>
    </section>
  );
}

export function QuickAccessWidget({ navigateTo, can, theme, setShowFocusMode }) {
  const shortcuts = [
    { key: "dungeon", label: "Gates", iconSrc: GATE_ICONS.normal, color: "#ef4444", requires: "dungeons", action: () => navigateTo("dungeon") },
    { key: "story", label: "Story", iconSrc: STORY_ICONS.scroll, color: "#a78bfa", requires: "story", action: () => navigateTo("story") },
    { key: "stats", label: "Stats", iconSrc: STAT_ICONS.str, color: "#22d3ee", requires: "stats_view", action: () => navigateTo("stats") },
    { key: "shadows", label: "Schatten", iconSrc: SHADOW_ICONS.soldier, color: "#8b5cf6", requires: "shadow_army", action: () => navigateTo("shadows") },
    { key: "analytics", label: "Analytics", iconSrc: NAV_ICONS.analytics, color: "#06b6d4", requires: "analytics", action: () => navigateTo("analytics") },
    { key: "focus", label: "Focus", iconSrc: NAV_ICONS.timer, color: "#c084fc", requires: "focus_mode", action: () => setShowFocusMode?.(true) },
  ].filter(s => can(s.requires));

  if (shortcuts.length === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(8,12,24,0.94), rgba(5,7,15,0.98))",
      border: "1px solid rgba(148,163,184,0.14)",
      borderRadius: 14,
      padding: "14px 12px 12px",
      boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: 1.4,
        color: theme.accent,
        fontFamily: "'JetBrains Mono',monospace",
        fontWeight: 800,
        marginBottom: 12,
      }}>SCHNELLZUGRIFF</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(shortcuts.length, 4)}, 1fr)`,
        gap: 8,
      }}>
        {shortcuts.slice(0, 8).map(s => (
          <button
            key={s.key}
            onClick={s.action}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "11px 4px 9px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${s.color}24`,
              cursor: "pointer",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color + "55";
              e.currentTarget.style.background = `${s.color}0c`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = s.color + "24";
              e.currentTarget.style.background = "rgba(255,255,255,0.025)";
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${s.color}10`,
              border: `1px solid ${s.color}2c`,
            }}>
              <img src={s.iconSrc} alt={s.label} style={{ width: 19, height: 19, objectFit: "contain", filter: "brightness(1.12)" }} />
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#94a3b8",
              fontFamily: "'JetBrains Mono',monospace",
            }}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
