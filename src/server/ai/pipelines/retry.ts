import { apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import type { AIModelRequest, AIModelResponse, AIProviderName } from "@/server/ai/types";
import type { AIProvider } from "@/server/ai/providers/base-provider";

type RetryOptions = {
  attempts: number;
  timeoutMs: number;
};

export async function runWithRetryAndFallback(providers: AIProvider[], request: AIModelRequest, options: RetryOptions): Promise<AIModelResponse> {
  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.isAvailable()) {
      errors.push(`${provider.name}: unavailable`);
      continue;
    }

    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        return await provider.generate({ ...request, abortSignal: controller.signal });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.name}: attempt ${attempt}: ${message}`);
        logger.warn("ai.provider.attempt_failed", { attempt, error: message, provider: provider.name });
        await backoff(attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  throw apiErrors.aiProvider("All AI providers failed.", { providers: providers.map((provider) => provider.name), errors });
}

export function choosePrimaryProvider(provider?: string): AIProviderName {
  if (provider === "openai" || provider === "claude" || provider === "mock") return provider;
  return "mock";
}

async function backoff(attempt: number) {
  await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
}
