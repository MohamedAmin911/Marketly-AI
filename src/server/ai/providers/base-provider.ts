import type { AIModelRequest, AIModelResponse, AIProviderName } from "@/server/ai/types";

export interface AIProvider {
  readonly name: AIProviderName;
  generate(request: AIModelRequest): Promise<AIModelResponse>;
  isAvailable(): boolean;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function createUsage(prompt: string, completion: string, costPer1kTokens = 0) {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(completion);
  const totalTokens = promptTokens + completionTokens;

  return {
    completionTokens,
    costUsd: (totalTokens / 1000) * costPer1kTokens,
    promptTokens,
    totalTokens,
  };
}

export function stringifyMessages(request: AIModelRequest): string {
  return request.messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
}
