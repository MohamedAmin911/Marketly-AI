import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { campaignUploadSchema } from "@/server/campaign-generator/schemas";
import { uploadCampaignProduct } from "@/server/campaign-generator/service";

export const POST = createApiHandler(
  async ({ request }) => {
    await getCampaignAuth(request);
    const body = await parseFormData(request, campaignUploadSchema);

    return uploadCampaignProduct(body);
  },
  { rateLimit: { keyPrefix: "campaign.upload", limit: 30, windowMs: 60 * 1000 } },
);
