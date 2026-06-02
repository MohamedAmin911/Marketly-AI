import type * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-lg border border-primary/15 bg-black/20 px-3 font-mono text-sm text-foreground transition-all placeholder:text-muted/55 focus:border-cyan-glow/70 focus:bg-primary/[0.04] focus:shadow-[0_0_20px_rgba(114,255,95,0.16)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
