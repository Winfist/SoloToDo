import React, { useMemo } from "react";
import { DIFF_ICONS, QUEST_ICONS } from "../data/icons.js";
import {
  QUEST_INTENSITY_PRESETS,
  formatQuestIntensityCooldown,
  formatQuestIntensityInterval,
  getEffectiveQuestIntensityPreset,
} from "../data/questIntensity.js";
import { getQuestPlanningSnapshot } from "../data/questPlanning.js";

function isAutoQuest(quest) {
  return !quest.completed
    && (quest.autoAssigned || (quest.isSystem && quest.type === "side" && !quest.isCharismaQuest));
}

function getNextSystemCall(state, preset, enabled) {
  if (!enabled) return "pausiert";
  const lastTime = state.lastSystemTaskTime || 0;
  if (!lastTime) return "bereit beim naechsten Check";
  const remaining = lastTime + preset.intervalHours * 60 * 60 * 1000 - Date.now();
  return formatQuestIntensityCooldown(remaining);
}

// ── Premium Locked Overlay ──────────────────────────────────────
// A gorgeous upsell overlay shown over the intensity control for free users.
// Designed to make the user *feel* what they're missing.
function PremiumLockedOverlay({ theme, onOpenPremium, compact = false, embedded = false }) {
  const accentColor = theme?.primary || "#7c3aed";
  const glowColor = theme?.accent || accentColor;
  const lockSize = compact ? 42 : 52;

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 10,
      borderRadius: "inherit",
      overflow: "hidden",
      cursor: "pointer",
    }} onClick={() => onOpenPremium?.("quest_intensity")}>
      {/* Backdrop blur + dark overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(3,5,15,0.72)",
        backdropFilter: "blur(8px) saturate(0.5)",
        WebkitBackdropFilter: "blur(8px) saturate(0.5)",
      }} />

      {/* Animated scan line */}
      <div style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 80,
        background: `linear-gradient(90deg, transparent, ${accentColor}28, transparent)`,
        animation: "intensityScanLine 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Glow rail */}
      <div style={{
        position: "absolute",
        top: -1,
        right: 14,
        width: 92,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}77, transparent)`,
        boxShadow: `0 0 18px ${accentColor}44`,
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: compact ? "14px 14px" : "18px 16px",
        textAlign: "center",
        gap: compact ? 7 : 10,
      }}>
        {/* Lock icon ring */}
        <div style={{
          width: lockSize,
          height: lockSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}1a, ${accentColor}08)`,
          border: `1.5px solid ${accentColor}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 32px ${accentColor}22, inset 0 0 20px ${accentColor}10`,
          animation: "intensityLockBreath 2.5s ease-in-out infinite",
        }}>
          <svg width={compact ? "18" : "22"} height={compact ? "18" : "22"} viewBox="0 0 24 24" fill="none" stroke={glowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${accentColor}88)` }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div style={{
          fontSize: compact ? 7 : 8,
          letterSpacing: 3,
          color: "#fbbf24",
          fontFamily: "'JetBrains Mono',monospace",
          fontWeight: 900,
          textTransform: "uppercase",
        }}>
          Hunter Pro Feature
        </div>

        {/* Title */}
        <div style={{
          fontSize: compact ? 14 : 15,
          fontWeight: 900,
          color: "#f8fafc",
          fontFamily: "'Cinzel',serif",
          letterSpacing: 0.5,
          lineHeight: 1.2,
          textShadow: `0 0 20px ${accentColor}44`,
        }}>
          Intensität anpassen
        </div>

        {/* Description */}
        <div style={{
          fontSize: compact ? 10 : 11,
          color: "#94a3b8",
          lineHeight: 1.45,
          maxWidth: embedded ? 235 : 260,
        }}>
          Steuere, wie oft dein System dich fordert.
          Von <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Baby Gate</span> bis <span style={{ color: "#ef4444", fontWeight: 700 }}>Monarch Call</span>.
        </div>

        {/* CTA Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenPremium?.("quest_intensity"); }}
          style={{
            marginTop: compact ? 2 : 4,
            padding: compact ? "8px 15px" : "10px 22px",
            borderRadius: 12,
            border: `1px solid ${accentColor}55`,
            background: `linear-gradient(135deg, ${accentColor}28, rgba(168,85,247,0.14))`,
            color: "#fff",
            fontSize: compact ? 9 : 10,
            fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 2,
            cursor: "pointer",
            boxShadow: `0 8px 24px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.12)`,
            transition: "all 0.25s ease",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 12px 32px ${accentColor}33, inset 0 1px 0 rgba(255,255,255,0.18)`;
            e.currentTarget.style.borderColor = accentColor + "88";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.12)`;
            e.currentTarget.style.borderColor = accentColor + "55";
          }}
        >
          {/* Button shine */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 50,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            animation: "intensityScanLine 3.5s ease-in-out infinite",
            pointerEvents: "none",
          }} />
          <span style={{ position: "relative" }}>PRO FREISCHALTEN</span>
        </button>

        {/* Micro-previews of locked presets */}
        <div style={{
          display: embedded ? "none" : "flex",
          gap: 5,
          marginTop: 4,
        }}>
          {QUEST_INTENSITY_PRESETS.map(p => (
            <div key={p.key} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
              opacity: 0.5,
              boxShadow: `0 0 6px ${p.color}66`,
              transition: "opacity 0.3s",
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes intensityScanLine {
          0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateX(800%) skewX(-18deg); opacity: 0; }
        }
        @keyframes intensityLockBreath {
          0%, 100% { transform: scale(1); box-shadow: 0 0 32px ${accentColor}22, inset 0 0 20px ${accentColor}10; }
          50% { transform: scale(1.06); box-shadow: 0 0 40px ${accentColor}33, inset 0 0 24px ${accentColor}18; }
        }
      `}</style>
    </div>
  );
}


