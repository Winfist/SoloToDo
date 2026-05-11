// PageTransition.jsx - purchasable cinematic page transitions
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE_TIMING = {
  duration: 1650,
  voidPeak: 340,
  riftStart: 260,
  viewSwitchAt: 540,
  eyesStart: 440,
  eyesEnd: 770,
  revealStart: 900,
};

const RUNE_SYMBOLS = ["<>", "[]", "X", "V", "I", "II", "A", "M", "7", "0"];

const TRANSITION_VARIANTS = {
  domain_shift: {
    name: "Domain Shift",
    badge: "SYSTEM: DOMAIN SHIFT",
    command: "REALITY RIFT",
    mode: "rift",
    primary: "#7c3aed",
    secondary: "#22d3ee",
    accent: "#c4b5fd",
    hot: "#ffffff",
    deep: "#020108",
    particleCount: 86,
    showEyes: true,
    shake: 1,
  },
  shadow_step: {
    name: "Shadow Step",
    badge: "ASSASSIN SKILL: SHADOW STEP",
    command: "BLINK EXECUTE",
    mode: "slash",
    primary: "#22c55e",
    secondary: "#a78bfa",
    accent: "#dcfce7",
    hot: "#ffffff",
    deep: "#010704",
    particleCount: 72,
    showEyes: false,
    shake: 1.18,
    timing: { ...BASE_TIMING, duration: 1280, riftStart: 140, viewSwitchAt: 360, eyesStart: 0, eyesEnd: 0, revealStart: 690 },
  },
  red_gate: {
    name: "Red Gate Breach",
    badge: "WARNING: RED GATE BREACH",
    command: "DUNGEON OPEN",
    mode: "gate",
    primary: "#ef4444",
    secondary: "#f97316",
    accent: "#fecaca",
    hot: "#fff7ed",
    deep: "#080102",
    particleCount: 96,
    showEyes: true,
    shake: 1.35,
  },
  frost_seal: {
    name: "Frost Monarch Seal",
    badge: "MONARCH SEAL: FROST LOCK",
    command: "CRYO RIFT",
    mode: "frost",
    primary: "#38bdf8",
    secondary: "#a5f3fc",
    accent: "#e0f2fe",
    hot: "#ffffff",
    deep: "#020712",
    particleCount: 82,
    showEyes: false,
    shake: 0.8,
  },
  dragons_breath: {
    name: "Dragon's Breath",
    badge: "DRAGON AUTHORITY: IGNITION",
    command: "INFERNO GATE",
    mode: "flame",
    primary: "#f97316",
    secondary: "#ef4444",
    accent: "#fde68a",
    hot: "#fff7ed",
    deep: "#090301",
    particleCount: 112,
    showEyes: false,
    shake: 1.55,
    timing: { ...BASE_TIMING, duration: 1720, viewSwitchAt: 560, revealStart: 930 },
  },
  celestial_judgment: {
    name: "Celestial Judgment",
    badge: "RULER AUTHORITY: JUDGMENT",
    command: "LIGHT DECREE",
    mode: "celestial",
    primary: "#facc15",
    secondary: "#f8fafc",
    accent: "#fde68a",
    hot: "#ffffff",
    deep: "#070603",
    particleCount: 92,
    showEyes: false,
    shake: 0.72,
    timing: { ...BASE_TIMING, duration: 1740, viewSwitchAt: 590, revealStart: 960 },
  },
  system_override: {
    name: "System Override",
    badge: "SYSTEM: OVERRIDE ACCEPTED",
    command: "ACCESS REWRITE",
    mode: "system",
    primary: "#22f5c7",
    secondary: "#38bdf8",
    accent: "#bbf7d0",
    hot: "#ffffff",
    deep: "#000806",
    particleCount: 78,
    showEyes: false,
    shake: 0.95,
    timing: { ...BASE_TIMING, duration: 1500, viewSwitchAt: 500, revealStart: 820 },
  },
  eclipse_monarch: {
    name: "Arise: Eclipse Monarch",
    badge: "MONARCH DOMAIN: ECLIPSE",
    command: "ARISE",
    mode: "eclipse",
    primary: "#c084fc",
    secondary: "#facc15",
    accent: "#f5d0fe",
    hot: "#ffffff",
    deep: "#03010a",
    particleCount: 128,
    showEyes: true,
    shake: 1.75,
    timing: { ...BASE_TIMING, duration: 1950, riftStart: 300, viewSwitchAt: 680, eyesStart: 560, eyesEnd: 980, revealStart: 1110 },
  },
};

