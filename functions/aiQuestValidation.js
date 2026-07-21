// aiQuestValidation.js - Qualitaetspruefung fuer KI-generierte Quests.
// Noetig, weil Gratis-Modelle unzuverlaessig sind (Sprache, Format).
// Pur & node-testbar: keine Firebase-Abhaengigkeiten.

const GERMAN_HINTS = [" der ", " die ", " das ", " und ", " mit ", " fuer ", " dein", " deine", " du ", " eine", " einen", " im ", " am ", " auf ", " zu ", " nicht ", " oder ", " wenn ", " bis ", " danach", " minuten", " heute", " fertig"];
const ENGLISH_HINTS = [" the ", " your ", " and ", " with ", " for ", " you ", " today", " complete ", " finish ", " weekly ", " daily ", " challenge", " routine"];
const GERMAN_WORDS = new Set([
  "du", "dein", "deine", "deinen", "heute", "fertig", "wenn", "danach", "fuer",
  "mit", "und", "eine", "einen", "einem", "drei", "punkte", "schritt", "minuten",
  "erstelle", "schreibe", "bereite", "plane", "uebe", "ube", "organisiere",
  "sortiere", "sende", "rufe", "vereinbare", "buche", "raeume", "raume", "laufe",
  "gehe", "erledige", "pruefe", "prufe", "entscheide", "waehle", "wahle",
  "entwirf", "baue", "koche", "bewege", "dehne", "meditiere", "lies", "lerne",
  "sammle", "packe", "richte", "notiere", "speichere", "vorbereiten", "speichern",
]);
const ENGLISH_WORDS = new Set([
  "you", "your", "today", "done", "when", "then", "for", "with", "and", "the",
  "one", "two", "three", "minutes", "step", "result", "create", "write", "prepare",
  "plan", "practice", "organize", "sort", "send", "call", "schedule", "book",
  "clean", "walk", "run", "complete", "review", "decide", "choose", "draft",
  "build", "cook", "move", "stretch", "meditate", "read", "study", "learn",
  "collect", "pack", "outline", "list", "record", "finish", "update", "reply",
  "contact", "exercise", "train", "make", "clear", "save", "publish", "implement",
  "draw", "design", "research", "compare", "check", "analyze", "analyse",
]);
const PLACEHOLDER_SUBQUEST = /^(schritt|step|teil|part)\s*\d+\.?$/i;
const CATEGORY_IDS = new Set(["str", "int", "vit", "agi", "cha"]);
const DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const SUBJECTIVE_DONE_WHEN = [
  /\b(?:wenn|sobald) du dich (?:besser|gut|zufrieden|glucklich|stolz|bereit|ruhig|entspannt|fokussiert|motiviert|fertig)\b.{0,30}\bf(?:u|ue)hlst\b/,
  /\b(?:wenn|sobald) du (?:damit |wirklich |vollkommen |komplett )?(?:zufrieden|glucklich|stolz|bereit|ruhig|entspannt|fokussiert|motiviert|fertig)\b.{0,8}\bbist\b/,
  /\b(?:wenn|sobald) es sich\b.{0,50}\b(?:gut|richtig|fertig|stimmig|ausreichend)\b.{0,20}\banf(?:u|ue)hlt\b/,
  /\b(?:wenn|sobald) du das gef(?:u|ue)hl hast\b/,
  /\b(?:wenn|sobald) du (?:denkst|glaubst|meinst)\b.{0,60}\b(?:genug|ausreichend|reicht)\b/,
  /\bbis es (?:gut|richtig|fertig|stimmig) (?:aussieht|wirkt|scheint)\b/,
  /\b(?:when|once) you feel (?:better|good|satisfied|happy|proud|ready|calm|relaxed|focused|motivated|refreshed|done)\b/,
  /\b(?:when|once) you are (?:fully |really )?(?:satisfied|happy|proud|ready|calm|relaxed|focused|motivated|done)\b/,
  /\b(?:when|once) it feels (?:good|right|done|complete|finished)\b/,
  /\b(?:when|once) you (?:think|believe)\b.{0,60}\benough\b/,
  /\buntil it (?:looks|feels|seems) (?:good|right|done|complete|finished)\b/,
];

function countHits(text, hints) {
  const padded = ` ${String(text || "").toLowerCase()} `;
  return hints.reduce((sum, hint) => sum + (padded.includes(hint) ? 1 : 0), 0);
}

function countWordHits(text, words) {
  const tokens = normalizeTitle(text).split(" ").filter(Boolean);
  return tokens.reduce((sum, token) => sum + Number(words.has(token)), 0);
}

function getLanguageHits(text) {
  return {
    de: countHits(text, GERMAN_HINTS) + countWordHits(text, GERMAN_WORDS),
    en: countHits(text, ENGLISH_HINTS) + countWordHits(text, ENGLISH_WORDS),
  };
}

// Symmetric, deliberately lightweight language detection. Short neutral labels
// are tolerated by field-level callers, while a complete quest must provide at
// least one positive marker and may not contain stronger opposite evidence.
function matchesLanguage(text, language) {
  const hits = getLanguageHits(text);
  const target = language === "en" ? hits.en : hits.de;
  const opposite = language === "en" ? hits.de : hits.en;
  return target >= 1 && target >= opposite;
}

