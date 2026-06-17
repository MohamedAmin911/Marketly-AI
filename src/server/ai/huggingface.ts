import { generateFluxAdvertisement } from "@/lib/api/gradio";

const DEFAULT_TIMEOUT_MS = 240_000;

export async function generateCampaignImageWithFlux({
  productImage,
  prompt,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  productImage: File;
  prompt: string;
  timeoutMs?: number;
}) {
  return generateFluxAdvertisement({
    productImage,
    prompt,
    timeoutMs,
  });
}
