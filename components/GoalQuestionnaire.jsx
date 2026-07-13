import React, { useState } from "react";
import { useI18n } from "./i18n/I18nProvider.jsx";

const DOMAIN_LABELS = {
  de: { fitness: "Fitness", knowledge: "Wissen", health: "Gesundheit", career: "Karriere", social: "Soziales", dating: "Dating", finance: "Finanzen", mindset: "Mindset" },
  en: { fitness: "Fitness", knowledge: "Knowledge", health: "Health", career: "Career", social: "Social", dating: "Dating", finance: "Finance", mindset: "Mindset" },
};

// "Ich weiss noch nicht"-Pfad im Ziel-Ritual: 4 gefuehrte Fragen, deren
// Antworten als questionnaire-Objekt an suggestGoals gehen.
export default function GoalQuestionnaire({ lifeDomains = [], loading = false, onSubmit, onBack }) {
  const { t, locale } = useI18n();
  const labels = DOMAIN_LABELS[locale === "en" ? "en" : "de"];
  const [burningDomain, setBurningDomain] = useState(lifeDomains[0] || "");
  const [threeMonthWish, setThreeMonthWish] = useState("");
  const [timeBudget, setTimeBudget] = useState("30");
  const [blocker, setBlocker] = useState("");
  const mono = "'JetBrains Mono',monospace";
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)",
    color: "#f1f5f9", outline: "none", fontFamily: "'Outfit',sans-serif",
  };
  const chipStyle = (active) => ({
    fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 999, cursor: "pointer",
    fontFamily: "'Outfit',sans-serif",
    background: active ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
    color: active ? "#a5b4fc" : "#64748b",
    border: `1px solid ${active ? "#6366f166" : "rgba(148,163,184,0.15)"}`,
  });
  const label = (text) => (
    <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: mono, letterSpacing: 1.5, margin: "14px 0 8px" }}>{text}</div>
  );

  return (
    <div>
      {label(t("quests.goalRitual.questionnaire.q1"))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(lifeDomains.length > 0 ? lifeDomains : Object.keys(labels)).map((domain) => (
          <button key={domain} onClick={() => setBurningDomain(domain)} className="press-feedback" style={chipStyle(burningDomain === domain)}>
            {labels[domain] || domain}
          </button>
        ))}
      </div>
      {label(t("quests.goalRitual.questionnaire.q2"))}
      <input value={threeMonthWish} onChange={(e) => setThreeMonthWish(e.target.value)} placeholder={t("quests.goalRitual.questionnaire.q2Placeholder")} style={inputStyle} maxLength={240} />
      {label(t("quests.goalRitual.questionnaire.q3"))}
      <div style={{ display: "flex", gap: 6 }}>
        {["10", "30", "60"].map((budget) => (
          <button key={budget} onClick={() => setTimeBudget(budget)} className="press-feedback" style={chipStyle(timeBudget === budget)}>
            {t(`quests.goalRitual.questionnaire.q3Options.${budget}`)}
          </button>
        ))}
      </div>
      {label(t("quests.goalRitual.questionnaire.q4"))}
      <input value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder={t("quests.goalRitual.questionnaire.q4Placeholder")} style={inputStyle} maxLength={240} />
      <button
        onClick={() => onSubmit({ burningDomain, threeMonthWish: threeMonthWish.trim(), timeBudget, blocker: blocker.trim() })}
        disabled={loading}
        className="press-feedback"
        style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 12, fontSize: 11, fontWeight: 800, letterSpacing: 2, fontFamily: mono, cursor: loading ? "default" : "pointer", background: "linear-gradient(135deg,#6366f126,#6366f112)", color: "#a5b4fc", border: "1px solid #6366f144" }}
      >
        {loading ? "…" : t("quests.goalRitual.questionnaire.submit")}
      </button>
      <button onClick={onBack} style={{ width: "100%", padding: "10px 0 0", background: "transparent", border: "none", color: "#475569", fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
        {t("quests.goalRitual.questionnaire.back")}
      </button>
    </div>
  );
}
