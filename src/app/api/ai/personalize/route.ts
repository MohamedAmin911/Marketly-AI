import { parseJsonBody } from "@/server/http/validation";
import { personalizeWithMemory } from "@/server/ai/memory/personalization-engine";
import { personalizationRequestSchema } from "@/server/schemas/ai-memory";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const body = await parseJsonBody(request, personalizationRequestSchema);

    return personalizeWithMemory({
      ...body,
      userId: auth.user.sub,
    });
  },
  { feature: "text_generation", rateLimit: { keyPrefix: "ai.personalize", limit: 60, windowMs: 60 * 1000 } },
);
