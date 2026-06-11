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
import { WorkflowSection } from "@/features/growth-engine/components/workflow-section";
import {
  generateGrowthVideos,
  generateGrowthVisualAssets,
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
      return "Storyboards Generated";
    case "images_generating":
    case "images_ready":
      return "Images Generated";
    case "videos_generating":
    case "videos_ready":
    case "completed":
      return "Videos Generated";
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
    "Images Generated",
    "Videos Generated",
  ];
  let idx = 0;

  if (project.status === "strategy_ready" || project.strategy) idx = 1;
  if (project.status === "campaigns_ready" || project.campaigns.length) idx = 2;
  if (project.status === "storyboards_ready" || project.status === "images_generating" || project.storyboards.length) idx = 3;
  if (project.status === "images_ready" || project.status === "videos_generating" || project.imageAssets.length) idx = 4;
  if (project.status === "videos_ready" || project.status === "completed" || project.videoAssets.length) idx = 5;

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
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingVideos, setGeneratingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageTriggerRef = useRef<string | null>(null);
  const videoTriggerRef = useRef<string | null>(null);

  // Auto-load the latest project on mount so the user sees their data without re-running the workflow
  const latestProjectQuery = useQuery({
    enabled: !projectId,
    queryFn: async () => {
      const response = await getGrowthProject("latest");
      return response.project;
    },
    queryKey: ["growth-engine-project", "latest"],
    retry: false,
  });

  // Once the latest project loads, set it as the active project for polling
  useEffect(() => {
    if (latestProjectQuery.data && !projectId) {
      setProject(latestProjectQuery.data);
      setProjectId(latestProjectQuery.data.id);
    }
  }, [latestProjectQuery.data, projectId]);

  const projectQuery = useQuery({
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await getGrowthProject(projectId ?? "");
      return response.project;
    },
    queryKey: ["growth-engine-project", projectId],
    refetchInterval: projectId ? POLL_INTERVAL_MS : false,
  });

  const liveProject = projectQuery.data ?? latestProjectQuery.data ?? project;

  const isRunning = submitting || generatingImages || generatingVideos;

  /* ---------- derived UI state ---------- */
  const completedStages = liveProject ? completedStagesFromProject(liveProject) : [];
  const activeStage: GrowthEngineStage = liveProject
    ? liveProject.status === "failed"
      ? completedStages.at(-1) ?? "Draft"
      : stageFromStatus(liveProject.status)
    : "Draft";

  // Determine which stage should show a spinner
  let loadingStage: GrowthEngineStage | null = null;
  if (generatingVideos) {
    loadingStage = "Videos Generated";
  } else if (generatingImages) {
    loadingStage = "Images Generated";
  } else if (submitting) {
    // If the pipeline is running, the next uncompleted stage is loading.
    const STAGES_LIST: GrowthEngineStage[] = [
      "Draft",
      "Strategy Generated",
      "Campaigns Generated",
      "Storyboards Generated",
      "Images Generated",
      "Videos Generated",
    ];
    loadingStage = STAGES_LIST.find((s) => !completedStages.includes(s)) ?? null;
  }

  const hasStrategy = Boolean(liveProject?.strategy);
  const hasCampaigns = (liveProject?.campaigns?.length ?? 0) > 0;
  const hasStoryboards = (liveProject?.storyboards?.length ?? 0) > 0;
  const hasImages = (liveProject?.imageAssets?.length ?? 0) > 0;
  const hasVideos = (liveProject?.videoAssets?.length ?? 0) > 0;
  const workflowError = error ?? liveProject?.lastError;
  const imageStageFailed = Boolean(liveProject?.status === "failed" && hasStoryboards && !hasImages);
  const videoStageFailed = Boolean(liveProject?.status === "failed" && hasImages && !hasVideos);

  useEffect(() => {
    if (!liveProject) return;
    setGeneratingImages(liveProject.status === "images_generating");
    setGeneratingVideos(liveProject.status === "videos_generating");
  }, [liveProject]);





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

  /* ---------- generate images ---------- */
  async function handleGenerateImages() {
    if (!liveProject) return;
    try {
      setError(null);
      setGeneratingImages(true);
      await generateGrowthVisualAssets(liveProject.id);
      await projectQuery.refetch();
    } catch (err) {
      setGeneratingImages(false);
      setError(err instanceof Error ? err.message : "Image generation failed.");
    }
  }

  /* ---------- generate videos ---------- */
  async function handleGenerateVideos() {
    if (!liveProject) return;
    try {
      setError(null);
      setGeneratingVideos(true);
      await generateGrowthVideos(liveProject.id);
      await projectQuery.refetch();
    } catch (err) {
      setGeneratingVideos(false);
      setError(err instanceof Error ? err.message : "Video generation failed.");
    }
  }

  /* ---------- can the user fire asset generation? ---------- */
  const canGenerateImages = Boolean(
    liveProject &&
      hasStoryboards &&
      !generatingImages &&
      (!hasImages || liveProject.status === "failed"),
  );
  const canGenerateVideos = Boolean(
    liveProject &&
      hasImages &&
      !generatingVideos &&
      (!hasVideos || liveProject.status === "failed"),
  );

  /* ---------- render ---------- */
  return (
    <PageShell
      title="AI Growth Engine"
    >
      {/* ---- status tracker ---- */}
      <StatusTracker activeStage={activeStage} completedStages={completedStages} loadingStage={loadingStage} />

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

            {/* generation actions */}
            {liveProject ? (
              <div className="space-y-2 border-t border-white/10 pt-4">
                <Button
                  className="w-full"
                  variant="secondary"
                  type="button"
                  onClick={handleGenerateImages}
                  disabled={!canGenerateImages}
                >
                  {generatingImages ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                  {generatingImages ? "Generating Images…" : "Generate Visual Assets"}
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  type="button"
                  onClick={handleGenerateVideos}
                  disabled={!canGenerateVideos}
                >
                  {generatingVideos ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                  {generatingVideos ? "Generating Videos…" : "Generate Video Assets"}
                </Button>
              </div>
            ) : null}

            <div className="rounded-lg border border-primary/15 bg-primary/[0.035] p-4 text-xs leading-5 text-muted">
              <p className="font-mono uppercase tracking-[0.1em] text-primary">AI Pipeline</p>
              <p className="mt-2">
                Strategy → Campaigns → Storyboards → Images → Videos. Each stage builds on the last.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---- main content: workflow sections ---- */}
        <div className="space-y-5">
          {/* strategy */}
          <WorkflowSection
            title="Marketing Strategy"
            description="AI-generated SWOT, personas, and recommendations"
            status={sectionStatus(hasStrategy, submitting, undefined)}
            emptyTitle="No Strategy Yet"
            emptyDescription="Submit your brand brief to generate a marketing strategy."
          >
            {liveProject?.strategy ? (
              <div className="space-y-6">
                {/* Check if it's an object with swot/personas, else generic */}
                {typeof liveProject.strategy === "object" && !Array.isArray(liveProject.strategy) && "swot" in (liveProject.strategy || {}) ? (
                  <>
                    {/* SWOT Analysis */}
                    {((liveProject.strategy as any).swot) && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Activity className="size-4 text-primary" /> SWOT Analysis
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {["strengths", "weaknesses", "opportunities", "threats"].map((key) => {
                            const items = (liveProject.strategy as any).swot[key];
                            if (!items || items.length === 0) return null;
                            const isPositive = key === "strengths" || key === "opportunities";
                            return (
                              <div key={key} className="rounded-lg border border-primary/10 bg-primary/[0.03] p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.05]">
                                <h5 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                                  {key === "strengths" && <Zap className="size-3 text-green-400" />}
                                  {key === "weaknesses" && <AlertTriangle className="size-3 text-red-400" />}
                                  {key === "opportunities" && <LineChart className="size-3 text-blue-400" />}
                                  {key === "threats" && <ShieldAlert className="size-3 text-orange-400" />}
                                  {key}
                                </h5>
                                <ul className="space-y-2">
                                  {items.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                                      <span className="mt-[2px] block size-1.5 shrink-0 rounded-full bg-primary/40" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Personas */}
                    {((liveProject.strategy as any).personas && (liveProject.strategy as any).personas.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Users className="size-4 text-primary" /> Target Personas
                        </h4>
                        <div className="grid gap-3 md:grid-cols-3">
                          {((liveProject.strategy as any).personas).map((persona: any, i: number) => (
                            <div key={i} className="group flex flex-col rounded-lg border border-primary/15 bg-gradient-to-b from-primary/[0.05] to-transparent p-4">
                              <p className="font-mono text-[10px] text-primary/50">PERSONA {i + 1}</p>
                              <p className="mt-1 font-semibold text-white group-hover:text-primary transition-colors">{persona.name}</p>
                              <p className="mt-2 text-xs leading-5 text-muted-foreground">{persona.description || persona.role}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {((liveProject.strategy as any).recommendations && (liveProject.strategy as any).recommendations.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Lightbulb className="size-4 text-primary" /> Strategic Recommendations
                        </h4>
                        <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-5">
                          <ul className="space-y-3">
                            {((liveProject.strategy as any).recommendations).map((rec: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm leading-6 text-foreground/90">
                                <Target className="mt-1 size-4 shrink-0 text-primary" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Launch Plan */}
                    {((liveProject.strategy as any).launchPlan && (liveProject.strategy as any).launchPlan.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Milestone className="size-4 text-primary" /> Launch Timeline
                        </h4>
                        <div className="space-y-3">
                          {((liveProject.strategy as any).launchPlan).map((phase: any, i: number) => (
                            <div key={i} className="relative overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.03] p-5">
                              <div className="absolute left-0 top-0 h-full w-1 bg-primary/40" />
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                <h5 className="font-semibold text-white">{phase.phase}</h5>
                                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                  {phase.timeline}
                                </span>
                              </div>
                              <ul className="grid gap-2 sm:grid-cols-2">
                                {phase.actions.map((action: string, j: number) => (
                                  <li key={j} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary/60" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback for other formats (string or unknown shape) */
                  <div className="space-y-2">
                    {typeof liveProject.strategy === "string" ? (
                      <p className="text-sm leading-6 text-foreground">{liveProject.strategy}</p>
                    ) : Array.isArray(liveProject.strategy) ? (
                      <div className="space-y-2">
                        {(liveProject.strategy as unknown[]).map((item, i) => (
                          <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3 text-sm text-foreground">
                            {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(liveProject.strategy as Record<string, unknown>).map(([key, val]) => (
                          <div key={key} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">{key}</p>
                            <p className="text-sm leading-6 text-foreground">
                              {typeof val === "string" ? val : JSON.stringify(val, null, 2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </WorkflowSection>

          {/* campaigns */}
          <WorkflowSection
            title="Campaign Concepts"
            description="Social campaigns across platforms"
            status={sectionStatus(hasCampaigns, submitting && hasStrategy, undefined)}
            emptyTitle="No Campaigns Yet"
            emptyDescription="Campaigns are generated as part of the strategy pipeline."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {liveProject?.campaigns.map((campaign, i) => {
                const c = campaign as Record<string, unknown>;
                const title = c.title ?? c.name ?? `Campaign ${i + 1}`;
                const objective = c.objective ?? c.description ?? c.hook ?? "";
                const platform = c.platform ?? "";
                const tone = c.tone ?? "";
                return (
                  <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                    <Rocket className="mb-2 size-4 text-primary" />
                    <p className="text-sm font-semibold text-white">{String(title)}</p>
                    {platform ? <p className="mt-0.5 text-[10px] font-mono text-primary/70">{String(platform)}</p> : null}
                    <p className="mt-1 text-xs leading-5 text-muted">{String(objective)}</p>
                    {tone ? <p className="mt-1 text-[10px] text-muted/60 italic">{String(tone)}</p> : null}
                  </div>
                );
              })}
            </div>
          </WorkflowSection>

          {/* storyboards */}
          <WorkflowSection
            title="Storyboards"
            description="Cinematic scene breakdowns for each campaign"
            status={sectionStatus(hasStoryboards, submitting && hasCampaigns, undefined)}
            emptyTitle="No Storyboards Yet"
            emptyDescription="Storyboards are generated after campaigns are ready."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {liveProject?.storyboards.flatMap((board, campIdx) => {
                const scenes = Array.isArray(board) ? board : [board];
                return scenes.map((scene, sceneIdx) => {
                  const s = scene as Record<string, unknown>;
                  const title = s.sceneTitle ?? s.title ?? `Scene ${sceneIdx + 1}`;
                  const script = s.script ?? s.description ?? s.imagePrompt ?? "";
                  return (
                    <div key={`${campIdx}-${sceneIdx}`} className="rounded-lg border border-primary/15 bg-black/20 p-4">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                        Campaign {campIdx + 1} · Scene {sceneIdx + 1}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white/90">{String(title)}</p>
                      <p className="mt-2 text-xs leading-5 text-muted">{String(script)}</p>
                    </div>
                  );
                });
              })}
            </div>
          </WorkflowSection>

          {/* images */}
          <WorkflowSection
            title="Visual Assets"
            description="AI-generated images from storyboard scenes"
            status={sectionStatus(hasImages, generatingImages || liveProject?.status === "images_generating", imageStageFailed ? workflowError : undefined)}
            error={imageStageFailed ? workflowError : undefined}
            emptyTitle="No Images Yet"
            emptyDescription="Generate visual assets once storyboards are ready."
            loadingRows={3}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liveProject?.imageAssets.map((asset, i) => {
                const url =
                  typeof asset === "object" && asset !== null && "url" in asset
                    ? String((asset as Record<string, unknown>).url)
                    : null;
                const alt =
                  typeof asset === "object" && asset !== null && "alt" in asset
                    ? String((asset as Record<string, unknown>).alt)
                    : `Generated image ${i + 1}`;

                return (
                  <div key={i} className="overflow-hidden rounded-lg border border-white/10">
                    {url ? (
                      <img src={url} alt={alt} className="aspect-video w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-white/[0.03] text-xs text-muted">
                        <ImageIcon className="size-6 opacity-30" />
                      </div>
                    )}
                    <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-xs text-muted">
                      {alt} · {typeof asset === "object" && asset !== null && "status" in asset
                        ? String((asset as Record<string, unknown>).status)
                        : "ready"}
                    </p>
                  </div>
                );
              })}
            </div>
          </WorkflowSection>

          {/* videos */}
          <WorkflowSection
            title="Video Assets"
            description="AI-generated videos from visual assets"
            status={sectionStatus(hasVideos, generatingVideos || liveProject?.status === "videos_generating", videoStageFailed ? workflowError : undefined)}
            error={videoStageFailed ? workflowError : undefined}
            emptyTitle="No Videos Yet"
            emptyDescription="Generate video assets once images are ready."
            loadingRows={2}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {liveProject?.videoAssets.map((asset, i) => {
                const url =
                  typeof asset === "object" && asset !== null && "url" in asset
                    ? String((asset as Record<string, unknown>).url)
                    : null;

                return (
                  <div key={i} className="overflow-hidden rounded-lg border border-white/10">
                    {url ? (
                      <video src={url} controls className="aspect-video w-full bg-black" />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-white/[0.03] text-xs text-muted">
                        <Video className="size-6 opacity-30" />
                      </div>
                    )}
                    <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-xs text-muted">
                      Video {i + 1} · {typeof asset === "object" && asset !== null && "status" in asset
                        ? String((asset as Record<string, unknown>).status)
                        : "ready"}
                    </p>
                  </div>
                );
              })}
            </div>
          </WorkflowSection>
        </div>
      </div>
    </PageShell>
  );
}
