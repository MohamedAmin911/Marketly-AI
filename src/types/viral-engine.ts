export interface ViralEngineRequest {
  brandName: string;
  industry: string;
  targetAudience: string;
  goal: string;
  brandBrief: string;
}

export interface Competitor {
  id?: string;
  name?: string;
  platform?: string;
  followers?: string;
  engagement?: string;
  reason?: string;
  insight?: string;
}

export type CurrentTrend = string | {
  id?: string;
  topic: string;
  platform: string;
  popularity?: number;
  trendScore?: number;
  competitors?: number;
};

export type ViralHook = string | {
  id?: string;
  text: string;
};

export type Idea = string | {
  title: string;
  description?: string;
  format?: string;
  difficulty?: string;
  potentialReach?: string;
};

export type PostingSchedule = string | {
  day: string;
  time: string;
  platform: string;
  contentType: string;
};

export interface ViralEngine {
  marketSummary?: string;
  currentTrends?: CurrentTrend[];
  competitors?: Competitor[];
  viralHooks?: ViralHook[];
  facebookIdeas?: Idea[];
  instagramIdeas?: Idea[];
  tiktokIdeas?: Idea[];
  ugcIdeas?: Idea[];
  videoConcepts?: Idea[];
  carouselIdeas?: Idea[];
  ctaIdeas?: Idea[];
  hashtags?: string[];
  postingSchedule?: PostingSchedule[];
  recommendations?: string | string[];
}

export interface ViralEngineResponse {
  success: boolean;
  message: string;
  viralEngine: ViralEngine;
}
