import { z } from "zod";

export const uploadRequestSchema = z.object({
  file: z.instanceof(File),
  purpose: z.enum(["brand_asset", "campaign_source", "generated_output"]),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
