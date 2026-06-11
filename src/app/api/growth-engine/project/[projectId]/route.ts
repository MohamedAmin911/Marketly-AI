import { getGrowthProjectForUser } from "@/server/growth-engine/repository";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

export const GET = createApiHandler<{ project: Awaited<ReturnType<typeof getGrowthProjectForUser>> }, { projectId: string }>(
  async ({ params, request }) => {
    const auth = await requireAuth(request);
    const project = await getGrowthProjectForUser(params?.projectId ?? "", auth.user.sub);

    return { project };
  },
  { rateLimit: { keyPrefix: "growth-engine.project", limit: 120, windowMs: 60 * 1000 } },
);
