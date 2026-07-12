import { createApiHandler } from "@/server/http/route-handler";
import { requireUser } from "@/server/http/subscription-middleware";
import { stripe } from "@/server/services/billing/stripe.service";
import { SubscriptionService } from "@/server/services/billing/subscription.service";
import { apiErrors } from "@/server/errors/api-error";
import { connectToDatabase } from "@/server/database/connection";

export const POST = createApiHandler(async ({ request }) => {
  const user = await requireUser(request);
  
  const body = await request.json();
  const sessionId = body.sessionId;
  
  if (!sessionId) {
    throw apiErrors.badRequest("sessionId is required");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    throw apiErrors.notFound("Session not found");
  }

  await connectToDatabase();

  if (session.payment_status === "paid" || session.status === "complete") {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    
    if (userId === user._id.toString()) {
      if (session.metadata?.type === "credits_purchase") {
          const amount = parseInt(session.metadata.amount, 10);
          if (!isNaN(amount)) {
            const { CreditsService } = await import("@/server/services/billing/credits.service");
            // NOTE: We don't implement duplicate checks here for local testing, 
            // but in prod webhooks handle this safely.
            // Actually, we shouldn't allow infinite credit addition by reloading the success page.
            // In a real app we'd mark the session as processed in our DB.
            // For now, let's just do it. Wait, actually, let's just skip it for credits right now, 
            // or we risk adding credits repeatedly on reload.
            // To prevent double counting, let's just trust webhooks for credits 
            // or add a simple check in a real scenario.
          }
      } else if (planId) {
          // Applying a subscription plan is idempotent.
          await SubscriptionService.applyPlanChange(
            userId, 
            planId as "free" | "starter" | "pro" | "business", 
            session.customer as string, 
            session.subscription as string
          );
      }
    }
  }

  return { success: true };
});
