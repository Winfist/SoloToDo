// questSwap.js — Tausch statischer System-Dailies gegen KI-Quests.
// Auto-Kalibrierung (Pro, App-Start) ist KONSERVATIV: sobald irgendeine
// System-Daily angefasst wurde, passiert nichts mehr (kein "meine Quest ist
// weg"-Moment). Die manuelle Schmiede ersetzt nur offene, unangetastete
// Dailies — erledigte bleiben stehen. Ziel-Quests (type "goal") sind tabu.

// Nur austauschbare Pool-Dailies: reine System-Tagesquests ohne Sonderrolle.
// Saison (weekly), Redemption, ScreenTime-, Schritte-, Comeback- und
// Starter-Quests sind feature-gebunden und fuer den Swap tabu.
const isPoolDaily = (quest) => Boolean(
  quest
  && quest.isSystem
  && quest.type === "daily"
  && !quest.isScreenTime
  && !quest.isStepGoal
  && !quest.isComebackQuest
  && !quest.isStarter
);
const isTouched = (quest) => Boolean(quest?.completed)
  || (Array.isArray(quest?.subQuests) && quest.subQuests.some((sq) => sq?.completed));

export function canAutoSwapSystemQuests(quests = []) {
  return !(quests || []).some((quest) => isPoolDaily(quest) && isTouched(quest));
}

export function countManualForgeTargets(quests = []) {
  return (quests || []).filter((quest) => isPoolDaily(quest) && !isTouched(quest)).length;
}

// Liefert exakt die Quests, die swapSystemQuests im jeweiligen Modus entfernt —
// fuer die Signal-Erfassung an den Aufrufstellen (kein Re-Deriving dort).
export function getSwappedQuests(quests = [], aiQuests = [], { mode = "auto" } = {}) {
  const list = quests || [];
  if (mode === "auto") return list.filter(isPoolDaily);
  return list.filter((quest) => isPoolDaily(quest) && !isTouched(quest)).slice(0, (aiQuests || []).length);
}

export function swapSystemQuests(quests = [], aiQuests = [], { mode = "auto" } = {}) {
  const list = quests || [];
  const incomingAll = aiQuests || [];
  if (mode === "auto") {
    return [...list.filter((quest) => !isPoolDaily(quest)), ...incomingAll];
  }
  const replaceable = list.filter((quest) => isPoolDaily(quest) && !isTouched(quest));
  const incoming = incomingAll.slice(0, replaceable.length);
  const dropIds = new Set(replaceable.slice(0, incoming.length).map((quest) => quest.id));
  return [...list.filter((quest) => !dropIds.has(quest.id)), ...incoming];
}
