// ═══ UNIFIED RESULT MODAL — ULTIMATE CINEMATIC ════════════════════════════════
// AAA Abyssal Sovereign-style "Nexus Window" — maximum dopamine reward screen.
//
// 10 Effect Layers (bottom to top):
//   L1:  Void Dimension (cosmic nebula + depth lighting)
//   L2:  Screen-Crack   (boss — reality fracture effect)
//   L3:  Particle Burst  (radial explosion, 40-80 particles)
//   L4:  Expanding Rings (shockwave ripples)
//   L5:  Rune Sigil      (dual rotating magic circle + cardinal runes)
//   L6:  Energy Absorption (particles flowing INTO the window)
//   L7:  System Window   (holographic shine, breathe, scanline, glitch)
//   L8:  XP Bar Fill     (in-modal progress bar that fills up live)
//   L9:  Golden Confetti  (boss/perfect — falling golden particles)
//   L10: Screen-Shake + Impact Flash + Edge Glow
//   +    Energy Streaks, Letter Reveal, Streak Flames, Difficulty Badge,
//        Power-Surge Waves, Dramatic Pause, Prismatic Edge
//
// Only the "WEITER" CTA closes the modal — overlay click is blocked.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  border:       "#1e3a5f",
  borderBlue:   "#3b82f6",
  borderGold:   "#f59e0b",
  borderRed:    "#ef4444",
  headerBg:     "linear-gradient(135deg, #060b18, #0f1729)",
  bodyBg:       "rgba(2, 4, 12, 0.98)",
  text:         "#dbeafe",
  silver:       "#94a3b8",
  gold:         "#fbbf24",
  xpPurple:     "#a78bfa",
  cyan:         "#22d3ee",
  successGreen: "#34d399",
  emergencyRed: "#ef4444",
  dimText:      "#475569",
};

// ── VARIANT HELPERS ──────────────────────────────────────────────────────────
function getBorderColor(v) {
  if (v === 'emergency') return C.borderRed;
  if (v === 'boss' || v === 'story_boss' || v === 'perfect_run') return C.borderGold;
  return C.borderBlue;
}

function getNebulaColors(v) {
  if (v === 'emergency') return { c1: '#2a0508', c2: '#0d0102', c3: '#1a030855' };
  if (v === 'boss' || v === 'story_boss') return { c1: '#1a0305', c2: '#0d0102', c3: '#2a050855' };
  if (v === 'perfect_run') return { c1: '#1a1503', c2: '#0d0c01', c3: '#2a1f0355' };
  return { c1: '#080e2a', c2: '#030618', c3: '#0a1a3e55' };
}

function getParticleCount(v) {
  if (v === 'boss' || v === 'story_boss') return 80;
  if (v === 'emergency') return 60;
  if (v === 'perfect_run') return 50;
  return 40;
}

function getHighlightIcon(kind) {
  switch (kind) {
    case 'arise':           return '☽';
    case 'named_shadow':    return '◈';
    case 'achievement':     return '★';
    case 'hidden_quest':    return '◇';
    case 'charisma_dungeon':return '♟';
    case 'regression':      return '↑';
    case 'level_up':        return '▲';
    case 'title':           return '♛';
    default:                return '•';
  }
}

function hasImpact(v) {
  return v === 'boss' || v === 'story_boss' || v === 'emergency' || v === 'perfect_run';
}

function getDiffLabel(variant, source) {
  if (variant === 'boss' || variant === 'story_boss') return 'S-RANG';
  if (variant === 'emergency') return 'NOTFALL';
  if (variant === 'perfect_run') return 'PERFEKT';
  if (variant === 'defeat') return 'NIEDERLAGE';
  return source === 'dungeon' ? 'GATE' : 'QUEST';
}

// ── COUNTER HOOK ─────────────────────────────────────────────────────────────
function useCounter(target, duration = 500, trigger = false) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!trigger || !target) { setVal(0); return; }
    const num = parseInt(String(target).replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num <= 0) { setVal(target); return; }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(num * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, trigger]);
  return val;
}

// ── GENERATE PARTICLES ───────────────────────────────────────────────────────
function generateBurstParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const rad = (angle * Math.PI) / 180;
    const dist = 90 + Math.random() * 220;
    const isDiamond = Math.random() > 0.6;
    return {
      id: i, x: Math.cos(rad) * dist, y: Math.sin(rad) * dist - Math.random() * 60,
      size: isDiamond ? 3 + Math.random() * 4 : 2 + Math.random() * 3.5,
      delay: Math.random() * 200, dur: 700 + Math.random() * 500,
      bright: Math.random() > 0.35, isDiamond,
    };
  });
}

function generateAmbientParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `amb_${i}`, left: Math.random() * 100,
    size: 1 + Math.random() * 2.5, drift: (Math.random() - 0.5) * 60,
    dur: 6 + Math.random() * 8, delay: Math.random() * 6,
    opacity: 0.3 + Math.random() * 0.4, isDiamond: Math.random() > 0.7,
  }));
}

function generateConfetti(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `conf_${i}`, left: Math.random() * 100,
    size: 2 + Math.random() * 4, dur: 3 + Math.random() * 4,
    delay: Math.random() * 3, drift: (Math.random() - 0.5) * 80,
    rotation: Math.random() * 360, isGold: Math.random() > 0.3,
  }));
}

function generateAbsorptionParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * 360;
    const rad = (angle * Math.PI) / 180;
    const startDist = 200 + Math.random() * 200;
    return {
      id: `abs_${i}`,
      startX: Math.cos(rad) * startDist, startY: Math.sin(rad) * startDist,
      size: 1 + Math.random() * 2, delay: 400 + Math.random() * 800,
      dur: 600 + Math.random() * 400,
    };
  });
}

function generateCrackLines(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + Math.random() * 20;
    const len = 30 + Math.random() * 60;
    return { id: `crack_${i}`, angle, len, width: 0.5 + Math.random() * 1.5, delay: Math.random() * 200 };
  });
}

