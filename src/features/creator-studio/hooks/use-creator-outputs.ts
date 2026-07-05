"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { generateCreatorAsset, getCreatorHistory, markCreatorDownloaded, setCreatorFavorite, uploadCreatorImage } from "@/features/creator-studio/services";
import type { CreatorAsset, CreatorGeneration } from "@/features/creator-studio/types";

import { useUiStore } from "@/store/ui-store";

export function useCreatorOutputs() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((state) => state.addToast);
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
    onError: (cause) => {
      const msg = cause instanceof Error ? cause.message : "Upload failed.";
      setError(msg);
      addToast({ title: "Upload Failed", description: msg, type: "error" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateCreatorAsset,
    onError: (cause) => {
      const msg = cause instanceof Error ? cause.message : "Creator generation failed.";
      setError(msg);
      addToast({ title: "Generation Failed", description: msg, type: "error" });
    },
    onMutate: () => setError(""),
    onSuccess: async (generation) => {
      setActiveGeneration(generation);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["creator-history"] }),
        queryClient.invalidateQueries({ queryKey: ["billing"] })
      ]);
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
    try {
      const productImage = input.productFile ? await uploadMutation.mutateAsync(input.productFile) : createPlaceholderProductAsset();

      return await generateMutation.mutateAsync({
        angle: input.angle,
        background: input.background,
        lighting: input.lighting,
        mode: input.mode,
        productImage,
        prompt: input.prompt,
        quality: input.quality,
      });
    } catch {
      // Errors are caught and handled by onError callbacks in the mutations
    }
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
