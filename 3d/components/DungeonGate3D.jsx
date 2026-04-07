import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { portalGlowVert, portalGlowFrag } from "../shaders/portalGlow";

const PortalMaterial = shaderMaterial(
  { rankColor: new THREE.Color("#22d3ee"), time: 0, pulseSpeed: 2.0 },
  portalGlowVert,
  portalGlowFrag
);
extend({ PortalMaterial });

const RANK_CFG = {
  E:   { pulseSpeed: 1.2, emissive: 0.8,  lights: [2,0],    numCracks: 6,  numDebris: 12, numOrbs: 0 },
  D:   { pulseSpeed: 1.8, emissive: 1.1,  lights: [3,0],    numCracks: 8,  numDebris: 16, numOrbs: 3 },
  C:   { pulseSpeed: 2.0, emissive: 1.3,  lights: [3.5,0],  numCracks: 9,  numDebris: 18, numOrbs: 4 },
  B:   { pulseSpeed: 2.5, emissive: 1.6,  lights: [5,1.5],  numCracks: 11, numDebris: 20, numOrbs: 5 },
  A:   { pulseSpeed: 3.0, emissive: 2.0,  lights: [7,2.5],  numCracks: 12, numDebris: 22, numOrbs: 6 },
  S:   { pulseSpeed: 4.0, emissive: 3.0,  lights: [10,5],   numCracks: 14, numDebris: 28, numOrbs: 8 },
  SSS: { pulseSpeed: 5.5, emissive: 4.0,  lights: [14,7],   numCracks: 16, numDebris: 32, numOrbs: 10 },
};

// ── Pulse rings: expand and fade outward from gate ───────────────────────────
function PulseRings({ rankColor, progressRef }) {
  const r0 = useRef(), r1 = useRef(), r2 = useRef();

  useFrame(({ clock }) => {
    const p    = progressRef.current;
    const t    = clock.getElapsedTime();
    const speed = 0.35 + p * 1.8;
    const maxOp = Math.min(0.55, p * 0.75);

    [[r0, 0], [r1, 0.333], [r2, 0.666]].forEach(([ref, phase]) => {
      if (!ref.current) return;
      if (p < 0.06) { ref.current.material.opacity = 0; return; }
      const pv = ((t * speed + phase) % 1);
      ref.current.scale.setScalar(1 + pv * 3.2);
      ref.current.material.opacity = maxOp * Math.pow(1 - pv, 2);
    });
  });

  return (
    <group>
      {[r0, r1, r2].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[3.1, 3.55, 64]} />
          <meshBasicMaterial
            color={rankColor} transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Crack arms ───────────────────────────────────────────────────────────────
function CrackArms({ rankColor, rank, mobile, progressRef }) {
  const cfg     = RANK_CFG[rank] ?? RANK_CFG.E;
  const numArms = mobile ? Math.floor(cfg.numCracks * 0.6) : cfg.numCracks;

  const arms = useMemo(() => {
    const color = new THREE.Color(rankColor);
    return Array.from({ length: numArms }, (_, i) => {
      const baseAngle   = (i / numArms) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const armLength   = 0.7 + Math.random() * 1.8;
      const numSegments = 7 + Math.floor(Math.random() * 5);
      const points      = [];
      let angle = baseAngle;
      for (let j = 0; j <= numSegments; j++) {
        const t = j / numSegments;
        const r = 3.25 + armLength * Math.pow(t, 0.65);
        angle += (Math.random() - 0.5) * 0.28;
        points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, (Math.random() - 0.5) * 0.35));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      });
      return { line: new THREE.Line(geo, mat), phaseOffset: Math.random() * Math.PI * 2 };
    });
  }, [numArms, rankColor]);

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const aw = Math.min(1, Math.sqrt(progressRef.current * 1.3));
    arms.forEach(({ line, phaseOffset }) => {
      line.material.opacity = aw * (0.25 + Math.random() * 0.6)
        * (0.4 + 0.6 * Math.abs(Math.sin(t * 9.5 + phaseOffset)));
    });
  });

  return <group>{arms.map(({ line }, i) => <primitive key={i} object={line} />)}</group>;
}