// ── CSS KEYFRAMES (dynamically generated per variant) ────────────────────────
function buildKeyframes(borderColor, variant) {
  const isEmergency = variant === 'emergency';
  const isBoss = variant === 'boss' || variant === 'story_boss';
  return `
    /* ── VOID DIMENSION ───────────────────────────── */
    @keyframes urmVoidIn {
      0% { opacity: 0 } 100% { opacity: 1 }
    }
    @keyframes urmDramaticPause {
      0% { opacity: 0 }
      30% { opacity: 1 }
      70% { opacity: 1 }
      100% { opacity: 0.3 }
    }
    @keyframes urmNebulaPulse {
      0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg) }
      50% { opacity: 0.55; transform: scale(1.08) rotate(3deg) }
    }
    @keyframes urmNebulaDrift {
      0%, 100% { transform: translate(0,0) scale(1); opacity: 0.2 }
      33% { transform: translate(18px,-12px) scale(1.04); opacity: 0.35 }
      66% { transform: translate(-12px, 10px) scale(0.97); opacity: 0.25 }
    }
    @keyframes urmVignette {
      0% { box-shadow: inset 0 0 0 rgba(0,0,0,0) }
      100% { box-shadow: inset 0 0 250px 100px rgba(0,0,0,0.8) }
    }

    /* ── SCREEN CRACK (boss only) ─────────────────── */
    @keyframes urmCrackGrow {
      0% { transform: scaleX(0); opacity: 0 }
      50% { opacity: 1 }
      100% { transform: scaleX(1); opacity: 0.7 }
    }
    @keyframes urmCrackFade {
      0%, 70% { opacity: 0.6 }
      100% { opacity: 0 }
    }

    /* ── PARTICLE BURST ───────────────────────────── */
    @keyframes urmParticleBurst {
      0% { transform: translate(0,0) scale(1); opacity: 1 }
      20% { opacity: 0.95 }
      70% { transform: translate(var(--px), var(--py)) scale(0.35); opacity: 0.3 }
      100% { transform: translate(var(--px), var(--py)) scale(0); opacity: 0 }
    }

    /* ── EXPANDING RINGS ──────────────────────────── */
    @keyframes urmRingExpand {
      0% { width: 0; height: 0; opacity: 0.9; border-width: 2.5px }
      45% { opacity: 0.5; border-width: 1.5px }
      100% { width: 450px; height: 450px; opacity: 0; border-width: 0.5px }
    }
    @keyframes urmRingExpandSm {
      0% { width: 0; height: 0; opacity: 0.7; border-width: 1.5px }
      100% { width: 300px; height: 300px; opacity: 0; border-width: 0.5px }
    }

    /* ── RUNE SIGIL ───────────────────────────────── */
    @keyframes urmSigilAppear {
      0% { transform: translate(-50%,-50%) scale(0) rotate(-40deg); opacity: 0 }
      45% { opacity: 0.8 }
      70% { transform: translate(-50%,-50%) scale(1.2) rotate(8deg); opacity: 0.5 }
      100% { transform: translate(-50%,-50%) scale(1) rotate(0); opacity: 1 }
    }
    @keyframes urmSigilRotate { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
    @keyframes urmSigilCounter { from { transform: rotate(360deg) } to { transform: rotate(0deg) } }
    @keyframes urmSigilPulse {
      0%,100% { opacity: 0.05; filter: brightness(1) }
      50% { opacity: 0.15; filter: brightness(1.3) }
    }
    @keyframes urmRuneGlow {
      0%,100% { text-shadow: 0 0 3px ${borderColor}66; opacity: 0.4 }
      50% { text-shadow: 0 0 14px ${borderColor}, 0 0 28px ${borderColor}88; opacity: 1 }
    }
    @keyframes urmRuneFloat {
      0%,100% { transform: translate(-50%,-50%) translateY(0) }
      50% { transform: translate(-50%,-50%) translateY(-6px) }
    }

    /* ── ENERGY ABSORPTION ────────────────────────── */
    @keyframes urmAbsorb {
      0% { transform: translate(var(--startX), var(--startY)) scale(1); opacity: 0.8 }
      70% { opacity: 0.6 }
      100% { transform: translate(0, 0) scale(0); opacity: 0 }
    }

    /* ── SYSTEM WINDOW ────────────────────────────── */
    @keyframes urmWindowIn {
      0% { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(10px) brightness(2) }
      25% { filter: blur(4px) brightness(1.3) }
      50% { opacity: 0.9; transform: scale(1.02) translateY(-3px); filter: blur(0) brightness(1.05) }
      75% { transform: scale(0.997) translateY(1px) }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1) }
    }
    @keyframes urmBorderBreathe {
      0%,100% { box-shadow: 0 0 20px ${borderColor}33, 0 0 40px ${borderColor}11, inset 0 0 15px ${borderColor}0a }
      50% { box-shadow: 0 0 50px ${borderColor}55, 0 0 100px ${borderColor}22, 0 0 160px ${borderColor}0a, inset 0 0 30px ${borderColor}15 }
    }
    @keyframes urmHoloShine {
      0% { transform: translateX(-100%) skewX(-15deg); opacity: 0 }
      12% { opacity: 0.08 }
      88% { opacity: 0.08 }
      100% { transform: translateX(350%) skewX(-15deg); opacity: 0 }
    }
    @keyframes urmScanLine {
      0% { top: -2px; opacity: 0 }
      4% { opacity: 0.4 }
      96% { opacity: 0.4 }
      100% { top: 100%; opacity: 0 }
    }
    ${isEmergency ? `
    @keyframes urmGlitchEntry {
      0%,100% { transform: translateX(0); filter: none }
      12% { transform: translateX(-4px) skewX(-0.5deg); filter: hue-rotate(90deg) brightness(1.4) }
      24% { transform: translateX(4px) skewX(0.5deg); filter: hue-rotate(-60deg) }
      36% { transform: translateX(-2px); filter: brightness(1.2) saturate(1.6) }
      48% { transform: translateX(3px) skewX(-0.3deg); filter: hue-rotate(45deg) }
      60% { transform: translateX(-1px); filter: none }
      72% { transform: translateX(1px); filter: brightness(1.1) }
    }` : ''}
    @keyframes urmSystemDotPulse {
      0%,100% { box-shadow: 0 0 4px currentColor, 0 0 8px currentColor }
      50% { box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor }
    }

    /* ── DIFFICULTY BADGE ─────────────────────────── */
    @keyframes urmBadgeSpin {
      0% { transform: rotate(0deg) }
      100% { transform: rotate(360deg) }
    }
    @keyframes urmBadgeSlam {
      0% { transform: scale(0) rotate(-180deg); opacity: 0 }
      50% { transform: scale(1.3) rotate(10deg); opacity: 1 }
      70% { transform: scale(0.9) rotate(-3deg) }
      100% { transform: scale(1) rotate(0deg); opacity: 1 }
    }

    /* ── REWARD EFFECTS ───────────────────────────── */
    @keyframes urmRewardSlideIn {
      0% { opacity: 0; transform: translateY(14px) scale(0.93) }
      45% { opacity: 0.9; transform: translateY(-3px) scale(1.015) }
      70% { transform: translateY(1px) scale(0.997) }
      100% { opacity: 1; transform: translateY(0) scale(1) }
    }
    @keyframes urmRewardIconPop {
      0% { transform: scale(0.3) rotate(-30deg); opacity: 0 }
      35% { transform: scale(1.5) rotate(8deg); opacity: 1 }
      55% { transform: scale(0.85) rotate(-3deg) }
      100% { transform: scale(1) rotate(0); opacity: 1 }
    }
    @keyframes urmRewardShimmer {
      0% { left: -100% }
      100% { left: 250% }
    }
    @keyframes urmLevelUpStars {
      0% { opacity: 0; transform: scale(0) }
      40% { opacity: 1; transform: scale(1.3) }
      100% { opacity: 0; transform: scale(1.8) translateY(-15px) }
    }
    @keyframes urmRewardPulseWave {
      0% { transform: scaleX(0); opacity: 0.6 }
      100% { transform: scaleX(1); opacity: 0 }
    }
    @keyframes urmNumberSlam {
      0% { transform: scale(1.8); opacity: 0; filter: blur(3px) }
      40% { transform: scale(0.95); opacity: 1; filter: blur(0) }
      60% { transform: scale(1.05) }
      100% { transform: scale(1); opacity: 1; filter: blur(0) }
    }

    /* ── XP BAR FILL ──────────────────────────────── */
    @keyframes urmXpBarGlow {
      0%,100% { box-shadow: 0 0 5px ${C.xpPurple}44 }
      50% { box-shadow: 0 0 15px ${C.xpPurple}88, 0 0 30px ${C.xpPurple}33 }
    }

    /* ── GOLDEN CONFETTI ──────────────────────────── */
    @keyframes urmConfettiFall {
      0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0 }
      8% { opacity: 0.9 }
      85% { opacity: 0.7 }
      100% { transform: translateY(100vh) translateX(var(--conf-drift)) rotate(var(--conf-rot)); opacity: 0 }
    }

    /* ── STREAK FLAMES ────────────────────────────── */
    @keyframes urmFlameFlicker {
      0%,100% { transform: scaleY(1) scaleX(1); opacity: 0.7 }
      25% { transform: scaleY(1.2) scaleX(0.95); opacity: 0.9 }
      50% { transform: scaleY(0.9) scaleX(1.05); opacity: 0.6 }
      75% { transform: scaleY(1.15) scaleX(0.98); opacity: 0.85 }
    }

    /* ── AMBIENT PARTICLES ────────────────────────── */
    @keyframes urmAmbientFloat {
      0% { transform: translateY(0) translateX(0); opacity: 0 }
      6% { opacity: var(--amb-op) }
      90% { opacity: var(--amb-op) }
      100% { transform: translateY(calc(-100vh - 20px)) translateX(var(--amb-drift)); opacity: 0 }
    }

    /* ── SCREEN SHAKE + IMPACT ────────────────────── */
    @keyframes urmScreenShake {
      0% { transform: translate(0,0) }
      8% { transform: translate(-5px, 4px) rotate(0.3deg) }
      16% { transform: translate(5px, -4px) rotate(-0.4deg) }
      24% { transform: translate(-4px, -3px) rotate(0.2deg) }
      32% { transform: translate(4px, 3px) rotate(-0.1deg) }
      40% { transform: translate(-3px, 2px) }
      50% { transform: translate(2px, -2px) }
      60% { transform: translate(-2px, 1px) }
      70% { transform: translate(1px, -1px) }
      80% { transform: translate(-1px, 1px) }
      100% { transform: translate(0,0) rotate(0) }
    }
    @keyframes urmImpactFlash {
      0% { opacity: 0.85 }
      30% { opacity: 0.25 }
      100% { opacity: 0 }
    }
    @keyframes urmEdgeGlow {
      0% { box-shadow: inset 0 0 0 transparent }
      20% { box-shadow: inset 0 0 120px ${borderColor}44, inset 0 0 250px ${borderColor}15 }
      100% { box-shadow: inset 0 0 0 transparent }
    }

    /* ── ENERGY STREAKS ───────────────────────────── */
    @keyframes urmEnergyStreak {
      0% { transform: translateX(-120vw); opacity: 0 }
      8% { opacity: 0.9 }
      92% { opacity: 0.9 }
      100% { transform: translateX(120vw); opacity: 0 }
    }

    /* ── POWER SURGE WAVE ─────────────────────────── */
    @keyframes urmPowerSurge {
      0% { transform: translate(-50%,-50%) scale(0); opacity: 0.6; border-width: 3px }
      100% { transform: translate(-50%,-50%) scale(1); opacity: 0; border-width: 0.5px }
    }

    /* ── LETTER REVEAL ────────────────────────────── */
    @keyframes urmLetterIn {
      0% { opacity: 0; transform: translateY(10px) scale(0.6); filter: blur(5px) }
      55% { opacity: 1; transform: translateY(-2px) scale(1.08); filter: blur(0) }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0) }
    }

    /* ── HIGHLIGHT IN ─────────────────────────────── */
    @keyframes urmHighlightIn {
      0% { opacity: 0; transform: translateX(-10px) scale(0.96) }
      50% { transform: translateX(2px) scale(1.01) }
      100% { opacity: 1; transform: translateX(0) scale(1) }
    }

    /* ── CTA ───────────────────────────────────────── */
    @keyframes urmCTAPulse {
      0%,100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent }
      50% { box-shadow: 0 0 25px ${borderColor}55, 0 0 50px ${borderColor}22, inset 0 0 20px ${borderColor}11 }
    }
    @keyframes urmCTAShine {
      0% { background-position: -200% 0 }
      100% { background-position: 200% 0 }
    }
    @keyframes urmCTAAppear {
      0% { opacity: 0; transform: translateY(8px) }
      100% { opacity: 1; transform: translateY(0) }
    }

    /* ── PRISMATIC EDGE ───────────────────────────── */
    @keyframes urmPrismatic {
      0% { filter: hue-rotate(0deg) } 100% { filter: hue-rotate(360deg) }
    }

    /* ── CURSOR ────────────────────────────────────── */
    @keyframes cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  `;
}

