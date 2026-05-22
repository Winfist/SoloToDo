/**
 * SystemPortal – Abyssal Sovereign purple system gate at tunnel end
 *
 * Reuses portalGlow.js shader with Abyssal Sovereign purple (#7c3aed).
 * Holographic scanlines blend in near the form reveal point.
 */
import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { portalGlowVert, portalGlowFrag } from "../shaders/portalGlow";

// Abyssal Sovereign purple — matches the auth form exactly
const PORTAL_COLOR = new THREE.Color("#7c3aed");
const PULSE_SPEED = 2.4;

// ── Add holographic scanline overlay to frag shader ───────────────────────────
const authPortalFrag =
  "uniform float holographic;\n" +
  portalGlowFrag.replace(
    "gl_FragColor = vec4(finalColor, alpha);",
    [
      "  float scanline = step(0.5, fract(vUv.y * 40.0 + time * 0.5));",
      "  finalColor += holographic * scanline * rankColor * 0.18 * corona;",
      "  gl_FragColor = vec4(finalColor, alpha);",
    ].join("\n")
  );

const SystemPortalMaterial = shaderMaterial(
  { rankColor: PORTAL_COLOR, time: 0, pulseSpeed: PULSE_SPEED, progress: 0, holographic: 0 },
  portalGlowVert,
  authPortalFrag
);
extend({ SystemPortalMaterial });

// ── Purple glow discs ─────────────────────────────────────────────────────────
function GlowDiscs({ progressRef }) {
  const refs = useRef([]);
  const opacities = [0.07, 0.11, 0.16];
  const radii     = [7, 4.8, 3.2];

  useFrame(() => {
    const aw = Math.sqrt(Math.min(1, (progressRef?.current ?? 0) * 1.2));
    refs.current.forEach((mesh, i) => {
      if (mesh) mesh.material.opacity = aw * opacities[i];
    });
  });

  return (
    <group>
      {radii.map((r, i) => (
        <mesh key={i} ref={el => refs.current[i] = el} position={[0, 0, -0.25 - i * 0.08]}>
          <circleGeometry args={[r, 48]} />
          <meshBasicMaterial
            color="#7c3aed" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Expanding pulse rings ─────────────────────────────────────────────────────
function PulseRings({ progressRef }) {
  const r0 = useRef(), r1 = useRef();

  useFrame(({ clock }) => {
    const p = progressRef?.current ?? 0;
    const t = clock.getElapsedTime();
    const speed = 0.22 + p * 1.2;
    const maxOp = Math.min(0.50, p * 0.65);

    [[r0, 0], [r1, 0.5]].forEach(([ref, phase]) => {
      if (!ref.current) return;
      if (p < 0.04) { ref.current.material.opacity = 0; return; }
      const pv = ((t * speed + phase) % 1);
      ref.current.scale.setScalar(1 + pv * 3.0);
      ref.current.material.opacity = maxOp * Math.pow(1 - pv, 2);
    });
  });

  return (
    <group>
      {[r0, r1].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[2.9, 3.4, 64]} />
          <meshBasicMaterial
            color="#a78bfa" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Rotating frame rings ──────────────────────────────────────────────────────
function PortalRings({ progressRef }) {
  const ring1 = useRef(), ring2 = useRef(), ring3 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const aw = Math.min(1, Math.sqrt((progressRef?.current ?? 0) * 1.25));

    if (ring1.current) {
      ring1.current.rotation.z += 0.18 * aw * 0.016;
      ring1.current.material.opacity = 0.55 * aw;
    }
    if (ring2.current) {
      ring2.current.rotation.z -= 0.30 * aw * 0.016;
      ring2.current.rotation.x = Math.sin(t * 0.4) * 0.10;
      ring2.current.material.opacity = 0.40 * aw;
    }
    if (ring3.current) {
      ring3.current.rotation.z += 0.45 * aw * 0.016;
      ring3.current.rotation.y = Math.sin(t * 0.6) * 0.15;
      ring3.current.material.opacity = 0.20 * aw;
    }
  });

  return (
    <>
      {/* Outer main ring */}
      <mesh ref={ring1}>
        <torusGeometry args={[3.05, 0.22, 16, 80]} />
        <meshStandardMaterial
          color="#7c3aed" emissive="#7c3aed" emissiveIntensity={2.0}
          transparent opacity={0} toneMapped={false}
        />
      </mesh>
      {/* Inner thin ring */}
      <mesh ref={ring2}>
        <torusGeometry args={[2.55, 0.045, 8, 60]} />
        <meshStandardMaterial
          color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.5}
          transparent opacity={0} toneMapped={false}
        />
      </mesh>
      {/* Wide accent ring */}
      <mesh ref={ring3}>
        <torusGeometry args={[3.65, 0.03, 8, 80]} />
        <meshStandardMaterial
          color="#6d28d9" emissive="#6d28d9" emissiveIntensity={1.2}
          transparent opacity={0} toneMapped={false}
        />
      </mesh>
    </>
  );
}

// ── Main portal ───────────────────────────────────────────────────────────────
export default function SystemPortal({ progressRef }) {
  const matRef   = useRef();
  const lightRef = useRef();
  const light2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = progressRef?.current ?? 0;
    const aw = Math.min(1, Math.sqrt(p * 1.2));

    if (matRef.current) {
      matRef.current.time = t;
      matRef.current.progress = p;
      matRef.current.holographic = Math.max(0, Math.min(1, (p - 0.80) / 0.18));
    }
    if (lightRef.current) {
      lightRef.current.intensity = aw * (9 + 3 * Math.abs(Math.sin(t * 1.3)));
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = aw * 4;
    }
  });

  const discGeo = useMemo(() => new THREE.CircleGeometry(3.0, 96), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Portal void disc */}
      <mesh geometry={discGeo} position={[0, 0, 0.01]}>
        <systemPortalMaterial ref={matRef} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <GlowDiscs progressRef={progressRef} />
      <PulseRings progressRef={progressRef} />
      <PortalRings progressRef={progressRef} />

      {/* Primary purple gate light */}
      <pointLight ref={lightRef}  color="#7c3aed" intensity={0} distance={40} decay={2} />
      {/* Violet fill light slightly behind camera */}
      <pointLight ref={light2Ref} color="#a78bfa" intensity={0} distance={25} decay={2} position={[0, 0, 4]} />
    </group>
  );
}
