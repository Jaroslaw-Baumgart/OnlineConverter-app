import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { pl } from "./locales/pl";

export const languageStorageKey = "online-file-converter-language";
export const supportedLanguages = ["en", "pl"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage);
}

function getStoredLanguage() {
  try {
    const language = window.localStorage.getItem(languageStorageKey);
    return language && isSupportedLanguage(language) ? language : "en";
  } catch {
    return "en";
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pl: { translation: pl } },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
