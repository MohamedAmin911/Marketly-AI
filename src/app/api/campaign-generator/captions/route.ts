import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignTextMutationSchema } from "@/server/campaign-generator/schemas";
import { regenerateCampaignText } from "@/server/campaign-generator/service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignTextMutationSchema);

    return regenerateCampaignText({ ...body, mode: "captions" }, auth);
  },
  { feature: "campaign_generator", rateLimit: { keyPrefix: "campaign.captions", limit: 30, windowMs: 60 * 1000 } },
);
