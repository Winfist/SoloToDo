import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const modal = readFileSync(new URL("../components/ForgeRitualModal.jsx", import.meta.url), "utf8");
const de = readFileSync(new URL("../data/locales/de.js", import.meta.url), "utf8");
const en = readFileSync(new URL("../data/locales/en.js", import.meta.url), "utf8");

const gameHook = readFileSync(new URL("../hooks/useGameState.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../solo-leveling-v5.jsx", import.meta.url), "utf8");
const contracts = [
  ["partial quality count", "qualityPassedCount <= 2"],
  ["compiled quality diagnostics", "pendingSet?.diagnostics?.validCount"],
  ["no-fit state", 'phase === "no_fit"'],
  ["N=0 read-only preview", "maxSelectable === 0"],
  ["preview IDs", "composition.previewIds"],
  ["capacity separated from recommendation", "summaryCapacity"],
  ["memory only from adjustment", "{adjusting && <button"],
  ["preference pressed state", "aria-pressed={item.explicitPreference"],
  ["modal semantics", 'role="dialog" aria-modal="true"'],
  ["focus trap", "querySelectorAll(FOCUSABLE)"],
  ["Escape support", 'event.key === "Escape"'],
  ["focus restoration", "returnFocusRef.current?.focus?.()"],
  ["44 pixel targets", "min-height:44px"],
  ["safe area top", "safe-area-inset-top"],
  ["safe area bottom", "safe-area-inset-bottom"],
  ["reduced motion", "prefers-reduced-motion:reduce"],
  ["timer cleanup", "clearTimeout(successTimerRef.current)"],
  ["reforge confirmation", "setConfirmReforge(true)"],
  ["acceptance result contract", "const pendingResult = onAccept?."],
];

for (const [label, token] of contracts) {
  assert.ok(modal.includes(token), `missing UI contract: ${label}`);
}

assert.ok(modal.indexOf("forge-details-body") < modal.indexOf("forge-requirements"), "requirements must remain behind Details");
assert.ok(modal.includes('phase === "choose" && maxSelectable > 0 && <footer'), "N=0/no-fit must not expose an accept CTA");
assert.ok(!modal.includes("dailyFocusQuestId"), "Forge modal must not assign focus automatically");
assert.ok(de.includes("partialQuality") && en.includes("partialQuality"), "partial copy must exist in DE and EN");
assert.ok(de.includes("memoryResetConfirm") && en.includes("memoryResetConfirm"), "memory reset copy must exist in DE and EN");

const localWrite = gameHook.indexOf("const locallyStored = await cacheStateLocally(next)");
const publishPending = gameHook.indexOf("persist(next)", localWrite);
const acceptanceStart = gameHook.indexOf("const acceptForgeProposals = useCallback");
const acceptanceEnd = gameHook.indexOf("const storeForgeGeneration = useCallback", acceptanceStart);
const acceptanceBlock = gameHook.slice(acceptanceStart, acceptanceEnd);
assert.ok(acceptanceBlock.includes("const locallyStored = await cacheStateLocally(durableState)"), "accepted Forge state must be durably cached before publication");
assert.ok(acceptanceBlock.indexOf("cacheStateLocally(durableState)") < acceptanceBlock.indexOf("persist(result.state)"), "accepted Forge state must be cached before persist");
assert.ok(acceptanceBlock.includes("stateRef.current !== current"), "acceptance must detect a concurrent state update");
assert.ok(acceptanceBlock.indexOf("stateRef.current !== current") < acceptanceBlock.indexOf("persist(result.state)"), "acceptance race guard must run before publication");
assert.ok(localWrite >= 0 && publishPending > localWrite, "Pending must be durably local before publishing it");
const generationBlock = gameHook.slice(acceptanceEnd, gameHook.indexOf("const updateForgeRecipePreference", acceptanceEnd));
assert.ok(generationBlock.includes("stateRef.current !== current"), "generation persistence must detect a concurrent state update");
assert.ok(generationBlock.indexOf("stateRef.current !== current") < generationBlock.indexOf("persist(next)"), "generation race guard must run before publication");
const storeAwait = app.indexOf("await storeForgeGeneration");
const quotaCommit = app.indexOf("commitForgeGeneration", storeAwait);
assert.ok(modal.includes(".forge-close{flex:0 0 44px;width:44px;height:44px"), "close control must not shrink below its 44px target");
assert.ok(storeAwait >= 0 && quotaCommit > storeAwait, "quota commit must follow local Pending persistence");
assert.ok(app.includes("forgeRequestRef.current = { requestId, today, timeZone }"), "failed local writes must reuse a stable requestId");
const localCommit = app.indexOf("markForgeGenerationCommitted", quotaCommit);
assert.ok(localCommit > quotaCommit, "server quota commit must be finalized locally before the set is usable");
assert.ok(generationBlock.includes("quotaCommitStatus: successful ? 'pending' : 'committed'"), "successful generated sets must persist as staged until commit");
assert.ok(app.includes("stagedPending?.quotaRequestId"), "commit retry must reuse the persisted requestId");
assert.ok(app.includes("isPendingQuotaCommitted(state.forge?.pending) ? state.forge.pending : null"), "staged sets must stay hidden from acceptance");
console.log("test-forge-ui-contract: all assertions passed.");
