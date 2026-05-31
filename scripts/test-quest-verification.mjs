import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_STATE } from "../data/defaultState.js";
import { generateOperationStep } from "../data/helpers.js";
import { generateSeasonalQuests } from "../data/protocolHelpers.js";
import { OPERATIONS, QUEST_POOL } from "../data/questPool.js";
import {
  QUEST_VERIFICATION_MODES,
  getPhotoVerificationCatalog,
  getQuestVerificationPolicy,
} from "../data/questVerification.js";
import {
  buildCompleteEmergencyQuestState,
  buildCompleteQuestState,
} from "../hooks/questActions.js";

const { NONE, PHOTO, SCREEN_TIME, HEALTH } = QUEST_VERIFICATION_MODES;

const EXPECTED_TEMPLATE_IDS = [
  "qp_int_01", "qp_int_01b", "qp_int_01c", "qp_int_02d", "qp_int_03b", "qp_int_03c",
  "qp_int_05b", "qp_int_06", "qp_int_06b", "qp_int_06c", "qp_int_06d", "qp_int_07",
  "qp_int_07b", "qp_int_07c", "qp_int_07d", "qp_int_09", "qp_int_09b", "qp_int_10",
  "qp_int_10b", "qp_int_10c", "qp_int_10d", "qp_int_11", "qp_int_11b", "qp_int_11c",
  "qp_vit_01b", "qp_vit_02d", "qp_vit_05", "qp_vit_06", "qp_vit_06b", "qp_vit_06c",
  "qp_vit_07b", "qp_vit_09", "qp_vit_10",
  "qp_agi_01", "qp_agi_01b", "qp_agi_01c", "qp_agi_01d", "qp_agi_02b", "qp_agi_02e",
  "qp_agi_03", "qp_agi_03c", "qp_agi_05", "qp_agi_05b", "qp_agi_06", "qp_agi_06b",
  "qp_agi_06c", "qp_agi_06d", "qp_agi_07", "qp_agi_07c", "qp_agi_08", "qp_agi_09b",
  "qp_agi_10", "qp_agi_10d", "qp_agi_11b",
  "qp_cha_02e", "qp_cha_06d",
];

const EXPECTED_EMERGENCY_IDS = [
  "emergency_oxygen",
  "emergency_cognitive2",
  "emergency_hydration3",
];

const EXPECTED_SEASONAL_KEYS = [
  "seasonal:spring:4",
  "seasonal:redgate:2",
];

const EXPECTED_OPERATION_KEYS = [
  "op_mind_fortress:2",
  "op_mind_fortress:3",
  "op_wealth_builder:1",
  "op_wealth_builder:3",
];

function clone(value) {
  return structuredClone(value);
}

function sorted(values) {
  return [...values].sort();
}

function mode(quest) {
  return getQuestVerificationPolicy(quest).mode;
}

function noAchievements(nextState) {
  return { nextState, newAchievements: [] };
}

function makePoolQuest(templateId, id = `test:${templateId}`) {
  const template = QUEST_POOL.find(quest => quest.id === templateId);
  assert(template, `Missing QUEST_POOL template: ${templateId}`);
  return {
    ...clone(template),
    id,
    templateId,
    isSystem: true,
    type: template.type || "side",
    createdAt: "2026-05-31",
    createdAtMs: Date.now() - (24 * 60 * 60 * 1000),
  };
}

function makeState(quest = null) {
  return {
    ...clone(DEFAULT_STATE),
    quests: quest ? [quest] : [],
    lastActiveDate: "2026-05-31",
  };
}

