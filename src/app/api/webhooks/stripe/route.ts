import { NextResponse } from "next/server";
import { stripe } from "@/server/services/billing/stripe.service";
import { SubscriptionService } from "@/server/services/billing/subscription.service";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database/connection";
import type Stripe from "stripe";
import { PLAN_TYPES, SUBSCRIPTION_STATUSES, type PlanType, type SubscriptionStatus } from "@/server/database/enums";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    console.error("Webhook signature verification failed.", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  await connectToDatabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        
        if (userId && session.metadata?.type === "credits_purchase") {
          const amount = parseInt(session.metadata.amount, 10);
          if (!isNaN(amount)) {
            const { CreditsService } = await import("@/server/services/billing/credits.service");
            await CreditsService.addPurchasedCredits(userId, amount, `Purchased ${amount} credits pack`);
          }
        } else if (userId && planId) {
          if (!isPlanType(planId)) break;
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
        const subscription = event.data.object as Stripe.Subscription;
        const user = await UserModel.findOne({ "subscription.stripeSubscriptionId": subscription.id });
        if (user) {
          await SubscriptionService.applyPlanChange(String(user._id), "free");
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await UserModel.findOne({ "subscription.stripeSubscriptionId": subscription.id });
        
        if (user) {
           if (subscription.status !== "active" && subscription.status !== "trialing") {
             if (subscription.status === "canceled") {
                await SubscriptionService.applyPlanChange(String(user._id), "free");
             } else {
                user.subscription.status = toSubscriptionStatus(subscription.status);
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

function isPlanType(value: unknown): value is PlanType {
  return typeof value === "string" && PLAN_TYPES.includes(value as PlanType);
}

function toSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus) ? status as SubscriptionStatus : "past_due";
}
