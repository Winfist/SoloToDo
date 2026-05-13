import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { TUTORIAL_SEQUENCES, getTutorialForTier } from "../../data/tutorialSteps.js";
import TutorialOverlay from "./TutorialOverlay.jsx";

const TutorialContext = createContext(null);

export function useTutorial() {
  return useContext(TutorialContext);
}

const TutorialProvider = forwardRef(function TutorialProvider({ children, completedTutorials = [], onComplete, onSkip }, ref) {
  const [activeTutorialId, setActiveTutorialId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const queueRef = useRef([]);

  const activeSequence = activeTutorialId ? TUTORIAL_SEQUENCES[activeTutorialId] : null;
  const isActive = Boolean(activeSequence);

  const isCompleted = useCallback(
    (sequenceId) => completedTutorials.includes(sequenceId),
    [completedTutorials]
  );

  const processQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return;
    if (isCompleted(next) || !TUTORIAL_SEQUENCES[next]) {
      window.setTimeout(processQueue, 150);
      return;
    }
    window.setTimeout(() => {
      setActiveTutorialId(next);
      setCurrentStepIndex(0);
    }, 500);
  }, [isCompleted]);

  const startTutorial = useCallback((sequenceId, options = {}) => {
    if (!TUTORIAL_SEQUENCES[sequenceId]) return;
    if (!options.force && isCompleted(sequenceId)) return;
    if (activeTutorialId === sequenceId) return;

    if (activeTutorialId) {
      if (!queueRef.current.includes(sequenceId)) queueRef.current.push(sequenceId);
      return;
    }

    setActiveTutorialId(sequenceId);
    setCurrentStepIndex(0);
  }, [activeTutorialId, isCompleted]);

  const finishTutorial = useCallback((handler) => {
    if (!activeTutorialId) return;
    const finishedId = activeTutorialId;
    setActiveTutorialId(null);
    setCurrentStepIndex(0);
    handler?.(finishedId);
    window.setTimeout(processQueue, 500);
  }, [activeTutorialId, processQueue]);

  const getNextStepIndex = useCallback((fromIndex) => {
    if (!activeSequence) return -1;
    let nextIndex = fromIndex + 1;

    while (nextIndex < activeSequence.steps.length) {
      const nextStep = activeSequence.steps[nextIndex];
      if (nextStep?.optional && nextStep.target && !document.querySelector(nextStep.target)) {
        nextIndex += 1;
        continue;
      }
      return nextIndex;
    }

    return activeSequence.steps.length;
  }, [activeSequence]);

  const advanceStep = useCallback(() => {
    if (!activeSequence) return;
    const nextIndex = getNextStepIndex(currentStepIndex);
    if (nextIndex >= activeSequence.steps.length) {
      finishTutorial(onComplete);
      return;
    }
    setCurrentStepIndex(nextIndex);
  }, [activeSequence, currentStepIndex, finishTutorial, getNextStepIndex, onComplete]);

  const skipTutorial = useCallback(() => {
    finishTutorial(onSkip);
  }, [finishTutorial, onSkip]);

  const handleActionComplete = useCallback((stepId) => {
    if (!activeSequence) return;
    const step = activeSequence.steps[currentStepIndex];
    if (step?.id === stepId && step.type === "action") advanceStep();
  }, [activeSequence, currentStepIndex, advanceStep]);

  const triggerTierTutorial = useCallback((tier) => {
    startTutorial(getTutorialForTier(tier));
  }, [startTutorial]);

  const triggerOnboarding = useCallback(() => {
    startTutorial("onboarding");
  }, [startTutorial]);

  const resetAndStartOnboarding = useCallback(() => {
    queueRef.current = [];
    setActiveTutorialId(null);
    setCurrentStepIndex(0);
    window.setTimeout(() => startTutorial("onboarding", { force: true }), 0);
  }, [startTutorial]);

  useImperativeHandle(ref, () => ({
    triggerTierTutorial,
    triggerOnboarding,
    startTutorial,
    skipTutorial,
    resetAndStartOnboarding,
  }), [triggerTierTutorial, triggerOnboarding, startTutorial, skipTutorial, resetAndStartOnboarding]);

  const contextValue = useMemo(() => ({
    isActive,
    activeTutorialId,
    currentStepIndex,
    startTutorial,
    advanceStep,
    skipTutorial,
    triggerTierTutorial,
    triggerOnboarding,
    resetAndStartOnboarding,
  }), [
    isActive,
    activeTutorialId,
    currentStepIndex,
    startTutorial,
    advanceStep,
    skipTutorial,
    triggerTierTutorial,
    triggerOnboarding,
    resetAndStartOnboarding,
  ]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      <TutorialOverlay
        sequence={activeSequence}
        currentStep={currentStepIndex}
        onAdvance={advanceStep}
        onSkip={skipTutorial}
        onActionComplete={handleActionComplete}
        isActive={isActive}
      />
    </TutorialContext.Provider>
  );
});

export default TutorialProvider;
