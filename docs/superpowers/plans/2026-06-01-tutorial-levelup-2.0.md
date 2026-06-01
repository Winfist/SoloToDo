# Tutorial & Level-Up 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the onboarding/tier tutorials and the level-up + feature-unlock moments in a premium "Obsidian Luxe" look with an arcane animated "Runen-Sigille" hero, an Apple-clean guided coachmark, and a confirmed fix for the black bars top/bottom.

**Architecture:** Keep all existing tutorial *flow* logic (rect tracking, action detection, queue, targeting in `TutorialProvider`/`TutorialOverlay`). This is a **presentation + motion** rebuild plus one functional fix. A single shared stylesheet (`styles/tutorial.css`) owns the look; a new reusable `Sigil` component owns the hero graphic; pure geometry/icon logic lives in small framework-free modules so it is unit-testable.

**Tech Stack:** React 18 (JSX, no TypeScript), Vite, plain CSS with existing design tokens (`styles/tokens.css`: `--theme-primary`, `--theme-accent`, `--theme-glow`, `--theme-primary-12/18/22/44`, `--radius-*`, `--space-*`). Fonts already loaded in `index.html`: Cinzel, Outfit, JetBrains Mono.

---

## Conventions for this plan (read first)

**No unit-test framework exists** in this repo. The `test:*` npm scripts are plain `node scripts/*.mjs` assertion scripts. This plan follows that idiom:
- **Pure logic** (sigil geometry, feature-icon coverage) → a `node scripts/*.mjs` assertion script that exits non-zero on failure. This is our TDD.
- **Visual surfaces** (CSS/animation) → manual verification with the **preview tools** (`preview_start`, `preview_screenshot`, `preview_snapshot`, `preview_resize`) at iPhone widths. Never claim a visual task done without a screenshot.

**Pixel-level source of truth** = the approved animated mockups saved during brainstorming:
- `.superpowers/brainstorm/1501-1780302734/content/sigil-final-bar.html` — cinematic hero, sigil, level-up + unlock cascade.
- `.superpowers/brainstorm/1501-1780302734/content/tutorial-experience.html` — gliding spotlight + premium coachmark walkthrough.
When a task says "port from mockup," open that file and reproduce its CSS/markup, applying the **token mapping** below.

**Token mapping (mockup hardcoded → theme tokens):**
| Mockup value | Use instead |
|---|---|
| `#9fc6e8` / `#bfe3ff` / `#cfe8ff` / `#7fc4ee` (ice accent) | `var(--theme-accent)` (light) or `color-mix(in srgb, var(--theme-primary) 75%, #dbeafe)` |
| `rgba(150,210,255,.x)` (glow) | `var(--theme-glow)` or `color-mix(in srgb, var(--theme-primary) Y%, transparent)` |
| `#0b0d14` / `#05060a` (obsidian surface) | keep as-is (theme-independent neutrals) |
| accent fill on buttons/badges | `var(--theme-primary-12/18/22)` |
Aurora: keep cool blue/violet/teal blobs, but make the **primary** blob `color-mix(in srgb, var(--theme-primary) 55%, transparent)` so it follows the theme.

