import { Types } from "mongoose";

import { FLUX_ADVERTISEMENT_SPACE, generateFluxAdvertisement } from "@/lib/api/gradio";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { connectToDatabase, GeneratedContentModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { uploadRemoteImageToImageKit } from "@/server/services/imagekit-service";

const OPENROUTER_MODEL = "openrouter/owl-alpha";
const SCENE_COUNT = 1;
const GRADIO_TIMEOUT_MS = 240_000;

const STORYBOARD_GENERATION_PROMPT = `You are an elite cinematic commercial director.

Generate a 1-scene luxury advertisement storyboard for the uploaded product.

For each scene generate:

1. sceneTitle
2. imagePrompt
3. short cinematic script line

The script line should:

* be short
* emotional
* premium
* cinematic
* similar to Apple or Nike commercials

The image prompts should:

* preserve consistent product identity
* feel cinematic
* feel like luxury advertising
* maintain visual consistency across scenes

Return ONLY valid JSON array.

Example format:

[
{
"sceneTitle": "",
"imagePrompt": "",
"script": ""
}
]`;

export type CinematicStoryboardScene = {
  generatedImage: string;
  imagePrompt: string;
  sceneTitle: string;
  script: string;
};

export type CinematicStoryboardResult = {
  generationId: string;
  scenes: CinematicStoryboardScene[];
};

type SceneDraft = Omit<CinematicStoryboardScene, "generatedImage">;

export async function generateCinematicStoryboard({
  campaignPrompt,
  productImage,
  userId,
}: {
  campaignPrompt: string;
  productImage: File;
  userId: string;
}): Promise<CinematicStoryboardResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw apiErrors.unauthorized("A valid user session is required to save storyboard generations.");
  }

  const startedAt = Date.now();
  const drafts = await generateStoryboardDrafts(campaignPrompt);
  const scenes: CinematicStoryboardScene[] = [];
  const uploadedFrames: Array<{ alt: string; mimeType?: string; storageKey: string; url: string }> = [];

  for (const [index, draft] of drafts.entries()) {
    const imagePrompt = buildStoryboardImagePrompt(draft.imagePrompt);
    const image = await generateFluxAdvertisement({
      hfToken: process.env.HF_TOKEN,
      productImage,
      prompt: imagePrompt,
      timeoutMs: GRADIO_TIMEOUT_MS,
    });
    const uploadedFrame = await uploadRemoteImageToImageKit({
      alt: draft.sceneTitle,
      fileName: `storyboard-frame-${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}.png`,
      folder: "/marketly-ai/storyboards",
      sourceUrl: image.imageUrl,
    });
    uploadedFrames.push({
      alt: draft.sceneTitle,
      mimeType: uploadedFrame.mimeType,
      storageKey: uploadedFrame.storageKey,
      url: uploadedFrame.url,
    });

    scenes.push({
      generatedImage: uploadedFrame.url,
      imagePrompt: draft.imagePrompt,
      sceneTitle: draft.sceneTitle,
      script: draft.script,
    });
  }

  await connectToDatabase();
  const generation = await GeneratedContentModel.create({
    brandMemoryUsed: true,
    downloaded: false,
    favorited: false,
    generatedCaptions: scenes.map((scene) => scene.script),
    generatedHooks: scenes.map((scene) => scene.sceneTitle),
    generatedImages: uploadedFrames,
    generationCost: 0,
    generationErrors: [],
    generationSettings: {
      stylePreset: "cinematic-storyboard",
      temperature: 0.7,
    },
    generationStatus: "completed",
    generationTime: Date.now() - startedAt,
    modelUsed: `${OPENROUTER_MODEL} + ${FLUX_ADVERTISEMENT_SPACE}`,
    personalizationUsed: true,
    productImage: {
      alt: productImage.name || "Storyboard product image",
      mimeType: productImage.type,
      storageKey: productImage.name || "storyboard-product-image",
    },
    prompt: campaignPrompt,
    quality: "ultra",
    regenerated: false,
    type: "storyboard",
    uploadedAssets: [],
    userId: new Types.ObjectId(userId),
  });

  await updateAIMemory({
    averageGenerationType: "storyboard",
    mostUsedFeatures: ["ai-cinematic-storyboard-director"],
    preferredStyles: ["cinematic advertising", "luxury commercial storytelling", "storyboard frames"],
    successfulCreatives: scenes.map((scene, index) => ({
      format: "cinematic storyboard",
      id: `${String(generation._id)}-${index + 1}`,
      mimeType: "image/png",
      performanceNote: scene.script,
      title: scene.sceneTitle,
      url: scene.generatedImage,
    })),
    successfulPrompts: [campaignPrompt],
    userId,
    userPatterns: {
      lastStoryboardGeneratedAt: new Date().toISOString(),
      lastStoryboardSceneCount: SCENE_COUNT,
    },
  });

  return {
    generationId: String(generation._id),
    scenes,
  };
}

async function generateStoryboardDrafts(campaignPrompt: string): Promise<SceneDraft[]> {
  const prompt = `${STORYBOARD_GENERATION_PROMPT}

Campaign Prompt:
${campaignPrompt}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "OpenRouter storyboard generation failed.";
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned an empty storyboard response.");
  }

  return normalizeSceneDrafts(parseJsonArray(content));
}

function parseJsonArray(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("OpenRouter response did not include a valid JSON array.");
    return JSON.parse(match[0]);
  }
}

function normalizeSceneDrafts(value: unknown): SceneDraft[] {
  if (!Array.isArray(value)) {
    throw new Error("OpenRouter response must be a JSON array.");
  }

  const scenes = value.slice(0, SCENE_COUNT).map((item, index) => {
    const scene = item && typeof item === "object" ? item as Record<string, unknown> : {};

    return {
      imagePrompt: cleanText(scene.imagePrompt, `Luxury cinematic product storyboard scene ${index + 1}.`),
      sceneTitle: cleanText(scene.sceneTitle, `Scene ${index + 1}`),
      script: cleanText(scene.script, "Make every detail matter."),
    };
  });

  if (scenes.length !== SCENE_COUNT) {
    throw new Error(`OpenRouter must return exactly ${SCENE_COUNT} storyboard scene.`);
  }

  return scenes;
}

function buildStoryboardImagePrompt(scenePrompt: string): string {
  return `The FIRST uploaded image is the target product.

Create a cinematic luxury storyboard scene using this product.

Preserve the exact:

* shape
* colors
* branding
* proportions
* materials
* details

Scene Description:
${scenePrompt}

The result should feel like:

* cinematic advertising
* premium campaign visuals
* luxury commercial photography
* movie storyboard frames

Ultra realistic.
Photorealistic.
Cinematic lighting.
Luxury commercial atmosphere.`;
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : fallback;
}
