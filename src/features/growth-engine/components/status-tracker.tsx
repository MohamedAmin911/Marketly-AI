import { Check, Circle, Loader2 } from "lucide-react";

import type { GrowthEngineStage } from "@/features/growth-engine/types";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

const STAGES: GrowthEngineStage[] = [
  "Draft",
  "Strategy Generated",
  "Campaigns Generated",
  "Storyboards Generated",
];

const getStageTranslationKey = (stage: GrowthEngineStage): TranslationKey => {
  switch (stage) {
    case "Draft": return "common.draft";
    case "Strategy Generated": return "stage.strategy";
    case "Campaigns Generated": return "stage.campaigns";
    case "Storyboards Generated": return "stage.storyboards";
  }
};

export function StatusTracker({
  activeStage,
  completedStages,
  isGenerating,
}: {
  activeStage: GrowthEngineStage;
  completedStages: GrowthEngineStage[];
  isGenerating?: boolean;
}) {
  const { t } = useTranslation();
  const completed = new Set(completedStages);

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage) => {
        const isComplete = completed.has(stage);
        const isCurrent = stage === activeStage;
        const isLoading = isGenerating && !isComplete;

        return (
          <div
            key={stage}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-lg border bg-surface px-3 py-2",
              isComplete ? "border-primary/30 text-foreground" : isLoading ? "border-primary/50 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]" : "border-border text-muted",
              isCurrent && !isLoading && "shadow-[0_0_0_3px_var(--focus-ring)]",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border",
                isComplete ? "border-primary/40 bg-primary/10 text-primary" : isLoading ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card",
              )}
            >
              {isComplete ? <Check className="size-4" /> : isLoading ? <Loader2 className="size-4 animate-spin" /> : <Circle className="size-3" />}
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase leading-4">{t(getStageTranslationKey(stage))}</span>
          </div>
        );
      })}
    </div>
  );
}
