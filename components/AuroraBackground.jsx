import React, { useMemo } from "react";
import { useTimeOfDay } from "../hooks/useTimeOfDay.js";

// Layered atmospheric background: Aurora + Time-of-Day + State Effects + Film Grain
// All layers are pointer-events:none and fixed so they don't affect layout.
export default function AuroraBackground({ theme, penaltyActive, streak = 0, xpPercent = 0, shadowCount = 0, disableWisps = false, disableTimeOfDay = false }) {
  const timeOfDay = useTimeOfDay();

  // Wisps data – stable, computed once
  const wisps = useMemo(() =>
    Array.from({ length: Math.min(6 + Math.floor(shadowCount / 5), 14) }, (_, i) => ({
      left: 5 + ((i * 47 + 13) % 90),
      top: 10 + ((i * 31 + 7) % 80),
      size: 30 + ((i * 17) % 50),
      delay: i * 1.3,
      dur: 8 + ((i * 13) % 12),
      opacity: 0.02 + ((i * 7) % 3) * 0.008,
    })),
  [shadowCount]);

  // Streak glow particles
  const streakParticles = useMemo(() =>
    streak >= 5 ? Array.from({ length: Math.min(streak, 12) }, (_, i) => ({
      left: 8 + ((i * 29 + 11) % 84),
      delay: i * 0.8,
      dur: 4 + ((i * 7) % 5),
      size: 1 + ((i * 3) % 3),
    })) : [],
  [streak >= 5 ? streak : 0]);

  return (
    <>
      {/* Aurora conic gradient — slow rotation, 40s loop */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          contain: "strict",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        {/* Main aurora — influenced by time of day */}
        <div style={{
          position: "absolute",
          top: "-30%",
          left: "-20%",
          width: "140%",
          height: "80%",
          background: penaltyActive
            ? `radial-gradient(ellipse at 40% 0%, rgba(220,38,38,0.08) 0%, transparent 60%),
               radial-gradient(ellipse at 80% 20%, rgba(220,38,38,0.04) 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 0%, ${theme.primary}0f 0%, transparent 55%),
               radial-gradient(ellipse at 70% 10%, ${theme.secondary}08 0%, transparent 50%),
               radial-gradient(ellipse at 50% 5%, ${theme.accent}06 0%, transparent 40%)${disableTimeOfDay ? '' : `,
               radial-gradient(ellipse at 60% 0%, ${timeOfDay.colors.primary} 0%, transparent 45%)`}`,
          animation: "auroraShift 20s ease-in-out infinite alternate",
          filter: "blur(40px)",
          willChange: "transform",
          transform: "translateZ(0)",
        }} />

        {/* Bottom ambient — warm tones for evening/dawn */}
        <div style={{
          position: "absolute",
          bottom: "-20%",
          left: "10%",
          width: "80%",
          height: "50%",
          background: penaltyActive
            ? `radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.06) 0%, transparent 60%)`
            : `radial-gradient(ellipse at 50% 100%, ${theme.secondary}07 0%, transparent 60%)${disableTimeOfDay ? '' : `,
               radial-gradient(ellipse at 40% 90%, ${timeOfDay.colors.secondary} 0%, transparent 50%)`}`,
          animation: "auroraShift 25s ease-in-out infinite alternate-reverse",
          filter: "blur(60px)",
          willChange: "transform",
          transform: "translateZ(0)",
        }} />

        {/* Right side glow */}
        <div style={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: "40%",
          height: "60%",
          background: penaltyActive
            ? "transparent"
            : `radial-gradient(ellipse at 100% 50%, ${theme.primary}06 0%, transparent 70%)`,
          animation: "auroraShift 30s ease-in-out infinite alternate",
          filter: "blur(50px)",
          willChange: "transform",
          transform: "translateZ(0)",
        }} />

        {/* ── Shadow Wisps — floating theme-colored wisps ── */}
        {!penaltyActive && !disableWisps && wisps.map((w, i) => (
          <div
            key={`wisp-${i}`}
            style={{
              position: "absolute",
              left: `${w.left}%`,
              top: `${w.top}%`,
              width: w.size,
              height: w.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.primary}${Math.round(w.opacity * 255).toString(16).padStart(2, "0")}, transparent 70%)`,
              animation: `wispsFloat ${w.dur}s ease-in-out ${w.delay}s infinite`,
              filter: "blur(12px)",
              opacity: w.opacity * 15,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* ── Streak Golden Rain — visible at 5+ streak ── */}
        {streakParticles.map((p, i) => (
          <div
            key={`streak-${i}`}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: "-5%",
              width: p.size,
              height: p.size * 12,
              background: `linear-gradient(180deg, transparent, rgba(251,191,36,0.15), rgba(251,191,36,0.05), transparent)`,
              animation: `streakGlow ${p.dur}s ease-in-out ${p.delay}s infinite`,
              filter: "blur(2px)",
              borderRadius: p.size,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* ── Level-Up Proximity Pulse — visible at 85%+ XP ── */}
        {xpPercent >= 85 && !penaltyActive && (
          <div style={{
            position: "absolute",
            top: "30%",
            left: "30%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.primary}12, transparent 70%)`,
            animation: `levelUpPulse ${3 - (xpPercent - 85) * 0.1}s ease-in-out infinite`,
            filter: "blur(30px)",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* Film grain overlay — subtle texture */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          transform: "translateZ(0)",
        }}
      />

      {/* Penalty vignette */}
      {penaltyActive && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(220,38,38,0.12) 100%)",
            animation: "penaltyPulse 2s infinite",
          }}
        />
      )}

      {/* Time-of-day warm/cool tint */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: timeOfDay.warmth > 0.5
            ? `linear-gradient(180deg, rgba(251,191,36,${timeOfDay.warmth * 0.02}), transparent 40%, rgba(249,115,22,${timeOfDay.warmth * 0.015}))` 
            : `linear-gradient(180deg, rgba(99,102,241,${(1 - timeOfDay.warmth) * 0.015}), transparent 40%, rgba(34,211,238,${(1 - timeOfDay.warmth) * 0.01}))`,
          transition: "background 60s ease",
        }}
      />

      <style>{`
        @keyframes auroraShift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, -2%) scale(1.05); }
          66% { transform: translate(-2%, 3%) scale(0.97); }
          100% { transform: translate(2%, -1%) scale(1.03); }
        }
      `}</style>
    </>
  );
}
