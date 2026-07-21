import { getLocaleObject, resolveLocale } from "./i18n.js";
import { computeQuestCreationStatus } from "./freeLimits.js";
export { FREE_LIMITS, FREE_DAILY_QUEST_LIMIT, canPurchaseExtraSlot, getQuotaStatus, canEquipRarity, canAddShadow, canAddNamedShadow, canSwitchJob, getAIFreeGenerationStatus, applyAIFreeGenerationUsage } from "./freeLimits.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const PREMIUM_PRODUCT = {
  id: "hunter_pro",
  name: "Hunter Pro",
  badge: "MONARCH PASS",
  monthlyPrice: "4,99 EUR / Monat",
  yearlyPrice: "39,99 EUR / Jahr",
  monthlyAmount: "4,99 EUR",
  yearlyAmount: "39,99 EUR",
  yearlyPerMonth: "3,33 EUR",
  yearlySavings: "-33%",
  betaDurationDays: 30,
  benefits: [
    {
      title: "KI-Coach Plus",
      desc: "Erweiterte Systemnachrichten, Quest-Hilfe und personalisierte Tagesimpulse.",
    },
    {
      title: "System-Schmiede",
      desc: "Unbegrenzte KI-Quest-Hilfe, Task-Scanner und Foto-Verifikation nach deiner Gratis-Kostprobe.",
    },
    {
      title: "Advanced Analytics",
      desc: "Tiefere Auswertung von Streaks, Stats, Fokus, Habits und Quest-Verhalten.",
    },
    {
      title: "Premium Customization",
      desc: "Custom Theme Creator und visuelle Motion-FX für deine Hunter-Signatur.",
    },
    {
      title: "Ad-Free Gem Flow",
      desc: "Daily Gem Bonus ohne Werbe-Zwang, sobald Store-Billing aktiv ist.",
    },
  ],
};

