import type { AnalyticsFilterState, EngineAnalyticsResponse } from "@/features/analytics/types";

export const defaultAnalyticsFilters: AnalyticsFilterState = {
  url: "",
  brandName: "",
  industry: "",
};

export async function analyzePost(filters: AnalyticsFilterState): Promise<EngineAnalyticsResponse> {
  const response = await fetch("/api/analytics/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to fetch analytics: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  return data;
}
