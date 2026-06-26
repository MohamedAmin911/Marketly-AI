import { apiErrors } from "@/server/errors/api-error";
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
            projectId: requestId,
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

      const textPayload = await response.text().catch(() => "");
      
      // FIX: Clean up invalid prefixes like '=' that n8n might accidentally output due to template typos
      let cleanTextPayload = textPayload.trim();
      if (cleanTextPayload.startsWith("=")) {
        cleanTextPayload = cleanTextPayload.substring(1).trim();
      }

      let payload: unknown = null;
      try {
        payload = JSON.parse(cleanTextPayload);
      } catch {
        payload = cleanTextPayload;
      }
      if (!response.ok) {
        console.error("WEBHOOK FAILED HTTP", response.status, response.statusText, payload);
        throw apiErrors.aiProvider("Growth Engine webhook failed.", {
          status: response.status,
          statusText: response.statusText,
          payload,
        });
      }

      const extractedProject = extractPayload(payload);

      const { GrowthProjectModel, connectToDatabase } = await import("@/server/database");
      const { Types } = await import("mongoose");
      
      await connectToDatabase();
      console.log("================ N8N WEBHOOK RESPONSE ================");
      console.log("Raw Response Text Snippet:", textPayload.slice(0, 1000));
      console.log("Extracted Project keys:", extractedProject ? Object.keys(extractedProject) : "null");
      console.log("Has Strategy:", extractedProject && "strategy" in extractedProject);
      console.log("======================================================");

      if (extractedProject && typeof extractedProject === "object" && ("strategy" in extractedProject || "campaigns" in extractedProject || "storyboards" in extractedProject)) {
        // Strip _id and id if they were returned by n8n
        const { _id, id, ...updateData } = extractedProject as Record<string, unknown>;
        
        console.log("Updating Mongo document for requestId:", requestId);
        const updatedProject = await GrowthProjectModel.findOneAndUpdate(
          { externalProjectId: requestId, userId },
          {
            $set: {
              ...updateData,
              status: "completed",
            }
          },
          { new: true, upsert: true }
        );
        console.log("MongoDB update success, document ID:", updatedProject._id);
        
        return {
          projectId: String(updatedProject._id),
          success: true,
        };
      }
      
      console.log("Failed to extract valid project from n8n response, returning latest project.");
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

function extractPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const extracted = extractPayload(item);
      if (extracted) return extracted;
    }
    return null;
  }

  const obj = payload as Record<string, unknown>;
  
  // If the current object has the target keys, return it
  if ("strategy" in obj || "campaigns" in obj || "storyboards" in obj) {
    return obj;
  }

  // Otherwise, recursively search its values
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const extracted = extractPayload(value);
      if (extracted) return extracted;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
