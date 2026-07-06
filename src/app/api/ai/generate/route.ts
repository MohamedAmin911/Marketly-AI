import { apiErrors } from "@/server/errors/api-error";
import { withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireIdempotencyKey, runIdempotently } from "@/server/security/idempotency";
import { aiGenerationRequestSchema } from "@/server/schemas/ai";
import { generateAiAsset } from "@/server/services/ai-generation-service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const idempotencyKey = requireIdempotencyKey(request.headers.get("idempotency-key"));
    const body = await parseJsonBody(request, aiGenerationRequestSchema);

    return runIdempotently(`${auth.user.tenantId}:ai:${idempotencyKey}`, async () => {
      try {
        return await withTimeout(generateAiAsset(body, auth), 20_000, "AI generation timed out.");
      } catch (error) {
        if (error instanceof Error && error.message.includes("timed out")) throw apiErrors.timeout("AI generation timed out.");
        throw error;
      }
    });
  },
  {
    feature: (body) => body.mode === "image" ? "image_generation" : body.mode === "video" ? "video_generation" : "text_generation",
    rateLimit: { keyPrefix: "ai.generate", limit: 20, windowMs: 60 * 1000 },
  },
);
