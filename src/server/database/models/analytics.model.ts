import mongoose, { Schema, type Model } from "mongoose";

import type { BaseEntity, ObjectId } from "@/server/database/types";
import { addBasePlugins, aiInsightSchema, objectId, platformMetricSchema, schemaOptions, softDeleteFields, timeSeriesPointSchema } from "@/server/database/schemas/fragments";

export interface IAnalytics extends BaseEntity {
  anomaliesDetected: Record<string, unknown>[];
  brandId?: ObjectId;
  campaignId: ObjectId;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  dailyStats: Record<string, unknown>[];
  engagementRate: number;
  facebook: Record<string, number>;
  googleAds: Record<string, number>;
  impressions: number;
  instagram: Record<string, number>;
  monthlyStats: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  roi: number;
  tiktok: Record<string, number>;
  trends: Record<string, unknown>[];
  userId: ObjectId;
  weeklyStats: Record<string, unknown>[];
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    ...softDeleteFields,
    anomaliesDetected: [aiInsightSchema],
    brandId: objectId("Brand"),
    campaignId: objectId("Campaign", true),
    clicks: { default: 0, min: 0, type: Number },
    conversions: { default: 0, min: 0, type: Number },
    cpc: { default: 0, min: 0, type: Number },
    ctr: { default: 0, min: 0, type: Number },
    dailyStats: [timeSeriesPointSchema],
    engagementRate: { default: 0, min: 0, type: Number },
    facebook: { default: () => ({}), type: platformMetricSchema },
    googleAds: { default: () => ({}), type: platformMetricSchema },
    impressions: { default: 0, min: 0, type: Number },
    instagram: { default: () => ({}), type: platformMetricSchema },
    monthlyStats: [timeSeriesPointSchema],
    recommendations: [aiInsightSchema],
    roi: { default: 0, type: Number },
    tiktok: { default: () => ({}), type: platformMetricSchema },
    trends: [aiInsightSchema],
    userId: objectId("User", true),
    weeklyStats: [timeSeriesPointSchema],
  },
  schemaOptions,
);

analyticsSchema.index({ userId: 1, campaignId: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ brandId: 1, createdAt: -1 });
addBasePlugins(analyticsSchema);

export const AnalyticsModel = (mongoose.models.Analytics as Model<IAnalytics>) ?? mongoose.model<IAnalytics>("Analytics", analyticsSchema);
