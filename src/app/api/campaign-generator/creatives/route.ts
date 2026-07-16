import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignCreativesSchema } from "@/server/campaign-generator/schemas";
import { regenerateCampaignCreatives } from "@/server/campaign-generator/service";
import { moderateAIRequest } from "@/server/moderation/with-moderation";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignCreativesSchema);
    await moderateAIRequest({
      auth,
      feature: "Campaign Generator",
      prompts: [
        body.campaign.productTitle,
        body.campaign.style,
        ...body.campaign.angles.flatMap((angle) => [angle.prompt, angle.caption, angle.hook, angle.title]),
      ],
    });

    return regenerateCampaignCreatives(body);
  },
  { rateLimit: { keyPrefix: "campaign.creatives", limit: 20, windowMs: 60 * 1000 } },
);
