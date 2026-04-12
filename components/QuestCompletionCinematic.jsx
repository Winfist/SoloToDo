// ═══ QUEST COMPLETION CINEMATIC ═══════════════════════════════
// Premium Solo-Leveling-style System Window for quest completion.
//
// The design replicates the iconic floating System panels from
// Solo Leveling: rectangular blue-bordered windows with header,
// reward lines that appear one-by-one, and typewriter system text.
//
// KEY CHANGE: The system window STAYS on screen long enough to READ.
// Timing is generous — easy: 3s, normal: 4s, hard: 5s, boss: 7s.

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CATEGORIES } from "../data/gameData.js";

// ─── SYSTEM MESSAGE GENERATOR ─────────────────────────────────
const MSG = {
  boss: [
    ["S-Rang Quest bezwungen.", "Außergewöhnliche Leistung registriert.", "Die Macht des Monarchen wächst."],
    ["Boss eliminiert.", "Du hast das Unmögliche vollbracht.", "Die Schatten flüstern deinen Namen."],
    ["Ein Gegner weniger.", "Deine Stärke kennt keine Grenzen.", "Respekt, Hunter."],
  ],
  hard: [
    ["Schwere Herausforderung gemeistert.", "Das System erkennt wahre Stärke."],
    ["Beeindruckend.", "Wenige erreichen dieses Level."],
    ["Widerstand bezwungen.", "Dein Wille ist stärker als das Hindernis."],
  ],
  hidden: [["Verborgenes Wissen erlangt.", "Die Wahrheit enthüllt sich dem Würdigen."]],
  streak_high: [["${n}-Tage-Streak.", "Unaufhaltsam. Legendär."]],
  streak_mid: [["${n}-Tage-Streak.", "Disziplin formt Macht."]],
  streak_low: [["${n}-Tage-Streak aufgebaut.", "Beständigkeit wird belohnt."]],
  first: [["Tägliche Jagd beginnt.", "Zeige keine Schwäche, Hunter."]],
  penalty: [["Der Hunter kehrt zurück.", "Die Schatten warteten."]],
  levelup: [["Level ${lvl} erreicht.", "Neue Fähigkeiten freigeschaltet."]],
  emergency: [
    ["Notfallmission abgeschlossen.", "Unter Druck zeigt sich wahre Stärke.", "Doppelte Belohnungen gewährt."],
    ["Notfall neutralisiert.", "Das System erhöht deine Bewertung.", "Hervorragende Reaktionszeit."],
    ["Krisensituation gemeistert.", "Der Hunter beweist seine Klasse.", "Bonus-Belohnungen freigeschaltet."],
  ],
  normal: [
    ["Quest abgeschlossen.", "Weitermachen, Hunter."],
    ["Auftrag erfüllt.", "Jede Quest zählt."],
    ["Erledigt.", "Stärke wächst durch Beständigkeit."],
    ["Fortschritt registriert.", "Der nächste Schritt wartet."],
    ["Bestätigt.", "Aufgeben war nie eine Option."],
    ["Abgeschlossen.", "Das System vermerkt deinen Fortschritt."],
  ],
};

function pickMsg(quest, ctx) {
  const { streak, penaltyActive, isFirstToday, didLevelUp, newLevel } = ctx;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const fill = (lines, vars) => lines.map(l =>
    l.replace("${n}", vars.n || "").replace("${lvl}", vars.lvl || "")
  );
  if (didLevelUp) return fill(pick(MSG.levelup), { lvl: newLevel });
  if (penaltyActive) return pick(MSG.penalty);
  if (quest.type === "emergency") return pick(MSG.emergency);
  if (quest.difficulty === "boss") return pick(MSG.boss);
  if (quest.difficulty === "hard") return pick(MSG.hard);
  if (quest.type === "hidden") return pick(MSG.hidden);
  if (isFirstToday) return pick(MSG.first);
  if (streak >= 14) return fill(pick(MSG.streak_high), { n: streak });
  if (streak >= 7) return fill(pick(MSG.streak_mid), { n: streak });
  if (streak >= 3) return fill(pick(MSG.streak_low), { n: streak });
  return pick(MSG.normal);
}

