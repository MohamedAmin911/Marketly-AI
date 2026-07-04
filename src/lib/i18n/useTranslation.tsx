"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isLanguage, languageMeta, translations, type Direction, type Language, type TranslationKey } from "@/lib/i18n/translations";

const STORAGE_KEY = "marketly-language";

type TranslationContextValue = {
  dir: Direction;
  isRtl: boolean;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function applyDocumentLanguage(language: Language) {
  const meta = languageMeta[language];
  document.documentElement.lang = language;
  document.documentElement.dir = meta.dir;
  document.body.dir = meta.dir;
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const nextLanguage = isLanguage(stored) ? stored : "en";
    setLanguageState(nextLanguage);
    applyDocumentLanguage(nextLanguage);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
    applyDocumentLanguage(nextLanguage);
  };

  const value = useMemo<TranslationContextValue>(() => {
    const dict = translations[language];

    return {
      dir: languageMeta[language].dir,
      isRtl: languageMeta[language].dir === "rtl",
      language,
      setLanguage,
      t: (key, values) => {
        const template = String(dict[key] ?? translations.en[key]);
        if (!values) return template;

        return Object.entries(values).reduce<string>(
          (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
          template,
        );
      },
    };
  }, [language]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error("useTranslation must be used within TranslationProvider");
  return context;
}
