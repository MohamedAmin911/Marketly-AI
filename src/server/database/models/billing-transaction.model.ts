import mongoose, { Schema, type Model } from "mongoose";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";
import type { BaseEntity, ObjectId } from "@/server/database/types";

export interface IBillingTransaction extends BaseEntity {
  user: ObjectId;
  provider: "stripe" | "lemonsqueezy" | "paddle" | "paypal" | "revenuecat" | "manual" | "system";
  providerTransactionId?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  type: "subscription" | "credit_pack" | "adjustment";
  description: string;
  metadata?: Record<string, unknown>;
}

const billingTransactionSchema = new Schema<IBillingTransaction>(
  {
    ...softDeleteFields,
    user: { ref: "User", required: true, type: Schema.Types.ObjectId },
    provider: { default: "system", type: String },
    providerTransactionId: { type: String },
    amount: { required: true, type: Number },
    currency: { default: "USD", required: true, type: String },
    status: { default: "pending", enum: ["pending", "completed", "failed", "refunded"], required: true, type: String },
    type: { default: "subscription", enum: ["subscription", "credit_pack", "adjustment"], required: true, type: String },
    description: { required: true, type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  schemaOptions,
);

billingTransactionSchema.index({ user: 1, createdAt: -1 });
billingTransactionSchema.index({ providerTransactionId: 1 }, { sparse: true });
addBasePlugins(billingTransactionSchema);

export const BillingTransactionModel = (mongoose.models.BillingTransaction as Model<IBillingTransaction>) ?? mongoose.model<IBillingTransaction>("BillingTransaction", billingTransactionSchema);
