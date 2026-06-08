import { generateFluxAdvertisement, generateWanProductVideo, FLUX_ADVERTISEMENT_SPACE, WAN_I2V_VIDEO_SPACE } from "@/lib/api/gradio";
import { env } from "@/server/config/env";
import { apiErrors } from "@/server/errors/api-error";
import {
  addJobError,
  addJobLog,
  enqueueGrowthGenerationJob,
  updateJobProgress,
} from "@/server/growth-engine/job-queue";
import {
  acquireGrowthProjectLock,
  getGrowthProjectForUser,
  releaseGrowthProjectLock,
  updateGrowthProjectGeneration,
} from "@/server/growth-engine/repository";
import { retryOperation, withOperationTimeout } from "@/server/growth-engine/retry";
import type { GrowthGenerationJob, GrowthGenerationJobResponse, GrowthProjectRecord } from "@/server/growth-engine/types";
import { logger } from "@/server/logging/logger";
import type { AuthContext } from "@/server/security/auth-guard";
import { uploadRemoteImageToImageKit } from "@/server/services/imagekit-service";

const PROJECT_LOCK_TTL_MS = 90 * 60 * 1000;
const IMAGE_GENERATION_TIMEOUT_MS = 140_000;
const VIDEO_GENERATION_TIMEOUT_MS = 340_000;
const IMAGEKIT_REMOTE_UPLOAD_TIMEOUT_MS = 60_000;

type StoryboardScene = {
  id: string;
  imagePrompt?: string;
  script?: string;
  title: string;
};

type ImageAsset = {
  id: string;
  prompt?: string;
  sceneId?: string;
  sceneTitle?: string;
  url: string;
};

export async function enqueueVisualAssetGeneration(projectId: string, auth: AuthContext): Promise<GrowthGenerationJobResponse> {
  return enqueueGrowthGenerationJob({
    kind: "visual_assets",
    projectId,
    task: (job) => runVisualAssetJob(job),
    userId: auth.user.sub,
  });
}

export async function enqueueVideoAssetGeneration(projectId: string, auth: AuthContext): Promise<GrowthGenerationJobResponse> {
  return enqueueGrowthGenerationJob({
    kind: "video_assets",
    projectId,
    task: (job) => runVideoAssetJob(job),
    userId: auth.user.sub,
  });
}

async function runVisualAssetJob(job: GrowthGenerationJob) {
  const lockAcquired = await acquireGrowthProjectLock({
    jobId: job.id,
    kind: job.kind,
    projectId: job.projectId,
    ttlMs: PROJECT_LOCK_TTL_MS,
    userId: job.userId,
  });

  if (!lockAcquired) {
    throw apiErrors.conflict("This growth project is already processing.");
  }

  try {
    const project = await getGrowthProjectForUser(job.projectId, job.userId);
    const scenes = extractStoryboardScenes(project);
    if (!scenes.length) throw apiErrors.badRequest("No storyboard scenes are available for visual generation.");

    const existingSceneIds = new Set(project.imageAssets.map((asset) => stringValue(asset.sceneId)).filter(Boolean));
    const pendingScenes = scenes.filter((scene) => !existingSceneIds.has(scene.id));

    updateJobProgress(job.id, { total: pendingScenes.length });
    addJobLog(job.id, `Loaded ${scenes.length} storyboard scenes. ${pendingScenes.length} scenes need visual assets.`);
    logger.info("growth_engine.visual_assets.started", { jobId: job.id, projectId: job.projectId, sceneCount: pendingScenes.length });

    const generatedAssets: Record<string, unknown>[] = [];

    for (const [index, scene] of pendingScenes.entries()) {
      addJobLog(job.id, `Generating visual asset ${index + 1}/${pendingScenes.length}: ${scene.title}`);
      logger.info("growth_engine.visual_assets.scene.started", { jobId: job.id, sceneId: scene.id, sceneTitle: scene.title });

      try {
        const prompt = buildImagePrompt(project, scene);
        const generated = await retryOperation({
          attempts: 2,
          delayMs: 1_000,
          label: `flux-scene-${scene.id}`,
          task: () =>
            generateFluxAdvertisement({
              hfToken: env.HF_TOKEN ?? env.HUGGINGFACE_API_KEY,
              productImage: project.productImage?.url ?? "",
              prompt,
              timeoutMs: IMAGE_GENERATION_TIMEOUT_MS,
            }),
        });

        const uploaded = await withOperationTimeout(
          uploadRemoteImageToImageKit({
            alt: `${project.brandName} ${scene.title}`,
            fileName: `growth-engine-${job.projectId}-${scene.id}.png`,
            folder: "/marketly-ai/growth-engine/images",
            sourceUrl: generated.imageUrl,
          }),
          IMAGEKIT_REMOTE_UPLOAD_TIMEOUT_MS,
          "Growth Engine visual upload timed out.",
        );

        generatedAssets.push({
          ...uploaded,
          jobId: job.id,
          prompt,
          provider: "huggingface",
          sceneId: scene.id,
          sceneTitle: scene.title,
          seed: generated.seed,
          sourceSpace: FLUX_ADVERTISEMENT_SPACE,
          status: "completed",
        });

        updateJobProgress(job.id, { completed: generatedAssets.length });
        addJobLog(job.id, `Visual asset completed for scene: ${scene.title}`);
        logger.info("growth_engine.visual_assets.scene.completed", { jobId: job.id, sceneId: scene.id, url: uploaded.url });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addJobError(job.id, `Scene "${scene.title}" failed: ${message}`);
        logger.error("growth_engine.visual_assets.scene.failed", { error: message, jobId: job.id, sceneId: scene.id });
      }
    }

    updateJobProgress(job.id, { status: generatedAssets.length && job.errors.length ? "partial_success" : generatedAssets.length ? "completed" : "failed" });
    addJobLog(job.id, `Visual generation finished with ${generatedAssets.length}/${pendingScenes.length} successful assets.`);

    await updateGrowthProjectGeneration({
      appendJob: toPersistedJob(job),
      imageAssets: generatedAssets,
      projectId: job.projectId,
      status: generatedAssets.length ? "images_ready" : undefined,
      userId: job.userId,
    });

    logger.info("growth_engine.visual_assets.completed", { jobId: job.id, projectId: job.projectId, successCount: generatedAssets.length, total: pendingScenes.length });
  } finally {
    await releaseGrowthProjectLock(job.projectId, job.id);
  }
}

