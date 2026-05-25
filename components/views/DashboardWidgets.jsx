import React from "react";
import { STAT_ICONS, NAV_ICONS, GATE_ICONS, SHADOW_ICONS, STORY_ICONS } from "../../data/icons.js";
import { CATEGORIES, DIFFICULTIES, QUEST_TYPES_CONFIG } from "../../data/gameData.js";
import StreakFlame from "../ui/StreakFlame.jsx";
import { getToday, formatLocalDateTime } from "../../data/dateUtils.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

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
  const { t } = useI18n();
  const streak = state.streak || 0;
  const maxStreak = state.maxStreak || streak;
  const streakPercent = maxStreak > 0 ? Math.min(100, (streak / maxStreak) * 100) : 0;
  const flameColor = streak >= 7 ? "#ef4444" : streak >= 3 ? "#f97316" : "#fbbf24";
  const milestones = [3, 7, 14, 30];

  return (
    <div style={summaryShell(flameColor)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: flameColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.4 }}>{t("dashboard.streak.kicker")}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{t("dashboard.streak.subtitle")}</div>
        </div>
        <div style={{ padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
          {t("dashboard.streak.best", { count: maxStreak })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", lineHeight: 0.95 }}>{streak}</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{streak === 1 ? t("dashboard.streak.day_one") : t("dashboard.streak.day_other")}</span>
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
  const { t } = useI18n();
  const allQuests = (state.quests || []);
  const today = getToday();
  const todayQuests = allQuests.filter(q => !q.completed && (q.type === "daily" || !q.dueDate || q.dueDate <= today));
  const completedToday = (state.completedQuests || []).filter(q => q.completedAt === today).length;
  const totalForToday = todayQuests.length + completedToday;
  const percent = totalForToday > 0 ? Math.round((completedToday / totalForToday) * 100) : 0;
  const statusColor = percent >= 100 ? "#22c55e" : percent >= 60 ? "#f59e0b" : theme.primary;
  const statusText = percent >= 100 ? t("dashboard.progress.statusDone") : percent >= 60 ? t("dashboard.progress.statusRunning") : t("dashboard.progress.statusOpen");

  return (
    <div style={summaryShell(statusColor)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: statusColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: 1.4 }}>{t("dashboard.progress.kicker")}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{t("dashboard.progress.title")}</div>
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
          <strong style={{ color: "#e2e8f0", fontSize: 14 }}>{completedToday}</strong> {t("dashboard.progress.completed")}<br />
          <strong style={{ color: "#e2e8f0", fontSize: 14 }}>{todayQuests.length}</strong> {t("dashboard.progress.open")}
        </div>
      </div>

      <div style={{ marginTop: 13, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: statusColor, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

export function TodayCommandCenter({ state, theme, can, setShowFocusMode, snoozeReminder, setShowTaskScan, setShowCreate }) {
  const { t } = useI18n();
  const today = getToday();
  const activeQuests = (state.quests || []).filter(q => !q.completed);
  const completedTodayCount = (state.completedQuests || []).filter(q => q.completedAt === today).length;
  const dueNowCount = activeQuests.filter(q => q.type === "daily" || !q.dueDate || q.dueDate <= today).length;
  const overdueCount = activeQuests.filter(q => q.dueDate && q.dueDate < today).length;
  const totalToday = dueNowCount + completedTodayCount;
  const progressPct = totalToday ? Math.round((completedTodayCount / totalToday) * 100) : 0;
  const habitsOpen = (state.habits || []).filter(h => h.active !== false && !h.history?.[today]).length;
  const streakRisk = (state.streak || 0) > 0 && completedTodayCount === 0 && (state.streak || 0) > 0;
  const nextReminder = (state.reminders || [])
    .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];
  const statusColor = overdueCount > 0 ? "#ef4444" : progressPct >= 100 ? "#22c55e" : theme.primary;

  return (
    <section data-tutorial="today-command" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,0.9), rgba(5,7,15,0.96))",
      border: "1px solid rgba(148,163,184,0.12)",
      borderTop: `1px solid ${statusColor}38`,
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
      overflow: "hidden",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.4, color: statusColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{t("dashboard.command.kicker")}</div>
          <h2 style={{ margin: "3px 0 0", color: "#f8fafc", fontSize: 21, lineHeight: 1.05, fontFamily: "'Outfit',sans-serif", fontWeight: 900 }}>{t("dashboard.command.title")}</h2>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 5, lineHeight: 1.35 }}>
            {overdueCount > 0 ? t("dashboard.command.overdue", { count: overdueCount }) : t("dashboard.command.noDebt")} / {t("dashboard.command.openQuests", { count: dueNowCount })}
          </div>
        </div>
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: `conic-gradient(${statusColor} ${progressPct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          boxShadow: `0 0 22px ${statusColor}18`,
        }}>
          <div style={{ width: 43, height: 43, borderRadius: 13, background: "rgba(5,7,15,0.97)", display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 15, color: "#f8fafc", fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{progressPct}%</div>
              <div style={{ color: "#64748b", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{t("dashboard.command.doneBadge")}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 13 }}>
        {[
          { label: t("dashboard.command.completed"), value: completedTodayCount, color: progressPct >= 100 ? "#22c55e" : theme.primary },
          { label: t("dashboard.command.streak"), value: streakRisk ? t("dashboard.command.streakOpen") : t("dashboard.command.streakStable"), color: streakRisk ? "#f59e0b" : "#f97316" },
          { label: t("dashboard.command.habits"), value: habitsOpen, color: habitsOpen > 0 ? "#22c55e" : "#64748b" },
        ].map(item => (
          <div key={item.label} style={{
            padding: "9px 10px",
            borderRadius: 11,
            background: "rgba(255,255,255,0.026)",
            border: `1px solid ${item.color}22`,
            minWidth: 0,
          }}>
            <div style={{ color: item.color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{item.label}</div>
            <div style={{ color: "#e2e8f0", fontSize: 13, marginTop: 4, fontWeight: 800, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {nextReminder && (
        <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,0.024)", border: `1px solid ${theme.primary}22`, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: theme.primary, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{t("dashboard.command.reminder")}</div>
            <div style={{ color: "#e2e8f0", fontSize: 11, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{formatLocalDateTime(nextReminder.reminderAt)}</div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => snoozeReminder?.(nextReminder.id, 15)} style={{ padding: "5px 7px", borderRadius: 7, background: `${theme.primary}14`, border: `1px solid ${theme.primary}24`, color: theme.primary, fontSize: 9, fontWeight: 800 }}>+15</button>
            <button onClick={() => snoozeReminder?.(nextReminder.id, 60)} style={{ padding: "5px 7px", borderRadius: 7, background: `${theme.primary}14`, border: `1px solid ${theme.primary}24`, color: theme.primary, fontSize: 9, fontWeight: 800 }}>+60</button>
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
    <div style={{
      background: "linear-gradient(180deg, rgba(8,12,24,0.94), rgba(5,7,15,0.98))",
      border: "1px solid rgba(148,163,184,0.14)",
      borderRadius: 14,
      padding: "14px 12px 12px",
      boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
      borderTop: `1px solid ${theme.primary}38`,
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: 1.4,
        color: theme.primary,
        fontFamily: "'JetBrains Mono',monospace",
        fontWeight: 800,
        marginBottom: 12,
      }}>{t("dashboard.artifacts.title")}</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}>
        {discoveredIds.map(id => {
          const info = artifactDetails[id] || { label: id, color: "#94a3b8", icon: "?", desc: t("dashboard.artifacts.unknown") };
          return (
            <div key={id} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${info.color}24`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${info.color}14`, border: `1px solid ${info.color}35`, color: info.color, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace"
              }}>
                {info.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.label}</div>
                <div style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
