import { z } from "zod";

import { getAIProvider } from "@/lib/services/ai-factory";

type MistralResult<T> = {
  data: T;
  modelUsed: string;
};

export async function generateWithMistral<T>(prompt: string, schema: z.ZodType<T>, fallback: T): Promise<MistralResult<T>> {
  try {
    const result = await getAIProvider().generateChatCompletion({
      messages: [{ content: prompt, role: "user" }],
      maxTokens: 2200,
      temperature: 0.62,
      responseFormat: "text",
    });

    const parsed = parseJson(result.content, schema);

    return {
      data: parsed,
      modelUsed: result.model,
    };
  } catch {
    return {
      data: fallback,
      modelUsed: "deterministic-fallback",
    };
  }
}

function parseJson<T>(text: string, schema: z.ZodType<T>): T {
  const extracted = extractJson(text);
  const parsed = JSON.parse(extracted);
  const result = schema.safeParse(parsed);

  if (!result.success) throw new Error("OpenAI output did not match campaign schema.");
  return result.data;
}

function extractJson(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  throw new Error("OpenAI output did not contain JSON.");
}
