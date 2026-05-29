export type AnalyticsContract = {
  clicks: number;
  conversions: number;
  anomaliesDetected: string[];
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

export type AnalyticsRecommendation = {
  action: string;
  confidence: number;
  evidence: string;
  priority: "low" | "medium" | "high";
  rationale: string;
  title: string;
};

export type AnalyticsIntelligence = {
  contract: AnalyticsContract;
  context: {
    conflicts: string[];
    incompleteData: string[];
    model: string;
  };
  insights: AnalyticsInsight[];
  recommendations: AnalyticsRecommendation[];
};

export type AnalyticsFilterState = {
  campaign: string;
  channel: string;
  range: "24h" | "7d" | "30d" | "90d" | "all";
  status: string;
};

export type AnalyticsMetricCard = {
  delta: number;
  format: "currency" | "number" | "percent";
  key: "impressions" | "clicks" | "conversions" | "ctr" | "roi" | "cpc" | "engagementRate";
  label: string;
  raw: number;
  tone: "success" | "warning" | "danger" | "neutral";
  value: string;
};

export type AnalyticsTrendPoint = {
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

export type AnalyticsCampaignRow = {
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
  status: "active" | "draft" | "paused";
};

export type AnalyticsReport = {
  executiveSummary: string;
  generatedAt: string;
  sections: {
    findings: string[];
    title: string;
  }[];
};

export type AnalyticsOverview = {
  campaigns: AnalyticsCampaignRow[];
  contract: AnalyticsContract;
  filters: AnalyticsFilterState;
  filterOptions: {
    campaigns: string[];
    channels: string[];
    statuses: string[];
  };
  metrics: AnalyticsMetricCard[];
  recommendations: AnalyticsRecommendation[];
  report: AnalyticsReport;
  sources: [string, number][];
  trends: AnalyticsTrendPoint[];
};
