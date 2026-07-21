// Quest-DNA v1: kleine, kanonische Merkmale fuer erklaerbares Forge-Lernen.
// Freitext wird niemals Teil eines Rezeptschluessels.

export const QUEST_DNA_VERSION = 1;

export const QUEST_DNA_ACTION_KINDS = Object.freeze([
  "prepare", "practice", "produce", "organize",
  "communicate", "move", "recover", "review",
]);

export const QUEST_DNA_CONTEXT_KINDS = Object.freeze([
  "any", "home", "computer", "phone", "outside", "errand", "social",
]);

export const QUEST_DNA_FOCUS_MODES = Object.freeze(["interruptible", "continuous"]);

export const QUEST_DNA_OUTCOME_KINDS = Object.freeze([
  "artifact", "decision", "message_sent", "scheduled", "environment_changed",
  "practice_block", "movement_block", "recovery_block",
]);

export const QUEST_DNA_REQUIREMENTS = Object.freeze([
  "computer", "phone", "outdoors", "materials", "other_person", "opening_hours",
]);

export const QUEST_DURATION_BANDS = Object.freeze(["quick", "standard", "deep"]);

const ACTIONS = new Set(QUEST_DNA_ACTION_KINDS);
const CONTEXTS = new Set(QUEST_DNA_CONTEXT_KINDS);
const FOCUS_MODES = new Set(QUEST_DNA_FOCUS_MODES);
const OUTCOMES = new Set(QUEST_DNA_OUTCOME_KINDS);
const REQUIREMENTS = new Set(QUEST_DNA_REQUIREMENTS);
const DURATION_BANDS = new Set(QUEST_DURATION_BANDS);

const cleanToken = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00df/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function questSearchText(quest) {
  const subQuestTitles = (Array.isArray(quest?.subQuests) ? quest.subQuests : [])
    .map((item) => typeof item === "string" ? item : item?.title)
    .filter(Boolean);
  const tags = Array.isArray(quest?.tags) ? quest.tags : [];
  return normalizeSearchText([
    quest?.title,
    quest?.description ?? quest?.desc,
    quest?.doneWhen,
    quest?.context,
    ...tags,
    ...subQuestTitles,
  ].filter(Boolean).join(" "));
}

const containsAny = (text, words) => {
  const tokens = String(text || "").split(/\s+/u).filter(Boolean);
  return words.some((word) => tokens.some((token) => token.startsWith(word)));
};

export function normalizeQuestDNA(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const actionKind = cleanToken(value.actionKind);
  const contextKind = cleanToken(value.contextKind);
  const focusMode = cleanToken(value.focusMode);
  const outcomeKind = cleanToken(value.outcomeKind);
  if (!ACTIONS.has(actionKind)
    || !CONTEXTS.has(contextKind)
    || !FOCUS_MODES.has(focusMode)
    || !OUTCOMES.has(outcomeKind)) return null;

  const requirements = [...new Set((Array.isArray(value.requirements) ? value.requirements : [])
    .map(cleanToken)
    .filter((item) => REQUIREMENTS.has(item)))];

  return {
    version: QUEST_DNA_VERSION,
    actionKind,
    contextKind,
    focusMode,
    outcomeKind,
    requirements,
  };
}

export function getQuestDurationBand(questOrMinutes) {
  const raw = typeof questOrMinutes === "number"
    ? questOrMinutes
    : questOrMinutes?.estimatedMinutes;
  const minutes = Number(raw);
  if (Number.isFinite(minutes) && minutes >= 5 && minutes <= 15) return "quick";
  if (Number.isFinite(minutes) && minutes >= 16 && minutes <= 35) return "standard";
  if (Number.isFinite(minutes) && minutes >= 36 && minutes <= 120) return "deep";

  const energy = cleanToken(questOrMinutes?.energy);
  if (energy === "quick") return "quick";
  if (energy === "medium") return "standard";
  if (energy === "deep") return "deep";
  return null;
}

function inferActionKind(text, quest) {
  const rules = [
    ["communicate", ["call", "anruf", "anrufen", "message", "nachricht", "email", "mail", "contact", "kontakt", "reply", "antwort", "speak", "gesprach", "talk"]],
    ["move", ["run", "lauf", "walk", "geh", "spazier", "workout", "training", "trainier", "pushup", "liegestutz", "squat", "kniebeuge", "cycle", "radfahr", "swim", "schwimm"]],
    ["recover", ["recover", "erhol", "rest", "ruhe", "sleep", "schlaf", "meditat", "breath", "atem", "stretch", "dehn", "relax", "entspann"]],
    ["organize", ["organize", "organisier", "sort", "ordne", "clean", "putz", "aufräum", "aufraum", "declutter", "strukturier", "ablage"]],
    ["produce", ["write", "schreib", "create", "erstell", "build", "bau", "implement", "program", "code", "zeich", "cook", "koch", "draft", "entwurf"]],
    ["review", ["review", "pruf", "prüf", "check", "analys", "reflekt", "vergleich", "bewert", "entscheid", "choose", "wahl"]],
    ["practice", ["practice", "ub", "ueb", "lern", "study", "studier", "read", "lies", "wiederhol", "memor"]],
    ["prepare", ["prepare", "vorbereit", "setup", "einricht", "sammel", "pack", "plane", "plan", "schedule", "termin", "book", "buch"]],
  ];
  for (const [kind, words] of rules) if (containsAny(text, words)) return kind;

  return {
    str: "move",
    int: "practice",
    vit: "recover",
    agi: "organize",
    cha: "communicate",
  }[cleanToken(quest?.category)] || null;
}

