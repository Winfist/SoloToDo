import {
  DEFAULT_FORGE,
  acceptProposals,
  clearPendingSet,
  createPendingSet,
  compileLegacyForgeSet,
  getSelectableCount,
  isPendingSetValid,
  normalizeForgeState,
  recommendForgeSet,
} from "../data/forge.js";
import { DEFAULT_STATE } from "../data/defaultState.js";

let failures = 0;
const check = (condition, message) => {
  if (!condition) {
    console.error(`✗ ${message}`);
    failures += 1;
  }
};
const equal = (actual, expected, message) => check(
  JSON.stringify(actual) === JSON.stringify(expected),
  `${message} (got ${JSON.stringify(actual)})`,
);

const TODAY = "2026-07-18";
const proposal = (id, title, overrides = {}) => ({
  id: `sys_ai_${id}`,
  title,
  category: "str",
  difficulty: "normal",
  estimatedMinutes: 20,
  type: "daily",
  isSystem: true,
  aiGenerated: true,
  subQuests: [],
  createdAt: TODAY,
  dueDate: TODAY,
  ...overrides,
});
const poolDaily = (id) => ({
  id,
  templateId: `t_${id}`,
  title: `Pool ${id}`,
  category: "int",
  type: "daily",
  isSystem: true,
});

// ── Pending-Set / Tombstone ───────────────────────────────────────────────
const set = createPendingSet([
  proposal("a", "A"), proposal("b", "B"), proposal("c", "C"), proposal("d", "D"),
], { source: "manual", today: TODAY, nowMs: 111 });
check(set.proposals.length === 3, "maximal drei Vorschläge");
check(set.proposals.every((quest) => quest.origin === "forge"), "origin forge gestempelt");
check(set.date === TODAY && set.generatedAtMs === 111 && set.source === "manual", "Metadaten gesetzt");
check(typeof set.id === "string" && set.id.startsWith("forge_"), "Pending-ID gesetzt");
equal(
  createPendingSet([proposal("a", "A")], { today: TODAY, nowMs: 111 }).id,
  createPendingSet([proposal("a", "A")], { today: TODAY, nowMs: 111 }).id,
  "Pending-ID ist für denselben Set-Inhalt deterministisch",
);
check(
  createPendingSet([proposal("a", "A")], { today: TODAY, nowMs: 112 }).id !== set.id,
  "neue Generierung erhält andere Pending-ID",
);

const legacyForge = normalizeForgeState({
  pending: { proposals: [proposal("legacy", "Legacy")], date: TODAY, generatedAtMs: 77, source: "auto" },
});
check(legacyForge.updatedAtMs === 77, "Legacy-Pending migriert generatedAtMs zu updatedAtMs");
check(Boolean(legacyForge.pending.id), "Legacy-Pending erhält deterministische ID");
equal(normalizeForgeState(null), DEFAULT_FORGE, "fehlendes Forge-Feld normalisiert zum Default");

const withPending = { forge: { pending: set, updatedAtMs: 111 } };
check(isPendingSetValid(withPending, TODAY), "Pending am selben Tag gültig");
check(!isPendingSetValid(withPending, "2026-07-19"), "Pending am Folgetag abgelaufen");
check(!isPendingSetValid({}, TODAY), "kein Pending ist ungültig");
check(!isPendingSetValid({ forge: { pending: { ...set, proposals: [] } } }, TODAY), "leeres Pending ist ungültig");
const cleared = clearPendingSet(withPending, { nowMs: 150 });
check(cleared.forge.pending === null && cleared.forge.updatedAtMs === 150, "Clear setzt Tombstone-Zeit");
check(clearPendingSet({}, { nowMs: 999 }).forge.updatedAtMs === 0, "leerer No-op erzeugt keinen künstlichen Tombstone");

