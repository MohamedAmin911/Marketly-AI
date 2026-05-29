"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { generateStoryboard } from "@/features/storyboard/services";
import type { CinematicStoryboardScene, StoryboardGenerationRequest } from "@/features/storyboard/types";

const revealDelayMs = 420;

export function useStoryboardScenes() {
  const queryClient = useQueryClient();
  const [scenes, setScenes] = useState<CinematicStoryboardScene[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);

  const generationMutation = useMutation({
    mutationFn: generateStoryboard,
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

      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsRevealing(false);
    },
  });

  async function generate(input: StoryboardGenerationRequest) {
    return generationMutation.mutateAsync(input);
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
