import mongoose, { Schema, type Model } from "mongoose";

import { BILLING_CYCLES, PLAN_TYPES, SUBSCRIPTION_STATUSES, type BillingCycle, type PlanType, type SubscriptionStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, moneySchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface ISubscription extends BaseEntity {
  billingCycle: BillingCycle;
  campaignsPerMonth: number;
  campaignsUsed: number;
  imagesPerMonth: number;
  imagesUsed: number;
  invoices: Record<string, unknown>[];
  plan: PlanType;
  provider: string;
  renewalDate?: Date;
  status: SubscriptionStatus;
  userId: ObjectId;
  videosPerMonth: number;
  videosUsed: number;
}

const invoiceSchema = new Schema(
  {
    amount: { type: moneySchema },
    invoiceId: { maxlength: 160, trim: true, type: String },
    paidAt: { type: Date },
    status: { maxlength: 80, trim: true, type: String },
    url: { maxlength: 2048, trim: true, type: String },
  },
  { _id: true, timestamps: true },
);

const subscriptionSchema = new Schema<ISubscription>(
  {
    ...softDeleteFields,
    billingCycle: { default: "monthly", enum: BILLING_CYCLES, type: String },
    campaignsPerMonth: { default: 5, min: 0, type: Number },
    campaignsUsed: { default: 0, min: 0, type: Number },
    imagesPerMonth: { default: 100, min: 0, type: Number },
    imagesUsed: { default: 0, min: 0, type: Number },
    invoices: [invoiceSchema],
    plan: { default: "free", enum: PLAN_TYPES, type: String },
    provider: { default: "stripe", maxlength: 80, trim: true, type: String },
    renewalDate: { type: Date },
    status: { default: "trialing", enum: SUBSCRIPTION_STATUSES, index: true, type: String },
    userId: objectId("User", true),
    videosPerMonth: { default: 10, min: 0, type: Number },
    videosUsed: { default: 0, min: 0, type: Number },
  },
  schemaOptions,
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, renewalDate: 1 });
addBasePlugins(subscriptionSchema);

export const SubscriptionModel = (mongoose.models.Subscription as Model<ISubscription>) ?? mongoose.model<ISubscription>("Subscription", subscriptionSchema);
