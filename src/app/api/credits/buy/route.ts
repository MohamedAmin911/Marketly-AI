import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { CreditsService } from "@/server/services/billing/credits.service";
import { ApiError } from "@/server/errors/api-error";

export const POST = createApiHandler(async ({ request }) => {
  const user = await requireUser(request);
  
  const body = await request.json();
  const amount = body.amount;
  
  if (!amount || typeof amount !== "number") {
    throw new ApiError(400, "Valid amount is required");
  }

  // Simulate immediate credit pack purchase
  await CreditsService.addPurchasedCredits(user._id as string, amount, `Purchased ${amount} credits pack`);
  
  return { success: true, message: `Successfully purchased ${amount} credits` };
});
