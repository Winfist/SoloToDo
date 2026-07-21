import assert from "node:assert/strict";
import { buildAIQuestRequest } from "../data/aiQuestProfile.js";
import { compileForgeSet } from "../data/forgeCompiler.js";
import { compareQuestSimilarity } from "../data/questSimilarity.js";

const TODAY = "2026-07-21";
const NOW_MS = Date.parse(`${TODAY}T12:00:00.000Z`);
const PROFILE_COUNT = 72;
const CATEGORIES = ["str", "int", "vit", "agi", "cha"];
const INTENSITY = { 1: "baby_gate", 2: "e_rank_patrol", 3: "hunter_patrol" };
const PROTECTED_GOALS = {
  de: [
    ["Gesundheitsunterlagen ordnen", "Eine sachliche Terminfrage notieren"],
    ["Finanzunterlagen ordnen", "Drei offene Belege zuordnen"],
    ["Beziehungsgespraech vorbereiten", "Eine respektvolle Grenze formulieren"],
  ],
  en: [
    ["Organize health paperwork", "Write down one factual appointment question"],
    ["Organize financial paperwork", "Match three outstanding receipts"],
    ["Prepare a relationship conversation", "Write one respectful boundary"],
  ],
};
const ORDINARY_GOALS = {
  de: [
    ["Portfolio veroeffentlichen", "Startseite als Entwurf bauen"],
    ["Zehn Kilometer laufen", "Drei Trainingstage festlegen"],
    ["Spanisch im Alltag nutzen", "Eine kurze Dialoguebung aufnehmen"],
  ],
  en: [
    ["Publish a portfolio", "Build a draft landing page"],
    ["Run ten kilometers", "Choose three training days"],
    ["Use Spanish in daily life", "Record one short dialogue exercise"],
  ],
};

function systemSlot(profileIndex, slotIndex) {
  return {
    id: `system-slot-${profileIndex}-${slotIndex}`,
    templateId: `golden-template-${slotIndex}`,
    title: `System slot ${slotIndex + 1}`,
    category: "agi",
    difficulty: "normal",
    estimatedMinutes: 35,
    type: "daily",
    isSystem: true,
    completed: false,
  };
}

function goalFixture(profileIndex, language, goalIndex, protectedTopic) {
  const source = protectedTopic ? PROTECTED_GOALS : ORDINARY_GOALS;
  const [title, milestone] = source[language][goalIndex % source[language].length];
  return {
    id: `private-goal-id-${profileIndex}-${goalIndex}-S3CRET`,
    title,
    category: CATEGORIES[(profileIndex + goalIndex) % CATEGORIES.length],
    completed: false,
    milestones: [{
      id: `private-milestone-id-${profileIndex}-${goalIndex}-S3CRET`,
      title: milestone,
      completed: false,
    }],
  };
}

function learningFixture(profileIndex) {
  const recipeKey = profileIndex % 2 === 0
    ? "r1|produce|computer|standard"
    : "r1|move|outside|quick";
  const outcomesByQuestId = {};
  for (let outcomeIndex = 0; outcomeIndex < 6; outcomeIndex += 1) {
    const assignedAtMs = NOW_MS - (outcomeIndex + 1) * 86400000;
    outcomesByQuestId[`private-outcome-id-${profileIndex}-${outcomeIndex}-S3CRET`] = {
      recipeKey,
      dnaSource: "declared",
      dnaConfidence: "high",
      origin: outcomeIndex % 2 === 0 ? "forge" : "manual",
      assignedAtMs,
      completedAtMs: assignedAtMs + 1200000,
      updatedAtMs: assignedAtMs + 1200000,
    };
  }
  return {
    version: 1,
    resetAtMs: 0,
    updatedAtMs: NOW_MS,
    outcomesByQuestId,
    preferencesByRecipe: { [recipeKey]: { value: "prefer", updatedAtMs: NOW_MS } },
  };
}

