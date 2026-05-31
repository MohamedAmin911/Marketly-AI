"use client";

import {
  Clapperboard,
  Loader2,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { UploadArea } from "@/components/shared/upload-area";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SceneCard } from "@/features/storyboard/components/scene-card";
import { useStoryboardScenes } from "@/features/storyboard/hooks/use-storyboard-scenes";

const loadingFrames = [0, 1, 2];

export function StoryboardView() {
  const { generate, generationError, isGenerating, isRevealing, scenes } =
    useStoryboardScenes();
  const [productImage, setProductImage] = useState<File | null>(null);
  const [campaignPrompt, setCampaignPrompt] = useState(
    "Create a luxury cinematic campaign that makes the product feel precise, desirable, and iconic.",
  );
  const [inputError, setInputError] = useState("");

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
      campaignPrompt: campaignPrompt.trim(),
      productImage,
    });
  }

  const isWorking = isGenerating || isRevealing;
  const empty = !isWorking && scenes.length === 0;

  return (
    <PageShell
      title="AI Cinematic Storyboard Director"
      description="Upload a product, write the campaign intention, and generate three luxury commercial frames with cinematic script lines."
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-6 top-24 h-56 grid-field opacity-30" />

      <div className="relative grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="glass-panel grid-field self-start rounded-lg p-5 sm:p-6">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-primary shadow-glow">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-white">
                Director Inputs
              </p>
              <p className="text-xs text-muted">
                One product, one campaign idea.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <FormField label="Product Image" id="storyboard-product-image">
              <UploadArea
                label="Upload product image"
                onFileSelect={setProductImage}
              />
            </FormField>

            <FormField label="Campaign Prompt" id="storyboard-campaign-prompt">
              <Textarea
                id="storyboard-campaign-prompt"
                value={campaignPrompt}
                onChange={(event) => setCampaignPrompt(event.target.value)}
                className="min-h-44 resize-none"
                placeholder="Describe the luxury commercial story, mood, product promise, or campaign moment..."
              />
            </FormField>

            {inputError || generationError ? (
              <div className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {inputError || generationError}
              </div>
            ) : null}

            <Button
              className="h-12 w-full"
              type="button"
              onClick={submitGeneration}
              disabled={isWorking}
            >
              {isWorking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              {isWorking ? "Directing Storyboard" : "Generate Storyboard"}
            </Button>
          </div>
        </aside>

        <section
          className="min-h-[640px] space-y-5"
          aria-labelledby="cinematic-storyboard-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="cinematic-storyboard-title"
                className="font-display text-2xl font-semibold text-white"
              >
                Cinematic Story Frames
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {scenes.length}/3 frames
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {scenes.map((scene, index) => (
              <SceneCard
                key={`${scene.sceneTitle}-${index}`}
                index={index}
                scene={scene}
              />
            ))}

            {isWorking
              ? loadingFrames
                  .slice(scenes.length)
                  .map((frame) => (
                    <StoryboardSkeleton key={frame} index={frame} />
                  ))
              : null}
          </div>

          {empty ? <EmptyStoryboard /> : null}
        </section>
      </div>
    </PageShell>
  );
}

function StoryboardSkeleton({ index }: { index: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-0 backdrop-blur">
      <Skeleton className="aspect-video rounded-none" />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Frame {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

function EmptyStoryboard() {
  return (
    <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
      <div>
        <UploadCloud className="mx-auto mb-4 size-10 text-primary" />
        <h3 className="font-display text-xl font-semibold text-white">
          No cinematic sequence yet
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Upload a product and describe the campaign moment to generate three
          premium storyboard frames.
        </p>
      </div>
    </div>
  );
}
