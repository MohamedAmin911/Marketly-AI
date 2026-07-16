import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { personalizeWithMemory } from "@/server/ai/memory/personalization-engine";
import { moderateAIRequest } from "@/server/moderation/with-moderation";
import { requireAuth } from "@/server/security/auth-guard";
import { personalizationRequestSchema } from "@/server/schemas/ai-memory";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, personalizationRequestSchema);
    await moderateAIRequest({ auth, feature: "AI Personalization", prompts: [body.basePrompt, body.task] });

    return personalizeWithMemory({
      ...body,
      userId: auth.user.sub,
    });
  },
  { rateLimit: { keyPrefix: "ai.personalize", limit: 60, windowMs: 60 * 1000 } },
);
