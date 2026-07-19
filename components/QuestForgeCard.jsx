import React from "react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { AI_FREE_TRIAL_REQUIREMENTS } from "../data/freeLimits.js";

// Sichtbare Quest-Schmiede: Free zuendet den Tages-Credit bewusst per Knopf,
// Pro nutzt sie on-demand ("Neu schmieden"). Die Sequenz dauert ehrlich so
// lange wie der API-Call — kein Fake-Timer, kein Abbruch-Rennen.
export default function QuestForgeCard({ theme, status, phase, stepIndex, targets, pendingCount = 0, onForge }) {
  const { t } = useI18n();
  const mono = "'JetBrains Mono',monospace";
  const steps = [t("ai.forge.step1"), t("ai.forge.step2"), t("ai.forge.step3")];
  const hasPending = pendingCount > 0;
  const locked = status.reason === "level" || status.reason === "quests";
  const usedToday = status.reason === "daily";
  const noTargets = targets === 0;
  const disabled = phase === "loading" || (!hasPending && (locked || usedToday || noTargets));

  let hint = t("ai.forge.hint");
  if (hasPending) hint = t("ai.forge.ready", { n: pendingCount });
  else if (locked) hint = t("ai.forge.locked", { level: AI_FREE_TRIAL_REQUIREMENTS.minLevel, quests: AI_FREE_TRIAL_REQUIREMENTS.minCompletedQuests });
  else if (usedToday) hint = t("ai.forge.usedToday");
  else if (noTargets) hint = t("ai.forge.allDone");
  if (phase === "failed") hint = t("ai.forge.failed");

  return (
    <section style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(10,12,24,0.6))", border: "1px solid rgba(99,102,241,0.25)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#818cf8", fontFamily: mono, fontWeight: 800 }}>{t("ai.forge.eyebrow")}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", marginTop: 2, fontFamily: "'Outfit',sans-serif" }}>{t("ai.forge.title")}</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3, lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>
            {phase === "loading" ? steps[Math.min(stepIndex, steps.length - 1)] : hint}
          </div>
        </div>
        <button
          onClick={onForge}
          disabled={disabled}
          className="press-feedback"
          style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 10, fontSize: 10, fontWeight: 900, letterSpacing: 1.5, fontFamily: mono, cursor: disabled ? "default" : "pointer", background: disabled ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#6366f133,#6366f11a)", color: disabled ? "#475569" : "#a5b4fc", border: `1px solid ${disabled ? "rgba(148,163,184,0.15)" : "#6366f155"}` }}
        >
          {hasPending ? t("ai.forge.viewCta") : (phase === "loading" ? t("ai.forge.working") : t("ai.forge.cta"))}
        </button>
      </div>
    </section>
  );
}
