import { apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import { callGrowthEngineWebhook } from "@/server/growth-engine/n8n-client";
import { createGrowthProjectRecord } from "@/server/growth-engine/repository";
import { retryOperation, withOperationTimeout } from "@/server/growth-engine/retry";
import type { GrowthEngineRequestInput } from "@/server/growth-engine/schemas";
import type { GrowthEngineApiResponse, GrowthProjectStatus, N8nGrowthEngineResponse } from "@/server/growth-engine/types";
import type { AuthContext } from "@/server/security/auth-guard";
import { validateUploadFile } from "@/server/security/uploads";
import { uploadFileToImageKit, type UploadedImageKitAsset } from "@/server/services/imagekit-service";

const IMAGEKIT_UPLOAD_TIMEOUT_MS = 45_000;

export async function buildGrowthEngineProject(input: GrowthEngineRequestInput, auth: AuthContext): Promise<GrowthEngineApiResponse> {
  const requestId = crypto.randomUUID();

  logger.info("growth_engine.workflow.started", {
    brandName: input.brandName,
    requestId,
    userId: auth.user.sub,
  });

  let productImage: UploadedImageKitAsset | null = null;

  try {
    await validateUploadFile(input.productImage);
    productImage = await uploadProductImage(input);

    const n8nResult = await callGrowthEngineWebhook({
      input,
      productImage,
      requestId,
      userId: auth.user.sub,
    });

    const status = deriveProjectStatus(n8nResult);
    const project = await createGrowthProjectRecord({
      input,
      n8nResult,
      productImage,
      status,
      userId: auth.user.sub,
    });

    logger.info("growth_engine.workflow.completed", {
      projectId: project.id,
      requestId,
      status,
      userId: auth.user.sub,
    });

    return { project };
  } catch (error) {
    logger.error("growth_engine.workflow.failed", {
      brandName: input.brandName,
      error: error instanceof Error ? error.message : String(error),
      requestId,
      userId: auth.user.sub,
    });

    const project = await createGrowthProjectRecord({
      input,
      productImage,
      status: "draft",
      userId: auth.user.sub,
    });

    logger.info("growth_engine.workflow.draft_saved", {
      projectId: project.id,
      requestId,
      userId: auth.user.sub,
    });

    return { project };
  }
}

async function uploadProductImage(input: GrowthEngineRequestInput) {
  return retryOperation({
    attempts: 2,
    delayMs: 500,
    label: "growth-engine-imagekit-upload",
    task: () =>
      withOperationTimeout(
        uploadFileToImageKit({
          alt: `${input.brandName} product image`,
          file: input.productImage,
          fileName: `growth-engine-product-${crypto.randomUUID()}-${input.productImage.name}`,
          folder: "/marketly-ai/growth-engine/products",
        }),
        IMAGEKIT_UPLOAD_TIMEOUT_MS,
        "Growth Engine image upload timed out.",
      ),
  });
}

function deriveProjectStatus(result: N8nGrowthEngineResponse): GrowthProjectStatus {
  if (result.status) return result.status;
  if (result.videoAssets.length > 0) return "videos_ready";
  if (result.imageAssets.length > 0) return "images_ready";
  if (result.storyboards.length > 0) return "storyboards_ready";
  if (result.campaigns.length > 0) return "campaigns_ready";

  const hasStrategy =
    Boolean(result.strategy) ||
    result.personas.length > 0 ||
    result.competitors.length > 0 ||
    result.marketingAngles.length > 0;

  if (hasStrategy) return "strategy_ready";
  throw apiErrors.aiProvider("Growth Engine webhook returned no usable workflow output.");
}
