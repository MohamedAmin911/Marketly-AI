import type { GenerationStatus } from "@/server/database/enums";

export type CampaignAsset = {
  alt?: string;
  mimeType?: string;
  name?: string;
  provider?: string;
  size?: number;
  storageKey?: string;
  url?: string;
};

export type CampaignAngle = {
  caption: string;
  hook: string;
  id: string;
  platform: string;
  prompt: string;
  rationale: string;
  title: string;
};

export type CampaignCreative = CampaignAsset & {
  campaignAngleId?: string;
  generationErrors: string[];
  generationStatus: GenerationStatus;
  id: string;
  prompt: string;
  title: string;
};

export type CampaignAnalytics = {
  estimatedCtr: number;
  estimatedEngagementRate: number;
  eventsAccepted: number;
  generatedAt: string;
  riskLevel: "low" | "medium" | "high";
  topPlatform: string;
};

export type CampaignRecommendation = {
  confidence: number;
  label: string;
  reason: string;
};

export type CampaignRecord = {
  analytics: CampaignAnalytics;
  angles: CampaignAngle[];
  captions: string[];
  ctaSuggestions: string[];
  creatives: CampaignCreative[];
  generationErrors: string[];
  generationStatus: GenerationStatus;
  hooks: string[];
  id: string;
  modelUsed: string;
  platforms: string[];
  productImage?: CampaignAsset;
  productTitle: string;
  prompt: string;
  recommendations: CampaignRecommendation[];
  targetAudience: string;
  title: string;
  updatedAt: string;
};
