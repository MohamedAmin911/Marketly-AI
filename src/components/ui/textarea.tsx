import type * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-lg border border-border bg-surface px-3 py-3 text-sm leading-6 text-foreground transition-all placeholder:text-muted/60 focus:border-primary/60 focus:bg-card focus:shadow-[0_0_0_3px_var(--focus-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
