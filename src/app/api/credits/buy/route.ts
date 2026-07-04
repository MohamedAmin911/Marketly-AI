import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { StripeService } from "@/server/services/billing/stripe.service";
import { apiErrors } from "@/server/errors/api-error";
import { headers } from "next/headers";

export const POST = createApiHandler(async ({ request }) => {
  const user = await requireUser(request);
  
  const body = await request.json();
  const amount = body.amount;
  
  if (!amount || typeof amount !== "number") {
    throw apiErrors.badRequest("Valid amount is required");
  }

  // Determine domain URL
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "localhost:3000";
  const protocol = reqHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const domainUrl = `${protocol}://${host}`;

  const session = await StripeService.createCreditsCheckoutSession(
    user._id.toString(),
    user.email,
    amount,
    domainUrl
  );
  
  if (!session.url) {
    throw apiErrors.internal("Failed to create Stripe checkout session");
  }

  return { success: true, url: session.url };
});
