"use client";

import { AlertTriangle, BriefcaseBusiness, Building2, ImagePlus, Loader2, Sparkles, Target, Upload, Users, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GrowthEngineResults } from "@/features/growth-engine/components/growth-engine-results";
import { StatusTracker } from "@/features/growth-engine/components/status-tracker";
import { getGrowthProject, submitGrowthEngineWorkflow } from "@/features/growth-engine/services";
import type { GrowthEngineForm, GrowthEngineStage, GrowthProjectRecord } from "@/features/growth-engine/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

function stageFromStatus(status: GrowthProjectRecord["status"]): GrowthEngineStage {
  switch (status) {
    case "strategy_ready":
      return "Strategy Generated";
    case "campaigns_ready":
      return "Campaigns Generated";
    case "storyboards_ready":
    case "completed":
      return "Storyboards Generated";
    case "failed":
      return "Draft";
    default:
      return "Draft";
  }
}

function completedStagesFromProject(project: GrowthProjectRecord): GrowthEngineStage[] {
  const order: GrowthEngineStage[] = ["Draft", "Strategy Generated", "Campaigns Generated", "Storyboards Generated"];
  let index = 0;

  if (project.status === "strategy_ready" || project.strategy) index = 1;
  if (project.status === "campaigns_ready" || project.campaigns.length) index = 2;
  if (project.status === "storyboards_ready" || project.status === "completed" || project.storyboards.length) index = 3;

  return order.slice(0, index + 1);
}

const POLL_INTERVAL_MS = 5_000;

