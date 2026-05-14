import { de } from "./locales/de.js";
import { en } from "./locales/en.js";

export const SUPPORTED_LOCALES = ["de", "en"];
export const DEFAULT_LANGUAGE_MODE = "auto";
export const LANGUAGE_STORAGE_KEY = "sl-language-mode";
export const LANGUAGE_CHANGE_EVENT = "solotodo:language-change";

export const LANGUAGE_OPTIONS = [
  { key: "auto", labelKey: "common.automatic" },
  { key: "de", labelKey: "common.german" },
  { key: "en", labelKey: "common.english" },
];

const LOCALES = { de, en };

export function normalizeLanguageMode(value) {
  return value === "de" || value === "en" || value === "auto" ? value : DEFAULT_LANGUAGE_MODE;
}

export function getBrowserLocale() {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const candidates = [
    ...(Array.isArray(nav?.languages) ? nav.languages : []),
    nav?.language,
    nav?.userLanguage,
  ].filter(Boolean);

  const match = candidates.find((value) => String(value).toLowerCase().startsWith("de"));
  return match ? "de" : "en";
}

export function resolveLocale(languageMode = DEFAULT_LANGUAGE_MODE) {
  const mode = normalizeLanguageMode(languageMode);
  if (mode === "auto") return getBrowserLocale();
  return SUPPORTED_LOCALES.includes(mode) ? mode : "en";
}

export function readBootstrapLanguage() {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE_MODE;
    return normalizeLanguageMode(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE_MODE;
  }
}

export function writeBootstrapLanguage(languageMode) {
  const next = normalizeLanguageMode(languageMode);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language: next } }));
    }
  } catch {
    // Best-effort bootstrap cache only; account state remains the source of truth.
  }
  return next;
}

function getPath(source, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((node, part) => (node && Object.prototype.hasOwnProperty.call(node, part) ? node[part] : undefined), source);
}

function interpolate(value, params) {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    const next = params?.[key];
    return next === undefined || next === null ? "" : String(next);
  });
}

export function translate(localeOrMode, key, params = {}) {
  const locale = resolveLocale(localeOrMode);
  const value = getPath(LOCALES[locale], key) ?? getPath(LOCALES.de, key) ?? getPath(LOCALES.en, key);
  if (value === undefined) return key;
  return interpolate(value, params);
}

export const t = translate;

export function getLocaleObject(localeOrMode) {
  return LOCALES[resolveLocale(localeOrMode)] || LOCALES.en;
}

export function getStateLanguageMode(state) {
  return normalizeLanguageMode(state?.settings?.language || readBootstrapLanguage());
}

export function getStateLocale(state) {
  return resolveLocale(getStateLanguageMode(state));
}

export function getLocaleLabel(localeOrMode) {
  const locale = resolveLocale(localeOrMode);
  return locale === "de" ? "Deutsch" : "English";
}
