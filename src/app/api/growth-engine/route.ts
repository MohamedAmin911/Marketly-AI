import { buildGrowthEngineProject, growthEngineRequestSchema } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseFormData(request, growthEngineRequestSchema);

    return buildGrowthEngineProject(body, auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.generate", limit: 6, windowMs: 60 * 1000 } },
);
