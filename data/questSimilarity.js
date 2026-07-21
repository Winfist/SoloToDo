// questSimilarity.js - deterministic, local-only quest fingerprints.
// Pure by design: no browser APIs, storage, network or mutable module state.

import { getEffectiveQuestDNA, getQuestRecipeKey } from "./questDNA.js";

const CATEGORY_IDS = new Set(["str", "int", "vit", "agi", "cha"]);

const WORD_NUMBERS = new Map(Object.entries({
  zero: "0", null: "0", one: "1", eins: "1", eine: "1", einen: "1",
  two: "2", zwei: "2", three: "3", drei: "3", four: "4", vier: "4",
  five: "5", funf: "5", six: "6", sechs: "6", seven: "7", sieben: "7",
  eight: "8", acht: "8", nine: "9", neun: "9", ten: "10", zehn: "10",
  fifteen: "15", funfzehn: "15", twenty: "20", zwanzig: "20",
  thirty: "30", dreissig: "30", forty: "40", vierzig: "40",
  sixty: "60", sechzig: "60",
}));

const STOP_WORDS = new Set(`
  a an am and auf aus bei bis das dem den der des die dir do du ein eine einem
  einen einer eines for fuer fertig from fur im in into ist it make mit nach of
  on once or the to today und von when wenn with you your zum zur als at deinen
  deine dein einem einer mache mach machen done complete completed quest heute
  sobald mindestens maximal etwa ungefahr ohne sowie danach before
`.trim().split(/\s+/));

const TIME_WORDS = new Set([
  "min", "mins", "minute", "minutes", "minuten", "std", "stunde", "stunden",
  "hour", "hours", "tag", "tage", "day", "days", "mal", "times",
]);

const ACTION_RULES = [
  ["prepare_food", ["koch", "back", "zubereit", "mealprep", "mahlzeit", "rezept"]],
  ["organize", ["organis", "sortier", "ordn", "strukturier", "aufraum"]],
  ["clean", ["putz", "reinig", "wisch", "saug", "declutter", "clean", "tidy"]],
  ["meditate", ["medit", "achtsam", "mindful"]],
  ["breathe", ["atem", "atme", "breath"]],
  ["exercise", ["trainier", "training", "workout", "ubung", "uebung", "exercise", "stretch", "dehn"]],
  ["run", ["lauf", "jogg", "renn", "running", "jog"]],
  ["walk", ["spazier", "geh", "walk", "stroll"]],
  ["cycle", ["radfahr", "fahrrad", "bike", "cycling"]],
  ["read", ["lies", "les", "read"]],
  ["write", ["schreib", "notier", "formulier", "draft", "write", "note"]],
  ["call", ["anruf", "ruf", "telefon", "call"]],
  ["message", ["email", "mail", "nachricht", "send", "sende", "message"]],
  ["learn", ["lern", "ub", "ueb", "practice", "practise", "study", "learn", "wiederhol"]],
  ["research", ["recherch", "such", "finde", "research", "search"]],
  ["plan", ["plan", "prioris", "schedule", "terminier"]],
  ["review", ["pruf", "pruef", "kontroll", "review", "check"]],
  ["create", ["erstell", "bau", "gestalt", "create", "build", "design"]],
  ["contact", ["kontakt", "sprich", "sprech", "frag", "meet", "talk", "ask"]],
  ["buy", ["kauf", "besorg", "bestell", "buy", "order", "shop"]],
  ["repair", ["repar", "fix", "beheb"]],
  ["rest", ["schlaf", "ruhe", "pause", "rest", "sleep"]],
];

const ACTION_STEMS = new Set(ACTION_RULES.flatMap(([, stems]) => stems));

const HARD_ACTION_OBJECT_THRESHOLD = 0.70;
const HARD_TITLE_TRIGRAM_THRESHOLD = 0.86;
const SOFT_TITLE_TRIGRAM_THRESHOLD = 0.76;

function finiteNonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function stableQuestHash(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeQuestText(value) {
  const ascii = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLocaleLowerCase("de-DE")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!ascii) return "";
  return ascii.split(" ").map((token) => WORD_NUMBERS.get(token) || token).join(" ");
}

function tokensFor(value) {
  const normalized = normalizeQuestText(value);
  return normalized ? normalized.split(" ") : [];
}

