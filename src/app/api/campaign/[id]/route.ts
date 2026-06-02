import { createApiHandler } from "@/server/http/route-handler";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { deleteCampaignForUser, getCampaignForUser } from "@/server/campaign-generator/generateCampaign";

type CampaignParams = {
  id: string;
};

export const GET = createApiHandler<unknown, CampaignParams>(async ({ params, request }) => {
  const auth = await getCampaignAuth(request);
  return getCampaignForUser(params?.id ?? "", auth.user.sub);
});

export const DELETE = createApiHandler<unknown, CampaignParams>(async ({ params, request }) => {
  const auth = await getCampaignAuth(request);
  return deleteCampaignForUser(params?.id ?? "", auth.user.sub);
});
