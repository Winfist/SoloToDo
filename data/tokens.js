// Design Tokens — Arise v2.0
// Single source of truth for spacing, radius, typography, shadows, motion.
// CSS counterpart: styles/tokens.css

export const SPACING = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
};

export const RADIUS = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  "2xl": "24px",
  full: "9999px",
};

export const FONT_SIZE = {
  xs: "10px",
  sm: "12px",
  base: "14px",
  md: "16px",
  lg: "18px",
  xl: "22px",
  "2xl": "28px",
  "3xl": "36px",
};

export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  snug: 1.4,
  normal: 1.6,
};

export const SHADOW = {
  sm: "0 2px 8px rgba(0,0,0,0.4)",
  md: "0 4px 16px rgba(0,0,0,0.5)",
  lg: "0 8px 32px rgba(0,0,0,0.6)",
  glow: (color) => `0 0 20px ${color}, 0 0 40px ${color}55`,
  card: (color) => `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${color}12`,
  inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const MOTION = {
  duration: {
    instant: "100ms",
    fast: "200ms",
    normal: "300ms",
    slow: "500ms",
    cinematic: "1200ms",
  },
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    linear: "linear",
  },
};

export const Z_INDEX = {
  base: 0,
  card: 1,
  dropdown: 10,
  sticky: 50,
  nav: 50,
  modal: 100,
  toast: 200,
  tooltip: 300,
  overlay: 400,
};

// Touch target minimum (accessibility)
export const MIN_TOUCH_TARGET = "44px";
