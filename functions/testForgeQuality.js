const assert = require("node:assert/strict");
const { validateForgeBatch, validateForgeCandidate } = require("./forgeQuality");

function quest(id, overrides = {}) {
  const minutes = overrides.estimatedMinutes ?? 20;
  const topics = [
    "Laufplan", "Lesenotiz", "Essensplan", "Schreibtischordnung", "Nachrichtenentwurf",
    "Lernkarten", "Dehnroutine", "Dateiablage", "Budgettabelle", "Redeprobe",
  ];
  const topic = topics[id % topics.length];
  return {
    title: `Erstelle ${topic} ${id} in ${minutes} Minuten`,
    category: ["str", "int", "vit", "agi", "cha"][id % 5],
    difficulty: "normal",
    desc: `Arbeite heute konkret an ${topic} ${id}. Danach liegt das gespeicherte Ergebnis fuer den naechsten Schritt vor.`,
    doneWhen: `Fertig, wenn ${minutes} Minuten an ${topic} gearbeitet und drei Punkte gespeichert wurden.`,
    estimatedMinutes: minutes,
    subQuests: [{ title: `${topic} ${id} vorbereiten` }, { title: `Drei Punkte fuer ${topic} ${id} speichern` }],
    questDNA: {
      version: 1,
      actionKind: "produce",
      contextKind: "any",
      focusMode: minutes > 35 ? "continuous" : "interruptible",
      outcomeKind: "artifact",
      requirements: [],
    },
    ...overrides,
  };
}

const context = { language: "de", activeGoalTitles: ["Halbmarathon"] };
const batch = [
  quest(0, {
    title: "Plane den naechsten Halbmarathon-Schritt",
    desc: "Plane heute den naechsten Trainingsschritt fuer Halbmarathon. Danach liegt ein konkreter Plan fuer den naechsten Lauf vor.",
    doneWhen: "Fertig, wenn drei Trainingspunkte fuer Halbmarathon notiert wurden.",
    estimatedMinutes: 10,
    goalRef: "Halbmarathon",
  }),
  quest(1), quest(2), quest(3, { estimatedMinutes: 30 }), quest(4, { estimatedMinutes: 40 }), quest(5, { estimatedMinutes: 45 }),
];

assert.equal(validateForgeBatch(batch, context).ok, true, "valid six-candidate batch passes");
assert.equal(validateForgeBatch(batch.slice(0, 5), context).reasons.includes("candidate-count"), true);
const nearDuplicateBatch = batch.map((item) => ({ ...item }));
nearDuplicateBatch[2] = {
  ...nearDuplicateBatch[1],
  title: `${nearDuplicateBatch[1].title} heute`,
  category: "cha",
};
assert(validateForgeBatch(nearDuplicateBatch, context).reasons.includes("near-duplicate-quests"));

const external = quest(8, { doneWhen: "Fertig, wenn der Recruiter geantwortet hat." });
assert(validateForgeCandidate(external, context).reasons.includes("external-dependency"));

const unsafe = quest(9, {
  title: "Kauf heute eine Krypto-Aktie",
  desc: "Kauf heute eine Krypto-Aktie. Danach besitzt du die Anlage.",
});
assert(validateForgeCandidate(unsafe, context).reasons.includes("unsafe-content"));
const unsafeTreatment = quest(91, {
  title: "Brich deine Therapie ab",
  desc: "Brich heute deine Therapie ab. Danach ist die Behandlung beendet.",
});
assert(validateForgeCandidate(unsafeTreatment, context).reasons.includes("unsafe-content"));
const unsafeDose = quest(911, {
  title: "Erhoehe deine Insulin-Dosis",
  desc: "Erhoehe heute deine Insulin-Dosis. Danach ist die Medikamentenaenderung dokumentiert.",
});
assert(validateForgeCandidate(unsafeDose, context).reasons.includes("unsafe-content"));
const meta = quest(92, {
  title: "Erledige eine Quest",
  desc: "Erledige heute diese Quest. Danach ist die Systemaufgabe abgeschlossen.",
});
assert(validateForgeCandidate(meta, context).reasons.includes("unsafe-tone-or-meta"));

const shaming = quest(10, {
  desc: "Arbeite jetzt, damit du kein Versager bleibst. Danach hast du deine Strafe erledigt.",
});
assert(validateForgeCandidate(shaming, context).reasons.includes("unsafe-tone-or-meta"));

