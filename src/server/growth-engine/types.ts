import type { UploadedImageKitAsset } from "@/server/services/imagekit-service";

export const GROWTH_PROJECT_STATUSES = [
  "draft",
  "strategy_ready",
  "campaigns_ready",
  "storyboards_ready",
  "images_ready",
  "videos_ready",
] as const;

export type GrowthProjectStatus = (typeof GROWTH_PROJECT_STATUSES)[number];

export type GrowthEngineRequest = {
  audience: string;
  brandName: string;
  brief: string;
  goal: string;
  industry: string;
  productImage: File;
};

export type GrowthEngineAsset = UploadedImageKitAsset;

export type N8nGrowthEngineResponse = {
  campaigns: Record<string, unknown>[];
  competitors: Record<string, unknown>[];
  imageAssets: Record<string, unknown>[];
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  status?: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy: Record<string, unknown> | string | null;
  videoAssets: Record<string, unknown>[];
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
  imageAssets: Record<string, unknown>[];
  industry: string;
  generationJobs: Record<string, unknown>[];
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  productImage: GrowthEngineAsset | null;
  status: GrowthProjectStatus;
  storyboards: Record<string, unknown>[];
  strategy: Record<string, unknown> | string | null;
  updatedAt: string;
  userId: string;
  videoAssets: Record<string, unknown>[];
};

export type GrowthEngineApiResponse = {
  project: GrowthProjectRecord;
};

export type GrowthGenerationKind = "visual_assets" | "video_assets";
export type GrowthGenerationJobStatus = "queued" | "running" | "completed" | "partial_success" | "failed";

export type GrowthGenerationJob = {
  completed: number;
  createdAt: string;
  errors: string[];
  finishedAt?: string;
  id: string;
  kind: GrowthGenerationKind;
  logs: string[];
  projectId: string;
  status: GrowthGenerationJobStatus;
  total: number;
  updatedAt: string;
  userId: string;
};

export type GrowthGenerationJobResponse = {
  duplicate?: boolean;
  job: GrowthGenerationJob;
};

export type GrowthGenerationProgressResponse = {
  job?: GrowthGenerationJob;
  project: GrowthProjectRecord;
};
