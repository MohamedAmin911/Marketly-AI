import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { generationIdSchema } from "@/server/creator-studio/schemas";
import { retryCreatorGeneration } from "@/server/creator-studio/service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, generationIdSchema);

    return retryCreatorGeneration(body.generationId, auth);
  },
  { rateLimit: { keyPrefix: "creator.retry", limit: 12, windowMs: 60 * 1000 } },
);
