import { z } from "zod";

import { env } from "@/server/config/env";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const CAMPAIGN_TEXT_MODEL = "openrouter/owl-alpha";

type OpenRouterMessage = {
  content: string;
  role: "system" | "user";
};

type OpenRouterOptions<TSchema extends z.ZodType> = {
  maxTokens?: number;
  messages: OpenRouterMessage[];
  model?: string;
  schema: TSchema;
  temperature?: number;
};

export async function generateOpenRouterJson<TSchema extends z.ZodType>({
  maxTokens = 3500,
  messages,
  model = CAMPAIGN_TEXT_MODEL,
  schema,
  temperature = 0.72,
}: OpenRouterOptions<TSchema>): Promise<{ data: z.infer<TSchema>; modelUsed: string; rawContent: string }> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const response = await fetch(OPENROUTER_URL, {
    body: JSON.stringify({
      max_tokens: maxTokens,
      messages,
      model,
      response_format: { type: "json_object" },
      temperature,
    }),
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://marketly.ai",
      "X-Title": "Marketly AI",
    },
    method: "POST",
  });

  const payload = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: unknown } }>; error?: { message?: string } } | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `OpenRouter generation failed with status ${response.status}.`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty campaign response.");
  }

  const parsed = parseStrictJson(content);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
    throw new Error(`OpenRouter returned malformed campaign JSON: ${issues}`);
  }

  return {
    data: result.data,
    modelUsed: model,
    rawContent: content,
  };
}

function parseStrictJson(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenRouter response did not contain valid JSON.");
    return JSON.parse(match[0]);
  }
}
