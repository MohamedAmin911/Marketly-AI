import type { z } from "zod";

export type AIProviderName = "huggingface" | "mock" | "openai" | "claude";

export type HuggingFaceTask = "image-to-video" | "text-generation" | "text-to-image" | "text-to-video";

export type AICapability = "text" | "image" | "video";

export type AIWorkflowName =
  | "creator-studio"
  | "storyboard-generation"
  | "campaign-generation"
  | "video-generation"
  | "analytics-recommendations"
  | "ai-assistant";

export type PromptTemplateName =
  | "luxury-ads"
  | "cinematic-videos"
  | "product-photography"
  | "minimalist-branding"
  | "social-media-campaigns"
  | "hooks-generation"
  | "cta-generation";

export type AIMessage = {
  content: string;
  role: "system" | "user" | "assistant";
};

export type AIModelRequest = {
  abortSignal?: AbortSignal;
  capability?: AICapability;
  imageUrl?: string;
  maxTokens?: number;
  messages: AIMessage[];
  model?: string;
  responseFormat?: "json" | "text";
  task?: HuggingFaceTask;
  temperature?: number;
};

export type AIModelResponse = {
  finishReason?: string;
  model: string;
  provider: AIProviderName;
  raw: unknown;
  text: string;
  usage: AIUsage;
};

export type AIUsage = {
  completionTokens: number;
  costUsd: number;
  promptTokens: number;
  totalTokens: number;
};

export type BrandContext = {
  forbiddenWords: string[];
  name: string;
  preferredCTAs: string[];
  tone?: string;
  visualStyle?: string;
  voice?: string;
};

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

export type AIMemoryContext = {
  brandIdentity: BrandIdentityMemory;
  conflicts: string[];
  freshness: "fresh" | "missing" | "outdated";
  injection: string;
  isMissing: boolean;
  preferredCaptions: string[];
  preferredHooks: string[];
  preferredStyles: string[];
  previousConversations: ConversationMemory[];
  previousRecommendations: string[];
  successfulCampaigns: string[];
  successfulCreatives: CreativeMemory[];
  successfulPrompts: string[];
  userPatterns: Record<string, unknown>;
  warnings: string[];
};

export type WorkflowContext = {
  brand: BrandContext;
  memory: AIMemoryContext;
  requestId: string;
  tenantId: string;
  userId: string;
};

export type WorkflowInput = {
  brandId?: string;
  context?: Record<string, unknown>;
  model?: string;
  prompt: string;
  template?: PromptTemplateName;
  temperature?: number;
  workflow: AIWorkflowName;
};

export type WorkflowResult<TOutput = unknown> = {
  generationId: string;
  output: TOutput;
  provider: AIProviderName;
  quality: AIQualityReport;
  usage: AIUsage;
  workflow: AIWorkflowName;
};

export type AIQualityReport = {
  brandingConsistent: boolean;
  repetitionScore: number;
  warnings: string[];
};

export type ParsedAIResult<T> = {
  data: T;
  repaired: boolean;
};

export type WorkflowDefinition<TOutput> = {
  buildPrompt: (input: WorkflowInput, context: WorkflowContext) => AIMessage[];
  maxTokens: number;
  name: AIWorkflowName;
  parse: (text: string) => ParsedAIResult<TOutput>;
  schema: z.ZodType<TOutput>;
  temperature: number;
};
