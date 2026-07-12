"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { useTranslation } from "@/lib/i18n/useTranslation";

export function LoadingState() {
  const { t } = useTranslation();
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    t("viralEngine.loading.step1"),
    t("viralEngine.loading.step2"),
    t("viralEngine.loading.step3"),
    t("viralEngine.loading.step4"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md text-center flex flex-col items-center">
        <Loader2 className="size-10 text-primary animate-spin mb-6" />
        
        <div className="h-8 relative w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium text-foreground absolute inset-0"
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-2/3 rounded-full neon-gradient shimmer" />
        </div>
      </div>
    </div>
  );
}
