import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Html } from "@react-three/drei";
import * as THREE from "three";
import { islandVoidVert, islandVoidFrag } from "../../3d/shaders/islandPortalVoid.js";
import {
  CHA_ICONS,
  GATE_ICONS,
  ITEM_ICONS,
  NAV_ICONS,
  SHADOW_ICONS,
  STAT_ICONS,
  STORY_ICONS,
} from "../../data/icons.js";
import { getPremiumFeatureForRoute } from "../../data/premium.js";

const clampNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hexToRgba = (hex, alpha) => {
  const clean = String(hex || "#22d3ee").replace("#", "");
  if (clean.length !== 6) return `rgba(34,211,238,${alpha})`;
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

// ── Signature Abyssal Sovereign palette (unified across all gates) ──────────
const SIGNATURE_VIOLET = "#7c3aed";
const SIGNATURE_VIOLET_LIGHT = "#a78bfa";
const PORTAL_VOID_COLOR = new THREE.Color(SIGNATURE_VIOLET);
const LOCKED_GATE_COLOR = "#3b4658";
const PREMIUM_GATE_COLOR = "#c98a2b";
const HUNTER_ISLAND_MODE_KEY = "sl-hunter-island-mode";
const ONBOARDING_PORTAL_MODE_STEPS = new Set([
  "explain_portal_mode",
  "try_swipe_portal",
  "try_swipe_portal_back",
  "switch_to_apps",
  "open_hunter_stats",
]);
const ONBOARDING_APPS_MODE_STEPS = new Set([
  "explain_app_grid",
  "switch_to_portal",
  "tier3_open_island",
  "tier3_open_achievements",
  "tier5_open_island",
  "tier5_open_shadows",
  "tier6_open_island",
  "tier6_open_jobs",
  "tier7_open_island",
  "tier7_open_soullink",
]);
const ONBOARDING_STATS_PORTAL_STEPS = new Set([
  "explain_portal_mode",
  "open_hunter_stats",
]);

// Reuse the app's AAA portal-void shader (also used by the login tunnel &
// dungeon gates). Registered under a unique name so it does not collide with
// the `portalMaterial` registered by DungeonGate3D.
const IslandPortalMaterial = shaderMaterial(
  { primaryColor: new THREE.Color(SIGNATURE_VIOLET), secondaryColor: new THREE.Color(SIGNATURE_VIOLET_LIGHT), time: 0, pulseSpeed: 2.4, progress: 0.34, portalStyle: 0.0 },
  islandVoidVert,
  islandVoidFrag
);
extend({ IslandPortalMaterial });

const wrapIndex = (index, length) => {
  if (!length) return 0;
  return (index + length) % length;
};

function LockGlyph({ size = 9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return reducedMotion;
}

function useLowPowerMode() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const cores = Number(navigator.hardwareConcurrency || 8);
    const memory = Number(navigator.deviceMemory || 8);
    const isTouchDevice = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;
    return isTouchDevice || cores <= 4 || memory <= 4;
  }, []);
}

function useHunterIslandMode() {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "portal";
    try {
      return window.localStorage.getItem(HUNTER_ISLAND_MODE_KEY) === "apps" ? "apps" : "portal";
    } catch {
      return "portal";
    }
  });

  const updateMode = useCallback((nextMode) => {
    const normalized = nextMode === "apps" ? "apps" : "portal";
    setMode(normalized);
    try {
      window.localStorage.setItem(HUNTER_ISLAND_MODE_KEY, normalized);
    } catch {
      // Local storage is optional; the visible toggle should still work.
    }
  }, []);

  return [mode, updateMode];
}

// ── Cosmic Background (replaces FloatingParticles) ──────────────────────────
function CosmicBackground({ count, reducedMotion, portalColor }) {
  const pointsRef1 = useRef(null);
  const pointsRef2 = useRef(null);
  const pointsRef3 = useRef(null);

  const { geo1, geo2, geo3 } = useMemo(() => {
    const makeLayer = (num, rMin, rMax) => {
      const positions = new Float32Array(num * 3);
      for (let i = 0; i < num; i++) {
        // Spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = rMin + Math.random() * (rMax - rMin);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const buffer = new THREE.BufferGeometry();
      buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      return buffer;
    };
    return {
      geo1: makeLayer(200, 8, 15), // Distant stars
      geo2: makeLayer(80, 4, 8),   // Mid nebula
      geo3: makeLayer(40, 2, 4),   // Near particles
    };
  }, []);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    if (pointsRef1.current) pointsRef1.current.rotation.y = t * 0.003;
    if (pointsRef2.current) {
      pointsRef2.current.rotation.y = t * 0.008;
      pointsRef2.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (pointsRef3.current) {
      pointsRef3.current.rotation.y = t * 0.015;
      pointsRef3.current.rotation.z = Math.cos(t * 0.15) * 0.1;
      if (pointsRef3.current.material) {
        pointsRef3.current.material.opacity = 0.4 + Math.sin(t * 1.5) * 0.2;
      }
    }
  });

  return (
    <group>
      {/* Distant stars */}
      <points ref={pointsRef1} geometry={geo1}>
        <pointsMaterial color="#ffffff" size={0.015} transparent opacity={0.6} depthWrite={false} toneMapped={false} />
      </points>
      {/* Mid nebula */}
      <points ref={pointsRef2} geometry={geo2}>
        <pointsMaterial color={portalColor || SIGNATURE_VIOLET_LIGHT} size={0.04} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {/* Near particles */}
      <points ref={pointsRef3} geometry={geo3}>
        <pointsMaterial color={portalColor || SIGNATURE_VIOLET} size={0.06} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      
      {/* Background Nebula Planes */}
      <mesh position={[0, 0, -8]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color={portalColor || SIGNATURE_VIOLET} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Soft additive glow discs behind a gate (fake bloom under ACES) ──────────
function GateGlow({ selected, dim, color }) {
  const radii = selected ? [1.8, 1.3, 0.95] : [1.3, 0.95];
  const ops = selected ? [0.035, 0.05, 0.075] : [0.02, 0.03];
  return (
    <group position={[0, 0, -0.22]}>
      {radii.map((r, i) => (
        <mesh key={i} position={[0, 0, -i * 0.05]}>
          <circleGeometry args={[r, 64]} />
          <meshBasicMaterial
            color={color || SIGNATURE_VIOLET}
            transparent
            opacity={dim ? ops[i] * 0.4 : ops[i]}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Full AAA shader void — only the centred/selected gate pays for this ─────
function PortalVoid({ reducedMotion, portal }) {
  const matRef = useRef(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.time = reducedMotion ? 0.6 : clock.getElapsedTime();
  });
  return (
    <mesh position={[0, 0, 0.012]}>
      <circleGeometry args={[0.98, 96]} />
      <islandPortalMaterial
        ref={matRef}
        primaryColor={new THREE.Color(portal?.color || SIGNATURE_VIOLET)}
        secondaryColor={new THREE.Color(portal?.secondaryColor || portal?.color || SIGNATURE_VIOLET_LIGHT)}
        portalStyle={portal?.styleIndex || 0}
        time={0}
        pulseSpeed={2.4}
        progress={0.34}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Cheap void for off-centre gates (dark well + faint violet bloom) ────────
function PortalVoidCheap({ dim, color }) {
  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.94, 48]} />
        <meshBasicMaterial color="#020208" transparent opacity={0.94} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.9, 48]} />
        <meshBasicMaterial
          color={color || SIGNATURE_VIOLET}
          transparent
          opacity={dim ? 0.06 : 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function PortalGate({ offset, index, selected, locked, premiumLocked, reducedMotion, onSelect, portal }) {
  const groupRef = useRef(null);
  const lightRef = useRef(null);
  const gated = locked || premiumLocked;
  const gateColor = locked ? LOCKED_GATE_COLOR : premiumLocked ? PREMIUM_GATE_COLOR : (portal?.color || SIGNATURE_VIOLET);
  const side = Math.sign(offset);
  const distance = Math.abs(offset);
  const target = useMemo(() => {
    const angle = offset * 0.38; // 3D Circle spacing
    const radius = 4.8;
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - radius;
    const y = 0.25 - distance * 0.08;
    
    return {
      position: new THREE.Vector3(x, selected ? y + 0.1 : y, z),
      scale: selected ? 0.9 : Math.max(0.45, 0.75 - distance * 0.15),
      rotationY: -angle,
      rotationX: selected ? 0 : 0.05
    };
  }, [distance, offset, selected]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      if (reducedMotion) {
        groupRef.current.position.copy(target.position);
        groupRef.current.scale.setScalar(target.scale);
        groupRef.current.rotation.set(target.rotationX, target.rotationY, 0);
      } else {
        const g = groupRef.current;
        const lambda = 5; // Smooth enough to see the arc movement clearly

        g.position.x = THREE.MathUtils.damp(g.position.x, target.position.x, lambda, delta);
        g.position.y = THREE.MathUtils.damp(g.position.y, target.position.y, lambda, delta);
        g.position.z = THREE.MathUtils.damp(g.position.z, target.position.z, lambda, delta);

        const breath = Math.sin(t * 1.5 + index) * (selected ? 0.012 : 0.005);
        const targetScale = target.scale + breath;
        const s = THREE.MathUtils.damp(g.scale.x, targetScale, lambda, delta);
        g.scale.set(s, s, s);

        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target.rotationY, lambda, delta);
        g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target.rotationX, lambda, delta);
      }
    }
    if (lightRef.current) {
      const base = gated ? (locked ? 0.35 : 0.7) : selected ? 5.2 : 1.5;
      const flicker = reducedMotion || gated ? 0 : Math.sin(t * 1.7 + index) * (selected ? 1.0 : 0.25);
      lightRef.current.intensity = base + flicker;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[offset * 1.8, selected ? 0.35 : 0.15, -distance * 0.8]}
      scale={selected ? 0.9 : Math.max(0.55, 0.7 - distance * 0.15)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
    >
      <GateGlow selected={selected} dim={gated} color={gateColor} />
      {(!gated && distance <= 1) ? <PortalVoid reducedMotion={reducedMotion} portal={portal} /> : <PortalVoidCheap dim={gated} color={gateColor} />}

      {/* Gate light */}
      <pointLight ref={lightRef} color={gated ? gateColor : SIGNATURE_VIOLET} intensity={1.5} distance={6} decay={2} position={[0, 0, 0.6]} />
    </group>
  );
}

function HallArchitecture({ reducedMotion, portalColor }) {
  const floorRef = useRef(null);
  const haloRef = useRef(null);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    if (floorRef.current) floorRef.current.rotation.z = t * 0.02;
    if (haloRef.current) haloRef.current.rotation.z = -t * 0.03;
  });

  return (
    <group position={[0, -1.4, -0.7]}>
      {/* Dark reflective floor slab */}
      <mesh position={[0, -1.32, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#020204" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* Floor accent rings */}
      <mesh ref={floorRef} position={[0, -1.28, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 3.4, 160]} />
        <meshBasicMaterial color={portalColor || SIGNATURE_VIOLET} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef} position={[0, -1.27, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 3.62, 120]} />
        <meshBasicMaterial color={portalColor || SIGNATURE_VIOLET_LIGHT} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PortalScene({ portals, selectedIndex, onSelect, direction, entering, reducedMotion, lowPower }) {
  const sceneRef = useRef(null);
  const cameraRigRef = useRef(null);
  const visiblePortals = useMemo(() => {
    if (!portals.length) return [];
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const index = wrapIndex(selectedIndex + offset, portals.length);
      return { portal: portals[index], index, offset };
    });
  }, [portals, selectedIndex]);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const enterPush = entering ? 0.9 : 0;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.04); // No wobble!
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, entering ? 0.12 : 0.18 + Math.sin(t * 0.4) * (reducedMotion ? 0 : 0.02), 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, entering ? 5.35 : 6.8 - enterPush, 0.05);
    camera.lookAt(0, -0.04, -0.85);
    
    if (sceneRef.current) {
      sceneRef.current.rotation.y = THREE.MathUtils.lerp(sceneRef.current.rotation.y, 0, 0.08); // Ensure it's centered
    }
    
    if (cameraRigRef.current && !reducedMotion) {
      cameraRigRef.current.position.y = Math.sin(t * 0.3) * 0.015;
    }
  });

  return (
    <group ref={cameraRigRef}>
      <fog attach="fog" args={["#020205", 3.5, 9]} />
      <ambientLight intensity={0.15} color="#1a1330" />
      {/* Key light (violet) */}
      <pointLight position={[0, 1.8, 3.0]} intensity={6.2} color={SIGNATURE_VIOLET_LIGHT} distance={22} decay={2} />
      {/* Cool rim from upper-left */}
      <pointLight position={[-2.8, 1.6, 0.4]} intensity={2.6} color="#4f46e5" distance={18} decay={2} />
      {/* Soft warm kicker for separation */}
      <pointLight position={[2.8, 0.6, 1.0]} intensity={1.3} color="#c4b5fd" distance={14} decay={2} />
      {/* Deep fill behind camera */}
      <pointLight position={[0, -0.4, 6]} intensity={0.5} color="#1a0a3a" distance={16} decay={2} />
      {/* Backlight for distant portals */}
      <pointLight position={[0, -0.5, -6]} intensity={3.5} color={SIGNATURE_VIOLET} distance={15} decay={2} />
      
      <spotLight position={[0, 3.1, 2.2]} angle={0.5} penumbra={0.9} intensity={5.0} color={SIGNATURE_VIOLET} target-position={[0, -0.6, -1]} />
      
      <HallArchitecture reducedMotion={reducedMotion} portalColor={portals[selectedIndex]?.color} />
      <group ref={sceneRef}>
        {visiblePortals.map(({ portal, index, offset }) => (
          <PortalGate
            key={portal.key}
            index={index}
            offset={offset}
            selected={offset === 0}
            locked={!!portal.locked}
            premiumLocked={!!portal.premiumLocked}
            reducedMotion={reducedMotion}
            portal={portal}
            onSelect={onSelect}
          />
        ))}
      </group>
      <CosmicBackground count={lowPower ? 36 : 64} reducedMotion={reducedMotion} portalColor={portals[selectedIndex]?.color} />
    </group>
  );
}

