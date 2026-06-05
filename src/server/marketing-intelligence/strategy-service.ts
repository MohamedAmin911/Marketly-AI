import { generateAnalyticsInsights } from "@/server/marketing-intelligence/analytics-engine";
import { buildMarketingContext, buildMemoryInjection } from "@/server/marketing-intelligence/context-injection-service";
import { generateRecommendations } from "@/server/marketing-intelligence/recommendation-engine";
import type { AssistantChatRequest, AnalyticsInsightsRequest, MarketingStrategyRequest } from "@/server/schemas/marketing-intelligence";
import type { AssistantChatOutput, MarketingStrategyOutput } from "@/server/marketing-intelligence/types";

export async function generateMarketingStrategy(input: MarketingStrategyRequest): Promise<MarketingStrategyOutput> {
  const context = buildMarketingContext(input);
  const recommendations = generateRecommendations(context);
  const analyticsInsights = generateAnalyticsInsights(context);

  return {
    analyticsInsights,
    competitors: buildCompetitors(input.brand.industry),
    context: {
      conflicts: context.conflicts,
      incompleteData: context.incompleteData,
      model: context.model,
    },
    memorySignals: buildMemoryInjection(context.memory),
    personas: buildPersonas(input.brand),
    plan: buildPlan(input.brand.name, recommendations[0]?.title ?? "Refresh hooks before scaling"),
    recommendations,
    summary: `${input.brand.name} should focus the next 30 days on evidence-led positioning, clean analytics, and controlled campaign experiments for ${input.brand.audience}.`,
    swot: buildSwot(input, context.analytics.roi),
  };
}

export async function generateAssistantReply(input: AssistantChatRequest): Promise<AssistantChatOutput> {
  const context = buildMarketingContext({
    ...input,
    analytics: input.analytics.length
      ? input.analytics
      : [{ anomaliesDetected: [], campaignName: "Workspace baseline", clicks: 0, conversions: 0, impressions: 0, period: "Current period", recommendations: [], trends: [] }],
    campaigns: [],
  });
  const recommendations = generateRecommendations(context);
  const cards = generateAnalyticsInsights(context).slice(0, 3);
  const leadRecommendation = recommendations[0];

  return {
    actions: [
      "Analyze brand",
      "Analyze campaigns",
      "Analyze analytics",
      "Inject AI memory",
      "Generate recommendations",
      "Personalize outputs",
    ],
    answer: leadRecommendation
      ? `Based on the current Marketly AI context, I would prioritize "${leadRecommendation.title}". ${leadRecommendation.rationale} Evidence: ${leadRecommendation.evidence}.`
      : `I can help with ${input.brand.name}, but I need more analytics or campaign context before recommending budget or positioning changes.`,
    cards,
    followUps: [
      "Which campaign should I audit first?",
      "Do you want a 30-day execution plan?",
      "Should I turn these insights into ad concepts?",
    ],
    recommendations,
  };
}

export async function generateAnalyticsIntelligence(input: AnalyticsInsightsRequest) {
  const context = buildMarketingContext(input);

  return {
    contract: context.analytics,
    context: {
      conflicts: context.conflicts,
      incompleteData: context.incompleteData,
      model: context.model,
    },
    insights: generateAnalyticsInsights(context),
    recommendations: generateRecommendations(context),
  };
}

