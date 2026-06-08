import type { NextRequest } from "next/server";

import { ApiError } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import { requireAuth } from "@/server/security/auth-guard";
import { generateProductAdvertisement } from "@/services/advertisement-generation-service";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const formData = await req.formData();

    const productImage = formData.get("productImage") as File;
    const referenceImage = formData.get("referenceImage") as File;
    const prompt = formData.get("prompt") as string;
    const aspectRatio = String(formData.get("aspectRatio") ?? "16:9");

    if (!productImage || !referenceImage || !prompt) {
      return Response.json(
        {
          success: false,
          error: "Product image, reference image, and prompt are required",
        },
        { status: 400 },
      );
    }

    const generation = await generateProductAdvertisement({
      aspectRatio,
      productImage,
      prompt,
      referenceImage,
      userId: auth.user.sub,
    });

    return Response.json({
      ...generation,
      success: true,
    });
  } catch (error) {
    logger.error("Product advertisement generation failed.", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    const isTimeout = error instanceof Error && error.message === "Generation timed out";
    const status = error instanceof ApiError ? error.status : isTimeout ? 504 : 500;

    return Response.json(
      {
        success: false,
        error: error instanceof ApiError ? error.message : isTimeout ? "Generation timed out. The HuggingFace Space may be busy or cold-starting." : "Generation failed",
      },
      { status },
    );
  }
}
