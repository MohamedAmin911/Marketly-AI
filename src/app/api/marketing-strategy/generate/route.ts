import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { moderateAIRequest } from "@/server/moderation/with-moderation";
import { requireAuth } from "@/server/security/auth-guard";
import { marketingStrategyRequestSchema } from "@/server/schemas/marketing-intelligence";
import { generateMarketingStrategy } from "@/server/marketing-intelligence/strategy-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, marketingStrategyRequestSchema);
    await moderateAIRequest({
      auth,
      feature: "Marketing Strategy",
      prompts: [body.brand.name, body.brand.audience, body.brand.industry, body.brand.offer, body.brand.tone, ...body.campaigns],
    });

    return withTimeout(generateMarketingStrategy(body), 12_000, "Marketing strategy generation timed out.");
  },
  { rateLimit: { keyPrefix: "marketing.strategy.generate", limit: 30, windowMs: 60 * 1000 } },
);
