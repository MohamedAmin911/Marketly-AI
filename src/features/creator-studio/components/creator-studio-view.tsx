"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Monitor, Smartphone, WandSparkles } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { GenerateButton } from "@/features/creator-studio/components/generate-button";
import { ImageUploadCard } from "@/features/creator-studio/components/image-upload-card";
import { PromptBox } from "@/features/creator-studio/components/prompt-box";
import { ResultPreview } from "@/features/creator-studio/components/result-preview";
import { cn } from "@/lib/utils";

type OutputAspectRatio = "9:16" | "16:9";
type StepState = "complete" | "current" | "pending";

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
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPrompt = params.get("prompt");
      if (urlPrompt) {
        setCustomPrompt(urlPrompt);
      }
    }
  }, []);

  const finalPrompt = useMemo(() => {
    const trimmedPrompt = customPrompt.trim();
    const aspectPrompt = `\n\nOutput Format:\nGenerate the final advertisement in ${aspectRatio} aspect ratio.\nKeep the image composition professional for ${aspectRatio === "9:16" ? "vertical social advertising, stories, reels, and mobile placements" : "wide cinematic advertising, landing pages, banners, and video thumbnails"}.\nDo not stretch, warp, squash, or distort the product. Preserve natural proportions.`;
    if (!trimmedPrompt) return `${BASE_PROMPT}${aspectPrompt}`;

    return `${BASE_PROMPT}${aspectPrompt}\n\nAdditional Instructions:\n${trimmedPrompt}`;
  }, [aspectRatio, customPrompt]);

  const canGenerate = Boolean(productImage && referenceImage && !loading);
  const workflowSteps = getWorkflowSteps({
    customPrompt,
    generatedImage,
    loading,
    productImage,
    referenceImage,
  });

  async function generateAdvertisement() {
    if (!productImage || !referenceImage) {
      setError("Upload both a product image and a reference advertisement before generating.");
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

      const imageUrl = typeof data.image?.url === "string" ? data.image.url : extractGeneratedImageUrl(data.result);
      if (!imageUrl) {
        throw new Error("The Space returned a result, but no generated image URL was found.");
      }

      setGeneratedImage(imageUrl);
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Ad Studio"
      description="Upload a product and reference ad, add placement direction, then generate a polished commercial variation."
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-6 top-20 h-56 grid-field opacity-25" />

      <div className="relative space-y-6">
        <WorkflowStepper steps={workflowSteps} />

        <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="self-start rounded-lg border border-border bg-card p-5 shadow-[var(--panel-shadow)] sm:p-6 xl:sticky xl:top-24">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Clapperboard className="size-5" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-foreground">Creative Inputs</p>
                <p className="text-xs text-muted">Product, reference, instructions, and output frame.</p>
              </div>
            </div>

            <div className="space-y-6">
              <PanelSection title="Product Image" description="The exact product to insert into the reference ad." icon={ImageIcon}>
                <ImageUploadCard eyebrow="Product Image" hint="Upload a clean product image with visible branding." image={productImage} onImageChange={setProductImage} compact />
              </PanelSection>

              <PanelSection title="Reference Ad" description="The composition, lighting, and campaign style to preserve." icon={ImageIcon}>
                <ImageUploadCard eyebrow="Reference Advertisement" hint="Upload the existing ad scene to recreate." image={referenceImage} onImageChange={setReferenceImage} compact />
              </PanelSection>

              <PanelSection title="Instructions" description="Optional brand, placement, or finish direction." icon={FileText}>
                <PromptBox value={customPrompt} onChange={setCustomPrompt} />
              </PanelSection>

              <PanelSection title="Output Dimensions" description="Choose the final ad format before generation." icon={Monitor}>
                <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
              </PanelSection>

              {error ? <p className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm leading-6 text-red-200">{error}</p> : null}

              <div className="space-y-3">
                <GenerateButton disabled={!canGenerate} loading={loading} onClick={generateAdvertisement} />
                {generatedImage ? (
                  <Button asChild variant="secondary" className="w-full">
                    <a href={generatedImage} download={`marketly-ai-advertisement-${aspectRatio.replace(":", "x")}.png`}>
                      <Download className="size-4" />
                      Export Advertisement
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </aside>

          <ResultPreview aspectRatio={aspectRatio} generatedImage={generatedImage} loading={loading} productImage={productImage} referenceImage={referenceImage} />
        </div>
      </div>
    </PageShell>
  );
}

function PanelSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function WorkflowStepper({ steps }: { steps: Array<{ label: string; state: StepState }> }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-[var(--panel-shadow)]" aria-label="Ad Studio workflow">
      <ol className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg border text-xs font-bold",
                step.state === "complete" && "border-primary bg-primary text-primary-foreground",
                step.state === "current" && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                step.state === "pending" && "border-border bg-card text-muted",
              )}
            >
              {step.state === "complete" ? <Check className="size-4" /> : step.state === "current" && step.label === "Generate" ? <Loader2 className="size-4 animate-spin" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{step.label}</span>
              <span className="block text-xs capitalize text-muted">{step.state}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AspectRatioSelector({ onChange, value }: { onChange: (value: OutputAspectRatio) => void; value: OutputAspectRatio }) {
  const options: Array<{
    label: OutputAspectRatio;
    icon: typeof Smartphone;
    description: string;
  }> = [
    { label: "9:16", icon: Smartphone, description: "Stories and reels" },
    { label: "16:9", icon: Monitor, description: "Banners and widescreen" },
  ];

  return (
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
              selected && "border-primary/70 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]",
            )}
          >
            <Icon className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-xs font-medium text-muted">{option.description}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}

function getWorkflowSteps({
  customPrompt,
  generatedImage,
  loading,
  productImage,
  referenceImage,
}: {
  customPrompt: string;
  generatedImage: string | null;
  loading: boolean;
  productImage: File | null;
  referenceImage: File | null;
}) {
  const hasProduct = Boolean(productImage);
  const hasReference = Boolean(referenceImage);
  const hasInstructions = customPrompt.trim().length > 0;
  const hasGenerated = Boolean(generatedImage);

  return [
    { label: "Upload Product", state: hasProduct ? "complete" : "current" },
    { label: "Upload Reference", state: hasReference ? "complete" : hasProduct ? "current" : "pending" },
    { label: "Instructions", state: hasInstructions ? "complete" : hasProduct && hasReference ? "current" : "pending" },
    { label: "Generate", state: hasGenerated ? "complete" : loading ? "current" : hasProduct && hasReference ? "current" : "pending" },
    { label: "Export", state: hasGenerated ? "current" : "pending" },
  ] satisfies Array<{ label: string; state: StepState }>;
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