const mismatch = quest(11, {
  title: "Laufe 45 Minuten",
  desc: "Laufe heute 45 Minuten in ruhigem Tempo. Danach ist der Lauf dokumentiert.",
  doneWhen: "Fertig, wenn du 45 Minuten gelaufen bist.",
  estimatedMinutes: 10,
});
assert(validateForgeCandidate(mismatch, context).reasons.includes("duration-mismatch"));
const hoursMismatch = quest(111, {
  title: "Uebe eine Stunde",
  desc: "Uebe heute eine Stunde am konkreten Abschnitt. Danach ist das Ergebnis dokumentiert.",
  doneWhen: "Fertig, wenn eine Stunde geuebt und drei Punkte notiert wurden.",
  estimatedMinutes: 20,
});
assert(validateForgeCandidate(hoursMismatch, context).reasons.includes("duration-mismatch"));

const trivial = quest(12, {
  title: "Oeffne deine Aufgabenliste",
  desc: "Oeffne heute deine Aufgabenliste. Danach kennst du ihren aktuellen Stand.",
  doneWhen: "Fertig, wenn du die Liste geoeffnet hast.",
  estimatedMinutes: 5,
});
assert(validateForgeCandidate(trivial, context).reasons.includes("trivial-quick-win"));

const safeDoctor = quest(13, {
  title: "Sende eine Terminanfrage an die Arztpraxis",
  desc: "Sende eine Terminanfrage mit zwei moeglichen Zeiten. Danach ist die organisatorische Anfrage dokumentiert.",
  doneWhen: "Fertig, wenn eine Terminanfrage mit zwei Zeiten versendet wurde.",
  estimatedMinutes: 10,
});
assert.equal(validateForgeCandidate(safeDoctor, { language: "de" }).ok, true, "safe administrative health task passes");

const hallucinatedGoal = quest(14, { goalRef: "Ziel: Halbmarathon" });
assert(validateForgeCandidate(hallucinatedGoal, context).reasons.includes("invalid-goal-ref"));

const missingDNA = quest(15, { questDNA: undefined });
assert(validateForgeCandidate(missingDNA, context).reasons.includes("invalid-quest-dna"));
const invalidDNA = quest(16, {
  questDNA: {
    version: 1,
    actionKind: "invented",
    contextKind: "any",
    focusMode: "interruptible",
    outcomeKind: "artifact",
    requirements: [],
  },
});
assert(validateForgeCandidate(invalidDNA, context).reasons.includes("invalid-quest-dna"));

const tooShortTitle = quest(17, { title: "X" });
assert(
  validateForgeCandidate(tooShortTitle, context).reasons.includes("invalid-title-length"),
  "Forge 3 rejects titles shorter than four characters"
);
const tooLongTitle = quest(18, { title: "Erstelle " + "A".repeat(113) });
assert(
  validateForgeCandidate(tooLongTitle, context).reasons.includes("invalid-title-length"),
  "Forge 3 rejects titles longer than 120 characters"
);
const labelWithoutAction = quest(19, { title: "Blaue Uebersicht" });
assert(
  validateForgeCandidate(labelWithoutAction, context).reasons.includes("missing-title-action"),
  "Forge 3 rejects a label without an executable action"
);

const englishQuest = quest(20, {
  title: "Plan the next step",
  desc: "Plan one concrete step today. Save a short note for the follow-up.",
  doneWhen: "Done when one next-step note is saved.",
  subQuests: [{ title: "Choose one next step" }, { title: "Save the next-step note" }],
});
assert.equal(
  validateForgeCandidate(englishQuest, { language: "en" }).ok,
  true,
  "a valid English Forge candidate passes every hard gate"
);
assert.equal(
  validateForgeCandidate({ ...englishQuest, title: "Plan" }, { language: "en" }).ok,
  true,
  "the inclusive four-character title boundary passes"
);

const germanContentForEnglish = quest(21, {
  doneWhen: "Done when one result note is saved.",
});
assert(
  validateForgeCandidate(germanContentForEnglish, { language: "en" }).reasons.includes("wrong-language"),
  "English requests reject predominantly German content"
);
const englishContentForGerman = {
  ...englishQuest,
  doneWhen: "Fertig, wenn eine Ergebnisnotiz gespeichert wurde.",
};
assert(
  validateForgeCandidate(englishContentForGerman, { language: "de" }).reasons.includes("wrong-language"),
  "German requests reject predominantly English content"
);

