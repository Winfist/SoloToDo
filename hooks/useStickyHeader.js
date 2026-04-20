// useStickyHeader.js – Smart sticky header with compact mode
// Tracks scroll direction and position to transition header states
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useStickyHeader(options?)
 *
 * Returns header state info based on scroll behavior:
 * - expanded: At or near top of page
 * - compact: User has scrolled down past threshold
 * - hidden: User is rapidly scrolling down (optional)
 *
 * @param {object} options
 * @param {number} options.compactThreshold - Scroll Y to trigger compact (default: 60)
 * @param {number} options.hideThreshold - How much downward scroll before hiding (default: 0 = never hide)
 * @param {boolean} options.enabled - Enable/disable the hook (default: true)
 * @returns {{ isCompact, isHidden, scrollY, scrollDirection, progress }}
 */
export function useStickyHeader({
  compactThreshold = 60,
  hideThreshold = 0,
  enabled = true,
} = {}) {
  const [state, setState] = useState({
    isCompact: false,
    isHidden: false,
    scrollY: 0,
    scrollDirection: "up",
    progress: 0, // 0-1 for smooth transition
  });

  const lastScrollY = useRef(0);
  const lastDirectionChange = useRef(0);
  const ticking = useRef(false);

  const update = useCallback(() => {
    if (!enabled) return;

    const currentY = window.scrollY;
    const direction = currentY > lastScrollY.current ? "down" : "up";

    // Track direction changes for hide threshold
    if (direction !== state.scrollDirection) {
      lastDirectionChange.current = currentY;
    }

    const isCompact = currentY > compactThreshold;
    const progress = Math.min(currentY / Math.max(compactThreshold, 1), 1);

    // Optional hide on rapid downward scroll
    let isHidden = false;
    if (hideThreshold > 0 && direction === "down" && isCompact) {
      const downDistance = currentY - lastDirectionChange.current;
      isHidden = downDistance > hideThreshold;
    }

    setState({
      isCompact,
      isHidden,
      scrollY: currentY,
      scrollDirection: direction,
      progress,
    });

    lastScrollY.current = currentY;
    ticking.current = false;
  }, [enabled, compactThreshold, hideThreshold]);

  useEffect(() => {
    if (!enabled) return;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial check
    update();

    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, update]);

  return state;
}
