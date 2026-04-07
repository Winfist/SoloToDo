import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const _dummy = new THREE.Object3D();

/**
 * GateParticles – AAA Premium Edition
 *
 * Three particle systems:
 *  1. INFLOW  – particles drifting through corridor, spiralling INTO gate
 *  2. OUTFLOW – dark energy wisps ejected FROM gate toward camera (with ghost trails)
 *  3. DUST    – micro-particles with Brownian motion for atmospheric density
 *
 * All use InstancedMesh for single-draw-call rendering.
 * Size + color variation per instance for organic feel.
 */
export default function GateParticles({ rankColor = "#6b7280", particleCount = 500, progressRef }) {
  const inflowCount = Math.floor(particleCount * 0.6);
  const outflowCount = Math.floor(particleCount * 0.2);
  const dustCount = particleCount - inflowCount - outflowCount;
  // Each outflow particle gets 3 ghost trail instances
  const trailCount = outflowCount * 3;

  // ── Inflow particles – sucked INTO the gate ───────────────────────────
  const inflow = useMemo(() =>
    Array.from({ length: inflowCount }, () => ({
      x: (Math.random() - 0.5) * 6.5,
      y: (Math.random() - 0.5) * 6.5,
      z: -1 - Math.random() * 47,
      speed: 0.02 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      spiralR: 0.2 + Math.random() * 1.8,
      baseScale: 0.03 + Math.random() * 0.12, // wider aura range
      sizeVariant: 0.5 + Math.random() * 3.0,    // per-instance clump size multiplier
    }))
    , [inflowCount]);

  // ── Outflow particles – ejected FROM the gate ─────────────────────────
  const outflow = useMemo(() =>
    Array.from({ length: outflowCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.5 + Math.random() * 3.0,
      z: 0.5 + Math.random() * 20,
      speed: 0.03 + Math.random() * 0.08,
      drift: (Math.random() - 0.5) * 0.02,
      phase: Math.random() * Math.PI * 2,
      baseScale: 0.04 + Math.random() * 0.08,
      // Trail history positions
      trail: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ],
    }))
    , [outflowCount]);

  // ── Dust motes – micro-particles with Brownian motion ──────────────────
  const dust = useMemo(() =>
    Array.from({ length: dustCount }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      z: -5 + Math.random() * 50,
      vx: 0, vy: 0, vz: 0,
      baseScale: 0.003 + Math.random() * 0.01,
    }))
    , [dustCount]);

  const inflowRef = useRef();
  const outflowRef = useRef();
  const trailRef = useRef();
  const dustRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const raw = progressRef?.current ?? 0;
    const aw = Math.min(1, Math.sqrt(raw * 1.25));

    // ── Inflow animation ──────────────────────────────────────────────────
    if (inflowRef.current) {
      for (let i = 0; i < inflow.length; i++) {
        const p = inflow[i];
        const progress = Math.max(0, 1 + p.z / 48);

        const pull = progress * progress * progress * 0.16 * aw;
        p.z += (p.speed + pull) * Math.max(0.05, aw);

        if (p.z > 0.2) {
          p.z = -47 - Math.random();
          p.x = (Math.random() - 0.5) * 6.5;
          p.y = (Math.random() - 0.5) * 6.5;
        }

        const orbitAngle = t * 2.2 * (0.1 + 0.9 * aw) + p.phase;
        const orbitAmount = p.spiralR * Math.pow(progress, 1.5);
        const finalX = p.x * (1 - progress) + Math.cos(orbitAngle) * orbitAmount;
        const finalY = p.y * (1 - progress) + Math.sin(orbitAngle) * orbitAmount;

        const scale = Math.max(0.001, p.baseScale * p.sizeVariant * (1 - progress * 0.8) * aw);

        _dummy.position.set(finalX, finalY, p.z);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        inflowRef.current.setMatrixAt(i, _dummy.matrix);
      }
      inflowRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Outflow animation with trail tracking ─────────────────────────────
    if (outflowRef.current) {
      for (let i = 0; i < outflow.length; i++) {
        const p = outflow[i];

        if (raw < 0.25) {
          _dummy.position.set(0, 0, 0);
          _dummy.scale.setScalar(0.001);
          _dummy.updateMatrix();
          outflowRef.current.setMatrixAt(i, _dummy.matrix);
          // Hide trails too
          if (trailRef.current) {
            for (let g = 0; g < 3; g++) {
              trailRef.current.setMatrixAt(i * 3 + g, _dummy.matrix);
            }
          }
          continue;
        }

        // Store previous position for trail
        p.trail[2] = { ...p.trail[1] };
        p.trail[1] = { ...p.trail[0] };
        p.trail[0] = {
          x: Math.cos(p.angle) * p.radius,
          y: Math.sin(p.angle) * p.radius,
          z: p.z,
        };

        p.z += p.speed * aw;
        p.angle += p.drift;

        if (p.z > 22) {
          p.z = 0.3 + Math.random() * 0.5;
          p.angle = Math.random() * Math.PI * 2;
          p.radius = 0.3 + Math.random() * 2.5;
        }

        const fade = 1 - p.z / 22;
        const scale = Math.max(0.002, p.baseScale * fade * aw * (1.0 + 0.6 * Math.sin(t * 3 + p.phase)));

        const cx = Math.cos(p.angle) * p.radius;
        const cy = Math.sin(p.angle) * p.radius;

        _dummy.position.set(cx, cy, p.z);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        outflowRef.current.setMatrixAt(i, _dummy.matrix);

        // ── Ghost trail instances ─────────────────────────────────────────
        if (trailRef.current) {
          for (let g = 0; g < 3; g++) {
            const tp = p.trail[g];
            const trailFade = (1 - (g + 1) * 0.3) * fade;
            const ts = Math.max(0.001, scale * trailFade * 0.6);
            _dummy.position.set(tp.x, tp.y, tp.z);
            _dummy.scale.setScalar(ts);
            _dummy.updateMatrix();
            trailRef.current.setMatrixAt(i * 3 + g, _dummy.matrix);
          }
        }
      }
      outflowRef.current.instanceMatrix.needsUpdate = true;
      if (trailRef.current) trailRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Dust motes – Brownian motion ───────────────────────────────────────
    if (dustRef.current) {
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        // Random impulses (Brownian)
        d.vx += (Math.random() - 0.5) * 0.002;
        d.vy += (Math.random() - 0.5) * 0.002;
        d.vz += (Math.random() - 0.5) * 0.001;
        // Damping
        d.vx *= 0.98; d.vy *= 0.98; d.vz *= 0.98;
        d.x += d.vx; d.y += d.vy; d.z += d.vz;

        // Keep in bounds
        if (Math.abs(d.x) > 4) d.vx *= -0.5;
        if (Math.abs(d.y) > 4) d.vy *= -0.5;
        if (d.z < -5 || d.z > 50) d.vz *= -0.5;

        const scale = d.baseScale * aw;
        _dummy.position.set(d.x, d.y, d.z);
        _dummy.scale.setScalar(Math.max(0.001, scale));
        _dummy.updateMatrix();
        dustRef.current.setMatrixAt(i, _dummy.matrix);
      }
      dustRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Inflow particles – rank color, varied sizes */}
      <instancedMesh ref={inflowRef} args={[null, null, inflowCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Outflow wisps – core particles */}
      <instancedMesh ref={outflowRef} args={[null, null, outflowCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Outflow ghost trails – fainter, smaller */}
      <instancedMesh ref={trailRef} args={[null, null, trailCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Dust motes – white/blue micro-particles */}
      <instancedMesh ref={dustRef} args={[null, null, dustCount]}>
        <sphereGeometry args={[1, 3, 3]} />
        <meshBasicMaterial
          color="#8899cc"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