// ── Debris ring ───────────────────────────────────────────────────────────────
function DebrisRing({ rankColor, rank, mobile, progressRef }) {
  const cfg   = RANK_CFG[rank] ?? RANK_CFG.E;
  const count = mobile ? Math.floor(cfg.numDebris * 0.5) : cfg.numDebris;

  const debris = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      startAngle: (i / count) * Math.PI * 2,
      radius:     3.2 + (Math.random() - 0.5) * 1.1,
      sizeX:      0.05 + Math.random() * 0.15,
      speed:      (0.15 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1),
      zWave:      Math.random() * Math.PI * 2,
      zAmp:       0.15 + Math.random() * 0.5,
    }))
  , [count]);

  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t  = clock.getElapsedTime();
    const aw = Math.min(1, Math.sqrt(progressRef.current * 1.3));
    // Orbit speed scales with awakening
    debris.forEach((d, i) => {
      const a = d.startAngle + t * d.speed * aw;
      dummy.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius, Math.sin(t * 0.7 + d.zWave) * d.zAmp);
      dummy.rotation.set(t * 0.8, t * 0.5 + i, t * 0.6);
      dummy.scale.setScalar(aw);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[0.12, 0.05, 0.03]} />
      <meshStandardMaterial
        color={rankColor} emissive={rankColor} emissiveIntensity={cfg.emissive * 0.6}
        roughness={0.1} metalness={0.9} toneMapped={false}
      />
    </instancedMesh>
  );
}

