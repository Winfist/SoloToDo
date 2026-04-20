// XPParticleTrail.jsx — Animated orbs flying from quest cards to header XP/Gold counters
// Trigger via: window.dispatchEvent(new CustomEvent("xpTrail", { detail: { fromX, fromY, xp, gold, color } }))
import React, { useRef, useEffect, useCallback } from "react";

// Cubic bézier point calculation
function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

// Easing function
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function XPParticleTrail({ disabled = false }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const runningRef = useRef(false);
  const animRef = useRef(null);

  const spawnTrail = useCallback((fromX, fromY, xp = 0, gold = 0, color = "#a78bfa") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Find target elements in header
    const headerEl = document.querySelector("header");
    if (!headerEl) return;

    // XP orbs → fly to the "PWR" stat or first stat-mini
    const xpTarget = document.getElementById("header-xp-target");
    const goldTarget = document.getElementById("header-gold-target");

    const xpRect = xpTarget?.getBoundingClientRect();
    const goldRect = goldTarget?.getBoundingClientRect();

    // Spawn XP orbs
    if (xp > 0 && xpRect) {
      const orbCount = Math.min(Math.max(3, Math.floor(xp / 10)), 8);
      for (let i = 0; i < orbCount; i++) {
        const toX = xpRect.left + xpRect.width / 2;
        const toY = xpRect.top + xpRect.height / 2;

        // Randomize control points for organic curves
        const midX = (fromX + toX) / 2 + (Math.random() - 0.5) * 150;
        const midY = Math.min(fromY, toY) - 60 - Math.random() * 120;
        const cp1x = fromX + (midX - fromX) * 0.4 + (Math.random() - 0.5) * 40;
        const cp1y = fromY - 40 - Math.random() * 60;
        const cp2x = midX + (toX - midX) * 0.6 + (Math.random() - 0.5) * 40;
        const cp2y = midY + (toY - midY) * 0.2;

        particlesRef.current.push({
          type: "xp",
          fromX, fromY, toX, toY,
          cp1x, cp1y, cp2x, cp2y,
          t: 0,
          speed: 0.012 + Math.random() * 0.008,
          delay: i * 0.06,
          delayLeft: i * 0.06,
          size: 3 + Math.random() * 3,
          color,
          trail: [],
          maxTrail: 8,
          arrived: false,
          glow: 0.6 + Math.random() * 0.4,
        });
      }
    }

    // Spawn Gold coins
    if (gold > 0 && goldRect) {
      const coinCount = Math.min(Math.max(2, Math.floor(gold / 15)), 6);
      for (let i = 0; i < coinCount; i++) {
        const toX = goldRect.left + goldRect.width / 2;
        const toY = goldRect.top + goldRect.height / 2;

        const midX = (fromX + toX) / 2 + (Math.random() - 0.5) * 120;
        const midY = Math.min(fromY, toY) - 80 - Math.random() * 100;
        const cp1x = fromX + (midX - fromX) * 0.3 + (Math.random() - 0.5) * 50;
        const cp1y = fromY - 50 - Math.random() * 50;
        const cp2x = midX + (toX - midX) * 0.7 + (Math.random() - 0.5) * 30;
        const cp2y = midY + (toY - midY) * 0.3;

        const delay = (xp > 0 ? 0.15 : 0) + i * 0.07;
        particlesRef.current.push({
          type: "gold",
          fromX, fromY, toX, toY,
          cp1x, cp1y, cp2x, cp2y,
          t: 0,
          speed: 0.014 + Math.random() * 0.006,
          delay,
          delayLeft: delay,
          size: 3 + Math.random() * 2,
          color: "#fbbf24",
          trail: [],
          maxTrail: 6,
          arrived: false,
          glow: 0.7 + Math.random() * 0.3,
        });
      }
    }

    if (!runningRef.current) startLoop();
  }, []);

  const startLoop = useCallback(() => {
    runningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Impact bursts at target
    const impacts = [];

    function draw() {
      const particles = particlesRef.current;

      if (particles.length === 0 && impacts.length === 0) {
        runningRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const dt = 0.016; // ~60fps timestep

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Handle delay
        if (p.delayLeft > 0) {
          p.delayLeft -= dt;
          continue;
        }

        // Advance along curve
        p.t += p.speed * (1 + p.t * 2.5); // Accelerate towards end
        const t = easeOutCubic(Math.min(p.t, 1));

        const x = bezier(t, p.fromX, p.cp1x, p.cp2x, p.toX);
        const y = bezier(t, p.fromY, p.cp1y, p.cp2y, p.toY);

        // Store trail positions
        p.trail.push({ x, y });
        if (p.trail.length > p.maxTrail) p.trail.shift();

        // Draw trail
        if (p.trail.length > 1) {
          for (let j = 0; j < p.trail.length - 1; j++) {
            const alpha = (j / p.trail.length) * 0.4 * p.glow;
            const trailSize = p.size * (j / p.trail.length) * 0.6;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.trail[j].x, p.trail[j].y, trailSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Draw main orb
        const orbAlpha = p.glow * (1 - Math.max(0, p.t - 0.8) * 5);
        ctx.save();
        ctx.globalAlpha = Math.max(0, orbAlpha);

        // Outer glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner white core
        ctx.shadowBlur = 0;
        ctx.globalAlpha = Math.max(0, orbAlpha * 0.7);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Check arrival
        if (p.t >= 1 && !p.arrived) {
          p.arrived = true;

          // Spawn impact burst
          impacts.push({
            x: p.toX,
            y: p.toY,
            color: p.color,
            life: 1,
            maxRadius: 20 + Math.random() * 10,
            radius: 0,
          });

          // Trigger header pulse
          const targetId = p.type === "xp" ? "header-xp-target" : "header-gold-target";
          const el = document.getElementById(targetId);
          if (el) {
            el.style.animation = "none";
            el.offsetHeight; // reflow
            el.style.animation = "xpTrailPulse 0.5s ease-out";
          }

          particles.splice(i, 1);
        }
      }

      // Draw impacts
      for (let i = impacts.length - 1; i >= 0; i--) {
        const imp = impacts[i];
        imp.radius += 2;
        imp.life -= 0.04;

        if (imp.life <= 0) {
          impacts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = imp.life * 0.6;
        ctx.strokeStyle = imp.color;
        ctx.lineWidth = 2 * imp.life;
        ctx.shadowColor = imp.color;
        ctx.shadowBlur = 10 * imp.life;
        ctx.beginPath();
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handler = (e) => {
      const { fromX, fromY, xp, gold, color } = e.detail || {};
      spawnTrail(
        fromX || window.innerWidth / 2,
        fromY || window.innerHeight / 2,
        xp || 0,
        gold || 0,
        color || "#a78bfa"
      );
    };

    window.addEventListener("xpTrail", handler);
    return () => {
      window.removeEventListener("xpTrail", handler);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [disabled, spawnTrail]);

  if (disabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 8999,
          pointerEvents: "none",
        }}
      />
      <style>{`
        @keyframes xpTrailPulse {
          0% { transform: scale(1); filter: brightness(1); }
          30% { transform: scale(1.25); filter: brightness(1.6); }
          100% { transform: scale(1); filter: brightness(1); }
        }
      `}</style>
    </>
  );
}

/**
 * Trigger XP particle trail from anywhere
 * @param {number} fromX - Starting X position (screen coords)
 * @param {number} fromY - Starting Y position (screen coords)
 * @param {number} xp - XP amount (determines orb count)
 * @param {number} gold - Gold amount (determines coin count)
 * @param {string} color - Primary color for XP orbs
 */
export function triggerXPTrail(fromX, fromY, xp = 0, gold = 0, color = "#a78bfa") {
  window.dispatchEvent(new CustomEvent("xpTrail", {
    detail: { fromX, fromY, xp, gold, color }
  }));
}
