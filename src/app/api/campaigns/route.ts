import { createApiHandler } from "@/server/http/route-handler";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { listCampaignsForUser } from "@/server/campaign-generator/generateCampaign";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await getCampaignAuth(request);
  return listCampaignsForUser(auth.user.sub);
});
