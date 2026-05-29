"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "@/features/dashboard/services";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });
}
