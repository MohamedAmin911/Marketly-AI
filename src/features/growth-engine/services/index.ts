import type {
  GrowthEngineApiResponse,
  GrowthEngineSubmitRequest,
  GrowthGenerationJobResponse,
  GrowthGenerationKind,
  GrowthGenerationProgressResponse,
} from "@/features/growth-engine/types";
import { apiJson } from "@/lib/api/client";

export async function submitGrowthEngineWorkflow(input: GrowthEngineSubmitRequest): Promise<GrowthEngineApiResponse> {
  const formData = new FormData();
  formData.set("audience", input.audience);
  formData.set("brandName", input.brandName);
  formData.set("brief", input.brief);
  formData.set("goal", input.goal);
  formData.set("industry", input.industry);
  if (input.productImage) formData.set("productImage", input.productImage);

  return apiJson<GrowthEngineApiResponse>("/api/growth-engine", {
    body: formData,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    method: "POST",
    timeoutMs: 360_000,
  });
}

export async function generateGrowthVisualAssets(projectId: string): Promise<GrowthGenerationJobResponse> {
  return apiJson<GrowthGenerationJobResponse>("/api/growth-engine/generate-images", {
    body: { projectId },
    headers: { "Idempotency-Key": crypto.randomUUID() },
    method: "POST",
    timeoutMs: 30_000,
  });
}

export async function generateGrowthVideos(projectId: string): Promise<GrowthGenerationJobResponse> {
  return apiJson<GrowthGenerationJobResponse>("/api/growth-engine/generate-videos", {
    body: { projectId },
    headers: { "Idempotency-Key": crypto.randomUUID() },
    method: "POST",
    timeoutMs: 30_000,
  });
}

export async function getGrowthProject(projectId: string): Promise<GrowthEngineApiResponse> {
  return apiJson<GrowthEngineApiResponse>(`/api/growth-engine/project/${projectId}`, {
    method: "GET",
    timeoutMs: 20_000,
  });
}

export async function getGrowthGenerationProgress({
  jobId,
  kind,
  projectId,
}: {
  jobId?: string;
  kind?: GrowthGenerationKind;
  projectId: string;
}): Promise<GrowthGenerationProgressResponse> {
  const params = new URLSearchParams();
  if (jobId) params.set("jobId", jobId);
  if (kind) params.set("kind", kind);

  const query = params.toString();
  return apiJson<GrowthGenerationProgressResponse>(`/api/growth-engine/${projectId}/progress${query ? `?${query}` : ""}`, {
    method: "GET",
    timeoutMs: 20_000,
  });
}
