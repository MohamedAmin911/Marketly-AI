import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { generateAnalyticsIntelligence } from "@/server/marketing-intelligence/strategy-service";
import { moderateAIRequest } from "@/server/moderation/with-moderation";
import { requireAuth } from "@/server/security/auth-guard";
import { analyticsInsightsRequestSchema } from "@/server/schemas/marketing-intelligence";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, analyticsInsightsRequestSchema);
    await moderateAIRequest({
      auth,
      feature: "Marketing Strategy",
      prompts: [body.brand.name, body.brand.audience, body.brand.industry, body.brand.offer, body.brand.tone],
    });

    return withTimeout(generateAnalyticsIntelligence(body), 12_000, "Analytics intelligence generation timed out.");
  },
  { rateLimit: { keyPrefix: "analytics.insights", limit: 60, windowMs: 60 * 1000 } },
);
