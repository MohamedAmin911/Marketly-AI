"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LanguageToggle() {
  const { language, setLanguage, t } = useTranslation();
  const nextLanguage = language === "en" ? "ar" : "en";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label={t("language.toggleLabel")}
      onClick={() => setLanguage(nextLanguage)}
      className="min-w-20 px-3"
    >
      <Languages className="size-4" />
      {language === "en" ? t("language.ar") : t("language.en")}
    </Button>
  );
}
