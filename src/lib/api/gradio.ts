import { Client, handle_file } from "@gradio/client";

export const FLUX_ADVERTISEMENT_SPACE = "prithivMLmods/FLUX.2-Klein-LoRA-Studio";
export const WAN_I2V_VIDEO_SPACE = "zerogpu-aoti/wan2-2-fp8da-aoti-faster";
export const WAN_I2V_VIDEO_DURATION_SECONDS = 5;

type GenerateFluxAdvertisementInput = {
  hfToken?: string;
  productImage: File | Blob | string;
  prompt: string;
  referenceImage?: File | Blob | string;
  timeoutMs: number;
};

export type FluxAdvertisementResult = {
  imageUrl: string;
  rawResult: unknown;
  seed?: number;
};

export type WanVideoResult = {
  rawResult: unknown;
  seed?: number;
  videoUrl: string;
};

export async function generateFluxAdvertisement({
  hfToken,
  productImage,
  prompt,
  referenceImage,
  timeoutMs,
}: GenerateFluxAdvertisementInput): Promise<FluxAdvertisementResult> {
  const client = await Client.connect(
    FLUX_ADVERTISEMENT_SPACE,
    isHuggingFaceToken(hfToken)
      ? {
          token: hfToken,
        }
      : undefined,
  );

  const rawResult = await withTimeout(
    client.predict("/infer", {
      guidance_scale: 1,
      input_images: [
        {
          image: handle_file(productImage),
        },
        ...(referenceImage
          ? [
              {
                image: handle_file(referenceImage),
              },
            ]
          : []),
      ],
      prompt,
      randomize_seed: true,
      seed: 0,
      steps: 4,
      style_name: "None",
    }),
    timeoutMs,
  );

  const imageUrl = extractGeneratedImageUrl(rawResult);
  if (!imageUrl) {
    throw new Error("The Space returned a result, but no generated image URL was found.");
  }

  return {
    imageUrl,
    rawResult,
    seed: extractUsedSeed(rawResult),
  };
}

export async function generateWanProductVideo({
  hfToken,
  productImage,
  prompt,
  timeoutMs,
}: {
  hfToken?: string;
  productImage: File;
  prompt: string;
  timeoutMs: number;
}): Promise<WanVideoResult> {
  const client = await Client.connect(
    WAN_I2V_VIDEO_SPACE,
    isHuggingFaceToken(hfToken) ? { token: hfToken } : undefined,
  );

  const payload = {
    duration_seconds: WAN_I2V_VIDEO_DURATION_SECONDS,
    guidance_scale: 1,
    guidance_scale_2: 1,
    input_image: handle_file(productImage),
    negative_prompt: "static image, no motion, low quality, distorted product, warped logo, blurry, flicker, artifacts, extra objects, unreadable text, watermark, subtitles, text overlay",
    prompt,
    randomize_seed: true,
    seed: 42,
    steps: 6,
  };

  const rawResult = await withTimeout(
    client.predict("/generate_video", payload),
    timeoutMs,
  );

  const videoUrl = extractGeneratedMediaUrl(rawResult);
  if (!videoUrl) {
    throw new Error("The Space returned a result, but no generated video URL was found.");
  }

  return {
    rawResult,
    seed: extractUsedSeed(rawResult),
    videoUrl,
  };
}

export function isHuggingFaceToken(token?: string): token is `hf_${string}` {
  return Boolean(token?.startsWith("hf_"));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function extractGeneratedImageUrl(result: unknown): string | null {
  return extractGeneratedMediaUrl(result);
}

function extractGeneratedMediaUrl(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const data = "data" in result ? (result as { data?: unknown }).data : result;
  const firstItem = Array.isArray(data) ? data.find((item) => hasMediaUrl(item)) ?? data[0] : data;

  if (typeof firstItem === "string") return firstItem;
  if (!firstItem || typeof firstItem !== "object") return null;

  const candidate = firstItem as { path?: unknown; url?: unknown };
  if (typeof candidate.url === "string") return candidate.url;
  if (typeof candidate.path === "string") return candidate.path;

  return null;
}

function hasMediaUrl(value: unknown) {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object") return false;
  const candidate = value as { path?: unknown; url?: unknown };
  return typeof candidate.url === "string" || typeof candidate.path === "string";
}

function extractUsedSeed(result: unknown): number | undefined {
  if (!result || typeof result !== "object" || !("data" in result)) return undefined;
  const data = (result as { data?: unknown }).data;
  if (!Array.isArray(data)) return undefined;

  const seed = Number(data[1]);
  return Number.isFinite(seed) ? seed : undefined;
}
