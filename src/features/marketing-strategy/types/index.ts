export type StrategyAnalyticsPoint = {
  campaignName: string;
  clicks: number;
  conversions: number;
  ctr?: number;
  impressions: number;
  period: string;
  recommendations: string[];
  revenue?: number;
  roi?: number;
  spend?: number;
  trends: string[];
};

export type StrategyBrand = {
  audience: string;
  goals: string[];
  industry: string;
  name: string;
  offer: string;
  tone: string;
};

export type StrategyMemory = {
  preferredCaptions: string[];
  preferredHooks: string[];
  preferredStyles: string[];
  previousConversations: {
    messages: {
      role: "assistant" | "system" | "user";
      text: string;
    }[];
    summary?: string;
    topic?: string;
  }[];
  previousRecommendations: string[];
  successfulCampaigns: string[];
  successfulCreatives: {
    performanceNote?: string;
    title: string;
  }[];
  successfulPrompts: string[];
  userPatterns: Record<string, unknown>;
};

export type StrategyCard = {
  items: string[];
  title: string;
};

export type PersonaCard = {
  channels: string[];
  goals: string[];
  message: string;
  name: string;
  pains: string[];
  role: string;
};

export type CompetitorCard = {
  advantage: string;
  gap: string;
  name: string;
  position: string;
  threatLevel: "low" | "medium" | "high";
};

export type RecommendationCard = {
  action: string;
  confidence: number;
  evidence: string;
  priority: "low" | "medium" | "high";
  rationale: string;
  title: string;
};

export type AnalyticsInsightCard = {
  description: string;
  evidence: string;
  severity: "low" | "medium" | "high";
  title: string;
  type: "trend" | "anomaly" | "opportunity" | "risk";
};

export type PlanStep = {
  days: string;
  focus: string;
  kpi: string;
  tasks: string[];
};

export type MarketingStrategyRequest = {
  analytics: StrategyAnalyticsPoint[];
  brand: StrategyBrand;
  campaigns: string[];
  memory: StrategyMemory;
  model?: string;
};

export type MarketingStrategyOutput = {
  analyticsInsights: AnalyticsInsightCard[];
  competitors: CompetitorCard[];
  context: {
    conflicts: string[];
    incompleteData: string[];
    model: string;
  };
  memorySignals: string[];
  personas: PersonaCard[];
  plan: PlanStep[];
  recommendations: RecommendationCard[];
  summary: string;
  swot: StrategyCard[];
};
