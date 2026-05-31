import mongoose, { Schema, type Model } from "mongoose";

import { CONTENT_TYPES, GENERATION_STATUSES, type ContentType, type GenerationStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, generationSettingsSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IGeneratedContent extends BaseEntity {
  brandId?: ObjectId;
  brandMemoryUsed: boolean;
  campaignId?: ObjectId;
  downloaded: boolean;
  favorited: boolean;
  angle?: string;
  background?: string;
  generatedCaptions: string[];
  generatedHooks: string[];
  generatedImages: Record<string, unknown>[];
  generatedVideo?: Record<string, unknown>;
  generationCost: number;
  generationErrors: string[];
  generationSettings: Record<string, unknown>;
  generationStatus: GenerationStatus;
  generationTime: number;
  lighting?: string;
  mode?: string;
  modelUsed: string;
  negativePrompt?: string;
  personalizationUsed: boolean;
  productImage?: Record<string, unknown>;
  projectId?: ObjectId;
  prompt: string;
  quality?: string;
  referenceImage?: Record<string, unknown>;
  regenerated: boolean;
  type: ContentType;
  uploadedAssets: Record<string, unknown>[];
  userId: ObjectId;
}

const generatedContentSchema = new Schema<IGeneratedContent>(
  {
    ...softDeleteFields,
    angle: { maxlength: 80, trim: true, type: String },
    background: { maxlength: 160, trim: true, type: String },
    brandId: objectId("Brand"),
    brandMemoryUsed: { default: false, type: Boolean },
    campaignId: objectId("Campaign"),
    downloaded: { default: false, type: Boolean },
    favorited: { default: false, index: true, type: Boolean },
    generatedCaptions: [{ maxlength: 2000, trim: true, type: String }],
    generatedHooks: [{ maxlength: 500, trim: true, type: String }],
    generatedImages: [assetRefSchema],
    generatedVideo: { default: null, type: assetRefSchema },
    generationCost: { default: 0, min: 0, type: Number },
    generationErrors: [{ maxlength: 1000, trim: true, type: String }],
    generationSettings: { default: () => ({}), type: generationSettingsSchema },
    generationStatus: { default: "queued", enum: GENERATION_STATUSES, index: true, type: String },
    generationTime: { default: 0, min: 0, type: Number },
    lighting: { maxlength: 80, trim: true, type: String },
    mode: { enum: ["placement", "reference", "background", "lifestyle", "studio"], index: true, type: String },
    modelUsed: { maxlength: 120, required: true, trim: true, type: String },
    negativePrompt: { maxlength: 4000, trim: true, type: String },
    personalizationUsed: { default: false, type: Boolean },
    productImage: { default: null, type: assetRefSchema },
    projectId: objectId("Project"),
    prompt: { maxlength: 8000, required: true, trim: true, type: String },
    quality: { enum: ["draft", "standard", "high", "ultra"], default: "high", type: String },
    referenceImage: { default: null, type: assetRefSchema },
    regenerated: { default: false, type: Boolean },
    type: { enum: CONTENT_TYPES, index: true, required: true, type: String },
    uploadedAssets: [assetRefSchema],
    userId: objectId("User", true),
  },
  schemaOptions,
);

generatedContentSchema.index({ userId: 1, projectId: 1, type: 1, createdAt: -1 });
generatedContentSchema.index({ userId: 1, type: 1 });
generatedContentSchema.index({ userId: 1, favorited: 1, createdAt: -1 });
generatedContentSchema.index({ campaignId: 1, generationStatus: 1 });
addBasePlugins(generatedContentSchema);

export const GeneratedContentModel =
  (mongoose.models.GeneratedContent as Model<IGeneratedContent>) ??
  mongoose.model<IGeneratedContent>("GeneratedContent", generatedContentSchema);
