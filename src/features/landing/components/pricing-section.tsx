"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started and exploring AI tools.",
    features: [
      "50 Lifetime Credits",
      "Ad Studio",
      "Image Generation",
      "Video Generation",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$49",
    description: "For solo creators and small businesses.",
    features: [
      "500 Credits / month",
      "Everything in Free",
      "AI Assistant",
      "Email Support",
    ],
    cta: "Start Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99",
    description: "For marketing teams scaling their growth.",
    features: [
      "1,500 Credits / month",
      "Growth Engine",
      "Analytics Dashboard",
      "Priority Support",
    ],
    cta: "Get Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "$249",
    description: "Dedicated AI models for large agencies.",
    features: [
      "4,000 Credits / month",
      "API Access",
      "Commercial Rights",
      "Dedicated Account Manager",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Simple, transparent <span className="text-primary">pricing</span>
          </h2>
          <p className="text-muted text-lg">
            Invest in your growth. Cancel anytime.
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
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.price !== "$0" && <span className="text-muted text-sm">/mo</span>}
                </div>
                <p className="text-muted text-sm">{tier.description}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
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
