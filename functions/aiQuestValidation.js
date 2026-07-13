// aiQuestValidation.js - Qualitaetspruefung fuer KI-generierte Quests.
// Noetig, weil Gratis-Modelle unzuverlaessig sind (Sprache, Format).
// Pur & node-testbar: keine Firebase-Abhaengigkeiten.

const GERMAN_HINTS = [" der ", " die ", " das ", " und ", " mit ", " fuer ", " dein", " deine", " du ", " eine", " einen", " im ", " am ", " auf ", " zu ", " nicht ", " oder ", " wenn ", " bis ", " danach", " minuten", " heute", " fertig"];
const ENGLISH_HINTS = [" the ", " your ", " and ", " with ", " for ", " you ", " today", " complete ", " finish ", " weekly ", " daily ", " challenge", " routine"];

function countHits(text, hints) {
  const padded = ` ${String(text || "").toLowerCase()} `;
  return hints.reduce((sum, hint) => sum + (padded.includes(hint) ? 1 : 0), 0);
}

// true, wenn der Text zur angeforderten Sprache passt.
// de: mindestens 1 deutscher Marker UND nicht weniger als englische Marker.
// en: kein Check - englische Ausgabe ist bei allen Modellen zuverlaessig.
function matchesLanguage(text, language) {
  if (language !== "de") return true;
  const de = countHits(text, GERMAN_HINTS);
  const en = countHits(text, ENGLISH_HINTS);
  return de >= 1 && de >= en;
}

function normalizeTitle(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// goalRef nur behalten, wenn er einem aktiven Ziel entspricht - Gratis-Modelle
// halluzinieren sonst Ziel-Badges. Rueckgabe: kanonischer Zieltitel oder null.
function resolveGoalRef(goalRef, activeGoalTitles) {
  const ref = normalizeTitle(goalRef);
  if (!ref) return null;
  const match = (activeGoalTitles || []).find((title) => {
    const t = normalizeTitle(title);
    return t === ref || t.includes(ref) || ref.includes(t);
  });
  return match || null;
}

function countSentences(text) {
  return String(text || "").split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
}

function validateGeneratedQuests(quests, { language = "de", activeGoalTitles = [], minCount = 1 } = {}) {
  const reasons = [];
  if (!Array.isArray(quests) || quests.length === 0) {
    return { ok: false, reasons: ["empty"] };
  }
  // Guard against silent under-delivery: collect too-few-quests in reasons, not early-return
  if (quests.length < minCount) reasons.push("too-few-quests");
  for (const quest of quests) {
    const title = String(quest?.title || "").trim();
    const desc = String(quest?.desc || "").trim();
    const doneWhen = String(quest?.doneWhen || "").trim();
    if (!title) reasons.push("missing-title");
    if (countSentences(desc) < 2) reasons.push("desc-too-short");
    if (!doneWhen) reasons.push("missing-doneWhen");
    if (!Array.isArray(quest?.subQuests) || quest.subQuests.length < 2) reasons.push("missing-subQuests");
    if (!matchesLanguage(`${title} ${desc}`, language)) reasons.push("wrong-language");
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}

module.exports = { validateGeneratedQuests, resolveGoalRef, matchesLanguage };
