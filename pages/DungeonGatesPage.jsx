import { useState, useRef, useEffect, Suspense, lazy, useCallback } from "react";

const DungeonCorridor = lazy(() => import("../3d/scenes/DungeonCorridor"));

const RANK_COLORS = {
  E: "#6b7280", D: "#22d3ee", C: "#34d399",
  B: "#a78bfa", A: "#f59e0b", S: "#ef4444", SSS: "#e879f9",
};

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}
const HAS_WEBGL = supportsWebGL();

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes dgFadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes dgSlideUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dgWarpLine  { 0%{transform:scaleX(0);opacity:0} 20%{transform:scaleX(1);opacity:1} 100%{transform:scaleX(6);opacity:0} }
  @keyframes dgWarpFlash { 0%{opacity:0} 12%{opacity:1} 70%{opacity:.9} 100%{opacity:0} }
  @keyframes dgBlink     { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }
  @keyframes dgPulse     { 0%,100%{opacity:.65} 50%{opacity:1} }
  @keyframes dgSpin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes dgSpinRev   { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes dgScan      { 0%{top:-4px;opacity:0} 5%{opacity:.7} 95%{opacity:.4} 100%{top:100%;opacity:0} }
  @keyframes dgRush      { 0%{opacity:0;letter-spacing:2px} 100%{opacity:1;letter-spacing:10px} }

  @keyframes dgGlitchIn  {
    0%   { opacity:0; transform:translateX(-5px) skewX(-8deg); filter:blur(4px) }
    15%  { opacity:0.8; transform:translateX(3px) skewX(4deg); filter:blur(0) }
    30%  { opacity:0.3; transform:translateX(-2px) skewX(-2deg) }
    50%  { opacity:1; transform:translateX(0) skewX(0) }
    100% { opacity:1; transform:translateX(0) skewX(0) }
  }
  @keyframes dgFlashShake {
    0%   { opacity:0 }
    5%   { opacity:1; transform:translateX(-3px) }
    15%  { transform:translateX(4px) }
    25%  { opacity:0.7; transform:translateX(-2px) }
    50%  { opacity:1; transform:translateX(0) }
    100% { opacity:1; transform:translateX(0) }
  }
  @keyframes dgSlideRight {
    from { opacity:0; transform:translateX(40px) }
    to   { opacity:1; transform:translateX(0) }
  }
  @keyframes dgAriseReveal {
    0%   { opacity:0; letter-spacing:30px; filter:blur(8px) }
    30%  { opacity:0.5; letter-spacing:20px; filter:blur(3px) }
    60%  { opacity:1; letter-spacing:16px; filter:blur(0) }
    100% { opacity:1; letter-spacing:16px; filter:blur(0) }
  }
  @keyframes dgLetterpress {
    0%   { opacity:0; transform:scaleY(0.3); filter:blur(3px) }
    40%  { opacity:1; transform:scaleY(1.05); filter:blur(0) }
    60%  { transform:scaleY(0.97) }
    100% { opacity:1; transform:scaleY(1) }
  }
  @keyframes dgWarpWhiteout {
    0%   { opacity:0 }
    25%  { opacity:0.3 }
    70%  { opacity:0.95 }
    100% { opacity:1 }
  }
`;

function clip(n = 12) {
  return `polygon(0 0,calc(100% - ${n}px) 0,100% ${n}px,100% 100%,${n}px 100%,0 calc(100% - ${n}px))`;
}

// ─── Haptic feedback ──────────────────────────────────────────────────────────
function haptic(pattern) {
  try { navigator?.vibrate?.(pattern); } catch { }
}

// ─── Sound Engine (Web Audio API) ─────────────────────────────────────────────
let audioCtx = null;
let droneOsc = null;
let droneGain = null;
let initialized = false;

function initAudio() {
  if (initialized) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Drone layer: deep sub-bass
    droneOsc = audioCtx.createOscillator();
    droneGain = audioCtx.createGain();
    droneOsc.type = "sine";
    droneOsc.frequency.setValueAtTime(38, audioCtx.currentTime);
    droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
    droneOsc.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    droneOsc.start();
    initialized = true;
  } catch { }
}

function setDroneVolume(v) {
  if (!droneGain || !audioCtx) return;
  droneGain.gain.setTargetAtTime(Math.min(v, 0.15), audioCtx.currentTime, 0.1);
}

function playSfx(freq, duration = 0.15, type = "sine", vol = 0.12) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch { }
}

function playImpact() {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    // Massive bass drop
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(20, t + 1.5);

    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1.5);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 1.6);

    // Deep sub drop
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(50, t);
    subOsc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
    subGain.gain.setValueAtTime(0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    subOsc.connect(subGain); subGain.connect(audioCtx.destination);
    subOsc.start(t); subOsc.stop(t + 1.6);

    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(noiseGain); noiseGain.connect(audioCtx.destination);
    noise.start(t);
  } catch { }
}

function playHeartbeat(vol = 0.5) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(45, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(50, t + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(25, t + 0.3);
    gain2.gain.setValueAtTime(0, t + 0.2);
    gain2.gain.linearRampToValueAtTime(vol * 0.8, t + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain); gain.connect(audioCtx.destination);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);

    osc.start(t); osc.stop(t + 0.4);
    osc2.start(t + 0.2); osc2.stop(t + 0.6);
  } catch { }
}

function playGlitch() {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const length = 5;
    for (let i = 0; i < length; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = Math.random() > 0.5 ? "square" : "sawtooth";
      osc.frequency.value = 200 + Math.random() * 800;
      gain.gain.setValueAtTime(0.1, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.04);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.05);
    }
  } catch { }
}

function stopAudio() {
  try {
    droneOsc?.stop();
    audioCtx?.close();
  } catch { }
  droneOsc = null; droneGain = null; audioCtx = null; initialized = false;
}

// ─── Narrative text overlays ──────────────────────────────────────────────────
function NarrativeOverlay({ scrollPct, rankColor, rank }) {
  const shownRef = useRef(new Set());

  // Determine which message to show based on progress milestones
  let message = null;
  let style = {};
  let key = null;

  if (scrollPct >= 0.95 && !shownRef.current.has("enter") && (rank === "S" || rank === "SSS")) {
    key = "arise";
    message = "A R I S E";
    style = {
      position: "fixed", inset: 0, zIndex: 1005, display: "flex",
      alignItems: "center", justifyContent: "center", pointerEvents: "none",
      fontSize: "clamp(32px, 8vw, 72px)", fontWeight: 900,
      fontFamily: "'Cinzel', serif",
      color: "#ffffff",
      textShadow: `0 0 10px ${rankColor}, 0 0 30px ${rankColor}, 0 0 80px ${rankColor}, 0 0 140px ${rankColor}`,
      animation: "dgAriseReveal 2.5s ease-out forwards",
      letterSpacing: 30,
    };
  } else if (scrollPct >= 0.95) {
    key = "enter";
    message = "ENTER AT YOUR OWN RISK.";
    style = {
      position: "fixed", bottom: "22vh", left: 0, right: 0, zIndex: 1005,
      textAlign: "center", pointerEvents: "none",
      fontSize: "clamp(12px, 3vw, 20px)", fontWeight: 700,
      fontFamily: "'Cinzel', serif",
      color: "#fff",
      textShadow: `0 0 20px ${rankColor}`,
      animation: "dgLetterpress 0.6s ease-out forwards",
      letterSpacing: 6,
    };
  } else if (scrollPct >= 0.78 && !shownRef.current.has("warn")) {
    if (!shownRef.current.has("warn")) shownRef.current.add("warn");
    key = "warn";
    message = (
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "clamp(14px, 3vw, 22px)", color: "#ef4444", fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 8,
          textShadow: "0 0 20px #ef4444, 0 0 40px #ef444466",
          marginBottom: 8,
        }}>⚠ WARNING</div>
        <div style={{
          fontSize: "clamp(9px, 2vw, 13px)", color: "#94a3b8",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2,
        }}>Gate mana output exceeds safe levels.</div>
      </div>
    );
    style = {
      position: "fixed", top: "30vh", left: 0, right: 0, zIndex: 1005,
      display: "flex", justifyContent: "center", pointerEvents: "none",
      animation: "dgFlashShake 0.8s ease-out forwards",
    };
  } else if (scrollPct >= 0.48 && scrollPct < 0.60) {
    key = "rank";
    message = (
      <div>
        <div style={{
          fontSize: "clamp(10px, 2.5vw, 16px)", color: rankColor,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 6,
          textShadow: `0 0 12px ${rankColor}`,
        }}>RANK: {rank}</div>
      </div>
    );
    style = {
      position: "fixed", top: "18vh", right: "5vw", zIndex: 1005,
      pointerEvents: "none",
      animation: "dgSlideRight 0.5s ease-out forwards",
    };
  } else if (scrollPct >= 0.14 && scrollPct < 0.28) {
    key = "detect";
    message = (
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "clamp(8px, 1.8vw, 11px)", color: rankColor,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 6,
          textShadow: `0 0 12px ${rankColor}`,
          marginBottom: 6,
        }}>[ SYSTEM ]</div>
        <div style={{
          fontSize: "clamp(10px, 2.2vw, 14px)", color: "#94a3b8",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
        }}>A Gate has been detected.</div>
      </div>
    );
    style = {
      position: "fixed", top: "35vh", left: 0, right: 0, zIndex: 1005,
      display: "flex", justifyContent: "center", pointerEvents: "none",
      animation: "dgGlitchIn 0.7s ease-out forwards",
    };
  }

  if (!message) return null;

  return <div key={key} style={style}>{message}</div>;
}

// ─── AAA Warp Effect ──────────────────────────────────────────────────────────
function WarpEffect({ rankColor }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1010, pointerEvents: "none", overflow: "hidden" }}>
      {/* Speed lines */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: 0, right: 0,
          top: `${(i / 50) * 100}%`, height: 1,
          background: `linear-gradient(90deg,transparent,${rankColor}ff 50%,transparent)`,
          transformOrigin: "left center",
          animation: `dgWarpLine ${0.2 + (i % 6) * 0.05}s ease-out ${(i % 5) * 0.03}s forwards`,
        }} />
      ))}
      {/* Radial flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%,${rankColor}cc 0%,${rankColor}33 30%,transparent 60%)`,
        animation: "dgWarpFlash 1.4s ease-out forwards",
      }} />
      {/* Center whiteout – builds from center */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 50%,#fff 0%,#ffffffcc 20%,${rankColor}44 50%,transparent 70%)`,
        animation: "dgWarpWhiteout 1.2s ease-in 0.3s forwards",
        opacity: 0,
      }} />
    </div>
  );
}