function inferOutcomeKind(actionKind, text) {
  if (containsAny(text, ["schedule", "scheduled", "termin", "book", "buch", "reservier"])) return "scheduled";
  if (containsAny(text, ["decide", "entscheid", "choose", "wahl", "auswahl"])) return "decision";
  if (actionKind === "communicate") return "message_sent";
  if (actionKind === "organize") return "environment_changed";
  if (actionKind === "move") return "movement_block";
  if (actionKind === "recover") return "recovery_block";
  if (actionKind === "practice" || actionKind === "review") return "practice_block";
  return "artifact";
}

function inferRequirements(text) {
  const requirements = [];
  const add = (requirement, words) => { if (containsAny(text, words)) requirements.push(requirement); };
  add("computer", ["computer", "laptop", "pc", "code", "coding", "program", "spreadsheet", "tabelle", "document", "dokument"]);
  add("phone", ["phone", "smartphone", "handy", "anruf", "call"]);
  add("outdoors", ["outside", "outdoor", "draussen", "draußen", "park", "walk", "spazier", "run", "lauf"]);
  add("materials", ["material", "equipment", "ausrust", "ausrüst", "hantel", "book", "buch", "notebook", "zutaten", "tool", "werkzeug"]);
  add("other_person", ["person", "friend", "freund", "team", "kolleg", "partner", "call", "anruf", "message", "nachricht", "meeting", "gesprach"]);
  add("opening_hours", ["store", "shop", "laden", "bank", "arzt", "doctor", "office", "amt", "apotheke"]);
  return [...new Set(requirements)];
}

function inferContextKind(text, actionKind, requirements) {
  if (requirements.includes("opening_hours")) return "errand";
  if (requirements.includes("other_person") || actionKind === "communicate") return "social";
  if (requirements.includes("outdoors")) return "outside";
  if (requirements.includes("computer")) return "computer";
  if (requirements.includes("phone")) return "phone";
  if (containsAny(text, ["home", "zuhause", "wohnung", "kuch", "küch", "bedroom", "schlafzimmer"])) return "home";
  return "any";
}

export function inferQuestDNA(quest, { locale = "de" } = {}) {
  if (!quest || typeof quest !== "object") return null;
  // locale is deliberately only an input contract. Both supported language
  // vocabularies are accepted so a language switch does not change old DNA.
  void locale;
  const text = questSearchText(quest);
  const actionKind = inferActionKind(text, quest);
  if (!actionKind) return null;
  const requirements = inferRequirements(text);
  const durationBand = getQuestDurationBand(quest);
  const focusMode = durationBand === "deep" || cleanToken(quest.energy) === "deep"
    ? "continuous"
    : "interruptible";
  const dna = normalizeQuestDNA({
    version: QUEST_DNA_VERSION,
    actionKind,
    contextKind: inferContextKind(text, actionKind, requirements),
    focusMode,
    outcomeKind: inferOutcomeKind(actionKind, text),
    requirements,
  });
  return dna ? { dna, source: "inferred", confidence: "medium" } : null;
}

export function getEffectiveQuestDNA(quest, options = {}) {
  const declared = normalizeQuestDNA(quest?.questDNA);
  if (declared) return { dna: declared, source: "declared", confidence: "high" };
  return inferQuestDNA(quest, options);
}

export function getQuestRecipeKey(quest, options = {}) {
  const effective = getEffectiveQuestDNA(quest, options);
  const durationBand = getQuestDurationBand(quest);
  if (!effective || !durationBand) return null;
  return `r1|${effective.dna.actionKind}|${effective.dna.contextKind}|${durationBand}`;
}

export function parseQuestRecipeKey(value) {
  if (typeof value !== "string") return null;
  const [prefix, actionKind, contextKind, durationBand, ...rest] = value.split("|");
  if (rest.length > 0 || prefix !== "r1"
    || !ACTIONS.has(actionKind)
    || !CONTEXTS.has(contextKind)
    || !DURATION_BANDS.has(durationBand)) return null;
  return { version: 1, actionKind, contextKind, durationBand };
}
