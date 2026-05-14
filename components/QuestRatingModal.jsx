import React, { useState } from "react";
import { CATEGORIES } from "../data/gameData.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

const diffOptions = [
  { key: "zu_leicht", label: "ZU LEICHT", icon: "▽", color: "#22c55e" },
  { key: "passend",   label: "PASSEND",   icon: "◆", color: "#22d3ee" },
  { key: "zu_schwer", label: "ZU SCHWER", icon: "△", color: "#ef4444" },
];

const durationOptions = [
  { key: "zu_kurz", label: "ZU KURZ", icon: "◁", color: "#f59e0b" },
  { key: "passend", label: "PASSEND", icon: "◆", color: "#22d3ee" },
  { key: "zu_lang", label: "ZU LANG", icon: "▷", color: "#a855f7" },
];

const CornerBracket = ({ pos }) => {
  const styles = {
    tl: { top: -1, left: -1, borderTop: "2px solid", borderLeft: "2px solid", borderRadius: "4px 0 0 0" },
    tr: { top: -1, right: -1, borderTop: "2px solid", borderRight: "2px solid", borderRadius: "0 4px 0 0" },
    bl: { bottom: -1, left: -1, borderBottom: "2px solid", borderLeft: "2px solid", borderRadius: "0 0 0 4px" },
    br: { bottom: -1, right: -1, borderBottom: "2px solid", borderRight: "2px solid", borderRadius: "0 0 4px 0" },
  };
  return (
    <div style={{
      position: "absolute", width: 12, height: 12,
      borderColor: "inherit",
      ...styles[pos],
    }} />
  );
};

