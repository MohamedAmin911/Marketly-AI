import { Check, Circle } from "lucide-react";

import type { GrowthEngineStage } from "@/features/growth-engine/types";
import { cn } from "@/lib/utils";

const STAGES: GrowthEngineStage[] = [
  "Draft",
  "Strategy Generated",
  "Campaigns Generated",
  "Storyboards Generated",
  "Images Generated",
  "Videos Generated",
];

export function StatusTracker({
  activeStage,
  completedStages,
}: {
  activeStage: GrowthEngineStage;
  completedStages: GrowthEngineStage[];
}) {
  const completed = new Set(completedStages);

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
      {STAGES.map((stage) => {
        const isComplete = completed.has(stage);
        const isCurrent = stage === activeStage;

        return (
          <div
            key={stage}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-lg border bg-black/20 px-3 py-2",
              isComplete ? "border-primary/30 text-foreground" : "border-white/10 text-muted",
              isCurrent && "shadow-[0_0_22px_rgba(114,255,95,0.12)]",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border",
                isComplete ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 bg-white/[0.03]",
              )}
            >
              {isComplete ? <Check className="size-4" /> : <Circle className="size-3" />}
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase leading-4">{stage}</span>
          </div>
        );
      })}
    </div>
  );
}
