# Tutorial & Level-Up 2.0 — Design Spec

- **Date:** 2026-06-01
- **Status:** Approved direction (visual brainstorm), pending spec review
- **Author:** John + Claude
- **Related:** `docs/superpowers/plans/2026-05-31-quest-screen-redesign.md`

---

## 1. Goal & Context

The onboarding tutorial and the level-up "what did I unlock" moment look dated and
have a functional rendering bug (black bars top/bottom). This is a **2.0 quality pass**:
make both surfaces feel premium, calm, Apple-clean and *guided*, so the user feels
elevated and confidently led through what the app can do — while fixing the rendering.

Two requirements drive everything:

1. **Functional:** kill the black bars and guarantee true full-bleed rendering.
2. **Craft:** a markedly higher design bar — "ganz anderes Level, premium, aufwendig."

### Design constraints (from user memory)

- **Premium / minimal-luxe.** High-end look. **No** neon glow, fake-HUD telemetry,
  scanlines, rotating brackets, or "AI gimmickry."
- This must be reconciled with the **Solo-Leveling "System" theme**: keep the System
  identity, but execute it with restraint and real craft (fine lines, depth, glass,
  controlled glow) rather than loud effects.
- **iPhone-first.** German UI copy.

---

## 2. Scope

**In scope**

- Onboarding tutorial sequence (cinematic + spotlight/coachmark + action steps).
- Tier-unlock mini-tutorials (`tier_1` … `tier_8`).
- Level-up cinematic (`LevelUpCinematic` in `data/constants.jsx`).
- Feature-unlock sequence (`components/ui/SystemUnlockSequence.jsx`).
- The black-bar functional fix (letterbox + full-bleed coverage).

**Out of scope (this pass)**

- Adding *new* tutorial steps / rewriting copy beyond light edits (the existing
  onboarding already covers HUD → Today → Quest Board → create quest → nav → Hunter
  Island → portals → app grid → Stats → return). We restyle the *experience*, not the
  curriculum.
- The Arise / shadow-extraction cinematic and quest-completion FX (separate surfaces;
  only touched where they share the letterbox fix).
- Multiplayer, shop, and other feature screens.

---

## 3. Design Language — "Obsidian Luxe" + "Runen-Sigille"

The approved direction (validated as animated mockups in the visual companion):

### Palette
- **Surface:** deep obsidian charcoal gradient (`#0b0d14 → #05060a`), not pure black.
- **Accent:** the **active theme accent** (`var(--theme-primary)`), used sparingly.
  Mockups used ice-blue `#9fc6e8`; the real build must **not hardcode cyan** — it reads
  the theme. A neutral "ice/platinum" (`~#cfe8ff` at low opacity) is allowed for fine
  hairlines and the sigil strokes.
- **Text:** `#ffffff` titles, `~#9aa6b8` body, `~#6b7689` muted/meta.

### Type
- **Display/title:** Cinzel (serif) — already loaded in `index.html`.
- **Body:** Outfit (sans) — loaded.
- **Labels/eyebrow/counter/button:** JetBrains Mono — loaded.

### Form
- **Large soft radii** (cards ~20–22px, spotlight ~16px). **Remove the angular
  `clip-path` corner cuts** from the current tooltip — "viel runder."
- **Glass + depth:** layered translucent surfaces, 1px hairline borders, soft drop
  shadows, a subtle top inner-highlight. Depth via shadow, not glow.
- **Premium texture:** very low-opacity film grain (SVG `feTurbulence`, opacity ~0.05,
  `mix-blend: overlay`) + radial vignette on full-screen moments.

### Motion (signature)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (already the app's curve).
- Entrances are **choreographed and staggered**, never simultaneous.
- Ambient life: a slowly **breathing** core, **counter-rotating** sigil rings, and a
  slow **parallax aurora** behind full-screen moments.
- Always gated behind `prefers-reduced-motion`.

### The Sigil (graphical hero)
A self-drawing arcane **Runen-Sigille**: outer ring + fine tick-ring + gapped rune-arc
segments + a **centered, symmetric hexagram** + inner triangle + breathing core, with two
counter-rotating layers. On entrance, strokes draw in via `stroke-dashoffset`
(`pathLength="1"`).

> **Geometry correctness (explicit fix):** both hexagram triangles MUST share the exact
> center and be congruent (mirror by 180°). Use circumradius `R` about center `(c,c)`:
> apex `(c, c−R)`, base `(c ± R·√3/2, c + R/2)` for the up-triangle; mirror for the down.
> The earlier mockup had centroids at `94` vs `86` (off-center) — do not repeat.

