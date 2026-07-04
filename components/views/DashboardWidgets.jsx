import React from "react";
import { STAT_ICONS, NAV_ICONS, GATE_ICONS, SHADOW_ICONS, STORY_ICONS } from "../../data/icons.js";
import { CATEGORIES, DIFFICULTIES, QUEST_TYPES_CONFIG } from "../../data/gameData.js";
import StreakFlame from "../ui/StreakFlame.jsx";
import { getToday, formatLocalDateTime } from "../../data/dateUtils.js";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { getQuestPlanningSnapshot } from "../../data/questPlanning.js";

// ── Premium glass card base ──────────────────────────────────
// Single shared surface style: frosted glass on dark, no accent
// borderTop, no heavy shadows. Let the content speak.
const glassCard = {
  background: "rgba(10,12,22,0.55)",
  backdropFilter: "blur(20px) saturate(1.3)",
  WebkitBackdropFilter: "blur(20px) saturate(1.3)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 20,
  padding: "18px 16px",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 20px rgba(0,0,0,0.12)",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STREAK DISPLAY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function StreakDisplayWidget({ state, theme }) {
  const { t } = useI18n();
  const streak = state.streak || 0;
  const maxStreak = state.maxStreak || streak;
  const streakPercent = maxStreak > 0 ? Math.min(100, (streak / maxStreak) * 100) : 0;
  const flameColor = streak >= 7 ? "#ef4444" : streak >= 3 ? "#f97316" : "#fbbf24";
  const milestones = [3, 7, 14, 30];

  return (
    <div style={{ ...glassCard }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: flameColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1.6 }}>
          {t("dashboard.streak.kicker")}
        </span>
        <span style={{ color: "#64748b", fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>
          {t("dashboard.streak.best", { count: maxStreak })}
        </span>
      </div>

      {/* Big number + flame */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 0.9 }}>{streak}</span>
          <span style={{ fontSize: 13, color: "#64748b", fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>
            {streak === 1 ? t("dashboard.streak.day_one") : t("dashboard.streak.day_other")}
          </span>
        </div>
        <StreakFlame streak={streak} size={26} disabled={state.settings?.streakFlame === false} />
      </div>

      {/* Progress bar + milestones */}
      <div style={{ marginTop: 16 }}>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${streakPercent}%`, height: "100%",
            background: `linear-gradient(90deg, ${flameColor}, ${flameColor}aa)`,
            borderRadius: 999,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "0 2px" }}>
          {milestones.map(m => {
            const reached = streak >= m;
            return (
              <div key={m} style={{
                width: 30, height: 30, borderRadius: 999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: reached ? `${flameColor}14` : "rgba(255,255,255,0.025)",
                color: reached ? flameColor : "#334155",
                fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                transition: "all 0.3s ease",
              }}>{m}d</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DAILY PROGRESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function DailyProgressWidget({ state, theme }) {
  const { t } = useI18n();
  const snapshot = getQuestPlanningSnapshot(state);
  const todayQuests = snapshot.loadout;
  const completedToday = snapshot.completedToday;
  const totalForToday = snapshot.todayTarget;
  const percent = totalForToday > 0 ? Math.min(100, Math.round((completedToday / totalForToday) * 100)) : 0;
  const statusColor = percent >= 100 ? "#22c55e" : percent >= 60 ? "#f59e0b" : theme.primary;
  const statusText = percent >= 100 ? t("dashboard.progress.statusDone") : percent >= 60 ? t("dashboard.progress.statusRunning") : t("dashboard.progress.statusOpen");

  return (
    <div style={{ ...glassCard }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 11, color: statusColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1.6 }}>
          {t("dashboard.progress.kicker")}
        </span>
        <span style={{
          padding: "3px 10px", borderRadius: 999,
          background: `${statusColor}0c`,
          color: statusColor, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
        }}>{statusText}</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 0.9 }}>{percent}</span>
          <span style={{ fontSize: 16, color: "#475569", fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>%</span>
        </div>
        <div style={{ color: "#7b8494", fontSize: 12, textAlign: "right", fontFamily: "'Outfit',sans-serif", lineHeight: 1.7 }}>
          <strong style={{ color: "#e2e8f0", fontWeight: 700 }}>{completedToday}</strong> {t("dashboard.progress.completed")}<br />
          <strong style={{ color: "#e2e8f0", fontWeight: 700 }}>{todayQuests.length}</strong> {t("dashboard.progress.open")}
        </div>
      </div>

      <div style={{ marginTop: 16, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{
          width: `${percent}%`, height: "100%", borderRadius: 999,
          background: `linear-gradient(90deg, ${statusColor}, ${statusColor}aa)`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TODAY COMMAND CENTER — Hero widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function TodayCommandCenter({ state, theme, can, setShowFocusMode, snoozeReminder, setShowTaskScan, setShowCreate }) {
  const { t, locale } = useI18n();
  const today = getToday();
  const snapshot = getQuestPlanningSnapshot(state);
  const completedTodayCount = snapshot.completedToday;
  const dueNowCount = snapshot.loadout.length;
  const overdueCount = snapshot.actionable.filter(q => q.dueDate && q.dueDate < today).length;
  const totalToday = snapshot.todayTarget;
  const progressPct = totalToday ? Math.min(100, Math.round((completedTodayCount / totalToday) * 100)) : 0;
  const habitsOpen = (state.habits || []).filter(h => h.active !== false && !h.history?.[today]).length;
  const streakRisk = (state.streak || 0) > 0 && completedTodayCount === 0 && (state.streak || 0) > 0;
  const nextReminder = (state.reminders || [])
    .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];
  const statusColor = overdueCount > 0 ? "#ef4444" : progressPct >= 100 ? "#22c55e" : theme.primary;
  const isDone = progressPct >= 100;

  // SVG progress ring
  const ringSize = 72;
  const sw = 4.5;
  const r = (ringSize - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (progressPct / 100) * circ;

  return (
    <section data-tutorial="today-command" style={{
      background: "rgba(10,12,22,0.55)",
      backdropFilter: "blur(20px) saturate(1.3)",
      WebkitBackdropFilter: "blur(20px) saturate(1.3)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 22,
      padding: "20px 18px",
      boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.15)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.6, color: statusColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
            {t("dashboard.command.kicker")}
          </div>
          <h2 style={{ margin: "5px 0 0", color: "#f8fafc", fontSize: 24, lineHeight: 1.05, fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>
            {t("dashboard.command.title")}
          </h2>
          <div style={{ color: "#7b8494", fontSize: 13, marginTop: 6, lineHeight: 1.4, fontFamily: "'Outfit',sans-serif" }}>
            {completedTodayCount}/{totalToday} {locale === "en" ? "daily target" : "Tagesziel"} · {dueNowCount} {locale === "en" ? "in loadout" : "im Loadout"} · {snapshot.questLog.length} {locale === "en" ? "in Quest Log" : "im Quest-Log"}
          </div>
        </div>

        {/* SVG Progress Ring */}
        <div style={{ position: "relative", flexShrink: 0, width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)", display: "block" }}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none"
              stroke={statusColor}
              strokeWidth={sw}
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)",
                filter: isDone ? `drop-shadow(0 0 8px ${statusColor}66)` : "none",
              }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, color: "#f8fafc", fontWeight: 800, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
              {progressPct}%
            </span>
            <span style={{ color: "#475569", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", marginTop: 2, letterSpacing: 0.5 }}>
              {t("dashboard.command.doneBadge")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
        {[
          { label: t("dashboard.command.completed"), value: completedTodayCount, color: progressPct >= 100 ? "#22c55e" : theme.primary },
          { label: t("dashboard.command.streak"), value: state.streak || 0, color: streakRisk ? "#f59e0b" : "#f97316" },
          { label: t("dashboard.command.habits"), value: habitsOpen, color: habitsOpen > 0 ? "#22c55e" : "#475569" },
        ].map(item => (
          <div key={item.label} style={{
            padding: "10px 10px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.025)",
          }}>
            <div style={{ color: item.color, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.3 }}>
              {item.label}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 15, marginTop: 5, fontWeight: 700, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Reminder */}
      {nextReminder && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.025)", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: theme.primary, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              {t("dashboard.command.reminder")}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 12, marginTop: 4, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis" }}>
              {formatLocalDateTime(nextReminder.reminderAt)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => snoozeReminder?.(nextReminder.id, 15)} style={{ padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: theme.primary, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+15m</button>
            <button onClick={() => snoozeReminder?.(nextReminder.id, 60)} style={{ padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: theme.primary, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+1h</button>
          </div>
        </div>
      )}
    </section>
  );
}



export function QuickAccessWidget({ navigateTo, can, theme, setShowFocusMode }) {
  const { t } = useI18n();
  const shortcuts = [
    { key: "dungeon", label: "Gates", iconSrc: GATE_ICONS.normal, color: "#ef4444", requires: "dungeons", action: () => navigateTo("dungeon") },
    { key: "story", label: "Story", iconSrc: STORY_ICONS.scroll, color: "#a78bfa", requires: "story", action: () => navigateTo("story") },
    { key: "stats", label: "Stats", iconSrc: STAT_ICONS.str, color: "#22d3ee", requires: "stats_view", action: () => navigateTo("stats") },
    { key: "shadows", label: t("dashboard.quickAccess.shadows"), iconSrc: SHADOW_ICONS.soldier, color: "#8b5cf6", requires: "shadow_army", action: () => navigateTo("shadows") },
    { key: "analytics", label: "Analytics", iconSrc: NAV_ICONS.analytics, color: "#06b6d4", requires: "analytics", action: () => navigateTo("analytics") },
    { key: "focus", label: "Focus", iconSrc: NAV_ICONS.timer, color: "#c084fc", requires: "focus_mode", action: () => setShowFocusMode?.(true) },
  ].filter(s => can(s.requires));

  if (shortcuts.length === 0) return null;

  return (
    <div style={{ ...glassCard, padding: "16px 14px 14px" }}>
      <div style={{
        fontSize: 11, letterSpacing: 1.6, color: theme.accent,
        fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 14,
      }}>{t("dashboard.quickAccess.title")}</div>
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
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "12px 4px 10px", borderRadius: 14,
              background: "rgba(255,255,255,0.025)", border: "none",
              cursor: "pointer", transition: "background 0.2s ease, transform 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${s.color}0c`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${s.color}0c`,
            }}>
              <img src={s.iconSrc} alt={s.label} style={{ width: 19, height: 19, objectFit: "contain", opacity: 0.9 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#7b8494", fontFamily: "'Outfit',sans-serif" }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ArtifactShowcaseWidget({ state, theme }) {
  const { t } = useI18n();
  const artifacts = state.artifacts?.discovered || [];
  const discoveredIds = artifacts;
  if (discoveredIds.length === 0) return null;

  const artifactDetails = {
    fokus_amulett: { label: t("dashboard.artifacts.fokus_amulett.label"), color: "#fbbf24", icon: "A", desc: t("dashboard.artifacts.fokus_amulett.desc") },
    kalender_rune: { label: t("dashboard.artifacts.kalender_rune.label"), color: "#ef4444", icon: "T", desc: t("dashboard.artifacts.kalender_rune.desc") },
    routine_stein: { label: t("dashboard.artifacts.routine_stein.label"), color: "#22c55e", icon: "R", desc: t("dashboard.artifacts.routine_stein.desc") }
  };

  return (
    <div style={{ ...glassCard, padding: "16px 14px 14px" }}>
      <div style={{
        fontSize: 11, letterSpacing: 1.6, color: theme.primary,
        fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 14,
      }}>{t("dashboard.artifacts.title")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {discoveredIds.map(id => {
          const info = artifactDetails[id] || { label: id, color: "#94a3b8", icon: "?", desc: t("dashboard.artifacts.unknown") };
          return (
            <div key={id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px", borderRadius: 12, background: "rgba(255,255,255,0.025)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${info.color}10`, color: info.color,
                fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
              }}>{info.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.label}</div>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