function matchesStem(token, stem) {
  return token === stem || Boolean(stem.length >= 3 && token?.startsWith(stem));
}

function findActionFamily(quest) {
  const titleTokens = tokensFor(quest?.title);
  const detailTokens = tokensFor(`${quest?.doneWhen || ""} ${quest?.desc || quest?.description || ""}`);
  for (const [family, stems] of ACTION_RULES) {
    if (titleTokens.some((token) => stems.some((stem) => matchesStem(token, stem)))) return family;
  }
  for (const [family, stems] of ACTION_RULES) {
    if (detailTokens.some((token) => stems.some((stem) => matchesStem(token, stem)))) return family;
  }
  return "other";
}

function isActionToken(token) {
  for (const stem of ACTION_STEMS) if (matchesStem(token, stem)) return true;
  return false;
}

function lightStem(token) {
  if (/^\d+$/.test(token) || token.length <= 3) return token;
  const suffixes = ["ungen", "ation", "ieren", "ern", "est", "ing", "en", "er", "es", "e", "s"];
  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) return token.slice(0, -suffix.length);
  }
  return token;
}

function getObjectTokens(quest) {
  const title = tokensFor(quest?.title);
  const fallback = title.length >= 2 ? [] : tokensFor(quest?.doneWhen);
  return [...new Set([...title, ...fallback]
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token))
    .filter((token) => !STOP_WORDS.has(token) && !TIME_WORDS.has(token) && !isActionToken(token))
    .map(lightStem)
    .filter((token) => token.length >= 3))].sort();
}