const LOCAL_TRANSITION_CSS = `
@keyframes ptChromatic{0%{backdrop-filter:blur(0) brightness(1) saturate(1);opacity:0}35%{backdrop-filter:blur(3px) brightness(.85) saturate(1.7);opacity:.78}100%{backdrop-filter:blur(9px) brightness(.34) saturate(2.2);opacity:1}}
@keyframes ptGlitchBand{0%{transform:translateX(-115%) scaleY(1);opacity:0}20%{transform:translateX(8%) scaleY(2.5);opacity:.9}45%{transform:translateX(-4%) scaleY(.6);opacity:.45}70%{transform:translateX(5%) scaleY(1.7);opacity:.7}100%{transform:translateX(115%) scaleY(1);opacity:0}}
@keyframes ptVoidExpand{0%{clip-path:circle(0 at 50% 50%)}45%{clip-path:circle(42% at 50% 50%)}100%{clip-path:circle(115% at 50% 50%)}}
@keyframes ptVoidCollapse{0%{clip-path:circle(115% at 50% 50%);opacity:1}55%{clip-path:circle(30% at 50% 50%);opacity:.92}82%{clip-path:circle(8% at 50% 50%);opacity:.5}100%{clip-path:circle(0 at 50% 50%);opacity:0}}
@keyframes ptEnergyRipple{0%{transform:scale(0);opacity:.95;border-width:3px}42%{opacity:.68;border-width:2px}100%{transform:scale(9);opacity:0;border-width:.5px}}
@keyframes ptRiftGlow{0%{height:0;opacity:0;filter:blur(7px)}32%{height:48vh;opacity:.85;filter:blur(2px)}100%{height:90vh;opacity:1;filter:blur(0)}}
@keyframes ptRiftPulse{0%{filter:brightness(1);transform:scaleX(1)}100%{filter:brightness(1.45);transform:scaleX(1.16)}}
@keyframes ptRuneOrbit{0%{transform:rotate(0deg) translateX(var(--orbit-radius,72px)) rotate(0deg);opacity:0;filter:blur(4px)}12%{opacity:.86;filter:blur(0)}70%{opacity:.52}100%{transform:rotate(385deg) translateX(var(--orbit-radius,72px)) rotate(-385deg);opacity:0;filter:blur(5px)}}
@keyframes ptScanLine{0%{transform:translateY(-104vh);opacity:0}12%{opacity:1}88%{opacity:.92}100%{transform:translateY(104vh);opacity:0}}
@keyframes ptEyesReveal{0%{opacity:0;transform:translate(-50%,-50%) scale(.08);filter:blur(10px)}42%{opacity:1;transform:translate(-50%,-50%) scale(1.22);filter:blur(0)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes ptEyePulse{0%{filter:brightness(1)}100%{filter:brightness(1.65)}}
@keyframes ptBadgeIn{0%{opacity:0;transform:translateY(-10px) scale(.82);filter:blur(6px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
@keyframes ptViewText{0%{opacity:0;letter-spacing:0;filter:blur(14px);transform:translateY(12px) scaleY(.75)}20%{opacity:.55;filter:blur(4px);transform:translateY(-3px) scaleY(1.18) skewX(-3deg)}45%{opacity:1;letter-spacing:10px;filter:blur(0)}75%{transform:skewX(.6deg)}100%{opacity:1;letter-spacing:10px;filter:blur(0);transform:none}}
@keyframes ptCursor{50%{opacity:0}}
@keyframes ptUnderline{0%{width:0;opacity:0}100%{width:148px;opacity:1}}
@keyframes ptTextOut{0%{opacity:1;filter:blur(0)}100%{opacity:0;filter:blur(7px);transform:translate(-50%,-50%) scale(.92)}}
@keyframes ptResidualFloat{0%{opacity:.9;transform:translate3d(0,0,0) scale(1)}55%{opacity:.52;transform:translate3d(var(--rx,0),-28px,0) scale(.85)}100%{opacity:0;transform:translate3d(var(--rx,0),-76px,0) scale(.08)}}
@keyframes ptRadialBurst{0%{width:0;height:0;opacity:.75}45%{width:140vw;height:140vw;opacity:.35}100%{width:210vw;height:210vw;opacity:0}}
@keyframes ptAfterglow{0%{opacity:1}100%{opacity:0}}
@keyframes ptSlashSweep{0%{transform:translateX(-130%) rotate(var(--rot,-28deg));opacity:0}15%{opacity:1}55%{opacity:.96}100%{transform:translateX(130%) rotate(var(--rot,-28deg));opacity:0}}
@keyframes ptGateSpin{0%{transform:translate(-50%,-50%) rotate(0deg) scale(.72);opacity:0}24%{opacity:1}100%{transform:translate(-50%,-50%) rotate(360deg) scale(1.2);opacity:.95}}
@keyframes ptGatePulse{0%,100%{filter:brightness(1);box-shadow:0 0 24px var(--c),inset 0 0 26px var(--c2)}50%{filter:brightness(1.6);box-shadow:0 0 66px var(--c),inset 0 0 42px var(--c2)}}
@keyframes ptShardDrift{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--rot,0deg)) scale(.2)}25%{opacity:.88}100%{opacity:0;transform:translate(calc(-50% + var(--tx,0px)),calc(-50% + var(--ty,0px))) rotate(calc(var(--rot,0deg) + 80deg)) scale(1.1)}}
@keyframes ptFlameLick{0%{transform:translateY(28px) scaleY(.45);opacity:0}30%{opacity:.9}100%{transform:translateY(-64px) scaleY(1.25);opacity:0}}
@keyframes ptSpearDrop{0%{transform:translateY(-110vh) rotate(var(--rot,0deg));opacity:0}18%{opacity:1}58%{opacity:.85}100%{transform:translateY(110vh) rotate(var(--rot,0deg));opacity:0}}
@keyframes ptSystemColumn{0%{transform:translateY(-110%);opacity:0}12%{opacity:.95}100%{transform:translateY(120%);opacity:0}}
@keyframes ptMandalaSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes ptEclipsePulse{0%{transform:translate(-50%,-50%) scale(.72);opacity:0}32%{opacity:1}100%{transform:translate(-50%,-50%) scale(1.04);opacity:1}}
@keyframes ptCrownRise{0%{transform:translate(-50%,40px) scale(.65);opacity:0;filter:blur(8px)}45%{opacity:1;filter:blur(0)}100%{transform:translate(-50%,0) scale(1);opacity:1}}
@keyframes ptShadowRise{0%{height:0;opacity:0;transform:translateY(40px)}45%{opacity:.8}100%{height:44vh;opacity:0;transform:translateY(-18px)}}
@media (prefers-reduced-motion: reduce){
  @keyframes ptChromatic{0%,100%{opacity:.85;backdrop-filter:none}}
  @keyframes ptViewText{0%{opacity:0}100%{opacity:1;letter-spacing:6px;filter:none;transform:none}}
}
`;

