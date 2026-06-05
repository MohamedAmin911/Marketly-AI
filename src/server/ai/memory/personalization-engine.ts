import { createMemoryInjection } from "@/server/ai/memory/context-injection-service";
import { retrieveAIMemory } from "@/server/ai/memory/retrieval-service";
import type { AIMemoryRecord, PersonalizationRequest, PersonalizationResult } from "@/server/ai/memory/types";

export async function personalizeWithMemory(input: PersonalizationRequest): Promise<PersonalizationResult> {
  const memory = await retrieveAIMemory(input.userId, input.brandId);

  return personalizePrompt(input.basePrompt, memory, input.analytics);
}

export function personalizePrompt(basePrompt: string, memory: AIMemoryRecord, analytics?: PersonalizationRequest["analytics"]): PersonalizationResult {
  const injection = createMemoryInjection(memory, analytics);
  const rules = buildRules(memory);
  const suppressedRepeats = memory.previousRecommendations.filter((recommendation) => basePrompt.toLowerCase().includes(recommendation.toLowerCase())).slice(0, 5);
  const confidence = calculateConfidence(memory);

  return {
    confidence,
    injectedContext: injection.text,
    personalizationRules: rules,
    prompt: [
      basePrompt,
      "",
      "Personalization context:",
      injection.text,
      "",
      "Personalization rules:",
      ...rules.map((rule) => `- ${rule}`),
    ].join("\n"),
    suppressedRepeats,
    warnings: [
      ...injection.warnings,
      ...(suppressedRepeats.length ? ["Prompt overlaps with previous recommendations. Generate a fresh angle."] : []),
    ],
  };
}

function buildRules(memory: AIMemoryRecord): string[] {
  return [
    "Prioritize current analytics over memory when the two conflict.",
    "Do not treat successful campaigns or prompts as proof unless current data confirms them.",
    memory.preferredStyles.length ? `Match these style cues when relevant: ${memory.preferredStyles.slice(0, 5).join(", ")}.` : "Use neutral Marketly AI style defaults.",
    memory.successfulCampaigns.length ? `Borrow structural patterns from: ${memory.successfulCampaigns.slice(0, 3).join(", ")}.` : "Ask for or infer campaign history cautiously.",
    memory.conflicts.length ? `Resolve preference conflicts explicitly: ${memory.conflicts.join("; ")}.` : "No preference conflicts detected.",
    memory.freshness === "outdated" ? "Down-weight old memory and ask for confirmation on sensitive choices." : "Memory freshness is acceptable for personalization.",
  ];
}

function calculateConfidence(memory: AIMemoryRecord): number {
  if (memory.isMissing) return 0.25;

  let score = 0.45;
  if (memory.preferredStyles.length) score += 0.1;
  if (memory.successfulCampaigns.length) score += 0.1;
  if (memory.successfulPrompts.length) score += 0.1;
  if (memory.previousConversations.length) score += 0.1;
  if (Object.keys(memory.userPatterns).length) score += 0.1;
  if (memory.freshness === "outdated") score -= 0.15;
  if (memory.conflicts.length) score -= 0.1;

  return Math.max(0.1, Math.min(0.95, Math.round(score * 100) / 100));
}
