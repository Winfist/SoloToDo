import React, { useMemo, useState } from "react";
import { genId } from "../data/constants";
import { getLocalDateKey, getToday } from "../data/dateUtils.js";
import { HABIT_ICONS, NAV_ICONS, SHADOW_ICONS, STAT_ICONS, STORY_ICONS } from "../data/icons";
import GameIcon from "./GameIcon.jsx";

const PREMIUM_MANIFESTATIONS = [
  "Ich bin der Architekt meines eigenen Schicksals. Niemand wird die Arbeit fuer mich erledigen.",
  "Jeder Widerstand formt meinen Charakter. Ich begruesse den Schmerz des Wachstums.",
  "Meine Zeit ist mein wertvollstes Asset. Ich investiere sie in meine ultimative Vision.",
  "Disziplin wiegt Unzen, Bedauern wiegt Tonnen. Ich waehle die Disziplin.",
  "Ich fokussiere mich nur auf das, was ich kontrollieren kann. Der Rest ist Illusion.",
  "Ich vergleiche mich nicht mit anderen, sondern nur damit, wer ich gestern war.",
  "Motivation ist fluechtig. Wahre Macht liegt in der unerschuetterlichen Konsistenz.",
  "Es gibt kein Limit. Mein Potenzial waechst mit jeder Herausforderung, die ich meistere.",
  "Erfolg mietet man, und die Miete ist jeden Tag faellig. Ich gebe heute 100%.",
  "Jede Ablenkung ist ein Feind meiner Zukunft. Mein Fokus ist absolute Prioritaet.",
];

const MODE_META = {
  pomodoro: { label: "Pomodoro", color: "#ef4444", icon: HABIT_ICONS.timer },
  deepWork: { label: "Deep Work", color: "#8b5cf6", icon: STORY_ICONS.blackheart },
  sprint: { label: "Sprint", color: "#06b6d4", icon: NAV_ICONS.timer },
  sanctum: { label: "Sanctum", color: "#22c55e", icon: STORY_ICONS.arise },
};

function getRecentDayKeys(count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return getLocalDateKey(date);
  });
}

function getFocus(state) {
  return {
    totalMinutes: state?.focus?.totalMinutes || 0,
    totalSessions: state?.focus?.totalSessions || 0,
    streak: state?.focus?.streak || 0,
    bestStreak: state?.focus?.bestStreak || 0,
    bestDayMinutes: state?.focus?.bestDayMinutes || 0,
    longestSessionMinutes: state?.focus?.longestSessionMinutes || 0,
    daily: state?.focus?.daily || {},
    modes: state?.focus?.modes || {},
    recentSessions: Array.isArray(state?.focus?.recentSessions) ? state.focus.recentSessions : [],
  };
}

function formatSessionTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function InnerSanctum({ state, persist, notify, theme }) {
  const safeTheme = theme || { primary: "#22d3ee", secondary: "#8b5cf6", accent: "#67e8f9", card: "rgba(10,10,22,0.88)", glow: "rgba(124,58,237,0.35)" };
  const sanctum = { level: 1, willpower: 0, totalMeditationMinutes: 0, ...(state.sanctum || {}) };
  const focus = getFocus(state);
  const manifestations = state.manifestations || [];
  const [inputText, setInputText] = useState("");
  const recentDayKeys = useMemo(() => getRecentDayKeys(7), []);
  const today = getToday();
  const todayFocus = focus.daily?.[today] || { totalMinutes: 0, sessions: 0, xpEarned: 0, modes: {} };
  const todaySanctumMinutes = todayFocus.modes?.sanctum?.minutes || 0;
  const maxDayMinutes = Math.max(45, ...recentDayKeys.map(key => focus.daily?.[key]?.totalMinutes || 0));
  const willpowerTarget = Math.max(1, sanctum.level * 10);
  const willpowerPct = Math.min(100, Math.round((sanctum.willpower / willpowerTarget) * 100));

  const remainingManifestations = PREMIUM_MANIFESTATIONS.filter(pm =>
    !manifestations.some(m => m.text === pm)
  );

  const modeRows = Object.entries(MODE_META).map(([key, meta]) => ({
    key,
    ...meta,
    totalMinutes: focus.modes?.[key]?.totalMinutes || 0,
    sessions: focus.modes?.[key]?.sessions || 0,
    todayMinutes: todayFocus.modes?.[key]?.minutes || 0,
  }));

  const handleAddVision = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newVision = {
      id: genId(),
      text,
      createdAt: new Date().toISOString(),
    };

    persist({
      ...state,
      manifestations: [newVision, ...manifestations],
    });
    setInputText("");
    notify?.("Vision ins Sanctum aufgenommen", "success");
  };

  const rollPremiumManifestation = () => {
    if ((state.gold || 0) < 20) {
      notify?.("Nicht genug Gold. 20G benoetigt.", "error");
      return;
    }
    if (remainingManifestations.length === 0) return;

    const randomItem = remainingManifestations[Math.floor(Math.random() * remainingManifestations.length)];
    const newVision = {
      id: genId(),
      text: randomItem,
      createdAt: new Date().toISOString(),
    };

    persist({
      ...state,
      gold: state.gold - 20,
      manifestations: [newVision, ...manifestations],
    });

    notify?.("Einsicht des Monarchen erlangt. -20G", "success");
  };

  const handleDeleteVision = (id) => {
    persist({
      ...state,
      manifestations: manifestations.filter(m => m.id !== id),
    });
  };

  return (
    <div className="inner-sanctum-view">
      <style>{`
        .inner-sanctum-view {
          animation: fadeIn 0.35s ease;
          color: #f8fafc;
        }
        .sanctum-panel {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.14);
          background: linear-gradient(180deg, rgba(8,12,24,0.9), rgba(4,6,14,0.96));
          box-shadow: 0 18px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
        }
        .sanctum-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 78% 18%, rgba(139,92,246,0.22), transparent 34%),
            linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px);
          background-size: auto, 32px 32px, 32px 32px;
          pointer-events: none;
        }
        .sanctum-kicker {
          color: ${safeTheme.accent || "#67e8f9"};
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .sanctum-title {
          margin-top: 5px;
          color: #fff;
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          font-family: 'Cinzel', serif;
          text-shadow: 0 0 24px ${safeTheme.glow || "rgba(124,58,237,0.35)"};
        }
        .sanctum-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }
        .sanctum-stat {
          position: relative;
          min-width: 0;
          border-radius: 8px;
          padding: 11px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .sanctum-label {
          color: #64748b;
          font-size: 9px;
          letter-spacing: 1.4px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
        }
        .sanctum-value {
          margin-top: 6px;
          color: #f8fafc;
          font-size: 24px;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
        }
        .sanctum-note {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.32;
        }
        .sanctum-mode-row {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.026);
          border: 1px solid rgba(255,255,255,0.065);
        }
        .sanctum-bars {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          align-items: end;
          gap: 7px;
          height: 104px;
          margin-top: 14px;
        }
        .sanctum-bar {
          border-radius: 5px 5px 2px 2px;
          background: linear-gradient(180deg, ${safeTheme.primary || "#22d3ee"}, rgba(255,255,255,0.08));
          box-shadow: 0 0 18px ${safeTheme.glow || "rgba(34,211,238,0.3)"};
        }
        .sanctum-form {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto auto;
          gap: 8px;
          margin-top: 16px;
        }
        @media (max-width: 620px) {
          .sanctum-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sanctum-form { grid-template-columns: minmax(0,1fr) auto; }
          .sanctum-form button[type="button"] { grid-column: 2; }
          .sanctum-title { font-size: 24px; }
        }
      `}</style>

      <section className="sanctum-panel" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <div className="sanctum-kicker">INNER SANCTUM</div>
            <div className="sanctum-title">Monarch Core Lv. {sanctum.level}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 7, lineHeight: 1.4 }}>Willpower, Manifestationen und Focus-Verlauf</div>
          </div>
          <GameIcon src={SHADOW_ICONS.kaelen || STORY_ICONS.arise} fallback="M" size={58} glow glowColor={safeTheme.glow} animate="float" />
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: 17 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <div className="sanctum-label">WILLPOWER MATRIX</div>
            <div style={{ color: safeTheme.accent, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900 }}>{sanctum.willpower}/{willpowerTarget}</div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${willpowerPct}%`, borderRadius: 999, background: `linear-gradient(90deg, ${safeTheme.secondary || "#8b5cf6"}, ${safeTheme.accent || "#67e8f9"})`, boxShadow: `0 0 18px ${safeTheme.glow || "rgba(124,58,237,0.35)"}` }} />
          </div>
        </div>

        <div className="sanctum-grid" style={{ position: "relative", zIndex: 1, marginTop: 14 }}>
          <div className="sanctum-stat">
            <div className="sanctum-label">FOCUS XP</div>
            <div className="sanctum-value">+{sanctum.level}%</div>
            <div className="sanctum-note">Sanctum Rang Bonus</div>
          </div>
          <div className="sanctum-stat">
            <div className="sanctum-label">MEDITATION</div>
            <div className="sanctum-value">{sanctum.totalMeditationMinutes}m</div>
            <div className="sanctum-note">{todaySanctumMinutes}m heute</div>
          </div>
          <div className="sanctum-stat">
            <div className="sanctum-label">FOCUS HEUTE</div>
            <div className="sanctum-value">{todayFocus.totalMinutes || 0}m</div>
            <div className="sanctum-note">{todayFocus.sessions || 0} Sessions / {todayFocus.xpEarned || 0} XP</div>
          </div>
          <div className="sanctum-stat">
            <div className="sanctum-label">FOCUS-STREAK</div>
            <div className="sanctum-value">{focus.streak}d</div>
            <div className="sanctum-note">Best {focus.bestStreak}d</div>
          </div>
        </div>
      </section>

      <section className="sanctum-panel" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div className="sanctum-kicker">FOCUS PROCESSING</div>
              <div style={{ color: "#f8fafc", fontSize: 17, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>Taegliche Minuten</div>
            </div>
            <GameIcon src={STAT_ICONS.int} fallback="I" size={30} glow glowColor={safeTheme.glow} />
          </div>

          <div className="sanctum-bars">
            {recentDayKeys.map(key => {
              const minutes = focus.daily?.[key]?.totalMinutes || 0;
              const height = Math.max(8, Math.round((minutes / maxDayMinutes) * 98));
              return (
                <div key={key} title={`${key}: ${minutes}m`} style={{ minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div className="sanctum-bar" style={{ height }} />
                  <div style={{ marginTop: 6, textAlign: "center", color: key === today ? safeTheme.accent : "#475569", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900 }}>
                    {key.slice(5).replace("-", "/")}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {modeRows.map(mode => (
              <div key={mode.key} className="sanctum-mode-row">
                <div style={{ width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", background: `${mode.color}14`, border: `1px solid ${mode.color}30` }}>
                  <GameIcon src={mode.icon} fallback={mode.label.slice(0, 1)} size={21} glow={mode.totalMinutes > 0} glowColor={`${mode.color}88`} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mode.label}</div>
                  <div style={{ color: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{mode.sessions} Sessions / {mode.todayMinutes}m heute</div>
                </div>
                <div style={{ color: mode.color, fontSize: 13, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>{mode.totalMinutes}m</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sanctum-panel" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="sanctum-kicker">RECENT RUNES</div>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {focus.recentSessions.length === 0 ? (
              <div style={{ padding: 14, borderRadius: 8, color: "#64748b", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12 }}>
                Noch keine Focus-Sessions verarbeitet.
              </div>
            ) : focus.recentSessions.slice(0, 4).map(session => {
              const meta = MODE_META[session.modeId] || MODE_META.pomodoro;
              return (
                <div key={session.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.026)", border: `1px solid ${meta.color}22` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 900, fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.modeName}</div>
                    <div style={{ color: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{session.date} / {formatSessionTime(session.endedAt)}</div>
                  </div>
                  <div style={{ color: meta.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 11 }}>+{session.minutes}m</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sanctum-panel" style={{ padding: 14 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="sanctum-kicker">MANIFESTATION BOARD</div>
          <form onSubmit={handleAddVision} className="sanctum-form">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Neue Manifestation oder Ziel..."
              style={{
                minWidth: 0,
                background: "rgba(2,6,23,0.82)",
                border: `1px solid ${(safeTheme.primary || "#22d3ee")}33`,
                color: "#fff",
                padding: "13px 14px",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
              }}
            />
            {remainingManifestations.length > 0 && (
              <button
                type="button"
                onClick={rollPremiumManifestation}
                title="Premium Manifestation (20G)"
                disabled={(state.gold || 0) < 20}
                style={{
                  width: 48,
                  height: 45,
                  borderRadius: 8,
                  background: (state.gold || 0) >= 20 ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.035)",
                  border: `1px solid ${(state.gold || 0) >= 20 ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.06)"}`,
                  color: (state.gold || 0) >= 20 ? "#f59e0b" : "#475569",
                  cursor: (state.gold || 0) >= 20 ? "pointer" : "not-allowed",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 900,
                  fontSize: 9,
                }}
              >
                20G
              </button>
            )}
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                width: 48,
                height: 45,
                borderRadius: 8,
                background: inputText.trim() ? `linear-gradient(135deg, ${safeTheme.secondary}, ${safeTheme.primary})` : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: inputText.trim() ? "#fff" : "#475569",
                fontWeight: 900,
                cursor: inputText.trim() ? "pointer" : "not-allowed",
                fontSize: 18,
              }}
            >
              +
            </button>
          </form>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {manifestations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px", color: "#64748b", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                Die Zukunft ist ungeschrieben.
              </div>
            ) : manifestations.map(m => (
              <div key={m.id} style={{ padding: "14px 40px 14px 14px", background: "rgba(255,255,255,0.026)", border: `1px solid ${(safeTheme.secondary || "#8b5cf6")}24`, borderRadius: 8, borderLeft: `3px solid ${safeTheme.secondary || "#8b5cf6"}`, position: "relative" }}>
                <div style={{ fontSize: 15, color: "#e2e8f0", fontFamily: "'Cinzel',serif", lineHeight: 1.4 }}>"{m.text}"</div>
                <button onClick={() => handleDeleteVision(m.id)} style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b", fontSize: 11, cursor: "pointer" }}>X</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
