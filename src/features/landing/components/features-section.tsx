"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Brain, Image as ImageIcon, Video, ChartLine, LayoutDashboard, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI Growth Engine",
    description: "Input your brand and target audience, and our AI constructs a multi-stage growth plan complete with custom campaigns and actionable strategies.",
    icon: ChartLine,
    image: "/growth engine.png",
  },
  {
    title: "AI Chat Assistant",
    description: "Your 24/7 strategic marketing co-pilot. Bounce ideas, refine copy, or ask for data-driven insights in a natural conversational interface.",
    icon: MessageSquare,
    image: "/ai assitant.png",
  },
  {
    title: "Campaign Generator",
    description: "Instantly create high-converting copy, hooks, and creative angles tailored for Instagram, LinkedIn, and TikTok.",
    icon: Brain,
    image: "/ad studio.png",
  },
  {
    title: "AI Image Generation",
    description: "Generate breathtaking, photorealistic product shots and lifestyle imagery that perfectly matches your brand aesthetic.",
    icon: ImageIcon,
    image: "/image generation.png",
  },
  {
    title: "Video Storyboarding",
    description: "Turn simple concepts into complete video storyboards with scene-by-scene prompts, dialogue, and camera angles.",
    icon: Video,
    image: "/video generation.png",
  },
  {
    title: "Command Dashboard",
    description: "A centralized hub to track all your AI generations, manage campaigns, and organize your marketing assets in one beautiful space.",
    icon: LayoutDashboard,
    image: "/dashboard.png",
  },
  {
    title: "Performance Analytics",
    description: "Visualize the impact of your campaigns with real-time metrics, KPI tracking, and actionable insights to optimize your strategy.",
    icon: BarChart3,
    image: "/analytics.png",
  },
];

export function FeaturesSection() {
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
            Everything you need to <span className="text-primary">dominate</span> your market
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted text-lg"
          >
            A complete suite of AI tools designed to replace agency retainers and accelerate your content pipeline.
          </motion.p>
        </div>

        <div className="space-y-32">
          {features.map((feature, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={idx} className={cn("flex flex-col lg:items-center gap-12 lg:gap-20", isEven ? "lg:flex-row" : "lg:flex-row-reverse")}>
                
                {/* Text Side */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
                  className="flex-1 lg:max-w-xl"
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
                  className="flex-1 lg:flex-none lg:w-5/12 relative group mx-auto w-full max-w-2xl lg:max-w-none"
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
