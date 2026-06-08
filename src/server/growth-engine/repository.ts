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

export async function getGrowthProjectForUser(projectId: string, userId: string): Promise<GrowthProjectRecord> {
  const projectObjectId = toObjectId(projectId);
  const userObjectId = toObjectId(userId);
  if (!projectObjectId || !userObjectId) throw apiErrors.notFound("Growth project was not found.");

  await connectToDatabase();
  const project = await GrowthProjectModel.findOne({ _id: projectObjectId, userId: userObjectId }).lean();
  if (!project) throw apiErrors.notFound("Growth project was not found.");

  return serializeGrowthProject(project);
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
  if (!projectObjectId || !userObjectId) return false;

  await connectToDatabase();
  const now = new Date();
  const locked = await GrowthProjectModel.findOneAndUpdate(
    {
      _id: projectObjectId,
      userId: userObjectId,
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
  const projectObjectId = toObjectId(projectId);
  if (!projectObjectId) return;

  await connectToDatabase();
  await GrowthProjectModel.updateOne(
    {
      _id: projectObjectId,
      "processingLock.jobId": jobId,
    },
    { $set: { processingLock: null } },
  );
}

export async function updateGrowthProjectGeneration({
  appendJob,
  imageAssets,
  projectId,
  status,
  userId,
  videoAssets,
}: {
  appendJob?: Record<string, unknown>;
  imageAssets?: Record<string, unknown>[];
  projectId: string;
  status?: GrowthProjectStatus;
  userId: string;
  videoAssets?: Record<string, unknown>[];
}): Promise<GrowthProjectRecord> {
  const projectObjectId = toObjectId(projectId);
  const userObjectId = toObjectId(userId);
  if (!projectObjectId || !userObjectId) throw apiErrors.notFound("Growth project was not found.");

  const update: Record<string, unknown> = {};
  const push: Record<string, unknown> = {};

  if (status) update.status = status;
  if (imageAssets?.length) push.imageAssets = { $each: imageAssets };
  if (videoAssets?.length) push.videoAssets = { $each: videoAssets };
  if (appendJob) push.generationJobs = appendJob;

  await connectToDatabase();
  const project = await GrowthProjectModel.findOneAndUpdate(
    { _id: projectObjectId, userId: userObjectId },
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

  return {
    audience: stringValue(record.audience),
    brandName: stringValue(record.brandName),
    brief: stringValue(record.brief),
    campaigns: arrayOfRecords(record.campaigns),
    competitors: arrayOfRecords(record.competitors),
    createdAt: toIso(record.createdAt),
    goal: stringValue(record.goal),
    id: String(record._id),
    imageAssets: arrayOfRecords(record.imageAssets),
    industry: stringValue(record.industry),
    generationJobs: arrayOfRecords(record.generationJobs),
    marketingAngles: Array.isArray(record.marketingAngles) ? record.marketingAngles.filter(isMarketingAngle) : [],
    personas: arrayOfRecords(record.personas),
    productImage: isRecord(record.productImage) ? assetFromRecord(record.productImage) : null,
    status: isGrowthProjectStatus(record.status) ? record.status : "draft",
    storyboards: arrayOfRecords(record.storyboards),
    strategy: isRecord(record.strategy) || typeof record.strategy === "string" ? record.strategy : null,
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
    value === "images_ready" ||
    value === "videos_ready"
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

function toObjectId(value: string) {
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  if (process.env.NODE_ENV !== "production") return new Types.ObjectId("000000000000000000000001");
  return null;
}
