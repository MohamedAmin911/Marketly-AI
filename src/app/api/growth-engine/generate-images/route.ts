import { enqueueVisualAssetGeneration, growthGenerationTriggerSchema } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, growthGenerationTriggerSchema);

    return enqueueVisualAssetGeneration(body.projectId, auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.generate-images", limit: 4, windowMs: 60 * 1000 } },
);
