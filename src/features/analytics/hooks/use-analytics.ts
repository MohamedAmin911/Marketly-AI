"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnalyticsFilterState, EngineAnalyticsResponse } from "@/features/analytics/types";
import { analyzePost } from "@/features/analytics/services";

export function useAnalyticsMutation() {
  const queryClient = useQueryClient();
  
  return useMutation<EngineAnalyticsResponse, Error, AnalyticsFilterState>({
    mutationFn: (filters) => analyzePost(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-generations"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}
