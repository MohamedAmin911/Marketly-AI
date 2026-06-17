import type { AIProvider, AIProviderName } from "@/lib/services/ai-provider";
import { openAIProvider } from "@/lib/services/providers/openai-provider-impl";
import { huggingFaceProvider } from "@/lib/services/providers/huggingface-provider";

const DEFAULT_PROVIDER: AIProviderName = "openai";

const providers: Record<AIProviderName, AIProvider> = {
  openai: openAIProvider,
  huggingface: huggingFaceProvider,
};

function resolveProviderName(): AIProviderName {
  const envValue = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (envValue === "huggingface") return "huggingface";
  return DEFAULT_PROVIDER;
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    const name = resolveProviderName();
    cachedProvider = providers[name];
  }
  return cachedProvider;
}

export function resetAIProvider(): void {
  cachedProvider = null;
}

export function getActiveProviderName(): AIProviderName {
  return resolveProviderName();
}
