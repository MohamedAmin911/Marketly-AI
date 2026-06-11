import { Types } from "mongoose";

import { connectToDatabase, GrowthProjectModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import type { GrowthEngineRequest, GrowthProjectRecord, GrowthProjectStatus, N8nGrowthEngineResponse } from "@/server/growth-engine/types";
import type { UploadedImageKitAsset } from "@/server/services/imagekit-service";

export async function createGrowthProjectRecord({
  input,
  n8nResult,
  productImage,
  status,
  userId,
}: {
  input: GrowthEngineRequest;
  n8nResult?: N8nGrowthEngineResponse;
  productImage?: UploadedImageKitAsset | null;
  status: GrowthProjectStatus;
  userId: string;
}): Promise<GrowthProjectRecord> {
  const objectId = toObjectId(userId);
  if (!objectId) throw apiErrors.unauthorized("A valid user session is required to save growth projects.");

  await connectToDatabase();

  try {
    const project = await GrowthProjectModel.create({
      audience: input.audience,
      brandName: input.brandName,
      brief: input.brief,
      campaigns: n8nResult?.campaigns ?? [],
      competitors: n8nResult?.competitors ?? [],
      goal: input.goal,
      imageAssets: n8nResult?.imageAssets ?? [],
      industry: input.industry,
      marketingAngles: n8nResult?.marketingAngles ?? [],
      personas: n8nResult?.personas ?? [],
      productImage: productImage ? toAssetRef(productImage) : null,
      status,
      storyboards: n8nResult?.storyboards ?? [],
      strategy: n8nResult?.strategy ?? null,
      userId: objectId,
      videoAssets: n8nResult?.videoAssets ?? [],
    });

    return serializeGrowthProject(project);
  } catch (error) {
    throw apiErrors.database("Growth project could not be saved.", error);
  }
}

export async function upsertGrowthProjectShell({
  input,
  lastError,
  productImage,
  projectId,
  status = "draft",
  userId,
}: {
  input: GrowthEngineRequest;
  lastError?: string;
  productImage?: UploadedImageKitAsset | null;
  projectId: string;
  status?: GrowthProjectStatus;
  userId: string;
}): Promise<GrowthProjectRecord> {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) throw apiErrors.unauthorized("A valid user session is required to save growth projects.");

  await connectToDatabase();

  const filter = buildProjectFilter(projectId, userId);
  const setOnInsert: Record<string, unknown> = {
    campaigns: [],
    competitors: [],
    imageAssets: [],
    marketingAngles: [],
    personas: [],
    storyboards: [],
    strategy: null,
    userId: userObjectId,
    videoAssets: [],
  };

  if (Types.ObjectId.isValid(projectId)) {
    setOnInsert._id = new Types.ObjectId(projectId);
  } else {
    setOnInsert.externalProjectId = projectId;
  }

  const project = await GrowthProjectModel.findOneAndUpdate(
    filter,
    {
      $set: {
        audience: input.audience,
        brandName: input.brandName,
        brief: input.brief,
        goal: input.goal,
        industry: input.industry,
        lastError,
        productImage: productImage ? toAssetRef(productImage) : undefined,
      },
      $setOnInsert: {
        ...setOnInsert,
        status,
      },
    },
    { new: true, upsert: true },
  ).lean();

  return serializeGrowthProject(project);
}