export default function QuestIntensityControl({ state, persist, theme, compact = false, surface = "card", premiumStatus, onOpenPremium, lockMode = "full" }) {
  const selected = getEffectiveQuestIntensityPreset(state);
  const isLocked = premiumStatus && !premiumStatus.active;
  const partialLocked = isLocked && lockMode === "partial";
  const enabled = !isLocked && state.settings?.autoSystemTasks === true;
  const overloaded = getQuestPlanningSnapshot(state).overloadStatus.overloaded;
  const activeAutoCount = useMemo(() => (state.quests || []).filter(isAutoQuest).length, [state.quests]);
  const nextCall = getNextSystemCall(state, selected, enabled);
  const embedded = surface === "embedded";

  // Premium gate: free users see a locked overlay

  const saveSettings = (patch) => {
    if (isLocked) return; // Block changes for free users
    persist({
      ...state,
      settings: {
        ...(state.settings || {}),
        ...patch,
      },
    });
  };

  const selectPreset = (preset) => {
    if (isLocked) return;
    saveSettings({ questIntensity: preset.key, autoSystemTasks: true });
  };

  const toggleEnabled = () => {
    if (isLocked) return;
    saveSettings({ autoSystemTasks: !enabled });
  };

  const panelBg = compact
    ? "linear-gradient(135deg, rgba(8,12,24,0.84), rgba(15,23,42,0.58))"
    : "linear-gradient(145deg, rgba(6,10,22,0.95), rgba(15,23,42,0.74))";

  return (
    <div style={{
      position: "relative",
      overflow: "hidden",
      minHeight: isLocked && lockMode === "full" && compact ? (embedded ? 184 : 198) : undefined,
      padding: embedded ? 0 : compact ? 10 : 14,
      borderRadius: embedded ? 0 : compact ? 12 : 16,
      background: embedded ? "transparent" : panelBg,
      border: embedded ? "none" : `1px solid ${enabled ? selected.color + "44" : "rgba(148,163,184,0.12)"}`,
      boxShadow: embedded ? "none" : enabled ? `0 0 24px ${selected.color}18, inset 0 1px 0 rgba(255,255,255,0.06)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Premium locked overlay */}
      {isLocked && lockMode === "full" && <PremiumLockedOverlay theme={theme} onOpenPremium={onOpenPremium} compact={compact} embedded={embedded} />}

      {!embedded && (
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: enabled ? 0.75 : 0.32,
          background: `linear-gradient(115deg, ${selected.color}18, transparent 42%, ${theme.primary}10)`,
        }} />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: compact ? 8 : 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <div style={{
              width: compact ? 34 : 42,
              height: compact ? 34 : 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${selected.color}14`,
              border: `1px solid ${selected.color}32`,
              flexShrink: 0,
            }}>
              <img
                src={DIFF_ICONS[selected.iconKey] || QUEST_ICONS.daily}
                alt=""
                style={{ width: compact ? 20 : 25, height: compact ? 20 : 25, objectFit: "contain", filter: `drop-shadow(0 0 8px ${selected.color}88)` }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 9,
                letterSpacing: 0,
                color: selected.color,
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 900,
              }}>
                SYSTEMRUF INTENSITÄT
              </div>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                minWidth: 0,
                flexWrap: "wrap",
              }}>
                <span style={{
                  fontSize: compact ? 14 : 18,
                  color: "#f8fafc",
                  fontFamily: "'Cinzel',serif",
                  fontWeight: 900,
                  letterSpacing: 0,
                  lineHeight: 1.15,
                }}>{selected.label}</span>
                <span style={{
                  fontSize: 9,
                  color: "#94a3b8",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 800,
                }}>{formatQuestIntensityInterval(selected)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleEnabled}
            aria-pressed={enabled}
            style={{
              minWidth: compact ? 62 : 76,
              height: compact ? 30 : 34,
              borderRadius: 999,
              border: `1px solid ${enabled ? selected.color + "66" : "rgba(148,163,184,0.14)"}`,
              background: enabled ? `${selected.color}18` : "rgba(255,255,255,0.03)",
              color: enabled ? selected.color : "#64748b",
              fontSize: 9,
              fontWeight: 900,
              fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: 0,
              cursor: isLocked ? "default" : "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
              opacity: isLocked ? 0.4 : 1,
            }}
          >
            {enabled ? "AKTIV" : "AUS"}
          </button>
        </div>

        {!compact && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
            gap: 8,
            marginBottom: 12,
          }}>
            {[
              { label: "Nächster Ruf", value: nextCall },
              { label: "Aktive Auto-Quests", value: `${activeAutoCount}/${selected.activeCap}` },
              { label: "Daily Start", value: `${selected.dailyQuestCount} System-${selected.dailyQuestCount === 1 ? "Quest" : "Quests"}` },
            ].map(item => (
              <div key={item.label} style={{
                minHeight: 54,
                padding: "9px 8px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.24)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 800, lineHeight: 1.25 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(5, minmax(42px, 1fr))" : "repeat(auto-fit, minmax(132px, 1fr))",
          gap: compact ? 5 : 8,
        }}>
          {QUEST_INTENSITY_PRESETS.map(preset => {
            const active = preset.key === selected.key;
            return (
              <button
                key={preset.key}
                onClick={() => {
                  if (partialLocked && preset.key !== "baby_gate") {
                    onOpenPremium?.("quest_intensity");
                    return;
                  }
                  selectPreset(preset);
                }}
                aria-pressed={active}
                title={`${preset.label} - ${formatQuestIntensityInterval(preset)}`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: compact ? (embedded ? 42 : 48) : 118,
                  padding: compact ? (embedded ? "6px 4px" : "7px 4px") : 10,
                  borderRadius: compact ? 9 : 12,
                  border: `${embedded ? 1 : 1.5}px solid ${active ? preset.color + (embedded ? "62" : "88") : "rgba(255,255,255,0.07)"}`,
                  background: active ? `${preset.color}${embedded ? "12" : "18"}` : "rgba(255,255,255,0.022)",
                  color: active ? "#fff" : "#94a3b8",
                  cursor: partialLocked && preset.key !== "baby_gate" ? "pointer" : isLocked ? "default" : "pointer",
                  textAlign: compact ? "center" : "left",
                  transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
                  boxShadow: active && !embedded ? `0 0 18px ${preset.color}22` : "none",
                }}
                onMouseEnter={event => {
                  if (isLocked) return;
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.borderColor = preset.color + "66";
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.transform = "none";
                  event.currentTarget.style.borderColor = active ? preset.color + "88" : "rgba(255,255,255,0.07)";
                }}
              >
                <div style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `linear-gradient(135deg, ${preset.color}18, transparent 54%)`,
                  opacity: active ? (embedded ? 0.65 : 1) : (embedded ? 0.18 : 0.35),
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: compact ? "center" : "space-between", gap: 8, marginBottom: compact ? 3 : 8 }}>
                    <img src={DIFF_ICONS[preset.iconKey] || QUEST_ICONS.daily} alt="" style={{ width: compact ? 16 : 20, height: compact ? 16 : 20, objectFit: "contain" }} />
                    {!compact && (
                      <span style={{
                        padding: "3px 6px",
                        borderRadius: 6,
                        background: `${preset.color}12`,
                        color: preset.color,
                        fontSize: 8,
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 900,
                      }}>{preset.rank}</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: compact ? 8 : 12,
                    fontWeight: 900,
                    color: active ? "#f8fafc" : "#cbd5e1",
                    fontFamily: compact ? "'JetBrains Mono',monospace" : "'Cinzel',serif",
                    lineHeight: 1.18,
                    overflowWrap: "anywhere",
                  }}>{compact ? preset.shortLabel : preset.label}</div>
                  {partialLocked && preset.key !== "baby_gate" && (
                    <svg data-pro-lock="true" aria-hidden="true" width={compact ? "9" : "12"} height={compact ? "9" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: compact ? 2 : 6, right: compact ? 2 : 6, zIndex: 2, color: "#c084fc", opacity: 0.82 }}>
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  )}
                  {!compact && (
                    <>
                      <div style={{ fontSize: 9, color: preset.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, marginTop: 6 }}>
                        {formatQuestIntensityInterval(preset)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.35, marginTop: 7 }}>
                        {preset.desc}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {compact && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 8,
            color: "#64748b",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 8,
            fontWeight: 800,
          }}>
            <span>Nächster: {nextCall}</span>
            <span>{activeAutoCount}/{selected.activeCap} aktiv</span>
          </div>
        )}

        {overloaded && (
          <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 10, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.4 }}>
            Gedrosselt: Zu viele offene Quests. Statt neuer Rufe gibt es eine Comeback-Quest.
          </div>
        )}

        {partialLocked && (
          <button onClick={() => onOpenPremium?.("quest_intensity")} style={{ marginTop: 10, width: "100%", padding: "9px", borderRadius: 10, border: `1px solid ${theme.primary}55`, background: `linear-gradient(135deg, ${theme.primary}22, rgba(168,85,247,0.12))`, color: "#fff", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, cursor: "pointer" }}>
            MEHR SYSTEMRUFE → PRO
          </button>
        )}
      </div>
    </div>
  );
}
