"use client";

import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ViralSectionProps {
  title: React.ReactNode;
  data: any;
  children: React.ReactNode;
  className?: string;
}

export function ViralSection({ title, data, children, className }: ViralSectionProps) {
  const { t } = useTranslation();
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h2 className="text-xl font-display font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <CopyButton data={data} label={t("viralEngine.general.copy")} variant="secondary" size="sm" />
      </div>
      <div>{children}</div>
    </section>
  );
}
