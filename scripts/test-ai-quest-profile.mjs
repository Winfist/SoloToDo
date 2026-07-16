import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildAIQuestProfile, buildAIQuestRequest } from "../data/aiQuestProfile.js";

const require = createRequire(import.meta.url);
const { sanitizeAIQuestProfile, sanitizeGeneratedAIQuests } = require("../functions/aiQuestProfile.js");
const { GENERATE_QUESTS_PROMPT } = require("../functions/geminiPrompts.js");

const state = {
  hunterName: "Must not leave the client",
  email: "private@example.com",
  lifeDomains: ["fitness", "career", "mindset", "bogus", "fitness"],
  stats: { str: 9, int: 3, vit: 7, agi: 6, cha: 8, injected: 999 },
  level: 12,
  quests: [
    { title: "Prepare interview notes", category: "int" },
    { title: "System patrol", category: "str", isSystem: true },
  ],
  completedQuests: [
    {
      title: "Run 5 km",
      category: "str",
      difficulty: "normal",
      notes: "private completion notes",
      actualDurationMs: 32 * 60000,
      feltDifficulty: "challenging",
    },
    {
      title: "Review budget",
      category: "int",
      difficulty: "easy",
      categoryFeedback: "good fit",
    },
  ],
  customQuestPool: {
    recentlyUsed: ["Prepare interview notes", "Call recruiter", "Call recruiter"],
  },
  goals: [
    {
      title: "Land a stronger role",
      category: "career",
      description: "private goal description",
      milestones: [
        { title: "Update portfolio", completed: true },
        { title: "Send three applications", completed: false },
      ],
    },
  ],
  habits: [
    {
      title: "Morning mobility",
      category: "fitness",
      frequency: "daily",
      active: true,
      currentStreak: 4,
      totalCompletions: 18,
      history: { "2026-06-01": true },
    },
  ],
  focus: {
    totalMinutes: 440,
    totalSessions: 16,
    daily: {
      "2026-05-25": { totalMinutes: 5000 },
      "2026-05-26": { totalMinutes: 20 },
      "2026-05-27": { totalMinutes: 30 },
      "2026-05-28": { totalMinutes: 40 },
      "2026-05-29": { totalMinutes: 50 },
      "2026-05-30": { totalMinutes: 60 },
      "2026-05-31": { totalMinutes: 70 },
      "2026-06-01": { totalMinutes: 80 },
    },
    recentSessions: [{ title: "private raw session" }],
  },
  screenTime: { totalMinutes: 999 },
};

const profile = buildAIQuestProfile(state);
assert.deepEqual(profile.lifeDomains, ["fitness", "career", "mindset"]);
assert.deepEqual(profile.focusStats, ["str", "vit", "agi", "int", "cha"]);
assert.equal(profile.categoryCompletions.str, 1);
assert.equal(profile.recentCompletedQuests[0].title, "Review budget");
assert.equal(profile.recentCompletedQuests[1].actualDurationMinutes, 32);
assert.deepEqual(profile.customQuestPatterns, ["Prepare interview notes", "Review budget", "Run 5 km", "Call recruiter"]);
assert.equal(profile.activeGoals[0].nextMilestone, "Send three applications");
assert.equal(profile.activeHabits[0].currentStreak, 4);
assert.equal(profile.focusSummary.recentMinutes, 350);

const serializedProfile = JSON.stringify(profile);
for (const privateValue of [
  "Must not leave the client",
  "private@example.com",
  "private completion notes",
  "private goal description",
  "private raw session",
  "999",
]) {
  assert(!serializedProfile.includes(privateValue), `profile must omit private value: ${privateValue}`);
}

const request = buildAIQuestRequest(state, "en");
assert.deepEqual(Object.keys(request.stats), ["str", "int", "vit", "agi", "cha"]);
assert.equal(request.weakestStat, "int");
assert.equal(request.language, "en");

