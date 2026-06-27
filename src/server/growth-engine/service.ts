import { apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import { createGrowthProjectViaN8n } from "@/server/growth-engine/n8n-client";
import { getGrowthProjectForUser, upsertGrowthProjectShell } from "@/server/growth-engine/repository";
import { retryOperation, withOperationTimeout } from "@/server/growth-engine/retry";
import type { GrowthEngineRequestInput } from "@/server/growth-engine/schemas";
import type { GrowthEngineApiResponse } from "@/server/growth-engine/types";
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
    if (input.productImage) {
      await validateUploadFile(input.productImage);
      productImage = await uploadProductImage(input);
    }

    // Create the initial draft shell so it exists in the database
    // This allows n8n to update it via findOneAndUpdate or fallback logic
    let project: Awaited<ReturnType<typeof getGrowthProjectForUser>> | null = await upsertGrowthProjectShell({
      input,
      productImage,
      projectId: requestId,
      status: "draft",
      userId: auth.user.sub,
    }) as Awaited<ReturnType<typeof getGrowthProjectForUser>> | null;

    const n8nResult = await createGrowthProjectViaN8n({
      input,
      requestId,
      userId: auth.user.sub,
    });

    try {
      project = await getGrowthProjectForUser(n8nResult.projectId, auth.user.sub);
    } catch {
      // project not found by id, will try fallback below
    }

    // Fallback: query by userId directly if projectId lookup failed
    if (!project) {
      try {
        project = await getGrowthProjectForUser("latest", auth.user.sub);
      } catch {
        // still not found, will return empty shell
      }
    }

    if (!project) {
      // Last resort: create a shell so the UI has something to show
      project = await upsertGrowthProjectShell({
        input,
        productImage,
        projectId: n8nResult.projectId || crypto.randomUUID(),
        status: "draft",
        userId: auth.user.sub,
      });
    }

    logger.info("growth_engine.workflow.completed", {
      projectId: project.id,
      requestId,
      status: project.status,
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

    const project = await upsertGrowthProjectShell({
      input,
      lastError: error instanceof Error ? error.message : String(error),
      productImage,
      projectId: requestId,
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
  const productImage = input.productImage;
  if (!productImage) throw apiErrors.badRequest("Product image is missing.");

  return retryOperation({
    attempts: 2,
    delayMs: 500,
    label: "growth-engine-imagekit-upload",
    task: () =>
      withOperationTimeout(
        uploadFileToImageKit({
          alt: `${input.brandName} product image`,
          file: productImage,
          fileName: `growth-engine-product-${crypto.randomUUID()}-${productImage.name}`,
          folder: "/marketly-ai/growth-engine/products",
        }),
        IMAGEKIT_UPLOAD_TIMEOUT_MS,
        "Growth Engine image upload timed out.",
      ),
  });
}


