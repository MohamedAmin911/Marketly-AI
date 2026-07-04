"use client";

import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/useTranslation";

type PromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromptBox({ value, onChange }: PromptBoxProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor="additional-instructions" className="sr-only">
        {t("studio.instructions")}
      </label>
      <Textarea
        id="additional-instructions"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("studio.promptPlaceholder")}
        className="min-h-32"
      />
    </div>
  );
}
