"use client";

import { AlertTriangle, ImageIcon, Loader2, Rocket, Sparkles, Upload, Video } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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
  getGrowthGenerationProgress,
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
    case "images_ready":
      return "Images Generated";
    case "videos_ready":
      return "Videos Generated";
    default:
      return "Draft";
  }
}

function completedStagesFromStatus(status: GrowthProjectRecord["status"]): GrowthEngineStage[] {
  const ORDER: GrowthEngineStage[] = [
    "Draft",
    "Strategy Generated",
    "Campaigns Generated",
    "Storyboards Generated",
    "Images Generated",
    "Videos Generated",
  ];
  const idx = ORDER.indexOf(stageFromStatus(status));
  return ORDER.slice(0, idx + 1);
}

function sectionStatus(hasData: boolean, isLoading: boolean, error: string | undefined): SectionStatus {
  if (error) return "error";
  if (isLoading) return "loading";
  if (hasData) return "success";
  return "empty";
}

const POLL_INTERVAL_MS = 4_000;
const MAX_POLLS = 120;

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
  const [submitting, setSubmitting] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingVideos, setGeneratingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = submitting || generatingImages || generatingVideos;

  /* ---------- derived UI state ---------- */
  const activeStage: GrowthEngineStage = project ? stageFromStatus(project.status) : "Draft";
  const completedStages = project ? completedStagesFromStatus(project.status) : [];

  const hasStrategy = Boolean(project?.strategy);
  const hasCampaigns = (project?.campaigns?.length ?? 0) > 0;
  const hasStoryboards = (project?.storyboards?.length ?? 0) > 0;
  const hasImages = (project?.imageAssets?.length ?? 0) > 0;
  const hasVideos = (project?.videoAssets?.length ?? 0) > 0;

  /* ---------- polling ---------- */
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (projectId: string, kind: "visual_assets" | "video_assets", jobId?: string) => {
      stopPolling();
      let count = 0;

      pollRef.current = setInterval(async () => {
        count += 1;
        if (count > MAX_POLLS) {
          stopPolling();
          return;
        }

        try {
          const { project: updated } = await getGrowthGenerationProgress({
            projectId,
            kind,
            jobId,
          });
          setProject(updated);

          const done =
            kind === "visual_assets"
              ? updated.status === "images_ready" || updated.status === "videos_ready"
              : updated.status === "videos_ready";

          if (done) {
            stopPolling();
            if (kind === "visual_assets") setGeneratingImages(false);
            if (kind === "video_assets") setGeneratingVideos(false);
          }
        } catch {
          /* keep polling on transient failures */
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  /* ---------- submit workflow ---------- */
  async function handleSubmit() {
    if (!form.productImage) {
      setError("Please upload a product image before submitting.");
      return;
    }

    try {
      setError(null);
      setSubmitting(true);

      const result = await submitGrowthEngineWorkflow({
        audience: form.targetAudience,
        brandName: form.brandName,
        brief: form.brandBrief,
        goal: form.marketingGoal,
        industry: form.industry,
        productImage: form.productImage,
      });

      setProject(result.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- generate images ---------- */
  async function handleGenerateImages() {
    if (!project) return;
    try {
      setError(null);
      setGeneratingImages(true);
      const { job } = await generateGrowthVisualAssets(project.id);
      startPolling(project.id, "visual_assets", job.id);
    } catch (err) {
      setGeneratingImages(false);
      setError(err instanceof Error ? err.message : "Image generation failed.");
    }
  }

  /* ---------- generate videos ---------- */
  async function handleGenerateVideos() {
    if (!project) return;
    try {
      setError(null);
      setGeneratingVideos(true);
      const { job } = await generateGrowthVideos(project.id);
      startPolling(project.id, "video_assets", job.id);
    } catch (err) {
      setGeneratingVideos(false);
      setError(err instanceof Error ? err.message : "Video generation failed.");
    }
  }

  /* ---------- can the user fire asset generation? ---------- */
  const canGenerateImages = Boolean(project && hasStoryboards && !generatingImages && !hasImages);
  const canGenerateVideos = Boolean(project && hasImages && !generatingVideos && !hasVideos);

  /* ---------------------------------------------------------------- */

  return (
    <PageShell
      title="AI Growth Engine"
      description="End-to-end pipeline: strategy → campaigns → storyboards → images → videos. Submit your brand brief and let AI handle the rest."
    >
      {/* ---- status tracker ---- */}
      <StatusTracker activeStage={activeStage} completedStages={completedStages} />

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

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button className="w-full" type="button" onClick={handleSubmit} disabled={submitting || !form.brandName}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {submitting ? "Generating Pipeline…" : "Launch Growth Engine"}
            </Button>

            {/* generation actions */}
            {project ? (
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
            {project?.strategy ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-foreground">
                  {typeof project.strategy === "string" ? project.strategy : JSON.stringify(project.strategy, null, 2)}
                </p>
                {project.personas.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {project.personas.map((persona, i) => (
                      <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                        <p className="text-sm font-semibold text-white">
                          {typeof persona === "object" && persona !== null && "name" in persona
                            ? String((persona as Record<string, unknown>).name)
                            : `Persona ${i + 1}`}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {typeof persona === "object" && persona !== null && "role" in persona
                            ? String((persona as Record<string, unknown>).role)
                            : JSON.stringify(persona)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
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
              {project?.campaigns.map((campaign, i) => (
                <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                  <Rocket className="mb-2 size-4 text-primary" />
                  <p className="text-sm font-semibold text-white">
                    {typeof campaign === "object" && campaign !== null && "name" in campaign
                      ? String((campaign as Record<string, unknown>).name)
                      : `Campaign ${i + 1}`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {typeof campaign === "object" && campaign !== null && "description" in campaign
                      ? String((campaign as Record<string, unknown>).description)
                      : JSON.stringify(campaign)}
                  </p>
                </div>
              ))}
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
              {project?.storyboards.map((board, i) => (
                <div key={i} className="rounded-lg border border-primary/15 bg-black/20 p-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                    Scene {i + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {typeof board === "object" && board !== null && "description" in board
                      ? String((board as Record<string, unknown>).description)
                      : JSON.stringify(board)}
                  </p>
                </div>
              ))}
            </div>
          </WorkflowSection>

          {/* images */}
          <WorkflowSection
            title="Visual Assets"
            description="AI-generated images from storyboard scenes"
            status={sectionStatus(hasImages, generatingImages, undefined)}
            emptyTitle="No Images Yet"
            emptyDescription="Generate visual assets once storyboards are ready."
            loadingRows={3}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project?.imageAssets.map((asset, i) => {
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
                    <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-xs text-muted">{alt}</p>
                  </div>
                );
              })}
            </div>
          </WorkflowSection>

          {/* videos */}
          <WorkflowSection
            title="Video Assets"
            description="AI-generated videos from visual assets"
            status={sectionStatus(hasVideos, generatingVideos, undefined)}
            emptyTitle="No Videos Yet"
            emptyDescription="Generate video assets once images are ready."
            loadingRows={2}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {project?.videoAssets.map((asset, i) => {
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
                    <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-xs text-muted">Video {i + 1}</p>
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
