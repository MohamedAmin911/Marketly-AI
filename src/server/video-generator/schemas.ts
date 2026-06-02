import { z } from "zod";

export const videoGenerationSchema = z.object({
  productImage: z.instanceof(File),
  prompt: z.string().trim().min(12).max(4000),
  selectedStyle: z.string().trim().min(2).max(80),
});

export const videoStatusQuerySchema = z.object({
  id: z.string().min(1),
});

export type VideoGenerationInput = z.infer<typeof videoGenerationSchema>;