const safeProfile = sanitizeAIQuestProfile({
  ...profile,
  lifeDomains: [...profile.lifeDomains, "bogus"],
  customQuestPatterns: Array.from({ length: 12 }, (_, index) => `Pattern ${index}`),
  activeHabits: [{ title: "A".repeat(200), currentStreak: 99999 }],
});
assert.deepEqual(safeProfile.lifeDomains, ["fitness", "career", "mindset"]);
assert.equal(safeProfile.customQuestPatterns.length, 8);
assert.equal(safeProfile.activeHabits[0].title.length, 140);
assert.equal(safeProfile.activeHabits[0].currentStreak, 10000);

const prompt = GENERATE_QUESTS_PROMPT(request.stats, request.level, request.weakestStat, request.recentQuests, safeProfile, "en");
assert(prompt.includes("untrusted user-authored data"));
assert(prompt.includes("fitness"));
assert(prompt.includes("Pattern 0"));
assert(prompt.includes("At least 1 Quest must train the weakest stat"));
assert(prompt.includes('exact title in "goalRef"'));

const generatedQuests = sanitizeGeneratedAIQuests([
  { title: { invalid: true }, category: "invalid", difficulty: "boss", desc: "no string title" },
  { title: "Second", category: "invalid", difficulty: "boss", desc: "D".repeat(600), subQuests: [{ title: "" }, { title: "Step" }] },
  { title: "Third" },
  { title: "Fourth" },
]);
// Neuer Kontrakt (Task 2): titellose Quests werden verworfen, kein "System-Quest"-Fallback mehr.
// slice(0,3) kappt "Fourth", der Titel-lose Eintrag faellt raus -> 2 Quests bleiben.
assert.equal(generatedQuests.length, 2);
assert(!generatedQuests.some((quest) => quest.title === "System-Quest"));
assert.equal(generatedQuests[0].title, "Second");
assert.equal(generatedQuests[0].category, "str");
assert.equal(generatedQuests[0].difficulty, "normal");
assert.equal(generatedQuests[0].desc.length, 500);
assert.deepEqual(generatedQuests[0].subQuests, [{ title: "Step" }]);

// ── behaviorSignals (Spec §7) ──
const sigDays = {};
for (let i = 10; i <= 17; i++) sigDays[`2026-07-${i}`] = { opens: 1, actions: i % 2 === 0 ? 0 : 1 };
const sigState = {
  questSignals: {
    byCategory: { vit: { assigned: 10, completed: 1, expired: 9, liked: 0, disliked: 0 } },
    completionHours: { morgen: 8, mittag: 1, abend: 1, nacht: 0 },
    completionWeekdays: [0, 0, 0, 0, 0, 0, 0],
    recentExpired: Array.from({ length: 8 }, (_, i) => ({ title: `Verfallen ${i}`, category: "vit", date: "2026-07-10" })),
    recentDisliked: [
      { questId: "a", title: "Meditiere 20 Minuten", category: "vit", note: "Meditation ist nichts fuer mich", date: "2026-07-11" },
      { questId: "b", title: "Kalt duschen", category: "vit", note: "", date: "2026-07-10" },
    ],
  },
  sessionSignals: { days: sigDays },
};
const sigProfile = buildAIQuestProfile(sigState);
assert(sigProfile.behaviorSignals.bestTime === "morgen", "bestTime im Profil");
assert(sigProfile.behaviorSignals.avoidCategories.includes("vit"), "avoidCategories im Profil");
assert(sigProfile.behaviorSignals.ghostDaysLast14 === 4, "ghostDays im Profil");
assert(sigProfile.behaviorSignals.recentExpiredTitles.length === 5, "expiredTitles Deckel 5");
assert(sigProfile.behaviorSignals.userNotes[0] === "Meditation ist nichts fuer mich" && sigProfile.behaviorSignals.userNotes.length === 1, "nur nicht-leere Notizen, max 3");
assert(buildAIQuestProfile({}).behaviorSignals.bestTime === null, "leerer State -> neutrale Signals");

console.log("test-ai-quest-profile: all assertions passed.");
