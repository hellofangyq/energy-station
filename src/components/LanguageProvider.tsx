"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { dictionary, saveLang } from "@/lib/i18n";

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void } | null>(null);

export function LanguageProvider({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (next: Lang) => {
    setLangState(next);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  const { lang } = useLang();
  const dict = dictionary[lang];
  return { t: dict, lang };
}
