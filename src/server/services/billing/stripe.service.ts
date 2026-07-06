import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "./subscription.service";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia" as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
});

export class StripeService {
  static async createCheckoutSession(
    userId: string,
    email: string,
    planId: keyof typeof SUBSCRIPTION_PLANS,
    domainUrl: string
  ) {
    const planConfig = SUBSCRIPTION_PLANS[planId];
    if (!planConfig || planId === "free") throw new Error("Invalid plan");

    const priceMap: Record<string, number> = {
      starter: 4900,
      pro: 9900,
      business: 24900
    };

    const priceInCents = priceMap[planId];
    if (!priceInCents) throw new Error("Price not defined for plan");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        planId,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Marketly AI - ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `${planConfig.credits} Credits/month`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${domainUrl}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}#plans`,
      cancel_url: `${domainUrl}/settings?tab=billing#plans`,
    });

    return session;
  }
  static async createCreditsCheckoutSession(
    userId: string,
    email: string,
    amount: number,
    domainUrl: string
  ) {
    const priceMap: Record<number, number> = {
      500: 1000,   // $10
      2000: 3500,  // $35
    };

    const priceInCents = priceMap[amount];
    if (!priceInCents) throw new Error("Invalid credit amount");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        type: "credits_purchase",
        amount: amount.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Marketly AI - ${amount} Credits Pack`,
              description: `One-time purchase of ${amount} credits`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${domainUrl}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainUrl}/settings?tab=billing`,
    });

    return session;
  }
}
