/**
 * Portal Void Shader – Premium Edition
 *
 * Deep dimensional rift with:
 *  - Chromatic aberration on the rim (R/G/B channel split)
 *  - Electric arc lightning (quantized-time snapping)
 *  - Outer corona extending beyond the disc edge
 *  - Dual-layer domain-warped FBM void (nebula-style depth)
 *  - Void starfield with size variation
 *  - 14-crack inward fracture patterns with depth gradient
 *  - Secondary swirl layer at a different frequency
 */

export const portalGlowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalGlowFrag = /* glsl */ `
  uniform vec3  rankColor;
  uniform float time;
  uniform float pulseSpeed;
  varying vec2  vUv;

  // ── Hash / noise ──────────────────────────────────────────────────────────
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float hash1(float n) { return fract(sin(n) * 43758.5453123); }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),              hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }

  // Domain-warped FBM with rotating octaves
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(1.7, 0.1, -1.0, 0.7);
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = rot * p; a *= 0.5; }
    return v;
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  void main() {
    vec2  uv   = vUv - 0.5;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Extended disc: allow corona fringe outside gate ring
    if (dist > 0.60) discard;

    float t = time;
    float ps = pulseSpeed;

    // ── Domain-warped swirl coords ────────────────────────────────────────
    float swirl1 = angle + dist * 3.2 - t * 0.20 * ps * 0.5;
    float swirl2 = angle - dist * 2.8 + t * 0.14 * ps * 0.5;
    // Second swirl layer – slower, larger scale
    float swirl3 = angle * 1.5 + dist * 1.8 - t * 0.08 * ps * 0.5;

    vec2 warpUV  = vec2(cos(swirl1) * dist * 5.0, sin(swirl2) * dist * 5.0);
    vec2 warpUV2 = vec2(cos(swirl3) * dist * 3.0, sin(swirl3) * dist * 3.0);

    float n1    = fbm(warpUV  - t * 0.06);
    float n2    = fbm(warpUV  + vec2(2.3, 1.7) + n1 * 1.8 - t * 0.04);
    float warp  = fbm(warpUV  + n2 * 1.4 + t * 0.03);
    float warp2 = fbm(warpUV2 + t * 0.025);   // slower secondary swirl

    // ── Deep void – dual layer nebula ────────────────────────────────────
    float voidDepth  = 1.0 - dist * 1.7;
    float voidNebula = warp * warp2 * 0.5;
    // Faint teal/blue nebula hints in the darkness
    vec3  voidCol = vec3(0.0, 0.01, 0.05) * voidDepth
                  + vec3(0.0, 0.03, 0.08) * voidNebula * voidDepth * 0.6
                  + rankColor * 0.04 * voidNebula * voidDepth;

    // ── Rank-colored energy wisps (two layers) ────────────────────────────
    float wispMask1 = pow(max(0.0, warp),  2.2)
                    * smoothstep(0.5, 0.07, dist)
                    * (0.55 + 0.45 * sin(t * ps + dist * 14.0));
    float wispMask2 = pow(max(0.0, warp2), 2.0)
                    * smoothstep(0.45, 0.04, dist)
                    * (0.6 + 0.4 * cos(t * ps * 0.7 + dist * 9.0 + 1.5));
    vec3  wispCol = rankColor * (wispMask1 * 2.8 + wispMask2 * 1.4);

    // ── Void sparkles – variable size ────────────────────────────────────
    float sparkGrid  = 88.0;
    float sparkTime  = floor(t * 2.0);
    float sparkHash  = hash(floor(vUv * sparkGrid + sparkTime));
    float sparkHash2 = hash(floor(vUv * sparkGrid * 0.5 + sparkTime + 3.7));
    float sparkle    = step(0.93, sparkHash) * smoothstep(0.44, 0.08, dist);
    float sparkBig   = step(0.97, sparkHash2) * smoothstep(0.40, 0.06, dist) * 1.8;
    vec3  sparkCol   = mix(vec3(0.6, 0.8, 1.0), rankColor, 0.45) * (sparkle + sparkBig) * 0.75;

    // ── Chromatic-aberrated rim ────────────────────────────────────────────
    // Split RGB channels slightly for a "reality tear" fringe effect
    float rimPeak = 0.44;
    float rimW    = 0.048;
    float rimPulse = 1.0 + 0.28 * sin(t * ps * 1.3);

    float rimR = exp(-pow((dist - rimPeak + 0.014) / (rimW * 0.9), 2.0));
    float rimG = exp(-pow((dist - rimPeak)          / rimW,         2.0));
    float rimB = exp(-pow((dist - rimPeak - 0.014) / (rimW * 1.1), 2.0));

    // White fringe on R, slight cool shift on B
    vec3 rimCol = vec3(
      mix(rankColor.r, 1.0, 0.35) * rimR,
      rankColor.g * rimG,
      mix(rankColor.b, 0.85, 0.3) * rimB
    ) * 5.5 * rimPulse;

    // Secondary inner rim for depth
    float rim2 = exp(-pow((dist - 0.30) / 0.065, 2.0)) * 0.55;
    vec3 rim2Col = rankColor * rim2 * 1.8 * (0.8 + 0.2 * sin(t * ps * 0.9));

    // ── Outer corona (beyond gate edge – reality fringe) ─────────────────
    // Fades past disc boundary, additive with existing alpha
    float corona  = exp(-pow((dist - 0.505) / 0.07, 2.0));
    vec3  coronaCol = rankColor * corona * 2.0 * rimPulse;

    // ── Inward crack patterns ─────────────────────────────────────────────
    float cracks = 0.0;
    float numCk  = 14.0;
    for (float i = 0.0; i < 14.0; i++) {
      float crackAngle = i * 6.28318 / numCk + n1 * 0.9 + t * 0.018;
      float da = mod(abs(angle - crackAngle), 6.28318);
      da = min(da, 6.28318 - da);
      // Crack width narrows near center for a proper fracture look
      float crackW = 0.065 + dist * 0.04;
      float bright = smoothstep(crackW, 0.0, da)
                   * smoothstep(0.5, 0.14, dist)
                   * smoothstep(0.08, 0.44, dist);
      cracks += bright;
    }
    vec3 crackCol = mix(rankColor, vec3(1.0), 0.2) * cracks * 1.1;

    // ── Electric arcs – snapping lightning inside the void ────────────────
    // Quantized time creates the "snapping" feel of real electricity
    float arcs = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
      float phase  = floor(t * 14.0 + i * 5.73);          // snap interval
      float active = step(0.62, hash(vec2(phase, i * 3.1))); // ~38% chance on
      if (active > 0.0) {
        float arcAngle = hash(vec2(phase + 0.5, i)) * 6.28318;
        float da       = mod(abs(angle - arcAngle), 6.28318);
        da             = min(da, 6.28318 - da);
        float bright   = smoothstep(0.022, 0.0, da)
                       * smoothstep(0.5,  0.04, dist)
                       * smoothstep(0.03, 0.46, dist);
        arcs += bright * (0.5 + hash1(phase + i) * 1.5);
      }
    }
    vec3 arcCol = mix(vec3(1.0, 1.0, 1.0), rankColor * 1.5, 0.25) * arcs * 5.0;

    // ── Composite ─────────────────────────────────────────────────────────
    vec3 finalColor = voidCol + wispCol + sparkCol + rimCol + rim2Col
                    + coronaCol + crackCol + arcCol;

    // Alpha: inside gate opaque with smooth edge; corona has own alpha
    float innerAlpha  = smoothstep(0.5, 0.46, dist) * 0.97;
    float coronaAlpha = corona * 0.55;
    float alpha = max(innerAlpha, coronaAlpha);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
