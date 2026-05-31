import { getSystemQuestPoolForLocale } from "./localizedQuestPool.js";

const templateMaps = new Map();

function templateMap(locale) {
  const key = locale === "en" ? "en" : "de";
  if (!templateMaps.has(key)) {
    templateMaps.set(key, new Map(getSystemQuestPoolForLocale(key).map(template => [template.templateId || template.id, template])));
  }
  return templateMaps.get(key);
}

function stepTitle(step) {
  return String(typeof step === "string" ? step : step?.title || "").trim();
}

function shortAction(value, max = 72) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "").trim()}...`;
}

export function getQuestPresentation(quest, locale = "de") {
  if (!quest) return { title: "", codeName: "", description: "", nextStep: "" };
  if (!quest.isSystem || !quest.templateId) {
    const nextStep = (quest.subQuests || []).find(step => !step?.completed && stepTitle(step));
    return {
      title: quest.title || "",
      codeName: "",
      description: quest.description || quest.desc || "",
      nextStep: stepTitle(nextStep),
    };
  }

  const template = templateMap(locale).get(quest.templateId);
  const localizedSteps = template?.subQuests || quest.subQuests || [];
  const storedSteps = quest.subQuests || [];
  const nextIndex = storedSteps.findIndex(step => !step?.completed);
  const concreteTitle = stepTitle(localizedSteps[nextIndex >= 0 ? nextIndex : 0])
    || stepTitle(localizedSteps[0])
    || template?.desc
    || quest.title;
  const codeName = template?.title || quest.title || "";

  return {
    title: shortAction(concreteTitle),
    codeName: codeName !== concreteTitle ? codeName : "",
    description: template?.desc || quest.description || quest.desc || "",
    nextStep: nextIndex > 0 ? stepTitle(localizedSteps[nextIndex]) : "",
  };
}

export function validateQuestPresentations(locale = "de") {
  return getSystemQuestPoolForLocale(locale).filter(template => {
    const presentation = getQuestPresentation({ ...template, templateId: template.id, isSystem: true }, locale);
    return !presentation.title || !presentation.codeName;
  });
}
