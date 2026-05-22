/**
 * AuthTunnelWalls – Dark stone tunnel with purple energy veins
 *
 * Abyssal Sovereign color palette: deep purple (#7c3aed) veins on dark stone.
 * TubeGeometry with a subtle CatmullRom curve so the portal emerges
 * dramatically around the bend rather than being visible from the start.
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VEIN_COLOR = "#7c3aed";
const VEIN_R = 124, VEIN_G = 58, VEIN_B = 237;

export const TUNNEL_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 20),
  new THREE.Vector3(0.7, 0.15, 13),
  new THREE.Vector3(-0.5, -0.1, 7),
  new THREE.Vector3(0, 0, 0),
]);

// ── Procedural stone texture with purple energy veins ────────────────────────
function makeStoneTexture() {
  const SIZE = 1024;
  const c = document.createElement("canvas");
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#030209";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Stone noise
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * SIZE, y = Math.random() * SIZE;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 30)},${Math.floor(Math.random() * 20)},${Math.floor(Math.random() * 50)},0.09)`;
    ctx.fill();
  }

  // Stone block seams
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let y = 64; y < SIZE; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
  }
  for (let row = 0; row < SIZE / 64; row++) {
    const xOff = row % 2 === 0 ? 0 : 128;
    for (let x = xOff; x < SIZE; x += 256) {
      ctx.beginPath(); ctx.moveTo(x, row * 64); ctx.lineTo(x, (row + 1) * 64); ctx.stroke();
    }
  }

  // Purple energy veins
  for (let v = 0; v < 7; v++) {
    let x = Math.random() * SIZE, y = Math.random() * SIZE;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 32; s++) {
      x += (Math.random() - 0.5) * 55;
      y += (Math.random() - 0.3) * 38;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.22)`;
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.07)`;
    ctx.lineWidth = 6; ctx.stroke();
  }

  // Rune glyphs — purple tinted
  const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.10)`;
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 18; col++) {
      ctx.fillText(RUNES[Math.floor(Math.random() * RUNES.length)], col * 57 + 4, row * 52 + 22);
    }
  }
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.28)`;
  for (let i = 0; i < 16; i++) {
    ctx.fillText(RUNES[Math.floor(Math.random() * RUNES.length)], Math.random() * SIZE * 0.9, Math.random() * SIZE * 0.9 + 28);
  }

  return new THREE.CanvasTexture(c);
}

function makeVeinGlowTexture() {
  const SIZE = 512;
  const c = document.createElement("canvas");
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);

  for (let v = 0; v < 9; v++) {
    let x = Math.random() * SIZE, y = Math.random() * SIZE;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 28; s++) {
      x += (Math.random() - 0.5) * 65; y += (Math.random() - 0.3) * 48; ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.65)`;
    ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = `rgba(${VEIN_R},${VEIN_G},${VEIN_B},0.18)`;
    ctx.lineWidth = 10; ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// ── Pulsing vein overlay (inside main tube) ───────────────────────────────────
function PulsingVeinTube({ veinTex, geo }) {
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    matRef.current.opacity = 0.03 + Math.abs(Math.sin(t * 0.9)) * 0.08;
  });

  if (!geo) return null;

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        ref={matRef}
        map={veinTex}
        transparent opacity={0.03}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Arch trim rings along the tunnel path ─────────────────────────────────────
function ArchRings({ count = 7 }) {
  const zPositions = Array.from({ length: count }, (_, i) => 18 - i * 2.7);

  return (
    <group>
      {zPositions.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <torusGeometry args={[3.3, 0.045, 8, 32]} />
          <meshBasicMaterial
            color={VEIN_COLOR}
            transparent
            opacity={0.15 + i * 0.025}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AuthTunnelWalls({ mobile = false }) {
  const segs = mobile ? 80 : 120;
  const radSegs = mobile ? 10 : 12;

  const wallGeo = useMemo(() => new THREE.TubeGeometry(TUNNEL_CURVE, segs, 3.2, radSegs, false), [segs, radSegs]);
  const veinGeo = useMemo(() => new THREE.TubeGeometry(TUNNEL_CURVE, 60, 3.13, radSegs, false), [radSegs]);

  const wallTex = useMemo(() => {
    const t = makeStoneTexture();
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 5); return t;
  }, []);

  const veinTex = useMemo(() => {
    const t = makeVeinGlowTexture();
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 4); return t;
  }, []);

  useEffect(() => () => {
    wallTex.dispose(); veinTex.dispose();
    wallGeo.dispose(); veinGeo?.dispose();
  }, [wallTex, veinTex, wallGeo, veinGeo]);

  return (
    <group>
      {/* Main tunnel tube — BackSide, camera sees interior */}
      <mesh geometry={wallGeo}>
        <meshStandardMaterial
          map={wallTex}
          color="#050212"
          roughness={0.96}
          metalness={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Pulsing purple vein overlay */}
      <PulsingVeinTube veinTex={veinTex} geo={veinGeo} />

      {/* Arch trim rings */}
      <ArchRings count={mobile ? 5 : 7} />

      {/* Back cap — solid dark behind portal */}
      <mesh position={[0, 0, -1.5]}>
        <circleGeometry args={[3.6, 24]} />
        <meshBasicMaterial color="#030009" />
      </mesh>

      {/* Floor glow — purple */}
      <mesh position={[0, -3.0, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 20]} />
        <meshBasicMaterial
          color={VEIN_COLOR} transparent opacity={0.05}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
        />
      </mesh>

      {/* Atmospheric god-ray cone from portal */}
      <mesh position={[0, 0, 10]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.5, 20, 8, 1, true]} />
        <meshBasicMaterial
          color={VEIN_COLOR} transparent opacity={0.018}
          blending={THREE.AdditiveBlending} depthWrite={false}
          side={THREE.BackSide} toneMapped={false}
        />
      </mesh>
    </group>
  );
}
