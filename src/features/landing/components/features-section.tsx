"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Brain, Image as ImageIcon, Video, ChartLine, LayoutDashboard, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("landing.feature1Title"),
      description: t("landing.feature1Desc"),
      icon: ChartLine,
      image: "/growth engine.png",
    },
    {
      title: t("landing.feature2Title"),
      description: t("landing.feature2Desc"),
      icon: MessageSquare,
      image: "/ai assitant.png",
    },
    {
      title: t("landing.feature3Title"),
      description: t("landing.feature3Desc"),
      icon: Brain,
      image: "/ad studio.png",
    },
    {
      title: t("landing.feature4Title"),
      description: t("landing.feature4Desc"),
      icon: ImageIcon,
      image: "/image generation.png",
    },
    {
      title: t("landing.feature5Title"),
      description: t("landing.feature5Desc"),
      icon: Video,
      image: "/video generation.png",
    },
    {
      title: t("landing.feature6Title"),
      description: t("landing.feature6Desc"),
      icon: LayoutDashboard,
      image: "/dashboard.png",
    },
    {
      title: t("landing.feature7Title"),
      description: t("landing.feature7Desc"),
      icon: BarChart3,
      image: "/analytics.png",
    },
  ];

  return (
    <section id="features" className="py-24 relative z-10 bg-background border-t border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl font-bold mb-6"
          >
            {t("landing.featuresTitle")} <span className="text-primary">{t("landing.featuresHighlight")}</span> {t("landing.featuresSubtitle")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted text-lg"
          >
            {t("landing.featuresDesc")}
          </motion.p>
        </div>

        <div className="space-y-32">
          {features.map((feature, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={idx} className="grid lg:grid-cols-2 lg:items-center gap-12 lg:gap-24">
                
                {/* Text Side */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
                  className={cn("w-full lg:max-w-xl", isEven ? "lg:justify-self-end" : "lg:order-2 lg:justify-self-start")}
                >
                  <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <feature.icon className="size-8" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-display font-bold mb-6 text-foreground">{feature.title}</h3>
                  <p className="text-lg text-muted leading-relaxed">{feature.description}</p>
                </motion.div>

                {/* Image Side */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.3, delay: 0.1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  className={cn("w-full max-w-2xl mx-auto lg:max-w-none relative group", isEven ? "lg:order-2" : "lg:order-1")}
                >
                  <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                  <div className="relative rounded-2xl border border-border/50 bg-card/40 p-2 shadow-[var(--panel-shadow)] backdrop-blur-sm overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={1000}
                      height={700}
                      className="rounded-xl border border-border/50 object-cover w-full shadow-2xl"
                    />
                  </div>
                </motion.div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
