import { apiErrors } from "@/server/errors/api-error";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import { generateProductAdvertisement } from "@/services/advertisement-generation-service";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const formData = await request.formData();

    const productImage = formData.get("productImage") as File;
    const referenceImage = formData.get("referenceImage") as File;
    const prompt = formData.get("prompt") as string;
    const aspectRatio = String(formData.get("aspectRatio") ?? "16:9");

    if (!productImage || !referenceImage || !prompt) {
      throw apiErrors.badRequest("Product image, reference image, and prompt are required.");
    }

    const generation = await generateProductAdvertisement({
      aspectRatio,
      productImage,
      prompt,
      referenceImage,
      userId: auth.user.sub,
    });

    return {
      ...generation,
      success: true,
    };
  },
  { feature: "advertisement", rateLimit: { keyPrefix: "generate-ad", limit: 12, windowMs: 60 * 1000 } },
);
