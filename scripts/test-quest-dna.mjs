import assert from "node:assert/strict";
import {
  getEffectiveQuestDNA,
  getQuestDurationBand,
  getQuestRecipeKey,
  inferQuestDNA,
  normalizeQuestDNA,
  parseQuestRecipeKey,
} from "../data/questDNA.js";

const EXPLICIT = {
  version: 99,
  actionKind: "produce",
  contextKind: "computer",
  focusMode: "continuous",
  outcomeKind: "artifact",
  requirements: ["computer", "materials", "computer", "invalid"],
};

assert.deepEqual(normalizeQuestDNA(EXPLICIT), {
  version: 1,
  actionKind: "produce",
  contextKind: "computer",
  focusMode: "continuous",
  outcomeKind: "artifact",
  requirements: ["computer", "materials"],
});
assert.equal(normalizeQuestDNA({ ...EXPLICIT, actionKind: "invented" }), null);
assert.equal(normalizeQuestDNA(null), null);

assert.equal(getQuestDurationBand({ estimatedMinutes: 5 }), "quick");
assert.equal(getQuestDurationBand({ estimatedMinutes: 15 }), "quick");
assert.equal(getQuestDurationBand({ estimatedMinutes: 16 }), "standard");
assert.equal(getQuestDurationBand({ estimatedMinutes: 35 }), "standard");
assert.equal(getQuestDurationBand({ estimatedMinutes: 36 }), "deep");
assert.equal(getQuestDurationBand({ estimatedMinutes: 120 }), "deep");
assert.equal(getQuestDurationBand({ estimatedMinutes: 121 }), null);
assert.equal(getQuestDurationBand({ energy: "medium" }), "standard");

const inferred = inferQuestDNA({
  title: "Schreibe den Entwurf am Laptop",
  category: "int",
  estimatedMinutes: 45,
});
assert.equal(inferred.source, "inferred");
assert.equal(inferred.confidence, "medium");
assert.equal(inferred.dna.actionKind, "produce");
assert.equal(inferred.dna.contextKind, "computer");
assert.equal(inferred.dna.focusMode, "continuous");
assert.equal(inferred.dna.outcomeKind, "artifact");
assert(inferred.dna.requirements.includes("computer"));

const social = inferQuestDNA({
  title: "Call your friend and send the answer",
  category: "cha",
  estimatedMinutes: 10,
}, { locale: "en" });
assert.equal(social.dna.actionKind, "communicate");
assert.equal(social.dna.contextKind, "social");
assert.equal(social.dna.outcomeKind, "message_sent");
assert(social.dna.requirements.includes("other_person"));

const explicitQuest = { estimatedMinutes: 25, questDNA: EXPLICIT };
assert.deepEqual(getEffectiveQuestDNA(explicitQuest), {
  dna: normalizeQuestDNA(EXPLICIT),
  source: "declared",
  confidence: "high",
});
assert.equal(getEffectiveQuestDNA({ title: "Unklassifizierbar", estimatedMinutes: 20 }), null);

const recipeKey = getQuestRecipeKey(explicitQuest);
assert.equal(recipeKey, "r1|produce|computer|standard");
assert.deepEqual(parseQuestRecipeKey(recipeKey), {
  version: 1,
  actionKind: "produce",
  contextKind: "computer",
  durationBand: "standard",
});
assert.equal(parseQuestRecipeKey("r1|produce|computer|unknown"), null);
assert.equal(parseQuestRecipeKey("r1|produce|computer|standard|extra"), null);
assert(!recipeKey.includes("Schreibe"), "Rezeptschluessel enthaelt keinen Freitext");

console.log("test-quest-dna: all assertions passed.");
