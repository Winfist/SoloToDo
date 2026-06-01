import React from "react";
import { hexagramPoints, pointsToAttr } from "./sigilGeometry.js";

// size: "hero" | "crest" | "mark". playKey: change to restart draw-in.
export default function Sigil({ size = "hero", playKey = 0, className = "" }) {
  const C = 90;
  const { up, down } = hexagramPoints(C, C, 50);
  const inner = hexagramPoints(C, C, 16);
  return (
    <svg
      key={playKey}
      className={`sys-sigil sys-sigil--${size} ${className}`}
      viewBox="0 0 180 180"
      aria-hidden="true"
    >
      <g className="sys-sigil__spin">
        <circle className="draw d1" cx={C} cy={C} r="84" pathLength="1" />
        <circle className="sys-sigil__ticks" cx={C} cy={C} r="78" strokeDasharray="1.5 7.2" pathLength="120" />
        <circle className="sys-sigil__seg draw d2" cx={C} cy={C} r="68" strokeDasharray="30 21" pathLength="120" />
        <circle className="sys-sigil__dot" cx={C} cy="6" r="2.4" />
        <circle className="sys-sigil__dot" cx={C} cy="174" r="2.4" />
        <circle className="sys-sigil__dot" cx="6" cy={C} r="2.4" />
        <circle className="sys-sigil__dot" cx="174" cy={C} r="2.4" />
      </g>
      <g className="sys-sigil__spinr">
        <circle className="sys-sigil__ticks fine" cx={C} cy={C} r="56" strokeDasharray="1 5" pathLength="120" />
        <polygon className="draw d3" points={pointsToAttr(up)} pathLength="1" />
        <polygon className="draw d4" points={pointsToAttr(down)} pathLength="1" />
        <circle className="draw d5" cx={C} cy={C} r="40" pathLength="1" />
        <polygon className="sys-sigil__seg" points={pointsToAttr(inner.up)} />
      </g>
      <circle className="sys-sigil__core" cx={C} cy={C} r="6.5" />
    </svg>
  );
}
