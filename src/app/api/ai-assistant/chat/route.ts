import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { assistantChatRequestSchema, assistantChatResponseSchema } from "@/server/schemas/ai";
import { generateAIResponse } from "@/server/services/ai-generation-service";
import { moderateAIRequest } from "@/server/moderation/with-moderation";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, assistantChatRequestSchema);
    await moderateAIRequest({ auth, feature: "AI Assistant", prompts: body.message });
    const response = await withTimeout(generateAIResponse(body, auth), 60_000, "AI assistant response timed out.");

    return assistantChatResponseSchema.parse(response);
  },
  { rateLimit: { keyPrefix: "ai.assistant.chat", limit: 60, windowMs: 60 * 1000 } },
);

