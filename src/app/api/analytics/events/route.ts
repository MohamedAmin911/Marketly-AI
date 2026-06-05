import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody, parseQueryParams } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { analyticsEventsRequestSchema, analyticsQuerySchema } from "@/server/schemas/analytics";
import { ingestAnalyticsEvents } from "@/server/services/analytics-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, analyticsEventsRequestSchema);

    return ingestAnalyticsEvents(body, auth);
  },
  { rateLimit: { keyPrefix: "analytics.events", limit: 120, windowMs: 60 * 1000 } },
);

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  const query = parseQueryParams(request, analyticsQuerySchema);

  return {
    events: [],
    query,
    tenantId: auth.user.tenantId,
  };
});