export async function getGrowthProjectForUser(projectId: string, userId: string): Promise<GrowthProjectRecord> {
  await connectToDatabase();

  console.log("[DEBUG getGrowthProjectForUser] called with projectId=", projectId, "userId=", userId);

  // Strategy 1: Find directly by the projectId field (set by n8n workflow)
  if (projectId && projectId !== "latest") {
    const byProjectId = await GrowthProjectModel.findOne({
      $or: [
        { projectId },
        { externalProjectId: projectId },
        ...(Types.ObjectId.isValid(projectId) ? [{ _id: new Types.ObjectId(projectId) }] : []),
      ],
    }).sort({ _id: -1 }).lean();

    console.log("[DEBUG] Strategy 1 result:", byProjectId ? `found _id=${String(byProjectId._id)} campaigns=${Array.isArray((byProjectId as Record<string,unknown>).campaigns) ? ((byProjectId as Record<string,unknown>).campaigns as unknown[]).length : "N/A"}` : "NOT FOUND");

    if (byProjectId) return serializeGrowthProject(byProjectId);
  }

  // Strategy 2: Find by userId with campaign data
  const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
  const userFilter = userObjectId
    ? { userId: { $in: [userObjectId, userId] } }
    : { userId };

  // Count all docs for this user to understand what's in DB
  const allDocs = await GrowthProjectModel.find(userFilter).select("_id projectId externalProjectId campaigns status userId").lean();
  console.log("[DEBUG] All user docs count:", allDocs.length, "docs:", allDocs.map((d: Record<string, unknown>) => ({
    _id: String(d._id),
    projectId: d.projectId,
    externalProjectId: d.externalProjectId,
    campaignCount: Array.isArray(d.campaigns) ? (d.campaigns as unknown[]).length : 0,
    status: d.status,
    userId: String(d.userId),
  })));

  const projectWithData = await GrowthProjectModel.findOne({
    ...userFilter,
    $or: [
      { "campaigns.0": { $exists: true } },
      { "storyboards.0": { $exists: true } },
    ],
  }).sort({ _id: -1 }).lean();

  console.log("[DEBUG] Strategy 2 result:", projectWithData ? `found _id=${String(projectWithData._id)}` : "NOT FOUND");

  if (projectWithData) return serializeGrowthProject(projectWithData);

  // Strategy 3: Fallback to most recent document for user
  const latest = await GrowthProjectModel.findOne(userFilter).sort({ _id: -1 }).lean();
  console.log("[DEBUG] Strategy 3 (fallback) result:", latest ? `found _id=${String(latest._id)}` : "NOT FOUND");
  if (latest) return serializeGrowthProject(latest);

  throw apiErrors.notFound("Growth project was not found.");
}


export async function acquireGrowthProjectLock({
  jobId,
  kind,
  projectId,
  ttlMs,
  userId,
}: {
  jobId: string;
  kind: string;
  projectId: string;
  ttlMs: number;
  userId: string;
}): Promise<boolean> {
  const projectObjectId = toObjectId(projectId);
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return false;

  await connectToDatabase();
  const now = new Date();
  const locked = await GrowthProjectModel.findOneAndUpdate(
    {
      ...buildProjectFilter(projectId, userId),
      $or: [
        { processingLock: null },
        { processingLock: { $exists: false } },
        { "processingLock.expiresAt": { $lte: now.toISOString() } },
      ],
    },
    {
      $set: {
        processingLock: {
          expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
          jobId,
          kind,
          lockedAt: now.toISOString(),
        },
      },
    },
    { new: true },
  ).lean();

  return Boolean(locked);
}

export async function releaseGrowthProjectLock(projectId: string, jobId: string) {
  await connectToDatabase();
  await GrowthProjectModel.updateOne(
    {
      ...projectIdentityFilter(projectId),
      "processingLock.jobId": jobId,
    },
    { $set: { processingLock: null } },
  );
}

export async function updateGrowthProjectGeneration({
  appendJob,
  imageAssets,
  lastError,
  projectId,
  status,
  userId,
  videoAssets,
}: {
  appendJob?: Record<string, unknown>;
  imageAssets?: Record<string, unknown>[];
  lastError?: string;
  projectId: string;
  status?: GrowthProjectStatus;
  userId: string;
  videoAssets?: Record<string, unknown>[];
}): Promise<GrowthProjectRecord> {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) throw apiErrors.notFound("Growth project was not found.");

  const update: Record<string, unknown> = {};
  const push: Record<string, unknown> = {};

  if (status) update.status = status;
  if (lastError !== undefined) update.lastError = lastError;
  if (imageAssets?.length) push.imageAssets = { $each: imageAssets };
  if (videoAssets?.length) push.videoAssets = { $each: videoAssets };
  if (appendJob) push.generationJobs = appendJob;

  await connectToDatabase();
  const project = await GrowthProjectModel.findOneAndUpdate(
    buildProjectFilter(projectId, userId),
    {
      ...(Object.keys(update).length ? { $set: update } : {}),
      ...(Object.keys(push).length ? { $push: push } : {}),
    },
    { new: true },
  ).lean();

  if (!project) throw apiErrors.notFound("Growth project was not found.");
  return serializeGrowthProject(project);
}

