import { defaultStrategyRequest } from "@/features/marketing-strategy/services";
import type { AssistantChatResponse } from "@/features/ai-assistant/types/chat";
import { apiJson } from "@/lib/api/client";

async function getBrand(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch("/api/brand", { credentials: "include" });
    if (res.ok) {
      const data = await res.json() as { data?: { brand: Record<string, unknown> | null }; brand?: Record<string, unknown> | null };
      const raw = data.data?.brand ?? data.brand ?? null;
      if (raw) {
        return {
          ...raw,
          name: raw.name ?? defaultStrategyRequest.brand.name,
          industry: raw.industry ?? defaultStrategyRequest.brand.industry,
          audience: raw.targetAudience ?? raw.audience ?? defaultStrategyRequest.brand.audience,
          offer: raw.elevatorPitch ?? raw.offer ?? defaultStrategyRequest.brand.offer,
          tone: Array.isArray(raw.tones) ? (raw.tones as string[]).join(", ") : (raw.tone ?? defaultStrategyRequest.brand.tone),
          goals: raw.goals ?? defaultStrategyRequest.brand.goals,
          aiPersonality: raw.aiPersonality ?? "formal",
          language: raw.language ?? "en",
          tagline: raw.tagline ?? "",
          socialLinks: raw.socialLinks ?? {},
        };
      }
    }
  } catch {  }
  return defaultStrategyRequest.brand as unknown as Record<string, unknown>;
}

export async function sendAssistantMessage(message: string, signal?: AbortSignal, wantAudio = false, imageData?: string): Promise<AssistantChatResponse> {
  
  const brand = await getBrand();
  return apiJson<AssistantChatResponse>("/api/ai-assistant/chat", {
    body: {
      analytics: defaultStrategyRequest.analytics,
      brand,
      imageData,
      memory: defaultStrategyRequest.memory,
      message,
      model: defaultStrategyRequest.model,
      provider: "openai",
      wantAudio: false,
    },
    method: "POST",
    signal,
    timeoutMs: 60_000,
  });
}