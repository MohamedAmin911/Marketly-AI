import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  delta?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ label, value, description, delta, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("min-h-32", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-muted">{label}</span>
          {Icon ? (
            <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{value}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {delta ? <Badge tone="success">{delta}</Badge> : null}
            {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
