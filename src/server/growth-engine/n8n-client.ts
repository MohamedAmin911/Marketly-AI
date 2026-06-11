import { apiErrors } from "@/server/errors/api-error";
import { n8nGrowthProjectResponseSchema } from "@/server/growth-engine/schemas";
import { retryOperation, withOperationTimeout } from "@/server/growth-engine/retry";
import type { GrowthEngineRequest, N8nGrowthProjectResponse } from "@/server/growth-engine/types";

const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook-test/growth-engine";
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_ATTEMPTS = 2;

export async function createGrowthProjectViaN8n({
  input,
  requestId,
  userId,
}: {
  input: GrowthEngineRequest;
  requestId: string;
  userId: string;
}): Promise<N8nGrowthProjectResponse> {
  const webhookUrl = process.env.N8N_GROWTH_ENGINE_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL;

  return retryOperation({
    attempts: Number(process.env.GROWTH_ENGINE_WEBHOOK_RETRY_ATTEMPTS ?? DEFAULT_ATTEMPTS),
    delayMs: 750,
    label: "growth-engine-project-webhook",
    task: async () => {
      const timeoutMs = Number(process.env.GROWTH_ENGINE_WEBHOOK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
      const response = await withOperationTimeout(
        fetch(webhookUrl, {
          body: JSON.stringify({
            audience: input.audience,
            brandName: input.brandName,
            brief: input.brief,
            goal: input.goal,
            industry: input.industry,
            userId,
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Marketly-Request-Id": requestId,
          },
          method: "POST",
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

      // We assume the n8n webhook succeeded if it returns a 2xx status.
      // Since the user's workflow saves to MongoDB directly and doesn't return the projectId,
      // we query MongoDB for the most recently created project for this user.
      const { GrowthProjectModel } = await import("@/server/database");
      const { Types } = await import("mongoose");
      const latestProject = await GrowthProjectModel.findOne({ 
        userId: { $in: [userId, Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId] } 
      })
        .sort({ _id: -1 })
        .lean();

      return {
        projectId: String(latestProject?.projectId || latestProject?._id || ""),
        success: true,
      };
    },
  });
}

function extractPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return extractPayload(payload[0]);
  if (!isRecord(payload)) return payload;
  if (isRecord(payload.json)) return payload.json;
  if (isRecord(payload.data)) return payload.data;
  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
