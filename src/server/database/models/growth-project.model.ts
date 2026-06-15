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
  externalProjectId?: string;
  goal: string;
  industry: string;
  lastError?: string;
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  productImage?: Record<string, unknown> | null;
  projectId?: string;
  status: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy?: Record<string, unknown> | string | unknown[] | null;
  userId: ObjectId;
}

const growthProjectSchema = new Schema(
  {
    ...softDeleteFields,
    audience: { maxlength: 500, required: true, trim: true, type: String },
    brandName: { maxlength: 120, required: true, trim: true, type: String },
    brief: { maxlength: 4000, required: true, trim: true, type: String },
    campaigns: { default: () => [], type: [Schema.Types.Mixed] },
    competitors: { default: () => [], type: [Schema.Types.Mixed] },
    externalProjectId: { index: true, maxlength: 120, trim: true, type: String },
    goal: { maxlength: 240, required: true, trim: true, type: String },
    industry: { maxlength: 120, required: true, trim: true, type: String },
    lastError: { maxlength: 2000, trim: true, type: String },
    marketingAngles: { default: () => [], type: [Schema.Types.Mixed] },
    personas: { default: () => [], type: [Schema.Types.Mixed] },
    productImage: { default: null, type: assetRefSchema },
    projectId: { index: true, maxlength: 120, trim: true, type: String },
    status: { default: "draft", enum: GROWTH_PROJECT_STATUSES, index: true, type: String },
    storyboards: { default: () => [], type: [Schema.Types.Mixed] },
    strategy: { default: null, type: Schema.Types.Mixed },
    userId: { index: true, required: true, type: Schema.Types.Mixed },
  },
  schemaOptions,
);

growthProjectSchema.index({ userId: 1, createdAt: -1 });
growthProjectSchema.index({ userId: 1, status: 1, createdAt: -1 });
growthProjectSchema.index({ brandName: 1, industry: 1 });
addBasePlugins(growthProjectSchema);

export const GrowthProjectModel =
  (mongoose.models.GrowthProject as Model<IGrowthProject>) ??
  mongoose.model<IGrowthProject>("GrowthProject", growthProjectSchema, "growthProjects");
