import type { MarketingStrategyOutput, MarketingStrategyRequest } from "@/features/marketing-strategy/types";
import { apiJson } from "@/lib/api/client";

export const defaultStrategyRequest: MarketingStrategyRequest = {
  analytics: [
    {
      campaignName: "Q4 Demand Engine",
      clicks: 4860,
      conversions: 412,
      ctr: 4.3,
      impressions: 113000,
      period: "Last 30 days",
      recommendations: ["Shift 12% of budget from broad awareness to high-intent search retargeting."],
      revenue: 146000,
      roi: 238,
      spend: 43200,
      trends: ["Search intent is rising around AI workflow automation", "LinkedIn decision-maker clicks convert 18% better than Meta clicks"],
    },
    {
      campaignName: "Manufacturing Expansion",
      clicks: 1920,
      conversions: 106,
      ctr: 2.4,
      impressions: 80000,
      period: "Last 30 days",
      recommendations: [],
      revenue: 42000,
      roi: 82,
      spend: 23100,
      trends: ["Webinar registrants show higher demo intent than cold traffic"],
    },
  ],
  brand: {
    audience: "operations and growth leaders in industrial manufacturing",
    goals: ["expand into Europe", "increase qualified demos", "reduce wasted ad spend"],
    industry: "B2B SaaS",
    name: "Nexus Dynamics",
    offer: "AI-driven workflow automation software for industrial manufacturers",
    tone: "confident, analytical, premium",
  },
  campaigns: ["Q4 Demand Engine", "Manufacturing Expansion", "Creator Retargeting"],
  memory: {
    preferredCaptions: ["Clear value first, proof second, action third."],
    preferredHooks: ["Your best campaign is usually hiding in your data."],
    preferredStyles: ["minimalist", "technical luxury", "proof-led messaging"],
    previousConversations: [],
    previousRecommendations: ["Test hooks by audience maturity."],
    successfulCampaigns: ["Q3 operations benchmark report"],
    successfulCreatives: [{ performanceNote: "Drove strong demo intent from LinkedIn operators", title: "Operations benchmark carousel" }],
    successfulPrompts: ["Write a direct LinkedIn ad for operations leaders with one measurable proof point"],
    userPatterns: {
      preferredChannel: "LinkedIn",
      reviewCadence: "weekly",
    },
  },
  model: "mistralai/Mistral-7B-Instruct-v0.3",
};

export async function generateMarketingStrategy(input: MarketingStrategyRequest): Promise<MarketingStrategyOutput> {
  return apiJson<MarketingStrategyOutput>("/api/marketing-strategy/generate", {
    body: input,
    method: "POST",
    timeoutMs: 15_000,
  });
}
