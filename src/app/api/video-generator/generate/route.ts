import { createApiHandler } from "@/server/http/route-handler";
import { getVideoAuth } from "@/server/video-generator/auth";
import { videoGenerationSchema } from "@/server/video-generator/schemas";
import { generateProductVideo } from "@/server/video-generator/service";
import { checkPromptSafety } from "@/server/security/profanity-filter";

export const runtime = "nodejs";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getVideoAuth(request);
    const formData = await request.formData();
    const body = videoGenerationSchema.parse({
      productImage: formData.get("productImage"),
      prompt: formData.get("prompt"),
      selectedStyle: formData.get("selectedStyle"),
    });

    if (body.prompt) {
      checkPromptSafety(body.prompt, auth);
    }

    return generateProductVideo(body, auth);
  },
  { rateLimit: { keyPrefix: "video.generate", limit: 8, windowMs: 60 * 1000 } },
);
