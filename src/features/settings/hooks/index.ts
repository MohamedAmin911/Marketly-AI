"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type BrandData = {
  name: string;
  tagline: string;
  elevatorPitch: string;
  industry: string;
  targetAudience: string;
  language: string;
  aiPersonality: "formal" | "casual" | "technical";
  tones: string[];
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  socialLinks: { website: string; linkedin: string; twitter: string; instagram: string };
};

export const DEFAULT_BRAND: BrandData = {
  name: "",
  tagline: "",
  elevatorPitch: "",
  industry: "",
  targetAudience: "",
  language: "en",
  aiPersonality: "formal",
  tones: ["Authoritative", "Minimalist"],
  logoUrl: "",
  primaryColor: "#72ff5f",
  secondaryColor: "#b8f7a9",
  accentColor: "#62ff9a",
  socialLinks: { website: "", linkedin: "", twitter: "", instagram: "" },
};

async function fetchBrand(): Promise<BrandData> {
  const res = await fetch("/api/brand", { credentials: "include" });
  if (!res.ok) return DEFAULT_BRAND;
  const d = await res.json() as { data?: { brand: BrandData | null }; brand?: BrandData | null };
  const brand = d.data?.brand ?? d.brand ?? null;
  return brand ? { ...DEFAULT_BRAND, ...brand } : DEFAULT_BRAND;
}

async function saveBrand(brand: BrandData): Promise<void> {
  await fetch("/api/brand", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brand),
  });
}

export function useBrand() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["brand"],
    queryFn: fetchBrand,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30, // يفضل في الـ cache 30 دقيقة
  });

  const mutation = useMutation({
    mutationFn: saveBrand,
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["brand"], variables);
    },
  });

  return {
    brand: query.data ?? DEFAULT_BRAND,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    saved: mutation.isSuccess,
    save: mutation.mutate,
  };
}