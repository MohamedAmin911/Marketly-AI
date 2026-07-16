import type { NextRequest } from "next/server";

import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { validateUploadFile } from "@/server/security/uploads";
import { moderateAIRequest } from "@/server/moderation/with-moderation";
import { generateCinematicStoryboard } from "@/lib/services/storyboard-generator";

export const POST = createApiHandler(
  async ({ request }: { request: NextRequest }) => {
    const auth = await requireAuth(request);
    const formData = await request.formData();
    const productImage = formData.get("productImage");
    const campaignPrompt = formData.get("campaignPrompt");

    if (!(productImage instanceof File)) {
      throw apiErrors.badRequest("Product image is required.");
    }

    if (typeof campaignPrompt !== "string" || campaignPrompt.trim().length < 12) {
      throw apiErrors.badRequest("Campaign prompt must be at least 12 characters.");
    }

    await moderateAIRequest({ auth, feature: "Storyboard Generator", prompts: campaignPrompt });

    await validateUploadFile(productImage);

    return withTimeout(
      generateCinematicStoryboard({
        campaignPrompt: campaignPrompt.trim(),
        productImage,
        userId: auth.user.sub,
      }),
      780_000,
      "Storyboard generation timed out.",
    );
  },
  { rateLimit: { keyPrefix: "storyboard.cinematic.generate", limit: 6, windowMs: 60 * 1000 } },
);
