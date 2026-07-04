import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { SubscriptionService } from "@/server/services/billing/subscription.service";
import { apiErrors } from "@/server/errors/api-error";

import { UserModel } from "@/server/database/models/user.model";

export const GET = createApiHandler(async ({ request }) => {
  const reqUser = await requireUser(request);
  
  // Lazily evaluate monthly reset
  await SubscriptionService.evaluateMonthlyReset(String(reqUser._id));
  
  // Fetch hydrated user to ensure Mongoose defaults (like subscription) are applied
  const user = await UserModel.findById(reqUser._id);
  if (!user) throw apiErrors.notFound("User not found");

  // Ensure old users get the default subscription structure saved if missing
  let needsSave = false;
  if (!user.subscription || !user.subscription.plan) {
    user.subscription = { 
      plan: "free", 
      status: "free", 
      startedAt: new Date(), 
      monthlyCredits: 50, 
      monthlyCreditsRemaining: 50, 
      purchasedCredits: 0 
    } as any;
    needsSave = true;
  }
  
  if (needsSave) {
    await user.save();
  }
  
  return { subscription: user.subscription, features: user.features, usage: user.usage };
});