**Running the app:** `npm run dev` → Vite at `http://localhost:5173`. Sign in (or use the project's local dev bypass) to reach the inner UI.
- **Trigger the tutorial:** Settings → "Tutorial Wiederholen" (wired via `onResetTutorial`).
- **Trigger level-up / unlock (no XP cheat exists):** temporarily dev-mount the cinematic with mock props (shown in Tasks 9/8), screenshot, then revert before commit.

**Motion:** all animation gated behind `@media (prefers-reduced-motion: reduce)`. Shared easing `--sys-ease: cubic-bezier(0.16, 1, 0.3, 1)`.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/tutorial/sigilGeometry.js` | **New.** Pure functions for the centered hexagram + helpers. No React. |
| `scripts/test-sigil-geometry.mjs` | **New.** Asserts geometry is centered/symmetric. |
| `components/tutorial/Sigil.jsx` | **New.** Reusable animated SVG sigil (`hero`/`crest`/`mark`). |
| `components/tutorial/featureIcons.jsx` | **New.** `FeatureIcon` (line/geometric SVG by name) + key→icon map + `getFeatureIconName`. |
| `scripts/test-feature-icons.mjs` | **New.** Asserts every `FEATURE_UNLOCKS` key maps to a defined icon. |
| `styles/tutorial.css` | **Rewrite.** All "Obsidian Luxe" surface styles + local tokens + motion. |
| `components/tutorial/TutorialOverlay.jsx` | **Modify.** Restyle spotlight + coachmark + cinematic; keep logic. |
| `components/ui/SystemUnlockSequence.jsx` | **Rewrite styling.** Obsidian + `FeatureIcon` + cascade; class-based. |
| `data/featureUnlocks.js` | **Modify.** Re-export icon mapping helper (icons defined in `featureIcons.jsx`). |
| `data/constants.jsx` (`LevelUpCinematic`) | **Modify.** Sigil crest + number pop + full-bleed. |
| `solo-leveling-v5.jsx` | **Modify.** Remove `triggerLetterbox("LEVEL UP", …)`; confirm full-bleed. |

---

## Task 1: Kill the level-up black bars (functional fix)

**Files:**
- Modify: `solo-leveling-v5.jsx:1125-1129`

- [ ] **Step 1: Reproduce**

Run: `npm run dev`, sign in. Complete enough quests to level up (or dev-mount per Task 9 temporarily). Observe the ~12vh black bars at top & bottom that appear right after the level-up number fades.
Confirm source: `triggerLetterbox("LEVEL UP", …)` in the level-up `onClose` (`LetterboxOverlay` renders `height: 12vh` bars).

- [ ] **Step 2: Remove the trigger**

In `solo-leveling-v5.jsx`, the reward-flow level-up block currently reads:

```jsx
              onClose={() => {
                setLevelUp(null);
                triggerLetterbox("LEVEL UP", 2500, getRank(levelUp.level || levelUp).color || "#22d3ee");
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
```

Change it to (drop the letterbox line only):

```jsx
              onClose={() => {
                setLevelUp(null);
                if (animationControllerRef.current.active) advanceAnimationQueue();
              }}
```

Leave the `ARISE` and `BOSS ELIMINATED` letterbox triggers untouched (out of scope).

- [ ] **Step 3: Verify**

Reload, trigger the level-up flow again. Expected: number/rank cinematic plays, then the flow advances **with no black bars**. Capture `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add solo-leveling-v5.jsx
git commit -m "fix(levelup): remove letterbox black bars from level-up flow"
```

---

## Task 2: Sigil geometry module + test (pure logic / TDD)

**Files:**
- Create: `components/tutorial/sigilGeometry.js`
- Create: `scripts/test-sigil-geometry.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-sigil-geometry.mjs`:

```js
import { hexagramPoints, centroid, pointsToAttr } from "../components/tutorial/sigilGeometry.js";

let failures = 0;
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
function check(name, cond) {
  if (cond) { console.log("PASS", name); }
  else { console.error("FAIL", name); failures++; }
}

const c = 90, R = 50;
const { up, down } = hexagramPoints(c, c, R);

// Both triangles centred on (c, c)
const cu = centroid(up), cd = centroid(down);
check("up centroid x == center", approx(cu[0], c));
check("up centroid y == center", approx(cu[1], c));
check("down centroid x == center", approx(cd[0], c));
check("down centroid y == center", approx(cd[1], c));

// down is the 180° reflection of up through the centre (as a set)
const reflect = ([x, y]) => [2 * c - x, 2 * c - y];
for (const p of up) {
  const r = reflect(p);
  const found = down.some(q => approx(q[0], r[0]) && approx(q[1], r[1]));
  check(`reflection of ${p} present in down`, found);
}

// attr serialises to "x,y x,y x,y"
check("pointsToAttr format", /^(-?\d+(\.\d+)?,-?\d+(\.\d+)?)( -?\d+(\.\d+)?,-?\d+(\.\d+)?){2}$/.test(pointsToAttr(up)));

if (failures) { console.error(`\n${failures} failing assertion(s)`); process.exit(1); }
console.log("\nAll geometry assertions passed.");
```

- [ ] **Step 2: Run it — expect failure**

Run: `node scripts/test-sigil-geometry.mjs`
Expected: FAIL — `Cannot find module .../sigilGeometry.js`.

- [ ] **Step 3: Implement the module**

Create `components/tutorial/sigilGeometry.js`:

```js
// Pure geometry for the arcane sigil. No React/DOM — unit-testable via node.
// A hexagram = two equilateral triangles sharing centre (cx, cy), one rotated 180°.
// For circumradius R: apex (cx, cy-R); base corners (cx ± R·√3/2, cy + R/2).

const round = (n) => Math.round(n * 100) / 100;

export function hexagramPoints(cx, cy, R) {
  const h = (Math.sqrt(3) / 2) * R;
  const half = R / 2;
  const up = [
    [cx, cy - R],
    [cx + h, cy + half],
    [cx - h, cy + half],
  ];
  const down = [
    [cx, cy + R],
    [cx - h, cy - half],
    [cx + h, cy - half],
  ];
  return { up, down };
}

export function centroid(points) {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / n, sy / n];
}

export function pointsToAttr(points) {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}
```

- [ ] **Step 4: Run it — expect pass**

Run: `node scripts/test-sigil-geometry.mjs`
Expected: all `PASS`, exit 0, "All geometry assertions passed."

- [ ] **Step 5: Wire into npm scripts & commit**

Add to `package.json` `scripts`: `"test:sigil": "node scripts/test-sigil-geometry.mjs"`.

```bash
git add components/tutorial/sigilGeometry.js scripts/test-sigil-geometry.mjs package.json
git commit -m "feat(sigil): add centered hexagram geometry module + test"
```

---

## Task 3: Sigil component

**Files:**
- Create: `components/tutorial/Sigil.jsx`
- Modify: `styles/tutorial.css` (sigil rules — added in Task 4; for now Sigil imports nothing and styles are global)

- [ ] **Step 1: Implement `Sigil.jsx`**

```jsx
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
```

- [ ] **Step 2: Verify it compiles**

Run `npm run dev`; confirm no Vite/console error importing `Sigil`. (Visual verification happens when it is mounted in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add components/tutorial/Sigil.jsx
git commit -m "feat(sigil): add reusable animated Sigil component"
```

---

## Task 4: Obsidian Luxe stylesheet foundation + sigil styles

**Files:**
- Rewrite: `styles/tutorial.css`

> Replaces the current "System Tutorial 2.0" sheet. Keep `@media (prefers-reduced-motion)` and safe-area patterns. Port exact values from the mockups; the blocks below are the contract + key rules.

- [ ] **Step 1: Replace the token + base layer**

At the top of `styles/tutorial.css`:

```css
/* ═══ SoloToDo — Tutorial & Level-Up 2.0 (Obsidian Luxe) ═══ */
:root {
  --sys-surface-1: #0b0d14;
  --sys-surface-2: #05060a;
  --sys-ink: #ffffff;
  --sys-text: #9aa6b8;
  --sys-muted: #6b7689;
  --sys-accent: var(--theme-accent, #9fc6e8);
  --sys-line: color-mix(in srgb, var(--theme-primary) 75%, #dbeafe);
  --sys-glow: var(--theme-glow, rgba(34, 211, 238, 0.35));
  --sys-hairline: rgba(255, 255, 255, 0.08);
  --sys-radius: 22px;
  --sys-ease: cubic-bezier(0.16, 1, 0.3, 1);
}

/* full-bleed helper for every full-screen 2.0 surface (kills the black bars) */
.sys-fullbleed {
  position: fixed;
  inset: 0;
  min-height: 100dvh;            /* dvh avoids the iOS 100vh band */
  background: linear-gradient(168deg, var(--sys-surface-1), var(--sys-surface-2));
  overflow: hidden;
}
@supports not (height: 100dvh) { .sys-fullbleed { min-height: 100vh; } }

/* premium grain + vignette (reused via composition) */
.sys-grain::before {
  content: ""; position: absolute; inset: 0; z-index: 6; pointer-events: none;
  mix-blend-mode: overlay; opacity: 0.055;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.sys-vignette::after {
  content: ""; position: absolute; inset: 0; z-index: 6; pointer-events: none;
  background: radial-gradient(ellipse 78% 62% at 50% 40%, transparent 50%, rgba(2,3,8,.66) 100%);
}
```

- [ ] **Step 2: Add the sigil rules** (port animations from `sigil-final-bar.html` `.sg-sigil`):

```css
.sys-sigil { overflow: visible; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--theme-primary) 45%, transparent)); }
.sys-sigil--hero  { width: 196px; height: 196px; }
.sys-sigil--crest { width: 104px; height: 104px; }
.sys-sigil--mark  { width: 18px;  height: 18px; }
.sys-sigil .draw { fill: none; stroke: var(--sys-line); stroke-width: 1; stroke-dasharray: 1; stroke-dashoffset: 0; }
.sys-sigil .sys-sigil__seg { fill: none; stroke: var(--sys-accent); stroke-width: 1.4; opacity: .85; }
.sys-sigil .sys-sigil__ticks { fill: none; stroke: var(--sys-accent); stroke-width: 5; opacity: .5; }
.sys-sigil .sys-sigil__ticks.fine { stroke-width: 4; opacity: .34; }
.sys-sigil .sys-sigil__dot { fill: var(--sys-accent); }
.sys-sigil__spin  { transform-box: fill-box; transform-origin: center; animation: sysSpin 72s linear infinite; }
.sys-sigil__spinr { transform-box: fill-box; transform-origin: center; animation: sysSpin 96s linear infinite reverse; }
.sys-sigil__core  { fill: #eaf6ff; transform-box: fill-box; transform-origin: center; animation: sysBreath 3.4s ease-in-out infinite; filter: drop-shadow(0 0 9px color-mix(in srgb, var(--theme-primary) 70%, white)); }
/* draw-in only when a .sys-play ancestor is present (restart by toggling class / remount via key) */
.sys-play .sys-sigil .draw { stroke-dashoffset: 1; animation: sysDraw 1.5s var(--sys-ease) forwards; }
.sys-play .sys-sigil .d1 { animation-delay: .15s; }
.sys-play .sys-sigil .d2 { animation-delay: .45s; }
.sys-play .sys-sigil .d3 { animation-delay: .75s; }
.sys-play .sys-sigil .d4 { animation-delay: .95s; }
.sys-play .sys-sigil .d5 { animation-delay: 1.2s; }

@keyframes sysSpin { to { transform: rotate(360deg); } }
@keyframes sysDraw { to { stroke-dashoffset: 0; } }
@keyframes sysBreath { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.1); opacity: 1; } }
```

- [ ] **Step 3: Reduced-motion guard** (extend the existing one):

```css
@media (prefers-reduced-motion: reduce) {
  .sys-sigil__spin, .sys-sigil__spinr, .sys-sigil__core,
  .sys-play .sys-sigil .draw { animation: none !important; stroke-dashoffset: 0 !important; }
}
```

- [ ] **Step 4: Verify the existing tutorial still loads**

`npm run dev` → Settings → "Tutorial Wiederholen". The old overlay markup may look unstyled where classes changed — that is expected; Tasks 5–6 update the markup. Confirm **no console errors** and the app renders.

- [ ] **Step 5: Commit**

```bash
git add styles/tutorial.css
git commit -m "feat(tutorial): add Obsidian Luxe tokens, full-bleed helper, sigil styles"
```

---

## Task 5: Restyle the cinematic step (onboarding hero)

**Files:**
- Modify: `components/tutorial/TutorialOverlay.jsx` (`CinematicStep`)
- Modify: `styles/tutorial.css` (cinematic surface)

- [ ] **Step 1: Add cinematic CSS** (port from `sigil-final-bar.html` left stage; key rules):

```css
.sys-cine { z-index: 9532; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding: 30px 24px 32px; text-align: center; animation: sysFade .5s var(--sys-ease) both; }
.sys-cine__aur { position: absolute; inset: -30%; z-index: 0; }
.sys-cine__aur i { position: absolute; border-radius: 50%; display: block; filter: blur(50px); }
.sys-cine__aur .a1 { width: 52%; height: 52%; top: 0; left: 6%; background: radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 55%, transparent), transparent 70%); opacity: .5; animation: sysDrift 21s ease-in-out infinite; }
.sys-cine__aur .a2 { width: 44%; height: 44%; top: 18%; right: 2%; background: radial-gradient(circle, rgba(150,110,255,.45), transparent 70%); opacity: .45; animation: sysDrift 28s ease-in-out infinite reverse; }
.sys-cine__beam { position: absolute; top: -6%; left: 50%; transform: translateX(-50%); width: 78px; height: 64%; z-index: 1; background: linear-gradient(180deg, color-mix(in srgb, var(--theme-primary) 32%, transparent), transparent 78%); filter: blur(13px); opacity: 0; }
.sys-play .sys-cine__beam { animation: sysFade 1.4s ease 1s both, sysBeam 5s ease-in-out 2.4s infinite; }
.sys-cine__hero { position: relative; z-index: 3; flex: 1; width: 100%; display: grid; place-items: center; }
.sys-cine__halo { position: absolute; width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, var(--sys-glow), transparent 68%); filter: blur(8px); animation: sysBreath 4s ease-in-out infinite; }
.sys-cine__eyebrow { z-index: 3; font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: 3.6px; color: var(--sys-accent); margin-bottom: 12px; }
.sys-cine__title { z-index: 3; font: 700 21px/1.12 'Cinzel', serif; letter-spacing: 1.6px; color: var(--sys-ink); }
.sys-cine__rule { z-index: 3; width: 30px; height: 1px; background: linear-gradient(90deg, transparent, var(--sys-accent), transparent); margin: 13px auto; }
.sys-cine__body { z-index: 3; max-width: 212px; font: 300 11px/1.7 'Outfit', sans-serif; color: var(--sys-text); }
.sys-cine__continue { z-index: 3; margin-top: 22px; font: 700 8.5px/1 'JetBrains Mono', monospace; letter-spacing: 2.5px; color: var(--sys-accent); }
.sys-cine__counter { position: absolute; top: max(env(safe-area-inset-top,0px),17px); left: 19px; z-index: 7; font: 700 8px/1 'JetBrains Mono', monospace; letter-spacing: 1.6px; color: var(--sys-muted); }
.sys-play .sys-cine__eyebrow { animation: sysFadeUp .7s ease 1.7s both; }
.sys-play .sys-cine__title { animation: sysLineIn .7s var(--sys-ease) 1.95s both; }
.sys-play .sys-cine__rule { animation: sysRule .6s ease 2.3s both; }
.sys-play .sys-cine__body { animation: sysFadeUp .7s ease 2.5s both; }
@keyframes sysFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sysFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sysLineIn { from { opacity: 0; transform: translateY(12px); filter: blur(8px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
@keyframes sysRule { from { width: 0; opacity: 0; } to { width: 30px; opacity: 1; } }
@keyframes sysDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6%,5%) scale(1.07); } }
@keyframes sysBeam { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
```

Add to the reduced-motion guard: `.sys-cine__aur i, .sys-cine__beam, .sys-cine__halo, .sys-play .sys-cine__eyebrow, .sys-play .sys-cine__title, .sys-play .sys-cine__rule, .sys-play .sys-cine__body { animation: none !important; opacity: 1 !important; }`

- [ ] **Step 2: Rewrite `CinematicStep`'s returned JSX**

Replace the emblem/particles block. Keep the existing props, `TypewriterText`, `handleClick`, counter, and finale handling. New body:

```jsx
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
```

Add `import Sigil from "./Sigil.jsx";` at the top of `TutorialOverlay.jsx`.

- [ ] **Step 3: Verify in preview**

`npm run dev` → Settings → "Tutorial Wiederholen". The first two steps are cinematic. Confirm: obsidian background **full-bleed (no black bars)**, sigil draws in + rotates + breathes, eyebrow→title→rule→body choreography, typewriter still works, tap advances. `preview_resize` to an iPhone width (e.g. 390×844) and `preview_screenshot`.

- [ ] **Step 4: Commit**

```bash
git add components/tutorial/TutorialOverlay.jsx styles/tutorial.css
git commit -m "feat(tutorial): Obsidian Luxe cinematic step with sigil hero"
```

---

## Task 6: Restyle spotlight + premium coachmark

**Files:**
- Modify: `components/tutorial/TutorialOverlay.jsx` (`SpotlightMask`/`FocusRing` usage, `TooltipStep`)
- Modify: `styles/tutorial.css` (spotlight + coachmark)

- [ ] **Step 1: Add spotlight + coachmark CSS** (port from `tutorial-experience.html` `#t-spot` / `#t-card`):

```css
.sys-spot { position: fixed; z-index: 9510; border-radius: 16px; pointer-events: none;
  box-shadow: 0 0 0 9999px rgba(4,6,12,.84), inset 0 0 22px var(--sys-glow);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 55%, transparent);
  transition: left .55s var(--sys-ease), top .55s var(--sys-ease), width .55s var(--sys-ease), height .55s var(--sys-ease); }
.sys-spot::after { content: ""; position: absolute; inset: -1px; border-radius: inherit; box-shadow: 0 0 26px var(--sys-glow); animation: sysGlow 2.4s ease-in-out infinite; }

.sys-coach { position: fixed; z-index: 9532; width: min(248px, calc(100vw - 36px)); border-radius: var(--sys-radius); padding: 16px 17px 15px;
  background: linear-gradient(165deg, rgba(23,28,40,.97), rgba(13,17,26,.98));
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 24px 54px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,255,255,.07);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  transition: opacity .34s ease, transform .34s var(--sys-ease); }
.sys-coach.hide { opacity: 0; transform: translateY(8px); }
.sys-coach__arrow { position: absolute; width: 14px; height: 14px; background: inherit; border: inherit; transform: rotate(45deg); }
.sys-coach--below .sys-coach__arrow { top: -7px; border-right: none; border-bottom: none; }
.sys-coach--above .sys-coach__arrow { bottom: -7px; border-left: none; border-top: none; }
.sys-coach__eyebrow { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
.sys-coach__tag { font: 800 8.5px/1 'JetBrains Mono', monospace; letter-spacing: 2.4px; color: var(--sys-accent); }
.sys-coach__count { margin-left: auto; font: 700 8.5px/1 'JetBrains Mono', monospace; letter-spacing: 1px; color: var(--sys-muted); }
.sys-coach__count b { color: var(--sys-accent); }
.sys-coach__title { font: 700 16px/1.2 'Cinzel', serif; letter-spacing: .4px; color: var(--sys-ink); margin-bottom: 6px; }
.sys-coach__text { font: 300 11.5px/1.6 'Outfit', sans-serif; color: var(--sys-text); min-height: 36px; }
.sys-coach__foot { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.sys-coach__dots { display: flex; gap: 5px; align-items: center; }
.sys-coach__dots i { width: 5px; height: 5px; border-radius: 99px; background: rgba(148,163,184,.3); transition: all .35s ease; }
.sys-coach__dots i.on { width: 16px; background: var(--sys-accent); }
.sys-coach__btn { margin-left: auto; height: 36px; padding: 0 18px; border: none; border-radius: 11px; cursor: pointer;
  font: 800 10px/1 'JetBrains Mono', monospace; letter-spacing: 1.6px; color: #06141f;
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 70%, white), var(--theme-primary)); box-shadow: 0 5px 16px var(--sys-glow); }
@keyframes sysGlow { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
```

Add to reduced-motion guard: `.sys-spot { transition: none; } .sys-spot::after { animation: none; } .sys-coach { transition: opacity .2s ease; }`

- [ ] **Step 2: Swap the spotlight render**

In the overlay root, replace the `SpotlightMask` + `FocusRing` (non-cinematic) render path with a single `.sys-spot` div positioned from `revealRect` (reuse the existing `revealRect`/`clampRect` values). The dim is now the spotlight's `box-shadow`, so the old `tutorial-backdrop`/`tutorial-mask` solid fill is no longer needed for spotlight steps. Keep the click-cage logic for action steps.

```jsx
{!isCinematic && revealRect && (
  <div
    className="sys-spot"
    style={{ left: revealRect.left, top: revealRect.top, width: revealRect.width, height: revealRect.height }}
    aria-hidden="true"
  />
)}
```

- [ ] **Step 3: Rewrite `TooltipStep`'s card JSX** (keep `getTooltipPosition`, typewriter, `handleTooltipClick`, action-hint logic). Render dots from `totalSteps`, active = `stepIndex`:

```jsx
return (
  <div ref={tooltipRef} className={`sys-coach sys-coach--${tooltipPos.arrowDir === "down" ? "above" : "below"} ${textDone ? "" : ""}`}
       style={{ top: tooltipPos.top, left: tooltipPos.left }} key={step.id} onClick={handleTooltipClick}>
    <span className="sys-coach__arrow" />
    <div className="sys-coach__eyebrow">
      <Sigil size="mark" playKey={step.id} />
      <span className="sys-coach__tag">SYSTEM</span>
      <span className="sys-coach__count"><b>{String(stepIndex + 1).padStart(2,"0")}</b> / {String(totalSteps).padStart(2,"0")}</span>
    </div>
    <div className="sys-coach__title">{step.title}</div>
    <div className="sys-coach__text">
      <TypewriterText key={step.id} text={step.text} speed={18} skipSignal={typingSkipSignal} onComplete={completeText} />
    </div>
    <div className="sys-coach__foot">
      <div className="sys-coach__dots">
        {Array.from({ length: totalSteps }).map((_, i) => <i key={i} className={i === stepIndex ? "on" : ""} />)}
      </div>
      {isActionStep
        ? <div className="sys-coach__hint">{actionText}</div>
        : (textDone && <button className="sys-coach__btn" onClick={(e) => { e.stopPropagation(); onContinue(); }}>{t("tutorial.actions.next")}</button>)}
    </div>
  </div>
);
```

> Note: `totalSteps` dots for long sequences (onboarding ≈ 28) will be many — if a row of 28 dots is too wide, switch `.sys-coach__dots` to a compact "N / total" pill in this step instead. Decide visually in preview; keep whichever reads cleaner.

- [ ] **Step 4: Verify in preview**

`npm run dev` → replay tutorial → advance to the spotlight steps (HUD, Heute, Quest Board, …). Confirm: smooth **gliding** rounded spotlight, soft dim (no hard black band), premium card with mini-sigil + counter + button, arrow points at target, cross-fade between steps. Action steps (create quest / input) still detect interaction and advance. `preview_screenshot` at iPhone width.

- [ ] **Step 5: Commit**

```bash
git add components/tutorial/TutorialOverlay.jsx styles/tutorial.css
git commit -m "feat(tutorial): gliding spotlight + Apple-clean coachmark"
```

---

## Task 7: Feature icons (module + map + test)

**Files:**
- Create: `components/tutorial/featureIcons.jsx`
- Modify: `data/featureUnlocks.js` (re-export helper)
- Create: `scripts/test-feature-icons.mjs`

- [ ] **Step 1: Write the failing test**

The map + helper live in a **plain `.js`** sibling (`featureIconMap.js`) so node can import them without JSX; the `featureIcons.jsx` component imports the same module. Create `scripts/test-feature-icons.mjs`:

```js
import { FEATURE_UNLOCKS } from "../data/featureUnlocks.js";
import { getFeatureIconName } from "../components/tutorial/featureIconMap.js";

let failures = 0;
const VALID = new Set(["gate","shop","sanctum","story","habit","goal","shadow","codex","job","season","link","star","bolt","scan","music","chart","calendar","trophy","focus","gem","equip","chain"]);

for (const key of Object.keys(FEATURE_UNLOCKS)) {
  const name = getFeatureIconName(key);
  if (name && VALID.has(name)) console.log("PASS", key, "→", name);
  else { console.error("FAIL", key, "→", name); failures++; }
}
if (failures) { console.error(`\n${failures} feature(s) without a valid icon`); process.exit(1); }
console.log("\nAll feature keys map to a valid icon.");
```

- [ ] **Step 2: Run — expect fail**

Run: `node scripts/test-feature-icons.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the map** (`components/tutorial/featureIconMap.js`)

Map every key in `FEATURE_UNLOCKS` (see `data/featureUnlocks.js`) to an icon name. Complete map:

```js
export const FEATURE_ICON_NAMES = {
  quests_basic: "star", stats_view: "chart", settings: "bolt", calendar: "calendar",
  habit_tracker: "habit", emergency_quests: "bolt", quest_filters: "chart", analytics: "chart",
  ai_task_scan: "scan", music: "music", goals: "goal", training_tab: "focus",
  micro_habits: "habit", vision_board: "star", focus_mode: "focus", ai_quest_desc: "scan",
  achievements: "trophy", weekly_quests: "calendar", dawn_dusk: "bolt", ai_coach: "scan",
  dungeons: "gate", shop: "shop", gem_shop: "gem", equipment: "equip",
  chained_quests: "chain", story: "story", sanctum: "sanctum", ai_verification: "scan",
  shadow_army: "shadow", codex: "codex", ai_dynamic_quests: "scan",
  jobs: "job", formations: "shadow", challenges: "trophy", hidden_quests: "star",
  soul_link: "link", charisma_dungeons: "gate", named_shadows: "shadow", seasons: "season",
  multiplayer: "link",
};
export function getFeatureIconName(key) { return FEATURE_ICON_NAMES[key] || "star"; }
```

- [ ] **Step 4: Run — expect pass**

Run: `node scripts/test-feature-icons.mjs` → all `PASS`, exit 0.

- [ ] **Step 5: Implement `featureIcons.jsx`** — refined line/geometric SVGs (no emoji):

```jsx
import React from "react";
import { getFeatureIconName } from "./featureIconMap.js";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const ICONS = {
  gate:   <><path {...P} d="M5 19V7a7 7 0 0 1 14 0v12" /><path {...P} d="M5 19h14" /></>,
  shop:   <><path {...P} d="M4 8h16l-1 11H5L4 8Z" /><path {...P} d="M8 8a4 4 0 0 1 8 0" /></>,
  sanctum:<><path {...P} d="M12 3l7 6v11H5V9l7-6Z" /><circle {...P} cx="12" cy="13" r="2.4" /></>,
  story:  <><path {...P} d="M5 5h11l3 3v11H5V5Z" /><path {...P} d="M8 10h8M8 14h6" /></>,
  habit:  <><path {...P} d="M4 12l4 4 12-12" /><path {...P} d="M4 19h16" opacity=".5" /></>,
  goal:   <><circle {...P} cx="12" cy="12" r="8" /><circle {...P} cx="12" cy="12" r="3" /></>,
  shadow: <><path {...P} d="M12 4c3 3 5 5 5 9a5 5 0 0 1-10 0c0-4 2-6 5-9Z" /></>,
  codex:  <><path {...P} d="M6 4h12v16H6z" /><path {...P} d="M9 4v16" /></>,
  job:    <><circle {...P} cx="12" cy="8" r="3.2" /><path {...P} d="M5 20a7 7 0 0 1 14 0" /></>,
  season: <><circle {...P} cx="12" cy="12" r="4" /><path {...P} d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  link:   <><path {...P} d="M9 13a4 4 0 0 1 0-5l2-2a4 4 0 0 1 6 6l-1 1" /><path {...P} d="M15 11a4 4 0 0 1 0 5l-2 2a4 4 0 0 1-6-6l1-1" /></>,
  star:   <><path {...P} d="M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 16.8 6.4 20l1.6-6.3-5-4.2 6.5-.5L12 3Z" /></>,
  bolt:   <><path {...P} d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" /></>,
  scan:   <><path {...P} d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" /><path {...P} d="M7 12h10" /></>,
  music:  <><circle {...P} cx="7" cy="17" r="2.5" /><circle {...P} cx="17" cy="15" r="2.5" /><path {...P} d="M9.5 17V6l10-2v11" /></>,
  chart:  <><path {...P} d="M4 20V4" /><path {...P} d="M4 20h16" /><path {...P} d="M8 16l3-4 3 2 4-6" /></>,
  calendar:<><rect {...P} x="4" y="5" width="16" height="15" rx="2" /><path {...P} d="M4 9h16M9 3v4M15 3v4" /></>,
  trophy: <><path {...P} d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path {...P} d="M12 13v4M9 20h6" /></>,
  focus:  <><circle {...P} cx="12" cy="12" r="3" /><circle {...P} cx="12" cy="12" r="8" opacity=".5" /></>,
  gem:    <><path {...P} d="M6 4h12l3 5-9 11L3 9l3-5Z" /><path {...P} d="M3 9h18M12 4 9 9l3 11 3-11-3-5Z" /></>,
  equip:  <><path {...P} d="M5 4l6 6M19 4l-6 6" /><path {...P} d="M9 12l3 3 3-3-3 7-3-7Z" /></>,
  chain:  <><rect {...P} x="4" y="9" width="7" height="6" rx="3" /><rect {...P} x="13" y="9" width="7" height="6" rx="3" /></>,
};
export default function FeatureIcon({ feature, size = 18 }) {
  const node = ICONS[getFeatureIconName(feature)] || ICONS.star;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{node}</svg>;
}
```

- [ ] **Step 6: Re-export helper from `data/featureUnlocks.js`**

Append: `export { getFeatureIconName } from "../components/tutorial/featureIconMap.js";`

- [ ] **Step 7: Add npm script & commit**

Add `"test:icons": "node scripts/test-feature-icons.mjs"` to `package.json`.

```bash
git add components/tutorial/featureIcons.jsx components/tutorial/featureIconMap.js scripts/test-feature-icons.mjs data/featureUnlocks.js package.json
git commit -m "feat(unlocks): real per-feature icons + coverage test"
```

---

## Task 8: Rewrite the feature-unlock sequence

**Files:**
- Rewrite: `components/ui/SystemUnlockSequence.jsx`
- Modify: `styles/tutorial.css` (unlock surface)

- [ ] **Step 1: Add unlock CSS** (port from `sigil-final-bar.html` `.sg-grid`/`.sg-fcard` + level-up bits):

```css
.sys-unlock { z-index: 10010; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 30px 24px; text-align: center; animation: sysFade .35s ease both; }
.sys-unlock__inner { width: 100%; max-width: 460px; position: relative; z-index: 3; }
.sys-unlock__label { font: 700 7.5px/1 'JetBrains Mono', monospace; letter-spacing: 2.5px; color: var(--sys-muted); margin: 16px 0 10px; }
.sys-unlock__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sys-unlock__card { display: flex; align-items: center; gap: 9px; padding: 11px 12px; border-radius: 14px; text-align: left;
  background: linear-gradient(160deg, rgba(22,27,38,.92), rgba(11,14,21,.7)); border: 1px solid color-mix(in srgb, var(--theme-primary) 14%, transparent); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
.sys-unlock__tile { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; display: grid; place-items: center; color: var(--sys-accent);
  background: var(--theme-primary-12); border: 1px solid var(--theme-primary-22); }
.sys-unlock__name { font: 700 11px/1.1 'Cinzel', serif; color: #e7eef6; }
.sys-unlock__desc { font: 300 9px/1.25 'Outfit', sans-serif; color: var(--sys-muted); margin-top: 2px; }
.sys-unlock__cta { width: 100%; min-height: 48px; margin-top: 20px; border-radius: 12px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 45%, transparent); color: var(--sys-ink);
  background: linear-gradient(135deg, var(--theme-primary-18), color-mix(in srgb, var(--theme-primary) 24%, transparent));
  font: 800 11px/1 'JetBrains Mono', monospace; letter-spacing: 3px; }
.sys-play .sys-unlock__card { animation: sysCard .6s var(--sys-ease) both; }
.sys-play .sys-unlock__card:nth-child(1){animation-delay:.15s}
.sys-play .sys-unlock__card:nth-child(2){animation-delay:.3s}
.sys-play .sys-unlock__card:nth-child(3){animation-delay:.45s}
.sys-play .sys-unlock__card:nth-child(4){animation-delay:.6s}
.sys-play .sys-unlock__card:nth-child(5){animation-delay:.75s}
.sys-play .sys-unlock__card:nth-child(6){animation-delay:.9s}
@keyframes sysCard { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
```

Add to reduced-motion guard: `.sys-play .sys-unlock__card { animation: none !important; opacity: 1 !important; }`

- [ ] **Step 2: Rewrite the component body**

Keep the existing props (`tier, features, message, onComplete`), the phase timers, the Escape handler, and `visibleFeatures`/`extraCount`. Replace the inline-styled return with class-based markup; remove the injected `<style id="system-unlock-sequence-fx">` block:

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/tutorial.css";
import Sigil from "../tutorial/Sigil.jsx";
import FeatureIcon from "../tutorial/featureIcons.jsx";

export default function SystemUnlockSequence({ tier, features = [], message, onComplete }) {
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);
  const visible = useMemo(() => features.slice(0, 6), [features]);
  const extra = Math.max(0, features.length - visible.length);
  const title = message?.title || `TIER ${tier || "?"} UNLOCK`;
  const lines = message?.lines?.length ? message.lines : ["Neue Systemmodule wurden freigeschaltet."];
  const complete = () => { if (!completedRef.current) { completedRef.current = true; onComplete?.(); } };

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setPhase(3); const d = setTimeout(complete, 3600); return () => clearTimeout(d); }
    const t = [setTimeout(() => setPhase(1), 550), setTimeout(() => setPhase(2), 1500), setTimeout(() => setPhase(3), 2700), setTimeout(complete, 7600)];
    return () => t.forEach(clearTimeout);
  }, []);
  useEffect(() => { const k = e => e.key === "Escape" && complete(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);

  return (
    <div role="dialog" aria-modal="true" className="sys-fullbleed sys-grain sys-vignette sys-unlock sys-play">
      <div className="sys-cine__aur"><i className="a1" /><i className="a2" /></div>
      <div className="sys-unlock__inner">
        <div className="sys-cine__hero" style={{ flex: "none" }}><Sigil size="crest" playKey={tier} /></div>
        <div className="sys-cine__eyebrow">SYSTEM UPDATE</div>
        <div className="sys-cine__title" style={{ fontSize: "clamp(26px,7vw,40px)" }}>{title}</div>
        <div className="sys-unlock__label">FREIGESCHALTET</div>
        <div className="sys-unlock__grid">
          {visible.map((f, i) => (
            <div key={(f.key || f.label) + i} className="sys-unlock__card">
              <span className="sys-unlock__tile"><FeatureIcon feature={f.key} /></span>
              <div><div className="sys-unlock__name">{f.label}</div><div className="sys-unlock__desc">{f.desc}</div></div>
            </div>
          ))}
          {extra > 0 && (
            <div className="sys-unlock__card" style={{ justifyContent: "center" }}>
              <span className="sys-unlock__name">+{extra} Module</span>
            </div>
          )}
        </div>
        <button className="sys-unlock__cta" onClick={complete}>{phase >= 3 ? "FORTFAHREN" : "INITIALISIERUNG …"}</button>
      </div>
    </div>
  );
}
```

> `features` entries carry `key` (from `getUnlocksAtLevel`), so `FeatureIcon feature={f.key}` resolves the icon.

- [ ] **Step 3: Verify in preview (temporary dev-mount)**

Temporarily add near the top of the render in `solo-leveling-v5.jsx` (after imports it already has `getUnlocksAtLevel`; add `TIER_UNLOCK_MESSAGES` to that import):

```jsx
{/* TEMP VERIFY — remove before commit */}
<SystemUnlockSequence tier={4} features={getUnlocksAtLevel(11)} message={TIER_UNLOCK_MESSAGES[4]} onComplete={() => {}} />
```

`npm run dev`, reach the inner UI. Confirm: full-bleed obsidian (no bars), sigil crest, title, **feature cards cascade in with real line-icons**, CTA. `preview_screenshot` at iPhone width. **Remove the TEMP block.**

- [ ] **Step 4: Commit**

```bash
git add components/ui/SystemUnlockSequence.jsx styles/tutorial.css
git commit -m "feat(unlocks): Obsidian Luxe unlock sequence with icons + cascade"
```

---

## Task 9: Restyle the level-up cinematic

**Files:**
- Modify: `data/constants.jsx` (`LevelUpCinematic`, ~lines 299-317)
- Modify: `styles/tutorial.css` (level-up bits)

- [ ] **Step 1: Add level-up CSS:**

```css
.sys-lvl { z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.sys-lvl__eyebrow { z-index: 3; font: 800 9px/1 'JetBrains Mono', monospace; letter-spacing: 5px; color: var(--sys-accent); margin-bottom: 4px; }
.sys-lvl__num { z-index: 3; font: 900 84px/.9 'Cinzel', serif; color: var(--sys-ink); text-shadow: 0 0 40px var(--sys-glow); }
.sys-lvl__rank { z-index: 3; font: 400 14px/1 'Cinzel', serif; letter-spacing: 3px; color: color-mix(in srgb, var(--theme-primary) 60%, #cfe1f2); margin-top: 8px; }
.sys-lvl__pts { z-index: 3; font: 400 11px/1 'JetBrains Mono', monospace; color: var(--sys-muted); margin-top: 10px; }
.sys-lvl__badge { z-index: 3; margin-top: 18px; padding: 7px 18px; border-radius: 99px; font: 600 11px/1 'JetBrains Mono', monospace; letter-spacing: 2px; color: var(--sys-accent); background: var(--theme-primary-12); border: 1px solid var(--theme-primary-22); }
.sys-play .sys-lvl__num { animation: sysNum .85s var(--sys-ease) .3s both; }
.sys-play .sys-lvl__eyebrow { animation: sysFadeUp .6s ease .1s both; }
.sys-play .sys-lvl__rank, .sys-play .sys-lvl__pts, .sys-play .sys-lvl__badge { animation: sysFadeUp .6s ease .8s both; }
@keyframes sysNum { from { opacity: 0; transform: scale(.7); filter: blur(7px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
```

Reduced-motion: add `.sys-play .sys-lvl__num, .sys-play .sys-lvl__eyebrow, .sys-play .sys-lvl__rank, .sys-play .sys-lvl__pts, .sys-play .sys-lvl__badge { animation: none !important; opacity: 1 !important; }`

- [ ] **Step 2: Rewrite `LevelUpCinematic`**

Keep the signature `({ levelData, rank, oldRank, onClose })`, the `level`/`earnedPoints`/`isRankUp` derivation, and the 4s auto-close timer. Replace the returned JSX:

```jsx
  return (
    <div onClick={onClose} className="sys-fullbleed sys-grain sys-vignette sys-lvl sys-play" style={{ background: "rgba(0,0,0,0.93)" }}>
      <div className="sys-cine__aur"><i className="a1" /><i className="a2" /></div>
      <div className="sys-cine__hero" style={{ flex: "none", marginBottom: 10 }}>
        <Sigil size="crest" playKey={level} />
      </div>
      <div className="sys-lvl__eyebrow">{isRankUp ? "RANK UP" : "LEVEL UP"}</div>
      <div className="sys-lvl__num">{level}</div>
      <div className="sys-lvl__rank">{rank.label}</div>
      {earnedPoints > 0 && <div className="sys-lvl__pts">+ {earnedPoints} Statuspunkte</div>}
      {isRankUp && <div className="sys-lvl__badge">NEUER RANG: {rank.name}</div>}
    </div>
  );
```

Add `import Sigil from "../components/tutorial/Sigil.jsx";` to `data/constants.jsx` (verify the relative path from `data/` → `components/tutorial/Sigil.jsx`).

- [ ] **Step 3: Verify in preview (temporary dev-mount)**

Temporarily add to `solo-leveling-v5.jsx` render: `<LevelUpCinematic levelData={{ level: 11, earnedPoints: 5 }} rank={getRank(11)} oldRank={getRank(10)} onClose={() => {}} />`. Confirm: full-bleed (no bars), sigil crest, number pops from blur, rank + points fade up. `preview_screenshot`. **Remove the TEMP block.**

- [ ] **Step 4: Commit**

```bash
git add data/constants.jsx styles/tutorial.css
git commit -m "feat(levelup): Obsidian Luxe level-up cinematic with sigil crest"
```

---

## Task 10: Full-bleed / safe-area / theme / reduced-motion audit

**Files:** none (verification) — fix forward into the relevant file if an issue is found.

- [ ] **Step 1: iPhone full-bleed sweep**

`npm run dev`. With `preview_resize` to 390×844 and 430×932, walk: onboarding cinematic → spotlight steps → finale → (dev-mount) level-up → unlock. Confirm **zero black bands** top/bottom on every surface, and that the skip button, step counter, and CTA all sit inside the safe area (not under notch/home indicator). Screenshot each.

- [ ] **Step 2: Theme follow-through**

Change theme (Settings → theme, or set `data-theme` on `<html>`). Reload, replay tutorial. Confirm all surfaces recolor via `--theme-primary` (no leftover cyan). Screenshot one non-default theme.

- [ ] **Step 3: Reduced motion**

Emulate `prefers-reduced-motion: reduce` (preview/devtools). Confirm: no sigil rotation/draw, no cascade, no number pop — everything renders static and legible.

- [ ] **Step 4: Flow regression**

Full onboarding run end-to-end: cinematic intros, each spotlight step resolves its target, the **action** steps (tap "Neue Quest", type a title, submit) detect interaction and advance, skip works, and the queue continues to a tier tutorial. Confirm via preview.

- [ ] **Step 5: Run logic tests + commit any fixes**

```bash
node scripts/test-sigil-geometry.mjs
node scripts/test-feature-icons.mjs
```

Both exit 0. Commit any forward-fixes discovered:

```bash
git add -A
git commit -m "fix(tutorial): full-bleed/safe-area/theme audit fixes"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task |
|---|---|
| Obsidian Luxe tokens, rounded, no clip-path/scanlines | 4, 5, 6 |
| Reusable Sigil, **centered hexagram** | 2, 3 |
| Apple-clean coachmark, gliding spotlight, iOS dots, single button | 6 |
| Cinematic hero (sigil/aurora/grain/beam/choreography) | 5 |
| Level-up sigil crest + number pop | 9 |
| Unlock cascade + **real feature icons** (not 2-letter) | 7, 8 |
| Black bars fixed (remove level-up letterbox) | 1 |
| Full-bleed `100dvh` + safe-area | 4 (helper), 10 (verify) |
| Theme-accent driven (no hardcoded cyan) | token mapping, 10 |
| Reduced-motion respected | every CSS task, 10 |
| Keep existing flow logic | 5, 6 (logic untouched) |

**Notes:** Final pixel-polish is iterated live in-app with the user (per spec §10). The dot-row vs pill decision in Task 6 Step 3 is an explicit in-preview call. Out of scope: ARISE/BOSS letterbox, adding new tutorial steps.