// ─── 2D fallback ──────────────────────────────────────────────────────────────
function FallbackGateView({ dungeon, rankColor, onEnter, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#04040a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "dgFadeIn 0.4s ease"
    }}>
      <style>{CSS}</style>
      <div style={{
        fontSize: 9, letterSpacing: 5, color: rankColor, marginBottom: 20,
        fontFamily: "'JetBrains Mono',monospace", textShadow: `0 0 14px ${rankColor}`
      }}>
        SYSTEM · {dungeon?.rank}-RANK GATE DETECTED
      </div>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg style={{
          position: "absolute", inset: 0, width: 140, height: 140,
          animation: "dgSpin 8s linear infinite"
        }} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="65" fill="none" stroke={rankColor}
            strokeWidth="1" strokeOpacity="0.5" strokeDasharray="8 5" />
        </svg>
        <div style={{
          position: "absolute", inset: 14, border: `2px solid ${rankColor}88`,
          transform: "rotate(45deg)", boxShadow: `0 0 40px ${rankColor}44,inset 0 0 30px ${rankColor}14`,
          animation: "dgPulse 2s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 44, color: rankColor,
          fontFamily: "'Cinzel',serif", fontWeight: 900, textShadow: `0 0 24px ${rankColor}`
        }}>
          {dungeon?.rank}
        </div>
      </div>
      <div style={{
        marginTop: 22, fontSize: 18, color: "#e2e8f0",
        fontFamily: "'Cinzel',serif", letterSpacing: 3
      }}>{dungeon?.name}</div>
      <div style={{
        fontSize: 8, color: "#1e293b", marginTop: 5,
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2
      }}>
        WebGL unavailable — 2D mode
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <button onClick={onClose} style={{
          padding: "10px 20px", background: "transparent",
          color: "#334155", border: "1px solid #1e293b", fontSize: 9,
          fontFamily: "'JetBrains Mono',monospace", clipPath: clip(7),
          cursor: "pointer", letterSpacing: 2
        }}>✕ EXIT</button>
        <button onClick={onEnter} style={{
          padding: "12px 36px", fontSize: 12, fontWeight: 900,
          background: `linear-gradient(135deg,${rankColor}28,${rankColor}10)`,
          color: rankColor, border: `1.5px solid ${rankColor}55`,
          fontFamily: "'Cinzel',serif", letterSpacing: 4, cursor: "pointer",
          clipPath: clip(9), boxShadow: `0 0 24px ${rankColor}28`
        }}>ENTER GATE</button>
      </div>
    </div>
  );
}

