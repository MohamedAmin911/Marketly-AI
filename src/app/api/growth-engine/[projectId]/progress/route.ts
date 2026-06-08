import { getGrowthGenerationProgress } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

export const GET = createApiHandler<unknown, { projectId: string }>(
  async ({ params, request }) => {
    const auth = await requireAuth(request);
    const kind = request.nextUrl.searchParams.get("kind") ?? undefined;
    const jobId = request.nextUrl.searchParams.get("jobId") ?? undefined;

    return getGrowthGenerationProgress({
      auth,
      jobId,
      kind: kind === "visual_assets" || kind === "video_assets" ? kind : undefined,
      projectId: params?.projectId ?? "",
    });
  },
  { rateLimit: { keyPrefix: "growth-engine.progress", limit: 120, windowMs: 60 * 1000 } },
);
