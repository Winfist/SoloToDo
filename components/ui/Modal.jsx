import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: "var(--z-modal)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-4)",
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  animation: "fadeIn var(--duration-fast) var(--ease-out)",
};

const DIALOG_STYLE = {
  position: "relative",
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "var(--theme-card)",
  border: "1px solid var(--theme-primary-22)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-glow), var(--shadow-lg), var(--shadow-inset)",
  backdropFilter: "blur(24px) saturate(1.6)",
  WebkitBackdropFilter: "blur(24px) saturate(1.6)",
  animation: "slideUp var(--duration-normal) var(--ease-spring)",
};

export default function Modal({ open, onClose, children, maxWidth = "480px", style, "aria-label": ariaLabel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    dialogRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") trapFocus(e, dialogRef.current);
    };
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
    <div
      style={OVERLAY_STYLE}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{ ...DIALOG_STYLE, maxWidth, ...style }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function trapFocus(e, container) {
  const focusable = container?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}
