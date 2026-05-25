/**
 * Portal Void Shader – Dynamic Multi-Style Premium Edition
 *
 * Provides 12 unique visual styles via the 'portalStyle' uniform
 * while maintaining a unified AAA portal foundation.
 */

export const islandVoidVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const islandVoidFrag = /* glsl */ `
  uniform vec3  primaryColor;
  uniform vec3  secondaryColor;
  uniform float time;
  uniform float pulseSpeed;
  uniform float progress;    // 0 = far, 1 = at gate
  uniform float portalStyle; // 0.0 to 11.0

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
      mix(hash(i), hash(i + vec2(1,0)), f.x),
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
  
  float fbm_sharp(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(1.7, 0.1, -1.0, 0.7);
    for (int i = 0; i < 4; i++) { v += a * abs(vnoise(p) * 2.0 - 1.0); p = rot * p; a *= 0.5; }
    return v;
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  void main() {
    vec2  uv   = vUv - 0.5;
    float t = time;
    int style = int(floor(portalStyle + 0.5));
    
    // Distort UVs to make the portal edge jagged and unstable
    float baseAngle = atan(uv.y, uv.x);
    float edgeNoise = fbm(vec2(baseAngle * 3.0, t * 1.2)) * 0.08;
    if (style == 5 || style == 11) edgeNoise *= 1.8; // More volatile
    if (style == 4 || style == 6) edgeNoise *= 0.4;  // Calmer
    
    // Apply noise primarily to the outer edges
    float distSq = dot(uv, uv);
    uv += normalize(uv) * edgeNoise * smoothstep(0.1, 0.35, distSq);

    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Extended disc: allow corona fringe outside gate ring
    if (dist > 0.60) discard;

    float ps = pulseSpeed;
    float prog = clamp(progress, 0.0, 1.0);
    
    // Speed modifiers
    float speedMult = 1.0;
    if (style == 4) speedMult = 0.6; // Charisma (calm)
    if (style == 6) speedMult = 0.3; // Sanctum (zen)
    if (style == 5) speedMult = 1.6; // Dungeons (aggressive)
    if (style == 11) speedMult = 1.4; // Challenges (volatile)
    
    t *= speedMult;

    // ── Heat distortion ring ───────────────────────────────────────────────
    float distortZone = smoothstep(0.38, 0.48, dist) * smoothstep(0.55, 0.44, dist);
    float distortAmt  = distortZone * (0.012 + prog * 0.008);
    float distortAngle = t * 3.7 + angle * 6.0 + dist * 12.0;
    
    // Style variation: Digital/Scanner distortion
    if (style == 8 || style == 9) {
      distortAmt *= step(0.5, fract(uv.y * 20.0 + t));
    }
    
    uv += vec2(sin(distortAngle), cos(distortAngle * 1.3)) * distortAmt;
    dist  = length(uv);
    angle = atan(uv.y, uv.x);

    // ── Void heartbeat ─────────────────────────────────────────────────────
    float heartbeat = 1.0 + sin(t * 1.88 * ps * 0.3) * (0.03 + prog * 0.06);
    float heartMask = smoothstep(0.35, 0.0, dist) * heartbeat;

    // ── Domain-warped swirl coords ───────────────────────────
    float parallax1 = 1.0 + prog * 0.6;
    float parallax2 = 1.0 - prog * 0.3;

    // Style variation: Flow shapes
    float swirl1 = angle + dist * 3.2 - t * 0.20 * ps * 0.5 * parallax1;
    float swirl2 = angle - dist * 2.8 + t * 0.14 * ps * 0.5 * parallax2;
    float swirl3 = angle * 1.5 + dist * 1.8 - t * 0.08 * ps * 0.5;
    
    if (style == 4 || style == 6) { // Smooth, less twist
      swirl1 = angle + dist * 1.5 - t * 0.1;
      swirl2 = angle - dist * 1.2 + t * 0.08;
    } else if (style == 0 || style == 2) { // Angular / rigid
      swirl1 = floor(angle * 4.0) / 4.0 + dist * 2.0 - t * 0.2;
    }

    vec2 warpUV  = vec2(cos(swirl1) * dist * 5.0, sin(swirl2) * dist * 5.0);
    vec2 warpUV2 = vec2(cos(swirl3) * dist * 3.0, sin(swirl3) * dist * 3.0);

    float n1, n2, warp, warp2, warp3;
    
    if (style == 0 || style == 5 || style == 11) {
      // Sharper noise for equipment, dungeons, challenges
      n1 = fbm_sharp(warpUV  - t * 0.06 * parallax1);
      n2 = fbm_sharp(warpUV  + vec2(2.3, 1.7) + n1 * 1.8 - t * 0.04);
      warp = fbm_sharp(warpUV  + n2 * 1.4 + t * 0.03);
    } else {
      n1 = fbm(warpUV  - t * 0.06 * parallax1);
      n2 = fbm(warpUV  + vec2(2.3, 1.7) + n1 * 1.8 - t * 0.04);
      warp = fbm(warpUV  + n2 * 1.4 + t * 0.03);
    }
    
    warp2 = fbm(warpUV2 + t * 0.025 * parallax2);

    vec2 warpUV3 = vec2(sin(angle * 2.3 + t * 0.05) * dist * 4.0,
                        cos(angle * 1.7 - t * 0.07) * dist * 4.0);
    warp3 = fbm(warpUV3 + warp * 0.8 + t * 0.02);
    
    // ── Style-specific Overlays ───────────────────────────────────────────
    float overlay = 0.0;
    vec3 overlayCol = vec3(0.0);
    
    // Stats (8) - Scanlines
    if (style == 8) {
       overlay = step(0.8, sin(uv.y * 60.0 - t * 10.0)) * 0.1;
       overlayCol = secondaryColor * overlay;
    }
    // Analytics (9) - Radar rings
    if (style == 9) {
       float ring = step(0.95, sin(dist * 40.0 - t * 3.0));
       overlay = ring * smoothstep(0.4, 0.0, dist) * 0.5;
       overlayCol = secondaryColor * overlay;
    }
    // Sanctum (6) - Concentric calm ripples
    if (style == 6) {
       overlay = sin(dist * 20.0 - t * 2.0) * 0.5 + 0.5;
       overlayCol = primaryColor * overlay * 0.2 * smoothstep(0.4, 0.1, dist);
    }
    // Jobs (2) - Runic Grid
    if (style == 2) {
       float grid = step(0.9, sin(uv.x * 30.0)) + step(0.9, sin(uv.y * 30.0));
       overlayCol = secondaryColor * grid * 0.15 * smoothstep(0.4, 0.1, dist);
    }

    // ── Deep void ─────────────────────────────────────────────────────────
    float voidDepth  = smoothstep(0.45, 0.0, dist);
    float voidNebula = warp * warp2 * 0.8 + warp3 * 0.3;
    float depthDarken = 1.0 - prog * 0.7;

    // Base background colors
    vec3 bgBase = vec3(0.0, 0.005, 0.02);
    if (style == 1) bgBase = vec3(0.0, 0.0, 0.0); // Shadows: pitch black
    if (style == 10) bgBase = vec3(0.02, 0.01, 0.0); // Achievements: warm dark
    
    vec3 voidCol = bgBase * voidDepth * depthDarken
                 + primaryColor * 0.15 * voidNebula * voidDepth
                 + secondaryColor * 0.1 * warp2 * voidDepth
                 + primaryColor * heartMask * 0.3;

    // ── Dimensional tear flashes ───────────────────────────────────────────
    float tearFreq = ps * (style == 5 || style == 11 ? 1.2 : 0.6); // more tears for volatile
    float tearTime = floor(t * tearFreq * 4.0);
    float tearHash = hash(vec2(tearTime, tearTime * 0.7));
    float tearActive = step(0.65 - prog * 0.2, tearHash);
    
    if (style == 4 || style == 6) tearActive = 0.0; // no tears for calm portals
    
    float tearAngle = tearHash * 6.28318;
    float tearDist  = hash(vec2(tearTime + 1.0, 0.0)) * 0.25;
    float tearBright = tearActive
                     * smoothstep(0.08, 0.0, length(uv - vec2(cos(tearAngle), sin(tearAngle)) * tearDist))
                     * smoothstep(0.4, 0.02, dist)
                     * (1.0 + tearHash * 2.0);
    vec3 tearCol = mix(vec3(1.0), secondaryColor, 0.2) * tearBright * 5.0;

    // ── Wisp layers ───────────────────────────────────────────────────────
    float wispMask1 = pow(max(0.0, warp),  2.2) * smoothstep(0.5, 0.07, dist) * (0.55 + 0.45 * sin(t * ps + dist * 14.0));
    float wispMask2 = pow(max(0.0, warp2), 2.0) * smoothstep(0.45, 0.04, dist) * (0.6 + 0.4 * cos(t * ps * 0.7 + dist * 9.0 + 1.5));
    float wispMask3 = pow(max(0.0, warp3), 2.5) * smoothstep(0.42, 0.06, dist) * (0.5 + 0.5 * sin(t * ps * 0.5 + dist * 11.0 + 3.0));
    
    vec3 wispCol = primaryColor * wispMask1 * 2.8 
                 + secondaryColor * wispMask2 * 1.8 
                 + primaryColor * wispMask3 * 0.8;

    // ── Void sparkles ─────────────────────────────────────────────────────
    float sparkGrid  = 88.0;
    float sparkTime  = floor(t * 2.0);
    float sparkHash  = hash(floor(vUv * sparkGrid + sparkTime));
    float sparkHash2 = hash(floor(vUv * sparkGrid * 0.5 + sparkTime + 3.7));
    
    // Sparkle intensity based on style
    float sparkThresh = 0.93;
    float sparkBoost = 1.0;
    if (style == 3 || style == 10) { sparkThresh = 0.85; sparkBoost = 2.5; } // Shop/Achievements (lots of gold)
    if (style == 7) { sparkThresh = 0.88; sparkBoost = 1.5; } // Story (stars)
    if (style == 1 || style == 5) { sparkThresh = 0.98; } // Shadows/Dungeons (almost none)

    float sparkle    = step(sparkThresh, sparkHash) * smoothstep(0.44, 0.08, dist);
    float sparkBig   = step(sparkThresh + 0.04, sparkHash2) * smoothstep(0.40, 0.06, dist) * 1.8;
    vec3  sparkCol   = mix(vec3(1.0), secondaryColor, 0.45) * (sparkle + sparkBig) * sparkBoost;
    
    // Shadows (1) - "Eyes in the dark" effect
    if (style == 1) {
       float eyeHash = hash(floor(vUv * 30.0 + t * 0.5));
       float eyes = step(0.98, eyeHash) * smoothstep(0.4, 0.1, dist);
       sparkCol += vec3(0.1, 0.2, 1.0) * eyes * 4.0 * (0.5 + 0.5 * sin(t * 5.0 + eyeHash * 10.0));
    }

    // ── Chromatic-aberrated rim ────────────────────────────────────────────
    float rimPeak = 0.44;
    float rimW    = 0.048;
    float rimPulse = 1.0 + 0.28 * sin(t * ps * 1.3);
    float rimBoost = 1.0 + prog * 0.5;

    float rimR = exp(-pow((dist - rimPeak + 0.014) / (rimW * 0.9), 2.0));
    float rimG = exp(-pow((dist - rimPeak)          / rimW,         2.0));
    float rimB = exp(-pow((dist - rimPeak - 0.014) / (rimW * 1.1), 2.0));

    vec3 rimCol = vec3(
      mix(primaryColor.r, 1.0, 0.35) * rimR,
      mix(primaryColor.g, secondaryColor.g, 0.5) * rimG,
      mix(primaryColor.b, 0.85, 0.3) * rimB
    ) * 8.5 * rimPulse * rimBoost;

    float rim2 = exp(-pow((dist - 0.30) / 0.065, 2.0)) * 0.55;
    vec3 rim2Col = secondaryColor * rim2 * 1.8 * (0.8 + 0.2 * sin(t * ps * 0.9));

    // ── Outer corona ───────────────────────────────────────────────────────
    float corona  = exp(-pow((dist - 0.505) / 0.07, 2.0));
    vec3  coronaCol = primaryColor * corona * 2.0 * rimPulse * rimBoost;

    // ── Inward crack patterns ─────────────────────────────────────────────
    float cracks = 0.0;
    float numCk  = 14.0;
    
    // Calm styles have fewer/no cracks
    if (style == 4 || style == 6 || style == 7) numCk = 0.0;
    if (style == 5 || style == 11) numCk = 24.0; // Aggressive styles have more
    
    for (float i = 0.0; i < 24.0; i++) {
      if (i >= numCk) break;
      float crackAngle = i * 6.28318 / numCk + n1 * 0.9 + t * 0.018;
      float da = mod(abs(angle - crackAngle), 6.28318);
      da = min(da, 6.28318 - da);
      float crackW = 0.065 + dist * 0.04;
      float bright = smoothstep(crackW, 0.0, da)
                   * smoothstep(0.5, 0.14, dist)
                   * smoothstep(0.08, 0.44, dist);
      cracks += bright;
    }
    vec3 crackCol = mix(primaryColor, vec3(1.0), 0.2) * cracks * 1.1;

    // ── Electric arcs ─────────────────────────────────────────────────────
    float arcs = 0.0;
    float numArcs = 8.0;
    if (style == 4 || style == 6 || style == 7) numArcs = 0.0; // Calm
    if (style == 5 || style == 11) numArcs = 14.0; // Lightning-heavy
    
    for (float i = 0.0; i < 14.0; i++) {
      if (i >= numArcs) break;
      float phase  = floor(t * 14.0 + i * 5.73);
      float isActiveArc = step(0.60, hash(vec2(phase, i * 3.1)));
      if (isActiveArc > 0.0) {
        float arcAngle = hash(vec2(phase + 0.5, i)) * 6.28318;
        float da       = mod(abs(angle - arcAngle), 6.28318);
        da             = min(da, 6.28318 - da);
        float bright   = pow(smoothstep(0.03, 0.0, da), 2.0)
                       * smoothstep(0.5,  0.02, dist)
                       * smoothstep(0.05, 0.46, dist);
        arcs += bright * (0.8 + hash1(phase + i) * 2.0);
      }
    }
    vec3 arcCol = mix(vec3(1.0, 1.0, 1.0), secondaryColor * 1.5, 0.15) * arcs * 7.0;

    // ── Composite ─────────────────────────────────────────────────────────
    vec3 finalColor = voidCol + wispCol + sparkCol + rimCol + rim2Col
                    + coronaCol + crackCol + arcCol + tearCol + overlayCol;

    float innerAlpha  = smoothstep(0.5, 0.46, dist) * 0.97;
    float coronaAlpha = corona * 0.55;
    float alpha = max(innerAlpha, coronaAlpha);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
