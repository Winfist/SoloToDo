const assert = require("node:assert/strict");
const {
  getUniqueWeakestStat,
  sanitizeAIQuestProfile,
  sanitizeForgeModelProfile,
  sanitizeGeneratedAIQuests,
  sanitizeGeneratedQuestDNA,
} = require("./aiQuestProfile");
const { generateForgeMessages, serializeForgeModelProfile } = require("./forgePrompts");
const { buildTextMessages, callGemini } = require("./geminiService");

const rawProfile = {
  activeGoals: [{
    id: "goal-secret-id",
    title: "Halbmarathon",
    category: "str",
    nextMilestone: "Zehn Kilometer laufen",
    resume: {
      recipeKey: "r1|move|outside|standard",
      actionKind: "move",
      outcomeKind: "movement_block",
      secretId: "resume-secret-id",
    },
  }],
  recentCompletedQuests: [{ id: "done-secret-id", title: "PRIVATE_COMPLETED_TITLE", category: "str" }],
  customQuestPatterns: ["PRIVATE_MANUAL_TITLE"],
  activeHabits: [
    { id: "habit-secret-id", title: "Morgenrunde", category: "vit", frequency: "daily" },
    { id: "habit-secret-id-2", title: "Abendroutine", category: "agi", frequency: "weekdays" },
    { id: "habit-secret-id-3", title: "Darf nicht hinein", category: "int", frequency: "weekly" },
  ],
  behaviorSignals: {
    userNotes: ["PRIVATE_DISLIKE_NOTE"],
    recentDislikedTitles: ["PRIVATE_DISLIKED_TITLE"],
    recentExpiredTitles: ["PRIVATE_EXPIRED_TITLE"],
    avoidCategories: ["cha"],
  },
  learning: {
    preferences: [{ recipeKey: "r1|move|outside|quick", value: "prefer", privateId: "learning-secret-id" }],
    patterns: [{ recipeKey: "r1|practice|computer|standard", outcomes: 8, completionBand: "high", reliable: true }],
  },
  stats: { str: 1, int: 2, vit: 3, agi: 4, cha: 5 },
  allowedCategories: ["str", "int", "invalid"],
  loadBand: "high",
};

const full = sanitizeAIQuestProfile(rawProfile);
const minimized = sanitizeForgeModelProfile(rawProfile);
const serialized = JSON.stringify(minimized);
for (const privateValue of [
  "goal-secret-id",
  "resume-secret-id",
  "done-secret-id",
  "habit-secret-id",
  "learning-secret-id",
  "PRIVATE_COMPLETED_TITLE",
  "PRIVATE_MANUAL_TITLE",
  "PRIVATE_DISLIKE_NOTE",
  "PRIVATE_DISLIKED_TITLE",
  "PRIVATE_EXPIRED_TITLE",
  "Darf nicht hinein",
]) {
  assert(!serialized.includes(privateValue), `minimized model profile must omit ${privateValue}`);
}
assert.deepEqual(Object.keys(minimized).sort(), [
  "activeGoals", "activeHabits", "allowedCategories", "learning", "loadBand", "stats",
]);
assert.equal(minimized.activeGoals[0].title, "Halbmarathon");
assert.deepEqual(minimized.activeGoals[0].resume, {
  recipeKey: "r1|move|outside|standard",
  actionKind: "move",
  outcomeKind: "movement_block",
});
assert.deepEqual(minimized.activeHabits, [
  { title: "Morgenrunde", category: "vit", frequency: "daily" },
  { title: "Abendroutine", category: "agi", frequency: "weekdays" },
]);
assert.deepEqual(minimized.allowedCategories, ["str", "int"]);
assert.deepEqual(minimized.stats, rawProfile.stats);
assert.deepEqual(minimized.learning.preferences, [
  { recipeKey: "r1|move|outside|quick", value: "prefer" },
]);
assert.equal(minimized.learning.patterns[0].completionBand, "high");
assert.equal(minimized.loadBand, "high");

const fittedJson = serializeForgeModelProfile(minimized);
assert(fittedJson.length <= 4000);
assert.doesNotThrow(() => JSON.parse(fittedJson));

const messages = generateForgeMessages({
  stats: rawProfile.stats,
  level: 4,
  weakestStat: "str",
  profile: minimized,
  language: "de",
});
assert.equal(typeof messages.system, "string");
assert.equal(typeof messages.user, "string");
assert(messages.system.includes("Nutzerdaten"));
assert(messages.user.includes("exakt 6"));
assert(messages.user.includes("r1|move|outside|quick"));
assert(messages.user.includes('"loadBand":"high"'));
assert(messages.user.includes("Morgenrunde"), "active habit titles are intentional prompt context");
assert(messages.user.includes('"questDNA"'));
assert(messages.user.includes("message_sent"));
assert(!messages.user.includes("PRIVATE_"));
const chat = buildTextMessages(messages);
assert.deepEqual(chat.map((message) => message.role), ["system", "user"]);

assert.equal(full.activeGoals[0].title, "Halbmarathon");
assert.equal(getUniqueWeakestStat({ str: 0, int: 0, vit: 0, agi: 0, cha: 0 }), null);
assert.equal(getUniqueWeakestStat({ str: 0, int: 1, vit: 2, agi: 2, cha: 2 }), "str");

const dna = {
  version: 1,
  actionKind: "produce",
  contextKind: "computer",
  focusMode: "interruptible",
  outcomeKind: "artifact",
  requirements: ["computer", "computer"],
};
assert.deepEqual(sanitizeGeneratedQuestDNA(dna), {
  ...dna,
  requirements: ["computer"],
});
assert.equal(sanitizeGeneratedQuestDNA({ ...dna, version: 2 }), null);
assert.equal(sanitizeGeneratedQuestDNA({ ...dna, version: "1" }), null);
assert.equal(sanitizeGeneratedQuestDNA({ ...dna, requirements: ["camera"] }), null);

const sanitized = sanitizeGeneratedAIQuests([{ title: "Quest", questDNA: dna }], { limit: 6 });
assert.deepEqual(sanitized[0].questDNA.requirements, ["computer"]);
const withoutInvalidDNA = sanitizeGeneratedAIQuests([{
  title: "Invalid DNA", questDNA: { ...dna, actionKind: "invented" },
}], { limit: 6 });
assert.equal(withoutInvalidDNA[0].questDNA, undefined);

const six = sanitizeGeneratedAIQuests(
  Array.from({ length: 8 }, (_, index) => ({ title: `Quest ${index}` })),
  { limit: 6 },
);
assert.equal(six.length, 6);
assert.equal(sanitizeGeneratedAIQuests(
  Array.from({ length: 8 }, (_, index) => ({ title: `Quest ${index}` })),
).length, 3);

(async () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const logged = [];
  process.env.OPENROUTER_API_KEY = "test-key";
  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { message: "RAW_PROVIDER_SECRET" } }),
  });
  console.error = (...args) => logged.push(args.join(" "));
  let caught = null;
  try {
    await callGemini({ system: "system", user: "user" }, {
      maxAttempts: 1,
      redactErrors: true,
    });
  } catch (error) {
    caught = error;
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
  }
  assert(caught);
  assert.equal(String(caught.message).includes("RAW_PROVIDER_SECRET"), false);
  assert.equal(logged.join(" ").includes("RAW_PROVIDER_SECRET"), false);
  assert(logged.some((entry) => entry.includes("HTTP 500")));

  console.log("testForgePrivacy: all assertions passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
