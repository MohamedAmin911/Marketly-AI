import mongoose, { Schema, type Model } from "mongoose";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";
import type { BaseEntity, ObjectId } from "@/server/database/types";

export interface ICreditLedger extends BaseEntity {
  user: ObjectId;
  amount: number; // positive for additions, negative for deductions
  type: "deduction" | "addition";
  source: "monthly" | "purchased";
  feature?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

const creditLedgerSchema = new Schema<ICreditLedger>(
  {
    ...softDeleteFields,
    user: { ref: "User", required: true, type: Schema.Types.ObjectId },
    amount: { required: true, type: Number },
    type: { enum: ["deduction", "addition"], required: true, type: String },
    source: { enum: ["monthly", "purchased"], required: true, type: String },
    feature: { type: String },
    description: { required: true, type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  schemaOptions,
);

creditLedgerSchema.index({ user: 1, createdAt: -1 });
addBasePlugins(creditLedgerSchema);

export const CreditLedgerModel = (mongoose.models.CreditLedger as Model<ICreditLedger>) ?? mongoose.model<ICreditLedger>("CreditLedger", creditLedgerSchema);
