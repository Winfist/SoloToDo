import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/tutorial.css";
import { useI18n } from "../i18n/I18nProvider.jsx";

const CONFETTI_COLORS = ["#22d3ee", "#a855f7", "#fbbf24", "#f43f5e", "#34d399", "#818cf8"];
const SPOTLIGHT_PADDING = 12;
const VIEWPORT_MARGIN = 10;

function readRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width && !rect.height) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

function expandRect(rect, padding = 0) {
  if (!rect) return null;
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    bottom: rect.bottom + padding,
    right: rect.right + padding,
  };
}

function clampRect(rect, margin = VIEWPORT_MARGIN) {
  if (!rect) return null;
  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - margin));
  const top = Math.max(margin, Math.min(rect.top, window.innerHeight - margin));
  const right = Math.max(left + 1, Math.min(rect.right, window.innerWidth - margin));
  const bottom = Math.max(top + 1, Math.min(rect.bottom, window.innerHeight - margin));
  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
    right,
    bottom,
  };
}

function rectChanged(prev, next, threshold = 0.75) {
  if (!prev || !next) return prev !== next;
  return (
    Math.abs(prev.top - next.top) > threshold ||
    Math.abs(prev.left - next.left) > threshold ||
    Math.abs(prev.width - next.width) > threshold ||
    Math.abs(prev.height - next.height) > threshold
  );
}

function updateRectState(setter, nextRect) {
  setter((prev) => (rectChanged(prev, nextRect) ? nextRect : prev));
}

function frameRadius(rect, max = 18, divisor = 4.5) {
  if (!rect) return 12;
  return Math.min(max, Math.max(9, Math.min(rect.width, rect.height) / divisor));
}

function getSkipPlacement(targetRect, revealRect) {
  const rect = revealRect || targetRect;
  const nearBottom = Boolean(rect && rect.bottom > window.innerHeight - 145);
  return nearBottom ? "top-left" : "bottom-left";
}

function getRevealRect(step, targetElement, targetRect) {
  if (!targetRect) return null;

  const explicitContext = step?.contextTarget ? document.querySelector(step.contextTarget) : null;
  const fallbackContext = step?.contextTarget
    ? null
    : targetElement?.closest?.("[data-tutorial='quest-board'], [data-tutorial='quest-form'], [data-tutorial='bottom-nav'], [data-tutorial='system-menu'], [data-tutorial='stats-view'], [data-tutorial='portal-hud'], [data-tutorial='island-topbar'], [data-tutorial='apps-grid']");

  const baseRect = readRect(explicitContext) || readRect(fallbackContext) || targetRect;
  const defaultPadding = step?.type === "action" ? 22 : 16;
  const padding = Number.isFinite(step?.contextPadding) ? step.contextPadding : defaultPadding;
  return clampRect(expandRect(baseRect, padding));
}

function ConfettiEffect({ active }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return undefined;
    }

    const nextParticles = Array.from({ length: 52 }, (_, id) => ({
      id,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.75,
      duration: 1.4 + Math.random() * 1.6,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));

    setParticles(nextParticles);
    const timer = window.setTimeout(() => setParticles([]), 3600);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="tutorial-confetti" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="tutorial-confetti__particle"
          style={{
            left: `${particle.x}%`,
            top: -10,
            width: particle.size,
            height: particle.size * 0.6,
            background: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            transform: `rotate(${particle.rotation}deg)`,
            boxShadow: `0 0 6px ${particle.color}88`,
          }}
        />
      ))}
    </div>
  );
}

