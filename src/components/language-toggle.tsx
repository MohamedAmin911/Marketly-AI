"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LanguageToggle() {
  const { language, setLanguage, t } = useTranslation();
  const nextLanguage = language === "en" ? "ar" : "en";

  return (
    <Button
      variant="secondary"
      aria-label={t("language.toggleLabel")}
      onClick={() => setLanguage(nextLanguage)}
      className="h-10 min-h-10 min-w-[72px] px-3 font-semibold"
    >
      <Languages className="size-4" />
      {language === "en" ? t("language.ar") : t("language.en")}
    </Button>
  );
}