Sigil appears at three sizes: **hero** (onboarding cinematic), **crest** (level-up), and
**mark** (~18px, in the coachmark eyebrow). It is the unifying visual across all surfaces.

---

## 4. Components & Architecture

Goal: isolate the new visual system into small, reusable, testable units. Keep the
existing **behavior/flow logic** (targeting, queue, action detection) intact — it is
solid; this is primarily a presentation + motion rewrite.

### 4.1 `components/tutorial/Sigil.jsx` — NEW
- Pure presentational SVG component. Props: `size` (`"hero" | "crest" | "mark"`),
  `playKey` (changing it restarts the draw-in), `accent` (defaults to theme).
- Owns the corrected geometry and the draw-in / rotation / breathing animations
  (via a scoped class, respecting reduced-motion).
- Consumed by the cinematic step, the level-up cinematic, and the coachmark.

### 4.2 `styles/tutorial.css` — REWRITE
- New "system 2.0" surface styles: backdrop, spotlight, coachmark card, cinematic
  stage, aurora, grain, level-up. Single source of truth for the look.
- Drives everything off `--theme-primary` and a small set of local tokens
  (`--sys-surface`, `--sys-ink`, `--sys-text`, `--sys-hairline`, `--sys-radius`,
  `--sys-ease`). Remove scanline / clip-path / fake-telemetry rules.

### 4.3 `components/tutorial/TutorialOverlay.jsx` — RESTYLE + enhance
Keep: rect tracking, spotlight follow, action attach/detect, click-cage, skip,
typewriter, queue advance. Change the rendered presentation:

- **Spotlight:** keep the gliding follow (already smooth). Render as a rounded
  (~16px) cutout via the `box-shadow: 0 0 0 9999px <dim>` technique for a clean soft
  dim, plus a subtle theme-accent ring + soft glow. Drop the SVG `tutorial-mask` +
  angular `FocusRing` brackets in favor of this calmer treatment.
- **Coachmark (`TooltipStep`):** new premium card — rounded 22px glass, eyebrow row
  (Sigil `mark` + `SYSTEM` tag + `NN / NN` counter), Cinzel title, Outfit body, an
  **iOS page-dot indicator** (active dot elongates), one clear primary button
  ("WEITER"/"NEXT"), subtle caret toward the target, smooth cross-fade between steps.
- **Cinematic step (`CinematicStep`):** Obsidian stage + Sigil `hero` + parallax
  aurora + grain + vignette + light shaft; choreographed reveal (sigil draws → eyebrow
  letterspacing-in → title blur-up → hairline → body typewriter → continue pulse).
  Replace the current concentric-ring emblem + floating-dot particles.

### 4.4 `LevelUpCinematic` (`data/constants.jsx`) — RESTYLE
- Obsidian stage + Sigil `crest` above the number; number **pop** (and optional
  count-up), rank label, earned stat-points, then hand off to the unlock sequence.
- **Remove the `triggerLetterbox("LEVEL UP", …)` call** (see §5). The new full-bleed
  cinematic owns the screen; no separate bars.

### 4.5 `components/ui/SystemUnlockSequence.jsx` — REWRITE + feature icons
- Obsidian Luxe styling matching the cinematic. **Replace the 2-letter abbreviation
  badges with real icons.** Cards **cascade in** staggered (the approved motion).
- Requires an **icon per feature.** Add a `glyph`/`icon` field to each entry in
  `data/featureUnlocks.js` (or a sibling `FEATURE_ICONS` map keyed by feature key).
  Icons are refined line/geometric SVG glyphs consistent with the sigil language —
  **not emoji.**
- Keep `TIER_UNLOCK_MESSAGES` copy; restyle the line list (drop the
  "SYSTEM UPDATE BESTAETIGT" scan aesthetic).

---

## 5. Functional Fix — Black Bars & Full-Bleed

### Confirmed cause (level-up)
`components/ui/LetterboxOverlay.jsx` renders fixed **12vh black bars** top & bottom on a
`letterbox` event. It is triggered in the **`onClose` of the level-up cinematic** at
`solo-leveling-v5.jsx:1127` (`triggerLetterbox("LEVEL UP", 2500, …)`). These bars are the
"kleiner schwarzer Rand oben/unten" during the level-up flow. (Also fired for
`ARISE` at :1137 and `BOSS ELIMINATED` at `constants.jsx:1071`.)

**Fix:** the redesigned level-up cinematic is full-bleed and self-contained, so **remove
the level-up letterbox trigger**. Leave `LetterboxOverlay` itself intact for any
intentional, opt-in use (it already honors `settings.letterboxMode === false`), but the
2.0 level-up flow does not call it. Re-evaluate the `ARISE`/`BOSS` triggers only insofar
as they share this component — not redesigned here.

