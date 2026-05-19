import { getPremiumStatus } from "./premium.js";
import { getToday } from "./dateUtils.js";

export const QUEST_FOCUS_SOFT_CAP = 7;
export const FREE_DAILY_REPLACEMENT_LIMIT = 1;
export const PRO_DAILY_REPLACEMENT_LIMIT = 4;

function normalizeKeyPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function templateIdFromQuest(quest) {
  const id = String(quest?.id || "");
  return quest?.templateId || (id.startsWith("qp_") ? id : null);
}

export function getQuestDescription(quest) {
  return String(quest?.description ?? quest?.desc ?? "").trim();
}

export function getQuestKey(quest) {
  if (!quest) return "";
  if (quest.questKey) return String(quest.questKey);

  const templateId = templateIdFromQuest(quest);
  if (quest.isScreenTime || templateId === "screen_time_quest") {
    const day = quest.dueDate || quest.createdAt || getToday();
    return `screen_time_quest:${day}`;
  }

  if (templateId) return `template:${templateId}`;

  return [
    "quest",
    normalizeKeyPart(quest.title),
    normalizeKeyPart(quest.type || "side"),
    normalizeKeyPart(quest.category || "agi"),
  ].join(":");
}

export function normalizeQuestForStorage(quest) {
  if (!quest) return quest;
  const description = getQuestDescription(quest);
  const templateId = templateIdFromQuest(quest);
  const next = {
    ...quest,
    ...(templateId ? { templateId } : {}),
    ...(description ? { description } : {}),
  };
  return {
    ...next,
    questKey: getQuestKey(next),
  };
}

export function groupQuestStacks(quests = []) {
  const groups = [];
  const byKey = new Map();

  (quests || []).forEach((quest) => {
    if (!quest || quest.completed) return;
    const key = getQuestKey(quest) || `id:${quest.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      const group = {
        ...quest,
        stackKey: key,
        stackCount: 1,
        stackIds: [quest.id],
        stackItems: [quest],
      };
      byKey.set(key, group);
      groups.push(group);
      return;
    }

    existing.stackCount += 1;
    existing.stackIds.push(quest.id);
    existing.stackItems.push(quest);
  });

  return groups;
}

export function getQuestReplacementStatus(state, nowMs = Date.now()) {
  const today = getToday();
  const current = state?.questReplacements?.date === today
    ? state.questReplacements
    : { date: today, used: 0, replacedKeys: [] };
  const premiumActive = getPremiumStatus(state?.premium, nowMs).active;
  const limit = premiumActive ? PRO_DAILY_REPLACEMENT_LIMIT : FREE_DAILY_REPLACEMENT_LIMIT;
  const used = Math.max(0, Number(current.used || 0));
  return {
    date: today,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    canReplace: used < limit,
    replacedKeys: Array.isArray(current.replacedKeys) ? current.replacedKeys : [],
    premiumActive,
  };
}

export function isQuestReplaceable(quest) {
  if (!quest || quest.completed) return false;
  if (!quest.isSystem && !quest.autoAssigned) return false;
  if (quest.linkedGoalId || quest.linkedMilestoneId || quest.linkedHabitId) return false;
  if (quest.isRedemption || quest.isSeasonal || quest.isCharismaQuest || quest.type === "hidden") return false;
  return true;
}
