import { generateEmergencyQuest } from "../data/helpers.js";

const seen = new Set();
let excludedHit = 0;
let prev = null;
for (let i = 0; i < 200; i++) {
  const state = { settings: { language: "en" }, lastEmergencyTemplateId: prev };
  const q = generateEmergencyQuest(5, state);
  if (!q.templateId) throw new Error("no templateId");
  if (!q.title || q.title.startsWith("quests.")) throw new Error("EN title not resolved: " + q.title);
  if (prev && q.templateId === prev) excludedHit++;
  seen.add(q.templateId);
  prev = q.templateId;
}
if (excludedHit > 0) { console.error(`Exclusion verletzt: ${excludedHit}x Wiederholung`); process.exit(1); }
if (seen.size < 6) { console.error(`Zu wenig Varianz: nur ${seen.size} Templates`); process.exit(1); }
console.log(`✓ Emergency: ${seen.size} distinct templates, keine direkte Wiederholung`);
