// ─── CSS ──────────────────────────────────────────────────────
// Extracted from data/constants.jsx
// Global styles and keyframe animations for the app.

// Fonts, reset, and scrollbar styles are now in index.html + styles/base.css.
// This CSS function only injects theme-reactive styles and keyframes into <style> tags during migration.
export const CSS = (t) => `
::-webkit-scrollbar-thumb{background:${t.primary}44;border-radius:4px}
button{cursor:pointer;border:none;font-family:inherit;-webkit-tap-highlight-color:transparent}
input,select{font-family:inherit}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}
@keyframes slideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes scaleIn{from{transform:scale(0.82);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes breathe{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px ${t.glow}}50%{box-shadow:0 0 24px ${t.glow},0 0 48px ${t.glow}}}
@keyframes xpFill{from{width:0}to{width:var(--fill)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.3)}}
@keyframes checkPop{0%{transform:scale(0) rotate(-45deg)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes cardEnter{from{transform:translateX(-12px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes rankShine{0%{left:-100%}100%{left:200%}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes levelUpBg{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}
@keyframes levelUpText{0%{transform:scale(0.3) translateY(40px);opacity:0}30%{transform:scale(1.1) translateY(0);opacity:1}50%{transform:scale(1)}100%{transform:scale(1);opacity:1}}
@keyframes levelUpRays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes levelUpRank{0%,40%{transform:translateY(20px);opacity:0}70%,100%{transform:translateY(0);opacity:1}}
@keyframes sysNotifIn{0%{transform:translate3d(-50%,-18px,0) scale(0.98);opacity:0}58%{transform:translate3d(-50%,2px,0) scale(1.01);opacity:1}100%{transform:translate3d(-50%,0,0) scale(1);opacity:1}}
@keyframes sysNotifOut{0%{transform:translate3d(-50%,0,0) scale(1);opacity:1}100%{transform:translate3d(-50%,-14px,0) scale(0.98);opacity:0}}
@keyframes sysNotifRail{0%,100%{opacity:0.55}50%{opacity:1}}
@keyframes sysNotifSweep{0%{transform:translateX(0);opacity:0}12%{opacity:0.85}100%{transform:translateX(330%);opacity:0}}
@keyframes sysNotifTimer{0%{transform:scaleX(1);opacity:0.95}100%{transform:scaleX(0);opacity:0.25}}
@keyframes sysNotifPing{0%{transform:scale(0.88);opacity:0.45}70%,100%{transform:scale(1.22);opacity:0}}
@keyframes sysCliCardIn{0%{transform:translateY(-26px) scale(0.965);opacity:0;filter:blur(8px)}60%{transform:translateY(2px) scale(1.004);opacity:1;filter:blur(0)}100%{transform:translateY(0) scale(1);opacity:1;filter:blur(0)}}
@keyframes habitWinPop{0%{transform:translateY(14px) scale(0.92);opacity:0}55%{transform:translateY(0) scale(1.02);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
@media (prefers-reduced-motion: reduce){
  @keyframes sysNotifIn{0%{transform:translate3d(-50%,0,0);opacity:0}100%{transform:translate3d(-50%,0,0);opacity:1}}
  @keyframes sysNotifOut{0%{transform:translate3d(-50%,0,0);opacity:1}100%{transform:translate3d(-50%,0,0);opacity:0}}
  @keyframes sysNotifRail{0%,100%{opacity:0.75}}
  @keyframes sysNotifSweep{0%,100%{opacity:0;transform:none}}
  @keyframes sysNotifPing{0%,100%{opacity:0;transform:none}}
  @keyframes sysCliCardIn{0%{opacity:0}100%{opacity:1}}
}
@keyframes ringExpand{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(3);opacity:0}}
@keyframes statBarFill{from{width:0}to{width:var(--fill)}}
@keyframes shadowPulse{0%,100%{box-shadow:0 0 8px ${t.primary}22}50%{box-shadow:0 0 20px ${t.primary}44}}
@keyframes gateFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.02)}}
@keyframes battleLogIn{from{transform:translateX(-8px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes dungeonResultIn{0%{transform:scale(0.7) translateY(30px);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes cursorBlink{50%{opacity:0}}
@keyframes achIn{0%{transform:translateX(120%);opacity:0}15%{transform:translateX(-6px);opacity:1}85%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
@keyframes ariseGround{0%{transform:scaleX(0);opacity:0}40%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0.3}}
@keyframes ariseEnergy{0%{height:0;opacity:0}50%{height:100%;opacity:1}100%{height:100%;opacity:0}}
@keyframes ariseText{0%{letter-spacing:2px;opacity:0;filter:blur(8px)}50%{letter-spacing:12px;opacity:1;filter:blur(0)}100%{letter-spacing:12px;opacity:1;filter:blur(0)}}
@keyframes ariseShadow{0%{opacity:0;transform:scale(0.3) translateY(40px)}60%{opacity:1;transform:scale(1.05) translateY(0)}100%{opacity:1;transform:scale(1)}}
@keyframes ariseGlow{0%,100%{text-shadow:0 0 20px #7c3aed}50%{text-shadow:0 0 60px #7c3aed,0 0 120px #a78bfa}}
@keyframes penaltyPulse{0%,100%{border-color:#ef444422}50%{border-color:#ef444466}}
@keyframes glitch{0%,100%{transform:none;filter:none}20%{transform:translateX(-2px);filter:hue-rotate(90deg)}40%{transform:translateX(2px);filter:hue-rotate(-90deg)}60%{transform:none;filter:invert(0.1)}}
@keyframes shadowCardGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 16px var(--shadow-glow)}}
@keyframes shadowRise{0%{transform:translateY(20px) scale(0.9);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes formationPulse{0%,100%{opacity:0.4}50%{opacity:0.9}}
@keyframes namedGlow{0%,100%{filter:drop-shadow(0 0 8px var(--named-color))}50%{filter:drop-shadow(0 0 20px var(--named-color)) drop-shadow(0 0 40px var(--named-color))}}
@keyframes tierShine{0%{transform:translateX(-100%) rotate(45deg)}100%{transform:translateX(300%) rotate(45deg)}}
@keyframes monarchRays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes floorReveal{0%{transform:translateX(-20px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes bossPhaseIn{0%{transform:scale(0.6) translateY(20px);opacity:0;filter:blur(8px)}60%{transform:scale(1.08);opacity:1;filter:blur(0)}100%{transform:scale(1);opacity:1}}
@keyframes bossShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes extractionPulse{0%,100%{box-shadow:0 0 10px #22c55e33}50%{box-shadow:0 0 30px #22c55e66,0 0 60px #22c55e22}}
@keyframes hpBar{from{width:var(--from)}to{width:var(--to)}}
@keyframes phaseWave{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes floorActiveGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 12px var(--floor-color)}}
@keyframes safeRoomGlow{0%,100%{box-shadow:0 0 6px #22c55e22}50%{box-shadow:0 0 20px #22c55e55}}
@keyframes hexPulse{0%,100%{opacity:0.85}50%{opacity:1;filter:brightness(1.2)}}
@keyframes shimmer{0%{left:-100%}100%{left:200%}}
@keyframes fireGlow{0%,100%{filter:drop-shadow(0 0 4px #f97316) drop-shadow(0 -2px 8px #fbbf24)}50%{filter:drop-shadow(0 0 10px #ef4444) drop-shadow(0 -4px 16px #f97316)}}

/* ── SHADOW MONARCH'S GATE – CINEMA-GRADE PAGE TRANSITIONS ── */

@keyframes slChromaticAberration{
  0%{backdrop-filter:blur(0px) brightness(1) saturate(1);opacity:0}
  30%{backdrop-filter:blur(2px) brightness(0.9) saturate(1.4) hue-rotate(5deg);opacity:0.6}
  60%{backdrop-filter:blur(4px) brightness(0.7) saturate(1.8) hue-rotate(15deg);opacity:0.85}
  100%{backdrop-filter:blur(8px) brightness(0.3) saturate(2) hue-rotate(20deg);opacity:1}
}
@keyframes slGlitchBand{
  0%{transform:translateX(-100%) scaleY(1);opacity:0}
  25%{transform:translateX(10%) scaleY(2);opacity:0.8}
  50%{transform:translateX(-5%) scaleY(0.5);opacity:0.4}
  75%{transform:translateX(3%) scaleY(1.5);opacity:0.6}
  100%{transform:translateX(100%) scaleY(1);opacity:0}
}
@keyframes slVoidExpand{
  0%{clip-path:circle(0% at 50% 50%)}
  40%{clip-path:circle(35% at 50% 50%)}
  70%{clip-path:circle(65% at 50% 50%)}
  100%{clip-path:circle(100% at 50% 50%)}
}
@keyframes slVoidCollapse{
  0%{clip-path:circle(100% at 50% 50%);opacity:1}
  30%{clip-path:circle(60% at 50% 50%);opacity:0.98}
  60%{clip-path:circle(25% at 50% 50%);opacity:0.9}
  80%{clip-path:circle(8% at 50% 50%);opacity:0.5}
  100%{clip-path:circle(0% at 50% 50%);opacity:0}
}
@keyframes slEnergyRipple{
  0%{transform:scale(0);opacity:0.9;border-width:3px}
  30%{opacity:0.7;border-width:2px}
  60%{opacity:0.35;border-width:1px}
  100%{transform:scale(8);opacity:0;border-width:0.5px}
}
@keyframes slRiftGlow{
  0%{height:0;opacity:0;filter:blur(4px)}
  30%{height:50vh;opacity:0.8;filter:blur(1px)}
  60%{height:70vh;opacity:1;filter:blur(0)}
  100%{height:85vh;opacity:0.95;filter:blur(0)}
}
@keyframes slRiftPulse{
  0%{box-shadow:0 0 25px #7c3aed88,0 0 50px #22d3ee44;filter:brightness(1)}
  100%{box-shadow:0 0 60px #a78bfacc,0 0 100px #7c3aed88,0 0 140px #22d3ee33;filter:brightness(1.3)}
}
@keyframes slRiftPulseOuter{
  0%{opacity:0.4;transform:scaleX(1)}
  100%{opacity:0.9;transform:scaleX(1.2)}
}
@keyframes slScanLine{
  0%{transform:translateY(-100vh);opacity:0}
  10%{opacity:1}
  90%{opacity:1}
  100%{transform:translateY(100vh);opacity:0}
}
@keyframes slViewNameGlitch{
  0%{opacity:0;letter-spacing:0px;filter:blur(12px);transform:translateY(10px) scaleY(0.8)}
  15%{opacity:0.3;filter:blur(6px);transform:translateY(-3px) scaleY(1.1) skewX(-2deg)}
  25%{opacity:0.7;filter:blur(2px);transform:translateY(2px) scaleY(0.95) skewX(1deg)}
  40%{opacity:1;letter-spacing:8px;filter:blur(0);transform:translateY(-1px) scaleY(1.02)}
  55%{opacity:0.9;letter-spacing:12px;transform:translateY(0) scaleY(1) skewX(-0.5deg)}
  70%{opacity:1;letter-spacing:10px;transform:skewX(0.3deg)}
  85%{opacity:0.95;letter-spacing:10px;transform:skewX(0)}
  100%{opacity:1;letter-spacing:10px;filter:blur(0);transform:none}
}
@keyframes slRuneOrbit{
  0%{transform:rotate(0deg) translateX(var(--orbit-radius, 70px)) rotate(0deg);opacity:0;filter:blur(4px)}
  10%{opacity:0.8;filter:blur(0)}
  50%{opacity:0.6}
  85%{opacity:0.3;filter:blur(1px)}
  100%{transform:rotate(360deg) translateX(var(--orbit-radius, 70px)) rotate(-360deg);opacity:0;filter:blur(4px)}
}
@keyframes slShadowEyesReveal{
  0%{opacity:0;transform:translate(-50%,-50%) scale(0.1);filter:blur(8px)}
  40%{opacity:0.9;transform:translate(-50%,-50%) scale(1.2);filter:blur(0)}
  70%{opacity:1;transform:translate(-50%,-50%) scale(0.95)}
  100%{opacity:1;transform:translate(-50%,-50%) scale(1)}
}
@keyframes slShadowEyePulse{
  0%{box-shadow:0 0 20px #7c3aed,0 0 40px #7c3aed,0 0 60px #7c3aed88,inset 0 0 8px rgba(255,255,255,0.2)}
  100%{box-shadow:0 0 35px #a78bfa,0 0 65px #7c3aedcc,0 0 100px #7c3aedaa,0 0 130px #22d3ee33,inset 0 0 12px rgba(255,255,255,0.35)}
}
@keyframes slBadgeIn{
  0%{opacity:0;transform:translateY(-8px) scale(0.8)}
  100%{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes slCursorBlink{50%{opacity:0}}
@keyframes slUnderlineExpand{
  0%{width:0;opacity:0}
  100%{width:120px;opacity:1}
}
@keyframes slFadeOut{
  0%{opacity:1;filter:blur(0)}
  100%{opacity:0;filter:blur(4px);transform:translate(-50%,-50%) scale(0.95)}
}
@keyframes slResidualFloat{
  0%{opacity:0.8;transform:translateY(0) scale(1)}
  40%{opacity:0.5;transform:translateY(-20px) scale(0.8)}
  100%{opacity:0;transform:translateY(-60px) scale(0.1)}
}
@keyframes slRadialBurst{
  0%{width:0;height:0;opacity:0.6}
  50%{width:150vw;height:150vw;opacity:0.3}
  100%{width:200vw;height:200vw;opacity:0}
}
@keyframes slAfterglowFade{
  0%{opacity:1}
  100%{opacity:0}
}
@keyframes pageEmerge{
  0%{transform:scale(0.96);opacity:0;filter:brightness(1.5) saturate(1.4) blur(2px)}
  30%{transform:scale(1.008);opacity:0.7;filter:brightness(1.15) saturate(1.1) blur(0)}
  60%{transform:scale(0.998);opacity:0.9;filter:brightness(1.05)}
  100%{transform:scale(1);opacity:1;filter:brightness(1) saturate(1) blur(0)}
}
@keyframes slideDown{
  from{transform:translateY(-16px);opacity:0}
  to{transform:translateY(0);opacity:1}
}
/* ── QUEST COMPLETION CINEMATIC ──────────────────────────────── */

@keyframes qcFlash {
  0% { opacity: 0 }
  12% { opacity: 1 }
  35% { opacity: 0.6 }
  100% { opacity: 0 }
}
@keyframes qcFlashSubtle {
  0% { opacity: 0 }
  20% { opacity: 0.5 }
  100% { opacity: 0 }
}
@keyframes qcChromaticFlash {
  0% { opacity: 0; transform: scaleY(1) }
  20% { opacity: 0.8; transform: scaleY(1.02) }
  50% { opacity: 0.4; transform: scaleY(0.99) }
  100% { opacity: 0; transform: scaleY(1) }
}
@keyframes qcParticle {
  0% { transform: translate(0, 0) scale(1); opacity: 1 }
  30% { opacity: 0.9 }
  70% { opacity: 0.4 }
  100% { transform: translate(var(--qc-tx), var(--qc-ty)) scale(0.15); opacity: 0 }
}
@keyframes qcRingBurst {
  0% { width: 0; height: 0; opacity: 0.9; border-width: 2px }
  40% { opacity: 0.6; border-width: 1.5px }
  100% { width: 200px; height: 200px; opacity: 0; border-width: 0.5px }
}
@keyframes qcVignetteIn {
  0% { opacity: 0 }
  100% { opacity: 1 }
}
@keyframes qcSystemBoxIn {
  0% { opacity: 0; transform: scale(0.92) translateY(8px); filter: blur(4px) }
  40% { opacity: 0.8; filter: blur(1px) }
  70% { transform: scale(1.01) translateY(-1px); filter: blur(0) }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) }
}
@keyframes qcScanLine {
  0% { top: -2px; opacity: 0 }
  5% { opacity: 0.6 }
  45% { opacity: 0.6 }
  50% { opacity: 0 }
  55% { opacity: 0.6 }
  95% { opacity: 0.6 }
  100% { top: calc(100% + 2px); opacity: 0 }
}
@keyframes qcTextLineIn {
  0% { opacity: 0; transform: translateX(-4px) }
  100% { opacity: 1; transform: translateX(0) }
}
@keyframes qcRewardFloat {
  0% { opacity: 0; transform: translateY(10px) scale(0.8) }
  60% { opacity: 1; transform: translateY(-30px) scale(1.05) }
  100% { opacity: 0; transform: translateY(-60px) scale(1) }
}
@keyframes qcRewardXp {
  0% { opacity: 0; transform: translateY(20px) scale(0.5); filter: blur(6px) }
  50% { opacity: 1; transform: translateY(-4px) scale(1.08); filter: blur(0) }
  100% { opacity: 1; transform: translateY(0) scale(1) }
}
@keyframes qcRewardGold {
  0% { opacity: 0; transform: translateY(16px) scale(0.6) }
  50% { opacity: 1; transform: translateY(-3px) scale(1.06) }
  100% { opacity: 1; transform: translateY(0) scale(1) }
}
@keyframes qcRewardStat {
  0% { opacity: 0; transform: translateY(12px) }
  60% { opacity: 1; transform: translateY(-2px) }
  100% { opacity: 1; transform: translateY(0) }
}
@keyframes qcLevelUpBurst {
  0% { opacity: 0; transform: scale(0.3); filter: blur(8px) }
  40% { opacity: 1; filter: blur(0) }
  60% { transform: scale(1.15) }
  80% { transform: scale(0.98) }
  100% { opacity: 1; transform: scale(1) }
}
@keyframes qcOverlayIn {
  0% { opacity: 0 }
  100% { opacity: 1 }
}
@keyframes qcOverlayFade {
  0% { opacity: 1 }
  100% { opacity: 0 }
}
@keyframes qcShake {
  0%, 100% { transform: translateX(0) translateY(0) }
  10% { transform: translateX(-3px) translateY(1px) }
  20% { transform: translateX(4px) translateY(-2px) }
  30% { transform: translateX(-4px) translateY(1px) }
  40% { transform: translateX(3px) translateY(-1px) }
  50% { transform: translateX(-2px) translateY(1px) }
  60% { transform: translateX(2px) translateY(-1px) }
  70% { transform: translateX(-1px) }
  80% { transform: translateX(1px) }
}
@keyframes qcGlitchBand {
  0% { transform: translateX(-100%); opacity: 0 }
  30% { transform: translateX(0%); opacity: 0.7 }
  70% { transform: translateX(5%); opacity: 0.3 }
  100% { transform: translateX(100%); opacity: 0 }
}
@keyframes qcRuneFlash {
  0% { opacity: 0; transform: translate(-50%,-50%) scale(0.4) rotate(var(--r, 0deg)); filter: blur(6px) }
  30% { opacity: 0.85; transform: translate(-50%,-50%) scale(1.15) rotate(var(--r, 0deg)); filter: blur(0) }
  70% { opacity: 0.5; transform: translate(-50%,-50%) scale(1) rotate(var(--r, 0deg)) }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(0.8) rotate(var(--r, 0deg)); filter: blur(3px) }
}
@keyframes qcEnergyLine {
  0% { height: 0; opacity: 0 }
  30% { height: 80px; opacity: 0.7 }
  60% { height: 140px; opacity: 0.4 }
  100% { height: 200px; opacity: 0 }
}
@keyframes qcHoloShimmer {
  0% { background-position: -200% 0 }
  100% { background-position: 200% 0 }
}
@keyframes qcSystemFadePartial {
  0% { opacity: 1; transform: translateY(0) scale(1) }
  100% { opacity: 0.15; transform: translateY(-12px) scale(0.97); filter: blur(2px) }
}
@keyframes qcLabelIn {
  0% { opacity: 0; transform: translateY(-6px); letter-spacing: 2px }
  100% { opacity: 1; transform: translateY(0); letter-spacing: 6px }
}
@keyframes qcTextGlitch {
  0%,95% { transform: none; opacity: 0.15 }
  96% { transform: translateX(-2px); opacity: 0.3 }
  97% { transform: translateX(2px) skewX(2deg); opacity: 0.2 }
  98% { transform: translateX(-1px); opacity: 0.25 }
  99% { transform: translateX(1px) skewX(-1deg); opacity: 0.15 }
}
@keyframes qcRewardPulseRing {
  0% { transform: scale(0.3); opacity: 0 }
  40% { opacity: 0.6 }
  100% { transform: scale(2); opacity: 0 }
}
@keyframes slWindowAppear {
  0% { opacity: 0; transform: scale(0.88) translateY(16px); filter: blur(8px) }
  40% { opacity: 0.7; filter: blur(2px) }
  70% { transform: scale(1.02) translateY(-2px); filter: blur(0) }
  100% { opacity: 1; transform: scale(1) translateY(0) }
}
@keyframes slWindowGlow {
  0% { opacity: 0.5 }
  100% { opacity: 1 }
}
@keyframes slTitlePulse {
  0%, 100% { opacity: 1; text-shadow: 0 0 12px rgba(52, 211, 153, 0.5) }
  50% { opacity: 0.85; text-shadow: 0 0 20px rgba(52, 211, 153, 0.8) }
}
@keyframes systemBadgePulse {
  0%, 100% { box-shadow: 0 0 4px #06b6d422; }
  50% { box-shadow: 0 0 10px #06b6d466, 0 0 18px #06b6d422; }
}
@keyframes systemPulse {
  0%, 100% { box-shadow: 0 0 20px ${t.primary}1a, inset 0 0 40px ${t.primary}05; }
  50% { box-shadow: 0 0 40px ${t.primary}40, inset 0 0 60px ${t.primary}0f; }
}
@keyframes ratingModalIn {
  0% { opacity: 0; transform: scale(0.88) translateY(20px); filter: blur(8px); }
  50% { opacity: 0.9; filter: blur(1px); }
  75% { transform: scale(1.02) translateY(-2px); filter: blur(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── PREMIUM SHOP ANIMATIONS ─────────────────────────────────── */

@keyframes shopHeaderGlow {
  0%, 100% { box-shadow: 0 0 30px ${t.primary}22, inset 0 0 60px ${t.primary}08; }
  50% { box-shadow: 0 0 60px ${t.primary}44, inset 0 0 80px ${t.primary}15, 0 0 120px ${t.primary}11; }
}
@keyframes gemFloat {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  25% { transform: translateY(-12px) rotate(5deg) scale(1.05); }
  50% { transform: translateY(-6px) rotate(0deg) scale(1.02); }
  75% { transform: translateY(-14px) rotate(-5deg) scale(1.06); }
}
@keyframes coinSpin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}
@keyframes holoShimmer {
  0% { background-position: -200% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes shopCardHover {
  0% { transform: translateY(0) scale(1); box-shadow: none; }
  100% { transform: translateY(-4px) scale(1.015); }
}
@keyframes rarityPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes shopParticle {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  50% { opacity: 0.6; }
  100% { transform: translate(var(--sp-tx, 30px), var(--sp-ty, -60px)) scale(0); opacity: 0; }
}
@keyframes gemPulseRing {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes shopBtnShine {
  0% { left: -100%; }
  100% { left: 200%; }
}
@keyframes categoryGlow {
  0%, 100% { box-shadow: 0 0 0 transparent; }
  50% { box-shadow: 0 2px 16px var(--cat-glow, ${t.primary}44); }
}
@keyframes boosterOrb {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.15); filter: brightness(1.4); }
}
@keyframes priceTag {
  0% { transform: scale(0.9); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes shopSectionIn {
  0% { transform: translateY(20px); opacity: 0; filter: blur(4px); }
  60% { transform: translateY(-2px); opacity: 0.9; filter: blur(0); }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes gemCrystalRotate {
  0% { transform: rotate3d(0, 1, 0.2, 0deg); }
  100% { transform: rotate3d(0, 1, 0.2, 360deg); }
}
@keyframes codexGlow {
  0%, 100% { text-shadow: 0 0 8px #7c3aed44; }
  50% { text-shadow: 0 0 20px #7c3aed88, 0 0 40px #7c3aed44; }
}
@keyframes shopStarfield {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh); opacity: 0; }
}
@keyframes earnBtnPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
@keyframes badgeShine {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
@keyframes itemReveal {
  0% { transform: translateX(-20px) scale(0.95); opacity: 0; filter: blur(4px); }
  50% { filter: blur(0); }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}
@keyframes comingSoonFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
}
@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes shopMask {
  0% { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}

.shop-card-hover:hover {
  transform: translateY(-3px) scale(1.01) !important;
  box-shadow: 0 8px 32px var(--card-glow, rgba(124,58,237,0.2)) !important;
  border-color: var(--card-border-hover, #a855f744) !important;
}
.shop-card-hover {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
.shop-btn-hover:hover {
  transform: translateY(-1px) scale(1.04) !important;
  filter: brightness(1.2) !important;
}
.shop-btn-hover:active {
  transform: scale(0.96) !important;
}
.shop-btn-hover {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
.shop-tab-hover:hover {
  transform: translateY(-2px) !important;
  filter: brightness(1.15) !important;
}

@media (max-width: 440px) {
  .header-hide-mobile { display: none !important; }
  .header-compact { gap: 4px !important; }
  .stat-item-compact { padding: 4px 6px !important; }
  .stat-value-compact { fontSize: 10px !important; }
}
`;
