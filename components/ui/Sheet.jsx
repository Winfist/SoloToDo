import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Bottom Sheet for mobile, centered Modal fallback on desktop.
// Uses CSS media query logic: on ≥1024px it renders like a modal.

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: "var(--z-modal)",
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  animation: "fadeIn var(--duration-fast) var(--ease-out)",
};

const SHEET_STYLE = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: "var(--z-modal)",
  background: "var(--theme-card)",
  borderTop: "1px solid var(--theme-primary-22)",
  borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0",
  boxShadow: "var(--shadow-glow), 0 -8px 32px rgba(0,0,0,0.6), var(--shadow-inset)",
  backdropFilter: "blur(24px) saturate(1.6)",
  WebkitBackdropFilter: "blur(24px) saturate(1.6)",
  maxHeight: "90vh",
  overflowY: "auto",
  animation: "slideUp var(--duration-normal) var(--ease-spring)",
  paddingBottom: "max(var(--space-4), env(safe-area-inset-bottom))",
};

const HANDLE_STYLE = {
  width: 36,
  height: 4,
  borderRadius: "var(--radius-full)",
  background: "rgba(255,255,255,0.15)",
  margin: "var(--space-3) auto var(--space-2)",
};

export default function Sheet({ open, onClose, children, "aria-label": ariaLabel }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    sheetRef.current?.focus();

    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        style={OVERLAY_STYLE}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={SHEET_STYLE}
      >
        <div style={HANDLE_STYLE} aria-hidden="true" />
        {children}
      </div>
    </>,
    document.body
  );
}
