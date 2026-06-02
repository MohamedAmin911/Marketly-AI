import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignCreativesSchema } from "@/server/campaign-generator/schemas";
import { regenerateCampaignCreatives } from "@/server/campaign-generator/service";

export const POST = createApiHandler(
  async ({ request }) => {
    await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignCreativesSchema);

    return regenerateCampaignCreatives(body);
  },
  { rateLimit: { keyPrefix: "campaign.creatives", limit: 20, windowMs: 60 * 1000 } },
);
