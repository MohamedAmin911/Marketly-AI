"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { downloadVideo, generateVideo, getVideoHistory } from "@/features/video-generator/services";
import type { VideoGenerationRequest, VideoRecord } from "@/features/video-generator/types";

export function useVideoRender() {
  const queryClient = useQueryClient();
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [error, setError] = useState("");

  const historyQuery = useQuery({
    queryFn: getVideoHistory,
    queryKey: ["video-history"],
  });

  const generateMutation = useMutation({
    mutationFn: generateVideo,
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Video generation failed."),
    onMutate: () => setError(""),
    onSuccess: async (nextVideo) => {
      setVideo(nextVideo);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["video-history"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-generations"] }),
      ]);
    },
  });

  return {
    downloadExport: () => video ? downloadVideo(video) : undefined,
    downloadVideo,
    error,
    history: historyQuery.data ?? [],
    isHistoryLoading: historyQuery.isLoading,
    isRendering: generateMutation.isPending,
    setVideo,
    startRender: (input: VideoGenerationRequest) => generateMutation.mutateAsync(input),
    video,
  };
}
