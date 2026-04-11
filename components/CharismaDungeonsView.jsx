import React, { useState } from "react";
import { CHARISMA_CHAINS } from "../data/charismaDungeons.js";
import { STAT_ICONS, NAV_ICONS } from "../data/icons.js";

// ═══════════════════════════════════════════════════════════════
// CHARISMA DUNGEONS VIEW — Exposure Therapy Quest Chains
// ═══════════════════════════════════════════════════════════════

export default function CharismaDungeonsView({ state, theme, startCharismaChain, onClose }) {
  const [selectedChain, setSelectedChain] = useState(null);
  const t = theme || { primary: "#22d3ee", card: "rgba(10,10,22,0.88)" };
  const cha = state?.stats?.cha || 0;
  const unlocked = state?.charismaDungeons?.unlockedChains || ["social_exposure"];
  const active = state?.charismaDungeons?.activeChains || {};
  const completed = state?.charismaDungeons?.completedChains || [];

  // Next chain to unlock
  const nextLock = CHARISMA_CHAINS.find(c => !unlocked.includes(c.id) && cha < c.chaThreshold);
  const nextUnlockAt = nextLock?.chaThreshold || null;

  return (
    <div style={{
      minHeight: "100vh", background: "#06060e",
      fontFamily: "'Courier New', monospace", overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(10,10,22,0.95)", borderBottom: "1px solid rgba(168,85,247,0.2)",
        padding: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#a855f7", textTransform: "uppercase", opacity: 0.7 }}>
              SPEZIALISIERTER DUNGEON
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img src={STAT_ICONS.cha} alt="" style={{ width: 28, height: 28, objectFit: "contain", filter: "brightness(1.5)" }} /> CHARISMA DUNGEONS
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            color: "#9ca3af", padding: "0.35rem 0.7rem", borderRadius: "6px",
            cursor: "pointer", fontSize: "0.75rem"
          }}>✕</button>
        </div>

        {/* CHA Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "#a855f7", fontSize: "1.2rem", fontWeight: 900 }}>CHA {cha}</div>
          {nextUnlockAt && (
            <>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, (cha / nextUnlockAt) * 100)}%`,
                  height: "100%", background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: "2px"
                }} />
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", flexShrink: 0 }}>
                {nextLock?.chaThreshold} für {nextLock?.name}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "1rem", maxWidth: "480px", margin: "0 auto" }}>

        {/* Chain Cards */}
        {CHARISMA_CHAINS.map(chain => {
          const isUnlocked = unlocked.includes(chain.id);
          const isActive = !!active[chain.id];
          const isCompleted = completed.includes(chain.id);
          const activeData = active[chain.id];
          const currentStep = activeData?.currentStep || 0;
          const stepPct = isActive ? Math.round((currentStep / chain.steps.length) * 100) : 0;

          return (
            <div key={chain.id} style={{
              background: t.card, borderRadius: "12px",
              border: `1px solid ${isCompleted ? chain.color + "60" : isActive ? chain.color + "40" : isUnlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
              marginBottom: "0.75rem", overflow: "hidden",
              opacity: isUnlocked ? 1 : 0.55, transition: "all 0.2s"
            }}>
              {/* Chain header */}
              <div
                style={{
                  padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem",
                  cursor: isUnlocked ? "pointer" : "default"
                }}
                onClick={() => isUnlocked && setSelectedChain(selectedChain?.id === chain.id ? null : chain)}
              >
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isUnlocked ? chain.color + "20" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${isUnlocked ? chain.color : "rgba(255,255,255,0.1)"}`,
                  fontSize: "1.4rem"
                }}>
                  {isCompleted ? "✅" : !isUnlocked ? "🔒" : chain.iconSrc ? (
                    <img src={chain.iconSrc} alt={chain.name} style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 6px ${chain.color}99) brightness(1.1)` }} />
                  ) : chain.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.9rem" }}>{chain.name}</div>
                    {isCompleted && <span style={{ fontSize: "0.65rem", color: chain.color, background: chain.color + "20", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>BEZWUNGEN</span>}
                    {isActive && <span style={{ fontSize: "0.65rem", color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>AKTIV</span>}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                    {!isUnlocked ? `🔒 CHA ${chain.chaThreshold} erforderlich` : `${chain.steps.length} Etagen · +${chain.reward.chaBonus} CHA`}
                  </div>

                  {/* Progress bar for active chains */}
                  {isActive && (
                    <div style={{ marginTop: "0.4rem" }}>
                      <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${stepPct}%`, height: "100%", background: chain.color, borderRadius: "2px" }} />
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: "0.65rem", marginTop: "0.2rem" }}>
                        Etage {currentStep}/{chain.steps.length}
                      </div>
                    </div>
                  )}
                </div>

                {isUnlocked && !isCompleted && (
                  <div style={{ color: "#6b7280", fontSize: "0.7rem", flexShrink: 0 }}>
                    {selectedChain?.id === chain.id ? "▲" : "▼"}
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {selectedChain?.id === chain.id && isUnlocked && (
                <div style={{ borderTop: `1px solid ${chain.color}20`, padding: "1rem" }}>
                  <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                    {chain.description}
                  </div>

                  {/* Steps list */}
                  {chain.steps.map((step, idx) => {
                    const stepDone = isActive && active[chain.id]?.currentStep > idx;
                    const isCurrent = isActive && active[chain.id]?.currentStep === idx + 1;
                    return (
                      <div key={idx} style={{
                        display: "flex", gap: "0.75rem", marginBottom: "0.5rem",
                        padding: "0.6rem 0.75rem", borderRadius: "8px",
                        background: stepDone ? chain.color + "12" : isCurrent ? "rgba(255,255,255,0.05)" : "transparent",
                        border: `1px solid ${stepDone ? chain.color + "30" : isCurrent ? "rgba(255,255,255,0.1)" : "transparent"}`
                      }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: stepDone ? chain.color + "30" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${stepDone ? chain.color : "rgba(255,255,255,0.1)"}`,
                          fontSize: "0.65rem", color: stepDone ? chain.color : "#6b7280", fontWeight: 700
                        }}>
                          {stepDone ? "✓" : idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            color: stepDone ? "#9ca3af" : isCurrent ? "#e2e8f0" : "#6b7280",
                            fontSize: "0.8rem", fontWeight: isCurrent ? 700 : 400,
                            textDecoration: stepDone ? "line-through" : "none"
                          }}>
                            {step.title}
                          </div>
                          {isCurrent && (
                            <div style={{ color: "#9ca3af", fontSize: "0.7rem", marginTop: "0.15rem" }}>{step.desc}</div>
                          )}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: "0.65rem", flexShrink: 0 }}>
                          ×{step.xpMult.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Reward */}
                  <div style={{
                    marginTop: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "8px",
                    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)"
                  }}>
                    <div style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <img src={NAV_ICONS.achievements} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} /> Belohnung: +{chain.reward.chaBonus} CHA · Titel "{chain.reward.title}"
                    </div>
                  </div>

                  {/* Start button */}
                  {!isActive && !isCompleted && (
                    <button onClick={() => { startCharismaChain(chain.id); setSelectedChain(null); }} style={{
                      width: "100%", marginTop: "0.75rem", padding: "0.75rem",
                      background: chain.color + "20", border: `1px solid ${chain.color}60`,
                      borderRadius: "8px", color: chain.color, cursor: "pointer",
                      fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em"
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><img src={STAT_ICONS.str} alt="" style={{ width: 16, height: 16, objectFit: "contain", filter: "brightness(2)" }} /> DUNGEON BETRETEN</span>
                    </button>
                  )}
                  {isCompleted && (
                    <div style={{ color: chain.color, textAlign: "center", marginTop: "0.75rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      <span style={{ color: "#22c55e", fontSize: "1rem" }}>✓</span> Abgeschlossen · Titel "{chain.reward.title}" erhalten
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
