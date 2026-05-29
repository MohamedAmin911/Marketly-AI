import type { CreatorAsset, CreatorGeneration } from "@/features/creator-studio/types";
import { apiJson } from "@/lib/api/client";

type CreatorHistoryResponse = {
  items: CreatorGeneration[];
  nextCursor?: string;
};

export async function getCreatorHistory() {
  return apiJson<CreatorHistoryResponse>("/api/creator-studio/history?limit=12", { timeoutMs: 12_000 });
}

export async function uploadCreatorImage(file: File, purpose: "product" | "reference" = "product") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("purpose", purpose);

  const payload = await apiJson<{ asset: CreatorAsset }>("/api/creator-studio/upload", {
    body: formData,
    method: "POST",
    timeoutMs: 45_000,
  });

  return payload.asset;
}

export async function generateCreatorAsset(input: {
  angle: string;
  background: string;
  lighting: string;
  mode: string;
  productImage: Pick<CreatorAsset, "mimeType" | "name" | "size" | "url">;
  prompt: string;
  quality: string;
}) {
  return apiJson<CreatorGeneration>("/api/creator-studio/generate", {
    body: {
      ...input,
      variations: 6,
    },
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
    method: "POST",
    timeoutMs: 45_000,
  });
}

export async function setCreatorFavorite(generationId: string, favorited: boolean) {
  return apiJson<CreatorGeneration>("/api/creator-studio/favorites", {
    body: { favorited, generationId },
    method: "POST",
    timeoutMs: 10_000,
  });
}

export async function markCreatorDownloaded(generationId: string) {
  return apiJson<CreatorGeneration>("/api/creator-studio/download", {
    body: { generationId },
    method: "POST",
    timeoutMs: 10_000,
  });
}
