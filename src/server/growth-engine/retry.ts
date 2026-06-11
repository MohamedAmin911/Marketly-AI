import { apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";

export async function withOperationTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(apiErrors.timeout(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function retryOperation<T>({
  attempts,
  delayMs,
  label,
  task,
}: {
  attempts: number;
  delayMs: number;
  label: string;
  task: (attempt: number) => Promise<T>;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= attempts) break;

      logger.warn("growth_engine.retry", {
        attempt,
        error: error instanceof Error ? error.message : String(error),
        label,
      });

      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
