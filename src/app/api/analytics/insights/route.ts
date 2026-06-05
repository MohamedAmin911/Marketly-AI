import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { generateAnalyticsIntelligence } from "@/server/marketing-intelligence/strategy-service";
import { analyticsInsightsRequestSchema } from "@/server/schemas/marketing-intelligence";

export const POST = createApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, analyticsInsightsRequestSchema);

    return withTimeout(generateAnalyticsIntelligence(body), 12_000, "Analytics intelligence generation timed out.");
  },
  { rateLimit: { keyPrefix: "analytics.insights", limit: 60, windowMs: 60 * 1000 } },
);
