import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const TYPE_STYLES = {
  success: { border: "rgba(34,197,94,0.3)", icon: "✓", color: "#4ade80" },
  error:   { border: "rgba(220,38,38,0.3)",  icon: "✕", color: "#f87171" },
  warning: { border: "rgba(234,179,8,0.3)",  icon: "⚠", color: "#facc15" },
  info:    { border: "var(--theme-primary-22)", icon: "ℹ", color: "var(--theme-accent)" },
};

function ToastItem({ message, type = "info", onDismiss }) {
  const [visible, setVisible] = useState(true);
  const t = TYPE_STYLES[type] || TYPE_STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(onDismiss, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--theme-card)",
        border: `1px solid ${t.border}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg), var(--shadow-inset)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        fontSize: "var(--text-base)",
        color: "#e2e8f0",
        maxWidth: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
        cursor: "pointer",
      }}
      onClick={() => setVisible(false)}
    >
      <span style={{ color: t.color, fontWeight: "var(--font-bold)", fontSize: "var(--text-md)", flexShrink: 0 }} aria-hidden="true">{t.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}

// ToastContainer — render once at app root
export function ToastContainer({ toasts, onDismiss }) {
  return createPortal(
    <div
      aria-live="assertive"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: "max(var(--space-6), env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "var(--z-toast)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        alignItems: "center",
        pointerEvents: "none",
        width: "max-content",
        maxWidth: "calc(100vw - var(--space-8))",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem message={t.message} type={t.type} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}

export default ToastContainer;
