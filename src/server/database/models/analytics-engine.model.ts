import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IAnalyticsEngine extends BaseEntity {
  userId: ObjectId;
  brandName: string;
  industry: string;
  url: string;
  response: Record<string, unknown>[];
}

const analyticsEngineSchema = new Schema<IAnalyticsEngine>(
  {
    ...softDeleteFields,
    userId: { index: true, required: true, type: Schema.Types.Mixed },
    brandName: { maxlength: 120, required: true, trim: true, type: String },
    industry: { maxlength: 120, required: true, trim: true, type: String },
    url: { maxlength: 1000, required: true, trim: true, type: String },
    response: { required: true, type: Schema.Types.Mixed },
  },
  schemaOptions,
);

analyticsEngineSchema.index({ userId: 1, createdAt: -1 });
analyticsEngineSchema.index({ brandName: 1, industry: 1 });
addBasePlugins(analyticsEngineSchema);

export const AnalyticsEngineModel =
  (mongoose.models.AnalyticsEngine as Model<IAnalyticsEngine>) ??
  mongoose.model<IAnalyticsEngine>("AnalyticsEngine", analyticsEngineSchema, "analyticsEngines");
