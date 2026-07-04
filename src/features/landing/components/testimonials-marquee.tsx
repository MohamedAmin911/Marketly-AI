"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import type { TranslationKey } from "@/lib/i18n/translations";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "CMO at Stripe",
    contentKey: "landing.testimonial1",
    logo: "https://img.logo.dev/stripe.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "David Chen",
    role: "Growth Lead at Vercel",
    contentKey: "landing.testimonial2",
    logo: "https://img.logo.dev/vercel.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Elena Rodriguez",
    role: "E-commerce Founder",
    contentKey: "landing.testimonial3",
    logo: "https://img.logo.dev/shopify.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Michael Chang",
    role: "Digital Marketing Director",
    contentKey: "landing.testimonial4",
    logo: "https://img.logo.dev/netflix.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Jessica Walsh",
    role: "Social Media Manager",
    contentKey: "landing.testimonial5",
    logo: "https://img.logo.dev/spotify.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
] satisfies Array<{
  contentKey: TranslationKey;
  logo: string;
  name: string;
  role: string;
}>;

export function TestimonialsMarquee() {
  const { t, isRtl } = useTranslation();

  return (
    <section className="py-24 overflow-hidden relative bg-background">
      <div className="text-center max-w-2xl mx-auto mb-16 px-6">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
          {t("landing.testimonialsTitle")} <span className="text-primary">{t("landing.testimonialsHighlight")}</span>
        </h2>
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-64 md:w-96 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-64 md:w-96 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

      <div className="flex w-full overflow-hidden" dir="ltr">
        <motion.div
          animate={{ x: isRtl ? ["-50%", "0%"] : ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 30,
          }}
          className="flex gap-6 pr-6 w-max items-center"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={idx}
              className="w-[350px] shrink-0 glass-panel p-6 rounded-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-primary" />
                  ))}
                </div>
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1">
                &ldquo;{t(testimonial.contentKey)}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
