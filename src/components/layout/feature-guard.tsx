"use client";

import { useBilling } from "@/features/billing/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "./page-shell";

interface FeatureGuardProps {
  featureName: string;
  children: React.ReactNode;
}

export function FeatureGuard({ featureName, children }: FeatureGuardProps) {
  const { billing, isLoading } = useBilling();
  const { t, isRtl } = useTranslation();

  if (isLoading) {
    return (
      <PageShell title={<Skeleton className="h-8 w-48" />}>
        <div className="flex flex-col space-y-4 p-8">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </PageShell>
    );
  }

  // If features exist and the requested feature is strictly false
  // Note: if user is admin, billing.features should be populated accordingly, or we assume true if not specified in a strict sense.
  // Actually the sidebar says: !billing.features[item.feature] to lock.
  const isLocked = billing?.features ? !billing.features[featureName] : false;

  if (isLocked) {
    return (
      <PageShell
        title={
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-5" />
            <span>{t("common.lockedFeature") || "Feature Locked"}</span>
          </div>
        }
        description={t("common.upgradeToAccess") || "Upgrade to a Pro plan to access this feature."}
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md w-full border-primary/20 shadow-xl bg-card">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t("common.proFeature") || "Pro Feature"}</CardTitle>
              <CardDescription className="text-base mt-2">
                {t("common.proFeatureDesc") || "This feature is available exclusively on our Pro and Enterprise plans."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 mt-4">
              <Button asChild className="w-full neon-gradient text-white h-12 text-md font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Link href="/settings?tab=billing#plans">
                  <Sparkles className={isRtl ? "ml-2 size-5" : "mr-2 size-5"} />
                  {t("nav.upgradeToPro") || "Upgrade to Pro"}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/dashboard">
                  {t("common.backToDashboard") || "Back to Dashboard"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return <>{children}</>;
}
