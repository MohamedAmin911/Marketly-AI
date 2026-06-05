import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { analyticsQuerySchema } from "@/server/schemas/analytics";
import { getAnalyticsReport } from "@/server/services/analytics-service";

export const GET = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const query = parseQueryParams(request, analyticsQuerySchema);

    return getAnalyticsReport(query, auth);
  },
  { rateLimit: { keyPrefix: "analytics.reports", limit: 90, windowMs: 60 * 1000 } },
);
