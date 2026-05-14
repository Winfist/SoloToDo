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
    <section style={{
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
          { label: t("dashboard.command.streak"), value: streakRisk ? t("dashboard.command.streakOpen") : `${state.streak || 0}d`, color: streakRisk ? "#f59e0b" : "#f97316" },
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

function LegacyTodayCommandCenter({ state, theme, can, setShowFocusMode, snoozeReminder, onCompleteQuest, onOpenQuest, createQuest, setShowTaskScan, setShowCreate }) {
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
    .slice(0, 4);
  const nextReminder = (state.reminders || [])
    .filter(r => !r.fired && r.reminderAt && new Date(r.reminderAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))[0];
  const completedToday = completedTodayCount > 0;
  const habitsOpen = (state.habits || []).filter(h => h.active !== false && !h.history?.[today]).length;
  const streakRisk = (state.streak || 0) > 0 && !completedToday;
  const overdueCount = activeQuests.filter(q => q.dueDate && q.dueDate < today).length;
  const primaryQuest = focusQuests[0] || null;

  const dueLabel = (quest) => {
    if (!quest.dueDate) return quest.energy || "Offen";
    if (quest.dueDate < today) return "Überfällig";
    if (quest.dueDate === today) return "Heute";
    return quest.dueDate;
  };

  const questMeta = (quest) => {
    const diff = DIFFICULTIES.find(d => d.key === quest?.difficulty) || DIFFICULTIES[1] || DIFFICULTIES[0];
    const cat = CATEGORIES.find(c => c.key === quest?.category) || CATEGORIES[0];
    const typeCfg = QUEST_TYPES_CONFIG[quest?.type] || QUEST_TYPES_CONFIG.side;
    const urgent = quest?.dueDate && quest.dueDate < today;
    const accent = urgent ? "#ef4444" : quest?.priority === "high" ? "#f59e0b" : diff?.color || theme.primary;
    const xp = Math.round((diff?.xp || 15) * (quest?.chainMultiplier || 1) * (typeCfg?.xpMult || 1));
    const gold = Math.round((diff?.gold || 25) * (quest?.chainMultiplier || 1) * (typeCfg?.goldMult || 1));
    const subQuests = quest?.subQuests || [];
    const completedSubs = subQuests.filter(sq => sq.completed).length;
    const blocked = subQuests.length > 0 && completedSubs < subQuests.length;
    return { diff, cat, accent, xp, gold, subQuests, completedSubs, blocked };
  };

  const primaryMeta = primaryQuest ? questMeta(primaryQuest) : null;
  const primaryActionLabel = primaryQuest?.isScreenTime ? "PRUEFEN" : primaryMeta?.blocked ? "ETAPPEN" : "ERLEDIGT";

  const handleQuestAction = (quest) => {
    if (!quest) {
      if (setShowCreate) setShowCreate(true);
      else if (createQuest) createQuest({ title: "5 Minuten Ordnung schaffen", difficulty: "easy", category: "agi", type: "side", priority: "medium", energy: "quick" });
      return;
    }
    const meta = questMeta(quest);
    if (meta.blocked) {
      onOpenQuest?.(quest);
      return;
    }
    onCompleteQuest?.(quest.id, null);
  };

  return (
    <section style={{
      background: `linear-gradient(180deg, ${theme.primary}10 0%, rgba(8,12,24,0.96) 32%, rgba(4,6,14,0.98) 100%)`,
      border: `1px solid ${streakRisk ? "#f59e0b44" : "rgba(148,163,184,0.14)"}`,
      borderTop: `1px solid ${theme.primary}45`,
      borderRadius: 16,
      padding: 15,
      boxShadow: `0 16px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)`,
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.4, color: theme.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>HEUTE</div>
          <h2 style={{ margin: "3px 0 0", fontSize: 24, lineHeight: 1.04, color: "#f8fafc", fontFamily: "'Outfit',sans-serif", fontWeight: 900 }}>Naechste Quest</h2>
          <div style={{ marginTop: 5, color: "#94a3b8", fontSize: 12 }}>
            {overdueCount > 0 ? `${overdueCount} überfällig` : "Keine Altlasten"} / {dueNowCount} Schritte offen
          </div>
        </div>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: `conic-gradient(${progressPct >= 100 ? "#22c55e" : theme.primary} ${progressPct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          flexShrink: 0,
          boxShadow: `0 0 24px ${theme.primary}18`,
        }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(5,7,15,0.96)", display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 16, color: "#f8fafc", fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{progressPct}%</div>
              <div style={{ color: "#64748b", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>DONE</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 999, background: progressPct >= 100 ? "#22c55e" : theme.primary, transition: "width 0.7s ease" }} />
      </div>

      {primaryQuest ? (
        <div
          onClick={() => onOpenQuest?.(primaryQuest)}
          style={{
            borderRadius: 14,
            padding: 13,
            background: `linear-gradient(135deg, ${primaryMeta.accent}14, rgba(255,255,255,0.026))`,
            border: `1px solid ${primaryMeta.accent}32`,
            cursor: onOpenQuest ? "pointer" : "default",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              display: "grid",
              placeItems: "center",
              background: `${primaryMeta.accent}14`,
              border: `1px solid ${primaryMeta.accent}38`,
              boxShadow: `inset 0 0 18px ${primaryMeta.accent}10`,
              overflow: "hidden",
            }}>
              {primaryMeta.cat?.iconSrc ? (
                <img src={primaryMeta.cat.iconSrc} alt="" style={{ width: 31, height: 31, objectFit: "contain", filter: "brightness(1.15)" }} />
              ) : (
                <span style={{ color: primaryMeta.accent, fontWeight: 900 }}>{primaryMeta.cat?.stat || "Q"}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
                <span style={{ color: primaryMeta.accent, background: `${primaryMeta.accent}12`, border: `1px solid ${primaryMeta.accent}28`, padding: "2px 7px", borderRadius: 7, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>
                  {dueLabel(primaryQuest).toUpperCase()}
                </span>
                <span style={{ color: "#94a3b8", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 7, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                  {primaryMeta.diff?.label || "Normal"}
                </span>
                <span style={{ color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", padding: "2px 7px", borderRadius: 7, fontSize: 9, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                  +{primaryMeta.xp} XP
                </span>
              </div>
              <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900, lineHeight: 1.16, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis" }}>
                {primaryQuest.title}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 6, lineHeight: 1.35, fontFamily: "'Outfit',sans-serif" }}>
                {primaryQuest.context ? `${primaryQuest.context} / ` : ""}{primaryQuest.energy || "medium"} / +{primaryMeta.gold} Gold
                {primaryMeta.subQuests.length > 0 ? ` / ${primaryMeta.completedSubs}/${primaryMeta.subQuests.length} Etappen` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 7, marginTop: 12 }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleQuestAction(primaryQuest); }}
              style={{
                minHeight: 38,
                borderRadius: 10,
                background: primaryMeta.blocked ? "rgba(255,255,255,0.045)" : `linear-gradient(135deg, ${primaryMeta.accent}, ${theme.accent || primaryMeta.accent})`,
                color: primaryMeta.blocked ? primaryMeta.accent : "#fff",
                border: `1px solid ${primaryMeta.blocked ? primaryMeta.accent + "38" : "rgba(255,255,255,0.18)"}`,
                fontSize: 11,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 1,
                cursor: "pointer",
                boxShadow: primaryMeta.blocked ? "none" : `0 10px 24px ${primaryMeta.accent}22`,
              }}
            >
              {primaryActionLabel}
            </button>
            {onOpenQuest && (
              <button onClick={(e) => { e.stopPropagation(); onOpenQuest(primaryQuest); }} style={{ minHeight: 38, padding: "0 11px", borderRadius: 10, background: "rgba(255,255,255,0.035)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                DETAILS
              </button>
            )}
            {can?.("focus_mode") && (
              <button onClick={(e) => { e.stopPropagation(); setShowFocusMode?.(true); }} style={{ minHeight: 38, padding: "0 11px", borderRadius: 10, background: `${theme.primary}12`, color: theme.accent || theme.primary, border: `1px solid ${theme.primary}2e`, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                FOKUS
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: 15, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
          <div style={{ color: "#f8fafc", fontSize: 17, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>Alles frei.</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 5, lineHeight: 1.45 }}>Lege eine kleine Quest an, damit der naechste Schritt sofort sichtbar ist.</div>
          <div style={{ display: "grid", gridTemplateColumns: setShowTaskScan && can?.("ai_task_scan") ? "1fr 1fr" : "1fr", gap: 8, marginTop: 12 }}>
            <button onClick={() => handleQuestAction(null)} style={{ minHeight: 38, borderRadius: 10, background: `${theme.primary}18`, color: theme.accent || theme.primary, border: `1px solid ${theme.primary}34`, fontSize: 11, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>NEUE QUEST</button>
            {setShowTaskScan && can?.("ai_task_scan") && (
              <button onClick={() => setShowTaskScan(true)} style={{ minHeight: 38, borderRadius: 10, background: "rgba(255,255,255,0.035)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>SCAN</button>
            )}
          </div>
        </div>
      )}

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
        {focusQuests.length > 1 ? focusQuests.slice(1).map((q, i) => {
          const urgent = q.dueDate && q.dueDate < today;
          const accent = urgent ? "#ef4444" : q.priority === "high" ? "#f59e0b" : theme.primary;
          return (
            <div key={q.id} onClick={() => onOpenQuest?.(q)} style={{
              display: "grid",
              gridTemplateColumns: "26px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px",
              borderRadius: 10,
              background: urgent ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${urgent ? "#ef44442f" : "rgba(255,255,255,0.07)"}`,
              cursor: onOpenQuest ? "pointer" : "default",
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: `${accent}16`, color: accent, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{i + 2}</span>
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
            Keine weiteren Schritte.
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
    fokus_amulett: { label: "Focus Amulett", color: "#fbbf24", icon: "A", desc: "Verstärkt Tagesfokus-Quests." },
    kalender_rune: { label: "Kalender-Rune", color: "#ef4444", icon: "T", desc: "Warnt bei nahen Deadlines." },
    routine_stein: { label: "Routine-Stein", color: "#22c55e", icon: "R", desc: "Erweitert Habit Tracker Kapazität." }
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
      }}>ARTIFACTS</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}>
        {discoveredIds.map(id => {
          const info = artifactDetails[id] || { label: id, color: "#94a3b8", icon: "?", desc: "Unbekanntes Artefakt" };
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
