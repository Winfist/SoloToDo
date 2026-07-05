import React from "react";
import { HIDDEN_QUESTS, computeHiddenAchievementReward } from "../data/helpers.js";
import { CATEGORIES } from "../data/gameData.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

// „Geheimnisse"-Galerie: eingelöste Hidden-Achievements mit Story-Text,
// unentdeckte als ???-Silhouette mit Kategorie-Hinweis (Trigger bleibt geheim).
export default function HiddenAchievementsGallery({ state }) {
  const { t } = useI18n();
  const completed = new Set(state.hiddenQuests?.completed || []);
  const found = HIDDEN_QUESTS.filter(hq => completed.has(hq.id)).length;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "#e2e8f0", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>{t("quests.hiddenGallery.title")}</h3>
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>{t("quests.hiddenGallery.progress", { found, total: HIDDEN_QUESTS.length })}</span>
      </div>
      <p style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{t("quests.hiddenGallery.subtitle")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {HIDDEN_QUESTS.map(hq => {
          const isFound = completed.has(hq.id);
          const cat = CATEGORIES.find(c => c.key === hq.category);
          const reward = computeHiddenAchievementReward(hq);
          return (
            <div key={hq.id} style={{
              borderRadius: 14, padding: "12px 14px", minHeight: 86,
              background: isFound ? "rgba(99,102,241,0.07)" : "rgba(15,15,30,0.6)",
              border: `1px solid ${isFound ? "#6366f144" : "rgba(100,116,139,0.15)"}`,
            }}>
              {isFound ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#c7d2fe", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>{t(`quests.hidden.${hq.id}.title`)}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, marginBottom: 6 }}>{t(`quests.hidden.${hq.id}.desc`)}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace" }}>+{reward.xp} XP · +{reward.gold} GOLD</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>{t("quests.hiddenGallery.locked")}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{t("quests.hiddenGallery.lockedHint")}</div>
                  {cat && <div style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>{cat.stat}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
