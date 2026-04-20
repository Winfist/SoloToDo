// MotionBlurTransition.jsx — Direction-aware motion blur for view transitions
// Wraps content and applies a CSS motion blur when transitioning between views
import React, { useState, useEffect, useRef } from "react";

export default function MotionBlurTransition({ viewKey, direction = "forward", disabled = false, children }) {
  const [transitioning, setTransitioning] = useState(false);
  const [displayKey, setDisplayKey] = useState(viewKey);
  const prevKeyRef = useRef(viewKey);
  const timerRef = useRef(null);

  useEffect(() => {
    if (disabled || viewKey === prevKeyRef.current) {
      setDisplayKey(viewKey);
      return;
    }

    // Start blur-out
    setTransitioning(true);

    timerRef.current = setTimeout(() => {
      setDisplayKey(viewKey);
      // Blur-in with slight delay
      setTimeout(() => setTransitioning(false), 50);
    }, 150);

    prevKeyRef.current = viewKey;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [viewKey, disabled]);

  if (disabled) return <>{children}</>;

  return (
    <div
      style={{
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        filter: transitioning ? "blur(6px) brightness(1.1)" : "blur(0) brightness(1)",
        transform: transitioning
          ? direction === "forward"
            ? "translateX(-8px) scale(0.98)"
            : "translateX(8px) scale(0.98)"
          : "translateX(0) scale(1)",
        opacity: transitioning ? 0.6 : 1,
        willChange: "filter, transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
