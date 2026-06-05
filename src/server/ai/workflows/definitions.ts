import type { WorkflowDefinition, WorkflowInput } from "@/server/ai/types";
import { appendJsonContract, buildBasePrompt } from "@/server/ai/prompts/builder";
import { injectMemoryGuidance } from "@/server/ai/memory/memory-builder";
import { parseJsonResponse } from "@/server/ai/parsers/json-parser";
import {
  analyticsRecommendationSchema,
  assistantResponseSchema,
  conceptListSchema,
  storyboardSchema,
  videoPlanSchema,
  type AnalyticsRecommendationOutput,
  type AssistantOutput,
  type ConceptListOutput,
  type StoryboardOutput,
  type VideoPlanOutput,
} from "@/server/ai/workflows/schemas";

export const creatorStudioWorkflow: WorkflowDefinition<ConceptListOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      [
        ...buildBasePrompt({ ...input, template: input.template ?? "product-photography" }, context, input.template ?? "product-photography"),
        { role: "user", content: injectMemoryGuidance(context.memory) },
      ],
      '{ "summary": string, "items": [{ "title": string, "hook": string, "caption": string, "cta": string, "rationale": string }], "recommendations": string[] }',
    ),
  maxTokens: 1800,
  name: "creator-studio",
  parse: (text) => parseJsonResponse(text, conceptListSchema),
  schema: conceptListSchema,
  temperature: 0.75,
};

export const campaignGenerationWorkflow: WorkflowDefinition<ConceptListOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      buildBasePrompt({ ...input, template: input.template ?? "social-media-campaigns" }, context, input.template ?? "social-media-campaigns"),
      '{ "summary": string, "items": [{ "title": string, "hook": string, "caption": string, "cta": string, "rationale": string }], "recommendations": string[] }',
    ),
  maxTokens: 2200,
  name: "campaign-generation",
  parse: (text) => parseJsonResponse(text, conceptListSchema),
  schema: conceptListSchema,
  temperature: 0.8,
};

export const storyboardGenerationWorkflow: WorkflowDefinition<StoryboardOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      buildBasePrompt({ ...input, template: input.template ?? "cinematic-videos" }, context, input.template ?? "cinematic-videos"),
      '{ "summary": string, "scenes": [{ "title": string, "description": string, "cameraAngle": string, "imagePrompt": string, "transition": string, "duration": number }], "recommendations": string[] }',
    ),
  maxTokens: 2600,
  name: "storyboard-generation",
  parse: (text) => parseJsonResponse(text, storyboardSchema),
  schema: storyboardSchema,
  temperature: 0.7,
};

export const videoGenerationWorkflow: WorkflowDefinition<VideoPlanOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      buildBasePrompt({ ...input, template: input.template ?? "cinematic-videos" }, context, input.template ?? "cinematic-videos"),
      '{ "summary": string, "scenes": [{ "sceneImages": string[], "transition": string, "effects": string[], "voiceover"?: string }], "recommendations": string[] }',
    ),
  maxTokens: 2400,
  name: "video-generation",
  parse: (text) => parseJsonResponse(text, videoPlanSchema),
  schema: videoPlanSchema,
  temperature: 0.65,
};

export const analyticsRecommendationsWorkflow: WorkflowDefinition<AnalyticsRecommendationOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      buildBasePrompt({ ...input, template: "minimalist-branding" }, context, "minimalist-branding"),
      '{ "summary": string, "trends": string[], "recommendations": string[], "anomalies": string[] }',
    ),
  maxTokens: 1600,
  name: "analytics-recommendations",
  parse: (text) => parseJsonResponse(text, analyticsRecommendationSchema),
  schema: analyticsRecommendationSchema,
  temperature: 0.35,
};

export const aiAssistantWorkflow: WorkflowDefinition<AssistantOutput> = {
  buildPrompt: (input, context) =>
    appendJsonContract(
      buildBasePrompt({ ...input, template: input.template ?? "hooks-generation" }, context, input.template ?? "hooks-generation"),
      '{ "answer": string, "actions": string[], "followUps": string[], "citationsNeeded": boolean }',
    ),
  maxTokens: 1600,
  name: "ai-assistant",
  parse: (text) => parseJsonResponse(text, assistantResponseSchema),
  schema: assistantResponseSchema,
  temperature: 0.55,
};

export const workflows = {
  "ai-assistant": aiAssistantWorkflow,
  "analytics-recommendations": analyticsRecommendationsWorkflow,
  "campaign-generation": campaignGenerationWorkflow,
  "creator-studio": creatorStudioWorkflow,
  "storyboard-generation": storyboardGenerationWorkflow,
  "video-generation": videoGenerationWorkflow,
} satisfies Record<WorkflowInput["workflow"], WorkflowDefinition<unknown>>;

export function getWorkflow(name: WorkflowInput["workflow"]): WorkflowDefinition<unknown> {
  return workflows[name];
}
