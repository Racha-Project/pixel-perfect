import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "th" ? "en" : "th")}
      className="font-mono text-xs uppercase tracking-wider"
    >
      {lang === "th" ? "TH · EN" : "EN · TH"}
    </Button>
  );
}
