import { z } from "zod";
const assistantTextListSchema = z.array(z.string().trim().min(1).max(240)).default([]);
const assistantAnalyticsPointSchema = z.object({
  anomaliesDetected: assistantTextListSchema,
  campaignName: z.string().trim().min(1).max(160).default("Campaign"),
  clicks: z.coerce.number().min(0).default(0),
  conversions: z.coerce.number().min(0).default(0),
  cpc: z.coerce.number().min(0).optional(),
  ctr: z.coerce.number().min(0).max(100).optional(),
  engagementRate: z.coerce.number().min(0).max(100).optional(),
  engagements: z.coerce.number().min(0).optional(),
  impressions: z.coerce.number().min(0).default(0),
  period: z.string().trim().min(1).max(80).default("Current period"),
  recommendations: assistantTextListSchema,
  revenue: z.coerce.number().min(0).optional(),
  roi: z.coerce.number().min(-100).max(10000).optional(),
  spend: z.coerce.number().min(0).optional(),
  trends: assistantTextListSchema,
});

const assistantBrandSchema = z.object({
  audience: z.string().trim().max(500).default("Growth-focused marketing teams"),
  goals: assistantTextListSchema,
  industry: z.string().trim().min(1).max(120).default("Marketing"),
  name: z.string().trim().min(1).max(120).default("Marketly AI"),
  offer: z.string().trim().max(800).default("AI-powered marketing intelligence"),
  tone: z.string().trim().max(240).default("strategic, specific, confident"),
});

const assistantMemorySchema = z.object({
  preferredCaptions: assistantTextListSchema,
  preferredHooks: assistantTextListSchema,
  preferredStyles: assistantTextListSchema,
  previousConversations: z.array(z.object({
    messages: z.array(z.object({
      role: z.enum(["assistant", "system", "user"]),
      text: z.string().trim().min(1).max(8000),
    })).default([]),
    summary: z.string().trim().max(4000).optional(),
    topic: z.string().trim().max(180).optional(),
  })).default([]),
  previousRecommendations: assistantTextListSchema,
  successfulCampaigns: assistantTextListSchema,
  successfulCreatives: z.array(z.object({
    performanceNote: z.string().trim().max(1000).optional(),
    title: z.string().trim().min(1).max(180),
  })).default([]),
  successfulPrompts: assistantTextListSchema,
  userPatterns: z.record(z.string(), z.unknown()).default({}),
});

export const aiGenerationRequestSchema = z.object({
  brandId: z.string().uuid().optional(),
  capability: z.enum(["text", "image", "video"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  mode: z.enum(["campaign", "image", "strategy", "video"]),
  model: z.string().min(2).max(200).optional(),
  prompt: z.string().min(8).max(4000),
  provider: z.enum(["mock", "openai", "claude", "huggingface"]).default("mock"),
  task: z.enum(["text-generation", "text-to-image", "image-to-video", "text-to-video"]).optional(),
  template: z.enum([
    "luxury-ads",
    "cinematic-videos",
    "product-photography",
    "minimalist-branding",
    "social-media-campaigns",
    "hooks-generation",
    "cta-generation",
  ]).optional(),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  workflow: z.enum([
    "creator-studio",
    "storyboard-generation",
    "campaign-generation",
    "video-generation",
    "analytics-recommendations",
    "ai-assistant",
  ]).optional(),
});

export const assistantChatRequestSchema = z.object({
  analytics: z.array(assistantAnalyticsPointSchema).max(24).default([]),
  brand: assistantBrandSchema.default({
    audience: "Growth-focused marketing teams",
    goals: [],
    industry: "Marketing",
    name: "Marketly AI",
    offer: "AI-powered marketing intelligence",
    tone: "strategic, specific, confident",
  }),
  brandId: z.string().optional(),
  memory: assistantMemorySchema.default({
    preferredCaptions: [],
    preferredHooks: [],
    preferredStyles: [],
    previousConversations: [],
    previousRecommendations: [],
    successfulCampaigns: [],
    successfulCreatives: [],
    successfulPrompts: [],
    userPatterns: {},
  }),
  imageData: z.string().optional(), // base64 data URL for image analysis
  message: z.string().trim().min(1).max(4000),
  model: z.string().trim().min(2).max(200).optional(),
  provider: z.enum(["mock", "openai", "claude", "huggingface"]).default("mock"),
  temperature: z.coerce.number().min(0).max(2).default(0.55),
  wantAudio: z.boolean().default(false),
});

export const assistantChatSourceSchema = z.object({
  content: z.string().trim().min(1).max(12000),
  id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  score: z.number().min(-1).max(1),
  title: z.string().trim().max(180).optional(),
});

export const assistantChatResponseSchema = z.object({
  actions: z.array(z.string()).default([]),
  answer: z.string(),
  cards: z.array(z.never()).default([]),
  followUps: z.array(z.string()).default([]),
  memoryUsed: z.boolean(),
  audio: z.string().optional(),
  model: z.string(),
  provider: z.enum(["openai", "openrouter"]),
  recommendations: z.array(z.never()).default([]),
  response: z.string(),
  sources: z.array(assistantChatSourceSchema).default([]),
});

export type AiGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;
export type AssistantChatResponse = z.infer<typeof assistantChatResponseSchema>;