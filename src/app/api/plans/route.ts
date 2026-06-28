import { createApiHandler } from "@/server/http/route-handler";
import { SUBSCRIPTION_PLANS } from "@/server/services/billing/subscription.service";

export const GET = createApiHandler(async () => {
  return { plans: SUBSCRIPTION_PLANS };
});
