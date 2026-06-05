import type { AIMessage, PromptTemplateName, WorkflowContext, WorkflowInput } from "@/server/ai/types";
import { getPromptTemplate } from "@/server/ai/prompts/templates";

export function buildBasePrompt(input: WorkflowInput, context: WorkflowContext, templateName: PromptTemplateName): AIMessage[] {
  const template = getPromptTemplate(templateName);

  return [
    {
      role: "system",
      content: [
        "You are Marketly AI, a production-grade AI marketing operator.",
        "Return only valid JSON that matches the requested schema.",
        "Never invent metrics, URLs, brands, or unsupported facts.",
        "If information is missing, use conservative assumptions and flag them in recommendations.",
        "Avoid repetitive outputs and keep every item meaningfully distinct.",
        "Respect forbidden words and brand guidelines.",
        template.system,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Workflow: ${input.workflow}`,
        `Brand: ${context.brand.name}`,
        `Tone: ${context.brand.tone ?? "balanced"}`,
        `Voice: ${context.brand.voice ?? "clear and strategic"}`,
        `Visual style: ${context.brand.visualStyle ?? "premium SaaS"}`,
        `Forbidden words: ${context.brand.forbiddenWords.join(", ") || "none"}`,
        `Preferred CTAs: ${context.brand.preferredCTAs.join(", ") || "none"}`,
        `Memory preferred styles: ${context.memory.preferredStyles.join(", ") || "none"}`,
        `Successful prompts: ${context.memory.successfulPrompts.slice(0, 5).join(" | ") || "none"}`,
        `Successful campaigns: ${context.memory.successfulCampaigns.slice(0, 5).join(" | ") || "none"}`,
        `Memory context: ${context.memory.injection || "none"}`,
        `Template instruction: ${template.userInstruction}`,
        `User prompt: ${input.prompt}`,
        `Additional context: ${JSON.stringify(input.context ?? {})}`,
      ].join("\n"),
    },
  ];
}

export function appendJsonContract(messages: AIMessage[], contract: string): AIMessage[] {
  return [
    ...messages,
    {
      role: "user",
      content: `JSON contract:\n${contract}`,
    },
  ];
}
