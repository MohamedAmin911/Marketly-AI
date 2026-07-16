import { apiJson } from "@/lib/api/client";
import type { Metric } from "@/types/common";

export type DashboardGeneration = {
  caption?: string;
  color: string;
  createdAt?: string;
  description?: string;
  downloadUrl?: string;
  hook?: string;
  id: string;
  imageUrl?: string;
  isAnalyticsEngine?: boolean;
  isCampaign?: boolean;
  isStoryboard?: boolean;
  isVideo?: boolean;
  isViralEngine?: boolean;
  posts?: Array<{
    caption: string;
    id: string;
    platform: string;
    title: string;
    visualDirection: string;
  }>;
  title: string;
  type: string;
  videoUrl?: string;
};

export type DashboardSummary = {
  growthTrend: {
    conversions: number;
    name: string;
    value: number;
  }[];
  metrics: Metric[];
  recentGenerations: DashboardGeneration[];
};

export function getDashboardSummary() {
  return apiJson<DashboardSummary>("/api/dashboard/summary", { timeoutMs: 12_000 });
}

export function getDashboardGenerations() {
  return apiJson<{ items: DashboardGeneration[] }>("/api/dashboard/generations", { timeoutMs: 15_000 });
}
