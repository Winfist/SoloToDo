import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { getDossierSummary } from "../data/hunterDossier.js";
import { recommendForgeSet } from "../data/forge.js";
import { trackEvent } from "../services/analytics.js";

const CAT_COLORS = { str: "#ef4444", int: "#3b82f6", vit: "#22c55e", agi: "#f59e0b", cha: "#a855f7" };
const FOCUSABLE = "button:not([disabled]),[href],input:not([disabled]),[tabindex]:not([tabindex='-1'])";
const mono = "'JetBrains Mono',monospace";

function reasonText(reason, t) {
  if (!reason) return "";
  const rawParams = reason.params || {};
  const params = rawParams.category
    ? { ...rawParams, category: String(rawParams.category).toUpperCase() }
    : rawParams;
  const keys = {
    active_goal: "reasonGoal",
    quick_win: "reasonQuick",
    reliable_category: "reasonReliable",
    weakest_stat: "reasonWeakest",
  };
  return keys[reason.key] ? t(`forgeRitual.${keys[reason.key]}`, params) : "";
}

function acceptError(reason, t) {
  const keys = {
    capacity_changed: "errorCapacity",
    expired: "errorExpired",
    stale_set: "errorStale",
    empty: "errorEmpty",
    storage_error: "errorStorage",
  };
  return t(`forgeRitual.${keys[reason] || "errorStorage"}`);
}

