const DAY_MS = 24 * 60 * 60 * 1000;
export const FREE_DAILY_QUEST_LIMIT = 1;

export const PREMIUM_PRODUCT = {
  id: "hunter_pro",
  name: "Hunter Pro",
  badge: "MONARCH PASS",
  monthlyPrice: "4,99 EUR / Monat",
  yearlyPrice: "39,99 EUR / Jahr",
  betaDurationDays: 30,
  benefits: [
    {
      title: "KI-Coach Plus",
      desc: "Erweiterte Systemnachrichten, Quest-Hilfe und personalisierte Tagesimpulse.",
    },
    {
      title: "AI Quest Forge",
      desc: "Mehr KI-Quest-Generierung, Task-Scanner und Foto-Verifikation.",
    },
    {
      title: "Advanced Analytics",
      desc: "Tiefere Auswertung von Streaks, Stats, Fokus, Habits und Quest-Verhalten.",
    },
    {
      title: "Premium Customization",
      desc: "Exklusive Themes, Titel, Page-Transitions und visuelle System-Effekte.",
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
    desc: "Free-Hunter koennen pro Tag eine eigene Quest erstellen. Hunter Pro hebt dieses Tageslimit auf.",
    bullets: ["1 Free Quest pro Tag", "Unbegrenzt mit Pro", "Mehr Tagesplanung"],
  },
  ai_task_scan: {
    eyebrow: "AI QUEST FORGE",
    title: "Foto-Scan ist Hunter Pro",
    desc: "Scanne Notizen, Aufgabenblaetter oder handschriftliche Listen und verwandle sie direkt in Quests.",
    bullets: ["Task-Scanner", "Quest-Vorschlaege", "Schneller Tagesplan"],
  },
  ai_quest_desc: {
    eyebrow: "AI QUEST FORGE",
    title: "KI-Quest-Details sind Hunter Pro",
    desc: "Lass dir Missionsdetails, Sub-Quests und klare Schritte fuer deine Aufgabe generieren.",
    bullets: ["Quest-Beschreibung", "Sub-Quests", "Bessere Umsetzung"],
  },
  ai_verification: {
    eyebrow: "VERIFICATION CORE",
    title: "Foto-Verifikation ist Hunter Pro",
    desc: "Beweise abgeschlossene Quests per Foto und erhalte ein strengeres, motivierendes System-Feedback.",
    bullets: ["Foto-Beweis", "Integritaet", "Bonus-Feedback"],
  },
  ai_dynamic_quests: {
    eyebrow: "DAILY SYSTEM",
    title: "Dynamische KI-Quests sind Hunter Pro",
    desc: "Dein System generiert persoenliche Tagesquests passend zu Fortschritt, Fokus und Verhalten.",
    bullets: ["Personalisierte Quests", "Daily Reset", "Mehr Abwechslung"],
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
    title: "Dungeon Gates sind Hunter Pro",
    desc: "Betritt Gates, besiege Bosse und schalte tiefere RPG-Fortschritte frei.",
    bullets: ["Dungeon Gates", "Boss-Runs", "Loot Progress"],
  },
  story_mode: {
    eyebrow: "HUNTER ARCHIVE",
    title: "Story-Modus ist Hunter Pro",
    desc: "Erlebe die langfristige Hunter-Reise als eigenes Fortschrittskapitel.",
    bullets: ["Story-Kapitel", "Lore-Fortschritt", "System-Archiv"],
  },
  equipment: {
    eyebrow: "ARSENAL CORE",
    title: "Equipment ist Hunter Pro",
    desc: "Verwalte Waffen, Items und Ausruestung fuer deinen Hunter-Build.",
    bullets: ["Waffen", "Ausruestung", "Build-Power"],
  },
  shadow_army: {
    eyebrow: "SHADOW COMMAND",
    title: "Shadow Army ist Hunter Pro",
    desc: "Erwecke Schatten, baue deine Armee aus und nutze staerkere Progressionssysteme.",
    bullets: ["Schatten-Armee", "Formation", "Arise-System"],
  },
  jobs: {
    eyebrow: "CLASS SYSTEM",
    title: "Jobs sind Hunter Pro",
    desc: "Schalte Klassen, Spezialisierungen und zusaetzliche Build-Identitaet frei.",
    bullets: ["Hunter-Klassen", "Job-XP", "Spezialisierung"],
  },
  events: {
    eyebrow: "EVENT BOARD",
    title: "Events sind Hunter Pro",
    desc: "Nutze Challenges, Missionen und besondere Ereignisse fuer mehr Abwechslung.",
    bullets: ["Challenges", "Missionen", "Bonus-Ziele"],
  },
  dawn_dusk: {
    eyebrow: "ROUTINE PROTOCOL",
    title: "Dawn / Dusk Protocol ist Hunter Pro",
    desc: "Fuehre Morgen- und Abendroutinen als klare System-Protokolle.",
    bullets: ["Morgenroutine", "Abendroutine", "Ritual-Fokus"],
  },
  seasons: {
    eyebrow: "WORLD EVENTS",
    title: "Seasons sind Hunter Pro",
    desc: "Aktiviere saisonale Ereignisse und World-Event-Kontext fuer dein System.",
    bullets: ["Seasons", "World Events", "Saison-Boni"],
  },
  soul_link: {
    eyebrow: "LINK PROTOCOL",
    title: "Soul Link ist Hunter Pro",
    desc: "Verbinde dich mit einem Partner und halte gemeinsame Aktivitaet sichtbar.",
    bullets: ["Partner-Link", "Streak-Sync", "Social Progress"],
  },
  charisma_dungeons: {
    eyebrow: "SOCIAL GATES",
    title: "Charisma Dungeons sind Hunter Pro",
    desc: "Trainiere soziale Quest-Ketten mit mehr Struktur und Fortschritt.",
    bullets: ["Social Chains", "CHA Progress", "Gespraechs-Training"],
  },
  advanced_widgets: {
    eyebrow: "WIDGET CORE",
    title: "Advanced Widgets sind Hunter Pro",
    desc: "Schalte Health, Fokus, Heatmaps und weitere Premium-Module im Dashboard frei.",
    bullets: ["Health Widget", "Screen Time", "Progress Widgets"],
  },
  custom_theme: {
    eyebrow: "SYSTEM DESIGN",
    title: "Custom Theme Creator ist Hunter Pro",
    desc: "Baue deine eigene Hunter-Signatur mit Farben, Glow und Interface-Aura.",
    bullets: ["Eigene Farben", "Custom Glow", "Persoenlicher Look"],
  },
  premium_effects: {
    eyebrow: "CINEMATIC VFX",
    title: "Premium-Effekte sind Hunter Pro",
    desc: "Aktiviere die auffaelligsten HUD-, Cursor- und Motion-Effekte fuer ein episches Interface.",
    bullets: ["HUD Overlay", "Cursor Glow", "Cinematic Motion"],
  },
  widgets: {
    eyebrow: "WIDGET CORE",
    title: "Advanced Widgets sind Hunter Pro",
    desc: "Schalte tiefere Widget-Module frei, die Health, Screen Time, Heatmaps und Shadow Army zeigen.",
    bullets: ["Mehr Module", "Live Activities", "Heatmaps"],
  },
  premium_store: {
    eyebrow: "MONARCH STORE",
    title: "Premium-Store Optionen",
    desc: "Hier werden spaeter Store-Kaeufe, Abo-Status und exklusive Hunter-Pro-Angebote gebuendelt.",
    bullets: ["Abo-Status", "Beta-Codes", "Store-Billing"],
  },
};

export function getPremiumFeature(featureKey) {
  return PREMIUM_FEATURES[featureKey] || PREMIUM_FEATURES.premium_store;
}

export const PREMIUM_ROUTE_FEATURES = {
  analytics: "advanced_analytics",
  dungeon: "dungeons",
  story: "story_mode",
  equipment: "equipment",
  shadows: "shadow_army",
  jobs: "jobs",
  challenges: "events",
  protocol_overlay: "dawn_dusk",
  seasons_overlay: "seasons",
  soullink_overlay: "soul_link",
  charisma_overlay: "charisma_dungeons",
};

export const PREMIUM_DASHBOARD_WIDGET_KEYS = [
  "health_summary",
  "screen_time_summary",
  "vision_board",
];

export const PREMIUM_WIDGET_MODULE_KEYS = [
  "health",
  "screen_time",
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
  const createdCount = Number(state?.dailyUserQuestsCreated || 0);
  const paidExtraSlots = Number(state?.extraDailySlots || 0);
  const limit = premiumStatus.active ? Infinity : FREE_DAILY_QUEST_LIMIT + Math.max(0, paidExtraSlots);
  const remaining = premiumStatus.active ? Infinity : Math.max(0, limit - createdCount);
  return {
    premiumActive: premiumStatus.active,
    createdCount,
    freeLimit: FREE_DAILY_QUEST_LIMIT,
    paidExtraSlots,
    limit,
    remaining,
    canCreate: premiumStatus.active || createdCount < limit,
  };
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
    return { ok: false, message: "Dieser Beta-Code ist nicht gueltig." };
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
