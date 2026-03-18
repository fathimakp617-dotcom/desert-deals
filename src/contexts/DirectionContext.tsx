import { createContext, useContext, useCallback, ReactNode } from "react";
import translations, { type TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  lang: "en";
  dir: "ltr";
  isRtl: false;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  dir: "ltr",
  isRtl: false,
  t: (key) => key,
});

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry.en || key;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang: "en", dir: "ltr", isRtl: false, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useDirection = () => useContext(LanguageContext);
export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  return { t: ctx.t, lang: ctx.lang, isRtl: ctx.isRtl };
};
