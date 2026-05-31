import mongoose, { Schema, type Model } from "mongoose";

import { CONTENT_TYPES, type ContentType } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, assetRefSchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface IAIMemory extends BaseEntity {
  averageGenerationType?: ContentType;
  bestPerformingCampaigns: ObjectId[];
  bestPerformingCreatives: Record<string, unknown>[];
  bestPerformingPrompts: string[];
  brandId?: ObjectId;
  brandIdentity: Record<string, unknown>;
  mostUsedFeatures: string[];
  preferredCaptions: string[];
  preferredHooks: string[];
  preferredStyles: string[];
  preferredVideoStyles: string[];
  previousConversations: Record<string, unknown>[];
  previousRecommendations: string[];
  previousStrategies: string[];
  successfulCampaigns: string[];
  successfulCreatives: Record<string, unknown>[];
  successfulPrompts: string[];
  userId: ObjectId;
  userPatterns: Record<string, unknown>;
}

const conversationMemorySchema = new Schema(
  {
    messages: [{ role: { enum: ["user", "assistant", "system"], type: String }, text: { maxlength: 8000, trim: true, type: String } }],
    summary: { maxlength: 4000, trim: true, type: String },
    topic: { maxlength: 180, trim: true, type: String },
  },
  { _id: true, timestamps: true },
);

const brandIdentitySchema = new Schema(
  {
    audience: { maxlength: 500, trim: true, type: String },
    forbiddenWords: [{ maxlength: 80, trim: true, type: String }],
    name: { maxlength: 160, trim: true, type: String },
    positioning: { maxlength: 1000, trim: true, type: String },
    tone: { maxlength: 240, trim: true, type: String },
    values: [{ maxlength: 120, trim: true, type: String }],
    visualStyle: { maxlength: 500, trim: true, type: String },
    voice: { maxlength: 500, trim: true, type: String },
  },
  { _id: false },
);

const successfulCreativeSchema = new Schema(
  {
    format: { maxlength: 80, trim: true, type: String },
    id: { maxlength: 160, trim: true, type: String },
    mimeType: { maxlength: 120, trim: true, type: String },
    performanceNote: { maxlength: 1000, trim: true, type: String },
    title: { maxlength: 180, required: true, trim: true, type: String },
    url: { maxlength: 2048, trim: true, type: String },
  },
  { _id: false },
);

const aiMemorySchema = new Schema<IAIMemory>(
  {
    ...softDeleteFields,
    averageGenerationType: { enum: CONTENT_TYPES, type: String },
    bestPerformingCampaigns: [{ ref: "Campaign", type: Schema.Types.ObjectId }],
    bestPerformingCreatives: [assetRefSchema],
    bestPerformingPrompts: [{ maxlength: 4000, trim: true, type: String }],
    brandId: objectId("Brand"),
    brandIdentity: { default: () => ({}), type: brandIdentitySchema },
    mostUsedFeatures: [{ maxlength: 120, trim: true, type: String }],
    preferredCaptions: [{ maxlength: 2000, trim: true, type: String }],
    preferredHooks: [{ maxlength: 500, trim: true, type: String }],
    preferredStyles: [{ maxlength: 120, trim: true, type: String }],
    preferredVideoStyles: [{ maxlength: 120, trim: true, type: String }],
    previousConversations: [conversationMemorySchema],
    previousRecommendations: [{ maxlength: 2000, trim: true, type: String }],
    previousStrategies: [{ maxlength: 4000, trim: true, type: String }],
    successfulCampaigns: [{ maxlength: 240, trim: true, type: String }],
    successfulCreatives: { default: () => [], type: [successfulCreativeSchema] },
    successfulPrompts: [{ maxlength: 4000, trim: true, type: String }],
    userId: objectId("User", true),
    userPatterns: { default: () => ({}), type: Map, of: Schema.Types.Mixed },
  },
  schemaOptions,
);

aiMemorySchema.index({ userId: 1, brandId: 1 }, { partialFilterExpression: { isDeleted: false }, unique: true });
aiMemorySchema.index({ userId: 1, updatedAt: -1 });
addBasePlugins(aiMemorySchema);

export const AIMemoryModel = (mongoose.models.AIMemory as Model<IAIMemory>) ?? mongoose.model<IAIMemory>("AIMemory", aiMemorySchema);