function TypewriterText({ text = "", speed = 24, skipSignal = 0, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const finishRef = useRef(null);
  const lastSkipSignalRef = useRef(skipSignal);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    lastSkipSignalRef.current = skipSignal;
    setDisplayed("");
    setDone(false);
    finishRef.current = null;

    if (!text) {
      setDone(true);
      onCompleteRef.current?.();
      return undefined;
    }

    let index = 0;
    let completed = false;
    let interval = null;

    const finish = () => {
      if (completed) return;
      completed = true;
      if (interval) window.clearInterval(interval);
      setDisplayed(text);
      setDone(true);
      onCompleteRef.current?.();
    };

    finishRef.current = finish;

    interval = window.setInterval(() => {
      index += 1;
      if (index >= text.length) {
        window.clearInterval(interval);
        finish();
      } else {
        setDisplayed(text.slice(0, index));
      }
    }, speed);

    return () => {
      window.clearInterval(interval);
      finishRef.current = null;
    };
  }, [text, speed]);

  useEffect(() => {
    if (skipSignal === lastSkipSignalRef.current) return;
    lastSkipSignalRef.current = skipSignal;
    finishRef.current?.();
  }, [skipSignal]);

  return (
    <span>
      {displayed}
      {!done && <span className="tutorial-typewriter-cursor" aria-hidden="true" />}
    </span>
  );
}