export function serializeGrowthProject(project: unknown): GrowthProjectRecord {
  const record = isRecord(project) ? project : {};

  // Debug: log ALL top-level keys so we can find the strategy
  const keys = Object.keys(record);
  console.log("[DEBUG keys in serializeGrowthProject]", keys.join(", "));
  
  return {
    audience: stringValue(record.audience),
    brandName: stringValue(record.brandName),
    brief: stringValue(record.brief),
    campaigns: arrayOfRecords(record.campaigns),
    competitors: arrayOfRecords(record.competitors),
    createdAt: toIso(record.createdAt),
    goal: stringValue(record.goal),
    id: stringValue(record.projectId, stringValue(record.externalProjectId, String(record._id))),
    imageAssets: arrayOfRecords(record.imageAssets),
    industry: stringValue(record.industry),
    generationJobs: arrayOfRecords(record.generationJobs),
    lastError: stringValue(record.lastError) || undefined,
    marketingAngles: Array.isArray(record.marketingAngles) ? record.marketingAngles.filter(isMarketingAngle) : [],
    personas: arrayOfRecords(record.personas),
    productImage: isRecord(record.productImage) ? assetFromRecord(record.productImage) : null,
    status: isGrowthProjectStatus(record.status) ? record.status : "draft",
    storyboards: Array.isArray(record.storyboards)
      ? record.storyboards.filter((item) => Array.isArray(item) || isRecord(item))
      : [],
    strategy: Array.isArray(record.strategy)
      ? record.strategy
      : isRecord(record.strategy) || typeof record.strategy === "string"
        ? record.strategy
        : null,
    updatedAt: toIso(record.updatedAt),
    userId: String(record.userId),
    videoAssets: arrayOfRecords(record.videoAssets),
  };
}

function toAssetRef(asset: UploadedImageKitAsset) {
  return {
    alt: asset.alt,
    fileId: asset.fileId,
    height: asset.height,
    metadata: asset.metadata,
    mimeType: asset.mimeType,
    storageKey: asset.storageKey,
    thumbnailUrl: asset.thumbnailUrl,
    url: asset.url,
    width: asset.width,
  };
}

function assetFromRecord(asset: Record<string, unknown>) {
  return {
    alt: stringValue(asset.alt),
    fileId: stringValue(asset.fileId),
    height: numberValue(asset.height),
    metadata: isRecord(asset.metadata) ? asset.metadata : {},
    mimeType: stringValue(asset.mimeType),
    provider: stringValue(asset.provider),
    size: numberValue(asset.size),
    storageKey: stringValue(asset.storageKey),
    thumbnailUrl: stringValue(asset.thumbnailUrl),
    url: stringValue(asset.url),
    width: numberValue(asset.width),
  };
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isMarketingAngle(value: unknown): value is Record<string, unknown> | string {
  return typeof value === "string" || isRecord(value);
}

function isGrowthProjectStatus(value: unknown): value is GrowthProjectStatus {
  return (
    value === "draft" ||
    value === "strategy_ready" ||
    value === "campaigns_ready" ||
    value === "storyboards_ready" ||
    value === "images_generating" ||
    value === "images_ready" ||
    value === "videos_generating" ||
    value === "videos_ready" ||
    value === "completed" ||
    value === "failed"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function buildProjectFilter(projectId: string, userId: string) {
  const userObjectId = toObjectId(userId);
  return {
    ...projectIdentityFilter(projectId),
    userId: userObjectId,
  };
}

function projectIdentityFilter(projectId: string) {
  return Types.ObjectId.isValid(projectId)
    ? { _id: new Types.ObjectId(projectId) }
    : { $or: [{ projectId }, { externalProjectId: projectId }] };
}

function toObjectId(value: string) {
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  if (process.env.NODE_ENV !== "production") return new Types.ObjectId("000000000000000000000001");
  return null;
}
