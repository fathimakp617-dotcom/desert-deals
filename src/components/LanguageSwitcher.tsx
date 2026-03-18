import { memo } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/contexts/DirectionContext";

const LanguageSwitcher = memo(() => {
  const { lang, setLang, t } = useTranslation();

  const toggle = () => setLang(lang === "en" ? "ar" : "en");

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted text-foreground transition-all duration-200 text-xs font-medium"
      aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="tracking-wide">{lang === "en" ? t("lang.ar") : t("lang.en")}</span>
    </button>
  );
});

LanguageSwitcher.displayName = "LanguageSwitcher";

export default LanguageSwitcher;
