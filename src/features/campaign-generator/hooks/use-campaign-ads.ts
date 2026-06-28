"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { copyPost, downloadCampaignCopy, generateCampaign, listCampaigns } from "@/features/campaign-generator/services";
import type { SocialCampaignGenerationRequest, SocialCampaignRecord, SocialPostConcept } from "@/features/campaign-generator/types";

export function useCampaignAds() {
  const queryClient = useQueryClient();
  const [campaign, setCampaign] = useState<SocialCampaignRecord | null>(null);
  const [error, setError] = useState("");

  const historyQuery = useQuery({
    queryFn: listCampaigns,
    queryKey: ["campaigns"],
  });

  const generationMutation = useMutation({
    mutationFn: generateCampaign,
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Campaign generation failed."),
    onMutate: () => setError(""),
    onSuccess: async (nextCampaign) => {
      setCampaign(nextCampaign);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-generations"] }),
        queryClient.invalidateQueries({ queryKey: ["billing"] }),
      ]);
    },
  });

  return {
    campaign,
    copyPost: (post: SocialPostConcept) => copyPost(post),
    downloadCopy: () => campaign ? downloadCampaignCopy(campaign) : undefined,
    error,
    generate: (input: SocialCampaignGenerationRequest) => generationMutation.mutateAsync(input),
    history: historyQuery.data ?? [],
    isGenerating: generationMutation.isPending,
    isHistoryLoading: historyQuery.isLoading,
    setCampaign,
  };
}
