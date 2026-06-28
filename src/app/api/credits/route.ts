import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";

export const GET = createApiHandler(async ({ request }) => {
  const user = await requireUser(request);
  
  return { 
    monthlyCreditsRemaining: user.subscription.monthlyCreditsRemaining,
    purchasedCredits: user.subscription.purchasedCredits,
    totalAvailable: user.subscription.monthlyCreditsRemaining + user.subscription.purchasedCredits,
  };
});