### Tutorial black bars — reproduce first, then fix
The tutorial overlays use `position: fixed; inset: 0`, and `index.html` already sets
`viewport-fit=cover`, so full coverage is expected. Per systematic-debugging, **reproduce
on a narrow/iOS-sized viewport before changing code.** Likely culprits to confirm:
1. A `100vh` vs visual-viewport mismatch on iOS leaving a band (use `100dvh` with a
   `100vh` fallback on full-screen 2.0 surfaces).
2. The letterbox firing during/after a tutorial transition.
3. A parent container not extending under the safe areas.

**Fix principles for every 2.0 full-screen surface:**
- `position: fixed; inset: 0; min-height: 100dvh;` background extends under safe areas.
- Interactive controls (skip, counter, continue, primary button) stay inside
  `env(safe-area-inset-*)` padding so nothing hides under notch/home-indicator.

### Verification
Manually verify with the preview tools at iPhone widths (and a notch-simulating safe-area
inset): **no black bands** on the awakening cinematic, the spotlight steps, the level-up,
and the unlock sequence. Capture before/after.

---

## 6. Motion Spec (reference timings)

Onboarding cinematic (≈ master 3s reveal):
sigil draw-in `0.15–1.3s` staggered → eyebrow `0.95s` → title blur-up `1.2s` → hairline
`1.7s` → body typewriter `1.95s` → continue pulse `2.8s`. Ambient (breathe, rotate,
aurora, motes) loop after.

Coachmark step change: spotlight glides `0.55s` `--sys-ease`; card cross-fades `~0.34s`
(out 230ms → swap content/position → in). Page-dot active elongates `0.35s`.

Level-up: number pop `0.5–1.35s` (blur+scale); rank/points fade-up; unlock cards cascade
`~1.75s+` at `0.15s` stagger.

All wrapped in `@media (prefers-reduced-motion: reduce)` → no animation.

---

## 7. Files to Change

| File | Change |
|---|---|
| `components/tutorial/Sigil.jsx` | **New** reusable animated sigil (hero/crest/mark). |
| `styles/tutorial.css` | **Rewrite** to the Obsidian Luxe system; remove clip-path/scanline rules. |
| `components/tutorial/TutorialOverlay.jsx` | Restyle spotlight + coachmark + cinematic; keep flow logic. |
| `data/constants.jsx` (`LevelUpCinematic`) | Restyle to sigil/Obsidian; remove letterbox trigger. |
| `components/ui/SystemUnlockSequence.jsx` | Rewrite styling; real icons; cascade. |
| `data/featureUnlocks.js` | Add per-feature icon/glyph (or sibling icon map). |
| `solo-leveling-v5.jsx` | Remove `triggerLetterbox("LEVEL UP", …)`; verify full-bleed mount. |
| `data/tutorialSteps.js` | Light only — copy tweaks if needed; no structural change. |

`components/ui/LetterboxOverlay.jsx` is **not** rewritten (only its level-up trigger is
removed).

---

## 8. Testing / Verification

- Manual preview verification at iPhone viewport widths + simulated safe-area insets:
  awakening cinematic, each spotlight step, level-up, unlock sequence — confirm
  **no black bands** and correct safe-area padding.
- Reduced-motion: confirm all animation is disabled and content is fully legible/static.
- Theme accent: switch theme and confirm surfaces follow `--theme-primary` (no hardcoded
  cyan).
- Sigil geometry: visually confirm the hexagram is centered/symmetric at all three sizes.
- Existing tutorial flow still advances correctly (targets resolve, action steps detect
  input/click, skip works, queue continues to tier tutorials).

---

## 9. Open Decisions

1. **Spec language:** written in English (matches repo + code identifiers); German
   summary provided at review.
2. **Branch:** current branch is `feature/quest-screen-redesign`. Implementation should
   likely get its own branch (e.g. `feature/tutorial-levelup-2.0`).
3. **Level-up + unlock:** keep as two sequential cinematics (number → unlock cascade) vs
   merge into one continuous scene — lean toward **sequential but visually continuous**
   (shared stage/sigil), decided during implementation.
4. **Walkthrough breadth:** keep current onboarding steps; revisit "show the full feature
   set" as a follow-up if desired (out of scope now).

---

## 10. Definition of Done

- Onboarding, tier tutorials, level-up, and unlock sequence all render in the Obsidian
  Luxe + Sigil language with the specified motion.
- No black bars anywhere; verified full-bleed + safe-area on iPhone widths.
- No hardcoded accent; reduced-motion respected; sigil geometry correct.
- Final polish iterated live in-app with the user until it "lands."
