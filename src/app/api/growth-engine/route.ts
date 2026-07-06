import { buildGrowthEngineProject, growthEngineRequestSchema } from "@/server/growth-engine";
import { parseFormData } from "@/server/http/validation";
import { requireFeature } from "@/server/http/subscription-middleware";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import type { AuthContext } from "@/server/security/auth-guard";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const user = await requireFeature(request, "growthEngine");
    const body = await parseFormData(request, growthEngineRequestSchema);

    const auth: AuthContext = {
      user: {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        jti: "growth-engine-request",
        kind: "access",
        role: user.role,
        sub: String(user._id),
        tenantId: String(user._id),
      },
    };

    return buildGrowthEngineProject(body, auth);
  },
  { feature: "growth_engine", rateLimit: { keyPrefix: "growth-engine.generate", limit: 6, windowMs: 60 * 1000 } },
);
