import { readMemoryRecord } from "@/server/ai/memory/memory-store";
import type { AIMemoryRecord } from "@/server/ai/memory/types";

export async function retrieveAIMemory(userId: string, brandId?: string): Promise<AIMemoryRecord> {
  return readMemoryRecord(userId, brandId);
}

export async function retrieveMemorySnapshot(userId: string, brandId?: string) {
  const memory = await retrieveAIMemory(userId, brandId);

  return {
    brandIdentity: memory.brandIdentity,
    conflicts: memory.conflicts,
    freshness: memory.freshness,
    isMissing: memory.isMissing,
    lastUpdatedAt: memory.lastUpdatedAt,
    preferredCaptions: memory.preferredCaptions,
    preferredHooks: memory.preferredHooks,
    preferredStyles: memory.preferredStyles,
    previousConversations: memory.previousConversations,
    previousRecommendations: memory.previousRecommendations,
    successfulCampaigns: memory.successfulCampaigns,
    successfulCreatives: memory.successfulCreatives,
    successfulPrompts: memory.successfulPrompts,
    userPatterns: memory.userPatterns,
    warnings: memory.warnings,
  };
}
