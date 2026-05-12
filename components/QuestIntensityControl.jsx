import React, { useMemo } from "react";
import { DIFF_ICONS, QUEST_ICONS } from "../data/icons.js";
import {
  QUEST_INTENSITY_PRESETS,
  formatQuestIntensityCooldown,
  formatQuestIntensityInterval,
  getQuestIntensityPreset,
} from "../data/questIntensity.js";

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

export default function QuestIntensityControl({ state, persist, theme, compact = false, surface = "card" }) {
  const selected = getQuestIntensityPreset(state);
  const enabled = state.settings?.autoSystemTasks === true;
  const activeAutoCount = useMemo(() => (state.quests || []).filter(isAutoQuest).length, [state.quests]);
  const nextCall = getNextSystemCall(state, selected, enabled);
  const embedded = surface === "embedded";

  const saveSettings = (patch) => {
    persist({
      ...state,
      settings: {
        ...(state.settings || {}),
        ...patch,
      },
    });
  };

  const selectPreset = (preset) => {
    saveSettings({ questIntensity: preset.key, autoSystemTasks: true });
  };

  const toggleEnabled = () => {
    saveSettings({ autoSystemTasks: !enabled });
  };

  const panelBg = compact
    ? "linear-gradient(135deg, rgba(8,12,24,0.84), rgba(15,23,42,0.58))"
    : "linear-gradient(145deg, rgba(6,10,22,0.95), rgba(15,23,42,0.74))";

  return (
    <div style={{
      position: "relative",
      overflow: "hidden",
      padding: embedded ? 0 : compact ? 10 : 14,
      borderRadius: embedded ? 0 : compact ? 12 : 16,
      background: embedded ? "transparent" : panelBg,
      border: embedded ? "none" : `1px solid ${enabled ? selected.color + "44" : "rgba(148,163,184,0.12)"}`,
      boxShadow: embedded ? "none" : enabled ? `0 0 24px ${selected.color}18, inset 0 1px 0 rgba(255,255,255,0.06)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
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
                SYSTEMRUF INTENSITAET
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
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
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
              { label: "Naechster Ruf", value: nextCall },
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
                onClick={() => selectPreset(preset)}
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
                  cursor: "pointer",
                  textAlign: compact ? "center" : "left",
                  transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
                  boxShadow: active && !embedded ? `0 0 18px ${preset.color}22` : "none",
                }}
                onMouseEnter={event => {
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
            <span>Naechster: {nextCall}</span>
            <span>{activeAutoCount}/{selected.activeCap} aktiv</span>
          </div>
        )}
      </div>
    </div>
  );
}
