const assert = require("node:assert/strict");
const { sanitizeGeneratedAIQuests } = require("./aiQuestProfile");
const { collectForgeCandidates, ForgeGenerationError } = require("./forgeGeneration");

function questDNA(minutes = 20) {
  return {
    version: 1,
    actionKind: "produce",
    contextKind: "computer",
    focusMode: minutes > 35 ? "continuous" : "interruptible",
    outcomeKind: "artifact",
    requirements: ["computer"],
  };
}

function candidate(index, overrides = {}) {
  const minutes = index === 0 ? 10 : 20 + (index % 20);
  const topics = [
    "interview outline", "walking route", "meal plan", "desk layout", "message draft",
    "lesson review", "stretch routine", "file archive", "budget table", "speech rehearsal",
  ];
  const topic = topics[index % topics.length];
  return {
    title: `Complete ${topic} ${index}`,
    category: ["str", "int", "vit", "agi", "cha"][index % 5],
    difficulty: "normal",
    desc: `Work on the ${topic} for a concrete result. Save the finished ${topic} record for the next action.`,
    doneWhen: `Done when ${minutes} minutes are completed and the ${topic} result is saved.`,
    estimatedMinutes: minutes,
    questDNA: questDNA(minutes),
    subQuests: [
      { title: `Prepare the ${topic} material ${index}` },
      { title: `Complete and save the ${topic} result ${index}` },
    ],
    ...overrides,
  };
}

const parseResponse = (raw) => JSON.parse(raw);
const context = { language: "en", activeGoalTitles: [] };

function assertMeta(meta, { requestedCount, validCount, attemptCount, outcome }) {
  assert.equal(meta.policyVersion, "forge-3.0");
  assert.equal(meta.requestedCount, requestedCount);
  assert.equal(meta.validCount, validCount);
  assert.equal(meta.attemptCount, attemptCount);
  assert.equal(meta.outcome, outcome);
}

async function run(outputs, {
  requestedCount = 6,
  runContext = context,
  qualityMode = "forge-3.0",
} = {}) {
  let calls = 0;
  const messageInputs = [];
  const result = await collectForgeCandidates({
    callProvider: async (messages, options) => {
      assert.deepEqual(options, { maxAttempts: 1 });
      messageInputs.push(messages);
      const output = outputs[calls] || [];
      calls += 1;
      return JSON.stringify({ quests: output });
    },
    createMessages: (input) => {
      messageInputs.push({ input });
      return { system: "system", user: JSON.stringify(input) };
    },
    parseResponse,
    sanitizeCandidates: sanitizeGeneratedAIQuests,
    context: runContext,
    requestedCount,
    qualityMode,
  });
  return { result, calls, messageInputs };
}

async function expectGenerationError(factory, expectedReason) {
  let caught = null;
  try {
    await factory();
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof ForgeGenerationError);
  assert.equal(caught.reason, expectedReason);
  return caught;
}

