import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { analyticsQuerySchema } from "@/server/schemas/analytics";
import { getAnalyticsOverview } from "@/server/services/analytics-service";

export const GET = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const query = parseQueryParams(request, analyticsQuerySchema);

    return getAnalyticsOverview(query, auth);
  },
  { rateLimit: { keyPrefix: "analytics.overview", limit: 120, windowMs: 60 * 1000 } },
);
