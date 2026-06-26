"use client";

import { Clapperboard, Film, ImageIcon, Loader2, Monitor, Palette, RectangleVertical, Sparkles, UploadCloud, WandSparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { UploadArea } from "@/components/shared/upload-area";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SceneCard } from "@/features/storyboard/components/scene-card";
import { useStoryboardScenes } from "@/features/storyboard/hooks/use-storyboard-scenes";
import { cn } from "@/lib/utils";

const loadingFrames = [0];

const styleOptions = [
  "Luxury",
  "Cinematic",
  "Minimal",
  "Editorial",
] as const;

const aspectOptions = [
  { label: "16:9", icon: Monitor, description: "Wide commercial" },
  { label: "9:16", icon: RectangleVertical, description: "Vertical social" },
] as const;

type StoryboardStyle = (typeof styleOptions)[number];
type StoryboardAspect = (typeof aspectOptions)[number]["label"];

export function StoryboardView() {
  const { generate, generationError, isGenerating, isRevealing, scenes } = useStoryboardScenes();
  const [productImage, setProductImage] = useState<File | null>(null);
  const [campaignPrompt, setCampaignPrompt] = useState("Create a luxury cinematic campaign that makes the product feel precise, desirable, and iconic.");
  const [style, setStyle] = useState<StoryboardStyle>("Luxury");
  const [aspectRatio, setAspectRatio] = useState<StoryboardAspect>("16:9");
  const [inputError, setInputError] = useState("");
  const [videoPrompt, setVideoPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prompt = params.get("prompt");
      const urlVideoPrompt = params.get("videoPrompt");
      if (prompt) {
        setCampaignPrompt(prompt);
      }
      if (urlVideoPrompt) {
        setVideoPrompt(urlVideoPrompt);
      }
    }
  }, []);

  const finalPrompt = useMemo(
    () =>
      `${campaignPrompt.trim()}\n\nStoryboard Direction:\nStyle: ${style} commercial storyboard.\nAspect Ratio: ${aspectRatio}.\nInclude clear scene descriptions, camera angle direction, lighting direction, and concise voice-over lines for each frame.`,
    [aspectRatio, campaignPrompt, style],
  );

  function submitGeneration() {
    if (!productImage) {
      setInputError("Upload a product image before generating the storyboard.");
      return;
    }

    if (campaignPrompt.trim().length < 12) {
      setInputError("Add a stronger campaign prompt before generating.");
      return;
    }

    setInputError("");
    generate({
      campaignPrompt: finalPrompt,
      productImage,
    });
  }

  const isWorking = isGenerating || isRevealing;
  const empty = !isWorking && scenes.length === 0;

  return (
    <PageShell
      title="AI Cinematic Storyboard Director"
      description="Upload a product, write the campaign intention, and generate one luxury commercial frame with cinematic script lines."
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-6 top-24 h-56 grid-field opacity-25" />

      <div className="relative grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-border bg-card p-5 shadow-[var(--panel-shadow)] sm:p-6 xl:sticky xl:top-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground">Director Inputs</p>
              <p className="text-xs text-muted">Product, prompt, style, and frame format.</p>
            </div>
          </div>

          <div className="space-y-5">
            <InputPanelSection title="Product Upload" icon={UploadCloud}>
              <FormField label="Product image" id="storyboard-product-image">
                <UploadArea label={productImage ? productImage.name : "Upload product image"} onFileSelect={setProductImage} />
              </FormField>
            </InputPanelSection>

            <InputPanelSection title="Campaign Prompt" icon={Film}>
              <FormField label="Prompt" id="storyboard-campaign-prompt">
                <Textarea
                  id="storyboard-campaign-prompt"
                  value={campaignPrompt}
                  onChange={(event) => setCampaignPrompt(event.target.value)}
                  className="min-h-40 resize-none"
                  placeholder="Describe the commercial story, mood, product promise, or campaign moment..."
                />
              </FormField>
            </InputPanelSection>

            <InputPanelSection title="Style Selection" icon={Palette}>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="secondary"
                    onClick={() => setStyle(option)}
                    className={cn("justify-start", style === option && "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]")}
                  >
                    <Sparkles className="size-4 text-primary" />
                    {option}
                  </Button>
                ))}
              </div>
            </InputPanelSection>

            <InputPanelSection title="Aspect Ratio" icon={Monitor}>
              <div className="grid grid-cols-2 gap-2">
                {aspectOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = aspectRatio === option.label;

                  return (
                    <Button
                      key={option.label}
                      type="button"
                      variant="secondary"
                      onClick={() => setAspectRatio(option.label)}
                      className={cn("h-auto justify-start px-3 py-3 text-left", selected && "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]")}
                    >
                      <Icon className="size-5 shrink-0 text-primary" />
                      <span>
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="block text-xs text-muted">{option.description}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </InputPanelSection>

            {inputError || generationError ? <div className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm leading-6 text-red-200">{inputError || generationError}</div> : null}

            <Button className="h-12 w-full" type="button" onClick={submitGeneration} disabled={isWorking}>
              {isWorking ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
              {isWorking ? "Directing Storyboard" : "Generate Storyboard"}
            </Button>
          </div>
        </aside>

        <section className="min-h-[640px] space-y-5" aria-labelledby="cinematic-storyboard-title">
          <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--panel-shadow)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="cinematic-storyboard-title" className="font-display text-2xl font-semibold text-foreground">
                  Storyboard Frames Grid
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">Generated frames include visual direction, voice-over, inferred camera direction, and lighting notes.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{style}</span>
                <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{aspectRatio}</span>
                {/* <span className="rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{scenes.length}/3 frames</span> */}
              </div>
            </div>
         
          </div>

          <div className="grid gap-5 lg:grid-cols-1">
            {scenes.map((scene, index) => (
              <SceneCard
                key={`${scene.sceneTitle}-${index}`}
                index={index}
                scene={scene}
                videoPrompt={videoPrompt}
              />
            ))}

            {isWorking ? loadingFrames.slice(scenes.length).map((frame) => <StoryboardSkeleton key={frame} index={frame} />) : null}
          </div>

          {empty ? <EmptyStoryboard /> : null}
        </section>
      </div>
    </PageShell>
  );
}

function InputPanelSection({ children, icon: Icon, title }: { children: ReactNode; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StoryboardSkeleton({ index }: { index: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--panel-shadow)]">
      <Skeleton className="aspect-video rounded-none" />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <span className="text-xs font-semibold uppercase text-muted">Frame {String(index + 1).padStart(2, "0")}</span>
        </div>
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

function EmptyStoryboard() {
  return (
    <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-[var(--panel-shadow)]">
      <div>
        <UploadCloud className="mx-auto mb-4 size-10 text-primary" />
        <h3 className="font-display text-xl font-semibold text-white">
          No cinematic sequence yet
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Upload a product and describe the campaign moment to generate one
          premium storyboard frame.
        </p>
      </div>
    </div>
  );
}
