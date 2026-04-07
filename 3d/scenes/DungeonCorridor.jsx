import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";

import CorridorWalls from "../components/CorridorWalls";
import DungeonGate3D from "../components/DungeonGate3D";
import GateParticles from "../components/GateParticles";
import RuneParticles from "../components/RuneParticles";
import PostProcessing from "../components/PostProcessing";
import { useScrollCamera } from "../hooks/useScrollCamera";

const RANK_COLORS = {
  E: "#6b7280", D: "#22d3ee", C: "#34d399",
  B: "#a78bfa", A: "#f59e0b", S: "#ef4444", SSS: "#e879f9",
};

// ── Torch flame: organic flicker via product of two sine waves ───────────────
function TorchFlame({ position, phase = 0, rankColor, gateInfluence = 0 }) {
  const lightRef = useRef();
  const flameRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = Math.abs(
      Math.sin(t * 5.9 + phase) *
      Math.sin(t * 11.3 + phase * 1.7)
    );
    if (lightRef.current) lightRef.current.intensity = 0.65 + flicker * 1.1;
    if (flameRef.current) {
      // Torches near gate shift toward rank color
      if (gateInfluence > 0.1) {
        const hex = flicker > 0.6 ? 0xff9900 : 0xff6600;
        const base = new THREE.Color(hex);
        const rank = new THREE.Color(rankColor);
        base.lerp(rank, gateInfluence * 0.4);
        flameRef.current.material.color.copy(base);
      } else {
        flameRef.current.material.color.setHex(flicker > 0.6 ? 0xff9900 : 0xff6600);
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={flameRef} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.055, 5, 5]} />
        <meshBasicMaterial color="#ff8800" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshBasicMaterial
          color="#ff5500" transparent opacity={0.22}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#ff8800" intensity={0.65} distance={11} decay={2} />
    </group>
  );
}

// Torch positions: 8 depths × left + right = 16 torches
const TORCH_Z = [10, 20, 30, 40, 50, 60, 70, 80];
const TORCH_POSITIONS = TORCH_Z.flatMap((z, i) => [
  { pos: [-3.72, -0.85, z], phase: i * 1.37, z },
  { pos: [3.72, -0.85, z], phase: i * 1.37 + 0.73, z },
]);

// ── Pulsing atmosphere light that awakens with approach ───────────────────────
function AtmosphereLight({ rankColor, pulseSpeed, progressRef }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const p = progressRef.current;
    const aw = Math.min(1, Math.sqrt(p * 1.3));
    lightRef.current.intensity = aw * (0.5 + 0.18 * Math.sin(clock.getElapsedTime() * pulseSpeed * 0.5));
  });
  return <pointLight ref={lightRef} color={rankColor} intensity={0} distance={45} decay={2} position={[0, 2, -18]} />;
}

// ── Rank-colored key light that wakes up with approach ────────────────────────
function KeyLight({ rankColor, maxIntensity, progressRef }) {
  const lightRef = useRef();
  useFrame(() => {
    if (!lightRef.current) return;
    const aw = Math.min(1, Math.sqrt(progressRef.current * 1.3));
    lightRef.current.intensity = maxIntensity * aw;
  });
  return <pointLight ref={lightRef} color={rankColor} intensity={0} distance={50} decay={2} position={[0, 3, -22]} />;
}

