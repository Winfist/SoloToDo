// ScrollReveal.jsx – Viewport-triggered reveal animations
// Uses IntersectionObserver for zero-scroll-event performance
import React, { useRef, useState, useEffect, Children, cloneElement } from "react";

const ANIMATIONS = {
  slideUp:    { from: "translateY(32px) scale(0.97)",  to: "translateY(0) scale(1)" },
  slideDown:  { from: "translateY(-24px) scale(0.97)", to: "translateY(0) scale(1)" },
  slideLeft:  { from: "translateX(-40px)",             to: "translateX(0)" },
  slideRight: { from: "translateX(40px)",              to: "translateX(0)" },
  fadeIn:     { from: "none",                          to: "none" },
  scaleIn:    { from: "scale(0.85)",                   to: "scale(1)" },
  blurIn:     { from: "scale(0.97)",                   to: "scale(1)" },
};

/**
 * <ScrollReveal animation="slideUp" delay={0} stagger={0.07} once>
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 * </ScrollReveal>
 *
 * If stagger > 0, each child receives an increasing delay.
 * Respects prefers-reduced-motion automatically.
 */
export default function ScrollReveal({
  children,
  animation = "slideUp",
  delay = 0,
  duration = 0.55,
  stagger = 0,
  threshold = 0.08,
  once = true,
  disabled = false,
  className = "",
  style = {},
  as: Tag = "div",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (disabled || prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, prefersReducedMotion, once, threshold]);

  const anim = ANIMATIONS[animation] || ANIMATIONS.slideUp;
  const skip = disabled || prefersReducedMotion;

  // If stagger mode, wrap each child individually
  if (stagger > 0 && Children.count(children) > 1) {
    return (
      <Tag ref={ref} className={className} style={style}>
        {Children.map(children, (child, i) => {
          if (!child) return null;
          const itemDelay = delay + i * stagger;
          return (
            <div
              className={!visible && !skip ? 'scroll-reveal-hidden' : ''}
              style={{
                opacity: skip ? 1 : visible ? 1 : 0,
                transform: skip ? "none" : visible ? anim.to : anim.from,
                filter: skip ? "none" : visible ? "blur(0)" : (animation === "blurIn" ? "blur(6px)" : "none"),
                transition: skip ? "none" : `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${itemDelay}s, transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${itemDelay}s, filter ${duration}s ease ${itemDelay}s`,
                willChange: visible ? "auto" : "transform, opacity",
              }}
            >
              {child}
            </div>
          );
        })}
      </Tag>
    );
  }

  // Single element mode
  return (
    <Tag
      ref={ref}
      className={`${className} ${!visible && !skip ? 'scroll-reveal-hidden' : ''}`}
      style={{
        ...style,
        opacity: skip ? 1 : visible ? 1 : 0,
        transform: skip ? "none" : visible ? anim.to : anim.from,
        filter: skip ? "none" : visible ? "blur(0)" : (animation === "blurIn" ? "blur(6px)" : "none"),
        transition: skip ? "none" : `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s, filter ${duration}s ease ${delay}s`,
        willChange: visible ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Lightweight wrapper for a single element that fades in when scrolled into view.
 * Useful for section headers, dividers, etc.
 */
export function RevealOnce({ children, animation = "fadeIn", delay = 0, ...props }) {
  return (
    <ScrollReveal animation={animation} delay={delay} once {...props}>
      {children}
    </ScrollReveal>
  );
}
