import { logger } from "@/server/logging/logger";
import type { AIProviderName, AIUsage, AIWorkflowName } from "@/server/ai/types";

type UsageLedgerEntry = {
  generationId: string;
  provider: AIProviderName;
  recordedAt: Date;
  tenantId: string;
  usage: AIUsage;
  userId: string;
  workflow: AIWorkflowName;
};

const usageLedger: UsageLedgerEntry[] = [];

export function trackUsage(entry: Omit<UsageLedgerEntry, "recordedAt">) {
  usageLedger.push({ ...entry, recordedAt: new Date() });
  logger.info("ai.usage.recorded", {
    generationId: entry.generationId,
    provider: entry.provider,
    totalTokens: entry.usage.totalTokens,
    workflow: entry.workflow,
  });
}

export function getUsageLedger() {
  return [...usageLedger];
}
