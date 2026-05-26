import { Capacitor } from "@capacitor/core";
import { PREMIUM_PRODUCT } from "../data/premium.js";

// ── Konfiguration ─────────────────────────────────────────────────────────
// ⚠️ AKTUELL: RevenueCat TEST-STORE-Key (nur zum Testen des Kaufflusses).
// VOR dem App-Store-Release zwingend durch die echten Production-Keys ersetzen:
//   ios:     "appl_…"  (RevenueCat → Project → API Keys, nachdem die App-Store-App verknüpft ist)
//   android: "goog_…"  (nur falls Google Play geplant)
// Diese Public-SDK-Keys dürfen im Client-Bundle stehen.
const REVENUECAT_API_KEYS = {
  ios: "test_rygHGsXyJMvoZZMzgjjQWgUPlxg",
  android: "test_rygHGsXyJMvoZZMzgjjQWgUPlxg",
};

// Entitlement-ID, die in RevenueCat an beide Abo-Produkte gehängt wird.
export const PRO_ENTITLEMENT_ID = "pro";

// Mapping unserer Plan-IDs (UI) → erwartete Store-Produkt-IDs.
// Müssen EXAKT den Produkt-IDs in App Store Connect / RevenueCat entsprechen.
export const STORE_PRODUCT_IDS = {
  monthly: "hunter_pro_monthly",
  yearly: "hunter_pro_yearly",
};

let PurchasesRef = null;
let configurePromise = null;

function platformKey() {
  const p = Capacitor.getPlatform();
  if (p === "ios") return REVENUECAT_API_KEYS.ios;
  if (p === "android") return REVENUECAT_API_KEYS.android;
  return null;
}

/** IAP ist nur nativ verfügbar (iOS/Android), nicht im Web. */
export function isIapSupported() {
  return Capacitor.isNativePlatform() && !!platformKey();
}

// Plugin wird dynamisch geladen, damit der Web-Build ohne natives Modul läuft.
async function loadPlugin() {
  if (PurchasesRef) return PurchasesRef;
  const mod = await import("@revenuecat/purchases-capacitor");
  PurchasesRef = mod.Purchases;
  return PurchasesRef;
}

/**
 * Konfiguriert RevenueCat einmalig und verknüpft den Kauf mit der Firebase-UID,
 * damit das Abo geräteübergreifend demselben Konto gehört.
 */
export async function configureIap(appUserId) {
  if (!isIapSupported()) return false;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    const Purchases = await loadPlugin();
    const apiKey = platformKey();
    try {
      const { isConfigured } = await Purchases.isConfigured();
      if (!isConfigured) {
        await Purchases.configure({ apiKey, appUserID: appUserId || undefined });
      } else if (appUserId) {
        await Purchases.logIn({ appUserID: appUserId });
      }
      return true;
    } catch (err) {
      console.warn("[iap] configure failed", err);
      configurePromise = null;
      return false;
    }
  })();

  return configurePromise;
}

export async function loginIap(appUserId) {
  if (!isIapSupported() || !appUserId) return;
  try {
    const Purchases = await loadPlugin();
    await Purchases.logIn({ appUserID: appUserId });
  } catch (err) {
    console.warn("[iap] logIn failed", err);
  }
}

export async function logoutIap() {
  if (!isIapSupported()) return;
  try {
    const Purchases = await loadPlugin();
    await Purchases.logOut();
  } catch (err) {
    console.warn("[iap] logOut failed", err);
  }
}

/** Holt das aktuelle Offering und liefert die Pakete (monatlich / jährlich). */
export async function getPremiumPackages() {
  if (!isIapSupported()) return { monthly: null, yearly: null, raw: null };
  const Purchases = await loadPlugin();
  const offerings = await Purchases.getOfferings();
  const packages = offerings?.current?.availablePackages || [];

  const pick = (type, productId) =>
    packages.find((p) => p.packageType === type) ||
    packages.find((p) => p?.product?.identifier === productId) ||
    null;

  return {
    monthly: pick("MONTHLY", STORE_PRODUCT_IDS.monthly),
    yearly: pick("ANNUAL", STORE_PRODUCT_IDS.yearly),
    raw: offerings,
  };
}

/**
 * Wandelt RevenueCat-CustomerInfo in unser `premium`-State-Objekt um.
 * Gibt null zurück, wenn kein aktives Pro-Entitlement vorhanden ist.
 */
export function mapCustomerInfoToPremium(customerInfo, prevPremium = null, nowMs = Date.now()) {
  const ent = customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID];
  if (!ent || ent.isActive === false) return null;

  const planId =
    ent.productIdentifier === STORE_PRODUCT_IDS.yearly
      ? "hunter_pro_yearly"
      : ent.productIdentifier === STORE_PRODUCT_IDS.monthly
      ? "hunter_pro_monthly"
      : prevPremium?.planId || "hunter_pro_monthly";

  return {
    ...(prevPremium || {}),
    tier: PREMIUM_PRODUCT.id,
    planId,
    status: "active",
    source: "app_store",
    startedAt: prevPremium?.startedAt || new Date(nowMs).toISOString(),
    lastActivatedAt: new Date(nowMs).toISOString(),
    // Auto-Renewable-Abos liefern ein Ablaufdatum; ohne (lifetime) weit in die Zukunft.
    activeUntil: ent.expirationDate || new Date(nowMs + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    store: {
      productIdentifier: ent.productIdentifier,
      willRenew: !!ent.willRenew,
      periodType: ent.periodType || null,
    },
  };
}

/** Kauft das gewählte Paket ("monthly" | "yearly"). */
export async function purchasePlan(planId) {
  if (!isIapSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  const Purchases = await loadPlugin();
  const packages = await getPremiumPackages();
  const aPackage = planId === "yearly" ? packages.yearly : packages.monthly;
  if (!aPackage) {
    return { ok: false, reason: "no_package" };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage });
    return { ok: true, customerInfo };
  } catch (err) {
    if (err?.code === "1" || err?.userCancelled || err?.message?.includes("cancel")) {
      return { ok: false, reason: "cancelled" };
    }
    console.warn("[iap] purchase failed", err);
    return { ok: false, reason: "error", error: err };
  }
}

/** Stellt frühere Käufe wieder her. */
export async function restorePurchases() {
  if (!isIapSupported()) return { ok: false, reason: "unsupported" };
  try {
    const Purchases = await loadPlugin();
    const { customerInfo } = await Purchases.restorePurchases();
    return { ok: true, customerInfo };
  } catch (err) {
    console.warn("[iap] restore failed", err);
    return { ok: false, reason: "error", error: err };
  }
}

export async function getCustomerInfo() {
  if (!isIapSupported()) return null;
  try {
    const Purchases = await loadPlugin();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (err) {
    console.warn("[iap] getCustomerInfo failed", err);
    return null;
  }
}

/** Registriert einen Listener für Abo-Statusänderungen (z. B. Verlängerung). */
export async function addCustomerInfoListener(cb) {
  if (!isIapSupported()) return () => {};
  try {
    const Purchases = await loadPlugin();
    await Purchases.addCustomerInfoUpdateListener(cb);
  } catch (err) {
    console.warn("[iap] addCustomerInfoUpdateListener failed", err);
  }
  return () => {};
}
