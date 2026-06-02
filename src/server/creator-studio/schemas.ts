import { z } from "zod";

export const creatorModeSchema = z.enum(["placement", "reference", "background", "lifestyle", "studio"]);
export const creatorQualitySchema = z.enum(["draft", "standard", "high", "ultra"]);

export const creatorUploadSchema = z.object({
  file: z.instanceof(File),
  purpose: z.enum(["product", "reference"]).default("product"),
});

export const creatorGenerationSchema = z.object({
  angle: z.enum(["eye", "macro", "aerial", "flatlay", "three-quarter"]).default("eye"),
  background: z.string().max(160).default("premium dark studio"),
  brandId: z.string().uuid().optional(),
  lighting: z.enum(["day", "studio", "night", "softbox", "neon"]).default("studio"),
  mode: creatorModeSchema.default("studio"),
  negativePrompt: z.string().max(1200).optional(),
  productImage: z.object({
    mimeType: z.string(),
    name: z.string(),
    size: z.number(),
    url: z.string(),
  }),
  prompt: z.string().trim().min(8).max(4000),
  quality: creatorQualitySchema.default("high"),
  referenceImage: z.object({
    mimeType: z.string(),
    name: z.string(),
    size: z.number(),
    url: z.string(),
  }).optional(),
  variations: z.coerce.number().int().min(1).max(8).default(4),
});

export const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const favoriteMutationSchema = z.object({
  favorited: z.boolean().default(true),
  generationId: z.string().min(1),
});

export const generationIdSchema = z.object({
  generationId: z.string().min(1),
});

export type CreatorGenerationInput = z.infer<typeof creatorGenerationSchema>;
export type CreatorUploadInput = z.infer<typeof creatorUploadSchema>;
