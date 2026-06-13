import type {
  GrowthEngineApiResponse,
  GrowthEngineSubmitRequest,
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



export async function getGrowthProject(projectId: string): Promise<GrowthEngineApiResponse> {
  return apiJson<GrowthEngineApiResponse>(`/api/growth-engine/project/${projectId}`, {
    method: "GET",
    timeoutMs: 20_000,
  });
}


