import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ActionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
};

export function ActionCard({ title, description, icon: Icon, children, className }: ActionCardProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-all hover:border-primary/40 hover:bg-surface-container-high focus-within:ring-2 focus-within:ring-primary/70",
        className,
      )}
    >
      {Icon ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
          <Icon className="size-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description ? <span className="block truncate text-xs text-muted">{description}</span> : null}
      </span>
      {children ?? <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />}
    </div>
  );
}
