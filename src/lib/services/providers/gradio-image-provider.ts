import { Client, handle_file } from "@gradio/client";
import type { AIImageInput, AIImageResult } from "@/lib/services/ai-provider";

export const FLUX_ADVERTISEMENT_SPACE = "prithivMLmods/FLUX.2-Klein-LoRA-Studio";

function getHfToken(): string | undefined {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
}

function isHuggingFaceToken(token?: string): token is `hf_${string}` {
  return Boolean(token?.startsWith("hf_"));
}

async function resolveToBlob(image: Blob | string): Promise<Blob> {
  if (image instanceof Blob) return image;
  const response = await fetch(image);
  if (!response.ok) throw new Error(`Failed to fetch image from URL: ${image} (status ${response.status})`);
  return response.blob();
}

export async function generateFluxImage(
  input: AIImageInput
): Promise<AIImageResult> {
  const token = getHfToken();
  const client = await Client.connect(
    FLUX_ADVERTISEMENT_SPACE,
    isHuggingFaceToken(token) ? { token } : undefined,
  );

  const inputImages: Array<{ image: unknown }> = [];

  if (input.productImage) {
    const blob = await resolveToBlob(input.productImage);
    inputImages.push({ image: handle_file(blob) });
  }
  if (input.referenceImage) {
    const blob = await resolveToBlob(input.referenceImage);
    inputImages.push({ image: handle_file(blob) });
  }

  const rawResult = await client.predict("/infer", {
    guidance_scale: 1,
    input_images: inputImages,
    prompt: input.prompt,
    randomize_seed: true,
    seed: 0,
    steps: 4,
    style_name: "None",
  });

  const imageUrl = extractGeneratedImageUrl(rawResult.data);
  if (!imageUrl) {
    throw new Error("FLUX Space returned a result, but no generated image URL was found.");
  }

  return {
    imageUrl,
    revisedPrompt: input.prompt,
    seed: extractUsedSeed(rawResult.data),
    rawResult,
  };
}

function extractGeneratedImageUrl(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") return null;

  const items = Array.isArray(data) ? data : [];
  const firstItem =
    items.find((item) => hasMediaUrl(item)) ?? items[0];

  if (typeof firstItem === "string") return firstItem;
  if (!firstItem || typeof firstItem !== "object") return null;

  const candidate = firstItem as { path?: unknown; url?: unknown };
  if (typeof candidate.url === "string") return candidate.url;
  if (typeof candidate.path === "string") return candidate.path;

  return null;
}

function hasMediaUrl(value: unknown): boolean {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object") return false;
  const candidate = value as { path?: unknown; url?: unknown };
  return typeof candidate.url === "string" || typeof candidate.path === "string";
}

function extractUsedSeed(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const items = Array.isArray(data) ? data : [];
  const seed = Number(items[1]);
  return Number.isFinite(seed) ? seed : undefined;
}
