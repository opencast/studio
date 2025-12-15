import i18n, { CustomTypeOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import deTranslations from "./locales/de.json";
import esTranslations from "./locales/es.json";
import faTranslations from "./locales/fa.json";
import frTranslations from "./locales/fr.json";
import nlTranslations from "./locales/nl.json";
import slTranslations from "./locales/sl.json";
import zhTranslations from "./locales/zh.json";
import caTranslations from "./locales/ca.json";
import itTranslations from "./locales/it.json";
import daTranslations from "./locales/da.json";

const resources = {
  en: { translation: enTranslations },
  de: { translation: deTranslations },
  es: { translation: esTranslations },
  fa: { translation: faTranslations },
  fr: { translation: frTranslations },
  nl: { translation: nlTranslations },
  sl: { translation: slTranslations },
  zh: { translation: zhTranslations },
  ca: { translation: caTranslations },
  it: { translation: itTranslations },
  da: { translation: daTranslations },
};

export type TranslationKey = keyof CustomTypeOptions["resources"]["translation"];

void i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: "en",

    interpolation: {
      // React already escapes. Disabled here to avoid double escapes.
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator"],
    },
  });

export default i18n;

const updateAttributes = (lng: string) => {
  document.documentElement.setAttribute("lang", lng);
  // TODO: add this at some point. Needs lots of fixing.
  // const dir = languages.find(l => l.short === lng)?.rtl ? "rtl" : "ltr";
  // document.documentElement.setAttribute("dir", dir);
};

i18n.on("languageChanged", updateAttributes);
if (i18n.resolvedLanguage) {
  updateAttributes(i18n.resolvedLanguage);
}
