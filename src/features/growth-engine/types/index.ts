import type { MarketingStrategyOutput } from "@/features/marketing-strategy/types";
import type { SocialCampaignRecord } from "@/features/campaign-generator/types";
import type { CinematicStoryboardResult } from "@/features/storyboard/types";
import type { VideoRecord } from "@/features/video-generator/types";

export type GrowthEngineStage =
  | "Draft"
  | "Strategy Generated"
  | "Campaigns Generated"
  | "Storyboards Generated"
  | "Images Generated"
  | "Videos Generated";

export type SectionStatus = "empty" | "loading" | "success" | "error";

export type SectionState<T> = {
  data?: T;
  error?: string;
  status: SectionStatus;
};

export type GrowthEngineForm = {
  brandBrief: string;
  brandName: string;
  industry: string;
  marketingGoal: string;
  productImage: File | null;
  targetAudience: string;
};

export type StrategySummaryData = Pick<
  MarketingStrategyOutput,
  "competitors" | "recommendations" | "summary" | "swot"
>;

export type PersonasData = MarketingStrategyOutput["personas"];
export type CampaignConceptsData = SocialCampaignRecord;
export type StoryboardsData = CinematicStoryboardResult;
export type AssetStatusData = SocialCampaignRecord;
export type VideoStatusData = VideoRecord;

export type GrowthProjectBackendStatus =
  | "draft"
  | "strategy_ready"
  | "campaigns_ready"
  | "storyboards_ready"
  | "images_generating"
  | "images_ready"
  | "videos_generating"
  | "videos_ready"
  | "completed"
  | "failed";

export type GrowthEngineAsset = {
  alt: string;
  fileId?: string;
  height?: number;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  provider?: string;
  size?: number;
  storageKey: string;
  thumbnailUrl?: string;
  url: string;
  width?: number;
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
  lastError?: string;
  marketingAngles: Array<Record<string, unknown> | string>;
  personas: Record<string, unknown>[];
  productImage: GrowthEngineAsset | null;
  status: GrowthProjectBackendStatus;
  storyboards: Array<Record<string, unknown> | Array<Record<string, unknown>>>;
  strategy: Array<unknown> | Record<string, unknown> | string | null;
  updatedAt: string;
  userId: string;
  videoAssets: Record<string, unknown>[];
};

export type GrowthEngineApiResponse = {
  project: GrowthProjectRecord;
};

export type GrowthEngineSubmitRequest = {
  audience: string;
  brandName: string;
  brief: string;
  goal: string;
  industry: string;
  productImage?: File;
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
