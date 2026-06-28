import { Types } from "mongoose";

import { generateWanProductVideo, WAN_I2V_VIDEO_DURATION_SECONDS, WAN_I2V_VIDEO_SPACE } from "@/lib/api/gradio";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { env } from "@/server/config/env";
import { connectToDatabase, VideoModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";
import { validateUploadFile } from "@/server/security/uploads";
import { uploadFileToImageKit, uploadRemoteImageToImageKit } from "@/server/services/imagekit-service";
import type { VideoGenerationInput } from "@/server/video-generator/schemas";
import type { VideoRecord } from "@/server/video-generator/types";
import { CreditsService } from "@/server/services/billing/credits.service";

const GENERATION_TIMEOUT_MS = 300_000;

export async function generateProductVideo(input: VideoGenerationInput, auth: AuthContext): Promise<VideoRecord> {
  const userId = toObjectId(auth.user.sub);
  if (!userId) throw apiErrors.unauthorized("A valid user session is required to save video generations.");

  await validateUploadFile(input.productImage);
  await assertImageReadable(input.productImage);

  const startedAt = Date.now();

  await connectToDatabase();
  await CreditsService.deductCredits(userId.toString(), 5, "video_generator", "Generated product video");

  const finalPrompt = buildVideoPrompt(input.prompt, input.selectedStyle);
  const [productAsset, wanResult] = await Promise.all([
    uploadFileToImageKit({
      alt: "Video product image",
      file: input.productImage,
      fileName: `video-product-${crypto.randomUUID()}-${input.productImage.name}`,
      folder: "/marketly-ai/video-products",
    }),
    generateWanProductVideo({
      hfToken: env.HF_TOKEN ?? env.HUGGINGFACE_API_KEY,
      productImage: input.productImage,
      prompt: finalPrompt,
      timeoutMs: GENERATION_TIMEOUT_MS,
    }),
  ]);

  const videoAsset = await uploadRemoteImageToImageKit({
    alt: "Generated AI product video",
    fileName: `product-video-${crypto.randomUUID()}.mp4`,
    folder: "/marketly-ai/videos",
    sourceUrl: wanResult.videoUrl,
  });

  await connectToDatabase();
  const video = await VideoModel.create({
    duration: WAN_I2V_VIDEO_DURATION_SECONDS,
    fps: 16,
    productImage: toAssetRef(productAsset),
    projectId: undefined,
    prompt: input.prompt,
    renderErrors: [],
    renderProgress: 100,
    renderStatus: "completed",
    renderTime: Date.now() - startedAt,
    resolution: "Wan 2.2 I2V",
    selectedStyle: input.selectedStyle,
    thumbnailUrl: productAsset.thumbnailUrl ?? productAsset.url,
    title: titleFromPrompt(input.prompt),
    type: "product_demo",
    userId,
    videoAsset: toAssetRef(videoAsset),
    videoPrompt: input.prompt,
    videoUrl: videoAsset.url,
  });

  await updateAIMemory({
    averageGenerationType: "video",
    mostUsedFeatures: ["ai-product-video-generator"],
    preferredStyles: [input.selectedStyle],
    successfulCreatives: [{
      format: "video",
      id: String(video._id),
      mimeType: videoAsset.mimeType,
      performanceNote: input.prompt,
      title: video.title,
      url: videoAsset.url,
    }],
    successfulPrompts: [input.prompt],
    userId: auth.user.sub,
    userPatterns: {
      lastProductVideoAt: new Date().toISOString(),
      lastProductVideoStyle: input.selectedStyle,
      videoModel: WAN_I2V_VIDEO_SPACE,
    },
  }).catch(() => undefined);

  return serializeVideo(video);
}

export async function listProductVideos(auth: AuthContext): Promise<{ items: VideoRecord[] }> {
  const userId = toObjectId(auth.user.sub);
  if (!userId) return { items: [] };

  await connectToDatabase();
  const videos = await VideoModel.find({ userId }).sort({ createdAt: -1 }).limit(60).lean();
  return { items: videos.map(serializeVideo) };
}

export async function getVideoJob(id: string): Promise<VideoRecord | undefined> {
  if (!Types.ObjectId.isValid(id)) return undefined;
  await connectToDatabase();
  const video = await VideoModel.findById(id).lean();
  return video ? serializeVideo(video) : undefined;
}

export async function getVideoExport(id: string): Promise<{ contentType: string; filename: string; url: string } | undefined> {
  const video = await getVideoJob(id);
  if (!video?.videoUrl) return undefined;

  return {
    contentType: "video/mp4",
    filename: `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`,
    url: video.videoUrl,
  };
}

function buildVideoPrompt(prompt: string, style: string) {
  const userPrompt = prompt.trim();

  return [
    `Primary motion direction: ${userPrompt}`,
    `Style preset: ${style}. Apply this style only if it supports the primary motion direction.`,
    "Follow the primary motion direction literally and make the visible action match it.",
    "Do not replace the requested action with a generic product reveal, generic zoom, or unrelated camera move.",
    "Preserve the uploaded product identity, proportions, colors, materials, labels, and branding.",
    "Use smooth camera motion and commercial lighting only as supporting details.",
    "No warped logo, no distorted product, no extra products, no text overlays, no watermark.",
  ].join("\n");
}

function serializeVideo(value: unknown): VideoRecord {
  const video = isRecord(value) ? value : {};
  const videoAsset = isRecord(video.videoAsset) ? video.videoAsset : undefined;

  return {
    createdAt: toIso(video.createdAt),
    id: String(video._id),
    productImage: isRecord(video.productImage) ? video.productImage : undefined,
    prompt: stringValue(video.videoPrompt ?? video.prompt),
    renderErrors: Array.isArray(video.renderErrors) ? video.renderErrors.filter((item): item is string => typeof item === "string") : [],
    renderStatus: video.renderStatus === "failed" || video.renderStatus === "queued" || video.renderStatus === "rendering" || video.renderStatus === "canceled" ? video.renderStatus : "completed",
    renderTime: typeof video.renderTime === "number" ? video.renderTime : 0,
    selectedStyle: stringValue(video.selectedStyle, "Luxury Commercial"),
    thumbnailUrl: stringValue(video.thumbnailUrl),
    title: stringValue(video.title, "AI Product Video"),
    updatedAt: toIso(video.updatedAt),
    videoUrl: stringValue(video.videoUrl ?? videoAsset?.url),
  };
}

function toAssetRef(asset: Record<string, unknown>) {
  return {
    alt: asset.alt,
    fileId: asset.fileId,
    height: asset.height,
    metadata: asset.metadata,
    mimeType: asset.mimeType,
    storageKey: asset.storageKey,
    thumbnailUrl: asset.thumbnailUrl,
    url: asset.url,
    width: asset.width,
  };
}

function titleFromPrompt(prompt: string) {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (!cleaned) return "AI Product Video";
  return cleaned.length > 62 ? `${cleaned.slice(0, 59)}...` : cleaned;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function toObjectId(value: string) {
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  if (process.env.NODE_ENV !== "production") return new Types.ObjectId("000000000000000000000001");
  return null;
}

async function assertImageReadable(file: File) {
  const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (!header.some(Boolean)) throw apiErrors.badRequest("Image appears corrupted.");
}
