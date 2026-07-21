const DEFAULT_FORGE_ACTIVE_POLICY = "forge-3.0";
const FORGE_ACTIVE_POLICIES = Object.freeze(["forge-2.2", "forge-3.0"]);

function isSupportedForgePolicy(policy) {
  return FORGE_ACTIVE_POLICIES.includes(policy);
}

function getRequestedCountForPolicy(policy) {
  return policy === "forge-2.2" ? 3 : 6;
}

async function resolveForgeActivePolicy(db, { logger = console } = {}) {
  try {
    const snapshot = await db.collection("systemConfig").doc("questForge").get();
    const configuredPolicy = snapshot.exists ? snapshot.data()?.activePolicy : null;
    return isSupportedForgePolicy(configuredPolicy)
      ? configuredPolicy
      : DEFAULT_FORGE_ACTIVE_POLICY;
  } catch (_) {
    // Do not log the exception: SDK errors may contain project or request metadata.
    logger?.warn?.("[QuestForge] Policy config unavailable; using forge-3.0.");
    return DEFAULT_FORGE_ACTIVE_POLICY;
  }
}

module.exports = {
  DEFAULT_FORGE_ACTIVE_POLICY,
  FORGE_ACTIVE_POLICIES,
  getRequestedCountForPolicy,
  isSupportedForgePolicy,
  resolveForgeActivePolicy,
};
