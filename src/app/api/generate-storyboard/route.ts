import { apiErrors } from "@/server/errors/api-error";
import { withTimeout } from "@/server/http/route-handler";
import { validateUploadFile } from "@/server/security/uploads";
import { generateCinematicStoryboard } from "@/lib/services/storyboard-generator";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const formData = await request.formData();
    const productImage = formData.get("productImage");
    const campaignPrompt = formData.get("campaignPrompt");

    if (!(productImage instanceof File)) {
      throw apiErrors.badRequest("Product image is required.");
    }

    if (typeof campaignPrompt !== "string" || campaignPrompt.trim().length < 12) {
      throw apiErrors.badRequest("Campaign prompt must be at least 12 characters.");
    }

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
  { feature: "storyboard", rateLimit: { keyPrefix: "storyboard.cinematic.generate", limit: 6, windowMs: 60 * 1000 } },
);
