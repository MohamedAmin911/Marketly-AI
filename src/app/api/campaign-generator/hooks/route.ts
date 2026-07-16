import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignTextMutationSchema } from "@/server/campaign-generator/schemas";
import { regenerateCampaignText } from "@/server/campaign-generator/service";
import { moderateAIRequest } from "@/server/moderation/with-moderation";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignTextMutationSchema);
    await moderateAIRequest({ auth, feature: "Campaign Generator", prompts: [body.campaign.prompt, body.campaign.productTitle, body.campaign.targetAudience] });

    return regenerateCampaignText({ ...body, mode: "hooks" }, auth);
  },
  { rateLimit: { keyPrefix: "campaign.hooks", limit: 30, windowMs: 60 * 1000 } },
);
