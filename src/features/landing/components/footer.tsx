"use client";

import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2">
            <div className="[&>div]:mt-0 [&>div]:mb-4 [&>div_img]:h-24 -ml-2">
              <BrandMark />
            </div>
            <p className="text-muted text-sm max-w-sm">{t("landing.footerDescription")}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("landing.product")}</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="#features" className="hover:text-primary transition-colors">{t("landing.features")}</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">{t("landing.pricing")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t("landing.integrations")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t("landing.changelog")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("landing.legal")}</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li><Link href="#" className="hover:text-primary transition-colors">{t("landing.privacy")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t("landing.terms")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">{t("landing.cookies")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 text-center text-sm text-muted">
          <p>© {new Date().getFullYear()} Marketly AI. {t("landing.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