// ─── TIMING PROFILES ─────────────────────────────────────────
// Times in ms. The system window stays visible for the full "window" duration.
const TM = {
  easy:   { flash: 300, windowDelay: 250,  rewardStagger: 250, windowDuration: 2200, fadeStart: 2600,  total: 3000 },
  normal: { flash: 350, windowDelay: 300,  rewardStagger: 300, windowDuration: 3000, fadeStart: 3500,  total: 4000 },
  hard:   { flash: 400, windowDelay: 350,  rewardStagger: 350, windowDuration: 3800, fadeStart: 4500,  total: 5000 },
  boss:   { flash: 500, windowDelay: 400,  rewardStagger: 400, windowDuration: 5500, fadeStart: 6200,  total: 7000 },
};

// ─── SOLO LEVELING BLUE PALETTE ────────────────────────────────
const SL = {
  border: "#4f8bf9",       // the iconic system window border
  borderGlow: "#3b82f6",
  headerBg: "#1e3a8a",
  headerText: "#93c5fd",
  bodyBg: "rgba(5, 10, 30, 0.94)",
  text: "#dbeafe",
  dimText: "#93a3b3",
  accent: "#60a5fa",
  xpPurple: "#a78bfa",
  gold: "#fbbf24",
  success: "#34d399",
  boss: "#ef4444",
  hard: "#f59e0b",
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function QuestCompletionCinematic({ data, onDone }) {
  const [phase, setPhase] = useState(0);
  // 0=idle, 1=flash+shake, 2=window appears, 3=rewards revealed, 4=system text, 5=fading
  const [visibleRewards, setVisibleRewards] = useState(0);
  const [typedLines, setTypedLines] = useState([]);
  const [typingDone, setTypingDone] = useState(false);
  const [fading, setFading] = useState(false);
  const skipRef = useRef(false);
  const timersRef = useRef([]);

  const diff = data?.difficulty || "normal";
  const timing = TM[diff] || TM.normal;
  const cat = useMemo(
    () => CATEGORIES.find(c => c.key === data?.statCategory) || CATEGORIES[0],
    [data?.statCategory]
  );
  const systemLines = useMemo(
    () => data ? pickMsg(data.quest, data.context) : [],
    [data]
  );

  // Difficulty-based accent color for the glow effects
  const isEmergency = data?.quest?.type === "emergency";
  const diffColor = isEmergency ? "#ef4444" : diff === "boss" ? SL.boss : diff === "hard" ? SL.hard : SL.border;

  // The reward lines to show
  const rewardLines = useMemo(() => {
    if (!data) return [];
    const lines = [
      { label: "Erfahrungspunkte", value: `+${data.xpGain} XP`, color: SL.xpPurple, icon: "⚔" },
      { label: "Gold erhalten", value: `+${data.goldGain} G`, color: SL.gold, icon: "💰" },
    ];
    if (cat) {
      const statGain = isEmergency ? 2 : 1;
      lines.push({ label: `${cat.stat} erhöht`, value: `+${statGain}`, color: cat.color, icon: "📊" });
    }
    if (data.context.didLevelUp) {
      lines.push({ label: "LEVEL UP!", value: `Level ${data.context.newLevel}`, color: "#fff", icon: "⭐", special: true });
    }
    return lines;
  }, [data, cat]);

  // Particle burst positions
  const particles = useMemo(() => {
    if (!data) return [];
    const count = diff === "boss" ? 40 : diff === "hard" ? 28 : diff === "normal" ? 18 : 10;
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i + Math.random() * 20 - 10;
      const rad = angle * Math.PI / 180;
      const dist = 60 + Math.random() * 160;
      return {
        id: i,
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist - Math.random() * 40,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 200,
        dur: 600 + Math.random() * 400,
        bright: Math.random() > 0.5,
      };
    });
  }, [data, diff]);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onDone();
  }, [onDone]);

  // Master timeline
  useEffect(() => {
    if (!data) return;
    skipRef.current = false;
    setPhase(0); setVisibleRewards(0); setTypedLines([]); setTypingDone(false); setFading(false);
    const t = timing;
    const timers = [];
    const sk = () => skipRef.current;

    // Phase 1: Flash + impact
    timers.push(setTimeout(() => { if (!sk()) setPhase(1); }, 20));

    // Phase 2: System window materializes
    timers.push(setTimeout(() => { if (!sk()) setPhase(2); }, t.windowDelay));

    // Phase 3: Rewards appear one by one
    rewardLines.forEach((_, i) => {
      timers.push(setTimeout(() => {
        if (!sk()) setVisibleRewards(i + 1);
      }, t.windowDelay + 400 + i * t.rewardStagger));
    });

    // Phase 4: System text starts typing
    const textStart = t.windowDelay + 400 + rewardLines.length * t.rewardStagger + 200;
    timers.push(setTimeout(() => { if (!sk()) setPhase(4); }, textStart));

    // Phase 5: Start fading (disabled so it stays on screen)
    // timers.push(setTimeout(() => {
    //   if (!sk()) { setPhase(5); setFading(true); }
    // }, t.fadeStart));

    // Done (disabled so user must click)
    // timers.push(setTimeout(() => { if (!sk()) onDone(); }, t.total));

    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [data, timing, rewardLines]); // Omit onDone to prevent restarting on dashboard re-render

  // Typewriter
  useEffect(() => {
    if (phase !== 4 || systemLines.length === 0) return;
    let li = 0, ci = 0, lines = [];
    setTypedLines([]); setTypingDone(false);
    function tick() {
      if (skipRef.current) return;
      if (li >= systemLines.length) { setTypingDone(true); return; }
      const cur = systemLines[li];
      if (ci < cur.length) {
        lines = [...lines];
        lines[li] = (lines[li] || "") + cur[ci];
        setTypedLines([...lines]);
        ci++;
        timersRef.current.push(setTimeout(tick, 30));
      } else {
        li++; ci = 0;
        if (li < systemLines.length) timersRef.current.push(setTimeout(tick, 300));
        else setTypingDone(true);
      }
    }
    const start = setTimeout(tick, 100);
    timersRef.current.push(start);
    return () => clearTimeout(start);
  }, [phase, systemLines]);

  if (!data) return null;

  const isBoss = diff === "boss";
  const isHard = diff === "hard";

  return (
    <div onClick={handleSkip} style={{
      position: "fixed", inset: 0, zIndex: 950, cursor: "pointer",
      animation: fading ? "qcOverlayFade 800ms ease-out forwards" : "fadeIn 200ms ease both",
    }}>
      {/* ═══ DARK OVERLAY ═══ */}
      <div style={{
        position: "absolute", inset: 0,
        background: isBoss
          ? "radial-gradient(ellipse at 50% 40%, rgba(25, 5, 5, 0.96), rgba(2, 2, 8, 0.98))"
          : "radial-gradient(ellipse at 50% 40%, rgba(5, 15, 40, 0.96), rgba(2, 2, 8, 0.98))",
        backdropFilter: "blur(12px)",
      }} />

      {/* ═══ PHASE 1: IMPACT FLASH ═══ */}
      {phase >= 1 && (
        <>
          {/* Blue screen flash */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${diffColor}66, ${diffColor}22 40%, transparent 70%)`,
            animation: `qcFlash ${timing.flash}ms ease-out forwards`,
            mixBlendMode: "screen",
          }} />

          {/* Expanding ring */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 0, height: 0, borderRadius: "50%",
            border: `2px solid ${SL.border}`,
            transform: "translate(-50%, -50%)",
            animation: `qcRingBurst 600ms ease-out forwards`,
            boxShadow: `0 0 30px ${SL.borderGlow}44`,
          }} />

          {/* Second ring (hard/boss) */}
          {(isHard || isBoss) && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              width: 0, height: 0, borderRadius: "50%",
              border: `1px solid ${diffColor}88`,
              transform: "translate(-50%, -50%)",
              animation: `qcRingBurst 800ms ease-out 100ms forwards`,
            }} />
          )}

          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: "absolute", left: "50%", top: "50%",
              width: p.size, height: p.size, borderRadius: "50%",
              background: p.bright ? "#fff" : SL.accent,
              boxShadow: `0 0 ${p.size * 3}px ${SL.accent}`,
              animation: `qcParticle ${p.dur}ms ease-out ${p.delay}ms both`,
              "--qc-tx": `${p.tx}px`, "--qc-ty": `${p.ty}px`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Edge pulse (boss) */}
          {isBoss && (
            <div style={{
              position: "absolute", inset: 0,
              boxShadow: `inset 0 0 80px ${SL.boss}44, inset 0 0 160px ${SL.boss}11`,
              animation: "qcFlash 500ms ease-out forwards",
              pointerEvents: "none",
            }} />
          )}
        </>
      )}

      {/* ═══ PHASE 2+: THE SYSTEM WINDOW ═══ */}
      {phase >= 2 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 16px",
          animation: fading ? "qcSystemFadePartial 600ms ease-out forwards" : undefined,
        }}>
          <div style={{
            width: "100%", maxWidth: 420,
            animation: "slWindowAppear 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
            position: "relative",
          }}>
            {/* Outer glow */}
            <div style={{
              position: "absolute", inset: -8,
              background: `radial-gradient(ellipse at 50% 0%, ${SL.borderGlow}22, transparent 70%)`,
              borderRadius: 18, pointerEvents: "none",
              animation: "slWindowGlow 2s ease-in-out infinite alternate",
            }} />

            {/* ─── HEADER BAR ─── */}
            <div style={{
              background: `linear-gradient(135deg, ${SL.headerBg}, ${SL.headerBg}dd)`,
              borderTop: `2px solid ${SL.border}`,
              borderLeft: `1px solid ${SL.border}88`,
              borderRight: `1px solid ${SL.border}88`,
              borderRadius: "12px 12px 0 0",
              padding: "12px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "relative", overflow: "hidden",
            }}>
              {/* Header shimmer */}
              <div style={{
                position: "absolute", top: 0, left: "-100%", width: "80%", height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                animation: "shimmer 3s ease-in-out infinite",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: SL.accent,
                  boxShadow: `0 0 8px ${SL.accent}, 0 0 16px ${SL.accent}88`,
                  animation: "pulse 1.5s infinite",
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 800, letterSpacing: 4,
                  color: SL.headerText,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  SYSTEM
                </span>
              </div>

              {/* Close X */}
              <div style={{
                fontSize: 13, color: SL.border + "88", cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              }}>
                ✕
              </div>
            </div>

            {/* ─── BODY ─── */}
            <div style={{
              background: SL.bodyBg,
              border: `1px solid ${SL.border}55`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "18px 20px 16px",
              position: "relative",
              overflow: "hidden",
              backdropFilter: "blur(20px)",
            }}>
              {/* Subtle scanlines */}
              <div style={{
                position: "absolute", inset: 0,
                background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100,160,255,0.015) 3px, rgba(100,160,255,0.015) 6px)",
                pointerEvents: "none",
              }} />

              {/* Traveling scan line */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent 10%, ${SL.accent}33 50%, transparent 90%)`,
                animation: "qcScanLine 3s linear infinite",
                pointerEvents: "none",
              }} />

              {/* ── QUEST COMPLETE TITLE ── */}
              <div style={{
                textAlign: "center", marginBottom: 16,
                paddingBottom: 14,
                borderBottom: `1px solid ${SL.border}33`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 5,
                  color: SL.success,
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: `0 0 12px ${SL.success}88`,
                  animation: "slTitlePulse 2s ease-in-out infinite",
                  marginBottom: 6,
                }}>
                  ✦ QUEST ABGESCHLOSSEN ✦
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: SL.text,
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: 1,
                  lineHeight: 1.3,
                }}>
                  {data.quest.title}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: 3, marginTop: 6,
                  color: diffColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase",
                }}>
                  {diff === "boss" ? "S-Rang" : diff === "hard" ? "A-Rang" : diff === "easy" ? "E-Rang" : "B-Rang"} · {data.quest.type === "emergency" ? "Notfallmission" : data.quest.type === "daily" ? "Tägliche Quest" : data.quest.type === "weekly" ? "Wöchentliche Quest" : "Side Quest"}
                </div>
              </div>

              {/* ── REWARD LINES (appear one by one) ── */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 3, color: SL.border,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 10, fontWeight: 700,
                }}>
                  BELOHNUNGEN
                </div>

                {rewardLines.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px",
                      marginBottom: 4,
                      borderRadius: 8,
                      background: i < visibleRewards
                        ? (r.special ? `linear-gradient(135deg, ${diffColor}20, ${diffColor}08)` : `rgba(255,255,255,0.03)`)
                        : "transparent",
                      border: i < visibleRewards
                        ? (r.special ? `1px solid ${diffColor}55` : `1px solid rgba(255,255,255,0.05)`)
                        : "1px solid transparent",
                      opacity: i < visibleRewards ? 1 : 0,
                      transform: i < visibleRewards ? "translateX(0)" : "translateX(-20px)",
                      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Shimmer on appear */}
                    {i < visibleRewards && r.special && (
                      <div style={{
                        position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                        animation: "shimmer 2s ease-in-out infinite",
                        pointerEvents: "none",
                      }} />
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, color: SL.border }}>►</span>
                      <span style={{
                        fontSize: 13, color: SL.dimText,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {r.label}
                      </span>
                    </div>

                    <div style={{
                      fontSize: r.special ? 16 : 15,
                      fontWeight: 800,
                      color: r.color,
                      fontFamily: r.special ? "'Cinzel', serif" : "'JetBrains Mono', monospace",
                      textShadow: r.special ? `0 0 20px ${r.color}88` : `0 0 8px ${r.color}44`,
                      letterSpacing: r.special ? 2 : 1,
                    }}>
                      {r.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── SYSTEM TEXT (typewriter) ── */}
              {phase >= 4 && (
                <div style={{
                  borderTop: `1px solid ${SL.border}22`,
                  paddingTop: 12,
                  minHeight: 36,
                }}>
                  <div style={{
                    fontSize: 9, letterSpacing: 3, color: SL.border,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 8, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: SL.accent,
                      boxShadow: `0 0 6px ${SL.accent}`,
                      animation: "pulse 1s infinite",
                    }} />
                    SYSTEM NACHRICHT
                  </div>

                  {typedLines.map((line, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: i === 0 ? SL.text : SL.dimText,
                      fontWeight: i === 0 ? 600 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.7, marginBottom: 3,
                      display: "flex", gap: 8,
                    }}>
                      <span style={{ color: SL.border + "66", flexShrink: 0 }}>›</span>
                      <span>{line}</span>
                    </div>
                  ))}

                  {/* Cursor */}
                  {!typingDone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ color: SL.border + "66" }}>›</span>
                      <div style={{
                        width: 7, height: 14, background: SL.accent,
                        animation: "cursorBlink 0.7s step-end infinite",
                        boxShadow: `0 0 6px ${SL.accent}88`,
                        borderRadius: 1,
                      }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom border glow */}
            <div style={{
              position: "absolute", bottom: -1, left: "10%", right: "10%", height: 1,
              background: `linear-gradient(90deg, transparent, ${SL.border}44, transparent)`,
              pointerEvents: "none",
            }} />
          </div>
        </div>
      )}

      {/* ═══ CORNER FRAME LINES ═══ */}
      {phase >= 2 && !fading && (
        <>
          <div style={{ position: "absolute", top: 20, left: 20, width: 30, height: 30, borderTop: `1px solid ${SL.border}44`, borderLeft: `1px solid ${SL.border}44`, animation: "fadeIn 0.5s 0.3s both", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 20, right: 20, width: 30, height: 30, borderTop: `1px solid ${SL.border}44`, borderRight: `1px solid ${SL.border}44`, animation: "fadeIn 0.5s 0.3s both", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 60, left: 20, width: 30, height: 30, borderBottom: `1px solid ${SL.border}33`, borderLeft: `1px solid ${SL.border}33`, animation: "fadeIn 0.5s 0.4s both", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 60, right: 20, width: 30, height: 30, borderBottom: `1px solid ${SL.border}33`, borderRight: `1px solid ${SL.border}33`, animation: "fadeIn 0.5s 0.4s both", pointerEvents: "none" }} />
        </>
      )}

      {/* ═══ SKIP HINT ═══ */}
      {!fading && phase >= 2 && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          fontSize: 9, color: "#334155", fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 4, animation: "fadeIn 0.5s 1.5s both",
          pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 20, height: 1, background: "#334155" }} />
          TAP TO SKIP
          <div style={{ width: 20, height: 1, background: "#334155" }} />
        </div>
      )}
    </div>
  );
}

