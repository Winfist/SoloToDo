import { QUEST_POOL } from "./questPool.js";

const GENERIC_EN_SUBQUESTS = {
  str: [
    "Complete the physical training block with full attention.",
    "Log one short recovery action after the session.",
  ],
  int: [
    "Spend one focused block on the learning task.",
    "Write down the key insight in one clear note.",
  ],
  vit: [
    "Complete the recovery or health action today.",
    "Remove one source of avoidable strain from your environment.",
  ],
  agi: [
    "Clear the highest-friction task first.",
    "Reset the workspace or system that slows execution.",
  ],
  cha: [
    "Initiate one meaningful social action.",
    "Follow up with a clear message or reflection.",
  ],
};

const EN_OVERRIDES = {
  qp_str_01: {
    desc: "Initialize physical activity to stimulate the body and raise baseline energy.",
    subQuests: ["10 push-ups", "20 squats"],
  },
  qp_int_01: {
    desc: "Expand your knowledge base and extract the signal from high-quality information.",
    subQuests: ["Read 15 pages of non-fiction", "Capture the core idea in 3 sentences"],
  },
  qp_vit_01: {
    desc: "Optimize hydration for cellular efficiency and stable energy.",
    subQuests: ["Drink at least 2.5 liters of unsweetened fluid"],
  },
  qp_agi_01: {
    desc: "Remove environmental friction so execution becomes easier.",
    subQuests: ["Reset one visible workspace", "Remove or archive 5 distracting items"],
  },
  qp_cha_01: {
    desc: "Strengthen social presence through one deliberate contact.",
    subQuests: ["Send one thoughtful message", "Ask one direct follow-up question"],
  },
};

function localizeSubQuests(template, locale, override) {
  if (locale !== "en") return template.subQuests;
  const titles = override?.subQuests || GENERIC_EN_SUBQUESTS[template.category] || GENERIC_EN_SUBQUESTS.agi;
  return titles.map((title, index) => ({
    ...(template.subQuests?.[index] || { id: String(index + 1), completed: false }),
    title,
    completed: false,
  }));
}

export function localizeQuestTemplate(template, locale) {
  if (!template) return template;
  const templateId = template.templateId || template.id;
  if (locale !== "en") {
    return { ...template, templateId };
  }

  const override = EN_OVERRIDES[templateId];
  return {
    ...template,
    templateId,
    title: override?.title || template.title,
    desc: override?.desc || `Complete this ${template.difficulty || "normal"} ${template.category?.toUpperCase() || "AGI"} Quest to strengthen your Hunter profile.`,
    subQuests: localizeSubQuests(template, locale, override),
  };
}

export function getSystemQuestPoolForLocale(locale) {
  return QUEST_POOL.map((template) => localizeQuestTemplate(template, locale));
}
