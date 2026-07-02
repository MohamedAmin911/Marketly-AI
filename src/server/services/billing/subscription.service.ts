import { UserModel, type IUser } from "@/server/database/models/user.model";
import { ApiError } from "@/server/errors/api-error";
import type { PlanType } from "@/server/database/enums";
import mongoose from "mongoose";

export const SUBSCRIPTION_PLANS = {
  free: {
    plan: "free",
    credits: 50, // Granted only once
    features: {
      growthEngine: false,
      analytics: false,
      aiAssistant: false,
      priority: false,
      api: false,
      commercial: false,
    }
  },
  starter: {
    plan: "starter",
    credits: 500, // Monthly
    features: {
      growthEngine: false,
      analytics: false,
      aiAssistant: true,
      priority: false,
      api: false,
      commercial: false,
    }
  },
  pro: {
    plan: "pro",
    credits: 1500,
    features: {
      growthEngine: true,
      analytics: true,
      aiAssistant: true,
      priority: true,
      api: true,
      commercial: true,
    }
  },
  business: {
    plan: "business",
    credits: 4000,
    features: {
      growthEngine: true,
      analytics: true,
      aiAssistant: true,
      priority: true,
      api: true,
      commercial: true,
    }
  }
} as const;

export class SubscriptionService {
  /**
   * Lazily checks if a user's subscription has renewed, and if so, resets their monthly credits.
   */
  static async evaluateMonthlyReset(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) return;
    
    // Free plans never reset
    if (user.subscription.plan === "free") return;
    
    // If renewsAt has passed, reset the cycle
    if (user.subscription.renewsAt && new Date() > user.subscription.renewsAt) {
      // Do not reset if the subscription is not in good standing (e.g., past_due because membership isn't paid)
      if (user.subscription.status !== "active") return;

      // Calculate next renewal date (add 1 month)
      const nextRenewal = new Date(user.subscription.renewsAt);
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      
      const planConfig = SUBSCRIPTION_PLANS[user.subscription.plan as keyof typeof SUBSCRIPTION_PLANS];
      if (!planConfig) return;

      user.subscription.monthlyCreditsRemaining = planConfig.credits;
      user.subscription.renewsAt = nextRenewal;
      user.usage.monthlyCreditsUsed = 0;
      user.usage.lastReset = new Date();
      
      await user.save();
    }
  }

  /**
   * Upgrades or downgrades a user's plan manually (used directly or via webhook)
   */
  static async applyPlanChange(
    userId: string,
    newPlanId: keyof typeof SUBSCRIPTION_PLANS,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(session);
      if (!user) throw new ApiError(404, "User not found");

      const planConfig = SUBSCRIPTION_PLANS[newPlanId];
      if (!planConfig) throw new ApiError(400, "Invalid plan");

      user.subscription.plan = newPlanId;
      user.subscription.status = "active";
      user.subscription.monthlyCredits = planConfig.credits;
      user.subscription.monthlyCreditsRemaining = planConfig.credits;
      user.features = planConfig.features;
      
      if (stripeCustomerId) user.subscription.stripeCustomerId = stripeCustomerId;
      if (stripeSubscriptionId) user.subscription.stripeSubscriptionId = stripeSubscriptionId;

      // Set billing cycle renewsAt to 1 month from now
      const renewsAt = new Date();
      renewsAt.setMonth(renewsAt.getMonth() + 1);
      user.subscription.renewsAt = renewsAt;

      user.usage.monthlyCreditsUsed = 0;
      
      await user.save({ session });
      
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
