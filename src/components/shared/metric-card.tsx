import { ArrowUpRight, Minus, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Metric } from "@/types/common";

const toneIcon = {
  success: ArrowUpRight,
  warning: Minus,
  danger: TrendingDown,
  neutral: ArrowUpRight,
} satisfies Record<Metric["tone"], LucideIcon>;

export function MetricCard({ metric, icon: Icon }: { metric: Metric; icon: LucideIcon }) {
  const DeltaIcon = toneIcon[metric.tone];

  return (
    <Card className="min-h-32">
      <CardContent className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-muted">{metric.label}</span>
          <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <p className="font-display text-4xl font-bold text-foreground">{metric.value}</p>
          <Badge tone={metric.tone === "danger" ? "danger" : metric.tone === "warning" ? "warning" : "success"} className="mt-4">
            <DeltaIcon className="mr-1 size-3" />
            {metric.delta}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
