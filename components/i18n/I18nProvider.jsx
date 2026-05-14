import React, { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_LANGUAGE_MODE,
  normalizeLanguageMode,
  readBootstrapLanguage,
  resolveLocale,
  translate,
  writeBootstrapLanguage,
} from "../../data/i18n.js";

const fallbackMode = readBootstrapLanguage();
const fallbackLocale = resolveLocale(fallbackMode);

const I18nContext = createContext({
  languageMode: fallbackMode,
  locale: fallbackLocale,
  t: (key, params) => translate(fallbackLocale, key, params),
  setBootstrapLanguage: writeBootstrapLanguage,
});

export function I18nProvider({ language = DEFAULT_LANGUAGE_MODE, children }) {
  const languageMode = normalizeLanguageMode(language);
  const locale = resolveLocale(languageMode);
  const value = useMemo(() => ({
    languageMode,
    locale,
    t: (key, params) => translate(locale, key, params),
    setBootstrapLanguage: writeBootstrapLanguage,
  }), [languageMode, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
