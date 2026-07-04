import mongoose from "mongoose";
import { UserModel, type IUser } from "@/server/database/models/user.model";
import { CreditLedgerModel } from "@/server/database/models/credit-ledger.model";
import { ApiError, apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";

export class CreditsService {
  /**
   * Deducts credits from a user securely using MongoDB transactions.
   * Admin users bypass deductions.
   */
  static async deductCredits(userId: string, amount: number, feature: string, description: string): Promise<boolean> {
    if (amount <= 0) return true;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(session);
      
      if (!user) {
        throw apiErrors.notFound("User not found");
      }

      // Admin bypass
      if (user.role === "admin") {
        await session.commitTransaction();
        session.endSession();
        return true;
      }

      let source: "monthly" | "purchased" = "monthly";
      let amountToDeductFromMonthly = 0;
      let amountToDeductFromPurchased = 0;

      if (user.subscription.monthlyCreditsRemaining >= amount) {
        amountToDeductFromMonthly = amount;
      } else {
        const remainingNeeded = amount - user.subscription.monthlyCreditsRemaining;
        amountToDeductFromMonthly = user.subscription.monthlyCreditsRemaining;
        
        if (user.subscription.purchasedCredits >= remainingNeeded) {
          amountToDeductFromPurchased = remainingNeeded;
          source = "purchased";
        } else {
          // Insufficient overall credits
          await session.abortTransaction();
          session.endSession();
          throw apiErrors.badRequest("Insufficient credits.");
        }
      }

      // Update User
      user.subscription.monthlyCreditsRemaining -= amountToDeductFromMonthly;
      user.subscription.purchasedCredits -= amountToDeductFromPurchased;
      
      user.usage.totalCreditsUsed += amount;
      user.usage.monthlyCreditsUsed += amountToDeductFromMonthly;
      user.usage.purchasedCreditsUsed += amountToDeductFromPurchased;

      await user.save({ session });

      // Create Ledger Entry
      if (amountToDeductFromMonthly > 0) {
        await CreditLedgerModel.create([{
          user: user._id,
          amount: -amountToDeductFromMonthly,
          type: "deduction",
          source: "monthly",
          feature,
          description: `${description} (Monthly)`,
        }], { session });
      }

      if (amountToDeductFromPurchased > 0) {
        await CreditLedgerModel.create([{
          user: user._id,
          amount: -amountToDeductFromPurchased,
          type: "deduction",
          source: "purchased",
          feature,
          description: `${description} (Purchased)`,
        }], { session });
      }

      await session.commitTransaction();
      session.endSession();

      logger.info(`Credits deducted for user ${userId}`, { amount, feature });
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof ApiError) throw error;
      logger.error("Failed to deduct credits", { error, userId, amount });
      throw apiErrors.internal("Failed to process credit deduction");
    }
  }

  /**
   * Adds purchased credits to a user
   */
  static async addPurchasedCredits(userId: string, amount: number, description: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(session);
      if (!user) throw apiErrors.notFound("User not found");

      user.subscription.purchasedCredits += amount;
      await user.save({ session });

      await CreditLedgerModel.create([{
        user: user._id,
        amount,
        type: "addition",
        source: "purchased",
        description,
      }], { session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
