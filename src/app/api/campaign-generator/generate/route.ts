import { apiErrors } from "@/server/errors/api-error";
import { withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignGenerationSchema } from "@/server/campaign-generator/schemas";
import { generateCampaign } from "@/server/campaign-generator/service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const campaignAuth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignGenerationSchema);

    try {
      return await withTimeout(generateCampaign(body, campaignAuth), 60_000, "Campaign generation timed out.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) throw apiErrors.timeout("Campaign generation timed out.");
      throw error;
    }
  },
  { feature: "campaign_generator", rateLimit: { keyPrefix: "campaign.generate", limit: 12, windowMs: 60 * 1000 } },
);