// ── Kapazität ─────────────────────────────────────────────────────────────
const baseState = {
  settings: { questIntensity: "baby_gate" },
  premium: { tier: "free", status: "inactive" },
  quests: [poolDaily("p1"), poolDaily("p2")],
};
check(getSelectableCount(baseState) === 1, "Free: ein Slot trotz zwei freier Dailies");
check(getSelectableCount({ ...baseState, quests: [] }) === 0, "keine freie Daily ergibt null Slots");
check(
  getSelectableCount({ ...baseState, quests: [{ ...poolDaily("p1"), completed: true }] }) === 0,
  "angefasste Daily ist kein Tauschziel",
);
const proCapacityState = {
  settings: { questIntensity: "monarch_call" },
  premium: { tier: "hunter_pro", status: "active", activeUntil: new Date(Date.now() + 86400000).toISOString() },
  quests: [1, 2, 3, 4, 5].map((id) => poolDaily(`pd${id}`)),
};
check(getSelectableCount(proCapacityState) === 3, "Kapazität bleibt auf Loadout-Cap drei begrenzt");

// ── Deterministische Empfehlung ohne Score-Gewichte ──────────────────────
const rankingState = {
  stats: { str: 4, int: 3, vit: 0, agi: 2, cha: 1 },
  goals: [{ title: "Halbmarathon", milestones: [{ title: "5 km", completed: false }] }],
  questSignals: { byCategory: {}, recentDisliked: [], recentExpired: [] },
  sessionSignals: { days: {} },
};
const goalQuest = proposal("goal", "Ziel-Sprint", { category: "str", estimatedMinutes: 60, goalRef: "Halbmarathon" });
const quickQuest = proposal("quick", "Kurzer Start", { category: "agi", estimatedMinutes: 10 });
const weakQuest = proposal("weak", "Vitalität", { category: "vit", estimatedMinutes: 25 });
const neutralRank = recommendForgeSet(rankingState, [quickQuest, weakQuest, goalQuest], 1);
equal(neutralRank.orderedIds, [goalQuest.id, weakQuest.id, quickQuest.id], "neutral: aktives Ziel, danach schwächster Stat");
equal(neutralRank.recommendedIds, [goalQuest.id], "selectableCount begrenzt Empfehlungen");
equal(neutralRank.reasonsById[goalQuest.id], { key: "active_goal", params: { goalTitle: "Halbmarathon" } }, "Ziel-Grund ist UI-fähig");
equal(neutralRank.reasonsById[quickQuest.id], { key: "quick_win", params: {} }, "Quick-Win-Grund ist UI-fähig");
equal(neutralRank.reasonsById[weakQuest.id], { key: "weakest_stat", params: { category: "vit" } }, "Weakest-Stat-Grund ist UI-fähig");

const negativeRank = recommendForgeSet({
  ...rankingState,
  questSignals: { ...rankingState.questSignals, recentDisliked: [{ title: "  ZIEL sprint! " }] },
}, [goalQuest, quickQuest], 1);
equal(negativeRank.orderedIds, [quickQuest.id, goalQuest.id], "exakter negativer Titel demotiert sogar Zielbezug");
check(negativeRank.reasonsById[goalQuest.id] === undefined, "demotierter negativer Vorschlag zeigt keinen positiven Grund");

const avoidedRank = recommendForgeSet({
  ...rankingState,
  questSignals: {
    ...rankingState.questSignals,
    byCategory: { str: { assigned: 5, completed: 0, liked: 0, disliked: 0 } },
  },
}, [goalQuest, quickQuest], 1);
equal(avoidedRank.orderedIds, [quickQuest.id, goalQuest.id], "vermiedene Kategorie ist hartes Demotionsflag");
check(avoidedRank.reasonsById[goalQuest.id] === undefined, "gemiedene Kategorie zeigt keinen positiven Grund");

