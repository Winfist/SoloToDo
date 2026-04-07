import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { fogVert, fogFrag } from "../shaders/volumetricFog";

// ── Ground fog material ───────────────────────────────────────────────────────
const FogPlaneMaterial = shaderMaterial(
  { fogColor: new THREE.Color("#0a0a1a"), fogNear: 5, fogFar: 45 },
  fogVert,
  fogFrag
);
extend({ FogPlaneMaterial });

/**
 * Generates a canvas-based texture with ancient runes, cracked stone
 * seams, and rank-colored energy veins.
 */
function makeStoneTexture(rankColor) {
  const SIZE = 1024;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");

  // ── Base: very dark stone ──────────────────────────────────────────────
  ctx.fillStyle = "#030308";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Stone noise overlay
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 40)},${Math.floor(Math.random() * 40)},${Math.floor(Math.random() * 60)},0.08)`;
    ctx.fill();
  }

  // ── Horizontal stone block seams ──────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let y = 64; y < SIZE; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
  }
  for (let row = 0; row < SIZE / 64; row++) {
    const xOff = (row % 2 === 0) ? 0 : 128;
    for (let x = xOff; x < SIZE; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, row * 64);
      ctx.lineTo(x, (row + 1) * 64);
      ctx.stroke();
    }
  }

  // ── Energy veins – glowing cracks running through the stone ───────────
  const parseHex = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const [vr, vg, vb] = parseHex(rankColor.length === 7 ? rankColor : "#6b7280");

  for (let v = 0; v < 6; v++) {
    let x = Math.random() * SIZE;
    let y = Math.random() * SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 30; s++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.3) * 40;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},0.18)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},0.08)`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // ── Rune glyphs ────────────────────────────────────────────────────────
  const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

  ctx.font = "bold 18px monospace";
  ctx.fillStyle = `rgba(${vr},${vg},${vb},0.1)`;
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 18; col++) {
      ctx.fillText(RUNES[Math.floor(Math.random() * RUNES.length)], col * 57 + 4, row * 52 + 22);
    }
  }

  ctx.font = "bold 24px monospace";
  ctx.fillStyle = `rgba(${vr},${vg},${vb},0.3)`;
  for (let i = 0; i < 14; i++) {
    ctx.fillText(
      RUNES[Math.floor(Math.random() * RUNES.length)],
      Math.random() * SIZE * 0.9,
      Math.random() * SIZE * 0.9 + 24
    );
  }

  return new THREE.CanvasTexture(c);
}

/**
 * Creates a pulsing energy vein overlay texture.
 * Used as a second texture layer with time-based opacity.
 */
