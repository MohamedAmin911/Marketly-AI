import type { AIModelRequest, AIModelResponse } from "@/server/ai/types";
import { createUsage, stringifyMessages, type AIProvider } from "@/server/ai/providers/base-provider";

export class MockProvider implements AIProvider {
  readonly name = "mock" as const;

  isAvailable(): boolean {
    return true;
  }

  async generate(request: AIModelRequest): Promise<AIModelResponse> {
    const prompt = stringifyMessages(request);
    const text = JSON.stringify(prompt.includes("Workflow: ai-assistant") ? {
      actions: [
        "Audit the latest campaign performance signals",
        "Prioritize the highest-confidence budget or creative adjustment",
        "Store the winning recommendation in AI memory",
      ],
      answer: "Based on the current Marketly AI context, prioritize the clearest performance signal, explain the evidence, and turn it into one measurable next action before scaling.",
      citationsNeeded: false,
      followUps: [
        "Which campaign should I audit first?",
        "Do you want this turned into a 30-day execution plan?",
        "Should I generate ad concepts from this recommendation?",
      ],
    } : {
      items: [
        {
          caption: "A precise, premium Marketly AI concept shaped for conversion.",
          cta: "Launch the campaign",
          hook: "Turn brand intent into high-performing creative.",
          rationale: "Balances brand consistency, clear audience fit, and platform-ready execution.",
          title: "Marketly AI Campaign Concept",
        },
      ],
      recommendations: ["Keep the visual language consistent across paid and organic channels.", "Test two CTA variants before scaling spend."],
      summary: "Generated a production-safe mock response for local development.",
    });

    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      finishReason: "stop",
      model: request.model ?? "marketly-mock-v1",
      provider: this.name,
      raw: { mock: true },
      text,
      usage: createUsage(prompt, text),
    };
  }
}
