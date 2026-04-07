/**
 * Portal Void Shader – AAA Premium Edition
 *
 * Deep dimensional rift with:
 *  - Chromatic aberration on the rim (R/G/B channel split)
 *  - Electric arc lightning (quantized-time snapping)
 *  - Outer corona extending beyond the disc edge
 *  - Dual-layer domain-warped FBM void (nebula-style depth)
 *  - Void starfield with size variation
 *  - 14-crack inward fracture patterns with depth gradient
 *  - Secondary swirl layer at a different frequency
 *
 * AAA Upgrades:
 *  - Depth parallax (multi-speed void layers shift with camera approach)
 *  - Void heartbeat (low-freq pulsation, rank-dependent)
 *  - Dimensional tear flashes (stochastic bright bursts deep in void)
 *  - Heat distortion ring (UV displacement near rim)
 *  - Color depth gradient (void darkens as camera nears)
 *  - Enhanced turbulence (third noise layer)
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
  uniform float progress;    // 0 = far, 1 = at gate

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
    float prog = clamp(progress, 0.0, 1.0);

    // ── Heat distortion ring ───────────────────────────────────────────────
    // UV displacement near the rim creates shimmering refraction
    float distortZone = smoothstep(0.38, 0.48, dist) * smoothstep(0.55, 0.44, dist);
    float distortAmt  = distortZone * (0.012 + prog * 0.008);
    float distortAngle = t * 3.7 + angle * 6.0 + dist * 12.0;
    uv += vec2(sin(distortAngle), cos(distortAngle * 1.3)) * distortAmt;
    // Recompute after distortion
    dist  = length(uv);
    angle = atan(uv.y, uv.x);

    // ── Void heartbeat ─────────────────────────────────────────────────────
    // Low-frequency pulsation that makes the gate "breathe"
    float heartbeat = 1.0 + sin(t * 1.88 * ps * 0.3) * (0.03 + prog * 0.06);
    // Center brightens/dims with heartbeat
    float heartMask = smoothstep(0.35, 0.0, dist) * heartbeat;

    // ── Domain-warped swirl coords with parallax ───────────────────────────
    // Layers move at different speeds based on camera proximity
    float parallax1 = 1.0 + prog * 0.6;  // front layer speeds up
    float parallax2 = 1.0 - prog * 0.3;  // back layer slows down

    float swirl1 = angle + dist * 3.2 - t * 0.20 * ps * 0.5 * parallax1;
    float swirl2 = angle - dist * 2.8 + t * 0.14 * ps * 0.5 * parallax2;
    float swirl3 = angle * 1.5 + dist * 1.8 - t * 0.08 * ps * 0.5;

    vec2 warpUV  = vec2(cos(swirl1) * dist * 5.0, sin(swirl2) * dist * 5.0);
    vec2 warpUV2 = vec2(cos(swirl3) * dist * 3.0, sin(swirl3) * dist * 3.0);

    float n1    = fbm(warpUV  - t * 0.06 * parallax1);
    float n2    = fbm(warpUV  + vec2(2.3, 1.7) + n1 * 1.8 - t * 0.04);
    float warp  = fbm(warpUV  + n2 * 1.4 + t * 0.03);
    float warp2 = fbm(warpUV2 + t * 0.025 * parallax2);

    // Third turbulence layer for richer void
    vec2 warpUV3 = vec2(sin(angle * 2.3 + t * 0.05) * dist * 4.0,
                        cos(angle * 1.7 - t * 0.07) * dist * 4.0);
    float warp3 = fbm(warpUV3 + warp * 0.8 + t * 0.02);

    // ── Deep void – triple layer nebula ──────────────────────────────────
    float voidDepth  = smoothstep(0.45, 0.0, dist);
    float voidNebula = warp * warp2 * 0.8 + warp3 * 0.3;

    // Color depth gradient: void darkens heavily as camera approaches for tension
    float depthDarken = 1.0 - prog * 0.7;

    vec3  voidCol = vec3(0.0, 0.005, 0.02) * voidDepth * depthDarken
                  + vec3(0.0, 0.01, 0.04) * voidNebula * voidDepth * 0.4
                  + rankColor * 0.08 * voidNebula * voidDepth
                  + rankColor * heartMask * 0.25;  // intensified heartbeat glow in center

    // ── Dimensional tear flashes ───────────────────────────────────────────
    // Stochastic bright bursts deep in the void, suggesting movement inside
    float tearFreq = ps * 0.6;  // more tears at higher ranks
    float tearTime = floor(t * tearFreq * 4.0);
    float tearHash = hash(vec2(tearTime, tearTime * 0.7));
    float tearActive = step(0.65 - prog * 0.2, tearHash); // more active when close
    float tearAngle = tearHash * 6.28318;
    float tearDist  = hash(vec2(tearTime + 1.0, 0.0)) * 0.25;
    float tearBright = tearActive
                     * smoothstep(0.08, 0.0, length(uv - vec2(cos(tearAngle), sin(tearAngle)) * tearDist))
                     * smoothstep(0.4, 0.02, dist)
                     * (1.0 + tearHash * 2.0);
    vec3 tearCol = mix(vec3(1.0), rankColor, 0.2) * tearBright * 5.0;

    // ── Rank-colored energy wisps (two layers) ────────────────────────────
    float wispMask1 = pow(max(0.0, warp),  2.2)
                    * smoothstep(0.5, 0.07, dist)
                    * (0.55 + 0.45 * sin(t * ps + dist * 14.0));
    float wispMask2 = pow(max(0.0, warp2), 2.0)
                    * smoothstep(0.45, 0.04, dist)
                    * (0.6 + 0.4 * cos(t * ps * 0.7 + dist * 9.0 + 1.5));
    // Third wisp layer from new turbulence
    float wispMask3 = pow(max(0.0, warp3), 2.5)
                    * smoothstep(0.42, 0.06, dist)
                    * (0.5 + 0.5 * sin(t * ps * 0.5 + dist * 11.0 + 3.0));
    vec3  wispCol = rankColor * (wispMask1 * 2.8 + wispMask2 * 1.4 + wispMask3 * 0.8);

    // ── Void sparkles – variable size ────────────────────────────────────
    float sparkGrid  = 88.0;
    float sparkTime  = floor(t * 2.0);
    float sparkHash  = hash(floor(vUv * sparkGrid + sparkTime));
    float sparkHash2 = hash(floor(vUv * sparkGrid * 0.5 + sparkTime + 3.7));
    float sparkle    = step(0.93, sparkHash) * smoothstep(0.44, 0.08, dist);
    float sparkBig   = step(0.97, sparkHash2) * smoothstep(0.40, 0.06, dist) * 1.8;
    vec3  sparkCol   = mix(vec3(0.6, 0.8, 1.0), rankColor, 0.45) * (sparkle + sparkBig) * 0.75;

    // ── Chromatic-aberrated rim ────────────────────────────────────────────
    float rimPeak = 0.44;
    float rimW    = 0.048;
    float rimPulse = 1.0 + 0.28 * sin(t * ps * 1.3);
    // Rim intensifies with approach
    float rimBoost = 1.0 + prog * 0.5;

    float rimR = exp(-pow((dist - rimPeak + 0.014) / (rimW * 0.9), 2.0));
    float rimG = exp(-pow((dist - rimPeak)          / rimW,         2.0));
    float rimB = exp(-pow((dist - rimPeak - 0.014) / (rimW * 1.1), 2.0));

    vec3 rimCol = vec3(
      mix(rankColor.r, 1.0, 0.35) * rimR,
      rankColor.g * rimG,
      mix(rankColor.b, 0.85, 0.3) * rimB
    ) * 8.5 * rimPulse * rimBoost;

    // Secondary inner rim for depth
    float rim2 = exp(-pow((dist - 0.30) / 0.065, 2.0)) * 0.55;
    vec3 rim2Col = rankColor * rim2 * 1.8 * (0.8 + 0.2 * sin(t * ps * 0.9));

    // ── Outer corona (beyond gate edge – reality fringe) ─────────────────
    float corona  = exp(-pow((dist - 0.505) / 0.07, 2.0));
    vec3  coronaCol = rankColor * corona * 2.0 * rimPulse * rimBoost;

    // ── Inward crack patterns ─────────────────────────────────────────────
    float cracks = 0.0;
    float numCk  = 14.0;
    for (float i = 0.0; i < 14.0; i++) {
      float crackAngle = i * 6.28318 / numCk + n1 * 0.9 + t * 0.018;
      float da = mod(abs(angle - crackAngle), 6.28318);
      da = min(da, 6.28318 - da);
      float crackW = 0.065 + dist * 0.04;
      float bright = smoothstep(crackW, 0.0, da)
                   * smoothstep(0.5, 0.14, dist)
                   * smoothstep(0.08, 0.44, dist);
      cracks += bright;
    }
    vec3 crackCol = mix(rankColor, vec3(1.0), 0.2) * cracks * 1.1;

    // ── Electric arcs – snapping lightning inside the void ────────────────
    float arcs = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
      float phase  = floor(t * 14.0 + i * 5.73);
      float active = step(0.60, hash(vec2(phase, i * 3.1)));
      if (active > 0.0) {
        float arcAngle = hash(vec2(phase + 0.5, i)) * 6.28318;
        float da       = mod(abs(angle - arcAngle), 6.28318);
        da             = min(da, 6.28318 - da);
        float bright   = pow(smoothstep(0.03, 0.0, da), 2.0)
                       * smoothstep(0.5,  0.02, dist)
                       * smoothstep(0.05, 0.46, dist);
        arcs += bright * (0.8 + hash1(phase + i) * 2.0);
      }
    }
    vec3 arcCol = mix(vec3(1.0, 1.0, 1.0), rankColor * 1.5, 0.15) * arcs * 7.0;

    // ── Composite ─────────────────────────────────────────────────────────
    vec3 finalColor = voidCol + wispCol + sparkCol + rimCol + rim2Col
                    + coronaCol + crackCol + arcCol + tearCol;

    // Alpha: inside gate opaque with smooth edge; corona has own alpha
    float innerAlpha  = smoothstep(0.5, 0.46, dist) * 0.97;
    float coronaAlpha = corona * 0.55;
    float alpha = max(innerAlpha, coronaAlpha);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
