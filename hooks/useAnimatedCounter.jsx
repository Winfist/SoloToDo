// useAnimatedCounter.js – Smooth animated number counter hook
// Uses requestAnimationFrame for 60fps counting with easing
import { useState, useEffect, useRef, useCallback } from "react";

// Ease-out cubic for smooth deceleration
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * useAnimatedCounter(target, options?)
 *
 * @param {number} target - The target value to count to
 * @param {object} options
 * @param {number} options.duration - Animation duration in ms (default: 800)
 * @param {number} options.delay - Delay before starting in ms (default: 0)
 * @param {boolean} options.enabled - Whether animation is enabled (default: true)
 * @param {string} options.format - "number" | "locale" (default: "number")
 * @returns {{ value: number, display: string, ref: React.RefObject }}
 */
export function useAnimatedCounter(target, {
  duration = 800,
  delay = 0,
  enabled = true,
  format = "number",
  decimals = 0,
} = {}) {
  const [current, setCurrent] = useState(enabled ? 0 : target);
  const prevTarget = useRef(target);
  const animRef = useRef(null);
  const elRef = useRef(null);
  const hasAnimated = useRef(false);

  const animate = useCallback((from, to) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const start = performance.now() + delay;
    const diff = to - from;

    function tick(now) {
      const elapsed = now - start;
      if (elapsed < 0) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = from + diff * eased;

      setCurrent(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, [duration, delay, decimals]);

  // IntersectionObserver: only animate when element is in viewport
  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }

    const el = elRef.current;
    if (!el) {
      // No ref attached, just animate immediately
      if (!hasAnimated.current) {
        hasAnimated.current = true;
        animate(0, target);
      } else if (prevTarget.current !== target) {
        animate(prevTarget.current, target);
      }
      prevTarget.current = target;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(0, target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [target, enabled, animate]);

  // Handle target updates after initial animation
  useEffect(() => {
    if (!enabled || !hasAnimated.current) return;
    if (prevTarget.current !== target) {
      animate(prevTarget.current, target);
      prevTarget.current = target;
    }
  }, [target, enabled, animate]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const display = format === "locale"
    ? current.toLocaleString("de-DE")
    : decimals > 0
      ? current.toFixed(decimals)
      : String(current);

  return { value: current, display, ref: elRef };
}

/**
 * AnimatedNumber – inline component version
 * <AnimatedNumber value={1234} duration={800} />
 */
export function AnimatedNumber({
  value,
  duration = 800,
  delay = 0,
  format = "locale",
  decimals = 0,
  style = {},
  className = "",
}) {
  const { display, ref } = useAnimatedCounter(value, { duration, delay, format, decimals });

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}
