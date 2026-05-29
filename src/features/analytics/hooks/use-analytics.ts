"use client";

import { useQuery } from "@tanstack/react-query";

import type { AnalyticsFilterState } from "@/features/analytics/types";
import { defaultAnalyticsFilters, getAnalyticsIntelligence, getAnalyticsOverview, getAnalyticsReport } from "@/features/analytics/services";

export function useAnalytics(filters: AnalyticsFilterState = defaultAnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", filters],
    queryFn: () => getAnalyticsOverview(filters),
  });
}

export function useAnalyticsIntelligence() {
  return useQuery({
    queryKey: ["analytics-intelligence"],
    queryFn: getAnalyticsIntelligence,
  });
}

export function useAnalyticsReport(filters: AnalyticsFilterState = defaultAnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics-report", filters],
    queryFn: () => getAnalyticsReport(filters),
  });
}
