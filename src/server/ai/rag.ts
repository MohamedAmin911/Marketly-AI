import { env } from "@/server/config/env";
import { ApiError, apiErrors } from "@/server/errors/api-error";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

export type RankedEmbeddingItem<T> = T & {
  score: number;
};

export async function generateEmbedding(input: string, model = "text-embedding-3-small"): Promise<number[]> {
  const text = input.trim();
  if (!text) throw apiErrors.badRequest("Embedding input cannot be empty.");

  if (env.OPENAI_API_KEY) {
    return requestEmbedding({
      apiKey: env.OPENAI_API_KEY,
      model,
      provider: "OpenAI",
      url: OPENAI_EMBEDDINGS_URL,
    }, text);
  }

  if (env.OPENROUTER_API_KEY) {
    try {
      return await requestEmbedding({
        apiKey: env.OPENROUTER_API_KEY,
        model: model.includes("/") ? model : `openai/${model}`,
        provider: "OpenRouter",
        url: OPENROUTER_EMBEDDINGS_URL,
      }, text);
    } catch {
      // OpenRouter may not support embeddings — fall through to empty vector
    }
  }

  // No embedding provider available — return empty vector (RAG silently disabled)
  return [];
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  if (length === 0) return 0;

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export function retrieveTopK<T extends { embedding: number[] }>(items: T[], queryEmbedding: number[], topK = 5): Array<RankedEmbeddingItem<T>> {
  return items
    .map((item) => ({ ...item, score: cosineSimilarity(queryEmbedding, item.embedding) }))
    .filter((item) => Number.isFinite(item.score) && item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

async function requestEmbedding(
  options: {
    apiKey: string;
    model: string;
    provider: "OpenAI" | "OpenRouter";
    url: string;
  },
  input: string,
): Promise<number[]> {
  try {
    const response = await fetch(options.url, {
      body: JSON.stringify({
        input,
        model: options.model,
      }),
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        ...(options.provider === "OpenRouter"
          ? {
              "HTTP-Referer": "https://marketly.ai",
              "X-Title": "Marketly AI",
            }
          : {}),
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as EmbeddingResponse | null;

    if (!response.ok) {
      if (response.status === 429) throw apiErrors.rateLimited(60);
      throw apiErrors.aiProvider(payload?.error?.message ?? `${options.provider} embeddings failed with status ${response.status}.`);
    }

    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || !embedding.every((value) => typeof value === "number")) {
      throw apiErrors.aiProvider(`${options.provider} returned an invalid embedding response.`);
    }

    return embedding;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw apiErrors.aiProvider(`${options.provider} embeddings request failed.`, error);
  }
}