const catalog = getPhotoVerificationCatalog();
assert.deepEqual(sorted(catalog.templateIds), sorted(EXPECTED_TEMPLATE_IDS), "Photo template whitelist drifted");
assert.deepEqual(sorted(catalog.emergencyTemplateIds), sorted(EXPECTED_EMERGENCY_IDS), "Emergency whitelist drifted");
assert.deepEqual(sorted(catalog.seasonalKeys), sorted(EXPECTED_SEASONAL_KEYS), "Seasonal whitelist drifted");
assert.deepEqual(sorted(catalog.operationStepKeys), sorted(EXPECTED_OPERATION_KEYS), "Operation whitelist drifted");

for (const templateId of EXPECTED_TEMPLATE_IDS) {
  const quest = makePoolQuest(templateId);
  const policy = getQuestVerificationPolicy(quest);
  assert.equal(policy.mode, PHOTO, `${templateId} must use photo verification`);
  assert(["artifact", "environment", "outdoor", "meal"].includes(policy.evidenceKind), `${templateId} needs an evidence kind`);
}

assert.equal(mode(makePoolQuest("qp_str_01")), NONE, "Sport Quest must not use a static photo");
assert.equal(mode({ id: "custom", title: "Custom Quest", type: "side" }), NONE, "Custom Quest must default to none");
assert.equal(mode({ id: "custom-seasonal-key", title: "Custom Quest", verificationKey: "seasonal:spring:4", type: "side" }), NONE, "Custom Quest must not inherit a Seasonal policy");
assert.equal(mode({ id: "scan", title: "Scanned Quest", source: "scan", type: "side" }), NONE, "Scanned Quest must default to none");
assert.equal(mode({ id: "ai", title: "AI Quest", aiGenerated: true, type: "side" }), NONE, "AI Quest must default to none");
assert.equal(mode({ id: "hidden", title: "Hidden Quest", type: "hidden" }), NONE, "Hidden Quest must default to none");
assert.equal(mode({ id: "redemption", title: "Redemption Quest", type: "redemption", isRedemption: true }), NONE, "Redemption Quest must default to none");
assert.equal(mode({ id: "codex", title: "Codex Quest", isCodexQuest: true }), NONE, "Codex Quest must default to none");
assert.equal(mode({ id: "charisma", title: "Dungeon Quest", isCharismaQuest: true }), NONE, "Charisma Dungeon Quest must default to none");
assert.equal(mode({ templateId: "screen_time_quest", isScreenTime: true }), SCREEN_TIME, "Screen-Time needs its own flow");
assert.equal(mode({ templateId: "step_goal_quest", isStepGoal: true }), HEALTH, "Step goals need the Health flow");

const springQuests = generateSeasonalQuests("spring");
const redgateQuests = generateSeasonalQuests("redgate");
assert.equal(springQuests[3].verificationKey, "seasonal:spring:4", "Seasonal quests need a stable verification key");
assert.equal(mode(springQuests[3]), PHOTO, "Curated spring step must use photo verification");
assert.equal(mode(springQuests[2]), NONE, "Non-curated spring step must stay disabled");
assert.equal(mode(redgateQuests[1]), PHOTO, "Curated redgate step must use photo verification");
assert.equal(mode(redgateQuests[0]), NONE, "Non-curated redgate step must stay disabled");
assert.equal(mode({ title: "Frühlingsputz: Basis komplett aufräumen und optimieren", isSeasonal: true }), PHOTO, "German seasonal legacy title fallback failed");
assert.equal(mode({ title: "Spring Clean: Completely clean and optimize your base", isSeasonal: true }), PHOTO, "English seasonal legacy title fallback failed");

const mindFortress = OPERATIONS.find(operation => operation.id === "op_mind_fortress");
const wealthBuilder = OPERATIONS.find(operation => operation.id === "op_wealth_builder");
assert.equal(mode(generateOperationStep(mindFortress, 1)), NONE, "Non-curated operation step must stay disabled");
assert.equal(mode(generateOperationStep(mindFortress, 2)), PHOTO, "Curated operation step must use photo verification");
assert.equal(mode(generateOperationStep(wealthBuilder, 2)), NONE, "Non-curated wealth step must stay disabled");
assert.equal(mode(generateOperationStep(wealthBuilder, 3)), PHOTO, "Curated wealth step must use photo verification");