async function runVideoAssetJob(job: GrowthGenerationJob) {
  const lockAcquired = await acquireGrowthProjectLock({
    jobId: job.id,
    kind: job.kind,
    projectId: job.projectId,
    ttlMs: PROJECT_LOCK_TTL_MS,
    userId: job.userId,
  });

  if (!lockAcquired) {
    throw apiErrors.conflict("This growth project is already processing.");
  }

  try {
    const project = await getGrowthProjectForUser(job.projectId, job.userId);
    const imageAssets = extractImageAssets(project);
    if (!imageAssets.length) throw apiErrors.badRequest("No image assets are available for video generation.");

    const existingSceneIds = new Set(project.videoAssets.map((asset) => stringValue(asset.sceneId)).filter(Boolean));
    const pendingAssets = imageAssets.filter((asset) => !existingSceneIds.has(asset.sceneId ?? asset.id));

    updateJobProgress(job.id, { total: pendingAssets.length });
    addJobLog(job.id, `Loaded ${imageAssets.length} image assets. ${pendingAssets.length} videos need rendering.`);
    logger.info("growth_engine.video_assets.started", { assetCount: pendingAssets.length, jobId: job.id, projectId: job.projectId });

    const generatedVideos: Record<string, unknown>[] = [];

    for (const [index, asset] of pendingAssets.entries()) {
      addJobLog(job.id, `Generating video ${index + 1}/${pendingAssets.length}: ${asset.sceneTitle ?? asset.id}`);
      logger.info("growth_engine.video_assets.asset.started", { assetId: asset.id, jobId: job.id, sceneId: asset.sceneId });

      try {
        const prompt = buildVideoPrompt(project, asset);
        const generated = await retryOperation({
          attempts: 2,
          delayMs: 1_500,
          label: `wan-video-${asset.id}`,
          task: () =>
            generateWanProductVideo({
              hfToken: env.HF_TOKEN ?? env.HUGGINGFACE_API_KEY,
              productImage: asset.url,
              prompt,
              timeoutMs: VIDEO_GENERATION_TIMEOUT_MS,
            }),
        });

        const uploaded = await withOperationTimeout(
          uploadRemoteImageToImageKit({
            alt: `${project.brandName} ${asset.sceneTitle ?? "growth video"}`,
            fileName: `growth-engine-${job.projectId}-${asset.sceneId ?? asset.id}.mp4`,
            folder: "/marketly-ai/growth-engine/videos",
            sourceUrl: generated.videoUrl,
          }),
          IMAGEKIT_REMOTE_UPLOAD_TIMEOUT_MS,
          "Growth Engine video upload timed out.",
        );

        generatedVideos.push({
          ...uploaded,
          imageAssetId: asset.id,
          jobId: job.id,
          prompt,
          provider: "huggingface",
          sceneId: asset.sceneId ?? asset.id,
          sceneTitle: asset.sceneTitle,
          seed: generated.seed,
          sourceSpace: WAN_I2V_VIDEO_SPACE,
          status: "completed",
        });

        updateJobProgress(job.id, { completed: generatedVideos.length });
        addJobLog(job.id, `Video completed for asset: ${asset.sceneTitle ?? asset.id}`);
        logger.info("growth_engine.video_assets.asset.completed", { jobId: job.id, sceneId: asset.sceneId, url: uploaded.url });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addJobError(job.id, `Video "${asset.sceneTitle ?? asset.id}" failed: ${message}`);
        logger.error("growth_engine.video_assets.asset.failed", { assetId: asset.id, error: message, jobId: job.id });
      }
    }

    updateJobProgress(job.id, { status: generatedVideos.length && job.errors.length ? "partial_success" : generatedVideos.length ? "completed" : "failed" });
    addJobLog(job.id, `Video generation finished with ${generatedVideos.length}/${pendingAssets.length} successful videos.`);

    await updateGrowthProjectGeneration({
      appendJob: toPersistedJob(job),
      projectId: job.projectId,
      status: generatedVideos.length ? "videos_ready" : undefined,
      userId: job.userId,
      videoAssets: generatedVideos,
    });

    logger.info("growth_engine.video_assets.completed", { jobId: job.id, projectId: job.projectId, successCount: generatedVideos.length, total: pendingAssets.length });
  } finally {
    await releaseGrowthProjectLock(job.projectId, job.id);
  }
}

