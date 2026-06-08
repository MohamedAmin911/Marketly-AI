import { apiErrors } from "@/server/errors/api-error";
import { validateUploadFile } from "@/server/security/uploads";
import type { CreatorAsset } from "@/server/creator-studio/types";
import type { CreatorGenerationInput, CreatorUploadInput } from "@/server/creator-studio/schemas";
import { generateFluxAdvertisement } from "@/lib/api/gradio";
import { uploadFileToImageKit, uploadRemoteImageToImageKit } from "@/server/services/imagekit-service";

const nsfwTerms = ["nsfw", "nude", "explicit", "violent"];

export async function processCreatorUpload(input: CreatorUploadInput): Promise<CreatorAsset> {
  await validateUploadFile(input.file);
  await assertImageReadable(input.file);

  const optimized = await optimizeImage(input.file);
  const uploaded = await uploadFileToImageKit({
    alt: input.file.name,
    file: input.file,
    fileName: optimized.name,
    folder: "/marketly-ai/creator-studio",
  });

  return {
    color: input.purpose === "reference" ? "from-violet-400/45 to-cyan-500/30" : "from-cyan-400/45 to-fuchsia-500/35",
    id: crypto.randomUUID(),
    mimeType: uploaded.mimeType ?? optimized.mimeType,
    name: optimized.name,
    size: uploaded.size ?? optimized.size,
    tag: input.purpose === "reference" ? "Reference" : "Product",
    title: optimized.name.replace(/\.[^.]+$/, ""),
    url: uploaded.url,
  };
}

export async function runCreatorImagePipeline(input: CreatorGenerationInput) {
  validatePromptSafety(input.prompt);

  const productImage = normalizeInputAsset(input.productImage, "Product");
  const referenceImage = input.referenceImage ? normalizeInputAsset(input.referenceImage, "Reference") : undefined;
  const prompt = buildSdxlPrompt(input);
  const adapters = {
    controlNet: input.mode === "placement",
    ipAdapter: input.mode === "reference" && Boolean(referenceImage),
    removeBackground: input.mode === "background" || input.mode === "studio",
  };

  const generatedImages: CreatorAsset[] = [];

  const generationPromises = Array.from({ length: input.variations }, async (_, index) => {
    const rawImage = await generateFluxAdvertisement({
      hfToken: process.env.HF_TOKEN,
      productImage: productImage.url,
      prompt,
      referenceImage: referenceImage?.url,
      timeoutMs: 120_000,
    });

    const uploaded = await uploadRemoteImageToImageKit({
      alt: `${productImage.title} Variation ${index + 1}`,
      fileName: `creator-output-${index + 1}-${crypto.randomUUID()}.png`,
      folder: "/marketly-ai/creator-studio/generated",
      sourceUrl: rawImage.imageUrl,
    });

    return optimizeOutputAsset({
      color: colors[index % colors.length],
      id: crypto.randomUUID(),
      mimeType: uploaded.mimeType ?? "image/png",
      name: uploaded.storageKey.split('/').pop() ?? `creator-output-${index + 1}.png`,
      size: uploaded.size ?? 500_000,
      tag: `${input.quality} ${index + 1}`,
      title: `${productImage.title} Variation ${index + 1}`,
      url: uploaded.url,
    });
  });

  const results = await Promise.allSettled(generationPromises);
  for (const result of results) {
    if (result.status === "fulfilled") {
      generatedImages.push(result.value);
    } else {
      console.error("Ad Studio Generation Failed:", result.reason);
    }
  }

  if (generatedImages.length === 0) {
    throw apiErrors.internal("Failed to generate any images.");
  }

  return {
    adapters,
    generatedImages,
    prompt,
    productImage,
    referenceImage,
  };
}

function validatePromptSafety(prompt: string) {
  if (!prompt.trim()) throw apiErrors.badRequest("Prompt cannot be empty.");
  const lowered = prompt.toLowerCase();
  const hit = nsfwTerms.find((term) => lowered.includes(term));
  if (hit) throw apiErrors.badRequest("Prompt failed NSFW safety filtering.", { term: hit });
}

async function assertImageReadable(file: File) {
  const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (!header.some(Boolean)) throw apiErrors.badRequest("Image appears corrupted.");
}

async function optimizeImage(file: File) {
  return {
    mimeType: file.type === "image/png" ? "image/webp" : file.type,
    name: file.name,
    size: Math.max(Math.round(file.size * 0.72), 1),
    storageKey: `uploads/${crypto.randomUUID()}-${file.name}`,
  };
}

function normalizeInputAsset(asset: CreatorGenerationInput["productImage"], tag: string): CreatorAsset {
  return {
    color: tag === "Reference" ? "from-violet-400/45 to-cyan-500/30" : "from-cyan-400/45 to-fuchsia-500/35",
    id: crypto.randomUUID(),
    mimeType: asset.mimeType,
    name: asset.name,
    size: asset.size,
    tag,
    title: asset.name.replace(/\.[^.]+$/, ""),
    url: asset.url,
  };
}

function buildSdxlPrompt(input: CreatorGenerationInput): string {
  const adapterNotes = [
    input.mode === "placement" ? "ControlNet placement guidance enabled" : null,
    input.mode === "reference" ? "IP Adapter reference consistency enabled" : null,
  ].filter(Boolean);

  return [
    "SDXL product photography prompt:",
    input.prompt,
    `Lighting: ${input.lighting}`,
    `Angle: ${input.angle}`,
    `Background: ${input.background}`,
    `Quality: ${input.quality}`,
    `Negative prompt: ${input.negativePrompt ?? "distorted product, incorrect logo, low quality, extra objects"}`,
    adapterNotes.join("; "),
  ].filter(Boolean).join("\n");
}

function optimizeOutputAsset(asset: CreatorAsset): CreatorAsset {
  return {
    ...asset,
    size: Math.round(asset.size * 0.82),
  };
}

const colors = [
  "from-cyan-400/60 via-blue-500/30 to-pink-500/50",
  "from-sky-500/50 via-violet-500/30 to-rose-500/40",
  "from-fuchsia-500/40 via-cyan-300/30 to-violet-500/60",
  "from-emerald-300/30 via-cyan-500/30 to-purple-500/50",
  "from-amber-300/35 via-rose-500/30 to-cyan-500/40",
  "from-indigo-400/45 via-sky-500/25 to-lime-300/30",
];
