// GlitchText.jsx – Cyberpunk-style glitch text effects for system messages
import React, { useState, useEffect, useRef } from "react";

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:',.<>?/\\0123456789ABCDEF";

/**
 * <GlitchText variant="glitch|scan|scramble" trigger={true}>
 *   SYSTEM MESSAGE
 * </GlitchText>
 */
export default function GlitchText({
  children,
  variant = "glitch",
  trigger = true,
  duration = 600,
  color,
  className = "",
  style = {},
}) {
  if (variant === "scan") return <ScanText trigger={trigger} duration={duration} color={color} style={style} className={className}>{children}</ScanText>;
  if (variant === "scramble") return <ScrambleText trigger={trigger} duration={duration} color={color} style={style} className={className}>{children}</ScrambleText>;
  return <GlitchEffect trigger={trigger} duration={duration} color={color} style={style} className={className}>{children}</GlitchEffect>;
}

// ── Variant: RGB-Split Glitch ──
function GlitchEffect({ children, trigger, duration, color, style, className }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);
    const timer = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(timer);
  }, [trigger, duration]);

  return (
    <span className={`glitch-text ${className}`} style={{ position: "relative", display: "inline-block", ...style }}>
      {active && (
        <>
          <style>{`
            @keyframes glitchClip1 {
              0% { clip-path: inset(20% 0 60% 0); transform: translateX(-3px); }
              20% { clip-path: inset(60% 0 10% 0); transform: translateX(3px); }
              40% { clip-path: inset(30% 0 40% 0); transform: translateX(-2px); }
              60% { clip-path: inset(70% 0 5% 0); transform: translateX(2px); }
              80% { clip-path: inset(10% 0 80% 0); transform: translateX(-1px); }
              100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
            }
            @keyframes glitchClip2 {
              0% { clip-path: inset(60% 0 20% 0); transform: translateX(3px); }
              20% { clip-path: inset(10% 0 70% 0); transform: translateX(-3px); }
              40% { clip-path: inset(50% 0 20% 0); transform: translateX(2px); }
              60% { clip-path: inset(5% 0 80% 0); transform: translateX(-2px); }
              80% { clip-path: inset(40% 0 30% 0); transform: translateX(1px); }
              100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
            }
          `}</style>
          {/* Red channel offset */}
          <span aria-hidden style={{
            position: "absolute", inset: 0,
            color: "#ef4444",
            animation: `glitchClip1 ${duration * 0.6}ms steps(6) both`,
            opacity: 0.7,
            mixBlendMode: "screen",
          }}>{children}</span>
          {/* Cyan channel offset */}
          <span aria-hidden style={{
            position: "absolute", inset: 0,
            color: "#22d3ee",
            animation: `glitchClip2 ${duration * 0.6}ms steps(6) both`,
            opacity: 0.7,
            mixBlendMode: "screen",
          }}>{children}</span>
        </>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
}

// ── Variant: Character-by-character scan reveal ──
function ScanText({ children, trigger, duration, color, style, className }) {
  const text = typeof children === "string" ? children : "";
  const [revealIndex, setRevealIndex] = useState(trigger ? 0 : text.length);

  useEffect(() => {
    if (!trigger || !text) return;
    setRevealIndex(0);
    const charDuration = duration / text.length;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealIndex(i);
      if (i >= text.length) clearInterval(interval);
    }, charDuration);
    return () => clearInterval(interval);
  }, [trigger, text, duration]);

  return (
    <span className={`glitch-text ${className}`} style={{ ...style, fontFamily: "'JetBrains Mono', monospace" }}>
      {text.split("").map((char, i) => (
        <span key={i} style={{
          opacity: i < revealIndex ? 1 : 0.15,
          color: i < revealIndex ? (color || "inherit") : "#1e293b",
          textShadow: i === revealIndex - 1 ? `0 0 8px ${color || "#22d3ee"}` : "none",
          transition: "opacity 0.05s, color 0.05s",
        }}>
          {char}
        </span>
      ))}
      {revealIndex < text.length && (
        <span style={{
          display: "inline-block", width: 2, height: "0.8em",
          background: color || "#22d3ee",
          marginLeft: 1,
          animation: "slCursorBlink 0.5s step-end infinite",
          verticalAlign: "middle",
          boxShadow: `0 0 6px ${color || "#22d3ee"}`,
        }} />
      )}
    </span>
  );
}

// ── Variant: Scramble random chars before revealing ──
function ScrambleText({ children, trigger, duration, color, style, className }) {
  const text = typeof children === "string" ? children : "";
  const [displayText, setDisplayText] = useState(trigger ? "" : text);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!trigger || !text) return;

    const frames = Math.ceil(duration / 30); // ~30ms per frame
    const revealPerFrame = text.length / frames;
    let frame = 0;

    const tick = () => {
      frame++;
      const revealed = Math.min(Math.floor(frame * revealPerFrame), text.length);
      let result = text.slice(0, revealed);

      // Add random chars for the rest
      for (let i = revealed; i < text.length; i++) {
        if (text[i] === " ") {
          result += " ";
        } else {
          result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
      }
      setDisplayText(result);

      if (frame < frames) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayText(text);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [trigger, text, duration]);

  return (
    <span className={`glitch-text ${className}`} style={{ ...style, fontFamily: "'JetBrains Mono', monospace" }}>
      {displayText}
    </span>
  );
}