const ghostDays = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [
  `2026-07-${String(index + 1).padStart(2, "0")}`,
  { opens: 1, actions: 0 },
]));
const strugglingState = { ...rankingState, sessionSignals: { days: ghostDays } };
const strugglingRank = recommendForgeSet(strugglingState, [goalQuest, quickQuest, weakQuest], 2);
equal(strugglingRank.recommendedIds, [quickQuest.id, goalQuest.id], "struggling: 5–15-Minuten-Quick-Win vor Ziel");

const diversityA = proposal("div_a", "A", { category: "int", estimatedMinutes: 10 });
const diversityB = proposal("div_b", "B", { category: "int", estimatedMinutes: 15 });
const diversityC = proposal("div_c", "C", { category: "vit", estimatedMinutes: 30 });
const diversityState = {
  stats: { str: 2, int: 2, vit: 2, agi: 2, cha: 0 },
  questSignals: { byCategory: {}, recentDisliked: [], recentExpired: [] },
};
const diversityRank = recommendForgeSet(diversityState, [diversityA, diversityB, diversityC], 2);
equal(diversityRank.recommendedIds, [diversityA.id, diversityC.id], "zweiter Slot bevorzugt Kategorie-Diversität");
const goalDiversityRank = recommendForgeSet(strugglingState, [
  diversityA,
  proposal("same_goal", "Ziel in gleicher Kategorie", { category: "int", estimatedMinutes: 20, goalRef: "Halbmarathon" }),
  proposal("novel", "Andere Kategorie", { category: "vit", estimatedMinutes: 20 }),
], 2);
equal(goalDiversityRank.recommendedIds, [diversityA.id, "sys_ai_same_goal"], "Diversität verdrängt keinen Zielbezug");

const preferenceState = {
  stats: { str: 0, int: 2, vit: 2, agi: 2, cha: 2 },
  questSignals: {
    byCategory: {
      int: { assigned: 5, completed: 3, liked: 3, disliked: 0 },
      cha: { assigned: 5, completed: 4, liked: 0, disliked: 0 },
    },
    recentDisliked: [],
    recentExpired: [],
  },
};
const likedQuest = proposal("liked", "Liked", { category: "int", estimatedMinutes: 40 });
const reliableQuest = proposal("reliable", "Reliable", { category: "cha", estimatedMinutes: 40 });
const plainQuest = proposal("plain", "Plain", { category: "agi", estimatedMinutes: 40 });
const preferenceRank = recommendForgeSet(preferenceState, [plainQuest, reliableQuest, likedQuest], 3);
equal(preferenceRank.orderedIds, [likedQuest.id, reliableQuest.id, plainQuest.id], "liked vor reliable vor neutral");
check(preferenceRank.reasonsById[likedQuest.id] === undefined, "Liked-Signal beeinflusst das Ranking ohne unbelegten UI-Grund");
equal(preferenceRank.reasonsById[reliableQuest.id], { key: "reliable_category", params: { category: "cha" } }, "Reliable-Grund mit Kategorie");
equal(recommendForgeSet({}, [plainQuest, likedQuest], 0).recommendedIds, [], "null Slots ergeben keine Empfehlung");

const coldStartRank = recommendForgeSet({
  stats: { str: 0, int: 0, vit: 0, agi: 0, cha: 0 },
  questSignals: { byCategory: {}, recentDisliked: [], recentExpired: [] },
}, [plainQuest, likedQuest], 2);
equal(coldStartRank.orderedIds, [plainQuest.id, likedQuest.id], "Cold Start bewahrt ohne Signal die stabile Ursprungsreihenfolge");
check(Object.keys(coldStartRank.reasonsById).length === 0, "Cold Start erfindet keinen schwächsten Stat oder Personalisierungsgrund");