function buildProfileState(profileIndex, language) {
  const scenario = profileIndex % 3;
  const capacity = scenario + 1;
  const equalStats = profileIndex % 2 === 0;
  const secret = {
    historicalTitle: `HISTORICAL-TITLE-${profileIndex}-S3CRET`,
    rejectedTitle: `REJECTED-TITLE-${profileIndex}-S3CRET`,
    note: `PRIVATE-NOTE-${profileIndex}-S3CRET`,
    openTitle: `OPEN-TITLE-${profileIndex}-S3CRET`,
    questId: `private-quest-id-${profileIndex}-S3CRET`,
  };
  const goals = scenario === 0
    ? []
    : scenario === 1
      ? [0, 1, 2].map((goalIndex) => goalFixture(profileIndex, language, goalIndex, false))
      : [goalFixture(profileIndex, language, profileIndex, true)];
  const forgeGoalProgress = {
    updatedAtMs: NOW_MS,
    byGoalId: Object.fromEntries(goals.map((goal) => [goal.id, {
      currentMilestoneId: goal.milestones[0].id,
      lastCompletedQuestId: `private-resume-id-${profileIndex}-S3CRET`,
      lastCompletedAtMs: NOW_MS - 86400000,
      lastRecipeKey: "r1|prepare|computer|standard",
      lastActionKind: "prepare",
      lastOutcomeKind: "artifact",
      updatedAtMs: NOW_MS,
    }])),
  };
  const systemQuests = Array.from({ length: capacity }, (_, slotIndex) => systemSlot(profileIndex, slotIndex));
  return {
    state: {
      stateVersion: 6,
      level: 7 + (profileIndex % 18),
      stats: equalStats
        ? { str: 8, int: 8, vit: 8, agi: 8, cha: 8 }
        : { str: 2, int: 5, vit: 6, agi: 7, cha: 8 },
      settings: { language, questIntensity: INTENSITY[capacity] },
      premium: { tier: "hunter_pro", status: "active", activeUntil: "2099-01-01T00:00:00.000Z" },
      questPlanning: { overloadPreset: "balanced", pinnedQuestIds: [], deferredUntilById: {}, lifecycleById: {} },
      quests: [
        ...systemQuests,
        {
          id: secret.questId,
          title: secret.openTitle,
          category: "int",
          difficulty: "normal",
          estimatedMinutes: 20,
          type: "side",
          isSystem: false,
          completed: false,
        },
      ],
      completedQuests: [{
        id: `private-history-id-${profileIndex}-S3CRET`,
        title: secret.historicalTitle,
        category: "int",
        completedAt: new Date(NOW_MS - 2 * 86400000).toISOString(),
      }],
      questSignals: {
        recentDisliked: [{ title: secret.rejectedTitle, note: secret.note }],
        recentExpired: [{ title: `EXPIRED-TITLE-${profileIndex}-S3CRET` }],
      },
      goals,
      forgeGoalProgress,
      habits: scenario === 0 ? [] : [
        { id: `private-habit-id-${profileIndex}-0-S3CRET`, title: language === "de" ? "Wasser trinken" : "Drink water", category: "vit", frequency: "daily", active: true },
        { id: `private-habit-id-${profileIndex}-1-S3CRET`, title: language === "de" ? "Vokabeln ueben" : "Practice vocabulary", category: "int", frequency: "weekdays", active: true },
        { id: `private-habit-id-${profileIndex}-2-S3CRET`, title: "THIS-THIRD-HABIT-MUST-BE-TRIMMED", category: "agi", frequency: "daily", active: true },
      ],
      forgeLearning: scenario === 0 ? undefined : learningFixture(profileIndex),
      questArchive: [{ id: `private-archive-id-${profileIndex}-S3CRET`, title: `ARCHIVE-TITLE-${profileIndex}-S3CRET` }],
    },
    capacity,
    equalStats,
    scenario,
    secret,
  };
}

function candidateTemplates(language) {
  if (language === "en") return [
    ["Create one concrete project sketch", "produce", "computer", "continuous", "artifact", ["computer"], "int", 20],
    ["Walk twelve minutes through the park", "move", "outside", "interruptible", "movement_block", ["outdoors"], "vit", 12],
    ["Organize three important paper documents", "organize", "home", "interruptible", "environment_changed", ["materials"], "agi", 15],
    ["Send one clear scheduling message", "communicate", "phone", "interruptible", "message_sent", ["phone", "other_person"], "cha", 10],
    ["Practice one core skill for twenty minutes", "practice", "any", "continuous", "practice_block", [], "str", 20],
    ["Review and choose your next three priorities", "review", "computer", "interruptible", "decision", ["computer"], "int", 15],
  ];
  return [
    ["Erstelle eine konkrete Projektskizze", "produce", "computer", "continuous", "artifact", ["computer"], "int", 20],
    ["Gehe zwoelf Minuten durch den Park", "move", "outside", "interruptible", "movement_block", ["outdoors"], "vit", 12],
    ["Ordne drei wichtige Papierunterlagen", "organize", "home", "interruptible", "environment_changed", ["materials"], "agi", 15],
    ["Sende eine klare Terminabstimmung", "communicate", "phone", "interruptible", "message_sent", ["phone", "other_person"], "cha", 10],
    ["Uebe zwanzig Minuten eine Kernfertigkeit", "practice", "any", "continuous", "practice_block", [], "str", 20],
    ["Pruefe und waehle deine drei naechsten Prioritaeten", "review", "computer", "interruptible", "decision", ["computer"], "int", 15],
  ];
}

