import { apiErrors } from "@/server/errors/api-error";
import type { AIModelRequest, AIModelResponse } from "@/server/ai/types";
import { createUsage, stringifyMessages, type AIProvider } from "@/server/ai/providers/base-provider";

type OpenAIResponse = {
  choices?: Array<{ finish_reason?: string; message?: { content?: string } }>;
  model?: string;
  usage?: { completion_tokens?: number; prompt_tokens?: number; total_tokens?: number };
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;

  constructor(private readonly apiKey = process.env.OPENAI_API_KEY) {}

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIModelRequest): Promise<AIModelResponse> {
    if (!this.apiKey) throw apiErrors.aiProvider("OpenAI API key is not configured.");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      body: JSON.stringify({
        messages: request.messages,
        model: request.model ?? "gpt-4o-mini",
        response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: request.abortSignal,
    });

    if (!response.ok) throw apiErrors.aiProvider(`OpenAI request failed with status ${response.status}.`);

    const data = (await response.json()) as OpenAIResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    const fallbackUsage = createUsage(stringifyMessages(request), text, 0.002);

    return {
      finishReason: data.choices?.[0]?.finish_reason,
      model: data.model ?? request.model ?? "gpt-4o-mini",
      provider: this.name,
      raw: data,
      text,
      usage: {
        completionTokens: data.usage?.completion_tokens ?? fallbackUsage.completionTokens,
        costUsd: fallbackUsage.costUsd,
        promptTokens: data.usage?.prompt_tokens ?? fallbackUsage.promptTokens,
        totalTokens: data.usage?.total_tokens ?? fallbackUsage.totalTokens,
      },
    };
  }
}
