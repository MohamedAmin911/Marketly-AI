import { z } from "zod";

const textListSchema = z.array(z.string().trim().min(1).max(4000)).max(24).default([]);

const brandIdentitySchema = z.object({
  audience: z.string().trim().max(500).optional(),
  forbiddenWords: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  name: z.string().trim().max(160).optional(),
  positioning: z.string().trim().max(1000).optional(),
  tone: z.string().trim().max(240).optional(),
  values: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  visualStyle: z.string().trim().max(500).optional(),
  voice: z.string().trim().max(500).optional(),
});

const conversationSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["assistant", "system", "user"]),
    text: z.string().trim().min(1).max(8000),
  })).max(24).default([]),
  summary: z.string().trim().max(4000).optional(),
  topic: z.string().trim().max(180).optional(),
});

const creativeSchema = z.object({
  format: z.string().trim().max(80).optional(),
  id: z.string().trim().max(160).optional(),
  mimeType: z.string().trim().max(120).optional(),
  performanceNote: z.string().trim().max(1000).optional(),
  title: z.string().trim().min(1).max(180),
  url: z.string().url().max(2048).optional(),
});

export const aiMemoryUpdateSchema = z.object({
  averageGenerationType: z.enum(["image", "caption", "hook", "campaign", "strategy", "storyboard", "video"]).optional(),
  brandId: z.string().optional(),
  brandIdentity: brandIdentitySchema.optional(),
  mostUsedFeatures: textListSchema.optional(),
  preferredCaptions: textListSchema.optional(),
  preferredHooks: textListSchema.optional(),
  preferredStyles: textListSchema.optional(),
  previousConversations: z.array(conversationSchema).max(12).optional(),
  previousRecommendations: textListSchema.optional(),
  previousStrategies: textListSchema.optional(),
  successfulCampaigns: textListSchema.optional(),
  successfulCreatives: z.array(creativeSchema).max(24).optional(),
  successfulPrompts: textListSchema.optional(),
  userPatterns: z.record(z.string(), z.unknown()).optional(),
});

export const aiMemoryQuerySchema = z.object({
  brandId: z.string().optional(),
});

export const personalizationRequestSchema = z.object({
  analytics: z.object({
    conversions: z.coerce.number().min(0).optional(),
    ctr: z.coerce.number().min(0).max(100).optional(),
    impressions: z.coerce.number().min(0).optional(),
    roi: z.coerce.number().min(-100).max(10000).optional(),
  }).optional(),
  basePrompt: z.string().trim().min(1).max(6000),
  brandId: z.string().optional(),
  task: z.string().trim().max(120).optional(),
});

export type AIMemoryUpdateRequest = z.infer<typeof aiMemoryUpdateSchema>;
export type AIMemoryQuery = z.infer<typeof aiMemoryQuerySchema>;
export type PersonalizationRequestBody = z.infer<typeof personalizationRequestSchema>;
