import { apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";
import type { AICapability, AIProviderName, WorkflowInput, WorkflowResult } from "@/server/ai/types";
import { buildWorkflowContext } from "@/server/ai/context/context-builder";
import { recordWorkflowMemory } from "@/server/ai/memory/update-service";
import { evaluateOutputQuality, assertPromptIsValid } from "@/server/ai/parsers/quality";
import { getFallbackProviders } from "@/server/ai/providers/registry";
import { runWithAiConcurrency } from "@/server/ai/pipelines/concurrency";
import { runWithRetryAndFallback } from "@/server/ai/pipelines/retry";
import { completeGeneration, failGeneration, startGeneration } from "@/server/ai/tracking/generation-tracker";
import { trackUsage } from "@/server/ai/tracking/usage-tracker";
import { getWorkflow } from "@/server/ai/workflows/definitions";
import { logger } from "@/server/logging/logger";

export async function runAIWorkflow(input: WorkflowInput, auth: AuthContext, preferredProvider: AIProviderName): Promise<WorkflowResult> {
  const workflow = getWorkflow(input.workflow);
  const context = await buildWorkflowContext(auth, input.brandId);
  const generation = startGeneration({
    tenantId: auth.user.tenantId,
    userId: auth.user.sub,
    workflow: input.workflow,
  });

  try {
    assertPromptIsValid(input.prompt);

    const messages = workflow.buildPrompt(input, context);
    const response = await runWithAiConcurrency(() =>
      runWithRetryAndFallback(
        getFallbackProviders(preferredProvider),
        {
          capability: resolveCapability(input),
          imageUrl: typeof input.context?.imageUrl === "string" ? input.context.imageUrl : undefined,
          maxTokens: workflow.maxTokens,
          messages,
          model: input.model,
          responseFormat: "json",
          temperature: input.temperature ?? workflow.temperature,
        },
        { attempts: 2, timeoutMs: 18_000 },
      ),
    );
    const parsed = workflow.parse(response.text);
    const quality = evaluateOutputQuality(parsed.data, context.brand);

    if (!quality.brandingConsistent) {
      throw apiErrors.aiProvider("AI response violated brand safety rules.", quality.warnings);
    }

    completeGeneration(generation.generationId, response.provider, response.usage);
    trackUsage({
      generationId: generation.generationId,
      provider: response.provider,
      tenantId: auth.user.tenantId,
      usage: response.usage,
      userId: auth.user.sub,
      workflow: input.workflow,
    });

    recordWorkflowMemory({
      brandId: input.brandId,
      output: parsed.data,
      prompt: input.prompt,
      userId: auth.user.sub,
      workflow: input.workflow,
    }).catch((memoryError) => {
      logger.warn("ai.memory.update_failed", {
        error: memoryError instanceof Error ? memoryError.message : String(memoryError),
        userId: auth.user.sub,
        workflow: input.workflow,
      });
    });

    return {
      generationId: generation.generationId,
      output: parsed.data,
      provider: response.provider,
      quality,
      usage: response.usage,
      workflow: input.workflow,
    };
  } catch (error) {
    failGeneration(generation.generationId, error);
    throw error;
  }
}

function resolveCapability(input: WorkflowInput): AICapability {
  if (input.context?.capability === "text" || input.context?.capability === "image" || input.context?.capability === "video") {
    return input.context.capability;
  }

  if (input.workflow === "video-generation") return "video";
  if (input.workflow === "creator-studio") return "image";
  return "text";
}


