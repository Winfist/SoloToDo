// Quest-Schmiede 3.0 quality and safety policy.
// Pure/CommonJS on purpose so Cloud Functions and node tests share one contract.

const { validateGeneratedQuests } = require("./aiQuestValidation");
const { sanitizeGeneratedQuestDNA } = require("./aiQuestProfile");

const FORGE_POLICY_VERSION = "forge-3.0";
const FORGE_CANDIDATE_COUNT = 6;
const CATEGORY_IDS = new Set(["str", "int", "vit", "agi", "cha"]);

const normalize = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\u00df/g, "ss")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const sentenceCount = (value) => String(value || "")
  .split(/[.!?]+/)
  .map((part) => part.trim())
  .filter(Boolean).length;

const DONE_PREFIX = {
  de: /^fertig,? wenn\b/i,
  en: /^done,? when\b/i,
};

// A Forge 3 title must name an executable action. Keep this deliberately
// lexical: it rejects labels such as "Weekly overview" without pretending to
// understand user intent, while accepting natural imperative/infinitive forms.
const TITLE_ACTION = {
  de: /\b(?:erstell(?:e|en)|schreib(?:e|en)|bereit(?:e|en)|plan(?:e|en)|ueb(?:e|en)|organisier(?:e|en)|sortier(?:e|en)|send(?:e|en)|ruf(?:e|en)|vereinbar(?:e|en)|buch(?:e|en)|raeum(?:e|en)|lauf(?:e|en)|geh(?:e|en)|erledig(?:e|en)|pruef(?:e|en)|entscheid(?:e|en)|waehl(?:e|en)|entwirf|entwerfen|bau(?:e|en)|koch(?:e|en)|beweg(?:e|en)|dehn(?:e|en)|meditier(?:e|en)|lies|lesen|lern(?:e|en)|samm(?:le|eln)|pack(?:e|en)|richt(?:e|en)|notier(?:e|en)|list(?:e|en)|zeichn(?:e|en)|schliess(?:e|en)|aktualisier(?:e|en)|antwort(?:e|en)|kontaktier(?:e|en)|trainier(?:e|en)|mach(?:e|en)|speicher(?:e|n)|veroeffentlich(?:e|en)|implementier(?:e|en)|programmier(?:e|en)|analysier(?:e|en)|vergleich(?:e|en)|klaer(?:e|en)|ordn(?:e|en)|putz(?:e|en)|bearbeit(?:e|en)|fotografier(?:e|en)|kauf(?:e|en)?|brich|brech(?:e|en)|erhoeh(?:e|en)|oeffn(?:e|en))\b/i,
  en: /\b(?:create|write|prepare|plan|practice|organize|sort|send|call|schedule|book|clean|walk|run|complete|review|decide|choose|draft|build|cook|move|stretch|meditate|read|study|learn|collect|pack|set up|outline|list|record|finish|update|reply|contact|exercise|train|do|make|clear|save|publish|implement|code|draw|design|research|compare|check|analy[sz]e|file|declutter|rehearse|repeat|take|put|photograph|sketch)(?:s|ed|ing)?\b/i,
};

const OBJECTIVE_EVIDENCE = /\b(?:\d+|ein(?:e|en|er|es)?|zwei|drei|vier|funf|fuenf|sechs|sieben|acht|neun|zehn|minute(?:n)?|stunde(?:n)?|mal|punkt(?:e|en)?|seite(?:n)?|satz|satze|saetze|liste|entwurf|notiz(?:en)?|dokument|datei|foto|termin|anfrage|nachricht|email|gespeichert|versendet|eingetragen|gebucht|erstellt|notiert|vorbereitet|aufgeraumt|aufgeraeumt|one|two|three|four|five|six|seven|eight|nine|ten|minute(?:s)?|hour(?:s)?|times?|points?|pages?|sentences?|list|draft|note(?:s)?|document|file|photo|appointment|request|message|email|saved|sent|entered|booked|created|written|prepared|cleared)\b/i;

const EXTERNAL_DEPENDENCY = [
  /\b(?:wenn|sobald)\b.{0,60}\b(?:geantwortet|antwortet|antwort erhalten|rueckmeldung|zusage|genehmigt|akzeptiert|angenommen|bestatigt|bestaetigt|bezahlt)\b/i,
  /\b(?:when|once)\b.{0,60}\b(?:replied|repl(?:y|ies)|responds?|response|approved|accepted|hired|confirmed|payment received)\b/i,
  /\b(?:\d+|ein(?:e|en)?|zwei|drei|vier|funf|fuenf|one|two|three|four|five)\s+(?:likes?|aufrufe?|views?|downloads?|follower|abonnenten?|bestellungen?|orders?|reaktionen?|reactions?)\b/i,
  /\b(?:likes?|aufrufe?|views?|downloads?|follower|abonnenten?|bestellungen?|orders?|reaktionen?|reactions?)\b.{0,50}\b(?:erhalt|eingegang|erreich|bekomm|erziel|received?|arriv|reach|gain|earn|achiev)[a-z]*\b/i,
  /\b(?:erhalt|eingegang|erreich|bekomm|erziel|receive|arrive|reach|gain|earn|achieve)[a-z]*\b.{0,50}\b(?:likes?|aufrufe?|views?|downloads?|follower|abonnenten?|bestellungen?|orders?|reaktionen?|reactions?)\b/i,
];

