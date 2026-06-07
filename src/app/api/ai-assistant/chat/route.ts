import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { generateAssistantReply } from "@/server/marketing-intelligence/strategy-service";
import { assistantChatRequestSchema } from "@/server/schemas/marketing-intelligence";

export const POST = createApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, assistantChatRequestSchema);

    return withTimeout(generateAssistantReply(body), 12_000, "AI assistant response timed out.");
  },
  { rateLimit: { keyPrefix: "ai.assistant.chat", limit: 60, windowMs: 60 * 1000 } },
);
