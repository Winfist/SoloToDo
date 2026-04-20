// StreakFlame.jsx — Canvas-based flame effect next to streak counter
// Intensity scales with streak length, extinguishes dramatically on break
import React, { useRef, useEffect, useCallback } from "react";

export default function StreakFlame({ streak = 0, disabled = false, size = 28 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  const intensity = Math.min(streak, 30) / 30; // 0..1
  const active = streak >= 3 && !disabled;

  const spawnParticle = useCallback((w, h) => {
    const baseX = w / 2;
    return {
      x: baseX + (Math.random() - 0.5) * w * 0.3,
      y: h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.8 + Math.random() * 1.2) * (0.5 + intensity * 0.5),
      size: 1.5 + Math.random() * 2.5 * (0.5 + intensity * 0.5),
      life: 1,
      decay: 0.015 + Math.random() * 0.02,
      hue: 20 + Math.random() * 30, // orange-red range
    };
  }, [intensity]);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = size;
    const h = size;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxParticles = Math.floor(8 + intensity * 20);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const particles = particlesRef.current;

      // Spawn new particles
      const spawnRate = 0.3 + intensity * 0.7;
      if (Math.random() < spawnRate && particles.length < maxParticles) {
        particles.push(spawnParticle(w, h));
      }

      // Update & draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + (Math.random() - 0.5) * 0.3;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life -= p.decay;
        p.size *= 0.995;

        if (p.life <= 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        // Flame gradient: white-core → yellow → orange → red → transparent
        const alpha = p.life * (0.5 + intensity * 0.5);
        const innerAlpha = Math.min(1, alpha * 1.5);

        // Outer glow
        ctx.save();
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 50%)`;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
        ctx.shadowBlur = 6 * intensity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Core
        ctx.save();
        ctx.globalAlpha = innerAlpha;
        ctx.fillStyle = p.life > 0.6
          ? `hsl(${p.hue + 20}, 100%, ${70 + p.life * 30}%)`
          : `hsl(${p.hue - 10}, 100%, ${40 + p.life * 30}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // White-hot center for high streak
        if (intensity > 0.5 && p.life > 0.7) {
          ctx.save();
          ctx.globalAlpha = (p.life - 0.7) * 3 * intensity * 0.6;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, intensity, size, spawnParticle]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        position: "relative",
        top: -2,
        filter: `brightness(${1 + intensity * 0.3})`,
      }}
    />
  );
}