const META_OR_SHAME = /\b(?:nexus|vanguard|hunter|xp|daily quest|system quest|this quest|diese quest|versager|nutzlos|wertlos|schwachling|bestraf(?:e|ung)|demuetig|bescham|beschaem|failure|loser|worthless|weakling|punish(?:ment)?|humiliat|sham(?:e|ing))\b/i;

const HIGH_RISK = [
  /\b(?:selbstverletz[a-z]*|suizid[a-z]*|umbringen|self[- ]?harm|suicide|kill yourself)\b/i,
  /\b(?:medikament[a-z]*|tablett[a-z]*|dosis|dosierung[a-z]*|insulin|antidepressiv[a-z]*|medication|pill|dosage|dose)\b.{0,50}\b(?:erhoh|erhoeh|senk|ander|aender|absetz|nehm|verdoppel|increase|decrease|change|stop|take|double)[a-z]*\b/i,
  /\b(?:erhoh|erhoeh|senk|ander|aender|setz|nimm|nehm|verdoppel|halbier|increase|decrease|change|stop|take|double|halve)[a-z]*\b.{0,50}\b(?:medikament[a-z]*|tablett[a-z]*|dosis|dosierung[a-z]*|insulin|antidepressiv[a-z]*|medication|pill|dosage|dose)\b/i,
  /\b(?:kauf|verkauf|investier|trade|buy|sell|invest)[a-z]*\b.{0,40}\b(?:aktie[a-z]*|krypto[a-z]*|bitcoin|option[a-z]*|stock|crypto|security|options?)\b/i,
  /\b(?:aktie[a-z]*|krypto[a-z]*|bitcoin|option[a-z]*|stock|crypto|security|options?)\b.{0,40}\b(?:kauf|verkauf|investier|trade|buy|sell|invest)[a-z]*\b/i,
  /\b(?:therapie[a-z]*|behandlung[a-z]*|therapy|treatment)\b.{0,50}\b(?:abbrech|absetz|auslass|ander|aender|stop|skip|change|replace)[a-z]*\b/i,
  /\b(?:brich|beende|abbrech|absetz|auslass|ander|aender|stop|skip|change|replace)[a-z]*\b.{0,50}\b(?:therapie[a-z]*|behandlung[a-z]*|therapy|treatment)\b/i,
  /\b(?:trotz schmerzen|bis zum umfallen|ohne wasser train|maximalgewicht allein|train through pain|until (?:you )?collapse|exercise without water|maximum weight alone)\b/i,
  /\b(?:schlafentzug|nicht schlafen|bleib.{0,30}nacht.{0,20}wach|ganze nacht wach|sleep deprivation|stay awake all night)\b/i,
  /\b(?:extrem(?:es|en)? fasten|fast(?:e|en)? \d{2,}|fast for \d{2,}|eisbaden \d{2,}|ice bath for \d{2,})\b/i,
  /\b(?:bedroh|beleidig|manipulier|erpress|threaten|insult|manipulate|blackmail)[a-z]*\b/i,
];

const TRIVIAL_QUICK_WIN = [
  /^fertig,? wenn (?:du )?(?:die |eine )?(?:app|datei|seite|liste|aufgabe) (?:geoffnet|geoeffnet|angesehen)(?: hast| wurde)?\.?$/i,
  /^done,? when (?:you )?(?:have )?(?:opened|viewed) (?:the |a )?(?:app|file|page|list|task)(?: is opened)?\.?$/i,
  /^fertig,? wenn du (?:kurz )?(?:daruber|darueber) nachgedacht hast\.?$/i,
  /^done,? when you (?:have )?thought about it\.?$/i,
];

const PASSIVE_QUICK_WIN = /\b(?:geoeffnet|angesehen|gelesen|nachgedacht|vorgenommen|opened|viewed|read|reading|thought|reflected|intended)\b/i;
const MEANINGFUL_QUICK_OUTCOME = /\b(?:notiert|aufgeschrieben|gespeichert|erstellt|geschrieben|markiert|versendet|gesendet|veroeffentlicht|eingetragen|gebucht|vorbereitet|sortiert|aufgeraeumt|entschieden|ausgewaehlt|gewaehlt|geuebt|trainiert|gelaufen|gegangen|bewegt|gedehnt|ausgefuehrt|durchgefuehrt|gemacht|gekocht|gebaut|fotografiert|gezeichnet|saved|created|written|recorded|listed|outlined|marked|sent|published|scheduled|booked|prepared|sorted|organized|organised|cleared|decided|chosen|selected|practiced|practised|trained|walked|ran|moved|stretched|performed|executed|cooked|built|photographed|drawn|designed|implemented|filed|cleaned)\b/i;

