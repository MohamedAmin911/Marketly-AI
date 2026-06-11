

import { defaultStrategyRequest } from "@/features/marketing-strategy/services";
import type { AssistantChatResponse } from "@/features/ai-assistant/types/chat";
import { apiJson } from "@/lib/api/client";

export async function sendAssistantMessage(message: string, signal?: AbortSignal, wantAudio = false, imageData?: string): Promise<AssistantChatResponse> {
  return apiJson<AssistantChatResponse>("/api/ai-assistant/chat", {
    body: {
      analytics: defaultStrategyRequest.analytics,
      brand: defaultStrategyRequest.brand,
      imageData,
      memory: defaultStrategyRequest.memory,
      message,
      model: defaultStrategyRequest.model,
      provider: "openai",
      wantAudio,
    },
    method: "POST",
    signal,
    timeoutMs: 60_000,
  });
}