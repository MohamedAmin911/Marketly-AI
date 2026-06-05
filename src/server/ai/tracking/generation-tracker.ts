import { logger } from "@/server/logging/logger";
import type { AIProviderName, AIUsage, AIWorkflowName } from "@/server/ai/types";

export type GenerationRecord = {
  completedAt?: Date;
  generationId: string;
  provider?: AIProviderName;
  startedAt: Date;
  status: "started" | "completed" | "failed";
  tenantId: string;
  usage?: AIUsage;
  userId: string;
  workflow: AIWorkflowName;
};

const generations = new Map<string, GenerationRecord>();

export function startGeneration(input: Omit<GenerationRecord, "generationId" | "startedAt" | "status">): GenerationRecord {
  const record: GenerationRecord = {
    ...input,
    generationId: crypto.randomUUID(),
    startedAt: new Date(),
    status: "started",
  };

  generations.set(record.generationId, record);
  logger.info("ai.generation.started", { generationId: record.generationId, workflow: record.workflow });

  return record;
}

export function completeGeneration(generationId: string, provider: AIProviderName, usage: AIUsage) {
  const record = generations.get(generationId);
  if (!record) return;

  record.completedAt = new Date();
  record.provider = provider;
  record.status = "completed";
  record.usage = usage;
  logger.info("ai.generation.completed", { generationId, provider, totalTokens: usage.totalTokens });
}

export function failGeneration(generationId: string, error: unknown) {
  const record = generations.get(generationId);
  if (!record) return;

  record.completedAt = new Date();
  record.status = "failed";
  logger.error("ai.generation.failed", { error: error instanceof Error ? error.message : String(error), generationId });
}
