import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import translations, { type Lang, type TranslationKey } from "@/i18n/translations";

type Dir = "ltr" | "rtl";

interface LanguageContextType {
  lang: Lang;
  dir: Dir;
  isRtl: boolean;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LANG_KEY = "dd_lang";

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  dir: "ltr",
  isRtl: false,
  setLang: () => {},
  t: (key) => key,
});

const getInitialLang = (): Lang => {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "ar" || stored === "en") return stored;
  // Auto-detect from browser
  const browserLang = navigator.language || (navigator as any).userLanguage || "en";
  return browserLang.startsWith("ar") ? "ar" : "en";
};

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const dir: Dir = lang === "ar" ? "rtl" : "ltr";
  const isRtl = lang === "ar";

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem(LANG_KEY, newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.en || key;
    },
    [lang]
  );

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang);
    if (isRtl) {
      html.classList.add("rtl");
    } else {
      html.classList.remove("rtl");
    }
  }, [dir, lang, isRtl]);

  return (
    <LanguageContext.Provider value={{ lang, dir, isRtl, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useDirection = () => useContext(LanguageContext);
export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  return { t: ctx.t, lang: ctx.lang, isRtl: ctx.isRtl, setLang: ctx.setLang };
};
