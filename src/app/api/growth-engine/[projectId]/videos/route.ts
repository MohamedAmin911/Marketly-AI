import { enqueueVideoAssetGeneration } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler<unknown, { projectId: string }>(
  async ({ params, request }) => {
    const auth = await requireAuth(request);
    return enqueueVideoAssetGeneration(params?.projectId ?? "", auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.videos", limit: 3, windowMs: 60 * 1000 } },
);