export default function ForgeRitualModal({
  gameState,
  pendingSet,
  generating = false,
  failed = false,
  selectableCount = 0,
  canReforge = false,
  onGenerate,
  onReforge,
  onAccept,
  onClose,
}) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  const sheetRef = useRef(null);
  const returnFocusRef = useRef(null);
  const sheetOpenerRef = useRef(null);
  const sheetFocusFrameRef = useRef(null);
  const successTimerRef = useRef(null);
  const decisionStartedAtRef = useRef(Date.now());
  const viewedPendingIdRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [adjusting, setAdjusting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [swapCandidateId, setSwapCandidateId] = useState(null);
  const [confirmReforge, setConfirmReforge] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsedS, setElapsedS] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [effectiveSelectableCount, setEffectiveSelectableCount] = useState(selectableCount);

  const restoreSheetFocus = useCallback(() => {
    if (sheetFocusFrameRef.current) cancelAnimationFrame(sheetFocusFrameRef.current);
    sheetFocusFrameRef.current = requestAnimationFrame(() => {
      sheetFocusFrameRef.current = null;
      const opener = sheetOpenerRef.current;
      if (opener?.isConnected && !opener.disabled && opener.offsetParent !== null) {
        opener.focus();
        return;
      }
      dialogRef.current?.querySelector(FOCUSABLE)?.focus();
    });
  }, []);

  const proposals = useMemo(() => pendingSet?.proposals || [], [pendingSet?.proposals]);
  const maxSelectable = Math.max(0, Math.min(Number(effectiveSelectableCount) || 0, proposals.length));
  const recommendation = useMemo(
    () => recommendForgeSet(gameState || {}, proposals, maxSelectable),
    [gameState, proposals, maxSelectable]
  );
  const proposalById = useMemo(
    () => Object.fromEntries(proposals.map((quest) => [quest.id, quest])),
    [proposals]
  );
  const ordered = useMemo(() => {
    const ids = [...(recommendation.orderedIds || []), ...proposals.map((quest) => quest.id)];
    return [...new Set(ids)].map((id) => proposalById[id]).filter(Boolean);
  }, [proposalById, proposals, recommendation.orderedIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const recommendedIds = (recommendation.recommendedIds || []).slice(0, maxSelectable);
  const selectionMatchesRecommendation = selectedIds.length === recommendedIds.length
    && recommendedIds.every((id) => selectedSet.has(id));
  const selectedQuests = selectedIds.map((id) => proposalById[id]).filter(Boolean);
  const selectedMinutes = selectedQuests.reduce((sum, quest) => sum + (Number(quest.estimatedMinutes) || 0), 0);
  const visible = adjusting ? ordered : ordered.filter((quest) => selectedSet.has(quest.id));
  const phase = acceptedCount > 0
    ? "accepted"
    : generating
      ? "forging"
      : proposals.length > 0
        ? "choose"
        : failed
          ? "failed"
          : "idle";

  useEffect(() => {
    if (phase !== "forging") return undefined;
    setStatusIndex(0);
    setElapsedS(0);
    const rotate = setInterval(() => setStatusIndex((index) => (index + 1) % 6), 3000);
    const tick = setInterval(() => setElapsedS((seconds) => seconds + 1), 1000);
    return () => {
      clearInterval(rotate);
      clearInterval(tick);
    };
  }, [phase]);

  useEffect(() => {
    setEffectiveSelectableCount(selectableCount);
  }, [pendingSet?.id, selectableCount]);

  useEffect(() => {
    setActionError("");
  }, [pendingSet?.id, pendingSet?.generatedAtMs]);

  useEffect(() => {
    if (acceptedCount > 0) return;
    setSelectedIds((recommendation.recommendedIds || []).slice(0, maxSelectable));
    setAdjusting(false);
    setExpandedId(null);
    setSwapCandidateId(null);
    setConfirmReforge(false);
    setAcceptedCount(0);
    decisionStartedAtRef.current = Date.now();
  }, [acceptedCount, pendingSet?.id, pendingSet?.generatedAtMs, maxSelectable]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.querySelector(FOCUSABLE)?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(focusFrame);
      if (sheetFocusFrameRef.current) cancelAnimationFrame(sheetFocusFrameRef.current);
      clearTimeout(successTimerRef.current);
      returnFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!swapCandidateId && !confirmReforge) return undefined;
    const frame = requestAnimationFrame(() => sheetRef.current?.querySelector(FOCUSABLE)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [confirmReforge, swapCandidateId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (swapCandidateId) {
          setSwapCandidateId(null);
          restoreSheetFocus();
        } else if (confirmReforge) {
          setConfirmReforge(false);
          restoreSheetFocus();
        } else if (!accepting && acceptedCount === 0) onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusRoot = sheetRef.current || dialogRef.current;
      const items = [...(focusRoot?.querySelectorAll(FOCUSABLE) || [])]
        .filter((element) => element.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!focusRoot?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [acceptedCount, accepting, confirmReforge, onClose, restoreSheetFocus, swapCandidateId]);

  useEffect(() => {
    if (phase !== "choose" || !pendingSet?.id || viewedPendingIdRef.current === pendingSet.id) return;
    viewedPendingIdRef.current = pendingSet.id;
    trackEvent("forge_result_viewed", {
      source: pendingSet.source || "manual",
      proposal_count: proposals.length,
      selectable_count: maxSelectable,
    });
  }, [maxSelectable, pendingSet?.id, pendingSet?.source, phase, proposals.length]);

  const dossierLines = useMemo(() => {
    const dossier = getDossierSummary(gameState || {});
    const lines = [];
    if (dossier.bestTime) lines.push(t("forgeRitual.insightBestTime", { bucket: t(`systemAnalysis.bucket_${dossier.bestTime.bucket}`) }));
    if (dossier.reliableCategories[0]) lines.push(t("forgeRitual.insightReliable", { stat: dossier.reliableCategories[0].toUpperCase() }));
    if (dossier.avoidCategories[0]) lines.push(t("forgeRitual.insightAvoided", { stat: dossier.avoidCategories[0].toUpperCase() }));
    return lines.length ? lines.slice(0, 3) : [t("forgeRitual.insightCalibrating")];
  }, [gameState, t]);

  const openAdjustment = () => {
    setAdjusting(true);
    setActionError("");
    trackEvent("forge_alternatives_opened", {
      selected_count: selectedIds.length,
      alternative_count: Math.max(0, proposals.length - selectedIds.length),
    });
  };

  const chooseQuest = (id) => {
    setActionError("");
    if (selectedSet.has(id)) {
      setSelectedIds((ids) => ids.filter((candidate) => candidate !== id));
      trackEvent("forge_recommendation_changed", {
        previous_rank: (recommendation.orderedIds || []).indexOf(id) + 1,
        next_rank: 0,
      });
      return;
    }
    if (maxSelectable <= 0) return;
    if (selectedIds.length < maxSelectable) {
      setSelectedIds((ids) => [...ids, id]);
      trackEvent("forge_recommendation_changed", {
        previous_rank: 0,
        next_rank: (recommendation.orderedIds || []).indexOf(id) + 1,
      });
      return;
    }
    if (maxSelectable === 1) {
      const previousId = selectedIds[0];
      setSelectedIds([id]);
      setAdjusting(false);
      trackEvent("forge_recommendation_changed", {
        previous_rank: (recommendation.orderedIds || []).indexOf(previousId) + 1,
        next_rank: (recommendation.orderedIds || []).indexOf(id) + 1,
      });
      return;
    }
    sheetOpenerRef.current = document.activeElement;
    setSwapCandidateId(id);
  };

  const replaceSelectedQuest = (replacedId) => {
    const nextId = swapCandidateId;
    setSelectedIds((ids) => ids.map((id) => id === replacedId ? nextId : id));
    setSwapCandidateId(null);
    restoreSheetFocus();
    trackEvent("forge_recommendation_changed", {
      previous_rank: (recommendation.orderedIds || []).indexOf(replacedId) + 1,
      next_rank: (recommendation.orderedIds || []).indexOf(nextId) + 1,
    });
  };

  const handleAccept = async () => {
    if (!selectedIds.length || accepting || acceptedCount) return;
    setAccepting(true);
    setActionError("");
    let result;
    try {
      const pendingResult = onAccept?.({ pendingId: pendingSet?.id, proposalIds: selectedIds });
      result = pendingResult && typeof pendingResult.then === "function"
        ? await pendingResult
        : pendingResult;
    } catch (_) {
      result = { acceptedCount: 0, reason: "storage_error" };
    }
    setAccepting(false);
    if (!result || result.acceptedCount <= 0) {
      setActionError(acceptError(result?.reason, t));
      if (Number.isFinite(result?.selectableCount)) {
        const refreshedCount = Math.max(0, Math.min(proposals.length, Math.floor(result.selectableCount)));
        const refreshed = recommendForgeSet(gameState || {}, proposals, refreshedCount);
        setEffectiveSelectableCount(refreshedCount);
        setSelectedIds((refreshed.recommendedIds || []).slice(0, refreshedCount));
      }
      return;
    }
    const recommended = (recommendation.recommendedIds || []).slice().sort();
    const accepted = selectedIds.slice().sort();
    trackEvent("forge_accepted", {
      selected_count: result.acceptedCount,
      total_minutes: selectedMinutes,
      goal_count: selectedQuests.filter((quest) => Boolean(quest.goalRef)).length,
      recommended_unchanged: Number(recommended.length === accepted.length && recommended.every((id, index) => id === accepted[index])),
      decision_ms: Math.max(0, Date.now() - decisionStartedAtRef.current),
      source: pendingSet?.source || "manual",
    });
    setAcceptedCount(result.acceptedCount);
    try { navigator.vibrate?.(40); } catch (_) { /* optional */ }
    successTimerRef.current = setTimeout(() => onClose?.({ accepted: true, acceptedIds: result.acceptedIds || [] }), 350);
  };

  const handleReforge = () => {
    setConfirmReforge(false);
    restoreSheetFocus();
    trackEvent("forge_reforge", { source: pendingSet?.source || "manual" });
    onReforge?.();
  };

  const renderQuest = (quest) => {
    const selected = selectedSet.has(quest.id);
    const expanded = expandedId === quest.id;
    const primary = selected && selectedIds[0] === quest.id;
    const systemRecommended = (recommendation.recommendedIds || []).includes(quest.id);
    const reason = reasonText(recommendation.reasonsById?.[quest.id], t);
    const catColor = CAT_COLORS[quest.category] || "#818cf8";
    return (
      <article key={quest.id} className={`forge-proposal ${selected ? "is-selected" : ""} ${primary ? "is-primary" : ""}`}>
        <div className="forge-proposal-head">
          <div className="forge-proposal-copy">
            {primary && systemRecommended && !adjusting && <div className="forge-recommendation-label">{t("forgeRitual.systemRecommendation")}</div>}
            <div className="forge-proposal-title">{quest.title}</div>
          </div>
          {adjusting && maxSelectable > 0 && (
            <button type="button" className="forge-select" onClick={() => chooseQuest(quest.id)} aria-pressed={selected}
              aria-label={selected ? t("forgeRitual.removeSelection", { title: quest.title }) : t("forgeRitual.addSelection", { title: quest.title })}>
              <span>{selected ? "✓" : "+"}</span>
            </button>
          )}
        </div>
        {quest.doneWhen && <div className="forge-done-when">{quest.doneWhen}</div>}
        <div className="forge-tags">
          <span style={{ color: catColor, borderColor: `${catColor}55` }}>{String(quest.category || "").toUpperCase()}</span>
          {quest.estimatedMinutes ? <span>{t("forgeRitual.minutes", { m: quest.estimatedMinutes })}</span> : null}
        </div>
        {reason && <div className="forge-reason">✦ {reason}</div>}
        {(quest.desc || quest.description || (quest.subQuests || []).length > 0) && (
          <div className="forge-details">
            <button type="button" onClick={() => setExpandedId(expanded ? null : quest.id)} aria-expanded={expanded}>
              {expanded ? t("forgeRitual.hideDetails") : t("forgeRitual.showDetails")}
            </button>
            {expanded && (
              <div className="forge-details-body">
                {(quest.desc || quest.description) && <p>{quest.desc || quest.description}</p>}
                {(quest.subQuests || []).length > 0 && (
                  <ol>{quest.subQuests.map((step, index) => <li key={step.id || index}>{step.title || step}</li>)}</ol>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return ReactDOM.createPortal(
    <div ref={dialogRef} className="forge-dialog" role="dialog" aria-modal="true" aria-labelledby="forge-title" aria-busy={generating || accepting}>
      <style>{`
        .forge-dialog{position:fixed;inset:0;z-index:1000;background:rgba(5,7,15,.94);backdrop-filter:blur(6px);display:flex;flex-direction:column;color:#e2e8f0;font-family:'Outfit',sans-serif;overscroll-behavior:contain}
        .forge-header{display:flex;align-items:center;justify-content:space-between;padding:max(env(safe-area-inset-top,0px),14px) 20px 10px}.forge-eyebrow{font:800 9px ${mono};letter-spacing:3px;color:#818cf8}.forge-title{font-size:17px;font-weight:800;margin-top:2px}.forge-close{width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,.05);color:#94a3b8;border:1px solid rgba(148,163,184,.2);font-size:18px;cursor:pointer}.forge-close:disabled{opacity:.45;cursor:default}
        .forge-main{flex:1;overflow-y:auto;padding:8px 20px 24px}.forge-center{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:14px;text-align:center}.forge-anvil{width:72px;height:72px;border-radius:50%;border:2px solid #6366f1;display:grid;place-items:center;font-size:28px;animation:forgePulse 2.4s ease-in-out infinite}.forge-status{font:700 13px ${mono};letter-spacing:1px}.forge-muted{font-size:11px;color:#64748b;line-height:1.55}.forge-insights{display:flex;flex-direction:column;gap:6px;color:#94a3b8;font-size:11px}
        .forge-alert{margin-bottom:12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(248,113,113,.35);background:rgba(127,29,29,.18);color:#fca5a5;font-size:11.5px;line-height:1.45}.forge-hint{font-size:11px;color:#94a3b8;margin-bottom:12px;line-height:1.5}.forge-list{display:flex;flex-direction:column;gap:12px}.forge-proposal{padding:13px 14px;border-radius:14px;background:rgba(255,255,255,.03);border:1.5px solid rgba(148,163,184,.15)}.forge-proposal.is-selected{background:rgba(99,102,241,.12);border-color:#6366f1}.forge-proposal.is-primary{padding:16px;box-shadow:0 12px 34px rgba(79,70,229,.13)}.forge-proposal-head{display:flex;align-items:flex-start;gap:10px}.forge-proposal-copy{flex:1;min-width:0}.forge-recommendation-label{font:900 8.5px ${mono};letter-spacing:1.6px;color:#a5b4fc;margin-bottom:5px}.forge-proposal-title{font-size:13.5px;font-weight:800;line-height:1.35}.is-primary .forge-proposal-title{font-size:15px}.forge-select{width:44px;height:44px;margin:-10px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer}.forge-select span{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(148,163,184,.35);display:grid;place-items:center;color:#fff}.forge-select[aria-pressed=true] span{background:#6366f1;border-color:#6366f1}.forge-done-when{margin-top:9px;padding-left:10px;border-left:2px solid rgba(129,140,248,.5);font-size:11.5px;color:#cbd5e1;line-height:1.48}.forge-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.forge-tags span{font:800 9px ${mono};letter-spacing:1px;color:#94a3b8;border:1px solid rgba(148,163,184,.25);border-radius:6px;padding:2px 7px}.forge-reason{margin-top:8px;font-size:10.5px;color:#a5b4fc;line-height:1.4}.forge-details{margin-top:9px}.forge-details>button{min-height:44px;margin:-10px 0;padding:10px 0;font:400 10px ${mono};letter-spacing:1px;color:#818cf8;background:none;border:0;cursor:pointer}.forge-details-body{margin-top:8px;padding-top:9px;border-top:1px solid rgba(148,163,184,.12);font-size:11.5px;color:#94a3b8;line-height:1.5}.forge-details-body p{margin:0}.forge-details-body ol{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:5px;color:#cbd5e1}
        .forge-secondary{width:100%;min-height:44px;margin-top:12px;border-radius:11px;font:400 10.5px ${mono};letter-spacing:1px;color:#a5b4fc;background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.22);cursor:pointer}.forge-reforge{width:100%;min-height:44px;margin-top:12px;font:400 10.5px ${mono};letter-spacing:1px;color:#94a3b8;background:none;border:0;cursor:pointer}.forge-action-error{margin-top:12px;color:#fca5a5;font-size:11.5px;line-height:1.45}.forge-footer{padding:12px 20px calc(max(env(safe-area-inset-bottom,0px),12px) + 12px);border-top:1px solid rgba(148,163,184,.12);background:rgba(5,7,15,.98)}.forge-accept{width:100%;min-height:48px;padding:13px 16px;border-radius:12px;border:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font:900 12px ${mono};letter-spacing:1.2px;cursor:pointer}.forge-accept:disabled{background:rgba(255,255,255,.05);color:#475569;cursor:default}.forge-consequence{margin-top:7px;text-align:center;font-size:10px;color:#64748b;line-height:1.4}.forge-success-icon{width:64px;height:64px;border-radius:50%;background:rgba(74,222,128,.12);border:2px solid #4ade80;display:grid;place-items:center;font-size:26px;color:#4ade80;animation:forgeSuccess .25s ease-out}.forge-sheet-backdrop{position:absolute;inset:0;z-index:2;display:flex;align-items:flex-end;background:rgba(2,4,12,.72)}.forge-sheet{width:100%;padding:18px 20px calc(max(env(safe-area-inset-bottom,0px),12px) + 12px);border-radius:18px 18px 0 0;background:#0d1020;border-top:1px solid rgba(129,140,248,.3)}.forge-sheet h3{font-size:14px;margin:0}.forge-sheet p{font-size:11px;color:#94a3b8;line-height:1.45}.forge-sheet-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}.forge-sheet-list button,.forge-confirm{min-height:44px;padding:10px 12px;border-radius:10px;color:#e2e8f0;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.18);text-align:left;cursor:pointer}.forge-confirm{width:100%;margin-top:14px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;color:#fff;font-weight:800}.forge-cancel{width:100%;min-height:44px;margin-top:6px;background:none;border:0;color:#94a3b8;cursor:pointer}
        @keyframes forgePulse{0%,100%{transform:scale(1);opacity:.72}50%{transform:scale(1.06);opacity:1}}@keyframes forgeSuccess{from{transform:scale(.72);opacity:0}to{transform:scale(1);opacity:1}}@media(prefers-reduced-motion:reduce){.forge-anvil,.forge-success-icon{animation:none!important}.forge-dialog *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>

      <header className="forge-header">
        <div><div className="forge-eyebrow">{t("forgeRitual.eyebrow")}</div><div id="forge-title" className="forge-title" aria-live="polite">{t(`forgeRitual.phase_${phase}`)}</div></div>
        <button type="button" className="forge-close" onClick={() => onClose?.()} disabled={accepting || acceptedCount > 0} aria-label={t("forgeRitual.close")}>✕</button>
      </header>

      <main className="forge-main">
        {phase === "accepted" && <div className="forge-center"><div className="forge-success-icon">✓</div><strong>{t("forgeRitual.accepted", { count: acceptedCount })}</strong><div className="forge-muted">{t("forgeRitual.acceptedSub")}</div></div>}
        {phase === "forging" && <div className="forge-center"><div className="forge-anvil">⚒</div><div className="forge-status">{t(`forgeRitual.status${statusIndex + 1}`)}</div><div className="forge-muted">{Math.floor(elapsedS / 60)}:{String(elapsedS % 60).padStart(2, "0")} · {t("forgeRitual.elapsedHint")}</div><div className="forge-insights">{dossierLines.map((line, index) => <div key={index}>▸ {line}</div>)}</div><div className="forge-muted">{t("forgeRitual.closeHint")}</div></div>}
        {phase === "failed" && <div className="forge-center"><div style={{ fontSize: 26 }}>⚠</div><div className="forge-muted">{t("ai.forge.failed")}</div><button type="button" className="forge-secondary" style={{ width: "auto", padding: "0 18px" }} onClick={onGenerate}>{t("forgeRitual.retry")}</button></div>}
        {phase === "choose" && <>
          {failed && <div className="forge-alert" role="alert">{t("forgeRitual.reforgeFailed")}</div>}
          <div className="forge-hint">{maxSelectable === 0
            ? t("forgeRitual.noSlots")
            : adjusting
              ? t(maxSelectable === 1 ? "forgeRitual.adjustHintOne" : "forgeRitual.adjustHintMany", { count: maxSelectable })
              : t(selectionMatchesRecommendation
                ? (maxSelectable === 1 ? "forgeRitual.recommendedHintOne" : "forgeRitual.recommendedHintMany")
                : (maxSelectable === 1 ? "forgeRitual.selectedHintOne" : "forgeRitual.selectedHintMany"), { count: selectedIds.length })}</div>
          <div className="forge-list">{visible.map(renderQuest)}</div>
          {!adjusting && proposals.length > 0 && <button type="button" className="forge-secondary" onClick={openAdjustment} aria-expanded={adjusting}>{t("forgeRitual.adjustSet", { count: Math.max(0, proposals.length - selectedIds.length) })}</button>}
          {adjusting && canReforge && <button type="button" className="forge-reforge" onClick={() => { sheetOpenerRef.current = document.activeElement; setConfirmReforge(true); }}>↻ {t("forgeRitual.reforge")}</button>}
          {actionError && <div className="forge-action-error" role="alert">{actionError}</div>}
        </>}
      </main>

      {phase === "choose" && maxSelectable > 0 && <footer className="forge-footer">
        <button type="button" className="forge-accept" onClick={handleAccept} disabled={!selectedIds.length || accepting}>{accepting ? t("forgeRitual.accepting") : t(selectedIds.length === 1 ? "forgeRitual.acceptOne" : "forgeRitual.acceptMany", { count: selectedIds.length, minutes: selectedMinutes })}</button>
        <div className="forge-consequence">{t(selectedIds.length === 1 ? "forgeRitual.replacesOne" : "forgeRitual.replacesMany", { count: selectedIds.length })}{selectedIds.length < proposals.length ? ` · ${t("forgeRitual.unselectedDiscarded")}` : ""}</div>
      </footer>}

      {swapCandidateId && <div className="forge-sheet-backdrop" role="dialog" aria-modal="true" aria-label={t("forgeRitual.swapTitle")}><div ref={sheetRef} className="forge-sheet"><h3>{t("forgeRitual.swapTitle")}</h3><p>{t("forgeRitual.swapHint")}</p><div className="forge-sheet-list">{selectedQuests.map((quest) => <button type="button" key={quest.id} onClick={() => replaceSelectedQuest(quest.id)}>{quest.title}</button>)}</div><button type="button" className="forge-cancel" onClick={() => { setSwapCandidateId(null); restoreSheetFocus(); }}>{t("forgeRitual.cancel")}</button></div></div>}
      {confirmReforge && <div className="forge-sheet-backdrop" role="dialog" aria-modal="true" aria-label={t("forgeRitual.reforgeConfirmTitle")}><div ref={sheetRef} className="forge-sheet"><h3>{t("forgeRitual.reforgeConfirmTitle")}</h3><p>{t("forgeRitual.reforgeConfirmHint")}</p><button type="button" className="forge-confirm" onClick={handleReforge}>{t("forgeRitual.reforgeConfirm")}</button><button type="button" className="forge-cancel" onClick={() => { setConfirmReforge(false); restoreSheetFocus(); }}>{t("forgeRitual.cancel")}</button></div></div>}
    </div>,
    document.body
  );
}