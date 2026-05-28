// ─── LIFE DOMAINS (Wege) ──────────────────────────────────────
// Single source of truth for the mapping between a hunter's chosen
// life domains and the stat categories used by the quest pool.
// IDs must stay in sync with the buttons in LifeDomainsOnboarding.jsx.

export const DOMAIN_IDS = [
  "fitness", "knowledge", "health", "career",
  "social", "dating", "finance", "mindset",
];

// Quest pool categories are stats: str / int / vit / agi / cha.
export const DOMAIN_TO_STATS = {
  fitness: ["str", "vit", "agi"],
  knowledge: ["int"],
  health: ["vit"],
  career: ["int", "cha"],
  social: ["cha"],
  dating: ["cha", "int"],
  finance: ["int"],
  mindset: ["vit", "int"],
};

// Returns the unique stat categories that the given chosen domains map to.
export function getFocusStats(domains) {
  const stats = new Set();
  (domains || []).forEach((d) => {
    (DOMAIN_TO_STATS[d] || []).forEach((s) => stats.add(s));
  });
  return [...stats];
}
