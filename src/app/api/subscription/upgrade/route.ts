import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { SubscriptionService } from "@/server/services/billing/subscription.service";
import { ApiError } from "@/server/errors/api-error";

export const POST = createApiHandler(async ({ request }) => {
  const user = await requireUser(request);
  
  const body = await request.json();
  const newPlanId = body.planId;
  
  if (!newPlanId) {
    throw new ApiError(400, "planId is required");
  }

  // In a real app, this would redirect to a Stripe checkout or wait for a webhook.
  // For now, we simulate an immediate upgrade since BillingProvider is abstracted.
  await SubscriptionService.applyPlanChange(user._id as string, newPlanId);
  
  return { success: true, message: `Successfully changed plan to ${newPlanId}` };
});