const TIME_MINUTES = /\b(\d{1,3})\s*(?:min(?:ute)?n?|minutes?)\b/gi;
const TIME_HOURS = /\b(\d{1,2})(?:[.,](\d))?\s*(?:stunde(?:n)?|hours?|hrs?)\b/gi;
const TIME_HOUR_WORDS = /\b(ein(?:e|en|er|es)?|zwei|one|two)\s*(?:stunde(?:n)?|hours?|hrs?)\b/gi;

function getExplicitMinutes(quest) {
  const text = [quest?.title, quest?.desc, quest?.doneWhen]
    .concat((quest?.subQuests || []).map((item) => item?.title || item))
    .join(" ");
  const values = [];
  for (const match of text.matchAll(TIME_MINUTES)) values.push(Number(match[1]));
  for (const match of text.matchAll(TIME_HOURS)) values.push((Number(match[1]) + (Number(match[2]) || 0) / 10) * 60);
  for (const match of text.matchAll(TIME_HOUR_WORDS)) {
    const word = String(match[1] || "").toLowerCase();
    values.push((word.startsWith("ein") || word === "one" ? 1 : 2) * 60);
  }
  return values.filter(Number.isFinite);
}

function exactGoalTitle(goalRef, activeGoalTitles) {
  const ref = normalize(goalRef);
  if (!ref) return null;
  const matches = (Array.isArray(activeGoalTitles) ? activeGoalTitles : [])
    .filter((title) => normalize(title) === ref);
  return matches.length === 1 ? matches[0] : null;
}

function validateForgeCandidate(quest, options = {}) {
  const language = options.language === "en" ? "en" : "de";
  const reasons = new Set(validateGeneratedQuests([quest], {
    language,
    activeGoalTitles: options.activeGoalTitles || [],
    recentDislikedTitles: options.recentDislikedTitles || [],
    recentExpiredTitles: options.recentExpiredTitles || [],
  }).reasons);
  const desc = String(quest?.desc || "").trim();
  const doneWhen = String(quest?.doneWhen || "").trim();
  const title = String(quest?.title || "").trim();
  const combined = [quest?.title, desc, doneWhen]
    .concat((quest?.subQuests || []).map((item) => item?.title || item))
    .join(" ");

  const titleLength = [...title].length;
  if (titleLength < 4 || titleLength > 120) reasons.add("invalid-title-length");
  if (!TITLE_ACTION[language].test(normalize(title))) reasons.add("missing-title-action");

  const descSentences = sentenceCount(desc);
  if (descSentences < 2 || descSentences > 4) reasons.add("invalid-desc-sentences");
  if (sentenceCount(doneWhen) !== 1) reasons.add("invalid-done-when-sentences");
  if (!DONE_PREFIX[language].test(doneWhen)) reasons.add("invalid-done-when-prefix");
  if (!OBJECTIVE_EVIDENCE.test(normalize(doneWhen))) reasons.add("missing-objective-evidence");
  if (EXTERNAL_DEPENDENCY.some((pattern) => pattern.test(normalize(doneWhen)))) {
    reasons.add("external-dependency");
  }
  if (META_OR_SHAME.test(normalize(combined))) reasons.add("unsafe-tone-or-meta");
  if (HIGH_RISK.some((pattern) => pattern.test(normalize(combined)))) reasons.add("unsafe-content");

  const subQuests = Array.isArray(quest?.subQuests) ? quest.subQuests : [];
  if (subQuests.length < 2 || subQuests.length > 4) reasons.add("invalid-subquest-count");
  const normalizedSteps = subQuests.map((item) => normalize(item?.title || item)).filter(Boolean);
  if (normalizedSteps.length !== subQuests.length || new Set(normalizedSteps).size !== normalizedSteps.length) {
    reasons.add("invalid-subquests");
  }

  const explicitMinutes = getExplicitMinutes(quest);
  const estimate = Number(quest?.estimatedMinutes);
  if (!sanitizeGeneratedQuestDNA(quest?.questDNA)) reasons.add("invalid-quest-dna");
  if (explicitMinutes.length > 0 && Number.isFinite(estimate) && Math.max(...explicitMinutes) > estimate) {
    reasons.add("duration-mismatch");
  }
  if (estimate >= 5 && estimate <= 15) {
    const normalizedDoneWhen = normalize(doneWhen);
    if (TRIVIAL_QUICK_WIN.some((pattern) => pattern.test(doneWhen))
      || (PASSIVE_QUICK_WIN.test(normalizedDoneWhen) && !MEANINGFUL_QUICK_OUTCOME.test(normalizedDoneWhen))) {
      reasons.add("trivial-quick-win");
    }
  }

  const goalRef = String(quest?.goalRef || "").trim();
  const canonicalGoal = exactGoalTitle(goalRef, options.activeGoalTitles || []);
  if (goalRef && !canonicalGoal) reasons.add("invalid-goal-ref");
  if (canonicalGoal && !normalize(desc).includes(normalize(canonicalGoal))) {
    reasons.add("unsubstantiated-goal-ref");
  }

  return {
    ok: reasons.size === 0,
    reasons: [...reasons],
    canonicalGoal,
  };
}

