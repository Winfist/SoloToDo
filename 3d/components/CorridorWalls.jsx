import { useMemo } from "react";
import * as THREE from "three";

/**
 * Generates a canvas-based texture with ancient runes, cracked stone
 * seams, and rank-colored energy veins.
 */
function makeStoneTexture(rankColor) {
  const SIZE = 1024;
  const c    = document.createElement("canvas");
  c.width    = SIZE;
  c.height   = SIZE;
  const ctx  = c.getContext("2d");

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
  ctx.lineWidth   = 1;
  for (let y = 64; y < SIZE; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
  }
  // Staggered vertical seams (brick pattern)
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
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
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
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},0.08)`;
    ctx.lineWidth   = 4;
    ctx.stroke();
  }

  // ── Rune glyphs ────────────────────────────────────────────────────────
  const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

  ctx.font      = "bold 18px monospace";
  ctx.fillStyle = `rgba(${vr},${vg},${vb},0.1)`;
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 18; col++) {
      ctx.fillText(RUNES[Math.floor(Math.random() * RUNES.length)], col * 57 + 4, row * 52 + 22);
    }
  }

  ctx.font      = "bold 24px monospace";
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

// ── Trim strips helper ─────────────────────────────────────────────────────
function TrimStrips({ rankColor, zCenter, length }) {
  return (
    <>
      {/* Top */}
      <mesh position={[0, 3.94, zCenter]}>
        <boxGeometry args={[8.02, 0.07, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.5}
          transparent opacity={0.65} toneMapped={false} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -3.94, zCenter]}>
        <boxGeometry args={[8.02, 0.07, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.5}
          transparent opacity={0.65} toneMapped={false} />
      </mesh>
      {/* Left */}
      <mesh position={[-3.94, 0, zCenter]}>
        <boxGeometry args={[0.07, 8.02, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.3}
          transparent opacity={0.4} toneMapped={false} />
      </mesh>
      {/* Right */}
      <mesh position={[3.94, 0, zCenter]}>
        <boxGeometry args={[0.07, 8.02, length]} />
        <meshStandardMaterial color={rankColor} emissive={rankColor} emissiveIntensity={0.3}
          transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </>
  );
}

/**
 * CorridorWalls
 *
 * Two corridor segments:
 *  1. APPROACH corridor  (z=0 to z=46) – surrounds camera path on the near side of the gate
 *  2. DUNGEON interior   (z=0 to z=-50) – visible through the portal (far side of gate)
 */
export default function CorridorWalls({ rankColor = "#6b7280" }) {
  const wallTex = useMemo(() => {
    const t    = makeStoneTexture(rankColor);
    t.wrapS    = THREE.RepeatWrapping;
    t.wrapT    = THREE.RepeatWrapping;
    t.repeat.set(6, 1);
    return t;
  }, [rankColor]);

  const floorTex = useMemo(() => {
    const t    = makeStoneTexture(rankColor);
    t.wrapS    = THREE.RepeatWrapping;
    t.wrapT    = THREE.RepeatWrapping;
    t.repeat.set(2, 8);
    return t;
  }, [rankColor]);

  return (
    <group>

      {/* ════════════════════════════════════════════════════════════════════
          APPROACH CORRIDOR  –  camera travels from z=45 → z=1.2 through here
          ════════════════════════════════════════════════════════════════════ */}

      {/* Left wall (faces +X, visible from inside) */}
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

      {/* Back wall – seals corridor at camera spawn */}
      <mesh position={[0, 0, 47]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#030308" roughness={1} />
      </mesh>

      {/* Emissive trim strips for approach corridor */}
      <TrimStrips rankColor={rankColor} zCenter={23} length={48.02} />

      {/* Floor glow – light pool running toward gate */}
      <mesh position={[0, -3.9, 22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 44]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.06}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Corner accent columns – approach side */}
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([x, y], i) => (
        <mesh key={`ac${i}`} position={[x, y, 23]}>
          <boxGeometry args={[0.3, 0.3, 48]} />
          <meshStandardMaterial color="#0a0a1a" emissive={rankColor}
            emissiveIntensity={0.12} roughness={0.8} />
        </mesh>
      ))}


      {/* ════════════════════════════════════════════════════════════════════
          DUNGEON INTERIOR  –  visible through the gate portal (behind z=0)
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

      {/* Back wall (behind gate) */}
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#040410" roughness={1} />
      </mesh>

      {/* Emissive trim strips for dungeon interior */}
      <TrimStrips rankColor={rankColor} zCenter={-25} length={50.02} />

      {/* Floor glow reflection in dungeon interior */}
      <mesh position={[0, -3.9, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 20]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.08}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Atmospheric god-ray cone from gate into dungeon */}
      <mesh position={[0, -1, -12]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 24, 8, 1, true]} />
        <meshBasicMaterial color={rankColor} transparent opacity={0.025}
          blending={THREE.AdditiveBlending} depthWrite={false}
          side={THREE.BackSide} toneMapped={false} />
      </mesh>

      {/* Corner accent columns – dungeon interior */}
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