// ── Camera controller with FOV animation ─────────────────────────────────────
function CameraController({ scrollContainerRef, onEnterGate, onProgress, autoApproachRef, sharedProgressRef }) {
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

  const progressRef = useScrollCamera(scrollContainerRef, camera, onEnterGate, onProgress, autoApproachRef);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = progressRef.current;
    if (sharedProgressRef) sharedProgressRef.current = p;

    // ── FOV animation: narrows during approach, snaps wide at entry ──────
    if (camera.isPerspectiveCamera) {
      let targetFOV = 74;
      if (p < 0.4) {
        targetFOV = 74;
      } else if (p < 0.8) {
        // Slow narrowing for tension
        targetFOV = 74 - (p - 0.4) * 15; // 74 → 68
      } else if (p >= 0.95) {
        // Snap wide for warp feel
        targetFOV = 85;
      } else {
        targetFOV = 68;
      }
      camera.fov += (targetFOV - camera.fov) * 0.05;
      camera.updateProjectionMatrix();
    }

    // Mouse look with reduced damping near gate
    const dampFactor = p > 0.7 ? 0.06 : 0.04;
    targetRef.current.rx = THREE.MathUtils.lerp(targetRef.current.rx, mouseRef.current.y * 0.032, dampFactor);
    targetRef.current.ry = THREE.MathUtils.lerp(targetRef.current.ry, mouseRef.current.x * -0.048, dampFactor);

    // Gate resonance shake — progressive build
    if (p > 0.3) {
      const intensity = Math.pow((p - 0.3) / 0.7, 2) * 0.025;
      targetRef.current.rx += Math.sin(t * 17.1) * intensity;
      targetRef.current.ry += Math.sin(t * 13.9) * intensity;
    }

    // Subtle camera sway in "dread zone" (30-60% progress)
    if (p > 0.3 && p < 0.7) {
      const sway = (p - 0.3) / 0.4 * 0.008;
      targetRef.current.rx += Math.sin(t * 0.7) * sway;
      targetRef.current.ry += Math.sin(t * 0.9) * sway;
    }

    camera.rotation.x = targetRef.current.rx;
    camera.rotation.y = targetRef.current.ry;
  });

  return null;
}

const PULSE_SPEEDS = { E: 1.2, D: 1.8, C: 2.0, B: 2.5, A: 3.0, S: 4.0, SSS: 5.5 };

export default function DungeonCorridor({
  dungeon,
  scrollContainerRef,
  onEnterGate,
  onProgress,
  autoApproachRef,
  progress = 0,
}) {
  const rank = dungeon?.rank ?? "E";
  const rankColor = RANK_COLORS[rank] ?? RANK_COLORS.E;
  const mobile = window.innerWidth < 768;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.5);
  const particleCount = mobile ? 140 : (dpr > 2 ? 340 : 650);
  const pulseSpeed = PULSE_SPEEDS[rank] ?? 2.0;
  const isHighRank = rank === "S" || rank === "SSS";

  const sharedProgressRef = useRef(progress);
  sharedProgressRef.current = progress;

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: !mobile,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
      frameloop="always"
    >
      {/* Dense fog */}
      <fogExp2 attach="fog" color="#03030a" density={0.052} />

      {/* Almost-pitch-black ambient */}
      <ambientLight intensity={0.025} color="#050510" />

      {/* Cool blue fill from behind camera */}
      <pointLight color="#0004cc" intensity={0.22} distance={24} decay={2} position={[0, 0, 28]} />

      {/* Gate key light and atmosphere */}
      <KeyLight rankColor={rankColor} maxIntensity={isHighRank ? 4.5 : 3.0} progressRef={sharedProgressRef} />
      <AtmosphereLight rankColor={rankColor} pulseSpeed={pulseSpeed} progressRef={sharedProgressRef} />

      {/* Camera */}
      <PerspectiveCamera makeDefault fov={74} near={0.1} far={140} position={[0, 0, 82]} />
      <CameraController
        scrollContainerRef={scrollContainerRef}
        onEnterGate={onEnterGate}
        onProgress={onProgress}
        autoApproachRef={autoApproachRef}
        sharedProgressRef={sharedProgressRef}
      />

      {/* Torch flames with gate color influence */}
      {TORCH_POSITIONS.map((t, i) => (
        <TorchFlame
          key={i}
          position={t.pos}
          phase={t.phase}
          rankColor={rankColor}
          gateInfluence={t.z < 25 ? 1 - t.z / 25 : 0}
        />
      ))}

      {/* Scene geometry */}
      <Suspense fallback={null}>
        <CorridorWalls rankColor={rankColor} />
      </Suspense>

      {/* Gate */}
      <DungeonGate3D
        rankColor={rankColor}
        rank={rank}
        mobile={mobile}
        progressRef={sharedProgressRef}
      />

      {/* Particles */}
      <GateParticles
        rankColor={rankColor}
        particleCount={particleCount}
        progressRef={sharedProgressRef}
      />

      {/* Rune particles (C+ ranks) */}
      <RuneParticles
        rankColor={rankColor}
        rank={rank}
        progressRef={sharedProgressRef}
      />

      {/* Stars visible through the rift */}
      <Stars radius={28} depth={6} count={mobile ? 60 : 180} factor={1.3} saturation={0} fade speed={0.12} />

      {/* Post-processing pipeline */}
      <PostProcessing progressRef={sharedProgressRef} rank={rank} />
    </Canvas>
  );
}
