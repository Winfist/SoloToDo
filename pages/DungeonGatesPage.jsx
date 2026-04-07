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
  @keyframes dgFadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes dgSlideUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dgWarpLine { 0%{transform:scaleX(0);opacity:0} 20%{transform:scaleX(1);opacity:1} 100%{transform:scaleX(6);opacity:0} }
  @keyframes dgWarpFlash{ 0%{opacity:0} 12%{opacity:1} 70%{opacity:.9} 100%{opacity:0} }
  @keyframes dgBlink    { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }
  @keyframes dgPulse    { 0%,100%{opacity:.65} 50%{opacity:1} }
  @keyframes dgSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes dgSpinRev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes dgScan     { 0%{top:-4px;opacity:0} 5%{opacity:.7} 95%{opacity:.4} 100%{top:100%;opacity:0} }
  @keyframes dgRush     { 0%{opacity:0;letter-spacing:2px} 100%{opacity:1;letter-spacing:10px} }
`;

function clip(n = 12) {
  return `polygon(0 0,calc(100% - ${n}px) 0,100% ${n}px,100% 100%,${n}px 100%,0 calc(100% - ${n}px))`;
}

// ─── Warp ─────────────────────────────────────────────────────────────────────
function WarpEffect({ rankColor }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1010, pointerEvents:"none", overflow:"hidden" }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position:"absolute", left:0, right:0,
          top:`${(i / 50) * 100}%`, height:1,
          background:`linear-gradient(90deg,transparent,${rankColor}ff 50%,transparent)`,
          transformOrigin:"left center",
          animation:`dgWarpLine ${0.2 + (i % 6) * 0.05}s ease-out ${(i % 5) * 0.03}s forwards`,
        }} />
      ))}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 50%,${rankColor}cc 0%,${rankColor}33 30%,transparent 60%)`,
        animation:"dgWarpFlash 1.4s ease-out forwards",
      }} />
    </div>
  );
}

