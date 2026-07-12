"use client";

import { motion } from "framer-motion";
import { CurrentTrend } from "@/types/viral-engine";
import { TrendingUp, Activity } from "lucide-react";
import { CopyButton } from "./copy-button";

interface TrendingTopicsProps {
  topics: CurrentTrend[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topics.map((topic, index) => {
        const isString = typeof topic === 'string';
        const topicText = isString ? topic : topic.topic;
        const platform = isString ? undefined : topic.platform;
        const trendScore = isString ? undefined : topic.trendScore;
        const popularity = isString ? undefined : topic.popularity;
        const id = isString ? index : (topic.id || index);

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col p-6 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 relative group h-full cursor-default"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg leading-snug tracking-tight">{topicText}</h4>
              <CopyButton data={topic} className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </div>
            
            {!isString && (platform || trendScore || popularity) && (
              <div className="flex flex-wrap items-center gap-2 mt-auto pt-5 border-t border-white/5">
                {platform && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    {platform}
                  </span>
                )}
                {trendScore && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-lg border border-orange-400/20">
                    <TrendingUp className="size-3.5" />
                    {trendScore}
                  </span>
                )}
                {popularity && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    <Activity className="size-3.5" />
                    {popularity}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
