// PageTransition.jsx – Shadow Monarch's Domain Shift (Cinema-Grade)
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

const RUNE_SYMBOLS = ["⟁", "◇", "⬡", "◈", "✦", "⚔", "☽", "⛧", "◆", "✧"];
const TRANSITION_DURATION = 1500;
const VOID_PEAK = 350;
const VIEW_SWITCH_AT = 500;
const RIFT_START = 280;
const EYES_START = 450;
const EYES_END = 750;
const REVEAL_START = 800;
const RESIDUAL_START = 850;

export default function PageTransition({
  isActive,
  targetLabel,
  theme,
  onMidpoint,
  onComplete,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const midpointFired = useRef(false);
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showEyes, setShowEyes] = useState(false);
  const shakeRef = useRef({ x: 0, y: 0 });

  // Pre-compute residual particles
  const residualParticles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      left: 5 + (((i * 47 + 13) % 90)),
      top: 5 + (((i * 31 + 7) % 90)),
      w: 2 + ((i * 13) % 5),
      delay: (i * 0.02),
      dur: 0.8 + ((i * 17) % 8) * 0.12,
      isCyan: i % 4 === 0,
      isPurple: i % 4 === 1,
      isWhite: i % 4 === 2,
    })),
  []);

  // Pre-compute rune data
  const runeData = useMemo(() =>
    RUNE_SYMBOLS.map((rune, i) => ({
      rune,
      opacity: 0.3 + ((i * 17) % 40) * 0.01,
      radius: 60 + (i % 3) * 30,
      speed: 1.2 + i * 0.1,
      delay: i * 0.04,
      size: 14 + ((i * 7) % 8),
    })),
  []);

  // Screen shake effect
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

  // Main transition orchestration
  useEffect(() => {
    if (!isActive) {
      setPhase(0);
      return;
    }

    midpointFired.current = false;
    setPhase(1);
    setTypedText("");
    setShowEyes(false);

    // Trigger initial screen shake
    triggerShake(5, 250);

    const timers = [
      setTimeout(() => { setPhase(2); triggerShake(8, 200); }, RIFT_START),
      setTimeout(() => {
        if (!midpointFired.current) {
          midpointFired.current = true;
          onMidpoint?.();
        }
      }, VIEW_SWITCH_AT),
      setTimeout(() => setShowEyes(true), EYES_START),
      setTimeout(() => setShowEyes(false), EYES_END),
      setTimeout(() => { setPhase(3); triggerShake(4, 350); }, REVEAL_START),
      setTimeout(() => {
        setPhase(0);
        onComplete?.();
      }, TRANSITION_DURATION),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  // Typewriter effect with glitch
  useEffect(() => {
    if (phase < 2 || !targetLabel) return;
    const fullText = `▸ ${targetLabel}`;
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [phase === 2 ? 1 : 0]);

  // ─── EPIC Canvas Particle System ───
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;

    // Shadow mist particles – floating dark wisps
    const mist = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 40 + Math.random() * 80,
      speed: 0.3 + Math.random() * 0.5,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.02 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
    }));

    // Core particles – energy converging to center
    const particles = Array.from({ length: 80 }, (_, i) => {
      const angle = (i / 80) * Math.PI * 2 + Math.random() * 0.8;
      const dist = 50 + Math.random() * Math.max(w, h) * 0.5;
      return {
        startX: cx + Math.cos(angle) * dist,
        startY: cy + Math.sin(angle) * dist,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        life: 0.5 + Math.random() * 0.6,
        maxLife: 0.5 + Math.random() * 0.6,
        size: 1 + Math.random() * 3,
        type: i % 5 === 0 ? "cyan" : i % 3 === 0 ? "white" : "purple",
        trail: [],
        active: false,
        convergeDist: dist,
        convergeAngle: angle,
      };
    });

    // Lightning bolts
    const bolts = Array.from({ length: 6 }, () => ({
      active: false,
      points: [],
      life: 0,
      maxLife: 0.15 + Math.random() * 0.1,
      color: Math.random() > 0.5 ? "#a78bfa" : "#22d3ee",
      width: 1 + Math.random() * 2,
    }));

    // Energy sparks
    const sparks = Array.from({ length: 40 }, () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 0.2 + Math.random() * 0.3,
      maxLife: 0.2 + Math.random() * 0.3,
      active: false,
      size: 0.5 + Math.random() * 1.5,
    }));

    // Shockwave rings
    const rings = [];

    let running = true;
    const startT = performance.now();

    function generateLightning(x1, y1, x2, y2, segments = 8) {
      const pts = [{ x: x1, y: y1 }];
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 60;
        const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 40;
        pts.push({ x: mx, y: my });
      }
      pts.push({ x: x2, y: y2 });
      return pts;
    }

    function drawLightningBolt(points, color, width, alpha) {
      if (points.length < 2) return;
      // Outer glow
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = width * 6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // Core
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      if (!running) return;
      const elapsed = (performance.now() - startT) / 1000;
      const totalSec = TRANSITION_DURATION / 1000;
      const progress = Math.min(elapsed / totalSec, 1);
      const inVoid = progress < 0.25;
      const inRift = progress > 0.18 && progress < 0.58;
      const inReveal = progress > 0.55;
      const riftIntensity = inRift ? Math.sin((progress - 0.18) / 0.4 * Math.PI) : 0;

      ctx.clearRect(0, 0, w, h);

      // Apply screen shake
      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // ──── Phase 1: Shadow Mist ────
      if (!inReveal) {
        for (const m of mist) {
          m.x += Math.cos(m.angle + elapsed) * m.speed;
          m.y += Math.sin(m.angle + elapsed * 0.7) * m.speed;
          const pulseAlpha = m.opacity * (0.6 + 0.4 * Math.sin(elapsed * 2 + m.phase));
          const gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
          gradient.addColorStop(0, `rgba(124,58,237,${pulseAlpha * riftIntensity * 2})`);
          gradient.addColorStop(0.5, `rgba(88,28,195,${pulseAlpha * riftIntensity})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fillRect(m.x - m.radius, m.y - m.radius, m.radius * 2, m.radius * 2);
        }
      }

      // ──── Phase 2: Converging particles with trails ────
      if (inRift || inReveal) {
        for (const p of particles) {
          if (!p.active && inRift) {
            p.active = true;
            p.x = p.startX;
            p.y = p.startY;
            p.trail = [];
          }
          if (!p.active) continue;

          // Converge toward center during rift, explode outward during reveal
          if (inRift) {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = Math.min(0.08 * riftIntensity, 0.12);
            p.vx += (dx / dist) * force * dist * 0.01;
            p.vy += (dy / dist) * force * dist * 0.01;
            p.vx *= 0.92;
            p.vy *= 0.92;
          } else if (inReveal) {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            p.vx += (dx / dist) * 2;
            p.vy += (dy / dist) * 2;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 0.015;
          }

          p.x += p.vx;
          p.y += p.vy;

          // Trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 12) p.trail.shift();

          // Recycle
          if (p.life <= 0 && inRift) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * Math.max(w, h) * 0.4;
            p.x = cx + Math.cos(angle) * dist;
            p.y = cy + Math.sin(angle) * dist;
            p.life = p.maxLife;
            p.vx = 0;
            p.vy = 0;
            p.trail = [];
          }

          const alpha = Math.max(0, (p.life / p.maxLife)) * (inRift ? riftIntensity : 0.6);
          const colors = {
            purple: `rgba(167,139,250,${alpha})`,
            cyan: `rgba(34,211,238,${alpha * 0.9})`,
            white: `rgba(230,230,255,${alpha * 0.7})`,
          };
          const glowColors = {
            purple: "#a78bfa",
            cyan: "#22d3ee",
            white: "#e0e0ff",
          };

          // Draw trail
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.strokeStyle = colors[p.type];
            ctx.lineWidth = p.size * 0.4 * alpha;
            ctx.stroke();
          }

          // Draw particle
          const r = p.size * Math.max(0.3, p.life / p.maxLife);
          ctx.fillStyle = colors[p.type];
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Glow
          if (alpha > 0.2) {
            ctx.shadowColor = glowColors[p.type];
            ctx.shadowBlur = 12 + riftIntensity * 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // ──── Lightning bolts ────
      if (inRift && riftIntensity > 0.3) {
        for (const bolt of bolts) {
          if (!bolt.active && Math.random() < 0.04 * riftIntensity) {
            bolt.active = true;
            bolt.life = bolt.maxLife;
            const angle = Math.random() * Math.PI * 2;
            const endDist = 100 + Math.random() * 200;
            bolt.points = generateLightning(
              cx + (Math.random() - 0.5) * 20,
              cy + (Math.random() - 0.5) * h * 0.3,
              cx + Math.cos(angle) * endDist,
              cy + Math.sin(angle) * endDist,
              6 + Math.floor(Math.random() * 4)
            );
          }
          if (bolt.active) {
            bolt.life -= 0.016;
            if (bolt.life <= 0) {
              bolt.active = false;
              continue;
            }
            const a = (bolt.life / bolt.maxLife);
            drawLightningBolt(bolt.points, bolt.color, bolt.width, a);
          }
        }
      }

      // ──── Energy sparks burst ────
      if (inRift) {
        for (const s of sparks) {
          if (!s.active && Math.random() < 0.06 * riftIntensity) {
            s.active = true;
            s.x = cx + (Math.random() - 0.5) * 10;
            s.y = cy + (Math.random() - 0.5) * h * 0.3;
            s.vx = (Math.random() - 0.5) * 14;
            s.vy = (Math.random() - 0.5) * 6;
            s.life = s.maxLife;
          }
          if (!s.active) continue;
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.1; // gravity
          s.life -= 0.02;
          if (s.life <= 0) { s.active = false; continue; }
          const a = (s.life / s.maxLife) * riftIntensity;
          ctx.fillStyle = `rgba(220,220,255,${a})`;
          ctx.shadowColor = "#c4b5fd";
          ctx.shadowBlur = 6;
          ctx.fillRect(s.x, s.y, s.size * 3, s.size);
          ctx.shadowBlur = 0;
        }
      }

      // ──── Central vortex glow ────
      if (inRift) {
        const vortexRadius = 80 + riftIntensity * 120;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, vortexRadius);
        gradient.addColorStop(0, `rgba(124,58,237,${0.15 * riftIntensity})`);
        gradient.addColorStop(0.3, `rgba(88,28,195,${0.08 * riftIntensity})`);
        gradient.addColorStop(0.6, `rgba(34,211,238,${0.04 * riftIntensity})`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, vortexRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ──── Hex grid (subtle, during rift only) ────
      if (inRift && riftIntensity > 0.5 && Math.sin(elapsed * 12) > 0.6) {
        ctx.strokeStyle = `rgba(124,58,237,${0.03 + Math.sin(elapsed * 20) * 0.015})`;
        ctx.lineWidth = 0.5;
        const hs = 48;
        const cols = Math.ceil(w / (hs * 1.73)) + 3;
        const rows = Math.ceil(h / (hs * 1.5)) + 3;
        for (let row = -1; row < rows; row++) {
          for (let col = -1; col < cols; col++) {
            const ox = row % 2 === 0 ? 0 : hs * 0.866;
            const hx = col * hs * 1.73 + ox;
            const hy = row * hs * 1.5;
            const distFromCenter = Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2);
            if (distFromCenter < 300 * riftIntensity) {
              drawHex(ctx, hx, hy, hs * 0.38);
            }
          }
        }
      }

      // ──── Shockwave rings ────
      // Add new ring during phase transitions
      if (inRift && Math.random() < 0.01) {
        rings.push({ x: cx, y: cy, radius: 0, maxRadius: 200 + Math.random() * 300, life: 1, color: Math.random() > 0.5 ? "#7c3aed" : "#22d3ee" });
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += 4;
        ring.life -= 0.02;
        if (ring.life <= 0) { rings.splice(i, 1); continue; }
        ctx.strokeStyle = ring.color + Math.round(ring.life * 80).toString(16).padStart(2, "0");
        ctx.lineWidth = 2 * ring.life;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore(); // end shake transform

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive]);

  if (!isActive && phase === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: phase > 0 ? "all" : "none",
        overflow: "hidden",
      }}
    >
      {/* 1. Reality distortion – chromatic aberration + glitch bands */}
      {phase === 1 && (
        <>
          <div
            style={{
              position: "absolute", inset: 0,
              backdropFilter: "blur(2px) hue-rotate(10deg) saturate(1.5)",
              animation: `slChromaticAberration ${VOID_PEAK}ms ease-out forwards`,
              zIndex: 1,
            }}
          />
          {/* Glitch bands */}
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={`glitch-${i}`}
              style={{
                position: "absolute",
                left: 0, right: 0,
                height: 2 + (i % 3) * 2,
                top: `${15 + i * 18}%`,
                background: `linear-gradient(90deg, transparent, rgba(124,58,237,${0.15 + i * 0.05}), rgba(34,211,238,${0.1 + i * 0.03}), transparent)`,
                animation: `slGlitchBand 200ms ease ${i * 40}ms both`,
                zIndex: 1,
                mixBlendMode: "screen",
              }}
            />
          ))}
        </>
      )}

      {/* 2. Void – radial dark void expanding from center */}
      {(phase === 1 || phase === 2) && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 2,
            background: "radial-gradient(circle at 50% 50%, rgba(15,5,30,0.99) 0%, rgba(2,1,8,0.99) 50%, rgba(0,0,0,1) 100%)",
            animation: phase === 1
              ? `slVoidExpand ${VOID_PEAK}ms cubic-bezier(0.22,1,0.36,1) forwards`
              : "none",
          }}
        />
      )}

      {/* 3. Multiple energy ripple rings with different colors */}
      {phase >= 1 && phase <= 2 && (
        <>
          {[
            { delay: 0, color: "rgba(124,58,237,0.6)", size: 90 },
            { delay: 100, color: "rgba(167,139,250,0.5)", size: 70 },
            { delay: 200, color: "rgba(34,211,238,0.4)", size: 110 },
            { delay: 300, color: "rgba(124,58,237,0.3)", size: 80 },
            { delay: 400, color: "rgba(167,139,250,0.25)", size: 100 },
          ].map((ring, i) => (
            <div
              key={`ripple-${i}`}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: ring.size, height: ring.size,
                marginLeft: -ring.size / 2, marginTop: -ring.size / 2,
                borderRadius: "50%",
                border: `2px solid ${ring.color}`,
                animation: `slEnergyRipple 1000ms ease-out ${ring.delay}ms forwards`,
                zIndex: 3, pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}

      {/* 4. Particle Canvas (behind text overlay) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          zIndex: 5, pointerEvents: "none",
        }}
      />

      {/* 5. Vertical Rift – enhanced with outer glow layers */}
      {phase === 2 && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 6, zIndex: 6,
            animation: `slRiftGlow ${REVEAL_START - RIFT_START}ms ease-out forwards`,
          }}
        >
          {/* Outer glow pulse layer 1 */}
          <div
            style={{
              position: "absolute",
              top: "-10%", bottom: "-10%",
              left: -60, right: -60,
              background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.08), rgba(88,28,195,0.12), rgba(34,211,238,0.06), rgba(124,58,237,0.08), transparent)",
              borderRadius: 60,
              filter: "blur(30px)",
              animation: "slRiftPulseOuter 600ms ease-in-out infinite alternate",
            }}
          />
          {/* Outer glow layer 2 */}
          <div
            style={{
              position: "absolute",
              top: "-5%", bottom: "-5%",
              left: -32, right: -32,
              background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.15), rgba(34,211,238,0.1), rgba(167,139,250,0.15), transparent)",
              borderRadius: 32,
              filter: "blur(16px)",
            }}
          />
          {/* Core rift line */}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 1%, #22d3ee 8%, #c4b5fd 20%, #a78bfa 35%, #7c3aed 50%, #a78bfa 65%, #c4b5fd 80%, #22d3ee 92%, transparent 99%)",
              borderRadius: 6,
              animation: "slRiftPulse 280ms ease-in-out infinite alternate",
              boxShadow: "0 0 20px #7c3aed88, 0 0 40px #22d3ee44, 0 0 60px #7c3aed22",
            }}
          />
          {/* White hot center */}
          <div
            style={{
              position: "absolute",
              top: "15%", bottom: "15%",
              left: 1, right: 1,
              background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.6), rgba(255,255,255,0.8), rgba(255,255,255,0.6), transparent)",
              borderRadius: 4,
              filter: "blur(1px)",
              animation: "slRiftPulse 200ms ease-in-out infinite alternate",
            }}
          />
        </div>
      )}

      {/* 6. Shadow Monarch's Eyes – enhanced with breathing glow */}
      {showEyes && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex", gap: 44,
            zIndex: 7,
            animation: "slShadowEyesReveal 250ms cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          <div style={eyeStyle("#7c3aed", "left")} />
          <div style={eyeStyle("#7c3aed", "right")} />
        </div>
      )}

      {/* 7. Orbiting Rune Sigils – enhanced with glow trails */}
      {phase === 2 && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 0, height: 0, zIndex: 6,
          }}
        >
          {runeData.map((rd, i) => (
            <div
              key={`rune-${i}`}
              style={{
                position: "absolute",
                fontSize: rd.size,
                color: `rgba(167,139,250,${rd.opacity})`,
                fontFamily: "'Cinzel', serif",
                animation: `slRuneOrbit ${rd.speed}s linear ${rd.delay}s forwards`,
                textShadow: `0 0 16px rgba(124,58,237,0.8), 0 0 32px rgba(124,58,237,0.4), 0 0 48px rgba(34,211,238,0.2)`,
                pointerEvents: "none",
                filter: "brightness(1.3)",
                ["--orbit-radius"]: `${rd.radius}px`,
              }}
            >
              {rd.rune}
            </div>
          ))}
        </div>
      )}

      {/* 8. Scan Line sweeps – enhanced with glow */}
      {phase === 2 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", overflow: "hidden" }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={`scan-${i}`}
              style={{
                position: "absolute", left: 0, right: 0, height: i === 0 ? 2 : 1,
                background: `linear-gradient(90deg, transparent 5%, rgba(124,58,237,${0.2 + i * 0.08}) 20%, rgba(34,211,238,${0.35 + i * 0.05}) 50%, rgba(124,58,237,${0.2 + i * 0.08}) 80%, transparent 95%)`,
                animation: `slScanLine ${0.5 + i * 0.15}s linear ${i * 0.1}s infinite`,
                boxShadow: `0 0 15px rgba(124,58,237,0.4), 0 0 30px rgba(34,211,238,0.15)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 9. System Text – Typewriter with cinematic styling */}
      {phase >= 2 && phase <= 3 && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 8, textAlign: "center",
            pointerEvents: "none",
            animation: phase === 3 ? "slFadeOut 350ms ease-out forwards" : "none",
          }}
        >
          {/* Domain shift badge */}
          <div
            style={{
              display: "inline-block",
              padding: "3px 16px",
              borderRadius: 20,
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.25)",
              marginBottom: 14,
              animation: "slBadgeIn 300ms ease both",
            }}
          >
            <span
              style={{
                fontSize: 9, letterSpacing: 6,
                color: "rgba(34,211,238,0.85)",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
              }}
            >
              ◇ SYSTEM: DOMAIN SHIFT ◇
            </span>
          </div>
          {/* View name - main text */}
          <div
            style={{
              fontSize: 36, fontWeight: 900,
              color: "#fff",
              fontFamily: "'Cinzel', serif",
              letterSpacing: 10,
              textShadow: "0 0 50px rgba(124,58,237,0.7), 0 0 100px rgba(124,58,237,0.35), 0 0 150px rgba(34,211,238,0.15), 0 2px 4px rgba(0,0,0,0.9)",
              animation: "slViewNameGlitch 600ms ease-out forwards",
              minHeight: 50,
              lineHeight: 1.2,
            }}
          >
            {typedText}
            <span
              style={{
                display: "inline-block",
                width: 3, height: "0.7em",
                background: "linear-gradient(180deg, #22d3ee, #a78bfa)",
                marginLeft: 5,
                animation: "slCursorBlink 500ms step-end infinite",
                verticalAlign: "middle",
                boxShadow: "0 0 12px #22d3ee, 0 0 24px #22d3ee44, 0 0 36px #a78bfa22",
                borderRadius: 1,
              }}
            />
          </div>
          {/* Decorative underline */}
          <div
            style={{
              width: 120, height: 1, margin: "14px auto 0",
              background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(34,211,238,0.3), rgba(124,58,237,0.5), transparent)",
              animation: "slUnderlineExpand 400ms ease-out 200ms both",
              boxShadow: "0 0 10px rgba(124,58,237,0.3)",
            }}
          />
        </div>
      )}

      {/* 10. Reveal – void collapses back with radial energy burst */}
      {phase === 3 && (
        <>
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 4,
              background: "radial-gradient(circle at 50% 50%, transparent 0%, transparent 20%, rgba(15,5,30,0.6) 40%, rgba(2,1,8,0.99) 55%, rgba(0,0,0,1) 100%)",
              animation: `slVoidCollapse ${TRANSITION_DURATION - REVEAL_START}ms cubic-bezier(0.22,1,0.36,1) forwards`,
            }}
          />
          {/* Radial light burst behind collapse */}
          <div
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 0, height: 0, zIndex: 3,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.15), rgba(34,211,238,0.08), transparent)",
              animation: `slRadialBurst ${TRANSITION_DURATION - REVEAL_START}ms ease-out forwards`,
            }}
          />
        </>
      )}

      {/* 11. Residual glow particles – enhanced with variety */}
      {phase === 3 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none" }}>
          {residualParticles.map((p, i) => (
            <div
              key={`res-${i}`}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.w, height: p.w,
                borderRadius: "50%",
                background: p.isCyan ? "#22d3ee" : p.isPurple ? "#a78bfa" : p.isWhite ? "#e0e0ff" : "#c4b5fd",
                boxShadow: p.isCyan
                  ? "0 0 8px #22d3ee, 0 0 16px #22d3ee66"
                  : p.isPurple
                    ? "0 0 8px #a78bfa, 0 0 16px #a78bfa66"
                    : "0 0 6px #c4b5fd, 0 0 12px #c4b5fd44",
                animation: `slResidualFloat ${p.dur}s ease-out ${p.delay}s forwards`,
                opacity: 0.8,
              }}
            />
          ))}
          {/* Corner afterglow effects */}
          {[
            { top: 0, left: 0, bg: "radial-gradient(circle at 0% 0%, rgba(124,58,237,0.06), transparent 50%)" },
            { top: 0, right: 0, bg: "radial-gradient(circle at 100% 0%, rgba(34,211,238,0.04), transparent 50%)" },
            { bottom: 0, left: 0, bg: "radial-gradient(circle at 0% 100%, rgba(34,211,238,0.04), transparent 50%)" },
            { bottom: 0, right: 0, bg: "radial-gradient(circle at 100% 100%, rgba(124,58,237,0.06), transparent 50%)" },
          ].map((corner, i) => (
            <div
              key={`afterglow-${i}`}
              style={{
                position: "absolute",
                ...corner,
                width: "50%", height: "50%",
                background: corner.bg,
                animation: `slAfterglowFade ${0.6 + i * 0.1}s ease-out forwards`,
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function eyeStyle(color, side) {
  return {
    width: 14,
    height: 18,
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    background: `radial-gradient(circle at ${side === "left" ? "55%" : "45%"} 45%, #fff 8%, ${color} 30%, #5b21b6 55%, transparent 75%)`,
    boxShadow: `0 0 30px ${color}, 0 0 60px ${color}, 0 0 90px ${color}88, 0 0 120px ${color}44, inset 0 0 10px rgba(255,255,255,0.3)`,
    animation: "slShadowEyePulse 200ms ease-in-out infinite alternate",
    position: "relative",
  };
}