// ─── 2D fallback ──────────────────────────────────────────────────────────────
function FallbackGateView({ dungeon, rankColor, onEnter, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"#04040a",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      animation:"dgFadeIn 0.4s ease" }}>
      <style>{CSS}</style>
      <div style={{ fontSize:9, letterSpacing:5, color:rankColor, marginBottom:20,
        fontFamily:"'JetBrains Mono',monospace", textShadow:`0 0 14px ${rankColor}` }}>
        SYSTEM · {dungeon?.rank}-RANK GATE DETECTED
      </div>
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg style={{ position:"absolute", inset:0, width:140, height:140,
          animation:"dgSpin 8s linear infinite" }} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="65" fill="none" stroke={rankColor}
            strokeWidth="1" strokeOpacity="0.5" strokeDasharray="8 5" />
        </svg>
        <div style={{ position:"absolute", inset:14, border:`2px solid ${rankColor}88`,
          transform:"rotate(45deg)", boxShadow:`0 0 40px ${rankColor}44,inset 0 0 30px ${rankColor}14`,
          animation:"dgPulse 2s ease-in-out infinite" }} />
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:44, color:rankColor,
          fontFamily:"'Cinzel',serif", fontWeight:900, textShadow:`0 0 24px ${rankColor}` }}>
          {dungeon?.rank}
        </div>
      </div>
      <div style={{ marginTop:22, fontSize:18, color:"#e2e8f0",
        fontFamily:"'Cinzel',serif", letterSpacing:3 }}>{dungeon?.name}</div>
      <div style={{ fontSize:8, color:"#1e293b", marginTop:5,
        fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>
        WebGL unavailable — 2D mode
      </div>
      <div style={{ display:"flex", gap:10, marginTop:28 }}>
        <button onClick={onClose} style={{ padding:"10px 20px", background:"transparent",
          color:"#334155", border:"1px solid #1e293b", fontSize:9,
          fontFamily:"'JetBrains Mono',monospace", clipPath:clip(7),
          cursor:"pointer", letterSpacing:2 }}>✕ EXIT</button>
        <button onClick={onEnter} style={{ padding:"12px 36px", fontSize:12, fontWeight:900,
          background:`linear-gradient(135deg,${rankColor}28,${rankColor}10)`,
          color:rankColor, border:`1.5px solid ${rankColor}55`,
          fontFamily:"'Cinzel',serif", letterSpacing:4, cursor:"pointer",
          clipPath:clip(9), boxShadow:`0 0 24px ${rankColor}28` }}>ENTER GATE</button>
      </div>
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
export default function DungeonGatesPage({ dungeon, onEnterGate, onClose }) {
  const scrollContainerRef = useRef(null);
  const autoApproachRef    = useRef(null);   // set by useScrollCamera, triggers cinematic rush
  const [warping,   setWarping]   = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [rushing,   setRushing]   = useState(false); // cinematic approach in progress
  const rankColor = RANK_COLORS[dungeon?.rank] ?? RANK_COLORS.E;

  // Called by scroll hook after camera reaches the gate
  const handleEnterGate = useCallback(() => {
    if (warping) return;
    setWarping(true);
    setTimeout(() => { onEnterGate(dungeon); onClose(); }, 1350);
  }, [warping, onEnterGate, onClose, dungeon]);

  // Called by the ENTER button — triggers cinematic rush, NOT instant skip
  const handleEnterButton = useCallback(() => {
    if (rushing || warping) return;
    setRushing(true);
    autoApproachRef.current?.();
    // handleEnterGate fires naturally via onComplete when camera arrives
  }, [rushing, warping]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!HAS_WEBGL) {
    return <FallbackGateView dungeon={dungeon} rankColor={rankColor}
      onEnter={handleEnterButton} onClose={onClose} />;
  }

  const pct      = Math.round(scrollPct * 100);
  const isNear   = scrollPct > 0.68;
  const isAtGate = scrollPct >= 0.97;

  return (
    <div
      ref={scrollContainerRef}
      style={{ position:"fixed", inset:0, zIndex:999, background:"#04040a",
        animation:"dgFadeIn 0.4s ease", userSelect:"none" }}
    >
      <style>{CSS}</style>

      {/* ── 3D canvas ── */}
      <Suspense fallback={
        <div style={{ position:"absolute", inset:0, display:"flex",
          alignItems:"center", justifyContent:"center" }}>
          <div style={{ color:rankColor, fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, letterSpacing:5, animation:"dgBlink 1s infinite" }}>
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

      {/* ── Scan beam ── */}
      <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{
          position:"absolute", left:0, right:0, height:3,
          background:`linear-gradient(180deg,transparent,${rankColor}55,transparent)`,
          boxShadow:`0 0 16px 3px ${rankColor}33`,
          animation:"dgScan 5s ease-in-out 1.5s infinite",
        }} />
      </div>

      {/* ── Scanline texture ── */}
      <div style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none",
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 3px)" }} />

      {/* ── Film grain (SVG) ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
        zIndex:2, pointerEvents:"none", opacity:0.04 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* ── Vignette ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background:`radial-gradient(ellipse at 50% 50%,transparent 38%,rgba(0,0,0,${0.35 + scrollPct * 0.5}) 100%)`,
        boxShadow: isNear ? `inset 0 0 ${80 + scrollPct * 140}px ${rankColor}${Math.round(scrollPct * 0.55 * 255).toString(16).padStart(2,"0")}` : "none",
        transition:"box-shadow 0.5s ease",
      }} />

      {/* ── Top letterbox ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"8vh",
        background:"linear-gradient(180deg,#000 50%,transparent)",
        zIndex:5, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"8vh",
        background:"linear-gradient(0deg,#000 50%,transparent)",
        zIndex:5, pointerEvents:"none" }} />

      {/* ── Corner brackets ── */}
      {[
        { top:"8vh", left:18,  borderTop:`1px solid ${rankColor}66`, borderLeft:`1px solid ${rankColor}66` },
        { top:"8vh", right:18, borderTop:`1px solid ${rankColor}66`, borderRight:`1px solid ${rankColor}66` },
        { bottom:"8vh", left:18,  borderBottom:`1px solid ${rankColor}66`, borderLeft:`1px solid ${rankColor}66` },
        { bottom:"8vh", right:18, borderBottom:`1px solid ${rankColor}66`, borderRight:`1px solid ${rankColor}66` },
      ].map((s, i) => (
        <div key={i} style={{ position:"absolute", width:24, height:24, zIndex:6,
          pointerEvents:"none", animation:"dgFadeIn 0.8s ease both", ...s }} />
      ))}

      {/* ── HUD ── */}
      <div style={{ position:"absolute", inset:0, zIndex:6, pointerEvents:"none",
        display:"flex", flexDirection:"column",
        padding:"calc(8vh + 14px) 22px calc(8vh + 16px)" }}>

        {/* TOP ROW */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>

          {/* Gate identity */}
          <div style={{ animation:"dgSlideUp 0.5s ease both" }}>
            <div style={{ fontSize:8, color:rankColor, letterSpacing:6,
              fontFamily:"'JetBrains Mono',monospace",
              textShadow:`0 0 12px ${rankColor}`,
              animation: isNear ? "dgBlink 1s infinite" : "none" }}>
              {dungeon?.rank}-RANK DUNGEON GATE
            </div>
            <div style={{ fontSize:24, color:"#f1f5f9", fontFamily:"'Cinzel',serif",
              letterSpacing:2, marginTop:6, lineHeight:1.15,
              textShadow:"0 2px 30px rgba(0,0,0,0.95)" }}>
              {dungeon?.name}
            </div>
          </div>

          {/* SYSTEM panel */}
          <div style={{
            background:"rgba(1,2,10,0.82)", backdropFilter:"blur(12px)",
            border:`1px solid ${rankColor}33`, clipPath:clip(11),
            padding:"10px 16px", minWidth:280,
            boxShadow:`0 0 30px ${rankColor}14`,
            animation:"dgSlideUp 0.5s ease 0.1s both",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8,
              paddingBottom:6, borderBottom:`1px solid ${rankColor}1a` }}>
              <div style={{ width:6, height:6, background:rankColor, transform:"rotate(45deg)",
                boxShadow:`0 0 8px ${rankColor}`, animation:"dgPulse 1.1s infinite" }} />
              <span style={{ fontSize:8, color:rankColor, letterSpacing:5,
                fontFamily:"'JetBrains Mono',monospace" }}>SYSTEM</span>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", fontFamily:"'JetBrains Mono',monospace",
              letterSpacing:.5, lineHeight:1.65 }}>
              { scrollPct < 0.05 ? "A dimensional anomaly has been detected."
              : scrollPct < 0.35 ? "Gate mana output rising. Proceed carefully."
              : scrollPct < 0.68 ? "Danger level elevated. Hunter on alert."
              : scrollPct < 0.95 ? "Critical proximity. Gate breach imminent."
              : "Gate entered. Good luck, Hunter." }
            </div>
          </div>

          {/* Exit */}
          <button onClick={onClose} style={{
            pointerEvents:"all",
            background:"rgba(0,0,0,0.7)", border:"1px solid #0f172a",
            color:"#334155", padding:"8px 18px", clipPath:clip(6),
            fontSize:9, fontFamily:"'JetBrains Mono',monospace",
            cursor:"pointer", backdropFilter:"blur(6px)", letterSpacing:3,
            animation:"dgSlideUp 0.5s ease 0.15s both",
          }}>✕ EXIT</button>
        </div>

        {/* SPACER */}
        <div style={{ flex:1 }} />

        {/* BOTTOM */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10,
          animation:"dgSlideUp 0.5s ease 0.2s both" }}>

          {/* Scroll hint — fades once rushing */}
          <div style={{ fontSize:9, color:"#1e293b", fontFamily:"'JetBrains Mono',monospace",
            letterSpacing:4, opacity: rushing ? 0 : 1, transition:"opacity 0.5s" }}>
            ↕ SCROLL TO APPROACH
          </div>

          {/* Progress bar */}
          <div style={{ width:260, height:4, background:"rgba(255,255,255,0.04)",
            clipPath:"polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)",
            overflow:"hidden" }}>
            <div style={{
              height:"100%", width:`${pct}%`,
              background:`linear-gradient(90deg,${rankColor}66,${rankColor})`,
              boxShadow:`0 0 10px ${rankColor}`,
              transition:"width 0.06s linear",
            }} />
          </div>

          {/* Distance / entering state */}
          <div style={{
            fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3,
            color: isAtGate ? "#fff" : isNear ? rankColor : "#334155",
            textShadow: isAtGate ? `0 0 20px #fff` : isNear ? `0 0 12px ${rankColor}` : "none",
            animation: isAtGate ? "dgRush 0.6s ease-out forwards" : "none",
            transition:"color 0.4s, text-shadow 0.4s",
          }}>
            { isAtGate ? "ENTERING GATE…"
            : `${Math.max(0, Math.round(43.8 * (1 - scrollPct) * 10) / 10)}m REMAINING` }
          </div>

          {/* Danger bar – 20 segments */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:18,
            opacity: scrollPct > 0.08 ? 1 : 0.2, transition:"opacity 0.8s" }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const filled = i < Math.round(scrollPct * 20);
              return (
                <div key={i} style={{
                  width:5,
                  height: filled ? Math.min(6 + i * 0.7, 18) : 5,
                  background: filled ? (i < 12 ? rankColor : "#ef4444") : "rgba(255,255,255,0.06)",
                  boxShadow: filled ? `0 0 5px ${i < 12 ? rankColor : "#ef4444"}` : "none",
                  borderRadius:1, transition:"all 0.1s ease",
                }} />
              );
            })}
          </div>

          {/* ENTER GATE button */}
          <button
            onClick={handleEnterButton}
            disabled={rushing || warping}
            style={{
              pointerEvents:"all",
              marginTop:2,
              padding:"15px 68px",
              background: isNear
                ? `linear-gradient(135deg,${rankColor}30,${rankColor}14)`
                : "rgba(255,255,255,0.02)",
              color: rankColor,
              border:`1.5px solid ${rankColor}${isNear ? "99" : "33"}`,
              clipPath: clip(11),
              fontSize:14, fontWeight:900,
              fontFamily:"'Cinzel',serif", letterSpacing:5,
              cursor: rushing || warping ? "default" : "pointer",
              opacity: rushing ? 0.5 : 1,
              boxShadow: isNear
                ? `0 0 40px ${rankColor}33, 0 0 80px ${rankColor}14, inset 0 0 18px ${rankColor}14`
                : "none",
              textShadow: isNear ? `0 0 16px ${rankColor}` : "none",
              animation: isNear && !rushing ? "dgPulse 1.4s ease-in-out infinite" : "none",
              transition:"all 0.35s ease",
            }}
          >
            { rushing ? "APPROACHING…" : "ENTER GATE ▶" }
          </button>

          {/* Rewards */}
          {dungeon && (
            <div style={{ display:"flex", gap:10 }}>
              {[
                { v:`+${dungeon.xp} XP`,  c:"#a78bfa", b:"rgba(167,139,250,0.12)" },
                { v:`+${dungeon.gold} G`, c:"#fbbf24", b:"rgba(251,191,36,0.12)"  },
              ].map(({ v, c, b }) => (
                <div key={v} style={{ fontSize:9, color:c, fontFamily:"'JetBrains Mono',monospace",
                  padding:"3px 12px", background:b,
                  clipPath:"polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)" }}>
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
