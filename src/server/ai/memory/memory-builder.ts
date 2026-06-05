import { createMemoryInjection } from "@/server/ai/memory/context-injection-service";
import { retrieveAIMemory } from "@/server/ai/memory/retrieval-service";
import type { AIMemoryContext } from "@/server/ai/types";
import type { AIMemoryRecord } from "@/server/ai/memory/types";

export async function buildMemoryContext(userId: string, brandId?: string): Promise<AIMemoryContext> {
  const memory = await retrieveAIMemory(userId, brandId);
  const injection = createMemoryInjection(memory);

  return {
    brandIdentity: memory.brandIdentity,
    conflicts: memory.conflicts,
    freshness: memory.freshness,
    injection: injection.text,
    isMissing: memory.isMissing,
    preferredCaptions: memory.preferredCaptions,
    preferredHooks: memory.preferredHooks,
    preferredStyles: memory.preferredStyles,
    previousConversations: memory.previousConversations,
    previousRecommendations: memory.previousRecommendations,
    successfulCampaigns: memory.successfulCampaigns,
    successfulCreatives: memory.successfulCreatives,
    successfulPrompts: memory.successfulPrompts,
    userPatterns: memory.userPatterns,
    warnings: injection.warnings,
  };
}

export function injectMemoryGuidance(memory: AIMemoryContext): string {
  if (memory.injection) return memory.injection;

  return createMemoryInjection(memoryContextToRecord(memory)).text;
}

function memoryContextToRecord(memory: AIMemoryContext): AIMemoryRecord {
  return {
    brandIdentity: memory.brandIdentity,
    conflicts: memory.conflicts,
    freshness: memory.freshness,
    isMissing: memory.isMissing,
    mostUsedFeatures: [],
    preferredCaptions: memory.preferredCaptions,
    preferredHooks: memory.preferredHooks,
    preferredStyles: memory.preferredStyles,
    previousConversations: memory.previousConversations,
    previousRecommendations: memory.previousRecommendations,
    previousStrategies: [],
    successfulCampaigns: memory.successfulCampaigns,
    successfulCreatives: memory.successfulCreatives,
    successfulPrompts: memory.successfulPrompts,
    userId: "context",
    userPatterns: memory.userPatterns,
    warnings: memory.warnings,
  };
}
