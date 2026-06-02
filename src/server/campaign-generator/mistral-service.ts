import { z } from "zod";

import { env } from "@/server/config/env";

const MISTRAL_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

type MistralResult<T> = {
  data: T;
  modelUsed: string;
};

export async function generateWithMistral<T>(prompt: string, schema: z.ZodType<T>, fallback: T): Promise<MistralResult<T>> {
  if (!env.HUGGINGFACE_API_KEY) {
    return {
      data: fallback,
      modelUsed: "deterministic-mistral-7b-fallback",
    };
  }

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${MISTRAL_MODEL}`, {
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 2200,
          return_full_text: false,
          temperature: 0.62,
        },
      }),
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Mistral 7B request failed with status ${response.status}.`);
    }

    const raw = await response.json();
    const text = Array.isArray(raw) ? raw.map((item) => item.generated_text).filter(Boolean).join("\n") : JSON.stringify(raw);
    const parsed = parseJson(text, schema);

    return {
      data: parsed,
      modelUsed: MISTRAL_MODEL,
    };
  } catch {
    return {
      data: fallback,
      modelUsed: "deterministic-mistral-7b-fallback",
    };
  }
}

function parseJson<T>(text: string, schema: z.ZodType<T>): T {
  const extracted = extractJson(text);
  const parsed = JSON.parse(extracted);
  const result = schema.safeParse(parsed);

  if (!result.success) throw new Error("Mistral output did not match campaign schema.");
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

  throw new Error("Mistral output did not contain JSON.");
}
