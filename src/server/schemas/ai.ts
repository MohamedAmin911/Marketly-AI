import { z } from "zod";

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

export type AiGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
