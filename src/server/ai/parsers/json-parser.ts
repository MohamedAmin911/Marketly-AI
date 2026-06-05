import type { z } from "zod";

import { apiErrors } from "@/server/errors/api-error";
import type { ParsedAIResult } from "@/server/ai/types";

export function parseJsonResponse<T>(text: string, schema: z.ZodType<T>): ParsedAIResult<T> {
  const extracted = extractJson(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(extracted.value);
  } catch {
    throw apiErrors.aiProvider("AI response was malformed JSON.");
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw apiErrors.aiProvider("AI response did not match the expected schema.", result.error.flatten());
  }

  return {
    data: result.data,
    repaired: extracted.repaired,
  };
}

function extractJson(text: string): { repaired: boolean; value: string } {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return { repaired: false, value: trimmed };
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return { repaired: true, value: fenced[1].trim() };

  const firstObject = trimmed.indexOf("{");
  const lastObject = trimmed.lastIndexOf("}");

  if (firstObject >= 0 && lastObject > firstObject) {
    return { repaired: true, value: trimmed.slice(firstObject, lastObject + 1) };
  }

  throw apiErrors.aiProvider("AI response did not contain JSON.");
}
