import { generateRedemptionQuests } from "../data/protocolHelpers.js";

const qs = generateRedemptionQuests(10, { settings: { language: "de" } });
const cats = qs.map(q => q.category);
const expect = ["str", "int", "vit", "agi", "cha"];
if (qs.length !== 5) { console.error(`erwartet 5, ist ${qs.length}`); process.exit(1); }
if (JSON.stringify(cats) !== JSON.stringify(expect)) { console.error("Kategorien falsch: " + cats); process.exit(1); }
if (qs.some(q => !q.title || q.title.startsWith("quests."))) { console.error("Titel nicht lokalisiert"); process.exit(1); }
console.log("✓ Redemption: 5 Stats, lokalisiert");