function makeVeinGlowTexture(rankColor) {
  const SIZE = 512;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, SIZE, SIZE);

  const parseHex = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const [vr, vg, vb] = parseHex(rankColor.length === 7 ? rankColor : "#6b7280");

  // Draw bright emissive veins
  for (let v = 0; v < 8; v++) {
    let x = Math.random() * SIZE;
    let y = Math.random() * SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 25; s++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.3) * 50;
      ctx.lineTo(x, y);
    }
    // Bright vein core
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},0.6)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Glow halo
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},0.2)`;
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  return new THREE.CanvasTexture(c);
}

// ── Trim strips helper ─────────────────────────────────────────────────────
function TrimStrips({ rankColor, zCenter, length }) {
  return (
    <>
      <mesh position={[0, 3.94, zCenter]}>
        <boxGeometry args={[8.02, 0.07, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.5}
          transparent opacity={0.65} toneMapped={false} />
      </mesh>
      <mesh position={[0, -3.94, zCenter]}>
        <boxGeometry args={[8.02, 0.07, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.5}
          transparent opacity={0.65} toneMapped={false} />
      </mesh>
      <mesh position={[-3.94, 0, zCenter]}>
        <boxGeometry args={[0.07, 8.02, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.3}
          transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[3.94, 0, zCenter]}>
        <boxGeometry args={[0.07, 8.02, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.3}
          transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </>
  );
}

// ── Pulsing vein overlay for walls ────────────────────────────────────────────
function PulsingVeinWall({ position, rotation, size, rankColor, veinTex }) {
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    // Wave-like pulse along the walls
    matRef.current.opacity = 0.04 + Math.abs(Math.sin(t * 0.8)) * 0.08;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={matRef}
        map={veinTex}
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * CorridorWalls – AAA Premium Edition
 *
 * Two corridor segments with pulsing energy veins and ground fog.
 */
export default function CorridorWalls({ rankColor = "#6b7280" }) {
  const wallTex = useMemo(() => {
    const t = makeStoneTexture(rankColor);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 1);
    return t;
  }, [rankColor]);

  const floorTex = useMemo(() => {
    const t = makeStoneTexture(rankColor);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 8);
    return t;
  }, [rankColor]);

  const veinTex = useMemo(() => {
    const t = makeVeinGlowTexture(rankColor);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  }, [rankColor]);

  return (
    <group>

      {/* ════════════════════════════════════════════════════════════════════
          APPROACH CORRIDOR
          ════════════════════════════════════════════════════════════════════ */}

      {/* Left wall */}
      <mesh position={[-4, 0, 23]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[48, 8]} />
        <meshStandardMaterial map={wallTex} color="#070714" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Right wall */}
      <mesh position={[4, 0, 23]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[48, 8]} />
        <meshStandardMaterial map={wallTex} color="#070714" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4, 23]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 48]} />
        <meshStandardMaterial map={wallTex} color="#060612" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -4, 23]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 48]} />
        <meshStandardMaterial map={floorTex} color="#060612" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, 47]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#030308" roughness={1} />
      </mesh>

      {/* Trim strips */}
      <TrimStrips rankColor={rankColor} zCenter={23} length={48.02} />

      {/* Floor glow */}
      <mesh position={[0, -3.9, 22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 44]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.06}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Pulsing energy vein overlays – approach corridor */}
      <PulsingVeinWall position={[-3.98, 0, 23]} rotation={[0, Math.PI / 2, 0]}
        size={[48, 8]} rankColor={rankColor} veinTex={veinTex} />
      <PulsingVeinWall position={[3.98, 0, 23]} rotation={[0, -Math.PI / 2, 0]}
        size={[48, 8]} rankColor={rankColor} veinTex={veinTex} />

      {/* Ground fog – hugging the floor */}
      <mesh position={[0, -3.7, 22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.5, 44]} />
        <fogPlaneMaterial
          fogColor={new THREE.Color("#0a0a1a")}
          fogNear={5} fogFar={45}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corner accent columns */}
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([x, y], i) => (
        <mesh key={`ac${i}`} position={[x, y, 23]}>
          <boxGeometry args={[0.3, 0.3, 48]} />
          <meshStandardMaterial color="#0a0a1a" emissive={rankColor}
            emissiveIntensity={0.12} roughness={0.8} />
        </mesh>
      ))}


      {/* ════════════════════════════════════════════════════════════════════
          DUNGEON INTERIOR
          ════════════════════════════════════════════════════════════════════ */}

      {/* Left wall */}
      <mesh position={[-4, 0, -25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[50, 8]} />
        <meshStandardMaterial map={wallTex} color="#080818" roughness={0.95} metalness={0.05}
          side={THREE.FrontSide} />
      </mesh>

      {/* Right wall */}
      <mesh position={[4, 0, -25]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[50, 8]} />
        <meshStandardMaterial map={wallTex} color="#080818" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4, -25]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 50]} />
        <meshStandardMaterial map={wallTex} color="#060614" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -4, -25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 50]} />
        <meshStandardMaterial map={floorTex} color="#060614" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#040410" roughness={1} />
      </mesh>

      {/* Trim strips */}
      <TrimStrips rankColor={rankColor} zCenter={-25} length={50.02} />

      {/* Floor glow in dungeon */}
      <mesh position={[0, -3.9, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 20]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.08}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Pulsing energy vein overlays – dungeon interior */}
      <PulsingVeinWall position={[-3.98, 0, -25]} rotation={[0, Math.PI / 2, 0]}
        size={[50, 8]} rankColor={rankColor} veinTex={veinTex} />
      <PulsingVeinWall position={[3.98, 0, -25]} rotation={[0, -Math.PI / 2, 0]}
        size={[50, 8]} rankColor={rankColor} veinTex={veinTex} />

      {/* Atmospheric god-ray cone */}
      <mesh position={[0, -1, -12]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 24, 8, 1, true]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.025}
          blending={THREE.AdditiveBlending} depthWrite={false}
          side={THREE.BackSide} toneMapped={false} />
      </mesh>

      {/* Corner accent columns – dungeon */}
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([x, y], i) => (
        <mesh key={`dc${i}`} position={[x, y, -25]}>
          <boxGeometry args={[0.3, 0.3, 50]} />
          <meshStandardMaterial color="#0a0a1a" emissive={rankColor}
            emissiveIntensity={0.15} roughness={0.8} />
        </mesh>
      ))}

    </group>
  );
}
