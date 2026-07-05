"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { generateStoryboard } from "@/features/storyboard/services";
import type { CinematicStoryboardScene, StoryboardGenerationRequest } from "@/features/storyboard/types";

import { useUiStore } from "@/store/ui-store";

const revealDelayMs = 420;

export function useStoryboardScenes() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((state) => state.addToast);
  const [scenes, setScenes] = useState<CinematicStoryboardScene[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);

  const generationMutation = useMutation({
    mutationFn: generateStoryboard,
    onError: (error) => {
      addToast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        type: "error"
      });
    },
    onMutate: () => {
      setScenes([]);
      setIsRevealing(false);
    },
    onSuccess: async (result) => {
      setIsRevealing(true);

      for (const scene of result.scenes) {
        await wait(revealDelayMs);
        setScenes((current) => [...current, scene]);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["billing"] }),
      ]);
      setIsRevealing(false);
    },
  });

  async function generate(input: StoryboardGenerationRequest) {
    return generationMutation.mutateAsync(input).catch(() => {});
  }

  return {
    generate,
    generationError: generationMutation.error instanceof Error ? generationMutation.error.message : "",
    isGenerating: generationMutation.isPending,
    isRevealing,
    scenes,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
