import type { BrandIntelligence, MarketingAnalyticsPoint, MarketingMemory } from "@/server/schemas/marketing-intelligence";

export const MISTRAL_7B_INSTRUCT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

export type AnalyticsContract = {
  anomaliesDetected: string[];
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  engagementRate: number;
  impressions: number;
  recommendations: string[];
  roi: number;
  trends: string[];
};

export type AnalyticsInsight = {
  description: string;
  evidence: string;
  severity: "low" | "medium" | "high";
  title: string;
  type: "trend" | "anomaly" | "opportunity" | "risk";
};

export type Recommendation = {
  action: string;
  confidence: number;
  evidence: string;
  priority: "low" | "medium" | "high";
  rationale: string;
  title: string;
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

export type PlanStep = {
  days: string;
  focus: string;
  kpi: string;
  tasks: string[];
};

export type MarketingContext = {
  analytics: AnalyticsContract;
  brand: BrandIntelligence;
  campaigns: string[];
  conflicts: string[];
  incompleteData: string[];
  memory: MarketingMemory;
  model: string;
  sourceRecords: MarketingAnalyticsPoint[];
};

export type MarketingStrategyOutput = {
  analyticsInsights: AnalyticsInsight[];
  competitors: CompetitorCard[];
  context: Pick<MarketingContext, "conflicts" | "incompleteData" | "model">;
  memorySignals: string[];
  personas: PersonaCard[];
  plan: PlanStep[];
  recommendations: Recommendation[];
  summary: string;
  swot: StrategyCard[];
};

export type AssistantChatOutput = {
  actions: string[];
  answer: string;
  cards: AnalyticsInsight[];
  followUps: string[];
  recommendations: Recommendation[];
};
