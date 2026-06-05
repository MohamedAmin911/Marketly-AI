import { apiErrors } from "@/server/errors/api-error";
import type { AIMessage, AIModelRequest, AIModelResponse } from "@/server/ai/types";
import { createUsage, stringifyMessages, type AIProvider } from "@/server/ai/providers/base-provider";

type ClaudeResponse = {
  content?: Array<{ text?: string; type?: string }>;
  model?: string;
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
};

export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const;

  constructor(private readonly apiKey = process.env.ANTHROPIC_API_KEY) {}

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIModelRequest): Promise<AIModelResponse> {
    if (!this.apiKey) throw apiErrors.aiProvider("Anthropic API key is not configured.");

    const system = request.messages.find((message) => message.role === "system")?.content;
    const messages = request.messages.filter((message): message is Exclude<AIMessage, { role: "system" }> => message.role !== "system");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      body: JSON.stringify({
        max_tokens: request.maxTokens ?? 1600,
        messages,
        model: request.model ?? "claude-3-5-haiku-latest",
        system,
        temperature: request.temperature ?? 0.7,
      }),
      headers: {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": this.apiKey,
      },
      method: "POST",
      signal: request.abortSignal,
    });

    if (!response.ok) throw apiErrors.aiProvider(`Claude request failed with status ${response.status}.`);

    const data = (await response.json()) as ClaudeResponse;
    const text = data.content?.find((item) => item.type === "text")?.text ?? "";
    const fallbackUsage = createUsage(stringifyMessages(request), text, 0.002);
    const promptTokens = data.usage?.input_tokens ?? fallbackUsage.promptTokens;
    const completionTokens = data.usage?.output_tokens ?? fallbackUsage.completionTokens;

    return {
      finishReason: data.stop_reason,
      model: data.model ?? request.model ?? "claude-3-5-haiku-latest",
      provider: this.name,
      raw: data,
      text,
      usage: {
        completionTokens,
        costUsd: fallbackUsage.costUsd,
        promptTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}
