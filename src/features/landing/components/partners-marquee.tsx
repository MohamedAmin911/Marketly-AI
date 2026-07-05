"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PARTNERS = [
  { name: "Microsoft", url: "microsoft.com" },
  { name: "Google", url: "google.com" },
  { name: "Amazon", url: "amazon.com" },
  { name: "Meta", url: "meta.com" },
  { name: "Adobe", url: "adobe.com" },
  { name: "Figma", url: "figma.com" },
  { name: "Slack", url: "slack.com" },
  { name: "Notion", url: "notion.so" }, 
  { name: "OpenAI", url: "openai.com" },
  { name: "Airbnb", url: "airbnb.com" },
];

export function PartnersMarquee() {
  const { t } = useTranslation();
  return (
    <section id="partners" className="py-12 border-y border-border/50 bg-background overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-64 md:w-96 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-64 md:w-96 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />
      <h2 className="text-center font-display text-3xl md:text-5xl font-bold mb-16 text-foreground">
        {t("landing.partnersTitle")} <span className="text-primary">{t("landing.partnersHighlight")}</span>
      </h2>

      <div className="flex w-full overflow-hidden">
        <motion.div
          animate={{ x: [0, "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 25,
          }}
          className="flex whitespace-nowrap gap-16 pr-16 w-max items-center"
        >
          {PARTNERS.map((partner, idx) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={idx} src={`https://img.logo.dev/${partner.url}?token=pk_LnYu_mYyRBCS-_8nhWeJaw`} alt={partner.name} className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-all rounded-md" />
          ))}
          {/* Duplicate for infinite loop illusion */}
          {PARTNERS.map((partner, idx) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={`dup-${idx}`} src={`https://img.logo.dev/${partner.url}?token=pk_LnYu_mYyRBCS-_8nhWeJaw`} alt={partner.name} className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-all rounded-md" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