const photoQuest = makePoolQuest("qp_int_01b", "photo-quest");
const plainRegular = buildCompleteQuestState(photoQuest.id, makeState(photoQuest), noAchievements, 1, false);
const verifiedRegular = buildCompleteQuestState(photoQuest.id, makeState(photoQuest), noAchievements, 1, true);
assert.equal(verifiedRegular.xpGain, Math.round(plainRegular.xpGain * 1.2), "Eligible regular Quest needs +20% XP");
assert.equal(verifiedRegular.goldGain, Math.round(plainRegular.goldGain * 1.1), "Eligible regular Quest needs +10% Gold");
assert.equal(verifiedRegular.nextState.ai.verifiedQuests, 1, "Eligible regular Quest needs verification tracking");
assert.equal(verifiedRegular.newlyCompletedQuests[0].wasVerified, true, "Eligible regular Quest history needs verification flag");

const sportQuest = makePoolQuest("qp_str_01", "sport-quest");
const plainSport = buildCompleteQuestState(sportQuest.id, makeState(sportQuest), noAchievements, 1, false);
const forcedSport = buildCompleteQuestState(sportQuest.id, makeState(sportQuest), noAchievements, 1, true);
assert.equal(forcedSport.xpGain, plainSport.xpGain, "Ineligible regular Quest must not receive XP bonus");
assert.equal(forcedSport.goldGain, plainSport.goldGain, "Ineligible regular Quest must not receive Gold bonus");
assert.equal(forcedSport.nextState.ai.verifiedQuests, 0, "Ineligible regular Quest must not increase verification tracking");
assert.equal(forcedSport.newlyCompletedQuests[0].wasVerified, false, "Ineligible regular Quest history must not be marked verified");

const emergencyPhotoQuest = { templateId: "emergency_oxygen", difficulty: "easy", category: "agi" };
const plainEmergency = buildCompleteEmergencyQuestState(emergencyPhotoQuest, makeState(), noAchievements, false);
const verifiedEmergency = buildCompleteEmergencyQuestState(emergencyPhotoQuest, makeState(), noAchievements, true);
assert.equal(verifiedEmergency.xpGain, Math.round(plainEmergency.xpGain * 1.2), "Eligible Emergency needs +20% XP");
assert.equal(verifiedEmergency.goldGain, Math.round(plainEmergency.goldGain * 1.1), "Eligible Emergency needs +10% Gold");
assert.equal(verifiedEmergency.nextState.ai.verifiedQuests, 1, "Eligible Emergency needs verification tracking");

const emergencySportQuest = { templateId: "emergency_physical", difficulty: "easy", category: "str" };
const plainEmergencySport = buildCompleteEmergencyQuestState(emergencySportQuest, makeState(), noAchievements, false);
const forcedEmergencySport = buildCompleteEmergencyQuestState(emergencySportQuest, makeState(), noAchievements, true);
assert.equal(forcedEmergencySport.xpGain, plainEmergencySport.xpGain, "Ineligible Emergency must not receive XP bonus");
assert.equal(forcedEmergencySport.goldGain, plainEmergencySport.goldGain, "Ineligible Emergency must not receive Gold bonus");
assert.equal(forcedEmergencySport.nextState.ai.verifiedQuests, 0, "Ineligible Emergency must not increase verification tracking");

const aiHookSource = readFileSync(fileURLToPath(new URL("../hooks/useGeminiAI.js", import.meta.url)), "utf8");
assert(!/\bfileToBase64\s*\(/.test(aiHookSource), "Broken fileToBase64 reference remains in useGeminiAI.js");

console.log(`✓ Quest verification: ${EXPECTED_TEMPLATE_IDS.length} Pool templates, curated special cases, bonus guards, and scanner runtime references validated`);
