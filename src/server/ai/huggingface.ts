import { FLUX_ADVERTISEMENT_SPACE, generateFluxAdvertisement } from "@/lib/api/gradio";
import { env } from "@/server/config/env";

const DEFAULT_TIMEOUT_MS = 240_000;

export { FLUX_ADVERTISEMENT_SPACE };

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
    hfToken: env.HF_TOKEN ?? env.HUGGINGFACE_API_KEY,
    productImage,
    prompt,
    timeoutMs,
  });
}
