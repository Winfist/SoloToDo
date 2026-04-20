import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ content, children, delay = 400, placement = "top" }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const offset = 8;
      let top, left;
      if (placement === "top") {
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
      } else if (placement === "bottom") {
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
      } else {
        top = rect.top + rect.height / 2;
        left = placement === "right" ? rect.right + offset : rect.left - offset;
      }
      setPos({ top, left });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const transformMap = {
    top: "translateX(-50%) translateY(-100%)",
    bottom: "translateX(-50%)",
    left: "translateX(-100%) translateY(-50%)",
    right: "translateY(-50%)",
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: "contents" }}
      >
        {children}
      </span>
      {visible && content && createPortal(
        <div
          role="tooltip"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: transformMap[placement] || transformMap.top,
            zIndex: "var(--z-tooltip)",
            padding: "var(--space-2) var(--space-3)",
            background: "var(--theme-card)",
            border: "1px solid var(--theme-primary-22)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            fontSize: "var(--text-sm)",
            color: "#e2e8f0",
            maxWidth: 240,
            pointerEvents: "none",
            animation: "fadeIn var(--duration-fast) var(--ease-out)",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
