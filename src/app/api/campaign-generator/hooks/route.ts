import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignTextMutationSchema } from "@/server/campaign-generator/schemas";
import { regenerateCampaignText } from "@/server/campaign-generator/service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignTextMutationSchema);

    return regenerateCampaignText({ ...body, mode: "hooks" }, auth);
  },
  { rateLimit: { keyPrefix: "campaign.hooks", limit: 30, windowMs: 60 * 1000 } },
);
