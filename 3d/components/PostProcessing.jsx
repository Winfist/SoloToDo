/**
 * PostProcessing – Placeholder
 *
 * @react-three/postprocessing has version conflicts with Three.js 0.160 / R3F 8.18.
 * All visual effects are handled natively via:
 *  - Portal shader (chromatic rim, glow, distortion)
 *  - CSS vignette overlay in DungeonGatesPage
 *  - SVG film grain filter
 *  - Additive blending on glow discs (fake bloom)
 *
 * To re-enable real post-processing, upgrade Three.js to >=0.165 and R3F to >=8.20.
 */
export default function PostProcessing() {
  return null;
}
