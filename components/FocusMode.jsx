import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateLevelUp, genId } from "../data/constants";
import { getLocalDateKey, getToday, getYesterdayKey } from "../data/dateUtils.js";
import { HABIT_ICONS, JOB_ICONS, NAV_ICONS, SHADOW_ICONS, STAT_ICONS, STORY_ICONS } from "../data/icons.js";
import GameIcon from "./GameIcon.jsx";

const FOCUS_MODES = {
  pomodoro: {
    id: "pomodoro",
    name: "Pomodoro",
    codename: "C-RANK GATE",
    work: 25,
    break: 5,
    color: "#ef4444",
    accent: "#fca5a5",
    aura: "rgba(239,68,68,0.28)",
    icon: HABIT_ICONS.timer,
    shadow: SHADOW_ICONS.soldier,
    stat: "agi",
    xpRate: 2,
  },
  deepWork: {
    id: "deepWork",
    name: "Deep Work",
    codename: "S-RANK RAID",
    work: 90,
    break: 15,
    color: "#8b5cf6",
    accent: "#c4b5fd",
    aura: "rgba(139,92,246,0.34)",
    icon: STORY_ICONS.blackheart,
    shadow: SHADOW_ICONS.mage,
    stat: "int",
    xpRate: 2.4,
  },
  sprint: {
    id: "sprint",
    name: "Sprint",
    codename: "SHADOW STEP",
    work: 45,
    break: 10,
    color: "#06b6d4",
    accent: "#67e8f9",
    aura: "rgba(6,182,212,0.3)",
    icon: JOB_ICONS.shadowstep,
    shadow: SHADOW_ICONS.assassin,
    stat: "agi",
    xpRate: 2.2,
  },
  sanctum: {
    id: "sanctum",
    name: "Inner Sanctum",
    codename: "MONARCH RITUAL",
    work: 10,
    break: 0,
    color: "#22c55e",
    accent: "#86efac",
    aura: "rgba(34,197,94,0.26)",
    icon: STORY_ICONS.arise,
    shadow: SHADOW_ICONS.bellion,
    stat: "vit",
    xpRate: 1.7,
    isSanctum: true,
  },
};

const MODE_IDS = Object.keys(FOCUS_MODES);

const AFFIRMATIONS = [
  "Ich bin der Architekt meines eigenen Schicksals.",
  "Kein Hindernis ist groesser als meine Entschlossenheit.",
  "Mein Fokus ist unerschuetterlich wie Stahl.",
  "Disziplin ist meine Klinge, Geduld mein Schild.",
  "Jeder klare Block macht den naechsten Kampf leichter.",
  "Meine Shadow Army vernichtet meine Ausreden.",
  "Das System belohnt jene, die bleiben.",
];

const blankModeMap = () => Object.fromEntries(MODE_IDS.map(id => [id, { minutes: 0, sessions: 0 }]));
const blankModeTotals = () => Object.fromEntries(MODE_IDS.map(id => [id, { totalMinutes: 0, sessions: 0 }]));

function normalizeFocus(focus = {}) {
  return {
    totalMinutes: focus.totalMinutes || 0,
    totalSessions: focus.totalSessions || 0,
    streak: focus.streak || 0,
    bestStreak: focus.bestStreak || 0,
    lastSessionDate: focus.lastSessionDate || null,
    bestDayMinutes: focus.bestDayMinutes || 0,
    longestSessionMinutes: focus.longestSessionMinutes || 0,
    daily: focus.daily || {},
    modes: {
      ...blankModeTotals(),
      ...(focus.modes || {}),
    },
    recentSessions: Array.isArray(focus.recentSessions) ? focus.recentSessions : [],
  };
}

function normalizeDay(day = {}) {
  return {
    date: day.date || getToday(),
    totalMinutes: day.totalMinutes || 0,
    sessions: day.sessions || 0,
    xpEarned: day.xpEarned || 0,
    lastSessionAt: day.lastSessionAt || null,
    modes: {
      ...blankModeMap(),
      ...(day.modes || {}),
    },
  };
}

