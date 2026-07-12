"use client";

import { motion } from "framer-motion";
import { CopyButton } from "./copy-button";
import { Idea } from "@/types/viral-engine";
import { Badge } from "@/components/ui/badge";
import { Video, TrendingUp, Target } from "lucide-react";

interface IdeaGridProps {
  ideas: Idea[];
}

export function IdeaGrid({ ideas }: IdeaGridProps) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {ideas.map((idea, idx) => {
        const isString = typeof idea === 'string';
        const title = isString ? idea : idea.title;
        const description = isString ? undefined : idea.description;
        const format = isString ? undefined : idea.format;
        const potentialReach = isString ? undefined : idea.potentialReach;
        const difficulty = isString ? undefined : idea.difficulty;

        if (isString) {
          return (
            <div key={idx} className="flex gap-4 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 relative group cursor-default">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                <span className="text-xs font-bold">{idx + 1}</span>
              </span>
              <div className="flex-1 pe-6 pt-1">
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">{title}</p>
              </div>
              <CopyButton data={idea} className="absolute end-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        }

        return (
          <div 
            key={idx}
            className="group relative flex flex-col p-6 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 h-full cursor-default"
          >
            <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base leading-snug tracking-tight">
                {title}
              </h4>
              <CopyButton data={idea} className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </div>

            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground mb-6 flex-1 relative z-10">
                {description}
              </p>
            )}

            {(format || potentialReach || difficulty) && (
              <div className="flex flex-wrap gap-2 mt-auto relative z-10 pt-5 border-t border-white/5">
                {format && (
                  <Badge variant="outline" className="bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground border-white/10 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg">
                    <Video className="size-3.5 text-primary" />
                    {format}
                  </Badge>
                )}
                {potentialReach && (
                  <Badge variant="outline" className="bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground border-white/10 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg">
                    <TrendingUp className="size-3.5 text-emerald-400" />
                    {potentialReach}
                  </Badge>
                )}
                {difficulty && (
                  <Badge variant="outline" className="bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground border-white/10 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg">
                    <Target className="size-3.5 text-orange-400" />
                    {difficulty}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
