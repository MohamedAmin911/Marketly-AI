import { logger } from "@/server/logging/logger";
import type { GrowthGenerationJob, GrowthGenerationKind } from "@/server/growth-engine/types";

type JobTask = (job: GrowthGenerationJob) => Promise<void>;

const jobs = new Map<string, GrowthGenerationJob>();
const activeByProjectKind = new Map<string, string>();
const queue: Array<{ id: string; task: JobTask }> = [];
let isProcessing = false;

export function enqueueGrowthGenerationJob({
  kind,
  projectId,
  task,
  userId,
}: {
  kind: GrowthGenerationKind;
  projectId: string;
  task: JobTask;
  userId: string;
}): { duplicate: boolean; job: GrowthGenerationJob } {
  const activeKey = keyFor(projectId, kind);
  const existingJobId = activeByProjectKind.get(activeKey);
  const existing = existingJobId ? jobs.get(existingJobId) : undefined;

  if (existing && (existing.status === "queued" || existing.status === "running")) {
    addJobLog(existing.id, "Duplicate generation request reused the active job.");
    return { duplicate: true, job: existing };
  }

  const now = new Date().toISOString();
  const job: GrowthGenerationJob = {
    completed: 0,
    createdAt: now,
    errors: [],
    id: crypto.randomUUID(),
    kind,
    logs: ["Job queued."],
    projectId,
    status: "queued",
    total: 0,
    updatedAt: now,
    userId,
  };

  jobs.set(job.id, job);
  activeByProjectKind.set(activeKey, job.id);
  queue.push({ id: job.id, task });
  logger.info("growth_engine.job.queued", { jobId: job.id, kind, projectId, userId });
  void processQueue();

  return { duplicate: false, job };
}

export function getGrowthGenerationJob(jobId: string): GrowthGenerationJob | undefined {
  const job = jobs.get(jobId);
  return job ? { ...job, errors: [...job.errors], logs: [...job.logs] } : undefined;
}

export function getLatestGrowthGenerationJob(projectId: string, kind?: GrowthGenerationKind): GrowthGenerationJob | undefined {
  const candidates = [...jobs.values()].filter((job) => job.projectId === projectId && (!kind || job.kind === kind));
  const latest = candidates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return latest ? { ...latest, errors: [...latest.errors], logs: [...latest.logs] } : undefined;
}

export function updateJobProgress(jobId: string, patch: Partial<Pick<GrowthGenerationJob, "completed" | "status" | "total">>) {
  const job = jobs.get(jobId);
  if (!job) return;

  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
}

export function addJobLog(jobId: string, message: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.logs.push(`${new Date().toISOString()} ${message}`);
  job.updatedAt = new Date().toISOString();
}

export function addJobError(jobId: string, message: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.errors.push(message);
  job.logs.push(`${new Date().toISOString()} ERROR ${message}`);
  job.updatedAt = new Date().toISOString();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (queue.length > 0) {
      const queued = queue.shift();
      if (!queued) continue;

      const job = jobs.get(queued.id);
      if (!job) continue;

      updateJobProgress(job.id, { status: "running" });
      addJobLog(job.id, "Job started.");

      try {
        await queued.task(job);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addJobError(job.id, message);
        updateJobProgress(job.id, { status: "failed" });
        logger.error("growth_engine.job.failed", { error: message, jobId: job.id, kind: job.kind, projectId: job.projectId });
      } finally {
        const current = jobs.get(job.id);
        if (current && (current.status === "queued" || current.status === "running")) {
          updateJobProgress(job.id, { status: current.errors.length ? "partial_success" : "completed" });
        }

        const finished = jobs.get(job.id);
        if (finished) {
          finished.finishedAt = new Date().toISOString();
          finished.updatedAt = finished.finishedAt;
        }

        activeByProjectKind.delete(keyFor(job.projectId, job.kind));
      }
    }
  } finally {
    isProcessing = false;
  }
}

function keyFor(projectId: string, kind: GrowthGenerationKind) {
  return `${projectId}:${kind}`;
}
