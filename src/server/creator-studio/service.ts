import { z } from "zod";
import { Types } from "mongoose";
import { CreditsService } from "@/server/services/billing/credits.service";

import { buildMemoryContext, injectMemoryGuidance } from "@/server/ai/memory/memory-builder";
import { connectToDatabase, GeneratedContentModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";
import { processCreatorUpload, runCreatorImagePipeline } from "@/server/creator-studio/image-pipeline";
import type { CreatorGenerationInput, CreatorUploadInput } from "@/server/creator-studio/schemas";
import type { CreatorAsset, CreatorGenerationRecord } from "@/server/creator-studio/types";

const generationStore = new Map<string, CreatorGenerationRecord>();
const duplicateIndex = new Map<string, string>();
const pendingGenerations = new Map<string, Promise<CreatorGenerationRecord>>();

export async function uploadCreatorImage(input: CreatorUploadInput) {
  const asset = await processCreatorUpload(input);

  return {
    asset,
    uploadStatus: "ready" as const,
  };
}

export async function generateCreatorAssets(input: CreatorGenerationInput, auth: AuthContext): Promise<CreatorGenerationRecord> {
  if (input.mode === "reference" && !input.referenceImage) {
    throw apiErrors.badRequest("Reference mode requires a reference image.");
  }

  const fingerprint = await createGenerationFingerprint(input, auth.user.sub);
  const duplicate = duplicateIndex.get(fingerprint);

  if (duplicate) {
    const existing = generationStore.get(duplicate);
    if (existing) return existing;
  }

  const pending = pendingGenerations.get(fingerprint);
  if (pending) return pending;

  const generationPromise = withCreatorTimeout(runGeneration(input, auth), 22_000);
  pendingGenerations.set(fingerprint, generationPromise);

  try {
    const record = await generationPromise;
    duplicateIndex.set(fingerprint, record.id);
    generationStore.set(record.id, record);
    return record;
  } catch (error) {
    const failedRecord = createFailedRecord(input, error);
    generationStore.set(failedRecord.id, failedRecord);
    throw error;
  } finally {
    pendingGenerations.delete(fingerprint);
  }
}

export async function listCreatorHistory({ cursor, limit }: { cursor?: string; limit: number }, auth?: AuthContext) {
  const userId = auth ? toObjectId(auth.user.sub) : null;

  if (userId) {
    await connectToDatabase();
    const query: Record<string, unknown> = cursor && Types.ObjectId.isValid(cursor) ? { _id: { $lt: new Types.ObjectId(cursor) }, type: "image", userId } : { type: "image", userId };
    const items = await GeneratedContentModel.find(query).sort({ createdAt: -1 }).limit(limit + 1).lean();
    const page = items.slice(0, limit);

    return {
      items: page.map((item) => ({
        angle: item.angle ?? "eye",
        background: item.background ?? "premium dark studio",
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString(),
        downloaded: item.downloaded,
        favorited: item.favorited,
        generatedImages: item.generatedImages.map(toCreatorAsset),
        generationErrors: item.generationErrors,
        generationStatus: item.generationStatus,
        id: String(item._id),
        lighting: item.lighting ?? "studio",
        mode: item.mode ?? "studio",
        productImage: item.productImage ? toCreatorAsset(item.productImage) : toCreatorAsset({ alt: "Product", mimeType: "image/webp", storageKey: "creator/product-placeholder.webp", url: "memory://creator/product-placeholder.webp" }),
        prompt: item.prompt,
        quality: item.quality ?? "high",
        referenceImage: item.referenceImage ? toCreatorAsset(item.referenceImage) : undefined,
      })),
      nextCursor: items[limit]?._id ? String(items[limit]._id) : undefined,
    };
  }

  const items = [...generationStore.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = cursor ? Math.max(items.findIndex((item) => item.id === cursor) + 1, 0) : 0;
  const page = items.slice(start, start + limit);

  return {
    items: page,
    nextCursor: items[start + limit]?.id,
  };
}

export function listCreatorFavorites() {
  return {
    items: [...generationStore.values()].filter((item) => item.favorited).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function setCreatorFavorite(generationId: string, favorited: boolean) {
  const record = getGeneration(generationId);
  record.favorited = favorited;
  generationStore.set(record.id, record);

  return record;
}

export function markCreatorDownloaded(generationId: string) {
  const record = getGeneration(generationId);
  record.downloaded = true;
  generationStore.set(record.id, record);

  return record;
}

export async function retryCreatorGeneration(generationId: string, auth: AuthContext) {
  const record = getGeneration(generationId);

  return generateCreatorAssets(
    {
      angle: record.angle as CreatorGenerationInput["angle"],
      background: record.background,
      lighting: record.lighting as CreatorGenerationInput["lighting"],
      mode: record.mode as CreatorGenerationInput["mode"],
      productImage: record.productImage,
      prompt: record.prompt,
      quality: record.quality as CreatorGenerationInput["quality"],
      referenceImage: record.referenceImage,
      variations: Math.max(record.generatedImages.length, 1),
    },
    auth,
  );
}


async function runGeneration(input: CreatorGenerationInput, auth: AuthContext): Promise<CreatorGenerationRecord> {
  // Deduct credits before generation (1 credit per image variation)
  const creditsCost = input.variations || 1;
  await CreditsService.deductCredits(auth.user.sub, creditsCost, "creator_studio", `Generated ${creditsCost} ad asset(s)`);

  const memory = await buildMemoryContext(auth.user.sub, input.brandId);
  const enrichedInput = {
    ...input,
    prompt: `${input.prompt}\n\nBrand memory:\n${injectMemoryGuidance(memory)}`,
  };
  const result = await runCreatorImagePipeline(enrichedInput);

  const record: CreatorGenerationRecord = {
    angle: input.angle,
    background: input.background,
    createdAt: new Date().toISOString(),
    downloaded: false,
    favorited: false,
    generatedImages: result.generatedImages,
    generationErrors: [],
    generationStatus: "completed",
    id: crypto.randomUUID(),
    lighting: input.lighting,
    mode: input.mode,
    productImage: result.productImage,
    prompt: input.prompt,
    quality: input.quality,
    referenceImage: result.referenceImage,
  };

  await persistCreatorGeneration(record, auth).catch(() => undefined);

  return record;
}

function getGeneration(generationId: string): CreatorGenerationRecord {
  const record = generationStore.get(generationId);
  if (!record) throw apiErrors.notFound("Generation was not found.");
  return record;
}

async function createGenerationFingerprint(input: CreatorGenerationInput, userId: string): Promise<string> {
  const payload = JSON.stringify({
    angle: input.angle,
    background: input.background,
    lighting: input.lighting,
    mode: input.mode,
    product: input.productImage.url,
    prompt: input.prompt,
    quality: input.quality,
    reference: input.referenceImage?.url,
    userId,
    variations: input.variations,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Buffer.from(digest).toString("base64url");
}

async function withCreatorTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(apiErrors.timeout("Creator Studio generation timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function createFailedRecord(input: CreatorGenerationInput, error: unknown): CreatorGenerationRecord {
  return {
    angle: input.angle,
    background: input.background,
    createdAt: new Date().toISOString(),
    downloaded: false,
    favorited: false,
    generatedImages: [],
    generationErrors: [error instanceof Error ? error.message : String(error)],
    generationStatus: "failed",
    id: crypto.randomUUID(),
    lighting: input.lighting,
    mode: input.mode,
    productImage: {
      color: "from-red-400/30 to-slate-900",
      id: crypto.randomUUID(),
      mimeType: input.productImage.mimeType,
      name: input.productImage.name,
      size: input.productImage.size,
      tag: "Failed",
      title: input.productImage.name,
      url: input.productImage.url,
    },
    prompt: input.prompt,
    quality: input.quality,
    referenceImage: input.referenceImage
      ? {
          color: "from-red-400/30 to-slate-900",
          id: crypto.randomUUID(),
          mimeType: input.referenceImage.mimeType,
          name: input.referenceImage.name,
          size: input.referenceImage.size,
          tag: "Reference",
          title: input.referenceImage.name,
          url: input.referenceImage.url,
        }
      : undefined,
  };
}

export const creatorActionResponseSchema = z.object({
  generationId: z.string(),
});

async function persistCreatorGeneration(record: CreatorGenerationRecord, auth: AuthContext) {
  const userId = toObjectId(auth.user.sub);
  if (!userId) return;

  await connectToDatabase();
  const created = await GeneratedContentModel.create({
    angle: record.angle,
    background: record.background,
    downloaded: record.downloaded,
    favorited: record.favorited,
    generatedImages: record.generatedImages.map(toAssetRef),
    generationErrors: record.generationErrors,
    generationStatus: record.generationStatus,
    generationTime: 0,
    lighting: record.lighting,
    mode: record.mode,
    modelUsed: "FLUX.2-Klein-LoRA-Studio",
    productImage: toAssetRef(record.productImage),
    prompt: record.prompt,
    quality: record.quality,
    referenceImage: record.referenceImage ? toAssetRef(record.referenceImage) : undefined,
    type: "image",
    userId,
  });

  record.id = String(created._id);
}

function toAssetRef(asset: CreatorAsset) {
  return {
    alt: asset.title || asset.name,
    mimeType: asset.mimeType,
    storageKey: asset.url?.replace(/^memory:\/\//, "") ?? asset.name,
    url: asset.url,
  };
}

function toCreatorAsset(asset: Record<string, unknown>): CreatorAsset {
  const storageKey = typeof asset.storageKey === "string" ? asset.storageKey : "";
  const url = typeof asset.url === "string" ? asset.url : storageKey ? `memory://${storageKey}` : "";
  const title = typeof asset.alt === "string" ? asset.alt : storageKey.split("/").pop() ?? "Generated asset";

  return {
    color: "from-cyan-400/60 via-blue-500/30 to-pink-500/50",
    id: crypto.randomUUID(),
    mimeType: typeof asset.mimeType === "string" ? asset.mimeType : "image/webp",
    name: title,
    size: 0,
    tag: "Saved",
    title,
    url,
  };
}

function toObjectId(value: string) {
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}
