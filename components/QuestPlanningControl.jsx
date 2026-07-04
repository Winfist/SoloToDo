import React from "react";
import { getQuestPlanningSnapshot, getQuestPlanningState, QUEST_OVERLOAD_PRESETS } from "../data/questPlanning.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

export default function QuestPlanningControl({ state, persist, theme }) {
  const { locale } = useI18n();
  const planning = getQuestPlanningState(state);
  const snapshot = getQuestPlanningSnapshot(state);
  const copy = locale === "en"
    ? { title: "WHEN DOES THE SYSTEM HOLD BACK?", desc: "From this many open quests the System pauses new calls and marks forgotten own quests instead.", open: "actionable Quests", stale: "stale own Quests" }
    : { title: "WANN HÄLT DAS SYSTEM SICH ZURÜCK?", desc: "Ab dieser Menge offener Quests pausiert das System neue Rufe und markiert stattdessen vergessene eigene Quests.", open: "ausführbare Quests", stale: "alte eigene Quests" };

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "rgba(6,10,22,0.76)", border: "1px solid rgba(148,163,184,0.12)" }}>
      <div style={{ color: theme.primary, fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.4 }}>{copy.title}</div>
      <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 5, lineHeight: 1.45 }}>{copy.desc}</div>
      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {Object.values(QUEST_OVERLOAD_PRESETS).map(preset => {
          const active = planning.overloadPreset === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => persist({ ...state, questPlanning: { ...planning, overloadPreset: preset.key } })}
              style={{
                padding: "10px 11px",
                borderRadius: 11,
                border: `1px solid ${active ? theme.primary + "66" : "rgba(148,163,184,0.10)"}`,
                background: active ? `${theme.primary}12` : "rgba(255,255,255,0.02)",
                color: active ? "#e2e8f0" : "#94a3b8",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800 }}>{preset.label}</div>
              <div style={{ marginTop: 3, fontSize: 10, color: "#64748b" }}>
                {preset.warningCount} Hinweis / {preset.overloadCount} Pause / {preset.staleCount} nach {preset.staleDays} Tagen
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, color: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
        {snapshot.overloadStatus.actionableCount} {copy.open} / {snapshot.overloadStatus.staleOwnCount} {copy.stale}
      </div>
    </div>
  );
}