function minutesFromQuest(quest) {
  const explicit = Number(quest?.estimatedMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const text = normalizeQuestText(`${quest?.title || ""} ${quest?.doneWhen || ""}`);
  const match = text.match(/\b(\d{1,3})\s*(?:min|minuten|minute|minutes)\b/);
  return match ? Math.max(1, Number(match[1])) : null;
}

function durationBand(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "unknown";
  if (minutes <= 15) return "quick";
  if (minutes <= 35) return "standard";
  return "deep";
}

function setJaccard(left, right) {
  const a = left instanceof Set ? left : new Set(left || []);
  const b = right instanceof Set ? right : new Set(right || []);
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function trigrams(value) {
  const compact = normalizeQuestText(value);
  if (!compact) return new Set();
  if (compact.length <= 3) return new Set([compact]);
  const result = new Set();
  for (let index = 0; index <= compact.length - 3; index += 1) result.add(compact.slice(index, index + 3));
  return result;
}

export function createQuestFingerprint(quest = {}) {
  const exactText = normalizeQuestText(quest.title);
  const actionFamily = findActionFamily(quest);
  const objectTokens = getObjectTokens(quest);
  const category = CATEGORY_IDS.has(quest.category) ? quest.category : "unknown";
  const goalKey = normalizeQuestText(quest.goalRef);
  const minutes = minutesFromQuest(quest);
  const band = durationBand(minutes);
  const effectiveDNA = getEffectiveQuestDNA(quest);
  const semanticBasis = [actionFamily, objectTokens.join("."), category, goalKey].join("|");
  const variationBasis = [actionFamily, objectTokens.slice(0, 4).join("."), goalKey].join("|");
  return {
    exactText,
    exactKey: exactText ? `qex_${stableQuestHash(exactText)}` : "",
    semanticKey: exactText ? `qsem_${stableQuestHash(semanticBasis)}` : "",
    // Recipe keys are the canonical, text-free Quest-DNA key. Keeping one
    // taxonomy prevents learning and ranking from silently drifting apart.
    recipeKey: exactText ? (getQuestRecipeKey(quest) || "") : "",
    variationKey: exactText ? `qvar_${stableQuestHash(variationBasis)}` : "",
    actionFamily,
    objectTokens,
    category,
    goalKey,
    estimatedMinutes: minutes,
    durationBand: band,
    questDNA: effectiveDNA?.dna || null,
    dnaSource: effectiveDNA?.source || null,
    dnaConfidence: effectiveDNA?.confidence || null,
  };
}

export function compareQuestSimilarity(leftQuest, rightQuest) {
  const left = leftQuest?.exactKey ? leftQuest : createQuestFingerprint(leftQuest);
  const right = rightQuest?.exactKey ? rightQuest : createQuestFingerprint(rightQuest);
  if (!left.exactText || !right.exactText) return { level: "none", reason: null, similarity: 0 };
  if (left.exactKey === right.exactKey) return { level: "hard", reason: "exact_title", similarity: 1 };

  const leftObjects = new Set(left.objectTokens);
  const rightObjects = new Set(right.objectTokens);
  const objectSimilarity = setJaccard(leftObjects, rightObjects);
  let sharedObjects = 0;
  for (const token of leftObjects) if (rightObjects.has(token)) sharedObjects += 1;
  const titleSimilarity = setJaccard(trigrams(left.exactText), trigrams(right.exactText));
  const sameAction = left.actionFamily !== "other" && left.actionFamily === right.actionFamily;
  const sameCategory = left.category !== "unknown" && left.category === right.category;
  const sameGoal = Boolean(left.goalKey && left.goalKey === right.goalKey);
  const actionObjectSimilarity = sameAction
    ? setJaccard(
      new Set([`action:${left.actionFamily}`, ...left.objectTokens.map((token) => `object:${token}`)]),
      new Set([`action:${right.actionFamily}`, ...right.objectTokens.map((token) => `object:${token}`)]),
    )
    : 0;

  if (left.semanticKey === right.semanticKey && left.objectTokens.length > 0) {
    return { level: "hard", reason: "semantic_key", similarity: Math.max(0.96, titleSimilarity) };
  }
  if (sameCategory && titleSimilarity >= HARD_TITLE_TRIGRAM_THRESHOLD) {
    return { level: "hard", reason: "near_title", similarity: titleSimilarity };
  }
  if (sameAction && sharedObjects >= 1 && actionObjectSimilarity >= HARD_ACTION_OBJECT_THRESHOLD) {
    return { level: "hard", reason: "same_action_object", similarity: actionObjectSimilarity };
  }
  if (titleSimilarity >= SOFT_TITLE_TRIGRAM_THRESHOLD && sameCategory) {
    return { level: "soft", reason: "similar_title", similarity: titleSimilarity };
  }
  if (sameAction && (sharedObjects >= 1 || sameCategory || sameGoal)) {
    return { level: "soft", reason: sharedObjects >= 1 ? "related_action_object" : "same_action_family", similarity: Math.max(titleSimilarity, objectSimilarity, 0.55) };
  }
  return { level: "none", reason: null, similarity: Math.max(titleSimilarity, objectSimilarity, actionObjectSimilarity) };
}

function toTimeMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function entryDateMs(entry) {
  return toTimeMs(entry?.completedAtMs) || toTimeMs(entry?.completedAt)
    || toTimeMs(entry?.date) || toTimeMs(entry?.createdAtMs) || toTimeMs(entry?.createdAt);
}

function entryDayKey(entry, occurredAtMs) {
  for (const value of [entry?.completedAt, entry?.date, entry?.createdAt]) {
    const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  if (!occurredAtMs) return "";
  const date = new Date(occurredAtMs);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function addCorpusEntry(list, seen, source, severity, quest, occurredAtMs = 0) {
  const fingerprint = createQuestFingerprint(quest);
  if (!fingerprint.exactKey) return;
  const key = `${source}|${fingerprint.exactKey}|${fingerprint.category}`;
  if (seen.has(key)) return;
  seen.add(key);
  list.push({ source, severity, quest, fingerprint, occurredAtMs, dayKey: entryDayKey(quest, occurredAtMs) });
}

export function buildQuestExclusionCorpus(state = {}, {
  nowMs = Date.now(), completedWindowDays = 7, negativeWindowDays = 28, maxEntries = 120,
} = {}) {
  const entries = [];
  const seen = new Set();
  for (const quest of Array.isArray(state.quests) ? state.quests : []) {
    if (quest && !quest.completed) addCorpusEntry(entries, seen, "open", "hard", quest, entryDateMs(quest));
  }
  const completedCutoff = finiteNonNegative(nowMs) - Math.max(1, completedWindowDays) * 86400000;
  const recentCompleted = (Array.isArray(state.completedQuests) ? state.completedQuests : [])
    .map((quest) => ({ quest, occurredAtMs: entryDateMs(quest) }))
    .filter((entry) => entry.occurredAtMs > 0 && entry.occurredAtMs >= completedCutoff)
    .sort((left, right) => right.occurredAtMs - left.occurredAtMs
      || normalizeQuestText(left.quest?.title).localeCompare(normalizeQuestText(right.quest?.title)));
  // Dedupe keeps the newest occurrence. This matters for habits completed on
  // both a previous day and today: today's completion must never be hidden by
  // older history merely because storage order differs.
  for (const { quest, occurredAtMs } of recentCompleted) {
    addCorpusEntry(entries, seen, "recent_completed", "soft", quest, occurredAtMs);
  }
  const negativeCutoff = finiteNonNegative(nowMs) - Math.max(1, negativeWindowDays) * 86400000;
  for (const [source, values] of [["recent_disliked", state?.questSignals?.recentDisliked], ["recent_expired", state?.questSignals?.recentExpired]]) {
    const recentValues = (Array.isArray(values) ? values : [])
      .map((value) => ({ value, occurredAtMs: entryDateMs(value) }))
      .filter((entry) => !entry.occurredAtMs || entry.occurredAtMs >= negativeCutoff)
      .sort((left, right) => right.occurredAtMs - left.occurredAtMs
        || normalizeQuestText(left.value?.title).localeCompare(normalizeQuestText(right.value?.title)));
    for (const { value, occurredAtMs } of recentValues) {
      addCorpusEntry(entries, seen, source, "hard", { title: value?.title, category: value?.category, estimatedMinutes: value?.estimatedMinutes }, occurredAtMs);
    }
  }

  return entries.sort((left, right) => {
    const hard = Number(right.severity === "hard") - Number(left.severity === "hard");
    return hard || right.occurredAtMs - left.occurredAtMs || left.source.localeCompare(right.source);
  }).slice(0, Math.max(1, maxEntries));
}

const MATCH_PRIORITY = { none: 0, soft: 1, hard: 2 };

export function matchQuestAgainstCorpus(quest, corpus = []) {
  const fingerprint = quest?.exactKey ? quest : createQuestFingerprint(quest);
  let best = { level: "none", reason: null, similarity: 0, source: null, entry: null };
  for (const entry of Array.isArray(corpus) ? corpus : []) {
    if (!entry?.fingerprint) continue;
    const similarity = compareQuestSimilarity(fingerprint, entry.fingerprint);
    let level = similarity.level;
    if (entry.source === "recent_completed") {
      const nearlyIdentical = similarity.reason === "exact_title"
        || similarity.reason === "near_title"
        || similarity.similarity >= 0.95;
      if (!nearlyIdentical) level = similarity.level === "none" ? "none" : "soft";
    }
    const candidate = { ...similarity, level, source: entry.source, entry };
    const stronger = MATCH_PRIORITY[candidate.level] > MATCH_PRIORITY[best.level]
      || (MATCH_PRIORITY[candidate.level] === MATCH_PRIORITY[best.level] && candidate.similarity > best.similarity);
    if (stronger) best = candidate;
    if (best.level === "hard" && best.similarity === 1) break;
  }
  return best;
}

// Public Forge 3.0 names. The older create/build names stay available for
// callers introduced during the 2.2 transition.
export function getQuestFingerprint(quest, locale = "de") {
  void locale;
  const fingerprint = createQuestFingerprint(quest);
  return {
    ...fingerprint,
    normalizedTitle: fingerprint.exactText,
    actionKind: fingerprint.questDNA?.actionKind || null,
  };
}

export const buildForgeExclusionCorpus = (state = {}, options = {}) =>
  buildQuestExclusionCorpus(state, options);

export const QUEST_SIMILARITY_POLICY = Object.freeze({
  exactTitle: "hard",
  nearTitleThreshold: HARD_TITLE_TRIGRAM_THRESHOLD,
  nearTitleRequiresSameCategory: true,
  hardActionObjectThreshold: HARD_ACTION_OBJECT_THRESHOLD,
  softTitleThreshold: SOFT_TITLE_TRIGRAM_THRESHOLD,
  completedWindowDays: 7,
  completedDefault: "soft",
  completedNearlyIdentical: "hard",
  negativeWindowDays: 28,
});
