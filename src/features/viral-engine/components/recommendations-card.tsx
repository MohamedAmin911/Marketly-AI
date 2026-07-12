"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

interface RecommendationsCardProps {
  recommendations: string | string[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  if (!recommendations || (Array.isArray(recommendations) && recommendations.length === 0)) return null;

  return (
    <div className="p-8 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
      <div className="absolute top-0 end-0 p-6 opacity-5 pointer-events-none">
        <Sparkles className="size-32 text-primary" />
      </div>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none relative z-10 prose-p:leading-relaxed prose-li:marker:text-primary">
        {Array.isArray(recommendations) ? (
          <ul className="space-y-4">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-4 text-sm leading-relaxed text-foreground/90 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ReactMarkdown>{typeof recommendations === 'string' ? recommendations : String(recommendations)}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
