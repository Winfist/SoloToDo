import React, { useMemo, useState } from "react";
import { QuestCard } from "../../data/constants.jsx";
import { getQuestPlanningSnapshot, getQuestPlanningState } from "../../data/questPlanning.js";
import { getQuestPresentation } from "../../data/questPresentation.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

const DAY_MS = 86400000;

export default function QuestLogView({
  state,
  theme,
  navigateTo,
  completeQuest,
  completeGoalMilestone,
  completeSubQuest,
  startEditingQuest,
  deleteQuest,
  onOpenDetail,
  togglePinnedQuest,
  deferQuest,
  archiveQuest,
  restoreQuest,
}) {
  const { locale } = useI18n();
  const [tab, setTab] = useState("open");
  const snapshot = useMemo(() => getQuestPlanningSnapshot(state), [state]);
  const planning = getQuestPlanningState(state);
  const copy = locale === "en"
    ? { eyebrow: "QUEST LOG", title: "Your Quest Log", desc: "Decide what deserves attention now and park the rest without losing it.", open: "Open", later: "Later", archive: "Archive", pin: "Pin", unpin: "Unpin", tomorrow: "Tomorrow", now: "Move to open", archiveAction: "Archive", restore: "Restore", empty: "No Quests in this area.", back: "Back to today" }
    : { eyebrow: "QUEST-LOG", title: "Dein Quest-Log", desc: "Entscheide, was jetzt Aufmerksamkeit verdient. Der Rest bleibt erhalten.", open: "Offen", later: "Später", archive: "Archiv", pin: "Anpinnen", unpin: "Pin lösen", tomorrow: "Morgen", now: "Jetzt einplanen", archiveAction: "Archivieren", restore: "Wiederherstellen", empty: "Keine Quests in diesem Bereich.", back: "Zurück zu Heute" };
  const list = tab === "open" ? snapshot.open : tab === "later" ? snapshot.deferred : snapshot.archived;

  return (
    <div style={{ animation: "pageEmerge 0.35s ease" }}>
      <button onClick={() => navigateTo("dashboard")} style={{ border: "none", background: "transparent", color: theme.primary, cursor: "pointer", fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", padding: "0 0 12px" }}>
        {"<"} {copy.back}
      </button>
      <section style={{ padding: "18px 16px", borderRadius: 22, background: "rgba(10,12,22,0.72)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ color: theme.primary, fontSize: 10, fontWeight: 900, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>{copy.eyebrow}</div>
        <h2 style={{ color: "#f8fafc", fontSize: 27, margin: "6px 0 0", fontFamily: "'Outfit',sans-serif" }}>{copy.title}</h2>
        <div style={{ marginTop: 5, color: "#7b8494", fontSize: 13, lineHeight: 1.45 }}>{copy.desc}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 16 }}>
          {[
            ["open", copy.open, snapshot.open.length],
            ["later", copy.later, snapshot.deferred.length],
            ["archive", copy.archive, snapshot.archived.length],
          ].map(([key, label, count]) => (
            <button key={key} onClick={() => setTab(key)} style={{ minHeight: 38, borderRadius: 11, border: `1px solid ${tab === key ? theme.primary + "55" : "rgba(255,255,255,0.07)"}`, background: tab === key ? `${theme.primary}12` : "rgba(255,255,255,0.025)", color: tab === key ? theme.accent : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace" }}>
              {label} {count}
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {list.length === 0 && (
          <div style={{ padding: "30px 16px", borderRadius: 16, textAlign: "center", color: "#64748b", background: "rgba(10,12,22,0.55)", border: "1px dashed rgba(148,163,184,0.16)" }}>{copy.empty}</div>
        )}
        {tab !== "archive" && list.map((quest, index) => {
          const pinned = planning.pinnedQuestIds.includes(quest.id);
          return (
            <div key={quest.id}>
              <QuestCard quest={quest} index={index} theme={theme} onComplete={completeQuest} onMilestoneDone={completeGoalMilestone} onEdit={startEditingQuest} onDelete={deleteQuest} onCompleteSubQuest={completeSubQuest} onOpenDetail={onOpenDetail} onTogglePin={togglePinnedQuest} isPinned={pinned} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "-3px 0 7px 4px" }}>
                <button onClick={() => togglePinnedQuest(quest.id)} style={actionStyle(pinned ? "#fbbf24" : theme.primary)}>{pinned ? copy.unpin : copy.pin}</button>
                {tab === "later"
                  ? <button onClick={() => deferQuest(quest.id, null)} style={actionStyle(theme.primary)}>{copy.now}</button>
                  : <button onClick={() => deferQuest(quest.id, Date.now() + DAY_MS)} style={actionStyle("#94a3b8")}>{copy.tomorrow}</button>}
                <button onClick={() => archiveQuest(quest.id)} style={actionStyle("#f87171")}>{copy.archiveAction}</button>
              </div>
            </div>
          );
        })}
        {tab === "archive" && list.map(quest => {
          const presentation = getQuestPresentation(quest, locale);
          return (
            <div key={quest.id} style={{ padding: 14, borderRadius: 14, background: "rgba(10,12,22,0.66)", border: "1px solid rgba(148,163,184,0.12)" }}>
              <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 800 }}>{presentation.title}</div>
              {presentation.codeName && <div style={{ marginTop: 3, color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>{presentation.codeName.toUpperCase()}</div>}
              <button onClick={() => restoreQuest(quest.id)} style={{ ...actionStyle(theme.primary), marginTop: 10 }}>{copy.restore}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function actionStyle(color) {
  return {
    padding: "6px 9px",
    borderRadius: 8,
    border: `1px solid ${color}33`,
    background: `${color}10`,
    color,
    cursor: "pointer",
    fontSize: 9,
    fontWeight: 800,
    fontFamily: "'JetBrains Mono',monospace",
  };
}
