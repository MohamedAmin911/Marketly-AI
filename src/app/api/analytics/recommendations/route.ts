import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { analyticsQuerySchema } from "@/server/schemas/analytics";
import { getAnalyticsRecommendations } from "@/server/services/analytics-service";

export const GET = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const query = parseQueryParams(request, analyticsQuerySchema);

    return getAnalyticsRecommendations(query, auth);
  },
  { rateLimit: { keyPrefix: "analytics.recommendations", limit: 120, windowMs: 60 * 1000 } },
);
