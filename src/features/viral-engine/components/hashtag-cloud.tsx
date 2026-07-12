"use client";

import { Hash } from "lucide-react";
import { CopyButton } from "./copy-button";

interface HashtagCloudProps {
  hashtags: string[];
}

export function HashtagCloud({ hashtags }: HashtagCloudProps) {
  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-xl border border-border/50 bg-card/30">
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, idx) => (
          <div 
            key={idx} 
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/50 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm font-medium text-foreground cursor-default"
          >
            <Hash className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
            {tag}
            <CopyButton 
              data={`#${tag}`} 
              variant="ghost" 
              size="icon" 
              className="size-5 ms-1 opacity-0 group-hover:opacity-100 hover:bg-transparent -me-1" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
