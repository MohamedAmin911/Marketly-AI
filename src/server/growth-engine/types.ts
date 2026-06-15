import type { UploadedImageKitAsset } from "@/server/services/imagekit-service";

export const GROWTH_PROJECT_STATUSES = [
  "draft",
  "strategy_ready",
  "campaigns_ready",
  "storyboards_ready",
  "completed",
  "failed",
] as const;

export type GrowthProjectStatus = (typeof GROWTH_PROJECT_STATUSES)[number];

export type GrowthEngineRequest = {
  audience: string;
  brandName: string;
  brief: string;
  goal: string;
  industry: string;
  productImage?: File;
};

export type GrowthEngineAsset = UploadedImageKitAsset;

export type N8nGrowthEngineResponse = {
  campaigns: Record<string, unknown>[];
  competitors: Record<string, unknown>[];
  imageAssets?: Record<string, unknown>[];
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  status?: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy: Record<string, unknown> | string | unknown[] | null;
  videoAssets?: Record<string, unknown>[];
};

export type N8nGrowthProjectResponse = {
  projectId: string;
  success: boolean;
};

export type GrowthProjectRecord = {
  audience: string;
  brandName: string;
  brief: string;
  campaigns: Record<string, unknown>[];
  competitors: Record<string, unknown>[];
  createdAt: string;
  goal: string;
  id: string;
  industry: string;
  lastError?: string;
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  productImage: GrowthEngineAsset | null;
  status: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy: Record<string, unknown> | string | unknown[] | null;
  updatedAt: string;
  userId: string;
};

export type GrowthEngineApiResponse = {
  project: GrowthProjectRecord;
};


