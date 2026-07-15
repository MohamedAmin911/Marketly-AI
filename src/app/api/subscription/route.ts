import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { SubscriptionService, SUBSCRIPTION_PLANS } from "@/server/services/billing/subscription.service";
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
  
  // Sync features with the current plan to ensure new features (like viralEngine) are granted to existing users
  const planConfig = SUBSCRIPTION_PLANS[user.subscription.plan as keyof typeof SUBSCRIPTION_PLANS];
  if (planConfig && JSON.stringify(user.features) !== JSON.stringify(planConfig.features)) {
    user.features = planConfig.features;
    needsSave = true;
  }

  if (needsSave) {
    await user.save();
  }
  
  return { subscription: user.subscription, features: user.features, usage: user.usage };
});
