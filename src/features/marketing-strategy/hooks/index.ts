"use client";

import { useMutation } from "@tanstack/react-query";

import { defaultStrategyRequest, generateMarketingStrategy } from "@/features/marketing-strategy/services";

export function useMarketingStrategy() {
  return useMutation({
    mutationFn: generateMarketingStrategy,
    mutationKey: ["marketing-strategy"],
    onMutate: async () => undefined,
  });
}

export function useDefaultStrategyRequest() {
  return defaultStrategyRequest;
}
