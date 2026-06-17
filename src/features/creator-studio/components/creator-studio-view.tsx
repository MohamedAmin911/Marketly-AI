"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Monitor, Smartphone, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { GenerateButton } from "@/features/creator-studio/components/generate-button";
import { ImageUploadCard } from "@/features/creator-studio/components/image-upload-card";
import { PromptBox } from "@/features/creator-studio/components/prompt-box";
import { ResultPreview } from "@/features/creator-studio/components/result-preview";
import { cn } from "@/lib/utils";

type OutputAspectRatio = "9:16" | "16:9";

const BASE_PROMPT = `product_swap: start with the reference advertisement (Picture 2) as the base image, keeping its lighting, environment, and background. Remove the original product from Picture 2 completely and replace it with the target product (Picture 1).

FROM PICTURE 2 (strictly preserve):
- Scene: lighting conditions, shadows, highlights, color temperature, environment, background
- Product positioning: exact placement, rotation angle, perspective, scale
- Atmosphere: advertisement style, text placement, overall composition

FROM PICTURE 1 (strictly preserve identity):
- Product structure: exact shape, proportions, physical dimensions
- All product features: original branding, logos, materials, textures, specific design details
- Colors: exact color palette of the target product

The replaced product must seamlessly match Picture 2's lighting and atmosphere while maintaining the complete identity and details from Picture 1. High quality, photorealistic, commercial advertising photography, sharp details, 4k.`;

export function CreatorStudioView() {
  const queryClient = useQueryClient();
  const [productImage, setProductImage] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<OutputAspectRatio>("16:9");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalPrompt = useMemo(() => {
    const trimmedPrompt = customPrompt.trim();
    const aspectPrompt = `\n\nOutput Format:\nGenerate the final advertisement in ${aspectRatio} aspect ratio.\nKeep the image composition professional for ${aspectRatio === "9:16" ? "vertical social advertising, stories, reels, and mobile placements" : "wide cinematic advertising, landing pages, banners, and video thumbnails"}.\nDo not stretch, warp, squash, or distort the product. Preserve natural proportions.`;
    if (!trimmedPrompt) return `${BASE_PROMPT}${aspectPrompt}`;

    return `${BASE_PROMPT}${aspectPrompt}\n\nAdditional Instructions:\n${trimmedPrompt}`;
  }, [aspectRatio, customPrompt]);

  const canGenerate = Boolean(productImage && referenceImage && !loading);

  async function generateAdvertisement() {
    if (!productImage || !referenceImage) {
      setError(
        "Upload both a product image and a reference advertisement before generating.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedImage(null);

      const formData = new FormData();
      formData.append("productImage", productImage);
      formData.append("referenceImage", referenceImage);
      formData.append("prompt", finalPrompt);
      formData.append("aspectRatio", aspectRatio);

      const response = await fetch("/api/generate-ad", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Generation failed");
      }

      const imageUrl =
        typeof data.image?.url === "string"
          ? data.image.url
          : extractGeneratedImageUrl(data.result);
      if (!imageUrl) {
        throw new Error(
          "The Space returned a result, but no generated image URL was found.",
        );
      }

      setGeneratedImage(imageUrl);
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Generation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="AI Product Advertisement Studio"
      description="Replace the product inside an existing advertisement while preserving the original scene, camera language, lighting, and commercial finish."
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-6 top-20 h-56 grid-field opacity-30" />

      <div className="relative grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="glass-panel grid-field self-start rounded-lg p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-primary shadow-glow">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-white">
                Commercial Inputs
              </p>
              <p className="text-xs text-muted">
                Two images, one preserved ad scene.
              </p>
            </div>
          </div>

          <div className="space-y-7">
            <ImageUploadCard
              eyebrow="Product Image"
              hint="The exact product to integrate into the advertisement."
              image={productImage}
              onImageChange={setProductImage}
            />
            <ImageUploadCard
              eyebrow="Reference Advertisement"
              hint="The scene, composition, and style to preserve."
              image={referenceImage}
              onImageChange={setReferenceImage}
            />
            <PromptBox value={customPrompt} onChange={setCustomPrompt} />
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
            />

            {error ? (
              <p className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {error}
              </p>
            ) : null}

            <GenerateButton
              disabled={!canGenerate}
              loading={loading}
              onClick={generateAdvertisement}
            />
          </div>
        </aside>

        <ResultPreview
          aspectRatio={aspectRatio}
          generatedImage={generatedImage}
          loading={loading}
        />
      </div>
    </PageShell>
  );
}

function AspectRatioSelector({
  onChange,
  value,
}: {
  onChange: (value: OutputAspectRatio) => void;
  value: OutputAspectRatio;
}) {
  const options: Array<{
    label: OutputAspectRatio;
    icon: typeof Smartphone;
    description: string;
  }> = [
    { label: "9:16", icon: Smartphone, description: "Vertical" },
    { label: "16:9", icon: Monitor, description: "Wide" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg font-semibold text-white">
          Output Dimensions
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Choose the advertisement frame before generation.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.label;

          return (
            <Button
              key={option.label}
              type="button"
              variant="secondary"
              onClick={() => onChange(option.label)}
              className={cn(
                "h-auto justify-start rounded-lg px-4 py-3 text-left",
                selected &&
                  "border-primary/70 bg-primary/15 text-white shadow-[0_0_26px_rgba(114,255,95,0.18)]",
              )}
            >
              <Icon className="size-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="block text-xs font-medium text-muted">
                  {option.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function extractGeneratedImageUrl(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const data = "data" in result ? (result as { data?: unknown }).data : result;
  const firstItem = Array.isArray(data) ? data[0] : data;

  if (typeof firstItem === "string") return firstItem;
  if (!firstItem || typeof firstItem !== "object") return null;

  const candidate = firstItem as { url?: unknown; path?: unknown };
  if (typeof candidate.url === "string") return candidate.url;
  if (typeof candidate.path === "string") return candidate.path;

  return null;
}
