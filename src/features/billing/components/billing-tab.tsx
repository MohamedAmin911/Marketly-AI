"use client";

import { useBilling } from "@/features/billing/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Check, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PLANS = [
  { id: "free", name: "Free", price: "$0", features: ["Ad Studio", "Image Generation", "Video Generation"] },
  { id: "starter", name: "Starter", price: "$49/mo", features: ["Everything in Free", "AI Assistant", "500 Credits/mo"] },
  { id: "pro", name: "Pro", price: "$99/mo", features: ["Growth Engine", "Analytics", "1500 Credits/mo"] },
  { id: "business", name: "Business", price: "$249/mo", features: ["Priority Support", "API Access", "4000 Credits/mo"] },
];

export function BillingTab() {
  const { billing, isLoading, upgradePlan, isUpgrading, buyCredits, isBuyingCredits } = useBilling();

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
          Failed to load billing information.
        </CardContent>
      </Card>
    );
  }

  const { subscription, usage } = billing;
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
              Credits Usage
            </CardTitle>
            <CardDescription>Track your monthly credits and purchased top-ups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Monthly Credits</span>
                <span className="text-muted">{subscription.monthlyCreditsRemaining} / {subscription.monthlyCredits}</span>
              </div>
              <Progress value={creditsPercentage} className="h-2" />
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Purchased Credits</p>
                  <p className="text-xs text-muted">Never expire. Used when monthly credits run out.</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{subscription.purchasedCredits}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => buyCredits(500)}
                  disabled={isBuyingCredits}
                >
                  Buy 500 ($10)
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => buyCredits(2000)}
                  disabled={isBuyingCredits}
                >
                  Buy 2000 ($35)
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
              Current Plan
            </CardTitle>
            <CardDescription>Your workspace is on the <strong className="text-foreground capitalize">{subscription.plan}</strong> plan.</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription.renewsAt && (
              <p className="text-sm text-muted mb-4">
                Renews on {new Date(subscription.renewsAt).toLocaleDateString()}
              </p>
            )}
            
            <div className="space-y-2 mb-6">
              {PLANS.find(p => p.id === subscription.plan)?.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="size-4 text-primary" />
                  {feature}
                </div>
              ))}
            </div>

            {subscription.plan !== "business" && (
              <Button variant="default" className="w-full" onClick={() => {
                const nextPlan = PLANS[currentPlanIndex + 1];
                if (nextPlan) upgradePlan(nextPlan.id);
              }} disabled={isUpgrading}>
                {isUpgrading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Upgrade to {PLANS[currentPlanIndex + 1]?.name}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Options */}
      <section id="plans" className="scroll-mt-24">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Available Plans</h3>
        <div className="grid gap-5 md:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={subscription.plan === plan.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-xl font-bold text-foreground mt-2">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-2 text-sm text-muted">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={subscription.plan === plan.id ? "outline" : "secondary"} 
                  className="w-full"
                  disabled={subscription.plan === plan.id || isUpgrading}
                  onClick={() => upgradePlan(plan.id)}
                >
                  {subscription.plan === plan.id ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
