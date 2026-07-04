"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-[100%] pointer-events-none" 
      />

      <div className="container relative z-10 px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 rounded-full border border-primary/20"
        >
          <Sparkles className="size-3" />
          {t("landing.future")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
        >
          {t("landing.heroTitleStart")} <span className="gradient-text">{t("landing.heroTitleHighlight")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted leading-relaxed"
        >
          {t("landing.heroDescription")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Button size="lg" asChild className="rounded-full px-8 text-base shadow-glow neon-gradient">
            <Link href="/signup">
              {t("landing.startBuildingFree")} <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="rounded-full px-8 text-base bg-surface hover:bg-card border-border">
            <Link href="#features">{t("landing.exploreFeatures")}</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 md:mt-24 relative mx-auto max-w-5xl"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative group cursor-pointer"
          >
            {/* Interactive glow that activates on hover */}
            <div className="absolute -inset-4 bg-primary/15 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10 rounded-2xl border border-border bg-card/40 p-2 shadow-[var(--panel-shadow)] backdrop-blur-sm overflow-hidden transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]"
            >
              <Image
                src="/ww.png"
                alt="Marketly AI Dashboard"
                width={1200}
                height={800}
                className="rounded-xl border border-border/50 object-cover w-full shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
                priority
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
