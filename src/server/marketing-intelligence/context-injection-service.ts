import type { BrandIntelligence, MarketingAnalyticsPoint, MarketingMemory } from "@/server/schemas/marketing-intelligence";
import { MISTRAL_7B_INSTRUCT_MODEL, type AnalyticsContract, type MarketingContext } from "@/server/marketing-intelligence/types";

type BuildMarketingContextInput = {
  analytics: MarketingAnalyticsPoint[];
  brand: BrandIntelligence;
  campaigns?: string[];
  memory: MarketingMemory;
  model?: string;
};

export function buildMarketingContext(input: BuildMarketingContextInput): MarketingContext {
  const normalized = normalizeAnalytics(input.analytics);

  return {
    analytics: normalized.analytics,
    brand: input.brand,
    campaigns: input.campaigns ?? [],
    conflicts: normalized.conflicts,
    incompleteData: normalized.incompleteData,
    memory: input.memory,
    model: input.model || MISTRAL_7B_INSTRUCT_MODEL,
    sourceRecords: input.analytics,
  };
}

export function buildMemoryInjection(memory: MarketingMemory): string[] {
  return [
    ...memory.preferredStyles.map((style) => `Style preference: ${style}`),
    ...memory.preferredHooks.map((hook) => `Hook preference: ${hook}`),
    ...memory.preferredCaptions.map((caption) => `Caption preference: ${caption}`),
    ...memory.successfulCampaigns.map((campaign) => `Successful campaign pattern: ${campaign}`),
    ...memory.successfulPrompts.map((prompt) => `Successful prompt pattern: ${prompt}`),
    ...memory.successfulCreatives.map((creative) => `Successful creative: ${creative.title}${creative.performanceNote ? ` (${creative.performanceNote})` : ""}`),
    ...memory.previousRecommendations.map((recommendation) => `Avoid repeating recommendation: ${recommendation}`),
    ...Object.entries(memory.userPatterns).map(([key, value]) => `User pattern ${key}: ${String(value)}`),
  ].slice(0, 12);
}

function normalizeAnalytics(records: MarketingAnalyticsPoint[]): {
  analytics: AnalyticsContract;
  conflicts: string[];
  incompleteData: string[];
} {
  const conflicts: string[] = [];
  const incompleteData = new Set<string>();
  let impressions = 0;
  let clicks = 0;
  let conversions = 0;
  let engagements = 0;
  let spend = 0;
  let revenue = 0;
  const anomaliesDetected = new Set<string>();
  const trends = new Set<string>();
  const recommendations = new Set<string>();
  const roiValues: number[] = [];

  records.forEach((record) => {
    impressions += record.impressions;
    clicks += record.clicks;
    conversions += record.conversions;
    engagements += record.engagements ?? 0;
    spend += record.spend ?? 0;
    revenue += record.revenue ?? 0;

    if (!record.impressions) incompleteData.add(`${record.campaignName}: missing impressions`);
    if (record.ctr === undefined) incompleteData.add(`${record.campaignName}: missing ctr`);
    if (record.cpc === undefined && record.spend === undefined) incompleteData.add(`${record.campaignName}: missing cpc inputs`);
    if (record.engagementRate === undefined && record.engagements === undefined) incompleteData.add(`${record.campaignName}: missing engagement inputs`);
    if (record.roi === undefined && (record.spend === undefined || record.revenue === undefined)) incompleteData.add(`${record.campaignName}: missing roi inputs`);

    if (record.clicks > record.impressions && record.impressions > 0) conflicts.push(`${record.campaignName}: clicks exceed impressions`);
    if (record.conversions > record.clicks && record.clicks > 0) conflicts.push(`${record.campaignName}: conversions exceed clicks`);
    record.anomaliesDetected.forEach((anomaly) => anomaliesDetected.add(`${record.campaignName}: ${anomaly}`));

    const derivedCtr = record.impressions > 0 ? (record.clicks / record.impressions) * 100 : 0;
    if (record.ctr !== undefined && Math.abs(record.ctr - derivedCtr) > 0.75) {
      conflicts.push(`${record.campaignName}: supplied CTR ${record.ctr.toFixed(2)}% conflicts with derived ${derivedCtr.toFixed(2)}%`);
    }
    const derivedCpc = record.clicks > 0 && record.spend !== undefined ? record.spend / record.clicks : 0;
    if (record.cpc !== undefined && derivedCpc > 0 && Math.abs(record.cpc - derivedCpc) > 0.5) {
      conflicts.push(`${record.campaignName}: supplied CPC ${record.cpc.toFixed(2)} conflicts with derived ${derivedCpc.toFixed(2)}`);
    }
    const derivedEngagementRate = record.impressions > 0 && record.engagements !== undefined ? (record.engagements / record.impressions) * 100 : 0;
    if (record.engagementRate !== undefined && derivedEngagementRate > 0 && Math.abs(record.engagementRate - derivedEngagementRate) > 1) {
      conflicts.push(`${record.campaignName}: supplied engagement rate ${record.engagementRate.toFixed(2)}% conflicts with derived ${derivedEngagementRate.toFixed(2)}%`);
    }

    if (record.roi !== undefined) roiValues.push(record.roi);
    record.trends.forEach((trend) => trends.add(trend));
    record.recommendations.forEach((recommendation) => recommendations.add(recommendation));
  });

  const ctr = impressions > 0 ? round((clicks / impressions) * 100) : 0;
  const cpc = clicks > 0 ? round(spend / clicks) : 0;
  const engagementRate = impressions > 0 ? round((engagements / impressions) * 100) : 0;
  const roi = spend > 0 ? round(((revenue - spend) / spend) * 100) : round(average(roiValues));

  return {
    analytics: {
      anomaliesDetected: [...anomaliesDetected, ...conflicts],
      clicks,
      conversions,
      cpc,
      ctr,
      engagementRate,
      impressions,
      recommendations: [...recommendations],
      roi,
      trends: [...trends],
    },
    conflicts,
    incompleteData: [...incompleteData],
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
