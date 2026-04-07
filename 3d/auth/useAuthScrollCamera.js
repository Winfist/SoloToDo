import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Z_START = 20;
const Z_END = 2;
const Z_RANGE = Z_START - Z_END;

/**
 * useAuthScrollCamera – Auth Tunnel Edition
 *
 * Shorter tunnel than the dungeon gate (Z_RANGE = 18).
 * Pacing zones tuned for a quick but dramatic approach:
 *  0–30%   Discovery   – normal scroll
 *  30–55%  Pull        – subtle assist
 *  55–78%  Dread       – slight resistance, bob intensifies
 *  78–92%  Convergence – acceleration into the light
 *  92–100% Terminal    – slow final dock for form reveal
 */
export function useAuthScrollCamera(
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
    let currentTargetZ = Z_START;

    function getProgress() {
      return Math.max(0, Math.min(1, 1 - (state.z - Z_END) / Z_RANGE));
    }

    function applyZ() {
      camera.position.z = state.z;
      const p = getProgress();

      // Walking bob: gentle, intensifies in dread zone
      let bobIntensity = Math.min(p * 1.5, 1) * 0.038;
      if (p > 0.35 && p < 0.78) {
        bobIntensity *= 1.0 + (p - 0.35) * 1.8; // up to ~1.77x
      }
      camera.position.y = Math.sin(p * 16) * bobIntensity;

      progressRef.current = p;
      onProgressRef.current?.(p);
      if (p >= 0.98 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }

    function getZoneMultiplier(z) {
      const p = 1 - (z - Z_END) / Z_RANGE;
      if (p < 0.30) return 1.0;   // Discovery
      if (p < 0.55) return 1.15;  // Pull
      if (p < 0.78) return 0.80;  // Dread
      if (p < 0.92) return 1.30;  // Convergence
      return 0.55;                  // Terminal — slow for form reveal
    }

    function moveTo(targetZ, duration = 0.85, ease = "power2.out") {
      const clamped = Math.max(Z_END, Math.min(Z_START, targetZ));
      gsap.to(state, { z: clamped, duration, ease, overwrite: "auto", onUpdate: applyZ });
    }

    if (autoApproachRef) {
      autoApproachRef.current = () => {
        currentTargetZ = Z_END;
        gsap.to(state, {
          z: Z_END,
          duration: 4.2,
          ease: "power2.inOut",
          overwrite: "auto",
          onUpdate: applyZ,
        });
      };
    }

    function handleWheel(e) {
      if (!scrollContainerRef?.current) return;
      e.preventDefault();
      const mult = getZoneMultiplier(state.z);
      currentTargetZ += e.deltaY * 0.05 * mult;
      currentTargetZ = Math.max(Z_END, Math.min(Z_START, currentTargetZ));
      moveTo(currentTargetZ);
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
      currentTargetZ += dy * 0.14 * mult;
      currentTargetZ = Math.max(Z_END, Math.min(Z_START, currentTargetZ));
      moveTo(currentTargetZ);
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
