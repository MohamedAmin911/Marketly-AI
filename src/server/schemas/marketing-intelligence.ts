import { z } from "zod";

const textListSchema = z.array(z.string().trim().min(1).max(240)).default([]);

export const marketingAnalyticsPointSchema = z.object({
  campaignName: z.string().trim().min(1).max(160).default("Campaign"),
  anomaliesDetected: textListSchema,
  clicks: z.coerce.number().min(0).default(0),
  conversions: z.coerce.number().min(0).default(0),
  cpc: z.coerce.number().min(0).optional(),
  ctr: z.coerce.number().min(0).max(100).optional(),
  engagementRate: z.coerce.number().min(0).max(100).optional(),
  engagements: z.coerce.number().min(0).optional(),
  impressions: z.coerce.number().min(0).default(0),
  period: z.string().trim().min(1).max(80).default("Current period"),
  recommendations: textListSchema,
  revenue: z.coerce.number().min(0).optional(),
  roi: z.coerce.number().min(-100).max(10000).optional(),
  spend: z.coerce.number().min(0).optional(),
  trends: textListSchema,
});

export const marketingMemorySchema = z.object({
  preferredCaptions: textListSchema,
  preferredHooks: textListSchema,
  preferredStyles: textListSchema,
  previousConversations: z.array(z.object({
    messages: z.array(z.object({
      role: z.enum(["assistant", "system", "user"]),
      text: z.string().trim().min(1).max(8000),
    })).default([]),
    summary: z.string().trim().max(4000).optional(),
    topic: z.string().trim().max(180).optional(),
  })).default([]),
  previousRecommendations: textListSchema,
  successfulCampaigns: textListSchema,
  successfulCreatives: z.array(z.object({
    performanceNote: z.string().trim().max(1000).optional(),
    title: z.string().trim().min(1).max(180),
  })).default([]),
  successfulPrompts: textListSchema,
  userPatterns: z.record(z.string(), z.unknown()).default({}),
});

export const brandIntelligenceSchema = z.object({
  audience: z.string().trim().max(500).default("Growth-focused marketing teams"),
  goals: textListSchema,
  industry: z.string().trim().min(1).max(120).default("Marketing"),
  name: z.string().trim().min(1).max(120).default("Marketly AI"),
  offer: z.string().trim().max(800).default("AI-powered marketing intelligence"),
  tone: z.string().trim().max(240).default("strategic, specific, confident"),
});

const defaultAnalyticsPoint = {
  anomaliesDetected: [],
  campaignName: "Campaign",
  clicks: 0,
  conversions: 0,
  impressions: 0,
  period: "Current period",
  recommendations: [],
  trends: [],
};

const defaultBrand = {
  audience: "Growth-focused marketing teams",
  goals: [],
  industry: "Marketing",
  name: "Marketly AI",
  offer: "AI-powered marketing intelligence",
  tone: "strategic, specific, confident",
};

const defaultMemory = {
  preferredCaptions: [],
  preferredHooks: [],
  preferredStyles: [],
  previousConversations: [],
  previousRecommendations: [],
  successfulCampaigns: [],
  successfulCreatives: [],
  successfulPrompts: [],
  userPatterns: {},
};

export const marketingStrategyRequestSchema = z.object({
  analytics: z.array(marketingAnalyticsPointSchema).min(1).max(24).default([defaultAnalyticsPoint]),
  brand: brandIntelligenceSchema.default(defaultBrand),
  campaigns: z.array(z.string().trim().min(1).max(180)).max(24).default([]),
  memory: marketingMemorySchema.default(defaultMemory),
  model: z.string().trim().min(2).max(200).default("mistralai/Mistral-7B-Instruct-v0.3"),
});

export const assistantChatRequestSchema = z.object({
  analytics: z.array(marketingAnalyticsPointSchema).max(24).default([]),
  brand: brandIntelligenceSchema.default(defaultBrand),
  memory: marketingMemorySchema.default(defaultMemory),
  message: z.string().trim().min(1).max(4000),
  model: z.string().trim().min(2).max(200).default("mistralai/Mistral-7B-Instruct-v0.3"),
});

export const analyticsInsightsRequestSchema = z.object({
  analytics: z.array(marketingAnalyticsPointSchema).min(1).max(24).default([defaultAnalyticsPoint]),
  brand: brandIntelligenceSchema.default(defaultBrand),
  memory: marketingMemorySchema.default(defaultMemory),
});

export type MarketingStrategyRequest = z.infer<typeof marketingStrategyRequestSchema>;
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;
export type AnalyticsInsightsRequest = z.infer<typeof analyticsInsightsRequestSchema>;
export type MarketingAnalyticsPoint = z.infer<typeof marketingAnalyticsPointSchema>;
export type MarketingMemory = z.infer<typeof marketingMemorySchema>;
export type BrandIntelligence = z.infer<typeof brandIntelligenceSchema>;