function validateLegacyForgeCandidate(quest, options = {}) {
  const language = options.language === "en" ? "en" : "de";
  const reasons = new Set(validateGeneratedQuests([quest], {
    language,
    activeGoalTitles: options.activeGoalTitles || [],
    recentDislikedTitles: options.recentDislikedTitles || [],
    recentExpiredTitles: options.recentExpiredTitles || [],
  }).reasons);
  const combined = [quest?.title, quest?.desc, quest?.doneWhen]
    .concat((quest?.subQuests || []).map((item) => item?.title || item))
    .join(" ");
  if (META_OR_SHAME.test(normalize(combined))) reasons.add("unsafe-tone-or-meta");
  if (HIGH_RISK.some((pattern) => pattern.test(normalize(combined)))) reasons.add("unsafe-content");
  return {
    ok: reasons.size === 0,
    reasons: [...reasons],
    canonicalGoal: exactGoalTitle(quest?.goalRef, options.activeGoalTitles || []),
  };
}
function contentTokens(quest) {
  const stop = new Set(["der", "die", "das", "den", "dem", "ein", "eine", "und", "mit", "fur", "fuer", "your", "the", "and", "with", "for", "when", "done", "fertig", "wenn"]);
  return new Set(normalize(`${quest?.title || ""} ${quest?.doneWhen || ""}`)
    .split(" ")
    .filter((token) => token.length > 2 && !stop.has(token)));
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap / (left.size + right.size - overlap);
}
function areNearDuplicateForgeQuests(left, right) {
  return jaccard(contentTokens(left), contentTokens(right)) >= 0.82;
}


function validateForgeBatch(quests, options = {}) {
  const reasons = new Set();
  const expectedCount = Math.max(1, Math.min(FORGE_CANDIDATE_COUNT,
    Math.round(Number(options.expectedCount) || FORGE_CANDIDATE_COUNT)));
  if (!Array.isArray(quests) || quests.length !== expectedCount) {
    return { ok: false, reasons: ["candidate-count"] };
  }

  const candidateVerdicts = quests.map((quest) => validateForgeCandidate(quest, options));
  candidateVerdicts.forEach((verdict) => verdict.reasons.forEach((reason) => reasons.add(reason)));

  const titles = new Set();
  quests.forEach((quest) => {
    const title = normalize(quest?.title);
    if (titles.has(title)) reasons.add("duplicate-titles");
    titles.add(title);
  });
  const tokens = quests.map(contentTokens);
  for (let left = 0; left < tokens.length; left += 1) {
    for (let right = left + 1; right < tokens.length; right += 1) {
      if (areNearDuplicateForgeQuests(quests[left], quests[right])) {
        reasons.add("near-duplicate-quests");
      }
    }
  }

  const quickWins = quests.filter((quest) => Number(quest?.estimatedMinutes) >= 5 && Number(quest?.estimatedMinutes) <= 15);
  if (quickWins.length === 0) reasons.add("missing-quick-win");
  const feasibleTarget = Math.min(2, expectedCount);
  if (quests.filter((quest) => Number(quest?.estimatedMinutes) <= 35).length < feasibleTarget) {
    reasons.add("missing-feasible-pair");
  }
  const activeGoals = Array.isArray(options.activeGoalTitles) ? options.activeGoalTitles.filter(Boolean) : [];
  if (activeGoals.length > 0 && !candidateVerdicts.some((verdict) => verdict.canonicalGoal)) {
    reasons.add("missing-active-goal");
  }
  if (!quests.every((quest) => CATEGORY_IDS.has(quest?.category))) reasons.add("invalid-category");

  return { ok: reasons.size === 0, reasons: [...reasons] };
}

module.exports = {
  FORGE_CANDIDATE_COUNT,
  FORGE_POLICY_VERSION,
  areNearDuplicateForgeQuests,
  exactGoalTitle,
  normalizeForgeText: normalize,
  validateForgeBatch,
  validateForgeCandidate,
  validateLegacyForgeCandidate,
};