export function GrowthEngineView() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [form, setForm] = useState<GrowthEngineForm>({
    brandBrief: "",
    brandName: "",
    industry: "",
    marketingGoal: "",
    productImage: null,
    targetAudience: "",
  });

  const updateField = useCallback(<K extends keyof GrowthEngineForm>(key: K, value: GrowthEngineForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [project, setProject] = useState<GrowthProjectRecord | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("latest_growth_project_id");
    if (savedId && !projectId) setProjectId(savedId);
  }, [projectId]);

  useEffect(() => {
    if (projectId) localStorage.setItem("latest_growth_project_id", projectId);
  }, [projectId]);

  const projectQuery = useQuery({
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await getGrowthProject(projectId ?? "");
      return response.project;
    },
    queryKey: ["growth-engine-project", projectId],
    refetchInterval: projectId ? POLL_INTERVAL_MS : false,
  });

  const liveProject = projectQuery.data ?? project;
  const workflowError = error ?? liveProject?.lastError;
  const completedStages = submitting ? [] : liveProject ? completedStagesFromProject(liveProject) : [];
  const activeStage: GrowthEngineStage = submitting
    ? "Draft"
    : liveProject
      ? liveProject.status === "failed"
        ? completedStages.at(-1) ?? "Draft"
        : stageFromStatus(liveProject.status)
      : "Draft";
  const isGenerating = submitting || (Boolean(projectId) && liveProject?.status !== "completed" && liveProject?.status !== "storyboards_ready" && liveProject?.status !== "failed");
  const canSubmit = Boolean(form.brandName.trim()) && !submitting;

  const previousGenerating = useRef(isGenerating);
  useEffect(() => {
    if (previousGenerating.current && !isGenerating) {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-generations"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    }
    previousGenerating.current = isGenerating;
  }, [isGenerating, queryClient]);

  async function handleSubmit() {
    try {
      setError(null);
      setSubmitting(true);

      const result = await submitGrowthEngineWorkflow({
        audience: form.targetAudience,
        brandName: form.brandName,
        brief: form.brandBrief,
        goal: form.marketingGoal,
        industry: form.industry,
        productImage: form.productImage ?? undefined,
      });

      setProject(result.project);
      setProjectId(result.project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell 
      title={
        <div className="flex items-center gap-3">
          {t("growth.title")}
          <Badge tone="success" className="font-normal border-primary/20 bg-primary/10 text-primary">
            <Zap className="size-3.5 me-1 inline-block" /> 10 Credits/Generation
          </Badge>
        </div>
      } 
      description={t("growth.description")}
    >
      <div className="grid gap-6 xl:grid-cols-[26rem_minmax(0,1fr)]">
        <aside className="self-start xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <BriefcaseBusiness className="size-5" />
                </span>
                <div>
                  <CardTitle>{t("growth.brandBriefForm")}</CardTitle>
                  <CardDescription>{t("growth.brandBriefFormDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4">
                <FormField label={t("growth.brandName")} id="ge-brand-name">
                  <Input id="ge-brand-name" placeholder={t("growth.brandNamePlaceholder")} value={form.brandName} onChange={(e) => updateField("brandName", e.target.value)} />
                </FormField>
                <FormField label={t("growth.industry")} id="ge-industry">
                  <Input id="ge-industry" placeholder={t("growth.industryPlaceholder")} value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
                </FormField>
                <FormField label={t("growth.targetAudience")} id="ge-audience">
                  <Input id="ge-audience" placeholder={t("growth.audiencePlaceholder")} value={form.targetAudience} onChange={(e) => updateField("targetAudience", e.target.value)} />
                </FormField>
                <FormField label={t("growth.marketingGoal")} id="ge-goal">
                  <Input id="ge-goal" placeholder={t("growth.goalPlaceholder")} value={form.marketingGoal} onChange={(e) => updateField("marketingGoal", e.target.value)} />
                </FormField>
                <FormField label={t("growth.brandBrief")} id="ge-brief">
                  <Textarea id="ge-brief" rows={5} placeholder={t("growth.briefPlaceholder")} value={form.brandBrief} onChange={(e) => updateField("brandBrief", e.target.value)} />
                </FormField>
              </div>

              <FormField label={t("growth.productImage")} id="ge-product-image">
                <label
                  htmlFor="ge-product-image"
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-4 text-center text-xs text-muted transition hover:border-primary/50 hover:bg-soft-green-surface focus-within:ring-2 focus-within:ring-primary/70"
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    {form.productImage ? <ImagePlus className="size-5" /> : <Upload className="size-5" />}
                  </span>
                  {form.productImage ? (
                    <>
                      <span className="max-w-full truncate font-semibold text-foreground">{form.productImage.name}</span>
                      <span>{Math.max(form.productImage.size / 1024 / 1024, 0.01).toFixed(2)} MB</span>
                    </>
                  ) : (
                    <span>{t("growth.clickUploadProduct")}</span>
                  )}
                  <input id="ge-product-image" type="file" accept="image/*" className="sr-only" onChange={(e) => updateField("productImage", e.target.files?.[0] ?? null)} />
                </label>
              </FormField>

              {workflowError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm leading-6 text-red-200">
                  <AlertTriangle className="mt-1 size-4 shrink-0" />
                  {workflowError}
                </div>
              ) : null}

              <Button className="w-full" type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {submitting ? t("growth.generatingStrategy") : t("growth.launch")}
              </Button>

              <div className="grid gap-3 rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase text-muted">{t("growth.briefQuality")}</p>
                <BriefQualityItem icon={Building2} label={t("growth.brand")} ready={Boolean(form.brandName.trim() && form.industry.trim())} />
                <BriefQualityItem icon={Users} label={t("growth.audience")} ready={Boolean(form.targetAudience.trim())} />
                <BriefQualityItem icon={Target} label={t("growth.goal")} ready={Boolean(form.marketingGoal.trim())} />
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-5">

          <GrowthEngineResults liveProject={liveProject} submitting={submitting} />
        </section>
      </div>
    </PageShell>
  );
}

function BriefQualityItem({ icon: Icon, label, ready }: { icon: typeof Building2; label: string; ready: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <span className={cn("rounded-md border px-2 py-1 text-[10px] font-semibold uppercase", ready ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface text-muted")}>
        {ready ? t("common.ready") : t("common.needed")}
      </span>
    </div>
  );
}
