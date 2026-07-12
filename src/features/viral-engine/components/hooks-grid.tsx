"use client";

import { ViralHook } from "@/types/viral-engine";
import { MessageSquareQuote } from "lucide-react";
import { CopyButton } from "./copy-button";

interface HooksGridProps {
  hooks: ViralHook[];
}

export function HooksGrid({ hooks }: HooksGridProps) {
  if (!hooks || hooks.length === 0) return null;

  return (
    <div className="grid gap-3">
      {hooks.map((hook, idx) => {
        const isString = typeof hook === 'string';
        const text = isString ? hook : hook.text;
        const id = isString ? idx : (hook.id || idx);

        return (
          <div 
            key={id}
            className="group relative flex items-start gap-4 p-6 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 overflow-hidden cursor-default"
          >
            <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            <MessageSquareQuote className="size-6 text-primary shrink-0 opacity-80 mt-1" />
            <p className="text-foreground/90 font-medium flex-1 leading-relaxed text-sm">{text}</p>
            <CopyButton data={hook} className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
}
