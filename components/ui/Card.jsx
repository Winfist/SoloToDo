import React from "react";

const VARIANTS = {
  flat: {
    background: "var(--theme-surface)",
    border: "1px solid var(--theme-primary-12)",
    boxShadow: "none",
  },
  elevated: {
    background: "var(--theme-card)",
    border: "1px solid var(--theme-primary-12)",
    boxShadow: "var(--shadow-md), var(--shadow-inset)",
    backdropFilter: "blur(16px) saturate(1.4)",
    WebkitBackdropFilter: "blur(16px) saturate(1.4)",
  },
  rift: {
    background: "var(--theme-surface)",
    border: "1px solid var(--theme-primary-18)",
    boxShadow: "var(--shadow-glow), var(--shadow-inset)",
    backdropFilter: "blur(24px) saturate(1.6)",
    WebkitBackdropFilter: "blur(24px) saturate(1.6)",
  },
  shadow: {
    background: "linear-gradient(135deg, var(--theme-card), var(--theme-surface))",
    border: "1px solid var(--theme-primary-22)",
    boxShadow: "var(--shadow-glow), var(--shadow-lg), var(--shadow-inset)",
    backdropFilter: "blur(32px) saturate(1.8)",
    WebkitBackdropFilter: "blur(32px) saturate(1.8)",
  },
};

export default function Card({
  variant = "elevated",
  radius = "var(--radius-lg)",
  padding = "var(--space-4)",
  onClick,
  style,
  children,
  as: Tag = "div",
  ...props
}) {
  const variantStyle = VARIANTS[variant] || VARIANTS.elevated;

  return (
    <Tag
      onClick={onClick}
      style={{
        borderRadius: radius,
        padding,
        ...variantStyle,
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