function extractStoryboardScenes(project: GrowthProjectRecord): StoryboardScene[] {
  return project.storyboards.flatMap((storyboard, storyboardIndex) => {
    const nestedScenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : Array.isArray(storyboard.frames) ? storyboard.frames : null;
    if (nestedScenes) return nestedScenes.map((scene, sceneIndex) => sceneFromRecord(scene, `${storyboardIndex + 1}-${sceneIndex + 1}`)).filter((s): s is StoryboardScene => s !== null);

    const scene = sceneFromRecord(storyboard, `${storyboardIndex + 1}`);
    return scene ? [scene] : [];
  });
}

function sceneFromRecord(value: unknown, fallbackId: string): StoryboardScene | null {
  if (!isRecord(value)) return null;

  const title = stringValue(value.sceneTitle) || stringValue(value.title) || stringValue(value.name) || `Scene ${fallbackId}`;
  const script = stringValue(value.script) || stringValue(value.description) || stringValue(value.voiceover);
  const imagePrompt = stringValue(value.imagePrompt) || stringValue(value.prompt) || stringValue(value.visualDirection);

  return {
    id: stringValue(value.id) || stringValue(value.sceneId) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || fallbackId,
    imagePrompt,
    script,
    title,
  };
}

function extractImageAssets(project: GrowthProjectRecord): ImageAsset[] {
  return project.imageAssets
    .map((asset, index): ImageAsset | null => {
      const url = stringValue(asset.url);
      if (!url || stringValue(asset.status) === "failed") return null;

      return {
        id: stringValue(asset.fileId) || stringValue(asset.storageKey) || `asset-${index + 1}`,
        prompt: stringValue(asset.prompt),
        sceneId: stringValue(asset.sceneId),
        sceneTitle: stringValue(asset.sceneTitle),
        url,
      };
    })
    .filter((asset): asset is ImageAsset => asset !== null);
}

function buildImagePrompt(project: GrowthProjectRecord, scene: StoryboardScene) {
  return [
    `Create a polished product marketing visual for ${project.brandName}.`,
    `Industry: ${project.industry}.`,
    `Target audience: ${project.audience}.`,
    `Marketing goal: ${project.goal}.`,
    `Brand brief: ${project.brief}.`,
    `Storyboard scene: ${scene.title}.`,
    scene.script ? `Scene script: ${scene.script}.` : "",
    scene.imagePrompt ? `Visual direction: ${scene.imagePrompt}.` : "",
    "Preserve the uploaded product identity, packaging, colors, proportions, and branding.",
    "Cyberpunk green terminal aesthetic, premium dark background, clean commercial lighting, no watermark, no text overlay.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildVideoPrompt(project: GrowthProjectRecord, asset: ImageAsset) {
  return [
    `Animate this marketing visual for ${project.brandName}.`,
    `Audience: ${project.audience}.`,
    `Goal: ${project.goal}.`,
    asset.sceneTitle ? `Scene: ${asset.sceneTitle}.` : "",
    asset.prompt ? `Original visual prompt: ${asset.prompt}.` : "",
    "Use smooth commercial product motion, subtle parallax, premium lighting, and keep the product accurate.",
    "No extra products, no warped logo, no captions, no watermark, no generic unrelated camera move.",
  ]
    .filter(Boolean)
    .join("\n");
}

function toPersistedJob(job: GrowthGenerationJob) {
  return {
    completed: job.completed,
    createdAt: job.createdAt,
    errors: job.errors,
    finishedAt: new Date().toISOString(),
    id: job.id,
    kind: job.kind,
    logs: job.logs,
    status: job.status,
    total: job.total,
    updatedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
