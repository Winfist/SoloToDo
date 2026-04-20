// TiltCard.jsx – 3D Perspective Tilt Card with Holographic Shine
// Mouse/Touch tracking + optional DeviceOrientation (Gyroscope) for mobile
import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * <TiltCard tiltIntensity={12} glareIntensity={0.15} holographic>
 *   <YourContent />
 * </TiltCard>
 *
 * Props:
 * - tiltIntensity: max rotation degrees (default: 10)
 * - glareIntensity: spotlight opacity 0-1 (default: 0.12)
 * - holographic: enable rainbow shimmer layer (default: false)
 * - borderGlow: theme color for border glow on tilt (default: null)
 * - disabled: skip all effects
 * - className / style: pass-through
 * - as: wrapper element (default: "div")
 */
export default function TiltCard({
  children,
  tiltIntensity = 10,
  glareIntensity = 0.12,
  holographic = false,
  borderGlow = null,
  disabled = false,
  className = "",
  style = {},
  as: Tag = "div",
  ...rest
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const updateTilt = useCallback((clientX, clientY) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize -1 to 1
    const normalX = (clientX - centerX) / (rect.width / 2);
    const normalY = (clientY - centerY) / (rect.height / 2);

    // Clamp
    const clampedX = Math.max(-1, Math.min(1, normalX));
    const clampedY = Math.max(-1, Math.min(1, normalY));

    // Glare position (percentage)
    const glareX = ((clientX - rect.left) / rect.width) * 100;
    const glareY = ((clientY - rect.top) / rect.height) * 100;

    setTilt({
      x: -clampedY * tiltIntensity, // Rotate X (up/down tilt)
      y: clampedX * tiltIntensity,   // Rotate Y (left/right tilt)
      glareX,
      glareY,
    });
  }, [tiltIntensity]);

  // ── Mouse handling ──
  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => updateTilt(e.clientX, e.clientY));
  }, [updateTilt]);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  }, []);

  // ── Touch handling ──
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setIsHovering(true);
      updateTilt(touch.clientX, touch.clientY);
    });
  }, [updateTilt]);

  const handleTouchEnd = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  }, []);

  // ── Gyroscope (mobile) ──
  useEffect(() => {
    if (disabled || prefersReducedMotion) return;
    // Only use gyroscope if no mouse (mobile)
    if (window.matchMedia("(hover: hover)").matches) return;

    let lastBeta = 0, lastGamma = 0;

    const handleOrientation = (e) => {
      const beta = e.beta || 0;   // -180 to 180 (front-back)
      const gamma = e.gamma || 0; // -90 to 90 (left-right)

      // Smooth with previous values
      lastBeta = lastBeta * 0.7 + beta * 0.3;
      lastGamma = lastGamma * 0.7 + gamma * 0.3;

      // Normalize to -1...1 (phone tilted ~30deg max)
      const normalX = Math.max(-1, Math.min(1, (lastBeta - 45) / 30));
      const normalY = Math.max(-1, Math.min(1, lastGamma / 30));

      setTilt({
        x: -normalX * tiltIntensity * 0.5,
        y: normalY * tiltIntensity * 0.5,
        glareX: 50 + normalY * 40,
        glareY: 50 + normalX * 40,
      });
    };

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [disabled, prefersReducedMotion, tiltIntensity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const skip = disabled || prefersReducedMotion;

  const containerStyle = {
    ...style,
    perspective: skip ? "none" : "800px",
    WebkitPerspective: skip ? "none" : "800px",
  };

  const cardStyle = {
    position: "relative",
    transform: skip ? "none" : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: isHovering
      ? "transform 0.08s ease-out"
      : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    transformStyle: "preserve-3d",
    willChange: isHovering ? "transform" : "auto",
    borderRadius: "inherit",
  };

  // Dynamic border glow based on tilt
  const glowIntensity = Math.sqrt(tilt.x * tilt.x + tilt.y * tilt.y) / tiltIntensity;
  if (borderGlow && isHovering && !skip) {
    cardStyle.boxShadow = `0 ${4 + glowIntensity * 12}px ${16 + glowIntensity * 24}px ${borderGlow}${Math.round(glowIntensity * 60).toString(16).padStart(2, "0")}`;
  }

  return (
    <Tag
      className={className}
      style={containerStyle}
      {...rest}
    >
      <div
        ref={cardRef}
        className="tilt-card-inner"
        onMouseMove={skip ? undefined : handleMouseMove}
        onMouseEnter={skip ? undefined : handleMouseEnter}
        onMouseLeave={skip ? undefined : handleMouseLeave}
        onTouchMove={skip ? undefined : handleTouchMove}
        onTouchEnd={skip ? undefined : handleTouchEnd}
        style={cardStyle}
      >
        {children}

        {/* Glare / Spotlight overlay */}
        {!skip && (
          <div
            className="tilt-card-glare"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 2,
              opacity: isHovering ? glareIntensity : 0,
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.5), transparent 55%)`,
              transition: isHovering ? "opacity 0.15s" : "opacity 0.4s",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Holographic rainbow shimmer */}
        {holographic && !skip && (
          <div
            className="tilt-card-holographic"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 3,
              opacity: isHovering ? 0.12 + glowIntensity * 0.15 : 0.04,
              background: `linear-gradient(
                ${135 + tilt.y * 3}deg,
                rgba(255,0,0,0.15),
                rgba(255,127,0,0.12),
                rgba(255,255,0,0.1),
                rgba(0,255,0,0.1),
                rgba(0,127,255,0.12),
                rgba(139,0,255,0.15)
              )`,
              transition: isHovering ? "opacity 0.15s" : "opacity 0.4s",
              mixBlendMode: "color-dodge",
              filter: "blur(1px)",
            }}
          />
        )}
      </div>
    </Tag>
  );
}
