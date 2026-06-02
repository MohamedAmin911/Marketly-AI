import { Types } from "mongoose";

import { generateFluxAdvertisement } from "@/lib/api/gradio";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { env } from "@/server/config/env";
import { connectToDatabase, GeneratedContentModel } from "@/server/database";
import { uploadRemoteImageToImageKit } from "@/server/services/imagekit-service";

const GENERATION_TIMEOUT_MS = 240_000;
const MODEL_ID = "prithivMLmods/FLUX.2-Klein-LoRA-Studio";

type GenerateAdvertisementInput = {
  aspectRatio: string;
  productImage: File;
  prompt: string;
  referenceImage: File;
  userId: string;
};

export async function generateProductAdvertisement({
  aspectRatio,
  productImage,
  prompt,
  referenceImage,
  userId,
}: GenerateAdvertisementInput) {
  const startedAt = Date.now();
  const fluxResult = await generateFluxAdvertisement({
    hfToken: env.HF_TOKEN ?? env.HUGGINGFACE_API_KEY,
    productImage,
    prompt,
    referenceImage,
    timeoutMs: GENERATION_TIMEOUT_MS,
  });

  const imageKitAsset = await uploadRemoteImageToImageKit({
    alt: "AI generated product advertisement",
    fileName: `advertisement-${aspectRatio.replace(":", "x")}-${crypto.randomUUID()}.png`,
    sourceUrl: fluxResult.imageUrl,
  });

  await connectToDatabase();
  const generation = await GeneratedContentModel.create({
    brandMemoryUsed: true,
    downloaded: false,
    favorited: false,
    generatedCaptions: [],
    generatedHooks: [],
    generatedImages: [
      {
        alt: imageKitAsset.alt,
        mimeType: imageKitAsset.mimeType,
        storageKey: imageKitAsset.storageKey,
        url: imageKitAsset.url,
      },
    ],
    generationCost: 0,
    generationErrors: [],
    generationSettings: {
      aspectRatio,
      cfgScale: 1,
      seed: fluxResult.seed,
      steps: 4,
      stylePreset: "None",
    },
    generationStatus: "completed",
    generationTime: Date.now() - startedAt,
    mode: "reference",
    modelUsed: MODEL_ID,
    personalizationUsed: true,
    productImage: {
      alt: productImage.name || "Product image",
      mimeType: productImage.type,
      storageKey: productImage.name || "product-image",
    },
    prompt,
    quality: "high",
    referenceImage: {
      alt: referenceImage.name || "Reference advertisement",
      mimeType: referenceImage.type,
      storageKey: referenceImage.name || "reference-advertisement",
    },
    regenerated: false,
    type: "image",
    uploadedAssets: [],
    userId: new Types.ObjectId(userId),
  });

  await updateAIMemory({
    averageGenerationType: "image",
    mostUsedFeatures: ["ai-product-advertisement-studio"],
    preferredStyles: ["commercial advertising", "cinematic product replacement", aspectRatio],
    successfulCreatives: [
      {
        format: aspectRatio,
        id: String(generation._id),
        mimeType: imageKitAsset.mimeType,
        performanceNote: "Generated and saved from AI Product Advertisement Studio.",
        title: "AI Product Advertisement",
        url: imageKitAsset.url,
      },
    ],
    successfulPrompts: [prompt],
    userId,
    userPatterns: {
      lastGeneratedAdAspectRatio: aspectRatio,
      lastGeneratedAdAt: new Date().toISOString(),
    },
  });

  return {
    generationId: String(generation._id),
    image: {
      url: imageKitAsset.url,
    },
    result: fluxResult.rawResult,
  };
}
