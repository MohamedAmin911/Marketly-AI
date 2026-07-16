import { buildGrowthEngineProject, growthEngineRequestSchema } from "@/server/growth-engine";
import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { moderateAIRequest } from "@/server/moderation/with-moderation";
import { requireFeature } from "@/server/http/subscription-middleware";
import type { AuthContext } from "@/server/security/auth-guard";

export const POST = createApiHandler(
  async ({ request }) => {
    const user = await requireFeature(request, "growthEngine");
    const body = await parseFormData(request, growthEngineRequestSchema);

    // Mock an auth context since buildGrowthEngineProject expects it
    const auth: AuthContext = {
      user: {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        jti: "growth-engine-session",
        kind: "access",
        role: user.role,
        sub: String(user._id),
        tenantId: String(user._id),
      },
    };
    await moderateAIRequest({ auth, feature: "Growth Engine", prompts: [body.brief, body.brandName, body.audience, body.goal, body.industry] });

    return buildGrowthEngineProject(body, auth);
  },
  { rateLimit: { keyPrefix: "growth-engine.generate", limit: 6, windowMs: 60 * 1000 } },
);