function IslandModeButton({ mode, onModeChange }) {
  const nextMode = mode === "portal" ? "apps" : "portal";
  const label = mode === "portal" ? "Apps" : "Portal";
  return (
    <button
      type="button"
      className={`hi-mode-toggle hi-mode-toggle--${nextMode}`}
      data-tutorial="mode-toggle"
      aria-label={`Zur ${label}-Ansicht wechseln`}
      onClick={() => onModeChange(nextMode)}
    >
      <span className="hi-mode-toggle__glyph" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <strong>{label}</strong>
    </button>
  );
}

function IslandTopBar({ briefing, mode, onModeChange }) {
  return (
    <div className="hi-topbar" data-tutorial="island-topbar">
      <IslandModeButton mode={mode} onModeChange={onModeChange} />
      <div className="hi-mobile-header">
        <div>
          <h1>Hunter-Insel</h1>
          <span>{briefing}</span>
        </div>
      </div>
    </div>
  );
}

function PortalHud({
  allModules,
  briefing,
  enteringPortal,
  level,
  mode,
  movePortal,
  onModeChange,
  rank,
  selectedPortal,
  selectedPortalIndex,
  selectedPortalLockedText,
  setSelectedPortalIndex,
  handlePortalEnter,
}) {
  const normalizedIndex = wrapIndex(selectedPortalIndex, allModules.length);
  const railRef = useRef(null);

  useEffect(() => {
    if (railRef.current) {
      const activeDot = railRef.current.children[normalizedIndex];
      if (activeDot) {
        activeDot.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [normalizedIndex]);

  return (
    <div className="hi-hero__hud hi-portal-hud">
      <IslandTopBar briefing={briefing} mode={mode} onModeChange={onModeChange} />

      <div className="hi-portal-bottom" data-tutorial="portal-hud">
        <div className="hi-selected-portal">
          <span className="hi-selected-portal__index">
            {String(normalizedIndex + 1).padStart(2, "0")} / {String(allModules.length).padStart(2, "0")}
          </span>
          <img src={selectedPortal?.iconSrc} alt="" aria-hidden="true" />
          <div>
            <strong>{selectedPortal?.label}</strong>
            <span>{selectedPortalLockedText}</span>
          </div>
          {selectedPortal?.locked ? (
            <span className="hi-portal-tag hi-portal-tag--locked">
              <LockGlyph size={9} /> Lv. {selectedPortal.unlockLevel}
            </span>
          ) : selectedPortal?.premiumLocked ? (
            <span className="hi-portal-tag hi-portal-tag--pro">
              <LockGlyph size={9} /> PRO
            </span>
          ) : null}
        </div>

        <div className="hi-portal-controls" aria-label="Portal-Steuerung">
          <button type="button" className="hi-portal-arrow hi-portal-arrow--left" data-tutorial="portal-arrow-left" aria-label="Vorheriges Portal" onClick={() => movePortal(-1)}>
            <span aria-hidden="true" />
          </button>
          <button
            type="button"
            className={[
              "hi-portal-enter",
              (selectedPortal?.premiumLocked && !selectedPortal?.locked) ? "hi-portal-enter--pro" : "",
            ].filter(Boolean).join(" ")}
            data-tutorial="portal-enter-btn"
            disabled={selectedPortal?.locked || !!enteringPortal}
            onClick={handlePortalEnter}
          >
            {selectedPortal?.locked
              ? selectedPortalLockedText
              : selectedPortal?.premiumLocked
                ? "Mit PRO freischalten"
                : "Portal betreten"}
          </button>
          <button type="button" className="hi-portal-arrow hi-portal-arrow--right" data-tutorial="portal-arrow-right" aria-label="Naechstes Portal" onClick={() => movePortal(1)}>
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="hi-portal-rail" role="tablist" aria-label="Portale" ref={railRef}>
          {allModules.map((portal, index) => {
            const selected = index === normalizedIndex;
            const premium = portal.premiumLocked && !portal.locked;
            return (
              <button
                key={`${portal.key}-${index}`}
                type="button"
                role="tab"
                aria-selected={selected}
                className={[
                  "hi-portal-dot",
                  selected ? "hi-portal-dot--active" : "",
                  portal.locked ? "hi-portal-dot--locked" : "",
                  premium ? "hi-portal-dot--premium" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelectedPortalIndex(index)}
              >
                <img src={portal.iconSrc} alt="" aria-hidden="true" />
                <span>{portal.label}</span>
                {portal.locked && (
                  <i className="hi-portal-dot__flag hi-portal-dot__flag--locked" aria-hidden="true"><LockGlyph size={7} /></i>
                )}
                {premium && (
                  <i className="hi-portal-dot__flag hi-portal-dot__flag--pro" aria-hidden="true">PRO</i>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AppLauncherView({
  appSections,
  briefing,
  level,
  launchingModule,
  mode,
  onActivate,
  onModeChange,
  rank,
}) {
  const lastActivationRef = useRef({ key: null, at: 0 });
  const activateTile = useCallback((item) => {
    if (!item) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = lastActivationRef.current;
    if (last.key === item.key && now - last.at < 360) return;
    lastActivationRef.current = { key: item.key, at: now };
    onActivate(item);
  }, [onActivate]);

  return (
    <div className="hi-apps-view">
      <IslandTopBar briefing={briefing} mode={mode} onModeChange={onModeChange} />

      <div className="hi-apps-content" data-tutorial="apps-grid">
        <div className="hi-apps-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="hi-apps-shell">
          {appSections.map((section, sectionIndex) => (
            <section
              className="hi-app-section"
              key={section.key}
              style={{ animationDelay: `${sectionIndex * 60}ms` }}
            >
              <div className="hi-app-section__header">
                <span>{section.title}</span>
                <i aria-hidden="true" />
              </div>
              <div className="hi-app-grid">
                {section.items.map((item, itemIndex) => {
                  const disabled = !!item.locked;
                  const premiumLocked = !!item.premiumLocked;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-tutorial={`system-${item.key}`}
                      className={[
                        "hi-app-tile",
                        disabled ? "hi-app-tile--locked" : "",
                        premiumLocked ? "hi-app-tile--premium" : "",
                      ].filter(Boolean).join(" ")}
                      style={{ "--tile": item.color, animationDelay: `${sectionIndex * 70 + itemIndex * 24}ms` }}
                      disabled={disabled}
                      onClick={() => activateTile(item)}
                      onPointerUp={(event) => {
                        if (event.pointerType === "mouse" && event.button !== 0) return;
                        activateTile(item);
                      }}
                      onMouseUp={(event) => {
                        if (event.button !== 0) return;
                        activateTile(item);
                      }}
                      onTouchEnd={() => activateTile(item)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        activateTile(item);
                      }}
                    >
                      <span className="hi-app-tile__icon">
                        <img src={item.iconSrc} alt="" aria-hidden="true" />
                        {disabled && <span className="hi-app-tile__iconflag" aria-hidden="true"><LockGlyph size={9} /></span>}
                        {!disabled && !premiumLocked && item.badge > 0 && <span className="hi-app-tile__badge">{item.badge}</span>}
                      </span>
                      {premiumLocked && !disabled && (
                        <span className="hi-app-tile__pro" aria-hidden="true"><LockGlyph size={8} /> PRO</span>
                      )}
                      <span className="hi-app-tile__label">{item.label}</span>
                      <span className="hi-app-tile__meta">
                        {disabled ? `Lv. ${item.unlockLevel}` : premiumLocked ? "Pro-Zugang" : item.meta || "Online"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {launchingModule && (
        <div className="hi-app-launch" aria-hidden="true" style={{ "--tile": launchingModule.color || SIGNATURE_VIOLET }}>
          <img src={launchingModule.iconSrc} alt="" />
          <span>{launchingModule.label}</span>
        </div>
      )}
    </div>
  );
}

function PortalTransitionOverlay({ portal }) {
  if (!portal) return null;
  return (
    <div className="hi-portal-jump" aria-hidden="true" style={{ "--portal-color": SIGNATURE_VIOLET }}>
      <div className="hi-portal-jump__tunnel" />
      <div className="hi-portal-jump__ring hi-portal-jump__ring--outer" />
      <div className="hi-portal-jump__ring hi-portal-jump__ring--inner" />
      <div className="hi-portal-jump__core">
        <img src={portal.iconSrc} alt="" />
        <span>{portal.label}</span>
      </div>
      <div className="hi-portal-jump__flash" />
    </div>
  );
}

export default function HunterIslandHub({
  state,
  can,
  tr,
  theme,
  rank,
  activeDungeons = [],
  filteredQuests = [],
  namedShadows = [],
  catalogAchievements = [],
  achUnlocked = [],
  premiumStatus,
  navigateToWithAccess,
  openPremiumModal,
  onOpenCharisma,
  onOpenSoulLink,
  shellTopOffset = 0,
  shellBottomOffset = 0,
  tutorialStepId = null,
}) {
  // Unified Abyssal Sovereign violet for the whole island (overrides theme tint).
  const accent = SIGNATURE_VIOLET;
  const glow = hexToRgba(SIGNATURE_VIOLET, 0.42);
  const inventory = state?.equipment?.inventory || [];
  const slots = state?.equipment?.slots || {};
  const openQuests = filteredQuests.filter((quest) => !quest.completed).length;
  const readyAchievements = catalogAchievements.filter((achievement) => {
    if (achUnlocked.includes(achievement.id)) return false;
    try {
      return achievement.check(state);
    } catch {
      return false;
    }
  }).length;
  const equippedCount = Object.values(slots).filter(Boolean).length;
  const level = clampNumber(state?.level, 1);
  const reducedMotion = usePrefersReducedMotion();
  const lowPower = useLowPowerMode();
  const [hunterIslandMode, setHunterIslandMode] = useHunterIslandMode();
  const transitionTimerRef = useRef(null);
  const launchTimerRef = useRef(null);
  const [launchingModule, setLaunchingModule] = useState(null);
  const onlineFeatureCount = [
    "stats_view",
    "analytics",
    "achievements",
    "challenges",
    "shadow_army",
    "equipment",
    "jobs",
    "shop",
    "charisma_dungeons",
    "story",
    "sanctum",
    "dungeons",
  ].filter((feature) => can(feature)).length;

  const levelLockedText = useCallback((unlockLevel) => tr("systemHub.levelLocked", { level: unlockLevel }), [tr]);

  const decorateItem = useCallback((item) => {
    const premiumFeature = getPremiumFeatureForRoute(item.routeKey || item.key);
    return {
      ...item,
      premiumFeature,
      premiumLocked: !!premiumFeature && !premiumStatus?.active,
    };
  }, [premiumStatus?.active]);

  const navKeys = state?.navbarConfig?.tabs || ["dashboard", "training", "dungeon", "analytics", "system"];

  const sections = useMemo(() => {
    const intel = [
      {
        key: "stats",
        iconSrc: STAT_ICONS.str,
        label: tr("systemHub.stats.label"),
        color: "#f87171",
        badge: state?.statPoints > 0 ? state.statPoints : 0,
        meta: state?.statPoints > 0 ? `${state.statPoints} Punkte bereit` : `Rang ${rank?.name || "-"}`,
      },
      can("analytics")
        ? {
          key: "analytics",
          iconSrc: NAV_ICONS.analytics,
          label: tr("systemHub.analytics.label"),
          color: "#22d3ee",
          meta: `${openQuests} Quests im Scan`,
        }
        : {
          key: "analytics",
          iconSrc: NAV_ICONS.analytics,
          label: tr("systemHub.analytics.label"),
          color: "#22d3ee",
          locked: true,
          unlockLevel: 8,
          meta: "",
        },
      can("achievements")
        ? {
          key: "achievements",
          iconSrc: NAV_ICONS.achievements,
          label: tr("systemHub.achievements.label"),
          color: "#facc15",
          badge: readyAchievements,
          meta: readyAchievements > 0 ? `${readyAchievements} bereit` : `${achUnlocked.length}/${catalogAchievements.length}`,
        }
        : {
          key: "achievements",
          iconSrc: NAV_ICONS.achievements,
          label: tr("systemHub.achievements.label"),
          color: "#facc15",
          locked: true,
          unlockLevel: 8,
          meta: "",
        },
      can("challenges")
        ? {
          key: "challenges",
          iconSrc: NAV_ICONS.events,
          label: tr("systemHub.challenges.label"),
          color: "#fb923c",
          meta: "World Events",
        }
        : {
          key: "challenges",
          iconSrc: NAV_ICONS.events,
          label: tr("systemHub.challenges.label"),
          color: "#fb923c",
          locked: true,
          unlockLevel: 21,
          meta: "",
        },
    ].map(decorateItem);

    const arsenal = [
      can("equipment")
        ? {
          key: "equipment",
          iconSrc: ITEM_ICONS.blade,
          label: tr("systemHub.equipment.label"),
          color: "#60a5fa",
          badge: inventory.length > 0 && !Object.values(slots).every(Boolean) ? 1 : 0,
          meta: `${equippedCount}/4 Slots`,
        }
        : {
          key: "equipment",
          iconSrc: ITEM_ICONS.blade,
          label: tr("systemHub.equipment.label"),
          color: "#60a5fa",
          locked: true,
          unlockLevel: 11,
          meta: "",
        },
      can("shadow_army")
        ? {
          key: "shadows",
          iconSrc: SHADOW_ICONS.soldier,
          label: tr("systemHub.shadows.label"),
          color: "#a78bfa",
          badge: namedShadows.length,
          meta: `${namedShadows.length} Named`,
        }
        : {
          key: "shadows",
          iconSrc: SHADOW_ICONS.soldier,
          label: tr("systemHub.shadows.label"),
          color: "#a78bfa",
          locked: true,
          unlockLevel: 15,
          meta: "",
        },
      can("jobs")
        ? {
          key: "jobs",
          iconSrc: NAV_ICONS.jobs,
          label: tr("systemHub.jobs.label"),
          color: "#818cf8",
          meta: "Auftraege",
        }
        : {
          key: "jobs",
          iconSrc: NAV_ICONS.jobs,
          label: tr("systemHub.jobs.label"),
          color: "#818cf8",
          locked: true,
          unlockLevel: 21,
          meta: "",
        },
      can("shop")
        ? {
          key: "shop",
          iconSrc: NAV_ICONS.shop,
          label: "Drops Shop",
          color: "#f59e0b",
          meta: "Items & Themes",
        }
        : {
          key: "shop",
          iconSrc: NAV_ICONS.shop,
          label: "Drops Shop",
          color: "#f59e0b",
          locked: true,
          unlockLevel: 11,
          meta: "",
        },
      can("charisma_dungeons")
        ? {
          key: "charisma_overlay",
          routeKey: "charisma_overlay",
          iconSrc: CHA_ICONS.conversation,
          label: tr("systemHub.charisma.label"),
          color: "#f472b6",
          meta: "Social Gates",
          isOverlay: true,
          action: onOpenCharisma,
        }
        : {
          key: "charisma_overlay",
          routeKey: "charisma_overlay",
          iconSrc: CHA_ICONS.conversation,
          label: tr("systemHub.charisma.label"),
          color: "#f472b6",
          locked: true,
          unlockLevel: 30,
          meta: "",
        },
      can("soul_link")
        ? {
          key: "soullink_overlay",
          routeKey: "soullink_overlay",
          iconSrc: SHADOW_ICONS.knight,
          label: "Soul Link",
          color: "#a855f7",
          meta: state?.soulLink?.partnerName || "Partner-Link",
          isOverlay: true,
          action: onOpenSoulLink,
        }
        : {
          key: "soullink_overlay",
          routeKey: "soullink_overlay",
          iconSrc: SHADOW_ICONS.knight,
          label: "Soul Link",
          color: "#a855f7",
          locked: true,
          unlockLevel: 30,
          meta: "",
        },
    ].map(decorateItem);

    const transit = [
      can("dungeons")
        ? {
          key: "dungeon",
          iconSrc: GATE_ICONS.normal,
          label: "Gate-Dock",
          color: "#ef4444",
          badge: activeDungeons.length,
          meta: activeDungeons.length > 0 ? `${activeDungeons.length} aktiv` : "Kein Gate",
        }
        : {
          key: "dungeon",
          iconSrc: GATE_ICONS.normal,
          label: "Gate-Dock",
          color: "#ef4444",
          locked: true,
          unlockLevel: 6,
          meta: "",
        },
      can("sanctum")
        ? {
          key: "sanctum",
          iconSrc: NAV_ICONS.timer,
          label: "Sanctum",
          color: "#c084fc",
          meta: "Fokus-Kammer",
        }
        : {
          key: "sanctum",
          iconSrc: NAV_ICONS.timer,
          label: "Sanctum",
          color: "#c084fc",
          locked: true,
          unlockLevel: 11,
          meta: "",
        },
      can("story")
        ? {
          key: "story",
          iconSrc: STORY_ICONS.scroll,
          label: "Story-Archiv",
          color: "#38bdf8",
          meta: "Heldenreise",
        }
        : {
          key: "story",
          iconSrc: STORY_ICONS.scroll,
          label: "Story-Archiv",
          color: "#38bdf8",
          locked: true,
          unlockLevel: 3,
          meta: "",
        },
    ].map(decorateItem);

    return {
      intel: intel.filter(item => !navKeys.includes(item.key) && !navKeys.includes(item.routeKey)),
      arsenal: arsenal.filter(item => !navKeys.includes(item.key) && !navKeys.includes(item.routeKey)),
      transit: transit.filter(item => !navKeys.includes(item.key) && !navKeys.includes(item.routeKey))
    };
  }, [
    achUnlocked,
    activeDungeons.length,
    can,
    catalogAchievements,
    decorateItem,
    equippedCount,
    inventory.length,
    namedShadows.length,
    onOpenCharisma,
    onOpenSoulLink,
    openQuests,
    rank?.name,
    readyAchievements,
    state,
    tr,
    navKeys,
  ]);

  const allModules = useMemo(() => {
    const raw = [...sections.arsenal, ...sections.transit, ...sections.intel];
    return raw.map(mod => {
       let styleIndex = 0;
       let secondaryColor = mod.color;
       if (mod.key === "equipment") { styleIndex = 0; secondaryColor = "#94a3b8"; }
       else if (mod.key === "shadows") { styleIndex = 1; secondaryColor = "#312e81"; }
       else if (mod.key === "jobs") { styleIndex = 2; secondaryColor = "#475569"; }
       else if (mod.key === "shop") { styleIndex = 3; secondaryColor = "#fbbf24"; }
       else if (mod.key === "charisma_overlay") { styleIndex = 4; secondaryColor = "#fda4af"; }
       else if (mod.key === "dungeon") { styleIndex = 5; secondaryColor = "#991b1b"; }
       else if (mod.key === "sanctum") { styleIndex = 6; secondaryColor = "#6d28d9"; }
       else if (mod.key === "story") { styleIndex = 7; secondaryColor = "#0d9488"; }
       else if (mod.key === "stats") { styleIndex = 8; secondaryColor = "#e11d48"; }
       else if (mod.key === "analytics") { styleIndex = 9; secondaryColor = "#14b8a6"; }
       else if (mod.key === "achievements") { styleIndex = 10; secondaryColor = "#d97706"; }
       else if (mod.key === "challenges") { styleIndex = 11; secondaryColor = "#dc2626"; }
       else if (mod.key === "soullink_overlay") { styleIndex = 12; secondaryColor = "#7e22ce"; }
       return { ...mod, styleIndex, secondaryColor };
    });
  }, [sections]);
  const statsPortalIndex = useMemo(() => allModules.findIndex((mod) => mod.key === "stats"), [allModules]);
  const appSections = useMemo(
    () => [
      { key: "arsenal", title: tr("systemHub.arsenal"), items: sections.arsenal },
      { key: "transit", title: "Portal-Dock", items: sections.transit },
      { key: "intel", title: tr("systemHub.hunterIntel"), items: sections.intel },
    ],
    [sections, tr]
  );
  // Default to the always-unlocked Stats portal so the carousel never opens on a
  // level-locked portal (e.g. Equipment at Lv1, whose "enter" button is disabled).
  const [selectedPortalIndex, setSelectedPortalIndexRaw] = useState(() => {
    const statsIndex = allModules.findIndex((mod) => mod.key === "stats");
    return statsIndex >= 0 ? statsIndex : 0;
  });
  const [enteringPortal, setEnteringPortal] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState(0);
  const dragStartRef = useRef(null);
  const selectedPortal = allModules[wrapIndex(selectedPortalIndex, allModules.length)] || allModules[0];
  const normalizedSelectedIndex = wrapIndex(selectedPortalIndex, allModules.length);
  const selectedPortalLockedText = selectedPortal?.locked
    ? levelLockedText(selectedPortal.unlockLevel)
    : selectedPortal?.premiumLocked
      ? "Nur mit Hunter Pro"
      : selectedPortal?.meta;
  const shellTopInset = typeof shellTopOffset === "number" ? `${shellTopOffset}px` : shellTopOffset || "0px";
  const shellBottomInset = typeof shellBottomOffset === "number" ? `${shellBottomOffset}px` : shellBottomOffset || "0px";

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
  }, []);

  const setSelectedPortalIndex = useCallback((nextIndex, direction = 0) => {
    setTransitionDirection(direction);
    setSelectedPortalIndexRaw(wrapIndex(nextIndex, allModules.length));
    window.setTimeout(() => setTransitionDirection(0), reducedMotion ? 120 : 460);
  }, [allModules.length, reducedMotion]);

  const movePortal = useCallback((direction) => {
    setSelectedPortalIndex(normalizedSelectedIndex + direction, direction);
  }, [normalizedSelectedIndex, setSelectedPortalIndex]);

  useEffect(() => {
    if (!tutorialStepId) return;

    if (ONBOARDING_PORTAL_MODE_STEPS.has(tutorialStepId)) {
      if (hunterIslandMode !== "portal") setHunterIslandMode("portal");
      if (
        ONBOARDING_STATS_PORTAL_STEPS.has(tutorialStepId) &&
        statsPortalIndex >= 0 &&
        normalizedSelectedIndex !== statsPortalIndex
      ) {
        setSelectedPortalIndex(statsPortalIndex, 0);
      }
      return;
    }

    if (ONBOARDING_APPS_MODE_STEPS.has(tutorialStepId) && hunterIslandMode !== "apps") {
      setHunterIslandMode("apps");
    }
  }, [
    hunterIslandMode,
    normalizedSelectedIndex,
    setHunterIslandMode,
    setSelectedPortalIndex,
    statsPortalIndex,
    tutorialStepId,
  ]);

  const handleActivate = useCallback((item, withTransition = true) => {
    if (item.locked) return;
    if (item.premiumLocked) {
      openPremiumModal?.(item.premiumFeature);
      return;
    }
    const complete = () => {
      if (item.isOverlay) {
        setEnteringPortal(null);
        item.action?.();
        return;
      }
      navigateToWithAccess(item.routeKey || item.key);
    };
    if (!withTransition || reducedMotion) {
      complete();
      return;
    }
    setEnteringPortal(item);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(complete, 820);
  }, [navigateToWithAccess, openPremiumModal, reducedMotion]);

  const handlePortalEnter = useCallback(() => {
    if (!selectedPortal) return;
    handleActivate(selectedPortal);
  }, [handleActivate, selectedPortal]);

  const handleAppActivate = useCallback((item) => {
    if (!item || item.locked) return;
    if (item.premiumLocked) {
      openPremiumModal?.(item.premiumFeature);
      return;
    }
    setLaunchingModule(item);
    if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
    launchTimerRef.current = window.setTimeout(() => {
      setLaunchingModule(null);
      handleActivate(item, false);
    }, reducedMotion ? 80 : 260);
  }, [handleActivate, openPremiumModal, reducedMotion]);

  const handlePointerDown = (event) => {
    if (event.target?.closest?.("button")) return;
    dragStartRef.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is a best-effort enhancement for swipe reliability.
    }
  };

  const handlePointerUp = (event) => {
    if (event.target?.closest?.("button")) return;
    if (dragStartRef.current === null) return;
    const delta = event.clientX - dragStartRef.current;
    dragStartRef.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Some browser surfaces release capture automatically.
    }
    if (Math.abs(delta) < 42) return;
    movePortal(delta < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
  };

  const handleTouchStart = (event) => {
    if (event.target?.closest?.("button")) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    dragStartRef.current = touch.clientX;
  };

  const handleTouchEnd = (event) => {
    if (event.target?.closest?.("button")) return;
    if (dragStartRef.current === null) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const delta = touch.clientX - dragStartRef.current;
    dragStartRef.current = null;
    if (Math.abs(delta) < 42) return;
    movePortal(delta < 0 ? 1 : -1);
  };

  const handlePortalKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      movePortal(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePortal(-1);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePortalEnter();
    }
  };

  const briefing = [
    `${openQuests} Quests`,
    `${activeDungeons.length} Gates`,
    `${onlineFeatureCount} online`,
  ].join(" / ");

  return (
    <div
      className={`hunter-island hunter-island--${hunterIslandMode}`}
      style={{
        "--hi-accent": accent,
        "--hi-glow": glow,
        "--hi-accent-soft": hexToRgba(accent, 0.15),
        "--portal-color": SIGNATURE_VIOLET,
        "--hi-shell-top": shellTopInset,
        "--hi-shell-bottom": shellBottomInset,
      }}
    >
      <style>{HUNTER_ISLAND_CSS}</style>
      {hunterIslandMode === "portal" ? (
        <section
          className={[
            "hi-hero",
            "hi-hero--portal",
            enteringPortal ? "hi-hero--entering" : "",
            reducedMotion ? "hi-hero--reduced-motion" : "",
          ].filter(Boolean).join(" ")}
          aria-label="Hunter-Insel Portal-Navigation"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handlePortalKeyDown}
        >
          <div className="hi-canvas" data-testid="hunter-island-canvas-wrap">
            <Canvas
              dpr={lowPower ? [1, 1.35] : [1, 1.75]}
              camera={{ position: [0, 0.18, 6.8], fov: 50 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
              }}
            >
              <PortalScene
                portals={allModules}
                selectedIndex={normalizedSelectedIndex}
                onSelect={(index) => setSelectedPortalIndex(index, index > normalizedSelectedIndex ? 1 : -1)}
                direction={transitionDirection}
                entering={!!enteringPortal}
                reducedMotion={reducedMotion}
                lowPower={lowPower}
              />
            </Canvas>
          </div>
          <div className="hi-swipe-catcher" aria-hidden="true" />
          <div className="hi-hero__veil" aria-hidden="true" />
          <PortalHud
            allModules={allModules}
            briefing={briefing}
            enteringPortal={enteringPortal}
            level={level}
            mode={hunterIslandMode}
            movePortal={movePortal}
            onModeChange={setHunterIslandMode}
            rank={rank}
            selectedPortal={selectedPortal}
            selectedPortalIndex={selectedPortalIndex}
            selectedPortalLockedText={selectedPortalLockedText}
            setSelectedPortalIndex={(index) => setSelectedPortalIndex(index, index > normalizedSelectedIndex ? 1 : -1)}
            handlePortalEnter={handlePortalEnter}
          />
          <PortalTransitionOverlay portal={enteringPortal} />
        </section>
      ) : (
        <section className="hi-hero hi-hero--apps" aria-label="Hunter-Insel App-Ansicht">
          <AppLauncherView
            appSections={appSections}
            briefing={briefing}
            level={level}
            launchingModule={launchingModule}
            mode={hunterIslandMode}
            onActivate={handleAppActivate}
            onModeChange={setHunterIslandMode}
            rank={rank}
          />
        </section>
      )}
    </div>
  );
}

const HUNTER_ISLAND_CSS = `
.hunter-island {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  max-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  color: #e5f4ff;
  isolation: isolate;
  background: #04030a;
}
.hunter-island::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 8%, rgba(124,58,237,0.18), transparent 38%),
    radial-gradient(circle at 50% 82%, var(--hi-accent-soft), transparent 42%),
    #04030a;
}
.hi-hero {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(6,4,16,0.35), rgba(2,2,8,0.96) 86%),
    radial-gradient(circle at 50% 42%, var(--hi-accent-soft), transparent 48%),
    #03030a;
}
.hi-hero--portal {
  touch-action: none;
  outline: none;
  overscroll-behavior: none;
}
.hi-hero--portal:focus-visible {
  box-shadow: inset 0 0 0 2px var(--hi-accent);
}
.hi-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  transform: translateZ(0);
}
.hi-swipe-catcher {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: grab;
  pointer-events: auto;
}
.hi-swipe-catcher:active {
  cursor: grabbing;
}
.hi-hero__veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 38%, transparent 0 21%, rgba(2,4,10,0.06) 42%, rgba(2,4,10,0.8) 87%),
    linear-gradient(180deg, rgba(2,4,10,0.08), transparent 30%, transparent 65%, rgba(2,4,10,0.95) 100%);
}
.hi-hero__hud {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: calc(var(--hi-shell-top, 0px) + 6px) clamp(12px, 3.8vw, 30px) calc(var(--hi-shell-bottom, 0px) + max(4px, env(safe-area-inset-bottom)));
  pointer-events: none;
}
.hi-topbar {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr) 82px;
  align-items: start;
  gap: 10px;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  /* Extra clearance so the Portal/Apps toggle is never tucked under the
     fixed app header (position:fixed; z-index:100). --hi-shell-top only
     reserves a tight ~20px gap, which the header's blur/border can eat. */
  padding-top: 16px;
  pointer-events: none;
}
.hi-mode-toggle {
  pointer-events: auto;
  min-width: 0;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 10px;
  color: #ede9fe;
  border: 1px solid rgba(167,139,250,0.28);
  border-radius: 12px;
  background:
    linear-gradient(145deg, rgba(16,10,34,0.82), rgba(5,4,13,0.7)),
    rgba(6,4,14,0.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 32px rgba(0,0,0,0.34), 0 0 26px rgba(124,58,237,0.12);
  backdrop-filter: blur(16px) saturate(1.25);
  -webkit-backdrop-filter: blur(16px) saturate(1.25);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.hi-mode-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(167,139,250,0.62);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 36px rgba(0,0,0,0.38), 0 0 28px rgba(124,58,237,0.28);
}
.hi-mode-toggle:active {
  transform: translateY(0) scale(0.98);
}
.hi-mode-toggle strong {
  font: 800 10px/1 var(--font-sans);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.hi-mode-toggle__glyph {
  position: relative;
  width: 16px;
  height: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  flex: 0 0 16px;
}
.hi-mode-toggle__glyph i {
  display: block;
  border-radius: 4px;
  background: currentColor;
  box-shadow: 0 0 8px rgba(167,139,250,0.45);
  opacity: 0.9;
}
.hi-mode-toggle--portal .hi-mode-toggle__glyph {
  display: block;
  border: 2px solid currentColor;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(167,139,250,0.5), inset 0 0 8px rgba(124,58,237,0.32);
}
.hi-mode-toggle--portal .hi-mode-toggle__glyph::after {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.42;
}
.hi-mode-toggle--portal .hi-mode-toggle__glyph i {
  display: none;
}
.hi-3d-hologram {
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  filter: drop-shadow(0 0 16px rgba(124, 58, 237, 0.6));
}
.hi-3d-hologram img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  filter: drop-shadow(0 0 24px rgba(124, 58, 237, 0.8));
}
.hi-3d-hologram span {
  color: #fff;
  font: 950 14px/1 var(--font-display);
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 0 16px rgba(124, 58, 237, 0.8), 0 2px 6px rgba(0,0,0,0.8);
}
.hi-mobile-header {
  min-width: 0;
  text-align: center;
  justify-self: center;
  padding-top: 1px;
}
.hi-mobile-header > div {
  min-width: 0;
}
.hi-mobile-header h1 {
  margin: 0;
  color: #f5f3ff;
  font-family: var(--font-display);
  font-size: clamp(24px, 7vw, 44px);
  font-weight: 950;
  line-height: 0.96;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  text-shadow: 0 0 38px rgba(124,58,237,0.55);
}
.hi-mobile-header span {
  display: block;
  margin-top: 5px;
  color: #9d92c4;
  font: 600 10px/1.5 var(--font-sans);
  letter-spacing: 0.4px;
}
.hi-mobile-header__rank {
  justify-self: end;
  flex: 0 0 auto;
  min-width: 76px;
  padding: 8px 11px;
  border: 1px solid rgba(124,58,237,0.28);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(20,12,38,0.72), rgba(6,4,14,0.8));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 30px rgba(0,0,0,0.32);
  backdrop-filter: blur(14px);
  text-align: right;
}
.hi-mobile-header__rank span {
  display: block;
  color: #9d92c4;
  font: 600 9px/1.4 var(--font-sans);
  letter-spacing: 0.4px;
}
.hi-mobile-header__rank strong {
  display: block;
  margin-top: 3px;
  color: #f5f3ff;
  font: 800 13px/1 var(--font-display);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.hi-portal-bottom {
  display: grid;
  gap: clamp(7px, 1.25vh, 10px);
  margin-top: auto;
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.hi-selected-portal {
  pointer-events: none;
  width: min(440px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.06), rgba(4,3,12,0.85) 40%),
    rgba(4,3,12,0.6);
  box-shadow: 
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 24px 60px rgba(0,0,0,0.6),
    0 0 24px rgba(124,58,237,0.14);
  backdrop-filter: blur(24px);
  position: relative;
  overflow: hidden;
}
.hi-selected-portal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transform: translateX(-100%);
  animation: shimmer 3s infinite;
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
.hi-selected-portal__index {
  grid-column: 1 / -1;
  color: #b9a7f5;
  font: 700 9px/1 var(--font-mono);
  letter-spacing: 1.4px;
}
.hi-selected-portal img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  filter: drop-shadow(0 0 16px var(--portal-color)) brightness(1.2);
}
.hi-selected-portal div {
  min-width: 0;
}
.hi-selected-portal strong,
.hi-selected-portal span:last-child {
  display: block;
  min-width: 0;
}
.hi-selected-portal strong {
  color: #ffffff;
  font: 800 22px/1.05 var(--font-display);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  overflow-wrap: anywhere;
  text-shadow: 0 0 12px rgba(255,255,255,0.3);
}
.hi-selected-portal span:last-child {
  margin-top: 5px;
  color: #b4a7d6;
  font: 600 12px/1.35 var(--font-sans);
  letter-spacing: 0.3px;
}
.hi-portal-controls {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 46px minmax(0, 248px) 46px;
  justify-content: center;
  align-items: center;
  gap: 9px;
  width: min(372px, 100%);
  margin: 0 auto;
}
.hi-portal-arrow,
.hi-portal-enter {
  min-height: 48px;
  color: #ede9fe;
  border: 1px solid rgba(124,58,237,0.22);
  border-radius: 13px;
  background: rgba(6,4,14,0.82);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 34px rgba(0,0,0,0.34);
  backdrop-filter: blur(14px);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.hi-portal-arrow {
  position: relative;
  display: grid;
  place-items: center;
}
.hi-portal-arrow span {
  width: 11px;
  height: 11px;
  border-top: 2px solid currentColor;
  border-left: 2px solid currentColor;
}
.hi-portal-arrow--left span {
  transform: rotate(-45deg) translate(1px, 1px);
}
.hi-portal-arrow--right span {
  transform: rotate(135deg) translate(1px, 1px);
}
.hi-portal-enter {
  border-color: rgba(124,58,237,0.55);
  background:
    linear-gradient(135deg, rgba(124,58,237,0.5), rgba(8,5,18,0.92) 70%),
    rgba(8,5,18,0.9);
  color: #f7f5ff;
  font: 700 13px/1 var(--font-sans);
  letter-spacing: 0.4px;
}
.hi-portal-arrow:hover,
.hi-portal-enter:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: var(--portal-color);
  box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 26px rgba(124,58,237,0.4);
}
.hi-portal-arrow:active,
.hi-portal-enter:not(:disabled):active {
  transform: translateY(0) scale(0.98);
}
.hi-portal-enter:disabled {
  color: #5b5570;
  cursor: default;
  filter: grayscale(0.5);
}
.hi-portal-rail {
  pointer-events: auto;
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 1px 8px 7px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
}
.hi-portal-rail::-webkit-scrollbar {
  display: none;
}
.hi-portal-dot {
  flex: 0 0 auto;
  position: relative;
  width: 96px;
  min-height: 60px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 6px;
  padding: 7px 6px;
  color: #8a7fb0;
  border: 1px solid rgba(124,58,237,0.14);
  border-radius: 12px;
  background: rgba(6,4,14,0.6);
  transition: transform 0.18s ease, color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.hi-portal-dot img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: grayscale(0.3) brightness(0.9);
}
.hi-portal-dot span {
  max-width: 100%;
  color: inherit;
  font: 600 10.5px/1.15 var(--font-sans);
  letter-spacing: 0.3px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-align: center;
}
.hi-portal-dot--active {
  color: #f7f5ff;
  border-color: rgba(167,139,250,0.7);
  background: linear-gradient(135deg, rgba(124,58,237,0.34), rgba(8,5,18,0.9));
  box-shadow: inset 0 0 0 1px rgba(167,139,250,0.4), 0 8px 22px rgba(0,0,0,0.42), 0 0 16px rgba(124,58,237,0.24);
  transform: translateY(-2px) scale(1.05);
}
.hi-portal-dot--active img {
  filter: drop-shadow(0 0 8px rgba(124,58,237,0.55));
}
.hi-portal-dot--locked {
  opacity: 0.4;
}
.hi-portal-dot--locked img {
  filter: grayscale(0.75) brightness(0.7);
}
.hi-portal-dot--premium {
  border-color: rgba(245,158,11,0.34);
}
.hi-portal-dot--premium img {
  filter: drop-shadow(0 0 7px rgba(245,158,11,0.4));
}
.hi-portal-dot__flag {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 2;
  display: grid;
  place-items: center;
  line-height: 1;
  border-radius: 999px;
}
.hi-portal-dot__flag--locked {
  width: 14px;
  height: 14px;
  color: #c2cadb;
  background: rgba(2,4,10,0.85);
  border: 1px solid rgba(148,163,184,0.32);
}
.hi-portal-dot__flag--pro {
  padding: 1px 4px;
  color: #fde68a;
  background: rgba(245,158,11,0.2);
  border: 1px solid rgba(245,158,11,0.52);
  font: 900 7px/1 var(--font-sans);
  letter-spacing: 0.4px;
}
.hi-portal-tag {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font: 900 9px/1 var(--font-sans);
  letter-spacing: 0.6px;
}
.hi-portal-tag--pro {
  color: #fde68a;
  background: linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.14));
  border: 1px solid rgba(245,158,11,0.55);
  box-shadow: 0 2px 10px rgba(245,158,11,0.2);
}
.hi-portal-tag--locked {
  color: #c2cadb;
  background: rgba(2,4,10,0.7);
  border: 1px solid rgba(148,163,184,0.3);
}
.hi-portal-enter--pro {
  border-color: rgba(245,158,11,0.6);
  background:
    linear-gradient(135deg, rgba(245,158,11,0.42), rgba(18,12,4,0.92) 72%),
    rgba(18,12,4,0.9);
  color: #fde68a;
}
.hi-portal-enter--pro:not(:disabled):hover {
  border-color: #f59e0b;
  box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 26px rgba(245,158,11,0.42);
}
.hi-apps-view {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 1vh, 10px);
  padding: calc(var(--hi-shell-top, 0px) + 6px) clamp(10px, 3vw, 26px) calc(var(--hi-shell-bottom, 0px) + max(4px, env(safe-area-inset-bottom)));
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 22%, rgba(34,211,238,0.08), transparent 30%),
    radial-gradient(circle at 84% 17%, rgba(245,158,11,0.08), transparent 27%),
    linear-gradient(180deg, rgba(8,4,22,0.35), rgba(2,2,8,0.88));
}
.hunter-island--apps .hi-topbar {
  max-width: 1080px;
  align-items: center;
}
.hunter-island--apps .hi-mobile-header h1 {
  font-size: clamp(18px, 4.6vw, 30px);
  letter-spacing: 0.7px;
}
.hunter-island--apps .hi-mobile-header span {
  display: none;
}
.hunter-island--apps .hi-mobile-header__rank {
  padding-top: 6px;
  padding-bottom: 6px;
}
.hi-apps-content {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  align-items: stretch;
  justify-items: center;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.hi-apps-orbit {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0.62;
}
.hi-apps-orbit span {
  position: absolute;
  width: min(72vmin, 620px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid rgba(167,139,250,0.12);
  box-shadow: inset 0 0 44px rgba(124,58,237,0.06), 0 0 34px rgba(34,211,238,0.04);
}
.hi-apps-orbit span:nth-child(2) {
  width: min(54vmin, 460px);
  transform: rotate(18deg);
  border-color: rgba(34,211,238,0.11);
}
.hi-apps-orbit span:nth-child(3) {
  width: min(38vmin, 320px);
  transform: rotate(-20deg);
  border-color: rgba(245,158,11,0.1);
}
.hi-apps-shell {
  position: relative;
  z-index: 1;
  width: min(880px, 100%);
  min-height: 100%;
  display: grid;
  gap: clamp(6px, 1vh, 10px);
  align-content: stretch;
}
.hi-app-section {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: clamp(7px, 1vh, 11px);
  border: 1px solid rgba(167,139,250,0.16);
  border-radius: 18px;
  background:
    linear-gradient(155deg, rgba(255,255,255,0.052), rgba(255,255,255,0.014)),
    rgba(5,4,13,0.58);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 18px 42px rgba(0,0,0,0.32), 0 0 34px rgba(124,58,237,0.08);
  backdrop-filter: blur(18px) saturate(1.3);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
  animation: hiAppSectionIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--section-index) * 60ms);
}
.hi-app-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: clamp(6px, 1vh, 10px);
  padding-left: 2px;
  color: #b9a7f5;
  font: 900 9px/1 var(--font-sans);
  letter-spacing: 1.6px;
  text-transform: uppercase;
}
.hi-app-section__header i {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, rgba(167,139,250,0.34), transparent);
}
.hi-app-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: stretch;
  gap: clamp(6px, 1.1vh, 9px);
}
.hi-app-tile {
  --tile-soft: color-mix(in srgb, var(--tile), transparent 82%);
  position: relative;
  min-width: 0;
  min-height: clamp(58px, 9vh, 90px);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  padding: 6px 4px 7px;
  color: #d9d6ee;
  border: 1px solid rgba(255,255,255,0.055);
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 10%, var(--tile-soft), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.012));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -12px 18px rgba(0,0,0,0.18);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  animation: hiAppTileIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc((var(--section-index) * 70ms) + (var(--tile-index) * 24ms));
}
.hi-app-tile::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 0 30%, rgba(255,255,255,0.1) 48%, transparent 66%);
  opacity: 0;
  transform: translateX(-90%);
  transition: opacity 0.2s ease;
}
.hi-app-tile:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--tile), transparent 46%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 28px rgba(0,0,0,0.34), 0 0 22px color-mix(in srgb, var(--tile), transparent 72%);
}
.hi-app-tile:not(:disabled):hover::before {
  opacity: 0.45;
  animation: hiAppSheen 0.62s ease both;
}
.hi-app-tile:not(:disabled):active {
  transform: scale(0.96);
}
.hi-app-tile__icon {
  position: relative;
  width: clamp(34px, 6.4vh, 48px);
  height: clamp(34px, 6.4vh, 48px);
  display: grid;
  place-items: center;
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--tile), transparent 62%), transparent 72%),
    linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
  border: 1px solid color-mix(in srgb, var(--tile), transparent 62%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.25);
}
.hi-app-tile__icon img {
  width: 62%;
  height: 62%;
  object-fit: contain;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--tile), transparent 36%));
}
.hi-app-tile__label {
  max-width: 100%;
  color: #f8fafc;
  font: 800 clamp(10px, 1.4vw, 13px)/1.2 var(--font-display);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.hi-app-tile__meta {
  max-width: 100%;
  color: #8c84aa;
  font: 700 clamp(7px, 1.08vh, 9px)/1 var(--font-mono);
  letter-spacing: 0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hi-app-tile__badge,
.hi-app-tile__pro,
.hi-app-tile__iconflag {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  font-family: var(--font-sans);
}
.hi-app-tile__badge {
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  color: #fff;
  background: #ef4444;
  border: 2px solid rgba(5,4,13,0.94);
  font-size: 9px;
  font-weight: 900;
}
.hi-app-tile__pro {
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px 2px 5px;
  border-radius: 999px;
  color: #fde68a;
  background: linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.14));
  border: 1px solid rgba(245,158,11,0.55);
  box-shadow: 0 2px 8px rgba(245,158,11,0.2);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.hi-app-tile__iconflag {
  top: -5px;
  right: -5px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  color: #c2cadb;
  background: rgba(2,4,10,0.92);
  border: 1px solid rgba(148,163,184,0.32);
}
.hi-app-tile--locked {
  opacity: 0.6;
  filter: grayscale(0.4);
}
.hi-app-tile--premium {
  border-color: rgba(245,158,11,0.32);
  background:
    radial-gradient(circle at 50% 8%, rgba(245,158,11,0.13), transparent 58%),
    linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.012));
}
.hi-app-tile--premium .hi-app-tile__icon {
  border-color: rgba(245,158,11,0.42);
}
.hi-app-tile--premium .hi-app-tile__meta {
  color: #d8a84e;
}
.hi-app-launch {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--tile), transparent 68%), transparent 42%);
  animation: hiAppLaunchFade 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-app-launch img {
  width: 76px;
  height: 76px;
  object-fit: contain;
  filter: drop-shadow(0 0 30px var(--tile));
  animation: hiAppLaunchIcon 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-app-launch span {
  margin-top: 98px;
  color: #fff;
  font: 900 12px/1 var(--font-display);
  letter-spacing: 1.7px;
  text-transform: uppercase;
  animation: hiAppLaunchText 0.34s ease both;
}
.hi-portal-jump {
  position: absolute;
  inset: 0;
  z-index: 9;
  display: grid;
  place-items: center;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--portal-color), transparent 30%) 0 5%, transparent 34%),
    rgba(2,4,10,0.12);
  animation: hiPortalJumpFade 0.82s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-portal-jump__tunnel {
  position: absolute;
  width: 26vmin;
  aspect-ratio: 1;
  border-radius: 999px;
  background:
    repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--portal-color), transparent 36%) 0 8deg, transparent 8deg 18deg),
    radial-gradient(circle, rgba(255,255,255,0.96) 0 4%, color-mix(in srgb, var(--portal-color), transparent 18%) 11%, transparent 52%);
  filter: blur(0.2px);
  mix-blend-mode: screen;
  animation: hiPortalTunnel 0.82s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-portal-jump__ring {
  position: absolute;
  width: min(86vw, 560px);
  aspect-ratio: 1;
  border: 2px solid color-mix(in srgb, var(--portal-color), #ffffff 20%);
  box-shadow: 0 0 54px var(--portal-color), inset 0 0 42px color-mix(in srgb, var(--portal-color), transparent 34%);
}
.hi-portal-jump__ring--outer {
  animation: hiPortalJumpRing 0.82s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-portal-jump__ring--inner {
  width: min(58vw, 360px);
  border-width: 1px;
  animation: hiPortalJumpRingInner 0.82s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hi-portal-jump__core {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 12px;
  color: #fff;
  font: 950 13px/1 var(--font-display);
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: hiPortalJumpCore 0.82s ease both;
}
.hi-portal-jump__core img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 0 24px var(--portal-color));
}
.hi-portal-jump__flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 48%, rgba(255,255,255,0.98) 0 6%, color-mix(in srgb, var(--portal-color), transparent 32%) 12%, transparent 42%);
  mix-blend-mode: screen;
  animation: hiPortalFlash 0.82s ease both;
}
@keyframes hiPortalJumpFade {
  0% { opacity: 0; transform: scale(0.98); }
  14% { opacity: 1; }
  72% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.04); }
}
@keyframes hiPortalTunnel {
  0% { transform: scale(0.15) rotate(0deg); opacity: 0; filter: blur(8px); }
  28% { opacity: 1; filter: blur(0); }
  100% { transform: scale(6.5) rotate(180deg); opacity: 0; filter: blur(18px); }
}
@keyframes hiPortalJumpRing {
  0% { transform: scale(0.24) rotate(0deg); opacity: 0; filter: blur(8px); }
  22% { opacity: 1; filter: blur(0); }
  100% { transform: scale(1.9) rotate(130deg); opacity: 0; filter: blur(16px); }
}
@keyframes hiPortalJumpRingInner {
  0% { transform: scale(0.42) rotate(90deg); opacity: 0; filter: blur(6px); }
  22% { opacity: 0.92; filter: blur(0); }
  100% { transform: scale(2.8) rotate(-160deg); opacity: 0; filter: blur(14px); }
}
@keyframes hiPortalJumpCore {
  0% { transform: translateY(10px) scale(0.88); opacity: 0; }
  24% { transform: translateY(0) scale(1); opacity: 1; }
  72% { transform: translateY(-10px) scale(1.04); opacity: 1; }
  100% { transform: translateY(-28px) scale(1.18); opacity: 0; }
}
@keyframes hiPortalFlash {
  0%, 58% { opacity: 0; }
  76% { opacity: 0.96; }
  100% { opacity: 0; }
}
@keyframes hiAppSectionIn {
  0% { opacity: 0; transform: translateY(10px) scale(0.985); filter: blur(5px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes hiAppTileIn {
  0% { opacity: 0; transform: translateY(8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes hiAppSheen {
  0% { transform: translateX(-90%); }
  100% { transform: translateX(120%); }
}
@keyframes hiAppLaunchFade {
  0% { opacity: 0; }
  35% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes hiAppLaunchIcon {
  0% { transform: scale(0.78); opacity: 0; }
  46% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.38); opacity: 0; }
}
@keyframes hiAppLaunchText {
  0% { transform: translateY(8px); opacity: 0; }
  45% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-8px); opacity: 0; }
}
@media (min-width: 680px) {
  .hi-hero {
    height: 100dvh;
  }
  .hi-hero__hud {
    padding-left: max(28px, calc((100vw - 820px) / 2 + 28px));
    padding-right: max(28px, calc((100vw - 820px) / 2 + 28px));
  }
  .hi-mobile-header h1 {
    font-size: clamp(40px, 5.2vw, 68px);
  }
  .hi-selected-portal {
    width: min(520px, 100%);
  }
  .hi-portal-rail {
    width: min(680px, 100%);
  }
  .hi-portal-dot {
    width: 108px;
    min-height: 64px;
  }
}
@media (min-width: 860px) {
  .hi-apps-shell {
    width: min(1080px, 100%);
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.78fr) minmax(0, 0.9fr);
    align-items: stretch;
  }
  .hi-app-section {
    display: flex;
    flex-direction: column;
  }
  .hi-app-grid {
    flex: 1;
    align-content: start;
  }
}
@media (max-width: 430px) {
  .hi-hero__hud {
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: calc(var(--hi-shell-bottom, 0px) + max(8px, env(safe-area-inset-bottom)));
  }
  .hi-topbar {
    grid-template-columns: 66px minmax(0, 1fr) 66px;
    gap: 8px;
  }
  .hi-mode-toggle {
    height: 34px;
    gap: 5px;
    padding: 0 8px;
    border-radius: 11px;
  }
  .hi-mode-toggle strong {
    font-size: 9px;
  }
  .hi-mode-toggle__glyph {
    width: 14px;
    height: 14px;
    flex-basis: 14px;
  }
  .hi-mobile-header h1 {
    font-size: 23px;
    letter-spacing: 0.65px;
  }
  .hi-mobile-header span {
    margin-top: 4px;
    font-size: 8px;
  }
  .hi-mobile-header__rank {
    min-width: 62px;
    padding: 6px 8px;
    border-radius: 11px;
  }
  .hi-mobile-header__rank strong {
    font-size: 10px;
  }
  .hi-selected-portal {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 12px;
  }
  .hi-selected-portal img {
    width: 32px;
    height: 32px;
  }
  .hi-selected-portal strong {
    font-size: 16px;
  }
  .hi-portal-controls {
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    gap: 8px;
  }
  .hi-portal-arrow,
  .hi-portal-enter {
    min-height: 46px;
  }
  .hi-portal-enter {
    font-size: 12px;
  }
  .hi-portal-dot {
    width: 88px;
    min-height: 56px;
  }
  .hi-apps-view {
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: calc(var(--hi-shell-bottom, 0px) + max(8px, env(safe-area-inset-bottom)));
  }
  .hi-app-section {
    border-radius: 15px;
  }
  .hi-app-tile__label {
    font-size: 9px;
  }
  .hi-app-tile__meta {
    font-size: 7px;
  }
}
@media (max-width: 360px) {
  .hi-topbar {
    grid-template-columns: 58px minmax(0, 1fr) 58px;
  }
  .hi-mobile-header h1 {
    font-size: 21px;
  }
  .hi-portal-dot {
    width: 78px;
  }
}
@media (max-height: 780px) {
  .hi-hero__hud,
  .hi-apps-view {
    padding-top: calc(var(--hi-shell-top, 0px) + 6px);
    padding-bottom: calc(var(--hi-shell-bottom, 0px) + max(6px, env(safe-area-inset-bottom)));
  }
  .hi-topbar {
    align-items: center;
  }
  .hi-mode-toggle {
    height: 32px;
  }
  .hi-mobile-header h1 {
    font-size: 20px;
  }
  .hi-mobile-header span {
    display: none;
  }
  .hi-mobile-header__rank {
    padding-top: 5px;
    padding-bottom: 5px;
  }
  .hi-selected-portal {
    padding: 8px 10px;
  }
  .hi-selected-portal__index {
    display: none;
  }
  .hi-selected-portal img {
    width: 30px;
    height: 30px;
  }
  .hi-selected-portal strong {
    font-size: 14px;
  }
  .hi-selected-portal span:last-child {
    font-size: 9px;
  }
  .hi-portal-arrow,
  .hi-portal-enter {
    min-height: 40px;
  }
  .hi-portal-dot {
    min-height: 50px;
  }
  .hi-portal-dot img {
    width: 23px;
    height: 23px;
  }
  .hi-portal-dot span {
    font-size: 9.5px;
  }
  .hi-apps-view {
    gap: 7px;
  }
  .hi-apps-shell {
    gap: 6px;
  }
  .hi-app-section {
    padding: 7px;
  }
  .hi-app-section__header {
    margin-bottom: 5px;
    font-size: 8px;
  }
  .hi-app-grid {
    gap: 5px;
  }
  .hi-app-tile {
    min-height: 56px;
    gap: 2px;
    padding: 4px 3px 5px;
    border-radius: 12px;
  }
  .hi-app-tile__icon {
    width: 30px;
    height: 30px;
    border-radius: 11px;
  }
  .hi-app-tile__meta {
    display: none;
  }
}
@media (max-height: 680px) {
  .hi-hero__hud,
  .hi-apps-view {
    padding-top: calc(var(--hi-shell-top, 0px) + 4px);
    padding-bottom: calc(var(--hi-shell-bottom, 0px) + max(2px, env(safe-area-inset-bottom)));
  }
  .hi-topbar {
    gap: 4px;
  }
  .hi-mobile-header h1 {
    font-size: 17px;
  }
  .hi-portal-bottom {
    gap: 4px;
  }
  .hi-apps-view {
    gap: 5px;
  }
  .hi-apps-shell {
    gap: 5px;
  }
  .hi-app-section {
    padding: 5px;
  }
  .hi-app-section__header {
    margin-bottom: 4px;
    font-size: 8px;
  }
  .hi-app-grid {
    gap: 4px;
  }
  .hi-app-tile {
    min-height: 50px;
    gap: 2px;
    padding: 4px 3px 5px;
    border-radius: 11px;
  }
  .hi-app-tile__icon {
    width: clamp(26px, 5vh, 38px);
    height: clamp(26px, 5vh, 38px);
    border-radius: 10px;
  }
  .hi-app-tile__label {
    font-size: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hi-rift-sweep,
  .hi-portal-jump,
  .hi-portal-jump__tunnel,
  .hi-portal-jump__ring,
  .hi-portal-jump__core,
  .hi-portal-jump__flash,
  .hi-app-section,
  .hi-app-tile,
  .hi-app-launch,
  .hi-app-launch img,
  .hi-app-launch span {
    animation: none !important;
  }
  .hi-hero--shift-left,
  .hi-hero--shift-right {
    transform: none;
  }
}
`;
