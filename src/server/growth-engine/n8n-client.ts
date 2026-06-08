import { apiErrors } from "@/server/errors/api-error";
import { n8nGrowthEngineResponseSchema } from "@/server/growth-engine/schemas";
import { retryOperation, withOperationTimeout } from "@/server/growth-engine/retry";
import type { GrowthEngineRequest, N8nGrowthEngineResponse } from "@/server/growth-engine/types";
import type { UploadedImageKitAsset } from "@/server/services/imagekit-service";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_ATTEMPTS = 2;

export async function callGrowthEngineWebhook({
  input,
  productImage,
  requestId,
  userId,
}: {
  input: GrowthEngineRequest;
  productImage: UploadedImageKitAsset;
  requestId: string;
  userId: string;
}): Promise<N8nGrowthEngineResponse> {
  const webhookUrl = process.env.N8N_GROWTH_ENGINE_WEBHOOK_URL?.trim();
  if (!webhookUrl) throw apiErrors.aiProvider("N8N_GROWTH_ENGINE_WEBHOOK_URL is not configured.");

  return retryOperation({
    attempts: Number(process.env.GROWTH_ENGINE_WEBHOOK_RETRY_ATTEMPTS ?? DEFAULT_ATTEMPTS),
    delayMs: 750,
    label: "growth-engine-webhook",
    task: async () => {
      const controller = new AbortController();
      const timeoutMs = Number(process.env.GROWTH_ENGINE_WEBHOOK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await withOperationTimeout(
          fetch(webhookUrl, {
            body: JSON.stringify({
              audience: input.audience,
              brandName: input.brandName,
              brief: input.brief,
              goal: input.goal,
              industry: input.industry,
              productImage,
              requestId,
              userId,
            }),
            headers: {
              "Content-Type": "application/json",
              "X-Marketly-Request-Id": requestId,
            },
            method: "POST",
            signal: controller.signal,
          }),
          timeoutMs,
          "Growth Engine webhook timed out.",
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw apiErrors.aiProvider("Growth Engine webhook failed.", {
            status: response.status,
            statusText: response.statusText,
          });
        }

        return parseWebhookResponse(payload);
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}

function parseWebhookResponse(payload: unknown): N8nGrowthEngineResponse {
  const extracted = extractN8nPayload(payload);
  const parsed = n8nGrowthEngineResponseSchema.safeParse(extracted);

  if (!parsed.success) {
    throw apiErrors.aiProvider("Growth Engine webhook returned an invalid response.", parsed.error.flatten());
  }

  return parsed.data;
}

function extractN8nPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return extractN8nPayload(payload[0]);
  }

  if (!isRecord(payload)) return payload;

  if (isRecord(payload.json)) return payload.json;
  if (isRecord(payload.project)) return payload.project;
  if (isRecord(payload.data)) return payload.data;

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
