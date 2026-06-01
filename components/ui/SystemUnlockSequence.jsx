import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/tutorial.css";
import FeatureIcon from "../tutorial/featureIcons.jsx";
import Sigil from "../tutorial/Sigil.jsx";

function featureCopy(feature) {
  if (!feature) return { key: "system", label: "System", desc: "Modul aktiviert" };
  return {
    key: feature.key || "system",
    label: feature.label || feature.key || "System",
    desc: feature.desc || "Neues Modul freigeschaltet",
  };
}

export default function SystemUnlockSequence({ tier, features = [], message, onComplete }) {
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);
  const visibleFeatures = useMemo(() => features.slice(0, 6).map(featureCopy), [features]);
  const extraCount = Math.max(0, features.length - visibleFeatures.length);
  const title = message?.title || `TIER ${tier || "?"} UNLOCK`;
  const lines = message?.lines?.length
    ? message.lines
    : ["Neue Systemmodule wurden freigeschaltet.", "Initialisierung abgeschlossen."];

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase(3);
      const done = window.setTimeout(complete, 3600);
      return () => window.clearTimeout(done);
    }

    const timers = [
      window.setTimeout(() => setPhase(1), 550),
      window.setTimeout(() => setPhase(2), 1500),
      window.setTimeout(() => setPhase(3), 2700),
      window.setTimeout(complete, 7600),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [complete]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") complete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [complete]);

  return (
    <div role="dialog" aria-modal="true" aria-label="System unlock sequence" className={`sys-fullbleed sys-grain sys-vignette sys-unlock sys-unlock--phase-${phase} sys-play`}>
      <div className="sys-cine__aur"><i className="a1" /><i className="a2" /></div>
      <div className="sys-unlock__inner">
        <div className="sys-unlock__crest">
          <Sigil size="crest" playKey={tier} />
        </div>
        <div className="sys-cine__eyebrow">SYSTEM UPDATE</div>
        <div className="sys-unlock__title">{title}</div>

        {phase >= 2 && (
          <div className="sys-unlock__lines">
            {lines.map((line, index) => (
              <div key={`${line}-${index}`} className="sys-unlock__line">
                <span aria-hidden="true">+</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sys-unlock__label">FREIGESCHALTET</div>
        <div className="sys-unlock__grid">
          {phase >= 1 && visibleFeatures.map((feature, index) => (
            <div key={`${feature.key}-${index}`} className="sys-unlock__card">
              <span className="sys-unlock__tile"><FeatureIcon feature={feature.key} /></span>
              <div>
                <div className="sys-unlock__name">{feature.label}</div>
                <div className="sys-unlock__desc">{feature.desc}</div>
              </div>
            </div>
          ))}
          {phase >= 1 && extraCount > 0 && (
            <div className="sys-unlock__card sys-unlock__card--extra">
              <span className="sys-unlock__name">+{extraCount} Module</span>
            </div>
          )}
        </div>

        <button type="button" className={`sys-unlock__cta ${phase >= 3 ? "ready" : ""}`} onClick={complete}>
          {phase >= 3 ? "FORTFAHREN" : "INITIALISIERUNG ..."}
        </button>
      </div>
    </div>
  );
}
