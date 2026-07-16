import mongoose, { Schema, type Model } from "mongoose";

import { schemaOptions } from "@/server/database/schemas/fragments";
import type { ObjectId } from "@/server/database/types";

export interface IAIViolation {
  userId: ObjectId;
  email: string;
  prompt: string;
  feature: string;
  category: string;
  reason: string;
  strikeNumber: number;
  timestamp: Date;
}

const aiViolationSchema = new Schema<IAIViolation>(
  {
    userId: { index: true, ref: "User", required: true, type: Schema.Types.ObjectId },
    email: { lowercase: true, maxlength: 254, required: true, trim: true, type: String },
    prompt: { maxlength: 8000, required: true, trim: true, type: String },
    feature: { index: true, maxlength: 120, required: true, trim: true, type: String },
    category: { maxlength: 80, required: true, trim: true, type: String },
    reason: { maxlength: 1000, required: true, trim: true, type: String },
    strikeNumber: { min: 1, required: true, type: Number },
    timestamp: { default: () => new Date(), index: true, type: Date },
  },
  schemaOptions,
);

aiViolationSchema.index({ userId: 1, timestamp: -1 });

export const AIViolationModel = (mongoose.models.AIViolation as Model<IAIViolation>) ?? mongoose.model<IAIViolation>("AIViolation", aiViolationSchema);
