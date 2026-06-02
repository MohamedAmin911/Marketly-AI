import mongoose, { Schema, type Model } from "mongoose";

import { GENERATION_STATUSES, WORKFLOW_STATUSES, type GenerationStatus, type WorkflowStatus } from "@/server/database/enums";
import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, aiInsightSchema, assetRefSchema, moneySchema, objectId, schemaOptions, softDeleteFields } from "@/server/database/schemas/fragments";

export interface ICampaign extends BaseEntity {
  audience?: string;
  audienceInsight?: string;
  brandId?: ObjectId;
  budget?: Record<string, unknown>;
  brief?: string;
  captions: string[];
  campaignCards: Array<{
    caption: string;
    creativePrompt: string;
    cta: string;
    generatedImage?: Record<string, unknown>;
    hook: string;
    id: string;
    platform: string;
    tone: string;
  }>;
  campaignSummary?: string;
  campaignTitle?: string;
  ctaSuggestions: string[];
  analytics: {
    estimatedCtr?: number;
    estimatedEngagementRate?: number;
    eventsAccepted?: number;
    riskLevel?: "low" | "medium" | "high";
    topPlatform?: string;
  };
  clicks: number;
  conversions: number;
  conversionRate: number;
  creatives: Record<string, unknown>[];
  generationStatus: GenerationStatus;
  generatedImages: Record<string, unknown>[];
  goal?: string;
  ctr: number;
  description?: string;
  engagementRate: number;
  endDate?: Date;
  hooks: string[];
  impressions: number;
  name: string;
  modelUsed?: string;
  optimizationSuggestions: Record<string, unknown>[];
  platforms: string[];
  platformStrategy: string[];
  primaryGoal?: string;
  productImage?: Record<string, unknown>;
  productTitle?: string;
  projectId?: ObjectId;
  recommendations: Record<string, unknown>[];
  roi: number;
  startDate?: Date;
  status: WorkflowStatus;
  style?: string;
  socialCustomIdeas?: string[];
  socialMode?: "auto" | "custom";
  socialMoodPreset?: string;
  socialPosts?: Record<string, unknown>[];
  socialTheme?: string;
  strengths: string[];
  targetAudience?: string;
  userId: ObjectId;
  weaknesses: string[];
}

const campaignCreativeSchema = new Schema(
  {
    asset: { default: null, type: assetRefSchema },
    generationErrors: { default: [], type: [String] },
    generationStatus: { default: "queued", enum: GENERATION_STATUSES, type: String },
    prompt: { maxlength: 4000, trim: true, type: String },
    title: { maxlength: 180, trim: true, type: String },
  },
  { _id: true },
);

const campaignAnalyticsSchema = new Schema(
  {
    estimatedCtr: { default: 0, min: 0, type: Number },
    estimatedEngagementRate: { default: 0, min: 0, type: Number },
    eventsAccepted: { default: 0, min: 0, type: Number },
    riskLevel: { default: "low", enum: ["low", "medium", "high"], type: String },
    topPlatform: { maxlength: 80, trim: true, type: String },
  },
  { _id: false },
);

const generatedCampaignCardSchema = new Schema(
  {
    caption: { maxlength: 2200, required: true, trim: true, type: String },
    creativePrompt: { maxlength: 4000, required: true, trim: true, type: String },
    cta: { maxlength: 180, required: true, trim: true, type: String },
    generatedImage: { default: null, type: assetRefSchema },
    hook: { maxlength: 500, required: true, trim: true, type: String },
    id: { index: true, required: true, trim: true, type: String },
    platform: { maxlength: 80, required: true, trim: true, type: String },
    tone: { maxlength: 120, required: true, trim: true, type: String },
  },
  { _id: false },
);

const campaignSchema = new Schema<ICampaign>(
  {
    ...softDeleteFields,
    analytics: { default: () => ({}), type: campaignAnalyticsSchema },
    audience: { maxlength: 1000, trim: true, type: String },
    audienceInsight: { maxlength: 2000, trim: true, type: String },
    brandId: objectId("Brand", false),
    brief: { maxlength: 4000, trim: true, type: String },
    budget: { default: () => ({}), type: moneySchema },
    campaignCards: { default: [], type: [generatedCampaignCardSchema] },
    campaignSummary: { maxlength: 2200, trim: true, type: String },
    campaignTitle: { maxlength: 180, trim: true, type: String },
    captions: [{ maxlength: 2000, trim: true, type: String }],
    ctaSuggestions: [{ maxlength: 240, trim: true, type: String }],
    clicks: { default: 0, min: 0, type: Number },
    conversions: { default: 0, min: 0, type: Number },
    conversionRate: { default: 0, min: 0, type: Number },
    creatives: { default: [], type: [campaignCreativeSchema] },
    generationStatus: { default: "queued", enum: GENERATION_STATUSES, type: String },
    generatedImages: { default: [], type: [assetRefSchema] },
    goal: { maxlength: 80, trim: true, type: String },
    ctr: { default: 0, min: 0, type: Number },
    description: { maxlength: 2000, trim: true, type: String },
    engagementRate: { default: 0, min: 0, type: Number },
    endDate: { type: Date },
    hooks: [{ maxlength: 500, trim: true, type: String }],
    impressions: { default: 0, min: 0, type: Number },
    name: { maxlength: 180, required: true, trim: true, type: String },
    modelUsed: { maxlength: 240, trim: true, type: String },
    optimizationSuggestions: [aiInsightSchema],
    platforms: [{ maxlength: 80, trim: true, type: String }],
    platformStrategy: [{ maxlength: 1000, trim: true, type: String }],
    primaryGoal: { maxlength: 160, trim: true, type: String },
    productImage: { default: null, type: assetRefSchema },
    productTitle: { maxlength: 180, trim: true, type: String },
    projectId: objectId("Project", false),
    recommendations: [aiInsightSchema],
    roi: { default: 0, type: Number },
    startDate: { type: Date },
    status: { default: "draft", enum: WORKFLOW_STATUSES, index: true, type: String },
    strengths: [{ maxlength: 240, trim: true, type: String }],
    style: { maxlength: 80, trim: true, type: String },
    socialCustomIdeas: [{ maxlength: 500, trim: true, type: String }],
    socialMode: { default: "auto", enum: ["auto", "custom"], index: true, type: String },
    socialMoodPreset: { maxlength: 80, trim: true, type: String },
    socialPosts: { default: [], type: [Schema.Types.Mixed] },
    socialTheme: { maxlength: 2000, trim: true, type: String },
    targetAudience: { maxlength: 1000, trim: true, type: String },
    userId: objectId("User", true),
    weaknesses: [{ maxlength: 240, trim: true, type: String }],
  },
  schemaOptions,
);

campaignSchema.index({ userId: 1, projectId: 1, createdAt: -1 });
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ brandId: 1, status: 1 });
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
addBasePlugins(campaignSchema);

export const CampaignModel = (mongoose.models.Campaign as Model<ICampaign>) ?? mongoose.model<ICampaign>("Campaign", campaignSchema);