function getRecentDayKeys(count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return getLocalDateKey(date);
  });
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function formatStartedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function FocusMode({ state, persist, notify, onExit, theme, processAchievements }) {
  const [activeMode, setActiveMode] = useState(FOCUS_MODES.pomodoro);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [timeLeft, setTimeLeft] = useState(activeMode.work * 60);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [completionBurst, setCompletionBurst] = useState(null);

  const stateRef = useRef(state);
  const completionTokenRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const focus = normalizeFocus(state?.focus);
  const todayKey = getToday();
  const todayFocus = normalizeDay(focus.daily?.[todayKey]);
  const todayMode = todayFocus.modes?.[activeMode.id] || { minutes: 0, sessions: 0 };
  const modeTotals = focus.modes?.[activeMode.id] || { totalMinutes: 0, sessions: 0 };
  const recentDayKeys = useMemo(() => getRecentDayKeys(7), []);
  const maxDayMinutes = Math.max(60, ...recentDayKeys.map(key => focus.daily?.[key]?.totalMinutes || 0));

  const manifestationsList = useMemo(() => {
    const custom = state?.manifestations?.map(m => m.text).filter(Boolean) || [];
    return custom.length > 0 ? custom : AFFIRMATIONS;
  }, [state?.manifestations]);

  useEffect(() => {
    if (running && phase === "work") {
      const interval = setInterval(() => {
        setAffirmationIdx(prev => (prev + 1) % manifestationsList.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [running, phase, manifestationsList.length]);

  useEffect(() => {
    setTimeLeft(activeMode.work * 60);
    setPhase("work");
    setSessionStartedAt(null);
    completionTokenRef.current = null;
  }, [activeMode]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!completionBurst) return;
    const timeout = setTimeout(() => setCompletionBurst(null), 2600);
    return () => clearTimeout(timeout);
  }, [completionBurst]);

  const writeFocusSession = useCallback((currentState, mode, minutes, xpGain, startedAt, endedAt) => {
    const currentFocus = normalizeFocus(currentState.focus);
    const today = getToday();
    const yesterday = getYesterdayKey();
    const existingDay = normalizeDay(currentFocus.daily?.[today]);
    const existingDayMode = existingDay.modes?.[mode.id] || { minutes: 0, sessions: 0 };
    const existingModeTotal = currentFocus.modes?.[mode.id] || { totalMinutes: 0, sessions: 0 };
    const sameDay = currentFocus.lastSessionDate === today;
    const continues = currentFocus.lastSessionDate === yesterday;
    const focusStreak = sameDay ? Math.max(currentFocus.streak || 1, 1) : continues ? (currentFocus.streak || 0) + 1 : 1;

    const nextDay = {
      ...existingDay,
      date: today,
      totalMinutes: existingDay.totalMinutes + minutes,
      sessions: existingDay.sessions + 1,
      xpEarned: existingDay.xpEarned + xpGain,
      lastSessionAt: endedAt,
      modes: {
        ...existingDay.modes,
        [mode.id]: {
          minutes: existingDayMode.minutes + minutes,
          sessions: existingDayMode.sessions + 1,
        },
      },
    };

    return {
      ...currentFocus,
      totalMinutes: currentFocus.totalMinutes + minutes,
      totalSessions: currentFocus.totalSessions + 1,
      streak: focusStreak,
      bestStreak: Math.max(currentFocus.bestStreak || 0, focusStreak),
      lastSessionDate: today,
      bestDayMinutes: Math.max(currentFocus.bestDayMinutes || 0, nextDay.totalMinutes),
      longestSessionMinutes: Math.max(currentFocus.longestSessionMinutes || 0, minutes),
      daily: {
        ...currentFocus.daily,
        [today]: nextDay,
      },
      modes: {
        ...currentFocus.modes,
        [mode.id]: {
          totalMinutes: existingModeTotal.totalMinutes + minutes,
          sessions: existingModeTotal.sessions + 1,
        },
      },
      recentSessions: [
        {
          id: genId(),
          date: today,
          modeId: mode.id,
          modeName: mode.name,
          minutes,
          xp: xpGain,
          startedAt,
          endedAt,
        },
        ...currentFocus.recentSessions,
      ].slice(0, 12),
    };
  }, []);

  const completeWorkPhase = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState) return;

    const minutesCompleted = activeMode.work;
    const startedAt = sessionStartedAt || Date.now() - minutesCompleted * 60 * 1000;
    const endedAt = Date.now();
    const streakBonus = Math.min(sessionStreak * 5, 30);
    const sanctumXpBonus = ((currentState.sanctum?.level || 1) / 100);
    const xpGain = Math.max(1, Math.round((minutesCompleted * activeMode.xpRate + streakBonus) * (1 + sanctumXpBonus)));
    const oldLevel = currentState.level || 1;

    let nextState = calculateLevelUp(currentState, xpGain);
    const focusStatGain = activeMode.isSanctum
      ? 0
      : Math.max(1, Math.floor(minutesCompleted / (activeMode.id === "deepWork" ? 45 : 60)));

    nextState.stats = {
      ...(nextState.stats || {}),
      focusSessions: ((nextState.stats?.focusSessions) || 0) + 1,
      focusMinutes: ((nextState.stats?.focusMinutes) || 0) + minutesCompleted,
      ...(activeMode.stat && focusStatGain > 0
        ? { [activeMode.stat]: ((nextState.stats?.[activeMode.stat]) || 0) + focusStatGain }
        : {}),
    };

    nextState.focus = writeFocusSession(nextState, activeMode, minutesCompleted, xpGain, startedAt, endedAt);

    if (activeMode.isSanctum) {
      const sanctum = {
        level: 1,
        willpower: 0,
        totalMeditationMinutes: 0,
        ...(nextState.sanctum || {}),
      };
      const willpowerGain = Math.max(1, Math.floor(minutesCompleted / 5));
      const vitGain = Math.max(1, Math.floor(minutesCompleted / 10));
      sanctum.totalMeditationMinutes += minutesCompleted;
      sanctum.willpower += willpowerGain;

      let sanctumLeveled = false;
      while (sanctum.willpower >= sanctum.level * 10) {
        sanctum.willpower -= sanctum.level * 10;
        sanctum.level += 1;
        sanctumLeveled = true;
      }

      nextState.sanctum = sanctum;
      nextState.stats = {
        ...(nextState.stats || {}),
        vit: ((nextState.stats?.vit) || 0) + vitGain,
      };

      notify?.(`Sanctum komplett: +${willpowerGain} Willpower, +${vitGain} VIT, +${xpGain} XP`, "success");
      if (sanctumLeveled) {
        setTimeout(() => notify?.(`SANCTUM LEVEL UP: Lv. ${sanctum.level}`, "success"), 900);
      }
    } else {
      const statLabel = activeMode.stat ? activeMode.stat.toUpperCase() : "FOCUS";
      notify?.(`${activeMode.name} abgeschlossen: +${minutesCompleted}m, +${xpGain} XP, +${focusStatGain} ${statLabel}`, "success");
    }

    const processedState = processAchievements ? processAchievements(nextState) : nextState;
    persist(processedState);

    if ((processedState.level || oldLevel) > oldLevel) {
      setTimeout(() => notify?.(`LEVEL UP: Lv. ${processedState.level}`, "levelup"), 600);
    }

    setCompletionBurst({ mode: activeMode.name, minutes: minutesCompleted, xp: xpGain });
    setSessionStreak(prev => prev + 1);
    setSessionStartedAt(null);

    try {
      new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
    } catch {}

    if (activeMode.break > 0) {
      setPhase("break");
      setTimeLeft(activeMode.break * 60);
      setRunning(true);
    } else {
      setRunning(false);
      setPhase("work");
      setTimeLeft(activeMode.work * 60);
    }
  }, [activeMode, notify, persist, processAchievements, sessionStartedAt, sessionStreak, writeFocusSession]);

  useEffect(() => {
    if (!running || timeLeft !== 0) return;
    const token = `${phase}-${activeMode.id}-${sessionStartedAt || "break"}`;
    if (completionTokenRef.current === token) return;
    completionTokenRef.current = token;

    if (phase === "work") {
      completeWorkPhase();
      return;
    }

    setRunning(false);
    setPhase("work");
    setTimeLeft(activeMode.work * 60);
    setSessionStartedAt(null);
    notify?.("Recovery abgeschlossen. Naechstes Gate bereit.", "info");
  }, [activeMode, completeWorkPhase, notify, phase, running, sessionStartedAt, timeLeft]);

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (phase === "work" && timeLeft === activeMode.work * 60) {
      setSessionStartedAt(Date.now());
      setAffirmationIdx(0);
    }
    completionTokenRef.current = null;
    setRunning(true);
  };

  const resetTimer = () => {
    const hadWorkProgress = phase === "work" && timeLeft < activeMode.work * 60;
    setRunning(false);
    setPhase("work");
    setTimeLeft(activeMode.work * 60);
    setSessionStartedAt(null);
    completionTokenRef.current = null;
    if (hadWorkProgress) {
      setSessionStreak(0);
      notify?.("Fokusversuch verworfen. Session-Kette zurueckgesetzt.", "warning");
    }
  };

  const skipBreak = () => {
    setRunning(false);
    setPhase("work");
    setTimeLeft(activeMode.work * 60);
    completionTokenRef.current = null;
    notify?.("Recovery uebersprungen. Gate bereit.", "info");
  };

  const selectMode = (mode) => {
    if (running) return;
    setActiveMode(mode);
    setPhase("work");
    setTimeLeft(mode.work * 60);
    setSessionStartedAt(null);
    completionTokenRef.current = null;
  };

  const totalSeconds = phase === "work" ? activeMode.work * 60 : Math.max(1, activeMode.break * 60);
  const progress = totalSeconds > 0 ? Math.min(100, Math.max(0, 100 - (timeLeft / totalSeconds) * 100)) : 100;
  const statusLabel = phase === "work" ? (running ? "GATE ENGAGED" : "GATE STANDBY") : "RECOVERY FIELD";
  const nextRewardXp = Math.max(1, Math.round((activeMode.work * activeMode.xpRate + Math.min(sessionStreak * 5, 30)) * (1 + ((state?.sanctum?.level || 1) / 100))));

  return (
    <div className="focus-mode" style={{ "--mode-color": activeMode.color, "--mode-accent": activeMode.accent, "--mode-aura": activeMode.aura }}>
      <style>{`
        .focus-mode {
          position: fixed;
          inset: 0;
          z-index: 900;
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 42%, var(--mode-aura), transparent 32%),
            radial-gradient(circle at 15% 15%, rgba(6,182,212,0.13), transparent 30%),
            linear-gradient(180deg, #050712 0%, #020309 58%, #000 100%);
          color: #f8fafc;
          overflow: hidden;
          isolation: isolate;
          animation: fadeIn 0.35s ease;
        }
        .focus-mode::before {
          content: "";
          position: absolute;
          inset: -20%;
          background:
            linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          transform: perspective(900px) rotateX(58deg) translateY(14%);
          transform-origin: center bottom;
          opacity: 0.55;
          mask-image: linear-gradient(to bottom, transparent, #000 20%, transparent 85%);
          pointer-events: none;
        }
        .focus-mode::after {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 5px);
          opacity: 0.28;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .focus-shell {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 14px;
          padding: max(16px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
          max-width: 1120px;
          margin: 0 auto;
        }
        .focus-topbar,
        .focus-mode-card,
        .focus-stat,
        .focus-feed {
          border: 1px solid rgba(148,163,184,0.14);
          background: linear-gradient(180deg, rgba(8,12,24,0.78), rgba(4,6,14,0.88));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.24);
          backdrop-filter: blur(18px);
        }
        .focus-topbar {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          border-radius: 8px;
          padding: 10px;
        }
        .focus-icon-button {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          color: #cbd5e1;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .focus-icon-button:hover {
          transform: translateY(-1px);
          border-color: var(--mode-color);
          color: #fff;
        }
        .focus-title { min-width: 0; }
        .focus-kicker {
          color: var(--mode-accent);
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .focus-heading {
          margin-top: 3px;
          color: #fff;
          font-size: 20px;
          line-height: 1.05;
          font-weight: 900;
          font-family: 'Cinzel', serif;
          text-shadow: 0 0 22px var(--mode-aura);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .focus-mode-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }
        .focus-mode-card {
          position: relative;
          overflow: hidden;
          min-height: 92px;
          padding: 11px;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        .focus-mode-card[aria-pressed="true"] {
          border-color: color-mix(in srgb, var(--card-color), #fff 8%);
          background: linear-gradient(180deg, color-mix(in srgb, var(--card-color) 18%, rgba(8,12,24,0.82)), rgba(4,6,14,0.9));
        }
        .focus-mode-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--card-color), #fff 18%);
        }
        .focus-mode-card:disabled {
          cursor: default;
          opacity: 0.72;
          transform: none;
        }
        .focus-mode-card::after {
          content: "";
          position: absolute;
          right: -28px;
          bottom: -28px;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--card-color) 26%, transparent), transparent 66%);
          pointer-events: none;
        }
        .focus-arena {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          align-items: center;
          gap: 18px;
          min-height: 0;
        }
        .focus-gate-wrap {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 380px;
        }
        .focus-shadow {
          position: absolute;
          width: 220px;
          height: 220px;
          object-fit: contain;
          opacity: 0.2;
          filter: drop-shadow(0 0 34px var(--mode-aura));
          transform: translateY(8px) scale(1.08);
          pointer-events: none;
        }
        .focus-ring {
          position: relative;
          width: 338px;
          height: 338px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(var(--mode-color) calc(var(--progress) * 1%), rgba(255,255,255,0.075) 0);
          box-shadow: 0 0 48px var(--mode-aura), inset 0 0 38px rgba(255,255,255,0.05);
        }
        .focus-ring::before,
        .focus-ring::after {
          content: "";
          position: absolute;
          inset: -16px;
          border: 1px solid color-mix(in srgb, var(--mode-color) 34%, transparent);
          border-radius: 50%;
          animation: focusSpin 16s linear infinite;
          border-left-color: transparent;
          border-right-color: transparent;
        }
        .focus-ring::after {
          inset: 18px;
          animation-duration: 9s;
          animation-direction: reverse;
          opacity: 0.55;
        }
        .focus-core {
          position: relative;
          width: 296px;
          height: 296px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 30%, rgba(255,255,255,0.075), transparent 34%),
            linear-gradient(180deg, rgba(6,8,18,0.98), rgba(1,2,7,0.99));
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .focus-core::before {
          content: "";
          position: absolute;
          inset: 18px;
          border-radius: 50%;
          border: 1px dashed color-mix(in srgb, var(--mode-color) 34%, transparent);
          opacity: 0.48;
        }
        .focus-status {
          position: relative;
          z-index: 1;
          color: var(--mode-accent);
          font-size: 10px;
          letter-spacing: 3px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
        }
        .focus-time {
          position: relative;
          z-index: 1;
          margin-top: 13px;
          color: #fff;
          font-size: 86px;
          line-height: 0.9;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          text-shadow: 0 0 36px var(--mode-aura);
        }
        .focus-phase {
          position: relative;
          z-index: 1;
          margin-top: 15px;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
        }
        .focus-quote {
          max-width: 620px;
          margin: 20px auto 0;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dbeafe;
          font-family: 'Cinzel', serif;
          font-size: 17px;
          line-height: 1.35;
          text-align: center;
          text-shadow: 0 0 20px var(--mode-aura);
        }
        .focus-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 19px;
        }
        .focus-primary {
          min-width: 132px;
          height: 48px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--mode-color), color-mix(in srgb, var(--mode-color), #fff 18%));
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          font-size: 12px;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          box-shadow: 0 18px 38px var(--mode-aura);
          cursor: pointer;
        }
        .focus-secondary {
          min-width: 48px;
          height: 48px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.09);
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          cursor: pointer;
        }
        .focus-side {
          display: grid;
          gap: 9px;
        }
        .focus-stat {
          border-radius: 8px;
          padding: 12px;
          min-width: 0;
        }
        .focus-stat-label {
          color: #64748b;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .focus-stat-value {
          margin-top: 5px;
          color: #f8fafc;
          font-size: 26px;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
        }
        .focus-stat-note {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.28;
        }
        .focus-feed {
          border-radius: 8px;
          padding: 12px;
        }
        .focus-day-bars {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
          align-items: end;
          height: 78px;
          margin-top: 11px;
        }
        .focus-day {
          min-height: 8px;
          border-radius: 5px 5px 2px 2px;
          background: linear-gradient(180deg, var(--mode-color), rgba(255,255,255,0.08));
          box-shadow: 0 0 14px var(--mode-aura);
        }
        .focus-burst {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 4;
          border-radius: 8px;
          padding: 16px 18px;
          min-width: 240px;
          text-align: center;
          background: rgba(2,6,23,0.9);
          border: 1px solid color-mix(in srgb, var(--mode-color) 62%, #fff 12%);
          box-shadow: 0 0 70px var(--mode-aura);
          animation: focusBurst 2.4s ease both;
          pointer-events: none;
        }
        @keyframes focusSpin { to { transform: rotate(360deg); } }
        @keyframes focusBurst {
          0% { opacity: 0; transform: translate(-50%, -46%) scale(0.86); filter: blur(10px); }
          16% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
          78% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -55%) scale(0.96); }
        }
        @media (max-width: 840px) {
          .focus-shell { gap: 11px; padding-left: 12px; padding-right: 12px; }
          .focus-mode-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .focus-arena { grid-template-columns: 1fr; gap: 10px; }
          .focus-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .focus-feed { grid-column: 1 / -1; }
          .focus-gate-wrap { min-height: 340px; }
          .focus-ring { width: 306px; height: 306px; }
          .focus-core { width: 266px; height: 266px; }
          .focus-time { font-size: 72px; }
          .focus-quote { font-size: 14px; margin-top: 14px; }
        }
        @media (max-width: 380px) {
          .focus-heading { font-size: 17px; }
          .focus-mode-card { min-height: 84px; padding: 9px; }
          .focus-ring { width: 268px; height: 268px; }
          .focus-core { width: 232px; height: 232px; }
          .focus-time { font-size: 58px; }
          .focus-side { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="focus-shell">
        <header className="focus-topbar">
          <button className="focus-icon-button" onClick={onExit} aria-label="Focus Mode schliessen">X</button>
          <div className="focus-title">
            <div className="focus-kicker">{activeMode.codename}</div>
            <div className="focus-heading">{activeMode.name} Protocol</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "flex-end" }}>
            <GameIcon src={STAT_ICONS.str} fallback="S" size={20} glow glowColor={activeMode.aura} />
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#f8fafc", fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 13 }}>{sessionStreak}</div>
              <div style={{ color: "#64748b", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: 1 }}>CHAIN</div>
            </div>
          </div>
        </header>

        <div className="focus-mode-grid" aria-label="Focus Modus">
          {Object.values(FOCUS_MODES).map(mode => {
            const active = mode.id === activeMode.id;
            const modeDay = todayFocus.modes?.[mode.id] || { minutes: 0, sessions: 0 };
            return (
              <button
                key={mode.id}
                className="focus-mode-card"
                type="button"
                disabled={running}
                aria-pressed={active}
                onClick={() => selectMode(mode)}
                style={{ "--card-color": mode.color }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, position: "relative", zIndex: 1 }}>
                  <GameIcon src={mode.icon} fallback={mode.name.slice(0, 1)} size={30} glow={active} glowColor={mode.aura} />
                  <div style={{ color: active ? mode.accent : "#64748b", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 900 }}>
                    {mode.work}/{mode.break}
                  </div>
                </div>
                <div style={{ position: "relative", zIndex: 1, marginTop: 10 }}>
                  <div style={{ color: active ? "#fff" : "#cbd5e1", fontSize: 13, fontWeight: 900, fontFamily: "'Outfit',sans-serif", lineHeight: 1.08 }}>{mode.name}</div>
                  <div style={{ marginTop: 5, color: active ? mode.accent : "#64748b", fontSize: 9, letterSpacing: 1.1, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>
                    {modeDay.minutes}m heute
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <main className="focus-arena">
          <section>
            <div className="focus-gate-wrap">
              <img className="focus-shadow" src={activeMode.shadow || NAV_ICONS.timer} alt="" />
              <div className="focus-ring" style={{ "--progress": progress }}>
                <div className="focus-core">
                  <div className="focus-status">{statusLabel}</div>
                  <div className="focus-time">{formatTime(timeLeft)}</div>
                  <div className="focus-phase">{phase === "work" ? `${activeMode.work} MIN COMBAT` : `${activeMode.break} MIN RECOVERY`}</div>
                </div>
              </div>
            </div>

            <div className="focus-quote" key={affirmationIdx}>
              {phase === "work" ? `"${manifestationsList[affirmationIdx]}"` : "Mana stabilisiert. Atmung ruhig. Klinge bereit."}
            </div>

            <div className="focus-controls">
              <button className="focus-primary" onClick={toggleTimer}>
                {running ? "PAUSE" : phase === "break" ? "RESUME" : timeLeft === activeMode.work * 60 ? "START" : "RESUME"}
              </button>
              <button className="focus-secondary" onClick={resetTimer} aria-label="Timer zuruecksetzen">RST</button>
              {phase === "break" && (
                <button className="focus-secondary" onClick={skipBreak} aria-label="Pause ueberspringen">SKIP</button>
              )}
            </div>
          </section>

          <aside className="focus-side">
            <div className="focus-stat">
              <div className="focus-stat-label">HEUTE</div>
              <div className="focus-stat-value">{todayFocus.totalMinutes}m</div>
              <div className="focus-stat-note">{todayFocus.sessions} Sessions / {todayFocus.xpEarned} XP verarbeitet</div>
            </div>
            <div className="focus-stat">
              <div className="focus-stat-label">AKTIVER MODUS</div>
              <div className="focus-stat-value">{todayMode.minutes}m</div>
              <div className="focus-stat-note">{modeTotals.totalMinutes}m gesamt / naechste +{nextRewardXp} XP</div>
            </div>
            <div className="focus-stat">
              <div className="focus-stat-label">FOCUS-STREAK</div>
              <div className="focus-stat-value">{focus.streak}d</div>
              <div className="focus-stat-note">Best {focus.bestStreak}d / Rekordtag {focus.bestDayMinutes}m</div>
            </div>
            <div className="focus-stat">
              <div className="focus-stat-label">TOTAL</div>
              <div className="focus-stat-value">{focus.totalMinutes}m</div>
              <div className="focus-stat-note">{focus.totalSessions} Sessions / laengste {focus.longestSessionMinutes}m</div>
            </div>
            <div className="focus-feed">
              <div className="focus-stat-label">7-TAGE FLUSS</div>
              <div className="focus-day-bars">
                {recentDayKeys.map(key => {
                  const minutes = focus.daily?.[key]?.totalMinutes || 0;
                  const height = Math.max(8, Math.round((minutes / maxDayMinutes) * 72));
                  return (
                    <div key={key} title={`${key}: ${minutes}m`} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 78 }}>
                      <div className="focus-day" style={{ height }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 9, display: "grid", gap: 6 }}>
                {(focus.recentSessions || []).slice(0, 2).map(session => (
                  <div key={session.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, color: "#94a3b8", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.modeName} / {formatStartedAt(session.endedAt)}</span>
                    <span style={{ color: activeMode.accent }}>{session.minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        <footer style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {Object.values(FOCUS_MODES).map(mode => {
            const total = focus.modes?.[mode.id]?.totalMinutes || 0;
            return (
              <div key={mode.id} style={{ minWidth: 0, padding: "9px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${mode.color}22` }}>
                <div style={{ color: mode.color, fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mode.name.toUpperCase()}</div>
                <div style={{ color: "#e2e8f0", marginTop: 3, fontSize: 13, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>{total}m</div>
              </div>
            );
          })}
        </footer>
      </div>

      {completionBurst && (
        <div className="focus-burst">
          <div style={{ color: activeMode.accent, fontSize: 10, letterSpacing: 2.2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 900 }}>SESSION PROCESSED</div>
          <div style={{ color: "#fff", fontSize: 25, fontFamily: "'Cinzel',serif", fontWeight: 900, marginTop: 7 }}>{completionBurst.mode}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 7, fontFamily: "'JetBrains Mono',monospace" }}>
            +{completionBurst.minutes}m / +{completionBurst.xp} XP
          </div>
        </div>
      )}
    </div>
  );
}