function buildCandidates(profileIndex, language, activeGoal) {
  return candidateTemplates(language).map((template, candidateIndex) => {
    const [title, actionKind, contextKind, focusMode, outcomeKind, requirements, category, estimatedMinutes] = template;
    return {
      id: `golden-candidate-${profileIndex}-${candidateIndex}`,
      title,
      description: language === "en"
        ? "Complete the stated action in one focused block. Record the concrete result immediately afterward."
        : "Fuehre die genannte Handlung in einem fokussierten Block aus. Halte das konkrete Ergebnis direkt danach fest.",
      doneWhen: language === "en"
        ? `Done when the concrete result for candidate ${candidateIndex + 1} has been recorded.`
        : `Fertig, wenn das konkrete Ergebnis fuer Kandidat ${candidateIndex + 1} festgehalten wurde.`,
      category,
      difficulty: candidateIndex === 3 ? "easy" : "normal",
      estimatedMinutes,
      type: "daily",
      isSystem: true,
      aiGenerated: true,
      subQuests: language === "en"
        ? [{ title: "Prepare the necessary context" }, { title: "Complete and record the result" }]
        : [{ title: "Noetigen Kontext vorbereiten" }, { title: "Ergebnis umsetzen und festhalten" }],
      questDNA: { version: 1, actionKind, contextKind, focusMode, outcomeKind, requirements },
      ...(candidateIndex === 0 && activeGoal ? { goalRef: activeGoal.title } : {}),
    };
  });
}

function assertNoPrivateKeys(value, path = "profile") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!/(^id$|id$|ids$)/i.test(key), `${path}.${key} must not expose a raw id field`);
    assertNoPrivateKeys(child, `${path}.${key}`);
  }
}

const coverage = {
  de: 0,
  en: 0,
  coldStart: 0,
  multiGoal: 0,
  protectedTopic: 0,
  capacities: { 1: 0, 2: 0, 3: 0 },
};

