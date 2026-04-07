import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Z_START = 82;   // long approach corridor
const Z_END   = 1.5;
const Z_RANGE = Z_START - Z_END;

export function useScrollCamera(
  scrollContainerRef,
  camera,
  onComplete,
  onProgress,
  autoApproachRef
) {
  const progressRef  = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

  useEffect(() => {
    if (!camera) return;

    camera.position.set(0, 0, Z_START);

    const state = { z: Z_START };

    function applyZ() {
      camera.position.z = state.z;
      const p = Math.max(0, Math.min(1, 1 - (state.z - Z_END) / Z_RANGE));
      // Subtle walking bob: starts gentle, grows near gate
      camera.position.y = Math.sin(p * 22) * 0.045 * Math.min(p * 1.5, 1);
      progressRef.current = p;
      onProgressRef.current?.(p);
      if (p >= 0.98 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }

    function moveTo(targetZ, duration = 0.85, ease = "power2.out") {
      const clamped = Math.max(Z_END, Math.min(Z_START, targetZ));
      gsap.to(state, { z: clamped, duration, ease, overwrite: "auto", onUpdate: applyZ });
    }

    if (autoApproachRef) {
      autoApproachRef.current = () => {
        // Dramatic acceleration into the gate over 4.5s
        gsap.to(state, { z: Z_END, duration: 4.5, ease: "power3.in", overwrite: "auto", onUpdate: applyZ });
      };
    }

    function handleWheel(e) {
      if (!scrollContainerRef?.current) return;
      e.preventDefault();
      moveTo(state.z + e.deltaY * 0.03);
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
      moveTo(state.z + dy * 0.07);
    }

    window.addEventListener("wheel",      handleWheel,      { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true  });
    window.addEventListener("touchmove",  handleTouchMove,  { passive: false });

    return () => {
      window.removeEventListener("wheel",      handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove",  handleTouchMove);
      gsap.killTweensOf(state);
      if (autoApproachRef) autoApproachRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  return progressRef;
}
