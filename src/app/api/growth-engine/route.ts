import { buildGrowthEngineProject, growthEngineRequestSchema } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { requireFeature } from "@/server/http/subscription-middleware";

export const POST = createApiHandler(
  async ({ request }) => {
    const user = await requireFeature(request, "growthEngine");
    const body = await parseFormData(request, growthEngineRequestSchema);

    // Mock an auth context since buildGrowthEngineProject expects it
    const auth = { user: { sub: String(user._id), role: user.role } as any };

    return buildGrowthEngineProject(body, auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.generate", limit: 6, windowMs: 60 * 1000 } },
);