(async () => {
  const oneCall = await run([[0, 1, 2, 3, 4, 5].map(candidate)]);
  assert.equal(oneCall.calls, 1);
  assert.equal(oneCall.result.quests.length, 6);
  assertMeta(oneCall.result.meta, {
    requestedCount: 6, validCount: 6, attemptCount: 1, outcome: "complete",
  });

  const first = [
    candidate(0), candidate(1), candidate(2), candidate(3),
    candidate(90, { doneWhen: "Done when you feel ready." }),
    candidate(91, { questDNA: { ...questDNA(), actionKind: "invented" } }),
  ];
  const recovered = await run([first, [4, 5, 6, 7, 8, 9].map(candidate)]);
  assert.equal(recovered.calls, 2);
  assert.equal(recovered.result.quests.length, 6);
  assert(recovered.result.meta.rejectedCandidateCount >= 2);
  assertMeta(recovered.result.meta, {
    requestedCount: 6, validCount: 6, attemptCount: 2, outcome: "complete",
  });

  for (let validCount = 1; validCount <= 5; validCount += 1) {
    const partial = await run([
      [
        candidate(80 + validCount, { doneWhen: "Done when you feel ready." }),
        ...Array.from({ length: validCount }, (_, index) => candidate(index)),
      ],
      [],
    ]);
    assert.equal(partial.calls, 2);
    assert.equal(partial.result.quests.length, validCount);
    assert(partial.result.meta.rejectedCandidateCount >= 1);
    assertMeta(partial.result.meta, {
      requestedCount: 6, validCount, attemptCount: 2, outcome: "partial",
    });
  }

  const empty = await expectGenerationError(() => run([[], []]), "empty");
  assertMeta(empty.meta, {
    requestedCount: 6, validCount: 0, attemptCount: 2, outcome: "empty",
  });

  let qualityCalls = 0;
  const quality = await expectGenerationError(() => collectForgeCandidates({
    callProvider: async () => {
      qualityCalls += 1;
      return JSON.stringify({
        quests: [candidate(qualityCalls, { doneWhen: "Done when you feel ready." })],
      });
    },
    createMessages: () => ({ system: "s", user: "u" }),
    parseResponse,
    sanitizeCandidates: sanitizeGeneratedAIQuests,
    context,
  }), "quality_rejected");
  assert.equal(qualityCalls, 2);
  assertMeta(quality.meta, {
    requestedCount: 6, validCount: 0, attemptCount: 2, outcome: "empty",
  });

  let malformedCalls = 0;
  const malformedRecovery = await collectForgeCandidates({
    callProvider: async () => {
      malformedCalls += 1;
      return malformedCalls === 1
        ? "{not-json"
        : JSON.stringify({ quests: [0, 1, 2, 3, 4, 5].map(candidate) });
    },
    createMessages: () => ({ system: "s", user: "u" }),
    parseResponse,
    sanitizeCandidates: sanitizeGeneratedAIQuests,
    context,
  });
  assert.equal(malformedCalls, 2);
  assert.equal(malformedRecovery.meta.rejectionCounts["invalid-provider-response"], 1);
  assertMeta(malformedRecovery.meta, {
    requestedCount: 6, validCount: 6, attemptCount: 2, outcome: "complete",
  });

  let unsafeCalls = 0;
  const unsafe = await expectGenerationError(() => collectForgeCandidates({
    callProvider: async () => {
      unsafeCalls += 1;
      return JSON.stringify({
        quests: [0, 1, 2, 3, 4, 5].map((index) => candidate(index, {
          title: `Buy crypto stock ${index}`,
          desc: `Buy crypto stock ${index} today. Save the investment position for later.`,
        })),
      });
    },
    createMessages: () => ({ system: "s", user: "u" }),
    parseResponse,
    sanitizeCandidates: sanitizeGeneratedAIQuests,
    context,
  }), "safety_rejected");
  assert.equal(unsafeCalls, 2);
  assertMeta(unsafe.meta, {
    requestedCount: 6, validCount: 0, attemptCount: 2, outcome: "empty",
  });

  const three = await run([[0, 1, 2, 3, 4, 5].map(candidate)], { requestedCount: 3 });
  assert.equal(three.calls, 1);
  assert.equal(three.result.quests.length, 3);
  assert(three.messageInputs.some((entry) => entry.input?.requestedCount === 3));
  assertMeta(three.result.meta, {
    requestedCount: 3, validCount: 3, attemptCount: 1, outcome: "complete",
  });

  const timedCandidate = (index, minutes, overrides = {}) => candidate(index, {
    estimatedMinutes: minutes,
    doneWhen: `Done when ${minutes} minutes are completed and the result is saved.`,
    questDNA: questDNA(minutes),
    ...overrides,
  });

  const rescuedCore = await run([
    Array.from({ length: 6 }, (_, index) => timedCandidate(index + 20, 45 + index)),
    [
      timedCandidate(100, 10, {
        title: "Photograph five pantry labels",
        desc: "Photograph five pantry labels for a compact inventory. Save the images in one dedicated album.",
        doneWhen: "Done when 10 minutes are completed and five pantry label photos are saved.",
        subQuests: [{ title: "Choose five pantry items" }, { title: "Photograph and save every label" }],
      }),
      timedCandidate(101, 25, {
        title: "Sketch a balcony planting map",
        desc: "Sketch a small balcony planting map with three positions. Save the map beside the seed list.",
        doneWhen: "Done when 25 minutes are completed and three planting positions are marked.",
        subQuests: [{ title: "Mark the balcony dimensions" }, { title: "Draw and save three plant positions" }],
      }),
    ],
  ]);
  assert.equal(rescuedCore.calls, 2, "missing core duties trigger exactly one quality retry");
  assert.equal(rescuedCore.result.meta.outcome, "complete");
  assert(rescuedCore.result.meta.rejectionCounts["missing-quick-win"] >= 1);
  assert.equal(
    rescuedCore.result.quests.filter((quest) => quest.estimatedMinutes <= 35).length >= 2,
    true,
  );

  const noCore = await expectGenerationError(() => run([
    Array.from({ length: 6 }, (_, index) => timedCandidate(index + 30, 45 + index)),
    Array.from({ length: 6 }, (_, index) => timedCandidate(index + 60, 50 + index)),
  ]), "quality_rejected");
  assert.equal(noCore.meta.attemptCount, 2);
  assert(noCore.meta.rejectionCounts["missing-quick-win"] >= 1);

  const goalTitle = "Launch portfolio";
  const goalContext = { language: "en", activeGoalTitles: [goalTitle] };
  const goalQuest = timedCandidate(120, 25, {
    title: "Publish the portfolio landing page",
    goalRef: goalTitle,
    desc: `Publish one concrete section for ${goalTitle}. Save the finished section for the next milestone.`,
  });
  const rescuedGoal = await run([
    [0, 1, 2, 3, 4, 5].map(candidate),
    [goalQuest],
  ], { runContext: goalContext });
  assert.equal(rescuedGoal.calls, 2);
  assert(rescuedGoal.result.quests.some((quest) => quest.goalRef === goalTitle));
  assert(rescuedGoal.result.meta.rejectionCounts["missing-active-goal"] >= 1);

  const missingGoal = await expectGenerationError(() => run([
    [0, 1, 2, 3, 4, 5].map(candidate),
    [6, 7, 8, 9, 10, 11].map(candidate),
  ], { runContext: goalContext }), "quality_rejected");
  assert(missingGoal.meta.rejectionCounts["missing-active-goal"] >= 1);

  const impossibleSingle = await expectGenerationError(() => run([
    [
      timedCandidate(130, 45, {
        goalRef: goalTitle,
        desc: `Complete a deep work block for ${goalTitle}. Save the finished artifact for the next milestone.`,
      }),
      timedCandidate(131, 10),
    ],
    [],
  ], {
    requestedCount: 1,
    runContext: goalContext,
  }), "quality_rejected");
  assert.equal(impossibleSingle.meta.validCount, 0);

  const legacyWithoutDNA = await run([
    [0, 1, 2].map((index) => candidate(index, { questDNA: undefined })),
  ], {
    requestedCount: 3,
    qualityMode: "forge-2.2",
  });
  assert.equal(legacyWithoutDNA.result.quests.length, 3);
  assert.equal(legacyWithoutDNA.result.quests[0].questDNA, undefined);
  console.log("testForgeGeneration: all assertions passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
