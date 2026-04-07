import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const _dummy = new THREE.Object3D();

/**
 * GateParticles
 *
 * Two particle systems:
 *  1. INFLOW  – particles drifting through the corridor and spiralling INTO the gate
 *  2. OUTFLOW – dark energy wisps ejected FROM the gate outward (toward camera)
 *
 * Both use InstancedMesh for single-draw-call rendering.
 */
export default function GateParticles({ rankColor = "#6b7280", particleCount = 500, progressRef }) {
  const inflowCount  = Math.floor(particleCount * 0.7);
  const outflowCount = particleCount - inflowCount;

  // ── Inflow particles – sucked INTO the gate ───────────────────────────
  const inflow = useMemo(() =>
    Array.from({ length: inflowCount }, () => ({
      x:            (Math.random() - 0.5) * 6.5,
      y:            (Math.random() - 0.5) * 6.5,
      z:            -1 - Math.random() * 47,          // spread along corridor
      speed:        0.02 + Math.random() * 0.06,
      phase:        Math.random() * Math.PI * 2,
      spiralR:      0.2 + Math.random() * 1.8,
      baseScale:    0.025 + Math.random() * 0.06,
    }))
  , [inflowCount]);

  // ── Outflow particles – ejected FROM the gate ─────────────────────────
  const outflow = useMemo(() =>
    Array.from({ length: outflowCount }, () => ({
      angle:        Math.random() * Math.PI * 2,
      radius:       0.5 + Math.random() * 3.0,        // radial spread from gate center
      z:            0.5 + Math.random() * 20,         // behind camera (positive z = toward cam)
      speed:        0.03 + Math.random() * 0.08,
      drift:        (Math.random() - 0.5) * 0.02,
      phase:        Math.random() * Math.PI * 2,
      baseScale:    0.02 + Math.random() * 0.05,
    }))
  , [outflowCount]);

  const inflowRef  = useRef();
  const outflowRef = useRef();

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime();
    const raw = progressRef?.current ?? 0;
    const aw  = Math.min(1, Math.sqrt(raw * 1.25)); // matches DungeonGate3D awakening curve

    // ── Inflow animation ──────────────────────────────────────────────────
    if (inflowRef.current) {
      for (let i = 0; i < inflow.length; i++) {
        const p        = inflow[i];
        const progress = Math.max(0, 1 + p.z / 48); // 0 at back, 1 at gate

        // Exponential pull scales with awakening; minimum drift so particles don't freeze
        const pull = progress * progress * progress * 0.16 * aw;
        p.z       += (p.speed + pull) * Math.max(0.05, aw);

        if (p.z > 0.2) {
          // Respawn at corridor back
          p.z = -47 - Math.random();
          p.x = (Math.random() - 0.5) * 6.5;
          p.y = (Math.random() - 0.5) * 6.5;
        }

        // Orbit speed almost still at start, full speed when awake
        const orbitAngle  = t * 2.2 * (0.1 + 0.9 * aw) + p.phase;
        const orbitAmount = p.spiralR * Math.pow(progress, 1.5);
        const finalX      = p.x * (1 - progress) + Math.cos(orbitAngle) * orbitAmount;
        const finalY      = p.y * (1 - progress) + Math.sin(orbitAngle) * orbitAmount;

        // Scale by awakening — invisible when dormant, full size when awake
        const scale = Math.max(0.001, p.baseScale * (1 - progress * 0.8) * aw);

        _dummy.position.set(finalX, finalY, p.z);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        inflowRef.current.setMatrixAt(i, _dummy.matrix);
      }
      inflowRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Outflow animation ─────────────────────────────────────────────────
    if (outflowRef.current) {
      for (let i = 0; i < outflow.length; i++) {
        const p = outflow[i];

        if (raw < 0.25) {
          // Gate not yet awake enough — hide outflow particles
          _dummy.position.set(0, 0, 0);
          _dummy.scale.setScalar(0.001);
          _dummy.updateMatrix();
          outflowRef.current.setMatrixAt(i, _dummy.matrix);
          continue;
        }

        p.z     += p.speed * aw;
        p.angle += p.drift;

        if (p.z > 22) {
          p.z      = 0.3 + Math.random() * 0.5;
          p.angle  = Math.random() * Math.PI * 2;
          p.radius = 0.3 + Math.random() * 2.5;
        }

        const fade  = 1 - p.z / 22;
        const scale = Math.max(0.002, p.baseScale * fade * aw * (0.8 + 0.4 * Math.sin(t * 3 + p.phase)));

        _dummy.position.set(
          Math.cos(p.angle) * p.radius,
          Math.sin(p.angle) * p.radius,
          p.z
        );
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        outflowRef.current.setMatrixAt(i, _dummy.matrix);
      }
      outflowRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Inflow particles – rank color */}
      <instancedMesh ref={inflowRef} args={[null, null, inflowCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Outflow wisps – slightly darker / desaturated for void energy feel */}
      <instancedMesh ref={outflowRef} args={[null, null, outflowCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
