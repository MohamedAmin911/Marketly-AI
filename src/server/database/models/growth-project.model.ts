import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";
import { GROWTH_PROJECT_STATUSES, type GrowthProjectStatus } from "@/server/growth-engine/types";

export interface IGrowthProject extends BaseEntity {
  audience: string;
  brandName: string;
  brief: string;
  campaigns: Record<string, unknown>[];
  competitors: Record<string, unknown>[];
  goal: string;
  imageAssets: Record<string, unknown>[];
  industry: string;
  generationJobs: Record<string, unknown>[];
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  processingLock?: Record<string, unknown> | null;
  productImage?: Record<string, unknown> | null;
  status: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy?: Record<string, unknown> | string | null;
  userId: ObjectId;
  videoAssets: Record<string, unknown>[];
}

const growthProjectSchema = new Schema(
  {
    ...softDeleteFields,
    audience: { maxlength: 500, required: true, trim: true, type: String },
    brandName: { maxlength: 120, required: true, trim: true, type: String },
    brief: { maxlength: 4000, required: true, trim: true, type: String },
    campaigns: { default: () => [], type: [Schema.Types.Mixed] },
    competitors: { default: () => [], type: [Schema.Types.Mixed] },
    goal: { maxlength: 240, required: true, trim: true, type: String },
    imageAssets: { default: () => [], type: [Schema.Types.Mixed] },
    industry: { maxlength: 120, required: true, trim: true, type: String },
    generationJobs: { default: () => [], type: [Schema.Types.Mixed] },
    marketingAngles: { default: () => [], type: [Schema.Types.Mixed] },
    personas: { default: () => [], type: [Schema.Types.Mixed] },
    processingLock: { default: null, type: Schema.Types.Mixed },
    productImage: { default: null, type: assetRefSchema },
    status: { default: "draft", enum: GROWTH_PROJECT_STATUSES, index: true, type: String },
    storyboards: { default: () => [], type: [Schema.Types.Mixed] },
    strategy: { default: null, type: Schema.Types.Mixed },
    userId: objectId("User", true),
    videoAssets: { default: () => [], type: [Schema.Types.Mixed] },
  },
  schemaOptions,
);

growthProjectSchema.index({ userId: 1, createdAt: -1 });
growthProjectSchema.index({ userId: 1, status: 1, createdAt: -1 });
growthProjectSchema.index({ brandName: 1, industry: 1 });
growthProjectSchema.index({ "processingLock.expiresAt": 1 });
addBasePlugins(growthProjectSchema);

export const GrowthProjectModel =
  (mongoose.models.GrowthProject as Model<IGrowthProject>) ??
  mongoose.model<IGrowthProject>("GrowthProject", growthProjectSchema);
