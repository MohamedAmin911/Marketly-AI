import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { assistantResponseSchema } from "@/server/ai/workflows/schemas";
import { requireAuth } from "@/server/security/auth-guard";
import { assistantChatRequestSchema } from "@/server/schemas/ai";
import { generateAiAsset } from "@/server/services/ai-generation-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, assistantChatRequestSchema);
    const result = await withTimeout(
      generateAiAsset(
        {
          brandId: body.brandId,
          context: {
            analytics: body.analytics,
            brand: body.brand,
            memory: body.memory,
          },
          mode: "strategy",
          model: body.model,
          prompt: body.message,
          provider: body.provider,
          temperature: body.temperature,
          workflow: "ai-assistant",
        },
        auth,
      ),
      12_000,
      "AI assistant response timed out.",
    );
    const output = assistantResponseSchema.parse(result.output);

    return {
      actions: output.actions,
      answer: output.answer,
      cards: [],
      followUps: output.followUps,
      recommendations: output.actions.map((action, index) => ({
        action,
        confidence: index === 0 ? 0.82 : 0.68,
        evidence: output.answer,
        priority: index === 0 ? "high" : "medium",
        rationale: "Generated from the shared assistant workflow and current workspace context.",
        title: index === 0 ? "Recommended next step" : `Next step ${index + 1}`,
      })),
    };
  },
  { rateLimit: { keyPrefix: "ai.assistant.chat", limit: 60, windowMs: 60 * 1000 } },
);
