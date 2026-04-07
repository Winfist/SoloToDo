import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Z_START = 82;
const Z_END = 1.5;
const Z_RANGE = Z_START - Z_END;

/**
 * useScrollCamera – AAA Cinematic Edition
 *
 * Dramatic pacing zones:
 *  82→50m  Normal scroll. Discovery.
 *  50→30m  "Sensing" — subtle scroll assist
 *  30→15m  "Dread" — walking bob intensifies
 *  15→5m   "Pull" — involuntary drift (+20% scroll assist)
 *  5→1.5m  "Rapture" — max intensity
 *
 * Cinematic auto-approach uses a 4-phase GSAP timeline.
 */
export function useScrollCamera(
  scrollContainerRef,
  camera,
  onComplete,
  onProgress,
  autoApproachRef
) {
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

  useEffect(() => {
    if (!camera) return;

    camera.position.set(0, 0, Z_START);

    const state = { z: Z_START };

    function getProgress() {
      return Math.max(0, Math.min(1, 1 - (state.z - Z_END) / Z_RANGE));
    }

    function applyZ() {
      camera.position.z = state.z;
      const p = getProgress();

      // Walking bob: starts gentle, intensifies in "dread zone"
      let bobIntensity = Math.min(p * 1.5, 1) * 0.045;
      if (p > 0.35 && p < 0.8) {
        bobIntensity *= 1.0 + (p - 0.35) * 2.0; // up to 1.9x
      }
      camera.position.y = Math.sin(p * 22) * bobIntensity;

      progressRef.current = p;
      onProgressRef.current?.(p);
      if (p >= 0.98 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }

    // Scroll multiplier based on zone (creates pacing variation)
    function getZoneMultiplier(z) {
      const p = 1 - (z - Z_END) / Z_RANGE;
      if (p < 0.4) return 1.0;            // Discovery
      if (p < 0.6) return 1.1;            // Sensing
      if (p < 0.8) return 0.85;           // Dread (slightly resistant)
      if (p < 0.93) return 1.25;           // Pull (accelerated)
      return 0.7;                           // Final approach (slow for drama)
    }

    function moveTo(targetZ, duration = 0.85, ease = "power2.out") {
      const clamped = Math.max(Z_END, Math.min(Z_START, targetZ));
      gsap.to(state, { z: clamped, duration, ease, overwrite: "auto", onUpdate: applyZ });
    }

    if (autoApproachRef) {
      autoApproachRef.current = () => {
        // Continuous, unbroken cinematic approach for AAA feel
        // Starts very slow to build tension, then accelerates powerfully into the void
        gsap.to(state, {
          z: Z_END,
          duration: 5.5,
          ease: "power3.in",
          overwrite: "auto",
          onUpdate: applyZ,
        });
      };
    }

    function handleWheel(e) {
      if (!scrollContainerRef?.current) return;
      e.preventDefault();
      const mult = getZoneMultiplier(state.z);
      moveTo(state.z + e.deltaY * 0.03 * mult);
    }

    let touchY = 0;
    function handleTouchStart(e) {
      if (!scrollContainerRef?.current) return;
      touchY = e.touches[0].clientY;
    }
    function handleTouchMove(e) {
      if (!scrollContainerRef?.current) return;
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      const mult = getZoneMultiplier(state.z);
      moveTo(state.z + dy * 0.07 * mult);
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      gsap.killTweensOf(state);
      if (autoApproachRef) autoApproachRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  return progressRef;
}