export const PREMIUM_FEATURES = {
  unlimited_quests: {
    eyebrow: "QUEST CAPACITY",
    title: "Unbegrenzte Quests sind Hunter Pro",
    desc: "Free-Hunter können pro Tag 10 eigene Quests erstellen. Hunter Pro hebt dieses Tageslimit auf.",
    bullets: ["10 Free Quests pro Tag", "Unbegrenzt mit Pro", "Mehr Tagesplanung"],
  },
  ai_task_scan: {
    eyebrow: "AI QUEST FORGE",
    title: "Unbegrenzter Foto-Scan ist Hunter Pro",
    desc: "Nach deiner verdienten Gratis-Kostprobe scannt Hunter Pro Notizen, Aufgabenblätter und handschriftliche Listen unbegrenzt.",
    bullets: ["3 KI-Tests gratis", "Task-Scanner", "Unbegrenzt mit Pro"],
  },
  ai_quest_desc: {
    eyebrow: "AI QUEST FORGE",
    title: "Unbegrenzte KI-Quest-Details sind Hunter Pro",
    desc: "Nach deiner verdienten Gratis-Kostprobe generiert Hunter Pro unbegrenzt Missionsdetails, Sub-Quests und klare Schritte.",
    bullets: ["3 KI-Tests gratis", "Quest-Beschreibung", "Unbegrenzt mit Pro"],
  },
  ai_verification: {
    eyebrow: "VERIFICATION CORE",
    title: "Unbegrenzte Foto-Verifikation ist Hunter Pro",
    desc: "Nach deiner verdienten Gratis-Kostprobe prüft Hunter Pro passende abgeschlossene Quests per Foto unbegrenzt.",
    bullets: ["3 KI-Tests gratis", "Foto-Beweis", "Unbegrenzt mit Pro"],
  },
  ai_dynamic_quests: {
    eyebrow: "DAILY SYSTEM",
    title: "Dynamische KI-Quests sind Hunter Pro",
    desc: "Dein System generiert persönliche Tagesquests passend zu Fortschritt, Fokus und Verhalten.",
    bullets: ["Personalisierte Quests", "Daily Reset", "Mehr Abwechslung"],
  },
  quest_intensity: {
    eyebrow: "SYSTEMRUF CORE",
    title: "Systemruf-Intensität ist Hunter Pro",
    desc: "Steuere, wie oft dein System automatisch neue Forderungen auslöst und wie hart es dich pusht.",
    bullets: ["Baby Gate bis Monarch Call", "Auto-Quest Rhythmus", "Aktive System-Caps"],
  },
  ai_coach: {
    eyebrow: "SYSTEM COACH",
    title: "KI-Coach Plus ist Hunter Pro",
    desc: "Erhalte intelligentere Systemnachrichten, Interventionen und Coaching-Impulse.",
    bullets: ["Coach-Impulse", "System-Kommentare", "Motivationshilfe"],
  },
  advanced_analytics: {
    eyebrow: "HUNTER INTEL",
    title: "Advanced Analytics ist Hunter Pro",
    desc: "Sieh Muster in Streaks, XP, Kategorien, Fokus und langfristigem Fortschritt.",
    bullets: ["Trend-Auswertung", "Fokus-Muster", "Fortschrittsanalyse"],
  },
  dungeons: {
    eyebrow: "GATE ACCESS",
    title: "Mehr Dungeon Gates sind Hunter Pro",
    desc: "Free-Hunter können 3 Gates pro Tag betreten. Hunter Pro hebt dieses Tageslimit auf.",
    bullets: ["3 Gates/Tag gratis", "Unbegrenzt mit Pro", "Boss-Runs & Loot"],
  },
  story_mode: {
    eyebrow: "HUNTER ARCHIVE",
    title: "Story-Modus ist Hunter Pro",
    desc: "Erlebe die langfristige Hunter-Reise als eigenes Fortschrittskapitel.",
    bullets: ["Story-Kapitel", "Lore-Fortschritt", "System-Archiv"],
  },
  equipment: {
    eyebrow: "ARSENAL CORE",
    title: "Epic & Legendary sind Hunter Pro",
    desc: "Free-Hunter rüsten bis Rang Rare. Hunter Pro schaltet Epic- und Legendary-Gear frei.",
    bullets: ["Bis Rare gratis", "Epic & Legendary mit Pro", "Build-Power"],
  },
  shadow_army: {
    eyebrow: "SHADOW COMMAND",
    title: "Mehr Schatten sind Hunter Pro",
    desc: "Free-Hunter befehligen bis zu 5 Schatten. Hunter Pro hebt das Limit auf und schaltet Named Shadows frei.",
    bullets: ["5 Schatten gratis", "Unbegrenzt + Named mit Pro", "Arise-System"],
  },
  jobs: {
    eyebrow: "CLASS SYSTEM",
    title: "Klassenwechsel ist Hunter Pro",
    desc: "Free-Hunter legen sich auf eine Klasse fest, sobald sie XP sammelt. Hunter Pro erlaubt Multi-Class und Respec.",
    bullets: ["1 Klasse gratis", "Multi-Class mit Pro", "Respec"],
  },
  dawn_dusk: {
    eyebrow: "ROUTINE PROTOCOL",
    title: "Dawn / Dusk Protocol ist Hunter Pro",
    desc: "Führe Morgen- und Abendroutinen als klare System-Protokolle.",
    bullets: ["Morgenroutine", "Abendroutine", "Ritual-Fokus"],
  },
  seasons: {
    eyebrow: "WORLD EVENTS",
    title: "Seasons sind Hunter Pro",
    desc: "Aktiviere saisonale Ereignisse und World-Event-Kontext für dein System.",
    bullets: ["Seasons", "World Events", "Saison-Boni"],
  },
  charisma_dungeons: {
    eyebrow: "SOCIAL GATES",
    title: "Mehr Charisma Dungeons sind Hunter Pro",
    desc: "Starte 1 Charisma-Kette pro Tag gratis. Hunter Pro macht soziales Training unbegrenzt.",
    bullets: ["1 Kette/Tag gratis", "Unbegrenzt mit Pro", "CHA Progress"],
  },
  advanced_widgets: {
    eyebrow: "WIDGET CORE",
    title: "Advanced Widgets sind Hunter Pro",
    desc: "Schalte Biometrics, Vision Board und weitere Premium-Module im Dashboard frei.",
    bullets: ["Biometrics", "Vision Board", "Mehr Dashboard-Module"],
  },
  custom_theme: {
    eyebrow: "SYSTEM DESIGN",
    title: "Custom Theme Creator ist Hunter Pro",
    desc: "Baue deine eigene Hunter-Signatur mit Farben, Glow und Interface-Aura.",
    bullets: ["Eigene Farben", "Custom Glow", "Persönlicher Look"],
  },
  premium_effects: {
    eyebrow: "CINEMATIC VFX",
    title: "Premium-Effekte sind Hunter Pro",
    desc: "Aktiviere die auffälligsten HUD-, Cursor- und Motion-Effekte für ein episches Interface.",
    bullets: ["HUD Overlay", "Cursor Glow", "Cinematic Motion"],
  },
  widgets: {
    eyebrow: "WIDGET CORE",
    title: "Advanced Widgets sind Hunter Pro",
    desc: "Schalte tiefere Widget-Module frei, die Health, Heatmaps und Shadow Army zeigen.",
    bullets: ["Mehr Module", "Live Activities", "Heatmaps"],
  },
  premium_store: {
    eyebrow: "MONARCH STORE",
    title: "Premium-Store Optionen",
    desc: "Hier werden später Store-Käufe, Abo-Status und exklusive Hunter-Pro-Angebote gebündelt.",
    bullets: ["Abo-Status", "Beta-Codes", "Store-Billing"],
  },
};

export function getPremiumFeature(featureKey) {
  return PREMIUM_FEATURES[featureKey] || PREMIUM_FEATURES.premium_store;
}

export function getLocalizedPremiumFeature(featureKey, localeOrMode = "auto") {
  const key = PREMIUM_FEATURES[featureKey] ? featureKey : "premium_store";
  const base = getPremiumFeature(key);
  const override = getLocaleObject(resolveLocale(localeOrMode))?.premium?.features?.[key];
  if (!override) return base;
  return {
    ...base,
    ...override,
    bullets: override.bullets || base.bullets,
  };
}

