import { getLatestGrowthGenerationJob, getGrowthGenerationJob } from "@/server/growth-engine/job-queue";
import { getGrowthProjectForUser } from "@/server/growth-engine/repository";
import type { GrowthGenerationKind, GrowthGenerationProgressResponse } from "@/server/growth-engine/types";
import type { AuthContext } from "@/server/security/auth-guard";

export async function getGrowthGenerationProgress({
  auth,
  jobId,
  kind,
  projectId,
}: {
  auth: AuthContext;
  jobId?: string;
  kind?: GrowthGenerationKind;
  projectId: string;
}): Promise<GrowthGenerationProgressResponse> {
  const project = await getGrowthProjectForUser(projectId, auth.user.sub);
  const job = jobId ? getGrowthGenerationJob(jobId) : getLatestGrowthGenerationJob(projectId, kind);

  return { job, project };
}
