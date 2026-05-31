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
      <CardContent className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary/75">{metric.label}</span>
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <p className="mt-6 terminal-title text-4xl font-bold text-white">{metric.value}</p>
          <Badge tone={metric.tone === "danger" ? "danger" : metric.tone === "warning" ? "warning" : "success"} className="mt-4 border-0 bg-transparent px-0">
            <DeltaIcon className="mr-1 size-3" />
            {metric.delta}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