const passiveReadingDe = quest(22, {
  title: "Lies zehn Minuten im Buch",
  desc: "Lies heute zehn Minuten in deinem Buch. Danach kennst du den gelesenen Abschnitt.",
  doneWhen: "Fertig, wenn zehn Minuten gelesen wurden.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Waehle einen Abschnitt" }, { title: "Lies zehn Minuten" }],
});
assert(
  validateForgeCandidate(passiveReadingDe, { language: "de" }).reasons.includes("trivial-quick-win"),
  "a passive German reading-only quick win is rejected"
);
const readingWithArtifactDe = quest(23, {
  title: "Lies und notiere drei Punkte",
  desc: "Lies heute zehn Minuten in deinem Buch. Notiere danach drei konkrete Punkte aus dem Abschnitt.",
  doneWhen: "Fertig, wenn zehn Minuten gelesen und drei Punkte notiert wurden.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Lies zehn Minuten" }, { title: "Notiere drei konkrete Punkte" }],
});
assert.equal(
  validateForgeCandidate(readingWithArtifactDe, { language: "de" }).ok,
  true,
  "German reading plus a tangible note artifact remains valid"
);

const passiveReadingEn = quest(24, {
  title: "Read for ten minutes",
  desc: "Read one useful chapter for ten minutes today. Stop after the selected section.",
  doneWhen: "Done when ten minutes of reading are completed.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Choose one useful section" }, { title: "Read for ten minutes" }],
});
assert(
  validateForgeCandidate(passiveReadingEn, { language: "en" }).reasons.includes("trivial-quick-win"),
  "a passive English reading-only quick win is rejected"
);
const readingWithArtifactEn = quest(25, {
  title: "Read and record three notes",
  desc: "Read one useful section for ten minutes today. Record three concrete notes for the next step.",
  doneWhen: "Done when ten minutes of reading are completed and three notes are recorded.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Read one useful section" }, { title: "Record three concrete notes" }],
});
assert.equal(
  validateForgeCandidate(readingWithArtifactEn, { language: "en" }).ok,
  true,
  "English reading plus a tangible note artifact remains valid"
);

const externalLikesDe = quest(26, {
  title: "Sende deine Nachricht",
  desc: "Sende heute eine kurze Nachricht an deine Gruppe. Danach kann die Gruppe darauf reagieren.",
  doneWhen: "Fertig, wenn zehn Likes auf deine Nachricht eingegangen sind.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Schreibe die Nachricht" }, { title: "Sende die Nachricht" }],
});
assert(
  validateForgeCandidate(externalLikesDe, { language: "de" }).reasons.includes("external-dependency"),
  "German reach metrics are not user-controlled completion criteria"
);
const externalViewsEn = quest(27, {
  title: "Publish the project update",
  desc: "Publish one short project update today. Keep the final post available for your team.",
  doneWhen: "Done when ten views have been reached.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Write one short update" }, { title: "Publish the final post" }],
});
assert(
  validateForgeCandidate(externalViewsEn, { language: "en" }).reasons.includes("external-dependency"),
  "English reach metrics are not user-controlled completion criteria"
);

const controlledPublishDe = quest(28, {
  title: "Veroeffentliche deinen Entwurf",
  desc: "Veroeffentliche heute einen kurzen Beitrag. Speichere danach den Link fuer deinen naechsten Schritt.",
  doneWhen: "Fertig, wenn ein Beitrag veroeffentlicht wurde.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Pruefe den Entwurf" }, { title: "Veroeffentliche den Beitrag" }],
});
assert.equal(
  validateForgeCandidate(controlledPublishDe, { language: "de" }).ok,
  true,
  "publishing itself remains a user-controlled German outcome"
);
const controlledPublishEn = quest(29, {
  title: "Publish one project update",
  desc: "Publish one short project update today. Save the final post link for the next step.",
  doneWhen: "Done when one project update is published.",
  estimatedMinutes: 10,
  subQuests: [{ title: "Review the short update" }, { title: "Publish the final post" }],
});
assert.equal(
  validateForgeCandidate(controlledPublishEn, { language: "en" }).ok,
  true,
  "publishing itself remains a user-controlled English outcome"
);
console.log("testForgeQuality: all assertions passed");
