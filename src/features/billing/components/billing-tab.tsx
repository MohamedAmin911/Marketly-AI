"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useBilling } from "@/features/billing/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Check, Loader2, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PLANS = [
  { id: "free", name: "Free", price: "$0", features: ["Ad Studio", "Image Generation", "Video Generation"] },
  { id: "starter", name: "Starter", price: "$49/mo", features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "500 Credits/mo"] },
  { id: "pro", name: "Pro", price: "$99/mo", features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "Growth Engine", "Analytics", "1500 Credits/mo"] },
  { id: "business", name: "Business", price: "$249/mo", features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "Growth Engine", "Analytics", "Priority Support", "API Access", "4000 Credits/mo"] },
];

export function BillingTab() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { billing, isLoading, upgradePlan, isUpgrading, buyCredits, isBuyingCredits, syncSession, isSyncing } = useBilling();
  
  const hasSynced = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");

    if (success === "true" && sessionId && !hasSynced.current) {
      hasSynced.current = true;
      syncSession(sessionId, {
        onSettled: () => {
          // Remove session_id from URL to prevent duplicate syncing on refresh
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete("session_id");
          newParams.delete("success");
          router.replace(`${pathname}?${newParams.toString()}#plans`, { scroll: false });
        }
      });
    }
  }, [searchParams, syncSession, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!billing) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted">
          {t("billing.failedLoad")}
        </CardContent>
      </Card>
    );
  }

  const { subscription } = billing;
  const currentPlanIndex = PLANS.findIndex(p => p.id === subscription.plan);
  
  const creditsPercentage = subscription.monthlyCredits > 0 
    ? ((subscription.monthlyCredits - subscription.monthlyCreditsRemaining) / subscription.monthlyCredits) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              {t("billing.creditsUsage")}
            </CardTitle>
            <CardDescription>{t("billing.creditsUsageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t("billing.monthlyCredits")}</span>
                <span className="text-muted">{subscription.monthlyCreditsRemaining} / {subscription.monthlyCredits}</span>
              </div>
              <Progress value={creditsPercentage} className="h-2" />
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("billing.purchasedCredits")}</p>
                  <p className="text-xs text-muted">{t("billing.purchasedCreditsDesc")}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{subscription.purchasedCredits}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => buyCredits(500)}
                  disabled={isBuyingCredits}
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  {isBuyingCredits ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
                  {t("billing.buyCredits", { amount: 500, price: "$10" })}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => buyCredits(2000)}
                  disabled={isBuyingCredits}
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  {isBuyingCredits ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
                  {t("billing.buyCredits", { amount: 2000, price: "$35" })}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="size-5 text-primary" />
              {t("billing.currentPlan")}
            </CardTitle>
            <CardDescription>{t("billing.currentPlanDesc", { plan: translatePlanName(subscription.plan, t) })}</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription.renewsAt && (
              <p className="text-sm text-muted mb-4">
                {t("billing.renewsOn", { date: new Date(subscription.renewsAt).toLocaleDateString() })}
              </p>
            )}
            
            <div className="space-y-2 mb-6">
              {PLANS.find(p => p.id === subscription.plan)?.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="size-4 text-primary" />
                  {translatePlanFeature(feature, t)}
                </div>
              ))}
            </div>

            {subscription.plan !== "business" && (
              <Button variant="default" className="w-full" onClick={() => {
                const nextPlan = PLANS[currentPlanIndex + 1];
                if (nextPlan) upgradePlan(nextPlan.id);
              }} disabled={isUpgrading}>
                {isUpgrading ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
                {t("billing.upgradeTo", { plan: translatePlanName(PLANS[currentPlanIndex + 1]?.name ?? "", t) })}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Options */}
      <section id="plans" className="scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold text-foreground">{t("billing.availablePlans")}</h3>
        <div className="grid gap-5 md:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${subscription.plan === plan.id ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle>{translatePlanName(plan.name, t)}</CardTitle>
                <CardDescription className="text-xl font-bold text-foreground mt-2">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span>{translatePlanFeature(f, t)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={subscription.plan === plan.id || isUpgrading}
                  onClick={() => upgradePlan(plan.id)}
                >
                  {subscription.plan === plan.id ? t("billing.currentPlan") : t("billing.upgrade")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function translatePlanName(plan: string, t: ReturnType<typeof useTranslation>["t"]) {
  const normalized = plan.toLowerCase();
  if (normalized === "free") return t("billing.free");
  if (normalized === "starter") return t("billing.starter");
  if (normalized === "pro") return t("billing.pro");
  if (normalized === "business") return t("billing.business");
  return plan;
}

function translatePlanFeature(feature: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (feature === "Everything in Free") return t("billing.featureEverythingFree" as any);
  if (feature === "Everything in Starter") return t("billing.featureEverythingStarter" as any);
  if (feature === "Everything in Pro") return t("billing.featureEverythingPro" as any);
  if (feature === "AI Assistant") return t("nav.aiAssistant");
  if (feature === "Ad Studio") return t("nav.adStudio");
  if (feature === "Image Generation") return t("nav.imageGeneration");
  if (feature === "Video Generation") return t("nav.videoGeneration");
  if (feature === "Viral Engine") return t("nav.viralEngine");
  if (feature === "Growth Engine") return t("nav.growthEngine");
  if (feature === "Analytics") return t("nav.analytics");
  if (feature === "Priority Support") return t("billing.prioritySupport");
  if (feature === "API Access") return t("billing.apiAccess");

  const creditsMatch = feature.match(/^(\d+) Credits\/mo$/);
  if (creditsMatch) return t("billing.featureCredits", { amount: creditsMatch[1] });

  return feature;
}
