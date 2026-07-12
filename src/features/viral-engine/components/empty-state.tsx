"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-10 rounded-3xl max-w-lg border border-border/50 bg-card/40 backdrop-blur-sm"
      >
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <Sparkles className="size-10" />
        </div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-4">{t("viralEngine.empty.title")}</h3>
        <p className="text-muted text-lg">
          {t("viralEngine.empty.desc")}
        </p>
      </motion.div>
    </div>
  );
}
