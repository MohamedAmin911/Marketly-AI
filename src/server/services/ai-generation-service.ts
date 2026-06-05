import { runAIWorkflow } from "@/server/ai";
import type { AIWorkflowName } from "@/server/ai/types";
import type { AuthContext } from "@/server/security/auth-guard";
import type { AiGenerationRequest } from "@/server/schemas/ai";

export async function generateAiAsset(input: AiGenerationRequest, auth: AuthContext) {
  return runAIWorkflow(
    {
      brandId: input.brandId,
      context: {
        ...input.context,
        capability: input.capability,
        imageUrl: input.imageUrl,
        task: input.task,
      },
      model: input.model,
      prompt: input.prompt,
      template: input.template,
      temperature: input.temperature,
      workflow: input.workflow ?? workflowFromMode(input.mode),
    },
    auth,
    input.provider,
  );
}

function workflowFromMode(mode: AiGenerationRequest["mode"]): AIWorkflowName {
  const map = {
    campaign: "campaign-generation",
    image: "creator-studio",
    strategy: "analytics-recommendations",
    video: "video-generation",
  } satisfies Record<AiGenerationRequest["mode"], AIWorkflowName>;

  return map[mode];
}
