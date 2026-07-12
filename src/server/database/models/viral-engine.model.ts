import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IViralEngine extends BaseEntity {
  userId: ObjectId;
  brandName: string;
  industry: string;
  targetAudience: string;
  goal: string;
  brandBrief: string;
  response: Record<string, unknown>;
}

const viralEngineSchema = new Schema(
  {
    ...softDeleteFields,
    userId: { index: true, required: true, type: Schema.Types.Mixed },
    brandName: { maxlength: 120, required: true, trim: true, type: String },
    industry: { maxlength: 120, required: true, trim: true, type: String },
    targetAudience: { maxlength: 120, required: true, trim: true, type: String },
    goal: { maxlength: 240, required: true, trim: true, type: String },
    brandBrief: { maxlength: 4000, required: true, trim: true, type: String },
    response: { required: true, type: Schema.Types.Mixed },
  },
  schemaOptions,
);

viralEngineSchema.index({ userId: 1, createdAt: -1 });
viralEngineSchema.index({ brandName: 1, industry: 1 });
addBasePlugins(viralEngineSchema);

export const ViralEngineModel =
  (mongoose.models.ViralEngine as Model<IViralEngine>) ??
  mongoose.model<IViralEngine>("ViralEngine", viralEngineSchema, "viralEngines");