for (let profileIndex = 0; profileIndex < PROFILE_COUNT; profileIndex += 1) {
  const language = profileIndex % 2 === 0 ? "de" : "en";
  const fixture = buildProfileState(profileIndex, language);
  const request = buildAIQuestRequest(fixture.state, language, {
    nowMs: NOW_MS,
    today: TODAY,
    timeZone: "Europe/Berlin",
    requestId: `golden-request-${profileIndex}`,
  });
  const profileJson = JSON.stringify(request.profile);
  assert.doesNotThrow(() => JSON.parse(profileJson), `profile ${profileIndex} must be valid JSON`);
  assert.ok(profileJson.length <= 4000, `profile ${profileIndex} exceeds 4,000 characters`);
  assert.equal(request.language, language);
  assert.equal(request.today, TODAY);
  assert.equal(request.timeZone, "Europe/Berlin");
  assert.equal(request.clientPolicyVersion, "forge-3.0");
  assert.equal(request.weakestStat, fixture.equalStats ? null : "str", `unexpected weakest stat for profile ${profileIndex}`);
  assert.ok(request.profile.activeGoals.length <= 3);
  assert.ok(request.profile.activeHabits.length <= 2);
  assertNoPrivateKeys(request.profile);

  const privacySentinels = [
    fixture.secret.historicalTitle,
    fixture.secret.rejectedTitle,
    fixture.secret.note,
    fixture.secret.openTitle,
    fixture.secret.questId,
    `EXPIRED-TITLE-${profileIndex}-S3CRET`,
    `ARCHIVE-TITLE-${profileIndex}-S3CRET`,
    `private-history-id-${profileIndex}-S3CRET`,
    `private-resume-id-${profileIndex}-S3CRET`,
    `private-habit-id-${profileIndex}`,
    `private-goal-id-${profileIndex}`,
    `private-milestone-id-${profileIndex}`,
    `private-outcome-id-${profileIndex}`,
  ];
  for (const sentinel of privacySentinels) {
    assert.equal(profileJson.includes(sentinel), false, `profile ${profileIndex} leaked ${sentinel}`);
  }

  const candidates = buildCandidates(profileIndex, language, fixture.state.goals[0]);
  assert.equal(candidates.length, 6);
  const result = compileForgeSet(fixture.state, candidates, {
    today: TODAY,
    nowMs: NOW_MS,
    exploration: false,
    contentSource: "ai",
    strict: true,
  });
  assert.equal(result.compilation.diagnostics.inputCount, 6);
  assert.equal(result.compilation.eligible.length, 6, `profile ${profileIndex} lost a valid candidate`);
  assert.equal(result.compilation.rejected.length, 0, `profile ${profileIndex} rejected a valid candidate`);
  assert.equal(result.composition.status, "ready", `profile ${profileIndex} did not produce a complete set`);
  assert.equal(result.composition.setSummary.capacity, fixture.capacity);
  assert.equal(result.composition.recommendedIds.length, fixture.capacity);
  assert.equal(result.composition.proposals.length, 3, "visible set must stay capped at three without padding beyond source candidates");
  assert.equal(new Set(result.composition.orderedIds).size, result.composition.orderedIds.length);
  assert.equal(new Set(result.composition.recommendedIds).size, result.composition.recommendedIds.length);
  assert.ok(result.composition.setSummary.estimatedMinutes <= result.composition.setSummary.minuteBudget);
  assert.equal(
    result.composition.setSummary.estimatedMinutes,
    result.composition.proposals
      .filter((quest) => result.composition.recommendedIds.includes(quest.id))
      .reduce((sum, quest) => sum + quest.estimatedMinutes, 0),
  );
  for (const recommendationId of result.composition.recommendedIds) {
    assert.ok(candidates.some((candidate) => candidate.id === recommendationId), "compiler invented a recommendation");
  }
  const recommendations = result.composition.proposals.filter((quest) => result.composition.recommendedIds.includes(quest.id));
  for (let leftIndex = 0; leftIndex < recommendations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < recommendations.length; rightIndex += 1) {
      assert.notEqual(
        compareQuestSimilarity(recommendations[leftIndex], recommendations[rightIndex]).level,
        "hard",
        `profile ${profileIndex} contains duplicate recommendations`,
      );
    }
  }

  // A partial upstream response stays partial: never clone or synthesize
  // filler cards to reach three visible proposals.
  const sparseCount = 1 + (profileIndex % 2);
  const sparse = compileForgeSet(fixture.state, candidates.slice(0, sparseCount), {
    today: TODAY,
    nowMs: NOW_MS,
    exploration: false,
    contentSource: "ai",
    strict: true,
  });
  assert.equal(sparse.compilation.eligible.length, sparseCount);
  assert.equal(sparse.composition.proposals.length, sparseCount, `profile ${profileIndex} padded a sparse response`);
  assert.ok(["ready", "partial"].includes(sparse.composition.status));
  assert.equal(
    sparse.composition.status,
    sparseCount < fixture.capacity ? "partial" : "ready",
    `profile ${profileIndex} reported the wrong sparse status`,
  );
  assert.ok(sparse.composition.setSummary.estimatedMinutes <= sparse.composition.setSummary.minuteBudget);

  coverage[language] += 1;
  coverage.capacities[fixture.capacity] += 1;
  if (fixture.scenario === 0) coverage.coldStart += 1;
  if (fixture.scenario === 1) coverage.multiGoal += 1;
  if (fixture.scenario === 2) coverage.protectedTopic += 1;
}

assert.ok(PROFILE_COUNT >= 60);
assert.ok(coverage.de >= 30 && coverage.en >= 30);
assert.ok(coverage.coldStart >= 20);
assert.ok(coverage.multiGoal >= 20);
assert.ok(coverage.protectedTopic >= 20);
assert.ok(Object.values(coverage.capacities).every((count) => count >= 20));

console.log(
  `Forge Golden Eval passed: ${PROFILE_COUNT} profiles `
  + `(${coverage.de} DE / ${coverage.en} EN), `
  + `${coverage.coldStart} cold starts, ${coverage.multiGoal} multi-goal, `
  + `${coverage.protectedTopic} protected-topic, N=1/2/3 each ${coverage.capacities[1]}.`,
);
