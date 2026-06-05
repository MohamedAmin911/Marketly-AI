import { Types } from "mongoose";
import type { NextRequest } from "next/server";

import { connectToDatabase, GeneratedContentModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { requireAuth } from "@/server/security/auth-guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ generationId: string }> }) {
  try {
    const auth = await requireAuth(request);
    const { generationId } = await params;

    if (!Types.ObjectId.isValid(auth.user.sub) || !Types.ObjectId.isValid(generationId)) {
      throw apiErrors.notFound("Generation was not found.");
    }

    await connectToDatabase();

    const imageIndex = Number(request.nextUrl.searchParams.get("imageIndex") ?? 0);
    if (!Number.isInteger(imageIndex) || imageIndex < 0) {
      throw apiErrors.badRequest("Invalid image index.");
    }

    const generation = await GeneratedContentModel.findOne({
      _id: new Types.ObjectId(generationId),
      userId: new Types.ObjectId(auth.user.sub),
    });

    const selectedImage = generation?.generatedImages?.[imageIndex] as { mimeType?: string; url?: string } | undefined;
    if (!generation || !selectedImage?.url) {
      throw apiErrors.notFound("Generation image was not found.");
    }

    const imageResponse = await fetch(selectedImage.url);
    if (!imageResponse.ok) {
      throw apiErrors.notFound("Generation image could not be downloaded.");
    }

    generation.downloaded = true;
    await generation.save();

    const contentType = imageResponse.headers.get("content-type") ?? selectedImage.mimeType ?? "image/png";
    const extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const filename = `marketly-generation-${generationId}-${imageIndex + 1}.${extension}`;

    return new Response(imageResponse.body, {
      headers: {
        "Cache-Control": "private, max-age=0, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const apiError = error instanceof Error && "status" in error ? (error as { message: string; status: number }) : null;

    return Response.json(
      {
        success: false,
        error: apiError?.message ?? "Download failed",
      },
      { status: apiError?.status ?? 500 },
    );
  }
}
