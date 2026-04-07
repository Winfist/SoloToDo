/**
 * AuthTunnelScene – 3D Portal Entry for Login/Register
 *
 * Full-screen R3F Canvas. The form is NOT rendered here —
 * it stays as a fixed CSS overlay in AuthScreen for stability.
 * This scene only handles the cinematic 3D experience.
 */
import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import AuthTunnelWalls from "./AuthTunnelWalls";
import AuthRuneParticles from "./AuthRuneParticles";
import SystemPortal from "./SystemPortal";
import { useAuthScrollCamera } from "./useAuthScrollCamera";

// ── Camera controller with FOV animation + mouse look ────────────────────────
function AuthCameraController({ scrollContainerRef, onProgress, onComplete, autoApproachRef, sharedProgressRef }) {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    function onMove(e) {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const progressRef = useAuthScrollCamera(scrollContainerRef, camera, onComplete, onProgress, autoApproachRef);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = progressRef.current;
    if (sharedProgressRef) sharedProgressRef.current = p;

    // ── FOV: narrows during approach, opens at portal reveal ──────────────
    if (camera.isPerspectiveCamera) {
      let targetFOV = 68;
      if (p < 0.40) {
        targetFOV = 68;
      } else if (p < 0.70) {
        targetFOV = 68 - (p - 0.40) / 0.30 * 6; // 68→62
      } else if (p < 0.88) {
        targetFOV = 62;
      } else {
        targetFOV = 62 + (p - 0.88) / 0.12 * 10; // 62→72
      }
      camera.fov += (targetFOV - camera.fov) * 0.05;
      camera.updateProjectionMatrix();
    }

    // ── Mouse parallax ─────────────────────────────────────────────────────
    // Fully disabled above 0.85 so form is rock-steady
    const mouseAmp = p > 0.85 ? 0 : 0.025 * (1 - Math.max(0, (p - 0.75) / 0.10));
    targetRef.current.rx = THREE.MathUtils.lerp(targetRef.current.rx, mouseRef.current.y * mouseAmp, 0.04);
    targetRef.current.ry = THREE.MathUtils.lerp(targetRef.current.ry, mouseRef.current.x * -mouseAmp, 0.04);

    // ── Resonance shake (0.60–0.84 only, stops before form) ───────────────
    if (p > 0.60 && p < 0.84) {
      const t2 = (p - 0.60) / 0.24; // 0→1 over that window
      const fadeOut = 1 - Math.pow(t2, 1.5); // fades to 0 at p=0.84
      const intensity = Math.pow(t2, 1.5) * fadeOut * 0.010;
      targetRef.current.rx += Math.sin(t * 17.1) * intensity;
      targetRef.current.ry += Math.sin(t * 13.9) * intensity;
    }

    // ── Dread-zone sway ────────────────────────────────────────────────────
    if (p > 0.30 && p < 0.65) {
      const sway = Math.sin((p - 0.30) / 0.35 * Math.PI) * 0.005;
      targetRef.current.rx += Math.sin(t * 0.7) * sway;
      targetRef.current.ry += Math.sin(t * 0.9) * sway;
    }

    camera.rotation.x = targetRef.current.rx;
    camera.rotation.y = targetRef.current.ry;
  });

  return null;
}

// ── Pulsing purple atmosphere light ──────────────────────────────────────────
function AtmosphereLight({ progressRef }) {
  const lightRef = useRef();
  const fillRef = useRef();

  useFrame(({ clock }) => {
    const p = progressRef?.current ?? 0;
    const t = clock.getElapsedTime();
    const aw = Math.min(1, Math.sqrt(p * 1.3));

    if (lightRef.current) {
      // Main gate light: purple, grows with approach
      lightRef.current.intensity = aw * (4 + 2 * Math.abs(Math.sin(t * 1.1)));
    }
    if (fillRef.current) {
      // Secondary violet fill
      fillRef.current.intensity = aw * (1.5 + Math.abs(Math.sin(t * 0.7)) * 0.8);
    }
  });

  return (
    <>
      <pointLight ref={lightRef} color="#7c3aed" intensity={0} distance={45} decay={2} position={[0, 1, -1]} />
      <pointLight ref={fillRef} color="#4f46e5" intensity={0} distance={30} decay={2} position={[0, -1, 3]} />
    </>
  );
}

// ── Main scene export ─────────────────────────────────────────────────────────
export default function AuthTunnelScene({
  scrollContainerRef,
  onProgress,
  onComplete,
  autoApproachRef,
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.5);
  const sharedProgressRef = useRef(0);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
      frameloop="always"
    >
      {/* Dense atmosphere fog */}
      <fogExp2 attach="fog" color="#040210" density={0.065} />
      <ambientLight intensity={0.018} color="#08051a" />

      {/* Deep indigo fill light behind camera */}
      <pointLight color="#1a0050" intensity={0.35} distance={22} decay={2} position={[0, 0, 22]} />

      {/* Purple atmosphere that grows with approach */}
      <AtmosphereLight progressRef={sharedProgressRef} />

      <PerspectiveCamera makeDefault fov={68} near={0.1} far={60} position={[0, 0, 20]} />
      <AuthCameraController
        scrollContainerRef={scrollContainerRef}
        onProgress={onProgress}
        onComplete={onComplete}
        autoApproachRef={autoApproachRef}
        sharedProgressRef={sharedProgressRef}
      />

      <Suspense fallback={null}>
        <AuthTunnelWalls mobile={mobile} />
        <SystemPortal progressRef={sharedProgressRef} />
        <AuthRuneParticles progressRef={sharedProgressRef} mobile={mobile} />
      </Suspense>
    </Canvas>
  );
}