export function getLocalizedPremiumProduct(localeOrMode = "auto") {
  const premium = getLocaleObject(resolveLocale(localeOrMode))?.premium || {};
  return {
    ...PREMIUM_PRODUCT,
    benefits: premium.benefits || PREMIUM_PRODUCT.benefits,
  };
}

export const PREMIUM_ROUTE_FEATURES = {
  analytics: "advanced_analytics",
  story: "story_mode",
  protocol_overlay: "dawn_dusk",
  seasons_overlay: "seasons",
};

export const PREMIUM_DASHBOARD_WIDGET_KEYS = [
  "health_summary",
  "vision_board",
];

export const PREMIUM_WIDGET_MODULE_KEYS = [
  "health",
  "deadline_alert",
  "system_message",
  "week_heatmap",
  "streak_shield",
  "shadow_army",
];

export function getPremiumFeatureForRoute(routeKey) {
  return PREMIUM_ROUTE_FEATURES[routeKey] || null;
}

export function isPremiumDashboardWidget(widgetKey) {
  return PREMIUM_DASHBOARD_WIDGET_KEYS.includes(widgetKey);
}

export function isPremiumWidgetModule(moduleKey) {
  return PREMIUM_WIDGET_MODULE_KEYS.includes(moduleKey);
}

export function getDailyQuestCreationStatus(state, nowMs = Date.now()) {
  const premiumStatus = getPremiumStatus(state?.premium, nowMs);
  return computeQuestCreationStatus({
    premiumActive: premiumStatus.active,
    createdCount: Number(state?.dailyUserQuestsCreated || 0),
    extraDailySlots: Number(state?.extraDailySlots || 0),
  });
}

export const BETA_PREMIUM_CODES = [
  { code: "ARISE-BETA-30", days: 30, label: "Arise Beta Pass" },
  { code: "SOLO-BETA-30", days: 30, label: "Solo Beta Pass" },
  { code: "MONARCH-TEST-30", days: 30, label: "Monarch Test Pass" },
];

export function normalizePremiumCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isPremiumActive(premium, nowMs = Date.now()) {
  // Explicitly revoked by admin → never active, regardless of cached tier/date
  if (premium?.status === 'revoked') return false;
  const activeUntilMs = Date.parse(premium?.activeUntil || "");
  return premium?.tier === PREMIUM_PRODUCT.id && Number.isFinite(activeUntilMs) && activeUntilMs > nowMs;
}

export function getPremiumStatus(premium, nowMs = Date.now()) {
  const activeUntilMs = Date.parse(premium?.activeUntil || "");
  const active = isPremiumActive(premium, nowMs);
  const daysRemaining = active ? Math.max(1, Math.ceil((activeUntilMs - nowMs) / DAY_MS)) : 0;
  const activeUntilLabel = Number.isFinite(activeUntilMs)
    ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(activeUntilMs))
    : null;

  return {
    active,
    tier: active ? premium?.tier : "free",
    source: premium?.source || "none",
    activeUntil: premium?.activeUntil || null,
    activeUntilLabel,
    daysRemaining,
  };
}

export function redeemBetaPremiumCode(currentPremium, rawCode, nowMs = Date.now()) {
  const normalized = normalizePremiumCode(rawCode);
  if (!normalized) {
    return { ok: false, message: "Bitte gib einen Beta-Code ein." };
  }

  const match = BETA_PREMIUM_CODES.find((entry) => normalizePremiumCode(entry.code) === normalized);
  if (!match) {
    return { ok: false, message: "Dieser Beta-Code ist nicht gültig." };
  }

  const redeemedCodes = (currentPremium?.betaCodesRedeemed || []).map(normalizePremiumCode);
  if (redeemedCodes.includes(normalized)) {
    return { ok: false, message: "Dieser Beta-Code wurde auf diesem Account bereits genutzt." };
  }

  const currentActiveUntilMs = Date.parse(currentPremium?.activeUntil || "");
  const extensionBaseMs = Number.isFinite(currentActiveUntilMs) && currentActiveUntilMs > nowMs
    ? currentActiveUntilMs
    : nowMs;
  const activeUntil = new Date(extensionBaseMs + (match.days || PREMIUM_PRODUCT.betaDurationDays) * DAY_MS).toISOString();

  const premium = {
    ...(currentPremium || {}),
    tier: PREMIUM_PRODUCT.id,
    planId: "hunter_pro_monthly",
    status: "active",
    source: "beta_code",
    startedAt: currentPremium?.startedAt || new Date(nowMs).toISOString(),
    lastActivatedAt: new Date(nowMs).toISOString(),
    activeUntil,
    betaCodesRedeemed: [...new Set([...redeemedCodes, normalized])],
  };

  const status = getPremiumStatus(premium, nowMs);
  return {
    ok: true,
    code: match,
    premium,
    activeUntilLabel: status.activeUntilLabel,
    daysRemaining: status.daysRemaining,
    message: `${PREMIUM_PRODUCT.name} wurde bis ${status.activeUntilLabel} aktiviert.`,
  };
}
