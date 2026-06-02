import { z } from "zod";

import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { recordCampaignAnalytics } from "@/server/campaign-generator/service";

const campaignAnalyticsSchema = z.object({
  campaignId: z.string().min(1),
  event: z.enum(["campaign.created", "creative.downloaded", "copy.regenerated", "creative.regenerated"]).default("campaign.created"),
});

export const POST = createApiHandler(
  async ({ request }) => {
    await getCampaignAuth(request);
    const body = await parseJsonBody(request, campaignAnalyticsSchema);

    return recordCampaignAnalytics(body.campaignId, body.event);
  },
  { rateLimit: { keyPrefix: "campaign.analytics", limit: 120, windowMs: 60 * 1000 } },
);
