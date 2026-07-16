import { NextResponse } from "next/server";
import { getStripe } from "@/server/services/billing/stripe.service";
import { SubscriptionService } from "@/server/services/billing/subscription.service";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database/connection";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  await connectToDatabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        
        if (userId && session.metadata?.type === "credits_purchase") {
          const amount = parseInt(session.metadata.amount, 10);
          if (!isNaN(amount)) {
            const { CreditsService } = await import("@/server/services/billing/credits.service");
            await CreditsService.addPurchasedCredits(userId, amount, `Purchased ${amount} credits pack`);
          }
        } else if (userId && planId) {
          await SubscriptionService.applyPlanChange(
            userId, 
            planId, 
            session.customer as string, 
            session.subscription as string
          );
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const user = await UserModel.findOne({ "subscription.stripeSubscriptionId": subscription.id });
        if (user) {
          await SubscriptionService.applyPlanChange(String(user._id), "free");
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const user = await UserModel.findOne({ "subscription.stripeSubscriptionId": subscription.id });
        
        if (user) {
           if (subscription.status !== "active" && subscription.status !== "trialing") {
             if (subscription.status === "canceled") {
                await SubscriptionService.applyPlanChange(String(user._id), "free");
             } else {
                user.subscription.status = subscription.status; // e.g. past_due
                await user.save();
             }
           } else {
             if (user.subscription.status !== "active") {
               user.subscription.status = "active";
               await user.save();
             }
           }
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
