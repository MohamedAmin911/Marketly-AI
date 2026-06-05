import { z } from "zod";

export const conceptItemSchema = z.object({
  caption: z.string(),
  cta: z.string(),
  hook: z.string(),
  rationale: z.string(),
  title: z.string(),
});

export const conceptListSchema = z.object({
  items: z.array(conceptItemSchema).min(1).max(12),
  recommendations: z.array(z.string()).default([]),
  summary: z.string(),
});

export const storyboardSchema = z.object({
  recommendations: z.array(z.string()).default([]),
  scenes: z.array(
    z.object({
      cameraAngle: z.string(),
      description: z.string(),
      duration: z.number(),
      imagePrompt: z.string(),
      title: z.string(),
      transition: z.string(),
    }),
  ).min(3).max(12),
  summary: z.string(),
});

export const videoPlanSchema = z.object({
  recommendations: z.array(z.string()).default([]),
  scenes: z.array(
    z.object({
      effects: z.array(z.string()),
      sceneImages: z.array(z.string()),
      transition: z.string(),
      voiceover: z.string().optional(),
    }),
  ).min(1).max(10),
  summary: z.string(),
});

export const analyticsRecommendationSchema = z.object({
  anomalies: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).min(1),
  summary: z.string(),
  trends: z.array(z.string()).default([]),
});

export const assistantResponseSchema = z.object({
  actions: z.array(z.string()).default([]),
  answer: z.string(),
  citationsNeeded: z.boolean().default(false),
  followUps: z.array(z.string()).default([]),
});

export type ConceptListOutput = z.infer<typeof conceptListSchema>;
export type StoryboardOutput = z.infer<typeof storyboardSchema>;
export type VideoPlanOutput = z.infer<typeof videoPlanSchema>;
export type AnalyticsRecommendationOutput = z.infer<typeof analyticsRecommendationSchema>;
export type AssistantOutput = z.infer<typeof assistantResponseSchema>;
