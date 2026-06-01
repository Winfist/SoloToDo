import React, { useCallback, useEffect, useRef, useState } from "react";
import "../../styles/tutorial.css";
import { useI18n } from "../i18n/I18nProvider.jsx";
import Sigil from "./Sigil.jsx";

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

function getSkipPlacementFromCoach(coachRect) {
  // Keep the skip control on the opposite vertical half from the coachmark,
  // so the two can never collide regardless of target size or scroll position.
  if (!coachRect) return "bottom-left";
  const midY = coachRect.top + coachRect.height / 2;
  return midY < window.innerHeight / 2 ? "bottom-left" : "top-left";
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

function CinematicStep({ step, stepIndex, totalSteps, typingSkipSignal, onTypingComplete, onContinue, onRequestFinishTyping }) {
  const { t } = useI18n();
  const [textDone, setTextDone] = useState(false);

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
    <div className="sys-fullbleed sys-grain sys-vignette sys-cine sys-play" onClick={handleClick} role="dialog" aria-modal="true">
      <div className="sys-cine__aur"><i className="a1" /><i className="a2" /></div>
      <div className="sys-cine__beam" />
      <div className="sys-cine__counter">{String(stepIndex + 1).padStart(2,"0")} / {String(totalSteps).padStart(2,"0")}</div>
      <div className="sys-cine__hero">
        <div className="sys-cine__halo" />
        <Sigil size="hero" playKey={step.id} />
      </div>
      <div className="sys-cine__eyebrow">{t("tutorial.hud.systemWindow")}</div>
      <div className={`sys-cine__title ${step.isFinale ? "sys-cine__title--finale" : ""}`}>{step.title}</div>
      <div className="sys-cine__rule" />
      <div className="sys-cine__body">
        <TypewriterText key={step.id} text={step.text} speed={step.isFinale ? 34 : 22} skipSignal={typingSkipSignal} onComplete={completeText} />
      </div>
      {textDone && (
        <div className="sys-cine__continue">{step.isFinale ? t("tutorial.actions.finish") : t("tutorial.actions.continue")}</div>
      )}
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
    arrowOffset: null,
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
    if (pos === "center") return { ...center, arrowDir: null, arrowOffset: null, pos };

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

    const clampedTop = clampValue(top, safeTop, safeBottom - height);
    const clampedLeft = clampValue(left, safeLeft, safeRight - width);
    const arrowOffset = pos === "left" || pos === "right"
      ? clampValue(targetRect.top + targetRect.height / 2 - clampedTop - 7, 16, height - 30)
      : clampValue(targetRect.left + targetRect.width / 2 - clampedLeft - 7, 16, width - 30);

    return {
      top: clampedTop,
      left: clampedLeft,
      arrowDir,
      arrowOffset,
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
  typingSkipSignal,
  onTypingComplete,
  onRequestFinishTyping,
  onContinue,
  onLayout,
}) {
  const { t } = useI18n();
  const [textDone, setTextDone] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [presented, setPresented] = useState({ step, stepIndex });
  const tooltipRef = useRef(null);
  const [tooltipSize, setTooltipSize] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(() => getTooltipPosition(step, targetRect, null));
  const presentedStep = presented.step;
  const presentedStepIndex = presented.stepIndex;

  useEffect(() => {
    setTextDone(false);
  }, [presentedStep.id]);

  useEffect(() => {
    if (step.id === presentedStep.id) return undefined;
    setIsTransitioning(true);
    const timer = window.setTimeout(() => {
      setPresented({ step, stepIndex });
      setIsTransitioning(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [presentedStep.id, step, stepIndex]);

  const completeText = useCallback(() => {
    if (presentedStep.id !== step.id) return;
    setTextDone(true);
    onTypingComplete?.();
  }, [onTypingComplete, presentedStep.id, step.id]);

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
    if (!onLayout) return;
    const height = tooltipSize?.height || (step.type === "action" ? 214 : 198);
    const width = tooltipSize?.width || Math.min(408, window.innerWidth - 36);
    onLayout({ top: tooltipPos.top, left: tooltipPos.left, width, height });
  }, [onLayout, tooltipPos.top, tooltipPos.left, tooltipSize, step.type]);

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

  const isActionStep = presentedStep.type === "action";
  const waitingForTarget = Boolean(presentedStep.target && !targetRect);
  const actionText = waitingForTarget
    ? t("tutorial.actions.targetPreparing")
    : presentedStep.action === "input"
      ? t("tutorial.actions.inputHint")
      : t("tutorial.actions.actionLocked");
  const coachClassName = [
    "sys-coach",
    tooltipPos.arrowDir ? `sys-coach--arrow-${tooltipPos.arrowDir}` : "sys-coach--center",
    isTransitioning ? "hide" : "",
  ].filter(Boolean).join(" ");
  const coachStyle = {
    top: tooltipPos.top,
    left: tooltipPos.left,
    ...(tooltipPos.arrowOffset === null ? {} : { "--sys-coach-arrow-offset": `${tooltipPos.arrowOffset}px` }),
  };

  return (
    <div ref={tooltipRef} className={coachClassName} style={coachStyle} onClick={handleTooltipClick} role="dialog" aria-live="polite">
      {tooltipPos.arrowDir && <span className="sys-coach__arrow" aria-hidden="true" />}
      <div className="sys-coach__eyebrow">
        <Sigil size="mark" playKey={presentedStep.id} />
        <span className="sys-coach__tag">SYSTEM</span>
        <span className="sys-coach__count"><b>{String(presentedStepIndex + 1).padStart(2,"0")}</b> / {String(totalSteps).padStart(2,"0")}</span>
      </div>
      <div className="sys-coach__title">{presentedStep.title}</div>
      <div className="sys-coach__text">
        <TypewriterText key={presentedStep.id} text={presentedStep.text} speed={18} skipSignal={typingSkipSignal} onComplete={completeText} />
      </div>
      <div className="sys-coach__foot">
        {totalSteps <= 8 && (
          <div className="sys-coach__dots">
            {Array.from({ length: totalSteps }).map((_, i) => <i key={i} className={i === presentedStepIndex ? "on" : ""} />)}
          </div>
        )}
        {isActionStep
          ? <div className="sys-coach__hint">{actionText}</div>
          : (textDone && <button className="sys-coach__btn" onClick={(e) => { e.stopPropagation(); onContinue(); }}>{t("tutorial.actions.next")}</button>)}
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
  const [coachRect, setCoachRect] = useState(null);
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
  const skipPlacement = isCinematic ? "top-right" : getSkipPlacementFromCoach(coachRect);

  useEffect(() => {
    setTextDone(false);
    setCoachRect(null);
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

      document.body.classList.add("sys-tutorial-lock");
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeyScroll, { passive: false });

      return () => {
        window.clearTimeout(timer);
        document.body.classList.remove("sys-tutorial-lock");
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
    let advanceObserver = null;
    let advanceTimer = null;
    let advanceFallbackTimer = null;
    let completed = false;
    let completionPending = false;

    const advance = () => {
      if (completed) return;
      completed = true;
      advanceObserver?.disconnect();
      advanceObserver = null;
      window.clearTimeout(advanceFallbackTimer);
      advanceTimer = window.setTimeout(
        () => onActionComplete?.(step.id),
        Number.isFinite(step.advanceDelayMs) ? step.advanceDelayMs : step.action === "input" ? 240 : 120
      );
    };

    const canAdvance = () => (
      (!step.advanceWhenTarget || document.querySelector(step.advanceWhenTarget)) &&
      (!step.advanceWhenAbsent || !document.querySelector(step.advanceWhenAbsent))
    );

    const complete = () => {
      if (completed || completionPending) return;
      completionPending = true;
      if (canAdvance()) {
        advance();
        return;
      }
      advanceObserver = new MutationObserver(() => {
        if (canAdvance()) advance();
      });
      advanceObserver.observe(document.body, { childList: true, subtree: true });
      advanceFallbackTimer = window.setTimeout(
        advance,
        Number.isFinite(step.advanceWaitTimeoutMs) ? step.advanceWaitTimeoutMs : 5000
      );
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
      const cancelPendingAdvance = !completed;
      completed = true;
      window.clearTimeout(attachTimer);
      if (cancelPendingAdvance) window.clearTimeout(advanceTimer);
      window.clearTimeout(advanceFallbackTimer);
      observer?.disconnect();
      advanceObserver?.disconnect();
      actionCleanupRef.current?.();
      actionCleanupRef.current = null;
    };
  }, [
    step?.id,
    step?.type,
    step?.action,
    step?.target,
    step?.advanceDelayMs,
    step?.advanceWhenTarget,
    step?.advanceWhenAbsent,
    step?.advanceWaitTimeoutMs,
    isActive,
    onActionComplete,
  ]);

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
        className={`tutorial-backdrop tutorial-backdrop--${phase} ${!isCinematic && !revealRect ? "tutorial-backdrop--solid" : ""} ${actionCanPassThrough ? "tutorial-backdrop--pass-through" : ""}`}
        onClick={handleBackdropClick}
      />

      {isActionStep && (
        <TutorialClickCage targetRect={actionTargetUnlocked ? targetRect : null} onBlockedClick={handleBlockedClick} />
      )}

      {!isCinematic && revealRect && (
        <div
          className={[
            "sys-spot",
            isActionStep ? "sys-spot--action" : "",
            step.pulseIntensity === "strong" ? "sys-spot--strong" : "",
            blockedPulse ? "sys-spot--blocked" : "",
          ].filter(Boolean).join(" ")}
          style={{ left: revealRect.left, top: revealRect.top, width: revealRect.width, height: revealRect.height }}
          aria-hidden="true"
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
          typingSkipSignal={typingSkipSignal}
          onTypingComplete={() => setTextDone(true)}
          onRequestFinishTyping={requestFinishTyping}
          onContinue={onAdvance}
          onLayout={setCoachRect}
        />
      )}

      <button className={`tutorial-skip-btn tutorial-skip-btn--${skipPlacement}`} onClick={(event) => { event.stopPropagation(); onSkip(); }}>
        {t("tutorial.actions.skip")}
      </button>

      <ConfettiEffect active={showConfetti} />
    </>
  );
}
