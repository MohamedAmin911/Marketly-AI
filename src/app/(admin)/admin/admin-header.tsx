"use client";

import { Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function AdminHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex h-16 items-center gap-2 border-b border-border px-6">
      <Shield className="size-5 text-primary" />
      <span className="font-bold text-foreground font-display">{t("admin.layoutTitle")}</span>
    </div>
  );
}

export function AdminFooter() {
  const { t } = useTranslation();
  return (
    <div className="border-t border-border p-4 text-xs text-muted text-center">
      {t("admin.layoutVersion")}
    </div>
  );
}
