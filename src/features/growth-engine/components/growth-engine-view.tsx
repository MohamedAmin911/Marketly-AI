"use client";

import { AlertTriangle, ImageIcon, Loader2, Rocket, Sparkles, Upload, Video, Target, Users, Lightbulb, Activity, ArrowRight, ShieldAlert, Zap, LineChart, Milestone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusTracker } from "@/features/growth-engine/components/status-tracker";
import { GrowthEngineResults } from "@/features/growth-engine/components/growth-engine-results";
import {
  getGrowthProject,
  submitGrowthEngineWorkflow,
} from "@/features/growth-engine/services";
import type {
  GrowthEngineForm,
  GrowthEngineStage,
  GrowthProjectRecord,
  SectionStatus,
} from "@/features/growth-engine/types";

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

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
  const ORDER: GrowthEngineStage[] = [
    "Draft",
    "Strategy Generated",
    "Campaigns Generated",
    "Storyboards Generated",
  ];
  let idx = 0;

  if (project.status === "strategy_ready" || project.strategy) idx = 1;
  if (project.status === "campaigns_ready" || project.campaigns.length) idx = 2;
  if (project.status === "storyboards_ready" || project.status === "completed" || project.storyboards.length) idx = 3;

  return ORDER.slice(0, idx + 1);
}

function sectionStatus(hasData: boolean, isLoading: boolean, error: string | undefined): SectionStatus {
  if (error) return "error";
  if (isLoading) return "loading";
  if (hasData) return "success";
  return "empty";
}

const POLL_INTERVAL_MS = 5_000;

/* ------------------------------------------------------------------ */
/*  component                                                          */
/* ------------------------------------------------------------------ */

export function GrowthEngineView() {
  /* ---------- form state ---------- */
  const [form, setForm] = useState<GrowthEngineForm>({
    brandBrief: "",
    brandName: "",
    industry: "",
    marketingGoal: "",
    productImage: null,
    targetAudience: "",
  });

  const updateField = useCallback(
    <K extends keyof GrowthEngineForm>(key: K, value: GrowthEngineForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ---------- workflow state ---------- */
  const [project, setProject] = useState<GrowthProjectRecord | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load the latest project on mount so the user sees their data without re-running the workflow
  useEffect(() => {
    const savedId = localStorage.getItem("latest_growth_project_id");
    if (savedId && !projectId) {
      setProjectId(savedId);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem("latest_growth_project_id", projectId);
    }
  }, [projectId]);

  // Auto-load the latest project on mount so the user sees their data without re-running the workflow

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
  const isRunning = submitting;

  const hasStrategy = Boolean(liveProject?.strategy);
  const hasCampaigns = (liveProject?.campaigns?.length ?? 0) > 0;
  const hasStoryboards = (liveProject?.storyboards?.length ?? 0) > 0;
  const workflowError = error ?? liveProject?.lastError;

  /* ---------- derived UI state ---------- */
  const completedStages = submitting ? [] : (liveProject ? completedStagesFromProject(liveProject) : []);
  const activeStage: GrowthEngineStage = submitting 
    ? "Draft"
    : (liveProject
        ? liveProject.status === "failed"
          ? completedStages.at(-1) ?? "Draft"
          : stageFromStatus(liveProject.status)
        : "Draft");

  const isGenerating = submitting || (Boolean(projectId) && liveProject?.status !== "completed" && liveProject?.status !== "storyboards_ready" && liveProject?.status !== "failed");


  /* ---------- submit workflow ---------- */
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



  /* ---------- render ---------- */
  return (
    <PageShell
      title="AI Growth Engine"
    >
      {/* ---- status tracker ---- */}
      <StatusTracker activeStage={activeStage} completedStages={completedStages} isGenerating={isGenerating} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[24rem_1fr]">
        {/* ---- sidebar: form ---- */}
        <Card className="self-start">
          <CardHeader>
            <div>
              <CardTitle>Brand Brief</CardTitle>
              <CardDescription>Define your brand and marketing objective.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Brand name" id="ge-brand-name">
              <Input
                id="ge-brand-name"
                placeholder="Acme Corp"
                value={form.brandName}
                onChange={(e) => updateField("brandName", e.target.value)}
              />
            </FormField>
            <FormField label="Industry" id="ge-industry">
              <Input
                id="ge-industry"
                placeholder="SaaS, E-commerce, FinTech…"
                value={form.industry}
                onChange={(e) => updateField("industry", e.target.value)}
              />
            </FormField>
            <FormField label="Target audience" id="ge-audience">
              <Input
                id="ge-audience"
                placeholder="Gen-Z creators, enterprise CTOs…"
                value={form.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
              />
            </FormField>
            <FormField label="Marketing goal" id="ge-goal">
              <Input
                id="ge-goal"
                placeholder="Product launch, brand awareness…"
                value={form.marketingGoal}
                onChange={(e) => updateField("marketingGoal", e.target.value)}
              />
            </FormField>
            <FormField label="Brand brief" id="ge-brief">
              <Textarea
                id="ge-brief"
                rows={4}
                placeholder="Describe your brand, value props, and what makes you unique…"
                value={form.brandBrief}
                onChange={(e) => updateField("brandBrief", e.target.value)}
              />
            </FormField>

            {/* product image upload */}
            <FormField label="Product image" id="ge-product-image">
              <label
                htmlFor="ge-product-image"
                className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-xs text-muted transition hover:border-primary/40 hover:bg-primary/[0.04]"
              >
                <Upload className="size-5 text-primary" />
                {form.productImage ? (
                  <span className="max-w-full truncate text-foreground">{form.productImage.name}</span>
                ) : (
                  <span>Click to upload product image</span>
                )}
                <input
                  id="ge-product-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => updateField("productImage", e.target.files?.[0] ?? null)}
                />
              </label>
            </FormField>

            {workflowError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="size-4 shrink-0" />
                {workflowError}
              </div>
            ) : null}

            <Button className="w-full" type="button" onClick={handleSubmit} disabled={submitting || !form.brandName}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {submitting ? "Generating Pipeline…" : "Launch Growth Engine"}
            </Button>

            <div className="rounded-lg border border-primary/15 bg-primary/[0.035] p-4 text-xs leading-5 text-muted mt-4">
              <p className="font-mono uppercase tracking-[0.1em] text-primary">AI Pipeline</p>
              <p className="mt-2">
                Strategy → Campaigns → Storyboards. Each stage builds on the last.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---- main content: workflow sections ---- */}
        <div className="space-y-5">
          <GrowthEngineResults liveProject={liveProject} submitting={submitting} />
        </div>
      </div>
    </PageShell>
  );
}
