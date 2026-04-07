/**
 * RuneParticles – Floating rune glyphs drifting from the gate
 *
 * Canvas-rendered rune textures on sprite planes.
 * Slow drift outward, rotate, fade. Appear only at C+ ranks.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

const RANK_COUNTS = {
    E: 0, D: 0, C: 6, B: 8, A: 10, S: 14, SSS: 18,
};

function makeRuneTexture(rune, color) {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(rune, size / 2, size / 2);

    // Bright core
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.6;
    ctx.fillText(rune, size / 2, size / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

export default function RuneParticles({ rankColor = "#6b7280", rank = "E", progressRef }) {
    const count = RANK_COUNTS[rank] ?? 0;

    const runes = useMemo(() => {
        if (count === 0) return [];
        return Array.from({ length: count }, (_, i) => ({
            tex: makeRuneTexture(RUNES[i % RUNES.length], rankColor),
            angle: (i / count) * Math.PI * 2,
            radius: 2.0 + Math.random() * 2.5,
            z: (Math.random() - 0.5) * 3.0,
            driftSpeed: 0.02 + Math.random() * 0.04,
            rotSpeed: (Math.random() - 0.5) * 0.8,
            floatPhase: Math.random() * Math.PI * 2,
            baseScale: 0.15 + Math.random() * 0.2,
            fadePhase: Math.random() * Math.PI * 2,
        }));
    }, [count, rankColor]);

    const refs = useRef([]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const aw = Math.min(1, Math.sqrt((progressRef?.current ?? 0) * 1.4));

        runes.forEach((r, i) => {
            const mesh = refs.current[i];
            if (!mesh) return;

            r.angle += r.driftSpeed * aw * 0.016;

            const x = Math.cos(r.angle) * r.radius;
            const y = Math.sin(r.angle) * r.radius;
            const z = r.z + Math.sin(t * 0.5 + r.floatPhase) * 0.3;

            mesh.position.set(x, y, z);
            mesh.rotation.z += r.rotSpeed * 0.016 * aw;

            // Fade in/out cycle
            const fade = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.3 + r.fadePhase));
            mesh.material.opacity = fade * aw * 0.8;
            mesh.scale.setScalar(r.baseScale * aw);
        });
    });

    if (count === 0) return null;

    return (
        <group>
            {runes.map((r, i) => (
                <sprite key={i} ref={el => refs.current[i] = el}>
                    <spriteMaterial
                        map={r.tex}
                        transparent
                        opacity={0}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </sprite>
            ))}
        </group>
    );
}
