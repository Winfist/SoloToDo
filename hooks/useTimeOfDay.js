// useTimeOfDay.js – Time-of-day detection for dynamic atmosphere
import { useState, useEffect } from "react";

const PERIODS = {
  dawn:      { start: 5,  end: 7,  label: "Morgendämmerung" },
  morning:   { start: 7,  end: 12, label: "Morgen" },
  afternoon: { start: 12, end: 17, label: "Nachmittag" },
  evening:   { start: 17, end: 21, label: "Abend" },
  night:     { start: 21, end: 5,  label: "Nacht" },
};

// Color palettes for each period
const PALETTES = {
  dawn: {
    primary: "rgba(251,191,36,0.06)",
    secondary: "rgba(249,115,22,0.04)",
    ambient: "rgba(251,191,36,0.03)",
    accent: "#fbbf24",
    warmth: 0.7,
  },
  morning: {
    primary: "rgba(34,211,238,0.06)",
    secondary: "rgba(56,189,248,0.04)",
    ambient: "rgba(34,211,238,0.03)",
    accent: "#22d3ee",
    warmth: 0.3,
  },
  afternoon: {
    primary: "rgba(168,85,247,0.05)",
    secondary: "rgba(99,102,241,0.04)",
    ambient: "rgba(168,85,247,0.03)",
    accent: "#a855f7",
    warmth: 0.5,
  },
  evening: {
    primary: "rgba(249,115,22,0.06)",
    secondary: "rgba(220,38,38,0.03)",
    ambient: "rgba(251,146,60,0.04)",
    accent: "#f97316",
    warmth: 0.8,
  },
  night: {
    primary: "rgba(99,102,241,0.05)",
    secondary: "rgba(124,58,237,0.04)",
    ambient: "rgba(99,102,241,0.02)",
    accent: "#6366f1",
    warmth: 0.1,
  },
};

function getPeriod(hour) {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * useTimeOfDay()
 *
 * Returns current time-of-day info with color palette.
 * Updates every 10 minutes.
 *
 * @returns {{ period, hour, label, colors, warmth }}
 */
export function useTimeOfDay() {
  const [timeInfo, setTimeInfo] = useState(() => {
    const hour = new Date().getHours();
    const period = getPeriod(hour);
    return {
      period,
      hour,
      label: PERIODS[period].label,
      colors: PALETTES[period],
      warmth: PALETTES[period].warmth,
    };
  });

  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours();
      const period = getPeriod(hour);
      setTimeInfo({
        period,
        hour,
        label: PERIODS[period].label,
        colors: PALETTES[period],
        warmth: PALETTES[period].warmth,
      });
    };

    // Check every 10 minutes
    const interval = setInterval(check, 600000);
    return () => clearInterval(interval);
  }, []);

  return timeInfo;
}
