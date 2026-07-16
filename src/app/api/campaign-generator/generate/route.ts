import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignGenerationSchema } from "@/server/campaign-generator/schemas";
import { generateCampaign } from "@/server/campaign-generator/service";
import { moderateAIRequest } from "@/server/moderation/with-moderation";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignGenerationSchema);
    await moderateAIRequest({ auth, feature: "Campaign Generator", prompts: [body.prompt, body.productTitle, body.targetAudience] });

    try {
      return await withTimeout(generateCampaign(body, auth), 60_000, "Campaign generation timed out.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) throw apiErrors.timeout("Campaign generation timed out.");
      throw error;
    }
  },
  { rateLimit: { keyPrefix: "campaign.generate", limit: 12, windowMs: 60 * 1000 } },
);
