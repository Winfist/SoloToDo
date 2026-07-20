import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { getDossierSummary } from "../data/hunterDossier.js";

// Schmiede-Ritual (Spec 2026-07-18 §4): Vollbild-Overlay mit ehrlicher
// Schmiede-Phase (Dauer = echter API-Call), Auswahl-Phase (3 Karten, N
// waehlbar) und Annahme. Schliessen verwirft NIE — pending bleibt im State.

const CAT_COLORS = { str: "#ef4444", int: "#3b82f6", vit: "#22c55e", agi: "#f59e0b", cha: "#a855f7" };
const mono = "'JetBrains Mono',monospace";
const sans = "'Outfit',sans-serif";

export default function ForgeRitualModal({
  theme, gameState, pendingSet, generating = false, failed = false,
  selectableCount = 0, canReforge = false,
  onGenerate, onReforge, onAccept, onClose,
}) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const proposals = pendingSet?.proposals || [];
  const maxSelectable = Math.min(selectableCount, proposals.length);
  const phase = generating ? "forging" : failed ? "failed" : proposals.length > 0 ? "choose" : "idle";

  // Sequenz-Zeilen rotieren, solange der echte Call laeuft (kein Fake-Ende).
  useEffect(() => {
    if (phase !== "forging") return undefined;
    setStepIndex(0);
    const timer = setInterval(() => {
      setStepIndex((s) => {
        if (s >= 2) { clearInterval(timer); return s; }
        return s + 1;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [phase]);

  // Hintergrund einfrieren, solange das Ritual offen ist.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Neues Set -> Auswahl zuruecksetzen.
  useEffect(() => { setSelectedIds([]); setExpandedId(null); }, [pendingSet?.generatedAtMs]);

  const dossierLines = useMemo(() => {
    const dossier = getDossierSummary(gameState || {});
    const lines = [];
    if (dossier.bestTime) lines.push(t("forgeRitual.insightBestTime", { bucket: t(`systemAnalysis.bucket_${dossier.bestTime.bucket}`) }));
    if (dossier.reliableCategories[0]) lines.push(t("forgeRitual.insightReliable", { stat: dossier.reliableCategories[0].toUpperCase() }));
    if (dossier.avoidCategories[0]) lines.push(t("forgeRitual.insightAvoided", { stat: dossier.avoidCategories[0].toUpperCase() }));
    return lines.length > 0 ? lines.slice(0, 3) : [t("forgeRitual.insightCalibrating")];
  }, [gameState, t]);

  const toggle = (id) => setSelectedIds((ids) => {
    if (ids.includes(id)) return ids.filter((x) => x !== id);
    if (ids.length >= maxSelectable) return ids;
    return [...ids, id];
  });

  const steps = [t("ai.forge.step1"), t("ai.forge.step2"), t("ai.forge.step3")];

  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,7,15,0.94)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", color: "#e2e8f0", fontFamily: sans, overscrollBehavior: "contain" }}>
      {/* Kopf */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(env(safe-area-inset-top, 0px), 14px) 20px 10px" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#818cf8", fontFamily: mono, fontWeight: 800 }}>{t("forgeRitual.eyebrow")}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{t("forgeRitual.title")}</div>
        </div>
        <button onClick={onClose} className="press-feedback" aria-label={t("forgeRitual.close")}
          style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)", fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 20px" }}>
        {phase === "forging" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 18, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid #6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>⚒</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, letterSpacing: 1 }}>{steps[stepIndex]}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {dossierLines.map((line, i) => (
                <div key={i} style={{ fontSize: 11, color: "#94a3b8" }}>▸ {line}</div>
              ))}
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14, textAlign: "center" }}>
            <div style={{ fontSize: 26 }}>⚠</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", maxWidth: 280, lineHeight: 1.5 }}>{t("ai.forge.failed")}</div>
            <button onClick={onGenerate} className="press-feedback"
              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: 1, fontFamily: mono, cursor: "pointer", background: "linear-gradient(135deg,#6366f133,#6366f11a)", color: "#a5b4fc", border: "1px solid #6366f155" }}>
              {t("forgeRitual.retry")}
            </button>
          </div>
        )}

        {phase === "choose" && (
          <>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
              {maxSelectable > 0
                ? t("forgeRitual.chooseHint", { total: proposals.length, count: maxSelectable })
                : t("forgeRitual.noSlots")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {proposals.map((quest) => {
                const selected = selectedIds.includes(quest.id);
                const expanded = expandedId === quest.id;
                const catColor = CAT_COLORS[quest.category] || "#818cf8";
                return (
                  <div key={quest.id} onClick={() => maxSelectable > 0 && toggle(quest.id)}
                    style={{ padding: "14px 16px", borderRadius: 14, cursor: maxSelectable > 0 ? "pointer" : "default", background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected ? "#6366f1" : "rgba(148,163,184,0.15)"}`, transition: "border-color .15s, background .15s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{quest.title}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, fontFamily: mono, fontWeight: 800, letterSpacing: 1, color: catColor, border: `1px solid ${catColor}55`, borderRadius: 6, padding: "2px 7px" }}>{String(quest.category || "").toUpperCase()}</span>
                          <span style={{ fontSize: 9, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 6, padding: "2px 7px" }}>{String(quest.difficulty || "normal").toUpperCase()}</span>
                          {quest.estimatedMinutes ? (
                            <span style={{ fontSize: 9, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 6, padding: "2px 7px" }}>{t("forgeRitual.minutes", { m: quest.estimatedMinutes })}</span>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${selected ? "#6366f1" : "rgba(148,163,184,0.35)"}`, background: selected ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{selected ? "✓" : ""}</div>
                    </div>
                    {quest.desc || quest.description ? (
                      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>{quest.desc || quest.description}</div>
                    ) : null}
                    {(quest.subQuests || []).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : quest.id); }} className="press-feedback"
                          style={{ fontSize: 10, fontFamily: mono, letterSpacing: 1, color: "#818cf8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          {expanded ? t("forgeRitual.hideSteps") : t("forgeRitual.showSteps", { n: quest.subQuests.length })}
                        </button>
                        {expanded && (
                          <ul style={{ margin: "6px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            {quest.subQuests.map((sq, i) => (
                              <li key={i} style={{ fontSize: 11, color: "#cbd5e1" }}>{sq.title || sq}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Fuss (nur Auswahl-Phase) */}
      {phase === "choose" && (maxSelectable > 0 || canReforge) && (
        <div style={{ padding: "12px 20px calc(max(env(safe-area-inset-bottom, 0px), 12px) + 12px)", borderTop: "1px solid rgba(148,163,184,0.12)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {maxSelectable > 0 && (
              <span style={{ fontSize: 10.5, fontFamily: mono, letterSpacing: 1, color: "#94a3b8" }}>
                {t("forgeRitual.chosen", { k: selectedIds.length, n: maxSelectable })}
              </span>
            )}
            {canReforge && (
              <button onClick={onReforge} className="press-feedback"
                style={{ fontSize: 10.5, fontFamily: mono, letterSpacing: 1, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                ↻ {t("forgeRitual.reforge")}
              </button>
            )}
          </div>
          {maxSelectable > 0 && (
            <button onClick={() => selectedIds.length > 0 && onAccept(selectedIds)} disabled={selectedIds.length === 0} className="press-feedback"
              style={{ padding: "13px 16px", borderRadius: 12, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, fontFamily: mono, cursor: selectedIds.length > 0 ? "pointer" : "default", background: selectedIds.length > 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", color: selectedIds.length > 0 ? "#fff" : "#475569", border: "none" }}>
              {t("forgeRitual.accept")}
            </button>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
