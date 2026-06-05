import type { AIProviderName } from "@/server/ai/types";
import type { AIProvider } from "@/server/ai/providers/base-provider";
import { ClaudeProvider } from "@/server/ai/providers/claude-provider";
import { HuggingFaceProvider } from "@/server/ai/providers/huggingface-provider";
import { MockProvider } from "@/server/ai/providers/mock-provider";
import { OpenAIProvider } from "@/server/ai/providers/openai-provider";

const providers: Record<AIProviderName, AIProvider> = {
  claude: new ClaudeProvider(),
  huggingface: new HuggingFaceProvider(),
  mock: new MockProvider(),
  openai: new OpenAIProvider(),
};

export function getProvider(name: AIProviderName): AIProvider {
  return providers[name];
}

export function getFallbackProviders(preferred: AIProviderName): AIProvider[] {
  const ordered: AIProviderName[] = preferred === "mock" ? ["mock"] : [preferred, "openai", "claude", "huggingface", "mock"];
  const seen = new Set<AIProviderName>();

  return ordered.filter((name) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  }).map((name) => providers[name]);
}
