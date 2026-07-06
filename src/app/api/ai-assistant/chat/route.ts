import { withTimeout } from "@/server/http/route-handler";
import { parseJsonBody, parseWithSchema } from "@/server/http/validation";
import { assistantChatRequestSchema, assistantChatResponseSchema } from "@/server/schemas/ai";
import { generateAIResponse } from "@/server/services/ai-generation-service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const body = await parseJsonBody(request, assistantChatRequestSchema);
    const response = await withTimeout(generateAIResponse(body, auth), 60_000, "AI assistant response timed out.");

    return parseWithSchema(assistantChatResponseSchema, response);
  },
  { feature: "ai_assistant", rateLimit: { keyPrefix: "ai.assistant.chat", limit: 60, windowMs: 60 * 1000 } },
);
