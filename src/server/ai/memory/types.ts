import type { ContentType } from "@/server/database/enums";

export type BrandIdentityMemory = {
  audience?: string;
  forbiddenWords: string[];
  name?: string;
  positioning?: string;
  tone?: string;
  values: string[];
  visualStyle?: string;
  voice?: string;
};

export type ConversationMemory = {
  messages: {
    role: "assistant" | "system" | "user";
    text: string;
  }[];
  summary?: string;
  topic?: string;
};

export type CreativeMemory = {
  format?: string;
  id?: string;
  mimeType?: string;
  performanceNote?: string;
  title: string;
  url?: string;
};

export type UserBehaviorPatterns = Record<string, unknown>;

export type AIMemoryRecord = {
  averageGenerationType?: ContentType;
  brandId?: string;
  brandIdentity: BrandIdentityMemory;
  conflicts: string[];
  freshness: "fresh" | "missing" | "outdated";
  isMissing: boolean;
  lastUpdatedAt?: string;
  mostUsedFeatures: string[];
  preferredCaptions: string[];
  preferredHooks: string[];
  preferredStyles: string[];
  previousConversations: ConversationMemory[];
  previousRecommendations: string[];
  previousStrategies: string[];
  successfulCampaigns: string[];
  successfulCreatives: CreativeMemory[];
  successfulPrompts: string[];
  userId: string;
  userPatterns: UserBehaviorPatterns;
  warnings: string[];
};

export type MemoryUpdateInput = {
  averageGenerationType?: ContentType;
  brandId?: string;
  brandIdentity?: Partial<BrandIdentityMemory>;
  mostUsedFeatures?: string[];
  preferredCaptions?: string[];
  preferredHooks?: string[];
  preferredStyles?: string[];
  previousConversations?: ConversationMemory[];
  previousRecommendations?: string[];
  previousStrategies?: string[];
  successfulCampaigns?: string[];
  successfulCreatives?: CreativeMemory[];
  successfulPrompts?: string[];
  userId: string;
  userPatterns?: UserBehaviorPatterns;
};

export type PersonalizationRequest = {
  analytics?: {
    conversions?: number;
    ctr?: number;
    impressions?: number;
    roi?: number;
  };
  basePrompt: string;
  brandId?: string;
  task?: string;
  userId: string;
};

export type PersonalizationResult = {
  confidence: number;
  injectedContext: string;
  personalizationRules: string[];
  prompt: string;
  suppressedRepeats: string[];
  warnings: string[];
};