function buildSwot(input: MarketingStrategyRequest, roi: number) {
  const firstCampaign = input.campaigns[0] ?? "current campaigns";

  return [
    {
      items: [
        `${input.brand.offer} is clearly tied to ${input.brand.audience}`,
        input.memory.successfulCampaigns[0] ? `Memory shows prior traction from ${input.memory.successfulCampaigns[0]}` : "AI memory can personalize creative patterns",
        roi > 100 ? `Current ROI signal is positive at ${roi}%` : "Strategy can be rebuilt from measurable campaign data",
      ],
      title: "Strengths",
    },
    {
      items: [
        "Measurement confidence drops when CTR or ROI inputs are missing",
        "Positioning may sound broad without sharper segment-specific proof",
        `${firstCampaign} needs consistent conversion diagnostics before scaling`,
      ],
      title: "Weaknesses",
    },
    {
      items: [
        `Build segmented offers for ${input.brand.audience}`,
        "Use high-performing prompts as repeatable campaign creative systems",
        "Turn analytics trends into weekly landing page and ad tests",
      ],
      title: "Opportunities",
    },
    {
      items: [
        "Competitors with clearer proof can absorb high-intent demand",
        "Conflicting metrics can trigger poor budget automation",
        "Repeated AI outputs can fatigue audiences if memory is not deduped",
      ],
      title: "Threats",
    },
  ];
}

function buildPersonas(brand: MarketingStrategyRequest["brand"]) {
  return [
    {
      channels: ["LinkedIn", "Search", "Email"],
      goals: ["Prove ROI quickly", "Reduce campaign waste", "Prioritize high-intent segments"],
      message: `${brand.name} turns scattered campaign data into specific next actions.`,
      name: "The Revenue Operator",
      pains: ["Conflicting metrics", "Slow reporting", "Budget uncertainty"],
      role: "Marketing Operations Lead",
    },
    {
      channels: ["Webinars", "Industry newsletters", "Retargeting"],
      goals: ["Differentiate the brand", "Build trust", "Launch repeatable creative"],
      message: `${brand.offer} gives strategy teams a clear campaign narrative with measurable proof.`,
      name: "The Strategic Growth Lead",
      pains: ["Generic AI output", "Weak positioning", "Creative fatigue"],
      role: "Head of Growth",
    },
  ];
}

function buildCompetitors(industry: string) {
  return [
    {
      advantage: "Move faster with AI-personalized recommendations and memory-aware strategy.",
      gap: "Legacy platforms often summarize dashboards without producing execution plans.",
      name: `${industry} legacy suites`,
      position: "Established, dashboard-heavy, slower to personalize.",
      threatLevel: "high" as const,
    },
    {
      advantage: "Combine analytics, creative direction, and assistant workflows in one loop.",
      gap: "Point tools solve one workflow but miss cross-channel strategy context.",
      name: "Point-solution AI copy tools",
      position: "Fast content generation with limited measurement depth.",
      threatLevel: "medium" as const,
    },
    {
      advantage: "Offer lower setup cost and faster iteration than manual consulting.",
      gap: "Consultants provide nuance but do not continuously react to campaign data.",
      name: "Boutique strategy agencies",
      position: "High-touch strategy with slower operating cadence.",
      threatLevel: "medium" as const,
    },
  ];
}

function buildPlan(brandName: string, firstRecommendation: string) {
  return [
    {
      days: "Days 1-7",
      focus: "Foundation and data audit",
      kpi: "Clean analytics contract for impressions, clicks, conversions, CTR, ROI, trends, recommendations",
      tasks: ["Validate tracking", "Map active campaigns", `Lock ${brandName} positioning pillars`],
    },
    {
      days: "Days 8-14",
      focus: "Audience and competitor sprint",
      kpi: "Two personas and three competitor counter-positions approved",
      tasks: ["Write segment-specific hooks", "Audit competitor proof", "Choose top conversion objections"],
    },
    {
      days: "Days 15-23",
      focus: "Campaign experiments",
      kpi: "Three creative tests live with daily CTR and conversion review",
      tasks: [firstRecommendation, "Launch channel-specific variants", "Archive repetitive AI outputs"],
    },
    {
      days: "Days 24-30",
      focus: "Optimization and scale decision",
      kpi: "Recommendation engine produces a budget action with evidence and confidence",
      tasks: ["Review ROI by campaign", "Scale only validated winners", "Store successful prompts in AI memory"],
    },
  ];
}
