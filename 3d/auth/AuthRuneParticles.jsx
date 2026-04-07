/**
 * AuthRuneParticles – Purple Futhark runes drifting through the auth tunnel
 *
 * Runes drift forward toward the camera (from Z=-16 to Z=2, then wrap).
 * Color matches the Solo Leveling purple palette.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];
const RUNE_COLOR = "#a78bfa"; // light purple
const RUNE_GLOW = "#7c3aed"; // deep purple glow

function makeRuneTexture(rune) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  // Outer glow — deep purple
  ctx.shadowColor = RUNE_GLOW;
  ctx.shadowBlur = 14;
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = RUNE_COLOR;
  ctx.fillText(rune, size / 2, size / 2);

  // Bright core
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#e9d5ff";
  ctx.globalAlpha = 0.45;
  ctx.fillText(rune, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export default function AuthRuneParticles({ progressRef, mobile = false }) {
  const count = mobile ? 14 : 20;

  const runes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    tex: makeRuneTexture(RUNES[i % RUNES.length]),
    z: -16 + Math.random() * 18,
    driftSpeed: 0.014 + Math.random() * 0.022,
    lateralX: (Math.random() - 0.5) * 2.4,
    lateralY: (Math.random() - 0.5) * 1.6,
    lateralFreqX: 0.15 + Math.random() * 0.35,
    lateralFreqY: 0.12 + Math.random() * 0.30,
    lateralPhase: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.8,
    fadePhase: Math.random() * Math.PI * 2,
    baseScale: 0.14 + Math.random() * 0.16,
  })), [count]);

  const refs = useRef([]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const p = progressRef?.current ?? 0;

    runes.forEach((r, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;

      // Drift toward camera, wrap at Z=20
      r.z += r.driftSpeed * 60 * delta;
      if (r.z > 20) r.z = -16 + Math.random() * 3;

      // Sinusoidal lateral drift
      const x = r.lateralX + Math.sin(t * r.lateralFreqX + r.lateralPhase) * 0.55;
      const y = r.lateralY + Math.cos(t * r.lateralFreqY + r.lateralPhase) * 0.40;

      mesh.position.set(x, y, r.z);
      mesh.rotation.z += r.rotSpeed * delta;

      // Scale: slightly larger when closer (depth parallax feel)
      const proximity = Math.max(0.6, 1 - Math.max(0, r.z - 2) / 18 * 0.35);
      const scale = r.baseScale * proximity;

      // Opacity: fades in with progress, dims near form to not compete
      const cycle = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.28 + r.fadePhase));
      let opacity = cycle * Math.min(1, p * 2.5);
      if (p > 0.88) opacity *= 1 - (p - 0.88) / 0.12 * 0.75;

      mesh.material.opacity = opacity;
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group>
      {runes.map((r, i) => (
        <sprite key={i} ref={el => refs.current[i] = el}>
          <spriteMaterial
            map={r.tex} transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
