import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Dir = "ltr" | "rtl";

interface DirectionContextType {
  dir: Dir;
  isRtl: boolean;
  lang: string;
}

const DirectionContext = createContext<DirectionContextType>({
  dir: "ltr",
  isRtl: false,
  lang: "en",
});

/** Detect if browser language is Arabic */
const detectDirection = (): { dir: Dir; lang: string } => {
  const browserLang = navigator.language || (navigator as any).userLanguage || "en";
  const isArabic = browserLang.startsWith("ar");
  return { dir: isArabic ? "rtl" : "ltr", lang: isArabic ? "ar" : "en" };
};

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const [{ dir, lang }] = useState(detectDirection);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang);

    // Add/remove RTL class for Tailwind
    if (dir === "rtl") {
      html.classList.add("rtl");
    } else {
      html.classList.remove("rtl");
    }
  }, [dir, lang]);

  return (
    <DirectionContext.Provider value={{ dir, isRtl: dir === "rtl", lang }}>
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => useContext(DirectionContext);