export default function PageTransition({
  isActive,
  targetLabel,
  theme,
  variant = "domain_shift",
  speed = 1,
  onMidpoint,
  onComplete,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const midpointFired = useRef(false);
  const shakeRef = useRef({ x: 0, y: 0 });
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showEyes, setShowEyes] = useState(false);

  const config = useMemo(() => {
    const preset = TRANSITION_VARIANTS[variant] || TRANSITION_VARIANTS.domain_shift;
    if (preset.mode !== "rift") return preset;
    return {
      ...preset,
      primary: theme?.primary || preset.primary,
      secondary: theme?.accent || preset.secondary,
      accent: theme?.secondary || preset.accent,
    };
  }, [theme?.accent, theme?.primary, theme?.secondary, variant]);

  const speedFactor = Math.min(1.8, Math.max(0.7, Number(speed) || 1));
  const motionScale = 1 / speedFactor;
  const timing = useMemo(() => {
    const rawTiming = config.timing || BASE_TIMING;
    return Object.fromEntries(
      Object.entries(rawTiming).map(([key, value]) => [key, Math.max(0, Math.round(value * motionScale))])
    );
  }, [config.timing, motionScale]);
  const scaleMs = useCallback((value, min = 1) => Math.max(min, Math.round(value * motionScale)), [motionScale]);
  const scaleSec = useCallback((value, min = 0.05) => Math.max(min, value * motionScale), [motionScale]);

  const residualParticles = useMemo(() =>
    Array.from({ length: 34 }, (_, i) => ({
      left: 4 + ((i * 47 + 13) % 92),
      top: 5 + ((i * 31 + 7) % 90),
      w: 2 + ((i * 13) % 5),
      delay: i * 0.018,
      dur: 0.75 + ((i * 17) % 8) * 0.12,
      rx: -18 + ((i * 19) % 37),
      tone: i % 4,
    })),
  []);

  const runeData = useMemo(() =>
    RUNE_SYMBOLS.map((rune, i) => ({
      rune,
      opacity: 0.32 + ((i * 17) % 42) * 0.01,
      radius: 62 + (i % 4) * 26,
      speed: 1.05 + i * 0.09,
      delay: i * 0.035,
      size: 12 + ((i * 7) % 9),
    })),
  []);

  const triggerShake = useCallback((intensity = 6, duration = 300) => {
    const start = performance.now();
    const shake = () => {
      const elapsed = performance.now() - start;
      if (elapsed > duration) {
        shakeRef.current = { x: 0, y: 0 };
        return;
      }
      const decay = 1 - elapsed / duration;
      shakeRef.current = {
        x: (Math.random() - 0.5) * intensity * decay,
        y: (Math.random() - 0.5) * intensity * decay,
      };
      requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setPhase(0);
      return undefined;
    }

    midpointFired.current = false;
    setPhase(1);
    setTypedText("");
    setShowEyes(false);
    triggerShake(5 * (config.shake || 1), scaleMs(240));

    const timers = [
      setTimeout(() => { setPhase(2); triggerShake(8 * (config.shake || 1), scaleMs(220)); }, timing.riftStart),
      setTimeout(() => {
        if (!midpointFired.current) {
          midpointFired.current = true;
          onMidpoint?.();
        }
      }, timing.viewSwitchAt),
      setTimeout(() => { if (config.showEyes) setShowEyes(true); }, timing.eyesStart || 0),
      setTimeout(() => setShowEyes(false), timing.eyesEnd || 0),
      setTimeout(() => { setPhase(3); triggerShake(4.5 * (config.shake || 1), scaleMs(360)); }, timing.revealStart),
      setTimeout(() => {
        setPhase(0);
        onComplete?.();
      }, timing.duration),
    ];

    return () => timers.forEach(clearTimeout);
  }, [config, isActive, onComplete, onMidpoint, scaleMs, timing, triggerShake]);

  useEffect(() => {
    if (phase < 2 || !targetLabel) return undefined;
    const fullText = `${config.command} > ${targetLabel}`;
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      i += 1;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, scaleMs(config.mode === "shadow_step" ? 12 : 18, 6));
    return () => clearInterval(interval);
  }, [config.command, config.mode, phase, scaleMs, targetLabel]);

  useEffect(() => {
    if (!isActive) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const compact = Math.min(w, h) < 520;
    const particleCount = Math.max(30, Math.floor((config.particleCount || 80) * (reduced ? 0.38 : compact ? 0.68 : 1)));

    const mist = Array.from({ length: compact ? 18 : 32 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 42 + Math.random() * 92,
      speed: 0.2 + Math.random() * 0.55,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.018 + Math.random() * 0.045,
      phase: Math.random() * Math.PI * 2 + i,
    }));

    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.8;
      const dist = 90 + Math.random() * Math.max(w, h) * 0.62;
      return {
        startX: cx + Math.cos(angle) * dist,
        startY: cy + Math.sin(angle) * dist,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: config.mode === "slash" ? 8 + Math.random() * 14 : 0,
        vy: config.mode === "slash" ? -3 + Math.random() * 6 : 0,
        life: 0.45 + Math.random() * 0.8,
        maxLife: 0.45 + Math.random() * 0.8,
        size: 0.7 + Math.random() * 3.2,
        type: i % 5,
        trail: [],
        active: false,
      };
    });

    const bolts = Array.from({ length: compact ? 4 : 7 }, () => ({
      active: false,
      points: [],
      life: 0,
      maxLife: 0.12 + Math.random() * 0.16,
      width: 1 + Math.random() * 2.3,
    }));

    const shards = Array.from({ length: compact ? 9 : 16 }, (_, i) => ({
      angle: (i / (compact ? 9 : 16)) * Math.PI * 2 + Math.random() * 0.35,
      length: 80 + Math.random() * Math.max(w, h) * 0.35,
      wobble: Math.random() * 18,
    }));

    const matrixColumns = Array.from({ length: compact ? 12 : 22 }, (_, i) => ({
      x: (i / (compact ? 12 : 22)) * w + Math.random() * 20,
      speed: 90 + Math.random() * 160,
      offset: Math.random() * h,
      alpha: 0.25 + Math.random() * 0.45,
    }));

    const rings = [];
    let running = true;
    const startT = performance.now();

    function generateLightning(x1, y1, x2, y2, segments = 9) {
      const pts = [{ x: x1, y: y1 }];
      for (let i = 1; i < segments; i += 1) {
        const t = i / segments;
        pts.push({
          x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 70,
          y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 45,
        });
      }
      pts.push({ x: x2, y: y2 });
      return pts;
    }

    function drawLightning(points, alpha) {
      if (points.length < 2) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = config.hot;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = config.primary;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.32;
      ctx.lineWidth = 8;
      ctx.strokeStyle = config.primary;
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      if (!running) return;
      const elapsed = (performance.now() - startT) / 1000;
      const totalSec = timing.duration / 1000;
      const progress = Math.min(elapsed / totalSec, 1);
      const inRift = progress > 0.12 && progress < 0.64;
      const inReveal = progress > 0.54;
      const riftIntensity = inRift ? Math.sin(((progress - 0.12) / 0.52) * Math.PI) : 0;
      const revealPower = inReveal ? Math.min(1, (progress - 0.54) / 0.42) : 0;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      drawMist(ctx, mist, elapsed, config, riftIntensity, w, h);

      if (config.mode === "slash") {
        drawSlashField(ctx, elapsed, progress, config, w, h);
      } else if (config.mode === "gate" || config.mode === "flame") {
        drawGateField(ctx, elapsed, riftIntensity, revealPower, config, cx, cy, w, h);
      } else if (config.mode === "frost") {
        drawFrostField(ctx, shards, elapsed, riftIntensity, revealPower, config, cx, cy);
      } else if (config.mode === "celestial") {
        drawCelestialField(ctx, elapsed, riftIntensity, revealPower, config, cx, cy, w, h);
      } else if (config.mode === "system") {
        drawSystemField(ctx, matrixColumns, elapsed, progress, config, w, h);
      } else if (config.mode === "eclipse") {
        drawEclipseField(ctx, elapsed, riftIntensity, revealPower, config, cx, cy, w, h);
      } else {
        drawRiftField(ctx, elapsed, riftIntensity, revealPower, config, cx, cy, w, h);
      }

      drawParticles(ctx, particles, config, cx, cy, w, h, inRift, inReveal, riftIntensity, revealPower);

      if (inRift && riftIntensity > 0.25 && config.mode !== "frost" && config.mode !== "system") {
        for (const bolt of bolts) {
          if (!bolt.active && Math.random() < 0.035 * riftIntensity * (config.shake || 1)) {
            bolt.active = true;
            bolt.life = bolt.maxLife;
            const angle = Math.random() * Math.PI * 2;
            const endDist = 130 + Math.random() * Math.max(140, Math.min(w, h) * 0.45);
            bolt.points = generateLightning(
              cx + (Math.random() - 0.5) * 24,
              cy + (Math.random() - 0.5) * h * 0.24,
              cx + Math.cos(angle) * endDist,
              cy + Math.sin(angle) * endDist,
              7 + Math.floor(Math.random() * 5)
            );
          }
          if (bolt.active) {
            bolt.life -= 0.016;
            if (bolt.life <= 0) {
              bolt.active = false;
            } else {
              drawLightning(bolt.points, bolt.life / bolt.maxLife);
            }
          }
        }
      }

      if (inRift && Math.random() < 0.012 + riftIntensity * 0.01) {
        rings.push({ x: cx, y: cy, radius: 0, life: 1, color: Math.random() > 0.55 ? config.primary : config.secondary });
      }
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const ring = rings[i];
        ring.radius += 3.5 + riftIntensity * 3;
        ring.life -= 0.024;
        if (ring.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = rgba(ring.color, ring.life * 0.35);
        ctx.lineWidth = 1 + ring.life * 2;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [config, isActive, timing.duration]);

  if (!isActive && phase === 0) return null;

  const phaseColors = [config.secondary, config.primary, config.accent, config.hot];
  const riftMs = Math.max(260, timing.revealStart - timing.riftStart);
  const revealMs = Math.max(320, timing.duration - timing.revealStart);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: phase > 0 ? "all" : "none",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <style>{LOCAL_TRANSITION_CSS}</style>

      {phase === 1 && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(2px) saturate(1.65) hue-rotate(8deg)",
              animation: `ptChromatic ${timing.voidPeak}ms ease-out forwards`,
              zIndex: 1,
            }}
          />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={`glitch-${i}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 2 + (i % 3) * 2,
                top: `${10 + i * 15}%`,
                background: `linear-gradient(90deg, transparent, ${rgba(phaseColors[i % phaseColors.length], 0.18 + i * 0.04)}, ${rgba(config.hot, 0.12)}, transparent)`,
                animation: `ptGlitchBand ${scaleMs(190 + i * 24)}ms ease ${scaleMs(i * 34, 0)}ms both`,
                zIndex: 1,
                mixBlendMode: "screen",
              }}
            />
          ))}
        </>
      )}

      {(phase === 1 || phase === 2) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: `radial-gradient(circle at 50% 50%, ${rgba(config.primary, 0.18)} 0%, ${rgba(config.deep, 0.99)} 48%, rgba(0,0,0,1) 100%)`,
            animation: phase === 1 ? `ptVoidExpand ${timing.voidPeak}ms cubic-bezier(0.22,1,0.36,1) forwards` : "none",
          }}
        />
      )}

      {phase >= 1 && phase <= 2 && (
        <>
          {[0, 1, 2, 3, 4].map(i => {
            const size = 74 + i * 14;
            return (
              <div
                key={`ripple-${i}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  borderRadius: "50%",
                  border: `2px solid ${rgba(phaseColors[i % phaseColors.length], 0.62 - i * 0.07)}`,
                  boxShadow: `0 0 28px ${rgba(phaseColors[i % phaseColors.length], 0.26)}`,
                  animation: `ptEnergyRipple ${scaleMs(900 + i * 90)}ms ease-out ${scaleMs(i * 82, 0)}ms forwards`,
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />
            );
          })}
        </>
      )}

      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}
      />

      <VariantOverlay config={config} phase={phase} />

      {phase === 2 && config.mode !== "eclipse" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${config.mode === "slash" ? "-28deg" : "0deg"})`,
            width: config.mode === "slash" ? 14 : 7,
            zIndex: 6,
            animation: `ptRiftGlow ${riftMs}ms ease-out forwards`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-12%",
              bottom: "-12%",
              left: -70,
              right: -70,
              borderRadius: 80,
              background: `linear-gradient(180deg, transparent, ${rgba(config.primary, 0.16)}, ${rgba(config.secondary, 0.12)}, transparent)`,
              filter: "blur(32px)",
              animation: "ptRiftPulse 520ms ease-in-out infinite alternate",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              background: `linear-gradient(180deg, transparent 1%, ${config.secondary} 10%, ${config.hot} 25%, ${config.primary} 50%, ${config.hot} 75%, ${config.secondary} 90%, transparent 99%)`,
              boxShadow: `0 0 22px ${rgba(config.primary, 0.75)}, 0 0 52px ${rgba(config.secondary, 0.45)}, 0 0 88px ${rgba(config.primary, 0.22)}`,
              animation: "ptRiftPulse 240ms ease-in-out infinite alternate",
            }}
          />
        </div>
      )}

      {showEyes && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: config.mode === "eclipse" ? 54 : 44,
            zIndex: 8,
            animation: `ptEyesReveal ${scaleMs(280)}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
          }}
        >
          <div style={eyeStyle(config.primary, config.hot, "left")} />
          <div style={eyeStyle(config.primary, config.hot, "right")} />
        </div>
      )}

      {phase === 2 && (
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0, zIndex: 7 }}>
          {runeData.map((rd, i) => (
            <div
              key={`rune-${i}`}
              style={{
                position: "absolute",
                fontSize: rd.size,
                color: rgba(i % 2 ? config.accent : config.secondary, rd.opacity),
                fontFamily: "'Cinzel', serif",
                animation: `ptRuneOrbit ${scaleSec(rd.speed)}s linear ${scaleSec(rd.delay, 0)}s forwards`,
                textShadow: `0 0 16px ${rgba(config.primary, 0.86)}, 0 0 34px ${rgba(config.secondary, 0.34)}`,
                pointerEvents: "none",
                filter: "brightness(1.25)",
                ["--orbit-radius"]: `${rd.radius}px`,
              }}
            >
              {rd.rune}
            </div>
          ))}
        </div>
      )}

      {phase === 2 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", overflow: "hidden" }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={`scan-${i}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: i === 0 ? 2 : 1,
                background: `linear-gradient(90deg, transparent 5%, ${rgba(config.primary, 0.24 + i * 0.08)} 24%, ${rgba(config.hot, 0.42)} 50%, ${rgba(config.secondary, 0.24 + i * 0.06)} 76%, transparent 95%)`,
                animation: `ptScanLine ${scaleSec(0.48 + i * 0.14)}s linear ${scaleSec(i * 0.1, 0)}s infinite`,
                boxShadow: `0 0 17px ${rgba(config.primary, 0.4)}, 0 0 34px ${rgba(config.secondary, 0.18)}`,
              }}
            />
          ))}
        </div>
      )}

      {phase >= 2 && phase <= 3 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            textAlign: "center",
            pointerEvents: "none",
            width: "min(92vw, 620px)",
            animation: phase === 3 ? `ptTextOut ${scaleMs(350)}ms ease-out forwards` : "none",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 17px",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${rgba(config.secondary, 0.1)}, ${rgba(config.primary, 0.14)})`,
              border: `1px solid ${rgba(config.secondary, 0.34)}`,
              marginBottom: 14,
              boxShadow: `0 0 22px ${rgba(config.primary, 0.18)}`,
              animation: `ptBadgeIn ${scaleMs(300)}ms ease both`,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: 4,
                color: config.accent,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 800,
                textShadow: `0 0 14px ${rgba(config.primary, 0.75)}`,
              }}
            >
              {config.badge}
            </span>
          </div>

          <div
            style={{
              fontSize: "clamp(20px, 7vw, 38px)",
              fontWeight: 900,
              color: "#fff",
              fontFamily: "'Cinzel', serif",
              letterSpacing: 10,
              textShadow: `0 0 48px ${rgba(config.primary, 0.78)}, 0 0 96px ${rgba(config.secondary, 0.38)}, 0 2px 4px rgba(0,0,0,0.9)`,
              animation: `ptViewText ${scaleMs(620)}ms ease-out forwards`,
              minHeight: 52,
              lineHeight: 1.18,
              overflowWrap: "anywhere",
            }}
          >
            {typedText}
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: "0.72em",
                background: `linear-gradient(180deg, ${config.hot}, ${config.primary})`,
                marginLeft: 6,
                animation: `ptCursor ${scaleMs(500)}ms step-end infinite`,
                verticalAlign: "middle",
                boxShadow: `0 0 12px ${config.hot}, 0 0 28px ${rgba(config.primary, 0.55)}`,
                borderRadius: 1,
              }}
            />
          </div>

          <div
            style={{
              width: 148,
              height: 1,
              margin: "15px auto 0",
              background: `linear-gradient(90deg, transparent, ${rgba(config.primary, 0.65)}, ${rgba(config.hot, 0.5)}, ${rgba(config.secondary, 0.55)}, transparent)`,
              animation: `ptUnderline ${scaleMs(420)}ms ease-out ${scaleMs(180, 0)}ms both`,
              boxShadow: `0 0 12px ${rgba(config.primary, 0.42)}`,
            }}
          />
        </div>
      )}

      {phase === 3 && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              background: `radial-gradient(circle at 50% 50%, transparent 0%, transparent 22%, ${rgba(config.primary, 0.12)} 38%, ${rgba(config.deep, 0.99)} 58%, rgba(0,0,0,1) 100%)`,
              animation: `ptVoidCollapse ${revealMs}ms cubic-bezier(0.22,1,0.36,1) forwards`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 0,
              height: 0,
              zIndex: 3,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rgba(config.hot, 0.23)}, ${rgba(config.primary, 0.16)}, ${rgba(config.secondary, 0.08)}, transparent)`,
              animation: `ptRadialBurst ${revealMs}ms ease-out forwards`,
            }}
          />
        </>
      )}

      {phase === 3 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: "none" }}>
          {residualParticles.map((p, i) => {
            const c = p.tone === 0 ? config.secondary : p.tone === 1 ? config.primary : p.tone === 2 ? config.hot : config.accent;
            return (
              <div
                key={`res-${i}`}
                style={{
                  position: "absolute",
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.w,
                  height: p.w,
                  borderRadius: "50%",
                  background: c,
                  boxShadow: `0 0 9px ${c}, 0 0 18px ${rgba(c, 0.45)}`,
                  animation: `ptResidualFloat ${scaleSec(p.dur)}s ease-out ${scaleSec(p.delay, 0)}s forwards`,
                  ["--rx"]: `${p.rx}px`,
                }}
              />
            );
          })}
          {[
            { top: 0, left: 0, bg: `radial-gradient(circle at 0% 0%, ${rgba(config.primary, 0.09)}, transparent 52%)` },
            { top: 0, right: 0, bg: `radial-gradient(circle at 100% 0%, ${rgba(config.secondary, 0.075)}, transparent 52%)` },
            { bottom: 0, left: 0, bg: `radial-gradient(circle at 0% 100%, ${rgba(config.secondary, 0.075)}, transparent 52%)` },
            { bottom: 0, right: 0, bg: `radial-gradient(circle at 100% 100%, ${rgba(config.primary, 0.09)}, transparent 52%)` },
          ].map((corner, i) => (
            <div
              key={`afterglow-${i}`}
              style={{
                position: "absolute",
                ...corner,
                width: "50%",
                height: "50%",
                background: corner.bg,
                animation: `ptAfterglow ${scaleSec(0.55 + i * 0.1)}s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VariantOverlay({ config, phase }) {
  if (phase < 2) return null;

  if (config.mode === "slash") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={`slash-${i}`}
            style={{
              position: "absolute",
              left: "-18%",
              top: `${10 + i * 13}%`,
              width: "138%",
              height: i % 3 === 0 ? 5 : 2,
              background: `linear-gradient(90deg, transparent, ${rgba(config.primary, 0.08)}, ${config.hot}, ${config.primary}, transparent)`,
              boxShadow: `0 0 22px ${rgba(config.primary, 0.8)}`,
              animation: `ptSlashSweep ${520 + i * 35}ms cubic-bezier(0.16,1,0.3,1) ${i * 42}ms both`,
              ["--rot"]: `${-32 + i * 2}deg`,
              mixBlendMode: "screen",
            }}
          />
        ))}
      </div>
    );
  }

  if (config.mode === "gate" || config.mode === "flame") {
    const flame = config.mode === "flame";
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        {[0, 1, 2].map(i => (
          <div
            key={`gate-${i}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 170 + i * 62,
              height: 170 + i * 62,
              borderRadius: "50%",
              border: `${2 + i}px solid ${rgba(i % 2 ? config.secondary : config.primary, 0.62 - i * 0.1)}`,
              boxShadow: `0 0 ${36 + i * 16}px ${rgba(config.primary, 0.45)}, inset 0 0 ${24 + i * 16}px ${rgba(config.secondary, 0.24)}`,
              animation: `ptGateSpin ${920 + i * 260}ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both, ptGatePulse 520ms ease-in-out infinite alternate`,
              ["--c"]: config.primary,
              ["--c2"]: rgba(config.secondary, 0.55),
            }}
          />
        ))}
        {flame && Array.from({ length: 24 }, (_, i) => (
          <div
            key={`flame-${i}`}
            style={{
              position: "absolute",
              left: `${4 + ((i * 37) % 92)}%`,
              bottom: -20,
              width: 4 + (i % 4) * 2,
              height: 72 + (i % 5) * 22,
              borderRadius: "999px 999px 0 0",
              background: `linear-gradient(180deg, ${config.hot}, ${config.accent}, ${config.primary}00)`,
              filter: "blur(1px)",
              opacity: 0.88,
              animation: `ptFlameLick ${820 + (i % 5) * 95}ms ease-out ${i * 34}ms infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (config.mode === "frost") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={`ice-${i}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 16 + (i % 4) * 9,
              height: 54 + (i % 5) * 12,
              clipPath: "polygon(50% 0, 100% 72%, 58% 100%, 0 72%)",
              background: `linear-gradient(180deg, ${rgba(config.hot, 0.85)}, ${rgba(config.primary, 0.34)}, transparent)`,
              border: `1px solid ${rgba(config.accent, 0.34)}`,
              boxShadow: `0 0 20px ${rgba(config.primary, 0.32)}`,
              animation: `ptShardDrift ${820 + (i % 6) * 75}ms ease-out ${i * 30}ms both`,
              ["--rot"]: `${i * 23}deg`,
              ["--tx"]: `${-180 + ((i * 43) % 360)}px`,
              ["--ty"]: `${-160 + ((i * 29) % 320)}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (config.mode === "celestial") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "min(74vw, 360px)",
            aspectRatio: "1",
            borderRadius: "50%",
            border: `1px solid ${rgba(config.hot, 0.5)}`,
            boxShadow: `0 0 80px ${rgba(config.primary, 0.32)}, inset 0 0 44px ${rgba(config.hot, 0.18)}`,
            background: `conic-gradient(from 0deg, transparent 0 8%, ${rgba(config.primary, 0.2)} 10%, transparent 13% 22%, ${rgba(config.hot, 0.18)} 24%, transparent 28%)`,
            animation: "ptMandalaSpin 5s linear infinite",
          }}
        />
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={`spear-${i}`}
            style={{
              position: "absolute",
              left: `${6 + i * 11}%`,
              top: -120,
              width: 3,
              height: "128vh",
              background: `linear-gradient(180deg, transparent, ${config.hot}, ${config.primary}, transparent)`,
              boxShadow: `0 0 24px ${rgba(config.primary, 0.82)}`,
              transformOrigin: "50% 50%",
              animation: `ptSpearDrop ${850 + i * 35}ms cubic-bezier(0.22,1,0.36,1) ${i * 44}ms both`,
              ["--rot"]: `${-18 + i * 4}deg`,
            }}
          />
        ))}
      </div>
    );
  }

  if (config.mode === "system") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={`sys-${i}`}
            style={{
              position: "absolute",
              left: `${(i * 6) % 100}%`,
              top: "-20%",
              width: 2 + (i % 3),
              height: "140%",
              background: `repeating-linear-gradient(180deg, transparent 0 10px, ${rgba(config.primary, 0.78)} 11px 14px, transparent 15px 24px)`,
              opacity: 0.28 + (i % 4) * 0.1,
              animation: `ptSystemColumn ${850 + (i % 6) * 120}ms linear ${i * 28}ms infinite`,
              boxShadow: `0 0 12px ${rgba(config.primary, 0.45)}`,
            }}
          />
        ))}
      </div>
    );
  }

  if (config.mode === "eclipse") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 6, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "min(76vw, 390px)",
            aspectRatio: "1",
            borderRadius: "50%",
            background: `radial-gradient(circle, #03010a 0 43%, ${rgba(config.primary, 0.22)} 44%, ${rgba(config.secondary, 0.42)} 48%, transparent 62%)`,
            boxShadow: `0 0 90px ${rgba(config.primary, 0.48)}, 0 0 160px ${rgba(config.secondary, 0.22)}`,
            animation: "ptEclipsePulse 760ms cubic-bezier(0.16,1,0.3,1) both",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "calc(50% - 132px)",
            left: "50%",
            width: 130,
            height: 76,
            clipPath: "polygon(50% 0, 62% 45%, 100% 20%, 74% 72%, 50% 100%, 26% 72%, 0 20%, 38% 45%)",
            background: `linear-gradient(180deg, ${config.secondary}, ${config.primary} 70%, transparent)`,
            filter: `drop-shadow(0 0 26px ${config.primary})`,
            animation: "ptCrownRise 620ms cubic-bezier(0.16,1,0.3,1) 220ms both",
          }}
        />
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={`shadow-${i}`}
            style={{
              position: "absolute",
              bottom: -10,
              left: `${3 + ((i * 31) % 94)}%`,
              width: 8 + (i % 5) * 5,
              background: `linear-gradient(180deg, ${rgba(config.primary, 0.62)}, transparent)`,
              borderRadius: "999px 999px 0 0",
              filter: "blur(1px)",
              animation: `ptShadowRise ${820 + (i % 6) * 80}ms ease-out ${i * 36}ms both`,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

function drawMist(ctx, mist, elapsed, config, intensity, w, h) {
  for (const m of mist) {
    m.x += Math.cos(m.angle + elapsed) * m.speed;
    m.y += Math.sin(m.angle + elapsed * 0.7) * m.speed;
    if (m.x < -m.radius) m.x = w + m.radius;
    if (m.x > w + m.radius) m.x = -m.radius;
    if (m.y < -m.radius) m.y = h + m.radius;
    if (m.y > h + m.radius) m.y = -m.radius;
    const pulseAlpha = m.opacity * (0.7 + 0.3 * Math.sin(elapsed * 2 + m.phase)) * (0.55 + intensity);
    const gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
    gradient.addColorStop(0, rgba(config.primary, pulseAlpha * 1.8));
    gradient.addColorStop(0.5, rgba(config.secondary, pulseAlpha));
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(m.x - m.radius, m.y - m.radius, m.radius * 2, m.radius * 2);
  }
}

function drawParticles(ctx, particles, config, cx, cy, w, h, inRift, inReveal, riftIntensity, revealPower) {
  for (const p of particles) {
    if (!p.active && (inRift || inReveal)) {
      p.active = true;
      p.x = p.startX;
      p.y = p.startY;
      p.trail = [];
    }
    if (!p.active) continue;

    if (config.mode === "slash") {
      p.x += p.vx * (0.8 + riftIntensity);
      p.y += p.vy;
      if (p.x > w + 60 || p.y < -60 || p.y > h + 60) {
        p.x = -60 - Math.random() * 160;
        p.y = Math.random() * h;
        p.vx = 8 + Math.random() * 16;
        p.vy = -3 + Math.random() * 6;
      }
    } else if (inRift) {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const force = Math.min(0.09 * riftIntensity, 0.14);
      p.vx += (dx / dist) * force * dist * 0.012;
      p.vy += (dy / dist) * force * dist * 0.012;
      p.vx *= 0.91;
      p.vy *= 0.91;
    } else if (inReveal) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      p.vx += (dx / dist) * (1.6 + revealPower * 2.2);
      p.vy += (dy / dist) * (1.6 + revealPower * 2.2);
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= 0.018;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 12) p.trail.shift();

    if (p.life <= 0 || p.x < -100 || p.x > w + 100 || p.y < -100 || p.y > h + 100) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * Math.max(w, h) * 0.58;
      p.x = cx + Math.cos(angle) * dist;
      p.y = cy + Math.sin(angle) * dist;
      p.life = p.maxLife;
      p.vx = config.mode === "slash" ? 8 + Math.random() * 14 : 0;
      p.vy = config.mode === "slash" ? -3 + Math.random() * 6 : 0;
      p.trail = [];
    }

    const alpha = Math.max(0, p.life / p.maxLife) * (inRift ? 0.95 * Math.max(0.25, riftIntensity) : 0.62);
    const colors = [config.primary, config.secondary, config.hot, config.accent, config.primary];
    const c = colors[p.type % colors.length];

    if (p.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i += 1) ctx.lineTo(p.trail[i].x, p.trail[i].y);
      ctx.strokeStyle = rgba(c, alpha * 0.62);
      ctx.lineWidth = p.size * 0.5;
      ctx.stroke();
    }

    const r = p.size * Math.max(0.34, p.life / p.maxLife);
    ctx.fillStyle = rgba(c, alpha);
    ctx.shadowColor = c;
    ctx.shadowBlur = 10 + riftIntensity * 14;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawRiftField(ctx, elapsed, intensity, revealPower, config, cx, cy, w, h) {
  if (intensity > 0) {
    const radius = 90 + intensity * Math.min(w, h) * 0.34;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, rgba(config.hot, 0.05 * intensity));
    gradient.addColorStop(0.3, rgba(config.primary, 0.17 * intensity));
    gradient.addColorStop(0.68, rgba(config.secondary, 0.07 * intensity));
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elapsed * 1.2);
    ctx.strokeStyle = rgba(config.primary, 0.12 + intensity * 0.18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 70 + i * 58 + Math.sin(elapsed * 2 + i) * 12, Math.PI * 0.1 * i, Math.PI * 1.45 + i * 0.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (revealPower > 0) {
    ctx.fillStyle = rgba(config.hot, 0.05 * (1 - revealPower));
    ctx.fillRect(0, 0, w, h);
  }
}

function drawSlashField(ctx, elapsed, progress, config, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 14; i += 1) {
    const y = ((i * 73 + elapsed * 760) % (h + 160)) - 80;
    const x = -120 + ((i * 61 + elapsed * 1100) % (w + 240));
    ctx.strokeStyle = rgba(i % 3 ? config.primary : config.hot, 0.16 + (i % 4) * 0.06);
    ctx.lineWidth = i % 4 === 0 ? 5 : 2;
    ctx.shadowColor = config.primary;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(x - 220, y + 130);
    ctx.lineTo(x + 260, y - 110);
    ctx.stroke();
  }
  if (progress > 0.24 && progress < 0.52) {
    ctx.fillStyle = rgba(config.hot, 0.12);
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function drawGateField(ctx, elapsed, intensity, revealPower, config, cx, cy, w, h) {
  const radius = Math.min(w, h) * (0.18 + intensity * 0.18);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(elapsed * (config.mode === "flame" ? 1.8 : 1.2));
  for (let i = 0; i < 4; i += 1) {
    ctx.strokeStyle = rgba(i % 2 ? config.secondary : config.primary, 0.12 + intensity * (0.22 - i * 0.025));
    ctx.lineWidth = 2 + i;
    ctx.shadowColor = i % 2 ? config.secondary : config.primary;
    ctx.shadowBlur = 22 + i * 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius + i * 38, Math.sin(elapsed + i) * 0.5, Math.PI * 1.6 + Math.cos(elapsed + i) * 0.5);
    ctx.stroke();
  }
  ctx.restore();

  const embers = config.mode === "flame" ? 42 : 24;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < embers; i += 1) {
    const x = (i * 97 + elapsed * (70 + i * 3)) % (w + 60) - 30;
    const y = h - ((elapsed * (120 + (i % 5) * 22) + i * 41) % (h + 80));
    const size = 1.2 + (i % 5);
    ctx.fillStyle = rgba(i % 2 ? config.accent : config.primary, 0.32 + intensity * 0.42);
    ctx.shadowColor = config.primary;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (revealPower > 0) {
    const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * revealPower);
    flash.addColorStop(0, rgba(config.hot, 0.2 * (1 - revealPower)));
    flash.addColorStop(1, "transparent");
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawFrostField(ctx, shards, elapsed, intensity, revealPower, config, cx, cy) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = rgba(config.hot, 0.22 + intensity * 0.4);
  ctx.shadowColor = config.primary;
  ctx.shadowBlur = 16;
  for (const shard of shards) {
    const len = shard.length * (0.4 + intensity * 0.7 + revealPower * 0.8);
    const wobble = Math.sin(elapsed * 3 + shard.wobble) * 10;
    const x = cx + Math.cos(shard.angle) * len;
    const y = cy + Math.sin(shard.angle) * len;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(shard.angle) * 28, cy + Math.sin(shard.angle) * 28);
    ctx.lineTo(x + wobble, y - wobble);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCelestialField(ctx, elapsed, intensity, revealPower, config, cx, cy, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beamCount = 9;
  for (let i = 0; i < beamCount; i += 1) {
    const x = (i / (beamCount - 1)) * w;
    const alpha = 0.05 + intensity * 0.2;
    const grad = ctx.createLinearGradient(x, 0, x + Math.sin(elapsed + i) * 80, h);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.45, rgba(i % 2 ? config.hot : config.primary, alpha));
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 25, 0);
    ctx.lineTo(x + 34, 0);
    ctx.lineTo(x + 110, h);
    ctx.lineTo(x - 110, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.translate(cx, cy);
  ctx.rotate(-elapsed * 0.55);
  ctx.strokeStyle = rgba(config.hot, 0.14 + intensity * 0.28);
  ctx.lineWidth = 1;
  drawPolygon(ctx, 0, 0, 92 + intensity * 72, 6);
  drawPolygon(ctx, 0, 0, 138 + intensity * 96, 8);
  ctx.restore();

  if (revealPower > 0.2) {
    ctx.fillStyle = rgba(config.hot, 0.08 * (1 - revealPower));
    ctx.fillRect(0, 0, w, h);
  }
}

function drawSystemField(ctx, columns, elapsed, progress, config, w, h) {
  ctx.save();
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.globalCompositeOperation = "screen";
  for (const col of columns) {
    const y = (elapsed * col.speed + col.offset) % (h + 220) - 220;
    ctx.fillStyle = rgba(config.primary, col.alpha);
    for (let j = 0; j < 18; j += 1) {
      const value = (j + Math.floor(elapsed * 12) + Math.floor(col.x)) % 3 === 0 ? "1" : "0";
      ctx.fillText(value, col.x, y + j * 14);
    }
  }
  ctx.strokeStyle = rgba(config.secondary, 0.07 + Math.sin(elapsed * 8) * 0.02);
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  if (progress > 0.28 && progress < 0.52) {
    ctx.fillStyle = rgba(config.hot, 0.08);
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function drawEclipseField(ctx, elapsed, intensity, revealPower, config, cx, cy, w, h) {
  const radius = Math.min(w, h) * (0.18 + intensity * 0.1);
  ctx.save();
  const corona = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.1);
  corona.addColorStop(0, rgba(config.deep, 0.25));
  corona.addColorStop(0.36, rgba(config.primary, 0.16 + intensity * 0.18));
  corona.addColorStop(0.48, rgba(config.secondary, 0.14 + intensity * 0.2));
  corona.addColorStop(1, "transparent");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, cy);
  ctx.rotate(elapsed * 0.35);
  ctx.strokeStyle = rgba(config.primary, 0.12 + intensity * 0.32);
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + i * 34, Math.PI * 0.15 * i, Math.PI * 1.7 + i * 0.3);
    ctx.stroke();
  }
  ctx.restore();

  if (revealPower > 0.12) {
    ctx.fillStyle = rgba(config.secondary, 0.05 * (1 - revealPower));
    ctx.fillRect(0, 0, w, h);
  }
}

function drawPolygon(ctx, cx, cy, r, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function eyeStyle(color, hot, side) {
  return {
    width: 15,
    height: 20,
    borderRadius: "50% 50% 50% 50% / 62% 62% 40% 40%",
    background: `radial-gradient(circle at ${side === "left" ? "56%" : "44%"} 44%, ${hot} 8%, ${color} 32%, #05010d 72%, transparent 78%)`,
    boxShadow: `0 0 34px ${color}, 0 0 72px ${color}, 0 0 120px ${rgba(color, 0.5)}, inset 0 0 11px rgba(255,255,255,0.34)`,
    animation: "ptEyePulse 180ms ease-in-out infinite alternate",
    position: "relative",
  };
}

function rgba(color, alpha) {
  if (!color) return `rgba(255,255,255,${alpha})`;
  if (color.startsWith("rgba")) return color;
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  const hex = color.replace("#", "").trim();
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}
