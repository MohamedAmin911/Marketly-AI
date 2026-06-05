import { retrieveAIMemory } from "@/server/ai/memory/retrieval-service";
import { writeMemoryRecord } from "@/server/ai/memory/memory-store";
import { mergeCreatives, mergeStringLists, normalizeMemory } from "@/server/ai/memory/memory-utils";
import type { AIMemoryRecord, MemoryUpdateInput } from "@/server/ai/memory/types";

export async function updateAIMemory(input: MemoryUpdateInput): Promise<AIMemoryRecord> {
  const existing = await retrieveAIMemory(input.userId, input.brandId);
  const merged: AIMemoryRecord = normalizeMemory({
    ...existing,
    averageGenerationType: input.averageGenerationType ?? existing.averageGenerationType,
    brandIdentity: {
      ...existing.brandIdentity,
      ...input.brandIdentity,
      forbiddenWords: mergeStringLists(existing.brandIdentity.forbiddenWords, input.brandIdentity?.forbiddenWords, 20),
      values: mergeStringLists(existing.brandIdentity.values, input.brandIdentity?.values, 12),
    },
    mostUsedFeatures: mergeStringLists(existing.mostUsedFeatures, input.mostUsedFeatures, 16),
    preferredCaptions: mergeStringLists(existing.preferredCaptions, input.preferredCaptions, 20),
    preferredHooks: mergeStringLists(existing.preferredHooks, input.preferredHooks, 24),
    preferredStyles: mergeStringLists(existing.preferredStyles, input.preferredStyles, 16),
    previousConversations: [...(input.previousConversations ?? []), ...existing.previousConversations].slice(0, 12),
    previousRecommendations: mergeStringLists(existing.previousRecommendations, input.previousRecommendations, 24),
    previousStrategies: mergeStringLists(existing.previousStrategies, input.previousStrategies, 12),
    successfulCampaigns: mergeStringLists(existing.successfulCampaigns, input.successfulCampaigns, 24),
    successfulCreatives: mergeCreatives(existing.successfulCreatives, input.successfulCreatives, 24),
    successfulPrompts: mergeStringLists(existing.successfulPrompts, input.successfulPrompts, 24),
    userPatterns: {
      ...existing.userPatterns,
      ...input.userPatterns,
    },
  });

  return writeMemoryRecord(merged);
}

export async function recordWorkflowMemory(input: {
  brandId?: string;
  output: unknown;
  prompt: string;
  userId: string;
  workflow: string;
}) {
  const recommendations = extractStrings(input.output, ["recommendations", "actions", "followUps"]).slice(0, 8);
  const summary = extractSummary(input.output);

  return updateAIMemory({
    brandId: input.brandId,
    mostUsedFeatures: [input.workflow],
    previousConversations: summary
      ? [
          {
            messages: [
              { role: "user", text: input.prompt.slice(0, 2000) },
              { role: "assistant", text: summary.slice(0, 2000) },
            ],
            summary,
            topic: input.workflow,
          },
        ]
      : undefined,
    previousRecommendations: recommendations,
    successfulPrompts: [input.prompt],
    userId: input.userId,
    userPatterns: {
      lastWorkflow: input.workflow,
      lastWorkflowAt: new Date().toISOString(),
    },
  });
}

function extractStrings(output: unknown, keys: string[]): string[] {
  if (!output || typeof output !== "object") return [];
  const record = output as Record<string, unknown>;

  return keys.flatMap((key) => {
    const value = record[key];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  });
}

function extractSummary(output: unknown): string | undefined {
  if (!output || typeof output !== "object") return undefined;
  const record = output as Record<string, unknown>;

  if (typeof record.summary === "string") return record.summary;
  if (typeof record.answer === "string") return record.answer;
  return undefined;
}