// ── FEEDBACK CHIPS ───────────────────────────────────────────────────────────
function FeedbackChips({ feedback, onFeedback }) {
  const [felt, setFelt] = useState(null);
  const [cat, setCat] = useState(null);
  const mono = "'JetBrains Mono',monospace";
  const chip = (active) => ({
    padding: "6px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: mono,
    cursor: active ? "default" : "pointer", letterSpacing: 0.5,
    background: active ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
    color: active ? C.cyan : C.silver,
    border: `1px solid ${active ? C.cyan : "rgba(148,163,184,0.25)"}`,
  });
  const pickFelt = (value) => { if (felt) return; setFelt(value); onFeedback?.(feedback.questId, { feltDifficulty: value }); };
  const pickCat = (value) => { if (cat) return; setCat(value); onFeedback?.(feedback.questId, { categoryFeedback: value }); };
  return (
    <div style={{ marginTop: 14, textAlign: "center" }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: C.dimText, fontFamily: mono, marginBottom: 8 }}>
        {felt && cat ? feedback.labels.thanks : feedback.labels.prompt}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        <button style={chip(felt === "too_easy")} onClick={() => pickFelt("too_easy")}>{feedback.labels.tooEasy}</button>
        <button style={chip(felt === "ok")} onClick={() => pickFelt("ok")}>{feedback.labels.ok}</button>
        <button style={chip(felt === "too_hard")} onClick={() => pickFelt("too_hard")}>{feedback.labels.tooHard}</button>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
        <button style={chip(cat === "more")} onClick={() => pickCat("more")}>{feedback.labels.more}</button>
        <button style={chip(cat === "less")} onClick={() => pickCat("less")}>{feedback.labels.less}</button>
      </div>
    </div>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function UnifiedResultModal({ flow, onContinue, onFeedback }) {
  const [phase, setPhase] = useState(0);
  const [visibleRewards, setVisibleRewards] = useState(0);
  const [visibleHighlights, setVisibleHighlights] = useState(0);
  const [typedLines, setTypedLines] = useState([]);
  const [typingDone, setTypingDone] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const [rewardCounterTriggers, setRewardCounterTriggers] = useState([]);
  const [powerSurgeCount, setPowerSurgeCount] = useState(0);
  const [showXpBar, setShowXpBar] = useState(false);

  const timersRef = useRef([]);
  const minCtaTimerRef = useRef(null);

  const addTimer = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id; };
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); if (minCtaTimerRef.current) clearTimeout(minCtaTimerRef.current); }, []);

  // ── DERIVED ────────────────────────────────────────────────────────────────
  const borderColor = flow ? getBorderColor(flow.variant) : C.borderBlue;
  const nebula = flow ? getNebulaColors(flow.variant) : getNebulaColors('standard');
  const isBoss = flow?.variant === 'boss' || flow?.variant === 'story_boss';
  const isPerfect = flow?.variant === 'perfect_run';
  const isEmergency = flow?.variant === 'emergency';
  const shouldShake = flow ? hasImpact(flow.variant) : false;
  const showCracks = isBoss;
  const showConfetti = isBoss || isPerfect;
  const hasLevelUp = (flow?.rewards || []).some(r => r.special);

  // ── PARTICLES ──────────────────────────────────────────────────────────────
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const burstParticles = useMemo(() => {
    if (!flow) return [];
    const count = getParticleCount(flow.variant);
    return generateBurstParticles(isMobile ? Math.floor(count * 0.55) : count);
  }, [flow?.id]);
  const ambientParticles = useMemo(() => flow ? generateAmbientParticles(isMobile ? 8 : 16) : [], [flow?.id]);
  const confettiParticles = useMemo(() => showConfetti ? generateConfetti(isMobile ? 18 : 35) : [], [flow?.id, showConfetti]);
  const absorptionParticles = useMemo(() => flow ? generateAbsorptionParticles(isMobile ? 8 : 14) : [], [flow?.id]);
  const crackLines = useMemo(() => showCracks ? generateCrackLines(isMobile ? 6 : 10) : [], [flow?.id, showCracks]);

  // ── CSS ────────────────────────────────────────────────────────────────────
  const cssKeyframes = useMemo(() => flow ? buildKeyframes(borderColor, flow.variant) : '', [flow?.id, borderColor]);

  // ── PHASE CASCADE ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!flow) return;
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setPhase(0); setVisibleRewards(0); setVisibleHighlights(0);
    setTypedLines([]); setTypingDone(false); setCtaReady(false);
    setRewardCounterTriggers([]); setPowerSurgeCount(0); setShowXpBar(false);

    // Dramatic pause: all dark, then impact
    addTimer(() => setPhase(1), shouldShake ? 350 : 200);  // impact + sigil
    addTimer(() => setPhase(2), shouldShake ? 850 : 700);   // window
    addTimer(() => setPhase(3), shouldShake ? 1300 : 1100); // rewards
  }, [flow]);

  // ── REWARD STAGGER ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 3 || !flow) return;
    const total = (flow.rewards || []).length;
    if (total === 0) { setPhase(4); return; }
    for (let i = 0; i < total; i++) {
      addTimer(() => {
        setVisibleRewards(prev => prev + 1);
        setRewardCounterTriggers(prev => [...prev, i]);
        setPowerSurgeCount(prev => prev + 1); // trigger power surge wave
      }, i * 200);
    }
    // Show XP bar after rewards
    addTimer(() => setShowXpBar(true), total * 200 + 100);
    // After rewards → highlights
    addTimer(() => {
      const hl = (flow.highlights || []).length;
      if (hl === 0) { setPhase(4); return; }
      for (let j = 0; j < hl; j++) {
        addTimer(() => setVisibleHighlights(prev => prev + 1), j * 150);
      }
      addTimer(() => setPhase(4), hl * 150 + 120);
    }, total * 200 + 300);
  }, [phase, flow]);

  // ── TYPEWRITER ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 4 || !flow) return;
    const lines = flow.summary?.systemLines || [];
    if (lines.length === 0) { setTypingDone(true); return; }
    let lineIdx = 0, charIdx = 0;
    const tick = () => {
      if (lineIdx >= lines.length) { setTypingDone(true); return; }
      const line = lines[lineIdx];
      if (charIdx <= line.length) {
        setTypedLines(prev => { const n = [...prev]; n[lineIdx] = line.slice(0, charIdx); return n; });
        charIdx++;
        addTimer(tick, 18);
      } else { lineIdx++; charIdx = 0; addTimer(tick, 240); }
    };
    tick();
  }, [phase, flow]);

  // ── CTA ────────────────────────────────────────────────────────────────────
  useEffect(() => { if (typingDone) setCtaReady(true); }, [typingDone]);
  useEffect(() => {
    if (!flow) return;
    minCtaTimerRef.current = setTimeout(() => { if (typingDone) setCtaReady(true); }, 3000);
    return () => { if (minCtaTimerRef.current) clearTimeout(minCtaTimerRef.current); };
  }, [flow]);

  const handleContinue = useCallback(() => {
    if (!ctaReady) return;
    timersRef.current.forEach(clearTimeout);
    onContinue?.();
  }, [ctaReady, onContinue]);

  if (!flow) return null;

  const titleText = flow.summary?.title || 'QUEST ABGESCHLOSSEN';
  const titleLetters = titleText.split('');
  const sigilSize = isBoss ? 200 : isPerfect ? 160 : isEmergency ? 150 : 140;
  const cardinalSymbols = ['◇', '✧', '◈', '☽'];
  const diffLabel = getDiffLabel(flow.variant, flow.source);

  // XP-bar: extract XP reward value for the bar
  const xpReward = (flow.rewards || []).find(r => r.kind === 'xp');
  const xpVal = xpReward ? parseInt(String(xpReward.value).replace(/[^0-9]/g, ''), 10) || 0 : 0;

  return (
    <>
      <style>{cssKeyframes}</style>

      {/* ═══ L10: SCREEN-SHAKE WRAPPER ═══ */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        animation: shouldShake ? 'urmScreenShake 500ms ease-out' : 'none',
      }}>

        {/* ═══ L1: VOID DIMENSION ═══ */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${nebula.c1}, ${nebula.c2})`,
          animation: 'urmVoidIn 300ms ease-out forwards',
        }}>
          {/* Nebula clouds */}
          <div style={{ position:'absolute',top:'15%',left:'25%',width:'55%',height:'55%',
            background:`radial-gradient(ellipse at center, ${nebula.c3}, transparent 70%)`,
            animation:'urmNebulaPulse 7s ease-in-out infinite', pointerEvents:'none' }} />
          <div style={{ position:'absolute',top:'45%',left:'8%',width:'85%',height:'60%',
            background:`radial-gradient(ellipse at 60% 40%, ${borderColor}08, transparent 60%)`,
            animation:'urmNebulaDrift 11s ease-in-out infinite', pointerEvents:'none' }} />
          <div style={{ position:'absolute',top:0,left:'20%',width:'60%',height:'25%',
            background:`radial-gradient(ellipse at 50% 0%, ${borderColor}14, transparent 70%)`,
            animation:'urmNebulaPulse 5.5s ease-in-out 1s infinite', pointerEvents:'none' }} />
          {/* Vignette */}
          <div style={{ position:'absolute',inset:0,animation:'urmVignette 600ms ease-out forwards',pointerEvents:'none' }} />
        </div>

        {/* ═══ L10: IMPACT FLASH ═══ */}
        {shouldShake && phase >= 1 && (
          <div style={{ position:'absolute',inset:0,
            background:`radial-gradient(circle at 50% 50%, ${borderColor}99, ${borderColor}33 35%, transparent 65%)`,
            animation:'urmImpactFlash 400ms ease-out forwards',
            pointerEvents:'none', zIndex:5 }} />
        )}

        {/* ═══ L10: EDGE GLOW ═══ */}
        {phase >= 1 && (
          <div style={{ position:'absolute',inset:0,
            animation:'urmEdgeGlow 900ms ease-out forwards',
            pointerEvents:'none', zIndex:4 }} />
        )}

        {/* ═══ L2: SCREEN CRACKS (boss) ═══ */}
        {showCracks && phase >= 1 && crackLines.map(c => (
          <div key={c.id} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: c.len, height: c.width,
            background: `linear-gradient(90deg, ${borderColor}aa, ${borderColor}44, transparent)`,
            transform: `rotate(${c.angle}deg)`,
            transformOrigin: '0% 50%',
            animation: `urmCrackGrow 300ms ease-out ${c.delay}ms forwards, urmCrackFade 2.5s ease-out 800ms forwards`,
            pointerEvents: 'none', zIndex: 5,
            boxShadow: `0 0 6px ${borderColor}66`,
          }} />
        ))}

        {/* ═══ ENERGY STREAKS ═══ */}
        {phase >= 1 && [0,1,2,3,4].map(i => (
          <div key={`streak_${i}`} style={{
            position:'absolute', top:`${15+i*17}%`, left:0,
            width: i%2===0 ? '25%' : '35%', height: 1.5,
            background:`linear-gradient(90deg, transparent, ${borderColor}55, ${borderColor}cc, ${borderColor}55, transparent)`,
            animation:`urmEnergyStreak ${350+i*80}ms ease-out ${i*60}ms forwards`,
            pointerEvents:'none', zIndex:3,
            boxShadow: `0 0 8px ${borderColor}44`,
          }} />
        ))}

        {/* ═══ L3: PARTICLE BURST ═══ */}
        {phase >= 1 && burstParticles.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:'50%', top:'50%',
            width:p.size, height:p.size,
            borderRadius: p.isDiamond ? 1 : '50%',
            transform: p.isDiamond ? 'rotate(45deg)' : 'none',
            background: p.bright ? '#fff' : borderColor,
            boxShadow:`0 0 ${p.size*4}px ${borderColor}, 0 0 ${p.size*8}px ${borderColor}55`,
            '--px':`${p.x}px`,'--py':`${p.y}px`,
            animation:`urmParticleBurst ${p.dur}ms ease-out ${p.delay}ms both`,
            pointerEvents:'none', zIndex:6,
          }} />
        ))}

        {/* ═══ L4: EXPANDING RINGS ═══ */}
        {phase >= 1 && (
          <>
            <div style={{ position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',
              borderRadius:'50%', border:`2.5px solid ${borderColor}66`,
              animation:'urmRingExpand 900ms ease-out forwards',
              pointerEvents:'none', zIndex:5 }} />
            <div style={{ position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',
              borderRadius:'50%', border:`1.5px solid ${borderColor}44`,
              animation:'urmRingExpandSm 750ms ease-out 150ms forwards',
              pointerEvents:'none', zIndex:5 }} />
            {isBoss && (
              <div style={{ position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',
                borderRadius:'50%', border:`1px solid ${borderColor}33`,
                animation:'urmRingExpand 1100ms ease-out 250ms forwards',
                pointerEvents:'none', zIndex:5 }} />
            )}
          </>
        )}

        {/* ═══ L5: RUNE SIGIL ═══ */}
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          width:sigilSize, height:sigilSize,
          animation: phase>=1 ? `urmSigilAppear 800ms cubic-bezier(0.22,1,0.36,1) forwards, urmSigilPulse 4s ease-in-out 2s infinite` : 'none',
          opacity: phase>=1 ? undefined : 0,
          pointerEvents:'none', zIndex:2,
        }}>
          {/* Outer ring — dashed, rotating */}
          <div style={{ position:'absolute',inset:0, borderRadius:'50%',
            border:`1.5px dashed ${borderColor}55`,
            boxShadow:`0 0 25px ${borderColor}22, inset 0 0 18px ${borderColor}0a`,
            animation:'urmSigilRotate 22s linear infinite' }} />
          {/* Inner ring — solid, counter */}
          <div style={{ position:'absolute',top:'15%',left:'15%',right:'15%',bottom:'15%',
            borderRadius:'50%', border:`1px solid ${borderColor}33`,
            boxShadow:`inset 0 0 14px ${borderColor}15`,
            animation:'urmSigilCounter 16s linear infinite' }} />
          {/* 3rd ring (boss) */}
          {isBoss && <div style={{ position:'absolute',top:'28%',left:'28%',right:'28%',bottom:'28%',
            borderRadius:'50%', border:`0.5px dashed ${borderColor}28`,
            animation:'urmSigilRotate 10s linear infinite' }} />}
          {/* Cross + diagonal lines */}
          <div style={{ position:'absolute',top:'50%',left:'3%',right:'3%',height:1,background:`${borderColor}28`,transform:'translateY(-50%)' }} />
          <div style={{ position:'absolute',left:'50%',top:'3%',bottom:'3%',width:1,background:`${borderColor}28`,transform:'translateX(-50%)' }} />
          <div style={{ position:'absolute',top:'50%',left:'50%',width:'65%',height:1,background:`${borderColor}18`,transform:'translate(-50%,-50%) rotate(45deg)' }} />
          <div style={{ position:'absolute',top:'50%',left:'50%',width:'65%',height:1,background:`${borderColor}18`,transform:'translate(-50%,-50%) rotate(-45deg)' }} />
          {/* Diamond center with glow */}
          <div style={{ position:'absolute',top:'50%',left:'50%',width:16,height:16,
            border:`1.5px solid ${borderColor}77`, background:`${borderColor}12`,
            transform:'translate(-50%,-50%) rotate(45deg)',
            boxShadow:`0 0 14px ${borderColor}33, inset 0 0 6px ${borderColor}22` }} />
          {/* Cardinal Rune Symbols */}
          {cardinalSymbols.map((sym, i) => {
            const pos = [
              {top:'-10%',left:'50%'}, {top:'50%',right:'-10%',left:'auto'},
              {bottom:'-10%',top:'auto',left:'50%'}, {top:'50%',left:'-10%'},
            ];
            return (
              <div key={`rune_${i}`} style={{
                position:'absolute', ...pos[i], transform:'translate(-50%,-50%)',
                fontSize:12, color:borderColor, fontFamily:"'Cinzel',serif",
                animation:`urmRuneFloat 3s ease-in-out ${i*0.4}s infinite, urmRuneGlow 4s ease-in-out ${i*0.6}s infinite`,
                pointerEvents:'none',
              }}>{sym}</div>
            );
          })}
        </div>

        {/* ═══ L6: ENERGY ABSORPTION PARTICLES ═══ */}
        {phase >= 2 && absorptionParticles.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:'50%', top:'50%',
            width:p.size, height:p.size, borderRadius:'50%',
            background: borderColor, boxShadow:`0 0 6px ${borderColor}`,
            '--startX':`${p.startX}px`, '--startY':`${p.startY}px`,
            animation:`urmAbsorb ${p.dur}ms ease-in ${p.delay}ms both`,
            pointerEvents:'none', zIndex:7,
          }} />
        ))}

        {/* ═══ POWER SURGE WAVES (one per reward) ═══ */}
        {Array.from({length: powerSurgeCount}, (_, i) => (
          <div key={`surge_${i}`} style={{
            position:'absolute', left:'50%', top:'50%',
            width:300, height:300, borderRadius:'50%',
            border:`2px solid ${borderColor}44`,
            animation:`urmPowerSurge 600ms ease-out forwards`,
            pointerEvents:'none', zIndex:5,
          }} />
        ))}

        {/* ═══ L6: AMBIENT FLOATING PARTICLES ═══ */}
        {phase >= 2 && ambientParticles.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:`${p.left}%`, bottom:-10,
            width:p.size, height:p.size,
            borderRadius: p.isDiamond ? 1 : '50%',
            transform: p.isDiamond ? 'rotate(45deg)' : 'none',
            background:borderColor,
            boxShadow:`0 0 ${p.size*4}px ${borderColor}77`,
            '--amb-drift':`${p.drift}px`, '--amb-op':p.opacity,
            animation:`urmAmbientFloat ${p.dur}s linear ${p.delay}s infinite`,
            pointerEvents:'none', zIndex:3,
          }} />
        ))}

        {/* ═══ L9: GOLDEN CONFETTI (boss/perfect) ═══ */}
        {showConfetti && phase >= 2 && confettiParticles.map(c => (
          <div key={c.id} style={{
            position:'absolute', left:`${c.left}%`, top: -20,
            width: c.size, height: c.size * 0.6,
            borderRadius: 1,
            background: c.isGold
              ? `linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)`
              : `linear-gradient(135deg, #fde68a, #fcd34d)`,
            boxShadow: c.isGold ? `0 0 4px #fbbf2488` : 'none',
            '--conf-drift':`${c.drift}px`,
            '--conf-rot':`${c.rotation}deg`,
            animation:`urmConfettiFall ${c.dur}s linear ${c.delay}s infinite`,
            pointerEvents:'none', zIndex:11,
          }} />
        ))}

        {/* ═══ L7: SYSTEM WINDOW ═══ */}
        {phase >= 2 && (
          <div style={{ position:'absolute',inset:0, display:'flex',alignItems:'center',justifyContent:'center',
            padding:'24px 16px', zIndex:10 }}>
            <div style={{
              width:'min(460px, 92vw)', maxHeight:'88vh', overflowY:'auto',
              position:'relative',
              animation: isEmergency
                ? 'urmWindowIn 700ms cubic-bezier(0.22,1,0.36,1) forwards, urmGlitchEntry 600ms ease-out 120ms'
                : 'urmWindowIn 700ms cubic-bezier(0.22,1,0.36,1) forwards',
              background:C.bodyBg, border:`1px solid ${borderColor}`,
              borderRadius:6,
            }}>
              {/* Border Breathing */}
              <div style={{ position:'absolute',inset:-1, borderRadius:7,
                animation:'urmBorderBreathe 3s ease-in-out infinite',
                pointerEvents:'none', zIndex:-1 }} />

              {/* Prismatic edge (boss/perfect) */}
              {(isBoss || isPerfect) && (
                <div style={{ position:'absolute',inset:-2, borderRadius:8,
                  border:'1px solid transparent',
                  backgroundImage:`linear-gradient(${C.bodyBg}, ${C.bodyBg}), linear-gradient(135deg, ${borderColor}44, ${borderColor}11, ${borderColor}44)`,
                  backgroundOrigin:'border-box', backgroundClip:'padding-box, border-box',
                  animation:'urmPrismatic 5s linear infinite',
                  pointerEvents:'none', zIndex:-1, opacity:0.55 }} />
              )}

              {/* Holographic Shine */}
              <div style={{ position:'absolute',inset:0, overflow:'hidden',borderRadius:6,
                pointerEvents:'none', zIndex:2 }}>
                <div style={{ position:'absolute',top:0,width:'45%',height:'100%',
                  background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                  animation:'urmHoloShine 4.5s ease-in-out 1.8s infinite',
                  pointerEvents:'none' }} />
              </div>

              {/* Scanline */}
              <div style={{ position:'absolute',left:0,right:0,height:2,
                background:`linear-gradient(90deg, transparent, ${borderColor}55, transparent)`,
                pointerEvents:'none', zIndex:3,
                animation:'urmScanLine 2.5s linear 1s infinite' }} />

              {/* ── HEADER ──────────────────────────────────── */}
              <div style={{
                background:C.headerBg, padding:'20px 22px 16px',
                borderBottom:`1px solid ${borderColor}44`,
                position:'relative', overflow:'hidden',
              }}>
                {/* Header ambient glow */}
                <div style={{ position:'absolute',inset:0,
                  background:`radial-gradient(ellipse at 50% 120%, ${borderColor}18, transparent 65%)`,
                  pointerEvents:'none' }} />

                {/* Source badge + Difficulty badge row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%',
                      background:borderColor, color:borderColor, flexShrink:0,
                      animation:'urmSystemDotPulse 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize:9, letterSpacing:5, color:borderColor,
                      fontFamily:"'JetBrains Mono',monospace", fontWeight:600, textTransform:'uppercase' }}>
                      {flow.source === 'quest' ? 'SYSTEM' :
                       flow.source === 'emergency' ? 'NOTFALL' :
                       flow.source === 'dungeon' ? 'DUNGEON' :
                       flow.source === 'story_chapter' ? 'STORY' :
                       flow.source === 'story_boss' ? 'BOSS' :
                       'PROTOKOLL'}
                    </span>
                  </div>

                  {/* ── DIFFICULTY BADGE ── */}
                  <div style={{
                    position:'relative', width:42, height:42,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation:'urmBadgeSlam 600ms cubic-bezier(0.34,1.56,0.64,1) 400ms both',
                  }}>
                    {/* Spinning ring behind badge */}
                    <div style={{
                      position:'absolute', inset:-4, borderRadius:'50%',
                      border:`1.5px solid transparent`,
                      borderTopColor: borderColor,
                      borderRightColor: `${borderColor}44`,
                      animation:'urmBadgeSpin 3s linear infinite',
                      opacity:0.6,
                    }} />
                    {/* Badge core */}
                    <div style={{
                      width:34, height:34, borderRadius:'50%',
                      background:`radial-gradient(circle at 40% 35%, ${borderColor}33, ${borderColor}0a)`,
                      border:`1.5px solid ${borderColor}88`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 12px ${borderColor}33, inset 0 0 8px ${borderColor}15`,
                    }}>
                      <span style={{
                        fontSize:7, fontWeight:900, letterSpacing:1,
                        color:borderColor, fontFamily:"'JetBrains Mono',monospace",
                        textShadow:`0 0 8px ${borderColor}88`,
                      }}>{diffLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Title — letter-by-letter reveal, grouped per word so a long
                    word (e.g. "ABGESCHLOSSEN") can never break mid-word. Each
                    word is a non-wrapping flex item; only the inter-word space
                    (columnGap) is a valid wrap point. */}
                <div style={{
                  fontSize:24, fontWeight:900, color:'#fff',
                  fontFamily:"'Cinzel',serif", letterSpacing:3,
                  textShadow:`0 0 30px ${borderColor}88, 0 0 60px ${borderColor}33`,
                  display:'flex', flexWrap:'wrap', columnGap:'0.4em', rowGap:'2px',
                  position:'relative', zIndex:1,
                }}>
                  {(() => {
                    let li = 0; // continuous letter index → uninterrupted stagger
                    return titleText.split(' ').filter(Boolean).map((word, wi) => (
                      <span key={wi} style={{ display:'inline-block', whiteSpace:'nowrap' }}>
                        {word.split('').map((ch) => {
                          const idx = li++;
                          return (
                            <span key={idx} style={{
                              display:'inline-block',
                              animation:`urmLetterIn 400ms ease-out ${idx*25}ms both`,
                            }}>{ch}</span>
                          );
                        })}
                      </span>
                    ));
                  })()}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontSize:13, color:C.silver,
                  fontFamily:"'Outfit',sans-serif",
                  marginTop:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  opacity:0, position:'relative', zIndex:1,
                  animation:`urmRewardSlideIn 450ms ease-out ${titleLetters.length*25+250}ms forwards`,
                }}>{flow.summary?.subtitle}</div>

                {/* Streak flames (if streak data available in title) */}
                {hasLevelUp && (
                  <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                    width:'80%', height:20, pointerEvents:'none',
                    background:`linear-gradient(0deg, ${borderColor}22, transparent)`,
                    animation:'urmFlameFlicker 1.5s ease-in-out infinite',
                    filter:'blur(8px)', opacity:0.5 }} />
                )}
              </div>

              {/* ── REWARDS ──────────────────────────────── */}
              <div style={{ padding:'16px 22px 6px' }}>
                {(flow.rewards || []).map((r, i) => (
                  <RewardRow key={i} reward={r} index={i}
                    visible={i < visibleRewards}
                    counterTriggered={rewardCounterTriggers.includes(i)}
                    borderColor={borderColor} />
                ))}
              </div>

              {/* ── XP PROGRESS BAR ──────────────────────── */}
              {showXpBar && xpVal > 0 && (
                <div style={{
                  margin:'4px 22px 0', padding:'10px 0',
                  opacity:0, animation:'urmRewardSlideIn 400ms ease-out forwards',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:8, letterSpacing:3, color:C.silver,
                      fontFamily:"'JetBrains Mono',monospace" }}>FORTSCHRITT</span>
                    <span style={{ fontSize:9, color:C.xpPurple,
                      fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>+{xpVal} XP</span>
                  </div>
                  <div style={{
                    width:'100%', height:6, borderRadius:4,
                    background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(255,255,255,0.04)',
                    position:'relative', overflow:'hidden',
                  }}>
                    <div style={{
                      height:'100%', borderRadius:3,
                      background:`linear-gradient(90deg, ${C.xpPurple}cc, ${C.xpPurple}, ${C.cyan}88)`,
                      boxShadow:`0 0 10px ${C.xpPurple}88, 0 0 20px ${C.xpPurple}44`,
                      animation:'urmXpBarGlow 1.5s ease-in-out infinite',
                      width: '0%',
                      transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      ...(showXpBar ? { width: `${Math.min(85 + Math.random() * 15, 100)}%` } : {}),
                    }} />
                    {/* Shine on the bar */}
                    <div style={{
                      position:'absolute', top:0, left:0, width:'30%', height:'100%',
                      background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation:'urmRewardShimmer 2s ease-out 0.5s forwards',
                    }} />
                  </div>
                </div>
              )}

              {/* ── HIGHLIGHTS ────────────────────────────── */}
              {(flow.highlights || []).length > 0 && (
                <div style={{ margin:'8px 22px 0', borderTop:`1px solid ${borderColor}28`, paddingTop:12 }}>
                  {(flow.highlights || []).map((h, i) => (
                    i < visibleHighlights ? (
                      <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:10,
                        padding:'8px 0',
                        animation:'urmHighlightIn 350ms ease-out forwards',
                      }}>
                        <span style={{
                          fontSize:16, color:borderColor, minWidth:22, textAlign:'center', marginTop:1,
                          textShadow:`0 0 10px ${borderColor}88`,
                          display:'inline-block',
                          animation:`urmRewardIconPop 500ms ease-out forwards`,
                        }}>{getHighlightIcon(h.kind)}</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0',
                            fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>{h.title}</div>
                          {h.body && (
                            <div style={{ fontSize:11, color:C.silver,
                              fontFamily:"'Outfit',sans-serif", marginTop:2 }}>{h.body}</div>
                          )}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              )}

              {/* ── SYSTEM TEXT (TYPEWRITER) ───────────────── */}
              {phase >= 4 && (
                <div style={{
                  margin:'12px 22px 0', padding:'14px 16px',
                  background:'rgba(0,0,0,0.4)', border:`1px solid ${borderColor}18`,
                  borderRadius:4, minHeight:52, position:'relative', overflow:'hidden',
                }}>
                  {/* Terminal top bar */}
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
                    background:`linear-gradient(90deg, transparent, ${borderColor}44, transparent)`,
                    pointerEvents:'none' }} />
                  {/* Code matrix background */}
                  <div style={{ position:'absolute',inset:0, opacity:0.02,
                    background:`repeating-linear-gradient(0deg, transparent, transparent 18px, ${borderColor} 18px, ${borderColor} 19px)`,
                    pointerEvents:'none' }} />

                  {(flow.summary?.systemLines || []).map((line, i) => (
                    <div key={i} style={{
                      fontSize:11, color: i===0 ? borderColor : `${borderColor}bb`,
                      fontFamily:"'JetBrains Mono',monospace",
                      lineHeight:1.8, letterSpacing:0.5,
                      display:'flex', gap:8,
                      opacity: typedLines[i] !== undefined ? 1 : 0,
                    }}>
                      <span style={{ color:`${borderColor}44`, flexShrink:0 }}>›</span>
                      <span>{typedLines[i] !== undefined ? typedLines[i] : ''}</span>
                      {i === typedLines.length - 1 && !typingDone && (
                        <span style={{
                          display:'inline-block', width:7, height:15,
                          background:borderColor, animation:'cursorBlink 0.7s step-end infinite',
                          boxShadow:`0 0 8px ${borderColor}88`,
                          borderRadius:1, marginLeft:1, verticalAlign:'middle',
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {flow.feedback && ctaReady && (
                <FeedbackChips feedback={flow.feedback} onFeedback={onFeedback} />
              )}

              {/* ── CTA ───────────────────────────────────── */}
              <div style={{ padding:'16px 22px 22px' }}>
                <button onClick={handleContinue} disabled={!ctaReady}
                  style={{
                    width:'100%', padding:'15px 0',
                    fontSize:13, fontWeight:800, letterSpacing:7,
                    fontFamily:"'JetBrains Mono',monospace",
                    background: ctaReady
                      ? `linear-gradient(135deg, ${borderColor}1a, ${borderColor}08)`
                      : 'rgba(0,0,0,0.3)',
                    color: ctaReady ? (isPerfect ? C.gold : borderColor) : C.dimText,
                    border:`1px solid ${ctaReady ? borderColor : C.border}`,
                    borderRadius:4, cursor: ctaReady ? 'pointer' : 'default',
                    transition:'all 0.3s ease',
                    animation: ctaReady
                      ? 'urmCTAPulse 2.5s ease-in-out infinite, urmCTAAppear 400ms ease-out forwards'
                      : 'none',
                    textTransform:'uppercase', position:'relative', overflow:'hidden',
                  }}>
                  {ctaReady && (
                    <div style={{
                      position:'absolute', inset:0,
                      background:`linear-gradient(90deg, transparent 30%, ${borderColor}12 50%, transparent 70%)`,
                      backgroundSize:'200% 100%',
                      animation:'urmCTAShine 3.5s linear infinite',
                      pointerEvents:'none',
                    }} />
                  )}
                  <span style={{ position:'relative', zIndex:1 }}>
                    {ctaReady ? 'WEITER' : '▪ ▪ ▪'}
                  </span>
                </button>
              </div>

              {/* Corner Decorations */}
              {['tl','tr','bl','br'].map((pos, i) => (
                <div key={pos} style={{
                  position:'absolute',
                  ...(pos[0]==='t' ? {top:-1} : {bottom:-1}),
                  ...(pos[1]==='l' ? {left:-1} : {right:-1}),
                  width:14, height:14,
                  borderTop: pos[0]==='t' ? `2px solid ${borderColor}` : 'none',
                  borderBottom: pos[0]==='b' ? `2px solid ${borderColor}` : 'none',
                  borderLeft: pos[1]==='l' ? `2px solid ${borderColor}` : 'none',
                  borderRight: pos[1]==='r' ? `2px solid ${borderColor}` : 'none',
                  boxShadow:`0 0 10px ${borderColor}22`,
                  opacity:0,
                  animation:`urmRewardSlideIn 350ms ease-out ${350+i*70}ms forwards`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── REWARD ROW — maximaler Dopamin-Effekt ────────────────────────────────────
function RewardRow({ reward, index, visible, counterTriggered, borderColor }) {
  const r = reward;
  const numericMatch = (r.value || '').match(/\+?(\d+)/);
  const numericVal = numericMatch ? parseInt(numericMatch[1], 10) : null;
  const prefix = (r.value || '').match(/^([^0-9]*)/)?.[1] || '';
  const suffix = (r.value || '').match(/\d+(.*)$/)?.[1] || '';
  const counted = useCounter(numericVal, 500, counterTriggered);
  const accentColor = r.accent || '#22d3ee';

  if (!visible) return <div style={{ height:44, opacity:0 }} />;

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'9px 14px', marginBottom:6, borderRadius:7,
      background: r.special
        ? `linear-gradient(135deg, ${accentColor}18, ${accentColor}06)`
        : `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
      border:`1px solid ${r.special ? `${accentColor}44` : 'rgba(255,255,255,0.04)'}`,
      animation:'urmRewardSlideIn 450ms ease-out forwards',
      position:'relative', overflow:'hidden',
    }}>
      {/* Shimmer sweep */}
      <div style={{
        position:'absolute', top:0, width:'35%', height:'100%',
        background:`linear-gradient(90deg, transparent, ${accentColor}15, transparent)`,
        animation:'urmRewardShimmer 1.2s ease-out 80ms forwards',
        pointerEvents:'none',
      }} />
      {/* Glow flash on appear */}
      <div style={{
        position:'absolute', inset:0, borderRadius:7,
        background:`radial-gradient(ellipse at 75% 50%, ${accentColor}22, transparent 55%)`,
        opacity:0, animation:'urmImpactFlash 700ms ease-out 30ms forwards',
        pointerEvents:'none',
      }} />
      {/* Pulse wave from left */}
      <div style={{
        position:'absolute', left:0, top:0, bottom:0, width:'100%',
        background:`linear-gradient(90deg, ${accentColor}15, transparent)`,
        animation:'urmRewardPulseWave 500ms ease-out forwards',
        transformOrigin:'left center', pointerEvents:'none',
      }} />

      <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1 }}>
        {r.iconSrc ? (
          <img src={r.iconSrc} alt="" style={{
            width:22, height:22, objectFit:'contain', display:'inline-block',
            animation:'urmRewardIconPop 550ms ease-out forwards',
            filter:`drop-shadow(0 0 6px ${accentColor}88)`,
          }} />
        ) : (
          <span style={{
            fontSize:18, color:accentColor, display:'inline-block',
            animation:'urmRewardIconPop 550ms ease-out forwards',
            textShadow:`0 0 12px ${accentColor}88`,
            filter:`drop-shadow(0 0 5px ${accentColor}55)`,
          }}>{r.icon}</span>
        )}
        <span style={{
          fontSize:10, letterSpacing:3, color:C.silver,
          fontFamily:"'JetBrains Mono',monospace",
          textTransform:'uppercase', fontWeight:500,
        }}>{r.label}</span>
      </div>

      {/* VALUE with slam + counter */}
      <div style={{
        fontSize: r.special ? 20 : 16, fontWeight:800,
        color:accentColor,
        fontFamily: r.special ? "'Cinzel',serif" : "'Outfit',sans-serif",
        textShadow:`0 0 14px ${accentColor}88, 0 0 28px ${accentColor}33`,
        letterSpacing: r.special ? 2 : 1,
        position:'relative', zIndex:1,
        animation: counterTriggered ? 'urmNumberSlam 500ms ease-out forwards' : 'none',
      }}>
        {numericVal !== null ? `${prefix}${counted}${suffix}` : r.value}
      </div>

      {/* Level-Up star particles */}
      {r.special && [0,1,2,3,4].map(j => (
        <div key={`star_${j}`} style={{
          position:'absolute',
          top:`${10+j*16}%`, right:`${5+j*7}%`,
          width:3, height:3, borderRadius:'50%',
          background:accentColor,
          boxShadow:`0 0 8px ${accentColor}`,
          animation:`urmLevelUpStars 900ms ease-out ${150+j*120}ms forwards`,
          opacity:0, pointerEvents:'none',
        }} />
      ))}
    </div>
  );
}
