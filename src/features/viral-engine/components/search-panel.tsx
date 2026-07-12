"use client";

import { useForm } from "react-hook-form";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ViralEngineRequest } from "@/types/viral-engine";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SearchPanelProps {
  onSubmit: (data: ViralEngineRequest) => void;
  isLoading: boolean;
}

export function SearchPanel({ onSubmit, isLoading }: SearchPanelProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<ViralEngineRequest>({
    defaultValues: {
      brandName: "",
      industry: "",
      targetAudience: "",
      goal: "",
      brandBrief: "",
    },
  });

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm border border-border/50 bg-card/40 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="brandName">{t("viralEngine.search.brandName")} <span className="text-destructive">*</span></Label>
            <Input 
              id="brandName" 
              placeholder={t("viralEngine.search.brandNamePlaceholder")} 
              disabled={isLoading}
              {...register("brandName", { required: true })} 
              className={errors.brandName ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">{t("viralEngine.search.industry")} <span className="text-destructive">*</span></Label>
            <Input 
              id="industry" 
              placeholder={t("viralEngine.search.industryPlaceholder")} 
              disabled={isLoading}
              {...register("industry", { required: true })}
              className={errors.industry ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">{t("viralEngine.search.targetAudience")}</Label>
            <Input 
              id="targetAudience" 
              placeholder={t("viralEngine.search.targetAudiencePlaceholder")} 
              disabled={isLoading}
              {...register("targetAudience")} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">{t("viralEngine.search.goal")}</Label>
            <Input 
              id="goal" 
              placeholder={t("viralEngine.search.goalPlaceholder")} 
              disabled={isLoading}
              {...register("goal")} 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="brandBrief">{t("viralEngine.search.brandBrief")} <span className="text-destructive">*</span></Label>
            <Textarea
              id="brandBrief"
              className={errors.brandBrief ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder={t("viralEngine.search.brandBriefPlaceholder")}
              disabled={isLoading}
              {...register("brandBrief", { required: true })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full md:w-auto min-w-[200px] neon-gradient shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("viralEngine.search.generatingBtn")}
              </>
            ) : (
              <>
                <Sparkles className="me-2 h-4 w-4" />
                {t("viralEngine.search.generateBtn")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