const legacyCompiled = compileLegacyForgeSet(baseState, [goalQuest, quickQuest, weakQuest, plainQuest]);
check(legacyCompiled.composition.compilerVersion === "legacy", "Kill-Switch nutzt den echten 2.2-Compiler");
check(legacyCompiled.composition.proposals.length === 3, "2.2-Kill-Switch begrenzt den Batch auf drei Karten");
check(legacyCompiled.composition.recommendedIds.length === 1, "2.2-Kill-Switch respektiert die aktuelle Kapazitaet");
check(legacyCompiled.composition.status === "ready", "drei Legacy-Kandidaten ergeben ready");
const legacyPendingFromCompiler = createPendingSet(legacyCompiled.composition.proposals, {
  today: TODAY,
  nowMs: 190,
  composition: legacyCompiled.composition,
});
check(legacyPendingFromCompiler.qualityPolicyVersion === "forge-2.2", "Legacy-Compiler erzeugt ein echtes 2.2-Pending");
const legacyPreview = compileLegacyForgeSet({ ...baseState, quests: [] }, [goalQuest, quickQuest, weakQuest]);
check(legacyPreview.composition.recommendedIds.length === 0, "2.2-Kill-Switch zeigt bei N=0 nur Preview-Karten");
equal(legacyPreview.composition.previewIds, legacyPreview.composition.orderedIds, "N=0 behaelt alle Legacy-Vorschlaege sichtbar");
const legacyPartial = compileLegacyForgeSet(baseState, [quickQuest, weakQuest]);
check(legacyPartial.composition.status === "partial", "Legacy-Fallback fuellt zwei Kandidaten nicht kuenstlich auf");
// ── Atomare Annahme ──────────────────────────────────────────────────────
const acceptPending = createPendingSet([
  proposal("a", "A"), proposal("b", "B"), proposal("c", "C"),
], { source: "manual", today: TODAY, nowMs: 100 });
const acceptState = {
  ...baseState,
  quests: [poolDaily("p1"), poolDaily("p2"), { id: "own", title: "Eigene", type: "daily", isSystem: false }],
  forge: { pending: acceptPending, updatedAtMs: 100 },
};
const result = acceptProposals(acceptState, {
  pendingId: acceptPending.id,
  proposalIds: ["sys_ai_a"],
}, { today: TODAY, nowMs: 222 });
check(result.reason === null && result.acceptedCount === 1 && result.selectableCount === 1, "Erfolg liefert Vertragsfelder");
equal(result.acceptedIds, ["sys_ai_a"], "Erfolg liefert acceptedIds");
check(result.state.quests.some((quest) => quest.id === "sys_ai_a" && quest.origin === "forge"), "Vorschlag ersetzt Daily");
check(result.state.quests.find((quest) => quest.id === "sys_ai_a")?.forgeAcceptedAtMs === 222, "Annahmezeit wird an Quest gestempelt");
check(result.state.quests.length === acceptState.quests.length, "Questanzahl bleibt konstant");
check(result.state.quests.some((quest) => quest.id === "own"), "eigene Quest bleibt unberührt");
check(result.state.forge.pending === null && result.state.forge.updatedAtMs === 222, "Erfolg leert komplettes Set mit Tombstone");
check(acceptState.forge.pending === acceptPending, "Eingabe-State bleibt unverändert");
check((result.state.questSignals?.byCategory?.str?.assigned || 0) === 1, "Assigned-Signal wird erfasst");
check((result.state.sessionSignals?.days?.[TODAY]?.actions || 0) === 1, "User-Action wird erfasst");
check(result.state.quests.find((quest) => quest.id === "sys_ai_a")?.replacedQuestId === "p1", "ersetzte Quest bleibt als Swap-Evidenz verknuepft");

const stagedPending = {
  ...acceptPending,
  quotaCommitStatus: "pending",
  quotaRequestId: "forge_req_123",
  quotaTimeZone: "Europe/Berlin",
};
const stagedState = { ...acceptState, forge: { pending: stagedPending, updatedAtMs: 101 } };
const stagedResult = acceptProposals(stagedState, {
  pendingId: stagedPending.id,
  proposalIds: ["sys_ai_a"],
}, { today: TODAY, nowMs: 222 });
check(stagedResult.reason === "storage_error", "nicht committedes Kontingent kann nicht angenommen werden");
check(stagedResult.state === stagedState && stagedState.forge.pending === stagedPending, "Commit-Gate mutiert das sichtbare Set nicht");

