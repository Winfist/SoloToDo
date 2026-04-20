// CompletionFX.jsx – Canvas-based quest completion effects
// Confetti explosion, shockwave ring, particle dissolve
import React, { useRef, useEffect, useCallback, useState } from "react";

/**
 * Global FX layer. Mount once at app root level.
 * Trigger effects via: window.dispatchEvent(new CustomEvent("questComplete", { detail: { x, y, color } }))
 */
export default function CompletionFX({ disabled = false }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const ringsRef = useRef([]);
  const runningRef = useRef(false);
  const animRef = useRef(null);

  const spawnConfetti = useCallback((x, y, color = "#a78bfa") => {
    const colors = [color, "#22d3ee", "#fbbf24", "#ef4444", "#34d399", "#e879f9", "#fff"];
    for (let i = 0; i < 45; i++) {
      const angle = (Math.PI * 2 * i) / 45 + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 8;
      const size = 2 + Math.random() * 4;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
        gravity: 0.15 + Math.random() * 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        type: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    // Shockwave ring
    ringsRef.current.push({
      x, y,
      radius: 0,
      maxRadius: 120 + Math.random() * 80,
      life: 1,
      color,
      width: 3,
    });

    // Second ring, delayed
    setTimeout(() => {
      ringsRef.current.push({
        x, y,
        radius: 0,
        maxRadius: 80 + Math.random() * 60,
        life: 1,
        color: "#fff",
        width: 2,
      });
    }, 100);

    // Spark burst
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 10;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        color: "#fff",
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.3 + Math.random() * 0.2,
        gravity: 0,
        rotation: 0,
        rotationSpeed: 0,
        type: "spark",
      });
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

    function draw() {
      const particles = particlesRef.current;
      const rings = ringsRef.current;

      if (particles.length === 0 && rings.length === 0) {
        runningRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.016;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rotation += p.rotationSpeed;

        const alpha = Math.max(0, p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.type === "spark") {
          // Draw as a line/streak
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(-p.vx * 0.3, -p.vy * 0.3);
          ctx.lineTo(0, 0);
          ctx.stroke();
        } else if (p.type === "rect") {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.radius += 5;
        r.life -= 0.025;
        if (r.life <= 0 || r.radius > r.maxRadius) { rings.splice(i, 1); continue; }

        const alpha = r.life;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width * r.life;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 15 * r.life;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  // Listen for quest completion events
  useEffect(() => {
    if (disabled) return;

    const handler = (e) => {
      const { x, y, color } = e.detail || {};
      spawnConfetti(
        x || window.innerWidth / 2,
        y || window.innerHeight / 2,
        color || "#a78bfa"
      );
    };

    window.addEventListener("questComplete", handler);
    return () => {
      window.removeEventListener("questComplete", handler);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [disabled, spawnConfetti]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * Helper to trigger completion FX from anywhere
 * @param {number} x - Screen X position
 * @param {number} y - Screen Y position
 * @param {string} color - Primary color for the effect
 */
export function triggerCompletionFX(x, y, color) {
  window.dispatchEvent(new CustomEvent("questComplete", {
    detail: { x, y, color }
  }));
}
