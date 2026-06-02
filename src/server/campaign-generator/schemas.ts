import { z } from "zod";

const assetSchema = z.object({
  alt: z.string().max(240).optional(),
  mimeType: z.string().max(120).optional(),
  name: z.string().max(240).optional(),
  provider: z.string().max(80).optional(),
  size: z.number().nonnegative().optional(),
  storageKey: z.string().max(512).optional(),
  url: z.string().max(15_000_000).optional(),
});

export const campaignUploadSchema = z.object({
  file: z.instanceof(File),
});

export const campaignGenerationSchema = z.object({
  brandId: z.string().uuid().optional(),
  goal: z.enum(["awareness", "conversion", "retention", "launch"]).default("conversion"),
  platforms: z.array(z.enum(["instagram", "tiktok", "facebook", "googleAds", "linkedin", "x", "youtube"])).min(1).max(5).default(["instagram", "tiktok", "facebook"]),
  productImage: assetSchema.optional(),
  productTitle: z.string().trim().min(2).max(180),
  prompt: z.string().trim().min(12).max(4000),
  style: z.enum(["cinematic", "editorial", "luxury", "social", "technical"]).default("social"),
  targetAudience: z.string().trim().min(2).max(1000),
});

export const campaignTextMutationSchema = z.object({
  campaign: z.object({
    captions: z.array(z.string()).default([]),
    hooks: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
    productTitle: z.string(),
    prompt: z.string(),
    targetAudience: z.string(),
  }),
  mode: z.enum(["captions", "hooks"]),
});

export const campaignCreativesSchema = z.object({
  campaign: z.object({
    angles: z.array(z.object({
      caption: z.string(),
      hook: z.string(),
      id: z.string(),
      platform: z.string(),
      prompt: z.string(),
      rationale: z.string(),
      title: z.string(),
    })).default([]),
    productImage: assetSchema.optional(),
    productTitle: z.string(),
    style: z.string().optional(),
  }),
});

export type CampaignGenerationInput = z.infer<typeof campaignGenerationSchema>;
export type CampaignUploadInput = z.infer<typeof campaignUploadSchema>;
export type CampaignTextMutationInput = z.infer<typeof campaignTextMutationSchema>;
export type CampaignCreativesInput = z.infer<typeof campaignCreativesSchema>;
