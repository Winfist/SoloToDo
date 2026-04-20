import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * useAnimatedNumber – Animates a number from its previous value to the new one.
 * Uses requestAnimationFrame for smooth 60fps counting animations.
 *
 * @param {number} target - The target number to animate to
 * @param {number} duration - Animation duration in ms (default 500)
 * @param {string} easing - Easing function: 'easeOutExpo' | 'easeOutCubic' | 'linear'
 * @returns {{ value: number, isAnimating: boolean, direction: 'up'|'down'|null }}
 */
export function useAnimatedNumber(target, duration = 500, easing = 'easeOutExpo') {
  const [display, setDisplay] = useState(target);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevRef = useRef(target);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const easings = {
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    linear: (t) => t,
  };

  useEffect(() => {
    const from = prevRef.current;
    const to = target;

    if (from === to) return;

    // Determine direction
    setDirection(to > from ? 'up' : 'down');
    setIsAnimating(true);

    const ease = easings[easing] || easings.easeOutExpo;

    // Cancel previous animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress);

      const current = Math.round(from + (to - from) * easedProgress);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(to);
        setIsAnimating(false);
        // Clear direction after a brief moment so CSS transition can show
        setTimeout(() => setDirection(null), 600);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevRef.current = to;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, easing]);

  return { value: display, isAnimating, direction };
}

export default useAnimatedNumber;