function hasOppositeLanguageEvidence(text, language) {
  const hits = getLanguageHits(text);
  const target = language === "en" ? hits.en : hits.de;
  const opposite = language === "en" ? hits.de : hits.en;
  return opposite >= 2 && opposite > target;
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00df/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isClearlySubjectiveDoneWhen(value) {
  const normalized = normalizeTitle(value);
  return SUBJECTIVE_DONE_WHEN.some((pattern) => pattern.test(normalized));
}

// goalRef nur behalten, wenn er einem aktiven Ziel entspricht - Gratis-Modelle
// halluzinieren sonst Ziel-Badges. Rueckgabe: kanonischer Zieltitel oder null.
function resolveGoalRef(goalRef, activeGoalTitles) {
  const ref = normalizeTitle(goalRef);
  if (!ref) return null;
  const goals = (Array.isArray(activeGoalTitles) ? activeGoalTitles : [])
    .map((title, index) => ({ title, index, normalized: normalizeTitle(title) }))
    .filter((goal) => goal.normalized);
  const exact = goals.find((goal) => goal.normalized === ref);
  if (exact) return exact.title;

  const contained = goals
    .filter((goal) => ref.includes(goal.normalized))
    .sort((left, right) => right.normalized.length - left.normalized.length || left.index - right.index);
  if (contained.length > 0 && (contained.length === 1 || contained[0].normalized.length > contained[1].normalized.length)) {
    return contained[0].title;
  }

  const containers = goals.filter((goal) => goal.normalized.includes(ref));
  return containers.length === 1 ? containers[0].title : null;
}

function countSentences(text) {
  return String(text || "").split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
}

function validateGeneratedQuests(quests, {
  language = "de",
  activeGoalTitles = [],
  minCount = 1,
  recentDislikedTitles = [],
  recentExpiredTitles = [],
  requiredWeakestStat = null,
} = {}) {
  const reasons = [];
  if (!Array.isArray(quests) || quests.length === 0) {
    return { ok: false, reasons: ["empty"] };
  }
  // Guard against silent under-delivery: collect too-few-quests in reasons, not early-return
  if (quests.length < minCount) reasons.push("too-few-quests");
  const seenTitles = new Set();
  const rejectedTitles = new Set(
    [...(Array.isArray(recentDislikedTitles) ? recentDislikedTitles : []),
      ...(Array.isArray(recentExpiredTitles) ? recentExpiredTitles : [])]
      .map(normalizeTitle)
      .filter(Boolean)
  );
  for (const quest of quests) {
    const title = String(quest?.title || "").trim();
    const desc = String(quest?.desc || "").trim();
    const doneWhen = String(quest?.doneWhen || "").trim();
    const normalizedTitle = normalizeTitle(title);
    const estimatedMinutes = quest?.estimatedMinutes;
    if (!title) reasons.push("missing-title");
    if (!CATEGORY_IDS.has(quest?.category)) reasons.push("invalid-category");
    if (!DIFFICULTIES.has(quest?.difficulty)) reasons.push("invalid-difficulty");
    if (normalizedTitle && seenTitles.has(normalizedTitle)) reasons.push("duplicate-titles");
    if (normalizedTitle) seenTitles.add(normalizedTitle);
    if (normalizedTitle && rejectedTitles.has(normalizedTitle)) reasons.push("repeated-rejected-title");
    if (countSentences(desc) < 2) reasons.push("desc-too-short");
    if (!doneWhen) reasons.push("missing-doneWhen");
    else if (isClearlySubjectiveDoneWhen(doneWhen)) reasons.push("subjective-done-when");
    if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 5 || estimatedMinutes > 120) {
      reasons.push("invalid-estimated-minutes");
    }
    if (!Array.isArray(quest?.subQuests) || quest.subQuests.length < 2) reasons.push("missing-subQuests");
    const subTitles = (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
      .map((sq) => normalizeTitle(typeof sq === "string" ? sq : sq?.title));
    const rawSubTitles = (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
      .map((sq) => String(typeof sq === "string" ? sq : sq?.title || "").trim())
      .filter(Boolean);
    if (subTitles.some((t) => PLACEHOLDER_SUBQUEST.test(t))) {
      reasons.push("placeholder-subquests");
    } else if (subTitles.length >= 2 && new Set(subTitles).size === 1) {
      reasons.push("placeholder-subquests");
    }
    const languageText = [title, desc, doneWhen, rawSubTitles.join(" ")].join(" ");
    if (!matchesLanguage(languageText, language)
      || hasOppositeLanguageEvidence(desc, language)
      || hasOppositeLanguageEvidence(rawSubTitles.join(" "), language)) {
      reasons.push("wrong-language");
    }
  }

  if (minCount >= 3) {
    const hasQuickWin = quests.some((quest) => Number.isInteger(quest?.estimatedMinutes)
      && quest.estimatedMinutes >= 5 && quest.estimatedMinutes <= 15);
    if (!hasQuickWin) reasons.push("missing-quick-win");

    const hasActiveGoals = Array.isArray(activeGoalTitles) && activeGoalTitles.some((title) => normalizeTitle(title));
    if (hasActiveGoals && !quests.some((quest) => resolveGoalRef(quest?.goalRef, activeGoalTitles))) {
      reasons.push("missing-active-goal");
    }

    if (CATEGORY_IDS.has(requiredWeakestStat)
      && !quests.some((quest) => quest?.category === requiredWeakestStat)) {
      reasons.push("missing-weakest-stat");
    }
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}

module.exports = { validateGeneratedQuests, resolveGoalRef, matchesLanguage, hasOppositeLanguageEvidence };
