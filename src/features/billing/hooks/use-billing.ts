"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type SubscriptionData = {
  plan: string;
  status: string;
  startedAt: string;
  expiresAt?: string;
  renewsAt?: string;
  monthlyCredits: number;
  monthlyCreditsRemaining: number;
  purchasedCredits: number;
};

export type UsageData = {
  totalCreditsUsed: number;
  monthlyCreditsUsed: number;
  purchasedCreditsUsed: number;
  aiRequests: number;
  projectsCreated: number;
};

export type BillingInfo = {
  subscription: SubscriptionData;
  features: Record<string, boolean>;
  usage: UsageData;
};

async function fetchBillingInfo(): Promise<BillingInfo | null> {
  const res = await fetch("/api/subscription", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data ?? data;
}

async function upgradePlan(planId: string): Promise<void> {
  const res = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) throw new Error("Failed to initiate checkout");
  const json = await res.json();
  const url = json.data?.url || json.url;
  if (url) {
    window.location.href = url;
  }
}

async function buyCredits(amount: number): Promise<void> {
  const res = await fetch("/api/credits/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("Failed to buy credits");
  const json = await res.json();
  const url = json.data?.url || json.url;
  if (url) {
    window.location.href = url;
  }
}

export function useBilling() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["billing"],
    queryFn: fetchBillingInfo,
    staleTime: 1000 * 60 * 5,
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
  });

  const buyCreditsMutation = useMutation({
    mutationFn: buyCredits,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
  });

  return {
    billing: query.data,
    isLoading: query.isLoading,
    upgradePlan: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    buyCredits: buyCreditsMutation.mutate,
    isBuyingCredits: buyCreditsMutation.isPending,
  };
}
