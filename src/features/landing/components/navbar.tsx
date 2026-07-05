"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export function LandingNavbar({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    // Set initial hash
    if (typeof window !== "undefined") {
      setActiveHash(window.location.hash);
    }
    
    // Update hash when hash changes in URL
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 lg:px-12 backdrop-blur-xl border-b border-border bg-background/60"
    >
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <BrandMark />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        <Link 
          href="/#features" 
          onClick={() => pathname === "/" && setActiveHash("#features")}
          className={cn("text-sm font-medium transition-colors hover:text-primary", activeHash === "#features" && pathname === "/" ? "text-primary drop-shadow-[0_0_8px_var(--primary)]" : "text-muted")}
        >
          {t("landing.features")}
        </Link>
        <Link 
          href="/#pricing" 
          onClick={() => pathname === "/" && setActiveHash("#pricing")}
          className={cn("text-sm font-medium transition-colors hover:text-primary", activeHash === "#pricing" && pathname === "/" ? "text-primary drop-shadow-[0_0_8px_var(--primary)]" : "text-muted")}
        >
          {t("landing.pricing")}
        </Link>
        <Link 
          href="/#partners" 
          onClick={() => pathname === "/" && setActiveHash("#partners")}
          className={cn("text-sm font-medium transition-colors hover:text-primary", activeHash === "#partners" && pathname === "/" ? "text-primary drop-shadow-[0_0_8px_var(--primary)]" : "text-muted")}
        >
          {t("landing.partners")}
        </Link>
        <Link 
          href="/contact" 
          onClick={() => setActiveHash("")}
          className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/contact" ? "text-primary drop-shadow-[0_0_8px_var(--primary)]" : "text-muted")}
        >
          {t("contact.title")}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Button asChild className="rounded-full shadow-glow neon-gradient">
            <Link href="/dashboard">{t("nav.dashboard")}</Link>
          </Button>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              {t("auth.signIn")}
            </Link>
            <Button asChild className="rounded-full shadow-glow neon-gradient">
              <Link href="/signup">{t("landing.getStarted")}</Link>
            </Button>
          </>
        )}
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </motion.nav>
  );
}
