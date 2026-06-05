import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { marketingStrategyRequestSchema } from "@/server/schemas/marketing-intelligence";
import { generateMarketingStrategy } from "@/server/marketing-intelligence/strategy-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, marketingStrategyRequestSchema);

    return withTimeout(generateMarketingStrategy(body), 12_000, "Marketing strategy generation timed out.");
  },
  { rateLimit: { keyPrefix: "marketing.strategy.generate", limit: 30, windowMs: 60 * 1000 } },
);