// ─── Milestone sound+haptic triggers ──────────────────────────────────────────
const MILESTONES = [
  { at: 0.15, sfx: () => playSfx(220, 0.2, "sine", 0.08), haptic: [50] },
  { at: 0.30, sfx: () => { playSfx(330, 0.3, "triangle", 0.1); playHeartbeat(0.3); }, haptic: [30, 20, 60] },
  { at: 0.50, sfx: () => { playSfx(440, 0.15); playHeartbeat(0.5); }, haptic: [40, 15, 40] },
  { at: 0.65, sfx: () => { playGlitch(); playHeartbeat(0.7); }, haptic: [30, 10, 50] },
  { at: 0.80, sfx: () => { playGlitch(); playHeartbeat(0.9); playSfx(880, 0.3, "square", 0.05); }, haptic: [15, 10, 15, 10, 15, 10, 80] },
  { at: 0.95, sfx: () => { playImpact(); playHeartbeat(1.2); }, haptic: [200] },
];

// ─── Main overlay ─────────────────────────────────────────────────────────────
export default function DungeonGatesPage({ dungeon, onEnterGate, onClose }) {
  const scrollContainerRef = useRef(null);
  const autoApproachRef = useRef(null);
  const [warping, setWarping] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [rushing, setRushing] = useState(false);
  const lastMilestone = useRef(-1);
  const rankColor = RANK_COLORS[dungeon?.rank] ?? RANK_COLORS.E;

  // Initialize audio on first interaction
  const audioInitRef = useRef(false);
  const handleFirstInteraction = useCallback(() => {
    if (!audioInitRef.current) {
      initAudio();
      audioInitRef.current = true;
    } else if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
  }, []);

  // Listen for first user interaction to init audio
  useEffect(() => {
    window.addEventListener("wheel", handleFirstInteraction, { once: true, passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true, passive: true });
    window.addEventListener("click", handleFirstInteraction, { once: true, passive: true });
    return () => {
      window.removeEventListener("wheel", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
    };
  }, [handleFirstInteraction]);

  // Milestone triggers
  useEffect(() => {
    for (let i = 0; i < MILESTONES.length; i++) {
      if (i > lastMilestone.current && scrollPct >= MILESTONES[i].at) {
        lastMilestone.current = i;
        MILESTONES[i].sfx?.();
        haptic(MILESTONES[i].haptic);
        break;
      }
    }
    // Update drone volume with approach
    setDroneVolume(scrollPct * scrollPct * 0.12);
  }, [scrollPct]);

  const handleEnterGate = useCallback(() => {
    if (warping) return;
    setWarping(true);
    haptic([50, 30, 50, 30, 50, 30, 300]);
    playImpact();
    setTimeout(() => { stopAudio(); onEnterGate(dungeon); onClose(); }, 1350);
  }, [warping, onEnterGate, onClose, dungeon]);

  const handleEnterButton = useCallback(() => {
    if (rushing || warping) return;
    setRushing(true);
    handleFirstInteraction();
    playGlitch();
    autoApproachRef.current?.();
  }, [rushing, warping, handleFirstInteraction]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      stopAudio();
    };
  }, []);

  if (!HAS_WEBGL) {
    return <FallbackGateView dungeon={dungeon} rankColor={rankColor}
      onEnter={handleEnterButton} onClose={onClose} />;
  }

  const pct = Math.round(scrollPct * 100);
  const isNear = scrollPct > 0.68;
  const isAtGate = scrollPct >= 0.97;

  return (
    <div
      ref={scrollContainerRef}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#04040a",
        animation: "dgFadeIn 0.4s ease", userSelect: "none"
      }}
    >
      <style>{CSS}</style>

      {/* ── 3D canvas ── */}
      <Suspense fallback={
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            color: rankColor, fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10, letterSpacing: 5, animation: "dgBlink 1s infinite"
          }}>
            LOADING GATE…
          </div>
        </div>
      }>
        <DungeonCorridor
          dungeon={dungeon}
          scrollContainerRef={scrollContainerRef}
          onEnterGate={handleEnterGate}
          onProgress={setScrollPct}
          autoApproachRef={autoApproachRef}
        />
      </Suspense>

      {/* ── Narrative text overlays ── */}
      <NarrativeOverlay scrollPct={scrollPct} rankColor={rankColor} rank={dungeon?.rank ?? "E"} />

      {/* ── Scan beam ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 3,
          background: `linear-gradient(180deg,transparent,${rankColor}55,transparent)`,
          boxShadow: `0 0 16px 3px ${rankColor}33`,
          animation: "dgScan 5s ease-in-out 1.5s infinite",
        }} />
      </div>

      {/* ── Scanline texture ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 3px)"
      }} />

      {/* ── Vignette ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 50%,transparent 38%,rgba(0,0,0,${0.35 + scrollPct * 0.5}) 100%)`,
        boxShadow: isNear ? `inset 0 0 ${80 + scrollPct * 140}px ${rankColor}${Math.round(scrollPct * 0.55 * 255).toString(16).padStart(2, "0")}` : "none",
        transition: "box-shadow 0.5s ease",
      }} />

      {/* ── Letterbox ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "8vh",
        background: "linear-gradient(180deg,#000 50%,transparent)",
        zIndex: 5, pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "8vh",
        background: "linear-gradient(0deg,#000 50%,transparent)",
        zIndex: 5, pointerEvents: "none"
      }} />

      {/* ── Corner brackets ── */}
      {[
        { top: "8vh", left: 18, borderTop: `1px solid ${rankColor}66`, borderLeft: `1px solid ${rankColor}66` },
        { top: "8vh", right: 18, borderTop: `1px solid ${rankColor}66`, borderRight: `1px solid ${rankColor}66` },
        { bottom: "8vh", left: 18, borderBottom: `1px solid ${rankColor}66`, borderLeft: `1px solid ${rankColor}66` },
        { bottom: "8vh", right: 18, borderBottom: `1px solid ${rankColor}66`, borderRight: `1px solid ${rankColor}66` },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute", width: 24, height: 24, zIndex: 6,
          pointerEvents: "none", animation: "dgFadeIn 0.8s ease both", ...s
        }} />
      ))}

      {/* ── HUD ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none",
        display: "flex", flexDirection: "column",
        padding: "calc(8vh + 14px) 22px calc(8vh + 16px)"
      }}>

        {/* TOP ROW */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>

          {/* Gate identity */}
          <div style={{ animation: "dgSlideUp 0.5s ease both" }}>
            <div style={{
              fontSize: 8, color: rankColor, letterSpacing: 6,
              fontFamily: "'JetBrains Mono',monospace",
              textShadow: `0 0 12px ${rankColor}`,
              animation: isNear ? "dgBlink 1s infinite" : "none"
            }}>
              {dungeon?.rank}-RANK DUNGEON GATE
            </div>
            <div style={{
              fontSize: 24, color: "#f1f5f9", fontFamily: "'Cinzel',serif",
              letterSpacing: 2, marginTop: 6, lineHeight: 1.15,
              textShadow: "0 2px 30px rgba(0,0,0,0.95)"
            }}>
              {dungeon?.name}
            </div>
          </div>

          {/* SYSTEM panel */}
          <div style={{
            background: "linear-gradient(135deg, rgba(1,2,10,0.92) 0%, rgba(4,6,18,0.85) 100%)",
            backdropFilter: "blur(18px)",
            border: `1.5px solid ${rankColor}88`,
            clipPath: clip(11),
            padding: "14px 20px", minWidth: 300,
            boxShadow: `0 0 40px ${rankColor}33, inset 0 0 20px ${rankColor}14`,
            animation: "dgSlideUp 0.5s ease 0.1s both",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7, marginBottom: 8,
              paddingBottom: 6, borderBottom: `1px solid ${rankColor}44`
            }}>
              <div style={{
                width: 6, height: 6, background: rankColor, transform: "rotate(45deg)",
                boxShadow: `0 0 12px ${rankColor}, 0 0 24px ${rankColor}`, animation: "dgPulse 1.1s infinite"
              }} />
              <span style={{
                fontSize: 9, color: rankColor, letterSpacing: 5,
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700
              }}>SYSTEM</span>
            </div>
            <div style={{
              fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: .5, lineHeight: 1.65
            }}>
              {scrollPct < 0.05 ? "A dimensional anomaly has been detected."
                : scrollPct < 0.35 ? "Gate mana output rising. Proceed carefully."
                  : scrollPct < 0.68 ? "Danger level elevated. Hunter on alert."
                    : scrollPct < 0.95 ? "Critical proximity. Gate breach imminent."
                      : "Gate entered. Good luck, Hunter."}
            </div>
          </div>

          {/* Exit */}
          <button onClick={onClose} style={{
            pointerEvents: "all",
            position: "absolute",
            top: "calc(8vh + 14px)",
            right: "22px",
            zIndex: 100,
            background: "rgba(0,0,0,0.7)", border: "1px solid #0f172a",
            color: "#334155", padding: "8px 18px", clipPath: clip(6),
            fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
            cursor: "pointer", backdropFilter: "blur(6px)", letterSpacing: 3,
            animation: "dgSlideUp 0.5s ease 0.15s both",
          }}>✕ EXIT</button>
        </div>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* BOTTOM */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          animation: "dgSlideUp 0.5s ease 0.2s both"
        }}>

          {/* Scroll hint */}
          <div style={{
            fontSize: 9, color: "#1e293b", fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 4, opacity: rushing ? 0 : 1, transition: "opacity 0.5s"
          }}>
            ↕ SCROLL TO APPROACH
          </div>

          {/* Progress bar */}
          <div style={{
            width: 260, height: 4, background: "rgba(255,255,255,0.04)",
            clipPath: "polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)",
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(90deg,${rankColor}66,${rankColor})`,
              boxShadow: `0 0 10px ${rankColor}`,
              transition: "width 0.06s linear",
            }} />
          </div>

          {/* Distance */}
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3, fontWeight: 700,
            color: isAtGate ? "#fff" : isNear ? rankColor : "#475569",
            textShadow: isAtGate ? `0 0 20px #fff, 0 0 40px ${rankColor}` : isNear ? `0 0 15px ${rankColor}` : "none",
            animation: isAtGate ? "dgRush 0.6s ease-out forwards" : "none",
            transition: "color 0.4s, text-shadow 0.4s",
          }}>
            {isAtGate ? "ENTERING GATE…"
              : `${Math.max(0, Math.round(43.8 * (1 - scrollPct) * 10) / 10)}m REMAINING`}
          </div>

          {/* Danger bar */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 3, height: 18,
            opacity: scrollPct > 0.08 ? 1 : 0.2, transition: "opacity 0.8s"
          }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const filled = i < Math.round(scrollPct * 20);
              return (
                <div key={i} style={{
                  width: 5,
                  height: filled ? Math.min(6 + i * 0.7, 18) : 5,
                  background: filled ? (i < 12 ? rankColor : "#ef4444") : "rgba(255,255,255,0.06)",
                  boxShadow: filled ? `0 0 5px ${i < 12 ? rankColor : "#ef4444"}` : "none",
                  borderRadius: 1, transition: "all 0.1s ease",
                }} />
              );
            })}
          </div>

          {/* ENTER GATE button */}
          <button
            onClick={handleEnterButton}
            disabled={rushing || warping}
            style={{
              pointerEvents: "all",
              marginTop: 2,
              padding: "15px 68px",
              background: isNear
                ? `linear-gradient(135deg,${rankColor}30,${rankColor}14)`
                : "rgba(255,255,255,0.02)",
              color: rankColor,
              border: `1.5px solid ${rankColor}${isNear ? "99" : "33"}`,
              clipPath: clip(11),
              fontSize: 14, fontWeight: 900,
              fontFamily: "'Cinzel',serif", letterSpacing: 5,
              cursor: rushing || warping ? "default" : "pointer",
              opacity: rushing ? 0.5 : 1,
              boxShadow: isNear
                ? `0 0 40px ${rankColor}33, 0 0 80px ${rankColor}14, inset 0 0 18px ${rankColor}14`
                : "none",
              textShadow: isNear ? `0 0 16px ${rankColor}` : "none",
              animation: isNear && !rushing ? "dgPulse 1.4s ease-in-out infinite" : "none",
              transition: "all 0.35s ease",
            }}
          >
            {rushing ? "APPROACHING…" : "ENTER GATE ▶"}
          </button>

          {/* Rewards */}
          {dungeon && (
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { v: `+${dungeon.xp} XP`, c: "#a78bfa", b: "rgba(167,139,250,0.12)" },
                { v: `+${dungeon.gold} G`, c: "#fbbf24", b: "rgba(251,191,36,0.12)" },
              ].map(({ v, c, b }) => (
                <div key={v} style={{
                  fontSize: 9, color: c, fontFamily: "'JetBrains Mono',monospace",
                  padding: "3px 12px", background: b,
                  clipPath: "polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)"
                }}>
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {warping && <WarpEffect rankColor={rankColor} />}
    </div>
  );
}
