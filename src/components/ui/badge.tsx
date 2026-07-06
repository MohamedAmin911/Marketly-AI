import type * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger";
  variant?: "default" | "secondary" | "destructive";
};

const tones = {
  default: "border-border bg-surface-container text-muted",
  success: "border-primary/30 bg-primary/10 text-primary",
  warning: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  danger: "border-red-300/25 bg-red-300/10 text-red-200",
};

export function Badge({ className, tone, variant, ...props }: BadgeProps) {
  const resolvedTone = tone ?? (variant === "destructive" ? "danger" : variant === "secondary" ? "default" : "success");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]",
        tones[resolvedTone],
        className,
      )}
      {...props}
    />
  );
}