// ── Energy orbs ───────────────────────────────────────────────────────────────
function EnergyOrbs({ rankColor, rank, mobile, progressRef }) {
  const cfg   = RANK_CFG[rank] ?? RANK_CFG.E;
  const count = mobile ? 0 : cfg.numOrbs;

  const orbs    = useMemo(() => Array.from({ length: count }, (_, i) => ({
    startAngle: (i / count) * Math.PI * 2,
    radius:     2.9 + Math.random() * 0.8,
    speed:      0.4 + Math.random() * 0.6,
    zPhase:     Math.random() * Math.PI * 2,
    size:       0.06 + Math.random() * 0.1,
  })), [count]);

  const orbRefs = useRef([]);

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const aw = Math.min(1, progressRef.current * 1.5);
    orbs.forEach((o, i) => {
      const ref = orbRefs.current[i];
      if (!ref) return;
      const a = o.startAngle + t * o.speed;
      ref.position.set(Math.cos(a) * o.radius, Math.sin(a) * o.radius, Math.sin(t * 1.2 + o.zPhase) * 0.4);
      ref.scale.setScalar(aw);
    });
  });

  if (count === 0) return null;
  return (
    <group>
      {orbs.map((o, i) => (
        <mesh key={i} ref={el => orbRefs.current[i] = el}>
          <sphereGeometry args={[o.size, 8, 8]} />
          <meshBasicMaterial
            color={rankColor} transparent opacity={0.85}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Bloom glow discs that fade in with awakening ─────────────────────────────
function GlowDiscs({ rankColor, isHighRank, progressRef }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const radii   = [8, 5.5, 4, 3];
  const baseOps = isHighRank
    ? [0.022, 0.019, 0.016, 0.013]
    : [0.014, 0.012, 0.010, 0.008];

  useFrame(() => {
    const aw = Math.min(1, Math.sqrt(progressRef.current * 1.2));
    refs.forEach((ref, i) => {
      if (ref.current) ref.current.material.opacity = baseOps[i] * aw;
    });
  });

  return (
    <group>
      {radii.map((r, i) => (
        <mesh key={i} ref={refs[i]} position={[0, 0, -0.3 - i * 0.08]}>
          <circleGeometry args={[r, 64]} />
          <meshBasicMaterial
            color={rankColor} transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false}
            side={THREE.DoubleSide} toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Main gate ─────────────────────────────────────────────────────────────────
export default function DungeonGate3D({
  rankColor = "#6b7280",
  rank = "E",
  mobile = false,
  progressRef,
}) {
  const _dummyRef = useRef(0); // fallback if no progressRef
  const pRef = progressRef ?? _dummyRef;

  const portalMatRef = useRef();
  const ring1Ref     = useRef();
  const ring2Ref     = useRef();
  const ring3Ref     = useRef();
  const ring4Ref     = useRef();
  const lightRef     = useRef();
  const light2Ref    = useRef();

  const cfg        = RANK_CFG[rank] ?? RANK_CFG.E;
  const threeColor = useMemo(() => new THREE.Color(rankColor), [rankColor]);
  const isHighRank = rank === "S" || rank === "SSS";
  const isMidRank  = rank === "A" || rank === "B";

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const p  = pRef.current;
    // Awakening: square-root ramp for fast initial reveal, gentle finish
    const aw = Math.min(1, Math.sqrt(p * 1.25));

    // Portal shader
    if (portalMatRef.current) portalMatRef.current.time = t;

    // Ring 1: slow clockwise, scale pulse at high rank
    if (ring1Ref.current) {
      // Ring spin speed also wakes up with approach
      ring1Ref.current.rotation.z = t * 0.18 * (0.1 + 0.9 * aw);
      if (isHighRank && aw > 0.5) {
        const pulse = 1 + Math.sin(t * cfg.pulseSpeed) * 0.04;
        ring1Ref.current.scale.setScalar(pulse);
      }
    }

    // Ring 2: counter-clockwise, faster as awakening grows
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.32 * (0.1 + 0.9 * aw);

    // Ring 3: wobble on x-axis
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.55 * aw;
      ring3Ref.current.rotation.x = Math.sin(t * 0.4) * 0.12 * aw;
    }

    // Ring 4 (B+ rank): wild rotation
    if (ring4Ref.current) {
      ring4Ref.current.rotation.z = -t * 0.9 * aw;
      ring4Ref.current.rotation.y = Math.sin(t * 0.6) * 0.2;
    }

    // Emissive on rings scales with awakening (handled via material refs below)

    // Gate main light
    if (lightRef.current) {
      const flicker = (isHighRank || isMidRank)
        ? (0.7 + 0.3 * Math.sin(t * cfg.pulseSpeed * 2.1))
        : 1;
      lightRef.current.intensity = cfg.lights[0] * aw * flicker;
    }

    // Secondary accent light
    if (light2Ref.current) {
      light2Ref.current.intensity = cfg.lights[1] * aw
        * (0.5 + 0.5 * Math.abs(Math.sin(t * 11.3 + 1.2)));
    }
  });

  const emIntensity = cfg.emissive; // static base; scaled visually by awakening on lights

  return (
    <group position={[0, 0, 0]}>

      {/* Glow bloom discs — fade in with awakening */}
      <GlowDiscs rankColor={rankColor} isHighRank={isHighRank} progressRef={pRef} />

      {/* Pulse rings — expand outward from gate */}
      <PulseRings rankColor={rankColor} progressRef={pRef} />

      {/* Portal void disc */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[3.0, 96]} />
        <portalMaterial
          ref={portalMatRef}
          rankColor={threeColor}
          time={0}
          pulseSpeed={cfg.pulseSpeed}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Ring 1: thick outer frame */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.2, 0.22, 16, 100]} />
        <meshStandardMaterial
          color={rankColor} emissive={rankColor} emissiveIntensity={emIntensity}
          roughness={0.12} metalness={0.9} toneMapped={false}
        />
      </mesh>

      {/* Ring 2: thin inner, counter-rotates */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.6, 0.04, 6, 80]} />
        <meshStandardMaterial
          color={rankColor} emissive={rankColor} emissiveIntensity={emIntensity * 0.7}
          roughness={0.1} metalness={0.95} transparent opacity={0.8} toneMapped={false}
        />
      </mesh>

      {/* Ring 3: medium outer accent */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.55, 0.035, 6, 80]} />
        <meshStandardMaterial
          color={rankColor} emissive={rankColor} emissiveIntensity={emIntensity * 0.5}
          transparent opacity={0.65} toneMapped={false}
        />
      </mesh>

      {/* Ring 4: outermost (B+ rank only) */}
      {(isMidRank || isHighRank) && (
        <mesh ref={ring4Ref}>
          <torusGeometry args={[4.0, 0.025, 4, 80]} />
          <meshStandardMaterial
            color={rankColor} emissive={rankColor} emissiveIntensity={emIntensity * 0.4}
            transparent opacity={0.5} toneMapped={false}
          />
        </mesh>
      )}

      {/* Crack arms */}
      <CrackArms rankColor={rankColor} rank={rank} mobile={mobile} progressRef={pRef} />

      {/* Debris shards */}
      <DebrisRing rankColor={rankColor} rank={rank} mobile={mobile} progressRef={pRef} />

      {/* Energy orbs (B+) */}
      <EnergyOrbs rankColor={rankColor} rank={rank} mobile={mobile} progressRef={pRef} />

      {/* Main gate light */}
      <pointLight ref={lightRef} color={rankColor} intensity={0} distance={24} decay={2} />

      {/* Secondary accent */}
      {cfg.lights[1] > 0 && (
        <pointLight
          ref={light2Ref}
          color={isHighRank ? "#ff2200" : rankColor}
          intensity={0} distance={12} decay={2} position={[0, 0, 0.5]}
        />
      )}

      {/* Deep void light – always subtle */}
      <pointLight color="#0022ff" intensity={0.35} distance={6} decay={2} position={[0, 0, -1]} />
    </group>
  );
}
