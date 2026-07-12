"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function PricingSection() {
  const { t } = useTranslation();

  const TIERS = [
    {
      name: t("landing.tierFreeName", { defaultValue: "Free" }),
      price: "$0",
      description: t("landing.tierFreeDesc", { defaultValue: "For exploring Marketly AI capabilities." }),
      features: ["Ad Studio", "Image Generation", "Video Generation"],
      cta: t("landing.tierFreeCta", { defaultValue: "Get Started" }),
      highlight: false,
    },
    {
      name: t("landing.tierStarterName", { defaultValue: "Starter" }),
      price: "$49",
      description: t("landing.tierStarterDesc", { defaultValue: "Perfect for independent creators." }),
      features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "500 Credits/mo"],
      cta: t("landing.tierStarterCta", { defaultValue: "Start Free Trial" }),
      highlight: false,
    },
    {
      name: t("landing.tierProName", { defaultValue: "Pro" }),
      price: "$99",
      description: t("landing.tierProDesc", { defaultValue: "Ideal for growing marketing teams." }),
      features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "Growth Engine", "Analytics", "1500 Credits/mo"],
      cta: t("landing.tierProCta", { defaultValue: "Start Free Trial" }),
      highlight: true,
    },
    {
      name: t("landing.tierBusinessName", { defaultValue: "Business" }),
      price: "$249",
      description: t("landing.tierBusinessDesc", { defaultValue: "Advanced features for enterprises." }),
      features: ["Ad Studio", "Image Generation", "Video Generation", "AI Assistant", "Viral Engine", "Growth Engine", "Analytics", "Priority Support", "API Access", "4000 Credits/mo"],
      cta: t("landing.tierBusinessCta", { defaultValue: "Contact Sales" }),
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
            {t("landing.pricingTitle")} <span className="text-primary">{t("landing.pricingHighlight")}</span>
          </h2>
          <p className="text-muted text-lg">
            {t("landing.pricingDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative glass-panel rounded-2xl p-6 flex flex-col ${
                tier.highlight ? "border-primary shadow-[0_0_40px_rgba(34,197,94,0.15)] scale-105 z-10 bg-primary/[0.02]" : "border-border/50"
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {t("landing.pricingMostPopular")}
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.price !== "$0" && <span className="text-muted text-sm">{t("landing.pricingMo")}</span>}
                </div>
                <p className="text-muted text-sm">{tier.description}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{translatePlanFeature(feature, t)}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.highlight ? "default" : "secondary"}
                className={`w-full rounded-full ${tier.highlight ? "neon-gradient shadow-glow" : "bg-surface hover:bg-card border-border"}`}
                asChild
              >
                <Link href="/dashboard">{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function translatePlanFeature(feature: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (feature === "AI Assistant") return t("nav.aiAssistant");
  if (feature === "Ad Studio") return t("nav.adStudio");
  if (feature === "Image Generation") return t("nav.imageGeneration");
  if (feature === "Video Generation") return t("nav.videoGeneration");
  if (feature === "Viral Engine") return t("nav.viralEngine");
  if (feature === "Growth Engine") return t("nav.growthEngine");
  if (feature === "Analytics") return t("nav.analytics");
  if (feature === "Priority Support") return t("billing.prioritySupport", { defaultValue: "Priority Support" });
  if (feature === "API Access") return t("billing.apiAccess", { defaultValue: "API Access" });

  const creditsMatch = feature.match(/^(\d+) Credits\/mo$/);
  if (creditsMatch) return t("billing.featureCredits", { amount: creditsMatch[1], defaultValue: `${creditsMatch[1]} Credits/mo` });

  return feature;
}
