import type { AnalyticsFilterState, AnalyticsIntelligence, AnalyticsOverview, AnalyticsReport } from "@/features/analytics/types";
import { defaultStrategyRequest } from "@/features/marketing-strategy/services";
import { apiJson } from "@/lib/api/client";

export const defaultAnalyticsFilters: AnalyticsFilterState = {
  campaign: "all",
  channel: "all",
  range: "30d",
  status: "all",
};

export async function getAnalyticsOverview(filters: AnalyticsFilterState = defaultAnalyticsFilters): Promise<AnalyticsOverview> {
  return apiJson<AnalyticsOverview>(`/api/analytics/overview?${toQueryString(filters)}`, { timeoutMs: 10_000 });
}

export async function getAnalyticsReport(filters: AnalyticsFilterState = defaultAnalyticsFilters): Promise<AnalyticsReport> {
  return apiJson<AnalyticsReport>(`/api/analytics/reports?${toQueryString(filters)}`, { timeoutMs: 10_000 });
}

export async function getAnalyticsIntelligence(): Promise<AnalyticsIntelligence> {
  return apiJson<AnalyticsIntelligence>("/api/analytics/insights", {
    body: {
      analytics: defaultStrategyRequest.analytics,
      brand: defaultStrategyRequest.brand,
      memory: defaultStrategyRequest.memory,
    },
    method: "POST",
    timeoutMs: 15_000,
  });
}

function toQueryString(filters: AnalyticsFilterState) {
  return new URLSearchParams(filters).toString();
}
