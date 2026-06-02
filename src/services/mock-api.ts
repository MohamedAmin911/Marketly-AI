import {
  analyticsRows,
  campaignAds,
  dashboardMetrics,
  generatedImages,
  recentGenerations,
  storyboardScenes,
  trafficSources,
} from "@/lib/constants/marketly";
import type { CampaignAd } from "@/features/campaign-generator/types";
import type { GeneratedImage } from "@/features/creator-studio/types";
import type { CinematicStoryboardScene } from "@/features/storyboard/types";
import { wait } from "@/lib/utils";
import type { Metric } from "@/types/common";

type DashboardSummary = {
  metrics: Metric[];
  recentGenerations: typeof recentGenerations;
};

type AnalyticsData = {
  rows: string[][];
  sources: [string, number][];
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await wait(250);
  return { metrics: dashboardMetrics, recentGenerations };
}

export async function getCreatorOutputs(): Promise<GeneratedImage[]> {
  await wait(250);
  return generatedImages;
}

export async function getStoryboardScenes(): Promise<CinematicStoryboardScene[]> {
  await wait(250);
  return storyboardScenes.map(([title, description], index) => ({
    generatedImage: "",
    imagePrompt: `${title}: ${description}`,
    sceneTitle: title,
    script: index === 0 ? "Every detail begins with intent." : "Built to move the moment forward.",
  }));
}

export async function getCampaignAds(): Promise<CampaignAd[]> {
  await wait(250);
  return campaignAds;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  await wait(250);
  return { rows: analyticsRows, sources: trafficSources as [string, number][] };
}
