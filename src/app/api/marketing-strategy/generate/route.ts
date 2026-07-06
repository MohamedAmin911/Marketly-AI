import { withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { marketingStrategyRequestSchema } from "@/server/schemas/marketing-intelligence";
import { generateMarketingStrategy } from "@/server/marketing-intelligence/strategy-service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import { extractPrompt } from "@/server/moderation/moderation-service";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, marketingStrategyRequestSchema);

    return withTimeout(generateMarketingStrategy(body), 12_000, "Marketing strategy generation timed out.");
  },
  {
    feature: "marketing_strategy",
    getPrompt: (body) => {
      const brand = isRecord(body.brand) ? body.brand : {};
      return [
        extractPrompt(body),
        brand.name,
        brand.industry,
        brand.audience,
        brand.offer,
        brand.tone,
        Array.isArray(brand.goals) ? brand.goals.join(" ") : "",
        Array.isArray(body.campaigns) ? body.campaigns.join(" ") : "",
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join(" ");
    },
    rateLimit: { keyPrefix: "marketing.strategy.generate", limit: 30, windowMs: 60 * 1000 },
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
