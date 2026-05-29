"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { generateCreatorAsset, getCreatorHistory, markCreatorDownloaded, setCreatorFavorite, uploadCreatorImage } from "@/features/creator-studio/services";
import type { CreatorAsset, CreatorGeneration } from "@/features/creator-studio/types";

export function useCreatorOutputs() {
  const queryClient = useQueryClient();
  const history = useQuery({
    queryKey: ["creator-history"],
    queryFn: getCreatorHistory,
  });
  const [activeGeneration, setActiveGeneration] = useState<CreatorGeneration | null>(null);
  const [error, setError] = useState("");
  const latestGeneration = activeGeneration ?? history.data?.items[0] ?? null;
  const assets = useMemo(() => latestGeneration?.generatedImages ?? [], [latestGeneration?.generatedImages]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCreatorImage(file),
  });

  const generateMutation = useMutation({
    mutationFn: generateCreatorAsset,
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Creator generation failed."),
    onMutate: () => setError(""),
    onSuccess: async (generation) => {
      setActiveGeneration(generation);
      await queryClient.invalidateQueries({ queryKey: ["creator-history"] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => {
      if (!latestGeneration) throw new Error("No generation selected.");
      return setCreatorFavorite(latestGeneration.id, !latestGeneration.favorited);
    },
    onSuccess: async (generation) => {
      setActiveGeneration(generation);
      await queryClient.invalidateQueries({ queryKey: ["creator-history"] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () => {
      if (!latestGeneration) throw new Error("No generation selected.");
      return markCreatorDownloaded(latestGeneration.id);
    },
    onSuccess: async (generation) => {
      setActiveGeneration(generation);
      await queryClient.invalidateQueries({ queryKey: ["creator-history"] });
    },
  });

  async function generate(input: {
    angle: string;
    background: string;
    lighting: string;
    mode: string;
    productFile?: File | null;
    prompt: string;
    quality: string;
  }) {
    const productImage = input.productFile ? await uploadMutation.mutateAsync(input.productFile) : createPlaceholderProductAsset();

    return generateMutation.mutateAsync({
      angle: input.angle,
      background: input.background,
      lighting: input.lighting,
      mode: input.mode,
      productImage,
      prompt: input.prompt,
      quality: input.quality,
    });
  }

  function toggleFavorite(assetId?: string) {
    void assetId;
    favoriteMutation.mutate();
  }

  function markDownloaded() {
    downloadMutation.mutate();
  }

  return {
    ...history,
    activeGeneration: latestGeneration,
    assets,
    error,
    generate,
    isGenerating: generateMutation.isPending,
    isLoading: history.isLoading,
    isUploading: uploadMutation.isPending,
    markDownloaded,
    toggleFavorite,
  };
}

function createPlaceholderProductAsset(): Pick<CreatorAsset, "mimeType" | "name" | "size" | "url"> {
  return {
    mimeType: "image/webp",
    name: "workspace-product-placeholder.webp",
    size: 1,
    url: "memory://creator-studio/product-placeholder.webp",
  };
}
