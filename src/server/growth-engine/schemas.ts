import { z } from "zod";

import { GROWTH_PROJECT_STATUSES } from "@/server/growth-engine/types";

const stringField = (max: number) => z.string().trim().min(1).max(max);
const recordSchema = z.record(z.string(), z.unknown());

export const growthEngineRequestSchema = z.object({
  audience: stringField(500),
  brandName: stringField(120),
  brief: stringField(4000),
  goal: stringField(240),
  industry: stringField(120),
  productImage: z.instanceof(File),
});

const n8nAssetSchema = recordSchema;

export const n8nGrowthEngineResponseSchema = z.object({
  campaigns: z.array(recordSchema).default([]),
  competitors: z.array(recordSchema).default([]),
  imageAssets: z.array(n8nAssetSchema).default([]),
  marketingAngles: z.array(z.union([recordSchema, z.string().trim().min(1)])).default([]),
  personas: z.array(recordSchema).default([]),
  status: z.enum(GROWTH_PROJECT_STATUSES).optional(),
  storyboards: z.array(recordSchema).default([]),
  strategy: z.union([recordSchema, z.string().trim().min(1)]).nullable().default(null),
  videoAssets: z.array(n8nAssetSchema).default([]),
});

export type GrowthEngineRequestInput = z.infer<typeof growthEngineRequestSchema>;
export type N8nGrowthEngineOutput = z.infer<typeof n8nGrowthEngineResponseSchema>;
