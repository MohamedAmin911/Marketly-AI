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
  status: string;
  channel: string;
  spend: number;
  ctr: number;
  cpc: number;
  conversions: number;
};

export type AnalyticsFilterState = {
  url: string;
  brandName: string;
  industry: string;
};

export type EngineAnalytics = {
  // Base fields
  platform?: string;
  brandName?: string;
  industry?: string;
  postUrl?: string;
  url?: string;
  author?: string;
  publishDate?: string | number;
  caption?: string;
  language?: string;
  targetAudience?: string;
  sentiment?: string;
  tone?: string[] | string;
  callToActionImplied?: string;

  // Media
  mediaCount?: number;
  mediaType?: string;
  mediaTypes?: string[];

  // Features & Highlights
  productHighlight?: string;
  keyFeatures?: string[];

  // Analysis / Insights objects
  contentAnalysis?: {
    language?: string;
    tone?: string;
    keyThemes?: string[];
    productHighlights?: string[];
    emotionalTriggers?: string[];
    callToActionImplied?: string;
    productHighlight?: string;
    keyFeatures?: string[];
  };
  
  mediaAnalysis?: {
    mediaType?: string;
    mediaCount?: number;
    imageTextExtracted?: string[];
    visualFocus?: string;
  };

  engagementMetrics?: {
    likes?: number;
    reactions?: Record<string, number>;
    comments?: number;
    shares?: number;
    saves?: number;
    views?: number;
    totalInteractions?: number;
    engagementRate?: number;
    viralityScore?: number;
  };

  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    views?: number;
    reactions?: Record<string, number>;
    totalInteractions?: number;
    engagementRate?: number;
    viralityScore?: number;
  };

  analytics?: {
    interactions?: number;
    engagementRate?: number;
    viewEngagementRate?: number;
    viralityScore?: number;
    estimatedReach?: number;
    estimatedCTR?: number;
  };

  audienceInsights?: {
    targetAudience?: string;
    interests?: string[];
    context?: string;
  };

  performanceAssessment?: {
    strengths?: string[];
    opportunities?: string[];
    overallImpression?: string;
  };

  performanceInsights?: {
    strengths?: string[];
    opportunities?: string[];
    recommendations?: string[];
  };

  performanceIndicators?: {
    strengths?: string[];
    opportunities?: string[];
    weaknesses?: string[];
  };

  recommendations?: string[];

  // Legacy flat fields just in case
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  hashtags?: string[];
  mentions?: string[];
};

export type EngineAnalyticsResponse = EngineAnalytics[];

export type AnalyticsRecommendation = {
  action: string;
  confidence: number;
  evidence: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  title: string;
};