function SpotlightMask({ revealRect }) {
  if (!revealRect) {
    return <div className="tutorial-mask tutorial-mask--solid" aria-hidden="true" />;
  }

  const rect = clampRect(revealRect, 0);
  const radius = Math.min(20, Math.max(10, Math.min(rect.width, rect.height) / 5));

  return (
    <svg className="tutorial-mask" width="100%" height="100%" aria-hidden="true">
      <defs>
        <mask id="tutorial-spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={radius} ry={radius} fill="black" />
        </mask>
        <radialGradient id="tutorial-vignette" cx="50%" cy="50%" r="78%">
          <stop offset="0%" stopColor="rgba(6,9,20,0.06)" />
          <stop offset="74%" stopColor="rgba(3,5,14,0.44)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.74)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="rgba(3, 6, 16, 0.64)" mask="url(#tutorial-spotlight-mask)" />
      <rect width="100%" height="100%" fill="url(#tutorial-vignette)" mask="url(#tutorial-spotlight-mask)" />
    </svg>
  );
}

function TutorialClickCage({ targetRect, padding = SPOTLIGHT_PADDING, onBlockedClick }) {
  if (!targetRect) {
    return (
      <div
        className="tutorial-click-cage tutorial-click-cage--full"
        onPointerDown={onBlockedClick}
        onClick={onBlockedClick}
        aria-hidden="true"
      />
    );
  }

  const top = Math.max(0, targetRect.top - padding);
  const left = Math.max(0, targetRect.left - padding);
  const right = Math.min(window.innerWidth, targetRect.right + padding);
  const bottom = Math.min(window.innerHeight, targetRect.bottom + padding);
  const middleHeight = Math.max(0, bottom - top);

  return (
    <>
      <div className="tutorial-click-cage" onPointerDown={onBlockedClick} onClick={onBlockedClick} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className="tutorial-click-cage" onPointerDown={onBlockedClick} onClick={onBlockedClick} style={{ top, left: 0, width: left, height: middleHeight }} />
      <div className="tutorial-click-cage" onPointerDown={onBlockedClick} onClick={onBlockedClick} style={{ top, left: right, right: 0, height: middleHeight }} />
      <div className="tutorial-click-cage" onPointerDown={onBlockedClick} onClick={onBlockedClick} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
    </>
  );
}

function FocusRing({ rect, action, strong, blockedPulse }) {
  if (!rect) return null;

  const padding = action ? SPOTLIGHT_PADDING : 8;
  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const radius = frameRadius({ width, height });

  const className = action
    ? [
        "tutorial-target",
        strong ? "tutorial-target--strong" : "",
        blockedPulse ? "tutorial-target--blocked" : "",
      ]
    : ["tutorial-highlight", blockedPulse ? "tutorial-highlight--blocked" : ""];

  return (
    <div
      className={className.filter(Boolean).join(" ")}
      style={{ top, left, width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

function CinematicStep({ step, stepIndex, totalSteps, typingSkipSignal, onTypingComplete, onContinue, onRequestFinishTyping }) {
  const { t } = useI18n();
  const [textDone, setTextDone] = useState(false);
  const particles = useMemo(() => {
    return Array.from({ length: 14 }, (_, id) => ({
      id,
      width: 2 + Math.random() * 3,
      left: 8 + Math.random() * 84,
      top: 10 + Math.random() * 78,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
      opacity: 0.14 + Math.random() * 0.3,
    }));
  }, [step.id]);

  useEffect(() => {
    setTextDone(false);
  }, [step.id]);

  const completeText = useCallback(() => {
    setTextDone(true);
    onTypingComplete?.();
  }, [onTypingComplete]);

  const handleClick = useCallback(() => {
    if (!textDone) {
      onRequestFinishTyping?.();
      return;
    }
    onContinue();
  }, [onContinue, onRequestFinishTyping, textDone]);

  return (
    <div className="tutorial-cinematic" onClick={handleClick} role="dialog" aria-modal="true">
      <div className="tutorial-cinematic__ambient" aria-hidden="true" />

      {particles.map((particle) => (
        <div
          key={particle.id}
          aria-hidden="true"
          className="tutorial-cinematic__particle"
          style={{
            width: particle.width,
            height: particle.width,
            opacity: particle.opacity,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      <div className="tutorial-cinematic__emblem" aria-hidden="true">
        <span className="tutorial-cinematic__emblem-ring tutorial-cinematic__emblem-ring--outer" />
        <span className="tutorial-cinematic__emblem-ring tutorial-cinematic__emblem-ring--inner" />
        <span className="tutorial-cinematic__emblem-ring tutorial-cinematic__emblem-ring--core" />
        <span className="tutorial-cinematic__icon">{step.icon}</span>
      </div>
      <div className="tutorial-cinematic__eyebrow">{t("tutorial.hud.systemWindow")}</div>
      <div className={`tutorial-cinematic__title ${step.isFinale ? "tutorial-cinematic__title--finale" : ""}`}>
        {step.title}
      </div>
      <div className="tutorial-cinematic__text">
        <TypewriterText
          key={step.id}
          text={step.text}
          speed={step.isFinale ? 34 : 22}
          skipSignal={typingSkipSignal}
          onComplete={completeText}
        />
      </div>
      {textDone && (
        <div className="tutorial-cinematic__continue">
          {step.isFinale ? t("tutorial.actions.finish") : t("tutorial.actions.continue")}
        </div>
      )}
      <div className="tutorial-cinematic__counter">
        {stepIndex + 1}/{totalSteps}
      </div>
    </div>
  );
}

function rectsOverlap(a, b, padding = 0) {
  if (!a || !b) return false;
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function clampValue(value, min, max) {
  if (max < min) return min;
  return Math.max(min, Math.min(value, max));
}

function getTooltipPosition(step, targetRect, tooltipSize) {
  const tooltipWidth = Math.min(408, window.innerWidth - 36);
  const width = Math.min(tooltipSize?.width || tooltipWidth, window.innerWidth - 36);
  const height = Math.max(tooltipSize?.height || (step.type === "action" ? 214 : 198), 150);
  const safeTop = 18;
  const safeBottom = window.innerHeight - 96;
  const safeLeft = 18;
  const safeRight = window.innerWidth - 18;
  const center = {
    top: clampValue(window.innerHeight / 2 - height / 2, safeTop, safeBottom - height),
    left: clampValue(window.innerWidth / 2 - width / 2, safeLeft, safeRight - width),
    arrowDir: null,
  };

  if (!targetRect || step.position === "center") return center;

  const preferred = step.position || "bottom";
  const allPositions = {
    top: ["top", "bottom", "right", "left", "center"],
    bottom: ["bottom", "top", "right", "left", "center"],
    left: ["left", "right", "bottom", "top", "center"],
    right: ["right", "left", "bottom", "top", "center"],
  };
  const order = allPositions[preferred] || allPositions.bottom;
  const gap = 24;

  const makeCandidate = (pos) => {
    if (pos === "center") return { ...center, arrowDir: null, pos };

    let top = center.top;
    let left = center.left;
    let arrowDir = "up";

    if (pos === "left" || pos === "right") {
      top = targetRect.top + targetRect.height / 2 - height / 2;
      left = pos === "left" ? targetRect.left - width - gap : targetRect.right + gap;
      arrowDir = pos === "left" ? "right" : "left";
    } else {
      left = targetRect.left + targetRect.width / 2 - width / 2;
      top = pos === "top" ? targetRect.top - height - gap : targetRect.bottom + gap;
      arrowDir = pos === "top" ? "down" : "up";
    }

    return {
      top: clampValue(top, safeTop, safeBottom - height),
      left: clampValue(left, safeLeft, safeRight - width),
      arrowDir,
      pos,
    };
  };

  const candidates = order.map(makeCandidate);
  const targetArea = expandRect(targetRect, 12);
  const valid = candidates.find((candidate) => {
    const candidateRect = {
      top: candidate.top,
      left: candidate.left,
      right: candidate.left + width,
      bottom: candidate.top + height,
    };
    return (
      candidate.top >= safeTop &&
      candidate.top + height <= safeBottom &&
      candidate.left >= safeLeft &&
      candidate.left + width <= safeRight &&
      !rectsOverlap(candidateRect, targetArea, 0)
    );
  });

  return valid || candidates[0] || center;
}

function TooltipStep({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  sequence,
  typingSkipSignal,
  onTypingComplete,
  onRequestFinishTyping,
  onContinue,
}) {
  const { t } = useI18n();
  const [textDone, setTextDone] = useState(false);
  const tooltipRef = useRef(null);
  const [tooltipSize, setTooltipSize] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(() => getTooltipPosition(step, targetRect, tooltipSize));

  useEffect(() => {
    setTextDone(false);
  }, [step.id]);

  const completeText = useCallback(() => {
    setTextDone(true);
    onTypingComplete?.();
  }, [onTypingComplete]);

  const handleTooltipClick = useCallback((event) => {
    if (textDone) return;
    event.preventDefault();
    event.stopPropagation();
    onRequestFinishTyping?.();
  }, [onRequestFinishTyping, textDone]);

  useEffect(() => {
    const update = () => setTooltipPos(getTooltipPosition(step, targetRect, tooltipSize));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step, targetRect, tooltipSize]);

  useEffect(() => {
    if (!tooltipRef.current || typeof ResizeObserver === "undefined") return undefined;
    const updateSize = () => {
      const rect = tooltipRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltipSize((prev) => (
        prev && Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1
          ? prev
          : { width: rect.width, height: rect.height }
      ));
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(tooltipRef.current);
    return () => observer.disconnect();
  }, [step.id]);

  const isActionStep = step.type === "action";
  const waitingForTarget = Boolean(step.target && !targetRect);
  const actionText = waitingForTarget
    ? t("tutorial.actions.targetPreparing")
    : step.action === "input"
      ? t("tutorial.actions.inputHint")
      : t("tutorial.actions.actionLocked");

  const percent = totalSteps ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  const protocol = sequence?.id === "onboarding"
    ? t("tutorial.hud.awakeningProtocol")
    : t("tutorial.hud.unlockProtocol");

  return (
    <div ref={tooltipRef} className="tutorial-tooltip" style={{ top: tooltipPos.top, left: tooltipPos.left }} key={step.id} onClick={handleTooltipClick}>
      {tooltipPos.arrowDir && <div className={`tutorial-arrow tutorial-arrow--${tooltipPos.arrowDir}`} aria-hidden="true" />}
      <div className="tutorial-tooltip__card" role="dialog" aria-live="polite">
        <div className="tutorial-tooltip__eyebrow">
          <span className="tutorial-tooltip__system-tag">SYSTEM</span>
          <span className="tutorial-tooltip__protocol">{protocol}</span>
          <span className="tutorial-tooltip__step-counter">
            <b>{String(stepIndex + 1).padStart(2, "0")}</b> / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>
        <div className="tutorial-tooltip__title">{step.title}</div>
        <div className="tutorial-tooltip__text">
          <TypewriterText key={step.id} text={step.text} speed={18} skipSignal={typingSkipSignal} onComplete={completeText} />
        </div>
        <div className="tutorial-tooltip__progress" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="tutorial-tooltip__actions">
          {isActionStep ? (
            <div className="tutorial-tooltip__action-hint">{actionText}</div>
          ) : (
            textDone && (
              <button className="tutorial-tooltip__continue-btn" onClick={(event) => { event.stopPropagation(); onContinue(); }}>
                {t("tutorial.actions.next")}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function TutorialOverlay({
  sequence,
  currentStep,
  onAdvance,
  onSkip,
  onActionComplete,
  isActive,
}) {
  const { t } = useI18n();
  const [targetRect, setTargetRect] = useState(null);
  const [revealRect, setRevealRect] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState("entering");
  const [blockedPulse, setBlockedPulse] = useState(false);
  const [textDone, setTextDone] = useState(false);
  const [typingSkipSignal, setTypingSkipSignal] = useState(0);
  const observerRef = useRef(null);
  const rectIntervalRef = useRef(null);
  const actionCleanupRef = useRef(null);
  const blockedPointerAtRef = useRef(0);

  const step = sequence?.steps?.[currentStep];
  const totalSteps = sequence?.steps?.length || 0;
  const isCinematic = step?.type === "cinematic";
  const isActionStep = step?.type === "action";
  const actionTargetUnlocked = isActionStep && textDone && Boolean(targetRect);
  const actionCanPassThrough = actionTargetUnlocked;
  const skipPlacement = getSkipPlacement(targetRect, revealRect);

  useEffect(() => {
    setTextDone(false);
  }, [step?.id]);

  const requestFinishTyping = useCallback(() => {
    if (textDone) return false;
    setTypingSkipSignal((value) => value + 1);
    return true;
  }, [textDone]);

  useEffect(() => {
    if (isActive) {
      setPhase("entering");
      const timer = window.setTimeout(() => setPhase("visible"), 50);

      const preventScroll = (e) => {
        e.preventDefault();
      };
      
      const preventKeyScroll = (e) => {
        const keys = ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
        if (keys.includes(e.code)) {
          const tag = e.target.tagName?.toLowerCase();
          if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
          e.preventDefault();
        }
      };
      
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeyScroll, { passive: false });

      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventKeyScroll);
      };
    }
    setPhase("exiting");
    return undefined;
  }, [isActive]);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (rectIntervalRef.current) {
      window.clearInterval(rectIntervalRef.current);
      rectIntervalRef.current = null;
    }
    setTargetRect(null);
    setRevealRect(null);

    if (!step?.target || !isActive) return undefined;

    let cancelled = false;
    let scrolled = false;

    const updateRects = () => {
      if (cancelled) return false;
      const element = document.querySelector(step.target);
      if (!element) return false;

      if (step.scrollTo && !scrolled) {
        scrolled = true;
        element.scrollIntoView({ behavior: "smooth", block: step.scrollBlock || "center", inline: "center" });
      }

      const nextTargetRect = readRect(element);
      if (!nextTargetRect) return false;
      updateRectState(setTargetRect, nextTargetRect);
      updateRectState(setRevealRect, getRevealRect(step, element, nextTargetRect));
      return true;
    };

    const startTracking = () => {
      const found = updateRects();
      if (found && !rectIntervalRef.current) {
        rectIntervalRef.current = window.setInterval(updateRects, 120);
      }
      return found;
    };

    const delayedUpdate = window.setTimeout(updateRects, step.scrollTo ? 430 : 60);

    if (!startTracking()) {
      observerRef.current = new MutationObserver(() => {
        if (startTracking()) observerRef.current?.disconnect();
      });
      observerRef.current.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener("resize", updateRects);
    window.addEventListener("scroll", updateRects, true);

    return () => {
      cancelled = true;
      window.clearTimeout(delayedUpdate);
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (rectIntervalRef.current) {
        window.clearInterval(rectIntervalRef.current);
        rectIntervalRef.current = null;
      }
      window.removeEventListener("resize", updateRects);
      window.removeEventListener("scroll", updateRects, true);
    };
  }, [step?.id, step?.target, step?.contextTarget, step?.contextPadding, step?.scrollTo, isActive]);

  useEffect(() => {
    actionCleanupRef.current?.();
    actionCleanupRef.current = null;

    if (!step || step.type !== "action" || !step.target || !isActive) return undefined;

    let observer = null;
    let attachTimer = null;
    let completed = false;

    const complete = () => {
      if (completed) return;
      completed = true;
      window.setTimeout(() => onActionComplete?.(step.id), step.action === "input" ? 240 : 120);
    };

    const attach = () => {
      const element = document.querySelector(step.target);
      if (!element) return false;

      if (step.action === "input") {
        const handler = () => {
          const value = element.value || element.textContent || "";
          if (value.trim().length >= 2) complete();
        };
        element.addEventListener("input", handler);
        element.addEventListener("change", handler);
        element.addEventListener("blur", handler);
        try {
          window.setTimeout(() => element.focus?.({ preventScroll: true }), 180);
        } catch {
          window.setTimeout(() => element.focus?.(), 180);
        }
        actionCleanupRef.current = () => {
          element.removeEventListener("input", handler);
          element.removeEventListener("change", handler);
          element.removeEventListener("blur", handler);
        };
        handler();
        return true;
      }

      element.addEventListener("click", complete, { once: true });
      actionCleanupRef.current = () => element.removeEventListener("click", complete);
      return true;
    };

    attachTimer = window.setTimeout(() => {
      if (attach()) return;
      observer = new MutationObserver(() => {
        if (attach()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }, 180);

    return () => {
      completed = true;
      window.clearTimeout(attachTimer);
      observer?.disconnect();
      actionCleanupRef.current?.();
      actionCleanupRef.current = null;
    };
  }, [step?.id, step?.type, step?.action, step?.target, isActive, onActionComplete]);

  useEffect(() => {
    setShowConfetti(false);
    if (!step?.confetti) return undefined;
    const timer = window.setTimeout(() => setShowConfetti(true), 360);
    return () => window.clearTimeout(timer);
  }, [step?.id, step?.confetti]);

  const handleBackdropClick = useCallback((event) => {
    if (!requestFinishTyping()) return;
    event.preventDefault();
    event.stopPropagation();
  }, [requestFinishTyping]);

  const handleBlockedClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (event.type === "click" && now - blockedPointerAtRef.current < 450) return;
    if (event.type === "pointerdown") blockedPointerAtRef.current = now;
    if (requestFinishTyping()) return;
    setBlockedPulse(true);
    window.setTimeout(() => setBlockedPulse(false), 300);
  }, [requestFinishTyping]);

  if (!isActive || !step) return null;

  return (
    <>
      <div
        className={`tutorial-backdrop tutorial-backdrop--${phase} ${actionCanPassThrough ? "tutorial-backdrop--pass-through" : ""}`}
        onClick={handleBackdropClick}
      >
        <SpotlightMask revealRect={isCinematic ? null : revealRect} />
      </div>

      {isActionStep && (
        <TutorialClickCage targetRect={actionTargetUnlocked ? targetRect : null} onBlockedClick={handleBlockedClick} />
      )}

      {!isCinematic && targetRect && (
        <FocusRing
          rect={targetRect}
          action={isActionStep}
          strong={step.pulseIntensity === "strong"}
          blockedPulse={blockedPulse}
        />
      )}

      {isCinematic ? (
        <CinematicStep
          step={step}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          typingSkipSignal={typingSkipSignal}
          onTypingComplete={() => setTextDone(true)}
          onRequestFinishTyping={requestFinishTyping}
          onContinue={onAdvance}
        />
      ) : (
        <TooltipStep
          step={step}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          targetRect={targetRect}
          sequence={sequence}
          typingSkipSignal={typingSkipSignal}
          onTypingComplete={() => setTextDone(true)}
          onRequestFinishTyping={requestFinishTyping}
          onContinue={onAdvance}
        />
      )}

      <button className={`tutorial-skip-btn tutorial-skip-btn--${skipPlacement}`} onClick={(event) => { event.stopPropagation(); onSkip(); }}>
        {t("tutorial.actions.skip")}
      </button>

      <ConfettiEffect active={showConfetti} />
    </>
  );
}
