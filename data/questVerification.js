export const QUEST_VERIFICATION_MODES = Object.freeze({
  NONE: "none",
  PHOTO: "photo",
  SCREEN_TIME: "screen_time",
  HEALTH: "health",
});

export const QUEST_EVIDENCE_KINDS = Object.freeze({
  ARTIFACT: "artifact",
  ENVIRONMENT: "environment",
  OUTDOOR: "outdoor",
  MEAL: "meal",
});

const { NONE, PHOTO, SCREEN_TIME, HEALTH } = QUEST_VERIFICATION_MODES;
const { ARTIFACT, ENVIRONMENT, OUTDOOR, MEAL } = QUEST_EVIDENCE_KINDS;

const NONE_POLICY = Object.freeze({ mode: NONE, evidenceKind: null });
const SCREEN_TIME_POLICY = Object.freeze({ mode: SCREEN_TIME, evidenceKind: null });
const HEALTH_POLICY = Object.freeze({ mode: HEALTH, evidenceKind: null });

function photoPolicy(evidenceKind) {
  return Object.freeze({ mode: PHOTO, evidenceKind });
}

function policyEntries(ids, evidenceKind) {
  return ids.map(id => [id, photoPolicy(evidenceKind)]);
}

const ARTIFACT_TEMPLATE_IDS = [
  "qp_int_01", "qp_int_01b", "qp_int_01c", "qp_int_02d", "qp_int_03b", "qp_int_03c",
  "qp_int_05b", "qp_int_06", "qp_int_06b", "qp_int_06c", "qp_int_06d", "qp_int_07",
  "qp_int_07b", "qp_int_07c", "qp_int_07d", "qp_int_09", "qp_int_09b", "qp_int_10",
  "qp_int_10b", "qp_int_10c", "qp_int_10d", "qp_int_11", "qp_int_11b", "qp_int_11c",
  "qp_vit_05", "qp_vit_06", "qp_vit_06b",
  "qp_agi_01b", "qp_agi_01c", "qp_agi_02b", "qp_agi_02e", "qp_agi_03", "qp_agi_05b",
  "qp_agi_06", "qp_agi_06b", "qp_agi_06c", "qp_agi_06d", "qp_agi_07", "qp_agi_07c",
  "qp_agi_08", "qp_agi_10", "qp_agi_10d", "qp_agi_11b",
  "qp_cha_02e", "qp_cha_06d",
];

const ENVIRONMENT_TEMPLATE_IDS = [
  "qp_agi_01", "qp_agi_01d", "qp_agi_03c", "qp_agi_05", "qp_agi_09b",
];

const OUTDOOR_TEMPLATE_IDS = [
  "qp_vit_01b", "qp_vit_06c", "qp_vit_09",
];

const MEAL_TEMPLATE_IDS = [
  "qp_vit_02d", "qp_vit_07b", "qp_vit_10",
];

const PHOTO_TEMPLATE_POLICIES = new Map([
  ...policyEntries(ARTIFACT_TEMPLATE_IDS, ARTIFACT),
  ...policyEntries(ENVIRONMENT_TEMPLATE_IDS, ENVIRONMENT),
  ...policyEntries(OUTDOOR_TEMPLATE_IDS, OUTDOOR),
  ...policyEntries(MEAL_TEMPLATE_IDS, MEAL),
]);

const PHOTO_EMERGENCY_POLICIES = new Map([
  ["emergency_oxygen", photoPolicy(OUTDOOR)],
  ["emergency_cognitive2", photoPolicy(ARTIFACT)],
  ["emergency_hydration3", photoPolicy(MEAL)],
]);

const PHOTO_SEASONAL_POLICIES = new Map([
  ["seasonal:spring:4", photoPolicy(ENVIRONMENT)],
  ["seasonal:redgate:2", photoPolicy(ARTIFACT)],
]);

const LEGACY_SEASONAL_PHOTO_TITLES = new Map([
  ["Frühlingsputz: Basis komplett aufräumen und optimieren", "seasonal:spring:4"],
  ["Spring Clean: Completely clean and optimize your base", "seasonal:spring:4"],
  ["Herbst-Offensive: Finanzielle Planung abschliessen", "seasonal:redgate:2"],
  ["Autumn Offensive: Finalize financial planning", "seasonal:redgate:2"],
]);

const PHOTO_OPERATION_POLICIES = new Map([
  ["op_mind_fortress:2", photoPolicy(ARTIFACT)],
  ["op_mind_fortress:3", photoPolicy(ARTIFACT)],
  ["op_wealth_builder:1", photoPolicy(ARTIFACT)],
  ["op_wealth_builder:3", photoPolicy(ARTIFACT)],
]);

function getTemplateId(quest) {
  const id = String(quest?.id || "");
  return quest?.templateId || quest?.fromTemplate || (id.startsWith("qp_") ? id : "");
}

function getSeasonalVerificationKey(quest) {
  if (!quest?.isSeasonal) return "";
  if (quest?.verificationKey) return String(quest.verificationKey);
  return LEGACY_SEASONAL_PHOTO_TITLES.get(String(quest.title || "")) || "";
}

function getOperationVerificationKey(quest) {
  if (!quest?.operationId || !quest?.chainStep) return "";
  return `${quest.operationId}:${quest.chainStep}`;
}

export function getQuestVerificationPolicy(quest) {
  if (!quest) return NONE_POLICY;

  const templateId = getTemplateId(quest);
  if (quest.isScreenTime || templateId === "screen_time_quest") return SCREEN_TIME_POLICY;
  if (quest.isStepGoal || templateId === "step_goal_quest") return HEALTH_POLICY;

  if (
    quest.aiGenerated ||
    quest.isCodexQuest ||
    quest.isCharismaQuest ||
    quest.isRedemption ||
    quest.type === "redemption" ||
    quest.type === "hidden"
  ) {
    return NONE_POLICY;
  }

  return PHOTO_TEMPLATE_POLICIES.get(templateId)
    || PHOTO_EMERGENCY_POLICIES.get(templateId)
    || PHOTO_SEASONAL_POLICIES.get(getSeasonalVerificationKey(quest))
    || PHOTO_OPERATION_POLICIES.get(getOperationVerificationKey(quest))
    || NONE_POLICY;
}

export function isPhotoVerificationEligible(quest) {
  return getQuestVerificationPolicy(quest).mode === PHOTO;
}

export function getPhotoVerificationCatalog() {
  return {
    templateIds: [...PHOTO_TEMPLATE_POLICIES.keys()],
    emergencyTemplateIds: [...PHOTO_EMERGENCY_POLICIES.keys()],
    seasonalKeys: [...PHOTO_SEASONAL_POLICIES.keys()],
    operationStepKeys: [...PHOTO_OPERATION_POLICIES.keys()],
  };
}