export default function QuestRatingModal({ quest, theme, onSubmit, onSkip }) {
  const { t } = useI18n();
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [feltDifficulty, setFeltDifficulty] = useState(null);
  const [durationFeedback, setDurationFeedback] = useState(null);
  const [notes, setNotes] = useState("");
  const [categoryFeedback, setCategoryFeedback] = useState(null);

  const primary = theme?.primary || "#22d3ee";
  const cat = CATEGORIES.find(c => c.key === quest?.category) || CATEGORIES[0];
  const canSubmit = stars > 0;
  const diffLabel = {
    zu_leicht: t("modals.rating.diff.tooEasy"),
    passend: t("modals.rating.diff.fitting"),
    zu_schwer: t("modals.rating.diff.tooHard"),
  };
  const durationLabel = {
    zu_kurz: t("modals.rating.durationOptions.tooShort"),
    passend: t("modals.rating.durationOptions.fitting"),
    zu_lang: t("modals.rating.durationOptions.tooLong"),
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      rating: stars,
      feltDifficulty,
      durationFeedback,
      notes: notes.trim() || null,
      categoryFeedback,
    });
  };

  const sectionLabel = (text) => (
    <div style={{
      fontSize: 9, letterSpacing: 3, color: "#475569",
      fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
      marginBottom: 8, marginTop: 2,
    }}>{text}</div>
  );

  const divider = (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      margin: "12px 0", color: primary + "44",
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
    }}>
      <span style={{ color: primary + "66" }}>◆</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${primary}22, ${primary}08, transparent)` }} />
    </div>
  );

  const toggleBtn = (value, setter, current, color, icon, label) => (
    <button
      key={value}
      onClick={() => setter(current === value ? null : value)}
      style={{
        flex: 1, padding: "6px 4px", borderRadius: 8, cursor: "pointer",
        background: current === value ? color + "22" : "rgba(255,255,255,0.02)",
        border: `1px solid ${current === value ? color + "66" : "rgba(255,255,255,0.07)"}`,
        color: current === value ? color : "#475569",
        fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
        fontWeight: current === value ? 700 : 400,
        letterSpacing: 0.5,
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
      }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{
        position: "relative",
        background: "rgba(2,4,12,0.98)",
        border: `1px solid ${primary}44`,
        borderRadius: 16,
        padding: "24px 24px 20px",
        width: "min(420px, 94vw)",
        maxHeight: "90vh",
        overflowY: "auto",
        animation: "ratingModalIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        boxShadow: `0 0 40px ${primary}18, 0 0 80px rgba(0,0,0,0.6), inset 0 0 60px ${primary}05`,
        borderColor: primary + "44",
      }}>
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, letterSpacing: 3, color: primary + "88",
            marginBottom: 6,
          }}>
            {t("modals.rating.header")}
          </div>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 900,
            color: primary, letterSpacing: 1,
            textShadow: `0 0 20px ${primary}66`,
            marginBottom: 10,
          }}>
            {t("modals.rating.title")}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "#e2e8f0",
            fontFamily: "'Outfit',sans-serif",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8, padding: "8px 12px",
            marginBottom: 2,
          }}>
            {quest?.title || t("modals.rating.unknownQuest")}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
            {cat.iconSrc
              ? <img src={cat.iconSrc} alt={cat.stat} style={{ width: 12, height: 12, objectFit: "contain" }} />
              : <span style={{ fontSize: 11 }}>{cat.icon}</span>
            }
            <span style={{ fontSize: 9, color: cat.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 1 }}>
              {cat.stat}
            </span>
          </div>
        </div>

        {divider}

        {/* Star rating */}
        {sectionLabel(t("modals.rating.combatRating"))}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 4 }}>
          {[1, 2, 3, 4, 5].map(i => {
            const active = i <= (hoverStar || stars);
            return (
              <span
                key={i}
                onClick={() => setStars(i)}
                onMouseEnter={() => setHoverStar(i)}
                onMouseLeave={() => setHoverStar(0)}
                style={{
                  fontSize: 28, cursor: "pointer",
                  color: active ? "#fbbf24" : "#1e293b",
                  textShadow: active ? "0 0 16px #fbbf2499, 0 0 32px #fbbf2444" : "none",
                  transition: "all 0.15s",
                  transform: active ? "scale(1.15)" : "scale(1)",
                  display: "inline-block",
                  userSelect: "none",
                }}
              >★</span>
            );
          })}
        </div>
        {stars > 0 && (
          <div style={{
            textAlign: "center", fontSize: 9,
            fontFamily: "'JetBrains Mono',monospace",
            color: ["", "#ef4444", "#f97316", "#f59e0b", "#22d3ee", "#22c55e"][stars],
            letterSpacing: 2, marginBottom: 2,
          }}>
            {t(`modals.rating.starLabels.${stars}`)}
          </div>
        )}

        {divider}

        {/* Difficulty */}
        {sectionLabel(t("modals.rating.difficulty"))}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {diffOptions.map(o => toggleBtn(o.key, setFeltDifficulty, feltDifficulty, o.color, o.icon, diffLabel[o.key] || o.label))}
        </div>

        {divider}

        {/* Duration */}
        {sectionLabel(t("modals.rating.duration"))}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {durationOptions.map(o => toggleBtn(o.key, setDurationFeedback, durationFeedback, o.color, o.icon, durationLabel[o.key] || o.label))}
        </div>

        {divider}

        {/* Category feedback */}
        {sectionLabel(t("modals.rating.category", { stat: cat.stat }))}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {toggleBtn("passt", setCategoryFeedback, categoryFeedback, "#22c55e", "OK", t("modals.rating.categoryOptions.fits"))}
          {toggleBtn("falsch", setCategoryFeedback, categoryFeedback, "#ef4444", "X", t("modals.rating.categoryOptions.wrong"))}
        </div>

        {divider}

        {/* Notes */}
        {sectionLabel(t("modals.rating.notes"))}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value.slice(0, 150))}
          placeholder={t("modals.rating.notesPlaceholder")}
          rows={2}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${notes ? primary + "33" : "rgba(255,255,255,0.07)"}`,
            color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            resize: "none", outline: "none", lineHeight: 1.5,
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
        <div style={{
          textAlign: "right", fontSize: 8, color: "#334155",
          fontFamily: "'JetBrains Mono',monospace", marginTop: 2, marginBottom: 8,
        }}>
          {notes.length}/150
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: "100%", padding: "11px", borderRadius: 10,
            background: canSubmit
              ? `linear-gradient(135deg, ${primary}28, ${primary}14)`
              : "rgba(255,255,255,0.02)",
            border: `1px solid ${canSubmit ? primary + "66" : "rgba(255,255,255,0.06)"}`,
            color: canSubmit ? primary : "#334155",
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            fontSize: 11, letterSpacing: 2, cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            marginBottom: 8,
            textShadow: canSubmit ? `0 0 12px ${primary}66` : "none",
          }}
        >
          {t("modals.rating.submit")}
        </button>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onSkip}
            style={{
              background: "transparent", border: "none",
              color: "#334155", fontSize: 10,
              fontFamily: "'JetBrains Mono',monospace",
              cursor: "pointer", letterSpacing: 1,
              padding: "4px 8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.target.style.color = "#64748b"}
            onMouseLeave={e => e.target.style.color = "#334155"}
          >
            {t("modals.rating.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
