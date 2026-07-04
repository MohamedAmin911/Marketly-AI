"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export function ResetLoading() {
  const { t } = useTranslation();

  return <div className="text-center text-sm text-muted">{t("auth.loadingReset")}</div>;
}
