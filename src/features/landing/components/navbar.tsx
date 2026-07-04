"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LandingNavbar() {
  const { t } = useTranslation();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 lg:px-12 backdrop-blur-xl border-b border-border bg-background/60"
    >
      <div className="flex items-center gap-4">
        {/* We override mt-10 mb-4 from BrandMark by passing !mt-0 !mb-0 via logoClassName if possible, or wrapping */}
        <div className="[&>div]:mt-0 [&>div]:mb-0 [&>div_img]:h-48">
          <BrandMark />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        <Link href="#features" className="text-sm font-medium text-muted hover:text-foreground transition-colors">{t("landing.features")}</Link>
        <Link href="#pricing" className="text-sm font-medium text-muted hover:text-foreground transition-colors">{t("landing.pricing")}</Link>
        <Link href="#partners" className="text-sm font-medium text-muted hover:text-foreground transition-colors">{t("landing.partners")}</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
          {t("auth.signIn")}
        </Link>
        <LanguageToggle />
        <Button asChild className="rounded-full shadow-glow neon-gradient">
          <Link href="/signup">{t("landing.getStarted")}</Link>
        </Button>
      </div>
    </motion.nav>
  );
}
