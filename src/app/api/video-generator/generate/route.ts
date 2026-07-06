import { parseWithSchema } from "@/server/http/validation";
import { getVideoAuth } from "@/server/video-generator/auth";
import { videoGenerationSchema } from "@/server/video-generator/schemas";
import { generateProductVideo } from "@/server/video-generator/service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const runtime = "nodejs";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const videoAuth = await getVideoAuth(request);
    const formData = await request.formData();
    const body = parseWithSchema(videoGenerationSchema, {
      productImage: formData.get("productImage"),
      prompt: formData.get("prompt"),
      selectedStyle: formData.get("selectedStyle"),
    });

    return generateProductVideo(body, videoAuth);
  },
  { feature: "video_generation", rateLimit: { keyPrefix: "video.generate", limit: 8, windowMs: 60 * 1000 } },
);