const capacityChanged = acceptProposals(acceptState, {
  pendingId: acceptPending.id,
  proposalIds: ["sys_ai_a", "sys_ai_b"],
}, { today: TODAY, nowMs: 223 });
check(capacityChanged.reason === "capacity_changed" && capacityChanged.state === acceptState, "Kapazitätsdrift führt zu keinem Teil-Swap");
equal(capacityChanged.acceptedIds, [], "Fehler liefert leere acceptedIds");
check(acceptState.forge.pending.proposals.length === 3, "Fehler lässt Pending vollständig stehen");

const stale = acceptProposals(acceptState, { pendingId: "alt", proposalIds: ["sys_ai_a"] }, { today: TODAY });
check(stale.reason === "stale_set" && stale.state === acceptState, "falsche Set-ID wird atomar abgewiesen");
check(
  acceptProposals(acceptState, { pendingId: acceptPending.id, proposalIds: ["unknown"] }, { today: TODAY }).reason === "stale_set",
  "unbekannte Proposal-ID gilt als stale_set",
);
check(
  acceptProposals(acceptState, { pendingId: acceptPending.id, proposalIds: ["sys_ai_a", 7] }, { today: TODAY }).reason === "stale_set",
  "nicht-string Proposal-ID gilt als stale_set",
);
check(
  acceptProposals(acceptState, { pendingId: acceptPending.id, proposalIds: ["sys_ai_a", "sys_ai_a"] }, { today: TODAY }).reason === "stale_set",
  "doppelte Proposal-ID gilt als stale_set",
);
check(
  acceptProposals(acceptState, { pendingId: acceptPending.id, proposalIds: ["sys_ai_a"] }, { today: "2026-07-19" }).reason === "expired",
  "abgelaufenes Set liefert expired",
);
check(
  acceptProposals(acceptState, { pendingId: acceptPending.id, proposalIds: [] }, { today: TODAY }).reason === "empty",
  "leere Auswahl liefert empty",
);
check(
  acceptProposals({ ...acceptState, quests: null }, { pendingId: acceptPending.id, proposalIds: ["sys_ai_a"] }, { today: TODAY }).reason === "storage_error",
  "kaputter Quest-Speicher liefert storage_error",
);
const collisionState = {
  ...acceptState,
  quests: [poolDaily("p1"), proposal("a", "Schon vorhanden")],
};
check(
  acceptProposals(collisionState, { pendingId: acceptPending.id, proposalIds: ["sys_ai_a"] }, { today: TODAY }).reason === "storage_error",
  "Swap-Mismatch/ID-Kollision liefert storage_error",
);

const proPending = createPendingSet([
  proposal("a", "A"), proposal("b", "B"), proposal("c", "C"),
], { today: TODAY, nowMs: 300 });
const proAcceptState = {
  ...proCapacityState,
  quests: [poolDaily("p1"), poolDaily("p2"), poolDaily("p3")],
  forge: { pending: proPending, updatedAtMs: 300 },
};
const proResult = acceptProposals(proAcceptState, {
  pendingId: proPending.id,
  proposalIds: ["sys_ai_b", "sys_ai_a"],
}, { today: TODAY, nowMs: 333 });
equal(proResult.acceptedIds, ["sys_ai_a", "sys_ai_b"], "acceptedIds folgen übernommener Pending-Reihenfolge");
check(proResult.acceptedCount === 2 && proResult.state.forge.pending === null, "Pro kann zwei atomar übernehmen");

// ── Default-Shape ─────────────────────────────────────────────────────────
equal(DEFAULT_STATE.forge, DEFAULT_FORGE, "DEFAULT_STATE.forge entspricht DEFAULT_FORGE");

if (failures > 0) {
  console.error(`${failures} Fehler`);
  process.exit(1);
}
console.log("✓ test-forge: alles grün");
