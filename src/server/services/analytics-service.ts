import { Types } from "mongoose";

import type { AnalyticsRecommendation } from "@/features/analytics/types";
import { AnalyticsModel, CampaignModel, connectToDatabase } from "@/server/database";
import type { AuthContext } from "@/server/security/auth-guard";
import type { AnalyticsEventsRequest, AnalyticsQuery } from "@/server/schemas/analytics";

type CampaignStatus = "active" | "draft" | "paused";

type AnalyticsSourceRecord = {
  campaignId: string;
  campaignName: string;
  channel: "Google Ads" | "Instagram" | "LinkedIn" | "TikTok";
  clicks?: number;
  conversions?: number;
  date: string;
  engagements?: number;
  impressions?: number;
  revenue?: number;
  spend?: number;
  status: CampaignStatus;
};

type AnalyticsContract = {
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

type AggregatedCampaign = {
  campaignId: string;
  campaignName: string;
  channel: string;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  impressions: number;
  roi: number;
  spend: number;
  status: CampaignStatus;
};

type TrendPoint = {
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  engagementRate: number;
  impressions: number;
  period: string;
  revenue: number;
  roi: number;
  spend: number;
};

type AnalyticsReport = {
  executiveSummary: string;
  generatedAt: string;
  sections: {
    findings: string[];
    title: string;
  }[];
};

type StoredAnalyticsRecord = {
  _id: unknown;
  campaignId?: unknown;
  clicks?: number;
  conversions?: number;
  cpc?: number;
  createdAt?: unknown;
  engagementRate?: number;
  impressions?: number;
  roi?: number;
};

type StoredCampaignRecord = {
  _id: unknown;
  clicks?: number;
  conversions?: number;
  createdAt?: unknown;
  engagementRate?: number;
  impressions?: number;
  name?: string;
  platforms?: string[];
  roi?: number;
  status?: string;
};

const demoSourceRecords: AnalyticsSourceRecord[] = [
  { campaignId: "holiday-push", campaignName: "Q4 Holiday Push", channel: "Google Ads", clicks: 8420, conversions: 1320, date: daysAgo(3), engagements: 18100, impressions: 192000, revenue: 184200, spend: 45200, status: "active" },
  { campaignId: "creator-retargeting", campaignName: "Creator Retargeting", channel: "Instagram", clicks: 5120, conversions: 810, date: daysAgo(7), engagements: 22900, impressions: 118500, revenue: 96750, spend: 27100, status: "active" },
  { campaignId: "launch-sequence", campaignName: "Launch Sequence 03", channel: "LinkedIn", clicks: 2830, conversions: 420, date: daysAgo(14), engagements: 6200, impressions: 74400, revenue: 71200, spend: 18400, status: "paused" },
  { campaignId: "video-spark", campaignName: "Video Spark Test", channel: "TikTok", clicks: 4230, conversions: 186, date: daysAgo(18), engagements: 41300, impressions: 146000, revenue: 25100, spend: 22900, status: "active" },
  { campaignId: "search-intent", campaignName: "Search Intent Sprint", channel: "Google Ads", clicks: 3920, conversions: 690, date: daysAgo(24), engagements: 7300, impressions: 68200, revenue: 118600, spend: 24600, status: "active" },
  { campaignId: "zero-impression-import", campaignName: "Imported Partner Report", channel: "LinkedIn", clicks: 120, conversions: 18, date: daysAgo(28), engagements: 0, impressions: 0, revenue: 4200, spend: 0, status: "draft" },
  { campaignId: "social-revival", campaignName: "Social Revival", channel: "Instagram", clicks: 1480, conversions: 132, date: daysAgo(38), engagements: 14900, impressions: 93500, revenue: 20800, spend: 14100, status: "paused" },
  { campaignId: "retail-90", campaignName: "Retail 90-Day Lift", channel: "TikTok", clicks: 6350, conversions: 705, date: daysAgo(64), engagements: 50800, impressions: 225000, revenue: 88400, spend: 38100, status: "active" },
];

export async function ingestAnalyticsEvents(input: AnalyticsEventsRequest, auth: AuthContext) {
  return {
    accepted: input.events.length,
    events: input.events.map((event: AnalyticsEventsRequest["events"][number]) => ({
      event: event.event,
      occurredAt: event.occurredAt,
      validation: "accepted",
    })),
    tenantId: auth.user.tenantId,
  };
}

export async function getAnalyticsOverview(query: AnalyticsQuery, auth?: AuthContext) {
  const sourceRecords = await getSourceRecords(auth);
  const records = filterRecords(query, sourceRecords);
  const contract = aggregateContract(records);
  const previous = aggregateContract(getPreviousRecords(query, sourceRecords));
  const campaigns = aggregateCampaigns(records);
  const report = buildReport(contract, campaigns);
  const recommendations = buildRecommendations(contract, campaigns);

  return {
    campaigns,
    contract: {
      ...contract,
      recommendations: recommendations.map((recommendation) => recommendation.title),
    },
    filters: {
      campaign: query.campaign,
      channel: query.channel,
      range: query.range,
      status: query.status,
    },
    filterOptions: {
      campaigns: unique(sourceRecords.map((record) => record.campaignName)),
      channels: unique(sourceRecords.map((record) => record.channel)),
      statuses: unique(sourceRecords.map((record) => record.status)),
    },
    metrics: buildMetricCards(contract, previous),
    recommendations,
    report,
    sources: buildTrafficSources(records),
    trends: buildTrendSeries(records),
  };
}

export async function getAnalyticsReport(query: AnalyticsQuery, auth?: AuthContext) {
  const overview = await getAnalyticsOverview(query, auth);

  return overview.report;
}

export async function getAnalyticsRecommendations(query: AnalyticsQuery, auth?: AuthContext) {
  const overview = await getAnalyticsOverview(query, auth);

  return {
    anomaliesDetected: overview.contract.anomaliesDetected,
    recommendations: overview.recommendations,
  };
}

async function getSourceRecords(auth?: AuthContext): Promise<AnalyticsSourceRecord[]> {
  const userId = auth ? toObjectId(auth.user.sub) : null;

  if (!userId) return auth ? [] : demoSourceRecords;

  await connectToDatabase();

  const [analytics, campaigns] = await Promise.all([
    AnalyticsModel.find({ userId }).sort({ createdAt: -1 }).limit(250).lean(),
    CampaignModel.find({ userId }).sort({ createdAt: -1 }).limit(250).lean(),
  ]);

  return [
    ...(analytics as StoredAnalyticsRecord[]).map((record: StoredAnalyticsRecord): AnalyticsSourceRecord => ({
      campaignId: String(record.campaignId ?? record._id),
      campaignName: `Analytics ${String(record._id).slice(-6)}`,
      channel: "Google Ads",
      clicks: record.clicks,
      conversions: record.conversions,
      date: toIsoDate(record.createdAt),
      engagements: Math.round((safeMetric(record.engagementRate) / 100) * safeMetric(record.impressions)),
      impressions: record.impressions,
      revenue: safeMetric(record.roi) > 0 ? safeMetric(record.cpc) * safeMetric(record.clicks) * (1 + safeMetric(record.roi) / 100) : 0,
      spend: safeMetric(record.cpc) * safeMetric(record.clicks),
      status: "active",
    })),
    ...(campaigns as StoredCampaignRecord[]).map((campaign: StoredCampaignRecord): AnalyticsSourceRecord => ({
      campaignId: String(campaign._id),
      campaignName: campaign.name ?? "Campaign",
      channel: normalizeChannel(campaign.platforms?.[0]),
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      date: toIsoDate(campaign.createdAt),
      engagements: Math.round((safeMetric(campaign.engagementRate) / 100) * safeMetric(campaign.impressions)),
      impressions: campaign.impressions,
      revenue: safeMetric(campaign.roi) > 0 ? safeMetric(campaign.clicks) * (1 + safeMetric(campaign.roi) / 100) : 0,
      spend: campaign.clicks,
      status: campaign.status === "paused" ? "paused" : campaign.status === "draft" ? "draft" : "active",
    })),
  ];
}

function filterRecords(query: AnalyticsQuery, sourceRecords: AnalyticsSourceRecord[]): AnalyticsSourceRecord[] {
  const now = Date.now();
  const earliest = query.range === "all" ? 0 : now - rangeToMs(query.range);
  const from = query.from ? Date.parse(query.from) : earliest;
  const to = query.to ? Date.parse(query.to) : now;

  return sourceRecords.filter((record) => {
    const timestamp = Date.parse(record.date);

    return (
      timestamp >= from &&
      timestamp <= to &&
      matchesFilter(query.channel, record.channel) &&
      matchesFilter(query.campaign, record.campaignName) &&
      matchesFilter(query.status, record.status)
    );
  });
}

function getPreviousRecords(query: AnalyticsQuery, sourceRecords: AnalyticsSourceRecord[]): AnalyticsSourceRecord[] {
  if (query.range === "all") return sourceRecords.slice(0, 3);

  const currentWindow = rangeToMs(query.range);
  const now = Date.now();
  const previousStart = now - currentWindow * 2;
  const previousEnd = now - currentWindow;

  return sourceRecords.filter((record) => {
    const timestamp = Date.parse(record.date);

    return timestamp >= previousStart && timestamp < previousEnd && matchesFilter(query.channel, record.channel) && matchesFilter(query.campaign, record.campaignName);
  });
}

function aggregateContract(records: AnalyticsSourceRecord[]): AnalyticsContract {
  let clicks = 0;
  let conversions = 0;
  let engagements = 0;
  let impressions = 0;
  let revenue = 0;
  let spend = 0;
  const anomaliesDetected = new Set<string>();

  records.forEach((record) => {
    const recordImpressions = safeMetric(record.impressions);
    const recordClicks = safeMetric(record.clicks);
    const recordConversions = safeMetric(record.conversions);
    const recordEngagements = safeMetric(record.engagements);
    const recordSpend = safeMetric(record.spend);
    const recordRevenue = safeMetric(record.revenue);

    impressions += recordImpressions;
    clicks += recordClicks;
    conversions += recordConversions;
    engagements += recordEngagements;
    spend += recordSpend;
    revenue += recordRevenue;

    if (record.impressions === undefined || record.clicks === undefined || record.conversions === undefined) {
      anomaliesDetected.add(`${record.campaignName}: incomplete analytics import`);
    }
    if (recordClicks > recordImpressions && recordImpressions > 0) anomaliesDetected.add(`${record.campaignName}: clicks exceed impressions`);
    if (recordClicks > 0 && recordImpressions === 0) anomaliesDetected.add(`${record.campaignName}: clicks exist with zero impressions`);
    if (recordConversions > recordClicks && recordClicks > 0) anomaliesDetected.add(`${record.campaignName}: conversions exceed clicks`);
    if (recordRevenue > 0 && recordSpend === 0) anomaliesDetected.add(`${record.campaignName}: revenue exists with zero spend`);
  });

  const ctr = percentage(clicks, impressions);
  const roi = spend > 0 ? round(((revenue - spend) / spend) * 100) : 0;
  const cpc = clicks > 0 ? round(spend / clicks) : 0;
  const engagementRate = percentage(engagements, impressions);

  return {
    anomaliesDetected: [...anomaliesDetected],
    clicks,
    conversions,
    cpc,
    ctr,
    engagementRate,
    impressions,
    recommendations: [],
    roi,
    trends: buildTrendLabels({ clicks, conversions, cpc, ctr, engagementRate, impressions, roi }),
  };
}

function aggregateCampaigns(records: AnalyticsSourceRecord[]): AggregatedCampaign[] {
  const byCampaign = new Map<string, AnalyticsSourceRecord[]>();
  records.forEach((record) => byCampaign.set(record.campaignId, [...(byCampaign.get(record.campaignId) ?? []), record]));

  return [...byCampaign.entries()]
    .map(([campaignId, campaignRecords]) => {
      const contract = aggregateContract(campaignRecords);
      const first = campaignRecords[0];

      return {
        campaignId,
        campaignName: first.campaignName,
        channel: first.channel,
        clicks: contract.clicks,
        conversions: contract.conversions,
        cpc: contract.cpc,
        ctr: contract.ctr,
        impressions: contract.impressions,
        roi: contract.roi,
        spend: campaignRecords.reduce((total, record) => total + safeMetric(record.spend), 0),
        status: first.status,
      };
    })
    .sort((a, b) => b.conversions - a.conversions);
}

function buildMetricCards(current: AnalyticsContract, previous: AnalyticsContract) {
  return [
    metricCard("impressions", "Impressions", current.impressions, previous.impressions, "number"),
    metricCard("clicks", "Clicks", current.clicks, previous.clicks, "number"),
    metricCard("conversions", "Conversions", current.conversions, previous.conversions, "number"),
    metricCard("ctr", "CTR", current.ctr, previous.ctr, "percent"),
    metricCard("roi", "ROI", current.roi, previous.roi, "percent"),
    metricCard("cpc", "CPC", current.cpc, previous.cpc, "currency", true),
    metricCard("engagementRate", "Engagement Rate", current.engagementRate, previous.engagementRate, "percent"),
  ];
}

function metricCard(key: string, label: string, raw: number, previous: number, format: "currency" | "number" | "percent", inverse = false) {
  const delta = previous > 0 ? round(((raw - previous) / previous) * 100) : raw > 0 ? 100 : 0;
  const improved = inverse ? delta <= 0 : delta >= 0;

  return {
    delta,
    format,
    key,
    label,
    raw,
    tone: Math.abs(delta) < 1 ? "neutral" : improved ? "success" : "danger",
    value: formatMetric(raw, format),
  };
}

function buildTrendSeries(records: AnalyticsSourceRecord[]): TrendPoint[] {
  const byPeriod = new Map<string, AnalyticsSourceRecord[]>();

  records.forEach((record) => {
    const period = new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(new Date(record.date));
    byPeriod.set(period, [...(byPeriod.get(period) ?? []), record]);
  });

  return [...byPeriod.entries()].map(([period, periodRecords]) => {
    const contract = aggregateContract(periodRecords);

    return {
      clicks: contract.clicks,
      conversions: contract.conversions,
      cpc: contract.cpc,
      ctr: contract.ctr,
      engagementRate: contract.engagementRate,
      impressions: contract.impressions,
      period,
      revenue: periodRecords.reduce((total, record) => total + safeMetric(record.revenue), 0),
      roi: contract.roi,
      spend: periodRecords.reduce((total, record) => total + safeMetric(record.spend), 0),
    };
  });
}

function buildTrafficSources(records: AnalyticsSourceRecord[]): [string, number][] {
  const total = records.reduce((sum, record) => sum + safeMetric(record.clicks), 0);
  const byChannel = new Map<string, number>();

  records.forEach((record) => byChannel.set(record.channel, (byChannel.get(record.channel) ?? 0) + safeMetric(record.clicks)));

  return [...byChannel.entries()]
    .map(([channel, clicks]) => [channel, percentage(clicks, total)] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

function buildRecommendations(contract: AnalyticsContract, campaigns: AggregatedCampaign[]): AnalyticsRecommendation[] {
  const recommendations: AnalyticsRecommendation[] = [];
  const bestCampaign = campaigns[0];
  const costlyCampaign = campaigns.filter((campaign) => campaign.clicks > 0).sort((a, b) => b.cpc - a.cpc)[0];

  if (contract.ctr < 3) {
    recommendations.push({
      action: "Refresh first-frame hooks and isolate the clearest audience pain in a smaller creative test before scaling media spend.",
      confidence: contract.impressions > 10000 ? 0.84 : 0.66,
      evidence: `${contract.ctr}% CTR across ${contract.impressions.toLocaleString()} impressions`,
      priority: "high",
      rationale: "Low CTR means the funnel is losing attention before conversion optimization can matter.",
      title: "Improve attention efficiency",
    });
  }

  if (bestCampaign && bestCampaign.roi >= 150) {
    recommendations.push({
      action: `Increase ${bestCampaign.campaignName} budget by 10-15% and monitor CPC daily before applying another change.`,
      confidence: 0.78,
      evidence: `${bestCampaign.roi}% ROI and ${bestCampaign.conversions.toLocaleString()} conversions`,
      priority: "high",
      rationale: "This campaign has the strongest conversion depth and return profile in the selected report.",
      title: "Scale the cleanest winner",
    });
  }

  if (costlyCampaign && costlyCampaign.cpc > contract.cpc * 1.25 && contract.cpc > 0) {
    recommendations.push({
      action: `Cap bids or narrow targeting on ${costlyCampaign.campaignName} until CPC returns near the portfolio average.`,
      confidence: 0.72,
      evidence: `$${costlyCampaign.cpc.toFixed(2)} CPC vs $${contract.cpc.toFixed(2)} average`,
      priority: "medium",
      rationale: "High CPC can hide inside a blended ROI report and drain budget from campaigns with cleaner economics.",
      title: "Control CPC variance",
    });
  }

  if (contract.engagementRate > 12 && contract.conversions < contract.clicks * 0.1) {
    recommendations.push({
      action: "Retarget engaged visitors with proof-heavy offers and remove soft CTAs from the next creative set.",
      confidence: 0.7,
      evidence: `${contract.engagementRate}% engagement rate with ${contract.conversions.toLocaleString()} conversions`,
      priority: "medium",
      rationale: "High engagement without enough conversions means the creative has interest but the next step lacks urgency.",
      title: "Convert engagement into action",
    });
  }

  if (contract.anomaliesDetected.length) {
    recommendations.push({
      action: "Pause automated reporting decisions for anomalous campaigns, reconcile source exports, and rerun the report from clean records.",
      confidence: 0.91,
      evidence: contract.anomaliesDetected.slice(0, 2).join("; "),
      priority: "high",
      rationale: "Incomplete or inconsistent reports can produce misleading CTR, ROI, and CPC calculations.",
      title: "Repair inconsistent reports",
    });
  }

  return recommendations.slice(0, 6);
}

function buildReport(contract: AnalyticsContract, campaigns: AggregatedCampaign[]): AnalyticsReport {
  const topCampaign = campaigns[0];

  return {
    executiveSummary: topCampaign
      ? `${topCampaign.campaignName} is leading the selected period while portfolio CTR is ${contract.ctr}% and ROI is ${contract.roi}%.`
      : "No campaign records match the selected filters. Metrics are held at zero and recommendations are conservative.",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        findings: [
          `${contract.impressions.toLocaleString()} impressions produced ${contract.clicks.toLocaleString()} clicks and ${contract.conversions.toLocaleString()} conversions.`,
          `CPC is ${formatMetric(contract.cpc, "currency")} and engagement rate is ${formatMetric(contract.engagementRate, "percent")}.`,
        ],
        title: "Performance",
      },
      {
        findings: contract.trends.length ? contract.trends : ["No directional trend is available for this filtered report."],
        title: "Trend Analysis",
      },
      {
        findings: contract.anomaliesDetected.length ? contract.anomaliesDetected : ["No invalid, incomplete, or inconsistent analytics were detected."],
        title: "Data Quality",
      },
    ],
  };
}

function buildTrendLabels(contract: Omit<AnalyticsContract, "anomaliesDetected" | "recommendations" | "trends">): string[] {
  const labels: string[] = [];

  if (contract.ctr >= 4) labels.push("CTR is outperforming the 4% expansion threshold.");
  if (contract.roi >= 150) labels.push("ROI supports controlled campaign scaling.");
  if (contract.cpc > 0 && contract.roi < 100) labels.push("CPC is creating margin pressure.");
  if (contract.engagementRate >= 10) labels.push("Engagement is strong enough for retargeting sequences.");
  if (!contract.impressions) labels.push("Impression volume is missing or zero.");

  return labels;
}

function matchesFilter(filter: string, value: string) {
  return filter === "all" || filter.toLowerCase() === value.toLowerCase();
}

function rangeToMs(range: AnalyticsQuery["range"]) {
  const daysByRange: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90, all: 3650 };
  const days = daysByRange[range] ?? daysByRange["30d"];

  return days * 24 * 60 * 60 * 1000;
}

function safeMetric(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function percentage(numerator: number, denominator: number): number {
  if (!denominator) return 0;

  return round((numerator / denominator) * 100);
}

function round(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.round(value * 100) / 100;
}

function formatMetric(value: number, format: "currency" | "number" | "percent") {
  if (format === "currency") return new Intl.NumberFormat("en", { currency: "USD", maximumFractionDigits: 2, style: "currency" }).format(value);
  if (format === "percent") return `${value.toLocaleString("en", { maximumFractionDigits: 2 })}%`;

  return value.toLocaleString();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function toObjectId(value: string) {
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

function toIsoDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function normalizeChannel(value?: string): AnalyticsSourceRecord["channel"] {
  if (value === "instagram") return "Instagram";
  if (value === "linkedin") return "LinkedIn";
  if (value === "tiktok") return "TikTok";

  return "Google Ads";
}
