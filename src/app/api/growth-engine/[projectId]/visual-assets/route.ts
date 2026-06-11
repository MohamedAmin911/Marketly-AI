import { enqueueVisualAssetGeneration } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler<unknown, { projectId: string }>(
  async ({ params, request }) => {
    const auth = await requireAuth(request);
    return enqueueVisualAssetGeneration(params?.projectId ?? "", auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.visual-assets", limit: 4, windowMs: 60 * 1000 } },
);
