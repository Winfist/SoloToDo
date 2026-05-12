const DAY_MS = 24 * 60 * 60 * 1000;

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
