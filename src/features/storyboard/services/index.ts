import type { CinematicStoryboardResult, StoryboardGenerationRequest } from "@/features/storyboard/types";
import { apiJson } from "@/lib/api/client";

export async function generateStoryboard({ campaignPrompt, productImage }: StoryboardGenerationRequest): Promise<CinematicStoryboardResult> {
  const formData = new FormData();
  formData.set("campaignPrompt", campaignPrompt);
  formData.set("productImage", productImage);

  return apiJson<CinematicStoryboardResult>("/api/generate-storyboard", {
    body: formData,
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
    method: "POST",
    timeoutMs: 780_000,
  });
}
